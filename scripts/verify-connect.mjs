// verify-connect: the checker for Connect (app/connect/puzzles.js), discovered by
// scripts/verify-all.mjs. Re-checks every rule in scripts/gen-connect.mjs:
//   - one board a day from 2026-11-01, quizId / dateLabel / sunday from `live`
//   - board No. 1 (2026-11-01, the first ramp): 12x12 Sunday, about one pair per
//     eleven squares, no blocked squares
//   - from 2026-11-02 (owner: "far too easy, even on a sunday"), by weekday:
//       Mon, Tue 9x9, 4 blocked, 6 pairs     Wed, Thu 10x10, 6 blocked, 7 pairs
//       Fri, Sat 11x11, 8 blocked, 8 pairs   Sunday Edition 12x12, 10 blocked, 9 pairs
//     never more than ten pairs (one site pastel each); blocked squares mirror
//     through the centre and leave the open squares one connected area
//   - dots are in bounds, no square holds two dots or a dot and a block, a pair's
//     dots never touch
//   - EXACTLY ONE SOLUTION, counted by scripts/connect-solver.mjs with a cap of 2.
//     From No. 2 under the player's own rules (a line may run alongside itself,
//     `touch: true`), so no wiggle finishes the board another way. No. 1 was
//     proved only among lines that never touch themselves, as dealt.
//   - no two boards in a row share a size AND a dot layout (a re-deal guard)
import { checker, checkDays, dowOf } from './six-verify-common.mjs';
import { countWire } from './connect-solver.mjs';
const { PUZZLES } = await import(new URL('../app/connect/puzzles.js', import.meta.url));
const { bad, done } = checker('connect');
checkDays('connect', PUZZLES, bad);
const SPEC = { 1: [9, 4, 6], 2: [9, 4, 6], 3: [10, 6, 7], 4: [10, 6, 7], 5: [11, 8, 8], 6: [11, 8, 8], 0: [12, 10, 9] };
const seen = new Set();
for (const p of PUZZLES) {
  const used = new Set();
  if (p.live < '2026-11-02') {
    if (p.size !== 12 || p.walls) bad(p.num, 'No. 1 is the 12x12 first-ramp board, unblocked, as dealt');
    const want = Math.round(144 / 11);
    if (!Array.isArray(p.dots) || p.dots.length < want - 1 || p.dots.length > want + 1) bad(p.num, `${(p.dots || []).length} pairs, should be about ${want}`);
  } else {
    const [n, W, K] = SPEC[dowOf(p.live)];
    if (p.size !== n) bad(p.num, `size ${p.size}, should be ${n}`);
    if (!Array.isArray(p.dots) || p.dots.length !== K) bad(p.num, `${(p.dots || []).length} pairs, should be ${K}`);
    if (!Array.isArray(p.walls) || p.walls.length !== W) bad(p.num, `${(p.walls || []).length} blocked squares, should be ${W}`);
    const ws = new Set((p.walls || []).map(([r, c]) => r * n + c));
    for (const [r, c] of p.walls || []) {
      if (![r, c].every((v) => Number.isInteger(v) && v >= 0 && v < n)) bad(p.num, `block ${r},${c} off the board`);
      if (!ws.has((n - 1 - r) * n + (n - 1 - c))) bad(p.num, `block ${r},${c} has no mirror`);
      used.add(r * 100 + c);
    }
    const open = []; for (let i = 0; i < n * n; i++) if (!ws.has(i)) open.push(i);
    const reach = new Set([open[0]]), st = [open[0]];
    while (st.length) { const x = st.pop(), R = Math.floor(x / n), C = x % n; for (const j of [R > 0 ? x - n : -1, R < n - 1 ? x + n : -1, C > 0 ? x - 1 : -1, C < n - 1 ? x + 1 : -1]) if (j >= 0 && !ws.has(j) && !reach.has(j)) { reach.add(j); st.push(j); } }
    if (reach.size !== open.length) bad(p.num, 'the blocked squares cut the board in two');
  }
  if ((p.dots || []).length > 14) bad(p.num, 'more pairs than colours');
  for (const [r0, c0, r1, c1] of p.dots || []) {
    for (const [r, c] of [[r0, c0], [r1, c1]]) {
      if (![r, c].every((v) => Number.isInteger(v) && v >= 0 && v < p.size)) bad(p.num, `dot ${r},${c} off the board`);
      if (used.has(r * 100 + c)) bad(p.num, `two dots (or a dot and a block) on ${r},${c}`);
      used.add(r * 100 + c);
    }
    if (Math.abs(r0 - r1) + Math.abs(c0 - c1) === 1) bad(p.num, 'a pair of dots side by side');
  }
  const res = countWire({ n: p.size, dots: p.dots, walls: p.walls }, { cap: 2, maxNodes: 6e6, touch: p.live >= '2026-11-02' });
  if (res.aborted) bad(p.num, 'the solver gave up');
  else if (res.count !== 1) bad(p.num, `${res.count} solutions, should be exactly 1`);
  const k = JSON.stringify([p.dots, p.walls]);
  if (seen.has(k)) bad(p.num, 'the same board twice'); seen.add(k);
}
done(PUZZLES);
