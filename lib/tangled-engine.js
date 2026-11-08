// lib/tangled-engine.js — the rules and the board maker for Tangled, the daily
// rope untangling puzzle (owner, 2026-11-07). Shared by the client
// (app/tangled/TangledBoard.jsx), the bank generator (scripts/gen-tangled.mjs)
// and the verifier (scripts/verify-tangled.mjs), so all three agree.
//
// THE GAME. Holes sit evenly round the edge of a frame whose shape changes every
// day. Each rope runs from one hole to another; there are always exactly two
// empty holes. Move a rope end into an empty hole. The board is solved when no
// two ropes cross. Ranked on time alone.
//
// CROSSING IS PURE COMBINATORICS. Every hole is on the outline of a convex
// shape (the polygon sides are bowed out a little, BULGE, so no three holes ever
// sit in a line), so two straight ropes cross exactly when their ends
// interleave round the edge. crosses() is that test, and it is the only test
// the game, the generator and the verifier use. The picture is drawn to match.
//
// EVERY BOARD IS SOLVABLE BY CONSTRUCTION: it starts as a random non-crossing
// matching and is scrambled backward by legal moves, so the moves played in
// reverse untangle it.

export const SHAPE_ORDER = ['circle', 'hexagon', 'square', 'triangle', 'rectangle', 'diamond', 'pentagon'];
export const SHAPE_NAME = { circle: 'Circle', hexagon: 'Hexagon', square: 'Square', triangle: 'Triangle', rectangle: 'Rectangle', diamond: 'Diamond', pentagon: 'Pentagon' };
// Ropes by weekday, Sunday first: Mon 4, Tue and Wed 5, Thu and Fri 6, Sat 7, Sun 8.
export const ROPES_BY_DOW = [8, 4, 5, 5, 6, 6, 7];
// The least number of crossing pairs a board starts with, by rope count.
export const MIN_CROSS = { 4: 4, 5: 6, 6: 8, 7: 9, 8: 11 };
export const CX = 200, CY = 200, RAD = 156;
export const BULGE = 0.025;
// The peg colours (site pastels). A rope's two pegs never share one.
export const PEG_PASTELS = ['#f6d58a', '#a9d8f2', '#f4b5c4', '#cfe6a0', '#b8c0f2', '#f8c4a4', '#a8e2cf', '#d6bdf0'];

export function hash(s) {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return h >>> 0;
}
export function rng32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function polyVerts(shape) {
  const v = [];
  let n, start, r = 1, dy = 0;
  if (shape === 'square') return [[-0.86, -0.86], [0.86, -0.86], [0.86, 0.86], [-0.86, 0.86]].map((p) => ({ x: CX + p[0] * RAD, y: CY + p[1] * RAD }));
  if (shape === 'rectangle') return [[-1.02, -0.62], [1.02, -0.62], [1.02, 0.62], [-1.02, 0.62]].map((p) => ({ x: CX + p[0] * RAD, y: CY + p[1] * RAD }));
  if (shape === 'diamond') { n = 4; start = -90; }
  if (shape === 'hexagon') { n = 6; start = -90; }
  if (shape === 'pentagon') { n = 5; start = -90; dy = 10; }
  if (shape === 'triangle') { n = 3; start = -90; r = 1.13; dy = 26; }
  for (let k = 0; k < n; k++) {
    const a = ((start + (k * 360) / n) * Math.PI) / 180;
    v.push({ x: CX + Math.cos(a) * RAD * r, y: CY + dy + Math.sin(a) * RAD * r });
  }
  return v;
}
function polyGeom(shape) {
  const v = polyVerts(shape), seg = [];
  let L = 0;
  for (let i = 0; i < v.length; i++) {
    const a = v[i], b = v[(i + 1) % v.length], d = Math.hypot(b.x - a.x, b.y - a.y);
    seg.push({ a, b, d, s: L }); L += d;
  }
  const c = { x: v.reduce((t, p) => t + p.x, 0) / v.length, y: v.reduce((t, p) => t + p.y, 0) / v.length };
  return { seg, L, c };
}
// u in [0,1): a point on the outline; a polygon side is pushed out as a shallow parabola.
function shapePoint(shape, u, geo) {
  if (shape === 'circle') { const a = ((-90 + u * 360) * Math.PI) / 180; return { x: CX + Math.cos(a) * RAD, y: CY + Math.sin(a) * RAD }; }
  const { seg, L, c } = geo;
  const s = (u * L) % L;
  const g = seg.find((q) => s >= q.s && s < q.s + q.d) || seg[seg.length - 1];
  const t = (s - g.s) / g.d, px = g.a.x + (g.b.x - g.a.x) * t, py = g.a.y + (g.b.y - g.a.y) * t;
  let nx = (g.b.y - g.a.y) / g.d, ny = -(g.b.x - g.a.x) / g.d;
  if (nx * (px - c.x) + ny * (py - c.y) < 0) { nx = -nx; ny = -ny; }
  const off = BULGE * g.d * 4 * t * (1 - t);
  return { x: px + nx * off, y: py + ny * off };
}
// The H hole positions, in order round the edge.
export function holes(shape, n) {
  const geo = shape === 'circle' ? null : polyGeom(shape), pts = [];
  for (let k = 0; k < n; k++) pts.push(shapePoint(shape, (k + 0.5) / n, geo));
  return pts;
}
// The frame outline as an SVG path (null for the circle, drawn as a circle).
export function framePath(shape) {
  if (shape === 'circle') return null;
  const geo = polyGeom(shape), N = 360, o = [];
  for (let k = 0; k < N; k++) { const p = shapePoint(shape, k / N, geo); o.push(`${p.x.toFixed(1)} ${p.y.toFixed(1)}`); }
  return `M${o.join(' L')} Z`;
}

function between(x, a, b) { return a < b ? (x > a && x < b) : (x > a || x < b); }
export function crosses(r1, r2) { const [a, b] = r1, [c, d] = r2; return between(c, a, b) !== between(d, a, b); }
export function crossPairs(ropes) {
  const out = [];
  for (let i = 0; i < ropes.length; i++) for (let j = i + 1; j < ropes.length; j++) if (crosses(ropes[i], ropes[j])) out.push([i, j]);
  return out;
}
export const isSolved = (ropes) => crossPairs(ropes).length === 0;
export function emptyHoles(ropes, H) {
  const o = new Set(ropes.flat()), out = [];
  for (let h = 0; h < H; h++) if (!o.has(h)) out.push(h);
  return out;
}
// A legal board: every rope two distinct holes, no hole used twice, two left empty.
export function legal(ropes, H) {
  const seen = new Set();
  for (const r of ropes) {
    if (!Array.isArray(r) || r.length !== 2) return false;
    for (const h of r) { if (!Number.isInteger(h) || h < 0 || h >= H || seen.has(h)) return false; seen.add(h); }
  }
  return seen.size === H - 2;
}

export function segX(p1, p2, p3, p4) {
  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
  if (Math.abs(d) < 1e-6) return null;
  const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
  if (t <= 0 || t >= 1) return null;
  return { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t };
}
// How cleanly the crossings are spread out (bigger is better).
function spread(ropes, pos) {
  const X = [];
  let g = 1e9;
  for (let i = 0; i < ropes.length; i++) for (let j = i + 1; j < ropes.length; j++) {
    const q = segX(pos[ropes[i][0]], pos[ropes[i][1]], pos[ropes[j][0]], pos[ropes[j][1]]);
    if (q) X.push({ q, i, j });
  }
  for (let a = 0; a < X.length; a++) for (let b = a + 1; b < X.length; b++) g = Math.min(g, Math.hypot(X[a].q.x - X[b].q.x, X[a].q.y - X[b].q.y) / 30);
  for (const c of X) for (let k = 0; k < ropes.length; k++) {
    if (k === c.i || k === c.j) continue;
    const A = pos[ropes[k][0]], B = pos[ropes[k][1]], dx = B.x - A.x, dy = B.y - A.y, L2 = dx * dx + dy * dy;
    let t = ((c.q.x - A.x) * dx + (c.q.y - A.y) * dy) / L2; t = Math.max(0, Math.min(1, t));
    g = Math.min(g, Math.hypot(A.x + dx * t - c.q.x, A.y + dy * t - c.q.y) / 20);
  }
  for (const c of X) for (const p of pos) g = Math.min(g, Math.hypot(p.x - c.q.x, p.y - c.q.y) / 26);
  return g;
}
// How many rope pairs would wind into two-strand cords (the board's own rule).
export function twistCount(ropes, pos) {
  const C = ropes.map((rp) => { const a = pos[rp[0]], b = pos[rp[1]], L = Math.hypot(b.x - a.x, b.y - a.y) || 1; return { a, b, L, dx: (b.x - a.x) / L, dy: (b.y - a.y) / L }; });
  const c = [];
  for (let i = 0; i < C.length; i++) for (let j = i + 1; j < C.length; j++) {
    const q = segX(C[i].a, C[i].b, C[j].a, C[j].b); if (!q) continue;
    const si = Math.hypot(q.x - C[i].a.x, q.y - C[i].a.y), sj = Math.hypot(q.x - C[j].a.x, q.y - C[j].a.y);
    const room = Math.min(si, C[i].L - si, sj, C[j].L - sj) - 30, cos = Math.abs(C[i].dx * C[j].dx + C[i].dy * C[j].dy);
    if (room > 30 && cos > 0.5) c.push({ i, j, sc: room * (0.6 + cos) });
  }
  const used = new Set();
  let n = 0;
  c.sort((p, q) => q.sc - p.sc).forEach((t) => { if (used.has(t.i) || used.has(t.j)) return; used.add(t.i); used.add(t.j); n++; });
  return n;
}

// The day's frame and size off its ISO date: shapes cycle by day of the year.
export function dayParams(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = Date.UTC(y, m - 1, d);
  const doy = Math.round((dt - Date.UTC(y, 0, 0)) / 864e5);
  const dow = new Date(dt).getUTCDay();
  return { shape: SHAPE_ORDER[doy % SHAPE_ORDER.length], R: ROPES_BY_DOW[dow], dow };
}

// One board: a random non-crossing matching, scrambled backward by legal
// moves; of every tangled state reached, the one whose crossings sit furthest
// apart and that winds the most cords is kept.
export function generate(seed, R, shape) {
  const rnd = rng32(hash(seed));
  const H = 2 * R + 2;
  const pos = holes(shape, H);
  const e1 = Math.floor(rnd() * H);
  let e2; do { e2 = Math.floor(rnd() * H); } while (e2 === e1);
  const L = [];
  for (let i = 0; i < H; i++) if (i !== e1 && i !== e2) L.push(i);
  const stack = [], pairs = [];
  let opens = R;
  for (let i = 0; i < L.length; i++) {
    let open;
    if (!stack.length) open = true; else if (!opens) open = false; else open = rnd() < 0.55;
    if (open) { stack.push(L[i]); opens--; } else pairs.push([stack.pop(), L[i]]);
  }
  for (let i = pairs.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pairs[i], pairs[j]] = [pairs[j], pairs[i]]; }
  const solved = pairs.map((p) => p.slice());
  const target = MIN_CROSS[R] || Math.ceil(R * 1.35);
  let best = null, bestS = -1;
  for (let tries = 0; tries < 60; tries++) {
    const ropes = solved.map((p) => p.slice());
    for (let m = 0; m < R * 10; m++) {
      const empt = emptyHoles(ropes, H);
      const r = Math.floor(rnd() * R), e = rnd() < 0.5 ? 0 : 1;
      ropes[r][e] = empt[Math.floor(rnd() * empt.length)];
      if (m >= R * 3 && crossPairs(ropes).length >= target) {
        const sp = spread(ropes, pos);
        if (sp < 0.6) continue;
        const sc = Math.min(sp, 1) + 0.5 * twistCount(ropes, pos);
        if (sc > bestS) { bestS = sc; best = ropes.map((p) => p.slice()); }
      }
    }
  }
  if (!best) {
    best = solved.map((p) => p.slice());
    for (let m = 0; m < R * 6 || crossPairs(best).length < 2; m++) {
      const empt = emptyHoles(best, H);
      best[Math.floor(rnd() * R)][rnd() < 0.5 ? 0 : 1] = empt[Math.floor(rnd() * empt.length)];
    }
  }
  return { ropes: best, solved, H, R, shape };
}

// The peg colours per rope [c0, c1], c0 !== c1, off the board's seed.
export function pegColours(seed, R) {
  const rnd = rng32(hash(`${seed}-pegs`));
  const out = [];
  for (let i = 0; i < R; i++) {
    const c0 = Math.floor(rnd() * PEG_PASTELS.length);
    let c1; do { c1 = Math.floor(rnd() * PEG_PASTELS.length); } while (c1 === c0);
    out.push([c0, c1]);
  }
  return out;
}

export const quizIdFor = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `tangled-${m}-${d}-${y % 100}`; };
export const seedFor = (iso, shape) => `${quizIdFor(iso)}-${shape}`;
