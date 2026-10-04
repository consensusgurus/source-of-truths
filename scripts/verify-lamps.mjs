// scripts/verify-lamps.mjs: re-proves app/lamps/puzzles.js from scratch.
// Shares NO code with scripts/lamps-core.mjs or scripts/gen-lamps.mjs.
//
//   node scripts/verify-lamps.mjs
//   VERIFY_LAMPS_BANK=/path/to/bank.js node scripts/verify-lamps.mjs   (mutation tests)
//
// Per board: the size and look-ahead band its weekday asks for, legal
// characters, half-turn wall symmetry, the stored solution legal (every white
// square lit, no lamp sees a lamp, every numbered wall exact), EXACTLY ONE
// solution by an independent cell-by-cell counter, and the stored cost
// re-derived by an independent graded solver under the canonical definition:
// run the pencil rules to a fixed point; then take the first open square in
// reading order for which supposing a lamp, else a cross, breaks the board,
// settle it the other way, count one, and repeat.
// Across the bank: contiguous dates, quizId and dateLabel agreeing with the
// date, Sunday flags on real Sundays, numbering, no repeated board.
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const bankPath = process.env.VERIFY_LAMPS_BANK || path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'app', 'lamps', 'puzzles.js');
const { PUZZLES } = await import(pathToFileURL(path.resolve(bankPath)).href);

const BAND = { 1: [7, 0, 0], 2: [7, 1, 2], 3: [7, 3, 9], 4: [8, 0, 1], 5: [8, 2, 5], 6: [8, 6, 16], 0: [10, 6, 40] };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
let fails = 0;
const fail = (p, msg) => { fails++; console.error(`FAIL #${p && p.num} ${p && p.live}: ${msg}`); };

function parse(p) {
  const n = p.n;
  const wall = [], num = [];
  for (let r = 0; r < n; r++) { wall.push([]); num.push([]); for (let c = 0; c < n; c++) { const ch = p.grid[r][c]; wall[r].push(ch !== '.'); num[r].push(ch >= '0' && ch <= '4' ? Number(ch) : -1); } }
  return { n, wall, num };
}
function visible(B, r, c) {
  const out = [];
  for (const [dr, dc] of DIRS) { let rr = r + dr, cc = c + dc; while (rr >= 0 && rr < B.n && cc >= 0 && cc < B.n && !B.wall[rr][cc]) { out.push([rr, cc]); rr += dr; cc += dc; } }
  return out;
}
function neighbours(B, r, c) {
  const out = [];
  for (const [dr, dc] of DIRS) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < B.n && cc >= 0 && cc < B.n && !B.wall[rr][cc]) out.push([rr, cc]); }
  return out;
}
function legalSolution(B, lampSet) {
  const has = (r, c) => lampSet.has(r * B.n + c);
  for (let r = 0; r < B.n; r++) for (let c = 0; c < B.n; c++) {
    if (B.wall[r][c]) { if (has(r, c)) return 'a lamp sits on a wall'; if (B.num[r][c] >= 0 && neighbours(B, r, c).filter(([a, b]) => has(a, b)).length !== B.num[r][c]) return `wall r${r + 1}c${c + 1} count is wrong`; continue; }
    const seen = visible(B, r, c).filter(([a, b]) => has(a, b)).length;
    if (has(r, c) && seen) return `lamps see each other at r${r + 1}c${c + 1}`;
    if (!has(r, c) && !seen) return `r${r + 1}c${c + 1} is dark`;
  }
  return null;
}

// ---- independent counter: decide the whites in reading order ----
function countSolutions(B, cap) {
  const n = B.n;
  const whites = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!B.wall[r][c]) whites.push([r, c]);
  const pos = new Map(whites.map(([r, c], k) => [r * n + c, k]));
  const vis = whites.map(([r, c]) => visible(B, r, c).map(([a, b]) => pos.get(a * n + b)));
  const walls = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (B.wall[r][c] && B.num[r][c] >= 0) walls.push({ need: B.num[r][c], nb: neighbours(B, r, c).map(([a, b]) => pos.get(a * n + b)) });
  const W = whites.length;
  const val = new Int8Array(W).fill(-1); // -1 open, 0 none, 1 lamp
  const lit = new Int16Array(W);
  let count = 0;
  function sane(k) {
    for (const w of walls) { let l = 0, o = 0; for (const j of w.nb) { if (val[j] === 1) l++; else if (val[j] < 0) o++; } if (l > w.need || l + o < w.need) return false; }
    for (let i = 0; i < W; i++) {
      if (lit[i]) continue;
      let can = val[i] < 0;
      if (!can) for (const j of vis[i]) if (val[j] < 0 && !lit[j]) { can = true; break; }
      if (!can) return false;
    }
    return true;
  }
  (function rec(k) {
    if (count >= cap) return;
    if (k === W) { count++; return; }
    if (!lit[k]) {
      val[k] = 1; lit[k]++; for (const j of vis[k]) lit[j]++;
      if (sane(k)) rec(k + 1);
      lit[k]--; for (const j of vis[k]) lit[j]--;
    }
    val[k] = 0;
    if (sane(k)) rec(k + 1);
    val[k] = -1;
  })(0);
  return count;
}

// ---- independent graded solver: a 2D board of '?', 'L', 'x' ----
function pencil(B, S) {
  const n = B.n;
  for (let again = true; again;) {
    again = false;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (B.wall[r][c]) {
        if (B.num[r][c] < 0) continue;
        const nb = neighbours(B, r, c);
        const lamps = nb.filter(([a, b]) => S[a][b] === 'L').length;
        const open = nb.filter(([a, b]) => S[a][b] === '?');
        if (lamps > B.num[r][c] || lamps + open.length < B.num[r][c]) return false;
        if (open.length && lamps === B.num[r][c]) { open.forEach(([a, b]) => { S[a][b] = 'x'; }); again = true; }
        else if (open.length && lamps + open.length === B.num[r][c]) { open.forEach(([a, b]) => { S[a][b] = 'L'; }); again = true; }
        continue;
      }
      const v = visible(B, r, c);
      const seenLamp = v.some(([a, b]) => S[a][b] === 'L');
      if (S[r][c] === 'L') { if (seenLamp) return false; continue; }
      if (seenLamp) { if (S[r][c] === '?') { S[r][c] = 'x'; again = true; } continue; }
      const cands = v.filter(([a, b]) => S[a][b] === '?');
      if (S[r][c] === '?') cands.push([r, c]);
      if (!cands.length) return false;
      if (cands.length === 1) { S[cands[0][0]][cands[0][1]] = 'L'; again = true; }
    }
  }
  return true;
}
function gradeBoard(B) {
  const n = B.n;
  const S = B.wall.map((row) => row.map((w) => (w ? '#' : '?')));
  if (!pencil(B, S)) return { ok: false };
  let cost = 0;
  for (;;) {
    let open = false, moved = false;
    outer: for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (S[r][c] !== '?') continue;
      open = true;
      for (const v of ['L', 'x']) {
        const T = S.map((row) => row.slice());
        T[r][c] = v;
        if (!pencil(B, T)) { S[r][c] = v === 'L' ? 'x' : 'L'; cost++; if (!pencil(B, S)) return { ok: false }; moved = true; break outer; }
      }
    }
    if (!open) return { ok: true, cost, S };
    if (!moved) return { ok: false };
  }
}

const seen = new Map();
let prev = null;
PUZZLES.forEach((p, idx) => {
  if (p.num !== idx + 1) fail(p, `num should be ${idx + 1}`);
  const d = new Date(`${p.live}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return fail(p, 'bad live date');
  if (prev) { const e = new Date(`${prev}T12:00:00Z`); e.setUTCDate(e.getUTCDate() + 1); if (e.toISOString().slice(0, 10) !== p.live) fail(p, 'dates are not contiguous'); }
  prev = p.live;
  const [y, m, dd] = p.live.split('-').map(Number);
  if (p.quizId !== `lamps-${m}-${dd}-${String(y).slice(2)}`) fail(p, 'quizId does not match the date');
  if (p.dateLabel !== `${MONTHS[m - 1]} ${dd}, ${y}`) fail(p, 'dateLabel does not match the date');
  const dow = d.getUTCDay();
  if (!!p.sunday !== (dow === 0)) fail(p, 'sunday flag does not match the weekday');
  const [size, lo, hi] = BAND[dow];
  if (p.n !== size) fail(p, `size ${p.n}, the weekday asks for ${size}`);
  if (!Array.isArray(p.grid) || p.grid.length !== p.n || p.grid.some((s) => typeof s !== 'string' || s.length !== p.n || /[^.#0-4]/.test(s))) return fail(p, 'malformed grid');
  const B = parse(p);
  for (let r = 0; r < p.n; r++) for (let c = 0; c < p.n; c++) if (B.wall[r][c] !== B.wall[p.n - 1 - r][p.n - 1 - c]) { fail(p, 'walls are not half-turn symmetric'); r = p.n; break; }
  const key = p.grid.join('/');
  if (seen.has(key)) fail(p, `repeats board #${seen.get(key)}`); else seen.set(key, p.num);
  if (!Array.isArray(p.sol) || new Set(p.sol).size !== p.sol.length || p.sol.some((i) => !Number.isInteger(i) || i < 0 || i >= p.n * p.n)) return fail(p, 'malformed sol');
  const bad = legalSolution(B, new Set(p.sol));
  if (bad) fail(p, `stored solution illegal: ${bad}`);
  const cnt = countSolutions(B, 2);
  if (cnt !== 1) fail(p, `${cnt === 0 ? 'no' : 'more than one'} solution`);
  const g = gradeBoard(B);
  if (!g.ok) fail(p, 'the graded solver cannot finish it without guessing');
  else {
    if (g.cost !== p.cost) fail(p, `stored cost ${p.cost}, re-derived ${g.cost}`);
    const lamps = new Set(p.sol);
    for (let r = 0; r < p.n; r++) for (let c = 0; c < p.n; c++) if (!B.wall[r][c] && (g.S[r][c] === 'L') !== lamps.has(r * p.n + c)) { fail(p, 'the graded solve does not land on the stored solution'); r = p.n; break; }
    if (g.cost < lo || g.cost > hi) fail(p, `cost ${g.cost} outside the weekday band ${lo}-${hi}`);
  }
});

console.log(`verify-lamps: ${PUZZLES.length} boards, ${PUZZLES[0] && PUZZLES[0].live} to ${prev}, ${fails} failure${fails === 1 ? '' : 's'}`);
process.exit(fails ? 1 : 0);
