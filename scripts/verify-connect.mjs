// verify-connect: the checker for Connect (app/connect/puzzles.js), discovered by
// scripts/verify-all.mjs. Re-checks every rule in scripts/gen-connect.mjs:
//   - one board a day from 2026-11-01, quizId / dateLabel / sunday from `live`
//   - the size ramp: Mon, Tue 9; Wed, Thu 10; Fri, Sat 11; Sunday Edition 12
//   - dots are in bounds, no square holds two dots, a pair's dots never touch
//   - about one pair per eleven squares (between n*n/11 - 1 and n*n/11 + 1)
//   - EXACTLY ONE SOLUTION, counted by scripts/connect-solver.mjs with a cap of 2
//     (that solver forbids a path touching itself, the convention of the genre)
//   - no two boards in a row share a size AND a dot layout (a re-deal guard)
import { checker, checkDays, dowOf } from './six-verify-common.mjs';
import { countWire } from './connect-solver.mjs';
const { PUZZLES } = await import(new URL('../app/connect/puzzles.js', import.meta.url));
const { bad, done } = checker('connect');
checkDays('connect', PUZZLES, bad);
const SIZE = { 1: 9, 2: 9, 3: 10, 4: 10, 5: 11, 6: 11, 0: 12 };
const seen = new Set();
for (const p of PUZZLES) {
  const n = SIZE[dowOf(p.live)];
  if (p.size !== n) bad(p.num, `size ${p.size}, should be ${n}`);
  const want = Math.round((n * n) / 11);
  if (!Array.isArray(p.dots) || p.dots.length < want - 1 || p.dots.length > want + 1) bad(p.num, `${(p.dots || []).length} pairs, should be about ${want}`);
  const used = new Set();
  for (const [r0, c0, r1, c1] of p.dots || []) {
    for (const [r, c] of [[r0, c0], [r1, c1]]) {
      if (![r, c].every((v) => Number.isInteger(v) && v >= 0 && v < p.size)) bad(p.num, `dot ${r},${c} off the board`);
      if (used.has(r * 100 + c)) bad(p.num, `two dots on ${r},${c}`);
      used.add(r * 100 + c);
    }
    if (Math.abs(r0 - r1) + Math.abs(c0 - c1) === 1) bad(p.num, 'a pair of dots side by side');
  }
  const res = countWire({ n: p.size, dots: p.dots }, { cap: 2, maxNodes: 3e6 });
  if (res.aborted) bad(p.num, 'the solver gave up');
  else if (res.count !== 1) bad(p.num, `${res.count} solutions, should be exactly 1`);
  const k = JSON.stringify(p.dots);
  if (seen.has(k)) bad(p.num, 'the same board twice'); seen.add(k);
}
done(PUZZLES);
