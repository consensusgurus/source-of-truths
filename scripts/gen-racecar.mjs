#!/usr/bin/env node
// Bank generator for Racecar, the daily palindrome sudoku.
//
//   node scripts/gen-racecar.mjs --until 2027-01-31 [--from 2026-10-13] [--seed 20261077] [--fresh] [--seconds 150]
//
// THE RULE: an ordinary 9x9, plus grey lines. Each line reads the same from
// either end: its first and last squares match, its second and second-to-last,
// and so on (so mirrored squares never share a row, column or box).
//
// THE WEEKDAY RAMP, measured (greedy dig floors on 12 grids: 13 to 19 printed
// digits at level 2 with nine lines; a mirror is a weaker rule than a whisper)
// and PINNED, not capped:
//   Mon 24, Tue 22, Wed 20, Thu 18 at level 1 (line reading + singles);
//   Fri 17, Sat 16 at level 2 (also locked candidates and subsets);
//   Sunday Edition 14 at level 2, on ten lines instead of eight.
// Engine: scripts/lines-core.mjs; runner: scripts/lines-bank.mjs; independent
// checker: scripts/verify-racecar.mjs.
import { runBank } from './lines-bank.mjs';

await runBank({
  kind: 'racecar',
  key: 'racecar',
  until: '2027-01-31',
  seed: 20261077,
  PRINTED_BY_DOW: { 0: 14, 1: 24, 2: 22, 3: 20, 4: 18, 5: 17, 6: 16 },
  LEVEL_BY_DOW: { 0: 2, 1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 2 },
  LINES_BY_DOW: {
    0: { count: 10, lo: 3, hi: 8 },
    1: { count: 8, lo: 3, hi: 7 }, 2: { count: 8, lo: 3, hi: 7 }, 3: { count: 8, lo: 3, hi: 7 },
    4: { count: 8, lo: 3, hi: 7 }, 5: { count: 8, lo: 3, hi: 7 }, 6: { count: 8, lo: 3, hi: 7 },
  },
  header: `// Puzzle data for Racecar, the daily palindrome sudoku. Imported ONLY by the
// server page (app/racecar/page.js), which filters live<=today before handing
// puzzles to the client, so future boards and their solutions never reach a
// browser.
//
// A board is an ordinary 9x9 plus grey LINES that read the same from either
// end. \`lines\` lists each line as [row, col] squares in order (0-based,
// joined by king steps), \`given\` the printed clues (0 = a square the player
// fills), \`sol\` the solution.
//
// printed and level are pinned per weekday (Mon 24, Tue 22, Wed 20, Thu 18 at
// level 1; Fri 17, Sat 16, Sunday Edition 14 at level 2) and re-measured by
// scripts/verify-racecar.mjs, which also proves every board unique,
// logic-only, and impossible without its lines.
`,
});
