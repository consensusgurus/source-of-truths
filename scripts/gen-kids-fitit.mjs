#!/usr/bin/env node
// gen-kids-fitit: build app/kids/fitit/puzzles.js, the Fit It bank.
//
// Fit It is Snug for kids: a 5x5 board with two or three squares missing and
// four or five pieces that fill it exactly, EVERY PIECE ALREADY TURNED THE
// RIGHT WAY. There is no rotation and no flipping on the kids board, so
// uniqueness is proved with the pieces FIXED: exactly one way to lay them
// down as printed. Pieces are 3 to 6 squares, each piece its own shape (no
// two pieces on a board are the same fixed polyomino), and no two boards in
// the bank share a region. The bank CYCLES over kids days (lib/kids-daily.js),
// so sixty boards is two months before a repeat.
// Rules the bank keeps, re-proved by scripts/verify-kids.mjs with its own
// solver:
//   - mask is 5 rows of 5, region connected, 2 or 3 holes
//   - pieces cover the region exactly, sol offsets place them without overlap
//   - exactly ONE fixed-orientation tiling
//   - 4 or 5 pieces of 3 to 6 squares, pairwise distinct as printed
//
//   node scripts/gen-kids-fitit.mjs [--days 60] [--seed 913]
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const DAYS = +opt('--days', 60);
const SEED = +opt('--seed', 913);
const W = 5, H = 5;

function mulberry(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const rand = mulberry(SEED);
const rnd = (n) => Math.floor(rand() * n);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const K = (r, c) => r * 8 + c;
const norm = (cells) => { const mr = Math.min(...cells.map((p) => p[0])), mc = Math.min(...cells.map((p) => p[1])); return cells.map(([r, c]) => [r - mr, c - mc]).sort((a, b) => a[0] - b[0] || a[1] - b[1]); };

// Fixed-orientation tiling count, cap 2.
function countFixed(region, pieces) {
  const cells = [...region].map((k) => [k >> 3, k & 7]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const filled = new Set(); const used = []; let count = 0;
  (function rec() {
    if (count >= 2) return;
    let t = null; for (const c of cells) if (!filled.has(K(c[0], c[1]))) { t = c; break; }
    if (!t) { count++; return; }
    for (let i = 0; i < pieces.length; i++) {
      if (used[i]) continue;
      const o = pieces[i]; const dr = t[0] - o[0][0], dc = t[1] - o[0][1];
      let ok = true; const ks = [];
      for (const [r, c] of o) { const k = K(r + dr, c + dc); if (r + dr < 0 || c + dc < 0 || !region.has(k) || filled.has(k)) { ok = false; break; } ks.push(k); }
      if (!ok) continue;
      used[i] = true; ks.forEach((k) => filled.add(k)); rec(); used[i] = false; ks.forEach((k) => filled.delete(k));
      if (count >= 2) return;
    }
  })();
  return count;
}
function connected(set) {
  const arr = [...set]; const seen = new Set([arr[0]]); const st = [arr[0]];
  while (st.length) { const k = st.pop(); const r = k >> 3, c = k & 7; for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = K(r + dr, c + dc); if (r + dr >= 0 && c + dc >= 0 && set.has(n) && !seen.has(n)) { seen.add(n); st.push(n); } } }
  return seen.size === set.size;
}
function makeRegion(holes) {
  for (let t = 0; t < 200; t++) {
    const s = new Set(); for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) s.add(K(r, c));
    const all = shuffle([...s]); for (let i = 0; i < holes; i++) s.delete(all[i]);
    if (connected(s)) return s;
  }
  return null;
}
function partition(region, k, minS, maxS) {
  for (let t = 0; t < 300; t++) {
    const cells = shuffle([...region]); const owner = new Map(); const groups = [];
    for (let i = 0; i < k; i++) { owner.set(cells[i], i); groups.push([cells[i]]); }
    let left = region.size - k, stuck = false;
    while (left > 0) {
      const cand = [];
      for (let g = 0; g < k; g++) { if (groups[g].length >= maxS) continue; for (const ck of groups[g]) { const r = ck >> 3, c = ck & 7; for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = K(r + dr, c + dc); if (r + dr >= 0 && c + dc >= 0 && region.has(n) && !owner.has(n)) cand.push([g, n]); } } }
      if (!cand.length) { stuck = true; break; }
      cand.sort((a, b) => groups[a[0]].length - groups[b[0]].length);
      const pick = cand[rnd(Math.min(cand.length, 6))]; owner.set(pick[1], pick[0]); groups[pick[0]].push(pick[1]); left--;
    }
    if (stuck || groups.some((g) => g.length < minS)) continue;
    return groups.map((g) => g.map((k) => [k >> 3, k & 7]).sort((a, b) => a[0] - b[0] || a[1] - b[1]));
  }
  return null;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const seen = new Set(); const out = [];
  for (let n = 1; n <= DAYS; n++) {
    const holes = 2 + (n % 2); const k = 4 + (n % 3 === 0 ? 1 : 0);
    let board = null;
    for (let t = 0; t < 5000 && !board; t++) {
      const region = makeRegion(holes); if (!region) continue;
      const rkey = [...region].sort((a, b) => a - b).join(','); if (seen.has(rkey)) continue;
      const groups = partition(region, k, 3, 6); if (!groups) continue;
      const pieces = groups.map(norm);
      if (new Set(pieces.map((p) => JSON.stringify(p))).size < k) continue;
      if (countFixed(region, pieces) !== 1) continue;
      seen.add(rkey);
      const mask = []; for (let r = 0; r < H; r++) { let s = ''; for (let c = 0; c < W; c++) s += region.has(K(r, c)) ? '1' : '0'; mask.push(s); }
      board = { mask, pieces, sol: groups.map((g, i) => [g[0][0] - pieces[i][0][0], g[0][1] - pieces[i][0][1]]) };
    }
    if (!board) throw new Error(`no board for #${n}`);
    out.push({ num: n, ...board });
  }
  const lines = out.map((p) => `  ${JSON.stringify(p).replace(/"(\w+)":/g, '$1: ')},`).join('\n');
  writeFileSync(join(here, '..', 'app', 'kids', 'fitit', 'puzzles.js'), `// Fit It bank. GENERATED by scripts/gen-kids-fitit.mjs; do not edit by hand.
// A 5x5 board (mask, '1' = a square to fill) and four or five pieces, each a
// list of [row, col] squares normalised to its top-left, PRINTED THE WAY THEY
// GO IN: the kids board has no rotation, and every board has exactly one way
// to lay the pieces as printed. sol is one [row, col] offset per piece. The
// bank CYCLES over kids days (lib/kids-daily.js).
export const PUZZLES = [
${lines}
];
`);
  console.log(`wrote ${out.length} boards to app/kids/fitit/puzzles.js`);
}
