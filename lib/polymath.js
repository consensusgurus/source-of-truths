// POLYMATH (owner, 2026-10-19): one title for the day's three gauntlets.
//
// A LENS, NEVER A NEW SCORE. The Trivia, Math and English Gauntlets are played
// exactly as they always were and each files its ordinary rows. Polymath reads
// the three circuit boards (questions right per run) and combines them here, so
// nothing is stored, no IQ Points move and no gauntlet board changes.
//
// THE LEGS ARE WEIGHTED THE SAME (owner, 2026-10-19: "weight the legs
// consistently"). Each run is scored 0 to 100 against its OWN top title's mark,
// read off lib/run-titles.js (95 right on Trivia, 80 on Math, 44 on English
// today), so the hardest run is not structurally behind and no raw denominator
// is ever shown. A leg past its mark is capped at 100. The Polymath score is the
// average of the three, rounded; the combined clock breaks ties. A player ranks
// only once all three are finished that day.
//
// THE TIERS ARE PROVISIONAL, like every run ladder: set by hand before any
// Polymath scores existed, to be recut once real ones do. Change them here and
// nowhere else.

import { titleLadder, titleFor } from './run-titles';

const topMark = (id) => {
  const l = titleLadder(id);
  return l && l.length ? l[l.length - 1].min : 1;
};

export const POLY_LEGS = [
  { id: 'gauntlet', name: 'Trivia Gauntlet', short: 'Trivia', href: '/trivia', cat: 'Trivia', glyph: '?' },
  { id: 'math', name: 'Math Gauntlet', short: 'Math', href: '/math', cat: 'Numbers', glyph: '+' },
  { id: 'english', name: 'English Gauntlet', short: 'English', href: '/english', cat: 'Word', glyph: 'Aa' },
].map((l) => ({ ...l, get mark() { return topMark(l.id); } }));

export const POLY_IDS = POLY_LEGS.map((l) => l.id);

export const POLY_TIERS = [
  { min: 0, name: 'Dabbler', line: 'A toe in every pool.', colour: '#e9edf4' },
  { min: 25, name: 'Apprentice', line: 'Learning three trades at once.', colour: '#7dd3fc' },
  { min: 45, name: 'Journeyman', line: 'Steady hands in every subject.', colour: '#6ee7b7' },
  { min: 60, name: 'Scholar', line: 'Well read, well counted, well spoken.', colour: '#e8b43a' },
  { min: 75, name: 'Savant', line: 'The rare mind that does it all.', colour: '#fb923c' },
  { min: 90, name: 'Polymath', line: 'Trivia, math and English, all at the top.', colour: '#e879f9' },
];

// One leg's points: questions right against that run's top mark, 0 to 100.
export function legPoints(id, right) {
  const m = topMark(id);
  const r = Math.max(0, Number(right) || 0);
  return Math.round(Math.min(100, (r / m) * 100));
}

// The day's score from the three legs' points (all three must be in).
export function polyScore(points) {
  const p = (points || []).map((x) => Number(x));
  if (p.length !== POLY_LEGS.length || p.some((x) => !Number.isFinite(x))) return null;
  return Math.round(p.reduce((a, b) => a + b, 0) / p.length);
}

export function tierIndex(score) {
  const s = Math.max(0, Number(score) || 0);
  let at = 0;
  POLY_TIERS.forEach((t, i) => { if (s >= t.min) at = i; });
  return at;
}

// { ...tier, index, next, toNext } for a score, like titleFor.
export function tierFor(score) {
  const i = tierIndex(score);
  const next = POLY_TIERS[i + 1] || null;
  const s = Math.max(0, Math.round(Number(score) || 0));
  return { ...POLY_TIERS[i], index: i, next, toNext: next ? next.min - s : 0 };
}

export function tierRange(i) {
  const t = POLY_TIERS[i];
  const next = POLY_TIERS[i + 1];
  return next ? `${t.min} to ${next.min - 1}` : `${t.min} to 100`;
}

// The leg's own run title for a right count (the gauntlet's ladder name).
export const legTitle = (id, right) => {
  const t = titleFor(id, right);
  return t ? t.name : '';
};

// ── This device's legs, read off each run's own store ───────────────────────
// sot_run_<id>_<day> is the run client's save; phase 'done' is a finished run
// and results[].score sums to its questions right (banked games included).
// Nothing here makes a request, so the home tile and the run's finish can draw
// the meter instantly; the rank comes from /api/quiz/polymath.

export function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export function localLeg(id, day = etToday()) {
  try {
    const run = JSON.parse(localStorage.getItem(`sot_run_${id}_${day}`) || 'null');
    if (!run || !run.phase || run.phase === 'idle') return { id, state: 'none', right: 0 };
    const right = (run.results || []).reduce((a, x) => a + (Number(x && x.score) || 0), 0);
    if (run.phase === 'done') return { id, state: run.practice ? 'none' : 'done', right };
    return { id, state: 'started', right };
  } catch (e) { return { id, state: 'none', right: 0 }; }
}

export function localPolymath(day = etToday(), override = null) {
  const legs = POLY_LEGS.map((l) => {
    const o = override && override.id === l.id ? { id: l.id, state: 'done', right: override.right } : localLeg(l.id, day);
    return { ...o, points: o.state === 'done' ? legPoints(l.id, o.right) : null };
  });
  const done = legs.filter((x) => x.state === 'done').length;
  const score = done === legs.length ? polyScore(legs.map((x) => x.points)) : null;
  return { legs, done, score, tier: score == null ? null : tierFor(score) };
}

// ── The share link ──────────────────────────────────────────────────────────
// /polymath?s=75-65-70&t=70&d=2026-10-19 : each leg's points, the score, the
// day. It names no question and no answer. The page's share card reads it.
export function shareQuery(points, score, day) {
  const s = (points || []).map((p) => (p == null ? 'x' : Math.round(p))).join('-');
  const q = new URLSearchParams();
  q.set('s', s);
  if (score != null) q.set('t', String(Math.round(score)));
  if (day) q.set('d', day);
  return q.toString();
}

export function parseShare(sp) {
  const s = String((sp && sp.s) || '');
  if (!/^(\d{1,3}|x)(-(\d{1,3}|x)){2}$/.test(s)) return null;
  const points = s.split('-').map((x) => (x === 'x' ? null : Math.min(100, Number(x))));
  const tRaw = String((sp && sp.t) || '');
  const score = /^\d{1,3}$/.test(tRaw) ? Math.min(100, Number(tRaw)) : polyScore(points);
  const dRaw = String((sp && sp.d) || '');
  const day = /^\d{4}-\d{2}-\d{2}$/.test(dRaw) ? dRaw : null;
  return { points, score, day };
}
