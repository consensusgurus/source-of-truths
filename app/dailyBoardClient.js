// Shared client for /api/quiz/daily-combined (2026-09-04).
//
// WHY: the home fires this for TODAY on mount (app/today/StageToday.jsx) and the
// other surfaces on the page can ask the same question, so without sharing,
// one page load could make the identical request twice. Same reasoning
// and the same shape as app/dailyMeClient.js: a small cache keyed by the query
// string, where a caller asking the same question within a few seconds joins the
// request already in flight instead of starting another.
//
// KEYED BY THE WHOLE QUERY, so today (identity only) and a past date (identity
// plus `date`) are different questions and neither evicts the other. Build the
// query with dailyBoardQuery so that two callers asking the same thing produce
// the same key: URLSearchParams preserves insertion order, so a hand-built string
// in another order would silently miss and make the second request anyway.
const TTL_MS = 8000;
const MAX = 4;
const entries = new Map(); // key -> { at, promise }

export function dailyBoardQuery({ date = null, anonId = null, email = null } = {}) {
  const p = new URLSearchParams();
  if (date) p.set('date', date);
  if (anonId) p.set('anonId', anonId);
  if (email) p.set('email', email);
  return p.toString();
}

// The identity the quiz client keeps in localStorage. Wrapped because Safari
// private mode throws on access.
export function dailyBoardIdentity() {
  let anonId = null, email = null;
  try { anonId = localStorage.getItem('sot_quiz_anon'); } catch (e) {}
  try {
    const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null');
    email = id && id.email;
  } catch (e) {}
  return { anonId, email };
}

export function fetchDailyBoard(qs) {
  const now = Date.now();
  const hit = entries.get(qs);
  if (hit && now - hit.at < TTL_MS) return hit.promise;
  const promise = fetch('/api/quiz/daily-combined' + (qs ? '?' + qs : '')).then((r) => r.json());
  entries.set(qs, { at: now, promise });
  // A page asks two or three of these at most; the cap only stops a long session
  // growing the map without bound.
  if (entries.size > MAX) entries.delete(entries.keys().next().value);
  return promise;
}
