// Structural gate for the gram bank (English Gauntlet). Run after every authoring pass:
//   node scripts/verify-gram.mjs
// The checks live in scripts/english-check-lib.mjs.
import { verifyEnglish } from './english-check-lib.mjs';
if (!(await verifyEnglish('gram'))) process.exit(1);
