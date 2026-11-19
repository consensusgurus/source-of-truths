'use client';
// Browser helpers shared by every community surface: the pages under
// /community and the bands and Talk tab on the endings (owner, 2026-11-18).
import { readIdentity, etTodayIso, suffixOfIso } from '../groups/GroupsShell';

export function todaySuffix() { return suffixOfIso(etTodayIso()); }

function idParams() {
  const me = readIdentity();
  const q = new URLSearchParams();
  if (me.anonId) q.set('anonId', me.anonId);
  if (me.email) q.set('email', me.email);
  return q;
}

// The public summary, shared by every band on the page for 30 seconds, so the
// cap pill, the end card and the results sheet make one request between them.
let sumAt = 0; let sumP = null; const sumGame = new Map();
export function fetchSummary(game) {
  const now = Date.now();
  if (game) {
    const hit = sumGame.get(game);
    if (hit && now - hit.at < 30000) return hit.p;
    const p = fetch(`/api/community/summary?game=${encodeURIComponent(game)}`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    sumGame.set(game, { at: now, p });
    return p;
  }
  if (sumP && now - sumAt < 30000) return sumP;
  sumAt = now;
  sumP = fetch('/api/community/summary').then((r) => (r.ok ? r.json() : null)).catch(() => null);
  return sumP;
}

export async function getTalk(game, day) {
  const q = idParams();
  q.set('game', game);
  if (day) q.set('date', day);
  try {
    const r = await fetch(`/api/community/talk?${q.toString()}`, { cache: 'no-store' });
    return await r.json();
  } catch (e) { return { failed: true }; }
}

async function post(url, payload) {
  const me = readIdentity();
  try {
    const r = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anonId: me.anonId, email: me.email || undefined, ...payload }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return { error: d.error || 'That did not work. Try again.', code: d.code, status: r.status };
    return d;
  } catch (e) { return { error: 'Could not reach the server. Check your connection and try again.' }; }
}

export function talkAction(game, day, action, extra = {}) {
  return post('/api/community/talk', { action, game, date: day, ...extra });
}

export async function getIdeas({ stage, kind, sort } = {}) {
  const q = idParams();
  if (stage) q.set('stage', stage);
  if (kind) q.set('kind', kind);
  if (sort) q.set('sort', sort);
  try {
    const r = await fetch(`/api/community/ideas?${q.toString()}`, { cache: 'no-store' });
    return await r.json();
  } catch (e) { return { failed: true }; }
}

export function ideaAction(action, extra = {}) { return post('/api/community/ideas', { action, ...extra }); }

export function ago(iso) {
  const t = Date.parse(iso || '');
  if (!t) return '';
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function talkHref(game, day) {
  return `/community/talk/${encodeURIComponent(game)}${day && day !== todaySuffix() ? `?date=${encodeURIComponent(day)}` : ''}`;
}
export function suggestHref(game) {
  return `/community/ideas?pitch=variation&game=${encodeURIComponent(game)}`;
}
