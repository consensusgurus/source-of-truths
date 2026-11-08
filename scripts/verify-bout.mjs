#!/usr/bin/env node
// Bank checker for Bout (6x6 greater-than sudoku). The checks live in
// scripts/small-sudokus-verify.mjs, which shares no code with the generator. A Small game is checked with its colour twin (or the reverse), so the 14-day answer-grid rule sees the whole family.
//   node scripts/verify-bout.mjs
process.env.ONLY_KEYS = 'bout';
await import('./small-sudokus-verify.mjs');
