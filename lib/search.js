// lib/search.js: the shared rules of Search, the enormous daily word search
// (owner, 2026-11-20: "enormous, 700 movie titles for instance. scored based on
// unique finds most, total finds second. when you locate it, you see how many
// have found it, and you can press refresh later to see how many found it in
// the end"). A new big topic every day.
//
// Used by the generator (scripts/gen-search.mjs), the checker
// (scripts/verify-search.mjs), the API (app/api/search) and the page. Pure: no
// imports, safe on the client.
//
// A board is a square grid of capital letters. Every entry on the day's list
// is written into it ONCE, in any of the eight directions, as its letters with
// spaces, punctuation and accents dropped and '&' read as AND ("Marley & Me"
// is MARLEYANDME). Every entry occurs in the grid exactly once counting all
// eight directions, and no entry sits inside another (or inside another's
// reverse), so a stroke is graded from its letters alone.

export const SEARCH_DIRS = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]];

export function searchLetters(title) {
  return String(title || '')
    .replace(/&/g, ' and ')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase();
}

// Every straight line through the grid in four directions (row, column, both
// diagonals), as strings. Searching each for a word and for its reverse covers
// all eight directions.
export function searchLines(grid) {
  const n = grid.length;
  const out = [];
  for (let r = 0; r < n; r++) out.push(grid[r]);
  for (let c = 0; c < n; c++) { let s = ''; for (let r = 0; r < n; r++) s += grid[r][c]; out.push(s); }
  for (let k = -(n - 1); k <= n - 1; k++) {
    let a = '', b = '';
    for (let r = 0; r < n; r++) {
      const c1 = r + k; if (c1 >= 0 && c1 < n) a += grid[r][c1];
      const c2 = n - 1 - r + k; if (c2 >= 0 && c2 < n) b += grid[r][c2];
    }
    if (a.length >= 2) out.push(a);
    if (b.length >= 2) out.push(b);
  }
  return out;
}

function countIn(s, w) {
  let n = 0, i = s.indexOf(w);
  while (i >= 0) { n++; i = s.indexOf(w, i + 1); }
  return n;
}

// How many times a word occurs in the grid, all eight directions.
export function searchCount(lines, w) {
  const rw = w.split('').reverse().join('');
  let n = 0;
  for (const s of lines) { n += countIn(s, w); if (rw !== w) n += countIn(s, rw); }
  return n;
}

// The map from a word's letters (either way round) to its index on the list.
export function searchIndex(items) {
  const m = new Map();
  items.forEach((it, i) => { m.set(it.w, i); m.set(it.w.split('').reverse().join(''), i); });
  return m;
}

// The squares from (r0,c0) to (r1,c1) along one of the eight lines, or null.
export function searchCells(r0, c0, r1, c1) {
  const a = Math.abs(r1 - r0), b = Math.abs(c1 - c0);
  if (!(a === 0 || b === 0 || a === b)) return null;
  const dr = Math.sign(r1 - r0), dc = Math.sign(c1 - c0), len = Math.max(a, b);
  const out = [];
  for (let k = 0; k <= len; k++) out.push([r0 + dr * k, c0 + dc * k]);
  return out;
}

// Where a list word sits, [r0, c0, r1, c1], searched from its first letter.
export function searchLocate(grid, w) {
  const n = grid.length;
  for (let r = 0; r < n; r++) {
    const row = grid[r];
    for (let c = 0; c < n; c++) {
      if (row[c] !== w[0]) continue;
      for (const [dr, dc] of SEARCH_DIRS) {
        const er = r + dr * (w.length - 1), ec = c + dc * (w.length - 1);
        if (er < 0 || ec < 0 || er >= n || ec >= n) continue;
        let ok = true;
        for (let k = 1; k < w.length; k++) if (grid[r + dr * k][c + dc * k] !== w[k]) { ok = false; break; }
        if (ok) return [r, c, er, ec];
      }
    }
  }
  return null;
}

// THE RANKING (owner, 2026-11-20): unique finds first, total finds second.
// A unique find is an entry nobody else has found. Ties after both share a place.
export function searchRank(a, b) {
  if (b.unique !== a.unique) return b.unique - a.unique;
  return b.total - a.total;
}

// The day's quiz id from its date: search-M-D-YY, like every other daily.
export function searchQuizId(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `search-${m}-${d}-${String(y).slice(2)}`;
}

// ---- POINTS (owner, 2026-11-20: "both sound good" to the split pot) ---------
// Every entry is a pot of 100 points, split evenly among everyone who found it.
// Alone on a title you keep all 100; two of you get 50 each; a title forty
// players found pays 3. So a deep cut that two or three people dug up still
// counts for a lot, and a famous one for little. Values move as the crowd
// catches up and lock when the board closes. The standings rank points first
// and total finds second.
export const SEARCH_POT = 100;
export function searchValue(count) { return count > 0 ? Math.round(SEARCH_POT / count) : SEARCH_POT; }

// ---- THE SCHEDULE (owner, 2026-11-20: run until the crowd solves it, at least
// 24 hours; with a 72 hour cap so a long tail of deep cuts cannot stall it) ----
// Board 1 opened at midnight Eastern on 2026-11-20. Each board stays open until
// every entry on it has been found by somebody, but never less than 24 hours
// and never more than 72; the next board opens the moment it closes. The last
// board in the bank stays open until another is added.
export const SEARCH_LAUNCH = Date.parse('2026-11-20T05:00:00Z');
export const SEARCH_MIN_MS = 24 * 3600000;
export const SEARCH_MAX_MS = 72 * 3600000;

// windows: [{ num, opens, closes|null, solvedAt|null, cap: opens+72h, min: opens+24h }]
// for every board that has opened by `now`, in order. `solved` maps a board
// number to the time its last entry was first found.
export function searchWindows(boardCount, solved, now = Date.now()) {
  const out = [];
  let opens = SEARCH_LAUNCH;
  for (let n = 1; n <= boardCount && opens <= now; n++) {
    const s = solved && solved[n] ? Number(solved[n]) : null;
    const min = opens + SEARCH_MIN_MS, cap = opens + SEARCH_MAX_MS;
    let closes = null;
    if (n < boardCount) {
      if (s) closes = Math.min(cap, Math.max(min, s));
      else if (now >= cap) closes = cap;
    }
    out.push({ num: n, opens, closes, solvedAt: s, min, cap });
    if (closes == null) break;
    opens = closes;
  }
  return out;
}

// The board whose window holds an Eastern day's last moment: what that day's
// archive entry opens.
export function searchBoardForTime(windows, t) {
  let pick = windows[0] || null;
  for (const w of windows) if (w.opens <= t) pick = w;
  return pick;
}

// Ranking: points first, then total finds.
export function searchRankPoints(a, b) {
  if (b.points !== a.points) return b.points - a.points;
  return b.total - a.total;
}

// An Eastern day as a whole number (days since 1970-01-01 in New York), for
// stamping the day each find was made, so a site day's result counts only the
// finds made that day.
export function etDayNum(t = Date.now()) {
  const s = new Date(t).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  return Math.round(Date.parse(s + 'T00:00:00Z') / 86400000);
}
export function dayNumToIso(n) { return new Date(n * 86400000).toISOString().slice(0, 10); }
