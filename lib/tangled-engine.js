// lib/tangled-engine.js — the rules and the board maker for Tangled, the daily
// rope untangling puzzle (owner, 2026-11-07). Shared by the client
// (app/tangled/TangledBoard.jsx), the bank generator (scripts/gen-tangled.mjs)
// and the verifier (scripts/verify-tangled.mjs), so all three agree.
//
// THE GAME. Holes sit evenly round the edge of a frame whose shape changes every
// day. Each rope runs from one hole to another; there are always exactly two
// empty holes. Move a rope end into an empty hole.
//
// THE ROPES ARE REALLY WOUND (owner, 2026-11-09: "make it real"). The board
// carries WRAPS: for every pair of ropes that touch, the chain of crossings
// between them, in order from one side of their tangle (A) to the other (B),
// each crossing naming the rope on top. A moved peg is LIFTED, so its rope is
// laid over every rope its path crosses (a straight line from the old hole to
// the new one). At the side of the tangle the moved end sits on, that new
// crossing either CANCELS the last one (the mover was already on top there: it
// slides off) or ADDS a turn (the mover was underneath: now it is wound). So a
// twist only comes undone by passing a peg back over the rope it is wound
// with, the way it went, exactly as a real rope would.
//
// The crossing count between two ropes is always odd when their holes
// interleave round the edge and even when they do not (crosses()), so a board
// with no wraps left has no crossings at all: that is the solve.
//
// EVERY BOARD IS SOLVABLE BY CONSTRUCTION: it starts untangled and is scrambled
// by legal moves; every move is undone exactly by moving the same peg back, so
// the scramble played in reverse untangles it (generate() checks this).

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
// Solved: no wraps left (which also means no two ropes cross).
export const isSolved = (ropes, wraps) => crossPairs(ropes).length === 0 && (!wraps || Object.keys(wraps).length === 0);
export const wrapKey = (i, j) => (i < j ? `${i}-${j}` : `${j}-${i}`);
// How many rope crossings are on the board, twists included.
export const crossingCount = (wraps) => Object.values(wraps || {}).reduce((t, w) => t + w.c.length, 0);
export const cloneWraps = (w) => { const o = {}; for (const k in (w || {})) o[k] = { c: w[k].c.slice(), a: w[k].a ? w[k].a.slice() : null }; return o; };
// Every pair's crossing count must agree with whether its holes interleave.
export function wrapsConsistent(ropes, wraps) {
  for (let i = 0; i < ropes.length; i++) for (let j = i + 1; j < ropes.length; j++) {
    const w = wraps[wrapKey(i, j)], n = w ? w.c.length : 0;
    if ((n % 2 === 1) !== crosses(ropes[i], ropes[j])) return false;
    if (w && (!n || w.c.some((t) => t !== i && t !== j))) return false;
    for (let k = 1; k < n; k++) if (w.c[k] === w.c[k - 1]) return false;
    if (w && n >= 2 && !w.a) return false;
  }
  return true;
}
// Move rope r's end e into hole h. The peg is lifted, so the rope is laid over
// every rope the straight path old hole -> h crosses. Returns the new
// { ropes, wraps }; the inputs are not touched.
export function applyMove(ropes, wraps, r, e, h, pos) {
  const from = ropes[r][e];
  const nr = ropes.map((x) => x.slice());
  nr[r][e] = h;
  const nw = cloneWraps(wraps);
  if (from === h) return { ropes: nr, wraps: nw };
  for (let j = 0; j < ropes.length; j++) {
    if (j === r || !crosses([from, h], ropes[j])) continue;
    const lo = Math.min(r, j), key = wrapKey(r, j);
    const w = nw[key] || { c: [], a: null };
    if (!w.c.length) { nw[key] = { c: [r], a: null }; continue; }
    if (!w.a) {
      // A single crossing has no sides yet: the side the mover's end shares is
      // set by which of rope j's two tails its path goes over.
      const J0 = pos[ropes[j][0]], J1 = pos[ropes[j][1]];
      const X = segX(pos[ropes[r][0]], pos[ropes[r][1]], J0, J1), Y = segX(pos[from], pos[h], J0, J1);
      let f = 0;
      if (X && Y) f = Math.hypot(Y.x - J0.x, Y.y - J0.y) < Math.hypot(X.x - J0.x, X.y - J0.y) ? 0 : 1;
      w.a = r === lo ? [e, f] : [f, e];
    }
    const atA = (r === lo ? w.a[0] : w.a[1]) === e;
    if (atA) { if (w.c[0] === r) w.c.shift(); else w.c.unshift(r); }
    else if (w.c[w.c.length - 1] === r) w.c.pop(); else w.c.push(r);
    if (w.c.length) nw[key] = w; else delete nw[key];
  }
  return { ropes: nr, wraps: nw };
}
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
// The day's frame and size off its ISO date: shapes cycle by day of the year.
export function dayParams(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = Date.UTC(y, m - 1, d);
  const doy = Math.round((dt - Date.UTC(y, 0, 0)) / 864e5);
  const dow = new Date(dt).getUTCDay();
  return { shape: SHAPE_ORDER[doy % SHAPE_ORDER.length], R: ROPES_BY_DOW[dow], dow };
}

// The scramble's limits by rope count: how many moves, the fewest real twists
// (pairs wound two turns or more) and the most, and the crossing total kept to
// a fair size. A rope starts wound with one other rope at most, so every twist
// can be followed by eye.
export const SCRAMBLE = {
  4: { moves: 5, twists: 1, maxTwists: 1, maxTotal: 7 },
  5: { moves: 6, twists: 1, maxTwists: 2, maxTotal: 9 },
  6: { moves: 7, twists: 1, maxTwists: 2, maxTotal: 11 },
  7: { moves: 8, twists: 2, maxTwists: 3, maxTotal: 13 },
  8: { moves: 9, twists: 2, maxTwists: 3, maxTotal: 15 },
};
const MAX_TURNS = 3;

// A twist between ropes i and j is drawn as a straight cord from the middle of
// its two side A pegs (PA) to the middle of its two side B pegs (PB): the ropes
// come in together at one end and leave together at the other. Shared by the
// board (drawing) and the generator (room to draw it).
export function cordFrame(iA, iB, jA, jB) {
  const PA = { x: (iA.x + jA.x) / 2, y: (iA.y + jA.y) / 2 }, PB = { x: (iB.x + jB.x) / 2, y: (iB.y + jB.y) / 2 };
  const len = Math.hypot(PB.x - PA.x, PB.y - PA.y);
  return { PA, PB, len, M: { x: (PA.x + PB.x) / 2, y: (PA.y + PB.y) / 2 }, d: len > 1 ? { x: (PB.x - PA.x) / len, y: (PB.y - PA.y) / len } : { x: 1, y: 0 }, room: len / 2 - 26 };
}
export function cordRoom(ropes, w, i, j, pos) {
  const iA = pos[ropes[i][w.a[0]]], iB = pos[ropes[i][1 - w.a[0]]], jA = pos[ropes[j][w.a[1]]], jB = pos[ropes[j][1 - w.a[1]]];
  return cordFrame(iA, iB, jA, jB).room;
}

// One board: a random non-crossing matching, scrambled by legal moves (the
// wraps tracked all the way); of every state reached that is tangled enough
// and fair, the one whose crossings sit furthest apart and that holds the most
// real twists is kept. Its scramble played backward must untangle it.
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
  const cfg = SCRAMBLE[R] || { moves: R + 2, twists: 1, maxTwists: 2, maxTotal: 2 * R };
  const target = MIN_CROSS[R] || Math.ceil(R * 1.35);
  let best = null, bestS = -1;
  for (let tries = 0; tries < 900 && !(best && tries > 120); tries++) {
    const minSp = tries < 300 ? 0.6 : tries < 600 ? 0.45 : 0.3, perTurn = tries < 300 ? 20 : tries < 600 ? 14 : 8;
    let st = { ropes: solved.map((p) => p.slice()), wraps: {} };
    const path = [];
    for (let m = 0; m < cfg.moves * 2; m++) {
      const empt = emptyHoles(st.ropes, H);
      const r = Math.floor(rnd() * R), e = rnd() < 0.5 ? 0 : 1, h = empt[Math.floor(rnd() * empt.length)];
      const nx = applyMove(st.ropes, st.wraps, r, e, h, pos);
      if (Object.values(nx.wraps).some((w) => w.c.length > MAX_TURNS) || crossingCount(nx.wraps) > cfg.maxTotal) continue;
      path.push([r, e, st.ropes[r][e], h]);
      st = nx;
      if (path.length < cfg.moves) continue;
      const tot = crossingCount(st.wraps), twk = Object.keys(st.wraps).filter((k) => st.wraps[k].c.length >= 2), tw = twk.length;
      if (tot < target || tw < cfg.twists || tw > cfg.maxTwists) continue;
      const inTw = twk.flatMap((k) => k.split('-'));
      if (new Set(inTw).size !== inTw.length) continue;
      // every starting twist has room to be drawn as a clean cord
      if (twk.some((k) => { const [a, b] = k.split('-').map(Number); return cordRoom(st.ropes, st.wraps[k], a, b, pos) < perTurn * st.wraps[k].c.length + 10; })) continue;
      const sp = spread(st.ropes, pos);
      if (sp < minSp) continue;
      const sc = Math.min(sp, 1) + 0.3 * tw - 0.04 * (tot - target);
      if (sc <= bestS) continue;
      // the scramble backward must untangle it
      let b2 = { ropes: st.ropes, wraps: st.wraps };
      for (let k = path.length - 1; k >= 0; k--) { const [rr, ee, f] = path[k]; b2 = applyMove(b2.ropes, b2.wraps, rr, ee, f, pos); }
      if (!isSolved(b2.ropes, b2.wraps) || JSON.stringify(b2.ropes) !== JSON.stringify(solved)) continue;
      bestS = sc; best = { ropes: st.ropes.map((p) => p.slice()), wraps: cloneWraps(st.wraps), path: path.map((x) => x.slice()) };
    }
  }
  if (!best) throw new Error(`tangled: no board for ${seed}`);
  return { ropes: best.ropes, wraps: best.wraps, solved, H, R, shape, scramble: best.path };
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
