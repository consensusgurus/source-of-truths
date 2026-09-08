// Shared engine for the two "gutter" sudokus, Frame and Rim: ordinary 9x9
// sudoku plus clues printed OUTSIDE the grid about the first three cells of a
// row or column, reading in from that edge. Thirty-six such triples exist (nine
// per side), and both games read the same triple, they just print different
// things about it:
//
//   FRAME  the SUM of the three digits (6 to 24)
//   RIM    the three digits themselves, as an unordered set
//
// scripts/verify-frame.mjs and verify-rim.mjs deliberately do NOT import this
// and write their own solvers (the Quilt rule): a verifier that shares the
// generator's solver certifies its own bugs.
//
// TRIPLES[t] for t in 0..35: t = side * 9 + k, side 0 top (columns, rows 0-2
// downward), 1 bottom (columns, rows 8-6 upward), 2 left (rows, cols 0-2), 3
// right (rows, cols 8-6). The cell order inside a triple is edge-inward, which
// matters to nothing here (a sum and a set are both order-free) but keeps the
// bank readable.

export const bx = (i) => Math.floor(Math.floor(i / 9) / 3) * 3 + Math.floor((i % 9) / 3);

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

export const TRIPLES = (() => {
  const out = [];
  for (let c = 0; c < 9; c++) out.push([c, 9 + c, 18 + c]);                 // top
  for (let c = 0; c < 9; c++) out.push([72 + c, 63 + c, 54 + c]);          // bottom
  for (let r = 0; r < 9; r++) out.push([r * 9, r * 9 + 1, r * 9 + 2]);     // left
  for (let r = 0; r < 9; r++) out.push([r * 9 + 8, r * 9 + 7, r * 9 + 6]); // right
  return out;
})();
export const SIDE_NAMES = ['top', 'bottom', 'left', 'right'];

export const HOUSES = (() => {
  const h = [];
  for (let r = 0; r < 9; r++) h.push(Array.from({ length: 9 }, (_, k) => r * 9 + k));
  for (let c = 0; c < 9; c++) h.push(Array.from({ length: 9 }, (_, k) => k * 9 + c));
  for (let b = 0; b < 9; b++) {
    const br = Math.floor(b / 3) * 3, bc = (b % 3) * 3, box = [];
    for (let a = 0; a < 3; a++) for (let d = 0; d < 3; d++) box.push((br + a) * 9 + bc + d);
    h.push(box);
  }
  return h;
})();
const PEERS = Array.from({ length: 81 }, (_, i) => {
  const r = Math.floor(i / 9), c = i % 9, b = bx(i), s = new Set();
  for (let k = 0; k < 9; k++) { s.add(r * 9 + k); s.add(k * 9 + c); }
  const br = Math.floor(b / 3) * 3, bc = (b % 3) * 3;
  for (let a = 0; a < 3; a++) for (let d = 0; d < 3; d++) s.add((br + a) * 9 + bc + d);
  s.delete(i);
  return [...s];
});
const popcount = (m) => { let n = 0; while (m) { m &= m - 1; n++; } return n; };

export function fullSolution(rnd) {
  const g = new Array(81).fill(0);
  const ok = (i, v) => {
    const r = Math.floor(i / 9), c = i % 9, b = bx(i);
    for (let k = 0; k < 9; k++) if (g[r * 9 + k] === v || g[k * 9 + c] === v) return false;
    const br = Math.floor(b / 3) * 3, bc = (b % 3) * 3;
    for (let a = 0; a < 3; a++) for (let d = 0; d < 3; d++) if (g[(br + a) * 9 + bc + d] === v) return false;
    return true;
  };
  const go = (i) => {
    if (i === 81) return true;
    for (const v of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rnd)) {
      if (!ok(i, v)) continue;
      g[i] = v;
      if (go(i + 1)) return true;
      g[i] = 0;
    }
    return false;
  };
  go(0);
  return g;
}

// The clue a triple carries, from a solution: a sum for Frame, a 9-bit set
// mask for Rim (bit d set = digit d is one of the three).
export const sumOf = (t, sol) => TRIPLES[t].reduce((s, i) => s + sol[i], 0);
export const setOf = (t, sol) => TRIPLES[t].reduce((m, i) => m | (1 << sol[i]), 0);

// ── the gutter deduction ─────────────────────────────────────────────────────
// For a triple carrying a clue, enumerate every ordered assignment of three
// DISTINCT digits to its three cells that each cell's candidates allow and that
// satisfies the clue (the sum, or exactly this set). A cell keeps only the
// digits some surviving assignment gives it. This is exactly what a person does
// with a gutter clue: "these three add to 20 and this one can only be 3 or 4".
// `clue` is { sum } or { set }.
export function triplePrune(t, cand, clue) {
  const [a, b, c] = TRIPLES[t];
  const allow = [0, 0, 0];
  let any = false;
  for (let x = 1; x <= 9; x++) {
    if (!(cand[a] & (1 << x))) continue;
    for (let y = 1; y <= 9; y++) {
      if (y === x || !(cand[b] & (1 << y))) continue;
      for (let z = 1; z <= 9; z++) {
        if (z === x || z === y || !(cand[c] & (1 << z))) continue;
        if (clue.sum != null && x + y + z !== clue.sum) continue;
        if (clue.set != null && ((1 << x) | (1 << y) | (1 << z)) !== clue.set) continue;
        any = true;
        allow[0] |= 1 << x; allow[1] |= 1 << y; allow[2] |= 1 << z;
      }
    }
  }
  return any ? allow : null;
}

function applyClues(cand, clues) {
  let moved = false;
  for (let t = 0; t < 36; t++) {
    if (!clues[t]) continue;
    const allow = triplePrune(t, cand, clues[t]);
    if (!allow) return null;
    for (let k = 0; k < 3; k++) {
      const i = TRIPLES[t][k];
      const nc = cand[i] & allow[k];
      if (nc !== cand[i]) { cand[i] = nc; moved = true; if (!nc) return null; }
    }
  }
  return moved;
}

// ── exhaustive solver: propagate, then branch on the tightest cell ───────────
// `clues` is an array of 36 entries, each null or { sum } / { set }.
export function countSolutions(given, clues, cap = 2) {
  const start = new Array(81).fill(0x3FE);
  for (let i = 0; i < 81; i++) if (given[i]) start[i] = 1 << given[i];
  let found = 0;
  const propagate = (cand) => {
    for (let pass = 0; pass < 300; pass++) {
      let moved = false;
      for (let i = 0; i < 81; i++) {
        const m = cand[i];
        if (!m) return null;
        if (m & (m - 1)) continue;
        for (const p of PEERS[i]) if (cand[p] & m) { cand[p] &= ~m; moved = true; if (!cand[p]) return null; }
      }
      for (const h of HOUSES) for (let v = 1; v <= 9; v++) {
        const bit = 1 << v;
        let n = 0, at = -1;
        for (const c of h) if (cand[c] & bit) { n++; at = c; }
        if (!n) return null;
        if (n === 1 && cand[at] !== bit) { cand[at] = bit; moved = true; }
      }
      const r = applyClues(cand, clues);
      if (r === null) return null;
      if (r) moved = true;
      if (!moved) return cand;
    }
    return cand;
  };
  const search = (cand) => {
    if (found >= cap) return;
    const c = propagate(cand.slice());
    if (!c) return;
    let pick = -1, best = 10;
    for (let i = 0; i < 81; i++) { const n = popcount(c[i]); if (n > 1 && n < best) { best = n; pick = i; } }
    if (pick < 0) { found++; return; }
    for (let v = 1; v <= 9; v++) {
      if (!(c[pick] & (1 << v))) continue;
      const next = c.slice(); next[pick] = 1 << v;
      search(next);
      if (found >= cap) return;
    }
  };
  search(start);
  return found;
}

// ── the no-guessing proof ────────────────────────────────────────────────────
//   level 1  the gutter deduction, plus naked and hidden singles
//   level 2  adds locked candidates and naked and hidden pairs and triples
export function logicSolve(given, clues, level) {
  const cand = new Array(81).fill(0x3FE);
  for (let i = 0; i < 81; i++) if (given[i]) cand[i] = 1 << given[i];
  const solved = (i) => cand[i] !== 0 && !(cand[i] & (cand[i] - 1));
  for (let pass = 0; pass < 600; pass++) {
    let moved = false;
    const r = applyClues(cand, clues);
    if (r === null) return null;
    if (r) moved = true;
    if (level >= 2) {
      for (const src of HOUSES) for (let v = 1; v <= 9; v++) {
        const bit = 1 << v;
        if (src.some((c) => solved(c) && cand[c] === bit)) continue;
        const spots = src.filter((c) => cand[c] & bit);
        if (spots.length < 2 || spots.length > 3) continue;
        for (const h of HOUSES) {
          if (h === src || !spots.every((c) => h.includes(c))) continue;
          for (const c of h) if (!spots.includes(c) && (cand[c] & bit)) { cand[c] &= ~bit; moved = true; }
        }
      }
      for (const h of HOUSES) {
        const open = h.filter((c) => !solved(c));
        for (let a = 0; a < open.length; a++) for (let b = a + 1; b < open.length; b++) {
          const m2 = cand[open[a]] | cand[open[b]];
          if (popcount(m2) === 2) for (const c of open) if (c !== open[a] && c !== open[b] && (cand[c] & m2)) { cand[c] &= ~m2; moved = true; }
          for (let d = b + 1; d < open.length; d++) {
            const m3 = m2 | cand[open[d]];
            if (popcount(m3) !== 3) continue;
            for (const c of open) if (c !== open[a] && c !== open[b] && c !== open[d] && (cand[c] & m3)) { cand[c] &= ~m3; moved = true; }
          }
        }
        for (let v1 = 1; v1 <= 9; v1++) for (let v2 = v1 + 1; v2 <= 9; v2++) {
          const b1 = 1 << v1, b2 = 1 << v2;
          if (h.some((c) => solved(c) && (cand[c] === b1 || cand[c] === b2))) continue;
          const s1 = open.filter((c) => cand[c] & b1);
          const s2 = open.filter((c) => cand[c] & b2);
          if (s1.length !== 2 || s2.length !== 2 || s1[0] !== s2[0] || s1[1] !== s2[1]) continue;
          for (const c of s1) if (cand[c] !== (cand[c] & (b1 | b2))) { cand[c] &= b1 | b2; moved = true; }
        }
      }
    }
    for (let i = 0; i < 81; i++) {
      const m = cand[i];
      if (!m) return null;
      if (m & (m - 1)) continue;
      for (const p of PEERS[i]) if (cand[p] & m) { cand[p] &= ~m; moved = true; if (!cand[p]) return null; }
    }
    for (const h of HOUSES) for (let v = 1; v <= 9; v++) {
      const bit = 1 << v;
      let n = 0, at = -1;
      for (const c of h) if (cand[c] & bit) { n++; at = c; }
      if (!n) return null;
      if (n === 1 && cand[at] !== bit) { cand[at] = bit; moved = true; }
    }
    // NOT `cand.every(solved)`: every() passes the VALUE first (see sando-core).
    if (cand.every((m) => m !== 0 && !(m & (m - 1)))) return cand.map((m) => 31 - Math.clz32(m));
    if (!moved) return null;
  }
  return null;
}
