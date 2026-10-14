'use client';

// One answer per question per page, for a minute (2026-10-14).
//
// A single /crux load measured 18 API calls, most of them the same three
// questions (daily-status, daily-game, me) asked by different components that
// each fetched for themselves. Several were 3-6s server reads, so the existing
// few-second sharing windows had expired before the next component asked.
//
// sharedGet(url) returns the parsed JSON, and any identical GET in the next
// TTL_MS joins the same promise. "Identical" ignores parameter order and the
// cache-busting params (fresh, _), so two callers that build the same query in
// a different order still share.
//
// The cache empties the moment anything on the page finishes or saves a game
// (sot:daily-updated, sot:result-saved, sot:loft-finish), so a player's own
// result is never hidden behind a cached answer. Callers that must read their
// own just-written row still pass { fresh: true } and go straight through.

const TTL_MS = 60 * 1000;
const cache = new Map(); // key -> { at, promise }

function keyOf(url) {
  const q = url.indexOf('?');
  const path = q >= 0 ? url.slice(0, q) : url;
  const p = new URLSearchParams(q >= 0 ? url.slice(q + 1) : '');
  p.delete('fresh'); p.delete('_');
  const pairs = [...p.entries()].sort((a, b) => (a[0] + '=' + a[1]).localeCompare(b[0] + '=' + b[1]));
  return path + '?' + pairs.map(([k, v]) => k + '=' + v).join('&');
}

export function clearSharedGet() { cache.clear(); }

if (typeof window !== 'undefined') {
  for (const ev of ['sot:daily-updated', 'sot:result-saved', 'sot:loft-finish']) {
    window.addEventListener(ev, clearSharedGet);
  }
}

export function sharedGet(url, { fresh = false, init } = {}) {
  const key = keyOf(url);
  const now = Date.now();
  if (!fresh) {
    const e = cache.get(key);
    if (e && now - e.at < TTL_MS) return e.promise;
  }
  const promise = fetch(url, init || (fresh ? { cache: 'no-store' } : undefined))
    .then((r) => r.json());
  cache.set(key, { at: now, promise });
  // A failed read must not be served to the next caller for a minute.
  promise.catch(() => { if (cache.get(key) && cache.get(key).promise === promise) cache.delete(key); });
  return promise;
}
