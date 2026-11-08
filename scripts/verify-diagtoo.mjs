#!/usr/bin/env node
// Bank checker for DiagToo (Colour diagonal sudoku). The checks live in
// scripts/colour-twins-verify.mjs, which shares no code with the generator.
//   node scripts/verify-diagtoo.mjs
process.env.ONLY_KEYS = 'diagtoo';
await import('./colour-twins-verify.mjs');
