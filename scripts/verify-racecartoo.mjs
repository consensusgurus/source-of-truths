#!/usr/bin/env node
// Bank checker for RacecarToo (Colour palindrome sudoku). The checks live in
// scripts/colour-twins-verify.mjs, which shares no code with the generator.
//   node scripts/verify-racecartoo.mjs
process.env.ONLY_KEYS = 'racecartoo';
await import('./colour-twins-verify.mjs');
