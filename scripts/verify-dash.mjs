// verify-dash: the checker for Dash (app/dash/puzzles.js), discovered by
// scripts/verify-all.mjs. Re-checks every rule in scripts/gen-dash.mjs:
//   - one board a day from 2026-11-15, quizId / dateLabel / sunday from `live`
//   - board 1 is the intro (a Quiet Night on a Sunday); after it the night's name,
//     town size, orders, shift length, bag and late-ready count follow the weekday (SPEC)
//   - every order is a known restaurant, each used once, every restaurant, house and
//     the start on a corner of its own inside the town; tips are whole dollars from 4
//     to 12; ready and hot-until are even minutes inside the shift, and an order that
//     is picked up the moment it is ready can reach its door hot
//   - THE ANSWER: the best shift is found again by search. `best` is it, the stored
//     `sol` makes exactly that with no tap skipped, it delivers a number of orders in
//     the day's range and fewer than are on offer, and it is at least 60% of the offer
//   - stacking pays (a bag of one makes less) and both plain plans fall short by the
//     day's margin
//   - the Tip Ladder has eight rungs
import { checker, checkDays, dowOf } from './six-verify-common.mjs';
import { solve, walk, offer, rankOf, RUNGS, BOUNDS, PER, STAY } from '../lib/dash-engine.js';
import { SPEC, PLACES } from './gen-dash-spec.mjs';
import { biggestFirst, nearestFirst } from './gen-dash.mjs';
const { PUZZLES } = await import(new URL('../app/dash/puzzles.js', import.meta.url));
const { bad, done } = checker('dash');
checkDays('dash', PUZZLES, bad, '2026-11-15');
const KNOWN = new Map(PLACES);
for (const [n] of PLACES) if (n.length > 12) bad(0, `the restaurant name ${n} is too long for an order row`);
if (RUNGS.length !== 8 || BOUNDS.length !== 7 || rankOf(0).at !== 0 || rankOf(999).at !== 7) bad(0, 'the Tip Ladder is not eight rungs');
const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
for (const p of PUZZLES) {
  const intro = p.num === 1, spec = SPEC[intro ? 1 : dowOf(p.live)], band = intro ? 'intro' : spec[0];
  const [, name, [W, H], N, end, cap, late, range, margin] = spec;
  if (p.band !== band) bad(p.num, `band ${p.band}, expected ${band}`);
  if (p.day !== name || p.W !== W || p.H !== H || p.orders.length !== N || p.end !== end || p.cap !== cap)
    bad(p.num, `${p.day}: ${p.W}x${p.H}, ${p.orders.length} orders, ${p.end} min, bag of ${p.cap}; expected ${name}: ${W}x${H}, ${N}, ${end}, ${cap}`);
  if (p.orders.filter((o) => o.ready > 0).length > late) bad(p.num, 'more orders not ready at six than the day allows');
  const seen = new Set([p.start.join()]), names = new Set();
  const inside = ([x, y]) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < p.W && y < p.H;
  if (!inside(p.start)) bad(p.num, 'the start is outside the town');
  p.orders.forEach((o) => {
    if (KNOWN.get(o.n) !== o.e) bad(p.num, `${o.n} is not a known restaurant with that picture`);
    if (names.has(o.n)) bad(p.num, `${o.n} appears twice`); names.add(o.n);
    for (const c of [o.r, o.h]) { if (!inside(c)) bad(p.num, `${o.n} is outside the town`); if (seen.has(c.join())) bad(p.num, `${o.n} shares a corner`); seen.add(c.join()); }
    if (!Number.isInteger(o.tip) || o.tip < 4 || o.tip > 12) bad(p.num, `${o.n} tips $${o.tip}`);
    if (o.ready % 2 || o.by % 2 || o.ready < 0 || o.by > p.end) bad(p.num, `${o.n} has an odd or out-of-shift time`);
    if (o.ready + STAY + dist(o.r, o.h) * PER + STAY > o.by) bad(p.num, `${o.n} cannot reach its door hot even picked up the moment it is ready`);
  });
  const { best } = solve(p), w = walk(p, p.sol);
  if (best !== p.best) bad(p.num, `best is $${best}, stored $${p.best}`);
  if (w.earn !== p.best || w.skipped) bad(p.num, `the stored shift makes $${w.earn} with ${w.skipped} taps skipped`);
  if (w.count < range[0] || w.count > range[1] || w.count >= N) bad(p.num, `the best shift delivers ${w.count}, outside ${range.join(' to ')}`);
  if (p.best < 0.6 * offer(p)) bad(p.num, 'the best shift is under 60% of the offer');
  if (solve(p, 1).best >= p.best) bad(p.num, 'a bag of one makes as much: stacking does not pay');
  if (p.best - biggestFirst(p) < margin || p.best - nearestFirst(p) < margin) bad(p.num, `a plain plan comes within $${margin} of the best`);
}
done(PUZZLES);
