// Shared client for /api/quiz/me (2026-08-08).
//
// WHY: every daily game page asks this question TWICE, for the same player, in
// the same tick. QuizNavHeader (on all 35 game surfaces, directly or through
// DailyChrome) wants the headline profile, so it asks for `light=1`. The game
// client wants the play history for the cross-device stats/streak merge, so it
// asks for `history=1`. Neither knows the other exists. Measured on a warm
// /crux load they were the two slowest things on the page at 1182ms and 836ms,
// and members are deliberately never CDN-cached (see the route header), so both
// go all the way to the origin and re-derive the same scoreboard.
//
// This coalesces them: callers landing in the same short window share ONE
// request, issued at the RICHEST mode anybody asked for.
//
// Upgrading is safe because the modes are nested supersets. `history` returns
// every field `light` does and adds `recent`; the full profile adds trophies and
// per-entry rank movement on top of that. So a light caller handed a history
// payload strictly gains. Verified before shipping that the only light consumer,
// QuizCommandHeader, reads just found / signed / name / xp / rank / ranks.xp /
// totalPlayers, and never touches `recent` or `trophies`.
//
// When only light callers turn up, the request STAYS light, so a page with no
// game client never pays for history it will not render.
//
// A `fresh=1` caller is never coalesced and never served from the settled entry.
// That is the post-game path reading its own just-written row, and handing it a
// shared answer from 40ms ago would report the pre-game IQ and swallow the
// trophy unlock.
//
// Call sites keep their exact shape: meRequest resolves to a `{ json() }`
// stand-in, so `meRequest(url).then((r) => r.json())` behaves like the plain
// fetch it replaced. That is deliberate, it keeps the diff across ~47 game
// clients to one token per file.

// Long enough to catch two components mounting in the same commit, short enough
// that nobody perceives it. The header's own request is delayed by this much.
const WINDOW_MS = 50;
// A late third caller can join an answer that just settled. Kept short because
// the only thing that changes a player's profile is finishing a game, and every
// post-game reader passes fresh=1 and bypasses this entirely.
// Raised from 2.5s to 60s (2026-10-14): the profile read takes 3-5s, so later
// components on the same page were always past a 2.5s window and re-fetched it.
// Safe because the only thing that changes a profile is finishing a game, which
// fires one of the events below and clears this, and post-game reads are fresh.
const TTL_MS = 60 * 1000;

const RANK = { light: 0, history: 1, full: 2 };

let pending = null; // { key, anonId, email, mode, waiters, timer }
let settled = null; // { key, mode, at, data }

function parse(url) {
  const q = url.indexOf('?');
  const params = new URLSearchParams(q >= 0 ? url.slice(q + 1) : '');
  const on = (k) => params.get(k) === '1' || params.get(k) === 'true';
  return {
    anonId: params.get('anonId') || '',
    email: params.get('email') || '',
    fresh: on('fresh'),
    mode: on('light') ? 'light' : on('history') ? 'history' : 'full',
  };
}

function build({ anonId, email, mode }) {
  const p = new URLSearchParams();
  if (anonId) p.set('anonId', anonId);
  if (email) p.set('email', email);
  if (mode === 'light') p.set('light', '1');
  else if (mode === 'history') p.set('history', '1');
  return '/api/quiz/me?' + p.toString();
}

// Plain fetch, no cache option: guests are CDN-cached by the route and adding
// `cache: no-store` here would send a revalidating request header and throw that
// away.
function wrap(data) {
  return { ok: true, json: () => Promise.resolve(data) };
}

function flush(p) {
  if (pending === p) pending = null;
  if (p.timer) { clearTimeout(p.timer); p.timer = null; }
  fetch(build(p))
    .then((r) => r.json())
    .then((data) => {
      settled = { key: p.key, mode: p.mode, at: Date.now(), data };
      for (const w of p.waiters) w.resolve(wrap(data));
    })
    .catch((err) => {
      for (const w of p.waiters) w.reject(err);
    });
}

export function meRequest(url) {
  const req = parse(url);
  // Post-game reads go straight through, and their answer becomes the shared one
  // (it is the newest there is).
  if (req.fresh) {
    const key = req.anonId + '|' + req.email;
    settled = null;
    return fetch(url).then((r) => {
      if (!r.ok) return r;
      return r.json().then((data) => {
        settled = { key, mode: req.mode, at: Date.now(), data };
        return wrap(data);
      });
    });
  }

  const key = req.anonId + '|' + req.email;

  // Join an answer that just settled, but only if it is at least as rich.
  if (
    settled &&
    settled.key === key &&
    Date.now() - settled.at < TTL_MS &&
    RANK[settled.mode] >= RANK[req.mode]
  ) {
    return Promise.resolve(wrap(settled.data));
  }

  // Join the request already forming for this player, upgrading its mode if this
  // caller needs more than the one that opened the window.
  if (pending && pending.key === key) {
    if (RANK[req.mode] > RANK[pending.mode]) pending.mode = req.mode;
    return new Promise((resolve, reject) => pending.waiters.push({ resolve, reject }));
  }

  const p = { key, anonId: req.anonId, email: req.email, mode: req.mode, waiters: [], timer: null };
  pending = p;
  const first = new Promise((resolve, reject) => p.waiters.push({ resolve, reject }));
  p.timer = setTimeout(() => flush(p), WINDOW_MS);
  return first;
}

// A game finished, so the settled profile is stale by definition. Post-game
// readers already pass fresh=1, so this is belt and braces for any future caller
// that does not.
export function invalidateQuizMe() {
  settled = null;
}

if (typeof window !== 'undefined') {
  for (const ev of ['sot:daily-updated', 'sot:result-saved', 'sot:loft-finish']) {
    window.addEventListener(ev, invalidateQuizMe);
  }
}
