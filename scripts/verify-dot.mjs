#!/usr/bin/env node
// Bank checker for Dot (6x6 kropki sudoku). The checks live in
// scripts/small-sudokus-verify.mjs, which shares no code with the generator. A Small game is checked with its colour twin (or the reverse), so the 14-day answer-grid rule sees the whole family.
//   node scripts/verify-dot.mjs
process.env.ONLY_KEYS = 'dot';
await import('./small-sudokus-verify.mjs');
