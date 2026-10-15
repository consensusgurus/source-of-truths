#!/usr/bin/env node
// Bank generator for Five, the daily German whispers sudoku.
//
//   node scripts/gen-five.mjs --until 2027-01-31 [--from 2026-10-13] [--seed 20261055] [--fresh] [--seconds 150]
//
// THE RULE: an ordinary 9x9, plus green lines. Any two squares next to each
// other on a line differ by at least 5 (so a 5 can never sit on a line, and
// digits on a line alternate between low, 1 to 4, and high, 6 to 9).
//
// THE WEEKDAY RAMP, measured (greedy dig floors on 12 grids: 8 to 16 printed
// digits at level 2 with six or seven lines) and PINNED, not capped:
//   Mon 20, Tue 18, Wed 16, Thu 15 at level 1 (line reading + singles);
//   Fri 14, Sat 13 at level 2 (also locked candidates and subsets);
//   Sunday Edition 11 at level 2, on eight lines instead of six.
// Line reading is in both levels: each square keeps only the digits that some
// digit of its line neighbour allows. Engine: scripts/lines-core.mjs; runner:
// scripts/lines-bank.mjs; independent checker: scripts/verify-five.mjs.
import { runBank } from './lines-bank.mjs';

await runBank({
  kind: 'five',
  key: 'five',
  until: '2027-01-31',
  seed: 20261055,
  PRINTED_BY_DOW: { 0: 11, 1: 20, 2: 18, 3: 16, 4: 15, 5: 14, 6: 13 },
  LEVEL_BY_DOW: { 0: 2, 1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 2 },
  LINES_BY_DOW: {
    0: { count: 8, lo: 4, hi: 7 },
    1: { count: 6, lo: 4, hi: 7 }, 2: { count: 6, lo: 4, hi: 7 }, 3: { count: 6, lo: 4, hi: 7 },
    4: { count: 6, lo: 4, hi: 7 }, 5: { count: 6, lo: 4, hi: 7 }, 6: { count: 6, lo: 4, hi: 7 },
  },
  header: `// Puzzle data for Five, the daily German whispers sudoku. Imported ONLY by
// the server page (app/five/page.js), which filters live<=today before handing
// puzzles to the client, so future boards and their solutions never reach a
// browser.
//
// A board is an ordinary 9x9 plus green LINES: any two squares next to each
// other on a line differ by at least 5. \`lines\` lists each line as [row, col]
// squares in order (0-based, joined by king steps), \`given\` the printed clues
// (0 = a square the player fills), \`sol\` the solution.
//
// printed and level are pinned per weekday (Mon 20, Tue 18, Wed 16, Thu 15 at
// level 1; Fri 14, Sat 13, Sunday Edition 11 at level 2) and re-measured by
// scripts/verify-five.mjs, which also proves every board unique, logic-only,
// and impossible without its lines.
`,
});
