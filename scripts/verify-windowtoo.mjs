#!/usr/bin/env node
// Bank checker for WindowToo (Colour windoku). The checks live in
// scripts/colour-twins-verify.mjs, which shares no code with the generator.
//   node scripts/verify-windowtoo.mjs
process.env.ONLY_KEYS = 'windowtoo';
await import('./colour-twins-verify.mjs');
