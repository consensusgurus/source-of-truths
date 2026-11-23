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

// Eight since the run builder (owner, 2026-11-07); forty since Build Your Day
// replaced it (owner, 2026-11-21: "unlimited number that user selects"). Forty
// is the most /api/quiz/daily-combined reads in one board (keys .slice(0, 40)),
// so it is the honest ceiling, and far past any real day.
export const RUN_MAX = 40;

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

/** The page of a built run: invite, progress and the head-to-head finish.
 * MIND LOFT DAILY is a built run too, so it ends on its own page, /my-day. */
export function builtRunHref(keys, meta = null, abs = false) {
  if (isDayMeta(meta)) return `${abs ? 'https://mindloftdaily.com' : ''}/my-day`;
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

// ── MIND LOFT DAILY (owner, 2026-11-21) ────────────────────────────────────
// "Build Your Day" replaced Build a Run on the same wiring: a player picks any
// number of today's dailies once, and every day they arrive as one paper at
// /my-day, played straight through. It IS a built run named DAY_NAME: each
// game opens with ?run=...&rn=Mind+Loft+Daily, the rail carries the player
// from page to page, and builtRunHref sends the finished paper back to /my-day.
// The day is kept in this browser (ml_my_day), like My Runs; nothing on the
// server. Old shared /run links keep working; new runs are no longer built.
export const DAY_NAME = 'Mind Loft Daily';
export const DAY_META = { name: DAY_NAME, by: '' };
export function isDayMeta(meta) { return !!(meta && meta.name === DAY_NAME); }
const MY_DAY = 'ml_my_day';
/** The saved day's games, in order (live, buildable keys only), or []. */
export function getMyDay() {
  try {
    const v = JSON.parse(localStorage.getItem(MY_DAY) || 'null');
    const keys = v && Array.isArray(v.keys) ? parseRunKeys(v.keys.join(',')) : [];
    const live = new Set(buildableGames().map((g) => g.key));
    return keys.filter((k) => live.has(k));
  } catch (e) { return []; }
}
export function saveMyDay(keys) {
  try { localStorage.setItem(MY_DAY, JSON.stringify({ keys: parseRunKeys((keys || []).join(',')), at: Date.now() })); } catch (e) {}
}
/** One count on the admin Page Views table (/api/quiz/view), at most once per id per day in this browser. */
export function countDayEvent(id) {
  try {
    const k = `ml_dayev|${id}|${etTodayISO()}`;
    if (localStorage.getItem(k)) return;
    localStorage.setItem(k, '1');
    fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: id }) }).catch(() => {});
  } catch (e) {}
}
/**
 * Who builds a day (owner, 2026-11-22): one row per player per ET day in
 * mld_days, read by the admin desk's Mind Loft Daily tab. `saved` and `edited`
 * send every time; `opened` sends once per day per progress count, so a reload
 * costs nothing and each page played moves the row along.
 */
export function trackMyDay(event, keys, done = 0) {
  try {
    if (event === 'opened') {
      const k = `ml_dayrec|${etTodayISO()}|${(keys || []).join(',')}|${done}`;
      if (localStorage.getItem(k)) return;
      localStorage.setItem(k, '1');
    }
    let anonId = localStorage.getItem('sot_quiz_anon');
    if (!anonId) {
      anonId = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem('sot_quiz_anon', anonId);
    }
    let id = null;
    try { id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); } catch (e) { id = null; }
    const body = { event, keys: keys || [], done, anonId, email: (id && id.email) || undefined, name: (id && id.username) || undefined };
    fetch('/api/mld/event', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => {});
  } catch (e) {}
}
// THE EDITION FOLLOWS THE READER'S OWN CLOCK (owner, 2026-11-21: "Morning
// turns to afternoon turns to evening turns to night"). Only the label and
// the accent move; the puzzles and the paper's date stay on the Eastern day.
export const EDITIONS = [
  { id: 'morning', name: 'Morning', from: 5, colour: '#fbbf24', hello: 'Good morning' },
  { id: 'afternoon', name: 'Afternoon', from: 12, colour: '#7dd3fc', hello: 'Good afternoon' },
  { id: 'evening', name: 'Evening', from: 17, colour: '#fb923c', hello: 'Good evening' },
  { id: 'night', name: 'Night', from: 21, colour: '#a5b4fc', hello: 'Up late' },
];
export function editionNow(d = new Date()) {
  const h = d.getHours();
  if (h < 5) return EDITIONS[3];
  let e = EDITIONS[0];
  for (const x of EDITIONS) if (h >= x.from) e = x;
  return e;
}
