// verify-mow: the checker for Mow (app/mow/puzzles.js), discovered by
// scripts/verify-all.mjs. Re-checks every rule in scripts/gen-mow.mjs:
//   - one yard a day from 2026-11-17, quizId / dateLabel / sunday from `live`
//   - the ramp: Mon 6x6, Tue 7x6, Wed 7x7, Thu 8x7, Fri 8x8, Sat 9x8, Sun 9x9,
//     with the band that goes with the day; at most one house: a whole one
//     standing clear of every fence, or a corner one filling a back corner
//   - from 2026-11-18 (owner, 2026-11-17: Monday alone is the easy day) the new
//     ramp: Mon 7x6, Tue 8x7, Wed 8x8, Thu 9x8, Fri 9x9, Sat 10x9, Sun 10x10
//   - one floor, the Yard: sections cover it, every section has a name and the
//     names are distinct, there is a Front Yard, every piece is a known kind,
//     stays in the yard, inside one section and off every other piece, and a
//     gate joins two squares that touch across a fence and are both open
//   - the gate in is on the bottom fence and the gate out on the top fence of
//     the Back Yard, or both on the bottom fence side by side (weekdays only)
//   - the stored route is a real solution (lib/mop-engine.js checkRoute)
//   - EXACTLY ONE route mows the yard, counted with a cap of 2
import { checker, checkDays, dowOf } from './six-verify-common.mjs';
import { mopModel, countRoutes, checkRoute, furnOf } from '../lib/mop-engine.js';
const { PUZZLES } = await import(new URL('../app/mow/puzzles.js', import.meta.url));
const { bad, done } = checker('mow');
checkDays('mow', PUZZLES, bad, '2026-11-17');
const SPEC = { 1: ['gentle', 6, 6], 2: ['gentle', 7, 6], 3: ['moderate', 7, 7], 4: ['moderate', 8, 7], 5: ['tough', 8, 8], 6: ['tough', 9, 8], 0: ['sunday', 9, 9] };
const RAMP_FROM = '2026-11-18';
const NEW = { 1: ['gentle', 7, 6], 2: ['moderate', 8, 7], 3: ['moderate', 8, 8], 4: ['tough', 9, 8], 5: ['tough', 9, 9], 6: ['tough', 10, 9], 0: ['sunday', 10, 10] };
const KINDS = new Set(['tree', 'bush', 'hedge', 'flowers', 'veg', 'rock', 'birdbath', 'fountain', 'kennel', 'pond', 'shed', 'trampoline', 'house', 'corner']);
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
for (const p of PUZZLES) {
  const dow = dowOf(p.live), [band, w, h] = (p.live >= RAMP_FROM ? NEW : SPEC)[dow];
  if (p.band !== band) bad(p.num, `band ${p.band}, should be ${band}`);
  if (!p.yard) bad(p.num, 'no yard name');
  if (!Array.isArray(p.floors) || p.floors.length !== 1 || p.floors[0].name !== 'Yard') { bad(p.num, 'one floor, the Yard'); continue; }
  const F = p.floors[0], N = F.w * F.h;
  if (F.w !== w || F.h !== h) bad(p.num, `${F.w}x${F.h}, should be ${w}x${h}`);
  if (!Array.isArray(F.rooms) || F.rooms.length !== F.h || F.rooms.some((r) => r.length !== F.w)) { bad(p.num, 'sections do not cover the yard'); continue; }
  const room = F.rooms.join('').split('');
  for (const l of new Set(room)) if (!F.names[l]) bad(p.num, `section ${l} has no name`);
  if (new Set(Object.values(F.names)).size !== Object.keys(F.names).length) bad(p.num, 'two sections share a name');
  if (!Object.values(F.names).includes('Front Yard')) bad(p.num, 'no Front Yard');
  if (F.stairs.length || F.labels.length) bad(p.num, 'a yard has no staircases');
  const taken = new Set();
  let houses = 0;
  for (const [x, y, pw, ph, type] of F.pieces) {
    if (!KINDS.has(type)) bad(p.num, `unknown piece ${type}`);
    if (type === 'house' || type === 'corner') houses++;
    if (type === 'corner' && (y !== 0 || (x !== 0 && x + pw !== F.w))) bad(p.num, 'a corner house fills a back corner');
    if (type === 'house') {
      const r0 = room[y * F.w + x];
      for (let j = -1; j <= ph; j++) for (let i = -1; i <= pw; i++) {
        const xx = x + i, yy = y + j;
        if ((i < 0 || i >= pw || j < 0 || j >= ph) && (xx < 0 || yy < 0 || xx >= F.w || yy >= F.h || room[yy * F.w + xx] !== r0)) bad(p.num, 'a whole house stands clear of every fence');
      }
    }
    if (x < 0 || y < 0 || x + pw > F.w || y + ph > F.h) { bad(p.num, `${type} off the yard`); continue; }
    const cs = []; for (let j = 0; j < ph; j++) for (let i = 0; i < pw; i++) cs.push((y + j) * F.w + x + i);
    if (cs.some((c) => taken.has(c))) bad(p.num, `${type} overlaps another piece`);
    if (new Set(cs.map((c) => room[c])).size > 1) bad(p.num, `${type} straddles a fence`);
    cs.forEach((c) => taken.add(c));
  }
  if (houses > 1) bad(p.num, `${houses} houses, at most one`);
  for (const [a, b] of F.doors) {
    const side = (b === a + 1 && a % F.w !== F.w - 1) || b === a + F.w;
    if (!side || b >= N || room[a] === room[b] || taken.has(a) || taken.has(b)) bad(p.num, `gate ${a}-${b} is not a gate`);
  }
  const furn = furnOf(F), row = (c) => Math.floor(c / F.w);
  if (p.start[0] !== 0 || p.end[0] !== 0) bad(p.num, 'one floor: both gates on floor 0');
  if (furn.has(p.start[1]) || furn.has(p.end[1])) bad(p.num, 'a gate opens onto a piece');
  if (eq(p.sides, ['S', 'N'])) {
    if (row(p.start[1]) !== F.h - 1 || row(p.end[1]) !== 0) bad(p.num, 'gate in on the bottom fence, gate out on the top fence');
    if (F.names[room[p.end[1]]] !== 'Back Yard') bad(p.num, 'the gate out opens off the Back Yard');
  } else if (eq(p.sides, ['S', 'S'])) {
    if (band === 'sunday' || row(p.start[1]) !== F.h - 1 || row(p.end[1]) !== F.h - 1 || Math.abs(p.start[1] - p.end[1]) !== 1) bad(p.num, 'a double street gate is two bottom-fence squares side by side, weekdays only');
  } else bad(p.num, `sides ${JSON.stringify(p.sides)}`);
  const err = checkRoute(p, p.sol);
  if (err) { bad(p.num, err); continue; }
  const M = mopModel(p);
  const r = countRoutes(M.adj, M.start, M.end, { cap: 2, nodeCap: 20000000 });
  if (r.capped) bad(p.num, 'the route count ran out of budget');
  else if (r.count !== 1) bad(p.num, `${r.count === 0 ? 'no route' : 'more than one route'} mows the yard`);
}
done(PUZZLES);
