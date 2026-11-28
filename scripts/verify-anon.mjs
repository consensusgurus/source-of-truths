#!/usr/bin/env node
// Verifier for Anon's bank. Discovered by scripts/verify-all.mjs.
//
// Per authoring rule 3 this RECOMPUTES and trusts no stored field: the closed
// count, the forced-word cold start, the cell partition, the spine, the category
// sharpness and the spellings are all re-derived from `q` and `a` alone. The
// stored `closed` and `forced` numbers are then checked AGAINST the recomputed
// ones, so a board whose metadata drifted fails rather than passing on its own
// say-so.
//
// FLOORS (documented here because a rule that is not written down is not a rule):
//
//   partition    every answer's letters sit at its own cells, and the cells of
//                all answers cover 0..n-1 exactly once. This is what makes the
//                two halves the same letters, so it is not negotiable.
//   spine        the first `spine` answers' initials spell `author` exactly.
//   sharpness    a printed category admits at most CAND_CAP words at that
//                length across the whole category lexicon. A looser category is
//                noise printed as help.
//   closed       at least CLOSED_MIN answers carry a category.
//   cold start   at least FORCED_PCT of the passage's words become uniquely
//                determined by the closed answers' letters alone. This is the
//                measure of whether the board can be started at all, and it is
//                the one that must never be relaxed to fit a board.
//   spelling     US forms only.
//   variety      no answer repeated within a board; no answer used more than
//                WORD_CAP times across the bank; no author more than AUTHOR_CAP.
//   sunday       a board flagged sunday lands on a real Sunday and runs longer
//                than the weekday median.
//   ramp         the cold start descends across the week: Monday is the way in,
//                Saturday is the wall. Each weekday carries a BAND rather than a
//                floor, because a floor alone lets every board pile up against
//                it and the ramp flattens (rule 11, a floor is not a target).
//
// Boards live before ANON_FLOOR_FROM are frozen history and skip the floors,
// and boards before ANON_RAMP_FROM skip the band on top of that. Boards from
// ANON_WARM_FROM carry the higher closed floor and the warmer bands.

import { readFileSync } from 'node:fs';
import { PUZZLES } from '../app/anon/puzzles.js';
import { CLOSED } from '../lib/anon-categories.js';

const ANON_FLOOR_FROM = '2026-08-07';
const CAND_CAP = 4;
const CLOSED_MIN = 6;
const FORCED_PCT = 0.32;

// THE WEEKDAY RAMP (owner, 2026-08-08). Difficulty here is the share of the
// passage the closed categories hand over for free, and it descends Mon to Sun.
// The bank was re-dated into these bands the day they were written; nothing
// was re-authored, because the 54 banked boards already spanned 34 to 72% and
// the old 32% floor was the only rule, so warmth landed on the calendar at
// random (one week ran 42/41/40/40/39/39, six of the coldest boards back to
// back, in week three).
//
// SUNDAY has two dials, length and coldness, and it already runs a third longer
// than a weekday. The eight Sundays already banked are a fixed pool spanning 34
// to 65%: a Sunday slot needs a Sunday board, so they can only trade with each
// other, and they are ordered to ramp into place rather than being rewritten.
// From ANON_SUNDAY_HARD_FROM, when boards are authored under this rule rather
// than sorted under it, Sunday takes the week's hardest window outright.
const ANON_RAMP_FROM = '2026-08-09';          // 08-07 and 08-08 are played and frozen
const DOW_NAME = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const BAND = {              // [min, max] share of the passage forced, by weekday
  1: [0.55, 0.78],          // Mon, the way in
  2: [0.50, 0.60],          // Tue
  3: [0.47, 0.56],          // Wed
  4: [0.44, 0.53],          // Thu
  5: [0.39, 0.49],          // Fri
  6: [0.35, 0.45],          // Sat
  0: [0.28, 0.68],          // Sun, wide for the banked eight
};

// THE WARM REBUILD (owner, 2026-08-24). Measured across Aug 7-23: the median
// score among Anon's TOP TEN finishers was 48% of the board, while the top tens
// of Crux, Emcee and Garble were all finishing 100%, and 27% of Anon's
// leaderboard rows were under a quarter of the board. It also drew 208 plays to
// Crux's 1,627, the least-played Word game by a factor of two. That is the top
// of the field, so the field itself was worse.
//
// The cause was the closed pool, not the passages. Only 221 words in
// lib/anon-categories.js were both common enough for the generator to place and
// sharp at their length, so a board seated about 9 categories across 21 answers
// and the other 12 answers had nothing but the passage behind them. The lexicon
// now holds 459 such words across 102 categories, and boards authored from
// 2026-09-30 seat 10 to 14. Nothing about the SHARPNESS promise moved: a printed
// category still admits at most CAND_CAP words at its length, which is the only
// reason printing one helps at all.
//
// SUNDAY IS NO LONGER THE COLDEST DAY. The retired ANON_SUNDAY_HARD_FROM would
// have put Sunday in a 28-38% window from this very date, which is the coldest
// board of the week on the longest passage of the week. Sunday keeps the length
// dial, which is a real step up, and gives up the coldness dial: both at once is
// how a day ends with nobody finishing. Sunday's band now sits around Tuesday's.
const ANON_WARM_FROM = '2026-09-30';
const CLOSED_MIN_WARM = 10;
const BAND_WARM = {         // read off the bank that landed, not written first
  1: [0.66, 0.81],          // Mon, the way in
  2: [0.61, 0.69],          // Tue
  3: [0.56, 0.63],          // Wed
  4: [0.52, 0.59],          // Thu
  5: [0.48, 0.56],          // Fri
  6: [0.42, 0.52],          // Sat, the wall
  0: [0.56, 0.79],          // Sun, long rather than cold
};
// Owner ruling 2026-11-27: raised from 3 to 5 (boards from 2026-12-14 on were
// blocked; 407 words sat at 3 and the open vocabulary had run thin).
const WORD_CAP = 5;
const AUTHOR_CAP = 6;

const BRIT = new Set('colour honour favour labour humour neighbour behaviour odour rumour vapour harbour parlour saviour splendour endeavour centre theatre fibre litre metre calibre sombre spectre defence offence pretence jewellery programme aluminium moustache storey whilst amongst learnt spelt dreamt travelled cancelled plough draught tyre kerb grey'.split(' '));
const BRIT_RE = /(ise|ised|ises|ising|isation|isations|yse|ysed|ysing)$/;

const CATWORDS = {};
for (const [cat, ws] of Object.entries(CLOSED)) CATWORDS[cat] = ws.split(' ');
function catCandidates(cat, n) {
  return (CATWORDS[cat] || []).filter((w) => w.length === n);
}

// The dictionary the cold-start measure reads against: same common-word list the
// generator used, shipped alongside so the check is reproducible.
const COMMON = new Set(
  readFileSync(new URL('../lib/anon-common.txt', import.meta.url), 'utf8').split('\n').map((s) => s.trim()).filter(Boolean)
);

let fails = 0;
const err = (p, msg) => { fails++; console.error(`  ✗ #${p.num} ${p.live} (${p.author}): ${msg}`); };

function letters(s) { return [...s].filter((c) => /[a-z]/i.test(c)).map((c) => c.toLowerCase()); }

function forcedWords(p, known) {
  const words = p.q.split(' ').map((w) => w.replace(/[^a-zA-Z]/g, '').toLowerCase());
  let k = 0, forced = 0;
  for (const w of words) {
    const idx = [];
    for (let i = 0; i < w.length; i++) if (known.has(k + i)) idx.push(i);
    k += w.length;
    if (!idx.length || !COMMON.has(w)) continue;
    let c = 0;
    for (const x of COMMON) {
      if (x.length !== w.length) continue;
      if (idx.every((i) => x[i] === w[i])) { c++; if (c > 1) break; }
    }
    if (c === 1) forced++;
  }
  return { forced, total: words.length };
}

const wordUse = new Map();
const authorUse = new Map();
const weekdayLens = PUZZLES.filter((p) => !p.sunday).map((p) => p.a.length).sort((a, b) => a - b);
const medianWeekday = weekdayLens[Math.floor(weekdayLens.length / 2)] || 0;

for (const p of PUZZLES) {
  const qs = letters(p.q);
  const n = qs.length;

  // --- partition, recomputed ---
  const seen = new Array(n).fill(0);
  for (const a of p.a) {
    if (a.c.length !== a.w.length) err(p, `${a.w} has ${a.c.length} cells for ${a.w.length} letters`);
    a.c.forEach((cell, i) => {
      if (cell < 0 || cell >= n) return err(p, `${a.w} points at cell ${cell}, outside 0..${n - 1}`);
      seen[cell]++;
      if (qs[cell] !== a.w[i].toLowerCase()) err(p, `${a.w}[${i}] is '${a.w[i]}' but cell ${cell} is '${qs[cell]}'`);
    });
  }
  const uncovered = seen.filter((x) => x !== 1).length;
  if (uncovered) err(p, `${uncovered} cells are not covered exactly once`);

  // --- spine ---
  const spelled = p.a.slice(0, p.spine).map((a) => a.w[0]).join('');
  const want = p.author.replace(/[^A-Z]/g, '');
  if (spelled !== want) err(p, `spine spells ${spelled}, not ${want}`);

  // --- answers, categories, spelling ---
  const lower = p.a.map((a) => a.w.toLowerCase());
  if (new Set(lower).size !== lower.length) err(p, 'an answer is repeated on the board');
  for (const w of lower) {
    if (BRIT.has(w) || BRIT_RE.test(w)) err(p, `${w.toUpperCase()} is a British spelling`);
    wordUse.set(w, (wordUse.get(w) || 0) + 1);
  }
  authorUse.set(p.author, (authorUse.get(p.author) || 0) + 1);

  const closed = p.a.filter((a) => a.cat);
  for (const a of closed) {
    const cands = catCandidates(a.cat, a.w.length);
    if (!CATWORDS[a.cat]) err(p, `${a.w} claims category '${a.cat}', which does not exist`);
    else if (!cands.includes(a.w.toLowerCase())) err(p, `${a.w} is not in category '${a.cat}'`);
    else if (cands.length > CAND_CAP) err(p, `'${a.cat}, ${a.w.length}' admits ${cands.length} words, over the cap of ${CAND_CAP}`);
  }

  if (p.live < ANON_FLOOR_FROM) continue;   // frozen history

  const closedFloor = p.live >= ANON_WARM_FROM ? CLOSED_MIN_WARM : CLOSED_MIN;
  if (closed.length < closedFloor) err(p, `${closed.length} closed answers, floor is ${closedFloor}`);
  if (closed.length !== p.closed) err(p, `stored closed=${p.closed}, recomputed ${closed.length}`);

  // --- cold start, recomputed ---
  const known = new Set();
  for (const a of closed) a.c.forEach((c) => known.add(c));
  const { forced, total } = forcedWords(p, known);
  if (forced !== p.forced) err(p, `stored forced=${p.forced}, recomputed ${forced}`);
  if (forced < Math.round(FORCED_PCT * total)) {
    err(p, `cold start ${forced}/${total} = ${Math.round(100 * forced / total)}%, floor is ${Math.round(FORCED_PCT * 100)}%`);
  }

  // --- sunday ---
  const dow = new Date(`${p.live}T12:00:00Z`).getUTCDay();
  if (p.sunday && dow !== 0) err(p, 'flagged sunday but is not a Sunday');
  if (!p.sunday && dow === 0) err(p, 'falls on a Sunday but carries no Sunday Edition');
  if (p.sunday && p.a.length <= medianWeekday) err(p, `Sunday runs ${p.a.length} answers, no bigger than the weekday median ${medianWeekday}`);

  // --- the weekday ramp ---
  if (p.live >= ANON_RAMP_FROM) {
    const [lo, hi] = p.live >= ANON_WARM_FROM ? BAND_WARM[dow] : BAND[dow];
    const share = forced / total;
    if (share < lo || share > hi) {
      err(p, `${DOW_NAME[dow]} cold start ${Math.round(100 * share)}%, band is ${Math.round(100 * lo)}-${Math.round(100 * hi)}%`);
    }
  }
}

for (const [w, k] of wordUse) if (k > WORD_CAP) { fails++; console.error(`  ✗ answer ${w.toUpperCase()} used ${k} times, cap is ${WORD_CAP}`); }
for (const [a, k] of authorUse) if (k > AUTHOR_CAP) { fails++; console.error(`  ✗ author ${a} used ${k} times, cap is ${AUTHOR_CAP}`); }

const dates = PUZZLES.map((p) => p.live);
if (new Set(dates).size !== dates.length) { fails++; console.error('  ✗ two boards share a live date'); }
if (dates.some((d, i) => i && d <= dates[i - 1])) { fails++; console.error('  ✗ live dates are not strictly ascending'); }

if (fails) {
  console.error(`anon: ${fails} problem${fails === 1 ? '' : 's'} across ${PUZZLES.length} boards`);
  process.exit(1);
}
console.log(`anon: ${PUZZLES.length} boards OK (${PUZZLES.filter((p) => p.sunday).length} Sunday Editions)`);
