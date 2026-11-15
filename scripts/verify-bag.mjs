// verify-bag: the checker for Bag (app/bag/puzzles.js), discovered by
// scripts/verify-all.mjs. Re-checks every rule in scripts/gen-bag.mjs:
//   - one board a day from 2026-11-14, quizId / dateLabel / sunday from `live`
//   - boards 1 and 2 are the intro (a Corner Shop, then a Quick Stop, whatever
//     day they fall on); after them the shop, its bags, its reach and its band
//     follow the weekday (SPEC in gen-bag-spec.mjs), Sunday the Big Shop
//   - every item is on the shelf exactly as the shelf has it (name of nine
//     letters at most, weight, what it takes on top, picture, cold / hot / chem /
//     solo), no item twice, and the day's count of hot, cleaning and solo items
//   - the items weigh no more than the bags hold
//   - the stored answer (`sol`) bags every item once, each taken from within
//     reach and allowed by the rules in lib/bag-engine.js at the moment it goes in
//   - the board is as forgiving as its band says (the generator's own measure)
//   - the Bagging Ladder has eight rungs with no gap or overlap in their ranges
import { checker, checkDays, dowOf } from './six-verify-common.mjs';
import { replay, bounds, rankOf, RUNGS } from '../lib/bag-engine.js';
import { SPEC, SHELF, KINDS } from './gen-bag-spec.mjs';
import { easeOf } from './gen-bag.mjs';
const { PUZZLES } = await import(new URL('../app/bag/puzzles.js', import.meta.url));
const { bad, done } = checker('bag');
checkDays('bag', PUZZLES, bad, '2026-11-14');
for (const it of SHELF) { if (it.n.length > 9) bad(0, `the shelf name ${it.n} is longer than nine letters`); if (!KINDS.includes(it.k)) bad(0, `${it.n} has no picture ${it.k}`); }
if (new Set(SHELF.map((x) => x.n)).size !== SHELF.length) bad(0, 'two shelf items share a name');
for (const p of PUZZLES) {
  const intro = p.num <= 2, spec = SPEC[intro ? p.num : dowOf(p.live)], band = intro ? 'intro' : spec[0];
  if (p.band !== band) bad(p.num, `band ${p.band}, expected ${band}`);
  if (p.shop !== spec[1] || p.reach !== spec[4] || p.items.length !== spec[2] || p.bags.map((b) => `${b.slots}.${b.limit}`).join() !== spec[3].map((b) => b.join('.')).join())
    bad(p.num, `${p.shop}: ${p.items.length} items, ${p.bags.length} bags, reach ${p.reach}, expected ${spec[1]}: ${spec[2]} items, ${spec[3].length} bags, reach ${spec[4]}`);
  const names = new Set(); let ok = true;
  for (const it of p.items) {
    const sh = SHELF.find((x) => x.n === it.n);
    if (!sh || JSON.stringify(sh) !== JSON.stringify(it)) { bad(p.num, `${it.n} is not on the shelf as dealt`); ok = false; }
    if (names.has(it.n)) bad(p.num, `two of ${it.n}`); names.add(it.n);
  }
  if (!ok) continue;
  const n = (f) => p.items.filter((x) => x[f]).length;
  if (n('hot') !== spec[5] || n('chem') !== spec[6] || n('solo') !== spec[7]) bad(p.num, `${n('hot')} hot, ${n('chem')} cleaning, ${n('solo')} solo, expected ${spec[5]}, ${spec[6]}, ${spec[7]}`);
  if (n('cold') < 2) bad(p.num, 'fewer than two cold items');
  if (p.items.reduce((a, x) => a + x.w, 0) > p.bags.reduce((a, b) => a + b.limit, 0)) bad(p.num, 'the items weigh more than the bags hold');
  if (!Array.isArray(p.sol) || p.sol.length !== p.items.length || new Set(p.sol.map((m) => m[0])).size !== p.items.length) { bad(p.num, 'the stored answer does not bag every item once'); continue; }
  if (!replay(p, p.sol)) { bad(p.num, 'the stored answer breaks a rule or reaches past the reach'); continue; }
  const e = easeOf(p, p.sol);
  if (e < spec[8][0] || e > spec[8][1]) bad(p.num, `forgiving ${(e * 100).toFixed(0)}%, the band is ${spec[8][0] * 100} to ${spec[8][1] * 100}`);
  const ub = bounds(p.items.length), r = rankOf(p, 0);
  if (r.rows.length !== 8 || RUNGS.length !== 8 || r.at !== 0) bad(p.num, 'the Bagging Ladder is not eight rungs with no re-bags on top');
  for (let i = 1; i < ub.length; i++) if (ub[i] <= ub[i - 1]) bad(p.num, `ladder rung ${i + 1} has no room`);
}
done(PUZZLES);
