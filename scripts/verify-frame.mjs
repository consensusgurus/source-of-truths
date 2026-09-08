#!/usr/bin/env node
// Bank checker for Frame, the daily frame sudoku. RECOMPUTES everything and
// trusts no stored field, with solvers independent of the generator's
// (scripts/gutter-check-lib.mjs; never scripts/gutter-core.mjs). Per board:
//   1  the solution is a legal grid and the clues are a subset of it
//   2  every one of the 36 printed sums is the true sum of its three cells
//   3  the printed-digit count matches the weekday ramp (Mon 14 .. Sat 4, Sun 2)
//   4  exactly one solution under the sums
//   5  it falls to the frame deduction plus singles with no guessing, policed
//   6  the gutter is load-bearing: the digits alone admit more than one grid
// and across the bank the sequence, dates, labels, quizIds and no repeats.
//
// Usage: node scripts/verify-frame.mjs   (VERIFY_FRAME_BANK=<path> overrides)
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { SIDES, cellsOf, countSolutions, logicSolve, sweep } from './gutter-check-lib.mjs';

const BANK = process.env.VERIFY_FRAME_BANK || path.join(process.cwd(), 'app/frame/puzzles.js');
const { PUZZLES } = await import(pathToFileURL(BANK).href);
const CLUES_BY_DOW = { 0: 2, 1: 14, 2: 12, 3: 10, 4: 8, 5: 6, 6: 4 };
const BLANK = Object.fromEntries(SIDES.map((s) => [s, Array(9).fill(null)]));

const { last, sundays } = sweep('frame', PUZZLES, (p, tag, given, sol, dow, fail) => {
  const clues = {};
  for (const side of SIDES) {
    if (!p.sums || !Array.isArray(p.sums[side]) || p.sums[side].length !== 9) { fail(`${tag}: sums.${side} is not nine numbers`); return; }
    clues[side] = p.sums[side].map((v, k) => {
      const truth = cellsOf(side, k).reduce((a, i) => a + sol[i], 0);
      if (v !== truth) fail(`${tag}: ${side} sum ${k + 1} says ${v}, the solution gives ${truth}`);
      return { sum: v };
    });
  }
  const printed = given.filter(Boolean).length;
  if (printed !== p.clues) fail(`${tag}: clues says ${p.clues}, the board prints ${printed}`);
  if (printed !== CLUES_BY_DOW[dow]) fail(`${tag}: weekday ${dow} wants ${CLUES_BY_DOW[dow]} digits, board prints ${printed}`);
  const n = countSolutions(given, clues, 2);
  if (n !== 1) fail(`${tag}: ${n === 0 ? 'no solution' : 'more than one solution'} under the sums`);
  let res;
  try { res = logicSolve(given, clues, sol); } catch (e) { fail(`${tag}: ${e.message}`); return; }
  if (!res.solved) fail(`${tag}: does not fall to the frame deduction plus singles, it would need a guess`);
  else if (res.grid.join(',') !== sol.join(',')) fail(`${tag}: logic reached a different grid than the stored solution`);
  if (countSolutions(given, BLANK, 2) < 2) fail(`${tag}: the printed digits pin a single grid WITHOUT the sums, so the gutter is decoration`);
});
console.log(`FRAME ok: ${PUZZLES.length} boards ${PUZZLES[0].live} to ${last.live}, ${sundays} Sunday Editions, digits ${Math.min(...PUZZLES.map((p) => p.clues))}-${Math.max(...PUZZLES.map((p) => p.clues))}, all 36 sums on every board, unique, logic-only, and impossible without the gutter.`);
