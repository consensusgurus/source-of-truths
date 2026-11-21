// ODD JOBS: the daily chores run (owner, 2026-11-21).
//
// Mop, Mow, then Plow (the mockup's order: the house, the yard, the town), back
// to back on one page (app/oddjobs). "Odd Jobs" is the run's NAME only, never a
// rung. Each leg is that day's real board of the game, played exactly as on its
// own page, so a Sunday is three Sunday Editions.
//
// FEWEST REPLAYS FIRST, THEN THE CLOCK (owner, 2026-11-19, for Mop, Mow and Plow:
// "scored first by number of retries, then by time"). Each solved leg pays up to
// 100: 20 off per replay and up to 6 off for time, falling in a straight line to
// ODD_CAP (10:00) and no further. A leg not solved pays 0. Across the three legs
// the clock can cost at most 18, less than one replay, so the run total ranks
// strictly on total replays first and total time second. A leg with five or more
// replays bottoms out at 0.
//
// The ladder, low to high (owner, 2026-11-21: "foreman should be top", then
// "remove jack of all trades"): Couch Potato, Weekend Warrior, Handyman,
// Groundskeeper, Foreman. Foreman is a clean run (no replays) under 8:20 across
// all three; Groundskeeper any clean run; Handyman 1 or 2 replays; Weekend
// Warrior 3 to 5; Couch Potato 6 or more, or any leg not finished. THE TIME
// CUTOFF IS A PLACEHOLDER: tune it from a fortnight of real runs.

export const ODD_RUN_ID = 'oddjobs';
export const ODD_PATH = '/oddjobs';
export const ODD_KEYS = ['mop', 'mow', 'plow'];
export const ODD_FROM = '2026-11-21';
export const ODD_CAP = 600;          // seconds: past this a leg's clock costs nothing more
export const ODD_LEG_MAX = 100;
export const ODD_REPLAY = 20;        // points a replay costs
export const ODD_TIME = 6;           // the most a leg's clock can cost
export const ODD_MAX = ODD_KEYS.length * ODD_LEG_MAX;
export const ODD_FOREMAN_SECS = 500; // PLACEHOLDER: a clean run under 8:20 is a Foreman (cutoff 295)

export const ODD_FORMS = {
  mop: { name: 'Mop', form: 'The House', chip: 'Mop every tile once, then get out', band: '#bae6fd' },
  mow: { name: 'Mow', form: 'The Yard', chip: 'Mow every square once, gate to gate', band: '#bbf7d0' },
  plow: { name: 'Plow', form: 'The Town', chip: 'Plow every street once, depot to barn', band: '#fed7aa' },
};

// One leg's points off its result: solved or not, its replays and its clock.
// A missing clock (a result banked on another device) is charged the full 6.
export function oddLegPoints(score, replays, secs) {
  if (!(Number(score) > 0)) return 0;
  const rep = Math.max(0, Math.round(Number(replays) || 0));
  const s = Number(secs);
  const t = Number.isFinite(s) && s > 0 ? Math.min(s, ODD_CAP) / ODD_CAP : 1;
  return Math.max(0, ODD_LEG_MAX - ODD_REPLAY * rep - ODD_TIME * t);
}
// The circuit board's scorer: (key, row) => points, off a filed result row
// (guessesUsed carries the replays for all three games).
export function oddScorerFor() {
  return (key, p) => oddLegPoints(p && p.score, p && p.guessesUsed, p && p.timeElapsed);
}

// [cutoff in points, name, short, chip colour, stripe, line]. The point cutoffs
// are the replay and time rules read through the scorer: a clean run is 282 or
// more, two replays never fall below 242, five never below 182. Every cutoff is a
// whole number and no run lands within half a point of one from the wrong side
// (one replay tops out at 280, three at 240, six at 180), so ranking the
// rounded total gives the same rank as the exact one.
export const ODD_RANKS = [
  [ODD_MAX - (ODD_FOREMAN_SECS * ODD_TIME) / ODD_CAP, 'Foreman', 'FOREMAN', '#b45309', '#fde68a', 'Clean and quick. The crew could learn from you.'],
  [ODD_MAX - ODD_KEYS.length * ODD_TIME, 'Groundskeeper', 'KEEPER', '#15803d', '#bbf7d0', 'Not one double pass. Careful work.'],
  [ODD_MAX - 2 * ODD_REPLAY - ODD_KEYS.length * ODD_TIME, 'Handyman', 'HANDY', '#0e7490', '#a5f3fc', 'A redo or two, and the job got done.'],
  [ODD_MAX - 5 * ODD_REPLAY - ODD_KEYS.length * ODD_TIME, 'Weekend Warrior', 'WARRIOR', '#be185d', '#fbcfe8', 'Plenty of second passes, but it all got done.'],
  [0, 'Couch Potato', 'COUCH', '#475569', '#e2e8f0', 'The chores will be here tomorrow.'],
];
export function oddTierOf(points, allSolved = true) {
  if (!allSolved) return ODD_RANKS.length - 1;
  const p = Number(points) || 0;
  for (let i = 0; i < ODD_RANKS.length; i++) if (p >= ODD_RANKS[i][0] - 1e-9) return i;
  return ODD_RANKS.length - 1;
}
// "You are a Foreman" (every rung takes "a").
export const oddSentence = (name) => `You are a ${name}`;
