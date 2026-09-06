// Generate candidate boards for Defend, the daily chess save.
//
// THE SHAPE IT SEARCHES FOR. Black to move, Black NOT in check, and White
// already threatening mate. Every legal black move loses to a forced mate
// within `holdFor` white moves EXCEPT ONE. Then, after White's stubbornest
// answer, exactly one move survives AGAIN.
//
// Not in check is deliberate. A defender in check has three or four legal moves
// and the puzzle solves itself by elimination; the point here is a wide board
// where a dozen moves look playable and one of them is not a disaster.
//
// PARRIES IS THE QUALITY BAR, not the move count. A board where only one move
// even answers the immediate threat is a forced move, not a puzzle. So the
// search counts how many black moves stop the CURRENT threat (how many look
// like a defence at a glance) and demands at least MIN_PARRIES of them, which
// means at least four convincing decoys alongside the real save. Day one of the
// live bank ran a floor of three and players brute-forced it by trying each
// parry in turn, so the floor is what makes the board cost more than five
// ten-second attempts.
//
// THE FOLLOW-UP IS A SECOND PUZZLE, NOT A CONFIRMATION. MAX_FOLLOWUP caps how
// many saving replies exist after White's best try. At 1 the player has to find
// a second only-move, so surviving the key buys the next question rather than
// the day.
//
// THE SAVE MUST BE A REFUTATION, NOT A DELAY. An accepted key is re-searched at
// holdFor + 1 and thrown out if White still forces mate. What the game claims
// when you survive is that the attack was answered, and this is the line that
// makes that true.
//
// TWO ENGINES, ON PURPOSE. The sifting runs on scripts/defend-fast.mjs, which is
// quick and is NOT what ships. Every candidate that survives the sift is then
// re-checked in full (every legal move, the parry count, uniqueness, the deeper
// refutation) by app/defend/defense.js, the engine the browser actually plays,
// and only then written out. scripts/verify-defend.mjs re-derives all of it a
// third time. So the fast core can only cost throughput, never correctness.
//
// DETERMINISM. The candidate stream is driven by a seeded xorshift32, not
// Math.random, so a run with the same seed proposes the same positions in the
// same order and an unchanged run reproduces byte-identically. The seed is
// argv[5] and the OFFSET is the caller's job: the 2026-10-06 extension seeds
// from the first new board number (57) so the new segment cannot replay the
// stream that produced the frozen one. The seconds budget only decides how far
// down that stream a run gets, so pin `trials` (argv[6]) as well when an exact
// byte-for-byte replay matters rather than just a reproducible stream.
//
// Run:  node scripts/gen-defend.mjs <holdFor> <seconds> <outfile> [seed] [trials]
import { legalMoves as slowLegal, applyMove as slowApply, inCheck as slowInCheck, toSan, squareName, WHITE, BLACK } from '../app/mate/chess.js';
import { makeMateSearch, stubbornestReply } from '../app/defend/defense.js';
import { makeFastSearch, legal as fastLegal, inCheck as fastInCheck, uciOf, from64 } from './defend-fast.mjs';
import { writeFileSync, existsSync, readFileSync } from 'node:fs';

const HOLD = Number(process.argv[2] || 3);
const SECS = Number(process.argv[3] || 300);
const OUT = process.argv[4] || `/tmp/defend-cand${HOLD}.json`;

const MIN_MOVES = 12;      // legal black replies, so the board is a real search
const MIN_PARRIES = 5;     // moves that answer the immediate threat: the decoys
const MAX_FOLLOWUP = 1;    // saving replies after White's best try: a second only-move
const MIN_PIECES = 6;
const MAX_PIECES = 9;
// A hold-for-four board is already four only-moves deep, and searching a fifth
// costs more than the rest of the run put together, so the deeper refutation is
// checked at holdFor + 1 only while that is affordable. Above it the board still
// has to survive its full budget, which is the claim the game actually makes.
const REFUTE_DEPTH = HOLD <= 3 ? HOLD + 1 : HOLD;

const SEED = Number(process.argv[5] || 1);
const MAX_TRIALS = Number(process.argv[6] || 0) || Infinity;
let _rs = (SEED >>> 0) || 0x9e3779b9;
const rnd = () => { _rs ^= _rs << 13; _rs >>>= 0; _rs ^= _rs >>> 17; _rs ^= _rs << 5; _rs >>>= 0; return _rs / 4294967296; };
const R = (n) => Math.floor(rnd() * n);
const WSETS = [['Q', 'R'], ['Q', 'N'], ['R', 'R'], ['Q', 'B'], ['R', 'B'], ['R', 'N'], ['Q', 'R', 'N'],
  ['R', 'R', 'B'], ['Q', 'N', 'N'], ['Q', 'R', 'B'], ['R', 'B', 'N'], ['Q', 'P'], ['R', 'R', 'N'], ['Q', 'B', 'N']];
const BSETS = [['r'], ['b'], ['n'], ['q'], ['r', 'n'], ['r', 'b'], ['b', 'n'], ['r', 'p'], ['n', 'p'],
  ['b', 'p'], ['q', 'p'], ['r', 'r'], ['r', 'b', 'p'], ['n', 'n'], ['q', 'n']];
const VAL = { q: 9, r: 5, b: 3, n: 3, p: 1 };
const NAME = { K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight', P: 'pawn' };
const CODE = { P: 1, N: 2, B: 3, R: 4, Q: 5, K: 6 };

function randPos() {
  const b = new Array(64).fill(null);
  const free = () => { for (let t = 0; t < 200; t++) { const s = R(64); if (!b[s]) return s; } return -1; };
  let bk;
  for (;;) { bk = R(64); const r = bk >> 3, f = bk & 7; if (r <= 1 || r >= 6 || f <= 1 || f >= 6) break; }
  b[bk] = 'k';
  let wk;
  for (;;) {
    wk = R(64);
    if (b[wk]) continue;
    if (Math.max(Math.abs((wk >> 3) - (bk >> 3)), Math.abs((wk & 7) - (bk & 7))) > 1) break;
  }
  b[wk] = 'K';
  for (const p of WSETS[R(WSETS.length)]) {
    const s = free(); if (s < 0) continue;
    if (p === 'P' && ((s >> 3) < 2 || (s >> 3) > 5)) continue;   // no promotion, no double push
    b[s] = p;
  }
  for (const p of BSETS[R(BSETS.length)]) {
    const s = free(); if (s < 0) continue;
    if (p === 'p' && ((s >> 3) < 2 || (s >> 3) > 5)) continue;
    b[s] = p;
  }
  return b;
}
function toFast(a) {
  const bd = new Int8Array(128);
  for (let i = 0; i < 64; i++) {
    const p = a[i];
    if (!p) continue;
    const k = CODE[p.toUpperCase()];
    bd[from64(i)] = p === p.toUpperCase() ? k : -k;
  }
  return bd;
}
function toFen(board, turn) {
  let out = '';
  for (let r = 0; r < 8; r++) {
    let empty = 0;
    for (let f = 0; f < 8; f++) {
      const p = board[r * 8 + f];
      if (!p) empty++;
      else { if (empty) { out += empty; empty = 0; } out += p; }
    }
    if (empty) out += empty;
    if (r < 7) out += '/';
  }
  return `${out} ${turn} - - 0 1`;
}

// White to move and unable to force mate. How few saving replies can it leave
// Black? This mirrors stubbornestReply in app/defend/defense.js on the fast
// core, including its stalemate trap: a white move leaving Black no legal move
// at all is a DRAW, which for Defend is a save, so it scores Infinity and is
// never chosen. The search stops at 1 because that is the cap it is measured
// against and nothing can beat it.
function fastFollowUp(bd, f, remaining) {
  let best = Infinity;
  for (const m of fastLegal(bd, true)) {
    const fr = m >> 8, to = m & 255;
    const cap = bd[to];
    bd[to] = bd[fr]; bd[fr] = 0;
    const reps = fastLegal(bd, false);
    let saving;
    if (!reps.length) saving = Infinity;
    else {
      saving = 0;
      for (const r of reps) {
        const rf = r >> 8, rt = r & 255;
        const rcap = bd[rt];
        bd[rt] = bd[rf]; bd[rf] = 0;
        if (!f(bd, true, remaining - 1)) saving++;
        bd[rf] = bd[rt]; bd[rt] = rcap;
      }
      if (saving === 0) saving = Infinity;
    }
    bd[fr] = bd[to]; bd[to] = cap;
    if (saving < best) best = saving;
    if (best <= 1) break;
  }
  return best;
}

function isInterposition(board, to) {
  const kingSq = board.indexOf('k');
  if (kingSq < 0) return false;
  const kr = kingSq >> 3, kf = kingSq & 7, tr = to >> 3, tf = to & 7;
  const dr = Math.sign(tr - kr), df = Math.sign(tf - kf);
  if (dr === 0 && df === 0) return false;
  if (dr !== 0 && df !== 0 && Math.abs(tr - kr) !== Math.abs(tf - kf)) return false;
  let r = tr + dr, f = tf + df;
  while (r >= 0 && r < 8 && f >= 0 && f < 8) {
    const p = board[r * 8 + f];
    if (p) {
      const kind = p.toUpperCase();
      if (p !== kind) return false;
      if (kind === 'Q') return true;
      if (kind === 'R') return dr === 0 || df === 0;
      if (kind === 'B') return dr !== 0 && df !== 0;
      return false;
    }
    r += dr; f += df;
  }
  return false;
}

function motifFor(board, key, after) {
  const piece = NAME[(board[key.from] || 'P').toUpperCase()];
  const sq = squareName(key.to);
  const captured = board[key.to] ? NAME[board[key.to].toUpperCase()] : null;
  const gives = slowInCheck(after, WHITE);
  const pick = (arr) => arr[(key.from * 7 + key.to * 3) % arr.length];
  if (captured) {
    return pick([
      `Take the attacker. The ${piece} captures the ${captured} on ${sq}, and every other parry leaves the net standing.`,
      `The net has one loose thread. The ${piece} takes the ${captured} on ${sq}, and nothing quieter holds.`,
      `Remove the piece doing the work. The ${piece} takes on ${sq}, which is the only defence that changes the material on the board.`,
    ]);
  }
  if (gives) {
    return pick([
      `A counter-check. The ${piece} to ${sq} makes White answer you first, which is the only way to break the tempo.`,
      `Check, and the attack has to stop and deal with it. The ${piece} to ${sq} buys the move nothing else buys.`,
      `Hand the move back. The ${piece} to ${sq} checks, and an attacker in check cannot finish.`,
    ]);
  }
  if ((board[key.from] || '') === 'k') {
    return pick([
      `The right flight square. The king steps to ${sq}, and it is the only square still uncovered a move later.`,
      `Walk, but walk the correct way. The king to ${sq} is the one escape that is not a mating square in disguise.`,
      `The king saves itself on ${sq}. Every other square looks just as open and every other square is covered.`,
    ]);
  }
  if (isInterposition(board, key.to)) {
    return pick([
      `Interpose. The ${piece} to ${sq} plugs the line, and it is the only body that can hold the square.`,
      `Block the line rather than run down it. The ${piece} to ${sq} is the only piece that gets there in time.`,
      `The ${piece} throws itself in the way on ${sq}, which is worth exactly one move and one move is all you need.`,
    ]);
  }
  return pick([
    `A quiet defence. The ${piece} to ${sq} covers the mating square, and nothing louder does.`,
    `No check, no capture, no escape. The ${piece} to ${sq} simply guards the square the mate needs.`,
    `The move that looks like nothing. The ${piece} to ${sq} takes the mating square away and there is no second way to do it.`,
  ]);
}

// The full claim, re-derived with the SHIPPED engine. Nothing reaches the bank
// on the fast core's word alone.
function confirm(a) {
  const s = makeMateSearch();
  if (slowInCheck(a, WHITE) || slowInCheck(a, BLACK)) return null;
  const bm = slowLegal(a, BLACK);
  if (bm.length < MIN_MOVES) return null;
  if (!s.forcesMateWithin(a, WHITE, HOLD - 1)) return null;
  const survivors = [];
  let parries = 0;
  for (const mv of bm) {
    const next = slowApply(a, mv.from, mv.to);
    if (s.forcesMateWithin(next, WHITE, HOLD - 1)) continue;
    parries++;
    if (!s.forcesMateWithin(next, WHITE, HOLD)) survivors.push(mv);
  }
  if (survivors.length !== 1 || parries < MIN_PARRIES) return null;
  const key = survivors[0];
  const after = slowApply(a, key.from, key.to);
  if (s.forcesMateWithin(after, WHITE, REFUTE_DEPTH)) return null;
  const reply = stubbornestReply(after, HOLD, s);
  if (!reply) return null;
  if (reply.saving === Infinity || reply.saving > MAX_FOLLOWUP) return null;
  return { key, after, reply, parries, moves: bm.length };
}

const prior = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : [];
const out = prior.slice();
const seen = new Set(prior.map((x) => x.fen.split(' ')[0]));
const t0 = Date.now();
let tried = 0, threat = 0, sifted = 0;

while ((Date.now() - t0) / 1000 < SECS && tried < MAX_TRIALS) {
  tried++;
  const a = randPos();
  const pieces = a.filter(Boolean).length;
  if (pieces < MIN_PIECES || pieces > MAX_PIECES) continue;
  if (!a.some((p) => p && p !== 'k' && p === p.toLowerCase())) continue;

  // ── the fast sift ────────────────────────────────────────────────────────
  const bd = toFast(a);
  if (fastInCheck(bd, true) || fastInCheck(bd, false)) continue;
  const moves = fastLegal(bd, false);
  if (moves.length < MIN_MOVES) continue;
  const f = makeFastSearch();
  if (!f(bd, true, HOLD - 1)) continue;
  threat++;

  // A move that loses to the SHORTER mate cannot survive the longer one, so the
  // expensive holdFor-deep search only ever runs on moves that answered the
  // threat. On a hold-for-four board that is four moves out of twenty rather
  // than all twenty, which is most of what makes the bank generable at all.
  let parries = 0, survivors = 0, keyMove = -1, dead = false;
  for (const m of moves) {
    const fr = m >> 8, to = m & 255;
    const cap = bd[to];
    bd[to] = bd[fr]; bd[fr] = 0;
    const shorter = f(bd, true, HOLD - 1);
    if (!shorter) {
      parries++;
      if (!f(bd, true, HOLD)) { survivors++; keyMove = m; if (survivors > 1) dead = true; }
    }
    bd[fr] = bd[to]; bd[to] = cap;
    if (dead) break;
  }
  if (dead || survivors !== 1 || parries < MIN_PARRIES) continue;

  // The refutation and the follow-up are the two checks that reject most
  // candidates, so they run HERE on the fast core rather than in confirm().
  // Paying the shipped engine's price to reject twenty boards for every one it
  // keeps was the whole cost of the run.
  {
    const fr = keyMove >> 8, to = keyMove & 255;
    const cap = bd[to];
    bd[to] = bd[fr]; bd[fr] = 0;
    const delays = f(bd, true, REFUTE_DEPTH);
    const follow = delays ? Infinity : fastFollowUp(bd, f, HOLD);
    bd[fr] = bd[to]; bd[to] = cap;
    if (delays || follow > MAX_FOLLOWUP) continue;
  }
  sifted++;

  // ── the shipped engine has the last word ─────────────────────────────────
  const ok = confirm(a);
  if (!ok) continue;
  if (uciOf(keyMove >> 8, keyMove & 255) !== ok.key.uci) continue;   // the two engines must agree

  const fen = toFen(a, 'b');
  const pos = fen.split(' ')[0];
  if (seen.has(pos)) continue;
  seen.add(pos);

  out.push({
    fen,
    holdFor: HOLD,
    key: ok.key.uci,
    keySan: toSan(a, ok.key.from, ok.key.to),
    reply: ok.reply.uci,
    parries: ok.parries,
    followUp: ok.reply.saving,
    moves: ok.moves,
    pieces,
    white: a.reduce((acc, p) => acc + (p && p === p.toUpperCase() && p !== 'K' ? VAL[p.toLowerCase()] : 0), 0),
    black: a.reduce((acc, p) => acc + (p && p === p.toLowerCase() && p !== 'k' ? VAL[p] : 0), 0),
    motif: motifFor(a, ok.key, ok.after),
  });
  writeFileSync(OUT, JSON.stringify(out));   // every keep: a hold-for-four run finds fewer than five, so a periodic write would lose the lot if the run is cut short
}

writeFileSync(OUT, JSON.stringify(out));
console.log(JSON.stringify({ holdFor: HOLD, seed: SEED, tried, threat, sifted, kept: out.length, secs: ((Date.now() - t0) / 1000).toFixed(0) }));
