// scripts/squash-par.mjs — the day's par for Squash, measured off the engine.
// Shared by scripts/gen-squash.mjs (which writes it) and
// scripts/verify-squash.mjs (which proves the bank still matches it).
//
// Squash is a five-minute blitz, so a run has no move count of its own. Par is
// measured at a BLITZ PACE: the swaps a steady player gets through in five
// minutes, animations included (PACE_MOVES, about one every four seconds).
//
//   par = the midpoint between a greedy bot and the average of three random
//         swappers, each playing PACE_MOVES swaps, rounded to the nearest 100,
//         never under 500.

import { newGame, validMoves, move, greedyRun } from '../lib/squash-engine.js';

export const PACE_MOVES = 75;

function randomRun(quizId, opts, seed) {
  const s = newGame({ quizId, ...opts, moves: PACE_MOVES });
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
export function parFor(quizId, { size }) {
  const opts = { size };
  const g = greedyRun(quizId, { ...opts, moves: PACE_MOVES }).score;
  const r = (randomRun(quizId, opts, 1) + randomRun(quizId, opts, 2) + randomRun(quizId, opts, 3)) / 3;
  return Math.max(500, Math.round((g + r) / 2 / 100) * 100);
}
