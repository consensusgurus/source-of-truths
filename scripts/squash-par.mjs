// scripts/squash-par.mjs — the day's par for Squash, measured off the engine.
// Shared by scripts/gen-squash.mjs (which writes it) and
// scripts/verify-squash.mjs (which proves the bank still matches it).
//
//   par = the midpoint between a greedy bot and the average of three random
//         swappers, rounded to the nearest 100, never under 500.

import { newGame, validMoves, move, greedyRun } from '../lib/squash-engine.js';

function randomRun(quizId, opts, seed) {
  const s = newGame({ quizId, ...opts });
  let x = seed;
  while (s.used < s.max) {
    const ms = validMoves(s);
    if (!ms.length) break;
    x = (Math.imul(x, 1103515245) + 12345) & 0x7fffffff;
    const m = ms[x % ms.length];
    move(s, m[0], m[1]);
  }
  return s.score;
}
export function parFor(quizId, opts) {
  const g = greedyRun(quizId, opts).score;
  const r = (randomRun(quizId, opts, 1) + randomRun(quizId, opts, 2) + randomRun(quizId, opts, 3)) / 3;
  return Math.max(500, Math.round((g + r) / 2 / 100) * 100);
}

