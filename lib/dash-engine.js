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
// wait) and the minute it stays good until (hot, fresh, cold or frozen: see KINDS). A drop-off after `by` loses LATE_PER
// dollars of the tip for every LATE_MIN minutes, never below nothing. Nothing can
// be picked up that could not reach its door by `end`, and nothing is dropped
// after `end`.
//
// A shift is a list of TAPS: the index of an order. The first tap of an order
// drives to its restaurant and picks it up; the second drives to its house and
// drops it off. So one array of order indices is the whole state.
export const PER = 2, STAY = 2, LATE_MIN = 2, LATE_PER = 1, T0 = 18 * 60;

// WHAT AN ORDER IS (owner, 2026-11-15: "Why do all say hot until when not all are hot and some
// are cold / frozen?"). The kind is read off the picture, so every board ever dealt has one,
// and it only changes the words: Hot until, Fresh until, Cold until, Frozen until.
export const KINDS = {
  hot: ['🍕', '🍔', '🌮', '🍜', '🍗', '🍛', '🥟', '🌯', '🍝', '🥙', '🍟', '🧇', '🍲'],
  fresh: ['🍣', '🥗', '🥪', '🍱', '🍩', '🥯'],
  cold: ['🥤', '🧋'],
  frozen: ['🍨', '🍦', '🍧'],
};
const KIND_OF = Object.fromEntries(Object.entries(KINDS).flatMap(([k, list]) => list.map((e) => [e, k])));
export const kindOf = (o) => KIND_OF[o.e] || 'hot';
export const UNTIL = { hot: 'Hot until', fresh: 'Fresh until', cold: 'Cold until', frozen: 'Frozen until' };
// what a late one turned into, for the note under the map
export const SPOILT = { hot: 'arrived cold', fresh: 'arrived past its best', cold: 'arrived warm', frozen: 'arrived melting' };

// THE TOWN IS NOT ALWAYS A PLAIN GRID (owner, 2026-11-15: "maybe make the grid a bit more
// complicated? Not just a grid?"). A board may carry three kinds of feature, and a board with
// none of them (boards 1 and 2, dealt before this) is a plain grid exactly as before:
//   river  { axis: 'h' | 'v', at, bridges: [..] }   water between corner rows (or columns) `at`
//          and `at + 1`; the only streets across it are the bridges (their x, or y for 'v')
//   parks  [[bx, by, bw, bh], ..]   blocks merged into one park; the streets inside it are gone,
//          and so is the corner in the middle of a two by two park
//   diag   [[x1, y1, x2, y2], ..]   an avenue cutting corner to corner; each step is one block
// Every street, bridge and avenue step costs the same PER minutes, so distance is the number
// of steps on the shortest way, found breadth-first.
export const isPlain = (P) => !P.river && !(P.parks && P.parks.length) && !(P.diag && P.diag.length);
const manhattan = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
const gmemo = new WeakMap();
function graph(P) {
  if (gmemo.has(P)) return gmemo.get(P);
  const { W, H } = P, id = (x, y) => y * W + x, shut = new Set();
  const cut = (a, b) => { shut.add(`${a}|${b}`); shut.add(`${b}|${a}`); };
  if (P.river) {
    const { axis, at, bridges } = P.river;
    if (axis === 'h') { for (let x = 0; x < W; x++) if (!bridges.includes(x)) cut(id(x, at), id(x, at + 1)); }
    else for (let y = 0; y < H; y++) if (!bridges.includes(y)) cut(id(at, y), id(at + 1, y));
  }
  for (const [bx, by, bw, bh] of P.parks || []) {
    for (let x = bx + 1; x < bx + bw; x++) for (let y = by; y < by + bh; y++) cut(id(x, y), id(x, y + 1));
    for (let y = by + 1; y < by + bh; y++) for (let x = bx; x < bx + bw; x++) cut(id(x, y), id(x + 1, y));
  }
  const adj = Array.from({ length: W * H }, () => []), segs = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (x + 1 < W && !shut.has(`${id(x, y)}|${id(x + 1, y)}`)) { adj[id(x, y)].push(id(x + 1, y)); adj[id(x + 1, y)].push(id(x, y)); segs.push([x, y, x + 1, y]); }
    if (y + 1 < H && !shut.has(`${id(x, y)}|${id(x, y + 1)}`)) { adj[id(x, y)].push(id(x, y + 1)); adj[id(x, y + 1)].push(id(x, y)); segs.push([x, y, x, y + 1]); }
  }
  for (const [a, b, c, d] of P.diag || []) { adj[id(a, b)].push(id(c, d)); adj[id(c, d)].push(id(a, b)); segs.push([a, b, c, d]); }
  const g = { adj, segs, from: new Map() };
  gmemo.set(P, g); return g;
}
// every street, bridge and avenue step on the board: [x1, y1, x2, y2]
export const segments = (P) => graph(P).segs;
function reach(P, a) {
  const g = graph(P), k = a[1] * P.W + a[0];
  if (g.from.has(k)) return g.from.get(k);
  const d = new Array(P.W * P.H).fill(Infinity), prev = new Array(P.W * P.H).fill(-1), q = [k]; d[k] = 0;
  for (let h = 0; h < q.length; h++) for (const n of g.adj[q[h]]) if (d[n] === Infinity) { d[n] = d[q[h]] + 1; prev[n] = q[h]; q.push(n); }
  const out = { d, prev }; g.from.set(k, out); return out;
}
// blocks between two corners (Infinity when there is no way)
export const blocks = (P, a, b) => (isPlain(P) ? manhattan(a, b) : reach(P, a).d[b[1] * P.W + b[0]]);
// the corners driven through from a to b, both ends included
export function pathBetween(P, a, b) {
  if (isPlain(P)) return a[0] !== b[0] && a[1] !== b[1] ? [a, [b[0], a[1]], b] : [a, b];
  const { prev, d } = reach(P, a), out = []; let k = b[1] * P.W + b[0];
  if (d[k] === Infinity) return [a, b];
  for (; k >= 0; k = prev[k]) out.push([k % P.W, Math.floor(k / P.W)]);
  return out.reverse();
}
export const tipAt = (o, t) => Math.max(0, o.tip - Math.ceil(Math.max(0, t - o.by) / LATE_MIN) * LATE_PER);
export const clock = (m) => { const a = T0 + m, h = Math.floor(a / 60) % 24; return `${h % 12 === 0 ? 12 : h % 12}:${String(a % 60).padStart(2, '0')}`; };
export const offer = (P) => P.orders.reduce((s, o) => s + o.tip, 0);

// What tapping order i would do from a state: { kind: 'pick' | 'drop', t, to, tip, wait }
// or { kind: 'no', why: 'full' | 'late' | 'end' } or { kind: 'done' }.
export function next(P, w, i) {
  const o = P.orders[i];
  if (w.del[i]) return { kind: 'done' };
  if (w.bag.includes(i)) {
    const t = w.t + blocks(P, w.pos, o.h) * PER + STAY;
    return t > P.end ? { kind: 'no', why: 'end' } : { kind: 'drop', t, to: o.h, tip: tipAt(o, t) };
  }
  if (w.bag.length >= P.cap) return { kind: 'no', why: 'full' };
  const arrive = w.t + blocks(P, w.pos, o.r) * PER, t = Math.max(arrive, o.ready) + STAY;
  if (t + blocks(P, o.r, o.h) * PER + STAY > P.end) return { kind: 'no', why: 'late' };
  return { kind: 'pick', t, to: o.r, wait: Math.max(0, o.ready - arrive) };
}

// Drive a list of taps. A tap that cannot be made is skipped (and counted in `skipped`).
export function walk(P, taps) {
  const w = { pos: P.start, t: 0, bag: [], picked: [], del: {}, earn: 0, blocks: 0, pts: [P.start], legs: [], skipped: 0 };
  for (const i of taps || []) {
    const n = P.orders[i] ? next(P, w, i) : { kind: 'no' };
    if (n.kind !== 'pick' && n.kind !== 'drop') { w.skipped++; continue; }
    w.blocks += blocks(P, w.pos, n.to);
    for (const c of pathBetween(P, w.pos, n.to).slice(1)) w.pts.push(c);
    w.pos = n.to; w.t = n.t;
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
  const D = Array.from({ length: 2 * N + 1 }, (_, a) => Array.from({ length: 2 * N + 1 }, (_, b) => blocks(P, place(a), place(b))));
  const go = (k, t, bag, picked) => {
    const key = ((k * 128 + t) * 1024 + bag) * 1024 + picked;
    const hit = memo.get(key); if (hit) return hit;
    let best = 0, move = -1, held = 0;
    for (let i = 0; i < N; i++) if (bag >> i & 1) held++;
    for (let i = 0; i < N; i++) {
      const o = P.orders[i];
      if (bag >> i & 1) {
        const nt = t + D[k][1 + N + i] * PER + STAY; if (nt > P.end) continue;
        const v = tipAt(o, nt) + go(1 + N + i, nt, bag & ~(1 << i), picked)[0];
        if (v > best) { best = v; move = i; }
      } else if (!(picked >> i & 1) && held < cap) {
        const nt = Math.max(t + D[k][1 + i] * PER, o.ready) + STAY; if (nt + D[1 + i][1 + N + i] * PER + STAY > P.end) continue;
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
    if (bag >> i & 1) { t = t + D[k][1 + N + i] * PER + STAY; k = 1 + N + i; bag &= ~(1 << i); }
    else { t = Math.max(t + D[k][1 + i] * PER, o.ready) + STAY; k = 1 + i; bag |= 1 << i; picked |= 1 << i; }
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
