#!/usr/bin/env node
// Bank checker for MercuryToo (Rainbow thermo sudoku). The checks live in
// scripts/colour-twins-verify.mjs, which shares no code with the generator.
//   node scripts/verify-mercurytoo.mjs
process.env.ONLY_KEYS = 'mercurytoo';
await import('./colour-twins-verify.mjs');
