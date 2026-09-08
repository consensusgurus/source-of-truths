#!/usr/bin/env node
// Bank checker for Diag, the daily diagonal sudoku (Sudoku X).
//
// It RECOMPUTES everything and trusts no stored field, and it shares NO code
// with the generator: the solvers below are written independently (Set-based
// candidates, branching on the house/digit with the fewest placements rather
// than on the cell with the fewest candidates), so the two cannot agree with
// each other about a bug. The logical solver is POLICED against the known
// solution: any elimination that removes the true digit, or any placement that
// writes a false one, is reported as an unsound rule rather than trusted,
// which is what lets one logical solver certify "no guessing" honestly.
//
// Proves, per board:
//   1  the solution is a legal diagonal grid (rows, columns, boxes, and each of
//      the two long diagonals holding every digit once)
//   2  the clues are a subset of that solution
//   3  the printed count matches the weekday ramp (Mon 26 .. Sat 16, Sun 14)
//   4  exactly one solution under the diagonal rule
//   5  it falls to logic with no guessing at level <= 2
//   6  the demanded level equals the stored one AND the weekday pin
//   7  DIAGONAL NECESSITY: with the rule off the clues admit more than one
//      grid, so the board can never be a plain sudoku in disguise
//
// A DIAGONAL IS A HOUSE: the two diagonals sit in UNITS here as well as in SEE,
// so hidden singles, locked candidates and subsets read off them like a row.
// and across the bank: contiguous nums, consecutive live dates, labels and
// quizIds derived from the date, the Sunday flag on real Sundays only, and no
// repeated solution grid or clue pattern.
//
// Usage: node scripts/verify-diag.mjs   (VERIFY_DIAG_BANK=<path> overrides)

import path from 'node:path';
import { pathToFileURL } from 'node:url';

const BANK = process.env.VERIFY_DIAG_BANK || path.join(process.cwd(), 'app/diag/puzzles.js');
const { PUZZLES } = await import(pathToFileURL(BANK).href);

const PRINTED_BY_DOW = { 0: 14, 1: 26, 2: 24, 3: 22, 4: 20, 5: 18, 6: 16 };
const LEVEL_BY_DOW = { 0: 2, 1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 2 };
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const fails = [];
const warns = [];
const fail = (m) => fails.push(m);
const warn = (m) => warns.push(m);

// ---- geometry, rebuilt here rather than imported -------------------------
const idx = (r, c) => r * 9 + c;
const rowOf = (i) => Math.floor(i / 9);
const colOf = (i) => i % 9;
const boxIdx = (i) => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);

// the cells sharing a diagonal with i, written as a coordinate walk rather
// than a membership test so it cannot be a copy of the generator's
function diagonalsOf(i) {
  const r = rowOf(i), c = colOf(i), out = [];
  if (r === c) for (let k = 0; k < 9; k++) if (k !== r) out.push(idx(k, k));
  if (r + c === 8) for (let k = 0; k < 9; k++) if (k !== r) out.push(idx(k, 8 - k));
  return out;
}
const DG = Array.from({ length: 81 }, (_, i) => diagonalsOf(i));
const HOUSE = Array.from({ length: 81 }, (_, i) => {
  const out = [];
  for (let j = 0; j < 81; j++) {
    if (j === i) continue;
    if (rowOf(j) === rowOf(i) || colOf(j) === colOf(i) || boxIdx(j) === boxIdx(i)) out.push(j);
  }
  return out;
});
const SEE = Array.from({ length: 81 }, (_, i) => [...new Set(HOUSE[i].concat(DG[i]))]);
// the 27 ordinary houses plus the two diagonals: 29 houses
const UNITS = [];
for (let r = 0; r < 9; r++) UNITS.push([...Array(9).keys()].map((c) => idx(r, c)));
for (let c = 0; c < 9; c++) UNITS.push([...Array(9).keys()].map((r) => idx(r, c)));
for (let br = 0; br < 3; br++) for (let bc = 0; bc < 3; bc++) {
  const u = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) u.push(idx(br * 3 + r, bc * 3 + c));
  UNITS.push(u);
}
UNITS.push([...Array(9).keys()].map((k) => idx(k, k)));
UNITS.push([...Array(9).keys()].map((k) => idx(k, 8 - k)));
// the ordinary 27, for the necessity count with the rule switched off
const PLAIN_UNITS = UNITS.slice(0, 27);
const UNITS_OF = Array.from({ length: 81 }, () => []);
UNITS.forEach((u, k) => u.forEach((i) => UNITS_OF[i].push(k)));

// ---- an independent solution counter -------------------------------------
// Candidates are Sets, and the branch is chosen by the HOUSE-and-digit with
// the fewest legal placements, not by the emptiest cell. Different data
// structure, different branching order, same answer or one of us is wrong.
function candidateMap(given, see) {
  const cand = [];
  for (let i = 0; i < 81; i++) {
    if (given[i]) { cand.push(new Set([given[i]])); continue; }
    const s = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const j of see[i]) if (given[j]) s.delete(given[j]);
    cand.push(s);
  }
  return cand;
}
function countSolutions(given, cap, useDiag) {
  const see = useDiag ? SEE : HOUSE;
  const units = useDiag ? UNITS : PLAIN_UNITS;
  const grid = given.slice();
  let found = 0;
  const legal = (i, d) => { for (const j of see[i]) if (grid[j] === d) return false; return true; };
  (function walk() {
    if (found >= cap) return;
    // pick the tightest (unit, digit) placement
    let bestSpots = null, bestN = 99;
    for (const u of units) {
      for (let d = 1; d <= 9; d++) {
        if (u.some((i) => grid[i] === d)) continue;
        const spots = u.filter((i) => !grid[i] && legal(i, d));
        if (spots.length < bestN) { bestN = spots.length; bestSpots = { spots, d }; }
        if (bestN === 0) return; // this unit cannot place d at all
      }
    }
    if (!bestSpots) { found++; return; }   // every unit holds every digit
    for (const i of bestSpots.spots) {
      grid[i] = bestSpots.d;
      walk();
      grid[i] = 0;
      if (found >= cap) return;
    }
  })();
  return found;
}

// ---- an independent graded logical solver, policed against the truth ------
function logicSolve(given, truth) {
  const cand = candidateMap(given, SEE);
  const solved = given.slice();
  let hardest = 1;
  const police = () => {
    if (!truth) return;
    for (let i = 0; i < 81; i++) {
      if (!cand[i].has(truth[i])) throw new Error(`unsound elimination at r${rowOf(i) + 1}c${colOf(i) + 1}: lost ${truth[i]}`);
      if (solved[i] && solved[i] !== truth[i]) throw new Error(`unsound placement at r${rowOf(i) + 1}c${colOf(i) + 1}`);
    }
  };
  const place = (i, d) => {
    solved[i] = d;
    cand[i] = new Set([d]);
    for (const j of SEE[i]) if (!solved[j]) cand[j].delete(d);
  };
  for (let i = 0; i < 81; i++) if (given[i]) place(i, given[i]);
  police();

  const nakedSingle = () => {
    let moved = false;
    for (let i = 0; i < 81; i++) if (!solved[i] && cand[i].size === 1) { place(i, [...cand[i]][0]); moved = true; }
    return moved;
  };
  const hiddenSingle = () => {
    let moved = false;
    for (const u of UNITS) for (let d = 1; d <= 9; d++) {
      if (u.some((i) => solved[i] === d)) continue;
      const spots = u.filter((i) => !solved[i] && cand[i].has(d));
      if (spots.length === 1) { place(spots[0], d); moved = true; }
    }
    return moved;
  };
  const lockedCandidates = () => {
    let moved = false;
    for (const [k, u] of UNITS.entries()) for (let d = 1; d <= 9; d++) {
      if (u.some((i) => solved[i] === d)) continue;
      const spots = u.filter((i) => !solved[i] && cand[i].has(d));
      if (spots.length < 2 || spots.length > 3) continue;
      for (const k2 of UNITS_OF[spots[0]]) {
        if (k2 === k) continue;
        if (!spots.every((i) => UNITS_OF[i].includes(k2))) continue;
        for (const j of UNITS[k2]) {
          if (solved[j] || spots.includes(j) || !cand[j].has(d)) continue;
          cand[j].delete(d); moved = true;
        }
      }
    }
    return moved;
  };
  const subsets = () => {
    let moved = false;
    for (const u of UNITS) {
      const open = u.filter((i) => !solved[i]);
      // naked pairs and triples
      for (let a = 0; a < open.length; a++) for (let b = a + 1; b < open.length; b++) {
        const two = new Set([...cand[open[a]], ...cand[open[b]]]);
        if (two.size === 2) moved = clear(u, [open[a], open[b]], two) || moved;
        for (let c = b + 1; c < open.length; c++) {
          const three = new Set([...two, ...cand[open[c]]]);
          if (three.size === 3) moved = clear(u, [open[a], open[b], open[c]], three) || moved;
        }
      }
      // hidden pairs
      for (let d1 = 1; d1 <= 9; d1++) for (let d2 = d1 + 1; d2 <= 9; d2++) {
        if (u.some((i) => solved[i] === d1 || solved[i] === d2)) continue;
        const s1 = open.filter((i) => cand[i].has(d1));
        const s2 = open.filter((i) => cand[i].has(d2));
        if (s1.length !== 2 || s2.length !== 2) continue;
        if (s1[0] !== s2[0] || s1[1] !== s2[1]) continue;
        for (const i of s1) {
          for (const d of [...cand[i]]) if (d !== d1 && d !== d2) { cand[i].delete(d); moved = true; }
        }
      }
    }
    return moved;
    function clear(unit, group, digits) {
      let did = false;
      for (const j of unit) {
        if (solved[j] || group.includes(j)) continue;
        for (const d of digits) if (cand[j].delete(d)) did = true;
      }
      return did;
    }
  };

  for (;;) {
    if (nakedSingle() || hiddenSingle()) { police(); continue; }
    if (lockedCandidates() || subsets()) { hardest = 2; police(); continue; }
    break;
  }
  return { solved: solved.every((v) => v > 0), level: hardest, grid: solved };
}

// ---- date helpers ---------------------------------------------------------
const asDate = (iso) => new Date(iso + 'T00:00:00Z');
const dowOf = (iso) => asDate(iso).getUTCDay();
const labelOf = (iso) => { const d = asDate(iso); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`; };
const quizIdOf = (iso) => { const d = asDate(iso); return `diag-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`; };
const addDays = (iso, n) => { const d = asDate(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

// ---- the sweep ------------------------------------------------------------
if (!Array.isArray(PUZZLES) || !PUZZLES.length) { console.error('DIAG: no puzzles'); process.exit(1); }

const seenSol = new Map(), seenPat = new Map(), seenQuiz = new Set();
const first = PUZZLES[0].live;

for (const [n, p] of PUZZLES.entries()) {
  const tag = `#${p.num} ${p.live}`;
  if (p.num !== n + 1) fail(`${tag}: num out of sequence, expected ${n + 1}`);
  if (p.live !== addDays(first, n)) fail(`${tag}: live date is not day ${n} after ${first}`);
  if (p.dateLabel !== labelOf(p.live)) fail(`${tag}: dateLabel "${p.dateLabel}" does not match the date`);
  if (p.quizId !== quizIdOf(p.live)) fail(`${tag}: quizId "${p.quizId}" does not match the date`);
  if (seenQuiz.has(p.quizId)) fail(`${tag}: duplicate quizId`);
  seenQuiz.add(p.quizId);

  const dow = dowOf(p.live);
  if (!!p.sunday !== (dow === 0)) fail(`${tag}: sunday flag is ${!!p.sunday} on weekday ${dow}`);

  const given = p.given.flat();
  const sol = p.sol.flat();
  if (given.length !== 81 || sol.length !== 81) { fail(`${tag}: grid is not 9x9`); continue; }

  // 1. the solution is a legal diagonal grid
  let legal = true;
  for (const [k, u] of UNITS.entries()) {
    const s = new Set(u.map((i) => sol[i]));
    if (s.size !== 9 || [...s].some((d) => d < 1 || d > 9)) {
      legal = false;
      if (k >= 27) fail(`${tag}: solution repeats a digit on the ${k === 27 ? 'main' : 'anti'} diagonal`);
      break;
    }
  }
  if (!legal) { if (!fails.some((m) => m.startsWith(tag))) fail(`${tag}: solution is not a legal diagonal grid`); continue; }

  // 2. clues are a subset of the solution
  for (let i = 0; i < 81; i++) if (given[i] && given[i] !== sol[i]) { fail(`${tag}: clue at r${rowOf(i) + 1}c${colOf(i) + 1} disagrees with the solution`); break; }

  // 3. printed count matches the weekday ramp
  const printed = given.filter(Boolean).length;
  if (printed !== p.printed) fail(`${tag}: printed says ${p.printed}, the board shows ${printed}`);
  if (printed !== PRINTED_BY_DOW[dow]) fail(`${tag}: weekday ${dow} wants ${PRINTED_BY_DOW[dow]} clues, board has ${printed}`);

  // 4. exactly one solution under the diagonal rule
  const nSol = countSolutions(given, 2, true);
  if (nSol !== 1) fail(`${tag}: ${nSol === 0 ? 'no solution' : 'more than one solution'} under the diagonal rule`);

  // 5 + 6. logic with no guessing, at the level the weekday pins
  let res;
  try { res = logicSolve(given, sol); } catch (e) { fail(`${tag}: ${e.message}`); continue; }
  if (!res.solved) fail(`${tag}: does not fall to logic at level 2, it would need a guess`);
  else if (res.grid.join(',') !== sol.join(',')) fail(`${tag}: logic reached a different grid than the stored solution`);
  if (res.level !== p.level) fail(`${tag}: level says ${p.level}, the board demands ${res.level}`);
  if (res.level !== LEVEL_BY_DOW[dow]) fail(`${tag}: weekday ${dow} pins level ${LEVEL_BY_DOW[dow]}, board demands ${res.level}`);

  // 7. diagonal necessity
  const plain = countSolutions(given, 2, false);
  if (plain < 2) fail(`${tag}: the clues pin a single grid WITHOUT the diagonal rule, so the rule is decoration`);

  // variety
  const sk = sol.join(''), pk = given.map((v) => (v ? 1 : 0)).join('');
  if (seenSol.has(sk)) fail(`${tag}: repeats the solution grid of #${seenSol.get(sk)}`);
  if (seenPat.has(pk)) fail(`${tag}: repeats the clue pattern of #${seenPat.get(pk)}`);
  seenSol.set(sk, p.num); seenPat.set(pk, p.num);
}

const last = PUZZLES[PUZZLES.length - 1];
const daysLeft = Math.round((asDate(last.live) - new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')) / 86400000);
if (daysLeft < 0) fail(`the bank ran out on ${last.live}`);
else if (daysLeft < 14) warn(`only ${daysLeft} days of bank left (ends ${last.live})`);

for (const w of warns) console.warn('DIAG warn: ' + w);
if (fails.length) {
  for (const f of fails) console.error('DIAG FAIL: ' + f);
  console.error(`\nDIAG: ${fails.length} failure(s) across ${PUZZLES.length} boards.`);
  process.exit(1);
}
const sundays = PUZZLES.filter((p) => p.sunday).length;
console.log(`DIAG ok: ${PUZZLES.length} boards ${PUZZLES[0].live} to ${last.live}, ${sundays} Sunday Editions, clues ${Math.min(...PUZZLES.map((p) => p.printed))}-${Math.max(...PUZZLES.map((p) => p.printed))}, every board unique, logic-only, and impossible without the diagonals.`);
