// scripts/verify-tangled.mjs — checks app/tangled/puzzles.js against the engine.
//   node scripts/verify-tangled.mjs
// Every row: dated in order and numbered from 1; shape and rope count match the
// calendar; a legal board (two empty holes, no hole used twice); the wraps agree
// with the holes (an odd chain exactly where two ropes' holes interleave,
// alternating tops, sides set on every real twist); the start holds at least
// MIN_CROSS crossings and at least one real twist, with no rope wound with two
// others; `solved` is legal and crossing-free; the generator's scramble played
// backward untangles the start (so every board is provably solvable); the pegs
// differ on every rope; and the row is exactly what the generator makes.
import { PUZZLES } from '../app/tangled/puzzles.js';
import { generate, dayParams, quizIdFor, seedFor, pegColours, legal, isSolved, applyMove, holes, wrapsConsistent, crossingCount, MIN_CROSS, PEG_PASTELS } from '../lib/tangled-engine.js';

let bad = 0;
const fail = (p, msg) => { bad++; console.error(`#${p.num} ${p.live}: ${msg}`); };
let prev = null;
const len = {};
PUZZLES.forEach((p, i) => {
  if (p.num !== i + 1) fail(p, 'numbering');
  if (prev && p.live <= prev) fail(p, 'dates out of order');
  prev = p.live;
  if (p.quizId !== quizIdFor(p.live)) fail(p, 'quizId');
  const dp = dayParams(p.live);
  if (p.shape !== dp.shape || p.R !== dp.R) fail(p, 'shape or rope count off the calendar');
  if (p.sunday !== (dp.dow === 0)) fail(p, 'sunday flag');
  if (p.H !== 2 * p.R + 2 || p.ropes.length !== p.R) fail(p, 'size');
  if (!legal(p.ropes, p.H)) fail(p, 'start board illegal');
  if (!p.wraps || !wrapsConsistent(p.ropes, p.wraps)) fail(p, 'wraps disagree with the holes');
  if (!legal(p.solved, p.H) || !isSolved(p.solved, {})) fail(p, 'solved board illegal or crossing');
  if (crossingCount(p.wraps) < (MIN_CROSS[p.R] || 0)) fail(p, `only ${crossingCount(p.wraps)} crossings`);
  const tw = Object.keys(p.wraps || {}).filter((k) => p.wraps[k].c.length >= 2), inTw = tw.flatMap((k) => k.split('-'));
  if (!tw.length) fail(p, 'no real twist');
  if (new Set(inTw).size !== inTw.length) fail(p, 'a rope wound with two others');
  if (!p.pegs || p.pegs.length !== p.R || p.pegs.some(([a, b]) => a === b || a < 0 || b < 0 || a >= PEG_PASTELS.length || b >= PEG_PASTELS.length)) fail(p, 'pegs');
  const seed = seedFor(p.live, p.shape);
  const g = generate(seed, p.R, p.shape);
  if (JSON.stringify(g.ropes) !== JSON.stringify(p.ropes) || JSON.stringify(g.wraps) !== JSON.stringify(p.wraps) || JSON.stringify(g.solved) !== JSON.stringify(p.solved)) fail(p, 'not what the generator makes');
  if (JSON.stringify(pegColours(seed, p.R)) !== JSON.stringify(p.pegs)) fail(p, 'pegs not what the generator makes');
  const pos = holes(p.shape, p.H);
  let st = { ropes: p.ropes, wraps: p.wraps };
  for (let k = g.scramble.length - 1; k >= 0; k--) { const [r, e, f] = g.scramble[k]; st = applyMove(st.ropes, st.wraps, r, e, f, pos); }
  if (!isSolved(st.ropes, st.wraps)) fail(p, 'the scramble backward does not untangle it');
  (len[p.R] = len[p.R] || []).push(g.scramble.length);
});
for (const R of Object.keys(len)) {
  const a = len[R];
  console.log(`  ${R} ropes: solvable in at most ${Math.min(...a)} to ${Math.max(...a)} moves (mean ${(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1)}) over ${a.length} boards`);
}
if (bad) { console.error(`verify-tangled: ${bad} problem(s)`); process.exit(1); }
console.log(`verify-tangled: ${PUZZLES.length} boards OK (${PUZZLES[0].live} to ${PUZZLES[PUZZLES.length - 1].live})`);
