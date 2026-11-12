// scripts/verify-defuse.mjs: re-proves app/defuse/puzzles.js with the engine
// the game itself runs (lib/defuse-engine.js).
//
//   node scripts/verify-defuse.mjs
//
// What it enforces (docs/claude/daily-authoring.md, the authoring standard):
//   - num, quizId and dateLabel from the live date; dates run day after day
//     from the launch, 2026-11-12. No sunday flag on any board.
//   - UNIQUENESS IS COUNTED, NOT TRUSTED (rules 3 and 4): every ordering of the
//     cut set is tried, exactly one obeys every rule, and it is the stored
//     solution. The stored `active` and `lookAhead` are recomputed too.
//   - every rule with a true condition is NEEDED: without it a second safe
//     order appears (a keep rule is needed by definition, it changes which
//     wires are cut, and must protect at least one wire). Every other rule is
//     a decoy and must carry a condition that is false on this device.
//   - THE WALK IS THE PLAYER'S (rule 4b): the client ends the day on the first
//     cut that differs from the solution. So from every point along the safe
//     order, every other wire is tried as the next cut: on a board marked
//     lookAhead false each must break a rule on the spot (breach >= 0), and on
//     a lookAhead true board at least one must not. The safe order itself
//     never trips the on-the-spot test.
//   - the ramp (rule 5): tier by weekday; wires 4 / 5 / 6 / 7 (Sunday); live
//     rules 3 / 4 / 5 / 5..6; decoys 0 / 1 / 1..2 / 2; Gentle and Moderate
//     never need look-ahead, Tough and Sunday always do.
//   - at least three cuts; the safe order is never plain left to right or
//     right to left; no wire color three times running; known colors.
//   - variety (rules 7 and 7b): no wire position opens more than 30% of the
//     boards; no day opens on the same wire as the day before; no rule type is
//     live on more than 70% of days; no day has the same mix of live rule
//     types as the day before; the opening rule is not always printed first
//     (a 'first' rule sits in manual slot 1 on under half the boards that
//     have one).
//   - the manual reads right: every rule's sentence is unique on its board,
//     ends in a period, has no em dash and no British spelling.
import { PUZZLES } from '../app/defuse/puzzles.js';
import { WIRE_NAMES, condTrue, cutSet, solutions, breach, pickWire, ruleText } from '../lib/defuse-engine.js';

const START = '2026-11-12';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const RAMP = { 1: ['Gentle', 4, [3, 3], [0, 0]], 2: ['Gentle', 4, [3, 3], [0, 0]], 3: ['Moderate', 5, [4, 4], [1, 1]], 4: ['Moderate', 5, [4, 4], [1, 1]], 5: ['Tough', 6, [5, 5], [1, 2]], 6: ['Tough', 6, [5, 5], [1, 2]], 0: ['Tough', 7, [5, 6], [2, 2]] };
let fails = 0;
const fail = (m) => { fails++; console.error('FAIL ' + m); };
const day = (s) => new Date(`${s}T12:00:00Z`).getTime();

const firstPos = {}, typeDays = {};
let prev = null, prevFirst = -1, prevSig = '', firstRuleBoards = 0, firstRuleOnTop = 0;
PUZZLES.forEach((p, i) => {
  const tag = `#${p.num} ${p.live}`;
  if (p.num !== i + 1) fail(`${tag}: num should be ${i + 1}`);
  if (i === 0 && p.live !== START) fail(`${tag}: the bank should open on ${START}`);
  if (prev && day(p.live) - day(prev) !== 86400000) fail(`${tag}: dates are not contiguous`);
  prev = p.live;
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `defuse-${m}-${d}-${String(y).slice(2)}`) fail(`${tag}: quizId does not match the date`);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${d}, ${y}`) fail(`${tag}: dateLabel does not match the date`);
  if ('sunday' in p) fail(`${tag}: Defuse carries no sunday flag`);
  const dow = new Date(`${p.live}T12:00:00Z`).getUTCDay(), [tier, nW, liveBand, decoyBand] = RAMP[dow];
  if (p.tier !== tier) fail(`${tag}: tier ${p.tier} on a ${tier} day`);
  if (p.wires.length !== nW) fail(`${tag}: ${p.wires.length} wires, the day calls for ${nW}`);
  if (p.wires.some((w) => !WIRE_NAMES.includes(w))) fail(`${tag}: unknown wire color`);
  if (p.wires.some((w, k) => k > 1 && w === p.wires[k - 1] && w === p.wires[k - 2])) fail(`${tag}: one color three times running`);
  if (!/^[A-Z]{2}-\d{4}$/.test(p.serial)) fail(`${tag}: serial ${p.serial}`);
  if (!(p.batteries >= 1 && p.batteries <= 3)) fail(`${tag}: ${p.batteries} batteries`);
  if (!p.light || !/^[A-Z]{3}$/.test(p.light.label) || typeof p.light.on !== 'boolean') fail(`${tag}: indicator light`);

  // rules: live ones are needed, the rest are false decoys
  const live = p.rules.filter((r) => condTrue(p, r.cond)), decoys = p.rules.filter((r) => !condTrue(p, r.cond));
  if (p.active !== live.length) fail(`${tag}: active says ${p.active}, ${live.length} rules are live`);
  if (live.length < liveBand[0] || live.length > liveBand[1]) fail(`${tag}: ${live.length} live rules, the day calls for ${liveBand.join('..')}`);
  if (decoys.length < decoyBand[0] || decoys.length > decoyBand[1]) fail(`${tag}: ${decoys.length} decoys, the day calls for ${decoyBand.join('..')}`);
  for (const r of decoys) if (!r.cond) fail(`${tag}: a decoy with no condition`);
  if (live.filter((r) => r.type === 'keep').length > 1) fail(`${tag}: more than one live keep rule`);
  const need = cutSet(p);
  if (need.length < 3) fail(`${tag}: only ${need.length} cuts`);
  for (const r of live) {
    if (r.type === 'keep' && need.length === p.wires.length) fail(`${tag}: a keep rule that protects nothing`);
    if (r.type === 'first' && !need.includes(pickWire(p, r))) fail(`${tag}: the opening rule points at a wire that is not cut`);
  }

  // exactly one safe order, and it is the stored one
  const sols = solutions(p, 3);
  if (sols.length !== 1) { fail(`${tag}: ${sols.length === 0 ? 'no' : 'more than one'} safe order`); return; }
  const sol = sols[0];
  if (JSON.stringify(sol) !== JSON.stringify(p.solution)) fail(`${tag}: stored solution ${p.solution} is not the safe order ${sol}`);
  p.rules.forEach((r, x) => { if (condTrue(p, r.cond) && r.type !== 'keep' && solutions(p, 2, x).length < 2) fail(`${tag}: rule ${x + 1} is not needed ("${ruleText(p, r)}")`); });
  const asc = sol.every((w, k) => k === 0 || w > sol[k - 1]), desc = sol.every((w, k) => k === 0 || w < sol[k - 1]);
  if (asc || desc) fail(`${tag}: the safe order is plain ${asc ? 'left to right' : 'right to left'}`);

  // the player's walk
  let dead = 0;
  for (let k = 0; k < sol.length; k++) {
    if (breach(p, sol.slice(0, k + 1)) >= 0) fail(`${tag}: the safe order trips the on-the-spot test at cut ${k + 1}`);
    for (let w = 0; w < p.wires.length; w++) {
      if (w === sol[k] || sol.slice(0, k).includes(w)) continue;
      if (breach(p, [...sol.slice(0, k), w]) < 0) dead++;
    }
  }
  if (p.lookAhead !== (dead > 0)) fail(`${tag}: lookAhead says ${p.lookAhead}, the walk finds ${dead} dead-end cuts`);
  if ((tier === 'Tough') !== (dead > 0)) fail(`${tag}: a ${tier} board ${dead > 0 ? 'needs' : 'does not need'} look-ahead`);

  // the manual's words
  const texts = p.rules.map((r) => ruleText(p, r));
  if (new Set(texts).size !== texts.length) fail(`${tag}: two rules read the same`);
  for (const t of texts) { if (!/\.$/.test(t) || /—/.test(t) || /colour|grey\b/i.test(t) || /undefined|NaN/.test(t)) fail(`${tag}: bad rule text "${t}"`); }

  // variety
  if (sol[0] === prevFirst) fail(`${tag}: opens on the same wire as the day before`);
  prevFirst = sol[0]; firstPos[sol[0]] = (firstPos[sol[0]] || 0) + 1;
  const types = [...new Set(live.map((r) => r.type))].sort(), sig = live.map((r) => r.type).sort().join();
  if (sig === prevSig) fail(`${tag}: the same mix of rules as the day before`);
  prevSig = sig; types.forEach((t) => { typeDays[t] = (typeDays[t] || 0) + 1; });
  const fi = p.rules.findIndex((r) => r.type === 'first' && condTrue(p, r.cond));
  if (fi >= 0) { firstRuleBoards++; if (fi === 0) firstRuleOnTop++; }
});
const N = PUZZLES.length;
for (const [pos, c] of Object.entries(firstPos)) if (N >= 20 && c / N > 0.3) fail(`wire ${Number(pos) + 1} opens ${c} of ${N} boards`);
for (const [t, c] of Object.entries(typeDays)) if (N >= 20 && c / N > 0.7) fail(`rule type ${t} is live on ${c} of ${N} days`);
if (firstRuleBoards >= 10 && firstRuleOnTop / firstRuleBoards >= 0.5) fail(`the opening rule is printed first on ${firstRuleOnTop} of ${firstRuleBoards} boards`);

console.log(fails ? `verify-defuse: ${fails} failure(s)` : `verify-defuse: ${N} boards OK, each with exactly one safe order, through ${PUZZLES[N - 1].live}`);
process.exit(fails ? 1 : 0);
