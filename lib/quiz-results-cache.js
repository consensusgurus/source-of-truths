// In-process cache for the quiz_results table (egress fix, 2026-07-12).
//
// WHY: quiz_results is read in full by many hot routes (me, player, xp,
// xp-categories, share-card, stats, totals, recent, board). Before this cache
// every request shipped the ENTIRE table out of Supabase, which is billed as
// uncached DB egress and blew past the free tier (14.6GB / 5GB). The table only
// ever GROWS in normal operation (one insert per completed game), so a warm
// lambda can hold the rows and fetch only the delta.
//
// HOW: on first use (cold start) the table is loaded in full. On every later
// use we run two cheap queries instead of one huge one:
//   1. an exact-count HEAD request (no row data leaves the DB), and
//   2. a delta select of rows with id > the largest id we have.
// If the count disagrees with cached + delta, rows were deleted (admin
// quiz-reset) and we reload in full. A time-based full reload (FULL_MS) bounds
// staleness from in-place UPDATEs (admin quiz-user-rename), which change no
// row count. A short burst TTL coalesces same-instance request spikes.
//
// Rows are returned in ascending id order, the same order the old
// loadQuizResults produced. Callers MUST NOT mutate the returned array or its
// rows (all current consumers use .slice()/.filter()/.map() copies).

import { fetchAllRows } from './fetch-all';
import { readStoredSnapshot, readStoredSnapshotMeta, writeStoredSnapshot } from './results-snapshot-store';

// Superset of the columns every consumer needs (board also reads time_elapsed,
// is_mobile and guesses_used; stats/totals read time_elapsed; the Pricer board
// reads price_tiebreak).
const COLS_FULL = 'id, user_id, username, quiz_id, score, total, correct_count, anon_id, created_at, time_elapsed, is_mobile, guesses_used, abandoned, price_tiebreak, progress';
// Progressive fallbacks for a DB that predates migrations 51 / 50 / 37 / 33 / 25
// / 24, in the same spirit as the old per-route fallbacks: never let a deploy
// depend on migration timing. Newest drops FIRST, so `progress` (migration 51)
// goes, then `price_tiebreak` (50), then `abandoned` (37). Every tier below the
// first must drop `progress` too, or a database missing an OLDER column still
// asks for the newest one and the whole tier fails on the same error.
//
// NOTE on the shared snapshot (migration 44): `cols_idx` is the INDEX into this
// array, not a fingerprint of the column string, so a snapshot written before
// this column was added still matches index 0 and will be served with
// price_tiebreak absent. That is deliberately harmless rather than wrong: a row
// with no guess sorts LAST on the price term (see priceOf in lib/quiz-anon), so
// a Pricer board simply falls back to its old time tiebreak until the snapshot
// refreshes on its normal cadence, at which point the tiebreak starts working.
const COL_TIERS = [
  COLS_FULL,
  COLS_FULL.replace(', progress', ''),
  COLS_FULL.replace(', progress', '').replace(', price_tiebreak', ''),
  COLS_FULL.replace(', progress', '').replace(', price_tiebreak', '').replace(', abandoned', ''),
  COLS_FULL.replace(', progress', '').replace(', price_tiebreak', '').replace(', abandoned', '').replace(', guesses_used', ''),
  COLS_FULL.replace(', progress', '').replace(', price_tiebreak', '').replace(', abandoned', '').replace(', guesses_used', '').replace(', is_mobile', ''),
  COLS_FULL.replace(', progress', '').replace(', price_tiebreak', '').replace(', abandoned', '').replace(', guesses_used', '').replace(', is_mobile', '').replace(', correct_count', ''),
];

const BURST_TTL_MS = 5 * 1000;        // serve as-is within a burst
const FULL_MS = 6 * 60 * 60 * 1000;   // full reload cadence (catches renames)

// Shared with lib/daily-results-cache, which runs the same column-tier
// fallback against a day-scoped slice of the same table.
export const QUIZ_RESULT_COL_TIERS = COL_TIERS;

export function isMissingColumn(err) {
  if (!err) return false;
  return err.code === '42703' || err.code === 'PGRST204' || /column|schema cache/i.test(err.message || '');
}

let cache = null;      // { rows, maxId, colsIdx, loadedAt, checkedAt }
let inflight = null;   // dedupe concurrent refreshes within one instance
let inflightAt = 0;    // ms timestamp the in-flight refresh STARTED (see force below)

// Cold-load strategy, third attempt. The two before it were wrong in an
// instructive way, so the reasoning is recorded here.
//
// 1. ORIGINAL (fetchAllRows): .range(offset, offset+999) page by page, 34 round
//    trips for 33,800 rows. Measured 9.5-11.8s cold.
// 2. PARALLEL OFFSET: same .range() pages, six at a time. Measured 17.4s, i.e.
//    WORSE. The mistake was treating this as a latency problem when it is a
//    work problem: PostgREST .range() is OFFSET pagination, and Postgres has to
//    walk and discard `offset` rows to answer each page. Page 33 discards
//    33,000 rows. Total work is quadratic in the row count, about 1.1M row
//    visits here, and running six of those concurrently just makes them
//    contend for the same CPU and I/O. Concurrency cannot help when the cost is
//    total work rather than round-trip time.
// 3. KEYSET (this): ask for `id > <last id seen>` with a LIMIT, which is an
//    index range scan on the primary key. Every page costs the same as the
//    first, so the total is linear rather than quadratic. Still sequential,
//    because each page needs the previous page's last id, but each round trip
//    is cheap and the quadratic term is gone.
//
// The loop ends when a short page arrives, which by definition means it reached
// the current end of the table, so no tail query is needed.
const PAGE = 1000;

async function loadAllKeyset(admin, cols, afterId = 0) {
  const out = [];
  let lastId = afterId;
  for (;;) {
    const { data, error } = await admin
      .from('quiz_results')
      .select(cols)
      .gt('id', lastId)
      .order('id', { ascending: true })
      .limit(PAGE);
    // Return the error unchanged so the caller's column-tier fallback still sees
    // a missing-column code and can drop to the next tier.
    if (error) return { data: out, error };
    const rows = data || [];
    out.push(...rows);
    if (rows.length < PAGE) break;
    lastId = rows[rows.length - 1].id;
    // Defensive: a row without an id would loop forever.
    if (!(lastId > 0)) break;
  }
  return { data: out, error: null };
}

// ---- cross-instance snapshot (migration 44) --------------------------------
//
// Keyset paging made a cold load linear instead of quadratic, but measuring it
// showed paging was never the real cost: on a cold deploy EVERY hot route
// (me, xp, xp-categories, totals, daily-status, player...) pages the same table
// at the same moment from its own lambda, about 200,000 rows of concurrent
// egress to render one page. Measured: 16.2s / 12.7s / 12.5s / 12.5s / 11.3s.
// No paging strategy fixes duplicated work across processes.
//
// So persist the row set: one row holding gzipped JSON of every result. A cold
// instance reads that single row and asks only for ids above it. This caches
// ROWS, never a derived figure, so no scoring behaviour can drift.
//
// Every call here is wrapped: if the table does not exist yet (migration not
// applied), or anything at all goes wrong, we fall straight back to the plain
// keyset load. The deploy is therefore safe before the migration runs.
const SNAP_MAX_AGE_MS = 6 * 60 * 60 * 1000;  // refresh a snapshot older than this (was 30 min; Disk IO fix 2026-10-06)
const SNAP_MAX_LAG = 10000;              // ...or one this many rows behind (was 2,000)
const SNAP_MAX_ROWS = 400000;            // sanity ceiling; skip writing beyond it

// The snapshot now lives in Supabase Storage (lib/results-snapshot-store.js),
// not in a table: rewriting a ~5MB row every refresh was what drained the
// database's Disk IO budget (2026-10-06). The table from the old migration is
// no longer read or written.
const SNAP_NAME = 'quiz-results';

async function readSnapshot(admin, colsIdx) {
  const snap = await readStoredSnapshot(admin, SNAP_NAME);
  // A payload built from a different column list would hand callers rows
  // missing fields they expect. Fall back to a full load instead.
  if (!snap || snap.colsIdx !== colsIdx) return null;
  return { rows: snap.rows, maxId: snap.maxId, createdAt: snap.createdAt };
}

// Awaited on purpose: a lambda can be frozen the moment it returns a response,
// so a fire-and-forget write would frequently never land.
async function writeSnapshot(admin, rows, colsIdx) {
  if (!Array.isArray(rows) || rows.length > SNAP_MAX_ROWS) return;
  // Thundering herd after a deploy: re-check the tiny meta file and skip if
  // another instance already left a snapshot fresh enough to be useful.
  const cur = await readStoredSnapshotMeta(admin, SNAP_NAME);
  if (cur && cur.colsIdx === colsIdx) {
    const age = Date.now() - cur.createdAt;
    const lag = (rows.length ? rows[rows.length - 1].id : 0) - cur.maxId;
    if (age < SNAP_MAX_AGE_MS && lag <= SNAP_MAX_LAG) return;
  }
  const ok = await writeStoredSnapshot(admin, SNAP_NAME, rows, colsIdx);
  if (!ok) console.error('quiz-results snapshot write skipped');
}

function store(rows, colsIdx) {
  const now = Date.now();
  cache = {
    rows,
    maxId: rows.length ? rows[rows.length - 1].id : 0,
    colsIdx,
    loadedAt: now,
    checkedAt: now,
  };
}

async function fullLoad(admin) {
  let colsIdx = cache ? cache.colsIdx : 0;
  for (; colsIdx < COL_TIERS.length; colsIdx++) {
    // 1. Snapshot plus the rows added since. The common cold path.
    const snap = await readSnapshot(admin, colsIdx);
    if (snap) {
      const d = await loadAllKeyset(admin, COL_TIERS[colsIdx], snap.maxId);
      if (d.error && isMissingColumn(d.error)) continue;
      if (!d.error) {
        const delta = d.data || [];
        const rows = delta.length ? snap.rows.concat(delta) : snap.rows;
        store(rows, colsIdx);
        const stale = (Date.now() - snap.createdAt > SNAP_MAX_AGE_MS) || delta.length > SNAP_MAX_LAG;
        if (stale) await writeSnapshot(admin, rows, colsIdx);
        return { data: rows, error: null };
      }
      // A non-column error on the delta: fall through and load the table whole.
    }

    // 2. No usable snapshot: page the table, then leave one behind so the next
    // cold instance (and the next deploy) skips this path entirely.
    const r = await loadAllKeyset(admin, COL_TIERS[colsIdx]);
    if (r.error && isMissingColumn(r.error)) continue;
    if (r.error) return { data: r.data, error: r.error };
    const rows = r.data || [];
    store(rows, colsIdx);
    await writeSnapshot(admin, rows, colsIdx);
    return { data: rows, error: null };
  }
  return { data: [], error: { message: 'quiz_results: no column tier matched' } };
}

async function refresh(admin) {
  const now = Date.now();
  if (!cache || now - cache.loadedAt > FULL_MS) return fullLoad(admin);

  // 1. Exact count without shipping any rows.
  const { count, error: countErr } = await admin
    .from('quiz_results')
    .select('id', { count: 'exact', head: true });
  if (countErr) {
    // Serve stale rather than fail (and rather than re-shipping the table).
    console.error('quiz_results cache count error', countErr);
    cache.checkedAt = now;
    return { data: cache.rows, error: null };
  }

  // 2. Delta: only the rows inserted since our newest cached row. Usually
  // empty or a handful of rows, i.e. near-zero egress.
  const d = await fetchAllRows(
    admin, 'quiz_results', COL_TIERS[cache.colsIdx], ['id'],
    (q) => q.gt('id', cache.maxId),
  );
  if (d.error) {
    console.error('quiz_results cache delta error', d.error);
    cache.checkedAt = now;
    return { data: cache.rows, error: null };
  }
  if (d.data && d.data.length) {
    cache.rows = cache.rows.concat(d.data);
    cache.maxId = cache.rows[cache.rows.length - 1].id;
  }

  // 3. Deletions (admin quiz-reset) shrink the count: reload in full.
  if (count != null && count !== cache.rows.length) return fullLoad(admin);

  cache.checkedAt = now;
  return { data: cache.rows, error: null };
}

function startRefresh(admin) {
  inflightAt = Date.now();
  inflight = refresh(admin).finally(() => { inflight = null; });
  return inflight;
}

// Same { data, error } contract as the old loadQuizResults. `data` is the
// shared cached array: treat it as read-only.
export async function loadQuizResultsCached(admin, { force = false } = {}) {
  const issuedAt = Date.now();
  // `force` skips the short burst-TTL short-circuit so a caller that must see
  // the very latest rows (e.g. a just-finished player's own result) always runs
  // the cheap count+delta refresh instead of a possibly-pre-insert snapshot.
  if (!force && cache && issuedAt - cache.checkedAt < BURST_TTL_MS) {
    return { data: cache.rows, error: null };
  }
  if (inflight) {
    // Sharing the in-flight refresh is right for an ordinary read, and right for
    // a forced read too WHEN that refresh started after this call (it will
    // observe anything committed before it). But a forced read that joins an
    // OLDER refresh inherits a snapshot taken before its own write landed, which
    // is the exact staleness `force` exists to prevent: the just-finished player
    // then reads a board without their own row and has to sit through the
    // client's retry ladder. So wait for the older refresh to settle and run our
    // own afterwards. Sequential, never parallel, so two refreshes can never both
    // append the same delta rows on top of the same maxId.
    if (!force || inflightAt > issuedAt) return inflight;
    await inflight.catch(() => {});
    // Anything started while we waited began after `issuedAt`, so it is fresh
    // enough for us and we can simply join it.
    if (inflight) return inflight;
  }
  return startRefresh(admin);
}
