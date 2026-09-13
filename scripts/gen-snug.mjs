#!/usr/bin/env node
// gen-snug: build app/snug/puzzles.js, the Snug bank.
//
// Snug is the daily fit-the-shapes puzzle: a region of squares (a square board
// with a few squares removed) and a set of polyomino pieces whose areas add up
// to the region exactly. Place every piece, rotating and flipping as needed,
// so the region is covered with no overlaps. THE BANK ONLY SHIPS BOARDS WITH
// ONE TILING under the full orientation set (rotations AND reflections), so a
// full board is always the intended board.
//
// The generator does not design toward uniqueness, it FILTERS for it: make a
// region, carve it into pieces by random flood growth, then count tilings with
// every orientation allowed and keep the board only if the count is exactly
// one. Difficulty is a MEASURED field: `nodes` is the size of the search tree
// the canonical counting solver walks (defined precisely in the bank header so
// scripts/verify-snug.mjs can re-derive it), and within each Monday-to-Saturday
// run the day's board is picked from a pool of candidates so that `nodes`
// climbs through the week. Sunday is the Edition: a 7x7 board with more pieces.
//
// Shape spec per weekday (0 = Sunday), all pinned and verified:
//   Mon 6x6, 3 holes, 6 pieces of 4-7   Thu 6x6, 2 holes, 7 pieces of 4-6
//   Tue 6x6, 3 holes, 6 pieces of 4-6   Fri 6x6, 1 hole,  7 pieces of 4-6
//   Wed 6x6, 3 holes, 7 pieces of 4-6   Sat 6x6, 1 hole,  7 pieces of 4-6 (the hard end)
//   Sun 7x7, 4 holes, 8 pieces of 4-7 (sunday: true)
// Measured before choosing (2026-09-13): eight pieces of 3-5 on a 6x6, or a
// full 6x6 with no hole, almost never come out unique (0 to 1 in 3 at 1,500
// tries); seven pieces on a one-hole board do every time, and 8 pieces of 4-7
// on a 7x7 with four holes in well under a second. A hole is a constraint, so
// the week takes them away as it goes. Saturday shares Friday's shape and takes
// the HARD end of its pool: a Saturday of 7 pieces of 3-6 was tried first and
// measured EASIER than Friday (median nodes about 2,800 against 5,000; a
// tromino constrains less than a tetromino), so the climb could not close.
// No two pieces on a board are congruent under rotation or reflection, so the
// pad reads as distinct shapes. No two boards in the bank share both a region
// and a piece set.
//
//   node scripts/gen-snug.mjs [--from 2026-09-13] [--days 78] [--seed 20260913] [--pool 8]
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const FROM = opt('--from', '2026-09-13');
const DAYS = +opt('--days', 78);
const SEED = +opt('--seed', 20260913);
const POOL = +opt('--pool', 8);

export const SPEC = {
  1: { w: 6, h: 6, holes: 3, k: 6, min: 4, max: 7 },
  2: { w: 6, h: 6, holes: 3, k: 6, min: 4, max: 6 },
  3: { w: 6, h: 6, holes: 3, k: 7, min: 4, max: 6 },
  4: { w: 6, h: 6, holes: 2, k: 7, min: 4, max: 6 },
  5: { w: 6, h: 6, holes: 1, k: 7, min: 4, max: 6 },
  6: { w: 6, h: 6, holes: 1, k: 7, min: 4, max: 6 },
  0: { w: 7, h: 7, holes: 4, k: 8, min: 4, max: 7 },
};

// ---------------------------------------------------------------- rng
function mulberry(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
let rand = mulberry(SEED);
const rnd = (n) => Math.floor(rand() * n);
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ---------------------------------------------------------------- geometry
const K = (r, c) => r * 16 + c;
export function norm(cells) {
  const mr = Math.min(...cells.map((p) => p[0])), mc = Math.min(...cells.map((p) => p[1]));
  return cells.map(([r, c]) => [r - mr, c - mc]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}
// The eight orientations of a piece, deduplicated, in CANONICAL ORDER: the
// four rotations of the piece, then the four rotations of its mirror. This
// order is part of the definition of `nodes`.
export function orients(cells, free) {
  const seen = new Map();
  let cur = cells;
  for (let f = 0; f < (free ? 2 : 1); f++) {
    for (let r = 0; r < (free ? 4 : 1); r++) {
      const n = norm(cur);
      const key = JSON.stringify(n);
      if (!seen.has(key)) seen.set(key, n);
      cur = cur.map(([rr, cc]) => [cc, -rr]);
    }
    cur = cells.map(([rr, cc]) => [rr, -cc]);
  }
  return [...seen.values()];
}
export function canon(cells) { return orients(cells, true).map((o) => JSON.stringify(o)).sort()[0]; }

// Count tilings. THE CANONICAL SOLVER: take the first uncovered cell in row
// major order, try every unused piece in bank order, every orientation in
// canonical order, anchored so the orientation's first cell (its top-left in
// row-major order) lands on that cell. `nodes` is the number of times the
// recursion is entered, including the leaves, over the FULL search (no cap).
export function countTilings(region, pieces, free, cap = Infinity) {
  const cells = [...region].map((k) => [k >> 4, k & 15]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const ors = pieces.map((p) => orients(p, free));
  const filled = new Set();
  const used = new Array(pieces.length).fill(false);
  let count = 0, nodes = 0; let first = null; const placed = [];
  (function rec() {
    nodes++;
    if (count >= cap) return;
    let t = null;
    for (const c of cells) if (!filled.has(K(c[0], c[1]))) { t = c; break; }
    if (!t) { count++; if (count === 1) first = placed.map((p) => ({ ...p })); return; }
    for (let i = 0; i < pieces.length; i++) {
      if (used[i]) continue;
      for (const o of ors[i]) {
        const dr = t[0] - o[0][0], dc = t[1] - o[0][1];
        let ok = true; const ks = [];
        for (const [r, c] of o) { const k = K(r + dr, c + dc); if (r + dr < 0 || c + dc < 0 || !region.has(k) || filled.has(k)) { ok = false; break; } ks.push(k); }
        if (!ok) continue;
        used[i] = true; ks.forEach((k) => filled.add(k)); placed[i] = { o, dr, dc };
        rec();
        used[i] = false; ks.forEach((k) => filled.delete(k));
        if (count >= cap) return;
      }
    }
  })();
  return { count, nodes, first };
}

function connected(set) {
  const arr = [...set]; if (!arr.length) return false;
  const seen = new Set([arr[0]]); const st = [arr[0]];
  while (st.length) { const k = st.pop(); const r = k >> 4, c = k & 15;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = K(r + dr, c + dc); if (r + dr >= 0 && c + dc >= 0 && set.has(n) && !seen.has(n)) { seen.add(n); st.push(n); } } }
  return seen.size === set.size;
}
function makeRegion(w, h, holes) {
  for (let t = 0; t < 200; t++) {
    const s = new Set(); for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) s.add(K(r, c));
    const all = shuffle([...s]);
    for (let i = 0; i < holes; i++) s.delete(all[i]);
    if (connected(s)) return s;
  }
  return null;
}
function partition(region, k, minS, maxS) {
  for (let t = 0; t < 300; t++) {
    const cells = shuffle([...region]);
    const owner = new Map(); const groups = [];
    for (let i = 0; i < k; i++) { owner.set(cells[i], i); groups.push([cells[i]]); }
    let left = region.size - k; let stuck = false;
    while (left > 0) {
      const cand = [];
      for (let g = 0; g < k; g++) {
        if (groups[g].length >= maxS) continue;
        for (const ck of groups[g]) { const r = ck >> 4, c = ck & 15;
          for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = K(r + dr, c + dc); if (r + dr >= 0 && c + dc >= 0 && region.has(n) && !owner.has(n)) cand.push([g, n]); } }
      }
      if (!cand.length) { stuck = true; break; }
      cand.sort((a, b) => groups[a[0]].length - groups[b[0]].length);
      const pick = cand[rnd(Math.min(cand.length, 6))];
      owner.set(pick[1], pick[0]); groups[pick[0]].push(pick[1]); left--;
    }
    if (stuck) continue;
    if (groups.some((g) => g.length < minS)) continue;
    // pieces in solution orientation, ordered by their top-left cell so the
    // bank order is a property of the board and not of the flood
    return groups.map((g) => g.map((k) => [k >> 4, k & 15]).sort((a, b) => a[0] - b[0] || a[1] - b[1]));
  }
  return null;
}

// One unique board matching the spec, or null after `tries`.
export function searchBoard(spec, seenRegions, tries = 4000) {
  for (let t = 0; t < tries; t++) {
    const region = makeRegion(spec.w, spec.h, spec.holes); if (!region) continue;
    const groups = partition(region, spec.k, spec.min, spec.max); if (!groups) continue;
    const pieces = groups.map((g) => norm(g));
    const shapes = pieces.map(canon);
    if (new Set(shapes).size < spec.k) continue;
    // A board's identity is its region PLUS its piece set: a one-hole 6x6 has
    // only 36 regions, and fewer than that admit a unique tiling at all, so
    // the region alone cannot be the key over an eleven-week bank.
    const rkey = [...region].sort((a, b) => a - b).join(',') + '|' + shapes.slice().sort().join(';');
    if (seenRegions.has(rkey)) continue;
    const { count } = countTilings(region, pieces, true, 2);
    if (count !== 1) continue;
    const { nodes } = countTilings(region, pieces, true);
    const sol = groups.map((g) => { const n = norm(g); return [g[0][0] - n[0][0], g[0][1] - n[0][1]]; });
    const mask = []; for (let r = 0; r < spec.h; r++) { let s = ''; for (let c = 0; c < spec.w; c++) s += region.has(K(r, c)) ? '1' : '0'; mask.push(s); }
    return { rkey, board: { w: spec.w, h: spec.h, mask, pieces, sol, nodes } };
  }
  return null;
}

function isoAdd(iso, n) { const d = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10) + n)); return d.toISOString().slice(0, 10); }
function dow(iso) { return new Date(`${iso}T12:00:00Z`).getUTCDay(); }
function label(iso) { return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); }
function quizId(iso) { return `snug-${+iso.slice(5, 7)}-${+iso.slice(8, 10)}-${iso.slice(2, 4)}`; }

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const seen = new Set();
  const out = [];
  // Pool a run of Mon..Sat candidates and hand them out by `nodes` so the week
  // climbs; Sundays are picked on their own.
  for (let i = 0; i < DAYS; i++) {
    const live = isoAdd(FROM, i);
    const d = dow(live);
    const spec = SPEC[d];
    let entry;
    if (d === 0) {
      const b = searchBoard(spec, seen); if (!b) throw new Error(`no Sunday board for ${live}`);
      seen.add(b.rkey); entry = b.board;
    } else {
      // Draw a pool of candidates for this weekday's spec, sort by the measured
      // `nodes`, and take the quantile the weekday asks for: Monday from the
      // easy end, Saturday from the hard end. The unused candidates are dropped
      // (their regions stay reserved so no later board repeats one).
      // Only the CHOSEN board's region is reserved: a one-hole 6x6 has just 36
      // regions, and reserving every pool candidate exhausted them in two
      // weeks (the 2026-10-02 failure on the first run).
      const pool = []; const local = new Set(seen);
      for (let p = 0; p < POOL; p++) { const b = searchBoard(spec, local); if (!b) break; local.add(b.rkey); pool.push(b); }
      if (!pool.length) throw new Error(`no board for ${live}`);
      pool.sort((a, b) => a.board.nodes - b.board.nodes);
      const q = (d - 1) / 5;
      const pick = pool[Math.min(pool.length - 1, Math.round(q * (pool.length - 1)))];
      seen.add(pick.rkey); entry = pick.board;
    }
    out.push({ num: i + 1, quizId: quizId(live), live, dateLabel: label(live), sunday: d === 0 ? true : undefined, ...entry });
    process.stderr.write(`${live} ${d === 0 ? 'SUN' : 'day' + d} nodes ${entry.nodes} pieces ${entry.pieces.length}\n`);
  }
  // The week climb is enforced by the verifier; enforce it here too by
  // re-picking any weekday whose nodes fall below the previous weekday's.
  for (let i = 1; i < out.length; i++) {
    const d = dow(out[i].live);
    if (d === 0 || d === 1) continue;
    let guard = 0;
    while (out[i].nodes < out[i - 1].nodes && guard++ < 80) {
      const b = searchBoard(SPEC[d], seen); if (!b) continue;
      if (b.board.nodes >= out[i - 1].nodes) { seen.add(b.rkey); out[i] = { ...out[i], ...b.board }; }
    }
    if (out[i].nodes < out[i - 1].nodes) throw new Error(`could not make ${out[i].live} climb past ${out[i - 1].live}`);
  }
  const lines = out.map((p) => `  ${JSON.stringify(p).replace(/"(\w+)":/g, '$1: ')},`).join('\n');
  const src = `// Puzzle data for Snug, the daily fit-the-shapes puzzle. GENERATED by
// scripts/gen-snug.mjs (seed ${SEED}); do not edit a board by hand. Imported
// ONLY by the server page (app/snug/page.js), which filters live<=today before
// handing puzzles to the client, so future boards and their solutions never
// reach a browser.
//
// Fields:
//   w, h    board size; mask is h strings of w chars, '1' a playable square
//   pieces  the polyominoes, each a list of [row, col] cells normalised to its
//           top-left, IN SOLUTION ORIENTATION (the client scrambles the pad)
//   sol     one [row, col] offset per piece: piece cells + offset = the tiling
//   nodes   MEASURED difficulty, recomputed by scripts/verify-snug.mjs: the
//           number of recursion entries (leaves included) of the canonical
//           counting solver over the FULL search with all eight orientations:
//           first uncovered square in row-major order, pieces in bank order,
//           orientations as the four rotations then the four rotations of the
//           mirror, deduplicated, each anchored by its row-major first cell
//   sunday  the 7x7 Edition, only on a real Sunday
// Every board has EXACTLY ONE tiling under rotations and reflections, no two
// pieces on a board are congruent, no two boards share a region and piece set, and within
// each Monday-to-Saturday run \`nodes\` never falls from one day to the next.
export const PUZZLES = [
${lines}
];
`;
  writeFileSync(join(here, '..', 'app', 'snug', 'puzzles.js'), src);
  console.log(`wrote ${out.length} boards to app/snug/puzzles.js`);
}
