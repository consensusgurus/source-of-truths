// Topple, the engine. Pure and deterministic, no DOM.
//
// Shared on purpose: app/topple/ToppleClient.jsx plays from this, and
// scripts/gen-topple.mjs builds and measures the bank from the SAME code.
// scripts/verify-topple.mjs does NOT import it: it re-derives every board's
// perfect line with a solver written separately (cube coordinates and real 3D
// rotations, not this file's orientation table), so the game and its checker
// cannot share a bug.
//
// THE GAME. A 1x1x2 block stands on a floor of tiles. Each move tips it over one
// edge (up, down, left or right): standing, it falls flat across the two tiles
// beside it; flat, it either rolls along its long side or stands back up. The
// object is to land it on the SPRING, which fires it off the top of the screen
// (owner, 2026-10-19, in place of the original's hole). A spring is one tile or
// two: a one-tile spring takes the block STANDING on it, a two-tile spring takes
// it LYING FLAT across both (owner: "the solution can be two blocks ... the user
// has to land on the long side"). Any part of the block over empty space and it
// falls off, back to the start.
//
// FRAGILE TILES ('F') hold the block lying flat and crack if it STANDS on one,
// which also sends it back to the start. No switches and no bridges (owner,
// 2026-10-19): the floor and the fragile tiles are the whole game.
//
// A BOARD (the shape banked in app/topple/puzzles.js):
//   rows      strings, one per row: '.' empty, '#' floor, 'F' fragile,
//             'S' start (floor), 'G' the spring (one tile, or two side by side)
//   perfect   the exact fewest rolls, by breadth-first search
//
// THE BLOCK is { x, y, o }: o 'S' standing on (x,y); 'H' flat across (x,y) and
// (x+1,y); 'V' flat across (x,y) and (x,y+1).

export const DIRS = ['U', 'D', 'L', 'R'];

export function roll(b, d) {
  const { x, y, o } = b;
  if (o === 'S') {
    if (d === 'L') return { x: x - 2, y, o: 'H' };
    if (d === 'R') return { x: x + 1, y, o: 'H' };
    if (d === 'U') return { x, y: y - 2, o: 'V' };
    return { x, y: y + 1, o: 'V' };
  }
  if (o === 'H') {
    if (d === 'L') return { x: x - 1, y, o: 'S' };
    if (d === 'R') return { x: x + 2, y, o: 'S' };
    if (d === 'U') return { x, y: y - 1, o: 'H' };
    return { x, y: y + 1, o: 'H' };
  }
  if (d === 'U') return { x, y: y - 1, o: 'S' };
  if (d === 'D') return { x, y: y + 2, o: 'S' };
  if (d === 'L') return { x: x - 1, y, o: 'V' };
  return { x: x + 1, y, o: 'V' };
}

export function cellsOf(b) {
  if (b.o === 'S') return [[b.x, b.y]];
  if (b.o === 'H') return [[b.x, b.y], [b.x + 1, b.y]];
  return [[b.x, b.y], [b.x, b.y + 1]];
}

// Parse a banked board into the form the rules run on.
export function parse(p) {
  const rows = p.rows;
  const h = rows.length, w = rows[0].length;
  const grid = rows.map((r) => r.split(''));
  let start = null;
  const goal = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = grid[y][x];
    if (c === 'S') { start = { x, y, o: 'S' }; grid[y][x] = '#'; }
    else if (c === 'G') goal.push([x, y]);
  }
  // goalKey: the block's footprint that wins, as a sorted cell list
  const goalKey = goal.map(([x, y]) => y * w + x).sort((a, b) => a - b).join(',');
  return { w, h, grid, start, goal, goalKey };
}

// What is at (x, y): '.', '#', 'F' or 'G'.
export function tileAt(P, x, y) {
  if (x < 0 || y < 0 || x >= P.w || y >= P.h) return '.';
  return P.grid[y][x];
}

// One roll. Returns { block, result } where result is
//   'ok' | 'fall' (off the edge) | 'crack' (stood on a fragile tile) | 'win'.
// opts.fragileFloor treats fragile tiles as plain floor, which the generator
// uses to prove the fragile tiles change the answer.
export function step(P, block0, d, opts) {
  const block = roll(block0, d);
  for (const [x, y] of cellsOf(block)) if (tileAt(P, x, y) === '.') return { block, result: 'fall' };
  if (block.o === 'S' && tileAt(P, block.x, block.y) === 'F' && !(opts && opts.fragileFloor)) return { block, result: 'crack' };
  if (onSpring(P, block)) return { block, result: 'win' };
  return { block, result: 'ok' };
}

// True when the block's footprint is exactly the spring: standing on a one-tile
// spring, or lying across both tiles of a two-tile one. Standing on one tile of
// a two-tile spring, or lying half on a one-tile spring, is just floor.
export function onSpring(P, block) {
  const k = cellsOf(block).map(([x, y]) => y * P.w + x).sort((a, b) => a - b).join(',');
  return k === P.goalKey;
}

// Replay a move list from the start. A fall or a crack puts the block back on
// the start; the rolls already made still count. 'X' in the list is a restart
// the player asked for: the block goes home and it is not a roll.
export function replay(P, moves) {
  let b = { ...P.start };
  let falls = 0, last = null;
  for (const d of moves) {
    if (d === 'X') { b = { ...P.start }; continue; }
    const r = step(P, b, d);
    last = r;
    if (r.result === 'fall' || r.result === 'crack') { falls++; b = { ...P.start }; continue; }
    b = r.block;
    if (r.result === 'win') return { block: b, falls, won: true, last };
  }
  return { block: b, falls, won: false, last };
}

const keyOf = (b) => `${b.x},${b.y},${b.o}`;

// Breadth-first search. Returns { path, states } where path is the shortest
// string of rolls to the hole from `from` (default: the start), or null.
export function solve(P, opts, from) {
  const init = from || P.start;
  const seen = new Set([keyOf(init)]);
  let frontier = [[init, '']];
  let states = 1;
  while (frontier.length) {
    const next = [];
    for (const [b, path] of frontier) {
      for (const d of DIRS) {
        const r = step(P, b, d, opts);
        if (r.result === 'win') return { path: path + d, states };
        if (r.result !== 'ok') continue;
        const k = keyOf(r.block);
        if (seen.has(k)) continue;
        seen.add(k); states++;
        next.push([r.block, path + d]);
      }
    }
    frontier = next;
  }
  return { path: null, states };
}

// Every square some reachable position of the block touches (including the spring).
export function touched(P) {
  const out = new Set();
  const seen = new Set([keyOf(P.start)]);
  let fr = [P.start];
  while (fr.length) {
    const nx = [];
    for (const b of fr) {
      for (const [x, y] of cellsOf(b)) out.add(y * P.w + x);
      for (const d of DIRS) {
        const r = step(P, b, d);
        if (r.result === 'win') { for (const [x, y] of cellsOf(r.block)) out.add(y * P.w + x); continue; }
        if (r.result !== 'ok') continue;
        const k = keyOf(r.block); if (seen.has(k)) continue; seen.add(k); nx.push(r.block);
      }
    }
    fr = nx;
  }
  return out;
}
