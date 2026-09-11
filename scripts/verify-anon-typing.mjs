#!/usr/bin/env node
// Verifier for Anon's CURSOR, discovered by scripts/verify-all.mjs.
//
// Anon shows the same letters twice and the two halves read in two different
// orders, so "where does the cursor go after a letter" has two right answers and
// picking the wrong one is invisible in every static check: the code compiles,
// the board is untouched, every cell is still reachable, and the only symptom is
// a player clicking back into the word he was typing (Rookie, 2026-09-11).
//
// So this runs the rule rather than reading it. app/anon/typing.js is pure and
// imports nothing from React, which is the only reason that is possible.
//
// WHAT IT PROVES, on every board in the bank:
//
//   passage    typing in the passage walks the PASSAGE. Starting on any word's
//              first cell and advancing once per letter fills exactly that
//              word's cells, in order, and then lands on the first letter of the
//              next word. This is the property the bug broke.
//   bank       typing in a bank row still walks the ANSWER, in the answer's own
//              order, and still falls into the passage off the end of a row.
//   symmetry   -1 undoes +1 in both halves, so delete retraces what typing laid
//              down instead of leaving a gap behind.
//   ends       neither direction ever leaves 0..N-1, and neither wraps: a
//              passage has a first letter and a last one.
//   words      the word index covers every cell exactly once, agrees with the
//              passage's own cell numbering, and its first cells are the cells
//              the dock's stepper moves between.
//   wiring     AnonClient asks typing.js rather than keeping a second copy of
//              the rule, and the half it passes is the half being worked.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PUZZLES } from '../app/anon/puzzles.js';
import { nextCell, passageTokens, wordIndex } from '../app/anon/typing.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const fail = [];
const bad = (m) => fail.push(m);

for (const P of PUZZLES) {
  const A = P.a;
  const owner = [], oidx = [], sol = [];
  A.forEach((a, ai) => a.c.forEach((n, k) => { sol[n] = a.w[k]; owner[n] = ai; oidx[n] = k; }));
  const N = sol.length;
  const B = { A, owner, oidx, N };
  const at = `#${P.num}`;

  // The cells must partition the passage for any of this to mean anything.
  // verify-anon.mjs owns that rule; this is the cheap restatement it relies on.
  if (owner.length !== N || owner.some((o) => o === undefined)) {
    bad(`${at}: cells do not cover 0..${N - 1}`);
    continue;
  }

  const tokens = passageTokens(P.q);
  const words = wordIndex(tokens);

  // words: every cell in exactly one word, numbered in passage order.
  const seen = new Array(N).fill(0);
  let expect = 0;
  for (const tk of tokens) {
    for (const t of tk) {
      if (t.p !== undefined) continue;
      if (t.n !== expect) bad(`${at}: passage cell out of order at ${t.n}, expected ${expect}`);
      expect += 1;
      seen[t.n] = (seen[t.n] || 0) + 1;
    }
  }
  if (expect !== N) bad(`${at}: passage has ${expect} letters but the bank fills ${N}`);
  if (seen.some((c) => c !== 1)) bad(`${at}: a cell sits in no word or in two`);
  if (words.of.length !== N || words.of.some((w) => w === undefined)) bad(`${at}: word index misses a cell`);
  for (const [wi, first] of words.first.entries()) {
    if (words.of[first] !== wi) bad(`${at}: word ${wi} does not start at its own first cell`);
    if (first > 0 && words.of[first - 1] === wi) bad(`${at}: word ${wi} starts mid-word`);
  }

  // PASSAGE: a whole word typed straight through, on every word of every board.
  for (const [wi, first] of words.first.entries()) {
    const cells = [];
    for (let n = first; n < N && words.of[n] === wi; n += 1) cells.push(n);
    let n = first;
    for (let k = 0; k < cells.length; k += 1) {
      if (n !== cells[k]) bad(`${at}: word ${wi} letter ${k} landed on ${n}, wanted ${cells[k]}`);
      n = nextCell('q', n, 1, B);
    }
    const last = cells[cells.length - 1];
    const after = last === N - 1 ? last : last + 1;
    if (n !== after) bad(`${at}: leaving word ${wi} landed on ${n}, wanted ${after}`);
    if (after !== last && words.of[after] === wi) bad(`${at}: word ${wi} did not end where it ends`);
  }

  for (let n = 0; n < N; n += 1) {
    // PASSAGE, both directions, clamped and never wrapping.
    const q1 = nextCell('q', n, 1, B), q0 = nextCell('q', n, -1, B);
    if (q1 !== Math.min(N - 1, n + 1)) bad(`${at}: passage +1 from ${n} gave ${q1}`);
    if (q0 !== Math.max(0, n - 1)) bad(`${at}: passage -1 from ${n} gave ${q0}`);
    if (n > 0 && n < N - 1 && nextCell('q', q1, -1, B) !== n) bad(`${at}: passage delete does not retrace from ${n}`);

    // BANK: the answer's own order, then out into the passage.
    const a = A[owner[n]], k = oidx[n];
    const b1 = nextCell('b', n, 1, B), b0 = nextCell('b', n, -1, B);
    const wantUp = k + 1 < a.c.length ? a.c[k + 1] : Math.min(N - 1, n + 1);
    const wantDn = k > 0 ? a.c[k - 1] : Math.max(0, n - 1);
    if (b1 !== wantUp) bad(`${at}: bank +1 from ${n} gave ${b1}, wanted ${wantUp}`);
    if (b0 !== wantDn) bad(`${at}: bank -1 from ${n} gave ${b0}, wanted ${wantDn}`);
    if (k + 1 < a.c.length && nextCell('b', b1, -1, B) !== n) bad(`${at}: bank delete does not retrace from ${n}`);
    if (b1 < 0 || b1 > N - 1 || b0 < 0 || b0 > N - 1) bad(`${at}: bank step left the board at ${n}`);

    // The two halves genuinely differ, which is the whole point: a scattered
    // answer's next letter is almost never the passage's next letter.
    if (k + 1 < a.c.length && a.c[k + 1] !== n + 1 && b1 === q1) bad(`${at}: halves agree where they must not, at ${n}`);
  }

  // BANK: a whole answer typed straight through, unchanged behaviour.
  for (const [ai, a] of A.entries()) {
    let n = a.c[0];
    for (const c of a.c) {
      if (n !== c) bad(`${at}: answer ${ai} walked to ${n}, wanted ${c}`);
      n = nextCell('b', n, 1, B);
    }
  }
}

// WIRING. The rule is only worth testing if the client is the thing that asks
// it, so the client must hold no second copy and must pass the worked half.
const src = readFileSync(join(root, 'app/anon/AnonClient.jsx'), 'utf8');
if (!/from '\.\/typing'/.test(src)) bad('AnonClient does not import ./typing');
if (!/nextCell\(workingHalf\(\)/.test(src)) bad('move() does not ask typing.js with the worked half');
if (!/const workingHalf = useCallback\(\(\) => \(narrow \? view : halfRef\.current\)/.test(src)) {
  bad('workingHalf no longer resolves narrow->view, wide->halfRef');
}
if (/const a = A\[owner\[n\]\];[\s\S]{0,120}oidx\[n\] \+ d/.test(src)) bad('AnonClient still carries its own copy of the advance rule');
// The answer stepper is a bank action wherever it is pressed, and the dock's
// arrows follow the half rather than always stepping answers.
if (!/focusCell\(A\[\(owner\[cur\] \+ TOTAL \+ d\) % TOTAL\]\.c\[0\], 'b'\)/.test(src)) bad('stepAnswer does not aim the scroll at the bank');
if (!/stepNext\(-1\)[\s\S]{0,160}stepNext\(1\)/.test(src)) bad('the dock arrows no longer use stepNext');
if (/onClick=\{\(\) => focusCell\(A\[\(curAnswer/.test(src)) bad('a stepper still hardcodes the next ANSWER');

if (fail.length) {
  for (const m of fail.slice(0, 25)) console.log(`✗ ${m}`);
  if (fail.length > 25) console.log(`✗ ...and ${fail.length - 25} more`);
  console.log(`\n${fail.length} cursor failure(s) across ${PUZZLES.length} boards`);
  process.exit(1);
}
console.log(`clean: ${PUZZLES.length} boards, every passage word types straight through and every bank row still walks its answer`);
