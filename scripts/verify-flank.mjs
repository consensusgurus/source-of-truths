// Structural gate for the Flank bank and dataset. Run after every authoring
// pass and before every push that touches app/flank:
//
//   node scripts/verify-flank.mjs
//
// Everything here RECOMPUTES from app/flank/borders.js rather than trusting a
// stored field: each day's answer set is re-derived from the dataset, the
// dataset itself is checked for symmetry and dangling codes, and the typing
// matcher is audited with the same normGuess/prefix rules the client uses
// (imported, not restated), so an alias that could bank or strike the wrong
// country while a player types through it fails the run.
//
// Rules enforced (see the schedule in scripts/gen-flank.mjs):
//   - weekday bands by neighbor count: Mon 1-2, Tue 2-3, Wed 3-4, Thu 4-5,
//     Fri 5-6, Sat 6-7, Sun >= 8 (the Sunday Edition giant, sunday: true)
//   - no weekday country repeats; a Sunday giant may return from 2026-11-01
//     once 63 days have passed since its last Sunday; noSubject entities never a
//     day's country; Peru (PE) never a day's country (it is the share card)
//   - dates consecutive, quizId 'flank-M-D-YY' derived from the live date,
//     dateLabel matches, num is 1..N in order
//   - a WARNING inside the last 14 days of runway, a FAILURE past the end
import { BORDERS, buildAliasMap, buildPrefixAmbiguous, normGuess } from '../app/flank/borders.js';
import { PUZZLES } from '../app/flank/puzzles.js';

const errs = [];
const warns = [];
const fail = (m) => errs.push(m);
const warn = (m) => warns.push(m);

// ---- dataset ---------------------------------------------------------------
const codes = Object.keys(BORDERS);
for (const c of codes) {
  const e = BORDERS[c];
  if (!e.name || typeof e.name !== 'string') fail(`${c}: no display name`);
  if (!Array.isArray(e.n)) fail(`${c}: no neighbor array`);
  for (const b of e.n) {
    if (!BORDERS[b]) fail(`${c}: dangling neighbor code ${b}`);
    else if (!BORDERS[b].n.includes(c)) fail(`asymmetric border: ${c} -> ${b} but not ${b} -> ${c}`);
  }
  if (new Set(e.n).size !== e.n.length) fail(`${c}: duplicate neighbor`);
  if (e.n.includes(c)) fail(`${c}: borders itself`);
}

// ---- typing matcher audit --------------------------------------------------
// The client auto-commits any complete alias that is not a proper prefix of a
// DIFFERENT entity's alias. Re-derive that set here and assert that typing any
// alias character by character can never commit a different entity mid-word.
const ALIAS = buildAliasMap();
const AMBIG = buildPrefixAmbiguous(ALIAS);
for (const [code, e] of Object.entries(BORDERS)) {
  for (const a of [e.name, ...(e.alt || [])]) {
    const n = normGuess(a);
    if (!n) fail(`${code}: alias "${a}" normalizes to nothing`);
    if (ALIAS.get(n) !== code) fail(`${code}: alias "${a}" resolves to ${ALIAS.get(n)} (collision across entities)`);
  }
}
const keys = [...ALIAS.keys()];
for (const long of keys) {
  for (let cut = 1; cut < long.length; cut++) {
    const p = long.slice(0, cut);
    if (!ALIAS.has(p) || p === long) continue;
    if (ALIAS.get(p) !== ALIAS.get(long) && !AMBIG.has(p)) {
      fail(`typing "${long}" passes through "${p}", which auto-commits ${ALIAS.get(p)} — must be in the prefix-ambiguous set`);
    }
  }
}

// ---- the bank --------------------------------------------------------------
const BAND = { 1: [1, 2], 2: [2, 3], 3: [3, 4], 4: [4, 5], 5: [5, 6], 6: [6, 7], 0: [8, 99] };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const seen = new Map();
const GIANT_REPEAT_FROM = '2026-11-01', GIANT_GAP = 63;
let prev = null;
PUZZLES.forEach((p, i) => {
  const id = `day ${p.num} (${p.live})`;
  if (p.num !== i + 1) fail(`${id}: num out of sequence`);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(p.live);
  if (!m) { fail(`${id}: bad live date`); return; }
  const [, y, mo, dy] = m.map(Number);
  const d = new Date(Date.UTC(y, mo - 1, dy));
  if (prev != null && d - prev !== 86400000) fail(`${id}: not consecutive with the previous day`);
  prev = d;
  const dow = d.getUTCDay();
  if (p.quizId !== `flank-${mo}-${dy}-${String(y).slice(2)}`) fail(`${id}: quizId ${p.quizId} does not match the live date`);
  if (p.dateLabel !== `${MONTHS[mo - 1]} ${dy}, ${y}`) fail(`${id}: dateLabel mismatch`);
  if (!!p.sunday !== (dow === 0)) fail(`${id}: sunday flag disagrees with the calendar`);
  const e = BORDERS[p.c];
  if (!e) { fail(`${id}: unknown country code ${p.c}`); return; }
  if (e.noSubject) fail(`${id}: ${e.name} is noSubject and may not be a day's country`);
  if (p.c === 'PE') fail(`${id}: Peru is reserved for the share-card demo board`);
  // Sunday giants may return from GIANT_REPEAT_FROM after GIANT_GAP days
  // (the nine-country pool ran out 2026-10-25); weekday countries never repeat.
  const prevSeen = seen.get(p.c);
  if (prevSeen) {
    const ok = dow === 0 && p.live >= GIANT_REPEAT_FROM && prevSeen.sunday && (d - prevSeen.d) / 86400000 >= GIANT_GAP;
    if (!ok) fail(`${id}: ${e.name} repeats within the bank`);
  }
  seen.set(p.c, { d, sunday: dow === 0 });
  const expect = [...e.n].sort((a, b) => BORDERS[a].name.localeCompare(BORDERS[b].name));
  if (JSON.stringify(p.a) !== JSON.stringify(expect)) fail(`${id}: answer set does not recompute from the dataset for ${e.name}`);
  const n = e.n.length;
  const [lo, hi] = BAND[dow];
  if (n < lo || n > hi) fail(`${id}: ${e.name} has ${n} neighbors, outside the ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow]} band ${lo}-${hi}`);
  for (const s of [p.dateLabel, e.name]) if (String(s).includes('—')) fail(`${id}: em dash in reader-facing text`);
});

// ---- runway ----------------------------------------------------------------
const today = (() => {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
})();
const last = PUZZLES[PUZZLES.length - 1].live;
if (last < today) fail(`bank is EXHAUSTED: last day ${last} is in the past`);
else {
  const daysLeft = Math.round((new Date(last) - new Date(today)) / 86400000);
  if (daysLeft < 14) warn(`… bank runway is ${daysLeft} days (last day ${last}) — extend the schedule in gen-flank.mjs`);
}

// ---- report ----------------------------------------------------------------
for (const w of warns) console.log(w);
if (errs.length) {
  for (const e of errs) console.log(`✗ ${e}`);
  console.log(`flank: ${errs.length} failure(s)`);
  process.exit(1);
}
console.log(`flank: ${PUZZLES.length} days ok (${PUZZLES[0].live} .. ${last}), ${PUZZLES.filter((p) => p.sunday).length} Sundays, ${codes.length} entities, ${ALIAS.size} aliases, prefix-ambiguous: ${[...AMBIG].sort().join(', ')}`);
