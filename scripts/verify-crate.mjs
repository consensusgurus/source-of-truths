// verify-crate: the checker for Crate (app/crate/puzzles.js), discovered by
// scripts/verify-all.mjs. Recomputes every rule in the bank's header with the
// page's own engine (lib/crate-engine.js):
//   - one board a day from 2026-11-18, num in order, quizId / dateLabel read off
//     `live`, the band from the weekday (scripts/gen-crate.mjs THE WEEK), and
//     `sunday` exactly on Sundays;
//   - a well-formed warehouse: rows the same width, only the map characters, one
//     worker, the band's number of crates and as many spots, every crate, spot
//     and the worker inside the walls, no crate starting on a spot;
//   - the stored line replays from the start to every crate on a spot, in
//     exactly best.moves moves and best.pushes pushes;
//   - best.moves is the TRUE best: an exact backwards search over every state of
//     the warehouse finds no shorter line, and on the smaller boards a plain
//     forward breadth-first solve agrees with it;
//   - best.moves falls in the band's range.
// Shown to fail on a board whose stored best was one move too high, on a stored
// line with a blocked move, and on a Tuesday board marked tough.
//   node scripts/verify-crate.mjs
import { PUZZLES } from '../app/crate/puzzles.js';
import { parseMap, replay, solve, exactDistances, bestLine, stateCount } from '../lib/crate-engine.js';
import { BANDS, bandFor } from './gen-crate.mjs';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
let fails = 0;
const bad = (p, m) => { fails++; console.log(`  FAIL No. ${p.num} (${p.live}): ${m}`); };
let day = new Date('2026-11-18T12:00:00Z');
const ids = new Set();
for (const [i, p] of PUZZLES.entries()) {
  const ds = day.toISOString().slice(0, 10);
  if (p.num !== i + 1) bad(p, `num ${p.num}, expected ${i + 1}`);
  if (p.live !== ds) bad(p, `live ${p.live}, expected ${ds}`);
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `crate-${m}-${d}-${String(y).slice(2)}`) bad(p, `quizId ${p.quizId}`);
  if (ids.has(p.quizId)) bad(p, 'duplicate quizId'); ids.add(p.quizId);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${d}, ${y}`) bad(p, `dateLabel ${p.dateLabel}`);
  const band = bandFor(p.live);
  if (p.band !== band) bad(p, `band ${p.band}, the ${p.live} weekday is ${band}`);
  if (!!p.sunday !== (band === 'sunday')) bad(p, `sunday flag ${!!p.sunday} on a ${band} day`);
  if (!p.title || typeof p.title !== 'string') bad(p, 'no title');
  const B = BANDS[p.band] || BANDS.moderate;
  // the warehouse
  const w = p.map[0].length;
  if (!p.map.every((r) => r.length === w)) bad(p, 'rows differ in width');
  if (!p.map.every((r) => /^[# .$*@+-]+$/.test(r))) bad(p, 'a character outside # .$*@+-');
  const all = p.map.join('');
  if ((all.match(/[@+]/g) || []).length !== 1) bad(p, 'not exactly one worker');
  if (/\*/.test(all)) bad(p, 'a crate starts on a spot');
  const M = parseMap(p.map);
  if (M.boxes.length !== B.n) bad(p, `${M.boxes.length} crates, a ${p.band} day has ${B.n}`);
  if (M.goals.length !== M.boxes.length) bad(p, `${M.goals.length} spots for ${M.boxes.length} crates`);
  for (const c of [...M.boxes, ...M.goals]) if (!M.inside[c]) bad(p, `square ${c} is outside the walls`);
  for (let y2 = 0; y2 < M.H; y2++) for (let x = 0; x < M.W; x++) {
    const i2 = y2 * M.W + x;
    if (M.inside[i2] && (x === 0 || y2 === 0 || x === M.W - 1 || y2 === M.H - 1)) bad(p, `floor at the edge (${x},${y2}) with no wall`);
  }
  // the stored line
  const r = replay(M, p.sol || '');
  if (!r) bad(p, 'the stored line has a blocked move');
  else {
    if (!r.solved) bad(p, 'the stored line does not finish the job');
    if (r.moves !== p.best.moves) bad(p, `stored line is ${r.moves} moves, best says ${p.best.moves}`);
    if (r.pushes !== p.best.pushes) bad(p, `stored line has ${r.pushes} pushes, best says ${p.best.pushes}`);
  }
  // the true best
  if (stateCount(M) > 6e7) bad(p, 'too big to prove the best');
  else {
    const line = bestLine(M, exactDistances(M));
    if (!line) bad(p, 'the exact search finds no solution');
    else if (line.moves !== p.best.moves) bad(p, `the exact search finds ${line.moves} moves, best says ${p.best.moves}`);
    if (stateCount(M) <= 2e6) {
      const f = solve(M, 4e6);
      if (!f || f.moves !== p.best.moves) bad(p, `forward solve finds ${f ? f.moves : 'nothing'}, best says ${p.best.moves}`);
    }
  }
  if (p.best.moves < B.moves[0] || p.best.moves > B.moves[1]) bad(p, `best ${p.best.moves} outside the ${p.band} range ${B.moves.join(' to ')}`);
  day = new Date(day.getTime() + 86400000);
}
const lastLive = PUZZLES[PUZZLES.length - 1].live;
console.log(`verify-crate: ${PUZZLES.length} boards, ${PUZZLES[0].live} to ${lastLive}, ${fails ? `${fails} FAILURE(S)` : 'all good'}`);
process.exit(fails ? 1 : 0);
