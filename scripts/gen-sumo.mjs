#!/usr/bin/env node
// Bank generator for Sumo, the daily greater-than sudoku.
//
//   node scripts/gen-sumo.mjs --until 2026-12-31 [--from 2026-10-13] [--seed 20261013]
//   node scripts/gen-sumo.mjs --measure 80        (the ramp measurement below)
//
// It APPENDS to app/sumo/puzzles.js and never rewrites a board already in the
// file: the existing text is spliced in front of the new blocks byte for byte.
// The RNG is seeded per board as seed + num * 7919, so an unchanged run
// reproduces the same bytes. Engine: scripts/sumo-core.mjs.
//
// Every board it emits has been proved, by solvers NOT shared with
// scripts/verify-sumo.mjs, to
//   * have EXACTLY ONE solution under the signs, counted exhaustively,
//   * fall to LOGIC WITH NO GUESSING at exactly the level its weekday pins,
//   * need the signs: with every sign removed the printed digits admit more
//     than one grid (always true at these counts, checked anyway).
//
// THE SIGNS DO NEARLY ALL THE WORK, and that is measured, not assumed.
// `--measure 80` over 80 random grids: a greedy dig keeping the board solvable
// bottoms out at 0 to 7 printed digits (median 3 at level 1, 2 at level 2);
// about 15% of grids are unique with NO digits at all, and of those roughly a
// third fall to level 1, a quarter need level 2 and the rest need more than
// this toolkit. So the ramp cannot be a clue count the way Diag's is; it is a
// few digits stepping down to none, then the technique:
//
//   day  digits  level
//   Mon    8       1   sign reading, naked and hidden singles
//   Tue    6       1
//   Wed    4       1
//   Thu    2       1
//   Fri    0       1   nothing printed but the signs
//   Sat    2       2   also locked candidates and naked/hidden subsets
//   Sun    0       2   <- Sunday Edition: no digits, and it needs level 2
//
// "Sign reading" is in BOTH levels, because it is the rule: inside a box a
// square with k squares chained below it is at least k+1 (and with k chained
// above it at most 9-k), and along every sign the smaller square sits under
// the larger one's highest option and the larger above the smaller's lowest.
// Level is PINNED: a level-2 day that falls to level 1 is rejected.
//
// VARIETY CEILINGS over the WHOLE bank, frozen boards included:
//   V1  the solution grid never repeats
//   V2  no two solutions are the same grid up to the eight symmetries of the
//       square and reversing the digits (d -> 10-d, which flips every sign):
//       the signs come from the solution, so this IS the same puzzle
//   V3  no two solutions agree in more than 28 of 81 squares
//   V4  boards printing 4+ digits never repeat a digit mask
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fullGrid, signsOf, pairsOf, digBoard, logicSolve, countSolutions, rng } from './sumo-core.mjs';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };

if (process.argv.includes('--measure')) {
  const n = Number(arg('--measure', 80));
  const out = { 1: [], 2: [] }; let u = 0, l1 = 0, l2 = 0;
  for (let k = 0; k < n; k++) {
    const rnd = rng(1000 + k); let g = null; while (!g) g = fullGrid(rnd);
    const { h, v } = signsOf(g); const P = pairsOf(h, v); const e = new Array(81).fill(0);
    if (countSolutions(e, P, 2) === 1) { u++; if (logicSolve(e, P, 1).solved) l1++; else if (logicSolve(e, P, 2).solved) l2++; }
    for (const L of [1, 2]) out[L].push(digBoard(g, P, 0, L, rng(77 + k), 0).count);
  }
  const st = (a) => { const s = [...a].sort((x, y) => x - y); return `min ${s[0]} median ${s[s.length >> 1]} max ${s[s.length - 1]}`; };
  console.log(`grids ${n}\n greedy floor, level 1: ${st(out[1])}\n greedy floor, level 2: ${st(out[2])}\n unique with no digits: ${u} (level 1 ${l1}, level 2 only ${l2}, beyond ${u - l1 - l2})`);
  process.exit(0);
}

const BANK = process.env.SUMO_BANK || path.join(process.cwd(), 'app/sumo/puzzles.js');
const UNTIL = arg('--until', '2026-12-31');
const SEED = Number(arg('--seed', 20261013));
const FROM = arg('--from', null);
const MAX_ATTEMPTS = Number(arg('--attempts', 20000));

export const PRINTED_BY_DOW = { 0: 0, 1: 8, 2: 6, 3: 4, 4: 2, 5: 0, 6: 2 };
export const LEVEL_BY_DOW = { 0: 2, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 2 };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MAX_SOL_AGREEMENT = 28;

const DIHEDRAL = [
  (r, c) => [r, c], (r, c) => [c, 8 - r], (r, c) => [8 - r, 8 - c], (r, c) => [8 - c, r],
  (r, c) => [r, 8 - c], (r, c) => [8 - r, c], (r, c) => [c, r], (r, c) => [8 - c, 8 - r],
];
function canon(sol) {
  let best = null;
  for (const t of DIHEDRAL) for (const flip of [false, true]) {
    const g = new Array(81);
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) { const [nr, nc] = t(r, c); const v = sol[r * 9 + c]; g[nr * 9 + nc] = flip ? 10 - v : v; }
    const s = g.join('');
    if (best === null || s < best) best = s;
  }
  return best;
}

const asDate = (iso) => new Date(iso + 'T00:00:00Z');
const addDays = (iso, n) => { const d = asDate(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const dowOf = (iso) => asDate(iso).getUTCDay();
const labelOf = (iso) => { const d = asDate(iso); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`; };
const quizIdOf = (iso) => { const d = asDate(iso); return `sumo-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`; };

let text = '', PUZZLES = [];
if (fs.existsSync(BANK)) {
  text = fs.readFileSync(BANK, 'utf8');
  if (!text.endsWith('];\n')) { console.error('gen-sumo: the bank does not end in "];\\n"; refusing to splice.'); process.exit(1); }
  ({ PUZZLES } = await import(pathToFileURL(BANK).href + `?t=${Date.now()}`));
} else if (!FROM) { console.error('gen-sumo: no bank on disk and no --from.'); process.exit(1); }

const sols = [], canons = new Set(), masks = new Set();
const remember = (given, sol) => { sols.push(sol); canons.add(canon(sol)); if (given.filter(Boolean).length >= 4) masks.add(given.map((x) => (x ? 1 : 0)).join('')); };
for (const p of PUZZLES) remember(p.given.flat(), p.sol.flat());
const reject = (given, sol) => {
  if (sols.some((s) => s.join('') === sol.join(''))) return 'V1 solution';
  if (canons.has(canon(sol))) return 'V2 symmetry';
  for (const s of sols) { let o = 0; for (let i = 0; i < 81; i++) if (s[i] === sol[i]) o++; if (o > MAX_SOL_AGREEMENT) return 'V3 agreement'; }
  if (given.filter(Boolean).length >= 4 && masks.has(given.map((x) => (x ? 1 : 0)).join(''))) return 'V4 mask';
  return null;
};

const firstNew = PUZZLES.length ? addDays(PUZZLES[PUZZLES.length - 1].live, 1) : FROM;
const days = Math.round((asDate(UNTIL) - asDate(firstNew)) / 86400000) + 1;
if (days <= 0) { console.error(`gen-sumo: the bank already reaches ${UNTIL}.`); process.exit(0); }
const startNum = PUZZLES.length + 1;
const t0 = Date.now();
const boards = [];
for (let k = 0; k < days; k++) {
  const num = startNum + k, live = addDays(firstNew, k), dow = dowOf(live);
  const printed = PRINTED_BY_DOW[dow], level = LEVEL_BY_DOW[dow];
  const rnd = rng(SEED + num * 7919);
  const why = new Map(); const note = (r) => why.set(r, (why.get(r) || 0) + 1);
  let rec = null;
  for (let att = 1; att <= MAX_ATTEMPTS && !rec; att++) {
    const sol = fullGrid(rnd);
    if (!sol) { note('grid restart'); continue; }
    const { h, v } = signsOf(sol); const P = pairsOf(h, v);
    const { given, count } = digBoard(sol, P, printed, level, rnd, printed === 0 ? 0 : 400);
    if (count !== printed) { note(`dig stalled above ${printed}`); continue; }
    if (logicSolve(given, P, 1).solved !== (level === 1)) { note(level === 1 ? 'needed level 2' : 'fell to level 1'); continue; }
    if (countSolutions(given, P, 2) !== 1) { note('not unique'); continue; }
    if (countSolutions(given, P, 2, false) < 2) { note('signs were decoration'); continue; }
    const bad = reject(given, sol); if (bad) { note(bad); continue; }
    remember(given, sol);
    const c9 = (a) => Array.from({ length: 9 }, (_, r) => a.slice(r * 9, r * 9 + 9));
    rec = { num, quizId: quizIdOf(live), live, dateLabel: labelOf(live), sunday: dow === 0, printed, level, h, v, given: c9(given), sol: c9(sol) };
    process.stderr.write(`#${num} ${live} ${printed} digits level ${level} (attempt ${att})\n`);
  }
  if (!rec) { console.error(`gen-sumo: no board for #${num} ${live}: ${[...why.entries()].map(([a, b]) => `${a} x${b}`).join(', ')}`); process.exit(1); }
  boards.push(rec);
}

const body = boards.map((b) => `  {
    num: ${b.num},
    quizId: '${b.quizId}',
    live: '${b.live}',
    dateLabel: '${b.dateLabel}',
    sunday: ${b.sunday},
    printed: ${b.printed},
    level: ${b.level},
    h: ${JSON.stringify(b.h)},
    v: ${JSON.stringify(b.v)},
    given: ${JSON.stringify(b.given)},
    sol: ${JSON.stringify(b.sol)},
  },`).join('\n');

const HEADER = `// Puzzle data for Sumo, the daily greater-than sudoku. Imported ONLY by the
// server page (app/sumo/page.js), which filters live<=today before handing
// puzzles to the client, so future boards never reach a browser.
//
// An ordinary 9x9 sudoku plus a sign on every edge INSIDE a 3x3 box (12 per
// box, 108 in all) saying which of the two squares holds the larger digit.
// The board draws each sign as a bend in that grid line, pointing at the
// smaller square. Box borders carry no sign.
//
//   h[r]  6 chars, the in-box edges of row r at columns 0|1, 1|2, 3|4, 4|5,
//         6|7, 7|8: '<' when the LEFT square is smaller, '>' when larger.
//   v[k]  9 chars, the in-box edges under rows 0, 1, 3, 4, 6, 7 (k = 0..5):
//         '^' when the UPPER square is smaller, 'v' when larger.
//   given printed digits (0 = a square to fill), sol the solution.
//
// THE RAMP, measured (scripts/gen-sumo.mjs header): digits Mon 8, Tue 6,
// Wed 4, Thu 2, Fri 0 at level 1; Sat 2 and the Sunday Edition 0 at level 2.
// Every board has exactly one solution reachable by logic with no guessing,
// all re-proved by scripts/verify-sumo.mjs, which shares no code with the
// generator.

export const PUZZLES = [
`;
fs.mkdirSync(path.dirname(BANK), { recursive: true });
fs.writeFileSync(BANK, (text ? text.slice(0, text.length - 3) : HEADER) + body + '\n];\n');
console.error(`wrote ${BANK}: ${PUZZLES.length} frozen + ${boards.length} new, last ${boards[boards.length - 1].live}, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
