// Roll, the engine. Pure and deterministic, no DOM.
//
// Shared on purpose: app/roll/RollClient.jsx plays from this, and
// scripts/gen-roll.mjs builds and measures the bank from the SAME code.
// scripts/verify-roll.mjs does NOT import it: it re-derives every board's
// perfect line with a solver written separately (a six-face array and
// permutation rolls, not this file's top/north/east triple), so the game and
// its checker cannot share a bug.
//
// THE GAME (owner, 2026-10-20, the sibling of Topple). A die sits on a floor of
// tiles. Each move rolls it over one edge (up, down, left or right). Some
// squares carry a number, 1 to N. Light them IN ORDER: a square lights when the
// die lands on it with that number on top.
//
// A NUMBERED SQUARE IS BLOCKED (owner ruling, 2026-10-20) until it is the next
// one AND the roll would land the die showing its number. A blocked roll is
// refused and costs nothing. Once lit, a square is ordinary floor.
//
// CRACKED squares ('C') hold the die once: they crumble as soon as it rolls
// off, and the hole is gone for the rest of the play. That can trap a player,
// which is what Restart is for. Rolling off the edge of the floor is simply
// not a move (refused, free), so there are no falls.
//
// A BOARD (the shape banked in app/roll/puzzles.js):
//   rows      strings: '.' empty, '#' floor, 'C' cracked, 'S' start (floor),
//             '1'..'6' the numbered squares, each number exactly once, 1..N
//   die       the die at the start as three digits: top, north, east
//             (the faces looking up, toward the top of the screen, and right)
//   perfect   the exact fewest rolls, by breadth-first search
//
// A standard die: opposite faces sum to seven, so bottom = 7 - top,
// south = 7 - north, west = 7 - east.

export const DIRS = ['U', 'D', 'L', 'R'];
const DV = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };

// The die after one roll, faces only: { t, n, e }.
export function rollDie(d, dir) {
  const { t, n, e } = d;
  if (dir === 'U') return { t: 7 - n, n: t, e };
  if (dir === 'D') return { t: n, n: 7 - t, e };
  if (dir === 'R') return { t: 7 - e, n, e: t };
  return { t: e, n, e: 7 - t };
}

// Parse a banked board into the form the rules run on.
export function parse(p) {
  const rows = p.rows;
  const h = rows.length, w = rows[0].length;
  const grid = rows.map((r) => r.split(''));
  let sx = 0, sy = 0, N = 0;
  const cracked = [];   // cell index -> bit
  const crackBit = {};
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = grid[y][x];
    if (c === 'S') { sx = x; sy = y; grid[y][x] = '#'; }
    else if (c >= '1' && c <= '6') N = Math.max(N, +c);
    else if (c === 'C') { crackBit[y * w + x] = cracked.length; cracked.push(y * w + x); }
  }
  const dd = String(p.die || '123');
  const die = { t: +dd[0], n: +dd[1], e: +dd[2] };
  const start = { x: sx, y: sy, t: die.t, n: die.n, e: die.e, k: 1, broken: 0 };
  return { w, h, grid, start, N, cracked, crackBit };
}

export function tileAt(P, x, y) {
  if (x < 0 || y < 0 || x >= P.w || y >= P.h) return '.';
  return P.grid[y][x];
}

// One roll from state s. Returns { state, result, lit, crumble, need, top }:
//   result 'ok' | 'win' | 'edge' (off the floor, or onto a crumbled square)
//          | 'order' (a numbered square that is not next)
//          | 'face' (the next square, but the wrong number would land on top)
// Refused rolls ('edge', 'order', 'face') return the old state and are not rolls.
// opts.free lets the die cross numbered squares freely (lighting the next one
// only with the right face up), which the generator uses to prove the blocked
// rule costs rolls; opts.solidCracks treats cracked squares as plain floor.
export function step(P, s, dir, opts) {
  const nx = s.x + DV[dir][0], ny = s.y + DV[dir][1];
  const c = tileAt(P, nx, ny);
  if (c === '.') return { state: s, result: 'edge' };
  const solid = opts && opts.solidCracks;
  if (c === 'C' && !solid && (s.broken >> P.crackBit[ny * P.w + nx]) & 1) return { state: s, result: 'edge' };
  const d = rollDie(s, dir);
  let k = s.k, lit = false;
  if (c >= '1' && c <= '6' && +c >= s.k) {
    const v = +c;
    if (v === s.k && d.t === v) { k = s.k + 1; lit = true; }
    else if (!(opts && opts.free)) return { state: s, result: v === s.k ? 'face' : 'order', need: v, top: d.t };
  }
  let broken = s.broken, crumble = null;
  const here = s.y * P.w + s.x;
  if (!solid && P.grid[s.y][s.x] === 'C') { broken |= 1 << P.crackBit[here]; crumble = [s.x, s.y]; }
  const state = { x: nx, y: ny, t: d.t, n: d.n, e: d.e, k, broken };
  return { state, result: k > P.N ? 'win' : 'ok', lit, crumble };
}

// Replay a move list from the start. 'X' is a restart (the die goes home, the
// cracked squares are whole again); 'Z' takes back the last roll. Neither is a
// roll. Refused rolls are never recorded, but are skipped if they appear.
export function replay(P, moves) {
  let s = P.start;
  const stack = [];
  for (const m of moves) {
    if (m === 'X') { s = P.start; stack.length = 0; continue; }
    if (m === 'Z') { if (stack.length) s = stack.pop(); continue; }
    const r = step(P, s, m);
    if (r.result !== 'ok' && r.result !== 'win') continue;
    stack.push(s);
    s = r.state;
    if (r.result === 'win') return { state: s, won: true, depth: stack.length };
  }
  return { state: s, won: false, depth: stack.length };
}

// Rolls actually made: every U/D/L/R in the list. Undo and restart do not
// refund them.
export const rollsOf = (moves) => moves.filter((m) => m !== 'X' && m !== 'Z').length;

const keyOf = (s) => `${s.x},${s.y},${s.t}${s.n}${s.e},${s.k},${s.broken}`;

// Breadth-first search. Returns { path, states }: the shortest string of rolls
// that lights every square from `from` (default: the start), or path null.
export function solve(P, opts, from) {
  const init = from || P.start;
  if (init.k > P.N) return { path: '', states: 1 };
  const seen = new Set([keyOf(init)]);
  let frontier = [[init, '']];
  let states = 1;
  while (frontier.length) {
    const next = [];
    for (const [s, path] of frontier) {
      for (const d of DIRS) {
        const r = step(P, s, d, opts);
        if (r.result === 'win') return { path: path + d, states };
        if (r.result !== 'ok') continue;
        const k = keyOf(r.state);
        if (seen.has(k)) continue;
        seen.add(k); states++;
        next.push([r.state, path + d]);
      }
    }
    frontier = next;
  }
  return { path: null, states };
}

// Every square the die can stand on from the start under the real rules,
// whatever it is doing. The generator drops floor outside this set.
export function touched(P) {
  const hit = new Set([P.start.y * P.w + P.start.x]);
  const seen = new Set([keyOf(P.start)]);
  const stack = [P.start];
  while (stack.length) {
    const s = stack.pop();
    for (const d of DIRS) {
      const r = step(P, s, d);
      if (r.result !== 'ok' && r.result !== 'win') continue;
      hit.add(r.state.y * P.w + r.state.x);
      if (r.result === 'win') continue;
      const k = keyOf(r.state);
      if (seen.has(k)) continue;
      seen.add(k); stack.push(r.state);
    }
  }
  return hit;
}

// The 24 ways a die can sit, as 'tne' strings, reached from 1-2-3.
export const ORIENTS = (() => {
  const out = [], seen = new Set();
  const fr = [{ t: 1, n: 2, e: 3 }];
  while (fr.length) {
    const d = fr.pop();
    const k = `${d.t}${d.n}${d.e}`;
    if (seen.has(k)) continue;
    seen.add(k); out.push(k);
    for (const dir of DIRS) fr.push(rollDie(d, dir));
  }
  return out.sort();
})();
