#!/usr/bin/env node
// verify-scale-off: the 2026-10-26 ruling that takes the hidden 10-to-1 scale
// off the move-budget boards and off every display.
//
//   Barter                                    runs, then the clock
//   Parker, Junkyard, Impound, Topple, Roll, Chomp   the clock, then moves
//   Taire, Cell, Rung                         moves, then the clock
//
// A solve always ranks above a run that never solved, and the unsolved fall
// to depth exactly as before. Days before SCALE_OFF_CUTOVER keep their order.
// It also checks the display rule: no arbitrary "x/10" from scoreText, while a
// real count ("14/16" on Crux) keeps its fraction.
//
// Imports the real modules (scoreGame, buildLeaderboard, guestGameResult), so it
// cannot agree with itself while the app disagrees.
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);

const { buildLeaderboard } = await import('../lib/quiz-anon.js');
const { scoreGame, guestGameResult } = await import('../lib/daily-combined.js');
const { attemptsModeForQuizId, scoreText, rowSolved, dailyAttemptRule } = await import('../lib/daily-games.js');
const { gameStats } = await import('../lib/daily-row-stats.js');

let BAD = 0;
const fail = (m) => { console.log('  FAIL ' + m); BAD++; };
const ok = (m) => console.log('  ok   ' + m);
const eq = (label, got, want) => (JSON.stringify(got) === JSON.stringify(want) ? ok(label) : fail(`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`));

let ID = 0;
const row = (quiz, user, score, { t = 30, g = 0, prog = null } = {}) =>
  ({ id: ++ID, quiz_id: quiz, user_id: user, username: 'P' + user, anon_id: null,
     score, total: 10, correct_count: score >= 10 ? 1 : 0, time_elapsed: t,
     guesses_used: g, progress: prog, abandoned: false, created_at: '2026-10-27T12:00:00Z' });
const lbOrder = (rows) => buildLeaderboard(rows, { population: 'all', filter: 'first', limit: Infinity }).map((r) => r.username);
const sgOrder = (rows) => {
  const { players } = scoreGame(rows);
  return [...players.values()].sort((a, b) => a.rank - b.rank || String(a.username).localeCompare(String(b.username))).map((p) => p.username);
};
const both = (label, rows, want) => { eq(label + ' (per-game board)', lbOrder(rows), want); eq(label + ' (combined board)', sgOrder(rows), want); };

console.log('modes and the date gate');
eq('barter today ranks on runs', attemptsModeForQuizId('barter-10-26-26'), 'tries');
eq('barter before the cutover keeps trades', attemptsModeForQuizId('barter-10-25-26'), 'trades');
eq('parker today is clock-first', attemptsModeForQuizId('park-10-26-26'), 'timed');
eq('chomp today is clock-first', attemptsModeForQuizId('chomp-11-2-26'), 'timed');
eq('taire today is moves-first', attemptsModeForQuizId('taire-10-26-26'), 'moves');
eq('rung yesterday keeps graded', attemptsModeForQuizId('rung-10-25-26'), 'graded');
eq('crux has no attempts mode', attemptsModeForQuizId('crux-10-26-26'), null);

console.log('\nbarter: runs, then the clock');
{
  const Q = 'barter-10-27-26';
  // P1 solves on try 1 slowly; P2 fails then solves fast; P3 solves try 1 fast with more trades.
  const rows = [
    row(Q, 1, 10, { t: 92, g: 0 }),
    row(Q, 2, 0, { t: 20, g: 3 }), row(Q, 2, 10, { t: 40, g: 0 }),
    row(Q, 3, 10, { t: 35, g: 4 }),
    row(Q, 4, 0, { t: 10, g: 1 }),
  ];
  both('first-try solves by the clock, then the two-run solve, then no solve', rows, ['P3', 'P1', 'P2', 'P4']);
  // An old row on the new day, posted on the old 10-down scale, is still a solve.
  both('an old scaled score still counts as a solve', [row(Q, 1, 6, { t: 50 }), row(Q, 2, 10, { t: 60 })], ['P1', 'P2']);
}

console.log('\nparker: the clock, then moves');
{
  const Q = 'park-10-27-26';
  const rows = [
    row(Q, 1, 10, { t: 80, g: 12 }),    // perfect line, slow
    row(Q, 2, 6, { t: 40, g: 20 }),     // long line, fast
    row(Q, 3, 8, { t: 40, g: 15 }),     // same clock, fewer moves
    row(Q, 4, 0, { t: 5, g: 2 }),       // no solve
  ];
  both('fastest solve first, fewer moves break a tie, no solve last', rows, ['P3', 'P2', 'P1', 'P4']);
  // A replay that solved faster becomes the player's run.
  both('the fastest solve of the day represents the player', [row(Q, 1, 10, { t: 90, g: 12 }), row(Q, 1, 10, { t: 30, g: 14 }), row(Q, 2, 10, { t: 50, g: 12 })], ['P1', 'P2']);
}

console.log('\nchomp: only a full clear is a solve');
{
  const Q = 'chomp-10-27-26';
  both('a partial clear sits below a slower full clear', [row(Q, 1, 8, { t: 20, g: 30 }), row(Q, 2, 10, { t: 90, g: 50 })], ['P2', 'P1']);
}

console.log('\ntaire: moves, then the clock');
{
  const Q = 'taire-10-27-26';
  const rows = [
    row(Q, 1, 10, { t: 200, g: 40 }),
    row(Q, 2, 7, { t: 60, g: 52 }),
    row(Q, 3, 9, { t: 150, g: 40 }),
  ];
  both('fewest moves first, the clock breaks a tie', rows, ['P3', 'P1', 'P2']);
}

console.log('\nthe guest path mirrors the board');
{
  const Q = 'park-10-27-26';
  const regs = [
    { username: 'P1', total: 10, score: 10, timeElapsed: 50, guessesUsed: 12, progress: null, egTier: 0, tries: 1 },
    { username: 'P2', total: 10, score: 6, timeElapsed: 90, guessesUsed: 20, progress: null, egTier: 0, tries: 1 },
    { username: 'P3', total: 10, score: 0, timeElapsed: 10, guessesUsed: 3, progress: null, egTier: 2, tries: 1 },
  ];
  const game = { quizId: Q, field: regs.length, players: new Map(regs.map((p, i) => [i, p])) };
  const at = (score, t, g) => guestGameResult({ score, total: 10, time_elapsed: t, guesses_used: g, progress: null }, game,
    { tier: score > 0 ? 0 : 2, tries: 1, graded: true, trades: false, order: 'timed' }).rank;
  eq('a guest solving in 70s sits between the 50s and 90s solves', at(4, 70, 30), 2);
  eq('a guest who never solved sits below every solver', at(0, 5, 1), 3);
}

console.log('\nthe display rule');
eq('parker reads Solved, not 8/10', scoreText('park', 8, 10), 'Solved');
eq('a give-up on Ping reads Unfinished', scoreText('ping', 3, 10), 'Unfinished');
eq('Four reads Drew on a draw', scoreText('four', 4, 10), 'Drew');
eq('Garble reads points', scoreText('garble', 7, 10), '7 points');
eq('Crux keeps its real count', scoreText('crux', 14, 16), '14/16');
eq('a 25-question gauntlet keeps its count', scoreText('atlas', 17, 25), '17/25');
eq('a Parker row shows moves and the clock', gameStats({ score: 8, total: 10, guessesUsed: 14, timeElapsed: 80, tries: 2 }, 'Moves', 'park'), '14 moves · 1:20');
eq('a Barter row shows runs and the clock', gameStats({ score: 10, total: 10, guessesUsed: 2, timeElapsed: 35, tries: 3 }, 'Tries', 'barter'), '3 tries · 0:35');
eq('chomp is solved only on a full clear', [rowSolved('chomp', 8, 10), rowSolved('chomp', 10, 10)], [false, true]);
if (!/fastest solve/.test(dailyAttemptRule('park').board)) fail('parker copy does not state the clock-first rule'); else ok('parker copy states the clock-first rule');
if (!/fewest moves/.test(dailyAttemptRule('taire').board)) fail('taire copy does not state the moves-first rule'); else ok('taire copy states the moves-first rule');
if (!/then on time/.test(dailyAttemptRule('barter').board)) fail('barter copy does not state runs then time'); else ok('barter copy states runs, then time');

if (BAD) { console.log(`\nverify-scale-off: ${BAD} failure(s)`); process.exit(1); }
console.log('\nverify-scale-off: OK');
