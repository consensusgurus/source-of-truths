// SPACE CADET: the daily spatial run (owner, 2026-11-07).
//
// Roll, Parker, Tangled, Topple (owner's order), then Pack from 2026-11-15, back
// to back on one page (app/spacecadet). "Space Cadet" is the run's NAME only, never a rung.
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
// PACK IS THE FIFTH LEG from SPACE_PACK_FROM (owner, 2026-11-14). Days before it ran four.
export const SPACE_KEYS_BEFORE = ['roll', 'park', 'tangled', 'topple'];
export const SPACE_PACK_FROM = '2026-11-15';
export const SPACE_KEYS = [...SPACE_KEYS_BEFORE, 'pack'];
export const spaceLegsFor = (iso) => (iso && iso < SPACE_PACK_FROM ? SPACE_KEYS_BEFORE.length : SPACE_KEYS.length);
export const SPACE_FROM = '2026-11-07';
export const SPACE_CAP = 300;            // seconds: a leg this slow pays 0
export const SPACE_LEG_MAX = 100;
export const SPACE_MAX = SPACE_KEYS.length * SPACE_LEG_MAX;
export const spaceMaxFor = (iso) => spaceLegsFor(iso) * SPACE_LEG_MAX;

export const SPACE_FORMS = {
  roll: { name: 'Roll', form: 'The Die', chip: 'Light the squares in order', band: '#fda4af' },
  park: { name: 'Parker', form: 'The Lot', chip: 'Slide the red car out', band: '#fde68a' },
  tangled: { name: 'Tangled', form: 'The Ropes', chip: 'Untangle every rope', band: '#a7e8cf' },
  topple: { name: 'Topple', form: 'The Block', chip: 'Land the block on the spring', band: '#d8b4fe' },
  pack: { name: 'Pack', form: 'The Trunk', chip: 'Fit it all in', band: '#fdba74' },
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
// The point cutoffs are the time cutoffs read through (legs x 100) - T/3. Four legs
// keep the cutoffs they launched with; five legs (with Pack) get 4:30 / 6:00 / 7:45 /
// 9:45 / 12:30. BOTH SETS ARE PLACEHOLDERS until real times exist.
const TIMES = { 4: [195, 255, 330, 420, 540], 5: [270, 360, 465, 585, 750] };
const NAMES = [
  ['Architect-Engineer', 'ARCHITECT', '#1e3a8a', '#bfdbfe', 'Sees the building before it is built.'],
  ['Air Traffic Controller', 'ATC', '#0e7490', '#a5f3fc', 'Keeps a hundred planes apart.'],
  ['Surveyor', 'SURVEYOR', '#15803d', '#bbf7d0', 'Maps the land by eye.'],
  ['Moving Day Pro', 'MOVER', '#b45309', '#fde68a', 'Gets the couch up the stairs.'],
  ['Flat-Pack Assembler', 'FLAT-PACK', '#be185d', '#fbcfe8', 'Only two screws left over.'],
];
export function spaceRanksFor(legs = SPACE_KEYS.length) {
  const t = TIMES[legs] || TIMES[5], max = legs * SPACE_LEG_MAX;
  return [...NAMES.map((n, i) => [Math.round(max - t[i] / 3), ...n, t[i]]), [0, 'Lost in Space', 'LOST', '#475569', '#e2e8f0', 'Finished, eventually. Tomorrow, the same run, quicker.', null]];
}
export const SPACE_RANKS = spaceRanksFor();
export function spaceTierOf(points, allSolved = true, legs = SPACE_KEYS.length) {
  const R = spaceRanksFor(legs);
  if (!allSolved) return R.length - 1;
  const p = Number(points) || 0;
  for (let i = 0; i < R.length; i++) if (p >= R[i][0]) return i;
  return R.length - 1;
}
