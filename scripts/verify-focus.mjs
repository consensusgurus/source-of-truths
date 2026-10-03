#!/usr/bin/env node
// scripts/verify-focus.mjs — the Focus bank and subject lists, checked.
//
//   node scripts/verify-focus.mjs
//
// The bank cannot be checked against Commons from here (no network in the
// sandbox), so every title was checked by hand through the Commons API when
// it went in; this script guards everything that CAN drift in the repo:
//   1. consecutive ET days, numbered 1..N, quizIds in the focus-M-D-YY shape;
//   2. every answer is a member of its weekday's subject options (a pick from
//      the type-ahead is the only way to guess, so an answer missing from the
//      list is a day that cannot be solved);
//   3. no answer and no Commons title repeats across the bank;
//   4. focal points inside the picture, licences from the allowed set, and
//      an author on every row (it is printed under the reveal);
//   5. subject option lists are unique after folding, so two entries can
//      never collide in the type-ahead;
//   6. THE MATCHER FINDS EVERY ANSWER, from its own name and from the same
//      words in a different order. A reader who knows the answer must never
//      be handed an empty list, which is exactly what shipped: "Starry
//      Starry Night" found nothing on the day the answer was The Starry
//      Night (reader report, 2026-09-02). These cases FAIL against the old
//      substring-only rule and pass against matchOptions.
// Exit code is non-zero on any failure, with ✗ / … prefixes, so verify-all
// picks it up.
import { PUZZLES } from '../app/focus/puzzles.js';
import { SUBJECTS, subjectFor, fold, matchOptions } from '../app/focus/subjects.js';

let fails = 0;
const bad = (m) => { fails++; console.log('✗ ' + m); };
const ok = (m) => console.log('… ' + m);

const LIC = /^(Public domain|CC0|CC BY( |-SA )\d\.\d( IGO)?)$/i;

// 1. shape
let prev = null;
PUZZLES.forEach((p, i) => {
  if (p.num !== i + 1) bad(`num ${p.num} at index ${i}`);
  const d = new Date(`${p.live}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) bad(`bad live date ${p.live}`);
  if (prev && d - prev !== 86400000) bad(`gap before ${p.live}`);
  prev = d;
  const [y, m, day] = p.live.split('-').map(Number);
  const want = `focus-${m}-${day}-${String(y).slice(2)}`;
  if (p.quizId !== want) bad(`quizId ${p.quizId} should be ${want}`);
  if (p.sunday) bad(`#${p.num} marks sunday but Focus has no Sunday Edition`);
});
ok(`${PUZZLES.length} days, ${PUZZLES[0].live} to ${PUZZLES[PUZZLES.length - 1].live}`);

// 2. answers live in their weekday universe
for (const p of PUZZLES) {
  const s = subjectFor(p.live);
  if (!s.options.includes(p.a)) bad(`#${p.num} ${p.live} (${s.label}): answer "${p.a}" is not in the ${s.label} options`);
}
ok('every answer is in its weekday subject list');

// 3. no repeats
const seenA = new Map(), seenT = new Map();
for (const p of PUZZLES) {
  if (seenA.has(p.a)) bad(`answer "${p.a}" repeats (#${seenA.get(p.a)} and #${p.num})`); else seenA.set(p.a, p.num);
  if (seenT.has(p.t)) bad(`title "${p.t}" repeats (#${seenT.get(p.t)} and #${p.num})`); else seenT.set(p.t, p.num);
}
ok('no answer or title repeats');

// 4. focal point, licence, author
for (const p of PUZZLES) {
  if (!(p.fx >= 0.1 && p.fx <= 0.9 && p.fy >= 0.1 && p.fy <= 0.9)) bad(`#${p.num} focal point (${p.fx}, ${p.fy}) is off the picture`);
  if (!LIC.test(p.lic || '')) bad(`#${p.num} licence "${p.lic}" is not in the allowed set`);
  if (!p.by || p.by.length < 3) bad(`#${p.num} has no author for the credit line`);
  if (!/\.(jpe?g|png)$/i.test(p.t)) bad(`#${p.num} title "${p.t}" is not a jpeg or png`);
}
ok('focal points, licences and credits present');

// 4b. NO BLANK OPENING FRAME (2026-10-03). Mount Fuji (#33) shipped with its
// focal point on the snowcap, so frames 1 to 3 were a solid white square
// (mean 253 of 255, deviation 1) and players reported the image as not
// loading. Nothing here can see pixels (no Commons from the sandbox), so the
// pixel check is scripts/audit-focus-frames.js, pasted into a
// commons.wikimedia.org tab. This gate makes that audit unskippable: a row
// above FRAMES_AUDITED_THROUGH has never been looked at, so extending the bank
// fails until the audit is rerun and the constant raised.
const FRAMES_AUDITED_THROUGH = 91;
for (const p of PUZZLES) {
  if (p.num > FRAMES_AUDITED_THROUGH) bad(`#${p.num} has not been through scripts/audit-focus-frames.js (audited through #${FRAMES_AUDITED_THROUGH}); run it, fix any BLANK row, then raise FRAMES_AUDITED_THROUGH`);
}
ok(`frame audit covers #1 to #${FRAMES_AUDITED_THROUGH}`);

// 5. subject lists
if (SUBJECTS.length !== 7) bad(`SUBJECTS has ${SUBJECTS.length} entries, want 7 (one per weekday)`);
for (const s of SUBJECTS) {
  const seen = new Map();
  for (const o of s.options) {
    const f = fold(o);
    if (f.length < 2) bad(`${s.label}: option "${o}" folds to nothing`);
    if (seen.has(f)) bad(`${s.label}: "${o}" and "${seen.get(f)}" collide after folding`); else seen.set(f, o);
  }
  if (s.options.length < 30) bad(`${s.label}: only ${s.options.length} options; the first frame needs a real field`);
}
ok(`7 subjects, ${SUBJECTS.reduce((n, s) => n + s.options.length, 0)} options`);

// 6. the type-ahead reaches every answer
// A reader types the name they know, not the name as filed, so each answer is
// probed three ways: as written, with its words shuffled, and with the last
// word half typed (the list rebuilds on every keystroke). Then the reported
// case verbatim, and a check that a doubled word still finds a name carrying
// one of it, which is the specific thing the old rule could not do.
const shuffle = (str) => {
  const w = fold(str).split(' ');
  return w.length < 2 ? null : [...w.slice(1), w[0]].join(' ');
};
let unreach = 0;
for (const p of PUZZLES) {
  const opts = subjectFor(p.live).options;
  const w = fold(p.a).split(' ');
  const probes = [p.a, [...w.slice(0, -1), w[w.length - 1].slice(0, Math.max(1, w[w.length - 1].length - 2))].join(' ')];
  const sh = shuffle(p.a);
  if (sh) probes.push(sh);
  for (const probe of probes) {
    if (!matchOptions(probe, opts, []).includes(p.a)) { unreach++; bad(`day ${p.num} (${p.a}): typing "${probe}" does not offer it`); }
  }
}
if (!unreach) ok('every answer is reachable from its name, its words reordered, and a half-typed last word');

const REPORTED = [
  ['Starry Starry Night', 'The Starry Night', 'paintings'],
  ['starry night starry', 'The Starry Night', 'paintings'],
  ['night starry', 'The Starry Night', 'paintings'],
  ['great wave kanagawa', 'The Great Wave off Kanagawa', 'paintings'],
  ['bridge golden gate', 'Golden Gate Bridge', 'landmarks'],
  ['tower eiffel', 'Eiffel Tower', 'landmarks'],
];
let repBad = 0;
for (const [typed, want, key] of REPORTED) {
  const s = SUBJECTS.find((x) => x.key === key);
  if (!s) { bad(`no subject keyed ${key}`); repBad++; continue; }
  if (!matchOptions(typed, s.options, []).includes(want)) { bad(`typing "${typed}" should offer ${want}`); repBad++; }
}
// A spent name never comes back, and a query under two characters offers nothing.
const ANIMALS = SUBJECTS.find((s) => s.key === 'animals').options;
if (matchOptions('Toucan', ANIMALS, ['Toucan']).includes('Toucan')) { bad('a name already guessed is still being offered'); repBad++; }
if (matchOptions('t', ANIMALS, []).length) { bad('a one-character query should offer nothing'); repBad++; }
if (!repBad) ok('reported cases resolve; spent names stay out; one character offers nothing');

// weekday map sanity: the launch day is a Wednesday and must land on Paintings
if (subjectFor('2026-09-02').key !== 'paintings') bad('2026-09-02 should map to Paintings (Wednesday)');
if (subjectFor('2026-09-06').key !== 'space') bad('2026-09-06 should map to Space (Sunday)');

console.log(fails ? `✗ verify-focus: ${fails} failure(s)` : '✓ verify-focus: all checks pass');
process.exit(fails ? 1 : 0);
