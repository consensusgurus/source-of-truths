// Generate boards for Mate, the daily chess mate-in-N endgame.
//
// WHAT IT BUILDS. Positions with WHITE TO MOVE in which White forces checkmate
// in EXACTLY `mateIn` White moves (weekdays 2, the Sunday Edition 3), never
// fewer, with EXACTLY ONE first move that does it -- plus the full UCI game
// tree the client walks, and a motif string that names the mating pattern the
// player actually reaches.
//
// HOW TO RUN IT. Two phases, because the search is the slow part and the
// calendar deal is instant:
//
//   node scripts/gen-mate.mjs harvest --mateIn 2 --seconds 1200 --seed 63 \
//        --out /tmp/build/mate-cand2.json
//   node scripts/gen-mate.mjs harvest --mateIn 3 --seconds 1200 --seed 63 \
//        --out /tmp/build/mate-cand3.json
//   node scripts/gen-mate.mjs deal --from 2026-09-30 --to 2026-11-30 \
//        --startNum 63 --pool2 /tmp/build/mate-cand2.json \
//        --pool3 /tmp/build/mate-cand3.json --apply
//
// `deal` without --apply prints the new board rows to stdout in the bank's own
// textual shape. With --apply it SPLICES those rows in immediately before the
// closing `];` of app/mate/puzzles.js and touches nothing above them, so every
// frozen board stays byte-identical (checked with git diff / md5 afterwards).
// Harvest caches nothing across runs: pass a fresh --out, and clear
// /tmp/build/mate-* at the start of a session, or an old pool bleeds in.
//
// THE STRUCTURAL GUARANTEES ARE GENERATED IN, NOT REPAIRED AFTERWARDS. The
// sampler never places a pawn outside ranks 3-6, never emits castling or en
// passant fields other than '-', and the FEN is printed from the sampled board,
// so the two promises app/mate/chess.js is built on (no castling, no en
// passant) hold by construction.
//
// PROMOTION IS NOT ONE OF THEM, whatever an older copy of this paragraph said.
// Ranks 3-6 sounds like it keeps pawns off the far rank, and it does not: a
// White pawn on rank 6 promotes in TWO moves, the whole of a weekday budget, and
// ten shipped boards can reach a promotion. The engine promotes to a queen and
// verify-mate's check 9 proves that is never the wrong piece for the player, so
// a sampled pawn on rank 6 is fine; nothing here needs to avoid one.
//
// TWO ENGINES, ON PURPOSE, and they are not the verifier's two. The sift runs
// on the compact 0x88-free core at the top of this file (piece-indexed attack
// tables, make/unmake, no allocation in the hot loop), which is roughly 40x the
// throughput of the shipped engine and is NOT what ships. Every candidate that
// survives the sift is then re-proved from its FEN with app/mate/chess.js --
// the same engine scripts/verify-mate.mjs uses -- for: no mate in mateIn-1,
// exactly one forcing first move, that move equals the stored key, keySan from
// toSan(), and the solution tree walked node by node with the key set of every
// `lines` object asserted equal to the legal reply set. A candidate that
// disagrees anywhere is dropped, not patched. So the fast core can cost
// throughput but never correctness.
//
// WHAT THE SAMPLER LEARNED. Uniform random placement is hopeless: fewer than
// one position in ten thousand is a mate in two and almost all of those repeat
// the same bare-queen shape. Three things fixed the yield:
//   * place the BLACK king first, weighted onto the edge and corner where mates
//     live, then place White's force inside a radius of it;
//   * a cheap escape-square gate before any search -- if the black king has
//     more than FLIGHT_GATE unattacked, unoccupied neighbours the position is
//     thrown away before a single node is searched. That one test does most of
//     the work;
//   * draw the material signature from a weighted pool rather than uniformly,
//     because K+Q shapes both dominate random draws and produce the dullest
//     boards.
//
// LEGALITY. Both kings present and non-adjacent; the side NOT to move (Black)
// is not already in check; White is not in check either (a puzzle whose solver
// is answering a check is a different genre); at most one queen, two rooks, two
// knights and two bishops a side, and a two-bishop pair must sit on opposite
// colours, since anything else needs a promotion this bank cannot have had;
// Black's material never exceeds White's. Pawns live on ranks 3-6 only.
//
// QUALITY BARS (a floor is not a target -- these are bands, and they widen on
// Sunday). MIN_WHITE_MOVES legal first moves so the key is a real search rather
// than a forced move; MIN_BLACK_REPLIES answers to the key so the follow-up is
// not automatic, with a CEILING on how many boards may sit at that floor; a
// piece count sampled across PIECE_BAND rather than pinned at its floor; and a
// Sunday that is bigger (SUNDAY_MIN_MEN) and defends harder (SUNDAY_MIN_REPLIES)
// as well as running a move longer. The solution tree is capped at
// MAX_TREE_CHARS so a Sunday does not ship a 4KB line.
//
// POOL VARIETY CEILINGS, counted across the WHOLE new segment (62 boards) and
// enforced by the dealer, which refuses a candidate that would breach one:
//   * exact motif string        <= 2   (matches verify-mate's MOTIF_CEILING)
//   * mating-pattern family     <= 8   (e.g. "back rank mate")
//   * key piece type            <= 16  (Q, R, B, N, K or P)
//   * key move character        <= 34  (quiet, check, discovered check,
//                                        capture, capturing check)
//   * material signature        <= 4   (e.g. "KQR-kn")
//   * mating piece type         <= 18
//   * black king mating square  <= 3
//   * boards at the reply floor <= 16  (so MIN_BLACK_REPLIES is a floor, not a target)
// Without them the run comes back 40-something queen mates on h7 and a bank
// that says the same thing every day, which is exactly the failure mode
// CLAUDE.md's rule 7 exists to stop.
//
// DETERMINISM. mulberry32 seeded with (seed + startNum) so the new segment can
// never replay the frozen one, and every tie-break in the dealer is by index or
// by string, never by object key order. The same command over the same pools
// AND the same bank file reproduces its rows byte for byte. It is not the same
// command once the bank has grown: `deal` reads the bank for the FENs and
// motifs already in it and refuses to repeat either, so re-running after an
// apply deals a DIFFERENT (also valid) 62 boards rather than the same ones.
// That is the point -- it is what stops a second extension shipping a
// duplicate position -- but do not mistake it for non-determinism.
//
// RUNWAY, measured 2026-09-05. A 20-minute harvest a side yielded 27,278
// mate-in-2 and 1,725 mate-in-3 candidates; the 62-board deal to 2026-11-30
// consumed a fraction of that but SATURATED every one of the seven variety
// ceilings. Dealing on past 2026-11-30 from the same pools stops at 68 boards
// with all ceilings full and both pools exhausted, so the wall is the ceilings
// first and the pool second: one run's worth of documented variety is about 65
// to 70 boards, and a longer bank wants a fresh harvest AND a fresh run (the
// counters reset per run, and the bank's own FEN and motif history is what
// keeps the two runs from colliding). The mate-in-3 pool fills ~16x slower
// than the mate-in-2 pool, so a Sunday-heavy stretch is the thing to harvest
// for, not the weekdays.
import { readFileSync, writeFileSync } from 'node:fs';
import {
  parseFen, legalMoves as slowLegal, applyMove as slowApply, isCheckmate as slowMate,
  uci as slowUci, toSan, WHITE, BLACK,
} from '../app/mate/chess.js';

// ─── tuning ────────────────────────────────────────────────────────────────
const FLIGHT_GATE = 4;         // black king's free neighbours before we search at all
const MIN_WHITE_MOVES = 14;    // legal White first moves: the key must be found, not forced
const MIN_BLACK_REPLIES = 3;   // answers to the key, so move two is not automatic
const SUNDAY_MIN_REPLIES = 4;  // the Sunday Edition defends harder as well as longer
const SUNDAY_MIN_MEN = 6;      // ... and is drawn from the top of the piece band
const PIECE_BAND = [4, 8];     // total men on the board, inclusive
const MAX_TREE_CHARS = 1500;   // JSON length of `solution`

// Ceilings over the WHOLE new segment. `thin` counts boards whose key allows
// only MIN_BLACK_REPLIES answers, so the floor cannot become the target.
const CEIL = {
  motif: 2, pattern: 8, keyPiece: 16, keyKind: 34, material: 4, matePiece: 18,
  mateSquare: 3, thin: 16,
};

// ─── fast core ─────────────────────────────────────────────────────────────
// Codes: white 1..6 = P N B R Q K, black = the same +8. 0 is empty. Squares are
// 0..63 with 0 = a8, identical to app/mate/chess.js so a board converts by a
// straight table lookup and the two engines can never disagree about geometry.
const P = 1, N = 2, B = 3, R = 4, Q = 5, K = 6;
const kindOf = (p) => p & 7;
const isWhite = (p) => p !== 0 && p < 8;
const LETTER = { 1: 'P', 2: 'N', 3: 'B', 4: 'R', 5: 'Q', 6: 'K' };
const CODE_OF_LETTER = { P: 1, N: 2, B: 3, R: 4, Q: 5, K: 6 };
const NAME = { 1: 'pawn', 2: 'knight', 3: 'bishop', 4: 'rook', 5: 'queen', 6: 'king' };
const VALUE = { 1: 1, 2: 3, 3: 3, 4: 5, 5: 9, 6: 0 };

const rowOf = (sq) => sq >> 3;
const fileOf = (sq) => sq & 7;
const sqName = (sq) => String.fromCharCode(97 + fileOf(sq)) + String(8 - rowOf(sq));
const uciOf = (from, to) => sqName(from) + sqName(to);

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
const KNIGHT_HOPS = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];

const RAY = [];        // RAY[sq][dir] = squares outward, nearest first
const KNIGHT_AT = [];  // KNIGHT_AT[sq] = knight-reachable squares
const KING_AT = [];
for (let sq = 0; sq < 64; sq++) {
  const r = rowOf(sq), f = fileOf(sq);
  RAY.push(DIRS.map(([dr, df]) => {
    const out = [];
    let rr = r + dr, ff = f + df;
    while (rr >= 0 && rr < 8 && ff >= 0 && ff < 8) { out.push(rr * 8 + ff); rr += dr; ff += df; }
    return out;
  }));
  KNIGHT_AT.push(KNIGHT_HOPS.map(([dr, df]) => [r + dr, f + df])
    .filter(([rr, ff]) => rr >= 0 && rr < 8 && ff >= 0 && ff < 8).map(([rr, ff]) => rr * 8 + ff));
  KING_AT.push(DIRS.map(([dr, df]) => [r + dr, f + df])
    .filter(([rr, ff]) => rr >= 0 && rr < 8 && ff >= 0 && ff < 8).map(([rr, ff]) => rr * 8 + ff));
}

// Is `sq` attacked by `white`? Walks outward from the square rather than over
// every enemy piece, which is where the speed comes from.
function attacked(bd, sq, white) {
  for (const t of KNIGHT_AT[sq]) { const p = bd[t]; if (p && isWhite(p) === white && kindOf(p) === N) return true; }
  for (const t of KING_AT[sq]) { const p = bd[t]; if (p && isWhite(p) === white && kindOf(p) === K) return true; }
  // A white pawn on (r+1,f±1) attacks (r,f); a black pawn on (r-1,f±1) does.
  const pr = rowOf(sq) + (white ? 1 : -1);
  if (pr >= 0 && pr < 8) {
    const f = fileOf(sq);
    for (const ff of [f - 1, f + 1]) {
      if (ff < 0 || ff > 7) continue;
      const p = bd[pr * 8 + ff];
      if (p && isWhite(p) === white && kindOf(p) === P) return true;
    }
  }
  for (let d = 0; d < 8; d++) {
    const ray = RAY[sq][d];
    for (let i = 0; i < ray.length; i++) {
      const p = bd[ray[i]];
      if (!p) continue;
      if (isWhite(p) === white) {
        const k = kindOf(p);
        if (d < 4 ? (k === R || k === Q) : (k === B || k === Q)) return true;
      }
      break;
    }
  }
  return false;
}

function kingSq(bd, white) {
  const want = white ? K : K + 8;
  for (let s = 0; s < 64; s++) if (bd[s] === want) return s;
  return -1;
}

// Pseudo-legal moves packed as (from << 6) | to, appended to `out`.
function genPseudo(bd, white, out) {
  let n = 0;
  for (let s = 0; s < 64; s++) {
    const p = bd[s];
    if (!p || isWhite(p) !== white) continue;
    const k = kindOf(p);
    if (k === N || k === K) {
      for (const t of (k === N ? KNIGHT_AT[s] : KING_AT[s])) {
        const q = bd[t];
        if (!q || isWhite(q) !== white) out[n++] = (s << 6) | t;
      }
    } else if (k === P) {
      const r = rowOf(s), f = fileOf(s), dr = white ? -1 : 1;
      const rr = r + dr;
      if (rr >= 0 && rr < 8) {
        if (!bd[rr * 8 + f]) out[n++] = (s << 6) | (rr * 8 + f);
        for (const ff of [f - 1, f + 1]) {
          if (ff < 0 || ff > 7) continue;
          const t = rr * 8 + ff, q = bd[t];
          if (q && isWhite(q) !== white) out[n++] = (s << 6) | t;
        }
      }
    } else {
      const lo = k === B ? 4 : 0, hi = k === R ? 4 : 8;
      for (let d = lo; d < hi; d++) {
        const ray = RAY[s][d];
        for (let i = 0; i < ray.length; i++) {
          const t = ray[i], q = bd[t];
          if (!q) { out[n++] = (s << 6) | t; continue; }
          if (isWhite(q) !== white) out[n++] = (s << 6) | t;
          break;
        }
      }
    }
  }
  return n;
}

const SCRATCH = [], MOVES = [], REPS = [];
for (let i = 0; i < 24; i++) { SCRATCH.push(new Int32Array(256)); MOVES.push(new Int32Array(256)); REPS.push(new Int32Array(256)); }

function genLegal(bd, white, out, depth) {
  const buf = SCRATCH[depth];
  const np = genPseudo(bd, white, buf);
  let ksq = kingSq(bd, white);
  let n = 0;
  for (let i = 0; i < np; i++) {
    const mv = buf[i], from = mv >> 6, to = mv & 63;
    const cap = bd[to];
    bd[to] = bd[from]; bd[from] = 0;
    const k = from === ksq ? to : ksq;
    if (!attacked(bd, k, !white)) out[n++] = mv;
    bd[from] = bd[to]; bd[to] = cap;
  }
  return n;
}

const inCheckFast = (bd, white) => attacked(bd, kingSq(bd, white), !white);

const MATE_BUF = [];
for (let i = 0; i < 24; i++) MATE_BUF.push(new Int32Array(256));
function isMateFast(bd, white, depth) {
  if (!inCheckFast(bd, white)) return false;
  return genLegal(bd, white, MATE_BUF[depth], depth) === 0;
}

// Can `white` force mate in <= n of its own moves against every defence?
function forces(bd, white, n, depth) {
  if (n <= 0) return false;
  const moves = MOVES[depth];
  const cnt = genLegal(bd, white, moves, depth);
  for (let i = 0; i < cnt; i++) {
    const mv = moves[i], from = mv >> 6, to = mv & 63, cap = bd[to];
    bd[to] = bd[from]; bd[from] = 0;
    let good = isMateFast(bd, !white, depth + 1);
    if (!good && n > 1) {
      const rep = REPS[depth];
      const rc = genLegal(bd, !white, rep, depth + 1);
      if (rc > 0) {
        good = true;
        for (let j = 0; j < rc; j++) {
          const rm = rep[j], rf = rm >> 6, rt = rm & 63, rcap = bd[rt];
          bd[rt] = bd[rf]; bd[rf] = 0;
          const held = forces(bd, white, n - 1, depth + 2);
          bd[rf] = bd[rt]; bd[rt] = rcap;
          if (!held) { good = false; break; }
        }
      }
    }
    bd[from] = bd[to]; bd[to] = cap;
    if (good) return true;
  }
  return false;
}

// Which of White's legal first moves individually force mate in <= n.
function forcingFirst(bd, white, n, depth) {
  const moves = MOVES[depth];
  const cnt = genLegal(bd, white, moves, depth);
  const out = [];
  for (let i = 0; i < cnt; i++) {
    const mv = moves[i], from = mv >> 6, to = mv & 63, cap = bd[to];
    bd[to] = bd[from]; bd[from] = 0;
    let good = isMateFast(bd, !white, depth + 1);
    if (!good && n > 1) {
      const rep = REPS[depth];
      const rc = genLegal(bd, !white, rep, depth + 1);
      if (rc > 0) {
        good = true;
        for (let j = 0; j < rc; j++) {
          const rm = rep[j], rf = rm >> 6, rt = rm & 63, rcap = bd[rt];
          bd[rt] = bd[rf]; bd[rf] = 0;
          const held = forces(bd, white, n - 1, depth + 2);
          bd[rf] = bd[rt]; bd[rt] = rcap;
          if (!held) { good = false; break; }
        }
      }
    }
    bd[from] = bd[to]; bd[to] = cap;
    if (good) out.push(mv);
    if (out.length > 1) break; // uniqueness is the bar; two is already a reject
  }
  return out;
}

// ─── FEN ───────────────────────────────────────────────────────────────────
function toFen(bd) {
  const rows = [];
  for (let r = 0; r < 8; r++) {
    let s = '', run = 0;
    for (let f = 0; f < 8; f++) {
      const p = bd[r * 8 + f];
      if (!p) { run++; continue; }
      if (run) { s += run; run = 0; }
      const L = LETTER[kindOf(p)];
      s += isWhite(p) ? L : L.toLowerCase();
    }
    if (run) s += run;
    rows.push(s);
  }
  return `${rows.join('/')} w - - 0 1`;
}
function fromFen(fen) {
  const bd = new Int8Array(64);
  let sq = 0;
  for (const ch of fen.trim().split(/\s+/)[0]) {
    if (ch === '/') continue;
    if (ch >= '1' && ch <= '8') { sq += Number(ch); continue; }
    const up = ch.toUpperCase();
    bd[sq++] = CODE_OF_LETTER[up] + (ch === up ? 0 : 8);
  }
  return bd;
}

// ─── sampler ───────────────────────────────────────────────────────────────
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Weighted so the bank is not forty queen endings. Each entry is
// [white men (besides the king), black men (besides the king), weight].
const SIGNATURES = [
  [['Q'], [], 2], [['Q'], ['P'], 3], [['Q'], ['N'], 3], [['Q'], ['B'], 3], [['Q'], ['R'], 2],
  [['R'], ['N'], 2], [['R'], ['B'], 2], [['R'], ['P'], 2],
  [['R', 'R'], [], 3], [['R', 'R'], ['N'], 3], [['R', 'R'], ['P'], 3], [['R', 'R'], ['B'], 3],
  [['Q', 'R'], ['N'], 3], [['Q', 'R'], ['P'], 3], [['Q', 'R'], ['B'], 2], [['Q', 'R'], ['R'], 2],
  [['Q', 'N'], ['P'], 4], [['Q', 'N'], ['N'], 4], [['Q', 'N'], ['B'], 4], [['Q', 'N'], ['R'], 3],
  [['Q', 'B'], ['P'], 4], [['Q', 'B'], ['N'], 4], [['Q', 'B'], ['B'], 4], [['Q', 'B'], ['R'], 3],
  [['R', 'N'], ['P'], 5], [['R', 'N'], ['N'], 5], [['R', 'N'], ['B'], 4],
  [['R', 'B'], ['P'], 5], [['R', 'B'], ['N'], 4], [['R', 'B'], ['B'], 4],
  [['B', 'B'], ['P'], 5], [['B', 'B'], ['N'], 5], [['B', 'B'], ['B'], 3],
  [['B', 'N'], ['P'], 5], [['B', 'N'], ['N'], 4], [['B', 'N'], [], 3],
  [['N', 'N'], ['P'], 4], [['N', 'N'], ['N'], 3],
  [['Q', 'P'], ['N'], 4], [['Q', 'P'], ['B'], 4], [['Q', 'P'], ['P'], 4], [['Q', 'P'], ['R'], 3],
  [['R', 'P'], ['N'], 4], [['R', 'P'], ['B'], 4], [['R', 'P'], ['P'], 3],
  [['B', 'P'], ['N'], 3], [['B', 'P'], ['P'], 3], [['N', 'P'], ['B'], 3], [['N', 'P'], ['P'], 3],
  [['R', 'R', 'N'], ['N'], 3], [['R', 'R', 'B'], ['P'], 3], [['R', 'R', 'P'], ['B'], 2],
  [['Q', 'R', 'N'], ['R'], 3], [['Q', 'R', 'B'], ['N'], 3], [['Q', 'N', 'N'], ['P'], 3],
  [['Q', 'B', 'N'], ['P'], 3], [['Q', 'B', 'B'], ['N'], 3], [['R', 'B', 'N'], ['P'], 4],
  [['R', 'N', 'N'], ['B'], 3], [['B', 'B', 'N'], ['P'], 3], [['R', 'B', 'P'], ['N'], 3],
  [['R', 'N', 'P'], ['B'], 3], [['Q', 'B', 'P'], ['N', 'P'], 3], [['Q', 'N', 'P'], ['B', 'P'], 3],
  [['Q', 'R'], ['N', 'P'], 3], [['R', 'R'], ['B', 'P'], 3], [['R', 'B'], ['N', 'P'], 3],
  [['R', 'N'], ['B', 'P'], 3], [['B', 'B'], ['N', 'P'], 3], [['Q', 'N'], ['R', 'P'], 3],
  [['Q', 'B'], ['N', 'N'], 3], [['R', 'R'], ['N', 'N'], 3], [['Q'], ['N', 'N'], 3],
  [['Q'], ['B', 'N'], 3], [['R', 'R'], ['B', 'N'], 3], [['Q', 'R'], ['B', 'N'], 2],
  // Seven- and eight-man shapes, so the piece band is a band and not a point.
  [['Q', 'R', 'N'], ['N', 'P'], 4], [['R', 'R', 'B'], ['N', 'P'], 4],
  [['Q', 'B', 'N'], ['B', 'P'], 4], [['R', 'B', 'N'], ['N', 'P'], 4],
  [['R', 'R', 'N'], ['B', 'P'], 4], [['Q', 'N', 'P'], ['N', 'P'], 4],
  [['B', 'B', 'N'], ['N', 'P'], 3], [['Q', 'B', 'P'], ['R', 'P'], 3],
  [['Q', 'R'], ['B', 'N', 'P'], 4], [['R', 'R', 'B'], ['B', 'N'], 3],
  [['Q', 'R', 'B'], ['N', 'P'], 4], [['R', 'B', 'N'], ['B', 'P'], 4],
  [['Q', 'N', 'N'], ['B', 'P'], 3], [['R', 'R', 'P'], ['N', 'P'], 3],
];
const SIG_TOTAL = SIGNATURES.reduce((a, s) => a + s[2], 0);

const DARK = (sq) => ((rowOf(sq) + fileOf(sq)) & 1) === 1;
const chebyshev = (a, b) => Math.max(Math.abs(rowOf(a) - rowOf(b)), Math.abs(fileOf(a) - fileOf(b)));

function sampleSignature(rnd) {
  let x = rnd() * SIG_TOTAL;
  for (const s of SIGNATURES) { x -= s[2]; if (x <= 0) return s; }
  return SIGNATURES[SIGNATURES.length - 1];
}

// Black king weighted onto the rim, where mates live. Corner 3x, edge 2x.
function sampleBlackKing(rnd) {
  for (;;) {
    const sq = Math.floor(rnd() * 64);
    const r = rowOf(sq), f = fileOf(sq);
    const edge = r === 0 || r === 7 || f === 0 || f === 7;
    const corner = (r === 0 || r === 7) && (f === 0 || f === 7);
    const w = corner ? 1 : edge ? 0.66 : 0.33;
    if (rnd() < w) return sq;
  }
}

// One candidate position, or null if the draw was illegal / implausible.
function samplePosition(rnd, targetMen) {
  const [wSet, bSet] = sampleSignature(rnd);
  if (2 + wSet.length + bSet.length !== targetMen) return null;
  const bd = new Int8Array(64);
  const bk = sampleBlackKing(rnd);
  bd[bk] = K + 8;
  // White's king near enough to matter but never touching.
  let wk = -1;
  for (let tries = 0; tries < 24 && wk < 0; tries++) {
    const sq = Math.floor(rnd() * 64);
    if (bd[sq] || chebyshev(sq, bk) < 2 || chebyshev(sq, bk) > 5) continue;
    wk = sq;
  }
  if (wk < 0) return null;
  bd[wk] = K;
  const place = (letter, white) => {
    const code = CODE_OF_LETTER[letter] + (white ? 0 : 8);
    for (let tries = 0; tries < 40; tries++) {
      const sq = Math.floor(rnd() * 64);
      if (bd[sq]) continue;
      if (letter === 'P') { const r = rowOf(sq); if (r < 2 || r > 5) continue; }
      // Keep the force in the black king's neighbourhood: that is where a
      // two-move mate can exist at all.
      if (chebyshev(sq, bk) > (white ? 4 : 6)) continue;
      bd[sq] = code;
      return sq;
    }
    return -1;
  };
  const wSquares = [], bSquares = [];
  for (const L of wSet) { const sq = place(L, true); if (sq < 0) return null; wSquares.push([L, sq]); }
  for (const L of bSet) { const sq = place(L, false); if (sq < 0) return null; bSquares.push([L, sq]); }
  // Bishop pairs must be opposite-coloured; anything else needs a promotion.
  for (const side of [wSquares, bSquares]) {
    const bishops = side.filter(([L]) => L === 'B').map(([, sq]) => sq);
    if (bishops.length === 2 && DARK(bishops[0]) === DARK(bishops[1])) return null;
  }
  if (chebyshev(wk, bk) < 2) return null;
  if (inCheckFast(bd, false)) return null;  // Black, not to move, may not be in check
  if (inCheckFast(bd, true)) return null;   // and White is not answering a check either
  const wMat = wSet.reduce((a, L) => a + VALUE[CODE_OF_LETTER[L]], 0);
  const bMat = bSet.reduce((a, L) => a + VALUE[CODE_OF_LETTER[L]], 0);
  if (bMat > wMat) return null;
  return { bd, bk, wk, sig: `K${wSet.join('')}-k${bSet.join('').toLowerCase()}` };
}

// Free squares the black king could step to: the cheap gate that does most of
// the rejecting before any search runs.
function flights(bd, bk) {
  let n = 0;
  for (const t of KING_AT[bk]) {
    const p = bd[t];
    if (p && !isWhite(p)) continue;
    if (attacked(bd, t, true)) continue;
    n++;
  }
  return n;
}

// ─── solution tree, on the fast core ───────────────────────────────────────
// White's continuation inside the tree need not be unique; pick the mate that
// finishes soonest, tie-broken by UCI, so the stored line is deterministic and
// as short as the position allows.
function whiteContinuation(bd, n) {
  const moves = new Int32Array(256);
  const cnt = genLegal(bd, true, moves, 0);
  const list = [];
  for (let i = 0; i < cnt; i++) list.push(moves[i]);
  list.sort((a, b) => uciOf(a >> 6, a & 63) < uciOf(b >> 6, b & 63) ? -1 : 1);
  for (let want = 1; want <= n; want++) {
    for (const mv of list) {
      const from = mv >> 6, to = mv & 63, cap = bd[to];
      bd[to] = bd[from]; bd[from] = 0;
      let good;
      if (want === 1) good = isMateFast(bd, false, 1);
      else {
        good = false;
        const rep = new Int32Array(256);
        const rc = genLegal(bd, false, rep, 1);
        if (rc > 0) {
          good = true;
          for (let j = 0; j < rc; j++) {
            const rf = rep[j] >> 6, rt = rep[j] & 63, rcap = bd[rt];
            bd[rt] = bd[rf]; bd[rf] = 0;
            const held = forces(bd, true, want - 1, 2);
            bd[rf] = bd[rt]; bd[rt] = rcap;
            if (!held) { good = false; break; }
          }
        }
      }
      bd[from] = bd[to]; bd[to] = cap;
      if (good) return { mv, mateNow: want === 1 };
    }
  }
  return null;
}

// Node for "White to move, mate in <= n". Returns { mate } or { move, lines }.
function buildNode(bd, n) {
  const pick = whiteContinuation(bd, n);
  if (!pick) return null;
  const { mv, mateNow } = pick;
  const from = mv >> 6, to = mv & 63;
  if (mateNow) return { mate: uciOf(from, to) };
  const cap = bd[to];
  bd[to] = bd[from]; bd[from] = 0;
  const rep = new Int32Array(256);
  const rc = genLegal(bd, false, rep, 1);
  const lines = {};
  let ok = true;
  for (let j = 0; j < rc && ok; j++) {
    const rf = rep[j] >> 6, rt = rep[j] & 63, rcap = bd[rt];
    bd[rt] = bd[rf]; bd[rf] = 0;
    const child = buildNode(bd, n - 1);
    bd[rf] = bd[rt]; bd[rt] = rcap;
    if (!child) { ok = false; break; }
    lines[uciOf(rf, rt)] = child;
  }
  bd[from] = bd[to]; bd[to] = cap;
  return ok ? { move: uciOf(from, to), lines } : null;
}

function buildTree(bd, keyMv, mateIn) {
  const from = keyMv >> 6, to = keyMv & 63, cap = bd[to];
  bd[to] = bd[from]; bd[from] = 0;
  const rep = new Int32Array(256);
  const rc = genLegal(bd, false, rep, 1);
  const lines = {};
  let ok = rc > 0;
  for (let j = 0; j < rc && ok; j++) {
    const rf = rep[j] >> 6, rt = rep[j] & 63, rcap = bd[rt];
    bd[rt] = bd[rf]; bd[rf] = 0;
    const child = buildNode(bd, mateIn - 1);
    bd[rf] = bd[rt]; bd[rt] = rcap;
    if (!child) { ok = false; break; }
    lines[uciOf(rf, rt)] = child;
  }
  bd[from] = bd[to]; bd[to] = cap;
  return ok ? { key: uciOf(from, to), lines, replies: rc } : null;
}

// ─── the line the player actually sees ─────────────────────────────────────
// MateClient picks Black's reply by hashing the quizId over the STIFFEST
// defences only, so the motif is written about that line rather than about an
// arbitrary one. This mirrors pickReply/mateDistance in app/mate/MateClient.jsx
// exactly; if that ever changes, change this with it.
function mateDistance(node) {
  if (!node) return 0;
  if (node.mate) return 1;
  let deepest = 0;
  for (const k of Object.keys(node.lines || {})) deepest = Math.max(deepest, mateDistance(node.lines[k]));
  return 1 + deepest;
}
function pickReply(node, quizId) {
  const all = Object.keys(node.lines).sort();
  const deepest = Math.max(...all.map((k) => mateDistance(node.lines[k])));
  const replies = all.filter((k) => mateDistance(node.lines[k]) === deepest);
  let h = 2166136261;
  for (let i = 0; i < quizId.length; i++) { h ^= quizId.charCodeAt(i); h = Math.imul(h, 16777619); }
  return replies[Math.abs(h) % replies.length];
}

// ─── motif ─────────────────────────────────────────────────────────────────
// Every clause below is read off the real final position; nothing is asserted
// that the board does not show. Patterns are tested most specific first.
function classifyMate(before, from, to) {
  const bd = Int8Array.from(before);
  const cap = bd[to];
  bd[to] = bd[from]; bd[from] = 0;
  const bk = kingSq(bd, false);
  const mover = kindOf(bd[to]);
  const givesCheck = sees(bd, to, bk);
  const attackers = [];
  for (let s2 = 0; s2 < 64; s2++) {
    const p = bd[s2];
    if (!p || !isWhite(p)) continue;
    if (sees(bd, s2, bk)) attackers.push(kindOf(p));
  }
  const kinds = new Set(attackers);
  const onEdge = rowOf(bk) === 0 || rowOf(bk) === 7 || fileOf(bk) === 0 || fileOf(bk) === 7;
  const inCorner = (rowOf(bk) === 0 || rowOf(bk) === 7) && (fileOf(bk) === 0 || fileOf(bk) === 7);
  const adjacent = chebyshev(to, bk) === 1;
  const backRank = rowOf(bk) === 0 || rowOf(bk) === 7;
  let smothered = true;
  for (const t of KING_AT[bk]) { const p = bd[t]; if (!p || isWhite(p)) { smothered = false; break; } }
  const boxedByOwn = KING_AT[bk].filter((t) => bd[t] && !isWhite(bd[t])).length;

  let pattern;
  if (mover === N && smothered) pattern = 'smothered mate';
  else if (mover === K || !givesCheck) pattern = 'discovered mate';
  else if (kinds.has(R) && kinds.has(N) && inCorner) pattern = 'arabian mate';
  else if (kinds.has(R) && kinds.has(N) && onEdge) pattern = 'anastasia style mate';
  else if (attackers.filter((k) => k === B).length >= 2) pattern = 'two bishop mate';
  else if (kinds.has(B) && kinds.has(N)) pattern = 'bishop and knight mate';
  else if (mover === N && inCorner) pattern = 'knight mate in the corner';
  else if ((mover === R || mover === Q) && backRank && rowOf(to) === rowOf(bk) && boxedByOwn > 0) pattern = 'back rank mate';
  else if (mover === Q && inCorner && adjacent) pattern = 'corner mate';
  else if (mover === Q && adjacent) pattern = 'kiss of death';
  else if (mover === Q && onEdge) pattern = 'queen mate along the edge';
  else if (mover === Q) pattern = 'long range queen mate';
  else if (mover === R && onEdge) pattern = 'rook mate on the edge';
  else if (mover === R) pattern = 'rook mate through the middle';
  else if (mover === N && onEdge) pattern = 'knight mate on the rim';
  else if (mover === N) pattern = 'knight mate in open field';
  else if (mover === B && chebyshev(to, bk) >= 3) pattern = 'bishop mate down the long diagonal';
  else if (mover === B) pattern = 'bishop mate';
  else if (mover === P) pattern = 'pawn mate';
  else pattern = 'mate';

  // Support: is the mating square defended, and by what? The mating piece is
  // lifted first so an x-ray defender behind it counts, which is what would
  // actually recapture.
  const landed = bd[to];
  bd[to] = 0;
  const defenders = [];
  for (let s2 = 0; s2 < 64; s2++) {
    const p = bd[s2];
    if (!p || !isWhite(p)) continue;
    if (sees(bd, s2, to)) defenders.push(kindOf(p));
  }
  bd[to] = landed;
  const takeable = attacked(bd, to, false);
  // Least valuable defender first, but the king last: "the pawn guarding the
  // square" says more about the pattern than "the king" does.
  const DEF_ORDER = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };
  defenders.sort((a, b) => DEF_ORDER[a] - DEF_ORDER[b]);
  let support;
  if (defenders.length) support = `the ${NAME[defenders[0]]} guarding the square`;
  else if (!takeable) support = 'and no black piece even attacks it';
  else support = 'and the piece that attacks it cannot legally take';
  // On a discovery the piece that LANDS is not the piece that mates; name both,
  // or the motif would credit the wrong man.
  let checker = null;
  if (!givesCheck) {
    for (let s2 = 0; s2 < 64; s2++) {
      const p = bd[s2];
      if (!p || !isWhite(p) || s2 === to) continue;
      if (sees(bd, s2, bk)) { checker = kindOf(p); break; }
    }
  }
  return { pattern, matePiece: mover, checker, mateSquare: sqName(to), support, capture: !!cap };
}

// Does the piece on `s` attack `t` right now? Used for defenders and for
// picking out which pieces are actually hitting the king.
function sees(bd, s, t) {
  const p = bd[s];
  if (!p) return false;
  const k = kindOf(p), white = isWhite(p);
  if (k === N) return KNIGHT_AT[s].includes(t);
  if (k === K) return KING_AT[s].includes(t);
  if (k === P) {
    const dr = white ? -1 : 1;
    return rowOf(t) === rowOf(s) + dr && Math.abs(fileOf(t) - fileOf(s)) === 1;
  }
  const lo = k === B ? 4 : 0, hi = k === R ? 4 : 8;
  for (let d = lo; d < hi; d++) {
    const ray = RAY[s][d];
    for (let i = 0; i < ray.length; i++) {
      if (ray[i] === t) return true;
      if (bd[ray[i]]) break;
    }
  }
  return false;
}

function keyClause(bd, keyMv, san) {
  const from = keyMv >> 6, to = keyMv & 63;
  const piece = kindOf(bd[from]);
  const capture = !!bd[to];
  const after = Int8Array.from(bd);
  after[to] = after[from]; after[from] = 0;
  const bk = kingSq(after, false);
  const check = attacked(after, bk, true);
  // A king cannot give check itself, and neither can a piece that does not see
  // the king: that is a discovery, and calling it "the check Kf3+" reads wrong.
  const direct = sees(after, to, bk);
  if (capture && check) return { text: `The capturing check ${san}`, kind: 'capturing check', piece };
  if (capture) return { text: `${san} takes a piece and gives no check`, kind: 'capture', piece };
  if (check && !direct) return { text: `The discovered check ${san}`, kind: 'discovered check', piece };
  if (check) return { text: `The check ${san}`, kind: 'check', piece };
  return { text: `A quiet ${NAME[piece]} move, ${san}`, kind: 'quiet', piece };
}

// ─── harvest ───────────────────────────────────────────────────────────────
function harvest(opts) {
  const mateIn = opts.mateIn;
  const rnd = mulberry32(opts.seed * 7919 + mateIn * 104729);
  const deadline = Date.now() + opts.seconds * 1000;
  const out = [];
  const seen = new Set();
  let drawn = 0, gated = 0, searched = 0;
  while (Date.now() < deadline) {
    const men = PIECE_BAND[0] + Math.floor(rnd() * (PIECE_BAND[1] - PIECE_BAND[0] + 1));
    const pos = samplePosition(rnd, men);
    drawn++;
    if (!pos) continue;
    const { bd, bk } = pos;
    if (flights(bd, bk) > FLIGHT_GATE) { gated++; continue; }
    const fen = toFen(bd);
    if (seen.has(fen)) continue;
    seen.add(fen);
    searched++;
    // "Never fewer" first: it is the cheapest of the two searches and rejects most.
    if (forces(bd, true, mateIn - 1, 0)) continue;
    const first = forcingFirst(bd, true, mateIn, 0);
    if (first.length !== 1) continue;
    const keyMv = first[0];
    // Quality bars.
    const wm = new Int32Array(256);
    const wCount = genLegal(bd, true, wm, 0);
    if (wCount < MIN_WHITE_MOVES) continue;
    const tree = buildTree(bd, keyMv, mateIn);
    if (!tree) continue;
    if (tree.replies < MIN_BLACK_REPLIES) continue;
    const json = JSON.stringify({ key: tree.key, lines: tree.lines });
    if (json.length > MAX_TREE_CHARS) continue;
    out.push({ fen, key: tree.key, sig: pos.sig, men, whiteMoves: wCount, replies: tree.replies, tree: json });
    if (out.length % 25 === 0) {
      console.error(`  ${out.length} candidates (drawn ${drawn}, searched ${searched}, gated ${gated})`);
    }
  }
  console.error(`harvest mate-in-${mateIn}: ${out.length} candidates from ${drawn} draws, ${searched} searched`);
  writeFileSync(opts.out, JSON.stringify(out));
}

// ─── confirmation on the shipped engine ────────────────────────────────────
// Everything above ran on the fast core. Nothing ships until app/mate/chess.js
// -- the engine the browser and the verifier both use -- agrees from the FEN
// alone: no faster mate, exactly one forcing first move, it is the stored key,
// and every node of the tree names exactly the legal replies.
function slowSolver() {
  const memo = new Map();
  const boardKey = (b) => b.map((x) => x || '.').join('');
  function forcesMateWithin(board, color, n) {
    if (n <= 0) return false;
    const key = `${boardKey(board)}|${color}|${n}`;
    if (memo.has(key)) return memo.get(key);
    const opp = color === WHITE ? BLACK : WHITE;
    let result = false;
    for (const mv of slowLegal(board, color)) {
      const next = slowApply(board, mv.from, mv.to);
      if (slowMate(next, opp)) { result = true; break; }
      if (n === 1) continue;
      const oppMoves = slowLegal(next, opp);
      if (oppMoves.length === 0) continue;
      let all = true;
      for (const omv of oppMoves) {
        if (!forcesMateWithin(slowApply(next, omv.from, omv.to), color, n - 1)) { all = false; break; }
      }
      if (all) { result = true; break; }
    }
    memo.set(key, result);
    return result;
  }
  function forcingFirstMoves(board, color, n) {
    const opp = color === WHITE ? BLACK : WHITE;
    const out = [];
    for (const mv of slowLegal(board, color)) {
      const next = slowApply(board, mv.from, mv.to);
      if (slowMate(next, opp)) { out.push(mv); continue; }
      if (n === 1) continue;
      const oppMoves = slowLegal(next, opp);
      if (oppMoves.length === 0) continue;
      let all = true;
      for (const omv of oppMoves) {
        if (!forcesMateWithin(slowApply(next, omv.from, omv.to), color, n - 1)) { all = false; break; }
      }
      if (all) out.push(mv);
    }
    return out;
  }
  return { forcesMateWithin, forcingFirstMoves };
}

function walkTree(board, node, depth, errs) {
  if (node.mate) {
    const { from, to } = uciSplit(node.mate);
    const legal = slowLegal(board, WHITE).some((m) => m.from === from && m.to === to);
    if (!legal) { errs.push(`illegal mate move ${node.mate} at depth ${depth}`); return; }
    if (!slowMate(slowApply(board, from, to), BLACK)) errs.push(`${node.mate} is not checkmate at depth ${depth}`);
    return;
  }
  const white = node.key || node.move;
  const { from, to } = uciSplit(white);
  if (!slowLegal(board, WHITE).some((m) => m.from === from && m.to === to)) {
    errs.push(`illegal White move ${white} at depth ${depth}`); return;
  }
  const after = slowApply(board, from, to);
  const legalReplies = slowLegal(after, BLACK).map((m) => slowUci(m.from, m.to)).sort();
  const stored = Object.keys(node.lines || {}).sort();
  if (legalReplies.join(',') !== stored.join(',')) {
    errs.push(`lines at depth ${depth} after ${white}: stored [${stored}] != legal [${legalReplies}]`);
    return;
  }
  for (const r of stored) {
    const rr = uciSplit(r);
    walkTree(slowApply(after, rr.from, rr.to), node.lines[r], depth + 1, errs);
  }
}
function uciSplit(u) {
  const sq = (s) => (8 - Number(s[1])) * 8 + (s.charCodeAt(0) - 97);
  return { from: sq(u.slice(0, 2)), to: sq(u.slice(2, 4)) };
}

function confirm(cand, mateIn) {
  const errs = [];
  const { board, turn } = parseFen(cand.fen);
  if (turn !== WHITE) errs.push('side to move is not White');
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq];
    if (p && p.toUpperCase() === 'P') {
      const rank = 8 - (sq >> 3);
      if (rank === 1 || rank === 2 || rank === 7 || rank === 8) errs.push(`pawn on rank ${rank}`);
    }
  }
  const { forcesMateWithin, forcingFirstMoves } = slowSolver();
  if (forcesMateWithin(board, WHITE, mateIn - 1)) errs.push(`mate in fewer than ${mateIn} exists`);
  const forcing = forcingFirstMoves(board, WHITE, mateIn);
  if (forcing.length !== 1) errs.push(`${forcing.length} forcing first moves, want 1`);
  let keySan = null;
  if (forcing.length === 1) {
    const found = slowUci(forcing[0].from, forcing[0].to);
    if (found !== cand.key) errs.push(`unique key ${found} != stored ${cand.key}`);
    keySan = toSan(board, forcing[0].from, forcing[0].to);
  }
  const tree = JSON.parse(cand.tree);
  if (tree.key !== cand.key) errs.push('tree key mismatch');
  walkTree(board, tree, 0, errs);
  return { errs, keySan, tree };
}

// ─── deal ──────────────────────────────────────────────────────────────────
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

function deal(opts) {
  const pool2 = JSON.parse(readFileSync(opts.pool2, 'utf8'));
  const pool3 = JSON.parse(readFileSync(opts.pool3, 'utf8'));
  const existing = readFileSync(opts.bank, 'utf8');
  const usedFens = new Set([...existing.matchAll(/fen: '([^']+)'/g)].map((m) => m[1].split(/\s+/)[0]));
  const usedMotifs = new Map();
  for (const m of existing.matchAll(/motif: '((?:[^'\\]|\\.)*)'/g)) {
    const s = m[1].replace(/\\'/g, "'");
    usedMotifs.set(s, (usedMotifs.get(s) || 0) + 1);
  }

  const days = [];
  for (let t = Date.parse(`${opts.from}T12:00:00Z`); t <= Date.parse(`${opts.to}T12:00:00Z`); t += 86400000) {
    days.push(new Date(t));
  }

  // Annotate every candidate with the descriptors the ceilings are counted on.
  const rnd = mulberry32(opts.seed * 31 + opts.startNum * 977);
  const annotate = (pool, mateIn) => pool.map((c, i) => ({ ...c, mateIn, order: rnd(), idx: i }))
    .sort((a, b) => (a.order - b.order) || (a.idx - b.idx));
  const pools = { 2: annotate(pool2, 2), 3: annotate(pool3, 3) };
  const cursor = { 2: 0, 3: 0 };

  const counts = { motif: new Map(), pattern: new Map(), keyPiece: new Map(), keyKind: new Map(), material: new Map(), matePiece: new Map(), mateSquare: new Map(), thin: new Map() };
  for (const [k, v] of usedMotifs) counts.motif.set(k, v);
  const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);
  const at = (m, k) => m.get(k) || 0;

  // THE DATES ARE FILLED IN A SHUFFLED ORDER, NOT CHRONOLOGICALLY. Greedy
  // ceiling enforcement in date order makes the bank drift -- the first weeks
  // take whatever the pool is richest in (quiet keys) and the last weeks get
  // only what is left (captures), which reads as a change of authorship
  // halfway through. Filling shuffled dates spreads that over the whole run;
  // the rows are sorted back into date order before they are numbered.
  const fillOrder = days.map((d, i) => ({ d, i, r: rnd() })).sort((a, b) => (a.r - b.r) || (a.i - b.i)).map((x) => x.d);

  const rows = [];
  const missed = [];
  const stats = { patterns: new Map(), keyPieces: new Map(), sigs: new Map(), kinds: new Map(), men: new Map(), replies: new Map(), mateSquares: new Map() };

  for (const d of fillOrder) {
    const iso = d.toISOString().slice(0, 10);
    const sunday = d.getUTCDay() === 0;
    const mateIn = sunday ? 3 : 2;
    const quizId = `mate-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`;
    let chosen = null;
    const pool = pools[mateIn];
    while (cursor[mateIn] < pool.length && !chosen) {
      const cand = pool[cursor[mateIn]++];
      if (usedFens.has(cand.fen.split(/\s+/)[0])) continue;
      // The Sunday Edition is bigger and defends harder, not just one move longer.
      if (sunday && (cand.men < SUNDAY_MIN_MEN || cand.replies < SUNDAY_MIN_REPLIES)) continue;
      const { errs, keySan, tree } = confirm(cand, mateIn);
      if (errs.length) { console.error(`  dropped ${cand.fen}: ${errs[0]}`); continue; }
      const bd = fromFen(cand.fen);
      const keyMv = (uciSplit(cand.key).from << 6) | uciSplit(cand.key).to;
      const kc = keyClause(bd, keyMv, keySan);
      // Walk the line the client will actually show and classify THAT mate.
      let node = tree, board = bd, guard = 0;
      while (node && !node.mate && guard++ < 6) {
        const wm = uciSplit(node.key || node.move);
        board = (() => { const b = Int8Array.from(board); b[wm.to] = b[wm.from]; b[wm.from] = 0; return b; })();
        const reply = pickReply(node, quizId);
        const rm = uciSplit(reply);
        board = (() => { const b = Int8Array.from(board); b[rm.to] = b[rm.from]; b[rm.from] = 0; return b; })();
        node = node.lines[reply];
      }
      if (!node || !node.mate) { console.error(`  dropped ${cand.fen}: main line did not end in mate`); continue; }
      const fin = uciSplit(node.mate);
      const cls = classifyMate(board, fin.from, fin.to);
      const article = /^[aeiou]/.test(cls.pattern) ? 'an' : 'a';
      const finish = mateIn === 3 ? 'and three moves later' : 'and then';
      const finale = cls.checker
        ? `the ${NAME[cls.matePiece]} clearing to ${cls.mateSquare} and the ${NAME[cls.checker]} behind it delivering`
        : `the ${NAME[cls.matePiece]} landing on ${cls.mateSquare}, ${cls.support}`;
      const motif = `${kc.text}, ${finish} ${article} ${cls.pattern}, ${finale}`;
      const desc = {
        motif, pattern: cls.pattern, keyPiece: LETTER[kc.piece], keyKind: kc.kind,
        material: cand.sig, matePiece: LETTER[cls.matePiece], mateSquare: cls.mateSquare,
        thin: cand.replies <= MIN_BLACK_REPLIES ? 'thin' : `wide${cand.replies}`,
      };
      let breach = null;
      for (const k of Object.keys(CEIL)) {
        if (k === 'thin' && desc.thin !== 'thin') continue;
        if (at(counts[k], desc[k]) + 1 > CEIL[k]) { breach = k; break; }
      }
      if (breach) continue;
      for (const k of Object.keys(CEIL)) { if (k === 'thin' && desc.thin !== 'thin') continue; bump(counts[k], desc[k]); }
      chosen = { cand, keySan, motif, desc };
    }
    if (!chosen) {
      // Dates are filled in shuffled order, so an exhausted pool leaves a HOLE
      // in the calendar rather than a short tail. That is a gap, which the bank
      // may never have, so it is collected and the run refuses to apply.
      missed.push(`${iso} (mate in ${mateIn}, pool exhausted after ${cursor[mateIn]} tries)`);
      continue;
    }
    usedFens.add(chosen.cand.fen.split(/\s+/)[0]);
    rows.push({
      quizId, live: iso,
      dateLabel: `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`,
      sunday, mateIn, fen: chosen.cand.fen, keySan: chosen.keySan,
      motif: chosen.motif, solution: chosen.cand.tree,
    });
    bump(stats.patterns, chosen.desc.pattern);
    bump(stats.keyPieces, chosen.desc.keyPiece);
    bump(stats.sigs, chosen.desc.material);
    bump(stats.kinds, chosen.desc.keyKind);
    bump(stats.men, String(chosen.cand.men));
    bump(stats.replies, String(chosen.cand.replies));
    bump(stats.mateSquares, chosen.desc.mateSquare);
  }
  rows.sort((a, b) => (a.live < b.live ? -1 : 1));
  rows.forEach((r, i) => { r.num = opts.startNum + i; });

  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const text = rows.map((r) => [
    '  {',
    `    num: ${r.num},`,
    `    quizId: '${r.quizId}',`,
    `    live: '${r.live}',`,
    `    dateLabel: '${r.dateLabel}',`,
    `    sunday: ${r.sunday},`,
    `    mateIn: ${r.mateIn},`,
    `    fen: '${r.fen}',`,
    `    keySan: '${esc(r.keySan)}',`,
    `    motif: '${esc(r.motif)}',`,
    `    solution: ${r.solution},`,
    '  },',
  ].join('\n')).join('\n');

  const show = (label, m) => console.error(`  ${label}: ${[...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}x${v}`).join(', ')}`);
  console.error(`dealt ${rows.length} boards, ${rows[0]?.live} .. ${rows[rows.length - 1]?.live}`);
  show('patterns', stats.patterns);
  show('key piece', stats.keyPieces);
  show('key kind', stats.kinds);
  show('men', stats.men);
  show('black replies to the key', stats.replies);
  show('material', stats.sigs);
  console.error(`  pool use: mate-in-2 ${cursor[2]}/${pools[2].length} candidates consumed, mate-in-3 ${cursor[3]}/${pools[3].length}`);
  const sat = Object.keys(CEIL).map((k) => {
    const hi = Math.max(0, ...counts[k].values());
    return `${k} ${hi}/${CEIL[k]}${hi >= CEIL[k] ? ' SATURATED' : ''}`;
  });
  console.error(`  ceilings: ${sat.join(', ')}`);

  if (missed.length) {
    console.error(`RAN OUT on ${missed.length} date(s):`);
    for (const m of missed) console.error(`  ${m}`);
    console.error('The calendar would have a gap; harvest a bigger pool and re-run.');
    process.exit(1);
  }
  if (opts.apply) {
    const marker = '\n];\n';
    const idx = existing.lastIndexOf(marker);
    if (idx < 0) throw new Error('could not find the closing "];" of the bank');
    const next = existing.slice(0, idx + 1) + text + '\n' + existing.slice(idx + 1);
    writeFileSync(opts.bank, next);
    console.error(`spliced ${rows.length} boards into ${opts.bank} (frozen bytes untouched above offset ${idx})`);
  } else {
    process.stdout.write(text + '\n');
  }
}

// ─── cli ───────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const cmd = argv[0];
const flag = (name, dflt) => {
  const i = argv.indexOf(`--${name}`);
  if (i < 0) return dflt;
  const v = argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};
if (cmd === 'harvest') {
  harvest({
    mateIn: Number(flag('mateIn', 2)),
    seconds: Number(flag('seconds', 60)),
    seed: Number(flag('seed', 63)),
    out: String(flag('out', `/tmp/build/mate-cand${flag('mateIn', 2)}.json`)),
  });
} else if (cmd === 'deal') {
  deal({
    from: String(flag('from', '2026-09-30')),
    to: String(flag('to', '2026-11-30')),
    startNum: Number(flag('startNum', 63)),
    seed: Number(flag('seed', 63)),
    pool2: String(flag('pool2', '/tmp/build/mate-cand2.json')),
    pool3: String(flag('pool3', '/tmp/build/mate-cand3.json')),
    bank: String(flag('bank', new URL('../app/mate/puzzles.js', import.meta.url).pathname)),
    apply: flag('apply', false) === true,
  });
} else {
  console.error('usage: gen-mate.mjs harvest --mateIn N --seconds S --seed X --out FILE');
  console.error('       gen-mate.mjs deal --from ISO --to ISO --startNum N [--apply]');
  process.exit(1);
}
