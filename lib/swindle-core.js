// The engine behind Swindle, the daily "White to play and draw" chess puzzle.
//
// THE GAME. White is badly lost. Exactly one White first move saves the game by
// force; every other first move lets Black force checkmate inside a few moves.
// A save is any of the three draws ordinary chess has for the losing side:
//
//   stalemate      the side to move has no legal move and is NOT in check
//   repetition     the same position (same pieces on the same squares, same
//                  side to move) occurs for the THIRD time in the game
//   material       neither side can ever mate: bare kings, or a king and one
//                  bishop or knight against a bare king
//
// The chess rules are IMPORTED from app/mate/chess.js, the engine Mate and
// Defend ship, never copied (no castling, no en passant, a pawn reaching the far
// rank becomes a queen inside applyMove). The forced-mate search is Defend's
// makeMateSearch, read from Black's side of the board.
//
// THIS FILE IS SHARED by scripts/gen-swindle.mjs and app/swindle/SwindleClient.jsx,
// so the Black replies the generator measured are by construction the replies the
// browser plays. scripts/verify-swindle.mjs carries its own searches and checks
// the bank against them.
//
// REPETITION IS PATH-DEPENDENT, so the draw search carries the history with it.
// Only the stretch since the last capture or pawn move matters: neither can be
// undone, so no position before one can ever recur. `hist` is that stretch, an
// array of position keys ending with the current position.

import { legalMoves, applyMove, inCheck, isCheckmate, WHITE, BLACK } from '../app/mate/chess.js';
import { makeMateSearch } from '../app/defend/defense.js';

export { WHITE, BLACK };

// A position key: the placement plus the side to move.
export function posKey(board, turn) {
  let k = turn;
  for (let i = 0; i < 64; i++) { const p = board[i]; if (p) k += i.toString(36) + p; }
  return k;
}

// Bare kings, or a king and ONE bishop or knight against a bare king.
export function insufficient(board) {
  let extra = 0, minor = true;
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (!p || p === 'K' || p === 'k') continue;
    extra++;
    const u = p.toUpperCase();
    if (u !== 'B' && u !== 'N') minor = false;
    if (extra > 1) return false;
  }
  return extra === 0 || minor;
}

// Is the move from -> to irreversible (a capture or a pawn move)? After one, no
// earlier position can recur, so the repetition history starts again.
export function irreversible(board, from, to) {
  return !!board[to] || (board[from] || '').toUpperCase() === 'P';
}

// The history after a move: reset on an irreversible move, otherwise extended.
export function extendHist(hist, board, from, to, next, turnAfter) {
  const k = posKey(next, turnAfter);
  return irreversible(board, from, to) ? [k] : hist.concat([k]);
}

const countIn = (hist, k) => { let c = 0; for (let i = 0; i < hist.length; i++) if (hist[i] === k) c++; return c; };
const maxCount = (hist) => { let m = 0; for (let i = 0; i < hist.length; i++) { const c = countIn(hist, hist[i]); if (c > m) m = c; } return m; };

// Does Black, to move, have a mate in one? The draw search uses it as a cut:
// a White move that walks into a mate in one cannot hold anything. The cut is
// only taken while no position in the stretch has occurred twice, because
// that is what guarantees a repetition cannot land first (a third occurrence
// needs at least six more plies from there, and a mate in one takes one).
function whiteMatesInOne(board) {
  for (const w of legalMoves(board, WHITE)) {
    if (isCheckmate(applyMove(board, w.from, w.to), BLACK)) return true;
  }
  return false;
}
function blackMatesInOne(board) {
  for (const r of legalMoves(board, BLACK)) {
    if (isCheckmate(applyMove(board, r.from, r.to), WHITE)) return true;
  }
  return false;
}

// How the game stands with `turn` to move on `board`, `hist` ending with this
// position. Returns null while play goes on, or one of:
//   'mate'        `turn` is checkmated
//   'stalemate'   `turn` has no legal move and is not in check
//   'material'    neither side can mate
//   'repetition'  this position has now occurred three times
export function conclusion(board, turn, hist) {
  if (!legalMoves(board, turn).length) return inCheck(board, turn) ? 'mate' : 'stalemate';
  if (insufficient(board)) return 'material';
  if (countIn(hist, hist[hist.length - 1]) >= 3) return 'repetition';
  return null;
}

export const isDraw = (c) => c === 'stalemate' || c === 'material' || c === 'repetition';
export const THEME_OF = { stalemate: 'stalemate', material: 'material', repetition: 'perpetual' };


// White's moves in search order: checks, then captures, then the rest, each by
// UCI. Order only decides speed, never a result.
function whiteOrder(board) {
  const ms = legalMoves(board, WHITE).map((m) => {
    const next = applyMove(board, m.from, m.to);
    return { ...m, next, rank: inCheck(next, BLACK) ? 0 : board[m.to] ? 1 : 2 };
  });
  ms.sort((a, b) => a.rank - b.rank || (a.uci < b.uci ? -1 : 1));
  return ms;
}

// The draw search. holds(board, hist, d): White to move on a position that has
// not concluded; can White force a draw (or a mate of its own, which counts as
// a save too) within d more White moves, against every Black reply? A draw that
// lands on Black's reply to White's d-th move is inside the bound.
//
// The memo key carries the history since the last irreversible move, because a
// repetition can only ever be made out of those positions. Each entry keeps the
// shallowest depth proven true and the deepest proven false, since a draw inside
// d is a draw inside d + 1.
export function makeDrawSearch() {
  const memo = new Map();
  let nodes = 0;
  function holds(board, hist, d) {
    if (d <= 0) return false;
    const mk = hist.slice().sort().join(';');
    const ent = memo.get(mk);
    if (ent) {
      if (ent.t !== undefined && d >= ent.t) return true;
      if (ent.f !== undefined && d <= ent.f) return false;
    }
    nodes++;
    let res = false;
    for (const mv of whiteOrder(board)) {
      const h1 = extendHist(hist, board, mv.from, mv.to, mv.next, BLACK);
      const c1 = conclusion(mv.next, BLACK, h1);
      if (c1) { res = true; break; }                 // a draw or White's own mate
      if (maxCount(h1) <= 1 && blackMatesInOne(mv.next)) continue;
      let all = true;
      for (const r of legalMoves(mv.next, BLACK)) {
        const nb = applyMove(mv.next, r.from, r.to);
        const h2 = extendHist(h1, mv.next, r.from, r.to, nb, WHITE);
        const c2 = conclusion(nb, WHITE, h2);
        if (c2 === 'mate') { all = false; break; }
        if (c2) continue;
        if (!holds(nb, h2, d - 1)) { all = false; break; }
      }
      if (all) { res = true; break; }
    }
    const e = memo.get(mk) || {};
    if (res) e.t = e.t === undefined ? d : Math.min(e.t, d);
    else e.f = e.f === undefined ? d : Math.max(e.f, d);
    memo.set(mk, e);
    return res;
  }
  // The fewest White moves that force the draw, or Infinity past `cap`.
  function drawIn(board, hist, cap) {
    for (let d = 1; d <= cap; d++) if (holds(board, hist, d)) return d;
    return Infinity;
  }
  return { holds, drawIn, nodes: () => nodes };
}

// The cap on Black's own mate search. Every losing first move in the bank is a
// forced mate in this many Black moves or fewer, which the verifier proves, so
// the defence always finds it.
export const MATE_CAP = 3;

// How far ahead the defence looks for a draw White could force, in White moves.
// It is deliberately short: the replies on the drawing lines are stored in the
// bank, so the browser only ever runs this off them, where it has to answer
// inside a reply timeout on a phone.
export const DEF_HORIZON = 2;

// BLACK'S REPLY, the one defence every player meets.
//
// Black to move on a position that has not concluded, `hist` ending with it,
// `left` = White moves still in the budget.
//   1. If Black can force mate within MATE_CAP, it plays the SHORTEST mate, the
//      first such move by UCI. The distance falls every move, so it lands.
//   2. Otherwise every reply is scored by how soon White can force a draw after
//      it, looking DEF_HORIZON White moves ahead (never past the budget): 0 if
//      the reply itself draws, the horizon + 1 if no draw is in sight, and -1
//      if it lets White mate at once (a mate is worse than any draw). Black
//      plays the reply that puts the draw furthest off, then the one that wins
//      the most material, then the lowest UCI, which cannot tie.
// The bank stores this function's answer for every position on a drawing line,
// computed here, so the stored reply and the live one are the same program.
//
// Values live inside the function so the verifier can read it in one place.
export function blackDefence(board, hist, left, searches) {
  const s = searches || {};
  const mate = s.mate || makeMateSearch();
  const draw = s.draw || makeDrawSearch();
  const VAL = { q: 9, r: 5, b: 3, n: 3, p: 1 };
  const moves = legalMoves(board, BLACK).slice().sort((a, b) => (a.uci < b.uci ? -1 : 1));
  if (!moves.length) return null;
  for (let n = 1; n <= MATE_CAP; n++) {
    if (!mate.forcesMateWithin(board, BLACK, n)) continue;
    for (const mv of moves) {
      const next = applyMove(board, mv.from, mv.to);
      const replies = legalMoves(next, WHITE);
      if (!replies.length) { if (inCheck(next, WHITE)) return { uci: mv.uci, from: mv.from, to: mv.to, mateIn: n }; continue; }
      if (n === 1) continue;
      let forced = true;
      for (const r of replies) {
        if (!mate.forcesMateWithin(applyMove(next, r.from, r.to), BLACK, n - 1)) { forced = false; break; }
      }
      if (forced) return { uci: mv.uci, from: mv.from, to: mv.to, mateIn: n };
    }
  }
  const cap = Math.max(0, Math.min(left, DEF_HORIZON));
  let best = null;
  for (const mv of moves) {
    const next = applyMove(board, mv.from, mv.to);
    const h = extendHist(hist, board, mv.from, mv.to, next, WHITE);
    const c = conclusion(next, WHITE, h);
    let dd;
    if (c) dd = 0;                                   // a draw on the spot (a mate was found above)
    else if (whiteMatesInOne(next)) dd = -1;         // walking into mate is worse than any draw
    else { const v = draw.drawIn(next, h, cap); dd = v === Infinity ? cap + 1 : v; }
    const gain = VAL[String(board[mv.to] || '').toLowerCase()] || 0;
    const better = !best || dd > best.dd || (dd === best.dd && gain > best.gain);
    if (better) best = { uci: mv.uci, from: mv.from, to: mv.to, dd, gain };
  }
  return { uci: best.uci, from: best.from, to: best.to, drawIn: best.dd };
}

// WALKING THE BOOK. The bank stores, per board, every line on which White keeps
// the draw: `book` maps each holding White move to [blackReply, nextBook], with
// nextBook absent where the reply ends the game, and 0 where White's own move
// ends it. bookStep(node, uci) returns { hold, reply, next }: hold is false the
// moment a White move is not one of the node's holding moves, and from then on
// the walk is off the book for good (node null).
export function bookStep(node, uci) {
  if (!node || !Object.prototype.hasOwnProperty.call(node, uci)) return { hold: false, reply: null, next: null };
  const e = node[uci];
  if (!e) return { hold: true, reply: null, next: null };
  return { hold: true, reply: e[0], next: e[1] || null };
}
