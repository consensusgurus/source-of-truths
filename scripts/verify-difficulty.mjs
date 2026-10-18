// Checks lib/daily-difficulty.js, the weekly Easy to hard rating (owner,
// 2026-10-18). No database: synthetic rows only.
//   node scripts/verify-difficulty.mjs
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);
const { ratingWeek, rateDifficulty, tierOf, MIN_ROWS, SEED_RATINGS, withSeeds } = await import('../lib/daily-difficulty.js');
const { liveDailyKeys } = await import('../lib/daily-games.js');

let fail = 0;
const ok = (c, m) => { if (!c) { fail += 1; console.log('FAIL', m); } };

// 1. The week is the Monday-to-Sunday before today, and holds all week.
const weeks = ['2026-10-19', '2026-10-20', '2026-10-24', '2026-10-25'].map(ratingWeek);
ok(weeks.every((w) => w.start === '2026-10-12' && w.end === '2026-10-18'), 'Mon..Sun 10-19..10-25 rate off 10-12..10-18: ' + JSON.stringify(weeks));
ok(ratingWeek('2026-10-26').end === '2026-10-25', 'the next Monday moves to the new week');
ok(ratingWeek('2026-10-18').end === '2026-10-11', 'a Sunday still reads the week before it');

// 2. Ratings: a game everyone solves fast is gentler than one few finish slowly.
const live = liveDailyKeys('2026-10-18').slice(0, 25);
const w = ratingWeek('2026-10-19');
const rows = [];
const qid = (k, d) => `${k}-10-${d}-26`;
live.forEach((k, i) => {
  for (let n = 0; n < MIN_ROWS + 5; n += 1) {
    rows.push({ quiz_id: qid(k, 12 + (n % 7)), score: Math.max(0, 10 - Math.floor(i / 3)), total: 10, time_elapsed: 30 + i * 20, abandoned: false });
  }
});
// Rows outside the week and abandoned rows must not count.
rows.push({ quiz_id: qid(live[0], 11), score: 0, total: 10, time_elapsed: 9999 });
rows.push({ quiz_id: qid(live[0], 13), score: 0, total: 10, time_elapsed: 9999, abandoned: true });
const { ratings, measured } = rateDifficulty(rows, w, {});
ok(measured === live.length, 'every game with enough rows is rated: ' + measured);
ok(ratings[live[0]] === 1, 'easiest game is 1: ' + ratings[live[0]]);
ok(ratings[live[live.length - 1]] === 5, 'hardest game is 5: ' + ratings[live[live.length - 1]]);
let mono = true;
for (let i = 1; i < live.length; i += 1) if (ratings[live[i]] < ratings[live[i - 1]]) mono = false;
ok(mono, 'ratings climb with difficulty');
const counts = [1, 2, 3, 4, 5].map((r) => live.filter((k) => ratings[k] === r).length);
ok(counts.every((c) => c >= 4 && c <= 6), 'fifths are even: ' + counts.join(','));

// 3. A quiet game keeps last week's rating; an unknown one stays unrated.
const quiet = liveDailyKeys('2026-10-18').find((k) => !live.includes(k) && !SEED_RATINGS[k]);
const r2 = rateDifficulty(rows, w, { [quiet]: 4 }).ratings;
ok(r2[quiet] === 4, 'a game with too few rows keeps its previous rating');
const r3 = rateDifficulty(rows, w, {}).ratings;
ok(r3[quiet] == null, 'a game never rated stays unrated');

// 3b. A game quiet this week but with enough rows over four weeks is measured.
const q2 = liveDailyKeys('2026-10-18').filter((k) => !live.includes(k) && k !== quiet && !SEED_RATINGS[k])[0];
const wideRows = rows.slice();
for (let n = 0; n < MIN_ROWS; n += 1) wideRows.push({ quiz_id: qid(q2, 1 + (n % 9)), score: 10, total: 10, time_elapsed: 5 });
const r4 = rateDifficulty(wideRows, w, {});
ok(Number.isInteger(r4.ratings[q2]) && r4.measured === live.length + 1, 'a quiet game is measured over four weeks: ' + r4.ratings[q2]);
const tooOld = rows.concat([{ quiz_id: `${q2}-9-1-26`, score: 10, total: 10, time_elapsed: 5 }]);
ok(rateDifficulty(tooOld, w, {}).ratings[q2] == null, 'rows older than four weeks do not count');

// 3c. The owner's starting ratings fill a never-measured game, and never override a measurement.
const seeded = Object.keys(SEED_RATINGS);
const r5 = rateDifficulty([], w, {}).ratings;
ok(seeded.every((k) => !liveDailyKeys(w.end).includes(k) || r5[k] === SEED_RATINGS[k]), 'seeds fill unmeasured games');
const sk = live.find((k) => SEED_RATINGS[k]);
if (sk) ok(ratings[sk] !== undefined && rateDifficulty(rows, w, {}).ratings[sk] === ratings[sk], 'a measured game ignores its seed');
ok(withSeeds({ rung: 2 }).rung === 2 && withSeeds({}).rung === SEED_RATINGS.rung, 'withSeeds keeps stored ratings');
ok(seeded.every((k) => [1, 2, 3, 4, 5].includes(SEED_RATINGS[k])), 'seeds are 1..5');

// 4. Too few rated games rates nobody fresh.
ok(rateDifficulty(rows.slice(0, MIN_ROWS * 2 + 10), w, {}).measured === 0, 'under five games rates none');

// 5. Tiers.
ok(tierOf(1).id === 'gentle' && tierOf(2).id === 'gentle' && tierOf(3).id === 'steady' && tierOf(5).id === 'tough' && tierOf(0) === null, 'tiers');

if (fail) { console.log(`verify-difficulty: ${fail} failure(s)`); process.exit(1); }
console.log('verify-difficulty: ok');
