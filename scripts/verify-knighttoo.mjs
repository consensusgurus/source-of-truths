#!/usr/bin/env node
// Bank checker for KnightToo (Colour anti-knight sudoku). The checks live in
// scripts/colour-twins-verify.mjs, which shares no code with the generator.
//   node scripts/verify-knighttoo.mjs
process.env.ONLY_KEYS = 'knighttoo';
await import('./colour-twins-verify.mjs');
