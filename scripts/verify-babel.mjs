// Verifier for the Babel bank. Run after ANY edit to app/babel/puzzles.js or
// lib/babel-engine.js:
//
//   node scripts/verify-babel.mjs [--from 2026-08-02] [--to 2026-09-08]
//
// A full pass re-solves every banked endgame, which on a long bank runs past a
// sandbox job limit, so --from/--to narrow the run to a window of live dates.
// Both bounds are inclusive and both default to open, so the bare command still
// checks the WHOLE bank: the window is a way to split one full pass across
// several calls, never a way to skip a day. Chunked runs only count as a clean
// verification if the windows cover the bank end to end.
//
// Four checks per banked day, and the fourth is the one that matters:
//
//   1. the benchmark recomputes from the stored board to the stored number.
//   2. greedy recomputes likewise.
//   3. the opponent's rack the CLIENT derives (bag minus board minus your rack)
//      is exactly the rack the generator banked. If this ever fails, the client
//      is playing a different game from the one that was solved.
//   4. THE BENCHMARK IS ACTUALLY REACHABLE: play the solver's own line against the very
//      defence the client runs (bestReply), and the final spread must land on
//      benchmark. A benchmark nobody can hit is a broken promise, and only a full playout
//      catches it — recomputing the number proves nothing about whether the
//      defence in the browser matches the defence in the search.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BAG, buildLexicon, rowsToBoard, generateMoves, applyMove, solveLine, rackSum,
} from '../lib/babel-engine.js';
import { PUZZLES } from '../app/babel/puzzles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const FROM = (args.indexOf('--from') >= 0 ? args[args.indexOf('--from') + 1] : null);
const TO = (args.indexOf('--to') >= 0 ? args[args.indexOf('--to') + 1] : null);

const lex = buildLexicon(fs.readFileSync(path.join(ROOT, 'public/babel-common.txt'), 'utf8').split('\n'));

function deriveFoe(rows, rack) {
  const left = { ...BAG };
  for (const row of rows) for (const ch of row) if (ch !== '.') left[ch] = (left[ch] || 0) - 1;
  for (const L of rack) left[L] = (left[L] || 0) - 1;
  const out = [];
  for (const L of Object.keys(left)) {
    if (left[L] < 0) return { bad: `negative count for ${L}` };
    for (let i = 0; i < left[L]; i++) out.push(L);
  }
  return { rack: out };
}

function greedyLine(board, me0, opp0) {
  let b = board, me = me0.slice(), opp = opp0.slice();
  let spread = 0, passes = 0, turn = 0, guard = 0;
  while (guard++ < 40) {
    const rack = turn === 0 ? me : opp;
    const moves = generateMoves(b, rack, lex);
    if (!moves.length) {
      passes++;
      if (passes >= 2) break;
      turn = 1 - turn; continue;
    }
    passes = 0;
    const mv = moves[0];
    const res = applyMove(b, rack, mv);
    b = res.board;
    if (turn === 0) { me = res.rack; spread += mv.score; }
    else { opp = res.rack; spread -= mv.score; }
    if ((turn === 0 ? me : opp).length === 0) {
      return spread + (turn === 0 ? 1 : -1) * 2 * rackSum(turn === 0 ? opp : me);
    }
    turn = 1 - turn;
  }
  return spread + (rackSum(opp) - rackSum(me));
}

let fail = 0, checked = 0;

// Structure, cheap and bank-wide whatever --from/--to say (2026-11-12, the Dec
// restock): from BABEL_RULES_FROM the player holds five tiles on a weekday and
// six in the Sunday Edition (the header's rule), and no board repeats an
// earlier board's grid or its rack pair (gen-babel.mjs --avoid's rule, until
// now enforced only by the generator). Earlier boards are frozen.
const BABEL_RULES_FROM = '2026-12-01';
{
  const grids = new Map(), racks = new Map();
  for (const p of PUZZLES) {
    const g = p.board.join('|'), r = `${p.rack.slice().sort().join('')}/${p.foe.slice().sort().join('')}`;
    if (p.live >= BABEL_RULES_FROM) {
      const problems = [];
      const want = p.sunday ? 6 : 5;
      if (p.rack.length !== want) problems.push(`rack of ${p.rack.length}, want ${want}${p.sunday ? ' (Sunday Edition)' : ''}`);
      if (grids.has(g)) problems.push(`board repeats ${grids.get(g)}`);
      if (racks.has(r)) problems.push(`rack pair repeats ${racks.get(r)}`);
      if (problems.length) { fail++; console.error(`FAIL ${p.live} #${p.num}\n   ${problems.join('\n   ')}`); }
    }
    if (!grids.has(g)) grids.set(g, p.live);
    if (!racks.has(r)) racks.set(r, p.live);
  }
}

for (const p of PUZZLES) {
  if (FROM && p.live < FROM) continue;
  if (TO && p.live > TO) continue;
  checked++;
  const board = rowsToBoard(p.board);
  const problems = [];

  const d = deriveFoe(p.board, p.rack);
  if (d.bad) problems.push(`bag accounting: ${d.bad}`);
  else if (d.rack.slice().sort().join('') !== p.foe.slice().sort().join('')) {
    problems.push(`derived foe ${d.rack.slice().sort().join('')} != banked ${p.foe.slice().sort().join('')}`);
  }

  const gr = greedyLine(board, p.rack, p.foe);
  if (gr !== p.greedy) problems.push(`greedy ${p.greedy} recomputes to ${gr}`);

  // The one that matters: replay the solver's line against the browser's own
  // defence and confirm the spread lands exactly on the banked benchmark.
  const out = solveLine(board, p.rack, p.foe, lex);
  if (out.end === 'guard') problems.push('playout did not terminate');
  else if (out.spread !== p.benchmark) {
    const pretty = out.line.map((m) => `${m.who === 'you' ? 'you' : 'them'}:${m.word}${m.score ? '+' + m.score : ''}`).join(' ');
    problems.push(`BENCHMARK NOT REACHABLE: the line yields ${out.spread}, benchmark claims ${p.benchmark} [${pretty}]`);
  }
  if (out.spread <= p.greedy) problems.push(`benchmark ${p.benchmark} does not beat greedy ${p.greedy}`);

  if (problems.length) { fail++; console.error(`FAIL ${p.live} #${p.num}\n   ${problems.join('\n   ')}`); }
  else console.log(`ok   ${p.live} #${p.num}  benchmark ${p.benchmark >= 0 ? '+' : ''}${p.benchmark}  greedy ${p.greedy >= 0 ? '+' : ''}${p.greedy}  ${out.line.length} plies  ${out.end}`);
}

console.log(`\n${checked - fail}/${checked} puzzles verified`);
if (fail) { console.error(`${fail} FAILURES`); process.exit(1); }
