// Verifies the Sweep bank.
//
// The claim Sweep makes to players, in the rules and in the About section, is
// that a run never ends on a guess. This script is what makes that a fact
// rather than a promise: it RE-PROVES every banked field with the solver in
// lib/sweep-field, the same module the game plays from, instead of trusting a
// stored flag (CLAUDE.md daily authoring standard, rules 2 and 3).
//
//   node scripts/verify-sweep.mjs
//
// Checks, in order of how badly each one would hurt:
//
//   1. NO GUESS. Every field is deducible from the surface row down, to within
//      two rows of the banked depth. Those last rows are unprovable by
//      construction, because a cell's number counts the row below it and there
//      is nothing banked past the end.
//   2. The surface row is clean. Row 0 is handed to the player already open, so
//      a mine in it would be both invisible and unfair.
//   3. Density sits in the band its tier claims, so a Sunday is really denser
//      and a weekday has not quietly drifted toward empty.
//   4. The Sunday flag matches the real Eastern weekday. It is the only source
//      of truth for the badge, so a flag on a Tuesday is a visible bug.
//   5. par matches the tier, quizIds match their dates, nums run 1..N without a
//      gap, and no two days share a field (a duplicate would mean a player
//      digging a board they cleared last week).

import { PUZZLES } from '../app/sweep/puzzles.js';
import { COLS, ROWS, decodeField, proveField } from '../lib/sweep-field.js';

const PAR = { weekday: 120, sunday: 90 };
const BAND = { weekday: [0.115, 0.180], sunday: [0.150, 0.215] };
const NEED = ROWS - 3;

let fails = 0;
const bad = (day, msg) => { fails++; console.log(`FAIL  ${day}  ${msg}`); };

const seen = new Map();
let worst = 1e9, dMin = 1, dMax = 0;

PUZZLES.forEach((p, i) => {
  const tier = p.sunday ? 'sunday' : 'weekday';

  if (p.num !== i + 1) bad(p.quizId, `num is ${p.num}, expected ${i + 1}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.live)) bad(p.quizId, `live "${p.live}" is not an ISO date`);
  const [Y, M, D] = p.live.split('-').map(Number);
  const expectId = `sweep-${M}-${D}-${Y % 100}`;
  if (p.quizId !== expectId) bad(p.quizId, `quizId does not match live (${expectId})`);

  // Arcade plays the same every day from 2026-10-26 (owner, 2026-10-25): the
  // denser Sunday Edition exists only on the Sundays before that.
  const realSunday = new Date(Date.UTC(Y, M - 1, D)).getUTCDay() === 0 && p.live < '2026-10-26';
  if (!!p.sunday !== realSunday) bad(p.quizId, `sunday flag is ${!!p.sunday} but ${p.live} ${realSunday ? 'IS' : 'is NOT'} a Sunday Edition day`);
  if (p.par !== PAR[tier]) bad(p.quizId, `par ${p.par}, expected ${PAR[tier]} for a ${tier}`);

  if (typeof p.field !== 'string' || p.field.length !== Math.ceil(Math.ceil(ROWS * COLS / 8) / 3) * 4) {
    bad(p.quizId, `field is ${p.field && p.field.length} chars, expected ${Math.ceil(Math.ceil(ROWS * COLS / 8) / 3) * 4}`);
    return;
  }
  if (seen.has(p.field)) bad(p.quizId, `field is identical to ${seen.get(p.field)}`);
  seen.set(p.field, p.quizId);

  const grid = decodeField(p.field);
  for (let c = 0; c < COLS; c++) if (grid[c]) bad(p.quizId, `mine in the surface row at column ${c}`);

  const proof = proveField(grid);
  worst = Math.min(worst, proof.solvedThrough);
  dMin = Math.min(dMin, proof.density); dMax = Math.max(dMax, proof.density);
  if (proof.solvedThrough < NEED) {
    bad(p.quizId, `NEEDS A GUESS: deducible only through row ${proof.solvedThrough} of ${ROWS} (need ${NEED})`);
  }
  const [lo, hi] = BAND[tier];
  if (proof.density < lo || proof.density > hi) {
    bad(p.quizId, `density ${(proof.density * 100).toFixed(1)}% outside the ${tier} band ${(lo * 100).toFixed(1)}-${(hi * 100).toFixed(1)}%`);
  }
});

// A Sunday must actually be denser than the weekdays around it, or the edition
// is a badge and nothing else.
const wk = PUZZLES.filter((p) => !p.sunday).map((p) => proveField(decodeField(p.field)).density);
const su = PUZZLES.filter((p) => p.sunday).map((p) => proveField(decodeField(p.field)).density);
const mean = (a) => a.reduce((s, x) => s + x, 0) / (a.length || 1);
if (su.length && mean(su) <= mean(wk)) bad('bank', `Sunday mean density ${(mean(su) * 100).toFixed(1)}% is not above the weekday mean ${(mean(wk) * 100).toFixed(1)}%`);

console.log(`\n${PUZZLES.length} days · ${PUZZLES[0].live} to ${PUZZLES[PUZZLES.length - 1].live}`);
console.log(`no-guess proof: worst field deducible through row ${worst} of ${ROWS} (need ${NEED})`);
console.log(`density ${(dMin * 100).toFixed(1)}% to ${(dMax * 100).toFixed(1)}% · weekday mean ${(mean(wk) * 100).toFixed(1)}% · Sunday mean ${(mean(su) * 100).toFixed(1)}%`);
console.log(fails ? `\n${fails} FAILURES` : '\nall green');
process.exit(fails ? 1 : 0);
