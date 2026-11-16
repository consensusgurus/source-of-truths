// lib/dash-engine.js: the model for Dash, the daily delivery puzzle. Shared by the
// client (app/dash/DashClient.jsx), the generator (scripts/gen-dash.mjs) and the
// checker (scripts/verify-dash.mjs).
//
// A town is a grid of streets, W by H corners. The shift runs from minute 0 (shown
// as 6:00) to `end`. Every block takes PER minutes and every stop (a pickup or a
// drop-off) takes STAY. The bag holds `cap` orders. An order is
//   { n, e, r: [x, y], h: [x, y], tip, ready, by }
// the restaurant's name and picture, the restaurant's corner, the house's corner,
// the full tip in dollars, the minute the food is ready (arrive early and you
// wait) and the minute it stays hot until. A drop-off after `by` loses LATE_PER
// dollars of the tip for every LATE_MIN minutes, never below nothing. Nothing can
// be picked up that could not reach its door by `end`, and nothing is dropped
// after `end`.
//
// A shift is a list of TAPS: the index of an order. The first tap of an order
// drives to its restaurant and picks it up; the second drives to its house and
// drops it off. So one array of order indices is the whole state.
export const PER = 2, STAY = 2, LATE_MIN = 2, LATE_PER = 1, T0 = 18 * 60;
const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
export const tipAt = (o, t) => Math.max(0, o.tip - Math.ceil(Math.max(0, t - o.by) / LATE_MIN) * LATE_PER);
export const clock = (m) => { const a = T0 + m, h = Math.floor(a / 60) % 24; return `${h % 12 === 0 ? 12 : h % 12}:${String(a % 60).padStart(2, '0')}`; };
export const offer = (P) => P.orders.reduce((s, o) => s + o.tip, 0);

// What tapping order i would do from a state: { kind: 'pick' | 'drop', t, to, tip, wait }
// or { kind: 'no', why: 'full' | 'late' | 'end' } or { kind: 'done' }.
export function next(P, w, i) {
  const o = P.orders[i];
  if (w.del[i]) return { kind: 'done' };
  if (w.bag.includes(i)) {
    const t = w.t + dist(w.pos, o.h) * PER + STAY;
    return t > P.end ? { kind: 'no', why: 'end' } : { kind: 'drop', t, to: o.h, tip: tipAt(o, t) };
  }
  if (w.bag.length >= P.cap) return { kind: 'no', why: 'full' };
  const arrive = w.t + dist(w.pos, o.r) * PER, t = Math.max(arrive, o.ready) + STAY;
  if (t + dist(o.r, o.h) * PER + STAY > P.end) return { kind: 'no', why: 'late' };
  return { kind: 'pick', t, to: o.r, wait: Math.max(0, o.ready - arrive) };
}

// Drive a list of taps. A tap that cannot be made is skipped (and counted in `skipped`).
export function walk(P, taps) {
  const w = { pos: P.start, t: 0, bag: [], picked: [], del: {}, earn: 0, blocks: 0, pts: [P.start], legs: [], skipped: 0 };
  for (const i of taps || []) {
    const n = P.orders[i] ? next(P, w, i) : { kind: 'no' };
    if (n.kind !== 'pick' && n.kind !== 'drop') { w.skipped++; continue; }
    w.blocks += dist(w.pos, n.to);
    if (w.pos[0] !== n.to[0] && w.pos[1] !== n.to[1]) w.pts.push([n.to[0], w.pos[1]]);
    w.pts.push(n.to); w.pos = n.to; w.t = n.t;
    if (n.kind === 'pick') { w.bag = w.bag.concat(i); w.picked.push(i); w.legs.push({ i, kind: 'pick', t: n.t, wait: n.wait }); }
    else { w.bag = w.bag.filter((x) => x !== i); w.del[i] = { t: n.t, tip: n.tip }; w.earn += n.tip; w.legs.push({ i, kind: 'drop', t: n.t, tip: n.tip }); }
  }
  w.count = Object.keys(w.del).length;
  return w;
}
export const anyMove = (P, w) => P.orders.some((_, i) => { const k = next(P, w, i).kind; return k === 'pick' || k === 'drop'; });

// The best shift, by search over every state (place, minute, what is in the bag, what
// has been picked up). Returns { best, sol } with sol a list of taps. `cap` can be
// overridden to ask what a smaller bag would make.
export function solve(P, cap = P.cap) {
  const N = P.orders.length, memo = new Map();
  const place = (k) => (k === 0 ? P.start : k <= N ? P.orders[k - 1].r : P.orders[k - 1 - N].h);
  const go = (k, t, bag, picked) => {
    const key = ((k * 128 + t) * 1024 + bag) * 1024 + picked;
    const hit = memo.get(key); if (hit) return hit;
    let best = 0, move = -1; const pos = place(k); let held = 0;
    for (let i = 0; i < N; i++) if (bag >> i & 1) held++;
    for (let i = 0; i < N; i++) {
      const o = P.orders[i];
      if (bag >> i & 1) {
        const nt = t + dist(pos, o.h) * PER + STAY; if (nt > P.end) continue;
        const v = tipAt(o, nt) + go(1 + N + i, nt, bag & ~(1 << i), picked)[0];
        if (v > best) { best = v; move = i; }
      } else if (!(picked >> i & 1) && held < cap) {
        const nt = Math.max(t + dist(pos, o.r) * PER, o.ready) + STAY; if (nt + dist(o.r, o.h) * PER + STAY > P.end) continue;
        const v = go(1 + i, nt, bag | 1 << i, picked | 1 << i)[0];
        if (v > best) { best = v; move = i; }
      }
    }
    const out = [best, move]; memo.set(key, out); return out;
  };
  const sol = []; let k = 0, t = 0, bag = 0, picked = 0;
  const best = go(0, 0, 0, 0)[0];
  for (;;) {
    const [, i] = go(k, t, bag, picked); if (i < 0) break;
    const o = P.orders[i]; sol.push(i);
    if (bag >> i & 1) { t = t + dist(place(k), o.h) * PER + STAY; k = 1 + N + i; bag &= ~(1 << i); }
    else { t = Math.max(t + dist(place(k), o.r) * PER, o.ready) + STAY; k = 1 + i; bag |= 1 << i; picked |= 1 << i; }
  }
  return { best, sol };
}

// ---- the Tip Ladder ----
// Ranked on dollars short of the best possible shift.
export const RUNGS = ['Five Stars', 'Top Earner', 'Rush Hour Pro', 'Regular', 'Side Hustle', 'Slow Night', 'Cold Fries', 'Wrong Address'];
export const BOUNDS = [0, 2, 4, 7, 11, 16, 22];
export function rankOf(short) {
  let at = BOUNDS.findIndex((x) => short <= x); if (at < 0) at = RUNGS.length - 1;
  const rows = RUNGS.map((name, i) => {
    const lo = i === 0 ? 0 : BOUNDS[i - 1] + 1, hi = i < BOUNDS.length ? BOUNDS[i] : null;
    return { name, label: i === 0 ? 'The best possible shift' : hi == null ? `$${lo} or more short` : `Up to $${hi} short` };
  });
  return { rows, at };
}
