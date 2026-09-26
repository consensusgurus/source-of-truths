// TYPICAL CLOCKS, one per daily: the median timeElapsed of every top-10
// leaderboard row pooled across the days the game has been live (seconds).
// This is the snapshot scripts/verify-daily-five.mjs was built on (measured
// 2026-08-17, later games thinner), moved here 2026-09-26 so the finish card
// can price the rest of a set ("Anon, about 18 min"). It is a MEASUREMENT with
// a date on it, not a fact about the games: expect drift, and re-measure by
// pooling timeElapsed off /api/quiz/daily-combined?date=<M-D-YY> over a couple
// of weeks. The verifier imports this map, so there is one copy.
export const GAME_MEDIANS = {
  check: 21, dating: 22, turn: 23, defend: 28, four: 30, chain: 30, chomp: 34, emcee: 35,
  deep: 37, mate: 41, links: 43, extra: 44, garble: 51, bracket: 51, span: 53, sworn: 54,
  stet: 57, etch: 58, park: 61, blitz: 62, crunch: 63, streak: 66, ping: 69, listed: 75,
  taire: 78, jester: 89, hedge: 93, plot: 93, carve: 111, paths: 111, hands: 112, axiom: 114,
  venn: 128, sixes: 144, hearsay: 156, suffice: 172, blocks: 180, stands: 180, strata: 189,
  tuck: 201, babel: 201, barter: 202, docket: 221, alibi: 232, sweep: 257, cages: 270,
  redact: 276, shards: 304, tally: 337, rung: 360, glyph: 370, fib: 451, cipher: 455,
  suds: 482, warmer: 518, lode: 614, quilt: 699, crux: 1031, anon: 1106, sando: 1171,
  // The three crowd games post no comparable clock: you submit picks against a
  // pool, so the row's time is how long you deliberated, not how long the
  // puzzle took. Estimated, and flagged as such.
  outwit: 90, outrank: 90, feud: 90,
  // MEASURED 2026-08-21, AND THIN. Both of these launched days ago, so they are
  // the real median of a very small sample rather than the fourteen-day pool
  // above, and both are PROVISIONAL. Method is identical (pool every top-10
  // leaderboard row across every day the game has been live, take the median);
  // there is simply almost nothing to pool yet.
  //   niche   live from 2026-08-20. Seven rows over two days (2026-08-20 plus
  //           the still-running 2026-08-21), one of which is a 2,685s
  //           walk-away, so the median IS one row rather than a distribution.
  //   shoe    live from 2026-08-21, the day this was measured. ONE row, one
  //           player, one board. That is a single clock and not a median of
  //           anything; it is carried only so the game can be placed on the
  //           ramp at all, since a game with no entry here is silently dropped
  //           from every run by scripts/gen-daily-five.mjs.
  // RE-MEASURE BOTH once a fortnight of boards exists, and expect real drift.
  niche: 235, shoe: 73,
};

export function typicalSeconds(key) {
  const s = GAME_MEDIANS[key];
  return Number.isFinite(s) ? s : null;
}

// "about a minute" / "~4 min" / "~18 min". Null when nothing was measured.
export function typicalLabel(key) {
  const s = typicalSeconds(key);
  if (s == null) return null;
  if (s < 90) return 'about a minute';
  return `~${Math.round(s / 60)} min`;
}
