// Homepage color. Two tables with two different rules, and the difference is
// the point.
//
// DEPT_BLUE (live feed) is still ONE BLUE FAMILY, per the 2026-08-04 ruling:
// sixteen departments rendered as small chips, where the label carries the
// meaning and the color only groups. That ruling stands, unchanged, below.
//
// CAT_BLUE (daily categories) is NOT, as of 2026-08-25. The category shelf
// headers on the marquee home became FILLED BANDS, and a filled band is a
// different problem from a 7px dot. Measured on the old table:
//
//     one blue family   43 deg of hue,  21.5 L*
//     real hues        328 deg of hue,  14.4 L*
//
// Read those the right way round. As dots, 43 deg is fine. As bands it is
// backwards: the shelves ended up differing in how DARK they were rather than
// in what color they were, so Word (24.6 L*) read as heavier and more important
// than Trivia (46.1 L*) - a ranking nobody intended. Real hues invert it,
// giving distinct colors at near-equal weight, which is what a column of filled
// blocks needs. Filling the band therefore forced the hue decision; there was
// no cheap middle, and a blue-family TINT differentiated nothing either.
//
// The name CAT_BLUE is now historical and the values are not blues. It is kept
// because six call sites import it and a rename is a separate, mechanical
// change; do that on its own, not folded into a color edit.
//
// TWO RULES FOR ANYTHING THAT FILLS A BAND WITH THESE:
//   1. Every value clears 4.5:1 against PURE white and has no headroom beyond
//      it. NEVER dim band ink with opacity - white at .78 lands at 3.46 on the
//      old Word blue and small text fails. Hierarchy comes from size and weight.
//   2. Adjacent shelves in CAT_ORDER (app/today/TodayClient.jsx) are checked to
//      sit >=30 deg apart in hue, so neighbours are always tellable. Changing a
//      value means re-checking its neighbours, not just its own contrast.
//
// SCOPE: the homepage only. CAT_META (lib/DailyEndCard), DEPT_COLOR
// (lib/quiz-departments), and every game page keep their original colors, and
// are deliberately NOT imported here.

const FALLBACK = '#475569';

// Daily slate categories, one distinct hue each. Spread around the wheel rather
// than ordered by weight: the whole point is that no category outranks another.
// White ink on each of these is 5.02:1 or better; see the two rules above before
// changing any value.
export const CAT_BLUE = {
  word: '#2563eb',              // blue      219 deg
  crowd: '#4338ca',             // indigo    245
  'crowd psychology': '#4338ca',
  sudoku: '#7c3aed',            // violet    262
  cards: '#a21caf',             // magenta   295
  visual: '#a21caf',            // took the Cards step, 2026-11-12
  'table games': '#be123c',     // End Game and Cards merged, 2026-11-12
  'end game': '#be123c',        // crimson   345
  endgame: '#be123c',
  numbers: '#c2410c',           // orange     17
  arcade: '#92400e',            // umber      23
  trivia: '#14713a',            // green     145
  logic: '#0f766e',             // teal      175
  geography: '#155e75',         // deep cyan 194
};

// Quiz departments in the live feed. Sixteen departments into one family, so a
// few necessarily sit close together; the label carries the precise meaning and
// the color only groups.
export const DEPT_BLUE = {
  movies: '#1d4ed8', music: '#3730a3', gaming: '#4338ca', travel: '#0e6ba8',
  sports: '#2f6f9f', geography: '#075985', food: '#1e5fa8', business: '#3d5a80',
  science: '#1a4f7a', entertainment: '#4a4fb0', word: '#233a63', literature: '#334e7a',
  history: '#2563eb', arts: '#5145cd', school: '#2f6f9f', misc: '#475b78',
};

export const catBlue = (name) => CAT_BLUE[String(name || '').toLowerCase()] || FALLBACK;
export const deptBlue = (dept) => DEPT_BLUE[String(dept || '').toLowerCase()] || DEPT_BLUE.misc;

// Completion ring. Hue no longer carries good/bad, DEPTH does: a strong run
// renders deep navy, a weak one renders pale. The arc length and the printed
// percentage were always the real readout, so nothing measurable is lost by
// dropping the green/red traffic light (owner call, 2026-08-04).
export function ringBlue(pct) {
  const p = Number(pct) || 0;
  if (p >= 90) return '#233a63';
  if (p >= 70) return '#2563eb';
  if (p >= 40) return '#6f9ad8';
  return '#a9bcd8';
}
