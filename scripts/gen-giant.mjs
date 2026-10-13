#!/usr/bin/env node
// Bank generator for Giant, the daily 16x16 sudoku.
//
//   node scripts/gen-giant.mjs --until 2026-12-31 [--from 2026-10-13] [--seed 20261013]
//   node scripts/gen-giant.mjs --measure 40      (greedy-floor survey, writes nothing)
//
// It APPENDS to app/giant/puzzles.js and never rewrites a board already in the
// file: the existing text is kept byte for byte and new blocks go after it, so
// the frozen past cannot drift (see the daily puzzle authoring standard in
// CLAUDE.md). It starts the day after the bank's current last date and stops
// on --until. With no bank on disk it authors one from --from.
//
// A board is an ordinary sudoku, just bigger: sixteen rows, sixteen columns and
// sixteen 4x4 boxes, each holding the sixteen symbols 1 to 9 then A to G
// exactly once. Internally a symbol is the number 1..16 (A is 10, G is 16), and
// that is how the bank stores it; the client draws 10..16 as letters.
//
// THE WEEKDAY RAMP, both knobs PINNED rather than capped (the Diag pattern):
//
//   day  clues  level
//   Mon   128     1     naked and hidden singles, and nothing harder
//   Tue   120     1
//   Wed   112     1
//   Thu   106     1
//   Fri   100     1
//   Sat    96     1
//   Sun    90     2     <- Sunday Edition: the fewest clues, and the only day
//                         that needs locked candidates or subsets
//
// Out of 256 squares. MEASURED, not guessed (--measure, 2026-10-13, 12 random
// grids per level): a greedy dig under the singles-only solver bottoms out at
// 90 to 98 clues (median 94), and under the full toolkit at 89 to 97 (median
// 94). So on a 16x16 the extra techniques buy almost nothing in clue count,
// and a level-2 day above ~95 clues would nearly always fall to singles and be
// rejected forever. That is why the week ramps on CLUES alone at level 1 and
// only the Sunday Edition, dug past the singles floor by local search, is
// pinned to level 2.
//
// Every board it emits has been proved, by the solvers here, to have exactly
// one solution (a logical solve that only ever makes sound deductions and
// finishes the grid admits no other solution) and to fall to logic with no
// guessing at EXACTLY the level its weekday pins: a level-2 day that falls to
// singles alone is rejected, not stored with a smaller level. Then
// scripts/verify-giant.mjs re-proves all of it with its own independent
// solvers (Set candidates and an exhaustive counter) and trusts no stored field.
//
// HOW A BOARD IS BUILT. Fill a random 16x16 grid (MRV backtracking on bitmask
// candidates), then dig clues out in a random order, keeping a removal only
// while the board still falls to logic AT THE DAY'S LEVEL, and stop at the
// day's clue count exactly. A dig that stalls above the count is PERTURBED:
// put a few random clues back and re-dig in a fresh order (iterated local
// search), the trick Diag needed for its weekend.
//
// VARIETY: the solution grid and the clue mask never repeat across the bank.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const N = 16, CELLS = 256, B = 4, ALL = 0xffff;
const PRINTED_BY_DOW = { 0: 90, 1: 128, 2: 120, 3: 112, 4: 106, 5: 100, 6: 96 };
const LEVEL_BY_DOW = { 0: 2, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 };
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };

// ---- geometry ------------------------------------------------------------
const rowOf = (i) => (i / N) | 0, colOf = (i) => i % N;
const boxOf = (i) => ((rowOf(i) / B) | 0) * B + ((colOf(i) / B) | 0);
const UNITS = [];
for (let r = 0; r < N; r++) UNITS.push(Array.from({ length: N }, (_, c) => r * N + c));
for (let c = 0; c < N; c++) UNITS.push(Array.from({ length: N }, (_, r) => r * N + c));
for (let b = 0; b < N; b++) {
  const r0 = ((b / B) | 0) * B, c0 = (b % B) * B, u = [];
  for (let r = 0; r < B; r++) for (let c = 0; c < B; c++) u.push((r0 + r) * N + c0 + c);
  UNITS.push(u);
}
const UNITS_OF = Array.from({ length: CELLS }, () => []);
UNITS.forEach((u, k) => u.forEach((i) => UNITS_OF[i].push(k)));
const PEERS = Array.from({ length: CELLS }, (_, i) => {
  const s = new Set();
  for (const k of UNITS_OF[i]) for (const j of UNITS[k]) if (j !== i) s.add(j);
  return [...s];
});
const pc = (x) => { x = x - ((x >> 1) & 0x55555555); x = (x & 0x33333333) + ((x >> 2) & 0x33333333); return (((x + (x >> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24; };
const low = (m) => 31 - Math.clz32(m & -m); // index of the lowest set bit

// ---- rng -----------------------------------------------------------------
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shuffle(a, rnd) { for (let i = a.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ---- a random full grid --------------------------------------------------
function fillGrid(rnd) {
  const g = new Int8Array(CELLS);
  const cand = new Int32Array(CELLS).fill(ALL);
  let nodes = 0;
  function rec() {
    if (++nodes > 200000) return false;
    let best = -1, bc = 99;
    for (let i = 0; i < CELLS; i++) if (!g[i]) { const n = pc(cand[i]); if (n < bc) { bc = n; best = i; if (n <= 1) break; } }
    if (best < 0) return true;
    if (bc === 0) return false;
    const opts = [];
    for (let m = cand[best]; m; m &= m - 1) opts.push(low(m));
    shuffle(opts, rnd);
    for (const b of opts) {
      const saved = [];
      g[best] = b + 1;
      const bit = 1 << b;
      let ok = true;
      for (const j of PEERS[best]) if (!g[j] && (cand[j] & bit)) { cand[j] &= ~bit; saved.push(j); if (!cand[j]) ok = false; }
      if (ok && rec()) return true;
      for (const j of saved) cand[j] |= bit;
      g[best] = 0;
    }
    return false;
  }
  for (;;) { nodes = 0; g.fill(0); cand.fill(ALL); if (rec()) return Array.from(g); }
}

// ---- the graded logical solver -------------------------------------------
// Sound deductions only, so when it finishes the grid the board has exactly
// one solution. Returns { solved, level } where level is the hardest family it
// needed (1 singles, 2 locked candidates / subsets).
function logic(given, maxLevel) {
  const v = Int8Array.from(given);
  const cand = new Int32Array(CELLS);
  for (let i = 0; i < CELLS; i++) cand[i] = v[i] ? 1 << (v[i] - 1) : ALL;
  for (let i = 0; i < CELLS; i++) if (v[i]) { const bit = 1 << (v[i] - 1); for (const j of PEERS[i]) cand[j] &= ~bit; }
  let left = 0; for (let i = 0; i < CELLS; i++) if (!v[i]) left++;
  let level = 1;
  const place = (i, d) => { v[i] = d; cand[i] = 1 << (d - 1); left--; const bit = cand[i]; for (const j of PEERS[i]) cand[j] &= ~bit; };
  for (;;) {
    if (!left) return { solved: true, level };
    let moved = false;
    for (let i = 0; i < CELLS; i++) if (!v[i]) {
      if (!cand[i]) return { solved: false, level };
      if (pc(cand[i]) === 1) { place(i, low(cand[i]) + 1); moved = true; }
    }
    if (moved) continue;
    for (const u of UNITS) {
      let seen = 0, once = 0, twice = 0;
      for (const i of u) { const m = v[i] ? 0 : cand[i]; twice |= once & m; once |= m; if (v[i]) seen |= 1 << (v[i] - 1); }
      if ((once | seen) !== ALL) return { solved: false, level };
      let single = once & ~twice & ~seen;
      while (single) { const b = low(single); single &= single - 1; for (const i of u) if (!v[i] && (cand[i] & (1 << b))) { place(i, b + 1); moved = true; break; } }
      if (moved) break;
    }
    if (moved) continue;
    if (maxLevel < 2) return { solved: false, level };
    // locked candidates: a digit's spots in one unit all lie in another unit
    let elim = false;
    for (let k = 0; k < UNITS.length && !elim; k++) {
      const u = UNITS[k];
      for (let b = 0; b < N; b++) {
        const bit = 1 << b, spots = [];
        for (const i of u) if (!v[i] && (cand[i] & bit)) spots.push(i);
        if (spots.length < 2 || spots.length > B) continue;
        for (const k2 of UNITS_OF[spots[0]]) {
          if (k2 === k || !spots.every((i) => UNITS_OF[i].includes(k2))) continue;
          for (const j of UNITS[k2]) if (!v[j] && !spots.includes(j) && (cand[j] & bit)) { cand[j] &= ~bit; elim = true; }
        }
      }
    }
    // naked pairs/triples and hidden pairs
    for (let k = 0; k < UNITS.length && !elim; k++) {
      const open = UNITS[k].filter((i) => !v[i]);
      for (let a = 0; a < open.length; a++) for (let b = a + 1; b < open.length; b++) {
        const two = cand[open[a]] | cand[open[b]];
        if (pc(two) === 2) for (const j of open) if (j !== open[a] && j !== open[b] && (cand[j] & two)) { cand[j] &= ~two; elim = true; }
        for (let c = b + 1; c < open.length; c++) {
          const three = two | cand[open[c]];
          if (pc(three) === 3) for (const j of open) if (j !== open[a] && j !== open[b] && j !== open[c] && (cand[j] & three)) { cand[j] &= ~three; elim = true; }
        }
      }
      const where = Array.from({ length: N }, () => []);
      for (const i of open) for (let m = cand[i]; m; m &= m - 1) where[low(m)].push(i);
      for (let d1 = 0; d1 < N; d1++) for (let d2 = d1 + 1; d2 < N; d2++) {
        const s1 = where[d1], s2 = where[d2];
        if (s1.length !== 2 || s2.length !== 2 || s1[0] !== s2[0] || s1[1] !== s2[1]) continue;
        const keep = (1 << d1) | (1 << d2);
        for (const i of s1) if (cand[i] & ~keep) { cand[i] &= keep; elim = true; }
      }
    }
    if (!elim) return { solved: false, level };
    level = 2;
  }
}

// ---- dig -----------------------------------------------------------------
function dig(sol, target, lvl, rnd, iters = 400) {
  const greedy = (start) => {
    const g = start.slice();
    let n = g.filter(Boolean).length;
    for (const i of shuffle([...Array(CELLS).keys()], rnd)) {
      if (n <= target) break;
      if (!g[i]) continue;
      const d = g[i]; g[i] = 0;
      if (logic(g, lvl).solved) n--; else g[i] = d;
    }
    return g;
  };
  let cur = greedy(sol);
  let n = cur.filter(Boolean).length;
  for (let t = 0; t < iters && n > target; t++) {
    const g = cur.slice();
    const empty = []; for (let i = 0; i < CELLS; i++) if (!g[i]) empty.push(i);
    shuffle(empty, rnd);
    const k = 2 + ((rnd() * 5) | 0);
    for (let j = 0; j < k && j < empty.length; j++) g[empty[j]] = sol[empty[j]];
    const nx = greedy(g), m = nx.filter(Boolean).length;
    if (m <= n) { cur = nx; n = m; }
  }
  return n === target ? cur : null;
}

// ---- measure mode --------------------------------------------------------
if (arg('--measure')) {
  const runs = Number(arg('--measure'));
  // a plain greedy floor survey
  for (const lvl of [1, 2]) {
    const out = [];
    const t0 = Date.now();
    for (let r = 0; r < runs; r++) {
      const rnd = mulberry(5000 + r * 17 + lvl);
      const sol = fillGrid(rnd);
      const g = sol.slice(); let n = CELLS;
      for (const i of shuffle([...Array(CELLS).keys()], rnd)) { const d = g[i]; g[i] = 0; if (logic(g, lvl).solved) n--; else g[i] = d; }
      out.push(n);
    }
    out.sort((a, b) => a - b);
    console.log(`level ${lvl}: greedy floor min ${out[0]} median ${out[out.length >> 1]} max ${out[out.length - 1]} (${runs} digs, ${((Date.now() - t0) / runs).toFixed(0)} ms each)`);
  }
  process.exit(0);
}

// ---- dates ---------------------------------------------------------------
const asDate = (iso) => new Date(iso + 'T00:00:00Z');
const addDays = (iso, n) => { const d = asDate(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const labelOf = (iso) => { const d = asDate(iso); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`; };
const quizIdOf = (iso) => { const d = asDate(iso); return `giant-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`; };

// ---- build ---------------------------------------------------------------
const BANK = path.join(process.cwd(), 'app/giant/puzzles.js');
const UNTIL = arg('--until', '2026-12-31');
const SEED = Number(arg('--seed', '20261013'));
let existing = [];
let text = null;
if (fs.existsSync(BANK)) {
  text = fs.readFileSync(BANK, 'utf8');
  existing = (await import(pathToFileURL(BANK).href + '?t=' + Date.now())).PUZZLES;
}
let day = existing.length ? addDays(existing[existing.length - 1].live, 1) : arg('--from', '2026-10-13');
let num = existing.length ? existing[existing.length - 1].num + 1 : 1;
const seenSol = new Set(existing.map((p) => p.sol.flat().join(',')));
const seenMask = new Set(existing.map((p) => p.given.flat().map((x) => (x ? 1 : 0)).join('')));

const rows = (flat) => Array.from({ length: N }, (_, r) => flat.slice(r * N, r * N + N));
let body = '';
const t0 = Date.now();
while (day <= UNTIL) {
  const dow = asDate(day).getUTCDay();
  const target = PRINTED_BY_DOW[dow], lvl = LEVEL_BY_DOW[dow];
  const rnd = mulberry(SEED + num * 7919);
  let board = null, sol = null;
  for (let attempt = 0; !board; attempt++) {
    if (attempt > 40) throw new Error(`${day}: could not reach ${target} clues at level ${lvl}`);
    sol = fillGrid(rnd);
    if (seenSol.has(sol.join(','))) continue;
    const g = dig(sol, target, lvl, rnd);
    if (!g) continue;
    const r = logic(g, 2);
    if (!r.solved || r.level !== lvl) continue;          // pinned, not capped
    if (lvl === 2 && logic(g, 1).solved) continue;
    const mk = g.map((x) => (x ? 1 : 0)).join('');
    if (seenMask.has(mk)) continue;
    board = g; seenMask.add(mk); seenSol.add(sol.join(','));
  }
  const rec = {
    num, quizId: quizIdOf(day), live: day, dateLabel: labelOf(day), sunday: dow === 0,
    printed: target, level: lvl,
  };
  body += `  {\n    num: ${rec.num},\n    quizId: '${rec.quizId}',\n    live: '${rec.live}',\n    dateLabel: '${rec.dateLabel}',\n    sunday: ${rec.sunday},\n    printed: ${rec.printed},\n    level: ${rec.level},\n    given: ${JSON.stringify(rows(board))},\n    sol: ${JSON.stringify(rows(sol))},\n  },\n`;
  process.stdout.write(`#${num} ${day} ${target} L${lvl}  ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
  num++; day = addDays(day, 1);
}

const HEADER = `// Puzzle data for Giant, the daily 16x16 sudoku. Imported ONLY by the server
// page (app/giant/page.js), which filters live<=today before handing puzzles to
// the client, so future boards and their solutions never reach a browser.
//
// A board is an ordinary sudoku at sixteen: 16 rows, 16 columns and 16 boxes of
// 4x4, each holding the sixteen symbols exactly once. Symbols are stored as the
// numbers 1..16 and drawn as 1 to 9 then A to G (10 is A, 16 is G). \`given\`
// holds the printed clues (0 = a square the player fills), \`sol\` the solution,
// used for the win check, the one hint, and reveal-and-end.
//
// TWO MEASURED FIELDS, both recomputed by scripts/verify-giant.mjs rather than
// trusted:
//   printed  clues on the board, of 256. Mon 128, Tue 120, Wed 112, Thu 106,
//            Fri 100, Sat 96, and the Sunday Edition at 90, the fewest.
//   level    the hardest technique the board demands: 1 naked and hidden
//            singles, 2 also locked candidates and naked/hidden subsets.
//            PINNED per weekday: Mon-Sat always 1, the Sunday Edition 2.
//
// EVERY board has EXACTLY ONE solution, reachable by logic with no guessing.
// Generated by scripts/gen-giant.mjs, which only ever appends.

export const PUZZLES = [
`;
fs.mkdirSync(path.dirname(BANK), { recursive: true });
fs.writeFileSync(BANK, (text ? text.slice(0, text.lastIndexOf('];')) : HEADER) + body + '];\n');
console.log(`gen-giant: wrote through ${addDays(day, -1)} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
