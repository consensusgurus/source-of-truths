// Structural gate for the orbit bank (Science Gauntlet). Run after every authoring pass:
//   node scripts/verify-orbit.mjs
// The checks live in scripts/science-check-lib.mjs.
import { verifyScience } from './science-check-lib.mjs';
if (!(await verifyScience('orbit'))) process.exit(1);
