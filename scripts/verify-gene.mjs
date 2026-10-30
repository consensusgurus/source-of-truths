// Structural gate for the gene bank (Science Gauntlet). Run after every authoring pass:
//   node scripts/verify-gene.mjs
// The checks live in scripts/science-check-lib.mjs.
import { verifyScience } from './science-check-lib.mjs';
if (!(await verifyScience('gene'))) process.exit(1);
