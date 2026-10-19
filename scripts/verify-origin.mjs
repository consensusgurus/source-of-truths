// Structural gate for the origin bank (English Gauntlet). Run after every authoring pass:
//   node scripts/verify-origin.mjs
// The checks live in scripts/english-check-lib.mjs.
import { verifyEnglish } from './english-check-lib.mjs';
if (!(await verifyEnglish('origin'))) process.exit(1);
