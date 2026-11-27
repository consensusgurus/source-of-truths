// lib/wanted.js: the shared rules of Wanted, the enormous hidden figure hunt
// (owner, 2026-11-26: "as interesting as a where's waldo page, but humongous. It
// should play like search", then "We can call it Wanted" and "Lots of different
// districts").
//
// A board is one huge crowd scene made of districts (a fairground, a beach, a
// harbor...). Somewhere in every district are Otis (green cap, orange scarf,
// mustache), his friend Mabel, his dog Biscuit, a handful of lost things, a few
// odd scenes and a couple of one-of-a-kind people: about 260 things to find on a
// sixteen district board. The scene is built from a seed by lib/wanted-engine.js
// and drawn by the browser, so there is no picture file.
//
// IT PLAYS LIKE SEARCH (lib/search.js): everyone hunts the same scene on their
// own copy, every find is a pot of 100 points split among the players who make
// it, a find tells you who else has it, and the standings rank points first and
// total finds second.
//
// NO AUTOMATIC TURNOVER (owner, 2026-11-26: "they all stay live until each
// element / word is found. No automatic turnover. Same should be true here").
// A board closes only when the crowd has found everything on it, and never in
// under 24 hours. There is no cap. The last board in the bank stays open until
// another is added.
//
// Pure: safe on the client.
export { etDayNum, dayNumToIso } from './search';

export const WANTED_POT = 100;
export function wantedValue(count) { return count > 0 ? Math.round(WANTED_POT / count) : WANTED_POT; }
export function wantedRankPoints(a, b) {
  if (b.points !== a.points) return b.points - a.points;
  return b.total - a.total;
}

// Board 1 opened at 9pm Eastern on 2026-11-26.
export const WANTED_LAUNCH = Date.parse('2026-11-27T02:00:00Z');
export const WANTED_MIN_MS = 24 * 3600000;

// windows: [{ num, opens, closes|null, solvedAt|null, min, cap: null }] for every
// board that has opened by `now`, in order. `solved` maps a board number to the
// moment its last thing was first found.
export function wantedWindows(boardCount, solved, now = Date.now()) {
  const out = [];
  let opens = WANTED_LAUNCH;
  for (let n = 1; n <= boardCount && opens <= now; n++) {
    const s = solved && solved[n] ? Number(solved[n]) : null;
    const min = opens + WANTED_MIN_MS;
    const closes = n < boardCount && s ? Math.max(min, s) : null;
    out.push({ num: n, opens, closes, solvedAt: s, min, cap: null });
    if (closes == null) break;
    opens = closes;
  }
  return out;
}
export function wantedBoardForTime(windows, t) {
  let pick = windows[0] || null;
  for (const w of windows) if (w.opens <= t) pick = w;
  return pick;
}
export function wantedQuizId(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `wanted-${m}-${d}-${String(y).slice(2)}`;
}
// What the page is handed: everything the engine needs, nothing else.
export function wantedPublic(b) { return { num: b.num, key: b.key, seed: b.seed, cols: b.cols, districts: b.districts, pool: b.pool, n: b.n }; }
