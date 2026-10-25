// THE END-CARD HEADLINE, ONE VOCABULARY (owner, 2026-10-25).
//
// The headline speaks to the PLAYER, not to the puzzle's state. Nothing on it
// starts with "Not", and par never appears on it: "Not solved" on a 25-question
// one-life gauntlet read as failure for a 14-in-a-row run, and "Par cleared"
// on an arcade run explained nothing. Par survives only in the rules text.
//
// One graded ladder for anything with a score:
//   all of it             -> 'Solved!' (or the game's own word, e.g. 'Perfect!')
//   80% or more           -> 'Great job!'
//   50% or more           -> 'Good job!'
//   anything less, or 0   -> 'Good effort'
//
// Every client calls one of these rather than writing its own words, so the
// site cannot drift back into nine different phrasings of the same result.

export const GOOD_EFFORT = 'Good effort';

// A score out of a maximum. `top` is the word for a full score.
export function endGrade(score, total, top = 'Solved!') {
  const s = Number(score) || 0;
  const t = Number(total) || 0;
  if (t > 0 && s >= t) return top;
  const r = t > 0 ? s / t : 0;
  if (r >= 0.8) return 'Great job!';
  if (r >= 0.5) return 'Good job!';
  return GOOD_EFFORT;
}

// Solved or not, nothing to grade.
export function endSolved(won) {
  return won ? 'Solved!' : GOOD_EFFORT;
}

// The one-life gauntlets: the run's length IS the headline, and the total is
// never printed (a 14 under "of 25" reads as a miss, which it is not).
export function endStreak(depth, total) {
  const d = Number(depth) || 0;
  const t = Number(total) || 0;
  if (t > 0 && d >= t) return 'Flawless!';
  if (d > 0) return `${d} in a row!`;
  return GOOD_EFFORT;
}

// The move-budget games scored by lib/par.js: 10 is the proven minimum, 8 is a
// clean solve, lower is a longer one. The headline never says which line it
// was measured against.
export function endEfficiency(won, finalScore) {
  if (!won) return GOOD_EFFORT;
  const s = Number(finalScore) || 0;
  if (s >= 10) return 'Perfect!';
  if (s >= 8) return 'Solved!';
  return 'Good job!';
}

// Arcade runs have no win or loss. The ending upgrades this to 'Personal best!'
// when the run beats the player's own record (StageFinish, isPb).
export const ARCADE_RUN = 'Good run!';
export const ARCADE_BEST = 'Personal best!';
