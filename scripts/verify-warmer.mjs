// STORAGE. A board stores `o`, the ranking packed three base64 characters per
// vocab index (app/warmer/order-codec.js); `p.order` is a lazy decode of it.
// This file checks BOTH ends: that `o` is well formed, that it re-encodes from
// the decoded array byte-for-byte (so the codec is a proven round trip on the
// shipped data on every run, not just on the day it was written), and then
// every rule below against the decoded order. If someone ever "simplifies" the
// bank back to numeric arrays, `next build` gets SIGKILLed again — see the
// codec's header for the measurements.
//
// Verify the Warmer bank: each day's `order` must be a complete permutation of
// the VOCAB index space (every word ranked exactly once), the answer must be
// order[0], ids/dates/labels consistent, sunday flags matching the real
// weekday, and no answer may repeat across the bank. Run after ANY edit (or a
// vocab/order regeneration):
//   node scripts/verify-warmer.mjs
//
// POOL VARIETY, across the whole bank rather than per board (authoring standard
// rule 7). Per-board legality passes happily on a bank that says the same thing
// every day, and for THIS game "the same thing" is a fact about the vectors:
// the frozen bank ran gold and diamond as each other's #2 neighbour, mountain
// and canyon at #2, guitar and piano at #3, and its median board sits 58 ranks
// from its nearest other answer. Every check below is computed from the shipped
// `order` arrays alone — no model, no vectors — so it is independent of
// scripts/gen-warmer.mjs, which is what makes it worth running.
//
// GRANDFATHERED. These checks would fail most of the bank that shipped before
// them, and the past is frozen, so they are scoped to boards live on or after
// VARIETY_FROM and only ever accuse a board on that side of the line.
import { PUZZLES } from '../app/warmer/puzzles.js';
import { VOCAB } from '../app/warmer/vocab.js';
import { encodeOrder } from '../app/warmer/order-codec.js';

const N = VOCAB.length;
// Warmer's Sunday Edition (a rarer secret word) launched on this date.
const SUNDAY_FROM = '2026-07-26';
// A Sunday answer must sit past this vocab rank. Weekday answers have run
// 453-3534, so this is a genuine step down in frequency, not a rounding.
const RARE_FLOOR = 5000;

// Pool-variety rules apply from the first board of the 2026-09-30 extension on.
// Boards before this are live, played and frozen; they are never rewritten and
// never blamed.
const VARIETY_FROM = '2026-09-30';
// An in-scope answer must sit past this rank in another answer's order (and it
// past this rank in the in-scope one's), in both directions.
const SEP_NEW = 150;     // against another in-scope answer
const SEP_FROZEN = 80;   // against a board that predates VARIETY_FROM
// No single answer LENGTH on more than this share of in-scope boards: 18 of
// the 62 the 2026-09-30 extension wrote, held as that SHARE as the scope grows
// (2026-11-22; a flat 18 over an ever-longer scope would cap the bank, not
// the variety).
const LEN_SHARE = 18 / 62;
// US/British spelling folds, for "the hottest word is just the other spelling".
const TWIN = [[/our$/, 'or'], [/re$/, 'er'], [/ise$/, 'ize'], [/isation$/, 'ization'],
  [/yse$/, 'yze'], [/ogue$/, 'og'], [/lling$/, 'ling'], [/lled$/, 'led'], [/ae/, 'e'], [/oe/, 'e']];
const fold = (w) => { let x = w; for (const [re, to] of TWIN) x = x.replace(re, to); return x; };
const spellingTwin = (a, b) => a !== b && fold(a) === fold(b);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

let bad = 0;
const seenAnswer = new Set();
const seenId = new Set();

PUZZLES.forEach((p, i) => {
  const errs = [];
  if (p.num !== i + 1) errs.push(`num ${p.num} != ${i + 1}`);

  const m = (p.quizId || '').match(/^warmer-(\d+)-(\d+)-(\d+)$/);
  if (!m) errs.push('bad quizId');
  else {
    const iso = `20${m[3]}-${String(m[1]).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
    if (iso !== p.live) errs.push(`live ${p.live} != quizId date ${iso}`);
    const [Y, MM, D] = p.live.split('-').map(Number);
    const label = `${MONTHS[MM - 1]} ${D}, ${Y}`;
    if (label !== p.dateLabel) errs.push(`dateLabel "${p.dateLabel}" != "${label}"`);
  }
  if (seenId.has(p.quizId)) errs.push('duplicate quizId');
  seenId.add(p.quizId);

  // The Sunday flag must match the real weekday: a Sunday drop is the Sunday
  // Edition, whose answer is a RARER word. GRANDFATHERED: drops before
  // SUNDAY_FROM are live, played and frozen, so they are never rewritten.
  const isSun = new Date(`${p.live}T12:00:00Z`).getUTCDay() === 0 && p.live >= SUNDAY_FROM;
  if (p.sunday !== isSun) errs.push(`sunday must be ${isSun} for ${p.live}`);
  // The whole point of the edition: the secret word sits deeper in the
  // frequency-ordered vocab than any ordinary day's answer.
  if (isSun && Array.isArray(p.order) && p.order[0] < RARE_FLOOR) {
    errs.push(`Sunday answer "${VOCAB[p.order[0]]}" is vocab rank ${p.order[0]}, not rarer than ${RARE_FLOOR}`);
  }

  // The stored form, before anything trusts the decoded one.
  if (typeof p.o !== 'string') errs.push('stored order `o` missing');
  else if (p.o.length !== 3 * N) errs.push(`stored order is ${p.o.length} chars, expected ${3 * N}`);
  // `order` must still be the codec's view of `o`, not a data property someone
  // pasted back in: a board carrying its own array is the exact regression that
  // re-inflates the bank to 32,300 AST nodes and SIGKILLs `next build`.
  const desc = Object.getOwnPropertyDescriptor(p, 'order');
  if (!desc || typeof desc.get !== 'function') errs.push('`order` is stored data, not decoded from `o` (see order-codec.js)');

  let order = null;
  try { order = p.order; } catch (e) { errs.push(`order will not decode: ${e.message}`); }
  if (order && typeof p.o === 'string' && encodeOrder(order) !== p.o) {
    errs.push('order does not re-encode to the stored string');
  }
  if (!Array.isArray(order)) errs.push('order missing');
  else {
    if (order.length !== N) errs.push(`order length ${order.length} != ${N}`);
    // must be a permutation of 0..N-1: every index present exactly once
    const seen = new Uint8Array(N);
    let dup = 0, oob = 0;
    for (const v of order) {
      if (!Number.isInteger(v) || v < 0 || v >= N) { oob++; continue; }
      if (seen[v]) dup++; else seen[v] = 1;
    }
    if (oob) errs.push(`${oob} out-of-range indices`);
    if (dup) errs.push(`${dup} duplicate indices`);
    let missing = 0; for (let k = 0; k < N; k++) if (!seen[k]) missing++;
    if (missing) errs.push(`${missing} vocab words never ranked`);
  }

  const answer = order && VOCAB[order[0]];
  if (!answer) errs.push('no answer at order[0]');
  else {
    if (seenAnswer.has(answer)) errs.push(`duplicate answer "${answer}"`);
    seenAnswer.add(answer);
  }

  if (errs.length) { bad++; console.error(`✗ ${p.quizId}: ${errs.join('; ')}`); }
  else {
    const hot = order.slice(1, 7).map((j) => VOCAB[j]).join(', ');
    console.log(`✓ ${p.quizId}  answer=${answer}  hot: ${hot}`);
  }
});

// ---------------------------------------------------------------------------
// Pool variety across the whole bank, from VARIETY_FROM on.
// ---------------------------------------------------------------------------
const rankOf = PUZZLES.map((p) => {
  const r = new Int32Array(N);
  for (let i = 0; i < p.order.length; i++) r[p.order[i]] = i;
  return r;
});
const inScope = PUZZLES.map((p) => p.live >= VARIETY_FROM);
const lenCount = new Map();
let vbad = 0;
const vfail = (p, msg) => { vbad++; console.error(`✗ ${p.quizId}: ${msg}`); };

PUZZLES.forEach((p, i) => {
  if (!inScope[i]) return;
  const a = p.order[0], w = VOCAB[a];

  lenCount.set(w.length, (lenCount.get(w.length) || 0) + 1);

  // The hottest words must not be the same word spelled the other way.
  for (const j of p.order.slice(1, 4)) {
    if (spellingTwin(w, VOCAB[j])) vfail(p, `hot word "${VOCAB[j]}" is "${w}" in another spelling`);
  }

  PUZZLES.forEach((q, k) => {
    if (k === i) return;
    const b = q.order[0], v = VOCAB[b];
    // Word family: no answer may contain another, or share a 5-letter prefix
    // with another. Cosine does not catch "joy" next to "enjoy".
    if (w.includes(v) || v.includes(w)) vfail(p, `same word family as ${q.quizId} "${v}"`);
    else if (w.length >= 5 && v.length >= 5 && w.slice(0, 5) === v.slice(0, 5)) {
      vfail(p, `shares a five-letter stem with ${q.quizId} "${v}"`);
    }
    // Semantic separation, in both directions, at the floor that applies.
    const floor = inScope[k] ? SEP_NEW : SEP_FROZEN;
    const near = Math.min(rankOf[i][b], rankOf[k][a]);
    if (near <= floor) vfail(p, `only ${near} ranks from ${q.quizId} "${v}" (floor ${floor})`);
  });
});

const LEN_CAP = Math.ceil(LEN_SHARE * inScope.filter(Boolean).length);
for (const [len, c] of lenCount) {
  if (c > LEN_CAP) { vbad++; console.error(`✗ ${c} answers of length ${len} since ${VARIETY_FROM} (cap ${LEN_CAP})`); }
}
const scoped = inScope.filter(Boolean).length;
if (scoped) {
  console.log(`\nvariety since ${VARIETY_FROM}: ${scoped} boards, ` +
    `lengths ${[...lenCount.entries()].sort((a, b) => a[0] - b[0]).map(([l, c]) => `${l}:${c}`).join(' ')} (cap ${LEN_CAP})`);
}

if (bad || vbad) { console.error(`\n${bad} bad Warmer puzzle(s), ${vbad} variety failure(s)`); process.exit(1); }
console.log(`All ${PUZZLES.length} Warmer puzzles verified (vocab ${N}).`);
