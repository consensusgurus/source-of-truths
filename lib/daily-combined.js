// Unified daily leaderboard scoring (2026-07-16, owner design with Marshall).
//
// The problem: the ten daily games (crux, garble, links, span, dating, tally,
// suds, circa, extra, carve) each score on their own scale, and a hard puzzle
// day is not comparable to an easy one. Raw scores cannot be summed fairly.
//
// The fix: score every game on the SAME 15-point scale, split into two halves:
//   completion = 5 * (score / total)          -> absolute: how much you got right
//   placement  = 10 * (N - avgPos) / (N - 1)   -> relative: where you finished in
//                                                 that game's field for the day
// A player's DAILY total is the sum of their BEST N game scores: best 25 from the
// 2026-07-27 slate onward (375 ceiling), best 10 for 2026-07-24..26 (150 ceiling),
// best 5 on earlier days (75 ceiling), so historical boards never recompute. When
// the slate has fewer than N games every game counts. Diehards drop their weakest; skipping a game
// earns 0 for it; playing fewer than N just leaves empty slots at 0.
//
// Placement is field-relative on purpose: 1st of 5 and 1st of 500 both earn 10,
// last earns 0, and the day's difficulty is absorbed because everyone faced the
// same puzzle. Eligibility: all traceable players (registered + anonymous guests)
// compete in the same pool. Public leaderboards show only named (registered)
// players, but guests' ranks reflect the full field and guests see their own
// real standing.

export const COMPLETION_MAX = 5;
export const PLACEMENT_MAX = 10;
export const GAME_MAX = COMPLETION_MAX + PLACEMENT_MAX; // 15
export const BEST_N = 25;                               // current: best 25 of the day's games (from 2026-07-27)
export const BEST_N_PRIOR = 5;                          // original scale: best 5 (before 2026-07-24)
export const BEST_N_MID = 10;                           // interim scale: best 10 (2026-07-24..07-26)
export const DAILY_MAX = BEST_N * GAME_MAX;             // 375

// Best-N has risen in date-gated steps so past boards never recompute. `suffix` is a
// daily quizId date tag "M-D-YY" (e.g. "7-24-26"); unknown/absent -> current scale.
//   before 2026-07-24 -> best 5  (75 max)
//   2026-07-24..07-26 -> best 10 (150 max)
//   2026-07-27 onward -> best 25 (375 max)
export const BESTN_CUTOVER = { y: 2026, m: 7, d: 24 };   // 5 -> 10
export const BESTN_CUTOVER_2 = { y: 2026, m: 7, d: 27 }; // 10 -> 25
function suffixOnOrAfter(y, mo, da, c) {
  return y > c.y || (y === c.y && (mo > c.m || (mo === c.m && da >= c.d)));
}
export function bestNForSuffix(suffix) {
  const mm = /^(\d+)-(\d+)-(\d+)$/.exec(String(suffix || ''));
  if (!mm) return BEST_N;
  const mo = +mm[1], da = +mm[2], y = 2000 + +mm[3];
  if (suffixOnOrAfter(y, mo, da, BESTN_CUTOVER_2)) return BEST_N;     // 25
  if (suffixOnOrAfter(y, mo, da, BESTN_CUTOVER)) return BEST_N_MID;   // 10
  return BEST_N_PRIOR;                                                // 5
}


// --- Placement ladder: fixed points by finishing position (owner, 2026-08-12) -
//
// The old split (5 for completion + 10 for placement, the placement half scaled
// to field size) was fair but unreadable: 5th place paid 9.6 in a 94-player
// field and 4.3 in an 8-player one, so nobody could look at a board and know
// what a finish was worth. From LADDER_CUTOVER a game pays a FIXED table by
// rank, identical in every field:
//
//   1st 15   2nd 12   3rd 10   4th 8   5th 7
//   6th  6   7th  5   8th  4   9th 3  10th 2   11th+ 1 (finished)   DNP 0
//
// The 15-point game max and the 375 daily ceiling are UNCHANGED, so nothing
// downstream rescales and every board still prints "x / 15". Completion folds
// INTO the ladder rather than being paid alongside it: how much you solved
// already decides where you finish, and paying for it twice is what let a weak
// finish in an empty field out-earn a strong one in a stacked field.
//
// KNOWN AND ACCEPTED (owner, 2026-08-12): 5th of 94 and 5th of 8 both pay 7, so
// beating 89 people is no longer worth more than beating 3. That is the price of
// a table a player can read off a board, and it is not a new hole: the old rule
// already paid the full placement max to whoever topped a two-player field.
//
// IQ POINTS ARE NOT AFFECTED. lib/quiz-xp scores a daily from its own
// score/total fraction and never reads these points, so no player's IQ total,
// rank or trophy moves. Only the daily combined board and its crown do, and the
// date gate keeps every already-crowned day on the rule it was played under.
export const LADDER = [15, 12, 10, 8, 7, 6, 5, 4, 3, 2];
export const LADDER_FLOOR = 1;                           // finished, outside the top 10
export const LADDER_CUTOVER = { y: 2026, m: 8, d: 13 };  // scaled split -> fixed ladder

// Points for one finishing position. Past the table every finisher earns the
// same floor, and that floor is deliberately non-zero: finishing a game has to
// beat skipping it, or best-N quietly rewards ducking anything hard.
export function ladderAt(pos) {
  return pos >= 1 && pos <= LADDER.length ? LADDER[pos - 1] : LADDER_FLOOR;
}

// A quizId ("crux-8-12-26") or a bare suffix ("8-12-26") -> the suffix, else
// null. An unparseable id reads as the CURRENT rule, exactly as bestNForSuffix
// already treats one.
export function suffixOfQuizId(id) {
  const m = /(\d{1,2}-\d{1,2}-\d{2})$/.exec(String(id || ''));
  return m ? m[1] : null;
}

// Does this day pay the fixed ladder, or the old scaled split?
export function usesLadder(id) {
  const mm = /^(\d+)-(\d+)-(\d+)$/.exec(suffixOfQuizId(id) || '');
  if (!mm) return true;
  return suffixOnOrAfter(2000 + +mm[3], +mm[1], +mm[2], LADDER_CUTOVER);
}

// THE ONE PLACE a game's 0..15 points are computed. Every scorer calls it now:
// scoreGame, guestGameResult, and the three crowd scorers (outwit, outrank,
// feud) that each used to carry their own copy of the formula. Five hand-kept
// copies of a scoring rule is exactly how a per-game board and the combined
// board drift apart, which the rest of this file spends several comments
// warning about.
//
// TWO positions go in, because the two eras count the field differently and a
// played day must never rescore:
//
//   `lo`/`hi`             the tie group's span in the FULL field, guests
//                          included. The pre-cutover path reads only these (plus
//                          `field` and `ratio`) and reproduces the old math
//                          exactly, so no already-played day moves.
//   `rankedLo`/`rankedHi`  the same span counted over REGISTERED players only.
//                          The ladder reads only these. Defaults to lo/hi, so a
//                          caller whose field is already registered-only (the
//                          three crowd scorers, which have always filtered to
//                          named players) passes one position and is correct.
//
// Registered-only is the pool because the public board, the crown and the prize
// are all registered-only: a guest cannot win, so paying a registered player by
// a position that counts guests pays them for a race they were not in. Removing
// guests never REORDERS the registered players, it only closes the gaps between
// them, which is the same thing the board's own renumbering has done since
// 2026-07-26. Before this the board showed #1 and paid the 6th rung.
//
// A tie is paid the MEAN OF THE RUNGS it spans, never the rung at the mean
// position: two tied for 1st share (15+12)/2 = 13.5, three tied for 1st share
// (15+12+10)/3 = 12.33.
export function gamePoints(id, { lo, hi = lo, field = 0, ratio = 0, rankedLo = lo, rankedHi = hi }) {
  if (usesLadder(id)) {
    let sum = 0;
    for (let pos = rankedLo; pos <= rankedHi; pos++) sum += ladderAt(pos);
    const placement = sum / (rankedHi - rankedLo + 1);
    // Reported as pure placement so the one number every board prints is still
    // the whole story; there is no separate completion half any more.
    return { completion: 0, placement, points: placement };
  }
  const avgPos = (lo + hi) / 2;
  const completion = COMPLETION_MAX * ratio;
  const placement = field > 1 ? PLACEMENT_MAX * (field - avgPos) / (field - 1) : PLACEMENT_MAX;
  return { completion, placement, points: completion + placement };
}

// ONE FIELD RE-SCORED (owner, 2026-09-17, for group boards). Hand it the rows
// of ONE game for a subset of the day's players, in site order, each carrying
// `siteRank`, `score` and `total`, and it pays them by THIS field's positions
// instead: the same ladder, the same tie rule, the same formula gamePoints
// runs for the site. Two players the site had level are level here too, so the
// tie groups are the runs of equal site rank.
//
// It MUTATES the rows: `points` becomes the field's points, `sitePoints` keeps
// what the site paid, and `rank` becomes the position in this field. Nothing is
// stored and no site board reads it; a group board is simply the same scoring
// rule over a smaller field, which is what makes "I came first" worth 15 there.
export function rescoreField(quizId, rows) {
  const N = rows.length;
  let i = 0;
  while (i < N) {
    let j = i;
    while (j < N && rows[j].siteRank === rows[i].siteRank) j++;
    for (let k = i; k < j; k++) {
      const r = rows[k];
      const total = Number(r.total) || 0;
      const ratio = total > 0 ? Math.max(0, Math.min(1, (Number(r.score) || 0) / total)) : 0;
      const { points } = gamePoints(quizId, { lo: i + 1, hi: j, field: N, ratio, rankedLo: i + 1, rankedHi: j });
      r.sitePoints = r.points;
      r.points = Math.round(points * 10) / 10;
      r.rank = i + 1;
    }
    i = j;
  }
  return rows;
}

// The daily game keys, in CANONICAL order. Since 2026-07-17 the player-facing
// display order is popularity-driven (/api/quiz/daily-order sorts by
// yesterday's play counts, this order as the tiebreak) — canonical order is
// the fallback and the tie order. Keep in sync with the daily registries (see
// the daily-game-registries note): crux, emcee, garble, links, span, dating,
// tally, suds, circa, extra, carve, stet, outwit, tuck, alibi, cipher, ping,
// warmer, jester, sworn, outrank. `closer` is NOT a daily and
// is intentionally absent. Circa is RETIRED (2026-07-20, last puzzle No. 7):
// it stays in DAILY_KEYS so its archived days keep scoring, but its bank is
// capped, so it never appears in a future day's slate.
// The roster now lives in lib/daily-games (single source of truth); re-export
// it here so the many existing `from '@/lib/daily-combined'` importers keep working.
import { DAILY_KEYS, dailyUnitOfQuizId, isArcadeQuizId, attemptsModeForQuizId, attemptsPlan, attemptsRanker } from './daily-games';
export { DAILY_KEYS };

const r1 = (x) => Math.round(x * 10) / 10; // one decimal place

// --- The day freeze (owner rule, 2026-08-08) ---------------------------------
//
// A day's COMBINED board and its crown are FINAL at Eastern midnight. Per-game
// boards are NOT: a player can work through the archive forever and land on any
// single day's game leaderboard, which is the point of banking puzzles.
//
// Only the cross-game combine freezes, and it has to, because placement points
// are field-relative:
//
//     placement = PLACEMENT_MAX * (N - avgPos) / (N - 1)
//
// so one late archive play raises N and silently recomputes the points of every
// other player who played that game that day. That can change which games make a
// player's best-N, which changes combined totals, which can flip a champion
// crowned weeks earlier. Before this, /api/quiz/daily-history recomputed all 30
// displayed crowns from whatever rows existed at read time, and its own header
// comment ("winner history only changes at the Eastern day boundary") was an
// assumption about player behavior rather than anything the code enforced.
//
// The freeze is a CUTOFF, not a stored snapshot (owner, 2026-08-08). Past days
// are still recomputed from quiz_results, but only from the rows that existed
// when the day ended. That keeps it deterministic with nothing new to store or
// backfill, and it means an admin fraud removal still corrects history, which a
// frozen snapshot row would not. HARD MIDNIGHT, no grace window: a run that
// posts at 12:00:01am ET counts for its game's board and for the player's IQ and
// streak, but not toward the previous day's crown.

// Eastern offset in minutes at a UTC instant (-240 EDT, -300 EST). Derived by
// formatting the instant into ET and diffing, so DST is never hardcoded.
function etOffsetMinutes(utcMs) {
  try {
    const s = new Date(utcMs).toLocaleString('en-US', {
      timeZone: 'America/New_York', hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const m = s.match(/(\d+)\/(\d+)\/(\d+)[,\s]+(\d+):(\d+):(\d+)/);
    if (!m) return -300;
    const asUTC = Date.UTC(+m[3], +m[1] - 1, +m[2], (+m[4]) % 24, +m[5], +m[6]);
    return Math.round((asUTC - utcMs) / 60000);
  } catch (e) { return -300; }
}

// A daily quizId suffix "M-D-YY" -> sortable ISO "YYYY-MM-DD". Null if unparseable.
export function isoOfSuffix(suffix) {
  const parts = String(suffix || '').split('-').map(Number);
  const [M, D, YY] = parts;
  if (parts.length !== 3 || !M || !D || !Number.isFinite(YY)) return null;
  return `${2000 + YY}-${String(M).padStart(2, '0')}-${String(D).padStart(2, '0')}`;
}

// The UTC instant at which the Eastern day `iso` ends (= next ET midnight).
// Two offset passes so a day that ends across a DST change still lands right.
// Returns Infinity for an unparseable date, i.e. fail OPEN and cut nothing.
export function etDayEndMs(iso) {
  const [Y, M, D] = String(iso || '').split('-').map(Number);
  if (!Y || !M || !D) return Infinity;
  const wall = Date.UTC(Y, M - 1, D + 1, 0, 0, 0);   // next ET midnight as wall time
  const first = wall - etOffsetMinutes(wall) * 60000;
  return wall - etOffsetMinutes(first) * 60000;
}

// Is the Eastern day `suffix` over, i.e. is its board final? `todayIso` is the
// caller's ET today (etTodayServer). Today and any future-dated day stay live.
export function dayIsFrozen(suffix, todayIso) {
  const iso = isoOfSuffix(suffix);
  return !!iso && !!todayIso && iso < todayIso;
}

// The rows that existed before the Eastern day `suffix` ended. A row with no
// usable created_at is KEPT: dropping real history on a parse failure is far
// worse than admitting a late row. Works on quiz_results rows and on the
// picks-table rows the adaptive games (Outwit / Outrank / Feud) score from,
// since both carry created_at.
export function rowsWithinDay(rows, suffix) {
  const end = etDayEndMs(isoOfSuffix(suffix));
  if (!Number.isFinite(end)) return rows || [];
  return (rows || []).filter((r) => {
    if (!r) return false;
    if (!r.created_at) return true;
    const t = Date.parse(r.created_at);
    return Number.isNaN(t) ? true : t < end;
  });
}


// Score one game from its raw quiz_results rows. Returns the field size N and a Map of
// userKey -> per-player game result. `points` is on the 0..15 scale.
// Registered (u:<id>) and anonymous guests (a:<anon_id>) compete together;
// public boards filter to named players only.
export function scoreGame(rows) {
  // ONE ROW PER TRACEABLE PLAYER (registered or anonymous guest), and which row
  // that is depends on the game.
  //
  // ARCADE (owner, 2026-08-08): unlimited submissions, ranked on the player's
  // BEST run of the day, because replaying is the whole activity and a cabinet
  // has always taken your best of the night. Everything else keeps the FIRST
  // attempt, so a replay is practice and cannot buy a better place. See
  // isArcade in lib/daily-games for why the two rules differ.
  //
  // On BOTH, a COMPLETED attempt beats an abandoned one (a real finish
  // supersedes an earlier abandon) and a player who only ever abandoned still
  // appears via that abandon. `abandoned` defaults false pre-migration, so this
  // reduces to plain first-attempt on a database without the flag.
  const all = (rows || []).filter((r) => r && (r.user_id || r.anon_id));
  // Both read ONCE per board: every row here belongs to the same puzzle, so
  // these are properties of the day, not of a comparison.
  const tally = all.length ? !!dailyUnitOfQuizId(all[0].quiz_id) : false;
  const arcade = all.length ? isArcadeQuizId(all[0].quiz_id) : false;
  // Which scoring rule this day pays, read ONCE per board like the flags above.
  const quizId = all.length ? all[0].quiz_id : null;
  // A TALLY game (Blocks) posts an open-ended count, so a ZERO-tally run has
  // nothing it could have been efficient about: those rank on shapes SURVIVED
  // rather than fewest used, or topping out in 8 shapes outranks a five-minute
  // run that also never cleared a row (owner, 2026-08-08).
  const second = (a, b) => (tally && Number(a.score) === 0
    ? ((b.guesses_used ?? -1) - (a.guesses_used ?? -1))
    : ((a.guesses_used ?? 1e9) - (b.guesses_used ?? 1e9)));
  // Pricer breaks a tie on score by whoever guessed CLOSEST to the champion's
  // real figure (migration 50). MUST mirror priceOf/pricer in lib/quiz-anon
  // buildLeaderboard exactly, per the same-order rule below. A skipped or
  // pre-migration guess is null and sorts LAST (MAX_VALUE, not Infinity, since
  // Infinity - Infinity is NaN), so every historical row scores identically here
  // and no already-played day can be reordered by this term.
  const pricer = all.length ? (typeof all[0].quiz_id === 'string' && all[0].quiz_id.startsWith('pricer-')) : false;
  // ATTEMPTS TO SOLVE (owner, 2026-08-12). The End Game titles never hand over
  // the answer and invite another run at the same position, so their boards rank
  // on how many runs it took rather than on the first attempt. Built ONCE per
  // board (it walks every row) and shared with lib/quiz-anon buildLeaderboard
  // through lib/daily-games endGamePlan, so the per-game board and the combined
  // board cannot disagree on order. Built on `all`, the traceable rows, which is
  // the same set the selection below runs over.
  // GRADED ATTEMPTS (owner, 2026-08-26): the same question on five games that
  // are not End Game titles, where the score is a scale rather than a verdict,
  // so score leads and attempts are the tiebreak. attemptsModeForQuizId applies
  // the date gate, so an archived Barter day keeps the order it was played under.
  const egMode = all.length ? attemptsModeForQuizId(all[0].quiz_id) : null;
  const endgame = !!egMode;
  const egPlan = endgame ? attemptsPlan(all, egMode) : null;
  const egOf = (r) => (egPlan ? egPlan.info.get(r) : null);
  const priceOf = (r) => (typeof r.price_tiebreak === 'number' && Number.isFinite(r.price_tiebreak) ? r.price_tiebreak : Number.MAX_VALUE);
  // The ranking comparator, negative when `a` finishes ahead of `b`. It orders
  // the field AND, on an arcade game, picks which of a player's runs is their
  // best, so the run that tops their own list is the run the board ranks. Same
  // tiebreak as lib/quiz-anon buildLeaderboard, so the combined board and the
  // per-game board never disagree on order.
  // HOW FAR THEY GOT, ahead of the clock (migration 51). The End Game titles
  // are binary and post score 0 on a loss, so the whole losing cohort tied at
  // zero and fell through to guesses and then time, which ranked the losers by
  // who lost FASTEST: on a day nobody solves it, a four-second blunder topped
  // the board, and a give-up (no errors recorded) outranked a player who went
  // on and missed by one move. `progress` is that game's own measure of depth
  // reached (key moves found, pieces swept, boxes won, discs held), so finding
  // three of four now beats missing the first, and the clock settles only a
  // genuine tie. ONLY rows that carry a value use this term: when neither row
  // has one the old guesses tiebreak runs untouched, so no other game and no
  // already-played day is reordered by it. A row missing it inside a game that
  // does post it counts as 0 rather than sorting last, which is what a
  // pre-migration row for that game honestly represents. MUST stay identical
  // to the copy in the other mirror, per the same-order rule above.
  const progOf = (r) => (Number.isFinite(r.progress) ? r.progress : null);
  const depth = (a, b) => {
    const pa = progOf(a), pb = progOf(b);
    return (pa === null && pb === null) ? second(a, b) : ((pb ?? 0) - (pa ?? 0));
  };
  // The attempts comparator is now BUILT rather than written out here, by the
  // shared factory in lib/daily-games, so this file and lib/quiz-anon
  // buildLeaderboard cannot disagree on order even in principle. It takes this
  // board's own `depth`, which folds in the tally rule.
  const egRank = egPlan ? attemptsRanker(egPlan, egMode, depth) : null;
  const ranks = (a, b) => (egRank ? egRank(a, b) : (b.score - a.score
    || (pricer ? priceOf(a) - priceOf(b) : 0)
    || depth(a, b)
    || ((a.time_elapsed ?? 0) - (b.time_elapsed ?? 0))));

  const chosenByUser = new Map();
  for (const r of all) {
    const k = r.user_id ? `u:${r.user_id}` : `a:${r.anon_id}`;
    // END GAME: the representative run is the one the win landed on, whichever
    // attempt that was, so the plan picks it and the abandoned/earliest rules
    // below do not apply. Keeping the first attempt on a game built to be
    // replayed is exactly what this change replaces.
    if (endgame) { if (egPlan.chosen.has(r)) chosenByUser.set(k, r); continue; }
    const prev = chosenByUser.get(k);
    if (!prev) { chosenByUser.set(k, r); continue; }
    const rDone = !r.abandoned, pDone = !prev.abandoned;
    if (rDone !== pDone) { if (rDone) chosenByUser.set(k, r); continue; }
    // Arcade keeps the better run, everything else keeps the earlier row. A
    // dead heat keeps the earlier row either way.
    if (arcade ? ranks(r, prev) < 0 : (r.id || 0) < (prev.id || 0)) chosenByUser.set(k, r);
  }
  const entries = [...chosenByUser.values()];
  entries.sort((a, b) => ranks(a, b)
    || String(a.username || '').localeCompare(String(b.username || '')));

  const N = entries.length;
  // Canonical per-day denominator: the largest `total` any player recorded for
  // this puzzle. Every row for one day's puzzle SHOULD carry the same total, but
  // early days can mix denominators (day-one Crux has both 8 and 16 from an early
  // scoring change), which would let a stale small total inflate completion. Using
  // the field max normalizes those, so completion depends only on RAW score. That
  // also keeps the combined (points) order identical to the game's own (rank)
  // order — otherwise the two boards can disagree at the cutoff. Falls back to the
  // row's own total if the field somehow has none.
  const fieldMaxTotal = entries.reduce((m, r) => Math.max(m, Number(r.total) || 0), 0);

  // Tie-averaging: players with identical (score, progress, guesses, time) share
  // the same placement points (the average of the positions they span), so two
  // truly-equal runs are not split apart by an alphabetical name tiebreak.
  // Displayed `rank` is the top position of the tie group (standard competition
  // ranking). `progress` belongs in the key because it now ORDERS the field: two
  // runs the comparator separates must not then be handed the same averaged
  // points. It is blank on every game that does not post it, so those keys are
  // byte-identical to the old ones and no played day regroups.
  // `tries` joins the key for the same reason `progress` did: it ORDERS the End
  // Game field now, so two runs the comparator separates must not then be handed
  // the same averaged placement points. It is blank on every other game, so
  // those keys are byte-identical to the old ones and no played day regroups.
  const perfKey = (r) => `${r.score}|${(egOf(r) || {}).tries ?? ''}|${r.progress ?? ''}|${r.guesses_used ?? ''}|${r.time_elapsed ?? ''}`;
  const players = new Map();
  let i = 0;
  // Ladder positions are counted over REGISTERED players only (see gamePoints).
  // `namedBefore` is how many named players sit in earlier tie groups, so a named
  // player's position is its registered board rank and the gaps guests leave are
  // closed. The FULL-field span is still tracked alongside it, because the
  // pre-cutover formula scores on that and no played day may move.
  let namedBefore = 0;
  while (i < N) {
    let j = i;
    while (j < N && perfKey(entries[j]) === perfKey(entries[i])) j++;
    const displayRank = i + 1;                 // 1-based top of the group
    const avgPos = ((i + 1) + j) / 2;          // mean 1-based position in the group
    let namedInGroup = 0;
    for (let k = i; k < j; k++) if (entries[k].username) namedInGroup++;
    const rLo = namedBefore + 1;
    const rHi = namedBefore + namedInGroup;
    for (let k = i; k < j; k++) {
      const r = entries[k];
      // A GUEST is paid the position they WOULD hold if they registered right
      // now, which is the same number guestProvisional shows them on the end
      // card. They are off every public board either way; this keeps the two
      // paths agreeing so a guest's "if you sign up" preview is not a different
      // number from the one they would actually get.
      const pLo = rLo;
      const pHi = r.username ? rHi : rLo;
      const uk = r.user_id ? `u:${r.user_id}` : `a:${r.anon_id}`;
      const total = fieldMaxTotal > 0 ? fieldMaxTotal : (Number(r.total) || 0);
      const ratio = total > 0 ? Math.max(0, Math.min(1, Number(r.score) / total)) : 0;
      // lo/hi are the tie group's 1-based span, so a tie is paid the mean of
      // the rungs it covers. Pre-cutover this is still 5 x ratio + scaled
      // placement off the same avgPos, byte for byte.
      const { completion, placement, points } = gamePoints(quizId, { lo: i + 1, hi: j, field: N, ratio, rankedLo: pLo, rankedHi: pHi });
      players.set(uk, {
        userKey: uk,
        username: r.username,
        registered: !!r.user_id,
        score: Number(r.score) || 0,
        total,
        guessesUsed: r.guesses_used ?? null,
        progress: r.progress ?? null,
        // How many runs this puzzle took them, and which tier that run was
        // (0 solved, 1 drawn, 2 unsolved). Null on every non-End-Game board.
        tries: (egOf(r) || {}).tries ?? null,
        egTier: (egOf(r) || {}).tier ?? null,
        timeElapsed: r.time_elapsed ?? null,
        completion,
        placement,
        points,
        rank: displayRank,
        // The position the ladder actually paid: this player's place among
        // REGISTERED players. Exposed so a board render and a verifier can check
        // the points against the rank the reader sees, rather than re-deriving it.
        rankedPos: pLo,
        field: N,
        abandoned: !!r.abandoned,
      });
    }
    namedBefore += namedInGroup;
    i = j;
  }
  return { field: N, players };
}

// Combine per-game results into the overall best-N standings (bestN, default 10).
// gameResults: [{ key, quizId, field, players: Map }] for the games with a live
// puzzle today. Returns rows sorted best-first with a shared-rank `rank`.
export function combineDaily(gameResults, bestN = BEST_N) {
  const byUser = new Map();
  for (const g of (gameResults || [])) {
    for (const p of g.players.values()) {
      let u = byUser.get(p.userKey);
      if (!u) { u = { userKey: p.userKey, username: p.username, games: [] }; byUser.set(p.userKey, u); }
      u.username = p.username; // keep the latest label
      u.games.push({
        key: g.key,
        quizId: g.quizId,
        points: p.points,
        completion: p.completion,
        placement: p.placement,
        rank: p.rank,
        field: g.field,
        score: p.score,
        total: p.total,
        // Carried through so a player's OWN per-game row can show how long the
        // day took. The public per-game boards already expose it; only the
        // combine was dropping it (owner, 2026-08-03).
        timeElapsed: p.timeElapsed ?? null,
        // The game's own figure travels with the row, so perGame below can
        // report the RUN and not only its worth (owner, 2026-09-01).
        guessesUsed: p.guessesUsed ?? null,
        tries: p.tries ?? null,
        egTier: p.egTier ?? null,
        abandoned: !!p.abandoned,
      });
    }
  }

  const overall = [];
  for (const u of byUser.values()) {
    const sorted = u.games.slice().sort((a, b) => b.points - a.points);
    const best = sorted.slice(0, bestN);
    const total = best.reduce((s, x) => s + x.points, 0);
    const bestSingle = sorted.length ? sorted[0].points : 0;
    const perGame = {};
    for (const x of u.games) {
      perGame[x.key] = {
        points: r1(x.points),
        completion: r1(x.completion),
        placement: r1(x.placement),
        rank: x.rank,
        field: x.field,
        score: x.score,
        total: x.total,
        timeElapsed: x.timeElapsed ?? null,
        // THE GAME'S OWN FIGURE, so a surface reading this map can report what
        // the player DID and not only where it placed them (owner, 2026-09-01,
        // for Your standing on the home). What it counts differs per game and
        // the word for it is `miss` in lib/daily-games; `tries` is End Game
        // only and takes precedence there, exactly as on every board.
        guessesUsed: x.guessesUsed ?? null,
        tries: x.tries ?? null,
        egTier: x.egTier ?? null,
        abandoned: !!x.abandoned,
      };
    }
    overall.push({
      userKey: u.userKey,
      username: u.username,
      total: r1(total),
      gamesPlayed: u.games.length,
      gamesFinished: u.games.filter((x) => !x.abandoned).length,
      counted: best.map((x) => x.key),   // which games contributed (up to bestN)
      bestSingle: r1(bestSingle),
      perGame,
    });
  }

  overall.sort((a, b) =>
    b.total - a.total
    || b.gamesPlayed - a.gamesPlayed
    || b.bestSingle - a.bestSingle
    || String(a.username || '').localeCompare(String(b.username || '')));

  // Shared competition rank on the combined total (ties share a rank).
  let rank = 0, prev = null, seen = 0;
  for (const row of overall) {
    seen += 1;
    if (prev === null || row.total !== prev) { rank = seen; prev = row.total; }
    row.rank = rank;
  }
  return overall;
}

// --- Guest provisional standing (end-card "if you register" prompt) ----------
// A guest (anon, no account) is never scored onto the board, but we can show
// them where their play WOULD land if they registered. Score one guest game the
// same way scoreGame does, inserting the guest into that game's registered
// field, and report BOTH the points (for a combined total) and the guest's rank
// within that single game (the number the end card actually shows, per game).
export function guestGameResult(guestRow, game, eg = null) {
  const N = game.field || 0;
  const newN = N + 1; // the guest joining grows the field by one
  const regs = [...game.players.values()];
  const total = regs.reduce((m, p) => Math.max(m, Number(p.total) || 0), 0) || (Number(guestRow.total) || 0);
  const score = Number(guestRow.score) || 0;
  const ratio = total > 0 ? Math.max(0, Math.min(1, score / total)) : 0;
  const gG = guestRow.guesses_used ?? 1e9, gT = guestRow.time_elapsed ?? 0;
  // Mirrors the `depth` term in scoreGame: where progress exists it replaces the
  // guesses tiebreak outright, so a guest who got further sits above a faster
  // shallower run here too. Both sides null falls back to guesses, exactly as
  // this test has always behaved.
  const gP = Number.isFinite(guestRow.progress) ? guestRow.progress : null;
  const aheadOnDepth = (pP, pG2, pT2) => (pP === null && gP === null
    ? (pG2 < gG || (pG2 === gG && pT2 < gT))
    : ((pP ?? 0) > (gP ?? 0) || ((pP ?? 0) === (gP ?? 0) && pT2 < gT)));
  // END GAME (owner, 2026-08-12): the guest is placed by the same tier ->
  // attempts -> clock order the board itself uses, read off the egTier/tries
  // each scored player now carries. `eg` is the guest's own verdict, computed
  // by the caller from their rows since this function only ever sees one of
  // them. Mirrors egRank in scoreGame; a null eg leaves every other game on the
  // score/depth test below, exactly as it has always behaved.
  // Two counts, for the two eras: everyone ahead (the pre-cutover formula scores
  // on the full field) and the NAMED players ahead (what the ladder pays, and
  // what the public board displays). Same test either way.
  let better = 0;       // anyone ahead of the guest on the same tiebreak
  let betterNamed = 0;  // registered players ahead
  for (const p of regs) {
    let ahead = false;
    const pG = p.guessesUsed ?? 1e9, pT = p.timeElapsed ?? 0;
    const pP = Number.isFinite(p.progress) ? p.progress : null;
    const pt = p.egTier ?? 2, pr = p.tries ?? 0;
    const deeper = (pP ?? -1) > (gP ?? -1) || ((pP ?? -1) === (gP ?? -1) && pT < gT);
    const sooner = eg ? (pr < eg.tries || (pr === eg.tries && pT < gT)) : false;
    if (eg && eg.trades) {
      // TRADES (owner, 2026-09-02): finished-or-not, then runs, then trades,
      // then the clock. Mirrors the 'trades' branch of attemptsRanker. Tested
      // BEFORE eg.graded, which is also true on a trades board.
      const pFin = p.score > 0 ? 0 : 1, gFin = score > 0 ? 0 : 1;
      if (pFin < gFin) ahead = true;
      else if (pFin === gFin && pFin === 0) {
        if (pr < eg.tries || (pr === eg.tries && (pG < gG || (pG === gG && pT < gT)))) ahead = true;
      } else if (pFin === gFin && deeper) ahead = true;
    } else if (eg && eg.graded) {
      // GRADED (owner, 2026-08-26): score first, exactly as attemptsRanker does,
      // because a graded tier only says finished-or-not and would flatten the
      // whole scale. Attempts break a tie among finishers; a zero falls to depth.
      if (p.score > score || (p.score === score && (score > 0 ? sooner : deeper))) ahead = true;
    } else if (eg) {
      if (pt < eg.tier || (pt === eg.tier && (eg.tier < 2 ? sooner : deeper))) ahead = true;
    } else if (p.score > score || (p.score === score && aheadOnDepth(pP, pG, pT))) ahead = true;
    if (ahead) { better++; if (p.username) betterNamed++; }
  }
  const rank = better + 1;            // full-field position, for the old formula
  const rankNamed = betterNamed + 1;  // among registered players: what is displayed
  // BOTH ranked bounds go in explicitly. `rankedHi` defaults to `hi`, which
  // defaults to the FULL-field `lo`, so passing rankedLo alone would hand the
  // ladder the span rankNamed..rankFull and average every rung across it (a
  // guest 2nd among registered but 6th overall was quoted 8.6 instead of 12).
  const { points } = gamePoints(game.quizId, { lo: rank, field: newN, ratio, rankedLo: rankNamed, rankedHi: rankNamed });
  // `rank` is a DISPLAY number (the end card's "#N"), and the board has shown
  // registered-only ranks since 2026-07-26, so the guest is told the same kind of
  // number a registered player sees. `field` stays the FULL pool, which is the
  // denominator every other tile on that card uses (owner, 2026-08-13).
  return { points, rank: rankNamed, field: newN };
}

// guestByGame: Map(gameKey -> the guest's chosen quiz_results row). gameResults
// and overallFull are as built by the daily-combined route. Returns
//   { rank, total, gamesPlayed, perGame: { key: { rank, field } } }
// where `rank` is where the guest's best-N total would sit on the registered
// combined board and perGame[key].rank is their would-be rank in that one game.
// Null when the guest has no scored rows.
// --- One circuit ranks on QUESTIONS RIGHT (owner, 2026-08-30) ---------------
//
// Rank a circuit's combined rows on the plain sum of their member scores, with
// the combined clock as the ONLY tiebreak. Used by exactly one circuit, the
// Trivia Gauntlet, whose seven games are seven banks of four-choice questions
// where the score already IS the number answered right (see circuitScoreMode
// in lib/circuits for why no other circuit may take this rule).
//
// IT IS A BOARD RULE, NOT A SCORING CHANGE, and that distinction is the whole
// safety of it. Every game still pays the 0..15 ladder on its own board, into
// best-N, into the crown, into the trophies and into IQ Points, exactly as it
// did the day before; `points` is still on every per-game row this touches, and
// the ladder total is kept as `pointsTotal`. The only thing that changes is the
// number this one circuit's rows are ordered and printed by, and nothing
// outside a ?circuit=<id> payload ever reaches this function. No played day
// moves, because no played day's points move.
//
// MUTATES IN PLACE. The route hands the viewer their own row out of this same
// array by reference (`me`), and rebuilding the array would leave that pointing
// at a row still carrying the ladder numbers.
export function rankByCorrect(rows, keys) {
  const members = Array.isArray(keys) ? keys : [];
  const list = rows || [];
  for (const row of list) {
    let right = 0, secs = 0;
    for (const k of members) {
      const p = row.perGame && row.perGame[k];
      if (!p || p.abandoned) continue;
      right += Number(p.score) || 0;
      secs += Number(p.timeElapsed) || 0;
    }
    row.pointsTotal = row.total;   // what the ladder would have paid
    row.total = right;
    row.timeTotal = secs;
  }
  list.sort((a, b) =>
    (b.total || 0) - (a.total || 0)
    || (a.timeTotal || 0) - (b.timeTotal || 0)
    || (b.gamesFinished || 0) - (a.gamesFinished || 0)
    || String(a.username || '').localeCompare(String(b.username || '')));
  // Shared competition rank, and a tie here needs BOTH terms to match: two
  // players on the same score with different clocks are SEPARATED by the sort
  // above, so handing them one rank would contradict the order they print in.
  let rank = 0, prev = null, seen = 0;
  for (const row of list) {
    seen += 1;
    const key = `${row.total}|${row.timeTotal}`;
    if (prev === null || key !== prev) { rank = seen; prev = key; }
    row.rank = rank;
  }
  return list;
}

// --- One circuit ranks on the CLOCK (owner, 2026-09-05) -----------------------
//
// The Valet Gauntlet's board: how many of the circuit's lots a player parked,
// then the combined clock across them, fastest first. A lot counts as parked
// only on a row that is not abandoned and scored above zero (a give-up on
// Parker, Impound or Junkyard files score 0), so a run with a lot unsolved
// sorts below every full run whatever its clock, and never takes a rank: the
// route's all-games gate already refuses a row missing a member, and the sort
// here puts a zero-scored member's row after the full runs.
//
// The same safety as rankByCorrect: every game still pays its own ladder into
// its own board, best-N, the crown and IQ Points. `pointsTotal` keeps what the
// ladder paid; `total` becomes LOTS PARKED and `timeTotal` the combined clock.
// The ceiling the route publishes for this mode is the member count.
//
// MUTATES IN PLACE, for the reason rankByCorrect gives.
export function rankByTime(rows, keys) {
  const members = Array.isArray(keys) ? keys : [];
  const list = rows || [];
  for (const row of list) {
    let parked = 0, secs = 0;
    for (const k of members) {
      const p = row.perGame && row.perGame[k];
      if (!p || p.abandoned || !(Number(p.score) > 0)) continue;
      parked += 1;
      secs += Number(p.timeElapsed) || 0;
    }
    row.pointsTotal = row.total;
    row.total = parked;
    row.timeTotal = secs;
    row.parkedAll = members.length > 0 && parked === members.length;
  }
  list.sort((a, b) =>
    (b.total || 0) - (a.total || 0)
    || (a.timeTotal || 0) - (b.timeTotal || 0)
    || (b.gamesFinished || 0) - (a.gamesFinished || 0)
    || String(a.username || '').localeCompare(String(b.username || '')));
  let rank = 0, prev = null, seen = 0;
  for (const row of list) {
    seen += 1;
    const key = `${row.total}|${row.timeTotal}`;
    if (prev === null || key !== prev) { rank = seen; prev = key; }
    row.rank = rank;
  }
  return list;
}

export function guestProvisional(guestByGame, gameResults, overallFull, bestN = BEST_N) {
  const pts = [];
  const perGame = {};
  for (const g of (gameResults || [])) {
    // Each value is { row, eg }: the guest's representative row plus, on an End
    // Game board, its { tier, tries } verdict. A plain row is still accepted so
    // an older caller keeps working.
    const entry = guestByGame.get(g.key);
    if (!entry) continue;
    const row = entry.row || entry;
    const res = guestGameResult(row, g, entry.eg || null);
    pts.push(res.points);
    perGame[g.key] = { rank: res.rank, field: res.field };
  }
  if (!pts.length) return null;
  pts.sort((a, b) => b - a);
  const total = pts.slice(0, bestN).reduce((sum, x) => sum + x, 0);
  const rank = (overallFull || []).filter((r) => r.total > total).length + 1;
  return { rank, total: Math.round(total * 10) / 10, gamesPlayed: pts.length, perGame };
}
