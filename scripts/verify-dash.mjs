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
//   - THE MAP: boards 1 and 2 are plain grids; from board 3 the weekday's features (MAP) are all
//     present and well formed, every place can be reached, and the map changes what the night is worth
//   - every restaurant's picture has a kind (hot, fresh, cold or frozen)
//   - the Tip Ladder has eight rungs
import { checker, checkDays, dowOf } from './six-verify-common.mjs';
import { solve, walk, offer, rankOf, blocks, isPlain, KINDS, RUNGS, BOUNDS, PER, STAY } from '../lib/dash-engine.js';
import { SPEC, PLACES, MAP, PLAIN_UNTIL } from './gen-dash-spec.mjs';
import { biggestFirst, nearestFirst } from './gen-dash.mjs';
const { PUZZLES } = await import(new URL('../app/dash/puzzles.js', import.meta.url));
const { bad, done } = checker('dash');
checkDays('dash', PUZZLES, bad, '2026-11-15');
const KNOWN = new Map(PLACES);
for (const [n] of PLACES) if (n.length > 12) bad(0, `the restaurant name ${n} is too long for an order row`);
if (RUNGS.length !== 8 || BOUNDS.length !== 7 || rankOf(0).at !== 0 || rankOf(999).at !== 7) bad(0, 'the Tip Ladder is not eight rungs');
const pictures = new Set(Object.values(KINDS).flat());
for (const [n, e] of PLACES) if (!pictures.has(e)) bad(0, `${n} has a picture with no kind (hot, fresh, cold or frozen)`);
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
    if (o.ready + STAY + blocks(p, o.r, o.h) * PER + STAY > o.by) bad(p.num, `${o.n} cannot reach its door hot even picked up the moment it is ready`);
  });
  // THE MAP: boards 1 and 2 are plain grids; after them the weekday decides what the town carries
  const kinds = p.num <= PLAIN_UNTIL ? [] : MAP[dowOf(p.live)];
  if (!kinds.length) { if (!isPlain(p)) bad(p.num, 'a plain board carries a map feature'); }
  else {
    const want = (k) => kinds.filter((x) => x === k).length, taken = new Set();
    if (!!p.river !== !!want('river')) bad(p.num, `river ${p.river ? 'present' : 'missing'}`);
    if ((p.parks || []).length !== want('park')) bad(p.num, `${(p.parks || []).length} parks, expected ${want('park')}`);
    if (!!(p.diag && p.diag.length) !== !!want('avenue')) bad(p.num, `avenue ${p.diag ? 'present' : 'missing'}`);
    if (p.river) {
      const { axis, at, bridges } = p.river, across = axis === 'h' ? p.W : p.H, along = axis === 'h' ? p.H : p.W;
      if (!['h', 'v'].includes(axis) || at < 1 || at > along - 3) bad(p.num, 'the river is off the map or hugs an edge');
      if (bridges.length < 2 || bridges.some((b, i) => b < 0 || b >= across || (i && b - bridges[i - 1] < 2))) bad(p.num, 'the bridges are too few, off the map or side by side');
      for (let i = 0; i < across - 1; i++) taken.add(axis === 'h' ? `${i},${at}` : `${at},${i}`);
    }
    for (const [bx, by, bw, bh] of p.parks || []) {
      if (bx < 0 || by < 0 || bx + bw > p.W - 1 || by + bh > p.H - 1 || bw * bh < 2 || bw > 2 || bh > 2) bad(p.num, 'a park is off the map or the wrong size');
      for (let x = bx; x < bx + bw; x++) for (let y = by; y < by + bh; y++) { if (taken.has(`${x},${y}`)) bad(p.num, 'a park overlaps the river or another park'); taken.add(`${x},${y}`); }
      if (bw === 2 && bh === 2 && [p.start, ...p.orders.flatMap((o) => [o.r, o.h])].some((c) => c[0] === bx + 1 && c[1] === by + 1)) bad(p.num, 'a place sits in the middle of a park');
    }
    (p.diag || []).forEach(([a, b, c, d], i) => {
      if (c - a !== 1 || Math.abs(d - b) !== 1 || !inside([a, b]) || !inside([c, d])) bad(p.num, 'an avenue step is not one block corner to corner');
      if (i && (p.diag[i - 1][2] !== a || p.diag[i - 1][3] !== b)) bad(p.num, 'the avenue is broken');
      if (taken.has(`${a},${Math.min(b, d)}`)) bad(p.num, 'the avenue runs through the river or a park');
    });
    const places = [p.start, ...p.orders.flatMap((o) => [o.r, o.h])];
    if (places.some((c) => !Number.isFinite(blocks(p, p.start, c)))) bad(p.num, 'a place cannot be reached');
    const { river, parks, diag, ...flat } = p;
    if (solve(flat).best === p.best) bad(p.num, 'the map does not matter: a plain grid is worth the same');
  }
  const { best } = solve(p), w = walk(p, p.sol);
  if (best !== p.best) bad(p.num, `best is $${best}, stored $${p.best}`);
  if (w.earn !== p.best || w.skipped) bad(p.num, `the stored shift makes $${w.earn} with ${w.skipped} taps skipped`);
  if (w.count < range[0] || w.count > range[1] || w.count >= N) bad(p.num, `the best shift delivers ${w.count}, outside ${range.join(' to ')}`);
  if (p.best < 0.6 * offer(p)) bad(p.num, 'the best shift is under 60% of the offer');
  if (solve(p, 1).best >= p.best) bad(p.num, 'a bag of one makes as much: stacking does not pay');
  if (p.best - biggestFirst(p) < margin || p.best - nearestFirst(p) < margin) bad(p.num, `a plain plan comes within $${margin} of the best`);
}
done(PUZZLES);
