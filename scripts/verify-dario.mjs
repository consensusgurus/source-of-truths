// scripts/verify-dario.mjs — checks the Dario bank and the daily remix.
//
//   node scripts/verify-dario.mjs
//
// The bank: contiguous dates, quizIds matching their live dates, no Sunday flag.
// The remix, for every banked day: deterministic; enemies stand on a real
// surface in open air, clear of the start and the gate; exactly one shield
// crate per level; every chip sits in open air; enemy counts inside the level's
// range; and two different days do not produce the same course.
import { PUZZLES } from '../app/dario/puzzles.js';
import { buildLevels, SOLID_TILES } from '../lib/dario-engine.js';

let fails = 0;
const fail = (m) => { fails++; if (fails <= 40) console.error('FAIL', m); };
const solid = (c) => SOLID_TILES.includes(c);

let prev = null;
for (const p of PUZZLES) {
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `dario-${m}-${d}-${String(y).slice(2)}`) fail(`#${p.num}: quizId ${p.quizId} does not match ${p.live}`);
  if (p.sunday) fail(`#${p.num}: Dario has no Sunday Edition`);
  if (prev) {
    const gap = (Date.parse(p.live) - Date.parse(prev.live)) / 86400000;
    if (gap !== 1 || p.num !== prev.num + 1) fail(`#${p.num}: not contiguous with #${prev.num}`);
  }
  prev = p;
}

const ranges = [[9, 12], [11, 14], [6, 8]];
const seen = new Set();
for (const p of PUZZLES) {
  const A = buildLevels(p.quizId), B = buildLevels(p.quizId);
  if (JSON.stringify(A) !== JSON.stringify(B)) fail(`${p.quizId}: remix is not deterministic`);
  const sig = JSON.stringify(A.map((L) => [L.ents, L.chips]));
  if (seen.has(sig)) fail(`${p.quizId}: same course as an earlier day`);
  seen.add(sig);
  A.forEach((L, i) => {
    const g = L.g;
    const shields = g.flat().filter((c) => c === 'P').length;
    if (shields !== 1) fail(`${p.quizId} ${L.num}: ${shields} shield crates`);
    if (L.ents.length < ranges[i][0] || L.ents.length > ranges[i][1]) fail(`${p.quizId} ${L.num}: ${L.ents.length} enemies`);
    for (const e of L.ents) {
      if (e.x < 14 || e.x > L.gateX - 6) fail(`${p.quizId} ${L.num}: enemy at x ${e.x} too near the start or gate`);
      if (g[e.y][e.x] !== '.' || !solid(g[e.y + 1][e.x])) fail(`${p.quizId} ${L.num}: enemy at ${e.x},${e.y} not standing on a surface`);
    }
    for (const [x, y] of L.chips) if (solid(g[y][x])) fail(`${p.quizId} ${L.num}: chip inside a solid tile at ${x},${y}`);
    if (!(L.gateX > 0 && L.gateX < L.W)) fail(`${p.quizId} ${L.num}: gate off the level`);
    for (let x = L.gateX - 2; x <= L.gateX + 2; x++) if (!solid(g[12][x])) fail(`${p.quizId} ${L.num}: no ground at the gate`);
  });
}
console.log(`dario: ${PUZZLES.length} days, ${PUZZLES[0].live} to ${PUZZLES[PUZZLES.length - 1].live}${fails ? `, ${fails} failures` : ', all clean'}`);
if (fails) process.exit(1);
