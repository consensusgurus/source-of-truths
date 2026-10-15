// scripts/lines-core.mjs: the GENERATOR's engine for the two line sudokus,
// Five (German whispers: neighbours along a line differ by at least 5) and
// Racecar (palindrome: a line reads the same from either end).
//
// Shared by scripts/gen-five.mjs and scripts/gen-racecar.mjs ONLY. The
// verifiers (verify-five.mjs, verify-racecar.mjs) carry their own solvers and
// import nothing from here, so a bug in this file cannot vouch for itself.
//
// Candidates are 9-bit masks (bit d = digit d possible). A line is a list of
// cell indices (r * 9 + c) joined by king steps.
//
//   kind 'five'     every two squares next to each other on a line differ by >= 5
//   kind 'racecar'  square k and square L-1-k of a line hold the same digit

export const ALL = 0x3fe;
export const POP = new Int8Array(1024);
for (let m = 0; m < 1024; m++) { let n = 0; for (let d = 1; d <= 9; d++) if (m & (1 << d)) n++; POP[m] = n; }
export const LOW = new Int8Array(1024);
for (let m = 1; m < 1024; m++) { let d = 0; while (!(m & (1 << d))) d++; LOW[m] = d; }

export const rowOf = (i) => Math.floor(i / 9);
export const colOf = (i) => i % 9;
export const boxOf = (i) => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);
export const sees = (a, b) => a !== b && (rowOf(a) === rowOf(b) || colOf(a) === colOf(b) || boxOf(a) === boxOf(b));
export const UNITS = (() => {
  const u = [];
  for (let r = 0; r < 9; r++) u.push(Array.from({ length: 9 }, (_, c) => r * 9 + c));
  for (let c = 0; c < 9; c++) u.push(Array.from({ length: 9 }, (_, r) => r * 9 + c));
  for (let b = 0; b < 9; b++) { const o = []; for (let k = 0; k < 9; k++) o.push((Math.floor(b / 3) * 3 + Math.floor(k / 3)) * 9 + (b % 3) * 3 + (k % 3)); u.push(o); }
  return u;
})();
export const PEERS = Array.from({ length: 81 }, (_, i) => { const o = []; for (let j = 0; j < 81; j++) if (sees(i, j)) o.push(j); return o; });

export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const shuffle = (arr, rnd) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };

// ---- a random full grid --------------------------------------------------
export function fullGrid(rnd) {
  const g = new Int8Array(81);
  const go = (i) => {
    if (i === 81) return true;
    let used = 0;
    for (const j of PEERS[i]) if (g[j]) used |= 1 << g[j];
    const ds = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => !(used & (1 << d))), rnd);
    for (const d of ds) { g[i] = d; if (go(i + 1)) return true; }
    g[i] = 0;
    return false;
  };
  go(0);
  return Array.from(g);
}

// ---- the line rule as pairwise constraints --------------------------------
// Both rules are BINARY: Five relates each neighbouring pair on a line, Racecar
// each mirrored pair. PAIRS is the list of [a, b] the rule binds.
export function pairsOf(kind, lines) {
  const out = [];
  for (const L of lines) {
    if (kind === 'five') for (let k = 0; k + 1 < L.length; k++) out.push([L[k], L[k + 1]]);
    else for (let k = 0; k < Math.floor(L.length / 2); k++) out.push([L[k], L[L.length - 1 - k]]);
  }
  return out;
}
// The digits of b that some digit of mask a can sit next to.
const FIVE_OK = new Int32Array(1024);
for (let m = 0; m < 1024; m++) {
  let o = 0;
  for (let d = 1; d <= 9; d++) if (m & (1 << d)) for (let e = 1; e <= 9; e++) if (Math.abs(d - e) >= 5) o |= 1 << e;
  FIVE_OK[m] = o;
}
export const support = (kind, m) => (kind === 'five' ? FIVE_OK[m] : m);

// Arc consistency over the line pairs, to a fixpoint. Returns false on a wipe.
export function lineReading(kind, pairs, cand) {
  let moved = false;
  for (let changed = true; changed;) {
    changed = false;
    for (const [a, b] of pairs) {
      const na = cand[a] & support(kind, cand[b]);
      const nb = cand[b] & support(kind, cand[a]);
      if (na !== cand[a]) { cand[a] = na; changed = moved = true; }
      if (nb !== cand[b]) { cand[b] = nb; changed = moved = true; }
      if (!na || !nb) return null;
    }
  }
  return moved;
}

// ---- logic solver, graded ------------------------------------------------
// level 1: line reading + naked and hidden singles.
// level 2: also locked candidates (pointing and claiming) and naked pairs and
//          triples. Returns { solved, level, grid }.
export function logicSolve(kind, lines, given, maxLevel) {
  const pairs = pairsOf(kind, lines);
  const cand = new Int32Array(81).fill(ALL);
  const val = new Int8Array(81);
  const place = (i, d) => { val[i] = d; cand[i] = 1 << d; for (const j of PEERS[i]) cand[j] &= ~(1 << d); };
  for (let i = 0; i < 81; i++) if (given[i]) place(i, given[i]);
  let hardest = 1;
  const singles = () => {
    let did = false;
    for (let i = 0; i < 81; i++) if (!val[i]) { if (!cand[i]) return null; if (POP[cand[i]] === 1) { place(i, LOW[cand[i]]); did = true; } }
    for (const u of UNITS) for (let d = 1; d <= 9; d++) {
      let n = 0, at = -1, have = false;
      for (const i of u) { if (val[i] === d) { have = true; break; } if (cand[i] & (1 << d)) { n++; at = i; } }
      if (have) continue;
      if (n === 0) return null;
      if (n === 1) { place(at, d); did = true; }
    }
    return did;
  };
  const locked = () => {
    let did = false;
    for (let b = 18; b < 27; b++) for (let d = 1; d <= 9; d++) {
      const cells = UNITS[b].filter((i) => !val[i] && (cand[i] & (1 << d)));
      if (cells.length < 2) continue;
      for (const k of [0, 9]) {
        const lineIdx = k === 0 ? rowOf : colOf;
        if (cells.every((i) => lineIdx(i) === lineIdx(cells[0]))) {
          const u = UNITS[k + lineIdx(cells[0])];
          for (const j of u) if (!val[j] && !cells.includes(j) && (cand[j] & (1 << d))) { cand[j] &= ~(1 << d); did = true; }
        }
      }
    }
    for (let k = 0; k < 18; k++) for (let d = 1; d <= 9; d++) {
      const cells = UNITS[k].filter((i) => !val[i] && (cand[i] & (1 << d)));
      if (cells.length < 2 || !cells.every((i) => boxOf(i) === boxOf(cells[0]))) continue;
      for (const j of UNITS[18 + boxOf(cells[0])]) if (!val[j] && !cells.includes(j) && (cand[j] & (1 << d))) { cand[j] &= ~(1 << d); did = true; }
    }
    return did;
  };
  const subsets = () => {
    let did = false;
    for (const u of UNITS) {
      const open = u.filter((i) => !val[i]);
      for (let a = 0; a < open.length; a++) for (let b = a + 1; b < open.length; b++) {
        const m2 = cand[open[a]] | cand[open[b]];
        if (POP[m2] === 2) for (const j of open) if (j !== open[a] && j !== open[b] && (cand[j] & m2)) { cand[j] &= ~m2; did = true; }
        for (let c = b + 1; c < open.length; c++) {
          const m3 = m2 | cand[open[c]];
          if (POP[m3] === 3) for (const j of open) if (j !== open[a] && j !== open[b] && j !== open[c] && (cand[j] & m3)) { cand[j] &= ~m3; did = true; }
        }
      }
    }
    return did;
  };
  for (let guard = 0; guard < 2000; guard++) {
    const lr = lineReading(kind, pairs, cand);
    if (lr === null) return { solved: false, level: hardest, grid: Array.from(val) };
    const s = singles();
    if (s === null) return { solved: false, level: hardest, grid: Array.from(val) };
    if (s || lr) continue;
    if (maxLevel >= 2 && (locked() || subsets())) { hardest = 2; continue; }
    break;
  }
  return { solved: val.every((v) => v > 0), level: hardest, grid: Array.from(val) };
}

// ---- exhaustive counter with the line rule (or without: lines = []) ------
export function countSolutions(kind, lines, given, cap = 2) {
  const pairs = pairsOf(kind, lines);
  const pairsAt = Array.from({ length: 81 }, () => []);
  for (const p of pairs) { pairsAt[p[0]].push(p); pairsAt[p[1]].push(p); }
  let count = 0;
  const cand0 = new Int32Array(81).fill(ALL);
  const go = (cand) => {
    // propagate: singles from peers + line arcs
    for (let changed = true; changed;) {
      changed = false;
      for (let i = 0; i < 81; i++) {
        if (!cand[i]) return;
        if (POP[cand[i]] === 1) {
          const m = cand[i];
          for (const j of PEERS[i]) if (cand[j] & m) { cand[j] &= ~m; if (!cand[j]) return; changed = true; }
        }
      }
      if (pairs.length) {
        const r = lineReading(kind, pairs, cand);
        if (r === null) return;
        if (r) changed = true;
      }
    }
    let best = -1, bn = 10;
    for (let i = 0; i < 81; i++) { const n = POP[cand[i]]; if (n > 1 && n < bn) { bn = n; best = i; } }
    if (best < 0) {
      // verify the grid (peers distinct is implied by propagation of singles)
      count++;
      return;
    }
    for (let m = cand[best]; m && count < cap; m &= m - 1) {
      const bit = m & -m;
      const c2 = Int32Array.from(cand);
      c2[best] = bit;
      go(c2);
    }
  };
  for (let i = 0; i < 81; i++) if (given[i]) cand0[i] = 1 << given[i];
  go(cand0);
  return count;
}

// ---- building lines that the solution satisfies --------------------------
const KING = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
// Two diagonal steps cross when they are the two diagonals of one 2x2 square.
const diagKey = (a, b) => { const r = Math.min(rowOf(a), rowOf(b)), c = Math.min(colOf(a), colOf(b)); return r * 9 + c; };

// Grow `count` lines of length lo..hi on solution `sol`. A line never revisits
// or touches itself out of order (no two non-consecutive squares of one line
// are king neighbours), lines never share a square, and no two diagonal steps
// cross. For Racecar, mirrored squares must hold the same digit (so they can
// never see each other); for Five, neighbours on the line differ by >= 5.
export function buildLines(kind, sol, rnd, { count, lo, hi, tries = 4000 }) {
  const used = new Uint8Array(81);
  const diagUsed = new Set();
  const lines = [];
  const kingAdj = (a, b) => Math.abs(rowOf(a) - rowOf(b)) <= 1 && Math.abs(colOf(a) - colOf(b)) <= 1 && a !== b;
  for (let t = 0; t < tries && lines.length < count; t++) {
    const L = lo + Math.floor(rnd() * (hi - lo + 1));
    const start = Math.floor(rnd() * 81);
    if (used[start]) continue;
    if (kind === 'five' && sol[start] === 5) continue;
    const path = [start];
    const diags = [];
    let ok = true;
    while (path.length < L) {
      const cur = path[path.length - 1];
      const opts = [];
      for (const [dr, dc] of KING) {
        const r = rowOf(cur) + dr, c = colOf(cur) + dc;
        if (r < 0 || r > 8 || c < 0 || c > 8) continue;
        const nx = r * 9 + c;
        if (used[nx] || path.includes(nx)) continue;
        if (path.slice(0, -1).some((p) => kingAdj(p, nx))) continue;
        if (dr && dc) { const k = diagKey(cur, nx); if (diagUsed.has(k) || diags.includes(k)) continue; }
        if (kind === 'five' && Math.abs(sol[cur] - sol[nx]) < 5) continue;
        opts.push(nx);
      }
      if (!opts.length) { ok = false; break; }
      const nx = opts[Math.floor(rnd() * opts.length)];
      if (rowOf(nx) !== rowOf(cur) && colOf(nx) !== colOf(cur)) diags.push(diagKey(cur, nx));
      path.push(nx);
    }
    if (!ok) continue;
    if (kind === 'racecar') {
      let pal = true;
      for (let k = 0; k < Math.floor(L / 2); k++) if (sol[path[k]] !== sol[path[L - 1 - k]]) { pal = false; break; }
      if (!pal) continue;
    }
    for (const p of path) used[p] = 1;
    for (const k of diags) diagUsed.add(k);
    lines.push(path);
  }
  return lines;
}

// Dig clues out of `sol` in a random order, keeping each removal only while
// the board stays unique (with lines) AND falls to logic at `level`. Stops at
// `target` printed digits, or returns the best it reached.
export function dig(kind, lines, sol, rnd, target, level) {
  const given = sol.slice();
  const order = shuffle([...Array(81).keys()], rnd);
  let printed = 81;
  for (const i of order) {
    if (printed <= target) break;
    const keep = given[i];
    given[i] = 0;
    const lg = logicSolve(kind, lines, given, level);
    if (lg.solved) { printed--; continue; }
    given[i] = keep;
  }
  return { given, printed };
}
