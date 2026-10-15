#!/usr/bin/env node
// Bank checker for Five, the daily German whispers sudoku. The checks live in
// scripts/lines-verify.mjs, which shares no code with the generator; this
// file holds Five's own copy of the weekday ramp.
//   node scripts/verify-five.mjs   (VERIFY_FIVE_BANK=<path> overrides)
import { verifyLines } from './lines-verify.mjs';

await verifyLines({
  kind: 'five', key: 'five', name: 'Five',
  PRINTED_BY_DOW: { 0: 11, 1: 20, 2: 18, 3: 16, 4: 15, 5: 14, 6: 13 },
  LEVEL_BY_DOW: { 0: 2, 1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 2 },
});
