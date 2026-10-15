#!/usr/bin/env node
// Bank generator for Window, the daily windoku.
//
//   node scripts/gen-window.mjs --until 2027-01-31 [--from 2026-10-13] [--seed 20261013] [--fresh]
//
// A FORK OF scripts/gen-diag.mjs (the Diag generator), with one change of
// geometry: the two long diagonals are replaced by FOUR WINDOWS, the 3x3 blocks
// at rows 2-4 / 6-8 and columns 2-4 / 6-8 (1-based). Each window holds 1 to 9
// once, like a box, so the board has 31 houses, not 27. Everything else is the
// Diag machinery and its rules, unchanged:
//
// It APPENDS to app/window/puzzles.js and never rewrites a board already in the
// file (the existing text is spliced in front of the new blocks byte for byte).
// The RNG is seeded per board as seed + num * 7919.
//
// Every board it emits has been proved, by solvers written here and not shared
// with scripts/verify-window.mjs, to
//   * have EXACTLY ONE solution under the window rule (exhaustive count),
//   * fall to LOGIC WITH NO GUESSING at exactly the level its weekday pins, and
//   * satisfy WINDOW NECESSITY: with the four windows switched off the same
//     clues admit more than one grid, so the rule is never decoration.
//
// A WINDOW IS A HOUSE. Hidden singles, locked candidates and subsets read off a
// window exactly as off a box. The windows cover 36 of the 81 squares (the
// diagonals only 17), so the rule bites harder than Diag's and the clue counts
// can sit lower.
//
// THE WEEKDAY RAMP, both knobs PINNED rather than capped (see PRINTED_BY_DOW and
// LEVEL_BY_DOW below; level 1 = naked and hidden singles only, level 2 = also
// locked candidates and naked/hidden subsets). A board that comes out too easy
// for its slot is REJECTED, not stored with a smaller level.
//
// HOW A BOARD IS BUILT, and the POOL VARIETY CEILINGS V1-V10: exactly as in
// gen-diag.mjs. V8 compares solutions up to relabelling and the eight
// symmetries of the square, all of which carry the four windows onto
// themselves. When the search runs out, GROW THE POOL rather than raise a
// ceiling.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const has = (k) => process.argv.includes(k);

const BANK = process.env.WINDOW_BANK || path.join(process.cwd(), 'app/window/puzzles.js');
const UNTIL = arg('--until', '2027-01-31');
const SEED = Number(arg('--seed', 20261013));
const FROM = arg('--from', null);
const CACHE_DIR = process.env.WINDOW_CACHE_DIR || '/tmp/build';
const CACHE = path.join(CACHE_DIR, 'window-bank.jsonl');
const MAX_ATTEMPTS = Number(arg('--attempts', 250000));

const PRINTED_BY_DOW = { 0: 13, 1: 22, 2: 20, 3: 18, 4: 16, 5: 15, 6: 14 };
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

// The four windows: rows 1-3 or 5-7 crossed with columns 1-3 or 5-7
// (0-based). All four are HOUSES. -1 for a square in no window.
const bandOf = (k) => (k >= 1 && k <= 3 ? 0 : k >= 5 && k <= 7 ? 1 : -1);
const winOf = (i) => { const a = bandOf(rowOf(i)), b = bandOf(colOf(i)); return a < 0 || b < 0 ? -1 : a * 2 + b; };
// HOUSE: the cells sharing a row, column or box — an ordinary sudoku's peers.
// Kept separately so window necessity can be measured with the rule off.
const HOUSE = Array.from({ length: 81 }, (_, i) => {
  const out = [];
  for (let j = 0; j < 81; j++) if (j !== i && (rowOf(j) === rowOf(i) || colOf(j) === colOf(i) || boxOf(j) === boxOf(i))) out.push(j);
  return out;
});
// WIN: the cells sharing a window with i (none outside the windows, eight
// inside one).
const WIN = Array.from({ length: 81 }, (_, i) => {
  const out = [];
  for (let j = 0; j < 81; j++) if (j !== i && winOf(i) >= 0 && winOf(i) === winOf(j)) out.push(j);
  return out;
});
const SEE = Array.from({ length: 81 }, (_, i) => [...new Set(HOUSE[i].concat(WIN[i]))]);
// 31 houses: 9 rows, 9 columns, 9 boxes, and the four windows.
const UNITS = (() => {
  const u = [];
  for (let r = 0; r < 9; r++) u.push(Array.from({ length: 9 }, (_, c) => r * 9 + c));
  for (let c = 0; c < 9; c++) u.push(Array.from({ length: 9 }, (_, r) => r * 9 + c));
  for (let br = 0; br < 3; br++) for (let bc = 0; bc < 3; bc++) {
    const b = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) b.push((br * 3 + r) * 9 + bc * 3 + c);
    u.push(b);
  }
  for (const r0 of [1, 5]) for (const c0 of [1, 5]) {
    const w = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) w.push((r0 + r) * 9 + c0 + c);
    u.push(w);
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

// ---- a random full diagonal grid -----------------------------------------
// MRV backtracking with forward checking over SEE, so the diagonals are
// enforced while the grid is built rather than filtered for afterwards. The
// search carries a node cap and simply restarts on a dead end.
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
// Branches on the cell with the fewest candidates. `diag` off drops the two
// diagonals and leaves an ordinary sudoku, which is how diagonal necessity is
// measured: the same clues must then admit at least two grids.
function countSolutions(given, cap, diag) {
  const see = diag ? SEE : HOUSE;
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
// Placements eliminate over SEE and every PATTERN below reads UNITS, which
// here INCLUDES the two diagonals: a diagonal is a house.
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
// solvable at `level` after every removal: a greedy pass first, then the
// iterated local search described in the header. Returns null when the
// iteration budget runs out above `printed`.
const ILS_ITERATIONS = 3000;
function digBoard(sol, printed, level, rnd) {
  const key = sol.join(',');
  const ok = (given) => { const r = logicSolve(given, level); return r.solved && r.grid.join(',') === key; };
  const greedy = (given) => {
    let count = given.filter(Boolean).length;
    for (const i of shuffle([...Array(81).keys()], rnd)) {
      if (count <= printed) break;
      if (!given[i]) continue;
      const v = given[i];
      given[i] = 0;
      if (ok(given)) count--; else given[i] = v;
    }
    return count;
  };
  let best = sol.slice();
  let bc = greedy(best);
  for (let it = 0; it < ILS_ITERATIONS && bc > printed; it++) {
    const cand = best.slice();
    const empties = shuffle([...Array(81).keys()].filter((i) => !cand[i]), rnd);
    const back = 2 + Math.floor(rnd() * 4);
    for (let a = 0; a < back && a < empties.length; a++) cand[empties[a]] = sol[empties[a]];
    const c = greedy(cand);
    if (c <= bc) { best = cand; bc = c; }
  }
  return bc === printed ? best : null;
}

// ---- variety bookkeeping over the whole bank ------------------------------
const DIHEDRAL = [
  (r, c) => [r, c], (r, c) => [c, 8 - r], (r, c) => [8 - r, 8 - c], (r, c) => [8 - c, r],
  (r, c) => [r, 8 - c], (r, c) => [8 - r, c], (r, c) => [c, r], (r, c) => [8 - c, 8 - r],
];
// Canonical form of a solution under the group the diagonal pair survives:
// the eight symmetries of the square, times a relabelling of the digits.
// Band and stack swaps are NOT in it — they preserve sudoku but break the X.
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
const quizIdOf = (iso) => { const d = asDate(iso); return `window-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`; };

// ---- the run -------------------------------------------------------------
let text = '', PUZZLES = [];
if (fs.existsSync(BANK)) {
  text = fs.readFileSync(BANK, 'utf8');
  if (!text.endsWith('];\n')) { console.error('gen-window: the bank does not end in "];\\n"; refusing to splice.'); process.exit(1); }
  ({ PUZZLES } = await import(pathToFileURL(BANK).href + `?t=${Date.now()}`));
} else if (!FROM) {
  console.error(`gen-window: ${BANK} is missing and no --from was given. Appending to a live bank keeps the frozen boards' exact bytes; authoring one from nothing needs an explicit launch date.`);
  process.exit(1);
}

const pool = new Pool();
for (const p of PUZZLES) pool.add(p.given.flat(), p.sol.flat());
const firstNew = PUZZLES.length ? addDays(PUZZLES[PUZZLES.length - 1].live, 1) : FROM;
const days = Math.round((asDate(UNTIL) - asDate(firstNew)) / 86400000) + 1;
if (days <= 0) {
  console.error(`gen-window: the bank already reaches ${UNTIL}. Nothing to do.`);
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
    if (countSolutions(dug, 2, true) !== 1) { note('not unique under the window rule'); continue; }
    if (countSolutions(dug, 2, false) < 2) { note('window rule was decoration'); continue; }
    const bad = pool.reject(dug, grid);
    if (bad) { note(bad); continue; }
    given = dug; sol = grid;
    process.stderr.write(`#${num} ${live} ${printed} clues level ${level} (attempt ${att})\n`);
    break;
  }
  if (!given) {
    const ranked = [...why.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([r, n]) => `${r} x${n}`).join(', ');
    console.error(`gen-window: no board for #${num} ${live} (${printed} clues, level ${level}) in ${MAX_ATTEMPTS} attempts.`);
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

const HEADER = `// Puzzle data for Window, the daily windoku. Imported ONLY by the server page
// (app/window/page.js), which filters live<=today before handing puzzles to
// the client, so future boards and their solutions never reach a browser.
//
// A board is an ordinary 9x9 sudoku with ONE extra rule: four shaded WINDOWS,
// the 3x3 blocks at rows 2-4 / 6-8 and columns 2-4 / 6-8, each also hold every
// digit exactly once. \`given\` holds the printed clues (0 = a square the player
// fills) and \`sol\` the solution. There is no extra geometry to store: the
// windows are the same on every board.
//
// A WINDOW IS A HOUSE, so there are 31 houses on this board, not 27.
//
// TWO MEASURED FIELDS, both recomputed by scripts/verify-window.mjs rather
// than trusted: \`printed\` (digits on the board, pinned per weekday) and
// \`level\` (1 naked and hidden singles, 2 also locked candidates and
// naked/hidden subsets, pinned per weekday).
//
// EVERY board has EXACTLY ONE solution, reachable by logic with no guessing,
// and satisfies WINDOW NECESSITY: with the windows switched off the same clues
// admit more than one grid. All of it is re-proved by the independent solvers
// in scripts/verify-window.mjs, which shares no code with the generator.

export const PUZZLES = [
`;
// Splice: everything the file already had, byte for byte, then the new blocks.
fs.mkdirSync(path.dirname(BANK), { recursive: true });
fs.writeFileSync(BANK, (text ? text.slice(0, text.length - 3) : HEADER) + body + '\n];\n');
console.error(`\nwrote ${BANK}: ${PUZZLES.length} frozen + ${boards.length} new = ${PUZZLES.length + boards.length} boards, last live ${boards[boards.length - 1].live}, in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
