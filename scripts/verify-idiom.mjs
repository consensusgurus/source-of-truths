// Structural gate for the idiom bank (English Gauntlet). Run after every authoring pass:
//   node scripts/verify-idiom.mjs
// The checks live in scripts/english-check-lib.mjs.
import { verifyEnglish } from './english-check-lib.mjs';
if (!(await verifyEnglish('idiom'))) process.exit(1);
