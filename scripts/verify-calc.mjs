// scripts/verify-calc.mjs — re-derives EVERY stored figure on every Calc board
// with its own solver rather than trusting the bank, per the daily puzzle
// authoring standard. Run before any push that touches app/calc/puzzles.js.
//
// What it proves, board by board:
//   * geometry: n is 6 or 7, the cell grid is a correct checkerboard of digits
//     1-9 on the even squares and + - * / on the odd ones.
//   * every stored `path` is a LEGAL route (orthogonal, no cell twice, starts at
//     the top-left, ends at the bottom-right) and evaluates to its target.
//   * `routes` and `minLen` recomputed by solveFor, which walks the board again
//     and shares no state with the generator's enumerate.
//   * `boardRoutes` recomputed by enumerate.
//   * the weekday ramp: the day's route band and shortest-route cap, and that a
//     Sunday carries THREE targets in descending difficulty while every weekday
//     carries one.
//   * schedule: contiguous dates, distinct numbers in order, quizId and
//     dateLabel agreeing with `live`, and the sunday flag agreeing with the date.
//
// Boards that have already gone live are frozen history and are checked but never
// rewritten; a failure on one is reported, not fixed.
import fs from 'fs';
import { enumerate, solveFor, evalRoute, isNumCell, neighbours } from './calc-core.mjs';

const SPEC = {
  1: { n: 6, bands: [[40, 400, 13]] },
  2: { n: 6, bands: [[15, 39, 13]] },
  3: { n: 6, bands: [[5, 14, 15]] },
  4: { n: 7, bands: [[25, 300, 15]] },
  5: { n: 7, bands: [[8, 24, 17]] },
  6: { n: 7, bands: [[2, 7, 17]] },
  0: { n: 7, bands: [[25, 300, 17], [8, 24, 19], [1, 4, 19]] },
};
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Default source is the SHIPPED bank, so `node scripts/verify-calc.mjs` with no
// argument checks what is actually deployed. A path argument still works, for a
// generator checkpoint (.json) or another copy of puzzles.js.
const src = process.argv[2] || new URL('../app/calc/puzzles.js', import.meta.url).href;
let boards;
if (src.endsWith('.json')) {
  const b = JSON.parse(fs.readFileSync(src, 'utf8'));
  boards = Object.keys(b).sort().map((k) => b[k]);
} else {
  boards = (await import(src)).PUZZLES;
}
let fails = 0, warns = 0;
const fail = (p, m) => { console.error(`FAIL ${p.live} #${p.num}: ${m}`); fails++; };

// VARIETY (added 2026-11-12 with the December restock): a target number appears
// at most TARGET_CEILING times across the whole bank, and no grid repeats. The
// bank through 2026-11-30 already sat at a maximum of 3, so this holds for every
// board rather than being date-gated.
const TARGET_CEILING = 3;
const targetUse = new Map(), gridSeen = new Map();
let prevDate = null, prevNum = null;
for (const p of boards) {
  for (const t of p.targets || []) {
    const c = (targetUse.get(t.target) || 0) + 1; targetUse.set(t.target, c);
    if (c > TARGET_CEILING) fail(p, `target ${t.target} is used ${c} times in the bank, ceiling ${TARGET_CEILING}`);
  }
  const g = (p.cells || []).join('');
  if (gridSeen.has(g)) fail(p, `grid repeats #${gridSeen.get(g)}`);
  gridSeen.set(g, p.num);
  const d = new Date(Date.UTC(+p.live.slice(0, 4), +p.live.slice(5, 7) - 1, +p.live.slice(8, 10)));
  const dow = d.getUTCDay(), spec = SPEC[dow];

  // --- schedule ---
  if (prevDate && (d - prevDate) / 86400000 !== 1) fail(p, `date is not the day after ${prevDate.toISOString().slice(0, 10)}`);
  if (prevNum !== null && p.num !== prevNum + 1) fail(p, `num ${p.num} does not follow ${prevNum}`);
  prevDate = d; prevNum = p.num;
  const wantQuiz = `calc-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`;
  if (p.quizId !== wantQuiz) fail(p, `quizId ${p.quizId} should be ${wantQuiz}`);
  const wantLabel = `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  if (p.dateLabel !== wantLabel) fail(p, `dateLabel ${p.dateLabel} should be ${wantLabel}`);
  if (!!p.sunday !== (dow === 0)) fail(p, `sunday flag ${!!p.sunday} but the date is a ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dow]}`);

  // --- geometry ---
  const n = p.n;
  if (n !== spec.n) fail(p, `grid ${n} but this weekday is ${spec.n}`);
  if (!Array.isArray(p.cells) || p.cells.length !== n * n) { fail(p, `cells is not ${n * n} long`); continue; }
  for (let i = 0; i < n * n; i++) {
    const v = p.cells[i];
    if (isNumCell(n, i)) { if (!/^[1-9]$/.test(v)) fail(p, `cell ${i} should be a digit 1-9, is ${JSON.stringify(v)}`); }
    else if (!['+', '-', '*', '/'].includes(v)) fail(p, `cell ${i} should be an operator, is ${JSON.stringify(v)}`);
  }

  // --- targets and the weekday ramp ---
  if (p.targets.length !== spec.bands.length) fail(p, `${p.targets.length} targets, this weekday wants ${spec.bands.length}`);
  const seen = new Set();
  p.targets.forEach((t, k) => {
    if (seen.has(t.target)) fail(p, `target ${t.target} appears twice on one board`);
    seen.add(t.target);
    // the stored route must actually be a legal route to that target
    const r = t.path;
    if (!Array.isArray(r) || r[0] !== 0 || r[r.length - 1] !== n * n - 1) fail(p, `target ${t.target}: path does not run corner to corner`);
    else {
      if (new Set(r).size !== r.length) fail(p, `target ${t.target}: path reuses a cell`);
      for (let k2 = 1; k2 < r.length; k2++) if (!neighbours(n, r[k2 - 1]).includes(r[k2])) fail(p, `target ${t.target}: step ${k2} is not to a touching cell`);
      const got = evalRoute(n, p.cells, r);
      if (got !== t.target) fail(p, `target ${t.target}: stored path evaluates to ${got}`);
    }
    // recomputed, not trusted
    const s = solveFor(n, p.cells, t.target);
    if (s.count !== t.routes) fail(p, `target ${t.target}: stored routes ${t.routes}, recomputed ${s.count}`);
    if (!s.best || s.best.length !== t.minLen) fail(p, `target ${t.target}: stored minLen ${t.minLen}, recomputed ${s.best ? s.best.length : 'none'}`);
    if (r && r.length !== t.minLen) warns++;
    const [lo, hi, maxLen] = spec.bands[k];
    if (t.routes < lo || t.routes > hi) fail(p, `target ${t.target}: ${t.routes} routes is outside this slot's band ${lo}-${hi}`);
    if (t.minLen > maxLen || t.minLen < 9) fail(p, `target ${t.target}: shortest route ${t.minLen} outside 9-${maxLen}`);
    if (t.target < 12 || t.target > 999) fail(p, `target ${t.target} is outside 12-999`);
  });
  // Sunday's three run easiest to hardest
  for (let k = 1; k < p.targets.length; k++)
    if (p.targets[k].routes > p.targets[k - 1].routes) fail(p, `targets are not in descending route order`);

  // --- board total ---
  let e; try { e = enumerate(n, p.cells, 4000000); } catch (err) { fail(p, 'board is denser than the 4M cap'); continue; }
  if (e.routes !== p.boardRoutes) fail(p, `stored boardRoutes ${p.boardRoutes}, recomputed ${e.routes}`);
}
console.log(`${boards.length} boards checked, ${fails} failures${warns ? `, ${warns} stored paths longer than the shortest (harmless)` : ''}`);
process.exit(fails ? 1 : 0);
