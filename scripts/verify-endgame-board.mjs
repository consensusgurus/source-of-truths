#!/usr/bin/env node
// verify-endgame-board — the attempts-to-solve ranking (owner, 2026-08-12, plus
// the graded mode of 2026-08-26).
//
// The six End Game titles rank on how many RUNS a puzzle took, not on the first
// attempt every other daily keeps. That order lives in one shared function
// (endGamePlan in lib/daily-games) read by both scoring mirrors, and this checks
// the whole path end to end:
//
//   1. the roster is the End Game titles, and Babel is not one of them
//   2. tiers: any solver beats any drawer beats anyone who never finished
//   3. among solvers, fewer attempts wins, and the SOLVING run's clock breaks ties
//   4. the unsolved rank on depth, never on how few times they tried
//   5. every other game sorts byte-identically to the pre-change engine
//   6. the change is ORDER ONLY: a late solve is worth the same completion, and
//      so the same IQ Points, as a first-try one
//   7. GRADED mode: the five efficiency games (Barter, Chomp, Parker, Rung,
//      Taire) rank on score first and attempts second, the zero-score cohort is
//      not ranked on attempts, the date gate leaves every pre-cutover day alone,
//      and the binary mode is unchanged by any of it
//
// It IMPORTS the real modules rather than restating their logic, so it cannot
// drift from what it certifies. That needs the '@/' alias and extensionless
// relative imports resolved, which is what alias-loader.mjs is for, and the
// imports below are dynamic because the hook must be registered first.
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);

const { buildLeaderboard } = await import('../lib/quiz-anon.js');
const { scoreGame } = await import('../lib/daily-combined.js');
const { endGamePlan, isEndGameQuizId, isEndGame } = await import('../lib/daily-games.js');

let BAD = 0;
const fail = (m) => { console.log('  FAIL ' + m); BAD++; };
const ok = (m) => console.log('  ok   ' + m);

// ---- 1. the roster is what we think it is -----------------------------------
const EG = ['mate', 'four', 'check', 'chain', 'turn', 'yose', 'defend', 'queen'];
console.log('roster');
for (const k of EG) if (!isEndGame(k)) fail(`${k} is not End Game`);
if (isEndGame('babel')) fail('babel is still End Game'); else ok('babel is out of End Game');
if (!isEndGameQuizId('four-8-12-26')) fail('four quiz id not detected');
if (isEndGameQuizId('babel-8-12-26')) fail('babel quiz id still detected'); else ok('quiz-id predicate matches the roster');
if (isEndGameQuizId('crux-8-12-26')) fail('crux detected as End Game');

// ---- row helpers ------------------------------------------------------------
let ID = 0;
const row = (quiz, user, score, { t = 30, prog = null, ab = false } = {}) =>
  ({ id: ++ID, quiz_id: quiz, user_id: user, username: 'P' + user, anon_id: null,
     score, total: 10, correct_count: score >= 10 ? 1 : 0, time_elapsed: t,
     guesses_used: 0, progress: prog, abandoned: ab, created_at: '2026-08-12T12:00:00Z' });

const orderOf = (rows) => buildLeaderboard(rows, { population: 'all', filter: 'first', limit: Infinity }).map((r) => r.username);
const orderOfScore = (rows) => {
  const { players } = scoreGame(rows);
  return [...players.values()].sort((a, b) => a.rank - b.rank || String(a.username).localeCompare(String(b.username))).map((p) => p.username);
};

// ---- 2/3. tiers and attempts ------------------------------------------------
console.log('\ntiers and attempts');
{
  const Q = 'four-8-12-26';
  const rows = [
    // A: solves on try 1, slow.                       -> tier 0, tries 1
    row(Q, 'A', 10, { t: 300 }),
    // B: loses twice then solves on try 3, fast.      -> tier 0, tries 3
    row(Q, 'B', 0, { t: 5, prog: 2 }), row(Q, 'B', 0, { t: 5, prog: 3 }), row(Q, 'B', 10, { t: 9 }),
    // C: solves on try 2.                             -> tier 0, tries 2
    row(Q, 'C', 0, { t: 5, prog: 1 }), row(Q, 'C', 10, { t: 60 }),
    // D: draws on try 1 and stops.                    -> tier 1, tries 1
    row(Q, 'D', 4, { t: 20 }),
    // E: never solves, got deepest.                   -> tier 2, progress 7
    row(Q, 'E', 0, { t: 8, prog: 7 }),
    // F: never solves, gave up once immediately.      -> tier 2, progress 1
    row(Q, 'F', 0, { t: 2, prog: 1 }),
  ];
  const want = ['PA', 'PC', 'PB', 'PD', 'PE', 'PF'];
  const got = orderOf(rows);
  if (JSON.stringify(got) !== JSON.stringify(want)) fail(`order ${got} != ${want}`);
  else ok('solver(1) < solver(2) < solver(3) < drawer < deep loss < shallow loss');

  const got2 = orderOfScore(rows);
  if (JSON.stringify(got2) !== JSON.stringify(want)) fail(`scoreGame order ${got2} != ${want}`);
  else ok('scoreGame agrees with buildLeaderboard');

  // The representative row is the WINNING run, so the reported clock is its own.
  const lb = buildLeaderboard(rows, { population: 'all', filter: 'first', limit: Infinity });
  const b = lb.find((r) => r.username === 'PB');
  if (b.timeElapsed !== 9) fail(`B reported time ${b.timeElapsed}, want the winning run's 9`);
  else ok("a solver's reported clock is the run they won on, not their first");
  if (b.tries !== 3) fail(`B tries ${b.tries}`); else ok('tries counts every run, wins and losses alike');
  if (b.score !== 10) fail(`B score ${b.score}`); else ok('a late solve still posts the full score');
}

// ---- 3b. equal attempts break on the solving run's clock ---------------------
{
  const Q = 'mate-8-12-26';
  const rows = [
    row(Q, 'S', 0, { t: 1, prog: 1 }), row(Q, 'S', 10, { t: 40 }),  // slow win on try 2
    row(Q, 'F', 0, { t: 90, prog: 1 }), row(Q, 'F', 10, { t: 12 }), // fast win on try 2
  ];
  const got = orderOf(rows);
  if (JSON.stringify(got) !== JSON.stringify(['PF', 'PS'])) fail(`clock tiebreak ${got}`);
  else ok('equal attempts break on the winning run, ignoring failed-run time');
}

// ---- 4. attempts must NOT reorder the unsolved -------------------------------
{
  const Q = 'turn-8-12-26';
  const quitter = [row(Q, 'Q', 0, { t: 3, prog: 2 })];                       // 1 try, shallow
  const fighter = [1,2,3,4,5].map(() => row(Q, 'G', 0, { t: 30, prog: 6 })); // 5 tries, deep
  const got = orderOf([...quitter, ...fighter]);
  if (got[0] !== 'PG') fail(`giving up once outranked fighting through five: ${got}`);
  else ok('the unsolved rank on depth, never on how few times they tried');
}

// ---- 5. no other game moves --------------------------------------------------
console.log('\nno other game moves');
{
  // A pseudo-random field on a NON End Game id, sorted by the new engine, must
  // match the old engine's order exactly. The old order is recomputed here from
  // the pre-change comparator (score, then guesses, then time).
  let seed = 7; const rnd = (n) => (seed = (seed * 1103515245 + 12345) % 2147483648) % n;
  let mismatched = 0;
  for (let trial = 0; trial < 400; trial++) {
    ID = 0;
    const Q = ['crux-8-12-26', 'suds-8-12-26', 'babel-8-12-26', 'listed-8-12-26'][trial % 4];
    const rows = [];
    for (let u = 0; u < 8; u++) {
      const n = 1 + rnd(3);
      for (let a = 0; a < n; a++) rows.push(row(Q, String.fromCharCode(65 + u), rnd(11), { t: 1 + rnd(200) }));
    }
    const got = orderOf(rows);
    // Old engine: first row per player, then score desc, guesses asc, time asc.
    const firstBy = new Map();
    for (const r of rows.slice().sort((a, b) => a.id - b.id)) if (!firstBy.has(r.user_id)) firstBy.set(r.user_id, r);
    const want = [...firstBy.values()]
      .sort((a, b) => b.score - a.score || ((a.guesses_used ?? 1e9) - (b.guesses_used ?? 1e9))
        || ((a.time_elapsed ?? 0) - (b.time_elapsed ?? 0)) || String(a.username).localeCompare(String(b.username)))
      .map((r) => r.username);
    if (JSON.stringify(got) !== JSON.stringify(want)) { mismatched++; if (mismatched === 1) console.log('   first mismatch', got, want); }
  }
  if (mismatched) fail(`${mismatched}/400 non-End-Game fields reordered`);
  else ok('400 random non-End-Game fields sort byte-identically to the old engine');
}

// ---- 6. scoring is order-only -------------------------------------------------
console.log('\nscoring is order only');
{
  const Q = 'check-8-12-26';
  const rows = [row(Q, 'A', 10, { t: 20 }),
                row(Q, 'B', 0, { t: 5, prog: 1 }), row(Q, 'B', 0, { t: 5, prog: 1 }), row(Q, 'B', 10, { t: 20 })];
  const { players } = scoreGame(rows);
  const A = [...players.values()].find((p) => p.username === 'PA');
  const B = [...players.values()].find((p) => p.username === 'PB');
  if (A.completion !== B.completion) fail(`completion differs: ${A.completion} vs ${B.completion}`);
  else ok('a solve on try 3 earns the same completion (and so the same IQ) as try 1');
  if (!(A.placement > B.placement)) fail('placement did not separate them');
  else ok('placement is what the attempt count moves');
  if (A.tries !== 1 || B.tries !== 3) fail(`tries carried through wrong: ${A.tries}/${B.tries}`);
  else ok('tries reaches the board payload');
  // Tie groups must not average two runs the comparator separated.
  if (A.rank === B.rank) fail('different attempt counts shared a rank');
  else ok('different attempt counts do not share an averaged rank');
}

// ---- 7. plan internals --------------------------------------------------------
console.log('\nplan');
{
  const Q = 'four-8-12-26';
  // Draw on try 1, win on try 3: a 3-try SOLVER, not a drawer.
  const rows = [row(Q, 'X', 4, { t: 10 }), row(Q, 'X', 0, { t: 10, prog: 2 }), row(Q, 'X', 10, { t: 10 })];
  const plan = endGamePlan(rows);
  const chosen = rows.filter((r) => plan.chosen.has(r));
  if (chosen.length !== 1) fail(`chosen ${chosen.length} rows for one player`);
  else if (plan.info.get(chosen[0]).tier !== 0 || plan.info.get(chosen[0]).tries !== 3)
    fail(`drew then won read as ${JSON.stringify(plan.info.get(chosen[0]))}`);
  else ok('a player who drew then won is a 3-try solver, not a drawer');
  if (plan.info.size !== rows.length) fail('info does not cover every row');
  else ok('info covers every row, so the all-attempts view still sorts');
}


// ═══════════════════════════════════════════════════════════════════════════
// GRADED ATTEMPTS (owner, 2026-08-26). Five games with the End Game structure
// and no End Game category: Barter, Chomp, Parker, Rung and Taire. Their score
// is a SCALE rather than a verdict, so score leads and attempts are the tiebreak
// that used to be dead. Everything below proves the graded mode on top of the
// binary one, and proves the binary one did not move.
// ═══════════════════════════════════════════════════════════════════════════
const { attemptsMode, attemptsModeForQuizId, attemptsPlan, attemptsRanker, dailyAttemptRule, wantsFastRetry } =
  await import('../lib/daily-games.js');
const { guestGameResult } = await import('../lib/daily-combined.js');

const GRADED = ['chomp', 'park', 'rung', 'taire'];
// TRADES (owner, 2026-09-02): Barter left the graded roster for the attempts-first
// one. Its score IS its trades (10 - 2 x trades over par, floored at 1), so score
// and trades are one quantity and trades is the finer of the two; score therefore
// drops out as a term instead of leading. Unlike 'graded' this is UNGATED and
// applies to all history, which was the owner's explicit call that day.
const TRADES = ['barter'];
const ATTEMPTS = [...GRADED, ...TRADES];

console.log('\ngraded roster');
for (const k of EG) if (attemptsMode(k) !== 'binary') fail(`${k} is not binary`);
ok('every End Game title reports mode binary');
for (const k of GRADED) if (attemptsMode(k) !== 'graded') fail(`${k} is not graded`);
ok('the four graded games report mode graded');
for (const k of TRADES) if (attemptsMode(k) !== 'trades') fail(`${k} is not trades`);
ok('barter reports mode trades');
for (const k of ['crux', 'suds', 'lode', 'blocks', 'babel']) if (attemptsMode(k)) fail(`${k} ranks on attempts`);
ok('no other game ranks on attempts (babel and the arcade pair included)');
for (const k of ATTEMPTS) if (!wantsFastRetry(k)) fail(`${k} does not offer the fast retry`);
ok('an attempts game offers the fast-retry panel, because a replay there counts');
for (const k of ATTEMPTS) if (dailyAttemptRule(k).chip !== 'Replays count') fail(`${k} copy still says ${dailyAttemptRule(k).chip}`);
ok('the replay control on an attempts game says replays count');
// The board copy must state the rule the board actually runs, not the graded one.
if (!/how few runs/.test(dailyAttemptRule('barter').board)) fail('barter board copy still states the graded rule');
else ok('barter copy states the attempts-first rule, not the graded one');

console.log('\nthe date gate');
if (attemptsModeForQuizId('chomp-8-26-26') !== 'graded') fail('chomp on the cutover is not graded');
else ok('a graded day on the cutover uses the new rule');
if (attemptsModeForQuizId('chomp-9-2-26') !== 'graded') fail('chomp after the cutover is not graded');
if (attemptsModeForQuizId('chomp-8-25-26') !== null) fail('a pre-cutover chomp day was re-ranked');
else ok('a graded day BEFORE the cutover keeps its first-attempt order and its crown');
// TRADES IS UNGATED BY CONSTRUCTION (owner, 2026-09-02): the cutover test reads
// `mode === 'graded'`, so every archived Barter day re-ranks on its next read and
// crowns move with it. That was the owner's call, not an oversight.
for (const id of ['barter-8-26-26', 'barter-9-2-26', 'barter-8-25-26', 'barter-6-1-26'])
  if (attemptsModeForQuizId(id) !== 'trades') fail(`${id} is not trades`);
ok('every barter day reads as trades, back through the whole archive');
if (attemptsModeForQuizId('rung-7-1-26') !== null) fail('a pre-cutover rung day was re-ranked');
if (attemptsModeForQuizId('mate-1-2-26') !== 'binary') fail('End Game was gated by the graded cutover');
else ok('End Game is NOT gated: its rule went live 2026-08-12 and every day since ran under it');
if (attemptsModeForQuizId('crux-9-9-26')) fail('crux picked up a mode');

// ---- graded ordering ---------------------------------------------------------
// The graded board deliberately has NO progress values: only End Game posts that
// field, so a graded zero falls to guesses and then the clock, exactly as it did
// before this rule existed.
const grow = (quiz, user, score, { t = 30, g = 0, ab = false } = {}) =>
  ({ id: ++ID, quiz_id: quiz, user_id: user, username: 'P' + user, anon_id: null,
     score, total: 10, correct_count: score > 0 ? 1 : 0, time_elapsed: t,
     guesses_used: g, progress: null, abandoned: ab, created_at: '2026-08-26T12:00:00Z' });

console.log('\ngraded ordering');
{
  const Q = 'rung-8-26-26';
  const rows = [
    grow(Q, 'A', 10, { t: 300 }),                            // perfect, try 1, slow
    grow(Q, 'B', 6, { t: 20 }), grow(Q, 'B', 10, { t: 20 }), // perfect, try 2, fast
    grow(Q, 'C', 8, { t: 10 }),                              // par+1, try 1, fastest
  ];
  const order = orderOf(rows);
  if (order.join() !== 'PA,PB,PC') fail(`graded order came out ${order.join()}`);
  else ok('score leads, then attempts, then the clock: a slow first-try perfect beats a fast second-try one');
  if (orderOfScore(rows).join() !== order.join()) fail('the two mirrors disagree on a graded board');
  else ok('scoreGame and buildLeaderboard agree on the graded order');
}
{
  const Q = 'rung-8-27-26';
  // The best run represents the player, whatever attempt it landed on, and a
  // dead heat keeps the EARLIER one so replaying to the same result gains
  // nothing.
  const rows = [grow(Q, 'A', 8, { t: 40 }), grow(Q, 'A', 10, { t: 90 }), grow(Q, 'A', 10, { t: 5 })];
  const plan = attemptsPlan(rows, 'graded');
  const chosen = rows.filter((r) => plan.chosen.has(r));
  if (chosen.length !== 1) fail(`chosen ${chosen.length} rows for one player`);
  else if (chosen[0] !== rows[1]) fail('the chosen run is not the first of the two best');
  else if (plan.info.get(chosen[0]).tries !== 2) fail(`tries read ${plan.info.get(chosen[0]).tries}`);
  else ok('the best run represents the player, and a dead heat keeps the earlier one');
  if (plan.info.size !== rows.length) fail('graded info does not cover every row');
  else ok('graded info covers every row, so the all-attempts view still sorts');
  for (const r of rows) if (plan.info.get(r).graded !== true) fail('a graded row is not flagged graded');
  ok('every graded verdict carries the flag the guest path branches on');
}
{
  // NOBODY WHO SCORED ZERO IS RANKED ON ATTEMPTS. Fewest-first there would put
  // the player who gave up once above the one who fought through five, which is
  // the same reason End Game exempts its tier 2.
  const Q = 'taire-8-27-26';
  const quit = [grow(Q, 'Q', 0, { t: 8, g: 40 })];
  const fought = [1, 2, 3, 4, 5].map(() => grow(Q, 'F', 0, { t: 60, g: 12 }));
  const order = orderOf([...quit, ...fought]);
  if (order[0] !== 'PF') fail(`a one-run quitter (${order.join()}) outranked a five-run fighter`);
  else ok('the zero-score cohort ranks on depth, never on how few times they tried');
}
{
  // A graded tier only says finished-or-not, so it must never be allowed to
  // flatten the scale the way the binary tier legitimately does.
  const Q = 'chomp-8-27-26';
  const rows = [grow(Q, 'A', 2, { t: 10 }), grow(Q, 'B', 9, { t: 10 }), grow(Q, 'B', 9, { t: 10 })];
  const order = orderOf(rows);
  if (order[0] !== 'PB') fail(`a 2/10 on try 1 outranked a 9/10 on try 2: ${order.join()}`);
  else ok('score beats attempts: a better run on try 2 outranks a worse one on try 1');
}

// ---- trades ordering ---------------------------------------------------------
// ATTEMPTS FIRST. Finished-or-not, then runs, then trades, then the clock.
console.log('\ntrades ordering');
{
  const Q = 'barter-9-2-26';
  const rows = [
    grow(Q, 'A', 1, { t: 300, g: 9 }),                        // solved try 1, at the floor, slowest
    grow(Q, 'B', 0, { t: 20, g: 40 }), grow(Q, 'B', 10, { t: 5, g: 0 }), // perfect, but on try 2
    grow(Q, 'C', 10, { t: 10, g: 0 }),                        // perfect try 1, fast
  ];
  const order = orderOf(rows);
  if (order.join() !== 'PC,PA,PB') fail(`trades order came out ${order.join()}`);
  else ok('a first-try solve beats every replay, whatever it scored');
  if (orderOfScore(rows).join() !== order.join()) fail('the two mirrors disagree on a trades board');
  else ok('scoreGame and buildLeaderboard agree on the trades order');
}
{
  // Two first-try solvers separate on TRADES, which is the finer quantity: both
  // can be pinned to the score floor of 1 and still differ.
  const Q = 'barter-9-2-26';
  const rows = [grow(Q, 'A', 1, { t: 10, g: 9 }), grow(Q, 'B', 1, { t: 90, g: 4 })];
  if (orderOf(rows)[0] !== 'PB') fail('two floored first-try solvers did not separate on trades');
  else ok('trades break the tie among equal-attempt solvers, below the score floor');
}
{
  // A player who never solved sits BELOW every solver and is never ranked on
  // attempts: fewest-first there would put a one-and-quit above a five-run fight.
  const Q = 'barter-9-2-26';
  const quit = [grow(Q, 'Q', 0, { t: 8, g: 40 })];
  const fought = [1, 2, 3, 4, 5].map(() => grow(Q, 'F', 0, { t: 60, g: 12 }));
  const solver = [grow(Q, 'S', 1, { t: 999, g: 60 }), grow(Q, 'S', 1, { t: 999, g: 60 }),
                  grow(Q, 'S', 1, { t: 999, g: 60 }), grow(Q, 'S', 1, { t: 999, g: 60 })];
  const order = orderOf([...quit, ...fought, ...solver]);
  if (order[0] !== 'PS') fail(`an unsolved run outranked a four-try solver: ${order.join()}`);
  else ok('every solver sits above every non-solver, however many runs it took');
  if (order[1] !== 'PF') fail(`a one-run quitter (${order.join()}) outranked a five-run fighter`);
  else ok('the unsolved cohort ranks on depth, never on how few times they tried');
}
{
  // The EARLIEST finished run represents the player: attempts lead, so no later
  // run can improve their standing, even a perfect one.
  const Q = 'barter-9-2-26';
  const rows = [grow(Q, 'A', 4, { t: 40, g: 3 }), grow(Q, 'A', 10, { t: 5, g: 0 })];
  const plan = attemptsPlan(rows, 'trades');
  const chosen = rows.filter((r) => plan.chosen.has(r));
  if (chosen.length !== 1) fail(`chosen ${chosen.length} rows for one player`);
  else if (chosen[0] !== rows[0]) fail('a later, better-scoring run displaced the first solve');
  else ok('the earliest finished run represents the player, because attempts lead');
  for (const r of rows) if (plan.info.get(r).trades !== true) fail('a trades row is not flagged trades');
  ok('every trades verdict carries the flag the guest path branches on');
  // The graded flag stays TRUE on a trades board on purpose, so every other
  // reader that keys off .graded keeps working; only the ORDER of the two
  // branches keeps them apart.
  for (const r of rows) if (plan.info.get(r).graded !== true) fail('a trades row lost the graded flag');
  ok('a trades row still carries graded, so no other reader of the flag moves');
  // A player who never finished is represented by the run that got FURTHEST.
  const un = [grow(Q, 'U', 0, { t: 5, g: 2 }), grow(Q, 'U', 0, { t: 60, g: 20 })];
  un[0].progress = 1; un[1].progress = 4;
  const p2 = attemptsPlan(un, 'trades');
  if (!p2.chosen.has(un[1])) fail('a non-solver was not represented by their deepest run');
  else ok('a non-solver is represented by the run that got furthest, as tier 2 is');
}
{
  // The guest path holds a hand copy of the comparator and has to mirror it.
  const Q = 'barter-9-2-26';
  const regs = [
    { username: 'P1', total: 10, score: 10, timeElapsed: 50, guessesUsed: 0, progress: null, egTier: 0, tries: 1 },
    { username: 'P2', total: 10, score: 1, timeElapsed: 20, guessesUsed: 9, progress: null, egTier: 0, tries: 2 },
    { username: 'P3', total: 10, score: 0, timeElapsed: 10, guessesUsed: 30, progress: null, egTier: 2, tries: 1 },
  ];
  const game = { quizId: Q, field: regs.length, players: new Map(regs.map((p, i) => [i, p])) };
  const at = (score, tries, g = 0) => guestGameResult(
    { score, total: 10, time_elapsed: 30, guesses_used: g, progress: null },
    game, { tier: score > 0 ? 0 : 2, tries, graded: true, trades: true }).rank;
  if (at(1, 1, 9) !== 2) fail(`a floored first-try solve was placed #${at(1, 1, 9)}, expected #2`);
  else ok('a trades guest is placed by attempts first, not by score');
  if (at(10, 3, 0) !== 3) fail(`a perfect third run was placed #${at(10, 3, 0)}, expected #3`);
  else ok('a trades guest never jumps a first-try solver by scoring better');
  if (at(0, 1, 0) !== 4) fail(`a non-solver was placed #${at(0, 1, 0)}, expected #4`);
  else ok('a non-solver guest sits below every solver on a trades board');
}

// ---- the binary rule did not move -------------------------------------------
console.log('\nbinary is unchanged');
{
  const Q = 'mate-8-26-26';
  const rows = [row(Q, 'A', 10, { t: 90 }),                                    // solved try 1
                row(Q, 'B', 0, { t: 5, prog: 3 }), row(Q, 'B', 10, { t: 5 }),  // solved try 2
                row(Q, 'C', 0, { t: 5, prog: 9 }),                             // deep loss
                row(Q, 'D', 0, { t: 2, prog: 0 })];                            // fast shallow loss
  const order = orderOf(rows);
  if (order.join() !== 'PA,PB,PC,PD') fail(`binary order came out ${order.join()}`);
  else ok('solver by attempts, then the unsolved by depth, exactly as before');
  const plan = attemptsPlan(rows, 'binary');
  const eg = rows.filter((r) => plan.chosen.has(r));
  if (eg.length !== 4) fail(`binary plan chose ${eg.length} rows for 4 players`);
  else ok('the binary plan still picks one run per player');
}
{
  // Every ordinary game sorts byte-identically to a plain score/guesses/clock
  // reference, which is what "no other board is reordered" means.
  const Q = 'crux-8-26-26';
  const rows = [];
  for (let i = 0; i < 40; i++) rows.push(grow(Q, String.fromCharCode(97 + i), (i * 7) % 11, { t: (i * 13) % 97, g: (i * 5) % 9 }));
  const ref = rows.slice().sort((a, b) => (b.score - a.score) || (a.guesses_used - b.guesses_used)
    || (a.time_elapsed - b.time_elapsed) || String(a.username).localeCompare(String(b.username)))
    .map((r) => r.username);
  if (orderOf(rows).join() !== ref.join()) fail('an ordinary board was reordered');
  else ok('an ordinary board sorts byte-identically to the pre-change engine');
}

// ---- the guest is placed by the same rule ------------------------------------
console.log('\nthe guest path');
{
  // guestGameResult holds a hand-rolled copy of the comparator (it sees one row,
  // not a field), so it has to be checked against the board it is quoting.
  const Q = 'rung-8-26-26';
  const regs = [
    { username: 'P1', total: 10, score: 10, timeElapsed: 50, guessesUsed: 0, progress: null, egTier: 0, tries: 1 },
    { username: 'P2', total: 10, score: 10, timeElapsed: 20, guessesUsed: 0, progress: null, egTier: 0, tries: 3 },
    { username: 'P3', total: 10, score: 6, timeElapsed: 10, guessesUsed: 2, progress: null, egTier: 0, tries: 1 },
  ];
  const game = { quizId: Q, field: regs.length, players: new Map(regs.map((p, i) => [i, p])) };
  const at = (score, tries) => guestGameResult(
    { score, total: 10, time_elapsed: 30, guesses_used: 0, progress: null },
    game, { tier: score > 0 ? 0 : 2, tries, graded: true }).rank;
  if (at(10, 2) !== 2) fail(`a 10 on try 2 was placed #${at(10, 2)}, expected #2`);
  else ok('a graded guest is placed by score first, then attempts');
  if (at(8, 1) !== 3) fail(`an 8 on try 1 was placed #${at(8, 1)}, expected #3`);
  else ok('a graded guest never jumps a better score by having fewer attempts');
  if (at(10, 1) !== 1) fail(`a 10 on try 1 was placed #${at(10, 1)}`);
  else ok('a first-try perfect tops the graded field');
}

console.log(BAD ? `\n${BAD} FAILURE(S)` : '\nAttempts boards verified (binary + graded + trades).');
process.exit(BAD ? 1 : 0);
