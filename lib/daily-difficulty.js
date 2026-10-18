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
// A GAME WITH FEW PLAYS keeps the rating it had (the previous stored week), so
// a quiet week does not throw it between tiers. A game never rated reads as
// unrated, and the home lists it last under "Not rated yet".
//
// Pure: no I/O. app/api/quiz/difficulty/route.js reads the rows and stores the
// result; scripts/verify-difficulty.mjs checks this file.

import { liveDailyKeys } from './daily-games.js';

export const MIN_ROWS = 20;
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
  const acc = new Map();
  for (const r of rows || []) {
    const m = r && r.quiz_id ? String(r.quiz_id).match(RE) : null;
    if (!m || !live.has(m[1]) || r.abandoned) continue;
    const t = Date.UTC(2000 + Number(m[4]), Number(m[2]) - 1, Number(m[3]));
    if (t < lo || t > hi) continue;
    const tot = Number(r.total);
    const sc = Number(r.score);
    if (!(tot > 0) || !Number.isFinite(sc)) continue;
    let a = acc.get(m[1]);
    if (!a) { a = { n: 0, fin: 0, times: [] }; acc.set(m[1], a); }
    a.n += 1;
    a.fin += Math.max(0, Math.min(1, sc / tot));
    const te = Number(r.time_elapsed);
    if (te > 0) a.times.push(te);
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
  return { ratings, measured };
}

/** The tier a rating falls in, or null when unrated. */
export function tierOf(rating) {
  if (!rating) return null;
  return TIERS.find((t) => rating >= t.lo && rating <= t.hi) || null;
}
