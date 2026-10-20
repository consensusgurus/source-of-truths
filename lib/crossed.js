// CROSSED, the run (owner, 2026-10-20): mindloftdaily.com/crossed.
//
// Four crosswords back to back on one page, in the owner's order: Emcee (the
// mini), Encore (the big nine by nine), Arcos (three acrostics and a finale),
// then Glyph (the clueless number crossword). Then a rank: the run total
// decides which day's newspaper crossword you are ready for, Monday up to
// Saturday, and at the top "Solves in Pen".
//
// It is the 'crossed' circuit in lib/circuits.js played as one page, exactly
// the way Enter the Dojo plays 'dojo': every puzzle is the real game mounted
// through app/RunEmbed.jsx, so each one files its own ordinary row and keeps
// its own board. Only this run and the circuit board read the combined number.
//
// SCORING is out of 100 and SPEED IS MOST OF IT (owner, 2026-10-20: "we need
// to weight speed highly on this run... most all will finish"). Each puzzle is
// worth its weight (Emcee 15, Encore 25, Arcos 30, Glyph 30), a fifth of it for
// how much of the puzzle you got (score / total) and four fifths for speed, and
// the speed share is earned in proportion to how much you got. Speed is 1 at or
// under PAR and falls in a straight line to 0 at CAP.
//
// THE CLOCKS ADAPT, on the Dojo's rule (lib/crossed-clocks.js): each Eastern
// day's [PAR, CAP] per puzzle come from every solve of that game over the 28
// days before it (25th and 90th percentile), blended with the seed below by
// how many solves back it. A day's clocks only read days before it, so a day
// never re-scores. The seed is an estimate; the measured clocks replace it.

export const CROSSED_RUN_ID = 'crossed';
export const CROSSED_PATH = '/crossed';

// Play order is the owner's, not shortest first.
export const CROSSED_KEYS = ['emcee', 'encore', 'arcos', 'glyph'];

// How each puzzle is dressed on the page.
export const CROSSED_FORMS = {
  emcee: { form: 'The Mini', chip: 'Five by five, fair clues', phrase: 'the mini' },
  encore: { form: 'The Big One', chip: 'Nine by nine, every square crossed', phrase: 'the big nine by nine' },
  arcos: { form: 'The Acrostics', chip: 'Three acrostics and a finale', phrase: 'three acrostics' },
  glyph: { form: 'The Clueless', chip: 'Every letter is a number', phrase: 'the clueless number grid' },
};

export const CROSSED_WEIGHT = { emcee: 15, encore: 25, arcos: 30, glyph: 30 };
export const CROSSED_MAX = 100;
export const CROSSED_SPEED_SHARE = 0.8;
export function crossedWeight(key) {
  return CROSSED_WEIGHT[key] || 0;
}

// Seed [PAR, CAP] in seconds (estimates, 2026-10-20).
export const CROSSED_CLOCK = {
  emcee: [40, 180],
  encore: [360, 1500],
  arcos: [150, 720],
  glyph: [300, 1200],
};
export const CROSSED_WINDOW_DAYS = 28;
export const CROSSED_MIN_SOLVES = 15;
export const CROSSED_FULL_TRUST = 80;

export function crossedBlendClock(seed, measured, n) {
  if (!measured || !(n >= CROSSED_MIN_SOLVES)) return seed;
  const w = Math.min(1, n / CROSSED_FULL_TRUST);
  const par = Math.round(seed[0] * (1 - w) + measured[0] * w);
  let cap = Math.round(seed[1] * (1 - w) + measured[1] * w);
  if (cap < par * 1.5) cap = Math.round(par * 1.5);
  return [par, cap];
}

const DAY_CLOCKS = new Map();
export function setCrossedClocks(iso, clocks) {
  if (iso && clocks) DAY_CLOCKS.set(iso, { ...CROSSED_CLOCK, ...clocks });
}
export function crossedClocksFor(iso) {
  return (iso && DAY_CLOCKS.get(iso)) || CROSSED_CLOCK;
}

export function crossedAcc(score, total) {
  const t = Number(total) || 0;
  return t > 0 ? Math.max(0, Math.min(t, Number(score) || 0)) / t : 0;
}
export function crossedSpeed(key, secs, clocks = CROSSED_CLOCK) {
  const c = (clocks && clocks[key]) || CROSSED_CLOCK[key];
  const s = Number(secs);
  if (!c || !Number.isFinite(s) || s <= 0) return 0;
  const [par, cap] = c;
  if (s <= par) return 1;
  if (s >= cap) return 0;
  return (cap - s) / (cap - par);
}
// One puzzle's points, 0 to its weight, unrounded.
export function crossedGridPoints(key, score, total, secs, clocks = CROSSED_CLOCK) {
  const a = crossedAcc(score, total);
  return crossedWeight(key) * a * ((1 - CROSSED_SPEED_SHARE) + CROSSED_SPEED_SHARE * crossedSpeed(key, secs, clocks));
}
export function crossedScorerFor(iso) {
  const clocks = crossedClocksFor(iso);
  return (key, p) => crossedGridPoints(key, p && p.score, p && p.total, p && p.timeElapsed, clocks);
}

// THE RANKS, top to bottom: [cutoff out of 100, name, short, colour, stripe,
// line]. The newspaper crossword gets harder from Monday to Saturday; a solver
// at the top does it in pen.
export const CROSSED_BELTS = [
  [92, 'Solves in Pen', 'IN PEN', '#15161a', '#e9cf7f', 'No eraser, no hesitation. You could do Saturday in ink.'],
  [83, 'Saturday Solver', 'SATURDAY', '#b4232a', '#f6c9c9', 'The hardest grid of the week is yours. Ink is one clean run away.'],
  [72, 'Friday Solver', 'FRIDAY', '#c2410c', '#fde3cc', 'Quick through all four. Friday will not slow you down.'],
  [60, 'Thursday Solver', 'THURSDAY', '#a16207', '#fbf1c6', 'Thursday tricks and all. Speed is what is left to find.'],
  [45, 'Wednesday Solver', 'WEDNESDAY', '#2e8b4f', '#d6f2df', 'A steady midweek solver. Every grid fell at a fair pace.'],
  [30, 'Tuesday Solver', 'TUESDAY', '#2563eb', '#dbe6ff', 'You got through them. Tomorrow, the same four, quicker.'],
  [0, 'Monday Solver', 'MONDAY', '#f4f1ea', '#c9c3b4', 'Everyone starts on Monday. Come back tomorrow and climb the week.'],
];

export function crossedTierOf(points) {
  const p = Number(points) || 0;
  for (let i = 0; i < CROSSED_BELTS.length; i++) if (p >= CROSSED_BELTS[i][0]) return i;
  return CROSSED_BELTS.length - 1;
}

// The rank's three-letter tag, as it sits in one square of the week (MON to
// SAT, then PEN). Index as CROSSED_BELTS: 0 is In Pen, the last is Monday.
export function crossedDayTag(i) {
  if (i === 0) return 'PEN';
  const t = CROSSED_BELTS[i];
  return t ? String(t[2]).slice(0, 3) : '';
}

// Ink that reads on a rank's colour.
export function crossedInkOn(hex) {
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return '#0b0f1a';
  const n = parseInt(h, 16);
  const lin = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return L > 0.3 ? '#0b0f1a' : '#ffffff';
}
