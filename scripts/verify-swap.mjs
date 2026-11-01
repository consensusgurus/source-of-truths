// verify-swap: the checker for Swap (app/swap/puzzles.js), discovered by
// scripts/verify-all.mjs. Re-derives every rule in scripts/gen-photo-trio.mjs:
//   - one board a day from 2026-11-01, quizId / dateLabel / sunday from `live`
//   - 6x6 every day, 7x7 on the Sunday Edition
//   - the photo is a Jig board that went live BEFORE this board, so no photo is
//     ever shown here first, and it is Jig's photo from exactly 7 days earlier
//   - no photo twice in the bank
//   - perm is a permutation of 0..size*size-1 with no tile starting home, so
//     the minimum (par, size*size minus its cycles) is at least size*size/2
//   - SWAP, SLIDE, SPIN AND JIG NEVER SHOW THE SAME PICTURE ON THE SAME DAY (owner,
//     2026-11-01): for every date, the four photos (by Commons file) are distinct
import { checker, checkDays, dowOf } from './six-verify-common.mjs';
const { PUZZLES } = await import(new URL('../app/swap/puzzles.js', import.meta.url));
const { PUZZLES: JIG } = await import(new URL('../app/jig/puzzles.js', import.meta.url));
const { bad, done } = checker('swap');
checkDays('swap', PUZZLES, bad);
const jigLive = Object.fromEntries(JIG.map((p) => [p.num, p.live]));
const jigNumOn = (iso) => 1 + Math.round((Date.parse(iso + 'T12:00:00Z') - Date.parse(JIG[0].live + 'T12:00:00Z')) / 86400000);
const seen = new Set();
for (const p of PUZZLES) {
  const n = dowOf(p.live) === 0 ? 7 : 6;
  if (p.size !== n) bad(p.num, `size ${p.size}, should be ${n}`);
  if (!jigLive[p.jig]) bad(p.num, `Jig board ${p.jig} does not exist`);
  else if (jigLive[p.jig] >= p.live) bad(p.num, `Jig photo ${p.jig} is not live before ${p.live}`);
  if (p.jig !== jigNumOn(p.live) - 7) bad(p.num, `photo should be Jig's from 7 days earlier (${jigNumOn(p.live) - 7})`);
  if (seen.has(p.jig)) bad(p.num, `photo ${p.jig} used twice`); seen.add(p.jig);
  const N = p.size * p.size;
  if (!Array.isArray(p.perm) || p.perm.length !== N || [...p.perm].sort((a, b) => a - b).some((v, i) => v !== i)) { bad(p.num, 'perm is not a permutation'); continue; }
  if (p.perm.some((t, i) => t === i)) bad(p.num, 'a tile starts home');
  const vis = new Array(N).fill(false); let cyc = 0;
  for (let i = 0; i < N; i++) { if (vis[i]) continue; cyc++; let j = i; while (!vis[j]) { vis[j] = true; j = p.perm[j]; } }
  if (N - cyc < N / 2) bad(p.num, `par ${N - cyc} is under half the tiles`);
}
// The same-day rule, across all four photo games, by the photo's Commons file.
const { PUZZLES: SLIDE } = await import(new URL('../app/slide/puzzles.js', import.meta.url));
const { PUZZLES: SPIN } = await import(new URL('../app/spin/puzzles.js', import.meta.url));
const titleOf = Object.fromEntries(JIG.map((p) => [p.num, p.t]));
const jigOnDay = Object.fromEntries(JIG.map((p) => [p.live, p.t]));
const onDay = (bank) => Object.fromEntries(bank.map((p) => [p.live, titleOf[p.jig]]));
const sw = onDay(PUZZLES), sl = onDay(SLIDE), sp = onDay(SPIN);
for (const p of PUZZLES) {
  const d = p.live;
  const shown = [['Jig', jigOnDay[d]], ['Swap', sw[d]], ['Slide', sl[d]], ['Spin', sp[d]]].filter(([, t]) => t);
  const seenT = new Map();
  for (const [g, t] of shown) {
    if (seenT.has(t)) bad(p.num, `${g} and ${seenT.get(t)} show the same photo on ${d}`);
    seenT.set(t, g);
  }
}
done(PUZZLES);
