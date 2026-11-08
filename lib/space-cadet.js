// SPACE CADET: the daily spatial run (owner, 2026-11-07).
//
// Roll, Parker, Tangled, then Topple (owner's order), back to back on one page
// (app/spacecadet). "Space Cadet" is the run's NAME only, never a rung.
//
// TIME DECIDES (the approved mockup: "One clock across all four puzzles. Your
// time decides your rank"). Each leg pays up to 100 points for SPEED alone,
// and only when it is solved: 100 at no time at all, falling one point every
// three seconds to 0 at SPACE_CAP (five minutes). A leg not solved pays 0. So
// with all four solved the run total is 400 minus a third of the total time,
// and the board ranks exactly on the clock; a give-up sits below every finish.
// The moves graded on each game's own page are not counted here.
//
// The ladder is the mockup's, in time: Architect-Engineer under 3:15 across
// all four, Air Traffic Controller under 4:15, Surveyor under 5:30, Moving Day
// Pro under 7:00, Flat-Pack Assembler under 9:00, Lost in Space otherwise, and
// Lost in Space for any run with a leg not solved. THE CUTOFFS ARE
// PLACEHOLDERS, to be tuned from real times once a fortnight of runs exists.

export const SPACE_RUN_ID = 'spacecadet';
export const SPACE_PATH = '/spacecadet';
export const SPACE_KEYS = ['roll', 'park', 'tangled', 'topple'];
export const SPACE_FROM = '2026-11-07';
export const SPACE_CAP = 300;            // seconds: a leg this slow pays 0
export const SPACE_LEG_MAX = 100;
export const SPACE_MAX = SPACE_KEYS.length * SPACE_LEG_MAX;

export const SPACE_FORMS = {
  roll: { name: 'Roll', form: 'The Die', chip: 'Light the squares in order', band: '#fda4af' },
  park: { name: 'Parker', form: 'The Lot', chip: 'Slide the red car out', band: '#fde68a' },
  tangled: { name: 'Tangled', form: 'The Ropes', chip: 'Untangle every rope', band: '#a7e8cf' },
  topple: { name: 'Topple', form: 'The Block', chip: 'Land the block on the spring', band: '#d8b4fe' },
};

export function spaceLegPoints(score, secs) {
  if (!(Number(score) > 0)) return 0;
  const s = Number(secs);
  // no clock on file (a result banked on another device): no speed points
  if (!Number.isFinite(s) || s <= 0) return 0;
  return Math.max(0, SPACE_LEG_MAX * (1 - Math.min(s, SPACE_CAP) / SPACE_CAP));
}
// The circuit board's scorer: (key, row) => points, off a filed result row.
export function spaceScorerFor() {
  return (key, p) => spaceLegPoints(p && p.score, p && p.timeElapsed);
}

// [cutoff in points, name, short, chip colour, stripe, line, under (seconds)].
// The point cutoffs are the time cutoffs read through 400 - T/3.
const pts = (secs) => Math.round(SPACE_MAX - secs / 3);
export const SPACE_RANKS = [
  [pts(195), 'Architect-Engineer', 'ARCHITECT', '#1e3a8a', '#bfdbfe', 'Sees the building before it is built.', 195],
  [pts(255), 'Air Traffic Controller', 'ATC', '#0e7490', '#a5f3fc', 'Keeps a hundred planes apart.', 255],
  [pts(330), 'Surveyor', 'SURVEYOR', '#15803d', '#bbf7d0', 'Maps the land by eye.', 330],
  [pts(420), 'Moving Day Pro', 'MOVER', '#b45309', '#fde68a', 'Gets the couch up the stairs.', 420],
  [pts(540), 'Flat-Pack Assembler', 'FLAT-PACK', '#be185d', '#fbcfe8', 'Only two screws left over.', 540],
  [0, 'Lost in Space', 'LOST', '#475569', '#e2e8f0', 'Finished, eventually. Tomorrow, the same four, quicker.', null],
];
export function spaceTierOf(points, allSolved = true) {
  if (!allSolved) return SPACE_RANKS.length - 1;
  const p = Number(points) || 0;
  for (let i = 0; i < SPACE_RANKS.length; i++) if (p >= SPACE_RANKS[i][0]) return i;
  return SPACE_RANKS.length - 1;
}
