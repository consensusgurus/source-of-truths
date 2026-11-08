#!/usr/bin/env node
// Bank checker for RimToo (Colour outside sudoku). The checks live in
// scripts/colour-twins-verify.mjs, which shares no code with the generator.
//   node scripts/verify-rimtoo.mjs
process.env.ONLY_KEYS = 'rimtoo';
await import('./colour-twins-verify.mjs');
