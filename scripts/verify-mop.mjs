// verify-mop: the checker for Mop (app/mop/puzzles.js), discovered by
// scripts/verify-all.mjs. Re-checks every rule in scripts/gen-mop.mjs:
//   - one board a day from 2026-11-13, quizId / dateLabel / sunday from `live`
//   - the week: Mon, Tue gentle 6x6; Wed, Thu moderate 7x7; Fri, Sat tough 8x8,
//     one floor each; Sunday three 6x6 floors (Upstairs, Ground Floor, Basement)
//   - every floor: rooms cover the floor, every room has a name, furniture stays
//     on the floor, inside one room and off other furniture, and a doorway joins
//     two squares that touch across a wall and are both open
//   - the way in is on the bottom wall and the way out on the top wall, or both
//     on the bottom wall side by side (the double front door); never furniture
//   - Sunday: the ground floor has four staircases (two Up, two Down), the
//     other floors the matching two each, on the same squares, all open
//   - the stored route is a real solution (lib/mop-engine.js checkRoute)
//   - EXACTLY ONE route covers the house: counted on the whole board, every
//     floor at once, with a cap of 2
import { checker, checkDays, dowOf } from './six-verify-common.mjs';
import { mopModel, countRoutes, checkRoute, furnOf } from '../lib/mop-engine.js';
const { PUZZLES } = await import(new URL('../app/mop/puzzles.js', import.meta.url));
const { bad, done } = checker('mop');
checkDays('mop', PUZZLES, bad, '2026-11-13');
const SPEC = { 1: ['gentle', 6], 2: ['gentle', 6], 3: ['moderate', 7], 4: ['moderate', 7], 5: ['tough', 8], 6: ['tough', 8], 0: ['sunday', 6] };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
for (const p of PUZZLES) {
  const [band, size] = SPEC[dowOf(p.live)];
  if (p.band !== band) bad(p.num, `band ${p.band}, should be ${band}`);
  if (!p.house) bad(p.num, 'no house name');
  const want = band === 'sunday' ? ['Upstairs', 'Ground Floor', 'Basement'] : ['House'];
  if (!Array.isArray(p.floors) || !eq(p.floors.map((f) => f.name), want)) { bad(p.num, `floors should be ${want.join(', ')}`); continue; }
  let broken = false;
  p.floors.forEach((F) => {
    const N = F.w * F.h, say = (m) => { broken = true; bad(p.num, `${F.name}: ${m}`); };
    if (F.w !== size || F.h !== size) say(`${F.w}x${F.h}, should be ${size}x${size}`);
    if (!Array.isArray(F.rooms) || F.rooms.length !== F.h || F.rooms.some((r) => r.length !== F.w)) { say('rooms do not cover the floor'); return; }
    const room = F.rooms.join('').split('');
    for (const l of new Set(room)) if (!F.names[l]) say(`room ${l} has no name`);
    if (new Set(Object.values(F.names)).size !== Object.keys(F.names).length) say('two rooms share a name');
    const taken = new Set();
    for (const [x, y, w, h] of F.pieces) {
      if (x < 0 || y < 0 || x + w > F.w || y + h > F.h || w * h > 2) { say('furniture off the floor or too big'); continue; }
      const cs = []; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) cs.push((y + j) * F.w + x + i);
      if (cs.some((c) => taken.has(c))) say('two pieces of furniture overlap');
      if (new Set(cs.map((c) => room[c])).size > 1) say('furniture straddles a wall');
      cs.forEach((c) => taken.add(c));
    }
    for (const [a, b] of F.doors) {
      const side = (b === a + 1 && a % F.w !== F.w - 1) || b === a + F.w;
      if (!side || b >= N || room[a] === room[b] || taken.has(a) || taken.has(b)) say(`doorway ${a}-${b} is not a doorway`);
    }
    if (F.stairs.length !== F.labels.length) say('a staircase has no label');
    for (const c of F.stairs) if (taken.has(c) || c < 0 || c >= N) say('a staircase under furniture');
  });
  if (broken) continue;
  const g = band === 'sunday' ? 1 : 0, G = p.floors[g], furn = furnOf(G);
  if (p.start[0] !== g || p.end[0] !== g) bad(p.num, 'the way in and the way out belong on the ground floor');
  const row = (c) => Math.floor(c / G.w);
  if (furn.has(p.start[1]) || furn.has(p.end[1])) bad(p.num, 'a door opens onto furniture');
  if (eq(p.sides, ['S', 'N'])) { if (row(p.start[1]) !== G.h - 1 || row(p.end[1]) !== 0) bad(p.num, 'front door on the bottom wall, back door on the top wall'); }
  else if (eq(p.sides, ['S', 'S'])) { if (band === 'sunday' || row(p.start[1]) !== G.h - 1 || row(p.end[1]) !== G.h - 1 || Math.abs(p.start[1] - p.end[1]) !== 1) bad(p.num, 'a double front door is two bottom-wall squares side by side, weekdays only'); }
  else bad(p.num, `sides ${JSON.stringify(p.sides)}`);
  if (band === 'sunday') {
    const [up, gr, dn] = p.floors;
    if (gr.stairs.length !== 4 || !eq(gr.labels, ['Up', 'Up', 'Down', 'Down'])) bad(p.num, 'the ground floor needs two staircases up and two down');
    if (!eq(up.stairs, gr.stairs.slice(0, 2)) || !eq(up.labels, ['Down', 'Down'])) bad(p.num, 'upstairs staircases do not match the ground floor');
    if (!eq(dn.stairs, gr.stairs.slice(2)) || !eq(dn.labels, ['Up', 'Up'])) bad(p.num, 'basement staircases do not match the ground floor');
    if (gr.stairs.includes(p.start[1]) || gr.stairs.includes(p.end[1])) bad(p.num, 'a door opens onto a staircase');
  } else if (G.stairs.length) bad(p.num, 'a weekday has no staircases');
  const err = checkRoute(p, p.sol);
  if (err) { bad(p.num, err); continue; }
  const M = mopModel(p);
  const r = countRoutes(M.adj, M.start, M.end, { cap: 2, nodeCap: 20000000 });
  if (r.capped) bad(p.num, 'the route count ran out of budget');
  else if (r.count !== 1) bad(p.num, `${r.count === 0 ? 'no route' : 'more than one route'} covers the house`);
}
done(PUZZLES);
