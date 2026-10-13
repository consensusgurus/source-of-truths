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
// is worth its weight (Sixes 25, Suds 35, the variant 40: each form is worth more than the one before, owner 2026-10-12), half for solving it
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
// Sixes/Suds themselves. Interleaved so neighbouring days differ in flavor:
// a sum rule is never followed by another sum rule.
// NO CAGES, NO POLKA (owner, 2026-10-12, launch evening): both left the pool
// from 2026-10-13. Launch day dealt from the original eight, and that day keeps
// the variant it was played with (DOJO_POOL_BEFORE).
// ARROW JOINS FROM 2026-10-14 (owner, 2026-10-13), between Quilt and Mercury so
// no sum rule follows another (Sando and Frame are the other sums). The pool
// is DATED as a chain: each `before` covers days up to its `until` and may
// carry an older `before` of its own, so every played day keeps the variant
// it was dealt.
// SUMO JOINS FROM 2026-10-14 TOO (owner, 2026-10-13). That day was not yet
// played, so the pool just grows to eight. Sums (Sando, Arrow, Frame) are
// never neighbours around the cycle, nor are the two order rules (Mercury,
// Sumo), and 2026-10-14 still deals Diag, as it did on the seven-game pool.
export const DOJO_POOL = ['sando', 'quilt', 'arrow', 'mercury', 'diag', 'sumo', 'frame', 'knight'];
export const DOJO_POOL_BEFORE = {
  until: '2026-10-13', pool: ['sando', 'quilt', 'mercury', 'knight', 'frame', 'diag'],
  before: { until: '2026-10-12', pool: ['sando', 'quilt', 'mercury', 'cages', 'knight', 'polka', 'frame', 'diag'] },
};
// Every game any era of the pool has dealt, for the run-games registry.
export const DOJO_ALL_POOLS = (() => {
  const out = [...DOJO_POOL];
  for (let b = DOJO_POOL_BEFORE; b; b = b.before) out.push(...b.pool);
  return [...new Set(out)];
})();

// The variant for an ET 'YYYY-MM-DD': a step through the pool, one a day,
// deterministic from the date alone (no bank, no storage), so the server, the
// board route, the share card and the browser always agree.
export function dojoPoolFor(iso) {
  if (!iso) return DOJO_POOL;
  let pool = DOJO_POOL;
  for (let b = DOJO_POOL_BEFORE; b; b = b.before) if (iso <= b.until) pool = b.pool;
  return pool;
}
export function dojoVariantFor(iso) {
  const idx = Math.floor(Date.parse(`${iso}T12:00:00Z`) / 86400000) || 0;
  const pool = dojoPoolFor(iso);
  const n = pool.length;
  return pool[((idx % n) + n) % n];
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
  arrow: { form: 'Arrow', chip: 'Circles sum their arrows', phrase: 'an arrow sudoku' },
  sumo: { form: 'Greater-Than', chip: 'Every bend points at the smaller', phrase: 'a greater-than sudoku' },
};

export const DOJO_WEIGHT = { sixes: 25, suds: 35, variant: 40 };
export const DOJO_MAX = 100;
export function dojoWeight(key) {
  return DOJO_WEIGHT[key] || DOJO_WEIGHT.variant;
}

// THE CLOCKS ADAPT (owner, 2026-10-12: "too hard on the time element, make it
// modestly easier to rank higher on an empty board, but adapt it as average
// times come in").
//
// SEED. The launch clocks were cut from each game's top-10 boards (the only
// readable source), which is the FAST end of the field, so speed was graded
// against the quickest players. The seed below is looser on the fast end: PAR
// is the top-10 boards' 25th percentile (was the 10th), CAP stays their 75th.
// A median top-10 pace now lands Blue or Purple (was Green or Blue).
// Measured 2026-09-17 to 10-11:
//            10%    25%   median    75%     seed [PAR, CAP]
//   sixes    47s    65s     89s    119s     [65, 119]
//   suds    201s   271s    350s    503s     [271, 503]
//   sando   524s   710s   1072s   2361s     [710, 2361]
//   quilt   279s   352s    500s    953s     [352, 953]
//   mercury 322s   467s    847s   2027s     [467, 2027]
//   knight  283s   460s    820s   1265s     [460, 1265]
//   frame   546s   737s   1127s   1894s     [737, 1894]
//   diag    458s   629s   1143s   2125s     [629, 2125]
//   cages, polka: launch day only (left the pool from 2026-10-13).
//
// ADAPTING. Each Eastern day's clocks are recomputed on the server from EVERY
// solve of that game (not just a top 10) over the 28 days BEFORE it
// (lib/dojo-clocks.js): PAR = 25th percentile, CAP = 90th. The measured clock
// is blended with the seed by how many solves back it, reaching the measured
// clock alone at DOJO_FULL_TRUST solves, so a thin game leans on the seed. A
// day's clocks only ever read days before it, so they are FIXED for that day:
// the verdict a player sees at the finish and the board read later agree, and
// an archived day never re-scores. setDojoClocks/dojoClocksFor carry the
// day's clocks to every caller; anything that has not been primed falls back
// to the seed.
export const DOJO_CLOCK = {
  sixes: [65, 119], suds: [271, 503],
  sando: [710, 2361], quilt: [352, 953], mercury: [467, 2027], knight: [460, 1265], frame: [737, 1894], diag: [629, 2125],
  cages: [1195, 3600], polka: [1178, 3457],
  // Arrow had no boards when it joined (2026-10-14): seeded between Knight
  // and Mercury, the nearest grids in shape. The adaptive clocks replace it as
  // solves come in.
  arrow: [470, 1900],
  // Sumo had no boards when it joined (2026-10-14) either: seeded between
  // Knight and Diag, and the adaptive clocks replace it as solves come in.
  sumo: [520, 1500],
};
export const DOJO_WINDOW_DAYS = 28;
export const DOJO_MIN_SOLVES = 15;
export const DOJO_FULL_TRUST = 80;

// Blend a seed clock with a measured [p25, p90] backed by n solves.
export function dojoBlendClock(seed, measured, n) {
  if (!measured || !(n >= DOJO_MIN_SOLVES)) return seed;
  const w = Math.min(1, n / DOJO_FULL_TRUST);
  const par = Math.round(seed[0] * (1 - w) + measured[0] * w);
  let cap = Math.round(seed[1] * (1 - w) + measured[1] * w);
  if (cap < par * 1.5) cap = Math.round(par * 1.5);
  return [par, cap];
}

const DAY_CLOCKS = new Map();
export function setDojoClocks(iso, clocks) {
  if (iso && clocks) DAY_CLOCKS.set(iso, { ...DOJO_CLOCK, ...clocks });
}
export function dojoClocksFor(iso) {
  return (iso && DAY_CLOCKS.get(iso)) || DOJO_CLOCK;
}

export function dojoAcc(score, total) {
  const t = Number(total) || 0;
  return t > 0 ? Math.max(0, Math.min(t, Number(score) || 0)) / t : 0;
}
export function dojoSpeed(key, secs, clocks = DOJO_CLOCK) {
  const c = (clocks && clocks[key]) || DOJO_CLOCK[key];
  const s = Number(secs);
  if (!c || !Number.isFinite(s) || s <= 0) return 0;
  const [par, cap] = c;
  if (s <= par) return 1;
  if (s >= cap) return 0;
  return (cap - s) / (cap - par);
}
// One grid's points, 0 to its weight, unrounded.
export function dojoGridPoints(key, score, total, secs, clocks = DOJO_CLOCK) {
  return dojoWeight(key) * dojoAcc(score, total) * (0.5 + 0.5 * dojoSpeed(key, secs, clocks));
}
// The board's scorer for one Eastern day: one combined-board perGame row in,
// points out, graded on that day's clocks.
export function dojoScorerFor(iso) {
  const clocks = dojoClocksFor(iso);
  return (key, p) => dojoGridPoints(key, p && p.score, p && p.total, p && p.timeElapsed, clocks);
}

// THE BELTS, top to bottom: [cutoff out of 100, name, short, belt color,
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
  [0, 'White Belt', 'WHITE', '#f4f1ea', '#c9c3b4', 'Everyone starts here. Come back tomorrow and tie on a color.'],
];

export function dojoTierOf(points) {
  const p = Number(points) || 0;
  for (let i = 0; i < DOJO_BELTS.length; i++) if (p >= DOJO_BELTS[i][0]) return i;
  return DOJO_BELTS.length - 1;
}
