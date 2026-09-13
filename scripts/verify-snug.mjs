#!/usr/bin/env node
// verify-snug: the checker for the Snug bank (app/snug/puzzles.js).
// Discovered by scripts/verify-all.mjs as `snug`. Shares NO code with
// scripts/gen-snug.mjs: every proof below is re-derived with its own geometry
// and its own solvers, per the daily authoring standard.
//
// What it proves, per board:
//   shape     w, h, hole count, piece count and piece sizes match the weekday
//             spec pinned in the generator header (Mon..Sat 6x6, Sun 7x7);
//             the mask is h rows of w chars; the region is one connected piece
//   pieces    each normalised to its top-left; areas sum to the region;
//             no two pieces congruent under rotation or reflection
//   sol       one offset per piece; the pieces land inside the region, cover
//             it exactly, and overlap nowhere
//   unique    EXACTLY one tiling under all eight orientations, counted by a
//             solver that picks the most constrained empty square first (the
//             generator's takes the first in row-major order) with a cap of 2
//   nodes     the stored difficulty equals a fresh walk of the canonical
//             search defined in the bank header (row-major first empty square,
//             every unused piece, every deduplicated orientation anchored by
//             its row-major first cell; count every entry, leaves included)
// And across the bank:
//   dates     contiguous from the first board, num = position, quizId and
//             dateLabel derived from live, sunday: true exactly on Sundays
//   climb     inside each Monday-to-Saturday run, nodes never falls
//   regions   no two boards share both a mask and a piece set
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
let fails = 0;
const bad = (m) => { fails++; console.log(`✗ ${m}`); };
const ok = (m) => console.log(`✓ ${m}`);

const BANK = process.env.VERIFY_SNUG_BANK || 'app/snug/puzzles.js';
const { PUZZLES } = await import(pathToFileURL(join(root, BANK)).href);

const SPEC = {
  1: { w: 6, h: 6, holes: 3, k: 6, min: 4, max: 7 },
  2: { w: 6, h: 6, holes: 3, k: 6, min: 4, max: 6 },
  3: { w: 6, h: 6, holes: 3, k: 7, min: 4, max: 6 },
  4: { w: 6, h: 6, holes: 2, k: 7, min: 4, max: 6 },
  5: { w: 6, h: 6, holes: 1, k: 7, min: 4, max: 6 },
  6: { w: 6, h: 6, holes: 1, k: 7, min: 4, max: 6 },
  0: { w: 7, h: 7, holes: 4, k: 8, min: 4, max: 7 },
};

// ---------------------------------------------------------------- geometry (own)
const dow = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();
const isoAdd = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const labelOf = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const quizIdOf = (iso) => `snug-${+iso.slice(5, 7)}-${+iso.slice(8, 10)}-${iso.slice(2, 4)}`;

function normalise(cells) {
  let mr = Infinity, mc = Infinity;
  for (const [r, c] of cells) { if (r < mr) mr = r; if (c < mc) mc = c; }
  return cells.map(([r, c]) => [r - mr, c - mc]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}
const rot = (cells) => cells.map(([r, c]) => [c, -r]);
const flip = (cells) => cells.map(([r, c]) => [r, -c]);
const sig = (cells) => normalise(cells).map((p) => p.join(':')).join(',');
// All eight orientations, deduplicated. Order is irrelevant to every proof here
// (the full search tree has the same node count whatever order its children
// are visited in), so this deliberately does NOT copy the generator's order.
function allOrients(cells) {
  const out = new Map();
  let cur = cells;
  for (let i = 0; i < 4; i++) { out.set(sig(cur), normalise(cur)); cur = rot(cur); }
  cur = flip(cells);
  for (let i = 0; i < 4; i++) { out.set(sig(cur), normalise(cur)); cur = rot(cur); }
  return [...out.values()];
}
const congruent = (a, b) => allOrients(a).some((o) => sig(o) === sig(b));

function regionOf(p) {
  const cells = [];
  for (let r = 0; r < p.h; r++) for (let c = 0; c < p.w; c++) if (p.mask[r][c] === '1') cells.push([r, c]);
  return cells;
}
function connectedRegion(p) {
  const cells = regionOf(p); if (!cells.length) return false;
  const inR = (r, c) => r >= 0 && c >= 0 && r < p.h && c < p.w && p.mask[r][c] === '1';
  const seen = new Set([cells[0].join(',')]); const st = [cells[0]];
  while (st.length) {
    const [r, c] = st.pop();
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc; const k = `${nr},${nc}`;
      if (inR(nr, nc) && !seen.has(k)) { seen.add(k); st.push([nr, nc]); }
    }
  }
  return seen.size === cells.length;
}

// Placements of one orientation anchored so that its first cell lands on
// (r, c); returns the grid indexes it covers or null if it leaves the board or
// the region or hits a filled square.
function tryPlace(p, grid, o, r, c) {
  const dr = r - o[0][0], dc = c - o[0][1];
  const idx = [];
  for (const [pr, pc] of o) {
    const rr = pr + dr, cc = pc + dc;
    if (rr < 0 || cc < 0 || rr >= p.h || cc >= p.w) return null;
    const k = rr * p.w + cc;
    if (grid[k] !== 0) return null;
    idx.push(k);
  }
  return idx;
}
// 0 = empty region square, 1 = hole, 2 = filled.
function freshGrid(p) {
  const g = new Uint8Array(p.w * p.h);
  for (let r = 0; r < p.h; r++) for (let c = 0; c < p.w; c++) g[r * p.w + c] = p.mask[r][c] === '1' ? 0 : 1;
  return g;
}

// Independent uniqueness counter: most-constrained empty square first. For an
// empty square, a candidate is (unused piece, orientation, which of its cells
// covers the square). Cap 2.
function countUniqueMRV(p, ors, cap = 2) {
  const grid = freshGrid(p); const used = new Array(p.pieces.length).fill(false);
  let count = 0;
  function candidates(k) {
    const r = Math.floor(k / p.w), c = k % p.w; const out = [];
    for (let i = 0; i < ors.length; i++) {
      if (used[i]) continue;
      for (const o of ors[i]) for (const [pr, pc] of o) {
        const dr = r - pr, dc = c - pc; const idx = [];
        let good = true;
        for (const [qr, qc] of o) {
          const rr = qr + dr, cc = qc + dc;
          if (rr < 0 || cc < 0 || rr >= p.h || cc >= p.w || grid[rr * p.w + cc] !== 0) { good = false; break; }
          idx.push(rr * p.w + cc);
        }
        if (good) out.push([i, idx]);
      }
    }
    return out;
  }
  (function rec() {
    if (count >= cap) return;
    let best = null, bestC = null;
    for (let k = 0; k < grid.length; k++) {
      if (grid[k] !== 0) continue;
      const cs = candidates(k);
      if (!bestC || cs.length < bestC.length) { best = k; bestC = cs; if (!cs.length) break; }
    }
    if (best === null) { count++; return; }
    for (const [i, idx] of bestC) {
      used[i] = true; for (const k of idx) grid[k] = 2;
      rec();
      used[i] = false; for (const k of idx) grid[k] = 0;
      if (count >= cap) return;
    }
  })();
  return count;
}

// The canonical walk, re-derived from the bank header's definition.
function canonicalNodes(p, ors) {
  const grid = freshGrid(p); const used = new Array(p.pieces.length).fill(false);
  let nodes = 0;
  (function rec() {
    nodes++;
    let t = -1;
    for (let k = 0; k < grid.length; k++) if (grid[k] === 0) { t = k; break; }
    if (t < 0) return;
    const r = Math.floor(t / p.w), c = t % p.w;
    for (let i = 0; i < ors.length; i++) {
      if (used[i]) continue;
      for (const o of ors[i]) {
        const idx = tryPlace(p, grid, o, r, c);
        if (!idx) continue;
        used[i] = true; for (const k of idx) grid[k] = 2;
        rec();
        used[i] = false; for (const k of idx) grid[k] = 0;
      }
    }
  })();
  return nodes;
}

// ---------------------------------------------------------------- checks
if (!Array.isArray(PUZZLES) || !PUZZLES.length) { bad('bank is empty'); }
else {
  const first = PUZZLES[0].live;
  const masks = new Map();
  let unique = 0, nodesOk = 0;
  const t0 = Date.now();
  PUZZLES.forEach((p, i) => {
    const id = `#${p.num} ${p.live}`;
    // dates
    if (p.num !== i + 1) bad(`${id}: num ${p.num} at position ${i + 1}`);
    if (p.live !== isoAdd(first, i)) bad(`${id}: expected live ${isoAdd(first, i)}`);
    if (p.quizId !== quizIdOf(p.live)) bad(`${id}: quizId ${p.quizId}, want ${quizIdOf(p.live)}`);
    if (p.dateLabel !== labelOf(p.live)) bad(`${id}: dateLabel ${p.dateLabel}, want ${labelOf(p.live)}`);
    const d = dow(p.live);
    if (d === 0 && p.sunday !== true) bad(`${id}: Sunday without sunday: true`);
    if (d !== 0 && p.sunday) bad(`${id}: sunday flag on a ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]}`);
    // shape
    const spec = SPEC[d];
    if (p.w !== spec.w || p.h !== spec.h) bad(`${id}: ${p.w}x${p.h}, want ${spec.w}x${spec.h}`);
    if (!Array.isArray(p.mask) || p.mask.length !== p.h || p.mask.some((row) => typeof row !== 'string' || row.length !== p.w || /[^01]/.test(row))) { bad(`${id}: malformed mask`); return; }
    const region = regionOf(p);
    const holes = p.w * p.h - region.length;
    if (holes !== spec.holes) bad(`${id}: ${holes} holes, want ${spec.holes}`);
    if (!connectedRegion(p)) bad(`${id}: region is not connected`);
    const mk = `${p.w}x${p.h}:${p.mask.join('/')}|${(p.pieces || []).map((pc) => allOrients(pc).map(sig).sort()[0]).sort().join(';')}`;
    if (masks.has(mk)) bad(`${id}: same region and pieces as #${masks.get(mk)}`); else masks.set(mk, p.num);
    // pieces
    if (!Array.isArray(p.pieces) || p.pieces.length !== spec.k) { bad(`${id}: ${p.pieces && p.pieces.length} pieces, want ${spec.k}`); return; }
    let area = 0;
    p.pieces.forEach((pc, j) => {
      area += pc.length;
      if (pc.length < spec.min || pc.length > spec.max) bad(`${id}: piece ${j} has ${pc.length} squares, want ${spec.min}-${spec.max}`);
      if (sig(pc) !== pc.map((q) => q.join(':')).join(',')) bad(`${id}: piece ${j} is not normalised to its top-left in row-major order`);
      const seen = new Set(pc.map((q) => q.join(',')));
      if (seen.size !== pc.length) bad(`${id}: piece ${j} repeats a square`);
      if (!connectedRegion({ w: 1 + Math.max(...pc.map((q) => q[1])), h: 1 + Math.max(...pc.map((q) => q[0])), mask: (() => { const w = 1 + Math.max(...pc.map((q) => q[1])), h = 1 + Math.max(...pc.map((q) => q[0])); const rows = Array.from({ length: h }, () => Array(w).fill('0')); for (const [r, c] of pc) rows[r][c] = '1'; return rows.map((x) => x.join('')); })() })) bad(`${id}: piece ${j} is not connected`);
      for (let k = 0; k < j; k++) if (congruent(pc, p.pieces[k])) bad(`${id}: pieces ${k} and ${j} are the same shape`);
    });
    if (area !== region.length) bad(`${id}: pieces cover ${area} squares, region has ${region.length}`);
    // sol
    if (!Array.isArray(p.sol) || p.sol.length !== p.pieces.length) bad(`${id}: sol has ${p.sol && p.sol.length} offsets`);
    else {
      const grid = freshGrid(p); let clash = false;
      p.pieces.forEach((pc, j) => {
        const [dr, dc] = p.sol[j];
        for (const [r, c] of pc) {
          const rr = r + dr, cc = c + dc;
          if (rr < 0 || cc < 0 || rr >= p.h || cc >= p.w || grid[rr * p.w + cc] !== 0) { clash = true; break; }
          grid[rr * p.w + cc] = 2;
        }
      });
      if (clash || grid.some((v) => v === 0)) bad(`${id}: sol does not tile the region exactly`);
    }
    // uniqueness (independent) and nodes (canonical)
    const ors = p.pieces.map((pc) => allOrients(pc));
    const n = countUniqueMRV(p, ors, 2);
    if (n !== 1) bad(`${id}: ${n >= 2 ? 'at least two' : 'no'} tilings under all eight orientations`); else unique++;
    const nodes = canonicalNodes(p, ors);
    if (nodes !== p.nodes) bad(`${id}: nodes ${p.nodes} stored, ${nodes} re-derived`); else nodesOk++;
  });
  ok(`${PUZZLES.length} boards, ${unique} proved unique, ${nodesOk} with the stored difficulty re-derived (${((Date.now() - t0) / 1000).toFixed(1)}s)`);

  // the week climb: Mon..Sat nodes never falls inside one week
  let climbs = 0;
  for (let i = 1; i < PUZZLES.length; i++) {
    const d = dow(PUZZLES[i].live);
    if (d === 0 || d === 1) continue;
    if (PUZZLES[i].nodes < PUZZLES[i - 1].nodes) bad(`#${PUZZLES[i].num} ${PUZZLES[i].live}: nodes ${PUZZLES[i].nodes} falls below the day before (${PUZZLES[i - 1].nodes})`);
    else climbs++;
  }
  ok(`week climb holds across ${climbs} weekday steps`);
  const sundays = PUZZLES.filter((p) => p.sunday);
  ok(`${sundays.length} Sunday Editions, all 7x7 with ${SPEC[0].k} pieces`);
}

console.log(fails ? `\n${fails} failure(s)` : '\nsnug: all clean');
process.exit(fails ? 1 : 0);
