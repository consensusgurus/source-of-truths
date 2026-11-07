// scripts/verify-simon.mjs — the Simon bank and engine.
//
//   node scripts/verify-simon.mjs
//
// Simon ships no board: the day's sequence is generated from its quizId by
// lib/simon-engine.js, which is also what the client plays. So this checks the
// FRAME the bank carries and the ENGINE the frame is played on:
//
//   bank    contiguous dates from day 1, numbers in order, quizIds that match
//           their live date, dateLabels, no Sunday rows (Arcade plays the same
//           every day), par 10 everywhere.
//   engine  the plan is deterministic, differs day to day, stays on the nine
//           pads, never lights one pad three times running and uses every
//           pad; a perfect player clears every round in order;
//           a wrong tap ends the run with the score at the last full round.
import { PUZZLES } from '../app/simon/puzzles.js';
import { dayPlan, newGame, press, roundPads, PADS, PLAN_LEN } from '../lib/simon-engine.js';

let fails = 0;
const fail = (m) => { fails++; console.log('FAIL', m); };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ---- bank -------------------------------------------------------------------
if (!PUZZLES.length) fail('empty bank');
let prev = null;
PUZZLES.forEach((p, i) => {
  if (p.num !== i + 1) fail(`row ${i}: num ${p.num}, expected ${i + 1}`);
  const d = new Date(p.live + 'T12:00:00Z');
  if (prev && d - prev !== 86400000) fail(`${p.live}: not the day after ${prev.toISOString().slice(0, 10)}`);
  prev = d;
  const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, day = d.getUTCDate();
  if (p.quizId !== `simon-${m}-${day}-${String(y).slice(2)}`) fail(`${p.live}: quizId ${p.quizId}`);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${day}, ${y}`) fail(`${p.live}: dateLabel ${p.dateLabel}`);
  if (p.sunday) fail(`${p.live}: Arcade has no Sunday Edition`);
  if (p.par !== 10) fail(`${p.live}: par ${p.par}`);
});
const ids = new Set(PUZZLES.map((p) => p.quizId));
if (ids.size !== PUZZLES.length) fail('a quizId repeats');

// ---- engine -----------------------------------------------------------------
const a1 = dayPlan(PUZZLES[0].quizId), a2 = dayPlan(PUZZLES[0].quizId);
if (a1.join() !== a2.join()) fail('dayPlan is not deterministic');
if (PUZZLES.length > 1 && a1.join() === dayPlan(PUZZLES[1].quizId).join()) fail('two days share a plan');
for (const p of PUZZLES) {
  const plan = dayPlan(p.quizId);
  if (plan.length !== PLAN_LEN) fail(`${p.live}: plan length ${plan.length}`);
  if (plan.some((x) => !Number.isInteger(x) || x < 0 || x >= PADS)) fail(`${p.live}: plan leaves the board`);
  for (let i = 2; i < plan.length; i++) if (plan[i] === plan[i - 1] && plan[i] === plan[i - 2]) { fail(`${p.live}: a pad lights three times running at ${i}`); break; }
  if (new Set(plan).size !== PADS) fail(`${p.live}: not every pad appears`);
}

// a perfect run
{
  const e = newGame(a1);
  for (let r = 1; r <= 30; r++) {
    const pads = roundPads(e);
    if (pads.length !== r) { fail(`round ${r} shows ${pads.length} pads`); break; }
    let res = null;
    for (const pd of pads) res = press(e, pd);
    if (res !== 'round') { fail(`round ${r} did not complete`); break; }
    if (e.score !== r) { fail(`after round ${r} score is ${e.score}`); break; }
  }
}
// a miss in round 6 scores 5
{
  const e = newGame(a1);
  for (let r = 1; r <= 5; r++) for (const pd of roundPads(e)) press(e, pd);
  const pads = roundPads(e);
  press(e, pads[0]); press(e, pads[1]);
  const wrong = (pads[2] + 1) % PADS;
  if (press(e, wrong) !== 'miss') fail('a wrong tap did not miss');
  if (e.alive) fail('the run is still alive after a miss');
  if (e.score !== 5) fail(`a miss in round 6 scored ${e.score}, expected 5`);
  if (!e.miss || e.miss.want !== pads[2] || e.miss.pad !== wrong) fail('the miss does not record the pad wanted');
  if (press(e, pads[2]) !== 'dead') fail('a dead run took another tap');
}
// a miss on the very first tap scores 0
{
  const e = newGame(a1);
  if (press(e, (a1[0] + 1) % PADS) !== 'miss' || e.score !== 0) fail('a first-tap miss should score 0');
}

if (fails) { console.log(`verify-simon: ${fails} failure(s)`); process.exit(1); }
console.log(`verify-simon: ok (${PUZZLES.length} days, ${PUZZLES[0].live} to ${PUZZLES[PUZZLES.length - 1].live})`);
