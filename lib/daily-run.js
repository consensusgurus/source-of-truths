// A DAILY RUN: a short queue of today's dailies handed to a player in one go,
// carried game to game in the URL as ?run=atlas,flank,ping (owner, 2026-09-29).
//
// It started on the IQ test finish, where the aim is to keep a player who just
// finished a test playing. It is ONLY a lens: nothing about a run is stored or
// scored. Every game in it posts its own ordinary result, and a game played on
// its own counts the same as one played inside a run.
//
// The URL is the whole state, so a run survives a reload and leaving it is the
// same page without the parameter. `played` is read from each game's own day
// breadcrumb (sot_<key>_day, written by every daily client once a board is
// started or finished), so it costs no request and works for a guest.
import { DAILY_GAME_MAP, isRetiredDaily, etTodayISO } from './daily-games';

export const RUN_MAX = 5;

/** The run on this URL, validated: known, live, unique keys, at most RUN_MAX. */
export function readDailyRun(search) {
  let raw = null;
  try { raw = new URLSearchParams(search).get('run'); } catch (e) { raw = null; }
  if (!raw) return [];
  const out = [];
  for (const k of raw.split(',')) {
    const key = k.trim().toLowerCase();
    if (!key || out.includes(key) || !DAILY_GAME_MAP[key] || isRetiredDaily(key)) continue;
    out.push(key);
    if (out.length >= RUN_MAX) break;
  }
  return out.length >= 2 ? out : [];
}

/** The link to one game of a run, carrying the rest of the run with it. */
export function dailyRunHref(key, keys) {
  const g = DAILY_GAME_MAP[key];
  if (!g) return '/';
  return `${g.href}?run=${keys.join(',')}`;
}

/** Whether this browser finished `key` today, from its day breadcrumb. */
export function playedToday(key) {
  try {
    const sv = JSON.parse(localStorage.getItem(`sot_${key}_day`) || 'null');
    return !!(sv && sv.done && sv.d === etTodayISO());
  } catch (e) { return false; }
}
