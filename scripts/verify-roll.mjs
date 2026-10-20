// scripts/verify-roll.mjs — proves Roll's bank (app/roll/puzzles.js).
//
// INDEPENDENT of lib/roll-engine.js on purpose. The engine tracks the die as a
// (top, north, east) triple with opposites summing to seven; this file tracks
// all SIX faces as an array [top, bottom, north, south, east, west] and rolls it
// by permutation, and it builds the 24 legal orientations itself, so a mistake
// in the engine's roll table cannot be repeated here and pass.
//
// For every board:
//   - well formed: rectangular rows, only . # C S 1-6, one S, the numbers 1..N
//     each exactly once with N fixed by weekday, no empty border row or column,
//     ids/dates/nums continuous, sunday === it is a Sunday
//   - the starting die is a real die, and it does not already show 1
//   - `perfect` is the exact fewest rolls (breadth-first search)
//   - the week's ramp: perfect inside that weekday's band
//   - the BLOCKED rule costs rolls: crossing numbers freely solves shorter
//   - cracked squares only on crack days, and they change the answer
//   - no dead floor: the die can stand on every tile
//   - no two boards are the same
import { PUZZLES } from '../app/roll/puzzles.js';

const PLAN = {
  1: { N: 3, cracks: false, band: [9, 12] }, 2: { N: 3, cracks: false, band: [13, 17] },
  3: { N: 4, cracks: false, band: [17, 21] }, 4: { N: 4, cracks: true, band: [19, 24] },
  5: { N: 5, cracks: false, band: [23, 28] }, 6: { N: 5, cracks: true, band: [26, 32] },
  0: { N: 6, cracks: true, band: [36, 44] },
};
let fails = 0;
const fail = (p, m) => { fails++; console.log(`✗ ${p ? p.quizId : 'bank'}: ${m}`); };

// [top, bottom, north, south, east, west]
const T = 0, B = 1, N = 2, S = 3, E = 4, W = 5;
const PERM = {
  U: [S, N, T, B, E, W], // tips toward north: new top was south, new north was top
  D: [N, S, B, T, E, W],
  R: [W, E, N, S, T, B],
  L: [E, W, N, S, B, T],
};
const roll = (f, d) => PERM[d].map((i) => f[i]);
const MOVE = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
const LEGAL = (() => {
  const set = new Set();
  const st = [[1, 6, 2, 5, 3, 4]];
  while (st.length) {
    const f = st.pop(); const k = f.join('');
    if (set.has(k)) continue;
    set.add(k);
    for (const d of 'UDLR') st.push(roll(f, d));
  }
  return set;
})();

function search(p, { free = false, solid = false } = {}) {
  const rows = p.rows, h = rows.length, w = rows[0].length;
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? '.' : rows[y][x]);
  const crackIdx = new Map();
  let sx = 0, sy = 0, n = 0;
  rows.forEach((r, y) => [...r].forEach((c, x) => {
    if (c === 'S') { sx = x; sy = y; }
    if (c === 'C') crackIdx.set(`${x},${y}`, crackIdx.size);
    if (/[1-6]/.test(c)) n = Math.max(n, +c);
  }));
  const [t0, n0, e0] = String(p.die).split('').map(Number);
  const faces = [t0, 7 - t0, n0, 7 - n0, e0, 7 - e0];
  const start = { x: sx, y: sy, f: faces, k: 1, m: 0 };
  const key = (s) => `${s.x}/${s.y}/${s.f.join('')}/${s.k}/${s.m}`;
  const seen = new Set([key(start)]);
  const stood = new Set([`${sx},${sy}`]);
  let fr = [start], depth = 0, best = null;
  while (fr.length) {
    depth++;
    const nx = [];
    for (const s of fr) for (const d of 'UDLR') {
      const x = s.x + MOVE[d][0], y = s.y + MOVE[d][1];
      const c = at(x, y);
      if (c === '.') continue;
      const ci = crackIdx.get(`${x},${y}`);
      if (!solid && ci !== undefined && (s.m >> ci) & 1) continue;
      const f = roll(s.f, d);
      let k = s.k;
      if (/[1-6]/.test(c) && +c >= s.k) {
        if (+c === s.k && f[T] === +c) k++;
        else if (!free) continue;
      }
      let m = s.m;
      const here = crackIdx.get(`${s.x},${s.y}`);
      if (!solid && here !== undefined) m |= 1 << here;
      stood.add(`${x},${y}`);
      if (k > n) { if (best == null) best = depth; continue; }
      const ns = { x, y, f, k, m };
      const kk = key(ns);
      if (seen.has(kk)) continue;
      seen.add(kk); nx.push(ns);
    }
    if (best != null && free) break;
    fr = nx;
  }
  return { best, stood };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
let prev = null;
const shapes = new Set();
for (const p of PUZZLES) {
  const [Y, M, D] = p.live.split('-').map(Number);
  if (p.quizId !== `roll-${M}-${D}-${String(Y).slice(2)}`) fail(p, 'quizId does not match live');
  if (p.dateLabel !== `${MONTHS[M - 1]} ${D}, ${Y}`) fail(p, 'dateLabel does not match live');
  const dow = new Date(`${p.live}T12:00:00Z`).getUTCDay();
  if (p.sunday !== (dow === 0)) fail(p, 'sunday flag wrong');
  if (prev) {
    if (p.num !== prev.num + 1) fail(p, 'num not consecutive');
    if (new Date(`${p.live}T12:00:00Z`) - new Date(`${prev.live}T12:00:00Z`) !== 86400000) fail(p, 'date gap');
  }
  prev = p;
  const plan = PLAN[dow];
  const w = p.rows[0].length;
  if (!p.rows.every((r) => r.length === w && /^[.#CS1-6]+$/.test(r))) { fail(p, 'rows malformed'); continue; }
  const all = p.rows.join('');
  if ((all.match(/S/g) || []).length !== 1) { fail(p, 'needs exactly one S'); continue; }
  const nums = (all.match(/[1-6]/g) || []).map(Number).sort();
  if (nums.join('') !== Array.from({ length: plan.N }, (_, i) => i + 1).join('')) fail(p, `numbers ${nums.join('')}, want 1..${plan.N} once each`);
  if (w > 10 || p.rows.length > 9) fail(p, `too big, ${w}x${p.rows.length}`);
  if (/^\.+$/.test(p.rows[0]) || /^\.+$/.test(p.rows[p.rows.length - 1])) fail(p, 'empty border row');
  if (p.rows.every((r) => r[0] === '.') || p.rows.every((r) => r[w - 1] === '.')) fail(p, 'empty border column');
  const dd = String(p.die).split('').map(Number);
  if (dd.length !== 3 || !LEGAL.has([dd[0], 7 - dd[0], dd[1], 7 - dd[1], dd[2], 7 - dd[2]].join(''))) { fail(p, `die ${p.die} is not a real die`); continue; }
  if (dd[0] === 1) fail(p, 'die starts showing 1');
  const r = search(p);
  if (r.best == null) { fail(p, 'unsolvable'); continue; }
  if (r.best !== p.perfect) fail(p, `perfect is ${r.best}, banked ${p.perfect}`);
  const [lo, hi] = plan.band;
  if (p.perfect < lo || p.perfect > hi) fail(p, `perfect ${p.perfect} outside ${lo}-${hi}`);
  const fr = search(p, { free: true });
  if (fr.best == null || p.perfect - fr.best < (plan.N > 3 ? 3 : 2)) fail(p, `blocked rule costs ${p.perfect - (fr.best ?? 0)} rolls`);
  const hasC = all.includes('C');
  if (!plan.cracks && hasC) fail(p, 'cracked squares on a no-crack day');
  if (plan.cracks) {
    if (!hasC) fail(p, 'no cracked squares');
    else { const s = search(p, { solid: true }); if (s.best == null || s.best >= p.perfect) fail(p, 'cracks do not change the answer'); }
  }
  for (let y = 0; y < p.rows.length; y++) for (let x = 0; x < w; x++) {
    if (p.rows[y][x] !== '.' && !r.stood.has(`${x},${y}`)) { fail(p, `dead floor at ${x},${y}`); break; }
  }
  const sh = `${p.die}:${p.rows.join('/')}`;
  if (shapes.has(sh)) fail(p, 'repeats an earlier board');
  shapes.add(sh);
}
const ids = new Set(PUZZLES.map((p) => p.quizId));
if (ids.size !== PUZZLES.length) fail(null, 'duplicate quizId');
console.log(fails ? `✗ verify-roll: ${fails} failures` : `✓ verify-roll: ${PUZZLES.length} boards, ${PUZZLES[0].live} to ${PUZZLES[PUZZLES.length - 1].live}`);
process.exit(fails ? 1 : 0);
