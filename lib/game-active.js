'use client';

// NO POP-UP MID GAME (owner rule, 2026-10-23: "GET RID OF ANY AND ALL MID
// PUZZLE / GAME POP-UPS. Cannot have popups mid puzzle.").
//
// gameActive() answers one question for every pop-up on the site: is a puzzle
// being played on this page right now? Every pop-up calls it at the moment it
// would open and does not open when it says yes. It is read fresh each time
// (never cached), so a timer scheduled before a game started still cannot land
// on top of it.
//
// What counts as "being played":
//   - a run page (any run's own path, or /circuits/<id>/run) whose board for
//     today is in its playing phase, which includes the gap between two of its
//     puzzles: a run is one sitting;
//   - a daily's page once its first move is made (the `sot_<key>_day`
//     breadcrumb every client writes only on a real move) and until it is done,
//     or an archive board (?p=N) whose save is started and unfinished;
//   - a quiz, kids or vs page at any point before its finish card is up.
// A finish card on screen always means the game is over.
// When in doubt it says yes: a skipped pop-up costs nothing.

import { DAILY_GAMES } from './daily-games.js';
import { CIRCUITS } from './circuits.js';

const FINISH_SEL = '.stf, .loft-back, .dec-backdrop';
const HREF_KEY = new Map(DAILY_GAMES.map((g) => [g.href || `/${g.key}`, g.key]));
const RUN_PATHS = new Set(CIRCUITS.filter((c) => c && c.path).map((c) => c.path));

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function readJSON(k) {
  try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; }
}

export function isRunPath(path) {
  return RUN_PATHS.has(path) || /^\/circuits\/[^/]+\/run$/.test(path);
}

export function gameActive() {
  if (typeof window === 'undefined') return false;
  try {
    const path = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
    if (document.querySelector(FINISH_SEL)) return false;
    const today = etToday();
    if (isRunPath(path)) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith('sot_run_')) continue;
        const v = readJSON(k);
        if (!v || v.phase !== 'playing') continue;
        if (k.includes(today) || v.day === today || v.d === today) return true;
      }
      return false;
    }
    const key = HREF_KEY.get(path);
    if (key) {
      const crumb = readJSON(`sot_${key}_day`);
      if (crumb && crumb.d === today && !crumb.done) return true;
      const p = new URLSearchParams(window.location.search).get('p');
      if (p && /^\d+$/.test(p)) {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k || !k.startsWith(`sot_${key}_${p}`)) continue;
          const v = readJSON(k);
          if (v && v.status === 'playing' && v.t0) return true;
        }
      }
      return false;
    }
    if (/^\/(quiz|kids|vs)\//.test(path)) return true;
    return false;
  } catch (e) { return true; }
}
