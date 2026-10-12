// ENTER THE DOJO, the run (owner, 2026-10-12): mindloftdaily.com/dojo.
//
// Three sudokus back to back on one page: Sixes (the 6x6 warm-up), Suds (the
// classic 9x9), then ONE variant that stays close to plain sudoku, dealt by
// the Eastern date from DOJO_POOL. Then a belt: the run total decides which
// belt you tie on, from white up to black.
//
// It is the 'dojo' circuit in lib/circuits.js played as one page, exactly the
// way Judged plays 'deduction': every grid is the real game mounted through
// app/RunEmbed.jsx, so each one files its own ordinary row and keeps its own
// board. Only this run and the circuit board read the combined number.
//
// SCORING is out of 100, half solving and half speed, Judged's rule: each grid
// is worth its weight (Sixes 30, Suds 35, the variant 35), half for solving it
// and half for speed, and the speed half is earned only on a solve. Speed is 1
// at or under PAR and falls in a straight line to 0 at CAP. PAR is the fastest
// tenth of solves and CAP the 75th percentile, measured off each game's daily
// boards for 2026-09-17 to 10-11:
//   sixes    10%  47s  25%   65s  median   89s  75%  119s
//   suds     10% 201s  25%  271s  median  350s  75%  503s
//   (variants, see DOJO_CLOCK below)
// A sudoku is right or it is not (a solve is 10/10, a reveal 0), so in
// practice this run is a race: solve all three at the median clock and you
// land about 75, a Blue belt; only near-par on all three ties on Black.

export const DOJO_RUN_ID = 'dojo';
export const DOJO_PATH = '/dojo';

// The two fixed grids, in play order, then the day's variant.
export const DOJO_FIXED = ['sixes', 'suds'];
// THE VARIANT POOL (owner, 2026-10-12: "one of the variants that is relatively
// true to sudoku: sando, mercury, frame, and the like"). Every member is a 9x9
// sudoku with the ordinary rules plus one extra. Left out on purpose: Towers
// (skyscrapers, not a sudoku), Rim (no digits inside the grid at all) and
// Sixes/Suds themselves. Interleaved so neighbouring days differ in flavour:
// a sum rule is never followed by another sum rule.
export const DOJO_POOL = ['sando', 'quilt', 'mercury', 'cages', 'knight', 'polka', 'frame', 'diag'];

// The variant for an ET 'YYYY-MM-DD': a step through the pool, one a day,
// deterministic from the date alone (no bank, no storage), so the server, the
// board route, the share card and the browser always agree.
export function dojoVariantFor(iso) {
  const idx = Math.floor(Date.parse(`${iso}T12:00:00Z`) / 86400000) || 0;
  const n = DOJO_POOL.length;
  return DOJO_POOL[((idx % n) + n) % n];
}

// How each grid is dressed on the page. `form` is the kata name.
export const DOJO_FORMS = {
  sixes: { form: 'Warm-up', chip: '6x6, every digit once', phrase: 'a six by six warm-up' },
  suds: { form: 'The Classic', chip: '9x9, the original', phrase: 'a classic nine by nine' },
  sando: { form: 'Sandwich', chip: 'Sums between the 1 and the 9', phrase: 'a sandwich sudoku' },
  quilt: { form: 'Jigsaw', chip: 'Boxes are not boxes', phrase: 'a jigsaw sudoku' },
  mercury: { form: 'Thermo', chip: 'Digits climb every thermometer', phrase: 'a thermo sudoku' },
  cages: { form: 'Killer', chip: 'Only the cage sums', phrase: 'a killer sudoku' },
  knight: { form: 'Anti-Knight', chip: 'No repeat a knight move away', phrase: 'an anti-knight sudoku' },
  polka: { form: 'Kropki', chip: 'Dots between the digits', phrase: 'a kropki sudoku' },
  frame: { form: 'Frame', chip: 'Sums at every edge', phrase: 'a frame sudoku' },
  diag: { form: 'Diagonal', chip: 'Both diagonals too', phrase: 'a diagonal sudoku' },
};

export const DOJO_WEIGHT = { sixes: 30, suds: 35, variant: 35 };
export const DOJO_MAX = 100;
export function dojoWeight(key) {
  return DOJO_WEIGHT[key] || DOJO_WEIGHT.variant;
}

// [PAR, CAP] in seconds. Variants measured the same way (solves only):
//   sando    10% 524s  median 1072s  75% 2361s
//   mercury  10% 322s  median  847s  75% 2027s
//   frame    10% 546s  median 1127s  75% 1894s
//   knight   10% 283s  median  820s  75% 1265s
//   diag     10% 458s  median 1143s  75% 2125s
//   quilt    10% 279s  median  500s  75%  953s
//   cages    10% 804s  median 2095s  75% 6047s  (CAP held at an hour: the
//            killer's slow tail is long, and a cap past 60 minutes would pay
//            speed points for a grid left open over lunch)
//   polka    10% 850s  median 1519s  75% 3457s  (37 solves, thin; re-measure)
export const DOJO_CLOCK = {
  sixes: [47, 119], suds: [201, 503],
  sando: [524, 2361], mercury: [322, 2027], frame: [546, 1894], knight: [283, 1265], diag: [458, 2125],
  quilt: [279, 953], cages: [804, 3600], polka: [850, 3457],
};

export function dojoAcc(score, total) {
  const t = Number(total) || 0;
  return t > 0 ? Math.max(0, Math.min(t, Number(score) || 0)) / t : 0;
}
export function dojoSpeed(key, secs) {
  const c = DOJO_CLOCK[key];
  const s = Number(secs);
  if (!c || !Number.isFinite(s) || s <= 0) return 0;
  const [par, cap] = c;
  if (s <= par) return 1;
  if (s >= cap) return 0;
  return (cap - s) / (cap - par);
}
// One grid's points, 0 to its weight, unrounded.
export function dojoGridPoints(key, score, total, secs) {
  return dojoWeight(key) * dojoAcc(score, total) * (0.5 + 0.5 * dojoSpeed(key, secs));
}
// The board's scorer: one combined-board perGame row in, points out.
export function dojoScorer(key, p) {
  return dojoGridPoints(key, p && p.score, p && p.total, p && p.timeElapsed);
}

// THE BELTS, top to bottom: [cutoff out of 100, name, short, belt colour,
// stripe colour, line]. The stripe is the tab at the belt's end, drawn on the
// black belt in gold the way a dan grade is.
export const DOJO_BELTS = [
  [96, 'Black Belt', 'BLACK', '#15161a', '#e9cf7f', 'The sensei bows first. Three grids, clean and fast.'],
  [90, 'Brown Belt', 'BROWN', '#6b3f1f', '#e7c9a4', 'One quick grid from black. The dojo has noticed.'],
  [84, 'Purple Belt', 'PURPLE', '#6d3fb8', '#e4d6f7', 'Sharp on all three. Speed is the last thing left to find.'],
  [77, 'Blue Belt', 'BLUE', '#2563eb', '#dbe6ff', 'A solid practitioner. Every grid fell, most of them briskly.'],
  [70, 'Green Belt', 'GREEN', '#2e8b4f', '#d6f2df', 'Three grids solved at a steady pace. The basics are yours.'],
  [62, 'Orange Belt', 'ORANGE', '#ea7a1f', '#fde3cc', 'You got through the forms. Tomorrow, the same three, quicker.'],
  [50, 'Yellow Belt', 'YELLOW', '#e8bf26', '#fbf1c6', 'All three grids solved, at your own pace. A real start.'],
  [0, 'White Belt', 'WHITE', '#f4f1ea', '#c9c3b4', 'Everyone starts here. Come back tomorrow and tie on a colour.'],
];

export function dojoTierOf(points) {
  const p = Number(points) || 0;
  for (let i = 0; i < DOJO_BELTS.length; i++) if (p >= DOJO_BELTS[i][0]) return i;
  return DOJO_BELTS.length - 1;
}
