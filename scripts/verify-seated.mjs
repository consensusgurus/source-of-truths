// verify-seated: the checker for Seated (app/seated/puzzles.js), discovered by
// scripts/verify-all.mjs. Re-checks every rule in scripts/gen-seated.mjs:
//   - one board a day from 2026-11-14, quizId / dateLabel / sunday from `live`
//   - boards 1 and 2 are the intro (a Dinner Party, then a Birthday Dinner,
//     whatever day they fall on); after them the event, its tables and its band
//     follow the weekday (SPEC in the generator), Sunday the Wedding Reception
//   - there is a chair for every guest, every name on a chair is short, unique
//     and part of the full name, and no request names a guest or table that is
//     not there, names a guest against themselves, or asks for "across" at a
//     table with an odd number of chairs
//   - the stored seating (`sol`) seats every guest once and meets every request
//   - THE ROOM HAS ONE ANSWER: the split of guests between tables is the only
//     one that can be seated (on a one-table board, the order round the table,
//     mirror images aside), found by the solver in lib/seated-engine.js
//   - no copy carries an em dash, and the Seating Ladder has eight rungs with no
//     gap or overlap in their ranges
import { checker, checkDays, dowOf } from './six-verify-common.mjs';
import { ruleState, solved, solutions, bounds, rankOf, RUNGS, tagOf, ringKey, partKey } from '../lib/seated-engine.js';
import { SPEC, TYPES } from './gen-seated-spec.mjs';
import { GUESTS } from './gen-seated.mjs';
const { PUZZLES } = await import(new URL('../app/seated/puzzles.js', import.meta.url));
const { bad, done } = checker('seated');
const DASH = String.fromCharCode(8212);
checkDays('seated', PUZZLES, bad, '2026-11-14');
for (const p of PUZZLES) {
  const intro = p.num <= 2, spec = SPEC[intro ? p.num : dowOf(p.live)], band = intro ? 'intro' : spec[0];
  if (p.band !== band) bad(p.num, `band ${p.band}, expected ${band}`);
  if (p.event !== spec[1] || p.tables.map((t) => t.seats).join() !== spec[2].join()) bad(p.num, `${p.event} with tables of ${p.tables.map((t) => t.seats).join()}, expected ${spec[1]} with ${spec[2].join()}`);
  const N = p.guests.length, T = p.tables.length;
  if (N !== p.tables.reduce((a, t) => a + t.seats, 0)) { bad(p.num, `${N} guests and a different number of chairs`); continue; }
  const short = new Set();
  for (const g of p.guests) {
    if (!g.n || g.n.length > 7) bad(p.num, `the chair name ${g.n} is longer than seven letters`);
    // from board 3 on every guest is one of Sudoclue's cast, so the client has a portrait to draw
    if (p.num > 2 && (!GUESTS.includes(g.n) || g.full !== g.n)) bad(p.num, `${g.n} is not one of Sudoclue's cast`);
    if (!g.full.includes(g.n)) bad(p.num, `${g.full} does not contain the chair name ${g.n}`);
    if (short.has(g.n)) bad(p.num, `two guests are called ${g.n}`); short.add(g.n);
    if (!Number.isInteger(g.hue) || g.hue < 0 || g.hue >= 360) bad(p.num, `${g.n} has no colour`);
  }
  if (new Set(p.tables.map((t) => t.name)).size !== T) bad(p.num, 'two tables share a name');
  if (p.rules.length > spec[4]) bad(p.num, `${p.rules.length} requests, at most ${spec[4]}`);
  let ok = true; const pairs = new Set();
  for (const r of p.rules) {
    const two = r.t !== 'table' && r.t !== 'nottable';
    if (!TYPES.includes(r.t)) { bad(p.num, `a request of kind ${r.t}`); ok = false; continue; }
    if (!p.guests[r.a] || (two ? !p.guests[r.b] || r.a === r.b : !p.tables[r.table])) { bad(p.num, `a ${r.t} request names a guest or table that is not there`); ok = false; continue; }
    if (two) { const k = [r.a, r.b].sort().join('-'); if (pairs.has(k)) bad(p.num, `two requests about ${p.guests[r.a].n} and ${p.guests[r.b].n}`); pairs.add(k); }
    if (!r.why || (r.why.includes(DASH) || r.why.includes('{')) || !r.why.includes(p.guests[r.a].full) || (two && !r.why.includes(p.guests[r.b].full))) bad(p.num, `the wording of a ${r.t} request: ${r.why}`);
    if (!tagOf(p, r)) bad(p.num, `a ${r.t} request has no tag`);
    if (T === 1 && (r.t === 'same' || r.t === 'apart' || !two)) bad(p.num, `a ${r.t} request on a one-table board`);
  }
  if (!ok) continue;
  if (!Array.isArray(p.sol) || p.sol.flat().slice().sort((a, b) => a - b).join() !== p.guests.map((_, i) => i).join()) { bad(p.num, 'the stored seating does not seat every guest once'); continue; }
  if (!solved(p, p.sol)) { bad(p.num, `the stored seating breaks: ${p.rules.filter((r) => ruleState(p.sol, r) !== 'ok').map((r) => r.why).join(' / ')}`); continue; }
  const key = (s) => (T === 1 ? ringKey(s[0]) : partKey(s));
  const sols = solutions(p, 3);
  if (sols.length !== 1 || key(sols[0]) !== key(p.sol)) bad(p.num, `the room has ${sols.length > 1 ? 'more than one answer' : sols.length ? 'an answer that is not the stored one' : 'no answer'}`);
  const ub = bounds(N), r = rankOf(p, 0);
  if (r.rows.length !== 8 || RUNGS.length !== 8 || r.at !== 0) bad(p.num, 'the Seating Ladder is not eight rungs with no re-seats on top');
  for (let i = 1; i < ub.length; i++) if (ub[i] <= ub[i - 1]) bad(p.num, `ladder rung ${i + 1} has no room`);
}
if (RUNGS.join().includes(DASH)) bad(0, 'an em dash on the ladder');
done(PUZZLES);
