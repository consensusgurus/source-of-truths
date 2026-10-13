// Shared arrow-sudoku engine for Arrow: solution and arrow builder, the
// graded logical solver, and the uniqueness counter the GENERATOR uses.
//
// scripts/gen-arrow.mjs imports this. scripts/verify-arrow.mjs imports
// NOTHING from here (the Cages/Sando rule).
//
// An Arrow board is an ordinary 9x9 sudoku plus ARROWS. An arrow is a path
// of cells: the first is its CIRCLE, the rest its SHAFT, each step to one of
// the eight neighbouring squares. The digit in the circle equals the SUM of
// the digits on the shaft. Digits may repeat on a shaft when the two squares
// share no row, column or box. Arrows never share a square, and two diagonal
// steps never cross each other.
export const N = 9;
export const CELLS = 81;
export const boxOf = (r, c) => Math.floor(r / 3) * 3 + Math.floor(c / 3);
export const FULL = 0b1111111110;

export function makeRng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
export function shuffled(arr, rnd) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function randomSolution(rnd) {
  const g = Array(CELLS).fill(0);
  const R = Array(9).fill(0), C = Array(9).fill(0), B = Array(9).fill(0);
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const rec = (p) => {
    if (p === CELLS) return true;
    const r = Math.floor(p / N), c = p % N, b = boxOf(r, c);
    for (const d of shuffled(digits, rnd)) {
      const m = 1 << d;
      if ((R[r] | C[c] | B[b]) & m) continue;
      g[p] = d; R[r] |= m; C[c] |= m; B[b] |= m;
      if (rec(p + 1)) return true;
      R[r] &= ~m; C[c] &= ~m; B[b] &= ~m; g[p] = 0;
    }
    return false;
  };
  rec(0);
  return g;
}

export const UNITS = (() => {
  const u = [];
  for (let r = 0; r < N; r++) u.push(Array.from({ length: N }, (_, c) => r * N + c));
  for (let c = 0; c < N; c++) u.push(Array.from({ length: N }, (_, r) => r * N + c));
  for (let b = 0; b < N; b++) {
    const cells = [];
    for (let i = 0; i < CELLS; i++) if (boxOf(Math.floor(i / N), i % N) === b) cells.push(i);
    u.push(cells);
  }
  return u;
})();
export const PEERS = (() => {
  const p = Array.from({ length: CELLS }, () => new Set());
  for (const u of UNITS) for (const a of u) for (const b of u) if (a !== b) p[a].add(b);
  return p.map((s) => [...s]);
})();
const PEERSET = PEERS.map((a) => new Set(a));
export const isPeer = (a, b) => PEERSET[a].has(b);

const NB = Array.from({ length: CELLS }, (_, i) => {
  const r = Math.floor(i / N), c = i % N, out = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const rr = r + dr, cc = c + dc;
    if (rr >= 0 && rr < N && cc >= 0 && cc < N) out.push(rr * N + cc);
  }
  return out;
});
const segKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
// a diagonal step a->b crosses the other diagonal of the same 2x2 square
function crosses(a, b, segs) {
  const ra = Math.floor(a / N), ca = a % N, rb = Math.floor(b / N), cb = b % N;
  if (ra === rb || ca === cb) return false;
  return segs.has(segKey(ra * N + cb, rb * N + ca));
}

// Random arrow layout over a solution. For each candidate circle, every shaft
// that sums to the circle's digit is enumerated (shafts of minShaft..maxShaft
// squares, no turn of 90 degrees or more so a line never doubles back, never
// touching itself), and one is picked at random. Returns arrows as paths of
// [r, c], circle first, or null if `count` cannot be placed.
export function buildArrows(sol, rnd, { count, minShaft, maxShaft }) {
  const used = new Set();
  const segs = new Set();
  const out = [];
  for (const b of shuffled(Array.from({ length: CELLS }, (_, i) => i), rnd)) {
    if (out.length >= count) break;
    if (used.has(b) || sol[b] < 3) continue;
    const target = sol[b];
    const found = [];
    const path = [b];
    const dfs = (sum) => {
      const len = path.length - 1;
      if (sum === target && len >= minShaft) { found.push(path.slice()); }
      if (len >= maxShaft || sum >= target || found.length > 400) return;
      const cur = path[path.length - 1];
      const prev = path.length > 1 ? path[path.length - 2] : -1;
      for (const nx of NB[cur]) {
        if (used.has(nx) || path.includes(nx)) continue;
        if (sum + sol[nx] > target) continue;
        if (crosses(cur, nx, segs)) continue;
        if (prev >= 0) {
          const d1r = Math.floor(cur / N) - Math.floor(prev / N), d1c = (cur % N) - (prev % N);
          const d2r = Math.floor(nx / N) - Math.floor(cur / N), d2c = (nx % N) - (cur % N);
          if (d1r * d2r + d1c * d2c <= 0) continue;
        }
        let clash = false;
        for (let k = 1; k < path.length; k++) if (sol[path[k]] === sol[nx] && isPeer(path[k], nx)) { clash = true; break; }
        if (clash) continue;
        let touch = false;
        for (let k = 0; k < path.length - 1; k++) if (NB[path[k]].includes(nx)) { touch = true; break; }
        if (touch) continue;
        path.push(nx);
        dfs(sum + sol[nx]);
        path.pop();
      }
    };
    dfs(0);
    if (!found.length) continue;
    const pick = found[Math.floor(rnd() * found.length)];
    out.push(pick.map((i) => [Math.floor(i / N), i % N]));
    pick.forEach((i) => used.add(i));
    for (let k = 0; k + 1 < pick.length; k++) segs.add(segKey(pick[k], pick[k + 1]));
  }
  return out.length >= count ? out.slice(0, count) : null;
}

export const bitCount = (m) => { let n = 0; while (m) { m &= m - 1; n++; } return n; };
const oneDigit = (m) => { for (let d = 1; d <= 9; d++) if (m === (1 << d)) return d; return 0; };

// For one arrow, the digits each of its squares can still take: those used
// by some complete filling of the arrow consistent with the candidates.
function arrowSupport(cand, cells) {
  const n = cells.length;
  const keep = new Array(n).fill(0);
  const vals = [];
  const rec = (k, sum) => {
    if (k === n) { if (sum === vals[0]) for (let j = 0; j < n; j++) keep[j] |= 1 << vals[j]; return; }
    const m = cand[cells[k]];
    for (let d = 1; d <= 9; d++) {
      if (!(m & (1 << d))) continue;
      if (k > 0 && sum + d + (n - 1 - k) > vals[0]) break;
      let ok = true;
      for (let j = 1; j < k; j++) if (vals[j] === d && isPeer(cells[j], cells[k])) { ok = false; break; }
      if (!ok) continue;
      vals.push(d);
      rec(k + 1, k === 0 ? 0 : sum + d);
      vals.pop();
    }
  };
  rec(0, 0);
  return keep;
}
// Arrow support plus naked singles, to a fixpoint. False on a contradiction.
function propagate(cand, arIdx) {
  for (;;) {
    let changed = false;
    for (const a of arIdx) {
      const keep = arrowSupport(cand, a);
      for (let j = 0; j < a.length; j++) {
        const nx = cand[a[j]] & keep[j];
        if (nx !== cand[a[j]]) { cand[a[j]] = nx; changed = true; if (!nx) return false; }
      }
    }
    for (let i = 0; i < CELLS; i++) {
      if (bitCount(cand[i]) !== 1) continue;
      for (const p of PEERS[i]) {
        const nx = cand[p] & ~cand[i];
        if (nx !== cand[p]) { cand[p] = nx; changed = true; if (!nx) return false; }
      }
    }
    if (!changed) return true;
  }
}

// ─── the graded logical solver ─────────────────────────────────────────────
// Arrow sums are the pencil work of this game (free, like candidates); the
// counted steps are hidden single (4), locked candidates (12), naked/hidden
// pair (20). cost = the weighted tally.
export function gradeSolve(arrows, givens) {
  const cand = Array(CELLS).fill(FULL);
  if (givens) for (let i = 0; i < CELLS; i++) if (givens[i]) cand[i] = 1 << givens[i];
  const arIdx = arrows.map((a) => a.map(([r, c]) => r * N + c));
  const tally = { hidden: 0, locked: 0, pairs2: 0 };

  const hiddenSingle = () => {
    for (const u of UNITS) {
      for (let d = 1; d <= 9; d++) {
        const m = 1 << d;
        let spot = -1, n = 0;
        for (const i of u) if (cand[i] & m) { n++; spot = i; if (n > 1) break; }
        if (n === 1 && bitCount(cand[spot]) > 1) { cand[spot] = m; tally.hidden++; return true; }
      }
    }
    return false;
  };
  const locked = () => {
    for (let b = 0; b < 9; b++) {
      const box = UNITS[18 + b];
      for (let d = 1; d <= 9; d++) {
        const m = 1 << d;
        const spots = box.filter((i) => cand[i] & m);
        if (spots.length < 2 || spots.length > 3) continue;
        const rows = new Set(spots.map((i) => Math.floor(i / N)));
        const cols = new Set(spots.map((i) => i % N));
        for (const [set, line] of [[rows, 'r'], [cols, 'c']]) {
          if (set.size !== 1) continue;
          const k = [...set][0];
          let hit = false;
          for (let x = 0; x < N; x++) {
            const i = line === 'r' ? k * N + x : x * N + k;
            if (boxOf(Math.floor(i / N), i % N) !== b && (cand[i] & m)) { cand[i] &= ~m; hit = true; }
          }
          if (hit) { tally.locked++; return true; }
        }
      }
    }
    for (let li = 0; li < 18; li++) {
      const u = UNITS[li];
      for (let d = 1; d <= 9; d++) {
        const m = 1 << d;
        const spots = u.filter((i) => cand[i] & m);
        if (spots.length < 2 || spots.length > 3) continue;
        const boxes = new Set(spots.map((i) => boxOf(Math.floor(i / N), i % N)));
        if (boxes.size !== 1) continue;
        const b = [...boxes][0];
        let hit = false;
        for (const i of UNITS[18 + b]) if (!u.includes(i) && (cand[i] & m)) { cand[i] &= ~m; hit = true; }
        if (hit) { tally.locked++; return true; }
      }
    }
    return false;
  };
  const pairs2 = () => {
    for (const u of UNITS) {
      for (let x = 0; x < u.length; x++) {
        const i = u[x];
        if (bitCount(cand[i]) !== 2) continue;
        for (let y = x + 1; y < u.length; y++) {
          const j = u[y];
          if (cand[j] !== cand[i]) continue;
          let hit = false;
          for (const k of u) {
            if (k === i || k === j) continue;
            const nx = cand[k] & ~cand[i];
            if (nx !== cand[k]) { cand[k] = nx; hit = true; }
          }
          if (hit) { tally.pairs2++; return true; }
        }
      }
      for (let a = 1; a <= 9; a++) for (let b2 = a + 1; b2 <= 9; b2++) {
        const ma = 1 << a, mb = 1 << b2;
        const sa = u.filter((i) => cand[i] & ma);
        const sb = u.filter((i) => cand[i] & mb);
        if (sa.length !== 2 || sb.length !== 2) continue;
        if (sa[0] !== sb[0] || sa[1] !== sb[1]) continue;
        let hit = false;
        for (const i of sa) {
          const nx = cand[i] & (ma | mb);
          if (nx !== cand[i]) { cand[i] = nx; hit = true; }
        }
        if (hit) { tally.pairs2++; return true; }
      }
    }
    return false;
  };

  for (;;) {
    if (!propagate(cand, arIdx)) return { solved: false, cost: 0, tally, grid: null };
    let done = true;
    for (let i = 0; i < CELLS; i++) if (bitCount(cand[i]) !== 1) { done = false; break; }
    if (done) {
      const cost = tally.hidden * 4 + tally.locked * 12 + tally.pairs2 * 20;
      return { solved: true, cost, tally, grid: cand.map(oneDigit) };
    }
    if (hiddenSingle()) continue;
    if (locked()) continue;
    if (pairs2()) continue;
    return { solved: false, cost: 0, tally, grid: null };
  }
}

// ─── uniqueness counter (arrows optional: [] counts a plain sudoku) ────────
// Propagation at every node, then a branch on the square with the fewest
// candidates. A plain cell-by-cell search with only a running-sum bound took
// 78 seconds on one twelve-arrow, eight-digit Sunday; this takes milliseconds.
export function countSolutions(arrows, givens, cap = 2) {
  const arIdx = arrows.map((a) => a.map(([r, c]) => r * N + c));
  const start = Array(CELLS).fill(FULL);
  if (givens) for (let i = 0; i < CELLS; i++) if (givens[i]) start[i] = 1 << givens[i];
  let found = 0;
  const rec = (cand) => {
    if (found >= cap) return;
    if (!propagate(cand, arIdx)) return;
    let best = -1, bc = 10;
    for (let i = 0; i < CELLS; i++) {
      const k = bitCount(cand[i]);
      if (k > 1 && k < bc) { bc = k; best = i; if (k === 2) break; }
    }
    if (best < 0) { found++; return; }
    for (let d = 1; d <= 9 && found < cap; d++) {
      if (!(cand[best] & (1 << d))) continue;
      const next = cand.slice();
      next[best] = 1 << d;
      rec(next);
    }
  };
  rec(start);
  return found;
}
