'use client';

// ResultQueue — durable posting for /api/quiz/result.
//
// WHY: a finished game is only ever recorded by one fire-and-forget POST from
// the board. If that request never lands (offline for a second, the tab closed
// mid-fetch, a 5xx), the play is lost from quiz_results FOREVER. The board's
// own localStorage save still shows the finished board, so the player opens the
// puzzle and sees it completed while /daily's archive, the leaderboard, and
// their IQ total all say they never played it. That is exactly the report that
// prompted this (a player with every Crux day recorded except July 9, which
// their browser still showed as solved).
//
// HOW: one wrapper around window.fetch, installed once for the whole site, that
// watches ONLY POSTs to /api/quiz/result. A request that fails or comes back
// 5xx is stashed in localStorage and retried on the next page load (and when
// the browser comes back online). Before re-posting, the queue asks the GET side
// of the same route whether this identity already has a stored attempt for that
// quiz, so a response that was lost AFTER the row landed can never produce a
// duplicate row.
//
// Deliberately NOT queued: abandon-flush rows (`abandoned: true`). Those are
// posted on pagehide via sendBeacon and replaying one later could file an
// "abandoned" row for a game the player went on to finish.

import { useEffect } from 'react';

const KEY = 'sot_result_queue';
const PATH = '/api/quiz/result';
const MAX_ITEMS = 25;
const MAX_TRIES = 8;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

let patched = false;
let flushing = false;
let rawFetch = null; // the unwrapped fetch, so retries never re-enter the wrapper

// ── EVERY RESULT POST THIS TAB HAS IN FLIGHT (2026-09-20) ────────────────────
//
// A finished game's row is written by a fire-and-forget POST, and the screen
// that comes next READS THE BOARD. Both requests leave in the same tick, so the
// read reaches the server first almost every time and comes back describing a
// day that does not contain the game just played. On a circuit run that is not
// a subtle staleness, it is a wrong scorecard: the total is short by the last
// quiz's score, and because a circuit ranks only a player who finished every
// game in it, the rank collapses to a dash on a run that was in fact complete.
//
// The registry lives HERE because this wrapper already identifies exactly these
// requests, so every reader gets it with no wiring and a future run client
// inherits it rather than having to remember. `resultPostsSettled` is what a
// board read awaits before it asks.
const inflight = new Set();
const SETTLE_CAP_MS = 8000;

function track(p) {
  // Never allowed to reject: this promise exists to be awaited, not handled,
  // and a rejection here would surface as an unhandled one.
  const q = p.then(() => {}, () => {});
  inflight.add(q);
  q.then(() => inflight.delete(q));
  // AND IT EVICTS ITSELF. A request that never comes back never settles, so
  // without this one hung post sits in the set for the rest of the session and
  // every later read in the tab pays the full ceiling waiting on it. The
  // ceiling is the longest anyone is willing to wait for it once, not a debt
  // the next reader inherits.
  setTimeout(() => inflight.delete(q), SETTLE_CAP_MS);
  return q;
}

// Resolves once every result POST issued so far has come back, or at the
// ceiling, whichever is first. A request still hanging after that has failed in
// every way that matters to a reader, and the queue above is what repairs it,
// so waiting longer would only hold a spinner over a board that is as right as
// it is going to get.
export function resultPostsSettled(capMs = SETTLE_CAP_MS) {
  if (!inflight.size) return Promise.resolve(true);
  return Promise.race([
    Promise.all([...inflight]).then(() => true),
    new Promise((res) => { setTimeout(() => res(false), capMs); }),
  ]);
}

function isResultUrl(input) {
  try {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    if (!url) return false;
    const path = String(url).split('?')[0];
    return path === PATH || path.endsWith(PATH);
  } catch (e) {
    return false;
  }
}

function readQueue() {
  try {
    const q = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(q) ? q : [];
  } catch (e) {
    return [];
  }
}

function writeQueue(q) {
  try {
    if (!q.length) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(q.slice(-MAX_ITEMS)));
  } catch (e) {}
}

function enqueue(bodyText) {
  let body = null;
  try { body = JSON.parse(bodyText); } catch (e) { return; }
  if (!body || typeof body.quizId !== 'string' || !body.quizId) return;
  if (body.abandoned === true) return; // see the note above
  const q = readQueue().filter((it) => !(it && it.b && it.b.quizId === body.quizId));
  q.push({ b: body, t: Date.now(), n: 0 });
  writeQueue(q);
}

// True when the server already holds a completed attempt for this identity.
async function alreadyRecorded(b) {
  if (!b.anonId && !b.email) return false; // nothing to look it up by
  try {
    const qs = new URLSearchParams({ quizId: b.quizId });
    if (b.anonId) qs.set('anonId', b.anonId);
    if (b.email) qs.set('email', b.email);
    const r = await rawFetch(`${PATH}?${qs.toString()}`);
    if (!r || !r.ok) return false;
    const d = await r.json();
    return !!(d && d.found);
  } catch (e) {
    return false;
  }
}

async function flush() {
  if (flushing || typeof navigator === 'undefined' || navigator.onLine === false) return;
  let q = readQueue();
  if (!q.length) return;
  flushing = true;
  try {
    const now = Date.now();
    q = q.filter((it) => it && it.b && it.b.quizId && now - (it.t || 0) < MAX_AGE_MS);
    const keep = [];
    for (const it of q) {
      if (await alreadyRecorded(it.b)) continue; // the row is there; drop the retry
      let ok = false;
      try {
        const r = await rawFetch(PATH, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(it.b),
        });
        // A 4xx is the server rejecting this payload; retrying cannot fix it.
        ok = !!r && (r.ok || (r.status >= 400 && r.status < 500));
      } catch (e) {
        ok = false;
      }
      if (!ok) {
        const n = (it.n || 0) + 1;
        if (n < MAX_TRIES) keep.push({ ...it, n });
      }
    }
    writeQueue(keep);
  } catch (e) {
    // Never let a repair attempt break the page.
  } finally {
    flushing = false;
  }
}

function patchFetch() {
  if (patched || typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  patched = true;
  rawFetch = window.fetch.bind(window);
  const wrapped = function (input, init) {
    const p = rawFetch(input, init);
    try {
      const method = String((init && init.method) || (typeof input === 'object' && input && input.method) || 'GET').toUpperCase();
      if (method === 'POST' && isResultUrl(input)) {
        // Registered before anything else, so a board read starting in this
        // same tick already has something to wait on.
        track(p);
        if (init && typeof init.body === 'string') {
          const bodyText = init.body;
          // Observe only: the caller still gets the original promise untouched.
          p.then(
            (res) => { if (!res || (!res.ok && res.status >= 500)) enqueue(bodyText); },
            () => enqueue(bodyText),
          );
        }
      }
    } catch (e) {}
    return p;
  };
  window.fetch = wrapped;
}

export default function ResultQueue() {
  useEffect(() => {
    patchFetch();
    // Let the page settle first: a repair is never urgent.
    const t = setTimeout(flush, 2500);
    const onOnline = () => flush();
    window.addEventListener('online', onOnline);
    return () => { clearTimeout(t); window.removeEventListener('online', onOnline); };
  }, []);
  return null;
}
