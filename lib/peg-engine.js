// Peg: the daily peg solitaire (owner, 2026-11-18: picked "Peg" from the retro
// list, then "build and implement both"). The 33-hole English cross board.
// The ONE model: the client, scripts/gen-peg.mjs and scripts/verify-peg.mjs
// all run this file.
//
// A board is seven strings, one a row: 'o' a peg, '.' an empty hole, '-' off
// the board (the cross's corners). A jump takes a peg over a neighbour (up,
// down, left or right) into the empty hole beyond, and the jumped peg comes
// off. The day is solved when ONE peg is left and it stands in the target
// hole (the centre unless the board says otherwise).
//
// A line (the save, and the stored answer) is a string of jumps, two letters
// each: the hole the peg jumps FROM (HOLE_CH) and the way it goes (U R D L).

export const N = 7;
export const isHole = (r, c) => r >= 0 && r < N && c >= 0 && c < N && !((r < 2 || r > 4) && (c < 2 || c > 4));
export const HOLES = [];
for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (isHole(r, c)) HOLES.push([r, c]);
export const IDX = new Int8Array(N * N).fill(-1);
HOLES.forEach(([r, c], i) => { IDX[r * N + c] = i; });
export const CENTER = IDX[3 * N + 3];
export const HOLE_CH = 'abcdefghijklmnopqrstuvwxyzABCDEFG';
export const DIRS = { U: [-1, 0], R: [0, 1], D: [1, 0], L: [0, -1] };
export const DIR_KEYS = ['U', 'R', 'D', 'L'];
export const holeAt = (r, c) => (isHole(r, c) ? IDX[r * N + c] : -1);

// every possible jump on the board: [from, over, to, dir]
export const JUMPS = [];
HOLES.forEach(([r, c], i) => {
  for (const k of DIR_KEYS) {
    const [dr, dc] = DIRS[k];
    const o = holeAt(r + dr, c + dc), t = holeAt(r + 2 * dr, c + 2 * dc);
    if (o >= 0 && t >= 0) JUMPS.push([i, o, t, k]);
  }
});
const JUMP_FROM = HOLES.map(() => ({}));
JUMPS.forEach((j) => { JUMP_FROM[j[0]][j[3]] = j; });

export function parseBoard(rows) {
  const s = new Uint8Array(HOLES.length);
  HOLES.forEach(([r, c], i) => { s[i] = rows[r][c] === 'o' ? 1 : 0; });
  return s;
}
export const targetOf = (P) => (P.target ? holeAt(P.target[0], P.target[1]) : CENTER);
export const pegsIn = (s) => s.reduce((n, v) => n + v, 0);

export function jumpOf(s, from, dir) {
  const j = JUMP_FROM[from] && JUMP_FROM[from][dir];
  if (!j || !s[j[0]] || !s[j[1]] || s[j[2]]) return null;
  return j;
}
export function apply(s, j) { const n = s.slice(); n[j[0]] = 0; n[j[1]] = 0; n[j[2]] = 1; return n; }
export function legalJumps(s) { return JUMPS.filter((j) => s[j[0]] && s[j[1]] && !s[j[2]]); }
export const jumpsFrom = (s, from) => legalJumps(s).filter((j) => j[0] === from);
export const code = (j) => HOLE_CH[j[0]] + j[3];

// replay a line from the board; null if any jump is illegal
export function replay(P, line) {
  let s = parseBoard(P.pegs);
  if (typeof line !== 'string' || line.length % 2) return null;
  for (let i = 0; i < line.length; i += 2) {
    const from = HOLE_CH.indexOf(line[i]);
    if (from < 0) return null;
    const j = jumpOf(s, from, line[i + 1]);
    if (!j) return null;
    s = apply(s, j);
  }
  return s;
}
export const isSolved = (P, s) => !!s && pegsIn(s) === 1 && s[targetOf(P)] === 1;

// A depth-first solve to one peg on the target, with a memo of dead positions.
// Returns the line (string) or null. Exact: it says null only after trying everything.
export function solve(start, target = CENTER, opts = {}) {
  const dead = new Set();
  const path = [];
  const limit = opts.nodes || Infinity; let nodes = 0;
  const keyOf = (s) => s.join('');
  function rec(s, n) {
    if (n === 1) return s[target] === 1;
    const k = keyOf(s);
    if (dead.has(k)) return false;
    if (++nodes > limit) throw new Error('peg solve: node limit');
    for (const j of JUMPS) {
      if (s[j[0]] && s[j[1]] && !s[j[2]]) {
        path.push(code(j));
        if (rec(apply(s, j), n - 1)) return true;
        path.pop();
      }
    }
    dead.add(k);
    return false;
  }
  return rec(start, pegsIn(start)) ? path.join('') : null;
}
