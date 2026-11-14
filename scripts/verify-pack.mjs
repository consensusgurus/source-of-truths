// verify-pack: the checker for Pack (app/pack/puzzles.js), discovered by
// scripts/verify-all.mjs. Re-checks every rule in scripts/gen-pack.mjs:
//   - one board a day from 2026-11-14, quizId / dateLabel / sunday from `live`
//   - boards 1 and 2 are the intro (a Hatchback, then a Sedan, whatever day they
//     fall on); after them the vehicle, its size and its band follow the weekday
//     (SPEC in the generator), Sunday the Moving Van
//   - every item is a kind lib/pack-art.js can draw, its `d` is the sorted box of
//     the shape it builds, a shaped item carries a note, and no two share a name
//   - the items fill the space exactly on the tough days and never overfill it
//   - the stored packing (`sol`) loads every item once through the real drop in
//     lib/pack-engine.js: each fits, lands exactly where the row says, stays under
//     the roof line and overlaps nothing
//   - the Packing Ladder has eight rungs with no gap or overlap in their ranges
import { checker, checkDays, dowOf } from './six-verify-common.mjs';
import { ROTS, orient, occOf, replay, bounds, rankOf, RUNGS } from '../lib/pack-engine.js';
import { K, C, shapeOf } from '../lib/pack-art.js';
import { SPEC } from './gen-pack-spec.mjs';
const { PUZZLES } = await import(new URL('../app/pack/puzzles.js', import.meta.url));
const { bad, done } = checker('pack');
checkDays('pack', PUZZLES, bad, '2026-11-14');
for (const p of PUZZLES) {
  const intro = p.num <= 2, spec = SPEC[intro ? p.num : dowOf(p.live)], band = intro ? 'intro' : spec[0];
  if (p.band !== band) bad(p.num, `band ${p.band}, expected ${band}`);
  if (p.vehicle !== spec[1] || p.W !== spec[2] || p.D !== spec[3] || p.H !== spec[4]) bad(p.num, `${p.vehicle} ${p.W}x${p.D}x${p.H}, expected ${spec[1]} ${spec[2]}x${spec[3]}x${spec[4]}`);
  const names = new Set(); let cells = 0, shaped = 0, ok = true;
  const shapes = p.items.map((it, i) => {
    if (!K[it.k]) { bad(p.num, `item ${i + 1} is a ${it.k}, which cannot be drawn`); ok = false; return null; }
    if (it.c && !C[it.c]) { bad(p.num, `${it.n} has no colour ${it.c}`); ok = false; return null; }
    if (names.has(it.n)) bad(p.num, `two items are called ${it.n}`); names.add(it.n);
    const sh = shapeOf(it), ext = orient(sh, 0).ext.slice().sort((a, b) => a - b);
    if (ext.join() !== it.d.join()) bad(p.num, `${it.n} says ${it.d.join(' x ')} and builds ${ext.join(' x ')}`);
    const boxy = sh.cells.length === ext[0] * ext[1] * ext[2];
    if (!boxy) shaped++;
    if (boxy === !!it.note) bad(p.num, `${it.n}: a shaped item carries a note and a plain box does not`);
    if (!sh.col || !Array.isArray(sh.feats)) bad(p.num, `${it.n} has no colour or details`);
    cells += sh.cells.length;
    return sh;
  });
  if (!ok) continue;
  const room = p.W * p.D * p.H;
  if (cells > room) bad(p.num, `${cells} cells of items in ${room} cells of space`);
  if (spec[6] === 0 && cells !== room) bad(p.num, `an exact-fit day leaves ${room - cells} cells empty`);
  if (shaped !== spec[7]) bad(p.num, `${shaped} shaped items, expected ${spec[7]}`);
  if (!Array.isArray(p.sol) || p.sol.length !== p.items.length || new Set(p.sol.map((q) => q.i)).size !== p.items.length) { bad(p.num, `the stored packing does not load every item once`); continue; }
  if (p.sol.some((q) => !ROTS[q.r])) { bad(p.num, `the stored packing uses a turn that does not exist`); continue; }
  const placed = replay(p, shapes, p.sol);
  if (!placed) { bad(p.num, `the stored packing does not load: an item does not fit or lands somewhere else`); continue; }
  let filled = 0; for (const col of occOf(p, placed, shapes)) for (const stack of col) for (const v of stack) if (v >= 0) filled++;
  if (filled !== cells) bad(p.num, `the stored packing overlaps itself (${filled} cells filled, ${cells} cells of items)`);
  const ub = bounds(p.items.length), r = rankOf(p, 0);
  if (r.rows.length !== 8 || RUNGS.length !== 8 || r.at !== 0) bad(p.num, `the Packing Ladder is not eight rungs with a clean load on top`);
  for (let i = 1; i < ub.length; i++) if (ub[i] <= ub[i - 1]) bad(p.num, `ladder rung ${i + 1} has no room`);
}
done(PUZZLES);
