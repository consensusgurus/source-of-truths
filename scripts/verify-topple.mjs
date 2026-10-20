// scripts/verify-topple.mjs — proves Topple's bank (app/topple/puzzles.js).
//
// INDEPENDENT of lib/topple-engine.js on purpose. The engine tracks the block as
// an (x, y, orientation) table; this file tracks it as TWO UNIT CUBES and rolls
// them with an actual quarter-turn about the bottom edge, so a mistake in the
// engine's table cannot be repeated here and pass.
//
// For every board:
//   - well formed: rectangular rows, only . # F S G, one S, a spring of one G
//     or two side-by-side G (Monday always one), no empty
//     border row or column, ids/dates/nums continuous, sunday === it is a Sunday
//   - `perfect` is the exact fewest rolls (breadth-first search over cube pairs)
//   - the week's ramp: perfect inside that weekday's band
//   - fragile tiles change the answer: treated as floor, fewer rolls (Mon has none)
//   - no dead floor: every tile is touched by some reachable position
//   - the board fits the page: at most 17 wide and 11 tall
import { PUZZLES } from '../app/topple/puzzles.js';

const BAND = { 1: [12, 16], 2: [14, 18], 3: [16, 20], 4: [18, 23], 5: [20, 25], 6: [22, 28], 0: [30, 38] };
let fails = 0;
const fail = (p, m) => { fails++; console.log(`✗ ${p ? p.quizId : 'bank'}: ${m}`); };

function board(p) {
  const h = p.rows.length, w = p.rows[0].length;
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? '.' : p.rows[y][x]);
  let S = null;
  const G = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (p.rows[y][x] === 'S') S = [x, y]; if (p.rows[y][x] === 'G') G.push(`${x},${y}`); }
  return { w, h, at, S, G: G.sort().join('|') };
}

// A position is two cube CENTRES, [[x,y,z],[x,y,z]], each coordinate +0.5.
function rollCubes(cubes, d) {
  const xs = cubes.map((c) => c[0]), ys = cubes.map((c) => c[1]);
  return cubes.map(([x, y, z]) => {
    if (d === 'R') { const e = Math.max(...xs) + 0.5; return [e + z, y, e - x]; }
    if (d === 'L') { const e = Math.min(...xs) - 0.5; return [e - z, y, x - e]; }
    if (d === 'D') { const e = Math.max(...ys) + 0.5; return [x, e + z, e - y]; }
    const e = Math.min(...ys) - 0.5; return [x, e - z, y - e];
  });
}
const keyC = (c) => c.map((q) => q.join(',')).sort().join('|');
const standing = (c) => c[0][0] === c[1][0] && c[0][1] === c[1][1];
const floorCells = (c) => c.filter((q) => q[2] === 0.5).map((q) => [q[0] - 0.5, q[1] - 0.5]);

function bfs(B, fragileFloor) {
  const start = [[B.S[0] + 0.5, B.S[1] + 0.5, 0.5], [B.S[0] + 0.5, B.S[1] + 0.5, 1.5]];
  const seen = new Set([keyC(start)]);
  const touchedSet = new Set([`${B.S[0]},${B.S[1]}`]);
  let fr = [start], depth = 0, best = null;
  while (fr.length) {
    depth++;
    const nx = [];
    for (const c of fr) for (const d of 'UDLR') {
      const n = rollCubes(c, d);
      const under = floorCells(n);
      if (under.some(([x, y]) => B.at(x, y) === '.')) continue;
      if (standing(n) && B.at(under[0][0], under[0][1]) === 'F' && !fragileFloor) continue;
      // the spring fires only when the footprint IS the spring: standing on a
      // one-tile spring, lying across both tiles of a two-tile one
      if (under.map(([x, y]) => `${x},${y}`).sort().join('|') === B.G) {
        under.forEach(([x, y]) => touchedSet.add(`${x},${y}`));
        if (best == null) best = depth;
        continue;
      }
      const k = keyC(n);
      if (seen.has(k)) continue;
      seen.add(k);
      under.forEach(([x, y]) => touchedSet.add(`${x},${y}`));
      nx.push(n);
    }
    fr = nx;
  }
  return { best, touched: touchedSet };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
let prev = null;
for (const p of PUZZLES) {
  const [Y, M, D] = p.live.split('-').map(Number);
  if (p.quizId !== `topple-${M}-${D}-${String(Y).slice(2)}`) fail(p, 'quizId does not match live');
  if (p.dateLabel !== `${MONTHS[M - 1]} ${D}, ${Y}`) fail(p, 'dateLabel does not match live');
  const dow = new Date(`${p.live}T12:00:00Z`).getUTCDay();
  if (p.sunday !== (dow === 0)) fail(p, 'sunday flag wrong');
  if (prev) {
    if (p.num !== prev.num + 1) fail(p, 'num not consecutive');
    if (new Date(`${p.live}T12:00:00Z`) - new Date(`${prev.live}T12:00:00Z`) !== 86400000) fail(p, 'date gap');
  }
  prev = p;
  const w = p.rows[0].length;
  if (!p.rows.every((r) => r.length === w && /^[.#FSG]+$/.test(r))) { fail(p, 'rows malformed'); continue; }
  const all = p.rows.join('');
  const nG = (all.match(/G/g) || []).length;
  if ((all.match(/S/g) || []).length !== 1 || nG < 1 || nG > 2) { fail(p, 'needs one S and a spring of one or two G'); continue; }
  if (nG === 2) {
    const gs = []; p.rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'G') gs.push([x, y]); }));
    if (Math.abs(gs[0][0] - gs[1][0]) + Math.abs(gs[0][1] - gs[1][1]) !== 1) fail(p, 'two-tile spring is not side by side');
  }
  if (dow === 1 && nG !== 1) fail(p, 'Monday spring must be one tile');
  if (w > 17 || p.rows.length > 11) fail(p, `too big, ${w}x${p.rows.length}`);
  if (/^\.+$/.test(p.rows[0]) || /^\.+$/.test(p.rows[p.rows.length - 1])) fail(p, 'empty border row');
  if (p.rows.every((r) => r[0] === '.') || p.rows.every((r) => r[w - 1] === '.')) fail(p, 'empty border column');
  const B = board(p);
  const r = bfs(B, false);
  if (r.best == null) { fail(p, 'unsolvable'); continue; }
  if (r.best !== p.perfect) fail(p, `perfect is ${r.best}, banked ${p.perfect}`);
  const [lo, hi] = BAND[dow];
  if (p.perfect < lo || p.perfect > hi) fail(p, `perfect ${p.perfect} outside ${lo}-${hi}`);
  const hasF = all.includes('F');
  if (dow === 1 && hasF) fail(p, 'Monday carries fragile tiles');
  if (dow !== 1) {
    if (!hasF) fail(p, 'no fragile tiles');
    else { const f = bfs(B, true); if (f.best == null || f.best >= p.perfect) fail(p, 'fragile tiles do not change the answer'); }
  }
  for (let y = 0; y < B.h; y++) for (let x = 0; x < B.w; x++) {
    if ('#F'.includes(p.rows[y][x]) && !r.touched.has(`${x},${y}`)) { fail(p, `dead floor at ${x},${y}`); break; }
  }
}
const ids = new Set(PUZZLES.map((p) => p.quizId));
if (ids.size !== PUZZLES.length) fail(null, 'duplicate quizId');
const longs = PUZZLES.filter((p) => (p.rows.join('').match(/G/g) || []).length === 2).length;
if (longs < PUZZLES.length * 0.25 || longs > PUZZLES.length * 0.6) fail(null, `${longs} two-tile springs of ${PUZZLES.length}, expected about half of Tuesday to Sunday`);
console.log(fails ? `✗ verify-topple: ${fails} failures` : `✓ verify-topple: ${PUZZLES.length} boards, ${PUZZLES[0].live} to ${PUZZLES[PUZZLES.length - 1].live}, ${longs} with a two-tile spring`);
process.exit(fails ? 1 : 0);
