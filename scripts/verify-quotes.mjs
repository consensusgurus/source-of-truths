// Structural gate for the Quotes bank. Run after every authoring pass:
//
//   node scripts/verify-quotes.mjs
//
// The checks themselves live in scripts/mcq-gauntlet-check.mjs, shared with
// verify-script. Everything specific to this game is the five lanes below.
//
// WHAT THIS CANNOT CHECK, and what therefore stays a human job: whether the
// person named actually said the line. A quotes bank fails through popular
// misattribution rather than through structure, so every authoring pass owes
// the bank a real sourcing review as well as this run. See the header of
// scripts/quotes-source.mjs for the list of lines banned outright.
import { QUESTIONS, QUESTION_MAP } from '../app/quotes/questions.js';
import { PUZZLES } from '../app/quotes/puzzles.js';
import { checkBank, report } from './mcq-gauntlet-check.mjs';
import { checkRecycled } from './trivia-recycle.mjs';

const LANES = ['Presidents & Politics', 'History & War', 'Science, Letters & Ideas', 'Books & Authors', 'Screen Lines'];

const EXTRA = ['president', 'presidents', 'prime', 'minister', 'general', 'admiral', 'commander',
  'senator', 'philosopher', 'physicist', 'scientist', 'poet', 'novelist', 'author', 'writer',
  'historian', 'mathematician', 'economist', 'emperor', 'king', 'queen', 'told', 'said', 'says',
  'wrote', 'writes', 'asked', 'called', 'coined', 'declared', 'announced', 'warned', 'argued',
  'remarked', 'opens', 'opened', 'ends', 'british', 'american', 'french', 'german', 'roman',
  'greek', 'russian', 'italian', 'spanish', 'soviet', 'chinese', 'address', 'speech', 'inaugural',
  'congress', 'commons', 'national'];

// Rules the bank's own header states that a script can check. All are scoped to
// the boards authored from 2026-09-29 on, the first day past the launch bank, so
// the days already live stay frozen (authoring standard rule 10).
const COPY_FROM = '2026-09-29';

// "A FICTIONAL LINE IS ALWAYS ASKED AS A CHARACTER" (owner rule, in the source
// header). d03q25 predates the check and asks "which member of Project Mayhem",
// whose four choices are all characters, so it honours the rule without the
// word; it is live and frozen rather than an exception worth carving out here.
const LANE_STEM = {
  'Screen Lines': {
    re: /\bcharacters?\b/i,
    why: 'a fictional line is always asked as a character, so the stem must say so',
  },
};

// NOTHING APOCRYPHAL. The seven the source header bans outright. Asking about
// the misattribution itself is fine, which is why this fires on the ANSWER.
const BANNED = [
  { who: /marie antoinette/i, what: /\bcake\b|brioche/i, why: 'Marie Antoinette never said let them eat cake' },
  { who: /voltaire/i, what: /defend (to the death )?your right|disapprove of what you say/i, why: 'the defend-your-right line is Evelyn Beatrice Hall, not Voltaire' },
  { who: /machiavelli/i, what: /ends justify the means/i, why: 'Machiavelli never wrote that the ends justify the means' },
  { who: /einstein/i, what: /definition of insanity|same thing over and over/i, why: 'the definition-of-insanity line is not Einstein' },
  { who: /edmund burke|\bburke\b/i, what: /good men (to )?do nothing|triumph of evil/i, why: 'the good-men-do-nothing line is not traceable to Burke' },
  { who: /queen victoria|victoria/i, what: /not amused/i, why: 'we are not amused is not reliably Victoria' },
  { who: /paul revere|revere/i, what: /british are coming/i, why: 'Revere did not shout the British are coming' },
];

const r = checkBank({
  QUESTIONS, QUESTION_MAP, PUZZLES, key: 'quotes', LANES, extraTemplate: EXTRA,
  copyFrom: COPY_FROM,
  // Pool variety across the whole future window, not per day. The launch bank
  // answers Churchill 9 times in 750 questions and nothing counted; four is the
  // ceiling for everything authored from here.
  // The 4-use cap held the launch-era window (Sep 29 to Oct 17). The quoted-line
  // bank from Oct 18 runs five months, so it carries its own scaled cap below.
  answerCap: 0,
  laneStem: LANE_STEM,
  bannedPairs: BANNED,
  // A quoted line is the speaker's own words, and a British speaker keeps their
  // spelling ("spectre", "honour"). US spelling is owed by the ask and choices.
  spellText: (q) => (q.line ? q.ask : q.q),
});

// ---- THE QUOTED-LINE BANK (owner, 2026-10-17) -------------------------------
// From LINE_FROM every question puts the actual line on screen: `line` is the
// quote, `ask` is the question under it, and `q` is the two joined (gen-mcq
// builds it). Rules a script can hold:
//   - every question carries a line and an ask, and q is exactly the two joined
//   - a line is at most LINE_MAX characters and never repeats anywhere in the bank
//   - the ask never shares a distinctive word with the answer (a title character
//     named in the film, a surname in the office)
//   - pool variety: one answer at most ANSWER_CAP times across the window, and
//     never twice within ANSWER_GAP days
// What it cannot hold, and the authoring pass owes by hand: that the person said
// the line, worded as shown.
const LINE_FROM = '2026-10-18';
const LINE_MAX = 220;
const ANSWER_CAP = 20;
const ANSWER_GAP = 4;
const nrm = (x) => String(x).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const SKIP = new Set(['the', 'a', 'an', 'of', 'and', 'in', 'on', 'at', 'to', 'for', 'with', 'from', 'by', 'is', 'it', 'its', 'song', 'ode', 'poem', 'de', 'van', 'von', 'jr', 'sr', 'mr', 'mrs', 'miss', 'dr', 'sir', 'lady', 'lord', 'king', 'queen', 'saint', 'st']);
{
  const dayOf = new Map();
  for (const p of PUZZLES) if (p.live >= LINE_FROM) p.qids.forEach((id) => dayOf.set(id, { live: p.live, num: p.num }));
  const seenLine = new Map();
  const uses = new Map();
  for (const q of QUESTIONS) {
    const d = dayOf.get(q.id);
    if (!d) continue;
    if (!q.line || !q.ask) { r.errs.push(`${q.id}: from ${LINE_FROM} every question shows its line (line and ask fields)`); continue; }
    if (q.q !== `"${q.line}" ${q.ask}`) r.errs.push(`${q.id}: q is not the line and the ask joined, rebuild from source`);
    if (q.line.length > LINE_MAX) r.errs.push(`${q.id}: line is ${q.line.length} characters, over ${LINE_MAX}`);
    if (q.line.includes('"')) r.errs.push(`${q.id}: double quote inside the line`);
    if (!q.ask.trim().endsWith('?')) r.errs.push(`${q.id}: the ask does not end in a question mark`);
    const k = nrm(q.line);
    if (seenLine.has(k)) r.errs.push(`${q.id}: repeats the line of ${seenLine.get(k)}`);
    seenLine.set(k, q.id);
    const ans = q.choices[q.correct];
    const askW = new Set(nrm(q.ask).split(' '));
    // A word the ask shares with the answer is a giveaway only when no wrong
    // choice carries it too: four Bennet sisters, or Lady Macbeth among
    // Macbeth's household, leak nothing.
    const wrongW = new Set(q.choices.filter((_, i) => i !== q.correct).flatMap((c) => nrm(c).split(' ')));
    const hit = nrm(ans).split(' ').filter((w) => w.length > 2 && !SKIP.has(w) && askW.has(w) && !wrongW.has(w));
    if (hit.length) r.errs.push(`${q.id}: the ask names part of its answer ("${ans}": ${hit.join(', ')})`);
    const a = nrm(ans);
    if (!uses.has(a)) uses.set(a, []);
    uses.get(a).push({ id: q.id, num: d.num });
  }
  for (const [a, list] of uses) {
    if (list.length > ANSWER_CAP) r.errs.push(`"${a}" is the answer ${list.length} times from ${LINE_FROM}, over the ${ANSWER_CAP}-use cap`);
    const nums = list.map((x) => x.num).sort((x, y) => x - y);
    for (let i = 1; i < nums.length; i++) if (nums[i] - nums[i - 1] < ANSWER_GAP && nums[i] !== nums[i - 1]) {
      r.errs.push(`"${a}" is the answer on days ${nums[i - 1]} and ${nums[i]}, under the ${ANSWER_GAP}-day gap`);
    }
  }
}
// RECYCLED QUESTIONS (owner, 2026-10-09): scripts/trivia-recycle.mjs.
const recycle = await checkRecycled({ game: 'quotes', QUESTIONS, PUZZLES });
r.errs.push(...recycle.errs);
if (recycle.recycled) console.log(`quotes: ${recycle.recycled} recycled question(s) checked against the play snapshots`);
report(r, QUESTIONS, PUZZLES);
