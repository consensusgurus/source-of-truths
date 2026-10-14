// Day-scoped in-process cache for quiz_results (post-game latency fix, 2026-08-01).
//
// WHY: /api/quiz/daily-combined answers a question about ONE day: the (at most
// ~41) daily quizIds that published that date. It was reading the whole
// quiz_results table through loadQuizResultsCached and then throwing away every
// row that was not one of those quizIds. That is fine on a warm lambda, but a
// COLD one pages the entire table first: 33,800 rows in 34 sequential 1000-row
// requests, measured at 8.5s and 11.7s on live instances. Because this route
// sits directly on the end-of-game path, that cold start is exactly what a
// player who just finished a puzzle waits through before seeing their ranking.
//
// HOW: the same count+delta strategy as lib/quiz-results-cache, but every query
// is filtered to the day's quizIds, which is what the quiz_results_quiz index
// (migration 20) has always been for and nothing was using. A cold load is ~780
// rows in ONE request instead of 33,800 in 34. A warm refresh is an exact-count
// HEAD plus a delta of rows newer than the newest we hold, both scoped, so the
// egress win of the full-table cache is preserved.
//
// The rows this returns are exactly the rows daily-combined already kept after
// its `wanted.has(r.quiz_id)` filter, in the same ascending id order, so the
// scoring downstream is untouched. They are, if anything, fresher: a scoped
// delta sees a just-inserted row without waiting on a whole-table snapshot.
//
// Slices are keyed by the day's quizId set (that set IS the day's identity), so
// browsing an archived day gets its own slice and never disturbs today's.
// Callers MUST NOT mutate the returned array or its rows.

import { fetchAllRows } from './fetch-all';
import { QUIZ_RESULT_COL_TIERS, isMissingColumn } from './quiz-results-cache';

// 15s (was 5s, 2026-10-14): today's boards re-counted every 5s per instance.
// A finished player's own read passes force and is never held back by this.
const BURST_TTL_MS = 15 * 1000;         // serve as-is within a request burst
const FULL_MS = 30 * 60 * 1000;         // full reload cadence (catches in-place edits)
const MAX_SLICES = 4;                   // today plus a few archived days a visitor may open

const slices = new Map();               // key -> { rows, maxId, colsIdx, loadedAt, checkedAt }
const inflight = new Map();             // key -> in-flight refresh promise
const inflightAt = new Map();           // key -> ms the in-flight refresh STARTED

// Keep the map small: a long-lived lambda that serves a lot of archive browsing
// should not accumulate a slice per day forever.
function evict() {
  while (slices.size > MAX_SLICES) {
    let oldestKey = null, oldest = Infinity;
    for (const [k, s] of slices) if (s.loadedAt < oldest) { oldest = s.loadedAt; oldestKey = k; }
    if (oldestKey == null) break;
    slices.delete(oldestKey);
  }
}

async function fullLoad(admin, key, ids) {
  const prior = slices.get(key);
  let colsIdx = prior ? prior.colsIdx : 0;
  for (; colsIdx < QUIZ_RESULT_COL_TIERS.length; colsIdx++) {
    const r = await fetchAllRows(
      admin, 'quiz_results', QUIZ_RESULT_COL_TIERS[colsIdx], ['id'],
      (q) => q.in('quiz_id', ids),
    );
    if (r.error && isMissingColumn(r.error)) continue;
    if (r.error) return { data: r.data, error: r.error };
    const rows = r.data || [];
    const now = Date.now();
    slices.set(key, {
      rows,
      maxId: rows.length ? rows[rows.length - 1].id : 0,
      colsIdx,
      loadedAt: now,
      checkedAt: now,
    });
    evict();
    return { data: rows, error: null };
  }
  return { data: [], error: { message: 'quiz_results: no column tier matched' } };
}

async function refresh(admin, key, ids) {
  const slice = slices.get(key);
  const now = Date.now();
  if (!slice || now - slice.loadedAt > FULL_MS) return fullLoad(admin, key, ids);

  // 1. Exact count for this day's quizIds, no row data shipped.
  const { count, error: countErr } = await admin
    .from('quiz_results')
    .select('id', { count: 'exact', head: true })
    .in('quiz_id', ids);
  if (countErr) {
    // Serve stale rather than fail (and rather than re-shipping the slice).
    console.error('daily results slice count error', countErr);
    slice.checkedAt = now;
    return { data: slice.rows, error: null };
  }

  // 2. Delta: only rows for this day newer than the newest one we hold. Usually
  // empty or a handful, i.e. near-zero egress.
  const d = await fetchAllRows(
    admin, 'quiz_results', QUIZ_RESULT_COL_TIERS[slice.colsIdx], ['id'],
    (q) => q.in('quiz_id', ids).gt('id', slice.maxId),
  );
  if (d.error) {
    console.error('daily results slice delta error', d.error);
    slice.checkedAt = now;
    return { data: slice.rows, error: null };
  }
  if (d.data && d.data.length) {
    slice.rows = slice.rows.concat(d.data);
    slice.maxId = slice.rows[slice.rows.length - 1].id;
  }

  // 3. Deletions (admin quiz-reset) shrink the count: reload this slice in full.
  if (count != null && count !== slice.rows.length) return fullLoad(admin, key, ids);

  slice.checkedAt = now;
  return { data: slice.rows, error: null };
}

function startRefresh(admin, key, ids) {
  inflightAt.set(key, Date.now());
  const p = refresh(admin, key, ids).finally(() => {
    inflight.delete(key);
    inflightAt.delete(key);
  });
  inflight.set(key, p);
  return p;
}

// { data, error }, same contract as loadQuizResultsCached. `data` is the shared
// cached array for this day: treat it as read-only.
//
// `force` (the just-finished player's authoritative read) behaves exactly as it
// does in the full-table cache: skip the burst TTL, and never inherit a refresh
// that STARTED before this call, since that snapshot can predate the caller's
// own write. Wait for the older one, then run our own, sequentially so two
// refreshes can never both append the same delta on top of the same maxId.
export async function loadDailyResultsCached(admin, quizIds, { force = false } = {}) {
  const ids = [...new Set(quizIds || [])].filter(Boolean).sort();
  if (!ids.length) return { data: [], error: null };
  const key = ids.join('|');
  const issuedAt = Date.now();

  const slice = slices.get(key);
  if (!force && slice && issuedAt - slice.checkedAt < BURST_TTL_MS) {
    return { data: slice.rows, error: null };
  }
  if (inflight.has(key)) {
    if (!force || (inflightAt.get(key) || 0) > issuedAt) return inflight.get(key);
    await inflight.get(key).catch(() => {});
    // Anything started while we waited began after `issuedAt`, so it is fresh
    // enough for us and we can simply join it.
    if (inflight.has(key)) return inflight.get(key);
  }
  return startRefresh(admin, key, ids);
}
