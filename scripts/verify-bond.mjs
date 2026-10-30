// Structural gate for the bond bank (Science Gauntlet). Run after every authoring pass:
//   node scripts/verify-bond.mjs
// The checks live in scripts/science-check-lib.mjs.
import { verifyScience } from './science-check-lib.mjs';
if (!(await verifyScience('bond'))) process.exit(1);
