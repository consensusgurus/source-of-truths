#!/usr/bin/env node
// Bank checker for GiantToo (16x16 colour sudoku). The checks live in
// scripts/colour-twins-verify.mjs, which shares no code with the generator.
//   node scripts/verify-gianttoo.mjs
process.env.ONLY_KEYS = 'gianttoo';
await import('./colour-twins-verify.mjs');
