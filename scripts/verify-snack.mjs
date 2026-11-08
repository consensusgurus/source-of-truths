#!/usr/bin/env node
// Bank checker for Snack (6x6 sandwich sudoku). The checks live in
// scripts/small-sudokus-verify.mjs, which shares no code with the generator. A Small game is checked with its colour twin (or the reverse), so the 14-day answer-grid rule sees the whole family.
//   node scripts/verify-snack.mjs
process.env.ONLY_KEYS = 'snack';
await import('./small-sudokus-verify.mjs');
