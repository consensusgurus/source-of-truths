// LAW SCHOOL, the run (owner, 2026-10-08): mindloftdaily.com/judged.
//
// The five logic dailies closest to legal reasoning, back to back, then an
// admissions verdict: the run total decides which law school takes you, from
// Charleston to Yale. It is the Deduction circuit (lib/circuits 'deduction')
// played as one page, so the circuit id, its trophy and its archive carry on.
//
// SCORING. Every game keeps its own scale on its own board (Sworn, Axiom and
// Hearsay out of 12, Docket out of 5, Alibi out of 12 or 15).
// SUFFICE LEFT THE RUN (owner, 2026-10-08): its data-sufficiency questions
// are often arithmetic, so Axiom (find the hidden rule, word rules only)
// took its seat as the Precedent case.
// The run scales each to 10 and adds them: one score out of 50, rounded to a
// whole point. /api/quiz/daily-combined does the same sum for the board
// (rankByCorrect with the circuit's `scale`), so the verdict and the
// leaderboard can never disagree.
//
// THE LADDER is eight rungs, Yale and Harvard fixed and six rotating pools of
// real schools from the 2026-27 U.S. News law rankings (see LAW_RUNGS).
// Cutoffs are weighted to the low end, as Price Check's are (owner rule:
// more players should land in the bottom two and want to come back). They
// were set against the Deduction circuit's full-run scores for the first week
// of October 2026, whose median sat near 33.
//
// Colors are the schools' colors only. No crest, seal or logo is drawn.

export const LAW_RUN_ID = 'deduction';
export const LAW_PATH = '/judged';
export const LAW_KEYS = ['sworn', 'axiom', 'hearsay', 'docket', 'alibi'];

// The case file each game is dressed as, in run order.
export const LAW_CASES = {
  sworn: { file: 'Testimony', chip: 'Find the liar under oath' },
  hearsay: { file: 'Hearsay', chip: 'What did each one know?' },
  axiom: { file: 'Precedent', chip: 'Find the rule behind the rulings' },
  docket: { file: 'Reasoning', chip: 'One setup, five questions' },
  alibi: { file: 'The Alibi', chip: 'Break the story' },
};

// THE LADDER ROTATES (owner, 2026-10-08). Yale and Harvard are fixed at the
// top. Every rung below them is a POOL of real schools from the same band of
// the 2026-27 U.S. News law rankings, and each pool deals a different school
// every Eastern day, deterministically from the date (no bank, no storage),
// so the server, the share card and the browser always agree. Pools sit
// strictly below Harvard (#6): schools ranked above it (Stanford, Chicago,
// Penn, Virginia) are left out so no rung inverts the ranking. Florida is
// left out by owner ruling. Each pool's line describes the rung, not the
// school, so it reads true whichever school is dealt.
//
// A school is [name, short, city, primary, secondary]. A rung is
// [cutoff out of 50, line, pool]. lawLadderFor(iso) returns the day's rungs
// in the shape every surface reads: [cutoff, name, short, city, line, primary, secondary].
const S = (name, short, city, p, s) => [name, short, city, p, s];
export const LAW_RUNGS = [
  [48, 'The committee read your file once and stood up. Full ride, front row.', [
    S('Yale Law School', 'YALE', 'New Haven, CT', '#00356b', '#dbe7f5'),
  ]],
  [45, 'The thick envelope. Thanksgiving will never be the same.', [
    S('Harvard Law School', 'HARVARD', 'Cambridge, MA', '#a51c30', '#f3dfe2'),
  ]],
  // U.S. News #7 to #13
  [42, 'Inside the top tier. The big firms call you first.', [
    S('NYU School of Law', 'NYU', 'New York, NY', '#57068c', '#efe3fa'),
    S('Duke University School of Law', 'DUKE', 'Durham, NC', '#012169', '#c8d3ee'),
    S('Columbia Law School', 'COLUMBIA', 'New York, NY', '#1d4f91', '#b9d9eb'),
    S('University of Michigan Law School', 'MICHIGAN', 'Ann Arbor, MI', '#00274c', '#ffcb05'),
    S('Northwestern Pritzker School of Law', 'NORTHWESTERN', 'Chicago, IL', '#4e2a84', '#e4e0ee'),
    S('Vanderbilt Law School', 'VANDERBILT', 'Nashville, TN', '#1c1c1c', '#cfae70'),
    S('Cornell Law School', 'CORNELL', 'Ithaca, NY', '#b31b1b', '#f7e0e0'),
    S('UCLA School of Law', 'UCLA', 'Los Angeles, CA', '#2774ae', '#ffd100'),
    S('WashU Law', 'WASHU', 'St. Louis, MO', '#a51417', '#f1e3e3'),
  ]],
  // #16 to #26
  [39, 'A top-25 seat with a serious career office behind it.', [
    S('University of Texas School of Law', 'TEXAS', 'Austin, TX', '#bf5700', '#fff1e6'),
    S('Berkeley Law', 'BERKELEY', 'Berkeley, CA', '#003262', '#fdb515'),
    S('Georgetown Law', 'GEORGETOWN', 'Washington, DC', '#041e42', '#a3a8b4'),
    S('UNC School of Law', 'UNC', 'Chapel Hill, NC', '#13294b', '#7bafd4'),
    S('Notre Dame Law School', 'NOTRE DAME', 'Notre Dame, IN', '#0c2340', '#c99700'),
    S('Boston College Law School', 'BC LAW', 'Newton, MA', '#8a100b', '#bc9b6a'),
    S('USC Gould School of Law', 'USC', 'Los Angeles, CA', '#990000', '#ffc72c'),
    S('George Washington University Law School', 'GW LAW', 'Washington, DC', '#033c5a', '#aa9868'),
    S('University of Georgia School of Law', 'GEORGIA', 'Athens, GA', '#ba0c2f', '#f4dadf'),
    S('University of Wisconsin Law School', 'WISCONSIN', 'Madison, WI', '#c5050c', '#f7dcdd'),
  ]],
  // #30 to #34, Florida excluded
  [36, 'A strong school and a real shot at the big firms.', [
    S('Ohio State Moritz College of Law', 'OHIO STATE', 'Columbus, OH', '#ba0c2f', '#e0e4e6'),
    S('Wake Forest University School of Law', 'WAKE FOREST', 'Winston-Salem, NC', '#1a1a1a', '#c9a75a'),
    S('University of Iowa College of Law', 'IOWA', 'Iowa City, IA', '#111111', '#ffcd00'),
    S('Antonin Scalia Law School at George Mason', 'GEORGE MASON', 'Arlington, VA', '#006633', '#ffcc33'),
    S('Baylor Law School', 'BAYLOR', 'Waco, TX', '#154734', '#ffb81c'),
    S('UC Irvine School of Law', 'UC IRVINE', 'Irvine, CA', '#0064a4', '#ffd200'),
    S('William & Mary Law School', 'W&M LAW', 'Williamsburg, VA', '#115740', '#d9c38f'),
    S('Washington and Lee University School of Law', 'W&L LAW', 'Lexington, VA', '#00205b', '#c8d3ee'),
    S('Florida State University College of Law', 'FSU LAW', 'Tallahassee, FL', '#782f40', '#ceb888'),
  ]],
  // #52 to #59
  [33, 'In, with a scholarship offer. A strong file with room to climb.', [
    S('UC Davis School of Law', 'UC DAVIS', 'Davis, CA', '#022851', '#ffbf00'),
    S('University of Colorado Law School', 'COLORADO', 'Boulder, CO', '#1b1b1b', '#cfb87c'),
    S('University of Houston Law Center', 'HOUSTON', 'Houston, TX', '#c8102e', '#f2d2d7'),
    S('University of San Diego School of Law', 'SAN DIEGO', 'San Diego, CA', '#003b70', '#c2d7ea'),
    S('University of Tennessee College of Law', 'TENNESSEE', 'Knoxville, TN', '#ff8200', '#1a1a1a'),
    S('UConn School of Law', 'UCONN', 'Hartford, CT', '#000e2f', '#c8d3ee'),
    S('Cardozo School of Law', 'CARDOZO', 'New York, NY', '#003256', '#c8d3ee'),
    S('University of Missouri School of Law', 'MIZZOU', 'Columbia, MO', '#111111', '#f1b82d'),
    S('Marquette University Law School', 'MARQUETTE', 'Milwaukee, WI', '#003366', '#ffcc00'),
  ]],
  // #90 to #105
  [27, 'A city school, a scrappy class, and a fresh start on the job hunt.', [
    S('University of Montana Blewett School of Law', 'MONTANA', 'Missoula, MT', '#70003c', '#ead5df'),
    S('University of Denver Sturm College of Law', 'DENVER', 'Denver, CO', '#8b2332', '#e2c99b'),
    S('University of Oregon School of Law', 'OREGON', 'Eugene, OR', '#154733', '#fee123'),
    S('Rutgers Law School', 'RUTGERS', 'Newark, NJ', '#cc0033', '#f6d6de'),
    S('Syracuse University College of Law', 'SYRACUSE', 'Syracuse, NY', '#f76900', '#000e54'),
    S('Brooklyn Law School', 'BROOKLYN', 'Brooklyn, NY', '#3b2a5c', '#c9bde0'),
    S('University of St. Thomas School of Law', 'ST. THOMAS', 'Minneapolis, MN', '#510c76', '#e0d3ea'),
    S('Chicago-Kent College of Law', 'CHICAGO-KENT', 'Chicago, IL', '#cc0000', '#f6d6d6'),
  ]],
  // tied for #171, the last numbered rank
  [0, 'You are in, off the last page of the waitlist. Tomorrow is a fresh exam.', [
    S('CUNY School of Law', 'CUNY', 'Long Island City, NY', '#1d3c78', '#f2b900'),
    S('UMass Law', 'UMASS', 'Dartmouth, MA', '#881c1c', '#f2d6d6'),
    S('Roger Williams University School of Law', 'RWU LAW', 'Bristol, RI', '#003a70', '#a0c4e8'),
    S('Charleston School of Law', 'CHARLESTON', 'Charleston, SC', '#1f3a5f', '#c8a95b'),
  ]],
];

// Which school each rung deals on an ET 'YYYY-MM-DD'. Each rung steps through
// its pool at its own stride from its own offset, so neighbouring rungs do not
// change in lockstep and every school is dealt in turn.
export function lawLadderFor(iso) {
  const day = Math.floor(Date.parse(`${iso || '2026-10-08'}T12:00:00Z`) / 86400000) || 0;
  return LAW_RUNGS.map(([cut, line, pool], r) => {
    const n = pool.length;
    const k = n === 1 ? 0 : (((day * (r % 2 ? 1 : n - 1) + r * 3) % n) + n) % n;
    const [name, short, city, p, s2] = pool[k];
    return [cut, name, short, city, line, p, s2];
  });
}

// Today's ladder at import time, for callers that only need the shape (the
// cutoffs never rotate). Surfaces that print a school read lawLadderFor(day).
export const LAW_LADDER = lawLadderFor(new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }));

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
