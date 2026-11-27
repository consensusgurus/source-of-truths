// lib/mega.js: the shared rules of Colossus and Mammoth, the massive sudokus
// (owner, 2026-11-21). Colossus is a field of 9x9 sudokus, Mammoth a larger
// field of 6x6 sudokus (boxes two rows tall, three columns wide). On both, the
// sudokus sit on a checkerboard weave and every sudoku shares each of its four
// corner boxes with a neighbor, so a digit in a shared corner counts in both.
//
// THE OWNER'S RULES (2026-11-21):
//   - Everyone plays their own copy ("pseudo independently", like Search). A
//     player only ever sees their own digits, so nobody can take a sudoku from
//     anybody and the hour a player turns up does not matter.
//   - A player is NOT told a digit is right until the whole sudoku is done. A
//     full sudoku with a mistake in it says something is off and no more.
//   - No time out for a wrong answer.
//   - Who else solved a sudoku, and what it pays, stay hidden until the player
//     solves it; then a small note names them and fades.
//   - Timing as Search: a board closes when every sudoku on it has been solved
//     by at least one player, no sooner than 24 hours. NO AUTOMATIC TURNOVER
//     (owner, 2026-11-26): the old 72 hour cap is gone, see megaWindows.
//   - Mammoth keeps few clues in its middle rows ("like Sunday Sixes").
// Scoring, as a Search entry: every sudoku is a pot of 100 points split evenly
// among everyone who solves it before the board closes.
//
// Used by the generator (scripts/gen-mega.mjs), the checker
// (scripts/verify-mega.mjs), the API (app/api/mega) and the pages. Pure: no
// imports, safe on the client.

export const MEGA = {
  colossus: { key: 'colossus', name: 'Colossus', N: 9, bh: 3, bw: 3, launch: Date.parse('2026-11-22T01:00:00Z') },
  mammoth: { key: 'mammoth', name: 'Mammoth', N: 6, bh: 2, bw: 3, launch: Date.parse('2026-11-22T01:00:00Z') },
};

// The weave. Sudokus sit every (N - bh) rows and (N - bw) columns, on the
// squares of one colour of a checkerboard (a + b even), so each overlaps its
// four diagonal neighbors in exactly one corner box and nothing else.
export function megaLayout(game, A, B) {
  const { N, bh, bw } = MEGA[game];
  const sr = N - bh, sc = N - bw;
  const W = sc * (A - 1) + N, H = sr * (B - 1) + N, T = W * H;
  const pos = [], ab = [], at = new Map();
  for (let b = 0; b < B; b++) for (let a = 0; a < A; a++) if ((a + b) % 2 === 0) { at.set(a + ',' + b, pos.length); pos.push([sr * b, sc * a]); ab.push([a, b]); }
  // What a player calls a sudoku (owner, 2026-11-22: "make it easy to identify
  // the grid you're working in"): its lattice row as a letter, its column as a
  // number, so D4 sits below and right of C3. `hues` is one of four colours a
  // sudoku wears: no two overlapping sudokus share one, and neither do the two
  // beside each other on a row. `near` is the up-to-four sudokus it overlaps.
  const names = ab.map(([a, b]) => megaName(a, b));
  const hues = ab.map(([a, b]) => (b % 2) * 2 + (Math.floor(a / 2) % 2));
  const near = ab.map(([a, b]) => [[-1, -1, '\u2196'], [1, -1, '\u2197'], [-1, 1, '\u2199'], [1, 1, '\u2198']]
    .map(([da, db, arrow]) => ({ id: at.get((a + da) + ',' + (b + db)), arrow })).filter((n) => n.id !== undefined));
  const grids = [], cellGrids = Array.from({ length: T }, () => []);
  pos.forEach(([r0, c0], id) => {
    const cells = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const x = (r0 + r) * W + c0 + c; cells.push(x); cellGrids[x].push(id); }
    grids.push(cells);
  });
  return { N, bh, bw, W, H, T, pos, grids, cellGrids, ab, names, hues, near };
}
export function megaName(a, b) {
  const row = b < 26 ? String.fromCharCode(65 + b) : String.fromCharCode(65 + Math.floor(b / 26) - 1) + String.fromCharCode(65 + (b % 26));
  return row + (a + 1);
}

// The 3N houses of the sudoku at pos (rows, columns, boxes), as board indexes.
export function megaHouses(L, id) {
  const { N, bh, bw, W } = L;
  const [r0, c0] = L.pos[id];
  const out = [];
  for (let k = 0; k < N; k++) {
    const row = [], col = [], box = [];
    for (let j = 0; j < N; j++) { row.push((r0 + k) * W + c0 + j); col.push((r0 + j) * W + c0 + k); }
    const perRow = N / bw; // boxes across
    const br = bh * Math.floor(k / perRow), bc = bw * (k % perRow);
    for (let i = 0; i < bh; i++) for (let j = 0; j < bw; j++) box.push((r0 + br + i) * W + c0 + bc + j);
    out.push(row, col, box);
  }
  return out;
}

// ---- points ---------------------------------------------------------------
export const MEGA_POT = 100;
export function megaValue(count) { return count > 0 ? Math.round(MEGA_POT / count) : MEGA_POT; }
// Ranking: points first, then sudokus solved.
export function megaRank(a, b) {
  if (b.points !== a.points) return b.points - a.points;
  return b.total - a.total;
}

// ---- the schedule (Search's, lib/search.js searchWindows) -------------------
export const MEGA_MIN_MS = 24 * 3600000;
export const MEGA_MAX_MS = 72 * 3600000; // the old cap: history only
// NO AUTOMATIC TURNOVER (owner, 2026-11-26: "stay live until each element / word
// is found. No automatic turnover."). A board whose 72 hour cap had not come up
// by MEGA_NO_CAP_FROM never closes on the clock, only when every sudoku has a
// solver. Boards whose cap fell before that moment keep the close they had, so
// the history does not move (the windows are recomputed from the launch).
export const MEGA_NO_CAP_FROM = Date.parse('2026-11-27T03:30:00Z');
// windows: [{ num, opens, closes|null, solvedAt|null, min, cap }] for every
// board that has opened by `now`. `solved` maps a board number to the moment
// its last sudoku was first solved. `cap` is null under the no-turnover rule.
// The last board in the bank stays open until another is added.
export function megaWindows(game, boardCount, solved, now = Date.now(), noCapFrom = MEGA_NO_CAP_FROM) {
  const out = [];
  let opens = MEGA[game].launch;
  for (let n = 1; n <= boardCount && opens <= now; n++) {
    const s = solved && solved[n] ? Number(solved[n]) : null;
    const min = opens + MEGA_MIN_MS;
    const cap = opens + MEGA_MAX_MS <= noCapFrom ? opens + MEGA_MAX_MS : null;
    let closes = null;
    if (n < boardCount) {
      if (cap) { if (s) closes = Math.min(cap, Math.max(min, s)); else if (now >= cap) closes = cap; }
      else if (s) closes = Math.max(min, s);
    }
    out.push({ num: n, opens, closes, solvedAt: s, min, cap });
    if (closes == null) break;
    opens = closes;
  }
  return out;
}
export function megaBoardForTime(windows, t) {
  let pick = windows[0] || null;
  for (const w of windows) if (w.opens <= t) pick = w;
  return pick;
}

// An Eastern day as a whole number, and back: the day a solve is filed under.
export function etDayNum(t = Date.now()) {
  const s = new Date(t).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  return Math.round(Date.parse(s + 'T00:00:00Z') / 86400000);
}
export function dayNumToIso(n) { return new Date(n * 86400000).toISOString().slice(0, 10); }
export function megaQuizId(game, iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${game}-${m}-${d}-${String(y).slice(2)}`;
}

// ---- solving, for the generator and the checker -----------------------------
// Can the sudoku `id` be finished from `given` (board index -> digit, 0 empty)
// by naked and hidden singles alone, using only its own squares? Returns the
// number of hidden-single steps it took, or -1 if it stalls.
export function megaSingles(L, id, given) {
  const N = L.N, cells = L.grids[id], houses = megaHouses(L, id);
  const val = new Map(); for (const x of cells) val.set(x, given[x] || 0);
  const hs = new Map(); for (const x of cells) hs.set(x, []);
  houses.forEach((h, hi) => h.forEach((x) => hs.get(x).push(hi)));
  const FULL = ((1 << N) - 1) << 1;
  const cand = (x) => { let m = FULL; for (const hi of hs.get(x)) for (const y of houses[hi]) { const v = val.get(y); if (v) m &= ~(1 << v); } return m; };
  let left = cells.filter((x) => !val.get(x)).length, hidden = 0, prog = true;
  while (left && prog) {
    prog = false;
    for (const x of cells) { if (val.get(x)) continue; const m = cand(x); if (m && !(m & (m - 1))) { val.set(x, 31 - Math.clz32(m)); left--; prog = true; } }
    if (prog) continue;
    for (const h of houses) {
      for (let d = 1; d <= N; d++) {
        if (h.some((x) => val.get(x) === d)) continue;
        const spots = h.filter((x) => !val.get(x) && (cand(x) & (1 << d)));
        if (spots.length === 1) { val.set(spots[0], d); left--; hidden++; prog = true; }
      }
    }
  }
  if (left) return { ok: false, hidden };
  return { ok: true, hidden, val };
}

// How many solutions the sudoku `id` has from its own givens, counted up to 2.
export function megaCount(L, id, given) {
  const N = L.N, cells = L.grids[id], houses = megaHouses(L, id);
  const at = new Map(cells.map((x, k) => [x, k]));
  const peers = cells.map(() => new Set());
  for (const h of houses) for (const x of h) for (const y of h) if (x !== y) peers[at.get(x)].add(at.get(y));
  const P = peers.map((s) => [...s]);
  const v = cells.map((x) => given[x] || 0);
  let found = 0;
  const go = () => {
    let best = -1, bm = 0, bn = 99;
    for (let k = 0; k < v.length; k++) {
      if (v[k]) continue;
      let m = ((1 << N) - 1) << 1;
      for (const p of P[k]) if (v[p]) m &= ~(1 << v[p]);
      let n = 0; for (let d = 1; d <= N; d++) if (m & (1 << d)) n++;
      if (n === 0) return;
      if (n < bn) { bn = n; best = k; bm = m; if (n === 1) break; }
    }
    if (best < 0) { found++; return; }
    for (let d = 1; d <= N && found < 2; d++) if (bm & (1 << d)) { v[best] = d; go(); v[best] = 0; }
  };
  go();
  return found;
}
