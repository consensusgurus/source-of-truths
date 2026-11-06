// verify-slide: the checker for Slide (app/slide/puzzles.js), discovered by
// scripts/verify-all.mjs. Re-derives every rule in scripts/gen-photo-trio.mjs:
//   - one board a day from 2026-11-01, quizId / dateLabel / sunday from `live`
//   - 5x5 every day, 6x6 on the Sunday Edition
//   - the photo is Jig's from exactly 14 days earlier, already live, never twice
//   - tiles is a permutation of 0..size*size-1 (the last is the gap) and the
//     board is SOLVABLE, by the inversion-count rule and again, independently,
//     by the permutation-and-gap parity rule
//   - at most size-1 tiles start home
import { checker, checkDays, dowOf } from './six-verify-common.mjs';
const { PUZZLES } = await import(new URL('../app/slide/puzzles.js', import.meta.url));
const { PUZZLES: JIG } = await import(new URL('../app/jig/puzzles.js', import.meta.url));
const { PUZZLES: SAW } = await import(new URL('../app/saw/puzzles.js', import.meta.url));
// Saw's photos are recycled too (owner, 2026-11-06): a borrowed day on which
// Saw had an ODD-numbered board lends Saw's photo (`saw`) instead of Jig's.
const sawOn = Object.fromEntries(SAW.map((p) => [p.live, p]));
const sawLive = Object.fromEntries(SAW.map((p) => [p.num, p.live]));
const back = (iso, n) => new Date(Date.parse(iso + 'T12:00:00Z') - n * 86400000).toISOString().slice(0, 10);
const { bad, done } = checker('slide');
checkDays('slide', PUZZLES, bad);
const jigLive = Object.fromEntries(JIG.map((p) => [p.num, p.live]));
const jigNumOn = (iso) => 1 + Math.round((Date.parse(iso + 'T12:00:00Z') - Date.parse(JIG[0].live + 'T12:00:00Z')) / 86400000);
const seen = new Set();
function parityOk(t, n) {
  const gap = n * n - 1, a = t.filter((x) => x !== gap);
  let inv = 0; for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] > a[j]) inv++;
  if (n % 2) return inv % 2 === 0;
  return (inv + (n - Math.floor(t.indexOf(gap) / n))) % 2 === 1;
}
// A second, independent proof of the same theorem in its other form: the
// permutation of all size*size squares (gap included) must have the same parity
// as the gap's taxicab distance from its home corner.
function parity2(t, n) {
  const N = n * n, seen = new Array(N).fill(false); let swaps = 0;
  for (let i = 0; i < N; i++) { if (seen[i]) continue; let j = i, len = 0; while (!seen[j]) { seen[j] = true; j = t[j]; len++; } swaps += len - 1; }
  const g = t.indexOf(N - 1), d = (n - 1 - Math.floor(g / n)) + (n - 1 - (g % n));
  return swaps % 2 === d % 2;
}
for (const p of PUZZLES) {
  const n = dowOf(p.live) === 0 ? 6 : 5;
  if (p.size !== n) bad(p.num, `size ${p.size}, should be ${n}`);
  const lend = sawOn[back(p.live, 14)];
  if (lend && lend.num % 2 === 1) {
    if (p.saw !== lend.num || p.jig != null) bad(p.num, `photo should be Saw's from 14 days earlier (No. ${lend.num})`);
    else if (sawLive[p.saw] >= p.live) bad(p.num, `Saw photo ${p.saw} is not live before ${p.live}`);
    if (seen.has('s' + p.saw)) bad(p.num, `Saw photo ${p.saw} used twice`); seen.add('s' + p.saw);
  } else {
    if (p.saw != null) bad(p.num, `borrows Saw ${p.saw}, but Saw had no odd-numbered board 14 days earlier`);
    if (!jigLive[p.jig]) bad(p.num, `Jig board ${p.jig} does not exist`);
    else if (jigLive[p.jig] >= p.live) bad(p.num, `Jig photo ${p.jig} is not live before ${p.live}`);
    if (p.jig !== jigNumOn(p.live) - 14) bad(p.num, `photo should be Jig's from 14 days earlier (${jigNumOn(p.live) - 14})`);
    if (seen.has(p.jig)) bad(p.num, `photo ${p.jig} used twice`); seen.add(p.jig);
  }
  const N = p.size * p.size;
  if (!Array.isArray(p.tiles) || p.tiles.length !== N || [...p.tiles].sort((a, b) => a - b).some((v, i) => v !== i)) { bad(p.num, 'tiles is not a permutation'); continue; }
  if (!parityOk(p.tiles, p.size)) bad(p.num, 'unsolvable by the parity rule');
  if (!parity2(p.tiles, p.size)) bad(p.num, 'unsolvable by the permutation-and-gap parity rule');
  if (p.tiles.filter((x, i) => x === i).length > p.size - 1) bad(p.num, 'too many tiles start home');
}
done(PUZZLES);
