// verify-spin: the checker for Spin (app/spin/puzzles.js), discovered by
// scripts/verify-all.mjs. Re-derives every rule in scripts/gen-photo-trio.mjs:
//   - one board a day from 2026-11-01, quizId / dateLabel / sunday from `live`
//   - 6x6 every day, 8x8 on the Sunday Edition
//   - the photo is Jig's from exactly 21 days earlier, already live, never twice
//   - rot has one entry per square, each 0..3, and at most one in eight is 0
import { checker, checkDays, dowOf } from './six-verify-common.mjs';
const { PUZZLES } = await import(new URL('../app/spin/puzzles.js', import.meta.url));
const { PUZZLES: JIG } = await import(new URL('../app/jig/puzzles.js', import.meta.url));
const { PUZZLES: SAW } = await import(new URL('../app/saw/puzzles.js', import.meta.url));
// Saw's photos are recycled too (owner, 2026-11-06): a borrowed day on which
// Saw had an ODD-numbered board lends Saw's photo (`saw`) instead of Jig's.
const sawOn = Object.fromEntries(SAW.map((p) => [p.live, p]));
const sawLive = Object.fromEntries(SAW.map((p) => [p.num, p.live]));
const back = (iso, n) => new Date(Date.parse(iso + 'T12:00:00Z') - n * 86400000).toISOString().slice(0, 10);
const { bad, done } = checker('spin');
checkDays('spin', PUZZLES, bad);
const jigLive = Object.fromEntries(JIG.map((p) => [p.num, p.live]));
const jigNumOn = (iso) => 1 + Math.round((Date.parse(iso + 'T12:00:00Z') - Date.parse(JIG[0].live + 'T12:00:00Z')) / 86400000);
const seen = new Set();
for (const p of PUZZLES) {
  const n = dowOf(p.live) === 0 ? 8 : 6;
  if (p.size !== n) bad(p.num, `size ${p.size}, should be ${n}`);
  const lend = sawOn[back(p.live, 21)];
  if (lend && lend.num % 2 === 1) {
    if (p.saw !== lend.num || p.jig != null) bad(p.num, `photo should be Saw's from 21 days earlier (No. ${lend.num})`);
    else if (sawLive[p.saw] >= p.live) bad(p.num, `Saw photo ${p.saw} is not live before ${p.live}`);
    if (seen.has('s' + p.saw)) bad(p.num, `Saw photo ${p.saw} used twice`); seen.add('s' + p.saw);
  } else {
    if (p.saw != null) bad(p.num, `borrows Saw ${p.saw}, but Saw had no odd-numbered board 21 days earlier`);
    if (!jigLive[p.jig]) bad(p.num, `Jig board ${p.jig} does not exist`);
    else if (jigLive[p.jig] >= p.live) bad(p.num, `Jig photo ${p.jig} is not live before ${p.live}`);
    if (p.jig !== jigNumOn(p.live) - 21) bad(p.num, `photo should be Jig's from 21 days earlier (${jigNumOn(p.live) - 21})`);
    if (seen.has(p.jig)) bad(p.num, `photo ${p.jig} used twice`); seen.add(p.jig);
  }
  if (!Array.isArray(p.rot) || p.rot.length !== p.size * p.size) { bad(p.num, 'rot has the wrong length'); continue; }
  if (p.rot.some((v) => !Number.isInteger(v) || v < 0 || v > 3)) bad(p.num, 'rot values must be 0..3');
  if (p.rot.filter((v) => v === 0).length > Math.floor((p.size * p.size) / 8)) bad(p.num, 'too many tiles start straight');
}
done(PUZZLES);
