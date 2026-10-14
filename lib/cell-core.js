// Cell rules: the daily FreeCell. Shared by the client (app/cell/CellClient.jsx)
// and the generator (scripts/gen-cell.mjs), so the game a player plays and the
// game the bank was solved against are the same program. The verifier
// (scripts/verify-cell.mjs) deliberately does NOT import this file: it carries
// its own engine and its own solver.
//
// Card code = suit * 16 + rank, rank 1 (ace) to 10. Suits: 0 spades, 1 hearts,
// 2 clubs, 3 diamonds, so a card's colour is suit & 1 (0 black, 1 red).
//
// The rules, all of them:
//   - Tableau builds DOWN in alternating colours.
//   - Any single card may go to an empty free cell.
//   - Foundations build UP by suit from the ace.
//   - Any card, or any valid sequence from the top of a column, may go onto a
//     card one rank higher of the other colour, or into an empty column.
//   - A sequence move is ONE move, legal when its length is at most
//     (empty free cells + 1) * 2^(empty columns), not counting the destination
//     column when that is the empty one.
//   - After every player move, SAFE AUTOPLAY sends home every card that can go
//     and is safe to: aces and twos always, any other card once both foundations
//     of the other colour are at least one rank below it. Autoplay counts
//     nothing.
//
// A move is recorded as [card, n, dest]: `card` is the BOTTOM card of what moves
// (the only card when n is 1, and a free-cell card always moves alone), `n` the
// number of cards, and `dest` a column index, FREE for a free cell or FND for
// home. Every card appears once in the deck, so that triple identifies the move
// from the deal alone, which is what lets a saved game replay.

export const FREE = 100;
export const FND = 200;
export const suitOf = (c) => c >> 4;
export const rankOf = (c) => c & 15;
export const redOf = (c) => (c >> 4) & 1;
export const RANK_LABEL = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
export const SUIT_PIP = ['♠', '♥', '♣', '♦'];
export const SUIT_NAME = ['spades', 'hearts', 'clubs', 'diamonds'];

// Can `upper` sit on `lower` in the tableau?
export const canLink = (lower, upper) => rankOf(upper) === rankOf(lower) - 1 && redOf(upper) !== redOf(lower);

export function fromDeal(deal, cells) {
  return { cols: deal.map((c) => c.slice()), free: Array(cells).fill(null), fnd: [0, 0, 0, 0] };
}
export const cloneState = (s) => ({ cols: s.cols.map((c) => c.slice()), free: s.free.slice(), fnd: s.fnd.slice() });
export const homeCount = (s) => s.fnd[0] + s.fnd[1] + s.fnd[2] + s.fnd[3];
export const isWon = (s, ranks) => s.fnd.every((f) => f === ranks);

// Length of the valid alternating run at the top of a column.
export function topRun(col) {
  if (!col.length) return 0;
  let n = 1;
  for (let i = col.length - 1; i > 0; i--) { if (canLink(col[i - 1], col[i])) n++; else break; }
  return n;
}

// The most cards one move can carry to a destination.
export function capacity(s, destEmpty) {
  const cells = s.free.filter((x) => x == null).length;
  let cols = s.cols.filter((c) => !c.length).length;
  if (destEmpty) cols--;
  return (cells + 1) * Math.pow(2, Math.max(0, cols));
}

const fitsHome = (s, card) => s.fnd[suitOf(card)] === rankOf(card) - 1;
export function isSafe(s, card) {
  if (!fitsHome(s, card)) return false;
  const r = rankOf(card);
  if (r <= 2) return true;
  const red = redOf(card);
  for (let su = 0; su < 4; su++) if ((su & 1) !== red && s.fnd[su] < r - 1) return false;
  return true;
}

// Where a card sits right now: the column, its index, and how many cards ride
// with it (itself plus everything on top), or a free cell, or nothing.
export function locate(s, card) {
  for (let i = 0; i < s.cols.length; i++) {
    const k = s.cols[i].indexOf(card);
    if (k >= 0) return { where: 'col', i, k, n: s.cols[i].length - k };
  }
  const fi = s.free.indexOf(card);
  if (fi >= 0) return { where: 'free', i: fi, n: 1 };
  return null;
}

// Can `card` be picked up (with everything on top of it)? Only from the valid
// run at the top of its column, or out of a free cell.
export function canPick(s, card) {
  const loc = locate(s, card);
  if (!loc) return false;
  if (loc.where === 'free') return true;
  return loc.n <= topRun(s.cols[loc.i]);
}

// Legal destinations for the run that starts at `card`, as dest codes.
export function destinations(s, card) {
  const loc = locate(s, card);
  if (!loc || !canPick(s, card)) return [];
  const n = loc.n;
  const out = [];
  if (n === 1 && fitsHome(s, card)) out.push(FND);
  for (let j = 0; j < s.cols.length; j++) {
    if (loc.where === 'col' && loc.i === j) continue;
    const col = s.cols[j];
    if (!col.length) {
      // A whole column into an empty column changes nothing; offering it would
      // only invite a wasted move.
      if (loc.where === 'col' && loc.k === 0) continue;
      if (n <= capacity(s, true)) out.push(j);
    } else if (canLink(col[col.length - 1], card) && n <= capacity(s, false)) out.push(j);
  }
  if (n === 1 && loc.where === 'col' && s.free.some((x) => x == null)) out.push(FREE);
  return out;
}

// Send home everything safe, repeatedly. Returns the cards it moved, in order.
export function autoplay(s) {
  const moved = [];
  for (;;) {
    let hit = false;
    for (let i = 0; i < s.cols.length; i++) {
      const col = s.cols[i];
      if (col.length && isSafe(s, col[col.length - 1])) {
        const c = col.pop(); s.fnd[suitOf(c)] = rankOf(c); moved.push(c); hit = true;
      }
    }
    for (let i = 0; i < s.free.length; i++) {
      const c = s.free[i];
      if (c != null && isSafe(s, c)) { s.free[i] = null; s.fnd[suitOf(c)] = rankOf(c); moved.push(c); hit = true; }
    }
    if (!hit) return moved;
  }
}

// Apply one player move and then safe autoplay. Returns { state, auto } with a
// NEW state, or null if the move is not legal, so an out-of-date saved game can
// never corrupt a board.
export function applyMove(s, mv) {
  const [card, n, dest] = mv;
  const loc = locate(s, card);
  if (!loc || loc.n !== n) return null;
  if (!destinations(s, card).includes(dest)) return null;
  const t = cloneState(s);
  let run;
  if (loc.where === 'col') run = t.cols[loc.i].splice(loc.k);
  else { run = [t.free[loc.i]]; t.free[loc.i] = null; }
  if (dest === FND) t.fnd[suitOf(card)] = rankOf(card);
  else if (dest === FREE) t.free[t.free.indexOf(null)] = run[0];
  else t.cols[dest].push(...run);
  const auto = autoplay(t);
  return { state: t, auto };
}

// The opening position: the deal, with autoplay already run (an ace dealt on
// top goes home before anybody moves, and costs nothing).
export function startState(deal, cells) {
  const s = fromDeal(deal, cells);
  autoplay(s);
  return s;
}

export function replay(deal, cells, moves) {
  let s = startState(deal, cells);
  for (const mv of moves) { const r = applyMove(s, mv); if (!r) return null; s = r.state; }
  return s;
}

// Every legal player move in a position, for the hint and for a dead-board
// check. Runs into an empty column are offered at every legal length.
export function legalMoves(s) {
  const out = [];
  const starts = [];
  for (let i = 0; i < s.cols.length; i++) {
    const col = s.cols[i];
    const run = topRun(col);
    for (let k = col.length - run; k < col.length; k++) starts.push(col[k]);
  }
  for (const c of s.free) if (c != null) starts.push(c);
  for (const card of starts) {
    const n = locate(s, card).n;
    for (const d of destinations(s, card)) out.push([card, n, d]);
  }
  return out;
}

// Seeded PRNG + deal, shared by the generator and the client's nothing (the
// client never deals; the bank carries the deal). Kept here so the generator
// and any tool that re-deals from a seed agree.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function dealFor(rand, ranks, ncols) {
  const deck = [];
  for (let su = 0; su < 4; su++) for (let r = 1; r <= ranks; r++) deck.push(su * 16 + r);
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  const cols = Array.from({ length: ncols }, () => []);
  deck.forEach((c, i) => cols[i % ncols].push(c));
  return cols;
}
