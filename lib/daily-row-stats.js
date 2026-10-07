// ONE READING OF A BOARD ROW, shared by every surface that shows a result.
//
// A daily leaderboard row carries two completely different numbers and only one
// of them means anything to a player looking at the game they just played:
//
//   points  the 0-15 placement ladder (lib/daily-combined gamePoints). It ranks
//           you against the field and is identical in shape for all 80 games.
//   score   what you actually did on THIS board, out of THIS board's total.
//
// The stage's leader strip was rendering `points` with the word "points" after
// it, so Suds read "Gator88 · 10 points" — a figure with no relationship to a
// sudoku, and no way for a reader to translate it back into the grid they had
// just filled (owner, 2026-08-31). The tile panel had already solved this in
// 2026-08 with a `gameStats` helper, but it was module-local, so the second
// surface to want it re-invented the wrong answer instead of reusing the right
// one. It lives here now and both import it.
//
// Every field is optional: a row missing a clock, or a score, simply says less.
// Returns null when there is nothing honest to say.

import { isSolveOnly } from './daily-games.js';

export function mmss(sec) {
  const x = Math.max(0, Math.round(Number(sec) || 0));
  if (!x) return null;
  const h = Math.floor(x / 3600), m = Math.floor((x % 3600) / 60), s = x % 60;
  const two = (v) => String(v).padStart(2, '0');
  return h ? h + ':' + two(m) + ':' + two(s) : m + ':' + two(s);
}

// THE MIDDLE TERM IS THE GAME'S OWN WORD, AND THE SECOND HALF OF THAT RULE IS
// THAT SOME GAMES HAVE NO WORD AT ALL (owner, 2026-09-01).
//
// Every daily posts ONE figure in `guessesUsed`, and what that figure COUNTS is
// different in every game: Hands posts busts, Sweep posts digs, Tuck posts the
// tiles it could not place, Paths posts a cost. The registry has said so since
// the beginning — `miss` in lib/daily-games.js is that word, and the three
// table surfaces (DailyBoardPanel, DailyEndCard, LoftFinish) have always headed
// their column with it.
//
// gameStats did not. It printed the raw figure with the word "guesses" welded
// on, so the ending curtain on all 80 dailies — the one leaderboard every
// player sees, because it is the page the game finishes on — told a Hands
// player "3 guesses" about a game that takes no guesses, and said the same
// wrong thing on the fifty-eight other games whose word is not "Guesses". The
// column header a few hundred pixels away said "Busts" the whole time.
//
// Two rules, and the second matters as much as the first:
//   1. The word is the registry's, lowercased, inflected by MISS_ONE below.
//   2. NO LABEL MEANS NO TERM. The sixteen games with `miss: null` (Suds,
//      Cages, Cipher, Bracket, Pricer, the three crowd games...) post no
//      wrong-answer figure at all, so there is nothing to say and the term is
//      dropped rather than filled with a zero or a borrowed noun. That is the
//      same `miss: null` = drop-the-column rule the tables already follow.
//
// A caller that passes no label gets no middle term, deliberately: saying less
// is the honest failure, and saying "guesses" is how this bug lasted.

// The singular, for a count of exactly one. It is an explicit table rather than
// a de-pluralising rule because the labels are not all plural nouns — "Asked",
// "Wrong", "Stuck", "Unused" and "Placed" do not inflect, and "Tries" and
// "Guesses" are exactly the two a naive trailing-s rule gets wrong. Keyed by
// the registry label verbatim. scripts/verify-miss-labels.mjs fails the gate
// when a registry label has no entry here, so a new game cannot ship a word
// this table has never seen.
export const MISS_ONE = {
  Asked: 'asked',
  Busts: 'bust',
  Checks: 'check',
  Cost: 'cost',
  Detours: 'detour',
  Digs: 'dig',
  Errors: 'error',
  Guesses: 'guess',
  Hints: 'hint',
  Miss: 'miss',
  Misses: 'miss',
  Moves: 'move',
  Placed: 'placed',
  Rejects: 'reject',
  Shapes: 'shape',
  Slips: 'slip',
  Steps: 'step',
  Stuck: 'stuck',
  Tears: 'tear',
  Tests: 'test',
  Tries: 'try',
  Unused: 'unused',
  Words: 'word',
  Wrong: 'wrong',
  'Wrong calls': 'wrong call',
};

// The word for `n` of whatever this game counts. An unknown label degrades to
// the label itself rather than to a wrong word: a new game reads "3 parries"
// and "1 parries" until someone adds the singular, which is clumsy but true,
// and the verifier will have failed before it ships.
export function missWord(label, n) {
  if (!label) return null;
  const plural = String(label).toLowerCase();
  return n === 1 ? (MISS_ONE[label] || plural) : plural;
}

// The game's own result for one board row: what they scored, not the points
// that rank them. `missLabel` is the game's `miss` from the daily registry.
// A run's result as ONE short figure: Solved / Not solved on a solve-or-not
// game (no 10/10, no 0/10: owner, 2026-09-28), the score out of the total
// everywhere else.
export function scoreFig(r, gameKey = null) {
  if (!r || r.score == null) return null;
  if (isSolveOnly(gameKey) && r.total) return Number(r.score) >= Number(r.total) ? 'Solved' : 'Not solved';
  return r.total != null ? r.score + '/' + r.total : String(r.score);
}

export function gameStats(r, missLabel = null, gameKey = null) {
  if (!r || r.score == null || !r.total) return null;
  // SOLVE OR NOT: the fraction goes. A solve is described by what the board
  // ranks it on (misses, then the clock); a miss says so in words.
  const solveOnly = isSolveOnly(gameKey);
  const solved = Number(r.score) >= Number(r.total);
  const bits = solveOnly ? (solved ? [] : ['Not solved']) : [r.score + '/' + r.total];
  // END GAME rows report the attempt the solve landed on (owner, 2026-08-12),
  // which is what their board ranks on; the per-run error count no longer
  // decides anything there. `tries` is null on every other game, which falls
  // through to that game's own figure. The six End Game titles carry the
  // registry label 'Tries', so this reads "1 try" exactly as it always has.
  const n = r.tries != null ? r.tries : (r.guessesUsed > 0 ? r.guessesUsed : null);
  const word = n != null ? missWord(missLabel, n) : null;
  if (word) bits.push(n + ' ' + word);
  const clock = mmss(r.timeElapsed);
  if (clock) bits.push(clock);
  if (!bits.length) return 'Solved';
  return bits.join(' · ');
}

// The same result with the middle term dropped — for a one-line strip where the
// miss count is the least useful of the three and the first thing that should
// go when space runs out. Score and clock are what a player compares.
export function gameStatsShort(r, gameKey = null) {
  if (!r || r.score == null || !r.total) return null;
  const clock = mmss(r.timeElapsed);
  if (isSolveOnly(gameKey)) {
    if (Number(r.score) < Number(r.total)) return 'Not solved';
    return clock || 'Solved';
  }
  return clock ? `${r.score}/${r.total} · ${clock}` : `${r.score}/${r.total}`;
}
