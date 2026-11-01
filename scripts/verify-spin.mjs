// verify-spin: the checker for Spin (app/spin/puzzles.js), discovered by
// scripts/verify-all.mjs. Re-derives every rule in scripts/gen-photo-trio.mjs:
//   - one board a day from 2026-11-01, quizId / dateLabel / sunday from `live`
//   - 6x6 every day, 8x8 on the Sunday Edition
//   - the photo is Jig's from exactly 21 days earlier, already live, never twice
//   - rot has one entry per square, each 0..3, and at most one in eight is 0
import { checker, checkDays, dowOf } from './six-verify-common.mjs';
const { PUZZLES } = await import(new URL('../app/spin/puzzles.js', import.meta.url));
const { PUZZLES: JIG } = await import(new URL('../app/jig/puzzles.js', import.meta.url));
const { bad, done } = checker('spin');
checkDays('spin', PUZZLES, bad);
const jigLive = Object.fromEntries(JIG.map((p) => [p.num, p.live]));
const jigNumOn = (iso) => 1 + Math.round((Date.parse(iso + 'T12:00:00Z') - Date.parse(JIG[0].live + 'T12:00:00Z')) / 86400000);
const seen = new Set();
for (const p of PUZZLES) {
  const n = dowOf(p.live) === 0 ? 8 : 6;
  if (p.size !== n) bad(p.num, `size ${p.size}, should be ${n}`);
  if (!jigLive[p.jig]) bad(p.num, `Jig board ${p.jig} does not exist`);
  else if (jigLive[p.jig] >= p.live) bad(p.num, `Jig photo ${p.jig} is not live before ${p.live}`);
  if (p.jig !== jigNumOn(p.live) - 21) bad(p.num, `photo should be Jig's from 21 days earlier`);
  if (seen.has(p.jig)) bad(p.num, `photo ${p.jig} used twice`); seen.add(p.jig);
  if (!Array.isArray(p.rot) || p.rot.length !== p.size * p.size) { bad(p.num, 'rot has the wrong length'); continue; }
  if (p.rot.some((v) => !Number.isInteger(v) || v < 0 || v > 3)) bad(p.num, 'rot values must be 0..3');
  if (p.rot.filter((v) => v === 0).length > Math.floor((p.size * p.size) / 8)) bad(p.num, 'too many tiles start straight');
}
done(PUZZLES);
