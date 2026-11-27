// lib/wanted.js: the few shared facts of Wanted, the daily hidden picture hunt.
//
// ONE SCENE A DAY, SOLO, ON THE CLOCK (owner, 2026-11-26, an hour after it
// launched as one sixteen district board the whole site hunted together: "I
// think we should pull wanted and make each day a different scene. Quicker
// resolve", then "Not community. Scored by time to completion"). Each Eastern
// day is one place (a fairground, a beach, a harbor...) with about 1,200
// figures and about sixteen things to find. It is an ordinary daily: the bank is
// app/wanted/puzzles.js, the shell is app/SimpleDaily.jsx, a finished hunt
// ranks on the clock, and it is SOLVE_ONLY in lib/daily-games.js. There is no
// crowd, no split pot, no /api/wanted and no board that waits to be solved.
//
// The scene itself is built from the day's seed by lib/wanted-engine.js and
// drawn by the browser, so there is no picture file.
//
// Pure: safe on the client.
export const WANTED_FIRST_DAY = '2026-11-26';
export function wantedQuizId(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `wanted-${m}-${d}-${String(y).slice(2)}`;
}
