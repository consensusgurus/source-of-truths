#!/usr/bin/env node
// Bank checker for Rim, the daily outside sudoku. RECOMPUTES everything and
// trusts no stored field, with solvers independent of the generator's
// (scripts/gutter-check-lib.mjs; never scripts/gutter-core.mjs). Per board:
//   1  the solution is a legal grid and NO digit is printed inside it
//   2  every printed triple is exactly the set of its three cells, ascending
//   3  the printed-triple count matches the weekday ramp (Mon 30 .. Sat 16, Sun 13)
//   4  exactly one solution under the printed triples
//   5  it falls to the rim deduction plus singles with no guessing, policed
// and across the bank the sequence, dates, labels, quizIds, no repeated
// solution and no repeated gutter pattern.
//
// Usage: node scripts/verify-rim.mjs   (VERIFY_RIM_BANK=<path> overrides)
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { SIDES, cellsOf, countSolutions, logicSolve, sweep } from './gutter-check-lib.mjs';

const BANK = process.env.VERIFY_RIM_BANK || path.join(process.cwd(), 'app/rim/puzzles.js');
const { PUZZLES } = await import(pathToFileURL(BANK).href);
const PRINTED_BY_DOW = { 0: 13, 1: 30, 2: 27, 3: 24, 4: 21, 5: 18, 6: 16 };
const seenPat = new Map();

const { last, sundays } = sweep('rim', PUZZLES, (p, tag, given, sol, dow, fail) => {
  if (given.some(Boolean)) fail(`${tag}: a digit is printed inside the grid; Rim prints none`);
  const clues = {}; let printed = 0;
  for (const side of SIDES) {
    if (!p.rim || !Array.isArray(p.rim[side]) || p.rim[side].length !== 9) { fail(`${tag}: rim.${side} is not nine entries`); return; }
    clues[side] = p.rim[side].map((v, k) => {
      if (v == null) return null;
      printed++;
      const truth = cellsOf(side, k).map((i) => sol[i]).sort().join('');
      if (typeof v !== 'string' || !/^[1-9]{3}$/.test(v)) fail(`${tag}: ${side} entry ${k + 1} is not three digits`);
      else if (v !== truth) fail(`${tag}: ${side} entry ${k + 1} says ${v}, the solution gives ${truth}`);
      return { digits: v };
    });
  }
  if (printed !== p.printed) fail(`${tag}: printed says ${p.printed}, the board shows ${printed} triples`);
  if (printed !== PRINTED_BY_DOW[dow]) fail(`${tag}: weekday ${dow} wants ${PRINTED_BY_DOW[dow]} triples, board shows ${printed}`);
  const n = countSolutions(given, clues, 2);
  if (n !== 1) fail(`${tag}: ${n === 0 ? 'no solution' : 'more than one solution'} under the printed triples`);
  let res;
  try { res = logicSolve(given, clues, sol); } catch (e) { fail(`${tag}: ${e.message}`); return; }
  if (!res.solved) fail(`${tag}: does not fall to the rim deduction plus singles, it would need a guess`);
  else if (res.grid.join(',') !== sol.join(',')) fail(`${tag}: logic reached a different grid than the stored solution`);
  const pat = SIDES.map((s) => p.rim[s].map((v) => (v ? 1 : 0)).join('')).join('|');
  if (seenPat.has(pat)) fail(`${tag}: repeats the gutter pattern of #${seenPat.get(pat)}`);
  seenPat.set(pat, p.num);
});
console.log(`RIM ok: ${PUZZLES.length} boards ${PUZZLES[0].live} to ${last.live}, ${sundays} Sunday Editions, triples ${Math.min(...PUZZLES.map((p) => p.printed))}-${Math.max(...PUZZLES.map((p) => p.printed))} of 36, no digit inside the grid, unique and logic-only.`);
