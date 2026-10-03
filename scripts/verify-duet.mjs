// scripts/verify-duet.mjs — the independent gate for the Duet bank.
//
//   node scripts/verify-duet.mjs
//
// Imports NOTHING from scripts/duet-core.mjs, on purpose (the Cages / Quilt
// rule): the generator's solver and this one are written differently, so a
// bug in one is not quietly agreed with by the other. Checks, per board:
//   * the solution obeys every rule (halves per line, no three alike);
//   * rooms are connected, even-sized and balanced in the solution;
//   * printed squares and edge marks agree with the solution, marks sit on
//     orthogonal neighbours and are '=' or 'x';
//   * EXACTLY ONE solution, by a cell-by-cell backtracking count capped at 2;
//   * NO GUESSING: this file's own logical solver (pencil rules plus a line
//     read built by recursion) finishes the board;
//   * the ramp: size by weekday, Monday finishes on pencil work alone, every
//     Tue/Wed/Fri/Sat/Sun board needs at least one line read;
// and across the bank: contiguous dates from day 1, quizId and dateLabel
// match the live date, `sunday` exactly on Sundays, no board repeated.
import { PUZZLES } from '../app/duet/puzzles.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SIZE_BY_DOW = { 0: 10, 1: 6, 2: 6, 3: 6, 4: 8, 5: 8, 6: 8 };
let fails = 0;
const fail = (p, msg) => { fails++; console.log(`FAIL duet #${p.num} ${p.live}: ${msg}`); };

function key(r, c) { return r * 100 + c; }

function ruleOk(grid, n) {
  for (let k = 0; k < n; k++) {
    let rs = 0, cs = 0;
    for (let i = 0; i < n; i++) { rs += grid[k][i]; cs += grid[i][k]; }
    if (rs * 2 !== n || cs * 2 !== n) return false;
    for (let i = 0; i + 2 < n; i++) {
      if (grid[k][i] === grid[k][i + 1] && grid[k][i + 1] === grid[k][i + 2]) return false;
      if (grid[i][k] === grid[i + 1][k] && grid[i + 1][k] === grid[i + 2][k]) return false;
    }
  }
  return true;
}

// Cell-by-cell count of solutions, reading order, with partial-state pruning.
function countSolutions(p, cap = 2) {
  const n = p.n, half = n / 2;
  const g = Array.from({ length: n }, () => Array(n).fill(-1));
  const fixed = new Map();
  for (const [r, c, v] of p.givens) fixed.set(key(r, c), v);
  const roomCells = new Map();
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { const id = p.rooms[r][c]; roomCells.set(id, (roomCells.get(id) || 0) + 1); }
  const roomCnt = new Map(); // id -> [zeros, ones]
  for (const id of roomCells.keys()) roomCnt.set(id, [0, 0]);
  const rowCnt = Array.from({ length: n }, () => [0, 0]);
  const colCnt = Array.from({ length: n }, () => [0, 0]);
  const marksBy = new Map();
  for (const [a, b, c, d, t] of p.edges) {
    const later = key(a, b) > key(c, d) ? [a, b, c, d] : [c, d, a, b];
    const k = key(later[0], later[1]);
    if (!marksBy.has(k)) marksBy.set(k, []);
    marksBy.get(k).push({ r: later[2], c: later[3], same: t === '=' });
  }
  let count = 0;
  const rec = (idx) => {
    if (count >= cap) return;
    if (idx === n * n) { count++; return; }
    const r = Math.floor(idx / n), c = idx % n;
    for (const v of [0, 1]) {
      if (fixed.has(key(r, c)) && fixed.get(key(r, c)) !== v) continue;
      if (rowCnt[r][v] >= half || colCnt[c][v] >= half) continue;
      const id = p.rooms[r][c];
      if (roomCnt.get(id)[v] * 2 >= roomCells.get(id)) continue;
      if (c >= 2 && g[r][c - 1] === v && g[r][c - 2] === v) continue;
      if (r >= 2 && g[r - 1][c] === v && g[r - 2][c] === v) continue;
      const ms = marksBy.get(key(r, c)) || [];
      if (ms.some((m) => (g[m.r][m.c] === v) !== m.same)) continue;
      g[r][c] = v; rowCnt[r][v]++; colCnt[c][v]++; roomCnt.get(id)[v]++;
      rec(idx + 1);
      g[r][c] = -1; rowCnt[r][v]--; colCnt[c][v]--; roomCnt.get(id)[v]--;
    }
  };
  rec(0);
  return count;
}

// This file's own logical solver. Pencil rules, then a line read built by
// recursion over the open squares of one line. Returns { done, usedRead }.
function logicSolve(p, allowRead) {
  const n = p.n;
  const g = Array.from({ length: n }, () => Array(n).fill(-1));
  for (const [r, c, v] of p.givens) g[r][c] = v;
  const linesList = [];
  for (let k = 0; k < n; k++) { linesList.push([...Array(n)].map((_, i) => [k, i])); linesList.push([...Array(n)].map((_, i) => [i, k])); }
  const rooms = {};
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) (rooms[p.rooms[r][c]] = rooms[p.rooms[r][c]] || []).push([r, c]);
  const mark = new Map();
  for (const [a, b, c, d, t] of p.edges) { mark.set(`${a}.${b}|${c}.${d}`, t); mark.set(`${c}.${d}|${a}.${b}`, t); }
  let usedRead = false, bad = false;
  const put = (r, c, v) => { if (g[r][c] === -1) { g[r][c] = v; return true; } if (g[r][c] !== v) bad = true; return false; };
  const groups = linesList.concat(Object.values(rooms));
  for (let guard = 0; guard < 10000 && !bad; guard++) {
    let moved = false;
    for (const [a, b, c, d, t] of p.edges) {
      if (g[a][b] !== -1 && g[c][d] === -1) moved = put(c, d, t === '=' ? g[a][b] : 1 - g[a][b]) || moved;
      if (g[c][d] !== -1 && g[a][b] === -1) moved = put(a, b, t === '=' ? g[c][d] : 1 - g[c][d]) || moved;
    }
    for (const L of linesList) for (let i = 0; i + 2 < n; i++) {
      const [A, B, C] = [L[i], L[i + 1], L[i + 2]];
      const va = g[A[0]][A[1]], vb = g[B[0]][B[1]], vc = g[C[0]][C[1]];
      if (va !== -1 && va === vb && vc === -1) moved = put(C[0], C[1], 1 - va) || moved;
      if (vb !== -1 && vb === vc && va === -1) moved = put(A[0], A[1], 1 - vb) || moved;
      if (va !== -1 && va === vc && vb === -1) moved = put(B[0], B[1], 1 - va) || moved;
    }
    for (const G of groups) {
      const half = G.length / 2;
      for (const v of [0, 1]) {
        const have = G.filter(([r, c]) => g[r][c] === v).length;
        if (have > half) bad = true;
        if (have === half) for (const [r, c] of G) if (g[r][c] === -1) moved = put(r, c, 1 - v) || moved;
      }
    }
    if (moved) continue;
    if (!allowRead) break;
    let read = false;
    for (const L of linesList) {
      const open = L.map((x, i) => (g[x[0]][x[1]] === -1 ? i : -1)).filter((i) => i >= 0);
      if (!open.length) continue;
      const seen = open.map(() => new Set());
      const vals = L.map(([r, c]) => g[r][c]);
      const ok = () => {
        let ones = 0;
        for (let i = 0; i < n; i++) ones += vals[i];
        if (ones * 2 !== n) return false;
        for (let i = 0; i + 2 < n; i++) if (vals[i] === vals[i + 1] && vals[i + 1] === vals[i + 2]) return false;
        for (let i = 0; i + 1 < n; i++) {
          const t = mark.get(`${L[i][0]}.${L[i][1]}|${L[i + 1][0]}.${L[i + 1][1]}`);
          if (t && ((t === '=') !== (vals[i] === vals[i + 1]))) return false;
        }
        return true;
      };
      const go = (j) => {
        if (j === open.length) { if (ok()) open.forEach((i, q) => seen[q].add(vals[i])); return; }
        for (const v of [0, 1]) { vals[open[j]] = v; go(j + 1); }
        vals[open[j]] = -1;
      };
      go(0);
      open.forEach((i, q) => {
        if (seen[q].size === 0) bad = true;
        if (seen[q].size === 1) { const [v] = seen[q]; if (put(L[i][0], L[i][1], v)) read = true; }
      });
      if (read) break;
    }
    if (!read) break;
    usedRead = true;
  }
  const done = !bad && g.every((row) => row.every((v) => v !== -1));
  const matches = done && g.every((row, r) => row.every((v, c) => v === p.sol[r][c]));
  return { done: done && matches, usedRead };
}

const seen = new Set();
let expected = null;
for (const p of PUZZLES) {
  const n = p.n;
  const dt = new Date(`${p.live}T12:00:00Z`);
  const dow = dt.getUTCDay();
  if (expected && p.live !== expected) fail(p, `date gap, expected ${expected}`);
  const nx = new Date(dt); nx.setUTCDate(nx.getUTCDate() + 1); expected = nx.toISOString().slice(0, 10);
  if (p.num !== PUZZLES.indexOf(p) + 1) fail(p, 'num out of order');
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `duet-${m}-${d}-${String(y).slice(2)}`) fail(p, `quizId ${p.quizId}`);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${d}, ${y}`) fail(p, `dateLabel ${p.dateLabel}`);
  if (!!p.sunday !== (dow === 0)) fail(p, 'sunday flag does not match the date');
  const wantN = p.num === 1 ? 6 : SIZE_BY_DOW[dow];
  if (n !== wantN) fail(p, `size ${n}, ramp says ${wantN}`);
  if (p.sol.length !== n || p.sol.some((row) => row.length !== n)) { fail(p, 'sol shape'); continue; }
  if (!ruleOk(p.sol, n)) fail(p, 'solution breaks a rule');
  // rooms
  const rc = {};
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) (rc[p.rooms[r][c]] = rc[p.rooms[r][c]] || []).push([r, c]);
  for (const [id, cells] of Object.entries(rc)) {
    if (cells.length < 2 || cells.length % 2) fail(p, `room ${id} has ${cells.length} squares`);
    if (cells.reduce((s, [r, c]) => s + p.sol[r][c], 0) * 2 !== cells.length) fail(p, `room ${id} unbalanced`);
    const inRoom = new Set(cells.map(([r, c]) => key(r, c)));
    const reach = new Set([key(...cells[0])]); const stack = [cells[0]];
    while (stack.length) { const [r, c] = stack.pop(); for (const [a, b] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) { const k = key(a, b); if (inRoom.has(k) && !reach.has(k)) { reach.add(k); stack.push([a, b]); } } }
    if (reach.size !== cells.length) fail(p, `room ${id} not connected`);
  }
  for (const [r, c, v] of p.givens) if (p.sol[r][c] !== v) fail(p, `given ${r},${c} disagrees`);
  for (const [a, b, c, d, t] of p.edges) {
    if (Math.abs(a - c) + Math.abs(b - d) !== 1) fail(p, `mark ${a},${b}-${c},${d} not adjacent`);
    if (t !== '=' && t !== 'x') fail(p, `mark type ${t}`);
    if ((p.sol[a][b] === p.sol[c][d]) !== (t === '=')) fail(p, `mark ${a},${b}-${c},${d} disagrees`);
  }
  const cnt = countSolutions(p);
  if (cnt !== 1) fail(p, `${cnt} solutions`);
  const lv0 = logicSolve(p, false);
  const lv1 = logicSolve(p, true);
  if (!lv1.done) fail(p, 'logic solver cannot finish (guessing needed)');
  const easy = p.num === 1 || dow === 1;
  if (easy && !lv0.done) fail(p, 'Monday/launch board needs more than pencil work');
  if (!easy && dow !== 4 && lv0.done) fail(p, 'board finishes on pencil work, too easy for its day');
  const k = JSON.stringify([p.rooms, p.givens, p.edges]);
  if (seen.has(k)) fail(p, 'board repeated');
  seen.add(k);
}
console.log(`verify-duet: ${PUZZLES.length} boards, ${PUZZLES[0].live} to ${PUZZLES.at(-1).live}, ${fails} failures`);
process.exit(fails ? 1 : 0);
