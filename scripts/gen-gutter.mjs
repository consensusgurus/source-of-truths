#!/usr/bin/env node
// Bank generator for the two gutter sudokus, Frame and Rim. One script, two
// rulebooks, because the boards differ only in what the gutter prints:
//
//   node scripts/gen-gutter.mjs frame --until 2026-11-30 [--from 2026-09-08] [--seed N]
//   node scripts/gen-gutter.mjs rim   --until 2026-11-30 [--from 2026-09-08] [--seed N]
//
// It APPENDS to app/<game>/puzzles.js and never rewrites a board that is
// already in the file (the frozen past keeps its exact bytes, per the daily
// puzzle authoring standard). With no bank on disk it authors one from --from.
// The RNG is seeded per board as seed + num * 7919, so an unchanged run
// reproduces the same bytes and the new segment cannot replay the frozen one.
//
// FRAME prints, outside every row and column end, the SUM of the first three
// cells reading in from that edge: thirty-six sums, every one printed, the way
// Sando prints all eighteen. The ramp is the printed DIGITS inside the grid:
//
//   Mon 14 · Tue 12 · Wed 10 · Thu 8 · Fri 6 · Sat 4 · Sun 2
//
// Measured before choosing: with all 36 sums, a random 8-digit board falls to
// the frame deduction plus singles about 4 times in 5, a 4-digit board 2 in 5,
// a 2-digit board 1 in 7, and a board with NO digits at all 1 in 50. Sunday
// prints two.
//
// RIM prints the three DIGITS themselves, as an unordered set, and prints NO
// digit inside the grid ever: a full set of 36 triples pins the grid every
// time with singles alone, so the ramp is how many of the 36 triples are
// printed and the empty gutters are the puzzle:
//
//   Mon 30 · Tue 27 · Wed 24 · Thu 21 · Fri 18 · Sat 16 · Sun 13
//
// Measured: a greedy dig (drop triples while the board still falls to logic)
// bottoms out at 13 to 17 of 36 (mode 15), so Sunday's 13 is the floor of the
// rulebook, found by re-digging rather than by a smaller number that would
// need a guess. Rim boards are dug: triples come out one at a time in a random
// order and a removal is kept only while the board still falls to logic.
//
// THERE IS NO DIFFICULTY-LEVEL FIELD on either game, and that is a measured
// finding rather than an omission, as with Sando: on every trial board, and
// on every banked one, a board either falls to the gutter deduction plus
// naked and hidden singles, or it does not fall at all. The verifiers assert
// exactly that (level 1) and nothing looser.
//
// Every board is proved from scratch, by the solvers in scripts/gutter-core.mjs
// which the verifiers deliberately do not import, to have EXACTLY ONE solution,
// to fall to LOGIC WITH NO GUESSING at level 1, and (Frame) to need its gutter:
// the printed digits alone admit more than one grid.
//
// POOL VARIETY CEILINGS, over the whole bank: the clue mask never repeats, the
// solution never repeats, no two solutions agree on the same grid up to
// relabelling and the eight symmetries of the square (the group the "first
// three from the edge" structure survives; band swaps do not), no two solutions
// agree in more than 28 of 81 cells, and (Rim) no two boards print the same
// set of gutters.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { rng, shuffle, fullSolution, TRIPLES, sumOf, setOf, countSolutions, logicSolve } from './gutter-core.mjs';

const GAME = process.argv[2];
if (GAME !== 'frame' && GAME !== 'rim') { console.error('usage: node scripts/gen-gutter.mjs frame|rim --until YYYY-MM-DD [--from YYYY-MM-DD]'); process.exit(1); }
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const BANK = process.env[`${GAME.toUpperCase()}_BANK`] || path.join(process.cwd(), `app/${GAME}/puzzles.js`);
const UNTIL = arg('--until', '2026-11-30');
const FROM = arg('--from', null);
const SEED = Number(arg('--seed', GAME === 'frame' ? 20260909 : 20260910));
const MAX_ATTEMPTS = Number(arg('--attempts', 20000));

const FRAME_GIVENS = { 0: 2, 1: 14, 2: 12, 3: 10, 4: 8, 5: 6, 6: 4 };
const RIM_PRINTED = { 0: 13, 1: 30, 2: 27, 3: 24, 4: 21, 5: 18, 6: 16 };
const MAX_SOL_AGREEMENT = 28;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const solves = (given, clues, sol) => { const r = logicSolve(given, clues, 1); return !!r && r.join(',') === sol.join(','); };

// ── variety bookkeeping ──────────────────────────────────────────────────────
const DIHEDRAL = [
  (r, c) => [r, c], (r, c) => [c, 8 - r], (r, c) => [8 - r, 8 - c], (r, c) => [8 - c, r],
  (r, c) => [r, 8 - c], (r, c) => [8 - r, c], (r, c) => [c, r], (r, c) => [8 - c, 8 - r],
];
function canonical(sol) {
  let best = null;
  for (const t of DIHEDRAL) {
    const g = new Array(81);
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) { const [nr, nc] = t(r, c); g[nr * 9 + nc] = sol[r * 9 + c]; }
    const map = new Map(); let s = '';
    for (const v of g) { if (!map.has(v)) map.set(v, map.size + 1); s += map.get(v); }
    if (best === null || s < best) best = s;
  }
  return best;
}
const pool = { mask: new Set(), sol: new Set(), canon: new Set(), gut: new Set(), sols: [] };
function poolAdd(mask, sol, gut) { pool.mask.add(mask); pool.sol.add(sol.join('')); pool.canon.add(canonical(sol)); pool.gut.add(gut); pool.sols.push(sol); }
function poolReject(mask, sol, gut) {
  if (pool.mask.has(mask) && GAME === 'frame') return 'clue mask repeats';
  if (pool.sol.has(sol.join(''))) return 'solution repeats';
  if (pool.canon.has(canonical(sol))) return 'solution repeats up to symmetry';
  if (GAME === 'rim' && pool.gut.has(gut)) return 'gutter pattern repeats';
  for (const s of pool.sols) { let o = 0; for (let i = 0; i < 81; i++) if (s[i] === sol[i]) o++; if (o > MAX_SOL_AGREEMENT) return 'solution agreement'; }
  return null;
}

// ── one board ────────────────────────────────────────────────────────────────
function buildFrame(sol, nGivens, rnd) {
  const clues = Array.from({ length: 36 }, (_, t) => ({ sum: sumOf(t, sol) }));
  const given = new Array(81).fill(0);
  for (const i of shuffle([...Array(81).keys()], rnd).slice(0, nGivens)) given[i] = sol[i];
  if (!solves(given, clues, sol)) return null;
  if (countSolutions(given, clues, 2) !== 1) return null;
  // the gutter must be load-bearing: the digits alone admit more than one grid
  if (countSolutions(given, Array(36).fill(null), 2) < 2) return null;
  return { given, clues };
}
function buildRim(sol, nPrinted, rnd) {
  const clues = Array.from({ length: 36 }, (_, t) => ({ set: setOf(t, sol) }));
  const given = new Array(81).fill(0);
  let n = 36;
  for (const t of shuffle([...Array(36).keys()], rnd)) {
    if (n <= nPrinted) break;
    const save = clues[t]; clues[t] = null;
    if (solves(given, clues, sol)) n--; else clues[t] = save;
  }
  if (n !== nPrinted) return null;
  if (countSolutions(given, clues, 2) !== 1) return null;
  return { given, clues };
}

// ── dates ────────────────────────────────────────────────────────────────────
const asDate = (iso) => new Date(iso + 'T00:00:00Z');
const addDays = (iso, k) => { const d = asDate(iso); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10); };
const dowOf = (iso) => asDate(iso).getUTCDay();
const labelOf = (iso) => { const d = asDate(iso); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`; };
const quizIdOf = (iso) => { const d = asDate(iso); return `${GAME}-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`; };

// ── the run ──────────────────────────────────────────────────────────────────
let text = '', PUZZLES = [];
if (fs.existsSync(BANK)) {
  text = fs.readFileSync(BANK, 'utf8');
  if (!text.endsWith('];\n')) { console.error(`gen-gutter: ${BANK} does not end in "];\\n"; refusing to splice.`); process.exit(1); }
  ({ PUZZLES } = await import(pathToFileURL(BANK).href + `?t=${Date.now()}`));
} else if (!FROM) {
  console.error(`gen-gutter: ${BANK} is missing and no --from was given.`);
  process.exit(1);
}
const gutKey = (p) => GAME === 'rim' ? ['top', 'bottom', 'left', 'right'].map((s) => p.rim[s].map((v) => (v ? 1 : 0)).join('')).join('|') : '';
for (const p of PUZZLES) poolAdd(p.given.flat().map((v) => (v ? 1 : 0)).join(''), p.sol.flat(), gutKey(p));
const firstNew = PUZZLES.length ? addDays(PUZZLES[PUZZLES.length - 1].live, 1) : FROM;
const days = Math.round((asDate(UNTIL) - asDate(firstNew)) / 86400000) + 1;
if (days <= 0) { console.error(`gen-gutter: the bank already reaches ${UNTIL}. Nothing to do.`); process.exit(0); }
const startNum = PUZZLES.length + 1;

const t0 = Date.now();
const boards = [];
for (let k = 0; k < days; k++) {
  const num = startNum + k, live = addDays(firstNew, k), dow = dowOf(live);
  const rnd = rng(SEED + num * 7919);
  const knob = GAME === 'frame' ? FRAME_GIVENS[dow] : RIM_PRINTED[dow];
  let rec = null;
  const why = new Map(); const note = (r) => why.set(r, (why.get(r) || 0) + 1);
  for (let att = 1; att <= MAX_ATTEMPTS && !rec; att++) {
    const sol = fullSolution(rnd);
    const b = GAME === 'frame' ? buildFrame(sol, knob, rnd) : buildRim(sol, knob, rnd);
    if (!b) { note('no logic-only board at this count'); continue; }
    const mask = b.given.map((v) => (v ? 1 : 0)).join('');
    const sides = (f) => ({ top: TRIPLES.slice(0, 9).map((_, i) => f(i)), bottom: TRIPLES.slice(9, 18).map((_, i) => f(9 + i)), left: TRIPLES.slice(18, 27).map((_, i) => f(18 + i)), right: TRIPLES.slice(27, 36).map((_, i) => f(27 + i)) });
    const gut = GAME === 'rim' ? ['top', 'bottom', 'left', 'right'].map((s, si) => Array.from({ length: 9 }, (_, i) => (b.clues[si * 9 + i] ? 1 : 0)).join('')).join('|') : '';
    const bad = poolReject(mask, sol, gut);
    if (bad) { note(bad); continue; }
    poolAdd(mask, sol, gut);
    const chunk9 = (a) => Array.from({ length: 9 }, (_, r) => a.slice(r * 9, r * 9 + 9));
    rec = { num, quizId: quizIdOf(live), live, dateLabel: labelOf(live), sunday: dow === 0 };
    if (GAME === 'frame') { rec.clues = knob; rec.sums = sides((t) => b.clues[t].sum); }
    else { rec.printed = knob; rec.rim = sides((t) => (b.clues[t] ? [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => b.clues[t].set & (1 << d)).join('') : null)); }
    rec.given = chunk9(b.given); rec.sol = chunk9(sol);
    process.stderr.write(`#${num} ${live} ${GAME === 'frame' ? knob + ' digits' : knob + ' triples'} (attempt ${att})\n`);
  }
  if (!rec) {
    console.error(`gen-gutter: no board for #${num} ${live} in ${MAX_ATTEMPTS} attempts: ${[...why.entries()].map(([r, n]) => `${r} x${n}`).join(', ')}`);
    process.exit(1);
  }
  boards.push(rec);
}

const body = boards.map((b) => `  {
    num: ${b.num},
    quizId: '${b.quizId}',
    live: '${b.live}',
    dateLabel: '${b.dateLabel}',
    sunday: ${b.sunday},
${GAME === 'frame' ? `    clues: ${b.clues},\n    sums: ${JSON.stringify(b.sums)},` : `    printed: ${b.printed},\n    rim: ${JSON.stringify(b.rim)},`}
    given: ${JSON.stringify(b.given)},
    sol: ${JSON.stringify(b.sol)},
  },`).join('\n');

const HEADERS = {
  frame: `// Puzzle data for Frame, the daily frame sudoku. Imported ONLY by the server
// page (app/frame/page.js), which filters live<=today before handing puzzles to
// the client, so future boards and their solutions never reach a browser.
//
// Frame sudoku is ordinary sudoku plus a number printed outside EVERY row and
// column end: the total of the first three cells reading in from that edge.
// Thirty-six sums, all printed, every board; the ramp is the printed digits.
//
//   clues    printed digits inside the grid. Mon 14 · Tue 12 · Wed 10 · Thu 8 ·
//            Fri 6 · Sat 4 · Sunday Edition 2.
//   sums     { top, bottom, left, right }, nine each, indexed by column (top,
//            bottom) or row (left, right); each is the sum of that line's three
//            cells nearest that edge, 6 to 24.
//   given    the printed digits (0 = a square the player fills), sol the answer.
//
// EVERY board has EXACTLY ONE solution, falls to the frame deduction plus naked
// and hidden singles with no guessing, and needs its gutter: the printed digits
// alone admit more than one grid. Re-proved by scripts/verify-frame.mjs, which
// shares no code with the generator.

export const PUZZLES = [
`,
  rim: `// Puzzle data for Rim, the daily outside sudoku. Imported ONLY by the server
// page (app/rim/page.js), which filters live<=today before handing puzzles to
// the client, so future boards and their solutions never reach a browser.
//
// Outside sudoku is ordinary sudoku with NO digits printed inside the grid at
// all. Instead, outside some row and column ends, the three digits that appear
// in that line's first three cells reading in from that edge are printed, in
// no particular order. The empty gutters are the puzzle; the ramp is how many
// of the thirty-six triples are printed.
//
//   printed  triples on the board. Mon 30 · Tue 27 · Wed 24 · Thu 21 · Fri 18 ·
//            Sat 16 · Sunday Edition 13, the floor of the rulebook.
//   rim      { top, bottom, left, right }, nine each, indexed by column (top,
//            bottom) or row (left, right); a string of three ascending digits,
//            or null where nothing is printed.
//   given    always all zeros (kept for shape); sol the answer.
//
// EVERY board has EXACTLY ONE solution and falls to the rim deduction plus
// naked and hidden singles with no guessing. Re-proved by
// scripts/verify-rim.mjs, which shares no code with the generator.

export const PUZZLES = [
`,
};
fs.mkdirSync(path.dirname(BANK), { recursive: true });
fs.writeFileSync(BANK, (text ? text.slice(0, text.length - 3) : HEADERS[GAME]) + body + '\n];\n');
console.error(`\nwrote ${BANK}: ${PUZZLES.length} frozen + ${boards.length} new = ${PUZZLES.length + boards.length} boards, last live ${boards[boards.length - 1].live}, in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
