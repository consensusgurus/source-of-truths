// The Chomp movement rule, in one place.
//
// app/chomp/ChompClient.jsx plays through these functions and
// scripts/verify-chomp.mjs replays every banked board's proven solution through
// the SAME ones, so the checker tests the code that actually ships rather than a
// second copy of it that can drift.
//
// TWO RULES, AND THE SECOND FALLS OUT OF THE FIRST:
//
//   1. The body NEVER retracts. Every square the head touches is occupied for
//      the rest of the run, so the trail is a permanent wall. There is no tail
//      to follow and no `pending` growth to track: the body is simply every
//      square visited, and its length is always moves + 1.
//   2. A pellet is SOLID until its turn. You cannot cross number five on the way
//      to number three. Under rule 1 a crossed pellet would be sitting under
//      your own body with no way to ever reach it, which is a board silently
//      ruined twenty moves before the player finds out. A wall you can see is
//      the fair version of that.
//
// Reversing is not special-cased either. On move one there is nothing behind the
// head so every direction is legal; from move two the square behind is occupied
// and the occupancy check refuses it. One rule covers both.
//
// BLEACHERS (from the 2026-08-21 bank): a board may carry `walls`, a list of
// [x, y] cells that are bolted down for the whole run. The head can never enter
// one, so every rule above simply treats them as squares that were never on the
// board. Boards without a `walls` field (everything before 2026-08-21) behave
// exactly as they always did. GATES (from 2026-11-25) are below canEnter.

export const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export const DIR_KEYS = ['up', 'down', 'left', 'right'];

const key = (p, x, y) => y * p.w + x;

// `ms` is banked on every move against `tMark` rather than derived from `t0` at
// the end, so closing the tab to think is not charged as play time.
// `facing` is carried explicitly because at the drop there is no second body
// square to derive it from. It is presentation only, so the head has something
// to point and chew with.
export function freshState(p) {
  return {
    v: 2,
    body: [[p.start[0], p.start[1]]],
    occ: { [key(p, p.start[0], p.start[1])]: 1 },
    pi: 0,
    moves: 0,
    facing: [1, 0],
    chewing: false,
    status: 'playing',
    t0: null, tEnd: null, ms: 0, tMark: null,
  };
}

// Can the head enter this square? Off the board, into a bleacher, into the
// trail, or into a pellet whose turn has not come are all no.
export function canEnter(p, st, x, y) {
  if (x < 0 || y < 0 || x >= p.w || y >= p.h) return false;
  if (p.walls) { for (const w of p.walls) if (w[0] === x && w[1] === y) return false; }
  if (st.occ[key(p, x, y)]) return false;
  for (let k = st.pi + 1; k < p.pellets.length; k++) {
    if (p.pellets[k][0] === x && p.pellets[k][1] === y) return false;
  }
  if (gateShut(p, st, x, y)) return false;
  return true;
}

// GATES (from the 2026-11-25 bank): a board may carry `gates`, a list of
// { x, y, after } squares that are SHUT until `after` mascots have been eaten,
// then open for good. A shut gate is solid, exactly like a mascot whose turn has
// not come. Gates are playable squares: they count toward fillOf, and the one
// winning route always passes through every gate after it opens.
export function gateShut(p, st, x, y) {
  if (!p.gates) return false;
  for (const g of p.gates) if (g.x === x && g.y === y && st.pi < g.after) return true;
  return false;
}

// A run ends only here: the head has nowhere legal left to go.
export function anyLegal(p, st) {
  const [hx, hy] = st.body[0];
  for (const k of DIR_KEYS) {
    const d = DIRS[k];
    if (canEnter(p, st, hx + d[0], hy + d[1])) return true;
  }
  return false;
}

// Apply one direction. Returns null when the move is refused, so the caller can
// flash the square and leave the board untouched: an illegal move is never fatal
// and never costs a move.
export function applyMove(p, st, d) {
  const [hx, hy] = st.body[0];
  const nx = hx + d[0], ny = hy + d[1];
  if (!canEnter(p, st, nx, ny)) return null;
  const target = p.pellets[st.pi];
  const ate = !!target && nx === target[0] && ny === target[1];
  return {
    ...st,
    body: [[nx, ny], ...st.body],
    occ: { ...st.occ, [key(p, nx, ny)]: 1 },
    pi: ate ? st.pi + 1 : st.pi,
    moves: st.moves + 1,
    facing: [d[0], d[1]],
    chewing: ate,
  };
}

export const isCleared = (p, st) => st.pi >= p.pellets.length;

// How much of the board the trail covers, 0..1, measured against the squares a
// route could ever touch (bleachers are not part of the board for this). The
// rules copy quotes it and the end card reports it, because "how full was it
// when you finished" is the thing players actually compare.
export const fillOf = (p, st) => st.body.length / (p.w * p.h - (p.walls ? p.walls.length : 0));

// Replay a route of direction keys or vectors. Used by the verifier to prove a
// banked board really is clearable through the SHIPPED engine.
export function replay(p, route) {
  let st = freshState(p);
  let refused = 0;
  for (const step of route) {
    const d = Array.isArray(step) ? step : DIRS[step];
    const next = applyMove(p, st, d);
    if (!next) { refused += 1; continue; }
    st = next;
    if (isCleared(p, st)) break;
    if (!anyLegal(p, st)) {
      return { moves: st.moves, eaten: st.pi, cleared: false, refused, trapped: true, fill: fillOf(p, st) };
    }
  }
  return {
    moves: st.moves, eaten: st.pi, cleared: isCleared(p, st), refused,
    trapped: !isCleared(p, st) && !anyLegal(p, st), fill: fillOf(p, st),
  };
}
