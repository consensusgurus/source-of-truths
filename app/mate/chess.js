// A deliberately small chess core for Mate, the daily mate-in-N puzzle.
//
// SCOPE, AND WHY IT IS SAFE TO BE THIS SMALL. Every position in the bank is
// generated under two structural guarantees, asserted by the bank's verifier
// (scripts/verify-mate) before a board can ship:
//
//   1. Castling rights are always '-'. No position in the bank has them, so
//      castling is never a legal move and is not implemented.
//   2. No pawn of either colour ever stands on its home rank (rank 2 for White,
//      rank 7 for Black), so a two square pawn push is never legal, so an en
//      passant capture can never arise. Neither is implemented.
//
// PROMOTION IS NOT ON THAT LIST, AND USED TO BE. The third guarantee this file
// once claimed read: no pawn stands on rank 7 (White) or rank 2 (Black), and the
// solution is at most three White moves deep, so no pawn can reach the far rank.
// The arithmetic in that sentence is wrong. A White pawn on rank SIX reaches
// rank 8 in two moves, which is the whole of a weekday budget, and the
// 2026-09-09 board (k7/2b5/K2PB3/2p1B3/8/8/8/8, pawn on d6) is exactly that:
// after the key 1.dxc7 c4, both 2.Bd5# (the banked mate) and 2.c8=Q# end the
// game. A player found the queen, this engine walked a PAWN onto c8, nothing was
// check, the budget ran out and the round was scored a loss (player report,
// 2026-09-09). Ten of the 124 banked boards can reach a promotion inside their
// budget, and thirteen of Defend's 112 can, all but one of those with the
// player's own pawn.
//
// So a pawn that reaches the far rank becomes a QUEEN, for both colours, in
// applyMove, which is the one place every move on this board passes through: it
// is what keeps move generation, attack detection, checkmate and SAN from having
// to be told separately and disagreeing. Underpromotion is not offered. The
// queen is the strongest choice except in the rare position where a rook dodges
// stalemate or a knight forks, and verify-mate's check 9 walks every position
// reachable inside each board's budget to prove no such position is on offer to
// the player. A board that needed a knight fails the verifier rather than lying
// to whoever plays it.
//
// Everything else is full, ordinary chess: sliding pieces, knights, kings,
// single pawn pushes, diagonal pawn captures, pins, check, and checkmate. Legal
// move generation is pseudo-legal generation filtered by "does this leave my own
// king attacked", which is slow and obviously correct, and the boards here are
// tiny (nine pieces at most).
//
// Squares are 0..63 with 0 = a8 and 63 = h1, i.e. index = row * 8 + file where
// row 0 is the eighth rank. That matches both FEN's reading order and the order
// the board is drawn on screen, so no coordinate flipping is needed anywhere.
//
// Moves are UCI strings ("d1h5"), the same notation the puzzle bank stores, so a
// move can be compared to the solution tree by string equality.

export const WHITE = 'w';
export const BLACK = 'b';

const ROOK_DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const BISHOP_DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const QUEEN_DIRS = ROOK_DIRS.concat(BISHOP_DIRS);
const KNIGHT_HOPS = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];

const isWhitePiece = (p) => !!p && p === p.toUpperCase();
export const colorOf = (p) => (p ? (isWhitePiece(p) ? WHITE : BLACK) : null);
export const rowOf = (sq) => sq >> 3;
export const fileOf = (sq) => sq & 7;
const onBoard = (r, f) => r >= 0 && r < 8 && f >= 0 && f < 8;
const at = (r, f) => r * 8 + f;

// "e4" <-> 28. Rank 8 is row 0, so the rank digit is 8 - row.
export function squareName(sq) {
  return String.fromCharCode(97 + fileOf(sq)) + String(8 - rowOf(sq));
}
export function squareFromName(name) {
  return at(8 - Number(name[1]), name.charCodeAt(0) - 97);
}
export const uci = (from, to) => squareName(from) + squareName(to);
export function parseUci(move) {
  return { from: squareFromName(move.slice(0, 2)), to: squareFromName(move.slice(2, 4)) };
}

// Only the placement field and the side to move are read: castling and en
// passant are always '-' in this bank (see the header), so there is nothing else
// to carry.
export function parseFen(fen) {
  const parts = String(fen).trim().split(/\s+/);
  const board = new Array(64).fill(null);
  let sq = 0;
  for (const ch of parts[0]) {
    if (ch === '/') continue;
    if (ch >= '1' && ch <= '8') sq += Number(ch);
    else board[sq++] = ch;
  }
  return { board, turn: parts[1] === 'b' ? BLACK : WHITE };
}

// The far rank for a colour: row 0 (rank 8) for White, row 7 (rank 1) for Black.
const lastRow = (color) => (color === WHITE ? 0 : 7);

// The piece a move puts on `to`, which is the moving piece itself unless it is a
// pawn arriving on the far rank, in which case it is that colour's queen. Used
// by applyMove; exported so the board can flag the square that just promoted.
export function promotionPiece(board, from, to) {
  const piece = board[from];
  if (!piece || piece.toUpperCase() !== 'P') return null;
  const me = colorOf(piece);
  if (rowOf(to) !== lastRow(me)) return null;
  return me === WHITE ? 'Q' : 'q';
}

// EVERY move on this board goes through here, including the ones the search
// makes and unmakes thousands of times, so promoting here is what keeps move
// generation, attack detection, checkmate and SAN from ever disagreeing about
// what stands on the far rank.
export function applyMove(board, from, to) {
  const next = board.slice();
  next[to] = promotionPiece(board, from, to) || next[from];
  next[from] = null;
  return next;
}

// Squares a piece could move to ignoring check. Used for both move generation
// and attack detection, so the two can never disagree about how a piece moves.
function pseudoTargets(board, sq, forAttackOnly) {
  const piece = board[sq];
  if (!piece) return [];
  const me = colorOf(piece);
  const kind = piece.toUpperCase();
  const r = rowOf(sq), f = fileOf(sq);
  const out = [];

  const slide = (dirs) => {
    for (const [dr, df] of dirs) {
      let rr = r + dr, ff = f + df;
      while (onBoard(rr, ff)) {
        const t = at(rr, ff);
        const occ = board[t];
        if (!occ) out.push(t);
        else { if (colorOf(occ) !== me) out.push(t); break; }
        rr += dr; ff += df;
      }
    }
  };
  const step = (hops) => {
    for (const [dr, df] of hops) {
      const rr = r + dr, ff = f + df;
      if (!onBoard(rr, ff)) continue;
      const t = at(rr, ff);
      if (!board[t] || colorOf(board[t]) !== me) out.push(t);
    }
  };

  if (kind === 'R') slide(ROOK_DIRS);
  else if (kind === 'B') slide(BISHOP_DIRS);
  else if (kind === 'Q') slide(QUEEN_DIRS);
  else if (kind === 'N') step(KNIGHT_HOPS);
  else if (kind === 'K') step(QUEEN_DIRS);
  else if (kind === 'P') {
    // White pawns move toward row 0, black pawns toward row 7. Single push only
    // (guarantee 2 in the header). A push is not an attack, so it is skipped
    // when this is called for attack detection.
    const dr = me === WHITE ? -1 : 1;
    if (!forAttackOnly) {
      const rr = r + dr;
      if (onBoard(rr, f) && !board[at(rr, f)]) out.push(at(rr, f));
    }
    for (const df of [-1, 1]) {
      const rr = r + dr, ff = f + df;
      if (!onBoard(rr, ff)) continue;
      const t = at(rr, ff);
      // For attack detection a diagonal counts whether or not it is occupied:
      // it is a square the pawn controls, which is what king safety cares about.
      if (forAttackOnly) out.push(t);
      else if (board[t] && colorOf(board[t]) !== me) out.push(t);
    }
  }
  return out;
}

export function isAttacked(board, sq, byColor) {
  for (let s = 0; s < 64; s++) {
    const p = board[s];
    if (!p || colorOf(p) !== byColor) continue;
    const targets = pseudoTargets(board, s, true);
    for (let i = 0; i < targets.length; i++) if (targets[i] === sq) return true;
  }
  return false;
}

export function kingSquare(board, color) {
  const want = color === WHITE ? 'K' : 'k';
  for (let s = 0; s < 64; s++) if (board[s] === want) return s;
  return -1;
}

export function inCheck(board, color) {
  const k = kingSquare(board, color);
  if (k < 0) return false;
  return isAttacked(board, k, color === WHITE ? BLACK : WHITE);
}

// Every legal move for `color`, as { from, to, uci }. Pseudo-legal moves are
// filtered by playing them and asking whether the mover's own king is attacked,
// which handles pins, discovered checks and king walks in one rule.
export function legalMoves(board, color) {
  const out = [];
  for (let s = 0; s < 64; s++) {
    const p = board[s];
    if (!p || colorOf(p) !== color) continue;
    for (const t of pseudoTargets(board, s, false)) {
      const next = applyMove(board, s, t);
      if (!inCheck(next, color)) out.push({ from: s, to: t, uci: uci(s, t) });
    }
  }
  return out;
}

// Legal destinations for one piece, for the tap-a-piece-then-tap-a-square board.
export function legalTargetsFrom(board, color, from) {
  const p = board[from];
  if (!p || colorOf(p) !== color) return [];
  return legalMoves(board, color).filter((m) => m.from === from).map((m) => m.to);
}

export const isCheckmate = (board, color) => inCheck(board, color) && legalMoves(board, color).length === 0;
export const isStalemate = (board, color) => !inCheck(board, color) && legalMoves(board, color).length === 0;

// Standard algebraic notation, for the move list and the solution reveal. Only
// the cases this bank can produce are handled (no castling or en passant;
// promotion is always to a queen and is written "=Q"), and disambiguation
// follows the usual file-then-rank-then-both rule.
export function toSan(board, from, to) {
  const piece = board[from];
  if (!piece) return uci(from, to);
  const me = colorOf(piece);
  const kind = piece.toUpperCase();
  const capture = !!board[to];
  const next = applyMove(board, from, to);
  const them = me === WHITE ? BLACK : WHITE;
  const suffix = isCheckmate(next, them) ? '#' : (inCheck(next, them) ? '+' : '');

  if (kind === 'P') {
    const body = capture ? `${squareName(from)[0]}x${squareName(to)}` : squareName(to);
    const promo = promotionPiece(board, from, to) ? '=Q' : '';
    return body + promo + suffix;
  }
  // Which same-kind pieces could also legally reach `to`?
  const rivals = legalMoves(board, me).filter(
    (m) => m.to === to && m.from !== from && board[m.from] && board[m.from].toUpperCase() === kind
  );
  let disamb = '';
  if (rivals.length) {
    const sameFile = rivals.some((m) => fileOf(m.from) === fileOf(from));
    const sameRank = rivals.some((m) => rowOf(m.from) === rowOf(from));
    if (!sameFile) disamb = squareName(from)[0];
    else if (!sameRank) disamb = squareName(from)[1];
    else disamb = squareName(from);
  }
  return `${kind}${disamb}${capture ? 'x' : ''}${squareName(to)}${suffix}`;
}
