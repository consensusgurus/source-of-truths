// lib/daily-index.js: which daily puzzle ran on which day, WITHOUT the puzzles
// (2026-11-23). lib/daily-slate.js imports every puzzles.js bank (about 36 MB
// bundled), and the leaderboard, slate and results routes were carrying all of
// it just to look up a puzzle's quizId, number, live date, rev and Sunday flag.
// They read those from lib/daily-index.json instead, which
// scripts/build-daily-index.mjs generates from the same banks on every build
// and dev start (package.json prebuild / predev), so it always matches them.
//
// Need a puzzle's CONTENT? Import that one game's puzzles.js, or lib/daily-slate.
// Every function here returns exactly what its daily-slate namesake returned.
import INDEX from './daily-index.json';

export function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export function suffixOfDate(dateStr) {
  const [Y, M, D] = dateStr.split('-').map(Number); // dateStr = 'YYYY-MM-DD'
  return `${M}-${D}-${Y % 100}`;
}

export function suffixFromRequest({ date, quizId, today }) {
  const d = (date || '').trim();
  if (/^\d+-\d+-\d+$/.test(d)) return d;
  const m = (quizId || '').match(/-(\d+-\d+-\d+)$/);
  return m ? m[1] : suffixOfDate(today);
}

// Every game key with a bank, in the bank order of lib/daily-slate.js.
export const INDEX_KEYS = Object.keys(INDEX);

// One game's puzzles as { quizId, num, live, rev, sunday }, bank order. The
// objects are built once per key and shared, so treat them as read-only.
const dropCache = new Map();
export function dropsOf(key) {
  let d = dropCache.get(key);
  if (d) return d;
  d = (INDEX[key] || []).map(([quizId, num, live, rev, sunday]) => ({
    quizId, num, live, rev: rev || undefined, sunday: !!sunday,
  }));
  dropCache.set(key, d);
  return d;
}
export function hasGame(key) { return Object.prototype.hasOwnProperty.call(INDEX, key); }

// The drop that ran for `key` on `suffix`, or null (none, or not live yet).
export function dropForSuffix(key, suffix, today) {
  const cand = `${key}-${suffix}`;
  const p = dropsOf(key).find((x) => x.quizId === cand);
  if (!p) return null;
  if (p.live && p.live > today) return null;
  return p;
}

// Every game that ran on `suffix`, with the href to play THAT date: today's
// slate links to the live game (streak-counting), an archived day links to that
// exact puzzle via ?p=<num>.
export function gamesForSuffix(keys, suffix, today) {
  const isToday = suffix === suffixOfDate(today);
  const out = [];
  for (const key of keys) {
    const p = dropForSuffix(key, suffix, today);
    if (!p) continue;
    out.push({
      key,
      quizId: p.quizId,
      num: p.num,
      rev: p.rev || null,
      href: isToday ? `/${key}` : `/${key}?p=${p.num}`,
    });
  }
  return out;
}
