// Structural gate for the eureka bank (Science Gauntlet). Run after every authoring pass:
//   node scripts/verify-eureka.mjs
// The checks live in scripts/science-check-lib.mjs.
import { verifyScience } from './science-check-lib.mjs';
if (!(await verifyScience('eureka'))) process.exit(1);
