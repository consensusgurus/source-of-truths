// Verifier for the Redact bank (app/redact/puzzles.js). Run after ANY edit:
//   node scripts/verify-redact.mjs
// A parse is not a pass (CLAUDE-QUIZZES section 0): this gate re-derives the
// identity fields, the win targets, and the text-hygiene rules from the data.
//
// DIFFICULTY FLOOR (owner rule, 2026-08-15, after Leonardo da Vinci went in 3
// guesses and 22 seconds). Two mechanical gates, both scoped to boards going
// live on or after RAMP_FROM; everything before that is played, scored and
// frozen, and is deliberately left alone.
//
//   1. NO SKELETON LEAK. The headline renders every title word as a block of
//      its exact letter width from second one, and prints any word that rides
//      free (a FREEBIE, or under 3 letters) verbatim. So a free rider is text
//      the player is handed before the clock starts. A GENERIC connective
//      teaches nothing, but a distinctive one fingerprints the subject: the
//      da Vinci board printed '[8] da [5]' under a Person chip, which names
//      itself, and Apollo 11 printed '[6] 11', which is the identifying half
//      of the answer. Only GENERIC_FREE may ride free, and digits are banned
//      from titles outright.
//   3. NO GIVEAWAY OPENING. A tier 3 or higher board's FIRST PARAGRAPH may
//      not contain every target word of its title. For a one-word title that
//      means the word cannot appear in the opening at all; for a longer one it
//      means the opening may use the generic half (the Domesday BOOK, the
//      Bayeux TAPESTRY) but never the whole name. This is the one mechanical
//      proxy for the authoring instruction that a hard board opens one step to
//      the side, and it caught eight inherited boards that opened by naming
//      themselves and stating their own superlative. Tier 2 is exempt: an easy
//      board is allowed to say what it is about.
//   2. WEEKDAY RAMP, NO DIFF 1. Mon/Tue 2, Wed/Thu 3, Fri/Sat 4, Sun 4-5.
//      diff 1 is retired: the bank had ten of them and they were the trivial
//      days. NOTE the honest limit here, per the authoring standard's rule
//      that a verifier recomputes rather than trusts a stored field: the ramp
//      IS recomputed from the live date, but `diff` itself is an authored
//      judgment about the subject, and no gate can prove a rating was earned.
//      Measured play backs that up: the declared diff does not track real
//      play (diff-1 Eiffel Tower ran a median of 8 guesses, diff-1 Titanic
//      78), and Wikipedia pageview fame is no better a proxy (Cleopatra is
//      the most-viewed subject in the bank and took a median of 42). The
//      rating criteria are written out in app/redact/puzzles.js; keep them
//      honest by hand, and recalibrate against /api/quiz/board once the game
//      draws a bigger sample than the ~10 players a day it does now.
import { PUZZLES } from '../app/redact/puzzles.js';
import { FREEBIES, norm, tokenize, titleTargets, guessMatches } from '../app/redact/words.js';

const CATS = new Set(['Person', 'Place', 'Thing', 'Event', 'Work']);
// Boards live before this are frozen history and skip the two floor gates.
const RAMP_FROM = '2026-08-16';
// The only words that may ride free in a title. A reader learns nothing from
// them, so they cost the puzzle nothing. Everything else (da, de, di, von,
// st, roman numerals, digits) is a fingerprint and must render as a block.
const GENERIC_FREE = new Set(['the', 'a', 'an', 'of', 'and', 'in', 'on', 'at', 'to', 'for']);
// diff bounds by UTC day of week: [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
const RAMP = [[4, 5], [2, 2], [2, 2], [3, 3], [3, 3], [4, 4], [4, 4]];
let bad = 0;
const err = (n, msg) => { bad++; console.error(`  #${n}: ${msg}`); };

const seenAnswers = new Set();
let prev = null;
for (const p of PUZZLES) {
  // identity fields agree (section 7e)
  if (prev && p.num !== prev.num + 1) err(p.num, `num not contiguous after ${prev.num}`);
  const d = new Date(p.live + 'T12:00:00Z');
  const expectId = `redact-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`;
  if (p.quizId !== expectId) err(p.num, `quizId ${p.quizId} != ${expectId}`);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const expectLabel = `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  if (p.dateLabel !== expectLabel) err(p.num, `dateLabel ${p.dateLabel} != ${expectLabel}`);
  if (prev) {
    const gap = (d - new Date(prev.live + 'T12:00:00Z')) / 86400000;
    if (gap !== 1) err(p.num, `live date gap ${gap} days after #${prev.num}`);
  }
  const isSun = d.getUTCDay() === 0;
  if (!!p.sunday !== isSun) err(p.num, `sunday flag ${p.sunday} but ${p.live} is ${isSun ? '' : 'not '}a Sunday`);
  if (isSun && p.diff < 4) err(p.num, `Sunday diff ${p.diff} < 4`);

  // win targets: the words a player must uncover to win. Computed here because
  // the floor gates below reason about them.
  const targets = titleTargets(p.answer);

  // classification
  if (!CATS.has(p.cat)) err(p.num, `bad cat ${p.cat}`);
  if (!(p.diff >= 1 && p.diff <= 5)) err(p.num, `bad diff ${p.diff}`);

  if (p.live >= RAMP_FROM) {
    // FLOOR 1: the opening skeleton must not name the subject
    if (/[0-9]/.test(p.answer)) err(p.num, `digits in title '${p.answer}' ride free and leak the answer`);
    for (const tk of tokenize(p.answer)) {
      if (!tk.w) continue;
      const ridesFree = FREEBIES.has(tk.n) || tk.n.length < 3;
      if (ridesFree && !GENERIC_FREE.has(tk.n)) {
        err(p.num, `title free-rider '${tk.t}' in '${p.answer}' leaks the skeleton (not a generic connective)`);
      }
    }
    // FLOOR 3: the opening may not hand over the whole title
    if (p.diff >= 3) {
      const first = new Set(tokenize(p.text.split('\n\n')[0]).filter((t) => t.w).map((t) => t.n));
      if (targets.length && targets.every((t) => first.has(t))) {
        err(p.num, `paragraph 1 contains the whole title [${targets.join(', ')}]: a tier ${p.diff} board must open one step to the side`);
      }
    }
    // FLOOR 2: weekday ramp, and diff 1 is retired
    const [rlo, rhi] = RAMP[d.getUTCDay()];
    if (p.diff < rlo || p.diff > rhi) {
      err(p.num, `diff ${p.diff} off the ramp: ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getUTCDay()]} needs ${rlo === rhi ? rlo : rlo + '-' + rhi}`);
    }
  }

  // subject uniqueness
  const aN = norm(p.answer);
  if (seenAnswers.has(aN)) err(p.num, `duplicate answer ${p.answer}`);
  seenAnswers.add(aN);

  // text hygiene
  if (/[—–]/.test(p.text) || /[—–]/.test(p.answer)) err(p.num, 'em/en dash in copy');
  if (/[“”"]/.test(p.text)) err(p.num, 'double quotes in text');
  if (/[‘’]/.test(p.text)) err(p.num, 'smart apostrophe in text');
  const words = p.text.split(/\s+/).filter(Boolean).length;
  const [lo, hi] = p.sunday ? [250, 430] : [240, 360];
  if (words < lo || words > hi) err(p.num, `word count ${words} outside ${lo}-${hi}`);

  // win targets exist and are sane
  if (!targets.length) err(p.num, 'no title targets');
  for (const t of targets) if (t.length < 3) err(p.num, `target too short: ${t}`);

  // aka aliases must point at a title target or a word in the text, and the
  // alias itself must not be a word that already appears in the text
  const tokens = tokenize(p.text);
  const textNorms = new Set(tokens.filter((t) => t.w).map((t) => t.n));
  for (const [alias, target] of Object.entries(p.aka || {})) {
    if (norm(alias) !== alias) err(p.num, `aka key not normalized: ${alias}`);
    if (!targets.includes(target) && !textNorms.has(target)) err(p.num, `aka target ${target} not in title or text`);
    if (textNorms.has(alias)) err(p.num, `aka alias ${alias} is a real word in the text`);
    if (FREEBIES.has(alias)) err(p.num, `aka alias ${alias} is a freebie`);
  }

  // the game must not name itself
  if (textNorms.has('redact') || textNorms.has('redacted')) err(p.num, 'text contains redact');

  // informational: freebie share + title presence in body + solvable reveal
  const wordToks = tokens.filter((t) => t.w);
  const free = wordToks.filter((t) => FREEBIES.has(t.n)).length;
  const share = Math.round((free / wordToks.length) * 100);
  if (share < 25 || share > 60) err(p.num, `freebie share ${share}% out of 25-60`);
  const inBody = targets.filter((t) => wordToks.some((tk) => guessMatches(t, tk.n)));
  const skel = tokenize(p.answer).filter((t) => t.w)
    .map((t) => (FREEBIES.has(t.n) || t.n.length < 3) ? t.t : `[${t.t.length}]`).join(' ');
  console.log(`  #${String(p.num).padStart(2)} ${p.live}${p.sunday ? ' SUN' : '    '} d${p.diff} ${p.cat.padEnd(6)} ${String(words).padStart(3)}w free ${String(share).padStart(2)}% ${skel.padEnd(30)} inBody ${inBody.length}/${targets.length} · ${p.answer}`);
  prev = p;
}

// Hardcoded bank size, per the CLAUDE-QUIZZES section 7e gotcha: it is the only
// thing here that catches a board silently dropped from the array, so it must be
// bumped in the SAME commit that extends the bank. 60 -> 117 on 2026-09-06, when
// scripts/gen-redact.mjs added 2026-10-05..2026-11-30.
const BANK_SIZE = 117;
if (PUZZLES.length !== BANK_SIZE) { bad++; console.error(`bank size ${PUZZLES.length} != ${BANK_SIZE}`); }
if (bad) { console.error(`\nFAIL: ${bad} problems`); process.exit(1); }
console.log('\nverify-redact: PASS');
