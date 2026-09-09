// The defensive search behind Defend, the daily chess save.
//
// Mate asks "which move forces mate". Defend asks the mirror question, "which
// move avoids one", so it needs the same forced-mate search read from the other
// side of the board. All chess rules come from ../mate/chess.js, which is
// IMPORTED rather than copied: this is the same engine Mate ships, cross-checked
// against python-chess over 460,652 positions, and a forked copy would be one
// more mirror to keep in sync for no gain.
//
// Two things live here, and both the bank generator (scripts/gen-defend.mjs) and
// the client (DefendClient.jsx) use THIS module rather than their own copy, so
// the reply stored in the bank is by construction the reply the browser plays:
//
//   forcesMateWithin(board, color, n)  does `color`, to move, have a move that
//                                      forces checkmate within n of its own
//                                      moves against every reply?
//   stubbornestReply(board, remaining) White's hardest try, chosen so every
//                                      player faces the SAME defence.
//
// The engine's structural guarantees (no castling, no en passant) hold here for
// the same reason they hold in Mate: the bank asserts them, and
// scripts/verify-defend.mjs refuses to pass a board that breaks one. Promotion
// is not among them -- a pawn that reaches the far rank becomes a queen, in both
// searches here, because it does so in applyMove.

import { legalMoves, applyMove, isCheckmate, inCheck, WHITE, BLACK } from '../mate/chess.js';

// A compact, allocation-light board fingerprint for the memo table. Position
// alone is not enough: the same board with a different remaining budget is a
// different question, so the caller folds those in.
function boardKey(board) {
  let k = '';
  for (let i = 0; i < 64; i++) { const p = board[i]; if (p) k += i.toString(36) + p; }
  return k;
}

// A search with its own memo table. Create one per decision: the table is only
// worth sharing across the many probes that answer a single question, and a
// long-lived one would grow without bound over a session.
export function makeMateSearch() {
  const memo = new Map();

  // Does `color`, to move, force checkmate within `n` of its own moves? A
  // position where the side to move has no legal move is NOT a mate for the
  // attacker: it is stalemate, a draw, and for Defend a draw is a save, so it
  // has to be counted as a failure to mate rather than as a win.
  function forcesMateWithin(board, color, n) {
    if (n <= 0) return false;
    const key = `${boardKey(board)}|${color}|${n}`;
    const hit = memo.get(key);
    if (hit !== undefined) return hit;
    const opp = color === WHITE ? BLACK : WHITE;
    let result = false;
    for (const mv of legalMoves(board, color)) {
      const next = applyMove(board, mv.from, mv.to);
      if (isCheckmate(next, opp)) { result = true; break; }
      if (n === 1) continue;
      const replies = legalMoves(next, opp);
      if (!replies.length) continue;           // stalemate, so no mate down this line
      let forced = true;
      for (const r of replies) {
        if (!forcesMateWithin(applyMove(next, r.from, r.to), color, n - 1)) { forced = false; break; }
      }
      if (forced) { result = true; break; }
    }
    memo.set(key, result);
    return result;
  }

  // Which of `color`'s legal moves individually force mate within n. Used to
  // show a player the move that punished them, without ever naming the move
  // that would have saved them.
  function matingMoves(board, color, n) {
    const opp = color === WHITE ? BLACK : WHITE;
    const out = [];
    for (const mv of legalMoves(board, color)) {
      const next = applyMove(board, mv.from, mv.to);
      if (isCheckmate(next, opp)) { out.push(mv); continue; }
      if (n === 1) continue;
      const replies = legalMoves(next, opp);
      if (!replies.length) continue;
      let forced = true;
      for (const r of replies) {
        if (!forcesMateWithin(applyMove(next, r.from, r.to), color, n - 1)) { forced = false; break; }
      }
      if (forced) out.push(mv);
    }
    return out;
  }

  return { forcesMateWithin, matingMoves };
}

// White's stubbornest try from a position it can no longer force mate in.
//
// "Stubbornest" is the move that leaves Black the FEWEST saving replies, which
// is the only sense in which an attacker with no forced mate left can still
// make life hard. Every player must face the same defence or the leaderboard is
// not comparing like with like, so the choice is fully deterministic: fewest
// saving replies first, then a check ahead of a quiet move, then the lowest UCI
// string, which can never tie.
//
// THE STALEMATE TRAP IS THE REASON THIS IS NOT A ONE LINE MIN. A White move that
// leaves Black with no legal move at all scores zero saving replies and would
// win the comparison outright, but Black is not in check there (White has no
// mate), so it is stalemate, a draw, and a draw is a SAVE. Scoring it Infinity
// is what stops the engine from handing the player the game.
export function stubbornestReply(board, remaining, search) {
  const s = search || makeMateSearch();
  let best = null;
  for (const mv of legalMoves(board, WHITE)) {
    const next = applyMove(board, mv.from, mv.to);
    const replies = legalMoves(next, BLACK);
    let saving;
    if (!replies.length) saving = Infinity;   // stalemate or self-mate: never play it
    else {
      saving = 0;
      for (const r of replies) {
        if (!s.forcesMateWithin(applyMove(next, r.from, r.to), WHITE, remaining - 1)) saving++;
      }
      if (saving === 0) saving = Infinity;    // cannot happen from a drawn root, but never hand over a mate
    }
    const cand = { uci: mv.uci, from: mv.from, to: mv.to, saving, check: inCheck(next, BLACK) ? 0 : 1 };
    if (!best) { best = cand; continue; }
    if (cand.saving !== best.saving) { if (cand.saving < best.saving) best = cand; continue; }
    if (cand.check !== best.check) { if (cand.check < best.check) best = cand; continue; }
    if (cand.uci < best.uci) best = cand;
  }
  return best;
}
