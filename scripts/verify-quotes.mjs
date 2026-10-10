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
  answerCap: 4,
  laneStem: LANE_STEM,
  bannedPairs: BANNED,
});
// RECYCLED QUESTIONS (owner, 2026-10-09): scripts/trivia-recycle.mjs.
const recycle = await checkRecycled({ game: 'quotes', QUESTIONS, PUZZLES });
r.errs.push(...recycle.errs);
if (recycle.recycled) console.log(`quotes: ${recycle.recycled} recycled question(s) checked against the play snapshots`);
report(r, QUESTIONS, PUZZLES);
