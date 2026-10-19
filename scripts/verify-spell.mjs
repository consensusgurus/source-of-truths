// Structural gate for the spell bank (English Gauntlet). Run after every authoring pass:
//   node scripts/verify-spell.mjs
// The checks live in scripts/english-check-lib.mjs.
import { verifyEnglish } from './english-check-lib.mjs';
if (!(await verifyEnglish('spell'))) process.exit(1);
