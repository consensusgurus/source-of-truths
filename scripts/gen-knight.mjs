#!/usr/bin/env node
// Bank generator for Knight, the daily anti-knight sudoku.
//
//   node scripts/gen-knight.mjs --until 2026-11-30 [--seed 20261009] [--fresh]
//
// It APPENDS to app/knight/puzzles.js and never rewrites a board that is
// already in the file: the existing text is spliced in front of the new blocks
// byte for byte, so the frozen past cannot drift even by a space (see the daily
// puzzle authoring standard in CLAUDE.md). It starts at the day after the
// bank's current last date and stops on --until, so a second run over a bank
// that already reaches that date is a no-op rather than a second helping.
//
// The RNG is seeded per board as seed + num * 7919, so the seed is OFFSET by
// the board number and the new segment cannot replay the frozen one; an
// unchanged run reproduces the same bytes.
//
// Every board it emits has been proved from scratch, by solvers written here
// and not shared with scripts/verify-knight.mjs, to
//   * have EXACTLY ONE solution under the knight rule, counted by an
//     exhaustive solver,
//   * fall to LOGIC WITH NO GUESSING at exactly the level its weekday pins, and
//   * satisfy KNIGHT NECESSITY: with the knight rule switched off the same
//     clues admit more than one grid, so the rule is never decoration.
// verify-knight.mjs re-proves all of it with its own independent solvers and
// trusts none of the stored fields. Keep the two implementations apart: the
// only thing they may share is the rulebook below.
//
// ⚠️ A KNIGHT SET IS NOT A HOUSE. The eight cells a knight's move away do not
// see each other, so they carry no "these cells hold every digit" guarantee.
// The knight relation feeds ELIMINATIONS ONLY — it is in SEE, used when a
// placement strikes a digit off its neighbours, and it is NOT in UNITS. Hidden
// singles, locked candidates and subsets are read off rows, columns and boxes
// and nothing else. A generator that treats the knight set as a house grades
// boards easier than they are and ships puzzles no player can finish.
//
// THE WEEKDAY RAMP, both knobs PINNED rather than capped:
//
//   day  clues  level
//   Mon   28      1     naked and hidden singles, and nothing harder
//   Tue   25      1
//   Wed   22      1
//   Thu   20      1
//   Fri   18      2     also locked candidates and naked/hidden subsets
//   Sat   16      2
//   Sun   13      2     <- Sunday Edition, the fewest clues of the week
//
// Level is pinned because a ceiling is not a pin: dig an 18-clue board at
// random and roughly a third of them still fall to singles alone, which is a
// Tuesday wearing Friday's clue count. A board that comes out too easy for its
// slot is REJECTED here, not stored with a smaller `level`.
//
// HOW A BOARD IS BUILT. Fill a random anti-knight grid (MRV backtracking over
// houses + knight), then dig clues out of it in a random order, keeping a
// removal only while the board still falls to logic AT THE DAY'S LEVEL. That
// invariant is what makes the ramp exact: a Monday dug under the singles-only
// solver is singles-only by construction at whatever depth it stops, and a
// Friday dug under the full toolkit is then re-tested against the singles-only
// solver and thrown away if it never needed the harder move. Digging stops at
// the day's clue count exactly; a dig that stalls above it is a reject.
//
// POOL VARIETY CEILINGS, counted over the WHOLE bank (frozen boards included),
// not per board. Per-board legality passes happily on a bank that prints the
// same shape every day, which is how Rung, Listed and Crux all degraded.
// Measured on the 42 frozen boards, every one of these was already clean, so
// the ceilings are the shipped bank's own standard rather than a relaxation:
//
//   V1  the 81-cell clue MASK never repeats                     (frozen: 0 repeats)
//   V2  the solution grid never repeats                         (frozen: 0)
//   V3  the per-row clue-count signature never repeats          (frozen: 42 distinct)
//   V4  the per-box clue-count signature never repeats          (frozen: 42 distinct)
//   V5  the clue digit histogram never repeats                  (frozen: 42 distinct)
//   V6  no two boards share more than 16 clue POSITIONS         (frozen max: 14)
//   V7  no two solutions agree in more than 28 of 81 cells      (frozen max: 21)
//   V8  no two solutions are the same grid up to relabelling and
//       the eight symmetries of the square, which is the group the
//       knight rule actually survives (band swaps do not)        (frozen: 42 distinct)
//   V9  at most 2 boards in the bank carry a clue pattern with
//       180-degree or mirror symmetry                            (frozen: 0)
//   V10 per board: no digit is printed more than 6 times, and no
//       row or column carries more than 6 clues                  (frozen max: 6, 6)
//
// V1 and V2 are also enforced by the verifier; V3-V10 are this generator's own
// ceilings, because the verifier caps nothing else and 95 boards should not all
// wear the same clue pattern. When the search runs out, GROW THE POOL (more
// grids, a different dig order) — do not raise a ceiling.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const has = (k) => process.argv.includes(k);

const BANK = process.env.KNIGHT_BANK || path.join(process.cwd(), 'app/knight/puzzles.js');
const UNTIL = arg('--until', '2026-11-30');
const SEED = Number(arg('--seed', 20261009));
const CACHE_DIR = '/tmp/build';
const CACHE = path.join(CACHE_DIR, 'knight-bank.jsonl');
const MAX_ATTEMPTS = Number(arg('--attempts', 250000));

const PRINTED_BY_DOW = { 0: 13, 1: 28, 2: 25, 3: 22, 4: 20, 5: 18, 6: 16 };
const LEVEL_BY_DOW = { 0: 2, 1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 2 };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ---- variety ceilings (see the header) -----------------------------------
const MAX_CLUE_OVERLAP = 16;
const MAX_SOL_AGREEMENT = 28;
const MAX_SYMMETRIC_PATTERNS = 2;
const MAX_DIGIT_REPEAT = 6;
const MAX_LINE_CLUES = 6;

// ---- seeded RNG ----------------------------------------------------------
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const shuffle = (arr, rnd) => {
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
};

// ---- geometry ------------------------------------------------------------
const rowOf = (i) => Math.floor(i / 9);
const colOf = (i) => i % 9;
const boxOf = (i) => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);

// HOUSE: the cells sharing a row, column or box. The only houses there are.
const HOUSE = Array.from({ length: 81 }, (_, i) => {
  const out = [];
  for (let j = 0; j < 81; j++) if (j !== i && (rowOf(j) === rowOf(i) || colOf(j) === colOf(i) || boxOf(j) === boxOf(i))) out.push(j);
  return out;
});
// KNIGHT: the up-to-eight cells an L away. NOT a house — eliminations only.
const KNIGHT = Array.from({ length: 81 }, (_, i) => {
  const out = [];
  for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
    const r = rowOf(i) + dr, c = colOf(i) + dc;
    if (r >= 0 && r < 9 && c >= 0 && c < 9) out.push(r * 9 + c);
  }
  return out;
});
const SEE = Array.from({ length: 81 }, (_, i) => [...new Set(HOUSE[i].concat(KNIGHT[i]))]);
const UNITS = (() => {
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
const UNITS_OF = (() => {
  const m = Array.from({ length: 81 }, () => []);
  UNITS.forEach((u, k) => u.forEach((i) => m[i].push(k)));
  return m;
})();

// ---- candidates as 9-bit masks (bit d set = digit d still possible) ------
const ALL = 0x3fe;
const POP = new Int8Array(1024);
for (let m = 0; m < 1024; m++) { let n = 0; for (let d = 1; d <= 9; d++) if (m & (1 << d)) n++; POP[m] = n; }
const LOW = new Int8Array(1024);
for (let m = 1; m < 1024; m++) { let d = 0; while (!(m & (1 << d))) d++; LOW[m] = d; }

// ---- a random full anti-knight grid --------------------------------------
// MRV backtracking with forward checking over SEE, so the knight rule is
// enforced while the grid is built rather than filtered for afterwards.
// Anti-knight grids are far rarer than plain ones, which is why the search
// carries a node cap and simply restarts on a dead end.
function fullGrid(rnd, nodeCap = 200000) {
  const g = new Int8Array(81);
  const cand = new Int32Array(81).fill(ALL);
  let nodes = 0;
  const go = () => {
    if (++nodes > nodeCap) throw new Error('node cap');
    let best = -1, bn = 10;
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      const n = POP[cand[i]];
      if (n < bn) { bn = n; best = i; if (n <= 1) break; }
    }
    if (best < 0) return true;
    if (bn === 0) return false;
    const opts = [];
    for (let d = 1; d <= 9; d++) if (cand[best] & (1 << d)) opts.push(d);
    shuffle(opts, rnd);
    for (const d of opts) {
      g[best] = d;
      const undo = [];
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

// ---- exhaustive solution counter -----------------------------------------
// Branches on the cell with the fewest candidates. `knight` off drops the L
// relation and leaves an ordinary sudoku, which is how knight necessity is
// measured: the same clues must then admit at least two grids.
function countSolutions(given, cap, knight) {
  const see = knight ? SEE : HOUSE;
  const g = Int8Array.from(given);
  const cand = new Int32Array(81).fill(ALL);
  for (let i = 0; i < 81; i++) if (g[i]) {
    for (const j of see[i]) { if (g[j] === g[i]) return 0; cand[j] &= ~(1 << g[i]); }
    cand[i] = 1 << g[i];
  }
  for (let i = 0; i < 81; i++) if (!g[i] && cand[i] === 0) return 0;
  let found = 0;
  (function go() {
    if (found >= cap) return;
    let best = -1, bn = 10;
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      const n = POP[cand[i]];
      if (n < bn) { bn = n; best = i; if (n <= 1) break; }
    }
    if (best < 0) { found++; return; }
    if (bn === 0) return;
    for (let d = 1; d <= 9; d++) {
      if (!(cand[best] & (1 << d))) continue;
      g[best] = d;
      const undo = [];
      let dead = false;
      for (const j of see[best]) if (!g[j] && (cand[j] & (1 << d))) { cand[j] &= ~(1 << d); undo.push(j); if (cand[j] === 0) dead = true; }
      if (!dead) go();
      for (const j of undo) cand[j] |= (1 << d);
      g[best] = 0;
      if (found >= cap) return;
    }
  })();
  return found;
}

// ---- the graded logical solver -------------------------------------------
// maxLevel 1: naked singles and hidden singles, and nothing else.
// maxLevel 2: also locked candidates, naked pairs and triples, hidden pairs.
// Placements eliminate over SEE (houses AND knight); every PATTERN below reads
// only UNITS, because a knight set is not a house.
function logicSolve(given, maxLevel) {
  const solved = Int8Array.from(given);
  const cand = new Int32Array(81).fill(ALL);
  const place = (i, d) => {
    solved[i] = d;
    cand[i] = 1 << d;
    for (const j of SEE[i]) if (!solved[j]) cand[j] &= ~(1 << d);
  };
  for (let i = 0; i < 81; i++) if (given[i]) place(i, given[i]);
  for (let i = 0; i < 81; i++) if (cand[i] === 0) return { solved: false, grid: null };

  const singles = () => {
    let moved = false;
    for (let i = 0; i < 81; i++) if (!solved[i] && POP[cand[i]] === 1) { place(i, LOW[cand[i]]); moved = true; }
    if (moved) return true;
    for (const u of UNITS) for (let d = 1; d <= 9; d++) {
      const bit = 1 << d;
      let done = false;
      for (const i of u) if (solved[i] === d) { done = true; break; }
      if (done) continue;
      let spot = -1, n = 0;
      for (const i of u) if (!solved[i] && (cand[i] & bit)) { n++; spot = i; if (n > 1) break; }
      if (n === 1) { place(spot, d); moved = true; }
    }
    return moved;
  };
  const lockedCandidates = () => {
    let moved = false;
    for (let k = 0; k < UNITS.length; k++) {
      const u = UNITS[k];
      for (let d = 1; d <= 9; d++) {
        const bit = 1 << d;
        let done = false;
        for (const i of u) if (solved[i] === d) { done = true; break; }
        if (done) continue;
        const spots = [];
        for (const i of u) if (!solved[i] && (cand[i] & bit)) spots.push(i);
        if (spots.length < 2 || spots.length > 3) continue;
        for (const k2 of UNITS_OF[spots[0]]) {
          if (k2 === k) continue;
          if (!spots.every((i) => UNITS_OF[i].includes(k2))) continue;
          for (const j of UNITS[k2]) {
            if (solved[j] || spots.includes(j) || !(cand[j] & bit)) continue;
            cand[j] &= ~bit;
            moved = true;
          }
        }
      }
    }
    return moved;
  };
  const subsets = () => {
    let moved = false;
    const strip = (unit, group, mask) => {
      let did = false;
      for (const j of unit) {
        if (solved[j] || group.includes(j)) continue;
        if (cand[j] & mask) { cand[j] &= ~mask; did = true; }
      }
      return did;
    };
    for (const u of UNITS) {
      const open = u.filter((i) => !solved[i]);
      for (let a = 0; a < open.length; a++) for (let b = a + 1; b < open.length; b++) {
        const two = cand[open[a]] | cand[open[b]];
        if (POP[two] === 2) moved = strip(u, [open[a], open[b]], two) || moved;
        for (let c = b + 1; c < open.length; c++) {
          const three = two | cand[open[c]];
          if (POP[three] === 3) moved = strip(u, [open[a], open[b], open[c]], three) || moved;
        }
      }
      for (let d1 = 1; d1 <= 9; d1++) for (let d2 = d1 + 1; d2 <= 9; d2++) {
        let done = false;
        for (const i of u) if (solved[i] === d1 || solved[i] === d2) { done = true; break; }
        if (done) continue;
        const s1 = open.filter((i) => cand[i] & (1 << d1));
        const s2 = open.filter((i) => cand[i] & (1 << d2));
        if (s1.length !== 2 || s2.length !== 2) continue;
        if (s1[0] !== s2[0] || s1[1] !== s2[1]) continue;
        const keep = (1 << d1) | (1 << d2);
        for (const i of s1) if (cand[i] & ~keep) { cand[i] &= keep; moved = true; }
      }
    }
    return moved;
  };

  for (;;) {
    if (singles()) continue;
    if (maxLevel >= 2 && (lockedCandidates() || subsets())) continue;
    break;
  }
  let done = true;
  for (let i = 0; i < 81; i++) if (!solved[i]) { done = false; break; }
  return { solved: done, grid: Array.from(solved) };
}

// ---- one board -----------------------------------------------------------
// Dig from a full grid down to exactly `printed` clues, keeping the board
// solvable at `level` after every removal. Returns null on a dig that stalls.
function digBoard(sol, printed, level, rnd) {
  const given = sol.slice();
  const key = sol.join(',');
  let count = 81;
  for (const i of shuffle([...Array(81).keys()], rnd)) {
    if (count <= printed) break;
    const v = given[i];
    given[i] = 0;
    const r = logicSolve(given, level);
    if (r.solved && r.grid.join(',') === key) count--;
    else given[i] = v;
  }
  return count === printed ? given : null;
}

// ---- variety bookkeeping over the whole bank ------------------------------
const DIHEDRAL = [
  (r, c) => [r, c], (r, c) => [c, 8 - r], (r, c) => [8 - r, 8 - c], (r, c) => [8 - c, r],
  (r, c) => [r, 8 - c], (r, c) => [8 - r, c], (r, c) => [c, r], (r, c) => [8 - c, 8 - r],
];
// Canonical form of a solution under the group the knight rule survives:
// the eight symmetries of the square, times a relabelling of the digits.
// Band and stack swaps are NOT in it — they preserve sudoku but break knight.
function canonicalSolution(sol) {
  let best = null;
  for (const t of DIHEDRAL) {
    const g = new Array(81);
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) { const [nr, nc] = t(r, c); g[nr * 9 + nc] = sol[r * 9 + c]; }
    const map = new Map();
    let s = '';
    for (const v of g) { if (!map.has(v)) map.set(v, map.size + 1); s += map.get(v); }
    if (best === null || s < best) best = s;
  }
  return best;
}
const isSymmetric = (given) => {
  let rot = true, mh = true, mv = true;
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    const a = !!given[r * 9 + c];
    if (a !== !!given[(8 - r) * 9 + (8 - c)]) rot = false;
    if (a !== !!given[r * 9 + (8 - c)]) mh = false;
    if (a !== !!given[(8 - r) * 9 + c]) mv = false;
  }
  return rot || mh || mv;
};
const rowSig = (given) => { const o = []; for (let r = 0; r < 9; r++) { let n = 0; for (let c = 0; c < 9; c++) if (given[r * 9 + c]) n++; o.push(n); } return o.join(','); };
const boxSig = (given) => { const o = new Array(9).fill(0); for (let i = 0; i < 81; i++) if (given[i]) o[boxOf(i)]++; return o.join(','); };
const digSig = (given) => { const o = new Array(10).fill(0); for (const v of given) if (v) o[v]++; return o.slice(1).join(','); };

class Pool {
  constructor() { this.masks = []; this.sols = []; this.set = { mask: new Set(), sol: new Set(), row: new Set(), box: new Set(), dig: new Set(), canon: new Set() }; this.symmetric = 0; }
  add(given, sol) {
    this.masks.push(given.map((v) => (v ? 1 : 0)));
    this.sols.push(sol);
    this.set.mask.add(given.map((v) => (v ? 1 : 0)).join(''));
    this.set.sol.add(sol.join(''));
    this.set.row.add(rowSig(given));
    this.set.box.add(boxSig(given));
    this.set.dig.add(digSig(given));
    this.set.canon.add(canonicalSolution(sol));
    if (isSymmetric(given)) this.symmetric++;
  }
  // Returns null when the board clears every ceiling, else the ceiling it hit.
  reject(given, sol) {
    for (let d = 1; d <= 9; d++) { let n = 0; for (const v of given) if (v === d) n++; if (n > MAX_DIGIT_REPEAT) return 'V10 digit repeat'; }
    for (let k = 0; k < 9; k++) {
      let nr = 0, nc = 0;
      for (let t = 0; t < 9; t++) { if (given[k * 9 + t]) nr++; if (given[t * 9 + k]) nc++; }
      if (nr > MAX_LINE_CLUES || nc > MAX_LINE_CLUES) return 'V10 line clues';
    }
    const mask = given.map((v) => (v ? 1 : 0));
    if (this.set.mask.has(mask.join(''))) return 'V1 clue mask';
    if (this.set.sol.has(sol.join(''))) return 'V2 solution grid';
    if (this.set.row.has(rowSig(given))) return 'V3 row signature';
    if (this.set.box.has(boxSig(given))) return 'V4 box signature';
    if (this.set.dig.has(digSig(given))) return 'V5 digit histogram';
    if (this.set.canon.has(canonicalSolution(sol))) return 'V8 solution up to symmetry';
    if (isSymmetric(given) && this.symmetric >= MAX_SYMMETRIC_PATTERNS) return 'V9 symmetric patterns';
    for (const m of this.masks) { let o = 0; for (let i = 0; i < 81; i++) if (m[i] && mask[i]) o++; if (o > MAX_CLUE_OVERLAP) return 'V6 clue overlap'; }
    for (const s of this.sols) { let o = 0; for (let i = 0; i < 81; i++) if (s[i] === sol[i]) o++; if (o > MAX_SOL_AGREEMENT) return 'V7 solution agreement'; }
    return null;
  }
}

// ---- dates ---------------------------------------------------------------
const asDate = (iso) => new Date(iso + 'T00:00:00Z');
const addDays = (iso, n) => { const d = asDate(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const dowOf = (iso) => asDate(iso).getUTCDay();
const labelOf = (iso) => { const d = asDate(iso); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`; };
const quizIdOf = (iso) => { const d = asDate(iso); return `knight-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`; };

// ---- the run -------------------------------------------------------------
if (!fs.existsSync(BANK)) {
  console.error(`gen-knight: ${BANK} is missing. This generator only ever APPENDS to a live bank, so that the frozen boards keep their exact bytes; it will not author a bank from nothing.`);
  process.exit(1);
}
const text = fs.readFileSync(BANK, 'utf8');
if (!text.endsWith('];\n')) { console.error('gen-knight: the bank does not end in "];\\n"; refusing to splice.'); process.exit(1); }
const { PUZZLES } = await import(pathToFileURL(BANK).href + `?t=${Date.now()}`);

const pool = new Pool();
for (const p of PUZZLES) pool.add(p.given.flat(), p.sol.flat());
const lastLive = PUZZLES[PUZZLES.length - 1].live;
const firstNew = addDays(lastLive, 1);
const days = Math.round((asDate(UNTIL) - asDate(firstNew)) / 86400000) + 1;
if (days <= 0) {
  console.error(`gen-knight: the bank already runs to ${lastLive}, which reaches ${UNTIL}. Nothing to do.`);
  process.exit(0);
}
const startNum = PUZZLES.length + 1;

// The cache is keyed by the whole run. A cache from a different run would
// silently bleed old boards into new output, so a key mismatch clears it.
const cacheKey = JSON.stringify({ start: firstNew, days, seed: SEED, startNum });
fs.mkdirSync(CACHE_DIR, { recursive: true });
let cached = [];
if (has('--fresh')) { try { fs.unlinkSync(CACHE); } catch (e) { /* nothing to clear */ } }
if (fs.existsSync(CACHE)) {
  const lines = fs.readFileSync(CACHE, 'utf8').split('\n').filter((l) => l.trim());
  if (lines.length && lines[0] === cacheKey) cached = lines.slice(1).map((l) => JSON.parse(l));
  else fs.unlinkSync(CACHE);
}
if (!fs.existsSync(CACHE)) fs.writeFileSync(CACHE, cacheKey + '\n');

const t0 = Date.now();
const boards = [];
for (let k = 0; k < days; k++) {
  const num = startNum + k;
  const live = addDays(firstNew, k);
  const dow = dowOf(live);
  const printed = PRINTED_BY_DOW[dow];
  const level = LEVEL_BY_DOW[dow];

  const hit = cached.find((c) => c.num === num);
  if (hit) { boards.push(hit); pool.add(hit.given.flat(), hit.sol.flat()); process.stderr.write(`#${num} ${live} cached\n`); continue; }

  const rnd = rng(SEED + num * 7919);
  const why = new Map();
  const note = (r) => why.set(r, (why.get(r) || 0) + 1);
  let given = null, sol = null;
  for (let att = 1; att <= MAX_ATTEMPTS; att++) {
    const grid = fullGrid(rnd);
    if (!grid) { note('grid search restarted'); continue; }
    const dug = digBoard(grid, printed, level, rnd);
    if (!dug) { note(`dig stalled above ${printed} clues`); continue; }
    // the level is PINNED: an easy day must not need the hard toolkit, and a
    // hard day must genuinely need it.
    const easy = logicSolve(dug, 1).solved;
    if (easy !== (level === 1)) { note(level === 1 ? 'needed more than singles' : 'fell to singles alone'); continue; }
    if (countSolutions(dug, 2, true) !== 1) { note('not unique under the knight rule'); continue; }
    if (countSolutions(dug, 2, false) < 2) { note('knight rule was decoration'); continue; }
    const bad = pool.reject(dug, grid);
    if (bad) { note(bad); continue; }
    given = dug; sol = grid;
    process.stderr.write(`#${num} ${live} ${printed} clues level ${level} (attempt ${att})\n`);
    break;
  }
  if (!given) {
    const ranked = [...why.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([r, n]) => `${r} x${n}`).join(', ');
    console.error(`gen-knight: no board for #${num} ${live} (${printed} clues, level ${level}) in ${MAX_ATTEMPTS} attempts.`);
    console.error(`  what the search kept hitting: ${ranked}`);
    console.error('  GROW THE POOL (more grids, a different seed) rather than loosening a ceiling.');
    process.exit(1);
  }
  pool.add(given, sol);
  const chunk9 = (a) => Array.from({ length: 9 }, (_, r) => a.slice(r * 9, r * 9 + 9));
  const rec = {
    num, quizId: quizIdOf(live), live, dateLabel: labelOf(live),
    sunday: dow === 0, printed, level,
    given: chunk9(given), sol: chunk9(sol),
  };
  boards.push(rec);
  fs.appendFileSync(CACHE, JSON.stringify(rec) + '\n');
}

const body = boards.map((b) => `  {
    num: ${b.num},
    quizId: '${b.quizId}',
    live: '${b.live}',
    dateLabel: '${b.dateLabel}',
    sunday: ${b.sunday},
    printed: ${b.printed},
    level: ${b.level},
    given: ${JSON.stringify(b.given)},
    sol: ${JSON.stringify(b.sol)},
  },`).join('\n');

// Splice: everything the file already had, byte for byte, then the new blocks.
fs.writeFileSync(BANK, text.slice(0, text.length - 3) + body + '\n];\n');
console.error(`\nwrote ${BANK}: ${PUZZLES.length} frozen + ${boards.length} new = ${PUZZLES.length + boards.length} boards, last live ${boards[boards.length - 1].live}, in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
