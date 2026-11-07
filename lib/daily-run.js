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
import { DAILY_GAME_MAP, isRetiredDaily, etTodayISO, liveDailyKeys } from './daily-games';

// Eight since the run builder (owner, 2026-11-07): a built run holds 2 to 8.
export const RUN_MAX = 8;

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

/** The link to one game of a run, carrying the rest of the run with it.
 * `meta` ({ name, by }) is a BUILT run's name and maker (owner, 2026-11-07),
 * carried as &rn= and &rb= so the rail can name it and send a finished run
 * back to its own page. A run with no meta is the IQ finish's queue, as before. */
export function dailyRunHref(key, keys, meta = null) {
  const g = DAILY_GAME_MAP[key];
  if (!g) return '/';
  const sep = g.href.includes('?') ? '&' : '?';
  return `${g.href}${sep}run=${keys.join(',')}${metaQs(meta)}`;
}

// ── BUILT RUNS (owner, 2026-11-07) ─────────────────────────────────────────
// A player picks 2 to 8 dailies, names the run and shares a link. Like every
// run here it is ONLY a lens: the whole run is the URL
// (/run?g=deep,strata&n=Morning+Coffee&by=Gator85), nothing is stored on the
// server, and every game posts its own ordinary first-try result. "Every Day":
// the link deals that day's boards for the same games, so it never goes stale.
export const BUILT_MIN = 2;
// Games a built run may not hold: run-only legs have no page of their own,
// and Pricer is off the server slate, so it has no board to compare on.
export const BUILT_EXCLUDE = new Set(['pricer']);

/** Today's games a run can be built from, as registry rows. */
export function buildableGames(today) {
  return liveDailyKeys(today || etTodayISO()).filter((k) => !BUILT_EXCLUDE.has(k)).map((k) => DAILY_GAME_MAP[k]).filter(Boolean);
}

/** A run name as it may be printed: letters, digits, spaces and light punctuation, 28 at most. */
export function cleanRunName(raw) {
  return String(raw || '').replace(/[^A-Za-z0-9 '&!?.,-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 28).trim();
}
/** A maker name as the boards print it. */
export function cleanMaker(raw) {
  return String(raw || '').replace(/[^A-Za-z0-9 _.-]/g, '').trim().slice(0, 24);
}

function metaQs(meta) {
  if (!meta) return '';
  const n = cleanRunName(meta.name);
  const b = cleanMaker(meta.by);
  return (n ? `&rn=${encodeURIComponent(n)}` : '') + (b ? `&rb=${encodeURIComponent(b)}` : '');
}

/** The keys of a built run from its g= value: known, unique, not excluded, at most RUN_MAX. Retired games stay out. */
export function parseRunKeys(raw) {
  const out = [];
  for (const k of String(raw || '').split(/[,.]/)) {
    const key = k.trim().toLowerCase();
    if (!key || out.includes(key) || !DAILY_GAME_MAP[key] || BUILT_EXCLUDE.has(key) || isRetiredDaily(key)) continue;
    out.push(key);
    if (out.length >= RUN_MAX) break;
  }
  return out;
}

/** A built run's meta on a game page (&rn=, &rb=), or null. */
export function readRunMeta(search) {
  try {
    const q = new URLSearchParams(search);
    const name = cleanRunName(q.get('rn'));
    const by = cleanMaker(q.get('rb'));
    return name || by ? { name, by } : null;
  } catch (e) { return null; }
}

/** The page of a built run: invite, progress and the head-to-head finish. */
export function builtRunHref(keys, meta = null, abs = false) {
  const n = meta ? cleanRunName(meta.name) : '';
  const b = meta ? cleanMaker(meta.by) : '';
  const q = `g=${keys.join(',')}` + (n ? `&n=${encodeURIComponent(n).replace(/%20/g, '+')}` : '') + (b ? `&by=${encodeURIComponent(b)}` : '');
  return `${abs ? 'https://mindloftdaily.com' : ''}/run?${q}`;
}

// MY RUNS: the runs this browser built or opened from a link, newest first, so
// My Puzzles can list them. Browser storage only, like the day breadcrumbs.
const MY_RUNS = 'ml_my_runs';
export function listMyRuns() {
  try {
    const a = JSON.parse(localStorage.getItem(MY_RUNS) || '[]');
    return Array.isArray(a) ? a.filter((r) => r && Array.isArray(r.keys) && r.keys.length >= BUILT_MIN) : [];
  } catch (e) { return []; }
}
export function rememberRun(keys, meta, mine = false) {
  if (!Array.isArray(keys) || keys.length < BUILT_MIN) return;
  try {
    const id = keys.join(',') + '|' + cleanRunName(meta && meta.name) + '|' + cleanMaker(meta && meta.by);
    const prev = listMyRuns();
    const old = prev.find((r) => r.id === id);
    const row = { id, keys, name: cleanRunName(meta && meta.name), by: cleanMaker(meta && meta.by), mine: !!(mine || (old && old.mine)), at: Date.now() };
    const next = [row, ...prev.filter((r) => r.id !== id)].slice(0, 12);
    localStorage.setItem(MY_RUNS, JSON.stringify(next));
  } catch (e) {}
}
export function forgetRun(id) {
  try { localStorage.setItem(MY_RUNS, JSON.stringify(listMyRuns().filter((r) => r.id !== id))); } catch (e) {}
}

/** Whether this browser finished `key` today, from its day breadcrumb. */
export function playedToday(key) {
  try {
    const sv = JSON.parse(localStorage.getItem(`sot_${key}_day`) || 'null');
    return !!(sv && sv.done && sv.d === etTodayISO());
  } catch (e) { return false; }
}
