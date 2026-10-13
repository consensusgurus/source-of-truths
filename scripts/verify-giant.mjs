#!/usr/bin/env node
// Bank checker for Giant, the daily 16x16 sudoku.
//
// It RECOMPUTES everything and trusts no stored field, and it shares NO code
// with scripts/gen-giant.mjs: the generator works on bitmask candidates over a
// peer list, this file on per-house "used" sets for its exhaustive counter and
// on Set candidates for its graded logical solver. The logical solver is
// POLICED against the stored solution: an elimination that removes the true
// symbol, or a placement that writes a false one, is reported as an unsound
// rule rather than trusted.
//
// Proves, per board:
//   1  the solution is a legal 16x16 grid (every row, column and 4x4 box holds
//      the sixteen symbols 1..16 once)
//   2  the clues are a subset of that solution
//   3  the printed count matches the weekday ramp (Mon 128 .. Sat 96, Sun 90)
//   4  exactly one solution: by the policed logical solve, and by an exhaustive
//      count on every weekday board (Sundays too under --full)
//   5  it falls to logic with no guessing at level <= 2
//   6  the demanded level equals the stored one AND the weekday pin
//      (Mon-Sat 1, the Sunday Edition 2)
// and across the bank: contiguous nums, consecutive live dates, labels and
// quizIds derived from the date, the Sunday flag on real Sundays only, and no
// repeated solution grid or clue pattern.
//
// Usage: node scripts/verify-giant.mjs [--full]   (VERIFY_GIANT_BANK=<path> overrides)

import path from 'node:path';
import { pathToFileURL } from 'node:url';

const BANK = process.env.VERIFY_GIANT_BANK || path.join(process.cwd(), 'app/giant/puzzles.js');
const { PUZZLES } = await import(pathToFileURL(BANK).href);

const PRINTED_BY_DOW = { 0: 90, 1: 128, 2: 120, 3: 112, 4: 106, 5: 100, 6: 96 };
const LEVEL_BY_DOW = { 0: 2, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 };
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const FULL = process.argv.includes('--full');
const S = 16, SQ = 256, DIGITS = Array.from({ length: S }, (_, k) => k + 1);

const fails = [], warns = [];
const fail = (m) => fails.push(m);
const warn = (m) => warns.push(m);

// ---- geometry, rebuilt here ------------------------------------------------
const r_ = (i) => Math.floor(i / S), c_ = (i) => i % S;
const b_ = (i) => Math.floor(r_(i) / 4) * 4 + Math.floor(c_(i) / 4);
const at = (r, c) => r * S + c;
const HOUSES = [];
for (let k = 0; k < S; k++) HOUSES.push(DIGITS.map((d) => at(k, d - 1)));               // rows
for (let k = 0; k < S; k++) HOUSES.push(DIGITS.map((d) => at(d - 1, k)));               // columns
for (let k = 0; k < S; k++) {                                                           // boxes
  const h = [];
  for (let dr = 0; dr < 4; dr++) for (let dc = 0; dc < 4; dc++) h.push(at(Math.floor(k / 4) * 4 + dr, (k % 4) * 4 + dc));
  HOUSES.push(h);
}
const HOUSES_OF = Array.from({ length: SQ }, () => []);
HOUSES.forEach((h, k) => h.forEach((i) => HOUSES_OF[i].push(k)));
const SEES = Array.from({ length: SQ }, (_, i) => [...new Set(HOUSES_OF[i].flatMap((k) => HOUSES[k]))].filter((j) => j !== i));

// ---- exhaustive counter ----------------------------------------------------
// Each node first forces everything singles can force (a square with one
// option, a symbol with one home in a house), on a copy of the grid, then
// branches on the most-constrained square. Forcing is sound, so this still
// counts every solution; without it a 96-clue board does not finish.
function countSolutions(given, cap) {
  let found = 0;
  const optionsOf = (grid, i) => {
    const used = new Set();
    for (const j of SEES[i]) if (grid[j]) used.add(grid[j]);
    return DIGITS.filter((d) => !used.has(d));
  };
  (function walk(grid) {
    if (found >= cap) return;
    for (;;) {
      let changed = false;
      for (let i = 0; i < SQ; i++) {
        if (grid[i]) continue;
        const o = optionsOf(grid, i);
        if (!o.length) return;
        if (o.length === 1) { grid[i] = o[0]; changed = true; }
      }
      for (const h of HOUSES) {
        const have = new Set(h.map((i) => grid[i]).filter(Boolean));
        if (have.size !== h.filter((i) => grid[i]).length) return;     // a repeat: dead
        for (const d of DIGITS) {
          if (have.has(d)) continue;
          const homes = h.filter((i) => !grid[i] && optionsOf(grid, i).includes(d));
          if (!homes.length) return;
          if (homes.length === 1) { grid[homes[0]] = d; have.add(d); changed = true; }
        }
      }
      if (!changed) break;
    }
    let pick = -1, opts = null;
    for (let i = 0; i < SQ; i++) {
      if (grid[i]) continue;
      const o = optionsOf(grid, i);
      if (!o.length) return;
      if (!opts || o.length < opts.length) { pick = i; opts = o; }
    }
    if (pick < 0) {
      if (HOUSES.every((h) => new Set(h.map((i) => grid[i])).size === S)) found++;
      return;
    }
    for (const d of opts) {
      const next = grid.slice(); next[pick] = d;
      walk(next);
      if (found >= cap) return;
    }
  })(given.slice());
  return found;
}

// ---- graded logical solver, policed ----------------------------------------
function logicSolve(given, truth) {
  const solved = given.slice();
  const cand = Array.from({ length: SQ }, (_, i) => new Set(given[i] ? [given[i]] : DIGITS));
  let hardest = 1;
  const police = () => {
    for (let i = 0; i < SQ; i++) {
      if (!cand[i].has(truth[i])) throw new Error(`unsound elimination at r${r_(i) + 1}c${c_(i) + 1}`);
      if (solved[i] && solved[i] !== truth[i]) throw new Error(`unsound placement at r${r_(i) + 1}c${c_(i) + 1}`);
    }
  };
  const place = (i, d) => { solved[i] = d; cand[i] = new Set([d]); for (const j of SEES[i]) if (!solved[j]) cand[j].delete(d); };
  for (let i = 0; i < SQ; i++) if (given[i]) for (const j of SEES[i]) if (!solved[j]) cand[j].delete(given[i]);
  police();
  const singles = () => {
    for (let i = 0; i < SQ; i++) if (!solved[i] && cand[i].size === 1) { place(i, [...cand[i]][0]); return true; }
    for (const h of HOUSES) for (const d of DIGITS) {
      if (h.some((i) => solved[i] === d)) continue;
      const spots = h.filter((i) => !solved[i] && cand[i].has(d));
      if (spots.length === 1) { place(spots[0], d); return true; }
    }
    return false;
  };
  const advanced = () => {
    let moved = false;
    for (const [k, h] of HOUSES.entries()) for (const d of DIGITS) {
      const spots = h.filter((i) => !solved[i] && cand[i].has(d));
      if (spots.length < 2 || spots.length > 4) continue;
      for (const k2 of HOUSES_OF[spots[0]]) {
        if (k2 === k || !spots.every((i) => HOUSES_OF[i].includes(k2))) continue;
        for (const j of HOUSES[k2]) if (!solved[j] && !spots.includes(j) && cand[j].delete(d)) moved = true;
      }
    }
    for (const h of HOUSES) {
      const open = h.filter((i) => !solved[i]);
      for (let a = 0; a < open.length; a++) for (let b = a + 1; b < open.length; b++) {
        const two = new Set([...cand[open[a]], ...cand[open[b]]]);
        if (two.size === 2) for (const j of open) if (j !== open[a] && j !== open[b]) for (const d of two) if (cand[j].delete(d)) moved = true;
        for (let c = b + 1; c < open.length; c++) {
          const three = new Set([...two, ...cand[open[c]]]);
          if (three.size === 3) for (const j of open) if (j !== open[a] && j !== open[b] && j !== open[c]) for (const d of three) if (cand[j].delete(d)) moved = true;
        }
      }
      for (let d1 = 1; d1 <= S; d1++) for (let d2 = d1 + 1; d2 <= S; d2++) {
        const s1 = open.filter((i) => cand[i].has(d1)), s2 = open.filter((i) => cand[i].has(d2));
        if (s1.length !== 2 || s2.length !== 2 || s1[0] !== s2[0] || s1[1] !== s2[1]) continue;
        for (const i of s1) for (const d of [...cand[i]]) if (d !== d1 && d !== d2) { cand[i].delete(d); moved = true; }
      }
    }
    return moved;
  };
  for (;;) {
    if (singles()) continue;
    police();
    if (advanced()) { hardest = 2; police(); continue; }
    break;
  }
  police();
  return { solved: solved.every((v) => v > 0), level: hardest, grid: solved };
}

// ---- dates -----------------------------------------------------------------
const asDate = (iso) => new Date(iso + 'T00:00:00Z');
const dowOf = (iso) => asDate(iso).getUTCDay();
const labelOf = (iso) => { const d = asDate(iso); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`; };
const quizIdOf = (iso) => { const d = asDate(iso); return `giant-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`; };
const addDays = (iso, n) => { const d = asDate(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

// ---- the sweep -------------------------------------------------------------
if (!Array.isArray(PUZZLES) || !PUZZLES.length) { console.error('GIANT: no puzzles'); process.exit(1); }
const seenSol = new Map(), seenPat = new Map(), seenQuiz = new Set();
const first = PUZZLES[0].live;

for (const [n, p] of PUZZLES.entries()) {
  const tag = `#${p.num} ${p.live}`;
  if (p.num !== n + 1) fail(`${tag}: num out of sequence, expected ${n + 1}`);
  if (p.live !== addDays(first, n)) fail(`${tag}: live date is not day ${n} after ${first}`);
  if (p.dateLabel !== labelOf(p.live)) fail(`${tag}: dateLabel does not match the date`);
  if (p.quizId !== quizIdOf(p.live)) fail(`${tag}: quizId "${p.quizId}" does not match the date`);
  if (seenQuiz.has(p.quizId)) fail(`${tag}: duplicate quizId`);
  seenQuiz.add(p.quizId);
  const dow = dowOf(p.live);
  if (!!p.sunday !== (dow === 0)) fail(`${tag}: sunday flag is ${!!p.sunday} on weekday ${dow}`);

  if (!Array.isArray(p.given) || p.given.length !== S || p.given.some((row) => row.length !== S)) { fail(`${tag}: given is not 16x16`); continue; }
  if (!Array.isArray(p.sol) || p.sol.length !== S || p.sol.some((row) => row.length !== S)) { fail(`${tag}: sol is not 16x16`); continue; }
  const given = p.given.flat(), sol = p.sol.flat();

  // 1
  const bad = HOUSES.findIndex((h) => new Set(h.map((i) => sol[i])).size !== S || h.some((i) => !(sol[i] >= 1 && sol[i] <= S)));
  if (bad >= 0) { fail(`${tag}: solution breaks ${bad < 16 ? 'row' : bad < 32 ? 'column' : 'box'} ${(bad % 16) + 1}`); continue; }
  // 2
  const off = given.findIndex((v, i) => v && v !== sol[i]);
  if (off >= 0) fail(`${tag}: clue at r${r_(off) + 1}c${c_(off) + 1} disagrees with the solution`);
  // 3
  const printed = given.filter(Boolean).length;
  if (printed !== p.printed) fail(`${tag}: printed says ${p.printed}, the board shows ${printed}`);
  if (printed !== PRINTED_BY_DOW[dow]) fail(`${tag}: weekday ${dow} wants ${PRINTED_BY_DOW[dow]} clues, board has ${printed}`);
  // 4. Uniqueness is proved twice over. The policed logical solver below only
  // ever makes deductions that follow from the clues, so when it finishes the
  // grid no other grid can fit them. The exhaustive counter re-proves it
  // independently on every weekday board; a Sunday Edition at 90 clues costs it
  // ~25s, so Sundays run it only under --full (the logical proof still holds).
  if (!p.sunday || FULL) {
    const nSol = countSolutions(given, 2);
    if (nSol !== 1) fail(`${tag}: ${nSol === 0 ? 'no solution' : 'more than one solution'}`);
  }
  // 5 + 6
  let res;
  try { res = logicSolve(given, sol); } catch (e) { fail(`${tag}: ${e.message}`); continue; }
  if (!res.solved) fail(`${tag}: does not fall to logic at level 2, it would need a guess`);
  else if (res.grid.join(',') !== sol.join(',')) fail(`${tag}: logic reached a different grid`);
  if (res.level !== p.level) fail(`${tag}: level says ${p.level}, the board demands ${res.level}`);
  if (res.level !== LEVEL_BY_DOW[dow]) fail(`${tag}: weekday ${dow} pins level ${LEVEL_BY_DOW[dow]}, board demands ${res.level}`);
  // variety
  const sk = sol.join(','), pk = given.map((v) => (v ? 1 : 0)).join('');
  if (seenSol.has(sk)) fail(`${tag}: repeats the solution grid of #${seenSol.get(sk)}`);
  if (seenPat.has(pk)) fail(`${tag}: repeats the clue pattern of #${seenPat.get(pk)}`);
  seenSol.set(sk, p.num); seenPat.set(pk, p.num);
}

const last = PUZZLES[PUZZLES.length - 1];
const daysLeft = Math.round((asDate(last.live) - new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')) / 86400000);
if (daysLeft < 0) fail(`the bank ran out on ${last.live}`);
else if (daysLeft < 14) warn(`only ${daysLeft} days of bank left (ends ${last.live})`);

for (const w of warns) console.warn('GIANT warn: ' + w);
if (fails.length) {
  for (const f of fails) console.error('GIANT FAIL: ' + f);
  console.error(`\nGIANT: ${fails.length} failure(s) across ${PUZZLES.length} boards.`);
  process.exit(1);
}
const sundays = PUZZLES.filter((p) => p.sunday).length;
console.log(`GIANT ok: ${PUZZLES.length} boards ${PUZZLES[0].live} to ${last.live}, ${sundays} Sunday Editions, clues ${Math.min(...PUZZLES.map((p) => p.printed))}-${Math.max(...PUZZLES.map((p) => p.printed))}, every board unique and logic-only at its pinned level.`);
