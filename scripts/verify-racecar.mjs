#!/usr/bin/env node
// Bank checker for Racecar, the daily palindrome sudoku. The checks live in
// scripts/lines-verify.mjs, which shares no code with the generator; this
// file holds Racecar's own copy of the weekday ramp.
//   node scripts/verify-racecar.mjs   (VERIFY_RACECAR_BANK=<path> overrides)
import { verifyLines } from './lines-verify.mjs';

await verifyLines({
  kind: 'racecar', key: 'racecar', name: 'Racecar',
  PRINTED_BY_DOW: { 0: 14, 1: 24, 2: 22, 3: 20, 4: 18, 5: 17, 6: 16 },
  LEVEL_BY_DOW: { 0: 2, 1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 2 },
});
