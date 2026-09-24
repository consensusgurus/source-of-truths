// Verifier for the Streak bank (app/streak/questions.js + puzzles.js).
// Run after ANY bank edit: node scripts/verify-streak.mjs
// Prove the gates actually fire:  node scripts/streak-rules-selftest.mjs
//
// The rules themselves live in scripts/streak-rules.mjs, so that the selftest
// can feed them synthetic banks and watch each one go red on purpose. This file
// is the wrapper that points them at the real bank and prints the result.
//
// Proves, mechanically, over the WHOLE bank:
//   bank    - unique ids, id shape d<NN>q<NN> (widening past day 99), exactly 4
//             distinct choices, correct in 0..3, tier 1..5, cat one of the
//             eight lanes, every stem ending in a question mark, no exact
//             duplicate question text anywhere, no em dash and no curly quote
//   giveaway- no question's text contains its own correct answer whole
//             (normalized, answers of 4+ chars)
//   days    - num contiguous from 1 in date order, every day exactly 40 qids,
//             all resolving, all carrying that day's own prefix, no qid reused
//             across ANY two days, tiers running 8x1..8x5 in order, every tier
//             block covering the eight lanes in the fixed cycle, quizId and
//             dateLabel derived from the live date, dates one apart with no
//             gap, no day flagged sunday
//   spread  - per day, each correct position (A-D) at least 5 times and no run
//             of 4+ consecutive questions at one position
//
// And, ONLY over days live on or after streak-rules.mjs's COPY_FROM
// (2026-09-30), because THE PAST IS FROZEN and days 1..61 shipped before the
// 2026-09-04 bank standard:
//   US spellings        49 British forms sit in the frozen days; nothing was
//                       looking. Real titles keep their spelling via
//                       ALLOW_PROPER, matched case sensitively.
//   answer cap 4        Pool variety counted across the WHOLE new window, not
//                       per day. The frozen days answer "four" 16 times and
//                       "China" 10 times, and every per-day check they had was
//                       green throughout.
//   column shape        Exactly 10/10/10/10 a day and no column three times
//                       running. The whole-bank rule above asks for 5 of 40 and
//                       no run of 4, and a floor is not a target.
//   one answer a day    The same answer twice in a day makes the second
//                       guessable; 10 frozen days do it.
//   full giveaway       Fails a stem carrying every distinctive word of its
//                       answer in any order, not just the answer whole.
//   sports rules cap    At most ONE sports rules-type question a day on the
//                       Sports lane (owner ruling, 2026-09-23): how many
//                       players, what a play is called, which club you putt
//                       with. Classified by scripts/sports-rules-classifier.mjs,
//                       whose header documents what counts. The frozen days
//                       carry up to three.
//   no expiring facts   No "currently", "as of", "so far", "to date", "the
//                       reigning", "holds the record". Every fact is pinned to
//                       a year or an event, so no answer moves when somebody is
//                       elected, promoted, overtaken or recast.
//
// Truth of the facts themselves, and whether a tier-5 question is really hard,
// stay human (authoring-time) jobs. The near-duplicate WARNINGS below are the
// machine's best attempt at the first of those: two questions sharing an answer
// and two distinctive words are the shape of the same fact asked twice. They
// are warnings, not failures, because one director is the fair answer to many
// genuinely different questions. Read them.
import { QUESTIONS, QUESTION_MAP } from '../app/streak/questions.js';
import { PUZZLES } from '../app/streak/puzzles.js';
import { checkStreak, LANES, COPY_FROM, ANSWER_CAP } from './streak-rules.mjs';

const { errs, warns, dates } = checkStreak({ QUESTIONS, QUESTION_MAP, PUZZLES });

for (const w of warns) console.warn(`warn: ${w}`);
console.log(`streak: ${QUESTIONS.length} questions, ${PUZZLES.length} days checked (${dates[0]} to ${dates[dates.length - 1]}), ${LANES.length} lanes, copy floor ${COPY_FROM}, answer cap ${ANSWER_CAP}`);
if (errs.length) {
  for (const e of errs) console.error(`FAIL: ${e}`);
  console.error(`${errs.length} failure(s)`);
  process.exit(1);
}
console.log(`ALL OK (${warns.length} warning${warns.length === 1 ? '' : 's'})`);
