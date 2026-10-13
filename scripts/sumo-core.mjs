// Engine for Sumo, the daily greater-than sudoku: geometry, the inequality
// relations, a random grid, an exhaustive counter and the graded logical
// solver. Used by scripts/gen-sumo.mjs ONLY. scripts/verify-sumo.mjs writes its
// own solvers and imports nothing from here, so the two cannot agree about a bug.
//
// THE RULE. An ordinary 9x9 sudoku, plus a sign on every edge INSIDE a 3x3 box
// (12 per box, 108 on the board) saying which of the two squares holds the
// larger digit. Box borders carry no sign. The signs are read off the solution,
// so every one of the 108 is always printed; the ramp is the digits.

export const rowOf = (i) => Math.floor(i / 9);
export const colOf = (i) => i % 9;
export const boxOf = (i) => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);

export const SEE = Array.from({ length: 81 }, (_, i) => {
  const out = [];
  for (let j = 0; j < 81; j++) if (j !== i && (rowOf(j) === rowOf(i) || colOf(j) === colOf(i) || boxOf(j) === boxOf(i))) out.push(j);
  return out;
});
export const UNITS = (() => {
  const u = [];
  for (let r = 0; r < 9; r++) u.push(Array.from({ length: 9 }, (_, c) => r * 9 + c));
  for (let c = 0; c < 9; c++) u.push(Array.from({ length: 9 }, (_, r) => r * 9 + c));
  for (let br = 0; br < 3; br++) for (let bc = 0; bc < 3; bc++) {
    const b = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) b.push((br * 3 + r) * 9 + bc * 3 + c);
    u.push(b);
  }
  return u;
})();
export const UNITS_OF = (() => {
  const m = Array.from({ length: 81 }, () => []);
  UNITS.forEach((u, k) => u.forEach((i) => m[i].push(k)));
  return m;
})();
// The 108 in-box edges, as [a, b] with b to the right of or below a.
export const EDGES = (() => {
  const e = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    const i = r * 9 + c;
    if (c % 3 !== 2) e.push([i, i + 1]);
    if (r % 3 !== 2) e.push([i, i + 9]);
  }
  return e;
})();

// Signs as stored on a board: h[r] is 6 chars over the in-box horizontal
// edges of row r (c = 0,1,3,4,6,7), '<' when the left square is smaller.
// v[k] for k = 0..5 is the in-box vertical edges under rows 0,1,3,4,6,7, 9
// chars, '^' when the upper square is smaller, 'v' when it is larger.
export const H_COLS = [0, 1, 3, 4, 6, 7];
export const V_ROWS = [0, 1, 3, 4, 6, 7];
export function signsOf(sol) {
  const g = (r, c) => sol[r * 9 + c];
  const h = Array.from({ length: 9 }, (_, r) => H_COLS.map((c) => (g(r, c) < g(r, c + 1) ? '<' : '>')).join(''));
  const v = V_ROWS.map((r) => Array.from({ length: 9 }, (_, c) => (g(r, c) < g(r + 1, c) ? '^' : 'v')).join(''));
  return { h, v };
}
// Signs -> [small, big] pairs.
export function pairsOf(h, v) {
  const p = [];
  for (let r = 0; r < 9; r++) H_COLS.forEach((c, k) => { const a = r * 9 + c; p.push(h[r][k] === '<' ? [a, a + 1] : [a + 1, a]); });
  V_ROWS.forEach((r, k) => { for (let c = 0; c < 9; c++) { const a = r * 9 + c; p.push(v[k][c] === '^' ? [a, a + 9] : [a + 9, a]); } });
  return p;
}

export const ALL = 0x3fe;
export const POP = new Int8Array(1024);
for (let m = 0; m < 1024; m++) { let n = 0; for (let d = 1; d <= 9; d++) if (m & (1 << d)) n++; POP[m] = n; }
export const LOW = new Int8Array(1024);
export const HIGH = new Int8Array(1024);
for (let m = 1; m < 1024; m++) { let d = 0; while (!(m & (1 << d))) d++; LOW[m] = d; let h = 9; while (!(m & (1 << h))) h--; HIGH[m] = h; }
// digits strictly below d / strictly above d
const BELOW = Array.from({ length: 11 }, (_, d) => { let m = 0; for (let x = 1; x < d && x <= 9; x++) m |= 1 << x; return m; });
const ABOVE = Array.from({ length: 11 }, (_, d) => { let m = 0; for (let x = d + 1; x <= 9; x++) m |= 1 << x; return m; });

// The static box reading: in a box, a square with k squares chained below it
// (inside the box) is at least k+1, and with k chained above it at most 9-k.
export function staticBounds(pairs) {
  const up = Array.from({ length: 81 }, () => []);   // up[a] = squares directly greater than a
  for (const [s, g] of pairs) up[s].push(g);
  const reach = (i, adj) => { const seen = new Set(); const st = [i]; while (st.length) { const x = st.pop(); for (const y of adj[x]) if (!seen.has(y)) { seen.add(y); st.push(y); } } return seen.size; };
  const down = Array.from({ length: 81 }, () => []);
  for (const [s, g] of pairs) down[g].push(s);
  const mask = new Int32Array(81);
  for (let i = 0; i < 81; i++) {
    const below = reach(i, down), above = reach(i, up);
    let m = 0;
    for (let d = below + 1; d <= 9 - above; d++) m |= 1 << d;
    mask[i] = m;
  }
  return mask;
}

export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const shuffle = (arr, rnd) => {
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
};

export function fullGrid(rnd) {
  const g = new Int8Array(81);
  const cand = new Int32Array(81).fill(ALL);
  let nodes = 0;
  const go = () => {
    if (++nodes > 200000) throw new Error('cap');
    let best = -1, bn = 10;
    for (let i = 0; i < 81; i++) { if (g[i]) continue; const n = POP[cand[i]]; if (n < bn) { bn = n; best = i; if (n <= 1) break; } }
    if (best < 0) return true;
    if (bn === 0) return false;
    const opts = []; for (let d = 1; d <= 9; d++) if (cand[best] & (1 << d)) opts.push(d);
    shuffle(opts, rnd);
    for (const d of opts) {
      g[best] = d; const undo = [];
      for (const j of SEE[best]) if (!g[j] && (cand[j] & (1 << d))) { cand[j] &= ~(1 << d); undo.push(j); }
      if (go()) return true;
      for (const j of undo) cand[j] |= (1 << d);
      g[best] = 0;
    }
    return false;
  };
  try { if (go()) return Array.from(g); } catch (e) { /* restart */ }
  return null;
}

// Exhaustive count with forward checking over SEE and the signs. `signs` off
// drops every sign and leaves an ordinary sudoku (sign necessity).
export function countSolutions(given, pairs, cap, signs = true) {
  const P = signs ? pairs : [];
  const g = Int8Array.from(given);
  const cand = new Int32Array(81).fill(ALL);
  const lt = Array.from({ length: 81 }, () => []), gt = Array.from({ length: 81 }, () => []);
  for (const [s, b] of P) { gt[s].push(b); lt[b].push(s); }   // gt[s]: squares bigger than s
  if (signs) { const sb = staticBounds(P); for (let i = 0; i < 81; i++) cand[i] &= sb[i]; }
  for (let i = 0; i < 81; i++) if (g[i]) {
    if (!(cand[i] & (1 << g[i]))) return 0;
    for (const j of SEE[i]) { if (g[j] === g[i]) return 0; cand[j] &= ~(1 << g[i]); }
    for (const j of gt[i]) cand[j] &= ABOVE[g[i]];
    for (const j of lt[i]) cand[j] &= BELOW[g[i]];
    cand[i] = 1 << g[i];
  }
  for (let i = 0; i < 81; i++) if (!g[i] && cand[i] === 0) return 0;
  let found = 0;
  (function go() {
    if (found >= cap) return;
    let best = -1, bn = 10;
    for (let i = 0; i < 81; i++) { if (g[i]) continue; const n = POP[cand[i]]; if (n < bn) { bn = n; best = i; if (n <= 1) break; } }
    if (best < 0) { found++; return; }
    if (bn === 0) return;
    for (let d = 1; d <= 9; d++) {
      if (!(cand[best] & (1 << d))) continue;
      g[best] = d;
      const saved = [];
      let dead = false;
      const cut = (j, keep) => { const nv = cand[j] & keep; if (nv !== cand[j]) { saved.push(j, cand[j]); cand[j] = nv; if (nv === 0) dead = true; } };
      for (const j of SEE[best]) if (!g[j]) cut(j, ~(1 << d));
      for (const j of gt[best]) if (!g[j]) cut(j, ABOVE[d]); else if (g[j] <= d) dead = true;
      for (const j of lt[best]) if (!g[j]) cut(j, BELOW[d]); else if (g[j] >= d) dead = true;
      if (!dead) go();
      for (let k = saved.length - 2; k >= 0; k -= 2) cand[saved[k]] = saved[k + 1];
      g[best] = 0;
      if (found >= cap) return;
    }
  })();
  return found;
}

// Graded logical solver. Both levels read the signs: the static box bounds and
// bound propagation along every sign (a smaller square sits below the larger
// square's highest option; a larger one above the smaller's lowest).
// maxLevel 1: that, plus naked and hidden singles.
// maxLevel 2: also locked candidates, naked pairs and triples, hidden pairs.
export function logicSolve(given, pairs, maxLevel) {
  const solved = Int8Array.from(given);
  const cand = new Int32Array(81).fill(ALL);
  const sb = staticBounds(pairs);
  for (let i = 0; i < 81; i++) cand[i] &= sb[i];
  const place = (i, d) => { solved[i] = d; cand[i] = 1 << d; for (const j of SEE[i]) if (!solved[j]) cand[j] &= ~(1 << d); };
  for (let i = 0; i < 81; i++) if (given[i]) { if (!(cand[i] & (1 << given[i]))) return { solved: false, grid: null }; place(i, given[i]); }
  const bounds = () => {
    let moved = false, again = true;
    while (again) {
      again = false;
      for (const [s, g] of pairs) {
        const ns = cand[s] & BELOW[HIGH[cand[g]] || 0];
        if (ns !== cand[s]) { cand[s] = ns; again = moved = true; }
        const ng = cand[g] & ABOVE[LOW[cand[s]] || 10];
        if (ng !== cand[g]) { cand[g] = ng; again = moved = true; }
        if (!cand[s] || !cand[g]) return 'dead';
      }
    }
    return moved;
  };
  const singles = () => {
    let moved = false;
    for (let i = 0; i < 81; i++) if (!solved[i] && POP[cand[i]] === 1) { place(i, LOW[cand[i]]); moved = true; }
    if (moved) return true;
    for (const u of UNITS) for (let d = 1; d <= 9; d++) {
      const bit = 1 << d; let done = false;
      for (const i of u) if (solved[i] === d) { done = true; break; }
      if (done) continue;
      let spot = -1, n = 0;
      for (const i of u) if (!solved[i] && (cand[i] & bit)) { n++; spot = i; if (n > 1) break; }
      if (n === 1) { place(spot, d); moved = true; }
    }
    return moved;
  };
  const locked = () => {
    let moved = false;
    for (let k = 0; k < UNITS.length; k++) {
      const u = UNITS[k];
      for (let d = 1; d <= 9; d++) {
        const bit = 1 << d; let done = false;
        for (const i of u) if (solved[i] === d) { done = true; break; }
        if (done) continue;
        const spots = []; for (const i of u) if (!solved[i] && (cand[i] & bit)) spots.push(i);
        if (spots.length < 2 || spots.length > 3) continue;
        for (const k2 of UNITS_OF[spots[0]]) {
          if (k2 === k || !spots.every((i) => UNITS_OF[i].includes(k2))) continue;
          for (const j of UNITS[k2]) if (!solved[j] && !spots.includes(j) && (cand[j] & bit)) { cand[j] &= ~bit; moved = true; }
        }
      }
    }
    return moved;
  };
  const subsets = () => {
    let moved = false;
    const strip = (unit, group, mask) => { let did = false; for (const j of unit) { if (solved[j] || group.includes(j)) continue; if (cand[j] & mask) { cand[j] &= ~mask; did = true; } } return did; };
    for (const u of UNITS) {
      const open = u.filter((i) => !solved[i]);
      for (let a = 0; a < open.length; a++) for (let b = a + 1; b < open.length; b++) {
        const two = cand[open[a]] | cand[open[b]];
        if (POP[two] === 2) moved = strip(u, [open[a], open[b]], two) || moved;
        for (let c = b + 1; c < open.length; c++) { const three = two | cand[open[c]]; if (POP[three] === 3) moved = strip(u, [open[a], open[b], open[c]], three) || moved; }
      }
      for (let d1 = 1; d1 <= 9; d1++) for (let d2 = d1 + 1; d2 <= 9; d2++) {
        let done = false; for (const i of u) if (solved[i] === d1 || solved[i] === d2) { done = true; break; }
        if (done) continue;
        const s1 = open.filter((i) => cand[i] & (1 << d1)), s2 = open.filter((i) => cand[i] & (1 << d2));
        if (s1.length !== 2 || s2.length !== 2 || s1[0] !== s2[0] || s1[1] !== s2[1]) continue;
        const keep = (1 << d1) | (1 << d2);
        for (const i of s1) if (cand[i] & ~keep) { cand[i] &= keep; moved = true; }
      }
    }
    return moved;
  };
  for (;;) {
    const b = bounds();
    if (b === 'dead') return { solved: false, grid: null };
    if (singles()) continue;
    if (b) continue;
    if (maxLevel >= 2 && (locked() || subsets())) continue;
    break;
  }
  for (let i = 0; i < 81; i++) if (!solved[i]) return { solved: false, grid: Array.from(solved) };
  return { solved: true, grid: Array.from(solved) };
}

// Dig to exactly `printed` digits, keeping the board solvable at `level`.
export function digBoard(sol, pairs, printed, level, rnd, iters = 2000) {
  const key = sol.join(',');
  const ok = (given) => { const r = logicSolve(given, pairs, level); return r.solved && r.grid.join(',') === key; };
  const greedy = (given) => {
    let count = given.filter(Boolean).length;
    for (const i of shuffle([...Array(81).keys()], rnd)) {
      if (count <= printed) break;
      if (!given[i]) continue;
      const v = given[i]; given[i] = 0;
      if (ok(given)) count--; else given[i] = v;
    }
    return count;
  };
  let best = sol.slice();
  let bc = greedy(best);
  for (let it = 0; it < iters && bc > printed; it++) {
    const c = best.slice();
    const empties = shuffle([...Array(81).keys()].filter((i) => !c[i]), rnd);
    const back = 2 + Math.floor(rnd() * 4);
    for (let a = 0; a < back && a < empties.length; a++) c[empties[a]] = sol[empties[a]];
    const n = greedy(c);
    if (n <= bc) { best = c; bc = n; }
  }
  return { given: best, count: bc };
}
