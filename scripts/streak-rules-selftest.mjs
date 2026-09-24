// scripts/streak-rules-selftest.mjs — proves the Streak bank gates FIRE.
//
//   node scripts/streak-rules-selftest.mjs
//
// A check that has never gone red has not been tested. The 2026-09-04 restock
// shipped 72 British spellings past checkers that were all green, because none
// of them was looking, and "green" is indistinguishable from "not looking"
// unless something has watched the check fail on purpose. So this feeds
// checkStreak a synthetic day sitting AT the copy floor, bends exactly one rule
// at a time, and asserts the matching message comes back.
//
// It does NOT assert the synthetic day is otherwise valid: a one-question day
// also trips the 40-qid rule, the tier ramp and the column shape, and that is
// irrelevant here. Each case only asks whether ITS gate spoke.
//
// It is named streak-rules-selftest, not verify-streak-selftest, on purpose:
// scripts/verify-all.mjs discovers checkers by the pattern verify-<game>.mjs
// and would otherwise register a game called "streak-selftest" and then report
// every other game's bank as unverified against it.
import { checkStreak, LANES, COPY_FROM } from './streak-rules.mjs';

// One well-formed tier-1 Geography question, which each case then bends.
const base = (over = {}) => ({
  id: 'd62q01', cat: LANES[0], tier: 1,
  q: 'Which country is the Great Barrier Reef off the coast of?',
  choices: ['Australia', 'Indonesia', 'Brazil', 'Kenya'],
  correct: 0, ...over,
});

const run = (questions, live = COPY_FROM, num = 62) => {
  const QUESTIONS = questions;
  const QUESTION_MAP = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
  const PUZZLES = [{
    num, quizId: `streak-${Number(live.slice(5, 7))}-${Number(live.slice(8, 10))}-${live.slice(2, 4)}`,
    live, dateLabel: 'September 30, 2026', sunday: false, qids: QUESTIONS.map((q) => q.id),
  }];
  return checkStreak({ QUESTIONS, QUESTION_MAP, PUZZLES }).errs;
};

const ids = (n) => Array.from({ length: n }, (_, i) => `d62q${String(i + 1).padStart(2, '0')}`);

// A Sports-lane question, for the sports rules-type cap (owner ruling 2026-09-23).
const sport = (id, q, a, over = {}) => base({ id, cat: 'Sports', q, choices: [a, 'W1', 'W2', 'W3'], ...over });
const RULES_A = 'How many players does a basketball team have on the court at once?';
const RULES_B = 'In tennis, what is a score of zero called?';
const HISTORY = 'Which boxer lit the Olympic cauldron at the 1996 Atlanta Games?';

const CASES = [
  {
    name: 'two sports rules-type questions on one day, at the copy floor',
    errs: () => run([sport('d62q04', RULES_A, 'Five'), sport('d62q12', RULES_B, 'Love')]),
    want: /2 sports rules-type questions \(d62q04, d62q12\), the cap is 1 a day/,
  },
  {
    name: 'one rules-type question beside a history one, which must NOT fail',
    errs: () => run([sport('d62q04', RULES_A, 'Five'), sport('d62q12', HISTORY, 'Muhammad Ali')]),
    wantNot: /sports rules-type/,
  },
  {
    name: 'a rules-type stem outside the Sports lane, which must NOT count',
    errs: () => run([sport('d62q04', RULES_A, 'Five'), base({ id: 'd62q02', cat: 'Science', q: RULES_B, choices: ['Love', 'W1', 'W2', 'W3'] })]),
    wantNot: /sports rules-type/,
  },
  {
    name: 'two rules-type questions on a FROZEN day, which must NOT fail',
    errs: () => run([sport('d01q04', RULES_A, 'Five'), sport('d01q12', RULES_B, 'Love')], '2026-07-31', 1),
    wantNot: /sports rules-type/,
  },
  {
    name: 'a British spelling in a choice, at the copy floor',
    errs: () => run([base({ choices: ['The harbour at Sydney', 'A', 'B', 'C'] })]),
    want: /British form "harbour"/,
  },
  {
    name: 'a British spelling in the stem, at the copy floor',
    errs: () => run([base({ q: 'Which travelling company plays the theatre circuit?' })]),
    want: /British form "theatre"/,
  },
  {
    name: 'a real title on the allow list, which must NOT fail',
    errs: () => run([base({ q: 'Which 2018 period comedy stars Olivia Colman as Queen Anne?', choices: ['The Favourite', 'The Duchess', 'Belle', 'Emma'] })]),
    wantNot: /British form/,
  },
  {
    name: 'an answer over the 4-use cap across the window',
    errs: () => run(ids(5).map((id, i) => base({ id, q: `Which country is landmark number ${i + 1} in?` }))),
    want: /is the answer 5 times, over the 4-use cap/,
  },
  {
    name: 'the same answer twice inside one day',
    errs: () => run([base(), base({ id: 'd62q02', q: 'Which country has Uluru at its heart?', choices: ['Australia', 'Chile', 'Namibia', 'Peru'] })]),
    want: /is the answer to both d62q01 and d62q02/,
  },
  {
    name: 'a stem whose answer moves with the calendar',
    errs: () => run([base({ q: 'Which nation currently sends the most tourists to the reef?' })]),
    want: /says "currently"/,
  },
  {
    name: 'a stem asking who holds a record',
    errs: () => run([base({ q: 'Which nation holds the record for the longest coastline survey?' })]),
    want: /asks who holds a record/,
  },
  {
    name: 'a stem carrying every distinctive word of its answer',
    errs: () => run([base({ q: 'Which reef sits off the coast of Australia and is great and barrier shaped?', choices: ['The Great Barrier Reef', 'A', 'B', 'C'] })]),
    want: /every distinctive word of its answer/,
  },
  {
    name: 'the same bend on a FROZEN day, which must NOT fail',
    errs: () => run([base({ id: 'd01q01', q: 'Which travelling company plays the theatre circuit?' })], '2026-07-31', 1),
    wantNot: /British form/,
  },
  {
    name: 'a stem that does not end in a question mark',
    errs: () => run([base({ q: 'Name the country the Great Barrier Reef lies off.' })]),
    want: /does not end in a question mark/,
  },
  {
    name: 'an em dash in reader-facing copy',
    errs: () => run([base({ q: 'Which country — the big one — owns the reef?' })]),
    want: /em dash in copy/,
  },
  {
    name: 'a lane out of the fixed cycle',
    errs: () => run([base({ cat: 'Science' })]),
    want: /slot 1 is Science, the lane cycle wants Geography/,
  },
  {
    name: 'a qid carrying the wrong day prefix',
    errs: () => run([base({ id: 'd63q01' })]),
    want: /does not carry this day's prefix d62q/,
  },
  {
    name: 'a day flagged sunday, which this game never runs',
    errs: () => {
      const QUESTIONS = [base()];
      const QUESTION_MAP = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
      return checkStreak({
        QUESTIONS, QUESTION_MAP,
        PUZZLES: [{ num: 62, quizId: 'streak-9-30-26', live: COPY_FROM, dateLabel: 'September 30, 2026', sunday: true, qids: ['d62q01'] }],
      }).errs;
    },
    want: /no day may be flagged sunday/,
  },
  {
    name: 'a dateLabel that does not match the live date',
    errs: () => {
      const QUESTIONS = [base()];
      const QUESTION_MAP = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
      return checkStreak({
        QUESTIONS, QUESTION_MAP,
        PUZZLES: [{ num: 62, quizId: 'streak-9-30-26', live: COPY_FROM, dateLabel: 'October 1, 2026', sunday: false, qids: ['d62q01'] }],
      }).errs;
    },
    want: /dateLabel "October 1, 2026" is not the live date/,
  },
  {
    name: 'a gap in the calendar',
    errs: () => {
      const QUESTIONS = [base(), base({ id: 'd63q01', q: 'Which sea lies between Italy and Croatia?', choices: ['The Adriatic', 'The Aegean', 'The Baltic', 'The Black Sea'] })];
      const QUESTION_MAP = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
      return checkStreak({
        QUESTIONS, QUESTION_MAP,
        PUZZLES: [
          { num: 62, quizId: 'streak-9-30-26', live: '2026-09-30', dateLabel: 'September 30, 2026', sunday: false, qids: ['d62q01'] },
          { num: 63, quizId: 'streak-10-2-26', live: '2026-10-02', dateLabel: 'October 2, 2026', sunday: false, qids: ['d63q01'] },
        ],
      }).errs;
    },
    want: /2026-10-02 does not follow 2026-09-30 by one day/,
  },
];

let bad = 0;
for (const c of CASES) {
  const errs = c.errs();
  const hit = errs.some((e) => (c.want || c.wantNot).test(e));
  const ok = c.want ? hit : !hit;
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'BAD '} ${c.name}`);
  if (!ok) console.log(`       errors were: ${errs.join(' | ') || '(none)'}`);
}
console.log(bad ? `\n${bad} check(s) did not behave as claimed.` : `\nEvery Streak bank gate fires when it should, and stays quiet when it should not (${CASES.length} cases).`);
process.exit(bad ? 1 : 0);
