// Play every Gift board out with the SHIPPED engine (lib/gift-core.js), the
// way the browser plays it, and prove three things:
//   1. the key first move, followed by best play from both sides through
//      reply(), wins on or before placement winIn;
//   2. every other first move, followed by best play from both sides, ends in
//      a loss or a draw for the player, never a win;
//   3. every reply is legal (an empty square, a piece still off the board) and
//      every game ends, so no line can strand a player.
// scripts/verify-gift.mjs proves the claims with its own solver; this proves
// the engine the browser runs agrees with them.
//
//   node scripts/verify-gift-playout.mjs           (about a minute)
//   node scripts/verify-gift-playout.mjs --quick   (the key line only)
import { PUZZLES } from '../app/gift/puzzles.js';
import { makeSolver, reply, decodeBoard, parsePiece, winsAt, poolOf } from '../lib/gift-core.js';

const QUICK = process.argv.includes('--quick');
let failures = 0, games = 0, slowest = 0;
const fail = (m) => { failures++; console.error('FAIL ' + m); };

function playOut(S, board, hand, firstSq, firstGive, num) {
  const b = board.slice();
  let h = hand, me = true, mine = 0, sq = firstSq, give = firstGive;
  for (let ply = 0; ply < 20; ply++) {
    if (ply > 0) {
      const t = Date.now();
      const r = reply(S, b, h);
      slowest = Math.max(slowest, Date.now() - t);
      if (!r) { fail(`#${num}: no reply found`); return null; }
      sq = r.sq; give = r.give;
    }
    if (b[sq] !== -1) { fail(`#${num}: a move onto an occupied square`); return null; }
    b[sq] = h;
    if (me) mine++;
    if (winsAt(b, sq)) return { result: me ? 'won' : 'lost', mine };
    if (!b.includes(-1)) return { result: 'draw', mine };
    if (give < 0 || !poolOf(b, -1).includes(give) || give === h) { fail(`#${num}: an illegal piece handed over`); return null; }
    h = give; me = !me;
  }
  fail(`#${num}: the game did not end`);
  return null;
}

const t0 = Date.now();
for (const p of PUZZLES) {
  const board = decodeBoard(p.board), hand = parsePiece(p.hand), key = parsePiece(p.keyGive);
  const S = makeSolver();
  const k = playOut(S, board, hand, p.keySq, key, p.num);
  games++;
  if (k && (k.result !== 'won' || k.mine > p.winIn)) fail(`#${p.num}: the key line ends ${k.result} on placement ${k.mine}, winIn ${p.winIn}`);
  if (QUICK) continue;
  for (let s = 0; s < 16; s++) {
    if (board[s] !== -1) continue;
    const b1 = board.slice(); b1[s] = hand;
    for (const g of poolOf(b1, hand)) {
      if (s === p.keySq && g === key) continue;
      const r = playOut(S, board, hand, s, g, p.num);
      games++;
      if (r && r.result === 'won') fail(`#${p.num}: first move ${s}/${g} also wins under best play`);
    }
  }
}
console.log(`verify-gift-playout: ${PUZZLES.length} boards, ${games} games played out, slowest reply ${slowest}ms, ${failures} failures (${Math.round((Date.now() - t0) / 1000)}s)`);
process.exit(failures ? 1 : 0);
