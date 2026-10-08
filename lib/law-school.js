// LAW SCHOOL, the run (owner, 2026-10-08): mindloftdaily.com/lawyering.
//
// The five logic dailies closest to legal reasoning, back to back, then an
// admissions verdict: the run total decides which law school takes you, from
// Charleston to Yale. It is the Deduction circuit (lib/circuits 'deduction')
// played as one page, so the circuit id, its trophy and its archive carry on.
//
// SCORING. Every game keeps its own scale on its own board (Sworn and Hearsay
// out of 12, Suffice out of 8 or 12, Docket out of 5, Alibi out of 12 or 15).
// The run scales each to 10 and adds them: one score out of 50, rounded to a
// whole point. /api/quiz/daily-combined does the same sum for the board
// (rankByCorrect with the circuit's `scale`), so the verdict and the
// leaderboard can never disagree.
//
// THE LADDER is eight real schools from the 2026-27 U.S. News law rankings,
// spread across the country the way Passport spreads its passports, Yale at
// the top and Charleston (tied for the last numbered rank, 171) at the bottom.
// Cutoffs are weighted to the low end, as Price Check's are (owner rule:
// more players should land in the bottom two and want to come back). They
// were set against the Deduction circuit's full-run scores for the first week
// of October 2026, whose median sat near 33.
//
// Colors are the schools' colors only. No crest, seal or logo is drawn.

export const LAW_RUN_ID = 'deduction';
export const LAW_PATH = '/lawyering';
export const LAW_KEYS = ['sworn', 'hearsay', 'suffice', 'docket', 'alibi'];

// The case file each game is dressed as, in run order.
export const LAW_CASES = {
  sworn: { file: 'Testimony', chip: 'Find the liar under oath' },
  hearsay: { file: 'Hearsay', chip: 'What did each one know?' },
  suffice: { file: 'Sufficiency', chip: 'Is the evidence enough?' },
  docket: { file: 'Reasoning', chip: 'One setup, five questions' },
  alibi: { file: 'The Alibi', chip: 'Break the story' },
};

// [cutoff out of 50, school, short name, city, line, primary, secondary]
export const LAW_LADDER = [
  [48, 'Yale Law School', 'YALE', 'New Haven, CT', 'The committee read your file once and stood up. Full ride, front row.', '#00356b', '#dbe7f5'],
  [45, 'Harvard Law School', 'HARVARD', 'Cambridge, MA', 'The thick envelope from Cambridge. Thanksgiving will never be the same.', '#a51c30', '#f3dfe2'],
  [42, 'Georgetown Law', 'GEORGETOWN', 'Washington, DC', 'Inside the top tier and two blocks from the Capitol. The Hill is hiring.', '#041e42', '#a3a8b4'],
  [39, 'USC Gould School of Law', 'USC', 'Los Angeles, CA', 'Cardinal and gold. Entertainment law is calling, and so is the beach.', '#990000', '#ffc72c'],
  [36, 'University of Florida Levin College of Law', 'FLORIDA', 'Gainesville, FL', 'The Gators said yes. Bar prep with sunshine included.', '#0021a5', '#fa4616'],
  [33, 'University of Houston Law Center', 'HOUSTON', 'Houston, TX', 'Energy law in the energy capital. A strong file with room to climb.', '#c8102e', '#f2d2d7'],
  [27, 'Brooklyn Law School', 'BROOKLYN', 'Brooklyn, NY', 'A Brooklyn admit and a subway pass. The big firms are a few stops away.', '#3b2a5c', '#c9bde0'],
  [0, 'Charleston School of Law', 'CHARLESTON', 'Charleston, SC', 'You are in, off the last page of the waitlist. Tomorrow is a fresh exam.', '#1f3a5f', '#c8a95b'],
];

export function lawTierOf(points) {
  const p = Number(points) || 0;
  for (let i = 0; i < LAW_LADDER.length; i++) if (p >= LAW_LADDER[i][0]) return i;
  return LAW_LADDER.length - 1;
}

// The admissions score: the run total read on the familiar 120 to 180 scale.
export function lawIndexOf(points) {
  return 120 + Math.round(60 * Math.max(0, Math.min(50, Number(points) || 0)) / 50);
}

// One game's share of the run, on the 0 to 10 scale.
export function lawPart(score, total) {
  const t = Number(total) || 0;
  return t > 0 ? 10 * Math.max(0, Math.min(t, Number(score) || 0)) / t : 0;
}
