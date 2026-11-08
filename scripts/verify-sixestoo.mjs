#!/usr/bin/env node
// Bank checker for SixesToo (Colour mini sudoku). The checks live in
// scripts/colour-twins-verify.mjs, which shares no code with the generator.
//   node scripts/verify-sixestoo.mjs
process.env.ONLY_KEYS = 'sixestoo';
await import('./colour-twins-verify.mjs');
