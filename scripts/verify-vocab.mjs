// Structural gate for the vocab bank (English Gauntlet). Run after every authoring pass:
//   node scripts/verify-vocab.mjs
// The checks live in scripts/english-check-lib.mjs.
import { verifyEnglish } from './english-check-lib.mjs';
if (!(await verifyEnglish('vocab'))) process.exit(1);
