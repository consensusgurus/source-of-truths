#!/usr/bin/env node
// Bank checker for Lip (6x6 outside sudoku). The checks live in
// scripts/small-sudokus-verify.mjs, which shares no code with the generator. A Small game is checked with its colour twin (or the reverse), so the 14-day answer-grid rule sees the whole family.
//   node scripts/verify-lip.mjs
process.env.ONLY_KEYS = 'lip';
await import('./small-sudokus-verify.mjs');
