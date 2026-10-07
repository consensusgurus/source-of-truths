// scripts/verify-snake.mjs — the Snake bank and engine.
//
//   node scripts/verify-snake.mjs
//
// Snake ships no board: the day's apple order is generated from its quizId by
// lib/snake-engine.js, which is also what the client plays. So this checks the
// FRAME the bank carries and the ENGINE the frame is played on:
//
//   bank    contiguous dates from day 1, numbers in order, quizIds that match
//           their live date, dateLabels, size 15 everywhere, Sunday flags on
//           real Sundays only, grow 2 / par 15 on a Sunday and grow 1 / par 20
//           on every other day.
//   engine  the plan is deterministic and differs day to day, never repeats a
//           square twice running, and never opens in the starting row; edges
//           wrap; a turn straight back is ignored; chasing your own tail is
//           legal; biting your body ends the run; a Sunday apple grows by two;
//           and a simple greedy player eats apples on every banked day, so no
//           day is broken by its plan.
import { PUZZLES } from '../app/snake/puzzles.js';
import { dayPlan, newGame, turn, step, resolve, SNAKE_SIZE, PLAN_LEN } from '../lib/snake-engine.js';

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
  if (p.quizId !== `snake-${m}-${day}-${String(y).slice(2)}`) fail(`${p.live}: quizId ${p.quizId}`);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${day}, ${y}`) fail(`${p.live}: dateLabel ${p.dateLabel}`);
  if (p.size !== SNAKE_SIZE) fail(`${p.live}: size ${p.size}`);
  const sun = d.getUTCDay() === 0;
  if (!!p.sunday !== sun) fail(`${p.live}: sunday flag ${p.sunday} on a ${sun ? 'Sunday' : 'weekday'}`);
  if (sun && (p.grow !== 2 || p.par !== 15)) fail(`${p.live}: Sunday frame grow ${p.grow} par ${p.par}`);
  if (!sun && (p.grow !== 1 || p.par !== 20)) fail(`${p.live}: weekday frame grow ${p.grow} par ${p.par}`);
});
const ids = new Set(PUZZLES.map((p) => p.quizId));
if (ids.size !== PUZZLES.length) fail('a quizId repeats');

// ---- engine -----------------------------------------------------------------
const a1 = dayPlan(PUZZLES[0].quizId), a2 = dayPlan(PUZZLES[0].quizId), b = dayPlan(PUZZLES[1].quizId);
if (a1.join() !== a2.join()) fail('dayPlan is not deterministic');
if (a1.join() === b.join()) fail('two days share a plan');
for (const p of PUZZLES) {
  const plan = dayPlan(p.quizId, p.size);
  if (plan.length !== PLAN_LEN) fail(`${p.live}: plan length ${plan.length}`);
  for (let i = 1; i < plan.length; i++) if (plan[i] === plan[i - 1]) { fail(`${p.live}: square repeats at ${i}`); break; }
  if (Math.floor(plan[0] / p.size) === (p.size / 2 | 0)) fail(`${p.live}: first apple in the starting row`);
  if (plan.some((x) => x < 0 || x >= p.size * p.size)) fail(`${p.live}: plan leaves the board`);
}

// wrap
{
  const g = newGame({ size: 5, grow: 1, plan: [0, 1, 2, 3] });
  g.snake = [{ x: 4, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 2 }];
  g.apple = { x: 0, y: 0 };
  step(g);
  if (!g.alive || g.snake[0].x !== 0 || g.snake[0].y !== 2) fail('the right edge does not wrap to the left');
}
// reversal ignored
{
  const g = newGame({ size: 15, grow: 1, plan: dayPlan('x') });
  if (turn(g, { x: -1, y: 0 })) fail('a turn straight back was accepted');
  if (!turn(g, { x: 0, y: 1 })) fail('a legal turn was refused');
}
// tail chase is legal; biting the body is not
{
  const g = newGame({ size: 15, grow: 1, plan: [224, 223] });
  g.snake = [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 5, y: 6 }];
  g.dir = { x: 0, y: 1 };
  g.apple = resolve(g, 0);
  step(g);
  if (!g.alive) fail('moving into the square the tail leaves ended the run');
  const h = newGame({ size: 15, grow: 1, plan: [224, 223] });
  h.snake = [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 5, y: 6 }, { x: 4, y: 6 }];
  h.dir = { x: 0, y: 1 };
  h.apple = resolve(h, 0);
  step(h);
  if (h.alive) fail('running into the body did not end the run');
}
// Sunday growth
{
  const g = newGame({ size: 15, grow: 2, plan: dayPlan('x') });
  g.apple = { x: 8, y: 7 };
  const L = g.snake.length;
  step(g); step(g); step(g);
  if (g.apples !== 1 || g.snake.length !== L + 2) fail(`a Sunday apple grew the snake by ${g.snake.length - L}, expected 2`);
}

// a greedy player eats on every banked day
function greedy(p, cap = 6000) {
  const g = newGame({ size: p.size, grow: p.grow, plan: dayPlan(p.quizId, p.size) });
  const n = p.size, D = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
  const wrapd = (a, b) => { const d = Math.abs(a - b); return Math.min(d, n - d); };
  while (g.alive && !g.won && g.moves < cap) {
    const h = g.snake[0];
    const body = new Set(g.snake.slice(0, -1).map((c) => c.x * 100 + c.y));
    let best = null, bd = Infinity;
    for (const d of D) {
      if (d.x === -g.dir.x && d.y === -g.dir.y) continue;
      const nx = (h.x + d.x + n) % n, ny = (h.y + d.y + n) % n;
      if (body.has(nx * 100 + ny)) continue;
      const dist = g.apple ? wrapd(nx, g.apple.x) + wrapd(ny, g.apple.y) : 0;
      if (dist < bd) { bd = dist; best = d; }
    }
    if (best) g.queue = [best];
    step(g);
  }
  return g.apples;
}
const scores = PUZZLES.map((p) => greedy(p));
PUZZLES.forEach((p, i) => { if (scores[i] < 3) fail(`${p.live}: a greedy player ate only ${scores[i]}`); });
const sorted = scores.slice().sort((x, y) => x - y);

console.log(`${PUZZLES.length} days, ${PUZZLES[0].live} to ${PUZZLES[PUZZLES.length - 1].live}; greedy apples min ${sorted[0]}, median ${sorted[sorted.length >> 1]}, max ${sorted[sorted.length - 1]}`);
console.log(fails ? `${fails} failure(s)` : 'all clear');
process.exit(fails ? 1 : 0);
