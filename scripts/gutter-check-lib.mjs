// The INDEPENDENT solvers behind scripts/verify-frame.mjs and verify-rim.mjs.
// This file must never import scripts/gutter-core.mjs (the generator's engine):
// Set-based candidates rather than bitmasks, a branch on the house-and-digit
// with the fewest placements rather than the emptiest cell, and a gutter
// deduction written from the rule again rather than copied, so the two cannot
// agree with each other about a bug. The logical solver is POLICED against the
// known solution: an elimination that loses the true digit, or a placement of
// a false one, throws rather than being trusted.
//
// A clue is { sum } (Frame) or { digits: '257' } (Rim); null means the gutter
// is blank there. Triples are addressed as side + index, side in
// ['top', 'bottom', 'left', 'right'].

export const SIDES = ['top', 'bottom', 'left', 'right'];
const idx = (r, c) => r * 9 + c;
const rowOf = (i) => Math.floor(i / 9);
const colOf = (i) => i % 9;
const boxOf = (i) => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);

// the three cells a gutter entry speaks about, edge inward, by coordinates
export function cellsOf(side, k) {
  if (side === 'top') return [idx(0, k), idx(1, k), idx(2, k)];
  if (side === 'bottom') return [idx(8, k), idx(7, k), idx(6, k)];
  if (side === 'left') return [idx(k, 0), idx(k, 1), idx(k, 2)];
  return [idx(k, 8), idx(k, 7), idx(k, 6)];
}
export const ALL_TRIPLES = SIDES.flatMap((side) => Array.from({ length: 9 }, (_, k) => ({ side, k, cells: cellsOf(side, k) })));

export const HOUSE = Array.from({ length: 81 }, (_, i) => {
  const out = [];
  for (let j = 0; j < 81; j++) if (j !== i && (rowOf(j) === rowOf(i) || colOf(j) === colOf(i) || boxOf(j) === boxOf(i))) out.push(j);
  return out;
});
export const UNITS = [];
for (let r = 0; r < 9; r++) UNITS.push([...Array(9).keys()].map((c) => idx(r, c)));
for (let c = 0; c < 9; c++) UNITS.push([...Array(9).keys()].map((r) => idx(r, c)));
for (let br = 0; br < 3; br++) for (let bc = 0; bc < 3; bc++) {
  const u = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) u.push(idx(br * 3 + r, bc * 3 + c));
  UNITS.push(u);
}

// does an ordered assignment (x, y, z) of distinct digits satisfy the clue?
function fits(clue, x, y, z) {
  if (clue.sum != null) return x + y + z === clue.sum;
  const want = clue.digits;
  return [x, y, z].sort().join('') === want;
}
// the digits each of the three cells may still take under the clue, given the
// candidates of all three; null when no assignment survives
function gutterAllow(cells, cand, clue) {
  const allow = [new Set(), new Set(), new Set()];
  let any = false;
  for (const x of cand[cells[0]]) for (const y of cand[cells[1]]) for (const z of cand[cells[2]]) {
    if (x === y || y === z || x === z) continue;
    if (!fits(clue, x, y, z)) continue;
    any = true; allow[0].add(x); allow[1].add(y); allow[2].add(z);
  }
  return any ? allow : null;
}
function candidateMap(given) {
  const cand = [];
  for (let i = 0; i < 81; i++) {
    if (given[i]) { cand.push(new Set([given[i]])); continue; }
    const s = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const j of HOUSE[i]) if (given[j]) s.delete(given[j]);
    cand.push(s);
  }
  return cand;
}
// apply every printed gutter once; returns true if anything changed, null on contradiction
function applyGutters(cand, clues) {
  let moved = false;
  for (const t of ALL_TRIPLES) {
    const clue = clues[t.side][t.k];
    if (!clue) continue;
    const allow = gutterAllow(t.cells, cand, clue);
    if (!allow) return null;
    for (let m = 0; m < 3; m++) {
      const i = t.cells[m];
      for (const d of [...cand[i]]) if (!allow[m].has(d)) { cand[i].delete(d); moved = true; }
      if (!cand[i].size) return null;
    }
  }
  return moved;
}

// ── exhaustive counter: propagate gutters + naked singles, branch on the
// tightest (unit, digit) placement ──────────────────────────────────────────
export function countSolutions(given, clues, cap) {
  let found = 0;
  const walk = (cand) => {
    if (found >= cap) return;
    // propagate
    for (;;) {
      let moved = false;
      for (let i = 0; i < 81; i++) {
        if (cand[i].size !== 1) continue;
        const d = [...cand[i]][0];
        for (const j of HOUSE[i]) if (cand[j].has(d)) { if (cand[j].size === 1) return; cand[j].delete(d); moved = true; }
      }
      const r = applyGutters(cand, clues);
      if (r === null) return;
      if (r) moved = true;
      if (!moved) break;
    }
    let bestSpots = null, bestN = 99;
    for (const u of UNITS) for (let d = 1; d <= 9; d++) {
      if (u.some((i) => cand[i].size === 1 && cand[i].has(d))) continue;
      const spots = u.filter((i) => cand[i].has(d));
      if (spots.length < bestN) { bestN = spots.length; bestSpots = { spots, d }; }
      if (bestN === 0) return;
    }
    if (!bestSpots) { found++; return; }
    for (const i of bestSpots.spots) {
      const next = cand.map((s) => new Set(s));
      next[i] = new Set([bestSpots.d]);
      walk(next);
      if (found >= cap) return;
    }
  };
  walk(candidateMap(given));
  return found;
}

// ── the level-1 logical solver, policed ─────────────────────────────────────
// Gutter deduction, naked singles, hidden singles. Nothing else: both banks
// claim level 1 and the checker must not quietly grant a harder move.
export function logicSolve(given, clues, truth) {
  const cand = candidateMap(given);
  const solved = given.slice();
  const police = () => {
    if (!truth) return;
    for (let i = 0; i < 81; i++) {
      if (!cand[i].has(truth[i])) throw new Error(`unsound elimination at r${rowOf(i) + 1}c${colOf(i) + 1}: lost ${truth[i]}`);
      if (solved[i] && solved[i] !== truth[i]) throw new Error(`unsound placement at r${rowOf(i) + 1}c${colOf(i) + 1}`);
    }
  };
  const place = (i, d) => { solved[i] = d; cand[i] = new Set([d]); for (const j of HOUSE[i]) if (!solved[j]) cand[j].delete(d); };
  for (let i = 0; i < 81; i++) if (given[i]) place(i, given[i]);
  police();
  for (;;) {
    let moved = false;
    const r = applyGutters(cand, clues);
    if (r === null) return { solved: false, grid: solved };
    if (r) moved = true;
    for (let i = 0; i < 81; i++) if (!solved[i] && cand[i].size === 1) { place(i, [...cand[i]][0]); moved = true; }
    for (const u of UNITS) for (let d = 1; d <= 9; d++) {
      if (u.some((i) => solved[i] === d)) continue;
      const spots = u.filter((i) => !solved[i] && cand[i].has(d));
      if (spots.length === 1) { place(spots[0], d); moved = true; }
    }
    police();
    if (!moved) break;
  }
  return { solved: solved.every((v) => v > 0), grid: solved };
}

// shared sweep for both banks; `perBoard` adds the game's own checks and gets
// (p, tag, given, sol, clues, fail)
export function sweep(GAME, PUZZLES, perBoard) {
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const asDate = (iso) => new Date(iso + 'T00:00:00Z');
  const dowOf = (iso) => asDate(iso).getUTCDay();
  const labelOf = (iso) => { const d = asDate(iso); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`; };
  const quizIdOf = (iso) => { const d = asDate(iso); return `${GAME}-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`; };
  const addDays = (iso, n) => { const d = asDate(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const fails = [], warns = [];
  const fail = (m) => fails.push(m);
  if (!Array.isArray(PUZZLES) || !PUZZLES.length) { console.error(`${GAME.toUpperCase()}: no puzzles`); process.exit(1); }
  const seenSol = new Map(), seenQuiz = new Set();
  const first = PUZZLES[0].live;
  for (const [n, p] of PUZZLES.entries()) {
    const tag = `#${p.num} ${p.live}`;
    if (p.num !== n + 1) fail(`${tag}: num out of sequence, expected ${n + 1}`);
    if (p.live !== addDays(first, n)) fail(`${tag}: live date is not day ${n} after ${first}`);
    if (p.dateLabel !== labelOf(p.live)) fail(`${tag}: dateLabel "${p.dateLabel}" does not match the date`);
    if (p.quizId !== quizIdOf(p.live)) fail(`${tag}: quizId "${p.quizId}" does not match the date`);
    if (seenQuiz.has(p.quizId)) fail(`${tag}: duplicate quizId`);
    seenQuiz.add(p.quizId);
    const dow = dowOf(p.live);
    if (!!p.sunday !== (dow === 0)) fail(`${tag}: sunday flag is ${!!p.sunday} on weekday ${dow}`);
    const given = p.given.flat(), sol = p.sol.flat();
    if (given.length !== 81 || sol.length !== 81) { fail(`${tag}: grid is not 9x9`); continue; }
    let legal = true;
    for (const u of UNITS) { const s = new Set(u.map((i) => sol[i])); if (s.size !== 9 || [...s].some((d) => d < 1 || d > 9)) { legal = false; break; } }
    if (!legal) { fail(`${tag}: solution is not a legal sudoku grid`); continue; }
    for (let i = 0; i < 81; i++) if (given[i] && given[i] !== sol[i]) { fail(`${tag}: clue at r${rowOf(i) + 1}c${colOf(i) + 1} disagrees with the solution`); break; }
    const sk = sol.join('');
    if (seenSol.has(sk)) fail(`${tag}: repeats the solution grid of #${seenSol.get(sk)}`);
    seenSol.set(sk, p.num);
    perBoard(p, tag, given, sol, dow, fail);
  }
  const last = PUZZLES[PUZZLES.length - 1];
  const daysLeft = Math.round((asDate(last.live) - new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')) / 86400000);
  if (daysLeft < 0) fail(`the bank ran out on ${last.live}`);
  else if (daysLeft < 14) warns.push(`only ${daysLeft} days of bank left (ends ${last.live})`);
  const G = GAME.toUpperCase();
  for (const w of warns) console.warn(`${G} warn: ${w}`);
  if (fails.length) {
    for (const f of fails) console.error(`${G} FAIL: ${f}`);
    console.error(`\n${G}: ${fails.length} failure(s) across ${PUZZLES.length} boards.`);
    process.exit(1);
  }
  return { last, sundays: PUZZLES.filter((p) => p.sunday).length };
}
