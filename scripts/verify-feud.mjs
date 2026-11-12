// scripts/verify-feud.mjs — acceptance audit for Feud's bucket matcher.
//
// Feud's answer key is the live crowd, so the ONE thing that must hold is that
// a player who typed the intended answer lands in the intended bucket. This
// script proves it two ways across every banked prompt:
//
//   1. SELF-COLLISION: every bucket label and every alias key, run back through
//      the matcher, must resolve to its OWN bucket. A key that resolves to a
//      sibling means players naming that answer are silently credited to the
//      wrong crowd (the launch pass had 23 of these — "headphones" hitting the
//      Phone bucket, "dishwasher" hitting Washer, "backseat" hitting AC).
//   2. FIXTURES: hand-written realistic answers — typos, plurals, tense,
//      synonyms, filler words, compound spacing — must land where a human
//      would put them, and the known traps must NOT match.
//
// Added 2026-09-05, because a matcher audit is not a bank audit: this file
// proved every alias and enforced NOTHING about the boards, so a bulk extension
// could ship 62 legal days that all said the same thing (CLAUDE.md, "Daily
// puzzle authoring standard" #7 — pool variety is checked across the WHOLE bank
// or it is not checked):
//
//   3. STRUCTURE: the calendar (one board a day, contiguous nums in date order,
//      quizId and dateLabel derived from `live`, `sunday` false — feud runs no
//      Sunday Edition and is absent from lib/sunday-editions.js), five prompts
//      a day, six to nine buckets a prompt, every bucket aliased, and a `house`
//      of exactly 40 votes with every index in range and no zero-vote bucket.
//   4. VARIETY: no prompt text repeats anywhere in the bank, one answer label
//      may fill at most LABEL_CEIL prompts of a segment (HOT_CEIL if the
//      pre-segment bank already runs it HOT_FROZEN times or more), no bucket
//      count may hold more than 55% of a segment while every count in the band
//      holds at least 5%, and no single house count-vector may shape more than
//      VEC_CEIL prompts.
//
// GRANDFATHERING (authoring standard #10). Checks 3 and 4 apply only from
// FEUD_RULES_FROM. The 60 boards live before it are frozen history and two of
// them would fail: one house array is not monotone, and the frozen bank runs
// `pizza` 16 times and `coffee` 14 in 300 prompts. Lowering those would mean
// rewriting a board that has already gone live, which is the one thing this
// repo never does. Checks 1 and 2 run over everything, because a mis-bucketed
// alias mis-scores a live board today.
//
// Run: node scripts/verify-feud.mjs
import { PUZZLES } from '../app/feud/puzzles.js';
import { normAnswer, promptMatcher } from '../lib/feud-match.js';
import { nearRepeat, answerNearRepeat } from './crowd-near-repeat.mjs';

// The audit runs the REAL matcher (lib/feud-match.js has no imports precisely
// so it can be loaded here), never a copy — a mirror would drift.
const matcherFor = promptMatcher;

let fail = 0;
const bad = [];

// ---- 1. self-collision sweep -------------------------------------------
let prompts = 0, probes = 0;
for (const puz of PUZZLES) {
  for (const [pi, prompt] of (puz.prompts || []).entries()) {
    prompts++;
    const m = matcherFor(prompt);
    (prompt.answers || []).forEach((b, i) => {
      const want = 'c' + i;
      for (const probe of [b.c, ...(b.k || [])]) {
        probes++;
        const got = m.bucketOf(probe);
        if (got !== want) {
          fail++;
          const gotLabel = got && got.startsWith('c')
            ? (prompt.answers[Number(got.slice(1))] || {}).c
            : '(no bucket — dynamic)';
          bad.push(`  #${puz.num} p${pi + 1} "${probe}" → ${gotLabel}  (should be "${b.c}")`);
        }
      }
    });
  }
}

// ---- 2. fixtures ---------------------------------------------------------
// [prompt-finding substring, typed answer, expected bucket label or null]
const FIXTURES = [
  ["can't fall asleep", 'scrolling on my phone', 'Scroll their phone'],
  ["can't fall asleep", 'SCROLL TIKTOK', 'Scroll their phone'],
  ["can't fall asleep", 'watch television', 'Watch TV'],
  ["can't fall asleep", 'reading a book', 'Read'],
  ["can't fall asleep", 'counting sheep', 'Count sheep'],
  ["can't fall asleep", 'tossing and turning', 'Toss and turn'],
  ["can't fall asleep", 'melatonan', 'Take melatonin'],          // typo
  ["can't fall asleep", 'drink some tea', 'Drink something warm'],
  ['better as a leftover', 'PIZZA!!!', 'Pizza'],
  ['better as a leftover', 'cold pizza slice', 'Pizza'],
  ['better as a leftover', 'chinese', 'Chinese food'],
  ['better as a leftover', 'lasagne', 'Lasagna'],                // spelling
  ['better as a leftover', 'spagetti', 'Spaghetti'],             // typo
  ['always losing', 'my keys', 'Keys'],
  ['always losing', 'the tv remote', 'The remote'],
  ['always losing', 'sunglasses', 'Sunglasses'],
  ['always losing', 'chap stick', 'Chapstick'],                  // compound spacing
  ['always losing', 'airpods', 'Earbuds'],
  // 2026-09-01 player report (Matty P): quality nouns and irregular plurals
  ['fall activity', 'leaf watch', 'Looking at the leaves'],
  ['fall activity', 'leaf peeping', 'Looking at the leaves'],
  ['fall activity', 'the leaves changing', 'Looking at the leaves'],
  ['fall activity', 'foliage', 'Looking at the leaves'],
  ['notice first about a house', 'cleanliness', 'How clean it is'],
  ['notice first about a house', 'cleanness', 'How clean it is'],
  ['notice first about a house', 'tidiness', 'How clean it is'],
  ['notice first about a house', 'how messy it is', 'How clean it is'],
  ['notice first about a house', 'how big it is', 'How big it is'],
  // traps: an accidental substring must NOT be credited to the short bucket
  ['always losing', 'headphones', null],
  ['always losing', 'my dignity', null],
  // 2026-09-30 segment. Written by typing each board the way a player would
  // rather than by reading its alias list back, which is the only way to catch
  // a bucket that is reachable only by the exact string its author wrote.
  ['food people grill outdoors', 'cheeseburgers', 'Burgers'],
  ['food people grill outdoors', 'i always do steaks', 'Steak'],
  ['drink people have with breakfast', 'a cup of tea', 'Tea'],
  ['drink people have with breakfast', 'coffe', 'Coffee'],
  ['furniture that is misery', 'the sofa', 'A couch'],
  ['furniture that is misery', 'refrigerator', 'A refrigerator'],
  ['forget to charge', 'my airpods', 'Headphones'],
  ['always tangled', 'the christmas lights', 'String lights'],
  ['everything piles up', 'the worktop', 'The kitchen counter'],
  ['the wind blows over', 'wheelie bins', 'Trash cans'],
  ['the wind blows over', 'the garbage can', 'Trash cans'],
  ['less work than a dog', 'a goldfish', 'A fish'],
  ['only do with headphones in', 'hoovering', 'Vacuuming'],
  ['run out of before they remember', 'loo roll', 'Toilet paper'],
  ['never wash often enough', 'my water bottle', 'A reusable bottle'],
  ['the second the alarm goes off', 'hit the snooze button', 'Hit snooze'],
  ['food people put in a taco', 'guac', 'Guacamole'],
  ['drink people make in a blender', 'smoothies', 'A smoothie'],
  ['animal nobody wants in the garden', 'slugs and snails', 'Slugs'],
  ['take off first when they get home', 'my shoes', 'Shoes'],
  // and one that SHOULD miss: an answer nobody banked forms its own bucket
  // rather than being forced into the nearest label.
  ['something rain ruins', 'a bbq', null],
];

let fx = 0, fxBad = [];
for (const [needle, typed, wantLabel] of FIXTURES) {
  let found = null;
  for (const puz of PUZZLES) {
    for (const prompt of puz.prompts || []) {
      if (prompt.q.toLowerCase().includes(needle.toLowerCase())) { found = prompt; break; }
    }
    if (found) break;
  }
  if (!found) { fxBad.push(`  (no prompt matching "${needle}" — fixture stale)`); fail++; continue; }
  fx++;
  const m = matcherFor(found);
  const got = m.bucketOf(typed);
  const gotLabel = got && got.startsWith('c') ? (found.answers[Number(got.slice(1))] || {}).c : null;
  if (gotLabel !== wantLabel) {
    fail++;
    fxBad.push(`  "${typed}" → ${gotLabel || '(dynamic)'}  (expected ${wantLabel || '(dynamic)'})`);
  }
}

// ---- 3. synonym table sanity --------------------------------------------
// A synonym target must never itself be a synonym key (no chains), or the
// canonical form depends on iteration order.
const chainBad = [];
{
  const probe = (w) => normAnswer(w);
  const seen = new Map();
  for (const w of ['television', 'cell', 'sofa', 'pop', 'restroom', 'garbage', 'automobile', 'film', 'child', 'mother', 'holiday', 'lift', 'queue', 'petrol']) {
    const once = probe(w);
    const twice = probe(once);
    if (once !== twice) chainBad.push(`  "${w}" → "${once}" → "${twice}" (synonym chain)`);
    seen.set(w, once);
  }
}
fail += chainBad.length;

// ---- 4. structure and pool variety, from FEUD_RULES_FROM ------------------
const FEUD_RULES_FROM = '2026-09-30';
// SEGMENTS (2026-11-12, lane-f). The variety ceilings below were written for the
// 62-day, 310-prompt segment that starts FEUD_RULES_FROM. Each later extension is
// its own segment, measured against EVERYTHING banked before it, with every
// ceiling scaled to the segment's size as a rate and rounded up (SEG_BASE). The
// first segment's ceilings are therefore unchanged; the 155-prompt December
// segment runs label 2 (hot 1) and house shape 7. gen-feud.mjs scales the same way.
const FEUD_SEGMENTS = ['2026-09-30', '2026-12-01'];
const SEG_BASE = 310;
// NEAR REPEATS (from NEAR_FROM, the first segment authored with the screen):
// no prompt may say the same thing as any earlier prompt in other words, by
// scripts/crowd-near-repeat.mjs. Earlier boards predate the screen; grandfathered.
const NEAR_FROM = '2026-12-01';
const LABEL_CEIL = 4;      // max prompts one answer label may fill in the segment
const HOT_CEIL = 2;        // ...if the earlier bank already runs it HOT_FROZEN+ times
const HOT_FROZEN = 10;
const VEC_CEIL = 14;       // max prompts one house count-vector may shape
const MODE_CEIL = 0.55;    // max share of the segment on one bucket count
const MIN_SHARE = 0.05;    // min share every count in the 6-9 band must hold
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const structBad = [];
const varietyBad = [];
{
  const sorted = PUZZLES.slice().sort((a, b) => (a.live < b.live ? -1 : a.live > b.live ? 1 : 0));
  const normQ = (q) => String(q).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

  // 4a. calendar and per-board structure
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    const at = `#${p.num} ${p.live}`;
    if (PUZZLES[i] !== p) structBad.push(`  ${at}: bank is not in date order`);
    if (p.num !== i + 1) structBad.push(`  ${at}: num should be ${i + 1}`);
    if (i) {
      const d = new Date(sorted[i - 1].live + 'T12:00:00Z');
      d.setUTCDate(d.getUTCDate() + 1);
      if (d.toISOString().slice(0, 10) !== p.live) structBad.push(`  ${at}: gap after ${sorted[i - 1].live}`);
    }
    const [Y, M, D] = p.live.split('-').map(Number);
    const wantId = `feud-${M}-${D}-${String(Y).slice(2)}`;
    if (p.quizId !== wantId) structBad.push(`  ${at}: quizId "${p.quizId}" should be "${wantId}"`);
    const wantLabel = `${MON[M - 1]} ${D}, ${Y}`;
    if (p.dateLabel !== wantLabel) structBad.push(`  ${at}: dateLabel "${p.dateLabel}" should be "${wantLabel}"`);
    // feud runs NO Sunday Edition (see app/feud/puzzles.js). Whole bank: this
    // one has always held, so it is not grandfathered.
    if (p.sunday) structBad.push(`  ${at}: sunday:true, but feud has no Sunday Edition`);
    if ((p.prompts || []).length !== 5) structBad.push(`  ${at}: ${(p.prompts || []).length} prompts, want 5`);
    const future = p.live >= FEUD_RULES_FROM;
    for (const [pi, pr] of (p.prompts || []).entries()) {
      const where = `  ${at} p${pi + 1}`;
      const n = (pr.answers || []).length;
      if (n < 6 || n > 9) structBad.push(`${where}: ${n} buckets, band is 6-9`);
      for (const b of pr.answers || []) if (!b.k || !b.k.length) structBad.push(`${where}: bucket "${b.c}" has no aliases`);
      const h = pr.house || [];
      if (h.length !== 40) structBad.push(`${where}: house holds ${h.length} votes, want 40`);
      const counts = new Array(n).fill(0);
      for (const v of h) {
        if (!Number.isInteger(v) || v < 0 || v >= n) { structBad.push(`${where}: house index ${v} out of range`); continue; }
        counts[v]++;
      }
      const zero = counts.findIndex((c) => c === 0);
      if (zero !== -1) structBad.push(`${where}: bucket "${(pr.answers[zero] || {}).c}" has zero house votes (unreachable in lib/feud-score.js)`);
      // The bucket ORDER is the popularity claim, so the crowd has to agree
      // with it. Grandfathered: one frozen board does not.
      if (future) for (let k = 1; k < counts.length; k++) {
        if (counts[k] > counts[k - 1]) { structBad.push(`${where}: house is not monotone (${counts.join('/')})`); break; }
      }
    }
  }

  // 4b. no prompt text repeats, anywhere in the bank; and from NEAR_FROM no
  // prompt near-repeats any earlier one (crowd-near-repeat.mjs)
  const seenQ = new Map();
  const earlier = [];
  for (const p of sorted) for (const pr of p.prompts || []) {
    const k = normQ(pr.q);
    if (seenQ.has(k)) varietyBad.push(`  prompt repeats ${seenQ.get(k)}: "${pr.q}" (#${p.num} ${p.live})`);
    else seenQ.set(k, `#${p.num} ${p.live}`);
    const board = { labels: (pr.answers || []).map((x) => x.c), bucketOf: promptMatcher(pr).bucketOf };
    if (p.live >= NEAR_FROM) {
      const hit = earlier.find((e) => nearRepeat(pr.q, e.q));
      if (hit) varietyBad.push(`  prompt near-repeats ${hit.at} "${hit.q}": "${pr.q}" (#${p.num} ${p.live})`);
      const ahit = earlier.find((e) => answerNearRepeat(board, e.board));
      if (ahit) varietyBad.push(`  prompt's answers repeat ${ahit.at} "${ahit.q}": "${pr.q}" (#${p.num} ${p.live})`);
    }
    earlier.push({ q: pr.q, at: `#${p.num} ${p.live}`, board });
  }

  // 4c. pool variety over each segment from FEUD_RULES_FROM, measured against
  // what the boards before that segment already spend.
  FEUD_SEGMENTS.forEach((from, si) => {
  const to = FEUD_SEGMENTS[si + 1] || '9999-12-31';
  const seg = sorted.filter((p) => p.live >= from && p.live < to);
  const pre = sorted.filter((p) => p.live < from);
  const segN = seg.reduce((a, p) => a + (p.prompts || []).length, 0);
  const up = (n) => Math.max(1, Math.ceil(n * segN / SEG_BASE));
  const LABEL_C = up(LABEL_CEIL), HOT_C = up(HOT_CEIL), VEC_C = up(VEC_CEIL);
  const tag = `segment ${from}`;
  if (seg.length) {
    const preLabel = new Map();
    for (const p of pre) for (const pr of p.prompts || []) for (const b of pr.answers || []) {
      const k = String(b.c).toLowerCase();
      preLabel.set(k, (preLabel.get(k) || 0) + 1);
    }
    const segLabel = new Map(), bucketN = new Map(), vec = new Map();
    let segPrompts = 0;
    for (const p of seg) for (const pr of p.prompts || []) {
      segPrompts++;
      const n = (pr.answers || []).length;
      bucketN.set(n, (bucketN.get(n) || 0) + 1);
      const counts = new Array(n).fill(0);
      for (const v of pr.house || []) if (v >= 0 && v < n) counts[v]++;
      const sig = counts.join('/');
      vec.set(sig, (vec.get(sig) || 0) + 1);
      for (const b of pr.answers || []) {
        const k = String(b.c).toLowerCase();
        segLabel.set(k, (segLabel.get(k) || 0) + 1);
      }
    }
    for (const [lab, n] of segLabel) {
      const before = preLabel.get(lab) || 0;
      const ceil = before >= HOT_FROZEN ? HOT_C : LABEL_C;
      if (n > ceil) varietyBad.push(`  ${tag}: answer label "${lab}" fills ${n} prompts of the segment (ceiling ${ceil}; the earlier bank runs it ${before}x)`);
    }
    for (const [n, c] of bucketN) {
      if (c / segPrompts > MODE_CEIL) varietyBad.push(`  ${tag}: ${c}/${segPrompts} segment prompts carry ${n} buckets (${(100 * c / segPrompts).toFixed(0)}%, ceiling ${100 * MODE_CEIL}%)`);
    }
    for (const n of [6, 7, 8, 9]) {
      const c = bucketN.get(n) || 0;
      if (c / segPrompts < MIN_SHARE) varietyBad.push(`  ${tag}: only ${c}/${segPrompts} segment prompts carry ${n} buckets (${(100 * c / segPrompts).toFixed(1)}%, floor ${100 * MIN_SHARE}%) — the band is not being used`);
    }
    for (const [sig, c] of vec) {
      if (c > VEC_C) varietyBad.push(`  ${tag}: house shape ${sig} shapes ${c} segment prompts (ceiling ${VEC_C})`);
    }
  }
  });
}
fail += structBad.length + varietyBad.length;

// ---- report --------------------------------------------------------------
console.log(`Feud acceptance audit`);
console.log(`  ${PUZZLES.length} days, ${prompts} prompts, ${probes} label/alias probes`);
console.log(`  ${fx} fixtures`);
console.log(`  variety by segment (${FEUD_SEGMENTS.join(', ')}); near repeats from ${NEAR_FROM}`);
console.log(`  structure + variety checked from ${FEUD_RULES_FROM} (${PUZZLES.filter((p) => p.live >= FEUD_RULES_FROM).length} boards); earlier boards grandfathered`);
if (bad.length) { console.log(`\nSELF-COLLISIONS (${bad.length}):`); bad.forEach((l) => console.log(l)); }
if (fxBad.length) { console.log(`\nFIXTURE FAILURES (${fxBad.length}):`); fxBad.forEach((l) => console.log(l)); }
if (chainBad.length) { console.log(`\nSYNONYM CHAINS (${chainBad.length}):`); chainBad.forEach((l) => console.log(l)); }
if (structBad.length) { console.log(`\nSTRUCTURE (${structBad.length}):`); structBad.slice(0, 40).forEach((l) => console.log(l)); }
if (varietyBad.length) { console.log(`\nPOOL VARIETY (${varietyBad.length}):`); varietyBad.slice(0, 40).forEach((l) => console.log(l)); }
if (!fail) console.log(`\nPASS — every label and alias resolves to its own bucket, the calendar is whole, and the pool ceilings hold.`);
else console.log(`\nFAIL — ${fail} problem(s).`);
process.exit(fail ? 1 : 0);
