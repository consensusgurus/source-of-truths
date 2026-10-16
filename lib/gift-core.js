// The engine behind Gift, the daily Quarto endgame.
//
// THE GAME. Sixteen pieces, each with four traits: tall or short, light or
// dark, round or square, hollow or solid. Every piece is unique. A turn has two
// halves: you place the piece your opponent handed you on any empty square of
// the 4x4 board, and if that did not win, you choose one of the pieces still
// off the board and hand it to your opponent, who does the same. Four pieces in
// a row, a column or one of the two long diagonals that share ANY one trait win
// for whoever placed the fourth. A full board with no such line is a draw.
//
// A PIECE is a number 0..15, one bit per trait:
//   bit 0 (1)  tall      (clear: short)
//   bit 1 (2)  dark      (clear: light)
//   bit 2 (4)  square    (clear: round)
//   bit 3 (8)  hollow    (clear: solid)
// A board is an array of 16 squares, row by row from the top left, each a piece
// or -1 for empty.
//
// THE PUZZLE. The player is handed a piece on a part-filled board and must
// force a win on their Nth placement at the latest against perfect defence.
// Exactly ONE first move (a square for the gift plus the piece handed back)
// forces a win at all; every other first move loses or draws.
//
// THIS FILE IS SHARED by scripts/gen-gift.mjs and app/gift/GiftClient.jsx, so
// the defence the generator measured is by construction the defence the
// browser plays. scripts/verify-gift.mjs carries its own solver and checks the
// bank against it, sharing no code with this file.

export const LINES = [
  [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15],
  [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15],
  [0, 5, 10, 15], [3, 6, 9, 12],
];
// The lines through each square.
export const LINES_AT = Array.from({ length: 16 }, (_, s) => LINES.filter((l) => l.includes(s)));

export const TRAITS = [
  ['tall', 'short'], ['dark', 'light'], ['square', 'round'], ['hollow', 'solid'],
];
// 'tall, dark, square, hollow'
export function pieceName(p) {
  return [0, 1, 2, 3].map((b) => TRAITS[b][(p >> b) & 1 ? 0 : 1]).join(', ');
}
export function pieceShort(p) {
  return ((p & 1) ? 'T' : 'S') + ((p & 2) ? 'D' : 'L') + ((p & 4) ? 'Q' : 'R') + ((p & 8) ? 'H' : 'O');
}
export function parsePiece(code) {
  const c = String(code).toUpperCase();
  return (c[0] === 'T' ? 1 : 0) | (c[1] === 'D' ? 2 : 0) | (c[2] === 'Q' ? 4 : 0) | (c[3] === 'H' ? 8 : 0);
}

// The traits four pieces share, as a bitmask over both polarities: low nibble
// = traits all four HAVE, high nibble = traits all four LACK. Zero = no shared
// trait.
export function sharedOf(ps) {
  let a = 15, b = 15;
  for (const p of ps) { a &= p; b &= ~p & 15; }
  return a | (b << 4);
}

// Does the line through square s complete with a shared trait? (The square
// must already hold its piece.)
export function winsAt(board, s) {
  for (const l of LINES_AT[s]) {
    const ps = [board[l[0]], board[l[1]], board[l[2]], board[l[3]]];
    if (ps.some((p) => p < 0)) continue;
    if (sharedOf(ps)) return true;
  }
  return false;
}
// Every winning line on the board (for the finish highlight).
export function winningLines(board) {
  return LINES.filter((l) => l.every((s) => board[s] >= 0) && sharedOf(l.map((s) => board[s])));
}

// Would piece p win if placed on empty square s?
export function winsWith(board, s, p) {
  for (const l of LINES_AT[s]) {
    let a = p, b = ~p & 15, full = true;
    for (const t of l) {
      if (t === s) continue;
      const q = board[t];
      if (q < 0) { full = false; break; }
      a &= q; b &= ~q & 15;
    }
    if (full && (a | b)) return true;
  }
  return false;
}
// The square piece p wins on, or -1.
export function winSquare(board, p) {
  for (let s = 0; s < 16; s++) if (board[s] < 0 && winsWith(board, s, p)) return s;
  return -1;
}

export const empties = (board) => { const e = []; for (let s = 0; s < 16; s++) if (board[s] < 0) e.push(s); return e; };
// The pieces still off the board, not counting the one in hand.
export function poolOf(board, hand) {
  const used = new Set(board.filter((p) => p >= 0));
  if (hand >= 0) used.add(hand);
  const out = [];
  for (let p = 0; p < 16; p++) if (!used.has(p)) out.push(p);
  return out;
}

// VALUES, always from the side to move (the side holding `hand`, about to
// place it):
//    n > 0   the side to move wins on its own n-th placement from here
//    0       a draw with best play
//   -n < 0   the side to move loses: the other side wins on ITS n-th placement
// Better for the side to move: a win sooner, then a draw, then a loss later.
export const better = (a, b) => {
  if (a > 0 || b > 0) { if (a > 0 && b > 0) return a < b; return a > 0; }
  if (a === 0 || b === 0) return a === 0 && b !== 0;
  return a < b; // both losses: -5 beats -2
};
// A child value (the opponent's, after our hand-over) read from our side.
export const flip = (v) => (v > 0 ? -v : v < 0 ? -v + 1 : 0);

// The solver. One instance carries a memo; reuse it across calls on the same
// day's board. It answers two bounded questions with cut-offs, which is what
// keeps it fast enough for a phone:
//   win(board, hand, n)   can the side to move force a win on its own n-th
//                         placement or sooner?
//   lose(board, hand, m)  must the side to move lose, the other side winning
//                         on ITS m-th placement or sooner, whatever it does?
// and builds exact values out of them. Each memo entry keeps the smallest
// depth proven true and the largest proven false, since a win inside n is a
// win inside n + 1.
export const HORIZON = 9; // more placements than any position here can hold
export function makeSolver() {
  const memoW = new Map();
  const memoL = new Map();
  let nodes = 0;
  const keyOf = (board, hand) => {
    let k = '';
    for (let s = 0; s < 16; s++) k += String.fromCharCode(66 + board[s]);
    return k + String.fromCharCode(66 + hand);
  };
  const look = (memo, k, n) => {
    const e = memo.get(k);
    if (!e) return undefined;
    if (e.t !== undefined && n >= e.t) return true;
    if (e.f !== undefined && n <= e.f) return false;
    return undefined;
  };
  const save = (memo, k, n, r) => {
    let e = memo.get(k);
    if (!e) { e = {}; memo.set(k, e); }
    if (r) { if (e.t === undefined || n < e.t) e.t = n; }
    else if (e.f === undefined || n > e.f) e.f = n;
  };
  // Does piece g win anywhere on board?
  const winsAnywhere = (board, g) => {
    for (let t = 0; t < 16; t++) if (board[t] < 0 && winsWith(board, t, g)) return true;
    return false;
  };
  function win(board, hand, n) {
    if (n <= 0) return false;
    const k = keyOf(board, hand);
    const c = look(memoW, k, n);
    if (c !== undefined) return c;
    nodes++;
    const es = empties(board);
    let res = false;
    for (const s of es) if (winsWith(board, s, hand)) { res = true; break; }
    if (!res && n >= 2 && es.length > 1) {
      const pool = poolOf(board, hand);
      outer: for (const s of es) {
        board[s] = hand;
        for (const g of pool) {
          if (winsAnywhere(board, g)) continue;
          if (lose(board, g, n - 1)) { res = true; board[s] = -1; break outer; }
        }
        board[s] = -1;
      }
    }
    save(memoW, k, n, res);
    return res;
  }
  function lose(board, hand, m) {
    if (m <= 0) return false;
    const k = keyOf(board, hand);
    const c = look(memoL, k, m);
    if (c !== undefined) return c;
    nodes++;
    const es = empties(board);
    let res = true;
    if (es.length <= 1) res = false; // the last square: a win or a draw, never a loss
    else {
      for (const s of es) if (winsWith(board, s, hand)) { res = false; break; }
    }
    if (res) {
      const pool = poolOf(board, hand);
      outer: for (const s of es) {
        board[s] = hand;
        // The other side wins whatever we hand over, on its m-th placement at worst.
        for (const g of pool) {
          if (winsAnywhere(board, g)) continue; // they win on their first
          if (!win(board, g, m)) { res = false; board[s] = -1; break outer; }
        }
        board[s] = -1;
      }
    }
    save(memoL, k, m, res);
    return res;
  }
  // The exact value of a position, side to move holding `hand`.
  function value(board, hand) {
    const b = board.slice();
    for (let n = 1; n <= HORIZON; n++) if (win(b, hand, n)) return n;
    if (!lose(b, hand, HORIZON)) return 0;
    for (let m = 1; m <= HORIZON; m++) if (lose(b, hand, m)) return -m;
    return 0;
  }
  // The value of one first move (place hand on s, hand over g), mover's side.
  function moveValue(board, hand, s, g) {
    const b = board.slice();
    if (winsWith(b, s, hand)) return 1;
    b[s] = hand;
    if (!b.includes(-1)) return 0;
    if (winsAnywhere(b, g)) return -1;
    return flip(value(b, g));
  }
  // Every first move from a position, with its value from the mover's side:
  // [{ sq, give, v }]. give is -1 when the placement wins or fills the board.
  function moves(board, hand) {
    const out = [];
    const b = board.slice();
    for (const s of empties(b)) {
      if (winsWith(b, s, hand)) { out.push({ sq: s, give: -1, v: 1 }); continue; }
      b[s] = hand;
      const full = !b.includes(-1);
      const pool = poolOf(b, hand);
      b[s] = -1;
      if (full) { out.push({ sq: s, give: -1, v: 0 }); continue; }
      for (const g of pool) out.push({ sq: s, give: g, v: moveValue(b, hand, s, g) });
    }
    return out;
  }
  // Does this first move still force a win (on any later placement)?
  function moveWins(board, hand, s, g) {
    const b = board.slice();
    if (winsWith(b, s, hand)) return true;
    b[s] = hand;
    if (!b.includes(-1) || g < 0) return false;
    if (winsAnywhere(b, g)) return false;
    return lose(b, g, HORIZON);
  }
  return { win, lose, value, moves, moveValue, moveWins, nodes: () => nodes, size: () => memoW.size + memoL.size };
}

// The opponent's reply, deterministic: the best move by value (win soonest,
// else draw, else lose as late as possible), ties broken by the lowest square
// then the lowest piece handed over, so everybody who plays a line meets the
// same replies. Built on the bounded questions rather than an exact value per
// move, which is what keeps a reply quick on a phone. Returns { sq, give, v };
// give is -1 when the placement ends the game.
export function reply(solver, board, hand) {
  const v = solver.value(board, hand);
  const b = board.slice();
  const anywhere = (bd, g) => { for (let t = 0; t < 16; t++) if (bd[t] < 0 && winsWith(bd, t, g)) return true; return false; };
  for (const s of empties(b)) {
    if (winsWith(b, s, hand)) { if (v === 1) return { sq: s, give: -1, v }; continue; }
    b[s] = hand;
    if (!b.includes(-1)) { b[s] = -1; if (v === 0) return { sq: s, give: -1, v }; continue; }
    for (const g of poolOf(b, hand)) {
      let ok;
      if (anywhere(b, g)) ok = v === -1;
      else if (v > 0) ok = v >= 2 && solver.lose(b, g, v - 1);
      else if (v === 0) ok = !solver.win(b, g, HORIZON);
      else ok = !solver.win(b, g, -v - 1);
      if (ok) { b[s] = -1; return { sq: s, give: g, v }; }
    }
    b[s] = -1;
  }
  return null;
}

// The state after placing `hand` on sq: { board, over: 'win'|'draw'|null }.
export function place(board, sq, hand) {
  const b = board.slice();
  b[sq] = hand;
  if (winsAt(b, sq)) return { board: b, over: 'win' };
  if (!b.includes(-1)) return { board: b, over: 'draw' };
  return { board: b, over: null };
}

// Board string <-> array: 16 four-letter codes or '....', joined by spaces.
export function encodeBoard(board) {
  return board.map((p) => (p < 0 ? '....' : pieceShort(p))).join(' ');
}
export function decodeBoard(str) {
  return str.trim().split(/\s+/).map((c) => (c === '....' ? -1 : parsePiece(c)));
}
