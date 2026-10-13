#!/usr/bin/env node
// Build the Arrow bank (the daily arrow sudoku).
//
//   node scripts/gen-arrow.mjs > app/arrow/puzzles.js
//
// A board is an ordinary 9x9 sudoku plus ARROWS: a circle and a shaft of two
// to four squares, each step to one of the eight neighbouring squares, and the
// circle holds the SUM of its shaft. Weekdays run nine arrows (ten on Friday
// and Saturday) with two- and three-square shafts; the SUNDAY EDITION runs
// twelve with shafts up to four squares long and prints almost nothing.
//
// THE RAMP IS THE PRINTED-GIVEN COUNT (the Sando rule), with the arrow count
// stepping up late in the week: Mon 28, Tue 25, Wed 22, Thu 19, Fri 16,
// Sat 13, Sunday 8. Measured before choosing: a greedy dig under the graded
// solver bottoms out at 11 to 17 printed digits with nine arrows, 9 to 13 with
// ten, and 5 to 12 with twelve, so 13 and 8 are reachable floors rather than
// round numbers.
//
// Every board is solvable by the graded technique set (arrow sums as free
// pencil work, then hidden singles, locked candidates, pairs) with no guessing,
// has exactly one solution, and the arrows are LOAD-BEARING: the same printed
// digits read as a plain sudoku admit more than one grid. Deterministic: each
// day is seeded off its index, so a re-run reproduces the bank.
import { randomSolution, buildArrows, gradeSolve, countSolutions, makeRng, shuffled, CELLS } from './arrow-core.mjs';
import { readFileSync, existsSync, appendFileSync, mkdirSync } from 'node:fs';

const START = '2026-10-13';
const END = '2027-01-31';
const TARGET = { 1: 28, 2: 25, 3: 22, 4: 19, 5: 16, 6: 13, 0: 8 };
const ARROWS = {
  1: { count: 9, minShaft: 2, maxShaft: 3 }, 2: { count: 9, minShaft: 2, maxShaft: 3 },
  3: { count: 9, minShaft: 2, maxShaft: 3 }, 4: { count: 9, minShaft: 2, maxShaft: 3 },
  5: { count: 10, minShaft: 2, maxShaft: 3 }, 6: { count: 10, minShaft: 2, maxShaft: 3 },
  0: { count: 12, minShaft: 2, maxShaft: 4 },
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const dateParts = (iso) => { const [y, m, d] = iso.split('-').map(Number); return { y, m, d, dow: new Date(Date.UTC(y, m - 1, d)).getUTCDay() }; };
const addDays = (iso, n) => { const t = new Date(iso + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };

function dig(sol, ar, target, rnd) {
  const givens = sol.slice();
  let printed = CELLS;
  for (const i of shuffled(Array.from({ length: CELLS }, (_, x) => x), rnd)) {
    if (printed <= target) break;
    const keep = givens[i];
    givens[i] = 0;
    if (gradeSolve(ar, givens).solved) printed--;
    else givens[i] = keep;
  }
  return printed > target ? null : givens;
}

// Resumable, like gen-mercury: each finished day is appended to a JSONL cache,
// so a run that is cut off picks up where it stopped. Every day is seeded off
// its own index, so the cache changes nothing about what a day comes out as.
const JL = process.env.ARROW_JL || '/tmp/build/arrow-bank.jsonl';
mkdirSync(JL.replace(/\/[^/]*$/, ''), { recursive: true });
const out = [];
const seen = new Set();
const layouts = new Set();
const lkeyOf = (ar) => ar.map((a) => a.map(([r, c]) => `${r}${c}`).join('-')).sort().join('|');
if (existsSync(JL)) {
  for (const line of readFileSync(JL, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const p = JSON.parse(line);
    out.push(p);
    seen.add(p.sol.flat().join(''));
    layouts.add(lkeyOf(p.arrows));
  }
}
for (let i = 0, live = START; live <= END; i++, live = addDays(START, i)) {
  if (out.some((p) => p.num === i + 1)) continue;
  const { y, m, d, dow } = dateParts(live);
  const target = TARGET[dow];
  const cfg = ARROWS[dow];
  const rnd = makeRng(0xA770 + i * 7919);
  let found = null;
  for (let attempt = 0; attempt < 20000 && !found; attempt++) {
    const sol = randomSolution(rnd);
    const key = sol.join('');
    if (seen.has(key)) continue;
    const ar = buildArrows(sol, rnd, cfg);
    if (!ar) continue;
    const lkey = lkeyOf(ar);
    if (layouts.has(lkey)) continue;
    const givens = dig(sol, ar, target, rnd);
    if (!givens) continue;
    const res = gradeSolve(ar, givens);
    if (!res.solved || res.grid.join('') !== key) continue;
    if (countSolutions(ar, givens, 2) !== 1) throw new Error('logic-solved board not unique?!');
    if (countSolutions([], givens, 2) < 2) continue; // the arrows must carry weight
    found = { sol, ar, givens, cost: res.cost };
    seen.add(key);
    layouts.add(lkey);
  }
  if (!found) throw new Error(`no board found for ${live}`);
  const rec = {
    num: i + 1,
    quizId: `arrow-${m}-${d}-${String(y).slice(2)}`,
    live,
    dateLabel: `${MONTHS[m - 1]} ${d}, ${y}`,
    sunday: dow === 0,
    printed: target,
    arrows: found.ar,
    given: Array.from({ length: 9 }, (_, r) => found.givens.slice(r * 9, r * 9 + 9)),
    sol: Array.from({ length: 9 }, (_, r) => found.sol.slice(r * 9, r * 9 + 9)),
  };
  out.push(rec);
  appendFileSync(JL, JSON.stringify(rec) + '\n');
  process.stderr.write(`#${i + 1} ${live} givens=${target} arrows=${found.ar.length} cost=${found.cost}\n`);
}
out.sort((a, b) => a.num - b.num);

const HEADER = `// Puzzle data for Arrow, the daily arrow sudoku. Imported ONLY by the server
// page (app/arrow/page.js), which filters live<=today before handing puzzles
// to the client, so future boards and their solutions never reach a browser.
//
// A board is an ordinary 9x9 sudoku plus ARROWS: \`arrows\` is an array of
// paths, each an array of [row, col] steps starting at the CIRCLE (first cell)
// and running down the shaft. Steps go to any of the eight neighbouring
// squares. The digit in the circle is the SUM of the digits on the shaft.
// Arrows never share a cell. \`given\` holds the printed clues (0 = empty),
// \`sol\` the solution, used for the win check, the one hint and
// reveal-and-end.
//
// THE RAMP IS THE PRINTED-GIVEN COUNT (the Sando rule), with the arrow count
// stepping up late in the week: Mon 28, Tue 25, Wed 22, Thu 19 (nine arrows),
// Fri 16, Sat 13 (ten), and the Sunday Edition at 8 under twelve arrows.
//
// EVERY board has EXACTLY ONE solution, falls to arrow sums plus hidden
// singles, locked candidates and pairs with no guessing, and needs its arrows
// (the printed digits alone admit more than one grid), re-proved by the
// independent solvers in scripts/verify-arrow.mjs.
//
// Do NOT hand-edit a board here. Regenerate with scripts/gen-arrow.mjs and
// re-run scripts/verify-arrow.mjs.
export const PUZZLES = [`;

const rows = out.map((p) => `  {
    num: ${p.num},
    quizId: '${p.quizId}',
    live: '${p.live}',
    dateLabel: '${p.dateLabel}',
    sunday: ${p.sunday},
    printed: ${p.printed},
    arrows: [${p.arrows.map((a) => `[${a.map(([r, c]) => `[${r},${c}]`).join(',')}]`).join(',')}],
    given: [${p.given.map((r) => `[${r.join(',')}]`).join(',')}],
    sol: [${p.sol.map((r) => `[${r.join(',')}]`).join(',')}],
  },`);

console.log(`${HEADER}\n${rows.join('\n')}\n];`);
