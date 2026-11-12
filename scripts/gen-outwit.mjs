#!/usr/bin/env node
// Build new Outwit boards. Deterministic: same flags in, byte-identical boards out.
//
//   node scripts/gen-outwit.mjs --from 2026-09-30 --days 62 --startnum 76 \
//        --avoid app/outwit/puzzles.js --out /tmp/outwit-new.js --seed 20260930
//
// or, the house one-liner that splices without ever touching a frozen board:
//
//   node scripts/_append.mjs outwit gen-outwit.mjs 2026-11-30
//
// WHAT IT BUILDS. One board per day: five prompts on a weekday (least, herd,
// match, unique, twothirds — Undercut LAST) and six on a Sunday (a second
// unique before the Undercut). Copy, options and the true answers come from
// scripts/outwit-prompts.mjs; this file decides which prompt lands on which day
// and turns each authored ranking into a 48-vote `house` crowd.
//
// ══════════════════════════════════════════════════════════════════════════════
// WHERE THE NUMBERS COME FROM. READ THIS BEFORE CHANGING A WEIGHT.
// ══════════════════════════════════════════════════════════════════════════════
// The `house` array on every prompt is an AUTHORED ESTIMATE OF CROWD BEHAVIOR.
// It is not observed play, it has never been observed play, and nothing in the
// pipeline turns it into observed play. Concretely:
//
//   * the author writes each option list in the order they believe a broad
//     audience would pick them, most-popular first (scripts/outwit-prompts.mjs);
//   * this generator lays one of a handful of fixed VOTE LADDERS over that
//     ranking — 48 votes split, say, 21/14/9/4 — and shuffles the resulting
//     stream of option indices;
//   * for the two numeric prompts it builds a distribution from an authored
//     center and spread the same way.
//
// So a house array is a guess with a shape, dressed as 48 ballots. That is a
// legitimate thing for this game to ship: `house` exists only to give the first
// player of the day a plausible field to be scored against, and lib/outwit-score
// retires it pool-wide the moment an eleventh real player arrives (HOUSE_CUTOFF).
// What would NOT be legitimate is presenting it as measurement, so the puzzle
// file's header says the same thing this comment does. If someone later seeds a
// board from real `outwit_picks` rows, that board should say so and this note
// should stop covering it.
//
// The one thing the numbers are checked against is the AUTHORED RANKING: the
// generator asserts that after apportionment the crowd it emitted still has the
// favorite, the runner-up and the tail the author claimed, in that order.
//
// ══════════════════════════════════════════════════════════════════════════════
// THE DESIGN QUESTION THIS GENERATOR EXISTS TO ANSWER
// ══════════════════════════════════════════════════════════════════════════════
// A prompt with no right answer still has to have a FINDABLE crowd answer.
// "Name a color" works because most people say red or blue. A prompt where the
// crowd splits evenly is a bad board: the player cannot beat chance and the game
// stops paying for insight. A prompt with one overwhelming answer is a gimme.
// Both failures are measurable in the house distribution, so both are enforced
// here as bands rather than left to taste (see LADDERS and the band assertions):
//
//   Meeting Point (match)   favorite 15-24 votes of 48 (31-50%), at least 4
//                           clear of the runner-up, runner-up >= 10, third >= 7.
//                           A 60% favorite is a gimme; a 4-vote gap is a race.
//   Road Less Traveled      the answer (rarest) 4-8 votes, at least 3 clear of
//                           the next-rarest, favorite <= 22. Never 0 votes: a
//                           zero-vote option is INELIGIBLE to win in
//                           lib/outwit-score, so it is a trap, not an answer.
//   Rare Bird (unique)      scoring pays 2 for the two rarest picks, so the two
//                           tail options sit at 2-4 votes and the third-rarest is
//                           at least 2 clear of them. Favorite <= 12 (25%): this
//                           prompt is meant to be a flat field with a findable
//                           tail, not a second Meeting Point.
//   Herd                    the crowd's median is exactly the authored center,
//                           no single guess holds more than 40% of the pool, and
//                           at least eight distinct guesses appear. On 26 of the
//                           62 boards the center is deliberately NOT the true
//                           answer, because the gap is the reveal.
//   THE SUNDAY RAMP         a Sunday board runs SIX prompts (a second Rare Bird,
//                           tagged "Rarer Bird", on its own theme rather than the
//                           canned narrowing every frozen Sunday from 2026-08-16
//                           shipped) AND a crowd that is harder to read: every
//                           choice prompt drops one step down the ladder families
//                           (steep -> mid, mid -> flat), so the favorite sits
//                           closer to the pack. verify-daily-banks re-derives
//                           that as a cap on the Sunday favorite.
//   Undercut (twothirds)    the pool mean tracks 22 + 26*frac (fitted to the
//                           frozen bank's own crowd so the game does not lurch),
//                           spread over 12+ distinct picks with real anchors at
//                           0, 50 and 100 the way an actual crowd answers.
//
// ══════════════════════════════════════════════════════════════════════════════
// POOL VARIETY CEILINGS (the whole-bank rule, CLAUDE.md "Extending a puzzle bank
// in bulk" #3). Per-board legality passes happily on a bank that says the same
// thing every day. Enforced here, re-checked independently in
// scripts/verify-daily-banks.mjs:
//
//   * no prompt text may repeat one ALREADY IN THE BANK, or another new one.
//     (The Undercut is exempt: it is the same prompt every day by design, with
//     the day's fraction swapped in.)
//   * a category (food, animals, travel, ...) may fill at most 8 of the 62 new
//     boards in any one prompt slot — about 13% — and may not run two days
//     running in the same slot.
//   * no two prompts on the SAME board may share a category, so no day is
//     "food day".
//   * a Meeting Point favorite may head at most 2 boards in the segment, and
//     never one that already heads 2 frozen boards (Monopoly heads three).
//   * an option string may appear in at most 5 prompts across the segment.
//   * one house count vector (21/14/9/4 and so on) may shape at most 12 of the
//     62 boards in a slot, so the reveal's bar chart is not the same picture
//     every day.
//   * the Undercut fraction never repeats on back-to-back days (owner rule,
//     2026-07-20) and, tighter than the rule, never inside three days; each of
//     the eight fractions runs 6-9 times over the segment.
//
// ══════════════════════════════════════════════════════════════════════════════
// WHAT THE FROZEN BANK TAUGHT ME, so the next person does not re-derive it:
//
//   * house SIZE drifted. The file header and CLAUDE-QUIZZES both say ~48
//     answers per prompt; boards 1-16 carry 48 and boards 17-75 (the last bulk
//     extension) carry 24. The verifier only ever required 8, so nothing caught
//     it. New boards carry 48, the documented number.
//   * boards 17+ were authored British: "colour", "theatre", "programme",
//     "centimetres", "decimalisation", plus Munros, crumpets, shillings and
//     Cluedo. That is against the standing US-spellings rule (authoring standard
//     #8) and against culture-broad copy. New boards are US-spelled and avoid
//     one-country schooling; the frozen ones are history and stay as they are.
//   * every Sunday from 2026-08-16 on shipped its second Rare Bird as "Narrow it
//     down. Of these, the RAREST pick wins." over the FIRST prompt's own top
//     four options — seven identical prompts. Sundays here get a real second
//     theme, the way the first three Sunday Editions did.
//   * board #3 (2026-07-19) is a Sunday with sunday:false and five prompts. That
//     is not a defect: Outwit's Sunday Edition started 2026-07-26 (CLAUDE.md).
//     Any Sunday check must start there.
//
// SEEDING. --seed is offset by the starting board number before use, so a
// segment banked at num 76 cannot replay the stream that produced num 1.
import fs from 'node:fs';
import { LEAST as LEAST_ALL, MATCH as MATCH_ALL, UNIQUE as UNIQUE_ALL, HERD as HERD_ALL, CATS } from './outwit-prompts.mjs';
import { nearRepeat } from './crowd-near-repeat.mjs';

// ─────────────────────────── args ────────────────────────────────────────────
// Accepts both house spellings: --days=62 and --days 62 (scripts/_append.mjs
// passes the second form).
const argv = process.argv.slice(2);
const args = {};
for (let i = 0; i < argv.length; i++) {
  const s = argv[i];
  if (!s.startsWith('--')) continue;
  const eq = s.indexOf('=');
  if (eq !== -1) args[s.slice(2, eq)] = s.slice(eq + 1);
  else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) args[s.slice(2)] = argv[++i];
  else args[s.slice(2)] = true;
}
const FROM = String(args.from || '2026-09-30');
const DAYS = +(args.days || 62);
const STARTNUM = +(args.startnum || 76);
const OUT = args.out || null;
const AVOID = args.avoid ? String(args.avoid).split(',') : [];
// HARD RULE: offset the seed by the starting board number so a new segment can
// never replay the frozen one.
const SEED0 = (+(args.seed || 20260930) ^ Math.imul(STARTNUM, 2654435761)) >>> 0;

// ─────────────────────────── deterministic rng ───────────────────────────────
let SEED = SEED0 | 0;
const rng = () => { SEED |= 0; SEED = (SEED + 0x6D2B79F5) | 0; let t = Math.imul(SEED ^ (SEED >>> 15), 1 | SEED); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ri = (n) => Math.floor(rng() * n);
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };

// ─────────────────────────── constants ───────────────────────────────────────
const POOL = 48;                       // house votes per prompt (the documented size)
const SUNDAY_FROM = '2026-07-26';      // Outwit's Sunday Edition start (CLAUDE.md)
// CAT_CEIL and VEC_CEIL were written for a 62-day segment; a segment of another
// length scales them as a rate, rounded up (SEG_DAYS; see SEGMENTS below).
const SEG_DAYS = 62;
const CAT_CEIL = Math.max(1, Math.ceil(8 * DAYS / SEG_DAYS));   // max boards one category may fill in one slot
const MODAL_CEIL = 2;                  // max boards one Meeting Point favorite may head
const OPT_CEIL = 5;                    // max prompts one option string may appear in
const VEC_CEIL = Math.max(1, Math.ceil(12 * DAYS / SEG_DAYS)); // max boards one house count vector may shape, per slot
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const HERD_TAIL = " Closest to the crowd's MEDIAN guess wins, right or wrong.";
const FRACS = [
  { v: 1 / 3, label: 'a third', word: 'A THIRD' },
  { v: 2 / 5, label: 'two-fifths', word: 'TWO-FIFTHS' },
  { v: 1 / 2, label: 'half', word: 'HALF' },
  { v: 3 / 5, label: 'three-fifths', word: 'THREE-FIFTHS' },
  { v: 2 / 3, label: 'two-thirds', word: 'TWO-THIRDS' },
  { v: 7 / 10, label: 'seven-tenths', word: 'SEVEN-TENTHS' },
  { v: 3 / 4, label: 'three-quarters', word: 'THREE-QUARTERS' },
  { v: 4 / 5, label: 'four-fifths', word: 'FOUR-FIFTHS' },
];

// ─────────────────────────── vote ladders ────────────────────────────────────
// Votes out of POOL, written favorite-first. Two ladders per family so a bank
// cannot be read off its count vector. Every ladder is asserted against the
// band for its prompt type at startup, so a bad edit fails loudly and at once.
const LADDERS = {
  match4: { steep: [[23, 12, 8, 5], [22, 13, 8, 5], [24, 12, 7, 5]], mid: [[20, 13, 9, 6], [19, 14, 9, 6], [20, 14, 8, 6]], flat: [[17, 12, 11, 8], [16, 12, 11, 9], [17, 13, 10, 8]] },
  match5: { steep: [[22, 11, 7, 5, 3], [21, 11, 8, 5, 3], [23, 10, 7, 5, 3]], mid: [[19, 12, 8, 6, 3], [18, 12, 9, 6, 3], [19, 13, 8, 5, 3]], flat: [[16, 11, 10, 7, 4], [16, 12, 9, 7, 4], [15, 11, 10, 8, 4]] },
  least4: { steep: [[21, 14, 9, 4], [22, 13, 9, 4], [21, 15, 8, 4]], mid: [[19, 14, 10, 5], [18, 15, 10, 5], [19, 15, 9, 5]], flat: [[17, 14, 11, 6], [16, 15, 11, 6], [17, 15, 10, 6]] },
  unique8: {
    steep: [[12, 9, 7, 6, 5, 5, 2, 2], [11, 8, 7, 6, 5, 5, 3, 3], [12, 8, 8, 6, 6, 4, 2, 2]],
    mid: [[10, 8, 7, 6, 6, 5, 3, 3], [10, 9, 7, 6, 6, 5, 3, 2], [11, 8, 7, 6, 6, 5, 3, 2], [9, 9, 8, 6, 6, 5, 3, 2]],
    flat: [[9, 8, 7, 7, 6, 6, 3, 2], [9, 8, 8, 7, 6, 6, 2, 2], [9, 9, 7, 7, 6, 5, 3, 2]],
  },
};
const FAMILY = ['steep', 'mid', 'flat'];
const flatter = (f) => FAMILY[Math.min(2, FAMILY.indexOf(f) + 1)];

// Band checks. These are the quality bar, expressed on the emitted counts and
// nothing else, so the same function can (and does) run in the verifier.
function bandErrors(type, counts) {
  const errs = [];
  const asc = [...counts].sort((a, b) => a - b);
  const desc = [...counts].sort((a, b) => b - a);
  const n = counts.reduce((a, b) => a + b, 0);
  if (n !== POOL) errs.push(`votes ${n} != ${POOL}`);
  if (asc[0] < 1) errs.push('an option nobody picked (ineligible to win)');
  if (type === 'match') {
    if (desc[0] < 15 || desc[0] > 24) errs.push(`favorite ${desc[0]} outside 15-24`);
    if (desc[0] - desc[1] < 4) errs.push(`favorite only ${desc[0] - desc[1]} clear of the runner-up`);
    if (desc[1] < 10) errs.push(`runner-up ${desc[1]} < 10`);
    if (desc[2] < 7) errs.push(`third place ${desc[2]} < 7`);
  } else if (type === 'least') {
    if (asc[0] < 4 || asc[0] > 8) errs.push(`rarest ${asc[0]} outside 4-8`);
    if (asc[1] - asc[0] < 3) errs.push(`rarest only ${asc[1] - asc[0]} clear of the next`);
    if (desc[0] > 22) errs.push(`favorite ${desc[0]} > 22`);
  } else if (type === 'unique') {
    if (asc[0] < 2) errs.push(`rarest ${asc[0]} < 2`);
    if (asc[1] > 4) errs.push(`second-rarest ${asc[1]} > 4 (no findable tail)`);
    if (asc[2] - asc[1] < 2) errs.push(`third-rarest only ${asc[2] - asc[1]} clear of the winning tier`);
    if (desc[0] > 12) errs.push(`favorite ${desc[0]} > 12 (that is a Meeting Point)`);
  }
  return errs;
}
for (const [key, fams] of Object.entries(LADDERS)) {
  const type = key.startsWith('match') ? 'match' : key.startsWith('least') ? 'least' : 'unique';
  for (const [fam, list] of Object.entries(fams)) for (const l of list) {
    const e = bandErrors(type, l);
    if (e.length) { console.error(`ladder ${key}.${fam} [${l}] : ${e.join('; ')}`); process.exit(1); }
  }
}

// ─────────────────────────── crowd builders ──────────────────────────────────
// A ranked option list plus a ladder becomes a shuffled stream of DISPLAY
// indices. The display order is shuffled too, so the answer is never in a fixed
// slot — the frozen bank's own boards shuffle, and a generator that stopped
// doing it would hand every player a positional tell.
function choiceCrowd(rankedOptions, ladder) {
  const K = rankedOptions.length;
  const order = shuffle(rankedOptions.map((_, i) => i));   // rank -> display slot
  const options = new Array(K);
  order.forEach((slot, rank) => { options[slot] = rankedOptions[rank]; });
  const counts = new Array(K).fill(0);
  order.forEach((slot, rank) => { counts[slot] = ladder[rank]; });
  const stream = [];
  counts.forEach((c, i) => { for (let j = 0; j < c; j++) stream.push(i); });
  return { options, counts, house: shuffle(stream) };
}

// Round a guess the way people actually say numbers: nobody guesses 4,873.
const humanize = (v) => {
  const a = Math.abs(v);
  if (a < 20) return Math.round(v);
  if (a < 100) return Math.round(v / 5) * 5;
  if (a < 1000) return Math.round(v / 10) * 10;
  const mag = Math.pow(10, Math.floor(Math.log10(a)) - 1);
  return Math.round(v / mag) * mag;
};
// Two ladder shapes, because one does not fit both scales. A crowd guessing
// "how many wings does a bee have" answers 2, 4, 6 — small whole numbers a step
// apart — while a crowd guessing "how many hairs on a head" answers 50,000 and
// 200,000, an order of magnitude apart. Multiplying a center of 2 by 0.9 and 1.1
// produces the same integer three times, which is exactly how the first run of
// this generator emitted a "distribution" of forty-eight identical guesses. So
// centers under 60 fan out ADDITIVELY on a step scaled to the center, and larger
// centers fan out MULTIPLICATIVELY.
const SMALL = 60;
const SPREADS_MUL = {
  tight: [0.85, 0.9, 0.95, 1, 1.05, 1.1, 1.2],
  mid: [0.5, 0.65, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 2],
  wide: [0.2, 0.35, 0.5, 0.7, 0.85, 1, 1.2, 1.5, 2.2, 3.5, 6],
};
const SPREADS_ADD = {
  tight: [-3, -2, -1, 0, 1, 2, 3, 4],
  mid: [-3, -2, -1, 0, 1, 2, 3, 4, 6],
  wide: [-4, -3, -2, -1, 0, 2, 4, 6, 10, 15],
};
// The Herd crowd: a hump on the authored center with a tail on the authored
// side. Weight falls off with distance from the center in RANK, then the pool
// is repaired until the median is exactly the center — the median is what the
// prompt is scored against, so it is asserted, never hoped for.
function herdCrowd(e) {
  const small = e.c0 < SMALL;
  const step = Math.max(1, Math.round(e.c0 / 8));
  const mult = small ? SPREADS_ADD[e.sp] : SPREADS_MUL[e.sp];
  const ctr = small ? mult.indexOf(0) : mult.indexOf(1);
  const buckets = new Map();
  mult.forEach((m, i) => {
    const d = Math.abs(i - ctr);
    let w = [10, 7, 5, 3, 2, 1, 1][Math.min(6, d)];
    if (e.sk > 0 && i > ctr) w += 2;
    if (e.sk > 0 && i < ctr) w = Math.max(1, w - 1);
    if (e.sk < 0 && i < ctr) w += 2;
    if (e.sk < 0 && i > ctr) w = Math.max(1, w - 1);
    const raw = small ? e.c0 + m * step : humanize(e.c0 * m);
    const v = Math.min(e.max, Math.max(e.min, i === ctr ? e.c0 : raw));
    buckets.set(v, (buckets.get(v) || 0) + w);
  });
  const vals = [...buckets.keys()].sort((a, b) => a - b);
  const counts = apportion(vals.map((v) => buckets.get(v)), POOL);
  // repair to put the median exactly on the center
  const ci = vals.indexOf(e.c0);
  const half = POOL / 2;
  const sumBelow = () => counts.slice(0, ci).reduce((a, b) => a + b, 0);
  const sumAbove = () => counts.slice(ci + 1).reduce((a, b) => a + b, 0);
  const trim = (from, to) => {
    for (let i = from; i !== to; i += from < to ? 1 : -1) {
      if (counts[i] > 1) { counts[i]--; counts[ci]++; return true; }
    }
    return false;
  };
  let guard = 0;
  while (sumBelow() > half - 1 && guard++ < 200) if (!trim(0, ci)) break;
  while (sumAbove() > half - 1 && guard++ < 200) if (!trim(counts.length - 1, ci)) break;
  const stream = [];
  vals.forEach((v, i) => { for (let j = 0; j < counts[i]; j++) stream.push(v); });
  return { house: shuffle(stream), vals, counts };
}

// The Undercut crowd: three levels of reasoning plus the anchors a real crowd
// always leaves at 0, 50 and 100. Level weights are solved (a one-knob search)
// so the pool mean tracks the frozen bank's own mean-by-fraction line, since the
// day-to-day feel of the game should not jump at board 76.
const UNDERCUT_ANCHORS = [0, 7, 25, 33, 42, 50, 75, 100];
const meanTarget = (f) => 22 + 26 * f;
function undercutCrowd(frac) {
  const jitter = [0, 2, -2, 4, -4, 6, -6, 8, -8, 3, -3, 5, -5, 1, -1, 7, -7, 9, -9, 10, -10];
  const build = (w0, w1, w2) => {
    const vals = [];
    const push = (center, w) => { for (let i = 0; i < w; i++) vals.push(Math.min(100, Math.max(0, Math.round(center + jitter[i % jitter.length])))); };
    push(50, w0);
    push(Math.round(50 * frac), w1);
    push(Math.round(50 * frac * frac), w2);
    for (const a of UNDERCUT_ANCHORS) vals.push(a);
    return vals;
  };
  const free = POOL - UNDERCUT_ANCHORS.length;   // 40 votes across three levels
  let best = null;
  for (let w0 = 4; w0 <= free - 8; w0++) {
    const w1 = 18, w2 = free - w0 - w1;
    if (w2 < 2) continue;
    const vals = build(w0, w1, w2);
    const m = vals.reduce((a, b) => a + b, 0) / vals.length;
    const err = Math.abs(m - meanTarget(frac));
    if (!best || err < best.err) best = { err, vals, m, w0, w1, w2 };
  }
  return { house: shuffle(best.vals), mean: best.m, err: best.err, w: [best.w0, best.w1, best.w2] };
}

// Largest-remainder apportionment: weights -> exactly `total` whole votes.
function apportion(weights, total) {
  const s = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (w / s) * total);
  const out = raw.map((x) => Math.floor(x));
  let left = total - out.reduce((a, b) => a + b, 0);
  const order = raw.map((x, i) => ({ r: x - Math.floor(x), i })).sort((a, b) => b.r - a.r || a.i - b.i);
  for (let k = 0; left > 0; k++, left--) out[order[k % order.length].i]++;
  return out;
}

// ─────────────────────────── frozen bank ─────────────────────────────────────
const frozenQ = new Set();
const frozenByType = [];
// Option strings are capped BANK-WIDE from OPT_FROM by verify-daily-banks.mjs
// (OUTWIT_CROWD_FROM), so a new segment starts from what the bank already spent.
const OPT_FROM = '2026-09-30';
const frozenOpt = new Map();
const frozenModal = new Map();
let frozenLastFrac = null;
for (const file of AVOID) {
  const mod = await import(new URL(`../${file}`, import.meta.url).href);
  if (!mod.PUZZLES) throw new Error(`--avoid file ${file} exports no PUZZLES`);
  for (const p of mod.PUZZLES) {
    for (const pr of p.prompts) {
      if (pr.type !== 'twothirds') { frozenQ.add(pr.q.trim()); frozenByType.push({ type: pr.type, q: pr.q.trim() }); }
      if (pr.options && p.live >= OPT_FROM) for (const o of pr.options) frozenOpt.set(o, (frozenOpt.get(o) || 0) + 1);
      if (pr.type === 'match' && pr.options) {
        const c = new Array(pr.options.length).fill(0);
        for (const v of pr.house) c[v]++;
        const w = pr.options[c.indexOf(Math.max(...c))];
        frozenModal.set(w, (frozenModal.get(w) || 0) + 1);
      }
      if (pr.type === 'twothirds') frozenLastFrac = pr.fracLabel || 'two-thirds';
    }
  }
}
process.stderr.write(`avoid: ${frozenQ.size} frozen prompts, ${frozenModal.size} frozen favorites, last fraction ${frozenLastFrac}\n`);

// ─────────────────────────── the calendar ────────────────────────────────────
const dates = [];
{
  const d = new Date(`${FROM}T12:00:00Z`);
  for (let i = 0; i < DAYS; i++) { dates.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + 1); }
}
const isSun = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay() === 0 && iso >= SUNDAY_FROM;
const sundays = dates.filter(isSun).length;

// ─────────────────────────── fraction schedule ───────────────────────────────
// No back-to-back repeat is the owner rule; no repeat inside three days and a
// 6-9 use band across the segment are this generator's own tighter ceilings.
function fracSchedule() {
  for (let attempt = 0; attempt < 4000; attempt++) {
    const out = [];
    const recent = [frozenLastFrac];
    let ok = true;
    while (out.length < DAYS) {
      const cycle = shuffle(FRACS.map((f, i) => i));
      for (const fi of cycle) {
        if (out.length >= DAYS) break;
        const lab = FRACS[fi].label;
        const tail = [...recent].slice(-3);
        if (tail.includes(lab)) { ok = false; break; }
        out.push(fi); recent.push(lab);
      }
      if (!ok) break;
    }
    if (!ok || out.length < DAYS) continue;
    const use = {};
    out.forEach((i) => { use[i] = (use[i] || 0) + 1; });
    const counts = FRACS.map((_, i) => use[i] || 0);
    if (Math.min(...counts) < Math.floor(DAYS / 8) - 1 || Math.max(...counts) > Math.ceil(DAYS / 8) + 1) continue;
    return out;
  }
  throw new Error('no fraction schedule satisfied the spacing and use bands');
}

// ─────────────────────────── prompt assignment ───────────────────────────────
// Seeded greedy with restarts. Slot by slot, day by day: take the first pool
// entry that breaks no ceiling. Pools are deliberately larger than the run, so
// "no legal entry" means a ceiling bit, not that the bank ran out.
function assign(pool, need, perDay, extraOk) {
  for (let attempt = 0; attempt < 600; attempt++) {
    const bag = shuffle(pool);
    const out = [];
    const catUse = {};
    let cursor = 0;
    let ok = true;
    for (let d = 0; d < need; d++) {
      const want = perDay(d);
      const chosen = [];
      for (let s = 0; s < want; s++) {
        let found = -1;
        for (let k = 0; k < bag.length; k++) {
          const e = bag[(cursor + k) % bag.length];
          if (out.flat().includes(e) || chosen.includes(e)) continue;
          if ((catUse[e.c] || 0) >= CAT_CEIL) continue;
          if (d > 0 && out[d - 1].some((x) => x.c === e.c)) continue;   // no same category two days running
          if (chosen.some((x) => x.c === e.c)) continue;
          if (extraOk && !extraOk(e, d, out, chosen)) continue;
          found = (cursor + k) % bag.length;
          break;
        }
        if (found < 0) { ok = false; break; }
        chosen.push(bag[found]);
        catUse[bag[found].c] = (catUse[bag[found].c] || 0) + 1;
        cursor = found + 1;
      }
      if (!ok) break;
      out.push(chosen);
    }
    if (ok) return out;
  }
  return null;
}

// ─────────────────────────── SEGMENTS (2026-11-12, lane-f) ───────────────────
// scripts/outwit-prompts.mjs is APPEND-ONLY: an entry the --avoid bank already
// carries is SPENT (it is the authored source of a live board) and is skipped,
// rather than failing the run as a repeat. Herd entries are matched on the
// emitted text, stem plus the standard tail. A new entry must also not
// NEAR-repeat any banked prompt of its own type, or another new entry
// (scripts/crowd-near-repeat.mjs); the run aborts on a hit.
const emittedQ = (e, type) => (type === 'herd' ? e.q + '?' + HERD_TAIL : e.q).trim();
const fresh = (pool, type) => pool.filter((e) => !frozenQ.has(emittedQ(e, type)));
const LEAST = fresh(LEAST_ALL, 'least');
const MATCH = fresh(MATCH_ALL, 'match');
const UNIQUE = fresh(UNIQUE_ALL, 'unique');
const HERD = fresh(HERD_ALL, 'herd');
{
  const near = [];
  for (const [pool, type] of [[LEAST, 'least'], [MATCH, 'match'], [UNIQUE, 'unique'], [HERD, 'herd']]) {
    const stem = (q) => q.replace(HERD_TAIL, '').replace(/ Closest to the crowd.s MEDIAN guess wins.*$/, '');
    const banked = frozenByType.filter((f) => f.type === type).map((f) => stem(f.q));
    pool.forEach((e, i) => {
      for (const b of banked) if (nearRepeat(e.q, b)) near.push(`${type} ${e.k}: near-repeats banked "${b}"`);
      for (let j = 0; j < i; j++) if (nearRepeat(e.q, pool[j].q)) near.push(`${type} ${e.k}: near-repeats new "${pool[j].q}"`);
    });
  }
  process.stderr.write(`gen-outwit: spent entries skipped: least ${LEAST_ALL.length - LEAST.length}, match ${MATCH_ALL.length - MATCH.length}, unique ${UNIQUE_ALL.length - UNIQUE.length}, herd ${HERD_ALL.length - HERD.length}; in play ${LEAST.length}/${MATCH.length}/${UNIQUE.length}/${HERD.length}; ceilings category ${CAT_CEIL}, vector ${VEC_CEIL}\n`);
  if (near.length) { console.error(`gen-outwit: ${near.length} near-repeat(s), nothing written`); near.slice(0, 40).forEach((l) => console.error('  ' + l)); process.exit(1); }
}

const leastPick = assign(LEAST, DAYS, () => 1);
const matchPick = assign(MATCH, DAYS, () => 1);
const herdPick = assign(HERD, DAYS, () => 1);
const uniquePick = assign(UNIQUE, DAYS, (d) => (isSun(dates[d]) ? 2 : 1));
if (!leastPick || !matchPick || !herdPick || !uniquePick) throw new Error('assignment failed under the variety ceilings');

// cross-slot rule: no two prompts on the same board share a category
for (let d = 0; d < DAYS; d++) {
  const cats = [leastPick[d][0].c, matchPick[d][0].c, herdPick[d][0].c, ...uniquePick[d].map((e) => e.c)];
  if (new Set(cats).size !== cats.length) {
    // deterministic repair: swap the offending unique with a later day's
    for (let e = d + 1; e < DAYS; e++) {
      const trial = [leastPick[d][0].c, matchPick[d][0].c, herdPick[d][0].c, ...uniquePick[e].map((x) => x.c)];
      const back = [leastPick[e][0].c, matchPick[e][0].c, herdPick[e][0].c, ...uniquePick[d].map((x) => x.c)];
      if (new Set(trial).size === trial.length && new Set(back).size === back.length && uniquePick[e].length === uniquePick[d].length) {
        const t = uniquePick[d]; uniquePick[d] = uniquePick[e]; uniquePick[e] = t; break;
      }
    }
  }
}

// ─────────────────────────── build the boards ────────────────────────────────
const fracIdx = fracSchedule();
const boards = [];
const seenQ = new Set(frozenQ);
const modalUse = new Map(frozenModal);
const optUse = new Map(frozenOpt);
const errors = [];

// Round-robin the variants WITHIN a family on a per-family cursor rather than on
// the day index: the families are different sizes, so indexing by day quietly
// over-uses whichever variant lines up with the calendar, which is how the first
// run put one unique vector on 14 boards.
const ladderCursor = new Map();
const ladderFor = (key, fam) => {
  const list = LADDERS[key][fam];
  const ck = `${key}:${fam}`;
  const i = ladderCursor.get(ck) || 0;
  ladderCursor.set(ck, i + 1);
  return list[i % list.length];
};

dates.forEach((live, d) => {
  const sun = isSun(live);
  const [Y, M, D] = live.split('-').map(Number);
  const prompts = [];
  const note = (msg) => errors.push(`${live}: ${msg}`);
  const famOf = (e) => (sun ? flatter(e.s || 'mid') : (e.s || 'mid'));

  const addChoice = (type, tag, e, key, q) => {
    const fam = famOf(e);
    const ladder = ladderFor(key, fam);
    const { options, counts, house } = choiceCrowd(e.o, ladder);
    const errs = bandErrors(type, counts);
    if (errs.length) note(`${type} ${e.k}: ${errs.join('; ')}`);
    // THE EMITTED CROWD MUST STILL SAY WHAT THE AUTHOR CLAIMED. For match the
    // favorite is a single option; for least the answer is a single option; for
    // unique the claim is about the TAIL PAIR, whose two ladder counts are often
    // equal on purpose (both tail picks pay 2), so the pair is compared as a set.
    if (type === 'unique') {
      const ranked = [...options.keys()].sort((a, b) => counts[a] - counts[b] || a - b).slice(0, 2);
      const wantPair = new Set(e.o.slice(-2));
      const gotPair = new Set(ranked.map((i) => options[i]));
      if ([...wantPair].some((x) => !gotPair.has(x))) note(`unique ${e.k}: tail pair lost ([${[...wantPair]}] -> [${[...gotPair]}])`);
    } else {
      const want = type === 'match' ? e.o[0] : e.o[e.o.length - 1];
      const got = type === 'match'
        ? options[counts.indexOf(Math.max(...counts))]
        : options[counts.indexOf(Math.min(...counts))];
      if (want !== got) note(`${type} ${e.k}: ranking lost in apportionment (${want} -> ${got})`);
    }
    if (seenQ.has(q)) note(`${type} ${e.k}: prompt already in the bank`);
    seenQ.add(q);
    for (const o of options) optUse.set(o, (optUse.get(o) || 0) + 1);
    prompts.push({ type, tag, q, options, house });
  };

  // 1. Road Less Traveled
  addChoice('least', 'Road Less Traveled', leastPick[d][0], 'least4', leastPick[d][0].q);

  // 2. Herd
  {
    const e = herdPick[d][0];
    const q = e.q + '?' + HERD_TAIL;
    const { house, vals, counts } = herdCrowd(e);
    const srt = [...house].sort((a, b) => a - b);
    const med = (srt[POOL / 2 - 1] + srt[POOL / 2]) / 2;
    if (med !== e.c0) note(`herd ${e.k}: median ${med} != authored center ${e.c0}`);
    // A Herd crowd is allowed to be more peaked than a choice crowd, because on
    // a small-number question a real crowd genuinely converges: nearly everyone
    // says 2 for a bee's wings. What is not allowed is a crowd with no shape at
    // all, so the pool still has to fan out over several answers, and the floor
    // scales with the size of the number being guessed.
    const distinctFloor = e.c0 < 10 ? 5 : 8;
    if (Math.max(...counts) > POOL * 0.45) note(`herd ${e.k}: ${Math.max(...counts)} of ${POOL} on one guess`);
    if (vals.length < distinctFloor) note(`herd ${e.k}: only ${vals.length} distinct guesses (floor ${distinctFloor})`);
    if (house.some((v) => v < e.min || v > e.max)) note(`herd ${e.k}: a guess outside ${e.min}-${e.max}`);
    if (e.t < e.min || e.t > e.max) note(`herd ${e.k}: truth outside its own range`);
    if (seenQ.has(q)) note(`herd ${e.k}: prompt already in the bank`);
    seenQ.add(q);
    prompts.push({ type: 'herd', tag: 'Herd', q, min: e.min, max: e.max, truth: e.t, truthNote: e.n, house });
  }

  // 3. Meeting Point
  {
    const e = matchPick[d][0];
    const key = e.o.length === 5 ? 'match5' : 'match4';
    const fav = e.o[0];
    if ((modalUse.get(fav) || 0) >= MODAL_CEIL) note(`match ${e.k}: favorite "${fav}" already heads ${modalUse.get(fav)} boards`);
    modalUse.set(fav, (modalUse.get(fav) || 0) + 1);
    addChoice('match', 'Meeting Point', e, key, e.q);
  }

  // 4 (and 5 on Sunday). Rare Bird
  uniquePick[d].forEach((e, i) => {
    addChoice('unique', i === 0 ? 'Rare Bird' : 'Rarer Bird', e, 'unique8', e.q);
  });

  // last. Undercut
  {
    const f = FRACS[fracIdx[d]];
    const { house, mean, err } = undercutCrowd(f.v);
    if (err > 2.5) note(`undercut ${f.label}: pool mean ${mean.toFixed(1)} is ${err.toFixed(1)} off the model`);
    if (new Set(house).size < 12) note(`undercut ${f.label}: only ${new Set(house).size} distinct picks`);
    const hist = {};
    house.forEach((v) => { hist[v] = (hist[v] || 0) + 1; });
    if (Math.max(...Object.values(hist)) > POOL * 0.25) note(`undercut ${f.label}: one number holds over a quarter of the pool`);
    prompts.push({
      type: 'twothirds', tag: 'Undercut',
      q: `Pick a number from 0 to 100. Closest to ${f.word} of the crowd's average pick wins.`,
      min: 0, max: 100, frac: f.v, fracLabel: f.label, house,
    });
  }

  boards.push({
    num: STARTNUM + d,
    quizId: `outwit-${M}-${D}-${String(Y).slice(2)}`,
    live,
    dateLabel: `${MON[M - 1]} ${D}, ${Y}`,
    sunday: sun,
    prompts,
  });
});

for (const [opt, n] of optUse) if (n > OPT_CEIL) errors.push(`option "${opt}" appears in ${n} prompts (ceiling ${OPT_CEIL})`);
// SHAPE VARIETY. The reveal draws the house counts as a bar chart, so a bank
// that ships one count vector every day teaches a regular player the shape of
// the crowd even when it cannot tell them which option is which. Ceiling: no
// single vector on more than VEC_CEIL boards in one prompt slot.
const vecUse = new Map();
for (const b of boards) for (const pr of b.prompts) {
  if (!pr.options) continue;
  const c = new Array(pr.options.length).fill(0);
  for (const v of pr.house) c[v]++;
  const k = `${pr.type}:${c.slice().sort((a, x) => x - a).join('-')}`;
  vecUse.set(k, (vecUse.get(k) || 0) + 1);
}
for (const [k, n] of vecUse) if (n > VEC_CEIL) errors.push(`count vector ${k} used on ${n} boards (ceiling ${VEC_CEIL})`);
if (errors.length) {
  console.error(`gen-outwit: ${errors.length} quality failures, nothing written`);
  errors.slice(0, 40).forEach((e) => console.error('  ' + e));
  process.exit(1);
}

// ─────────────────────────── emit ────────────────────────────────────────────
// Matches the bank's own text shape exactly: unquoted keys, double-quoted
// strings, options one per line, house on one line.
const jstr = (s) => JSON.stringify(s);
function renderPrompt(pr) {
  const L = ['      {', `        type: ${jstr(pr.type)},`, `        tag: ${jstr(pr.tag)},`, `        q: ${jstr(pr.q)},`];
  if (pr.options) L.push('        options: [', pr.options.map((o) => `          ${jstr(o)}`).join(',\n'), '        ],');
  if (pr.min !== undefined) { L.push(`        min: ${pr.min},`); L.push(`        max: ${pr.max},`); }
  if (pr.truth !== undefined) { L.push(`        truth: ${pr.truth},`); L.push(`        truthNote: ${jstr(pr.truthNote)},`); }
  if (pr.frac !== undefined) { L.push(`        frac: ${pr.frac},`); L.push(`        fracLabel: ${jstr(pr.fracLabel)},`); }
  L.push(`        house: [${pr.house.join(', ')}]`);
  L.push('      }');
  return L.join('\n');
}
const body = boards.map((b) => [
  '  {',
  `    num: ${b.num},`,
  `    quizId: ${jstr(b.quizId)},`,
  `    live: ${jstr(b.live)},`,
  `    dateLabel: ${jstr(b.dateLabel)},`,
  `    sunday: ${b.sunday},`,
  '    prompts: [',
  b.prompts.map(renderPrompt).join(',\n'),
  '    ]',
  '  }',
].join('\n')).join(',\n');
const text = `export const PUZZLES = [\n${body}\n];\n`;
if (OUT) fs.writeFileSync(OUT, text); else process.stdout.write(text);

// ─────────────────────────── report ──────────────────────────────────────────
const catCount = (picks) => { const c = {}; picks.flat().forEach((e) => { c[e.c] = (c[e.c] || 0) + 1; }); return c; };
const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} ${v}`).join(', ');
process.stderr.write(`outwit: ${boards.length} boards, ${dates[0]} to ${dates[dates.length - 1]}, ${sundays} Sunday Editions\n`);
process.stderr.write(`  categories  least: ${top(catCount(leastPick))} | herd: ${top(catCount(herdPick))}\n`);
process.stderr.write(`              match: ${top(catCount(matchPick))} | unique: ${top(catCount(uniquePick))}\n`);
const fu = {}; fracIdx.forEach((i) => { fu[FRACS[i].label] = (fu[FRACS[i].label] || 0) + 1; });
process.stderr.write(`  fractions   ${Object.entries(fu).map(([k, v]) => `${k} ${v}`).join(', ')}\n`);
process.stderr.write(`  option reuse ceiling ${OPT_CEIL}: max seen ${Math.max(...optUse.values())}; distinct options ${optUse.size}\n`);
const offBy = herdPick.flat().filter((e) => e.c0 !== e.t).length;
process.stderr.write(`  herd: crowd center differs from the true answer on ${offBy} of ${DAYS} boards\n`);
if (OUT) process.stderr.write(`wrote ${boards.length} boards to ${OUT}\n`);
