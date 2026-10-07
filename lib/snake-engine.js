// Snake, the engine. Pure and deterministic, no DOM.
//
// Shared on purpose: app/snake/SnakeClient.jsx plays from this and
// scripts/verify-snake.mjs proves the day's apple order from the SAME code, so
// a checker can never pass an order the game does not actually deal.
//
// The rules, in full:
//   - The board is size x size and the edges WRAP: leave the right edge and you
//     come back on the left. There is no wall to hit.
//   - The snake moves one square per tick at a fixed pace. It never speeds up.
//   - Eating an apple grows the snake by `grow` squares (1 on weekdays, 2 on the
//     Sunday Edition) and scores one apple.
//   - Running into your own body ends the run. Moving into the square your tail
//     is leaving on this same tick is legal, as in the classic.
//   - A turn straight back into yourself is ignored, and at most two turns
//     queue between ticks, so a fast left-then-down lands as two moves.
//
// THE APPLE ORDER IS THE DAY'S. dayPlan(quizId) is a fixed list of squares,
// identical for every player: apple k goes on the k-th square of the list. If
// your snake happens to be lying there, it slides to the next free square in
// reading order, so the order is the same for everybody and only your own body
// can move an apple. The list is far longer than any run (a full 15x15 board
// is 222 apples).

export const SNAKE_SIZE = 15;
export const PLAN_LEN = 800;
export const STEP_MS = 150;        // the pace. Fixed for the whole run.

export function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The day's apple squares, as r*size+c. Never the same square twice running,
// and the first apple never lands in the starting row, so move one is a choice.
export function dayPlan(quizId, size = SNAKE_SIZE, count = PLAN_LEN) {
  const r = rng(hashStr(quizId)), n = size * size, out = [], c = (size / 2) | 0;
  let last = -1;
  while (out.length < count) {
    const i = Math.floor(r() * n);
    if (i === last) continue;
    if (out.length === 0 && Math.floor(i / size) === c) continue;
    out.push(i); last = i;
  }
  return out;
}

export function startSnake(size = SNAKE_SIZE) {
  const c = (size / 2) | 0;
  return [{ x: c, y: c }, { x: c - 1, y: c }, { x: c - 2, y: c }];
}

export function newGame({ size = SNAKE_SIZE, grow = 1, plan }) {
  const s = {
    size, grow, plan,
    snake: startSnake(size),
    dir: { x: 1, y: 0 }, queue: [], apples: 0, moves: 0, pending: 0, k: 0,
    alive: true, won: false, death: null, apple: null,
  };
  s.apple = resolve(s, s.k);
  return s;
}

function occupied(s, x, y) {
  for (let i = 0; i < s.snake.length; i++) if (s.snake[i].x === x && s.snake[i].y === y) return true;
  return false;
}

// Apple k goes on the k-th square of the day's list, or slides to the next free
// square in reading order when the snake is lying there.
export function resolve(s, k) {
  const n = s.size * s.size, start = s.plan[k % s.plan.length];
  for (let j = 0; j < n; j++) {
    const i = (start + j) % n, x = i % s.size, y = (i / s.size) | 0;
    if (!occupied(s, x, y)) return { x, y, slid: j > 0 };
  }
  return null;
}

export function turn(s, d) {
  const last = s.queue.length ? s.queue[s.queue.length - 1] : s.dir;
  if (d.x === last.x && d.y === last.y) return false;
  if (d.x === -last.x && d.y === -last.y) return false;
  if (s.queue.length >= 2) return false;
  s.queue.push(d);
  return true;
}

// One tick. Mutates and returns s.
export function step(s) {
  if (!s.alive || s.won) return s;
  if (s.queue.length) s.dir = s.queue.shift();
  const h = s.snake[0], n = s.size;
  const nx = (h.x + s.dir.x + n) % n, ny = (h.y + s.dir.y + n) % n;
  const eats = !!(s.apple && s.apple.x === nx && s.apple.y === ny);
  const willPop = !eats && s.pending === 0;
  const bodyLen = willPop ? s.snake.length - 1 : s.snake.length;
  s.moves++;
  for (let i = 0; i < bodyLen; i++) {
    if (s.snake[i].x === nx && s.snake[i].y === ny) { s.alive = false; s.death = { x: nx, y: ny }; return s; }
  }
  s.snake.unshift({ x: nx, y: ny });
  if (eats) { s.apples++; s.pending += s.grow; s.k++; }
  if (s.pending > 0) s.pending--; else s.snake.pop();
  if (eats || !s.apple) {
    s.apple = resolve(s, s.k);
    if (!s.apple) s.won = true;
  }
  return s;
}

export function peekNext(s) { return s.apple ? resolve(s, s.k + 1) : null; }

// A run's state without the plan, for saving; the plan is rebuilt from the
// quizId on load, which is what keeps a save a few hundred bytes.
export function snapshot(s) {
  const { plan, ...rest } = s;
  return JSON.parse(JSON.stringify(rest));
}
export function restore(snap, plan) {
  return { ...snap, plan, queue: [] };
}
