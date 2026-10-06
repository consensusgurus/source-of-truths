// In-process cache for the WIDE quiz_results read the admin panel needs
// (2026-08-28).
//
// WHY THIS EXISTS AT ALL, given lib/quiz-results-cache.js already caches this
// table: the two reads want different columns. Every hot quiz route needs the
// scoring columns, and that narrow set is what the shared cache holds and what
// the shared snapshot (migration 44) persists. The admin panel additionally
// needs the eight traffic-metadata columns added by migrations 26 and 27
// (country/region/city/timezone/referrer/language/ua_browser/ua_os) to build
// its per-player device/geo/browser breakdowns and the player map.
//
// Widening the SHARED column list to cover the admin was the obvious move and
// is the wrong one: those are long strings on every row, they would land in the
// shared snapshot, and every hot route on the site would then pay to ship
// referrer URLs it never reads, to make one page faster for one person. So the
// admin gets its own cache with its own columns and its own snapshot table, and
// the shared module is left untouched.
//
// Before this, /admin called fetchAllRows directly on every load: ~73 sequential
// 1000-row round trips, and no reuse between loads because the page is
// force-dynamic. Measured on the live site 2026-08-28: 34.9s TTFB, identical on
// three consecutive loads, i.e. no warm benefit whatsoever. The shared cache had
// already solved exactly this for /api/quiz/* (81ms warm); the admin page was
// simply the one route that never adopted it.
//
// Rows are returned in ascending id order. Callers MUST NOT mutate the returned
// array or its rows.

import { fetchAllRows } from './fetch-all';
import { readStoredSnapshot, readStoredSnapshotMeta, writeStoredSnapshot } from './results-snapshot-store';

// The full column set the admin panel reads: everything the shared cache holds
// that the admin uses, plus the traffic metadata.
const COLS_FULL = 'id, quiz_id, user_id, score, total, correct_count, time_elapsed, created_at, anon_id, is_mobile, country, region, ua_browser, ua_os, city, timezone, referrer, language';

// Progressive fallbacks for a database that has not applied every metadata
// migration yet, newest columns dropped FIRST: migration 27 (city, timezone,
// referrer, language), then 26 (country, region, ua_browser, ua_os), then 25
// (is_mobile), then 24 (correct_count). Same discipline as the shared cache:
// never let a deploy depend on migration timing.
const COL_TIERS = [
  COLS_FULL,
  'id, quiz_id, user_id, score, total, correct_count, time_elapsed, created_at, anon_id, is_mobile, country, region, ua_browser, ua_os',
  'id, quiz_id, user_id, score, total, correct_count, time_elapsed, created_at, anon_id, is_mobile',
  'id, quiz_id, user_id, score, total, correct_count, time_elapsed, created_at, anon_id',
  'id, quiz_id, user_id, score, total, time_elapsed, created_at, anon_id',
  'id, quiz_id, user_id, score, total, time_elapsed, created_at',
];

// Shared with app/api/admin/player-plays, which runs the same column-tier
// fallback against a single player's slice of the same table. Exported rather
// than copied so the route can never ask for a column set this module has
// already learned the database does not have.
export const ADMIN_RESULT_COL_TIERS = COL_TIERS;

const BURST_TTL_MS = 5 * 1000;        // serve as-is within a burst
const FULL_MS = 6 * 60 * 60 * 1000;   // full reload cadence (catches renames)
const PAGE = 1000;

export function isMissingColumn(err) {
  if (!err) return false;
  return err.code === '42703' || err.code === 'PGRST204' || /column|schema cache/i.test(err.message || '');
}

let cache = null;      // { rows, maxId, colsIdx, loadedAt, checkedAt }
let inflight = null;   // dedupe concurrent refreshes within one instance

// Keyset paging, not .range() offset paging. PostgREST's .range() makes Postgres
// walk and discard `offset` rows per page, so the total is quadratic in the row
// count; `id > lastId` with a LIMIT is an index range scan, so every page costs
// the same and the total is linear. This is the same conclusion the shared cache
// reached the hard way, recorded at length in lib/quiz-results-cache.js.
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
    // Pass the error through unchanged so the column-tier fallback above still
    // recognises a missing-column code.
    if (error) return { data: out, error };
    const rows = data || [];
    out.push(...rows);
    if (rows.length < PAGE) break;
    lastId = rows[rows.length - 1].id;
    if (!(lastId > 0)) break; // defensive: a row without an id would loop forever
  }
  return { data: out, error: null };
}

// ---- cross-instance snapshot (migration 55) --------------------------------
//
// Keyset paging alone leaves the FIRST admin load after each deploy paying for
// the whole table, and this project deploys often (measured ~42/day in August
// 2026), so "cold" is the common case rather than the rare one. One row holding
// the gzipped result set fixes that the same way migration 44 fixed it for the
// quiz routes.
//
// SAFE BEFORE THE MIGRATION IS APPLIED: every read and write below is wrapped,
// and a missing table just means falling back to the keyset load. The deploy
// works unchanged the moment it lands and simply gets faster afterwards. That
// matters here because migrations on this project are applied by hand and have
// run several numbers behind the code before.
const SNAP_MAX_AGE_MS = 6 * 60 * 60 * 1000;  // refresh a snapshot older than this (was 30 min; Disk IO fix 2026-10-06)
const SNAP_MAX_LAG = 10000;              // ...or one this many rows behind (was 2,000)
const SNAP_MAX_ROWS = 400000;            // sanity ceiling; skip writing beyond it

// The snapshot now lives in Supabase Storage (lib/results-snapshot-store.js),
// not in a table: rewriting a ~5MB row every refresh was what drained the
// database's Disk IO budget (2026-10-06). The table from the old migration is
// no longer read or written.
const SNAP_NAME = 'admin-results';

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
  if (!ok) console.error('admin-results snapshot write skipped');
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
  // Start from the tier this instance already resolved. The old admin code
  // re-probed from the widest tier on every single load, which meant a database
  // missing one column re-paged the entire table once per tier.
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
  return { data: [], error: { message: 'quiz_results (admin): no column tier matched' } };
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
    console.error('admin quiz_results cache count error', countErr);
    cache.checkedAt = now;
    return { data: cache.rows, error: null };
  }

  // 2. Delta: only rows inserted since our newest cached row. Usually empty or
  // a handful, i.e. near-zero egress.
  const d = await fetchAllRows(
    admin, 'quiz_results', COL_TIERS[cache.colsIdx], ['id'],
    (q) => q.gt('id', cache.maxId),
  );
  if (d.error) {
    console.error('admin quiz_results cache delta error', d.error);
    cache.checkedAt = now;
    return { data: cache.rows, error: null };
  }
  if (d.data && d.data.length) {
    cache.rows = cache.rows.concat(d.data);
    cache.maxId = cache.rows[cache.rows.length - 1].id;
  }

  // 3. Deletions (admin quiz-reset / quiz-result-clear) shrink the count, and an
  // admin who just deleted rows is the person most likely to reload this page
  // and expect them gone. Reload in full.
  if (count != null && count !== cache.rows.length) return fullLoad(admin);

  cache.checkedAt = now;
  return { data: cache.rows, error: null };
}

// Same { data, error } contract the admin page's old fetchQuizResults returned.
// `data` is the shared cached array: treat it as read-only.
export async function loadAdminResultsCached(admin, { force = false } = {}) {
  if (!force && cache && Date.now() - cache.checkedAt < BURST_TTL_MS) {
    return { data: cache.rows, error: null };
  }
  if (inflight) return inflight;
  inflight = refresh(admin).finally(() => { inflight = null; });
  return inflight;
}
