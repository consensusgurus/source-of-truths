// verify-chef: the checker for Chef (app/chef/puzzles.js), discovered by
// scripts/verify-all.mjs. Re-checks every rule in scripts/gen-chef.mjs:
//   - one board a day from 2026-11-14, quizId / dateLabel / sunday from `live`
//   - board 1 is the intro (three tickets on the small line); after it the week
//     is Mon, Tue gentle (4 tickets), Wed, Thu moderate (6), Fri, Sat tough (8),
//     Sunday the Sunday Edition (12 tickets on the big line)
//   - every dish is on the menu, a ticket holds two to four dishes across at
//     least two stations and can go out hot on its own (ticketFeasible), the first ticket prints at minute 0 and tickets print
//     in order
//   - the stored service (`sol`) replays through lib/chef-engine.js: every fire
//     is legal, every order goes out, and its penalty, table wait and sitting
//     minutes are the row's best, bestWait and bestSat
import { checker, checkDays, dowOf } from './six-verify-common.mjs';
import { MENU, STATIONS, SIT_WEIGHT, replay, isDone, penalty, rungs, ticketFeasible } from '../lib/chef-engine.js';
const { PUZZLES } = await import(new URL('../app/chef/puzzles.js', import.meta.url));
const { bad, done } = checker('chef');
checkDays('chef', PUZZLES, bad, '2026-11-14');
const SMALL = { stove: 2, oven: 1, grill: 1, fryer: 1, cold: 1 }, BIG = { stove: 3, oven: 2, grill: 2, fryer: 2, cold: 1 };
const SPEC = { 1: ['gentle', 4], 2: ['gentle', 4], 3: ['moderate', 6], 4: ['moderate', 6], 5: ['tough', 8], 6: ['tough', 8], 0: ['sunday', 12] };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
for (const p of PUZZLES) {
  const [band, n] = p.num === 1 ? ['intro', 3] : SPEC[dowOf(p.live)];
  if (p.band !== band) bad(p.num, `band ${p.band}, expected ${band}`);
  if (p.tickets.length !== n) bad(p.num, `${p.tickets.length} tickets, expected ${n}`);
  if (!eq(p.caps, band === 'sunday' ? BIG : SMALL)) bad(p.num, `the wrong line for a ${band} day`);
  if (!p.service) bad(p.num, `no service name`);
  if (p.tickets[0].at !== 0) bad(p.num, `the first ticket does not print at minute 0`);
  p.tickets.forEach((t, i) => {
    if (i && t.at < p.tickets[i - 1].at) bad(p.num, `ticket ${i + 1} prints before ticket ${i}`);
    if (t.dishes.length < 2 || t.dishes.length > 4) bad(p.num, `ticket ${i + 1} has ${t.dishes.length} dishes`);
    for (const k of t.dishes) if (!MENU[k]) bad(p.num, `ticket ${i + 1} orders ${k}, which is not on the menu`);
    if (new Set(t.dishes.filter((k) => MENU[k]).map((k) => MENU[k][1])).size < 2) bad(p.num, `ticket ${i + 1} uses one station only`);
    if (t.dishes.every((k) => MENU[k]) && !ticketFeasible(p.caps, t.dishes)) bad(p.num, `ticket ${i + 1} can never go out hot: two of its dishes finish too far apart on one station`);
  });
  for (const [st] of STATIONS) if (!(p.caps[st] >= 1)) bad(p.num, `no ${st} on the line`);
  const s = replay(p, p.sol || []);
  if (!s) { bad(p.num, `the stored service fires a dish that cannot be fired`); continue; }
  if (!isDone(s)) { bad(p.num, `the stored service leaves an order in the kitchen`); continue; }
  if (penalty(s) !== p.best || s.wait !== p.bestWait || s.sit !== p.bestSat) bad(p.num, `the stored service scores ${penalty(s)} (${s.wait} + ${SIT_WEIGHT} x ${s.sit}), the row says ${p.best} (${p.bestWait}, ${p.bestSat})`);
  if (rungs(p).length < 4) bad(p.num, `the Kitchen Ladder has only ${rungs(p).length} rungs`);
}
done(PUZZLES);
