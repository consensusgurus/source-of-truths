// EASY TO HARD: how hard each daily played LAST WEEK (owner, 2026-10-18).
//
// The home's third sort, beside A to Z and Popular. Every live daily gets a
// rating from 1 (gentle) to 5 (tough), and the home bands the list as Gentle
// (1-2), Steady (3) and Tough (4-5).
//
// THE WEEK. A rating is computed from the seven ET days ending the most recent
// Sunday BEFORE today, so it changes once, at midnight Eastern at the end of
// Sunday, and holds all week. Reading the days by the quiz id's own date (the
// board's day), not by when a row was filed, keeps an archive replay of an old
// board from counting toward this week.
//
// THE MEASURE, per game, over that week's rows that were not abandoned:
//   finish = the mean of min(1, score / total), how much of a board a player
//            gets, where 1 is everyone solving everything;
//   time   = the median time_elapsed of the rows that carry a clock.
// Each game is ranked against the others on both (more unfinished is harder,
// slower is harder), the two ranks are averaged, and the averaged rank is cut
// into fifths: the easiest fifth is 1, the hardest 5. Ranks rather than raw
// figures because the games' units differ completely (a forty-question
// gauntlet and a mini crossword share no clock and no score scale).
//
// A GAME WITH FEW PLAYS THAT WEEK is measured over the four weeks ending that
// Sunday instead, if it has enough rows there (owner, 2026-10-18), so a steady
// but quiet game is still rated. Failing that it keeps the rating it had (the
// previous stored week), so a quiet week does not throw it between tiers.
//
// THE OWNER'S STARTING RATINGS (SEED_RATINGS) cover a game that has never been
// measured: a new game launches in the band the owner puts it in, and the
// measured rating replaces it once the game reaches MIN_ROWS in a week. EVERY
// NEW DAILY GETS A LINE HERE AT LAUNCH, so nothing lands under "Not rated yet".
// Only a game with no measurement, no previous rating and no seed is unrated.
//
// Pure: no I/O. app/api/quiz/difficulty/route.js reads the rows and stores the
// result; scripts/verify-difficulty.mjs checks this file.

import { liveDailyKeys } from './daily-games.js';

export const MIN_ROWS = 20;
export const WIDE_DAYS = 28;

// Owner-set starting ratings, 1 (gentle) to 5 (tough). Gentle is 1, Steady 3,
// Tough 4. Used only until a game is measured.
export const SEED_RATINGS = {
  arcos: 1, // owner, 2026-10-18
  // The English Gauntlet's five (2026-10-19), estimates.
  gram: 3, vocab: 3, spell: 3, origin: 3, idiom: 1,
  scour: 1, // owner, 2026-10-18
  scram: 1, // owner, 2026-10-18
  hinge: 3, // owner, 2026-10-18
  rung: 4,  // owner, 2026-10-18
  // Starting estimates (2026-10-18), for games the four-week window cannot rate
  // yet. Gentle:
  herd: 1, aorb: 1, jig: 1, squash: 1, hold: 2,
  // Steady:
  art: 3, calc: 3, cell: 3, mahj: 3, cipher: 3, history: 3, sci: 3, snug: 3,
  suffice: 3, whittle: 3, window: 3,
  // Tough:
  arrow: 4, cages: 4, five: 4, gift: 4, junkyard: 4, polka: 4, racecar: 4,
  sumo: 4, sums: 4, swindle: 4, finesse: 5, giant: 5,
};

/** Fill any unrated game from SEED_RATINGS. Measured and carried ratings win. */
export function withSeeds(ratings) {
  const out = { ...(ratings || {}) };
  for (const [k, v] of Object.entries(SEED_RATINGS)) if (out[k] == null) out[k] = v;
  return out;
}
export const TIERS = [
  { id: 'gentle', label: 'Gentle', sub: 'Most players finish, and fast', lo: 1, hi: 2 },
  { id: 'steady', label: 'Steady', sub: 'Most finish, with some thought', lo: 3, hi: 3 },
  { id: 'tough', label: 'Tough', sub: 'Fewer finish, and it takes longer', lo: 4, hi: 5 },
];

const RE = /^(.+)-(\d+)-(\d+)-(\d+)$/;
const DAY = 86400000;

function utc(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}
function iso(t) { return new Date(t).toISOString().slice(0, 10); }

/** The rating week for an ET date: the Monday-to-Sunday that ended before it. */
export function ratingWeek(todayIso) {
  const t = utc(todayIso);
  const dow = new Date(t).getUTCDay(); // 0 Sunday
  const back = dow === 0 ? 7 : dow;     // the Sunday strictly before today
  const end = t - back * DAY;
  return { start: iso(end - 6 * DAY), end: iso(end) };
}

function median(a) {
  if (!a.length) return 0;
  const s = a.slice().sort((x, y) => x - y);
  const h = s.length >> 1;
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
}

// Fractional rank in [0,1], ties sharing the mean of their positions.
function pctRanks(vals) {
  const idx = vals.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const out = new Array(vals.length);
  const n = vals.length;
  for (let i = 0; i < n;) {
    let j = i;
    while (j + 1 < n && idx[j + 1][0] === idx[i][0]) j += 1;
    const p = n > 1 ? ((i + j) / 2) / (n - 1) : 0.5;
    for (let k = i; k <= j; k += 1) out[idx[k][1]] = p;
    i = j + 1;
  }
  return out;
}

/**
 * rows: quiz_results rows ({ quiz_id, score, total, time_elapsed, abandoned }).
 * week: { start, end } ISO dates. prev: last week's { key: rating }.
 * -> { ratings: { key: 1..5 }, measured: number of games rated from this week }
 */
export function rateDifficulty(rows, week, prev = {}) {
  const live = new Set(liveDailyKeys(week.end));
  const lo = utc(week.start);
  const hi = utc(week.end);
  const wlo = hi - (WIDE_DAYS - 1) * DAY;
  const acc = new Map();
  const wide = new Map();
  for (const r of rows || []) {
    const m = r && r.quiz_id ? String(r.quiz_id).match(RE) : null;
    if (!m || !live.has(m[1]) || r.abandoned) continue;
    const t = Date.UTC(2000 + Number(m[4]), Number(m[2]) - 1, Number(m[3]));
    if (t < wlo || t > hi) continue;
    const tot = Number(r.total);
    const sc = Number(r.score);
    if (!(tot > 0) || !Number.isFinite(sc)) continue;
    const add = (map) => {
      let a = map.get(m[1]);
      if (!a) { a = { n: 0, fin: 0, times: [] }; map.set(m[1], a); }
      a.n += 1;
      a.fin += Math.max(0, Math.min(1, sc / tot));
      const te = Number(r.time_elapsed);
      if (te > 0) a.times.push(te);
    };
    add(wide);
    if (t >= lo) add(acc);
  }
  // A game short of MIN_ROWS this week is measured over the wider window.
  for (const [k, a] of wide) {
    if ((!acc.has(k) || acc.get(k).n < MIN_ROWS) && a.n >= MIN_ROWS) acc.set(k, a);
  }
  const keys = [...acc.keys()].filter((k) => acc.get(k).n >= MIN_ROWS).sort();
  const ratings = {};
  if (keys.length >= 5) {
    const miss = keys.map((k) => 1 - acc.get(k).fin / acc.get(k).n);
    const slow = keys.map((k) => median(acc.get(k).times));
    const pm = pctRanks(miss);
    const ps = pctRanks(slow);
    const score = keys.map((k, i) => (pm[i] + ps[i]) / 2);
    const order = pctRanks(score);
    keys.forEach((k, i) => { ratings[k] = Math.min(5, 1 + Math.floor(order[i] * 5)); });
  }
  const measured = Object.keys(ratings).length;
  for (const k of live) {
    if (ratings[k] == null && prev && Number.isInteger(prev[k]) && prev[k] >= 1 && prev[k] <= 5) ratings[k] = prev[k];
  }
  for (const k of live) if (ratings[k] == null && SEED_RATINGS[k]) ratings[k] = SEED_RATINGS[k];
  return { ratings, measured };
}

/** The tier a rating falls in, or null when unrated. */
export function tierOf(rating) {
  if (!rating) return null;
  return TIERS.find((t) => rating >= t.lo && rating <= t.hi) || null;
}
