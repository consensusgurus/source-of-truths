// Verify the Mate (daily chess mate-in-N) bank. Mate's own header comment
// (app/mate/puzzles.js) and its client's rules copy (MateClient.jsx) promise,
// per puzzle:
//   - White to move, forced checkmate in EXACTLY `mateIn` moves (weekdays
//     mate in 2, Sundays a mate-in-3 Edition), never fewer;
//   - EXACTLY ONE first move forces it ("verified twice, by two independent
//     solvers");
//   - the structural guarantees the game's own tiny engine (app/mate/chess.js)
//     relies on to skip castling and en passant: castling rights always '-',
//     and no pawn of either colour on rank 1, 2, 7 or 8, which covers the home
//     rank (so no two-square push, so no en passant) and the far rank (so no
//     board opens with a pawn that should already have promoted).
// None of that was previously machine-checked, and the game's own chess.js
// gives every primitive needed (legal move generation, checkmate detection,
// SAN) to recompute it independently rather than trust the stored tree.
//
//   1. FEN structural: side to move is 'w'; castling and en passant fields
//      are '-'; no pawn ('P'/'p') stands on rank 1, 2, 7, or 8; exactly one
//      white king and one black king are on the board.
//   2. Full independent mate-in-N search (ignoring the puzzle's own stored
//      `solution` tree entirely): among White's legal first moves, EXACTLY
//      ONE forces checkmate within `mateIn` White moves against every Black
//      defense, and it must be `solution.key`. AND no White move forces mate
//      within `mateIn - 1` moves at all (rules out "mate in fewer", the
//      "never fewer" promise) -- both proven by the same recursive
//      forced-mate search, memoized on (board, side, moves-left).
//   3. `keySan` matches chess.js's own toSan() for the key move (catches a
//      stale/typo'd display string independent of the move being correct).
//   4. `sunday` implies mateIn===3, non-Sunday implies mateIn===2; `sunday`
//      must also match the real day-of-week of `live`.
//   5. num/quizId/live/dateLabel are mutually consistent and sequential.
//   6. No duplicate boards (identical FEN).
//   7. Pool variety: `motif` is reader-facing flavor text revealed after the
//      solve. The SAME exact motif string is not allowed to repeat more than
//      MOTIF_CEILING times across the whole bank (the shipped bank currently
//      reuses one motif string 4 times, which is exactly the kind of
//      copy-paste this check exists to catch), enforced hard for boards live
//      on or after MATE_FLOOR_FROM and grandfathered as a note before that.
//   8. US spelling: `motif` strings are scanned for obvious British word
//      forms.
//   9. QUEEN IS NEVER THE WRONG PROMOTION FOR THE PLAYER. chess.js promotes a
//      pawn that reaches the far rank to a queen and offers no choice (its
//      header says why). This walks EVERY position a player can reach inside
//      the board's budget -- White's `mateIn` moves and Black's `mateIn - 1`
//      answers, all legal moves, not just the solution tree -- with a second,
//      fully promotion-aware engine written here, and judges every pawn move
//      onto the far rank against all four pieces.
//
//      The two sides of that are not the same kind of problem, so they are not
//      reported the same way:
//
//      WHITE is the player, and this FAILS. If a rook, bishop or knight would
//      mate where the queen the engine hands over does not, the game refuses a
//      mate the player really found, which is the whole reason this check
//      exists. No board in the bank does it.
//
//      BLACK is the machine, and this is a NOTE. A promotion the queen
//      underrates only makes Black's defence weaker than perfect play, so the
//      worst it can do is let a player who has ALREADY left the winning line
//      mate in a position where flawless defence would have held. It never
//      takes a mate away from someone who found one. The 2026-09-20 board has
//      exactly this: in several off-key lines Black's pawn survives as a knight
//      and dies as a queen. Closing it means giving the engine all four pieces
//      to search, in app/mate/chess.js and app/defend/defense.js, which changes
//      the move format both banks are stored in; the note is here so that stays
//      a decision rather than a surprise.
//
//      This check exists because the guarantee it replaces was arithmetically
//      wrong. The old one read "no pawn on rank 7, and the solution is at most
//      three moves deep, so no pawn can reach the far rank" -- but a pawn on
//      rank SIX promotes in two moves, and the 2026-09-09 board has one on d6.
//      A player promoted into mate there and was scored a loss because the
//      engine walked a pawn onto c8 (player report, 2026-09-09).
//
// Run: node scripts/verify-mate.mjs
import { PUZZLES } from '../app/mate/puzzles.js';
import { parseFen, legalMoves, applyMove, isCheckmate, uci, toSan, colorOf, rowOf, squareName, WHITE, BLACK } from '../app/mate/chess.js';

let BAD = 0;
const fail = (id, msg) => { BAD++; console.error(`✗ ${id}: ${msg}`); };
const ok = (id, msg) => console.log(`✓ ${id}  ${msg}`);
const note = (id, msg) => console.log(`… ${id}  ${msg}`);

// Boards before this date are frozen history: already published and played.
const MATE_FLOOR_FROM = '2026-08-03';
const MOTIF_CEILING = 2; // an exact motif string may repeat at most this many times

// ─── independent forced-mate search (memoized) ─────────────────────────────
function boardKey(board) { return board.map((x) => x || '.').join(''); }

function makeSolver() {
  const memo = new Map();
  // Does `color` (to move) have a move forcing checkmate within `n` of its
  // own moves, against every reply?
  function forcesMateWithin(board, color, n) {
    if (n <= 0) return false;
    const key = boardKey(board) + '|' + color + '|' + n;
    if (memo.has(key)) return memo.get(key);
    const opp = color === WHITE ? BLACK : WHITE;
    let result = false;
    for (const mv of legalMoves(board, color)) {
      const next = applyMove(board, mv.from, mv.to);
      if (isCheckmate(next, opp)) { result = true; break; }
      if (n === 1) continue;
      const oppMoves = legalMoves(next, opp);
      if (oppMoves.length === 0) continue; // stalemate-ish dead end, not a mate
      let allForced = true;
      for (const omv of oppMoves) {
        const next2 = applyMove(next, omv.from, omv.to);
        if (!forcesMateWithin(next2, color, n - 1)) { allForced = false; break; }
      }
      if (allForced) { result = true; break; }
    }
    memo.set(key, result);
    return result;
  }
  // Which of `color`'s legal first moves individually force mate within n.
  function forcingFirstMoves(board, color, n) {
    const opp = color === WHITE ? BLACK : WHITE;
    const out = [];
    for (const mv of legalMoves(board, color)) {
      const next = applyMove(board, mv.from, mv.to);
      if (isCheckmate(next, opp)) { out.push(mv); continue; }
      if (n === 1) continue;
      const oppMoves = legalMoves(next, opp);
      if (oppMoves.length === 0) continue;
      let allForced = true;
      for (const omv of oppMoves) {
        const next2 = applyMove(next, omv.from, omv.to);
        if (!forcesMateWithin(next2, color, n - 1)) { allForced = false; break; }
      }
      if (allForced) out.push(mv);
    }
    return out;
  }
  return { forcesMateWithin, forcingFirstMoves };
}

// ─── promotion-aware reference engine (check 9) ────────────────────────────
// chess.js always promotes to a queen. To ask "would another piece have been
// better?" the verifier needs an engine that can promote to any of the four, so
// here is one: the same legal move list, with every pawn move onto the far rank
// expanded into four, and its own apply that puts the chosen piece down.
//
// Legality does not depend on WHICH piece is promoted to -- the square is
// occupied by the mover either way -- so legalMoves() can still generate the
// list, and only the resulting board differs. That is also why isCheckmate()
// from chess.js is reused unchanged: a side has a legal reply under this engine
// exactly when it has one under that one.
const PROMO_KINDS = ['q', 'r', 'b', 'n'];
const farRow = (color) => (color === WHITE ? 0 : 7);
const isPromoting = (board, mv, color) =>
  board[mv.from] && board[mv.from].toUpperCase() === 'P' && rowOf(mv.to) === farRow(color);

function promoMoves(board, color) {
  const out = [];
  for (const mv of legalMoves(board, color)) {
    if (isPromoting(board, mv, color)) for (const k of PROMO_KINDS) out.push({ ...mv, promo: k });
    else out.push({ ...mv, promo: null });
  }
  return out;
}
function applyPromo(board, mv) {
  const next = board.slice();
  const piece = board[mv.from];
  next[mv.to] = mv.promo ? (colorOf(piece) === WHITE ? mv.promo.toUpperCase() : mv.promo) : piece;
  next[mv.from] = null;
  return next;
}

function makePromoSolver() {
  const memo = new Map();
  function forces(board, color, n) {
    if (n <= 0) return false;
    const key = boardKey(board) + '|' + color + '|' + n;
    if (memo.has(key)) return memo.get(key);
    let result = false;
    for (const mv of promoMoves(board, color)) {
      if (delivers(board, mv, color, n)) { result = true; break; }
    }
    memo.set(key, result);
    return result;
  }
  // Does playing `mv` mate within `n` of `color`'s moves, this one included?
  function delivers(board, mv, color, n) {
    if (n <= 0) return false;
    const opp = color === WHITE ? BLACK : WHITE;
    const next = applyPromo(board, mv);
    if (isCheckmate(next, opp)) return true;
    if (n === 1) return false;
    const replies = promoMoves(next, opp);
    if (!replies.length) return false;            // stalemate is not a mate
    for (const r of replies) if (!forces(applyPromo(next, r), color, n - 1)) return false;
    return true;
  }
  // Smallest number of `color` moves, this one included, in which `mv` forces
  // mate, or Infinity inside `cap`.
  const depthOf = (board, mv, color, cap) => {
    for (let n = 1; n <= cap; n++) if (delivers(board, mv, color, n)) return n;
    return Infinity;
  };
  // Smallest number of moves in which `color`, to move, is forced to be mated,
  // or Infinity inside `cap`. Used to score Black's promotion choices.
  const matedIn = (board, attacker, cap) => {
    for (let n = 1; n <= cap; n++) if (forces(board, attacker, n)) return n;
    return Infinity;
  };
  return { forces, delivers, depthOf, matedIn };
}

// Can a pawn even get there? A pawn advances one rank per move of its own,
// whether it pushes or captures, so a White pawn on row r needs r moves and a
// Black one needs 7 - r. White has `mateIn` moves and Black has mateIn - 1.
// Ignoring every blocker makes this an over-estimate, which is the safe
// direction: it can send the walk out on a board that turns out to have no
// promotion, never skip one that does. Most boards have no pawn in range at
// all, and skipping the walk on those is most of this check's speed.
function promotionPossible(board, mateIn) {
  for (let sq = 0; sq < 64; sq++) {
    const piece = board[sq];
    if (!piece || piece.toUpperCase() !== 'P') continue;
    const r = rowOf(sq);
    if (colorOf(piece) === WHITE ? r <= mateIn : 7 - r <= mateIn - 1) return true;
  }
  return false;
}

// Walk every position reachable inside the budget and check the promotions.
// Returns a list of complaint strings, plus how many promotions it judged.
function auditPromotions(start, mateIn) {
  if (!promotionPossible(start, mateIn)) return { bad: [], soft: [], judged: 0 };
  const solver = makePromoSolver();
  const bad = [];
  const soft = [];
  let judged = 0;
  const seen = new Set();
  // wLeft: White moves still to come, this ply included. bLeft: Black answers
  // still to come. A game ends when White runs out or someone is mated.
  const walk = (board, turn, wLeft, bLeft, path) => {
    if (turn === WHITE ? wLeft <= 0 : bLeft <= 0) return;
    const key = boardKey(board) + '|' + turn + '|' + wLeft + '|' + bLeft;
    if (seen.has(key)) return;
    seen.add(key);
    const opp = turn === WHITE ? BLACK : WHITE;
    for (const mv of legalMoves(board, turn)) {
      const line = path.concat(squareName(mv.from) + squareName(mv.to));
      if (isPromoting(board, mv, turn)) {
        judged++;
        const tries = PROMO_KINDS.map((k) => ({ k, board: applyPromo(board, { ...mv, promo: k }) }));
        if (turn === WHITE) {
          // White wants mate as soon as possible inside what is left.
          const depths = tries.map((t) => ({ k: t.k, d: solver.depthOf(board, { ...mv, promo: t.k }, WHITE, wLeft) }));
          const q = depths.find((d) => d.k === 'q').d;
          const best = Math.min(...depths.map((d) => d.d));
          if (best < q) {
            const winner = depths.find((d) => d.d === best);
            bad.push(`after ${line.join(' ')} White mates in ${best} with =${winner.k.toUpperCase()} but only ${q === Infinity ? 'not at all' : `in ${q}`} with the queen the engine gives`);
          }
        } else {
          // Black wants to be mated as late as possible, or not at all.
          const holds = tries.map((t) => ({ k: t.k, d: solver.matedIn(t.board, WHITE, wLeft) }));
          const q = holds.find((h) => h.k === 'q').d;
          const best = Math.max(...holds.map((h) => h.d));
          if (best > q) {
            const winner = holds.find((h) => h.d === best);
            soft.push(`after ${line.join(' ')} Black holds ${best === Infinity ? 'out entirely' : `for ${best}`} with =${winner.k.toUpperCase()} but only ${q} with the queen the engine gives`);
          }
        }
        // Judged, and then played ON with the queen, because that is what the
        // shipped engine puts on the board and a second promotion can follow.
      }
      const next = applyMove(board, mv.from, mv.to);
      if (isCheckmate(next, opp)) continue;       // round over
      walk(next, opp, turn === WHITE ? wLeft - 1 : wLeft, turn === BLACK ? bLeft - 1 : bLeft, line);
    }
  };
  walk(start, WHITE, mateIn, mateIn - 1, []);
  return { bad, soft, judged };
}

// ─── US-spelling scan ───────────────────────────────────────────────────────
const BRITISH_RE = /\b(colour|flavour|favourite|centre|theatre|organis(e|ing|ation)|recognis(e|ed|ing)|realis(e|ed|ing)|travell(ed|ing|er)|programme|metre|litre|kerb|tyre|analys(e|ed|ing)|catalogue|dialogue|jewellery|labour|neighbour|honour|armour|cheque|defence|licence|practise|whilst|amongst|learnt|aluminium|aeroplane)\b/i;
function scanBritish(id, label, s) {
  if (typeof s !== 'string') return;
  const m = s.match(BRITISH_RE);
  if (m) fail(id, `British spelling "${m[0]}" in ${label}: "${s}"`);
}

// ─── per-puzzle checks ──────────────────────────────────────────────────────
const seenFens = new Map();
const softPromo = [];
const motifPool = new Map();
PUZZLES.forEach((p, i) => {
  const errs = [];

  if (p.num !== i + 1) errs.push(`num ${p.num} != ${i + 1}`);
  const m = p.quizId.match(/^mate-(\d+)-(\d+)-(\d+)$/);
  if (!m) errs.push('bad quizId');
  else {
    const iso = `20${m[3]}-${String(m[1]).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
    if (iso !== p.live) errs.push(`live ${p.live} != quizId date ${iso}`);
  }
  const wantDateLabel = p.live ? new Date(`${p.live}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : null;
  if (wantDateLabel && p.dateLabel !== wantDateLabel) errs.push(`dateLabel "${p.dateLabel}" != "${wantDateLabel}"`);
  if (p.live) {
    const isSun = new Date(`${p.live}T12:00:00Z`).getUTCDay() === 0;
    if (!!p.sunday !== isSun) errs.push(`sunday must be ${isSun} for ${p.live} (real weekday)`);
  }
  const wantMateIn = p.sunday ? 3 : 2;
  if (p.mateIn !== wantMateIn) errs.push(`mateIn ${p.mateIn} != ${wantMateIn} for ${p.sunday ? 'Sunday' : 'weekday'}`);

  // FEN structural guarantees the game's engine depends on.
  const parts = String(p.fen).trim().split(/\s+/);
  if (parts[1] !== 'w') errs.push(`side to move is "${parts[1]}", must be White`);
  if (parts[2] !== '-') errs.push(`castling rights "${parts[2]}" must be "-"`);
  if (parts[3] !== '-') errs.push(`en passant "${parts[3]}" must be "-"`);
  let board = null, turn = null;
  try { ({ board, turn } = parseFen(p.fen)); } catch (e) { errs.push(`FEN failed to parse: ${e.message || e}`); }
  if (board) {
    for (let sq = 0; sq < 64; sq++) {
      const piece = board[sq];
      if (piece && piece.toUpperCase() === 'P') {
        const rank = 8 - (sq >> 3);
        if (rank === 1 || rank === 2 || rank === 7 || rank === 8) errs.push(`pawn on rank ${rank} (violates the no-two-square-push guarantee, or stands where it should already have promoted)`);
      }
    }
    const wKings = board.filter((p2) => p2 === 'K').length, bKings = board.filter((p2) => p2 === 'k').length;
    if (wKings !== 1) errs.push(`${wKings} white kings on board, want 1`);
    if (bKings !== 1) errs.push(`${bKings} black kings on board, want 1`);
  }

  let solveNote = '';
  if (!errs.length) {
    const { forcesMateWithin, forcingFirstMoves } = makeSolver();
    const fasterMateExists = p.mateIn > 1 ? forcesMateWithin(board, turn, p.mateIn - 1) : false;
    if (fasterMateExists) errs.push(`a forced mate in fewer than ${p.mateIn} moves exists (violates "never fewer")`);
    const forcing = forcingFirstMoves(board, turn, p.mateIn);
    if (forcing.length === 0) errs.push(`NO first move forces mate in ${p.mateIn} -- the position is not solved by its own stated mateIn`);
    else if (forcing.length > 1) errs.push(`NOT UNIQUE: ${forcing.length} different first moves force mate in ${p.mateIn} (${forcing.map((mv) => uci(mv.from, mv.to)).join(', ')})`);
    else {
      const foundKey = uci(forcing[0].from, forcing[0].to);
      if (foundKey !== p.solution?.key) errs.push(`the unique forcing move is ${foundKey}, but solution.key is "${p.solution?.key}"`);
      const san = toSan(board, forcing[0].from, forcing[0].to);
      if (san !== p.keySan) errs.push(`toSan(key) = "${san}" != stored keySan "${p.keySan}"`);
      solveNote = `, unique key ${foundKey} confirmed by independent search`;
    }
    // 9. Queen is never the wrong promotion for the player, anywhere a player
    // can get to. White's side of that fails the board; Black's is noted.
    const promo = auditPromotions(board, p.mateIn);
    for (const msg of promo.bad) errs.push(`UNDERPROMOTION BEATS THE QUEEN FOR WHITE: ${msg}`);
    if (promo.soft.length) softPromo.push({ id: p.quizId, live: p.live, lines: promo.soft });
    if (promo.judged) solveNote += `, ${promo.judged} reachable promotion${promo.judged === 1 ? '' : 's'} judged against all four pieces`;
  }

  if (!p.motif) errs.push('missing motif'); else scanBritish(p.quizId, 'motif', p.motif);
  if (p.fen) { const key = p.fen.split(/\s+/)[0]; seenFens.set(key, (seenFens.get(key) || []).concat(p.quizId)); }
  if (p.motif) {
    const arr = motifPool.get(p.motif) || [];
    arr.push({ id: p.quizId, live: p.live });
    motifPool.set(p.motif, arr);
  }

  errs.length ? fail(p.quizId, errs.join('; ')) : ok(p.quizId, `mate in ${p.mateIn}${p.sunday ? ' (Sunday)' : ''}${solveNote}`);
});

// ─── promotion notes (check 9, Black's side) ───────────────────────────────
for (const entry of softPromo) {
  note(entry.id, `Black defends worse than perfect play in ${entry.lines.length} off-key line${entry.lines.length === 1 ? '' : 's'}, where its pawn survives as an underpromotion and dies as the queen the engine gives it. Costs the player nothing; can hand a mate in a line already lost. First: ${entry.lines[0]}`);
}

for (const [, ids] of seenFens) {
  if (ids.length > 1) fail('mate pool', `identical starting position shipped on ${ids.length} boards: ${ids.join(', ')}`);
}

// ─── motif pool variety ────────────────────────────────────────────────────
let staleFound = false;
for (const [motif, entries] of motifPool) {
  const freshCount = entries.filter((e) => e.live >= MATE_FLOOR_FROM).length;
  if (entries.length > MOTIF_CEILING) {
    const msg = `motif reused on ${entries.length} boards (ceiling ${MOTIF_CEILING}): ${entries.map((e) => e.id).join(', ')} -- "${motif}"`;
    if (freshCount > 0) { fail('mate pool', msg); staleFound = true; }
    else note('mate pool', `grandfathered: ${msg}`);
  }
}
if (!staleFound && BAD === 0) ok('mate pool', `${PUZZLES.length} boards, ${motifPool.size} distinct motifs, no motif over the ${MOTIF_CEILING}x ceiling on editable boards`);

console.log(BAD ? `\n${BAD} FAILURE(S)` : '\nAll Mate boards verified.');
process.exit(BAD ? 1 : 0);
