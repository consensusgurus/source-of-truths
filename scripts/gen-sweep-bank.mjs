// Generates the Sweep bank: one provably guess-free field per day.
//
//   node scripts/gen-sweep-bank.mjs [firstISO] [days]
//
// HOW A FIELD IS BUILT. A Sweep run is ONE LIFE, so a forced guess would end a
// run through no fault of the player. Every banked field therefore has to be
// deducible from the surface down, and this script is what makes that true.
//
// Draw a random field, then REPAIR it rather than re-roll it:
//
//   1. Prove it with the solver in lib/sweep-field (the same module the game
//      and the verifier read, so there is one definition of "deducible").
//   2. If the proof stops at some row, clear the mines out of exactly the
//      cells it could not determine. Removing a mine LOWERS the numbers above
//      it, which is what turns "2 mines among 3 unknowns" into "0 mines among
//      3 unknowns" and unsticks the frontier.
//   3. Re-prove from scratch, because removing a mine invalidates any earlier
//      deduction that a cell WAS one, and a stale flag would make the proof
//      unsound. Full proofs cost single-digit milliseconds, so this is cheap.
//   4. Repeat. If a repair makes no progress, widen it to the next row down.
//
// Re-rolling rows was the first attempt and it fails: at any interesting
// density a random row usually leaves something undetermined, so nearly every
// row falls back and the field ends up more hole than mine. Repairing converges
// in a handful of passes and keeps the density where it was aimed.
//
// Nothing here is random at run time. A field is a pure function of the day's
// quizId, so re-running reproduces the bank byte for byte.

import { COLS, ROWS, encodeField, decodeField, idx, proveField } from '../lib/sweep-field.js';

const DENSITY = { weekday: 0.150, sunday: 0.185 };
const PAR = { weekday: 120, sunday: 90 };
const MAX_REPAIRS = 400;

function hash32(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export function buildField(quizId, density) {
  const rng = mulberry32(hash32('sweep::' + quizId));
  const grid = new Uint8Array(ROWS * COLS);
  // Row 0 is the surface: given to the player already open, and never mined, so
  // the first dig is a read rather than a coin flip.
  for (let r = 1; r < ROWS; r++) for (let c = 0; c < COLS; c++) grid[idx(r, c)] = rng() < density ? 1 : 0;

  let repairs = 0, lastStuck = -1, width = 0;
  for (let pass = 0; pass < MAX_REPAIRS; pass++) {
    const proof = proveField(grid);
    if (proof.solvedThrough >= ROWS - 3) return { grid, repairs, solvedThrough: proof.solvedThrough };
    const stuck = proof.solvedThrough + 1;
    width = stuck === lastStuck ? width + 1 : 0;   // no progress: widen the repair
    lastStuck = stuck;
    if (width > 6) throw new Error(`${quizId}: stuck at row ${stuck} and widening did not help`);
    let cleared = 0;
    for (let r = stuck; r <= Math.min(ROWS - 1, stuck + width); r++) {
      for (let c = 0; c < COLS; c++) {
        const i = idx(r, c);
        if (proof.known[i] === 0 && grid[i]) { grid[i] = 0; cleared++; }
      }
    }
    // Nothing left to clear in the stuck band (its cells are already safe and
    // merely unproven), so open the band below it instead.
    if (!cleared) for (let c = 0; c < COLS; c++) grid[idx(Math.min(ROWS - 1, stuck + width + 1), c)] = 0;
    repairs++;
  }
  throw new Error(`${quizId}: did not converge in ${MAX_REPAIRS} repairs`);
}

function suffixOf(iso) { const [Y, M, D] = iso.split('-').map(Number); return `${M}-${D}-${Y % 100}`; }
// Arcade plays the same every day from 2026-10-26 (owner, 2026-10-25): the
// denser Sunday field is dealt only on the Sundays before that.
const SAME_FROM = '2026-10-26';
function isSunday(iso) { const [Y, M, D] = iso.split('-').map(Number); return iso < SAME_FROM && new Date(Date.UTC(Y, M - 1, D)).getUTCDay() === 0; }
function label(iso) {
  const MO = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const [Y, M, D] = iso.split('-').map(Number);
  return `${MO[M - 1]} ${D}, ${Y}`;
}
function addDays(iso, n) { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }

// Run as a script only; importing buildField must not deal a bank.
const IS_MAIN = (process.argv[1] || '').endsWith('gen-sweep-bank.mjs');
if (IS_MAIN) {
const first = process.argv[2] || '2026-08-08';
const days = Number(process.argv[3] || 60);
const rows = [];
let worst = 1e9, dSum = 0, rSum = 0;

for (let i = 0; i < days; i++) {
  const iso = addDays(first, i);
  const sun = isSunday(iso);
  const quizId = `sweep-${suffixOf(iso)}`;
  const { grid, repairs, solvedThrough } = buildField(quizId, sun ? DENSITY.sunday : DENSITY.weekday);
  // Re-prove the ENCODED field, so what is banked is what was proven.
  const proof = proveField(decodeField(encodeField(grid)));
  if (proof.solvedThrough !== solvedThrough) throw new Error(`${quizId}: encode round trip changed the proof`);
  worst = Math.min(worst, proof.solvedThrough);
  dSum += proof.density; rSum += repairs;
  rows.push({ num: i + 1, quizId, live: iso, dateLabel: label(iso), sunday: sun, par: sun ? PAR.sunday : PAR.weekday, field: encodeField(grid) });
  process.stderr.write(`${quizId.padEnd(15)}${sun ? 'SUN ' : '    '}solved ${String(proof.solvedThrough).padStart(3)}  density ${(proof.density * 100).toFixed(1)}%  repairs ${repairs}\n`);
}

process.stderr.write(`\nworst solvedThrough ${worst} (need >= ${ROWS - 3})  ·  mean density ${(dSum / days * 100).toFixed(1)}%  ·  mean repairs ${(rSum / days).toFixed(1)}\n`);
console.log(rows.map((r) =>
  `  { num: ${r.num}, quizId: '${r.quizId}', live: '${r.live}', dateLabel: '${r.dateLabel}', sunday: ${r.sunday}, par: ${r.par},\n    field: '${r.field}' },`
).join('\n'));
}
