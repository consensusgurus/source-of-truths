// scripts/verify-mega.mjs: checks the Colossus and Mammoth banks
// (app/colossus/boards.js, app/mammoth/boards.js) and their site-day lists.
//
//   node scripts/verify-mega.mjs [dir]
//
// For every board: the strings are the right length and agree with the weave;
// every row, column and box of every sudoku holds each digit once; a printed
// digit is the solution's digit; EVERY sudoku has exactly one solution from its
// own printed digits and can be finished by naked and hidden singles alone
// (so no sudoku ever needs a neighbor, and none needs a guess); the fill is not
// one sudoku repeated; and on Mammoth an inside sudoku keeps at least eight
// empty squares in its own middle rows (owner, 2026-11-21: fewer givens in the
// middle rows, so a solved neighborhood does not hand a sudoku over).
import path from 'path';
import { pathToFileURL } from 'url';
import { MEGA, megaLayout, megaHouses, megaSingles, megaCount, megaQuizId } from '../lib/mega.js';

const root = process.argv[2] || '.';
let bad = 0;
const fail = (m) => { bad++; console.error('FAIL ' + m); };

for (const game of Object.keys(MEGA)) {
  const { BOARDS } = await import(pathToFileURL(path.resolve(root, 'app', game, 'boards.js')).href);
  const { PUZZLES } = await import(pathToFileURL(path.resolve(root, 'app', game, 'puzzles.js')).href);
  const N = MEGA[game].N;
  if (!BOARDS.length) fail(`${game}: no boards`);
  const keys = new Set();
  BOARDS.forEach((b, bi) => {
    const tag = `${game} board ${b.num}`;
    if (b.num !== bi + 1) fail(`${tag}: numbered out of order`);
    if (b.key !== `${game}-b${b.num}` || keys.has(b.key)) fail(`${tag}: key ${b.key}`);
    keys.add(b.key);
    const L = megaLayout(game, b.A, b.B);
    if (b.given.length !== L.T || b.sol.length !== L.T) { fail(`${tag}: string lengths`); return; }
    const sol = Array.from(b.sol, Number), given = Array.from(b.given, Number);
    for (let i = 0; i < L.T; i++) {
      const cov = L.cellGrids[i].length > 0;
      if (!cov && (sol[i] || given[i])) { fail(`${tag}: a digit in a gap at ${i}`); break; }
      if (cov && !(sol[i] >= 1 && sol[i] <= N)) { fail(`${tag}: no solution digit at ${i}`); break; }
      if (given[i] && given[i] !== sol[i]) { fail(`${tag}: printed digit differs from the solution at ${i}`); break; }
      if (L.cellGrids[i].length > 2) { fail(`${tag}: a square in three sudokus`); break; }
    }
    const seen = new Set();
    let hiddenMin = 99, hiddenMax = 0, clueMin = 99, clueMax = 0, ownMin = 99;
    L.grids.forEach((cells, id) => {
      for (const h of megaHouses(L, id)) if (new Set(h.map((x) => sol[x])).size !== N) { fail(`${tag}: sudoku ${id + 1} has a bad row, column or box`); return; }
      const s = megaSingles(L, id, given);
      if (!s.ok) { fail(`${tag}: sudoku ${id + 1} cannot be finished by singles from its own clues`); return; }
      for (const x of cells) if (s.val.get(x) !== sol[x]) { fail(`${tag}: sudoku ${id + 1} solves to something else`); return; }
      if (megaCount(L, id, given) !== 1) { fail(`${tag}: sudoku ${id + 1} does not have exactly one solution`); return; }
      seen.add(cells.map((x) => sol[x]).join(''));
      const clues = cells.filter((x) => given[x]).length;
      clueMin = Math.min(clueMin, clues); clueMax = Math.max(clueMax, clues);
      hiddenMin = Math.min(hiddenMin, s.hidden); hiddenMax = Math.max(hiddenMax, s.hidden);
      const nb = new Set(); cells.forEach((x) => L.cellGrids[x].forEach((g) => g !== id && nb.add(g)));
      if (nb.size === 4) ownMin = Math.min(ownMin, cells.filter((x) => L.cellGrids[x].length === 1 && !given[x]).length);
    });
    if (seen.size < L.grids.length * 0.98) fail(`${tag}: ${L.grids.length - seen.size} sudokus repeat another's solution`);
    if (game === 'mammoth' && ownMin < 8) fail(`${tag}: an inside sudoku keeps only ${ownMin} empty squares of its own`);
    console.log(`${tag}: ${L.grids.length} sudokus on ${L.W}x${L.H}, clues ${clueMin} to ${clueMax}, hidden-single steps ${hiddenMin} to ${hiddenMax}, inside sudokus keep ${ownMin}+ squares of their own`);
  });
  // site days: consecutive from the launch day, ids in the house form
  PUZZLES.forEach((d, i) => {
    const iso = new Date(Date.parse('2026-11-21T00:00:00Z') + i * 86400000).toISOString().slice(0, 10);
    if (d.num !== i + 1 || d.live !== iso || d.quizId !== megaQuizId(game, iso)) fail(`${game} site day ${i + 1}: ${JSON.stringify(d)}`);
  });
  const last = PUZZLES[PUZZLES.length - 1];
  console.log(`${game}: ${BOARDS.length} boards, ${PUZZLES.length} site days through ${last && last.live}`);
}
if (bad) { console.error(`verify-mega: ${bad} problem(s)`); process.exit(1); }
console.log('verify-mega: OK');
