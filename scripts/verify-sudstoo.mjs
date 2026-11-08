#!/usr/bin/env node
// Bank checker for SudsToo (Colour classic sudoku). The checks live in
// scripts/colour-twins-verify.mjs, which shares no code with the generator.
//   node scripts/verify-sudstoo.mjs
process.env.ONLY_KEYS = 'sudstoo';
await import('./colour-twins-verify.mjs');
