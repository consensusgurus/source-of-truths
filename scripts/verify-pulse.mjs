// Structural gate for the pulse bank (Science Gauntlet). Run after every authoring pass:
//   node scripts/verify-pulse.mjs
// The checks live in scripts/science-check-lib.mjs.
import { verifyScience } from './science-check-lib.mjs';
if (!(await verifyScience('pulse'))) process.exit(1);
