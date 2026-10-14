// Shared client for /api/quiz/daily-me (2026-08-01).
//
// WHY: three independent components ask the same question on one daily puzzle
// page — the end card, DailyBoardPanel and DailyGamesGrid — and each was
// "self-contained", so each fired its own request. A live load measured FIVE
// daily-me requests (the card retries until its own row lands, on top of the
// other two). They are parallel, so the wall-clock cost is small, but it is the
// same answer computed several times per page view.
//
// This is a one-entry cache, not a store: a caller asking the same question
// within a few seconds joins the request already in flight instead of starting
// another. It deliberately keeps no long-lived state, because a daily board
// genuinely changes as people play.
//
// The end card passes { fresh: true } on every attempt: it is checking for its
// OWN just-written row, so it must never be served a cached answer. Its result
// still SEEDS the entry, which is what lets the panel and the grid ride along on
// the request the card was already making.

// Raised from 4s to 60s (2026-10-14): this read takes 3-6s, so other
// components on the page always missed the old window and asked again. Every
// finish clears it (listener at the foot of this file), and the end card's own
// reads pass fresh, so a player's result is never hidden.
const TTL_MS = 60 * 1000;
// How long a fresh caller may join a fresh request that is STILL IN FLIGHT.
// Short on purpose: it is meant to catch two components mounting in the same
// tick, never to serve an answer that predates something written since.
const JOIN_MS = 400;

// One entry per query, not one in total: a page asks a game-scoped question and
// an unscoped one, and with a single slot they kept evicting each other.
const entries = new Map(); // key -> { key, at, promise, fresh, pending }

// The query string every caller should build, so identical questions produce
// identical keys. `game` scopes the full scoring to one puzzle; without it the
// endpoint only counts rows, which is all the grid needs.
export function dailyMeQuery({ anonId = null, email = null, game = null, quizId = null } = {}) {
  const qs = new URLSearchParams();
  if (anonId) qs.set('anonId', anonId);
  if (email) qs.set('email', email);
  if (game) qs.set('game', game);
  if (quizId) qs.set('quizId', quizId);
  return qs.toString();
}

// Read the identity the quiz client keeps in localStorage. Wrapped because
// Safari private mode throws on access.
export function dailyMeIdentity() {
  let anonId = null, email = null;
  try { anonId = localStorage.getItem('sot_quiz_anon'); } catch (e) {}
  try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); email = id && id.email; } catch (e) {}
  return { anonId, email };
}

export function fetchDailyMe(qs, { fresh = false } = {}) {
  const now = Date.now();
  const entry = entries.get(qs) || null;
  // A non-fresh caller joins an identical request from the last few seconds,
  // in flight or just settled. A fresh caller always goes to the origin.
  if (!fresh && entry && entry.key === qs && now - entry.at < TTL_MS) return entry.promise;
  // TWO FRESH CALLERS IN THE SAME TICK ARE ONE QUESTION (2026-08-23). The end
  // card asks, and from this date so does the category row rendered beside it;
  // both pass fresh, so both went to the origin for an answer neither could
  // possibly have received yet. A fresh caller may therefore join a fresh
  // request that is still PENDING and started within JOIN_MS.
  //
  // It may NOT join one that has SETTLED, which is the whole reason `fresh`
  // exists: the card's retry loop is looking for its OWN just-written row, and
  // a settled answer is exactly the stale one it is retrying past. Nor can it
  // join across a finish, since DailyEndCard calls invalidateDailyMe() on
  // sot:daily-updated and that drops the entry outright.
  if (fresh && entry && entry.key === qs && entry.fresh && entry.pending
      && now - entry.at < JOIN_MS) return entry.promise;
  const url = '/api/quiz/daily-me?' + qs + (fresh ? `&fresh=1&_=${now}` : '');
  const promise = fetch(url, { cache: 'no-store' }).then((r) => r.json());
  const mine = { key: qs, at: now, promise, fresh, pending: true };
  entries.set(qs, mine);
  if (entries.size > 20) entries.delete(entries.keys().next().value);
  // Settle the flag either way. The handlers are attached to a DERIVED promise,
  // so a rejection is still delivered to the caller that asked for it and this
  // adds no unhandled rejection of its own.
  const settle = () => { mine.pending = false; };
  promise.catch(() => { if (entries.get(qs) === mine) entries.delete(qs); });
  promise.then(settle, settle);
  return promise;
}

// A game finished on this page, so every cached answer is stale by definition.
// Callers already listen for sot:daily-updated; this makes sure the refetch they
// then run cannot be served the pre-finish payload.
export function invalidateDailyMe() { entries.clear(); }

if (typeof window !== 'undefined') {
  for (const ev of ['sot:daily-updated', 'sot:result-saved', 'sot:loft-finish']) {
    window.addEventListener(ev, invalidateDailyMe);
  }
}
