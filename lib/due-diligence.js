// DUE DILIGENCE: the daily company run (owner, 2026-11-10).
//
// Tape, Filing, then Resume (owner's order: chart first, filing second, bio
// third), back to back on one page (app/duediligence). "Due Diligence" is the
// run's NAME only, never a rung. Inside the run each leg wears a label of its
// own (The stock, The company, The background check); on the rest of the site
// the three dailies keep their own names (owner, same day).
//
// CLUES DECIDE. Each leg pays what its own page pays: 11 minus the clues opened
// (10 on the first clue, 5 with all six open), 0 if it is not solved. So the
// run is out of 30, and the board adds the three rows exactly as filed.
//
// The ladder, low to high (owner): Anon Fintwit Account, Jim Cramer, Michael
// Burry, Stanley Druckenmiller, Ken Griffin. The cutoffs are placeholders, to
// be tuned once a fortnight of runs exists.

export const DD_RUN_ID = 'duediligence';
export const DD_PATH = '/duediligence';
export const DD_KEYS = ['tape', 'filing', 'resume'];
export const DD_FROM = '2026-11-10';
export const DD_LEG_MAX = 10;
export const DD_MAX = DD_KEYS.length * DD_LEG_MAX;

export const DD_FORMS = {
  tape: { name: 'Tape', form: 'The stock', chip: 'Name the company from its chart', band: '#7dd3fc' },
  filing: { name: 'Filing', form: 'The company', chip: 'Name the company from its IPO filing', band: '#a5b4fc' },
  resume: { name: 'Resume', form: 'The background check', chip: 'Name the person from their resume', band: '#93c5fd' },
};

export function ddLegPoints(score) {
  const v = Number(score);
  if (!(v > 0)) return 0;
  return Math.min(DD_LEG_MAX, Math.round(v));
}
// The circuit board's scorer: (key, row) => points, off a filed result row.
export function ddScorerFor() {
  return (key, p) => ddLegPoints(p && p.score);
}

// [cutoff in points, name, short, chip colour, stripe, line].
export const DD_RANKS = [
  [27, 'Ken Griffin', 'GRIFFIN', '#1e3a8a', '#bfdbfe', 'Knew the answer before the market opened.'],
  [23, 'Stanley Druckenmiller', 'DRUCK', '#0e7490', '#a5f3fc', 'Sized it up and bet big.'],
  [18, 'Michael Burry', 'BURRY', '#15803d', '#bbf7d0', 'Read the footnotes nobody else read.'],
  [10, 'Jim Cramer', 'CRAMER', '#b45309', '#fde68a', 'Loud, fast and right about half the time.'],
  [0, 'Anon Fintwit Account', 'ANON', '#475569', '#e2e8f0', 'Posted a hot take. Tomorrow, read the filing first.'],
];
export function ddTierOf(points) {
  const p = Number(points) || 0;
  for (let i = 0; i < DD_RANKS.length; i++) if (p >= DD_RANKS[i][0]) return i;
  return DD_RANKS.length - 1;
}
