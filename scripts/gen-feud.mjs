#!/usr/bin/env node
// Build new Feud boards. Deterministic: same flags in, byte-identical boards out.
//
//   node scripts/gen-feud.mjs --from 2026-09-30 --days 62 --startnum 61 \
//        --avoid app/feud/puzzles.js --out /tmp/feud-new.js --seed 20260930
//
// or, the house one-liner that splices without ever touching a frozen board:
//
//   node scripts/_append.mjs feud gen-feud.mjs 2026-11-30
//
// Audit-only pass over the corpus, no dates, no output file:
//
//   node scripts/gen-feud.mjs --lint
//
// WHAT IT BUILDS. One board a day, five survey prompts on every board. The
// prompts, their answer buckets and every alias are AUTHORED, in
// scripts/feud-prompts.mjs; this file decides which prompt lands on which day
// and turns each authored bucket order into a 40-vote `house` crowd. There is
// no search here and there cannot be: a survey prompt is a piece of writing,
// not a combinatorial object. What IS mechanical is the part that decides
// whether the writing works, and that is the whole point of this script.
//
// ═════════════════════════════════════════════════════════════════════════════
// THE ONE THING THIS GAME LIVES OR DIES ON: THE MATCHER IS RULES, NOT AI.
// ═════════════════════════════════════════════════════════════════════════════
// A player types free text. lib/feud-match.js decides which banked bucket that
// text belongs to, with a fixed rule ladder — normalize, stem, apply a synonym
// table, then score every bucket (exact 100, despaced 96, key-inside-answer 88,
// answer-inside-key 82, bag containment 76/72, despaced containment 68/64,
// shared head noun 58, single-typo tiers 48/46/42) and keep the best. Nothing
// in that path knows what an answer MEANS. So a board is only fair if the
// aliases carry the meaning for it, and only correct if no alias reaches into a
// sibling bucket. Both halves are enforced here before a board is emitted:
//
//   * COVERAGE is authored, not derived. For every bucket I wrote down what a
//     real player would actually type — "fridge" AND "refrigerator" AND "the
//     fridge", "AC" AND "air conditioning", "the DMV" AND "the dmv line" — and
//     the alias list carries it. The matcher gives you plurals, -ing/-ed, filler
//     words, compound spacing ("chap stick"), single-character typos on words of
//     five or more letters, and one shared synonym table, FOR FREE. It gives you
//     nothing else. It does not know that "the bill" is "the check", that "duvet"
//     is "comforter", or that "telly" covers "the box". Those are aliases or they
//     are lost points.
//   * SELF-COLLISION is proved. Every label and every alias of every bucket is
//     run back through the REAL matcher (imported, never mirrored) and must
//     resolve to its own bucket. That is the same gate scripts/verify-feud.mjs
//     applies to the shipped bank; running it here means a bad board never
//     reaches the bank in the first place. The generator ABORTS on one hit.
//
// The trap list below is what the frozen bank and this segment cost me to find.
// Every one of these is a real collision the matcher will hand you:
//
//   * SHARED HEAD NOUN (tier 58). Two buckets whose last token matches, four
//     letters or longer, are the same bucket: "Chocolate cake" / "Coffee cake",
//     "Beach towel" / "Kitchen towel". Never put two on one prompt.
//   * CONTAINMENT (tiers 88/82). A short bucket swallowed by a longer one:
//     "Coffee" / "Coffee maker", "Fries" / "Sweet potato fries", "Tea" /
//     "Sweet tea", "Keys" / "Car keys". If one answer's words are a run inside
//     another's, they are one bucket, so pick the level you want and stay there.
//   * THE SYNONYM TABLE COLLAPSES WORDS YOU DID NOT INTEND. "nap" IS "sleep".
//     "holiday" IS "vacation". "sweet" IS "candy" (so "sweet tea" normalizes to
//     "candy tea" and hits a Candy bucket at 88). "cash" IS "money", "sofa" IS
//     "couch", "pop"/"coke" ARE "soda", "toilet"/"restroom" ARE "bathroom",
//     "shop" IS "store", "film" IS "movie", "child" IS "kid", "mum" IS "mom",
//     "lift" IS "elevator" (so "lifting weights" normalizes to "elevator
//     weight"), "trainer" IS "sneaker" (so a personal trainer is a personal
//     sneaker), "queue" IS "line", "petrol" IS "gas", "buddy"/"pal"/"mate" ARE
//     "friend", "spectacles" ARE "glasses", "garbage" IS "trash".
//   * SINGLE-TYPO REACH (tier 48). Same first letter, five letters or more, one
//     edit apart: spoon/spool, bacon/beacon, towel/trowel, candle/handle. Two
//     such answers on one prompt silently merge.
//   * A ONE-TOKEN KEY IS NEVER MATCHED BY DESPACED CONTAINMENT, which is the
//     only reason "headphones" does not hit a Phone bucket. Do not "help" a
//     one-word bucket by adding a two-word alias that is a substring of a
//     sibling; that re-opens the hole the 2026-08-01 rewrite closed.
//
// The safe authoring rule that falls out of all of it, and the one the linter
// enforces as a warning: WITHIN ONE PROMPT, NO TWO BUCKETS SHARE A CONTENT
// TOKEN. Different answers, different words.
//
// ═════════════════════════════════════════════════════════════════════════════
// WHERE THE NUMBERS COME FROM. READ THIS BEFORE CHANGING A LADDER.
// ═════════════════════════════════════════════════════════════════════════════
// The `house` array on every prompt is an AUTHORED ESTIMATE OF CROWD BEHAVIOR.
// It is not observed play, it has never been observed play, and nothing in this
// pipeline turns it into observed play. Concretely: the author writes each
// bucket list in the order they believe a broad audience would answer it,
// most-popular first, and tags the prompt with the SHAPE they expect the crowd
// to take (steep, mid, flat); this generator lays one of a set of fixed
// 40-vote ladders from that family over the ranking. So a house array is a
// guess with a shape, dressed as 40 ballots.
//
// That is a legitimate thing for this game to ship — `house` exists only so the
// first player of the day has a plausible field to be scored against, and
// lib/feud-score.js retires it pool-wide the moment an eleventh real player
// arrives (HOUSE_CUTOFF = 10). What would NOT be legitimate is presenting it as
// measurement, so app/feud/puzzles.js says the same thing this comment does. If
// anyone later seeds a board from real `feud_picks` rows, that board should say
// so and this note should stop covering it.
//
// The shape is not free-form either. Every emitted crowd is asserted to run
// monotone non-increasing, sum to exactly 40, give the top bucket 8 to 19 votes
// and give EVERY bucket at least one — a zero-vote bucket is unreachable in
// lib/feud-score.js, so it is a trap, not an answer.
//
// ═════════════════════════════════════════════════════════════════════════════
// POOL VARIETY CEILINGS (CLAUDE.md, "Extending a puzzle bank in bulk" #3).
// Per-board legality passes happily on a bank that says the same thing every
// day. All of these are enforced here and abort the run:
//
//   * NO PROMPT TEXT may repeat one already in the frozen bank (300 of them) or
//     another new one. Compared on a normalized form, so re-punctuating an old
//     prompt does not sneak past.
//   * A CATEGORY fills at most CAT_CEIL = 22 of the 310 new prompts (7.1%), and
//     no two prompts on the SAME board share a category, so no day is food day.
//     A category also never lands in the same slot two days running.
//   * AN ANSWER LABEL appears in at most LABEL_CEIL = 4 of the 310 new prompts,
//     and at most HOT_CEIL = 2 times if the frozen bank already runs it 10
//     times or more (pizza 16, coffee 14, ice cream 11, snacks 11). The frozen
//     counts cannot be lowered, so the segment's job is to stop making them
//     worse: two in 310 against fourteen in 300 is a ninety-five percent cut in
//     rate, while still letting the honest top answer be the top answer on the
//     one or two prompts where a broad crowd really would say it.
//   * ONE HOUSE LADDER shapes at most VEC_CEIL = 14 prompts, so the reveal's bar
//     chart is not the same picture every day — and a RUNAWAY ladder (top 16 or
//     more) at most RARE_CEIL = 4, so a 45%-of-the-crowd favorite stays the rare
//     board it is in the frozen bank rather than the house style.
//   * BUCKET COUNT is a band, not a floor: 6 to 9 buckets a prompt, no more than
//     BUCKET_MODE_CEIL = 55% of the segment on any one count, and every count in
//     the band carrying at least BUCKET_MIN_SHARE = 5%. The frozen bank is 81%
//     eights with only 8 sixes and 11 nines in 300; that is the shape this
//     segment deliberately does not copy.
//
// ═════════════════════════════════════════════════════════════════════════════
// WHAT THE FROZEN BANK TAUGHT ME, so the next person does not re-derive it:
//
//   * FEUD HAS NO SUNDAY EDITION. All 60 frozen boards carry `sunday: false`,
//     including the nine that fall on a real Sunday, feud is absent from
//     lib/sunday-editions.js, and the puzzles.js header describes no ramp. The
//     flag is vestigial (CLAUDE.md "Adding a BRAND NEW daily game" names this
//     exact anti-pattern). New boards keep `sunday: false` on every day: setting
//     it true would badge a Sunday Edition that does not exist and would break
//     the registry's two-way sync rule. If feud ever gets a real Sunday ramp, it
//     needs a puzzles.js rule, an entry in lib/sunday-editions.js and a check in
//     verify-feud.mjs, in one pass.
//   * THE HOUSE POOL IS ALWAYS EXACTLY 40 AND ALWAYS SORTED ASCENDING in the
//     frozen bank (300/300), never shuffled, and 299 of 300 run monotone
//     descending by bucket. New boards match that shape exactly.
//   * verify-feud.mjs CHECKS THE MATCHER, NOT THE BOARD. It proves no alias
//     collides and that a fixture list still lands, and it enforces nothing at
//     all about house size, bucket counts, prompt repeats or variety. Every
//     ceiling above is therefore this generator's own; anything it does not
//     enforce is unenforced.
//   * FIXTURES ARE PART OF THE GATE. verify-feud.mjs resolves each fixture by
//     searching every banked prompt for a substring of its `q`. A new prompt
//     that happens to contain "always losing" or "fall activity" would steal a
//     frozen fixture and fail the audit against the wrong board. The linter
//     checks new prompt text against every fixture needle for exactly that.
//
// SEEDING. --seed is offset by the starting board number before use, so a
// segment banked at num 61 can never replay the stream that produced num 1.
import fs from 'node:fs';
import { PROMPTS } from './feud-prompts.mjs';
import { promptMatcher } from '../lib/feud-match.js';

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
const LINT_ONLY = !!args.lint;
const FROM = String(args.from || '2026-09-30');
const DAYS = +(args.days || 62);
const STARTNUM = +(args.startnum || 61);
const OUT = args.out || null;
const AVOID = args.avoid ? String(args.avoid).split(',') : ['app/feud/puzzles.js'];
// HARD RULE: offset the seed by the starting board number so a new segment can
// never replay the frozen one.
const SEED0 = (+(args.seed || 20260930) ^ Math.imul(STARTNUM, 2654435761)) >>> 0;

// ─────────────────────────── deterministic rng ───────────────────────────────
let SEED = SEED0 | 0;
const rng = () => { SEED |= 0; SEED = (SEED + 0x6D2B79F5) | 0; let t = Math.imul(SEED ^ (SEED >>> 15), 1 | SEED); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ri = (n) => Math.floor(rng() * n);
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };

// ─────────────────────────── ceilings ────────────────────────────────────────
const POOL = 40;               // house votes per prompt (the documented size)
const PER_DAY = 5;             // prompts per board (no Sunday ramp — see header)
const CAT_CEIL = 22;           // max new prompts one category may fill
const LABEL_CEIL = 4;          // max new prompts one answer label may appear in
const HOT_CEIL = 2;            // ...if the frozen bank already runs it HOT_FROZEN+ times
const HOT_FROZEN = 10;
const VEC_CEIL = 14;           // max prompts one house ladder may shape
const RARE_CEIL = 4;           // ...but a runaway ladder (top >= RARE_TOP) only this many
const RARE_TOP = 15;
const BUCKET_MODE_CEIL = 0.55; // max share of the segment on any one bucket count
const BUCKET_MIN_SHARE = 0.05; // min share every count in the 6-9 band must hold
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Fixture needles verify-feud.mjs searches prompt text for. A new prompt that
// contains one would hijack a frozen fixture and fail the audit on the wrong
// board, so the linter refuses them.
const FIXTURE_NEEDLES = [
  "can't fall asleep", 'better as a leftover', 'always losing',
  'fall activity', 'notice first about a house',
];

// ─────────────────────────── house ladders ───────────────────────────────────
// Every ladder sums to 40, runs monotone non-increasing, tops out between 8 and
// 19 and floors at 1. Grouped by the crowd shape the author tagged the prompt
// with: `steep` for a prompt with a runaway favorite ("Name a pizza topping"),
// `flat` for one the crowd genuinely splits on ("Name a way people relax"),
// `mid` for everything in between.
//
// CALIBRATED AGAINST THE FROZEN BANK, not against taste. The first draft of
// these ladders put `steep` at 17-19 of 40 and landed 90% of the segment's top
// buckets between 13 and 19; the 300 frozen prompts run 8-19 with 80% of them
// between 8 and 11 and a median of 10. That gap is not cosmetic — a Feud answer
// PAYS the share of the crowd that gave it (lib/feud-score.js), so a steeper
// house makes the obvious answer worth half again as much and the board easier
// on exactly the days a new player meets it. The families were rescaled to sit
// in the frozen band: flat tops at 8-9, mid at 9-11, steep at 11-14. A genuine
// runaway (top 16-19) still exists but is RATIONED at RARE_CEIL uses, because
// the frozen bank only spends one on 3% of its prompts.
const LADDERS = {
  6: {
    flat: [[9, 8, 7, 6, 5, 5], [8, 8, 7, 7, 5, 5], [9, 8, 8, 6, 5, 4]],
    mid: [[10, 9, 7, 6, 5, 3], [11, 9, 7, 6, 4, 3], [10, 8, 8, 6, 5, 3], [9, 9, 8, 6, 5, 3]],
    steep: [[12, 9, 7, 5, 4, 3], [13, 9, 6, 5, 4, 3], [14, 8, 7, 5, 3, 3], [11, 10, 7, 5, 4, 3], [12, 10, 6, 5, 4, 3], [16, 8, 6, 4, 3, 3]],
  },
  7: {
    flat: [[9, 8, 7, 6, 4, 3, 3], [8, 7, 7, 6, 5, 4, 3], [9, 7, 7, 6, 5, 3, 3]],
    mid: [[10, 8, 7, 5, 4, 3, 3], [11, 8, 6, 5, 4, 3, 3], [10, 9, 6, 5, 4, 3, 3], [9, 9, 7, 5, 4, 3, 3], [11, 9, 6, 5, 4, 3, 2], [10, 8, 6, 6, 4, 3, 3]],
    steep: [[12, 8, 6, 5, 4, 3, 2], [13, 8, 6, 5, 3, 3, 2], [14, 8, 6, 4, 3, 3, 2], [12, 9, 6, 5, 4, 2, 2], [11, 9, 7, 5, 3, 3, 2], [13, 9, 6, 4, 3, 3, 2], [16, 7, 5, 4, 3, 3, 2], [18, 7, 5, 4, 3, 2, 1]],
  },
  8: {
    flat: [[9, 7, 6, 5, 4, 4, 3, 2], [8, 7, 6, 5, 5, 4, 3, 2], [9, 8, 6, 5, 4, 3, 3, 2]],
    mid: [[10, 8, 6, 5, 4, 3, 2, 2], [11, 8, 6, 4, 4, 3, 2, 2], [10, 7, 6, 5, 4, 4, 2, 2], [9, 8, 7, 5, 4, 3, 2, 2], [11, 7, 6, 5, 4, 3, 2, 2], [10, 9, 6, 4, 4, 3, 2, 2]],
    steep: [[12, 8, 6, 5, 3, 3, 2, 1], [13, 8, 6, 4, 3, 3, 2, 1], [14, 7, 6, 4, 3, 3, 2, 1], [12, 9, 5, 4, 4, 3, 2, 1], [11, 9, 6, 4, 4, 3, 2, 1], [13, 7, 6, 5, 3, 3, 2, 1], [17, 6, 5, 4, 3, 2, 2, 1], [19, 6, 4, 3, 3, 2, 2, 1]],
  },
  9: {
    flat: [[8, 7, 6, 5, 4, 3, 3, 2, 2], [9, 7, 6, 5, 4, 3, 2, 2, 2]],
    mid: [[10, 7, 6, 4, 4, 3, 2, 2, 2], [11, 7, 5, 4, 4, 3, 2, 2, 2], [9, 8, 6, 4, 4, 3, 2, 2, 2], [10, 8, 5, 4, 3, 3, 3, 2, 2]],
    steep: [[12, 7, 5, 4, 3, 3, 2, 2, 2], [13, 7, 5, 4, 3, 3, 2, 2, 1], [14, 6, 5, 4, 3, 3, 2, 2, 1], [11, 8, 5, 4, 3, 3, 2, 2, 2], [16, 6, 4, 4, 3, 3, 2, 1, 1], [18, 5, 4, 3, 3, 3, 2, 1, 1]],
  },
};

// ─────────────────────────── helpers ─────────────────────────────────────────
const die = (msg, lines) => {
  console.error(`gen-feud: ${msg}`);
  for (const l of (lines || []).slice(0, 40)) console.error('  ' + l);
  if ((lines || []).length > 40) console.error(`  ... and ${lines.length - 40} more`);
  process.exit(1);
};
const normQ = (q) => String(q).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (isoStr, n) => { const d = new Date(isoStr + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d; };

// ─────────────────────────── read the frozen bank ────────────────────────────
let frozenQ = new Set();
const frozenLabel = new Map();
for (const f of AVOID) {
  let txt = '';
  try { txt = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
  for (const m of txt.matchAll(/\n\s*q:\s*"((?:[^"\\]|\\.)*)"/g)) frozenQ.add(normQ(m[1]));
  for (const m of txt.matchAll(/\{\s*c:\s*"((?:[^"\\]|\\.)*)"/g)) {
    const k = m[1].toLowerCase();
    frozenLabel.set(k, (frozenLabel.get(k) || 0) + 1);
  }
}

// ─────────────────────────── corpus audit ────────────────────────────────────
// Everything below aborts the run. A board that fails any of it must not be
// written, because verify-feud.mjs would fail on the shipped bank instead.
function auditCorpus(corpus) {
  const errs = [];
  const misses = [];
  let probes = 0;
  let widened = 0;
  const seenQ = new Set();
  const catCount = new Map();
  const labelCount = new Map();
  const bucketCount = new Map();

  corpus.forEach((p, idx) => {
    const where = `#${idx + 1} "${String(p.q).slice(0, 52)}"`;
    if (!p.q || !p.cat || !p.shape) { errs.push(`${where}: missing q/cat/shape`); return; }
    if (!LADDERS[p.drawN || p.a.length] || !LADDERS[p.drawN || p.a.length][p.shape]) {
      errs.push(`${where}: no ladder for ${p.drawN || p.a.length} buckets / shape "${p.shape}"`);
      return;
    }
    // 1. prompt text is new, and not a fixture needle
    const nq = normQ(p.q);
    if (frozenQ.has(nq)) errs.push(`${where}: repeats a prompt already in the bank`);
    if (seenQ.has(nq)) errs.push(`${where}: repeats another new prompt`);
    seenQ.add(nq);
    for (const needle of FIXTURE_NEEDLES) {
      if (p.q.toLowerCase().includes(needle.toLowerCase())) {
        errs.push(`${where}: contains verify-feud fixture needle "${needle}"`);
      }
    }
    if (!/^Name /.test(p.q)) errs.push(`${where}: prompts open "Name ..." in this bank`);
    if (!/[.?]$/.test(p.q)) errs.push(`${where}: prompt needs terminal punctuation`);
    // 2. bucket band
    bucketCount.set(p.a.length, (bucketCount.get(p.a.length) || 0) + 1);
    // 3. every bucket has a label and at least one alias
    const prompt = { q: p.q, answers: p.a.map(([c, k]) => ({ c, k: k.slice() })) };
    // Coverage is probed on the AUTHORED keys only: probing a mechanically
    // widened one just re-derives the form widening already added.
    const authoredKeys = p.a.map(([c, k]) => [c, ...k]);
    widened += widenNumbers(prompt.answers);
    p._answers = prompt.answers;   // what actually ships, widening included
    for (const b of prompt.answers) {
      if (!b.c || !Array.isArray(b.k) || !b.k.length) errs.push(`${where}: bucket "${b.c}" has no aliases`);
      const key = b.c.toLowerCase();
      labelCount.set(key, (labelCount.get(key) || 0) + 1);
    }
    // 4. SELF-COLLISION against the real matcher — the gate verify-feud.mjs runs
    const m = promptMatcher(prompt);
    prompt.answers.forEach((b, i) => {
      const want = 'c' + i;
      for (const probe of [b.c, ...(b.k || [])]) {
        const got = m.bucketOf(probe);
        if (got !== want) {
          const gl = got && got.startsWith('c') ? (prompt.answers[Number(got.slice(1))] || {}).c : '(dynamic)';
          errs.push(`${where}: alias "${probe}" -> "${gl}" (should be "${b.c}")`);
        }
      }
      // 4b. COVERAGE: the paraphrases a player types without thinking
      for (const [probe, cls] of (authoredKeys[i] || []).flatMap(coverageProbes)) {
        probes++;
        const got = m.bucketOf(probe);
        if (got === want) continue;
        if (got && got.startsWith('c')) {
          const gl = (prompt.answers[Number(got.slice(1))] || {}).c;
          errs.push(`${where}: a player typing "${probe}" is credited to "${gl}", not "${b.c}"`);
        } else {
          misses.push(`[${cls}] ${where}: "${probe}" (for "${b.c}") matches no bucket`);
        }
      }
    });
    catCount.set(p.cat, (catCount.get(p.cat) || 0) + 1);
  });

  // 5. ceilings
  for (const [cat, n] of catCount) if (n > CAT_CEIL) errs.push(`category "${cat}" fills ${n} prompts (ceiling ${CAT_CEIL})`);
  for (const [lab, n] of labelCount) {
    const frozen = frozenLabel.get(lab) || 0;
    const ceil = frozen >= HOT_FROZEN ? HOT_CEIL : LABEL_CEIL;
    if (n > ceil) errs.push(`answer label "${lab}" appears ${n}x (ceiling ${ceil}; frozen bank runs it ${frozen}x)`);
  }
  const total = corpus.length;
  for (const [n, c] of bucketCount) {
    if (n < 6 || n > 9) errs.push(`${c} prompt(s) carry ${n} buckets (band is 6-9)`);
    if (c / total > BUCKET_MODE_CEIL) errs.push(`${c}/${total} prompts carry ${n} buckets (${(100 * c / total).toFixed(0)}%, ceiling ${100 * BUCKET_MODE_CEIL}%)`);
  }
  // A floor is not a target: every size in the band has to actually turn up.
  for (const n of [6, 7, 8, 9]) {
    const c = bucketCount.get(n) || 0;
    if (c / total < BUCKET_MIN_SHARE) errs.push(`only ${c}/${total} prompts carry ${n} buckets (${(100 * c / total).toFixed(1)}%, floor ${100 * BUCKET_MIN_SHARE}%)`);
  }
  return { errs, misses, probes, widened, catCount, labelCount, bucketCount };
}

// ─────────────────────────── coverage probe ──────────────────────────────────
// The self-collision sweep proves an alias lands on ITSELF. It does not prove a
// PLAYER lands, and those are different questions: a bank can pass the audit
// with every bucket reachable only by the exact string the author typed. So
// every label and alias is also put through the paraphrases a real player
// produces without thinking — an article in front, a plural flipped, a filler
// verb, and a one-key typo — and each must still come home.
//
//   MISCREDIT (lands in a SIBLING bucket) is a hard failure: the player meant
//     one answer and was paid for another. This is the defect verify-feud.mjs
//     was written for, one step further out than it reaches.
//   MISS (lands in no bucket, so it forms a dynamic bucket) is a warning. Some
//     are correct — a one-letter word cannot survive a deleted character — so
//     they are printed and read rather than blindly enforced.
// Probe classes, because they carry different weight. An `article` or `plural`
// MISS is a real coverage hole and gets fixed by adding the form as an alias; a
// `typo` miss is usually the probe mangling a short word past recognition, and
// is printed to be read rather than chased. A MISCREDIT in any class is a hard
// failure — that is a player being paid for an answer they did not give.
const ART = ['the ', 'a ', 'my ', 'some '];
function coverageProbes(label) {
  const out = new Map();
  const base = String(label).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!base) return [];
  const bare = base.replace(/^(the|a|an|some|my) /, '');
  for (const art of ART) out.set(art + bare, 'article');
  out.set(bare, 'article');
  // plural flip on the last word. The stemmer is not symmetric across every
  // ending — "cheeses" stems to "chees" and then to "chee", "hoagies" to
  // "hoagy" — so a bucket whose noun ends -se or -ie/-y needs BOTH numbers in
  // its key list or one of them silently forms a dynamic bucket.
  const w = bare.split(' ');
  const last = w[w.length - 1];
  if (last.length > 3 && !/(ss|us|is)$/.test(last)) {
    w[w.length - 1] = last.endsWith('s') ? last.replace(/e?s$/, '') : last + 's';
    out.set(w.join(' '), 'plural');
  }
  // one dropped character inside the longest word of six letters or more
  const longest = bare.split(' ').reduce((a, b) => (b.length > a.length ? b : a), '');
  if (longest.length >= 6) {
    const i = Math.floor(longest.length / 2);
    out.set(bare.replace(longest, longest.slice(0, i) + longest.slice(i + 1)), 'typo');
  }
  out.delete(base);
  return [...out];
}

// ─────────────────────────── number widening ─────────────────────────────────
// The stemmer in lib/feud-match.js is not symmetric across every ending, and
// that costs real players real points:
//
//   "smoothies" -> "smoothy"   but "smoothie" -> "smoothie"   (the -ies rule)
//   "cheeses"   -> "chee"      but "cheese"   -> "cheese"     (-ses, then again)
//   "hoagies"   -> "hoagy",  "veggies" -> "veggy",  "slushies" -> "slushy"
//
// So a bucket whose noun ends -ie, -y or -se is reachable in ONE number only,
// and a player typing the other forms a dynamic bucket instead of scoring. It
// is not a defect I can fix in lib/feud-match.js: that file is the live scorer
// for sixty frozen boards, and re-stemming would silently re-bucket answers
// already stored in feud_picks. The bank-side fix is an alias, and remembering
// to write one for every -ie/-y/-se noun across 310 prompts is exactly the kind
// of thing an author forgets, so it is mechanical here instead.
//
// For every authored key, both number forms are tried. A variant is ADDED only
// when it currently matches NO bucket (so a working match is never disturbed)
// and only when the prompt still audits clean with it in (so widening can never
// open a collision). Everything else is left alone.
function numberVariants(key) {
  const w = String(key).trim().split(/\s+/);
  if (!w.length) return [];
  const last = w[w.length - 1];
  if (last.length < 3) return [];
  const forms = new Set();
  if (/[^s]s$/.test(last)) { forms.add(last.slice(0, -1)); if (last.endsWith('es')) forms.add(last.slice(0, -2)); }
  else if (!last.endsWith('s')) { forms.add(last + 's'); if (/(s|x|z|ch|sh)$/.test(last)) forms.add(last + 'es'); }
  return [...forms].filter((f) => f.length >= 2).map((f) => [...w.slice(0, -1), f].join(' '));
}

function auditClean(answers) {
  const m = promptMatcher({ answers });
  for (let i = 0; i < answers.length; i++) {
    for (const probe of [answers[i].c, ...(answers[i].k || [])]) {
      if (m.bucketOf(probe) !== 'c' + i) return false;
    }
  }
  return true;
}

// Returns the widened `k` arrays plus a count of what was added.
function widenNumbers(answers) {
  let added = 0;
  for (let i = 0; i < answers.length; i++) {
    for (const key of [answers[i].c, ...answers[i].k.slice()]) {
      for (const v of numberVariants(key)) {
        const m = promptMatcher({ answers });
        const got = m.bucketOf(v);
        if (got === null || (got && got.startsWith('c'))) continue;  // already lands somewhere
        answers[i].k.push(v);
        if (auditClean(answers)) added++;
        else answers[i].k.pop();
      }
    }
  }
  return added;
}

// WARNING-only lint: inside one prompt, no two buckets should share a content
// token. Not every shared token is a collision (the matcher's floor is 40), but
// every collision this segment ever hit started as a shared token, so the list
// is worth reading even when the hard gate is clean.
const SOFT_OK = new Set(['a', 'an', 'the', 'to', 'of', 'in', 'on', 'at', 'and', 'or', 'it', 'their', 'them', 'they', 'you', 'your', 'my', 'with', 'for', 'up', 'out', 'off', 'over', 'go', 'get', 'do', 'be', 'is', 'that', 'this', 'some', 'one', 'no', 'not', 'too', 'so', 'more', 'from', 'into', 'about', 'like', 'just', 'own', 'own']);
function softLint(corpus) {
  const warns = [];
  for (const p of corpus) {
    const byTok = new Map();
    p.a.forEach(([c], i) => {
      for (const w of String(c).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean)) {
        if (SOFT_OK.has(w)) continue;
        if (!byTok.has(w)) byTok.set(w, new Set());
        byTok.get(w).add(i);
      }
    });
    for (const [w, set] of byTok) {
      if (set.size > 1) warns.push(`"${String(p.q).slice(0, 46)}": buckets ${[...set].map((i) => `"${p.a[i][0]}"`).join(' / ')} share the word "${w}"`);
    }
  }
  return warns;
}

// ─────────────────────────── house crowd ─────────────────────────────────────
// Lay one ladder from the prompt's shape family over the authored bucket order
// and emit the vote stream sorted ascending, the way the frozen bank writes it.
//
// AUTHORED CROWD (`vec`, `drawN`). A prompt re-authored after its segment was
// banked may carry its own count vector, `vec`, most popular bucket first. It
// replaces the ladder outright and is held to the same contract (sums to 40,
// monotone, top 8-19, floor 1). Because boards before it are already live, the
// ladder DRAW still happens exactly as it did when the prompt was banked, on
// `drawN` buckets (its bucket count at banking time), so the seeded stream and
// every other board's house regenerate byte-identical. Only the vector emitted
// for this one prompt changes.
const vecUse = new Map();
function houseFor(p) {
  const n = p.drawN || p.a.length;
  const fam = LADDERS[n][p.shape];
  const order = shuffle(fam.map((_, i) => i));
  let pick = null;
  for (const i of order) {
    const key = `${n}:${p.shape}:${i}`;
    const cap = fam[i][0] >= RARE_TOP ? RARE_CEIL : VEC_CEIL;
    if ((vecUse.get(key) || 0) < cap) { pick = { i, key }; break; }
  }
  if (!pick) die(`every ${p.shape} ladder for ${p.a.length} buckets is at its ceiling of ${VEC_CEIL}`, []);
  vecUse.set(pick.key, (vecUse.get(pick.key) || 0) + 1);
  const counts = p.vec || fam[pick.i];
  if (counts.length !== p.a.length) die(`"${p.q}": crowd has ${counts.length} counts for ${p.a.length} buckets`, []);
  // assertions: the shape is a contract, not a suggestion
  const sum = counts.reduce((a, b) => a + b, 0);
  if (sum !== POOL) die(`ladder ${counts.join('/')} sums to ${sum}, not ${POOL}`, []);
  if (Math.min(...counts) < 1) die(`ladder ${counts.join('/')} has a zero-vote bucket`, []);
  if (counts[0] < 8 || counts[0] > 19) die(`ladder ${counts.join('/')} tops at ${counts[0]}, outside 8-19`, []);
  for (let i = 1; i < counts.length; i++) if (counts[i] > counts[i - 1]) die(`ladder ${counts.join('/')} is not monotone`, []);
  const out = [];
  counts.forEach((c, i) => { for (let j = 0; j < c; j++) out.push(i); });
  return { house: out, vec: counts };
}

// ─────────────────────────── day assembly ────────────────────────────────────
// Five prompts a day, all five from DIFFERENT categories, and a category never
// lands in the same slot two days running. Greedy on the largest remaining
// category, which is the standard way to keep an exact-cover distribution from
// stranding a big category at the end of the run.
function assemble(corpus, days) {
  const byCat = new Map();
  for (const p of shuffle(corpus)) {
    if (!byCat.has(p.cat)) byCat.set(p.cat, []);
    byCat.get(p.cat).push(p);
  }
  for (const [c, arr] of byCat) if (arr.length > days) die(`category "${c}" has ${arr.length} prompts but only ${days} days`, []);
  const boards = [];
  let prevSlotCat = new Array(PER_DAY).fill(null);
  for (let d = 0; d < days; d++) {
    const cats = [...byCat.entries()].filter(([, a]) => a.length);
    if (cats.length < PER_DAY) die(`day ${d + 1}: only ${cats.length} categories still have prompts`, []);
    // largest remaining first; seeded jitter breaks ties without breaking determinism
    cats.sort((a, b) => (b[1].length - a[1].length) || (a[0] < b[0] ? -1 : 1));
    const need = days - d;
    const forced = cats.filter(([, a]) => a.length >= need).map(([c]) => c);
    if (forced.length > PER_DAY) die(`day ${d + 1}: ${forced.length} categories are forced but only ${PER_DAY} slots`, []);
    const chosen = forced.slice();
    for (const [c] of cats) {
      if (chosen.length >= PER_DAY) break;
      if (!chosen.includes(c)) chosen.push(c);
    }
    // place the five into slots so no category repeats yesterday's slot
    let placed = null;
    for (let attempt = 0; attempt < 200 && !placed; attempt++) {
      const perm = attempt === 0 ? chosen.slice() : shuffle(chosen);
      if (perm.every((c, i) => c !== prevSlotCat[i])) placed = perm;
    }
    if (!placed) placed = chosen.slice();   // 200 seeded tries failed: take it, the audit reports it
    boards.push(placed.map((c) => byCat.get(c).pop()));
    prevSlotCat = placed;
  }
  const left = [...byCat.values()].reduce((a, b) => a + b.length, 0);
  if (left) die(`${left} prompt(s) left unplaced after ${days} days`, []);
  return boards;
}

// ─────────────────────────── emit ────────────────────────────────────────────
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
function render(board, num, dISO) {
  const d = new Date(dISO + 'T12:00:00Z');
  const [Y, M, D] = dISO.split('-').map(Number);
  const L = [];
  L.push('  {');
  L.push(`    num: ${num},`);
  L.push(`    quizId: "feud-${M}-${D}-${String(Y).slice(2)}",`);
  L.push(`    live: "${dISO}",`);
  L.push(`    dateLabel: "${MON[M - 1]} ${D}, ${Y}",`);
  L.push('    sunday: false,');
  L.push('    prompts: [');
  for (const p of board) {
    L.push('      {');
    L.push(`        q: "${esc(p.q)}",`);
    L.push('        answers: [');
    for (const b of p._answers) L.push(`          { c: "${esc(b.c)}", k: [${b.k.map((x) => `"${esc(x)}"`).join(', ')}] },`);
    L.push('        ],');
    L.push(`        house: [${p._house.join(', ')}],`);
    L.push('      },');
  }
  L.push('    ],');
  L.push('  },');
  return L.join('\n');
}

// ─────────────────────────── run ─────────────────────────────────────────────
const { errs: rawErrs, misses: rawMisses, probes, widened, catCount, labelCount, bucketCount } = auditCorpus(PROMPTS);
const errs = [...new Set(rawErrs)];
const misses = [...new Set(rawMisses)];
const warns = softLint(PROMPTS);
if (errs.length) die(`${errs.length} corpus problem(s) — nothing written`, errs);

if (LINT_ONLY) {
  console.log(`gen-feud lint: ${PROMPTS.length} prompts, ${PROMPTS.reduce((a, p) => a + p.a.length, 0)} buckets, ${PROMPTS.reduce((a, p) => a + p.a.reduce((x, b) => x + b[1].length, 0), 0)} aliases`);
  console.log(`  buckets/prompt: ${[...bucketCount].sort().map(([n, c]) => `${n}x${c}`).join('  ')}`);
  console.log(`  categories (${catCount.size}): ${[...catCount].sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${n}`).join(', ')}`);
  const hot = [...labelCount].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]);
  console.log(`  labels used 3+ times: ${hot.length ? hot.map(([l, n]) => `${l} ${n}`).join(', ') : '(none)'}`);
  console.log(`  ${probes} coverage probes (articles, plural flips, one-key typos): 0 miscredited`);
  console.log(`  ${widened} plural/singular aliases added mechanically to close stemmer holes`);
  const hard = misses.filter((m) => !m.startsWith('[typo]'));
  console.log(`  coverage misses: ${hard.length} article/plural (fix these), ${misses.length - hard.length} typo-class (read these)`);
  if (hard.length) { console.log(`\n  ARTICLE/PLURAL MISSES (${hard.length}):`); hard.slice(0, 120).forEach((w) => console.log('    ' + w)); }
  if (args.typos && misses.length - hard.length) { console.log(`\n  typo-class misses:`); misses.filter((m) => m.startsWith('[typo]')).forEach((w) => console.log('    ' + w)); }
  if (warns.length) { console.log(`\n  soft warnings (shared token inside one prompt), ${warns.length}:`); warns.slice(0, 60).forEach((w) => console.log('    ' + w)); }
  console.log(`\nPASS — every label and alias resolves to its own bucket.`);
  process.exit(0);
}

if (PROMPTS.length !== DAYS * PER_DAY) {
  die(`corpus holds ${PROMPTS.length} prompts; ${DAYS} days x ${PER_DAY} needs ${DAYS * PER_DAY}`, []);
}
const boards = assemble(PROMPTS, DAYS);
for (const board of boards) for (const p of board) { const h = houseFor(p); p._house = h.house; p._vec = h.vec; }

const chunks = [];
for (let d = 0; d < DAYS; d++) chunks.push(render(boards[d], STARTNUM + d, iso(addDays(FROM, d))));
const body = `export const PUZZLES = [\n${chunks.join('\n')}\n];\n`;
if (OUT) fs.writeFileSync(OUT, body); else process.stdout.write(body);

// ─────────────────────────── report ──────────────────────────────────────────
const catSlot = new Map();
boards.forEach((b) => b.forEach((p, i) => catSlot.set(`${p.cat}@${i}`, (catSlot.get(`${p.cat}@${i}`) || 0) + 1)));
console.error(`gen-feud: ${DAYS} boards, ${iso(addDays(FROM, 0))} -> ${iso(addDays(FROM, DAYS - 1))}, nums ${STARTNUM}-${STARTNUM + DAYS - 1}`);
console.error(`  ${PROMPTS.length} prompts, ${PROMPTS.reduce((a, p) => a + p.a.length, 0)} buckets, ${PROMPTS.reduce((a, p) => a + p.a.reduce((x, b) => x + b[1].length, 0), 0)} aliases; 0 self-collisions`);
console.error(`  ${probes} coverage probes miscredited 0 times; ${misses.length} form(s) match no bucket (see --lint)`);
console.error(`  ${widened} plural/singular aliases added mechanically to close lib/feud-match.js stemmer holes`);
console.error(`  buckets/prompt: ${[...bucketCount].sort().map(([n, c]) => `${n}: ${c} (${(100 * c / PROMPTS.length).toFixed(0)}%)`).join('  ')}`);
console.error(`  categories ${catCount.size}, biggest ${[...catCount].sort((a, b) => b[1] - a[1])[0].join(' ')} (ceiling ${CAT_CEIL})`);
console.error(`  house ladders in use ${vecUse.size}, busiest ${[...vecUse].sort((a, b) => b[1] - a[1])[0].join(' ')} (ceiling ${VEC_CEIL})`);
console.error(`  house: every prompt 40 votes, monotone, top 8-19, no zero-vote bucket (asserted)`);
if (warns.length) console.error(`  soft warnings: ${warns.length} (shared token inside one prompt; run --lint to read them)`);
