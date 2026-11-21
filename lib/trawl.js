// lib/trawl.js: the shared rules of Trawl, the enormous daily word search
// (owner, 2026-11-20: "enormous, 700 movie titles for instance. scored based on
// unique finds most, total finds second. when you locate it, you see how many
// have found it, and you can press refresh later to see how many found it in
// the end"). A new big topic every day.
//
// Used by the generator (scripts/gen-trawl.mjs), the checker
// (scripts/verify-trawl.mjs), the API (app/api/trawl) and the page. Pure: no
// imports, safe on the client.
//
// A board is a square grid of capital letters. Every entry on the day's list
// is written into it ONCE, in any of the eight directions, as its letters with
// spaces, punctuation and accents dropped and '&' read as AND ("Marley & Me"
// is MARLEYANDME). Every entry occurs in the grid exactly once counting all
// eight directions, and no entry sits inside another (or inside another's
// reverse), so a stroke is graded from its letters alone.

export const TRAWL_DIRS = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]];

export function trawlLetters(title) {
  return String(title || '')
    .replace(/&/g, ' and ')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase();
}

// Every straight line through the grid in four directions (row, column, both
// diagonals), as strings. Searching each for a word and for its reverse covers
// all eight directions.
export function trawlLines(grid) {
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
export function trawlCount(lines, w) {
  const rw = w.split('').reverse().join('');
  let n = 0;
  for (const s of lines) { n += countIn(s, w); if (rw !== w) n += countIn(s, rw); }
  return n;
}

// The map from a word's letters (either way round) to its index on the list.
export function trawlIndex(items) {
  const m = new Map();
  items.forEach((it, i) => { m.set(it.w, i); m.set(it.w.split('').reverse().join(''), i); });
  return m;
}

// The squares from (r0,c0) to (r1,c1) along one of the eight lines, or null.
export function trawlCells(r0, c0, r1, c1) {
  const a = Math.abs(r1 - r0), b = Math.abs(c1 - c0);
  if (!(a === 0 || b === 0 || a === b)) return null;
  const dr = Math.sign(r1 - r0), dc = Math.sign(c1 - c0), len = Math.max(a, b);
  const out = [];
  for (let k = 0; k <= len; k++) out.push([r0 + dr * k, c0 + dc * k]);
  return out;
}

// Where a list word sits, [r0, c0, r1, c1], searched from its first letter.
export function trawlLocate(grid, w) {
  const n = grid.length;
  for (let r = 0; r < n; r++) {
    const row = grid[r];
    for (let c = 0; c < n; c++) {
      if (row[c] !== w[0]) continue;
      for (const [dr, dc] of TRAWL_DIRS) {
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
export function trawlRank(a, b) {
  if (b.unique !== a.unique) return b.unique - a.unique;
  return b.total - a.total;
}

// The day's quiz id from its date: trawl-M-D-YY, like every other daily.
export function trawlQuizId(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `trawl-${m}-${d}-${String(y).slice(2)}`;
}
