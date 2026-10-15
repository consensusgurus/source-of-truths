// CHALLENGE RETURN LEG, browser half (owner, 2026-10-15). Server half:
// lib/challenge-server.js, tables: migration 60.
//
// A challenge link now carries c=<cid> as well as vs=<payload>. The cid is
// minted HERE, in the browser, so pressing Send never waits on a request: the
// share sheet has to open inside the tap (iOS drops it otherwise), and the row
// is written fire-and-forget beside it. The receiver's landing records an open,
// and their finish records a take, both keyed by that cid.
//
// Everything here is best-effort. A failed post costs the sender one line on
// their home; it never costs anybody a game.

import { savedIdentity } from './saved-identity';
import { getVisitorId } from './visitor';

const CID_KEY = (g) => `sot_vsc_${g}`;
const DONE_KEY = (cid) => `sot_vsc_done_${cid}`;

// The same browser id the quiz system and the visitor beacon use (sot_quiz_anon),
// minted here if this is the very first page: a friend landing on /vs from a
// message has none yet, and their open has to be keyed to the id they will
// finish the game under.
function anonId() {
  if (typeof window === 'undefined') return null;
  try { return getVisitorId() || null; } catch (e) { return null; }
}
function who() {
  const s = savedIdentity();
  return { anonId: anonId(), email: s.email || null, name: s.username || null };
}

function post(path, body) {
  try {
    fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...who(), ...body }),
      keepalive: true,
    }).catch(() => {});
  } catch (e) { /* best effort */ }
}

export function newCid() {
  const a = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  try {
    const b = new Uint8Array(10);
    crypto.getRandomValues(b);
    for (const x of b) s += a[x % a.length];
  } catch (e) {
    for (let i = 0; i < 10; i += 1) s += a[Math.floor(Math.random() * a.length)];
  }
  return s;
}

// Put the cid on a link that already carries vs= (before any ref= withRef adds).
export function withCid(url, cid) {
  if (!cid) return url;
  return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'c=' + cid;
}

// The sender pressed Send.
export function recordSend({ cid, gameKey, num, day, fig, source }) {
  if (!cid || !gameKey) return;
  post('/api/challenge/send', { cid, gameKey, num, day, fig, source });
  try { window.dispatchEvent(new Event('sot:challenge-sent')); } catch (e) { /* nothing listening */ }
  dropMineCache();
}

// The receiver landed on /vs. Kept for the TAB, like the vs payload itself.
export function recordOpen(gameKey, cid) {
  if (!cid || !gameKey || typeof window === 'undefined') return;
  try { sessionStorage.setItem(CID_KEY(gameKey), cid); } catch (e) { /* private window */ }
  post('/api/challenge/open', { cid });
}

export function readCid(gameKey) {
  if (typeof window === 'undefined' || !gameKey) return null;
  try {
    const m = /[?&]c=([a-z0-9]{6,16})(?:&|#|$)/.exec(window.location.search);
    if (m) { try { sessionStorage.setItem(CID_KEY(gameKey), m[1]); } catch (e) { /* ignore */ } return m[1]; }
    return sessionStorage.getItem(CID_KEY(gameKey)) || null;
  } catch (e) { return null; }
}

// The receiver finished. Once per cid per browser.
export function reportTake(gameKey, fig, outcome) {
  const cid = readCid(gameKey);
  if (!cid || !fig) return;
  try {
    if (localStorage.getItem(DONE_KEY(cid))) return;
    localStorage.setItem(DONE_KEY(cid), '1');
  } catch (e) { /* still post; the server dedupes */ }
  post('/api/challenge/take', { cid, fig, outcome });
}

// ── the sender's view, shared by every surface on a page ────────────────────
let mineMemo = null;
const MINE_TTL = 60 * 1000;
export function dropMineCache() { mineMemo = null; }

export function fetchMine({ force = false } = {}) {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (!force && mineMemo && Date.now() - mineMemo.at < MINE_TTL) return mineMemo.p;
  const w = who();
  const q = new URLSearchParams();
  if (w.anonId) q.set('anonId', w.anonId);
  if (w.email) q.set('email', w.email);
  const p = fetch('/api/challenge/mine?' + q.toString(), { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  mineMemo = { at: Date.now(), p };
  return p;
}

export function markSeen(ids) {
  const list = (ids || []).filter(Boolean);
  if (!list.length) return;
  post('/api/challenge/seen', { ids: list });
  try { list.forEach((id) => localStorage.setItem(`sot_vsc_seen_${id}`, '1')); } catch (e) { /* ignore */ }
}
export function seenLocally(id) {
  try { return !!localStorage.getItem(`sot_vsc_seen_${id}`); } catch (e) { return false; }
}

// Every finished take on the viewer's challenges, newest first.
export function finishedTakes(data) {
  const out = [];
  for (const c of (data && data.challenges) || []) {
    for (const t of c.takes || []) {
      if (t.finishedAt) out.push({ ...t, challenge: c });
    }
  }
  return out.sort((a, b) => String(b.finishedAt).localeCompare(String(a.finishedAt)));
}

export function challengeTotals(data) {
  const ch = (data && data.challenges) || [];
  let opened = 0; let played = 0; let won = 0; let lost = 0; let tied = 0;
  for (const c of ch) {
    if ((c.takes || []).length) opened += 1;
    for (const t of c.takes || []) {
      if (!t.finishedAt) continue;
      played += 1;
      // outcome is the TAKER's: their loss is the sender's win.
      if (t.outcome === 'loss') won += 1; else if (t.outcome === 'win') lost += 1; else tied += 1;
    }
  }
  return { sent: ch.length, opened, played, won, lost, tied };
}
