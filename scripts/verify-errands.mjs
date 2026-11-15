// verify-errands: the checker for Errands (app/errands/puzzles.js), discovered by
// scripts/verify-all.mjs. Re-checks every rule in scripts/gen-errands.mjs:
//   - one board a day from 2026-11-15, quizId / dateLabel / sunday from `live`
//   - board 1 is the intro (A Few Errands on a Sunday); after it the day's name,
//     town size, stops, rules and roadworks follow the weekday (SPEC)
//   - every stop is a known place on its own corner inside the town, none on home
//     and no two side by side on one street; roadworks cut nobody off
//   - every rule names a real stop, a spoiling rule sits on a stop with something
//     that spoils, and no rule is of an unknown kind
//   - THE ANSWER: every order is tried. The number that keep every rule is inside
//     the day's range, the stored `sol` is the one soonest home and nobody ties
//     it, `best` is its time, and the slowest order that works is at least 12
//     minutes behind
//   - from Wednesday on, always driving to the nearest stop breaks a rule
//   - the Errand Ladder has eight rungs
import { checker, checkDays, dowOf } from './six-verify-common.mjs';
import { allValid, valid, pathBetween, walk, rankOf, RUNGS, BOUNDS } from '../lib/errands-engine.js';
import { SPEC, PLACES, TYPES, KINDS } from './gen-errands-spec.mjs';
import { nearestFirst } from './gen-errands.mjs';
const { PUZZLES } = await import(new URL('../app/errands/puzzles.js', import.meta.url));
const { bad, done } = checker('errands');
checkDays('errands', PUZZLES, bad, '2026-11-15');
for (const pl of PLACES) if (pl.n.length > 11) bad(0, `the place name ${pl.n} is too long to print under a stop`);
if (RUNGS.length !== 8 || BOUNDS.length !== 7 || rankOf(0).at !== 0 || rankOf(999).at !== 7) bad(0, 'the Errand Ladder is not eight rungs');
for (const p of PUZZLES) {
  const intro = p.num === 1, spec = SPEC[intro ? 1 : dowOf(p.live)], band = intro ? 'intro' : spec[0];
  if (p.band !== band) bad(p.num, `band ${p.band}, expected ${band}`);
  if (p.day !== spec[1] || p.W !== spec[2][0] || p.H !== spec[2][1] || p.stops.length !== spec[3] || p.rules.length !== spec[4] || (p.closed || []).length !== spec[5])
    bad(p.num, `${p.day}: ${p.W}x${p.H}, ${p.stops.length} stops, ${p.rules.length} rules, ${(p.closed || []).length} roadworks; expected ${spec[1]}: ${spec[2].join('x')}, ${spec[3]}, ${spec[4]}, ${spec[5]}`);
  if (p.start !== 540 || p.per !== 4 || p.stay !== 10) bad(p.num, 'the clock is not 9:00, 4 minutes a block, 10 a stop');
  const pts = p.stops.map((s) => s.at).concat([p.home]); let ok = true;
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    if (!(x >= 0 && y >= 0 && x < p.W && y < p.H)) { bad(p.num, 'a place is outside the town'); ok = false; }
    for (let j = 0; j < i; j++) if (pts[j][1] === y && Math.abs(pts[j][0] - x) <= 1) bad(p.num, 'two places share a corner or sit side by side on a street');
  }
  for (const s of p.stops) {
    const pl = PLACES.find((x) => x.n === s.n);
    if (!pl || pl.k !== s.k || pl.task !== s.task || (pl.what || null) !== (s.what || null) || !KINDS.includes(s.k)) { bad(p.num, `${s.n} is not a place as the spec has it`); ok = false; }
    if (!pathBetween(p, p.home, s.at)) { bad(p.num, `the roadworks cut off the ${s.n}`); ok = false; }
  }
  if (new Set(p.stops.map((s) => s.n)).size !== p.stops.length) bad(p.num, 'a place appears twice');
  for (const r of p.rules) {
    if (!TYPES.includes(r.t)) { bad(p.num, `a rule of kind ${r.t}`); ok = false; continue; }
    const named = r.t === 'before' ? [r.a, r.b] : [r.s];
    if (named.some((i) => !p.stops[i]) || (r.t === 'before' && r.a === r.b)) { bad(p.num, `a ${r.t} rule names a stop that is not there`); ok = false; continue; }
    if (r.t === 'fresh' && (!p.stops[r.s].what || r.what !== p.stops[r.s].what || !(r.m > 0))) bad(p.num, `nothing spoils at the ${p.stops[r.s].n}`);
    if ((r.t === 'closes' || r.t === 'opens') && !(r.at > p.start && r.at % 15 === 0)) bad(p.num, `a ${r.t} time that is not on a quarter hour after the start`);
  }
  if (!ok) continue;
  const all = allValid(p);
  if (all.length < spec[6][0] || all.length > spec[6][1]) bad(p.num, `${all.length} orders work, the range is ${spec[6].join(' to ')}`);
  if (!all.length) continue;
  if (all[0].route.join() !== (p.sol || []).join() || all[0].home !== p.best || !valid(p, p.sol) || walk(p, p.sol).home !== p.best) bad(p.num, 'the stored order is not the soonest home, or `best` is not its time');
  if (all.length > 1 && all[1].home === all[0].home) bad(p.num, 'two orders tie for soonest home');
  if (all[all.length - 1].home - all[0].home < 12) bad(p.num, 'the slowest order that works is under 12 minutes behind');
  if (band !== 'gentle' && band !== 'intro' && valid(p, nearestFirst(p))) bad(p.num, 'driving to the nearest stop each time keeps every rule');
}
done(PUZZLES);
