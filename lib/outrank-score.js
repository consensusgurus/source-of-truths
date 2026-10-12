// Shared Outrank adaptive scoring. Extracted (like lib/outwit-score.js) so BOTH
// the live result-page board (/api/outrank) and the daily/combined leaderboard
// (/api/quiz/daily-combined) score Outrank with the EXACT same code.
//
// Outrank is a crowd-ranking game: each player casts ONE favorite vote for the
// day's slate, then predicts the crowd's full order of that slate by
// favorite-vote share. The answer key is therefore built entirely by the
// players themselves, and — exactly like Outwit — it is ADAPTIVE: the crowd
// order is a pure function of ALL votes in the pool right now, recomputed from
// scratch every time, so scores and ranks move all day as new players lock in.
//
// A player's stored answers array is [fav, r1, r2, ... rN]: answers[0] is the
// index of their favorite item, answers[1..N] is their predicted order (item
// indices, best first — always a full permutation of 0..N-1).
//
// SCORING: each item pays by how close the player put it to its true crowd
// slot — exact slot = 2, off by one = 1, else 0. Six items = 12 points on a
// weekday, seven = 14 on the Sunday Edition.
//
// LEAVE-ONE-OUT: a player's prediction is scored against the crowd MINUS their
// own favorite vote, so their own ballot never shifts the order they are being
// graded on. (Symmetric with Outwit's leave-one-out rule; on any tie the
// deterministic tiebreak below applies.)
//
// CROWD ORDER TIEBREAK: more favorite votes ranks higher; ties break to the
// lower item index (the puzzle's fixed display order, which is hand-mixed and
// never the expected ranking, so the tiebreak carries no signal).

import { gamePoints } from './daily-combined';

// house retires once MORE than this many real players are in (pool-wide flag).
export const HOUSE_CUTOFF = 10;

// Count favorite votes per item over a pool of vote indices.
export function favCounts(pool, itemCount) {
  const counts = new Array(itemCount).fill(0);
  for (const v of pool) if (Number.isInteger(v) && v >= 0 && v < itemCount) counts[v]++;
  return counts;
}

// The crowd's ranking from a counts array: item indices, best first.
// More votes wins; ties break to the lower item index.
export function crowdOrderOf(counts) {
  return counts
    .map((c, i) => ({ c, i }))
    .sort((a, b) => b.c - a.c || a.i - b.i)
    .map((x) => x.i);
}

// Per-item points for one predicted order against one actual order.
// Returns { pts: [per predicted slot], total }.
export function scoreOrder(predicted, actual, itemCount) {
  const actualPos = new Array(itemCount).fill(-1);
  actual.forEach((item, pos) => { actualPos[item] = pos; });
  const pts = predicted.map((item, pos) => {
    if (!(Number.isInteger(item) && item >= 0 && item < itemCount)) return 0;
    const d = Math.abs(actualPos[item] - pos);
    return d === 0 ? 2 : d === 1 ? 1 : 0;
  });
  return { pts, total: pts.reduce((s, x) => s + x, 0) };
}

// Is `answers` a valid Outrank ballot for a puzzle with itemCount items?
export function validBallot(answers, itemCount) {
  if (!Array.isArray(answers) || answers.length !== itemCount + 1) return false;
  const fav = Number(answers[0]);
  if (!(Number.isInteger(fav) && fav >= 0 && fav < itemCount)) return false;
  const seen = new Set();
  for (let i = 1; i <= itemCount; i++) {
    const v = Number(answers[i]);
    if (!(Number.isInteger(v) && v >= 0 && v < itemCount) || seen.has(v)) return false;
    seen.add(v);
  }
  return true;
}

// Build the day's shared vote pool and a totalFor() that scores any player
// against it. `players` is every ballot that should feed the pool
// ([{ answers, ... }]); the house crowd seeds the pool while at most
// HOUSE_CUTOFF real players are in, exactly like Outwit.
export function scoreOutrankField(puzzle, players, { houseCutoff = HOUSE_CUTOFF } = {}) {
  const K = puzzle.items.length;
  const realCount = players.length;
  const useHouse = realCount <= houseCutoff;
  const favPool = [
    ...(useHouse ? puzzle.house : []),
    ...players.map((p) => Number(p.answers && p.answers[0])).filter((x) => Number.isInteger(x)),
  ];
  const counts = favCounts(favPool, K);
  const crowdOrder = crowdOrderOf(counts);
  const poolSize = favPool.length;

  // Leave-one-out: score a ballot against the counts minus its own fav vote.
  // Returns the counts too, so any surface that DISPLAYS the order can print
  // the same numbers it was sorted on. Showing the full counts beside a
  // leave-one-out order made a 47% item sit below a 40% one (2026-10-12).
  const without = (fav) => {
    if (!(Number.isInteger(fav) && fav >= 0 && fav < K)) return { order: crowdOrder, counts };
    const c2 = counts.slice();
    c2[fav] = Math.max(0, c2[fav] - 1);
    return { order: crowdOrderOf(c2), counts: c2 };
  };

  const detailFor = (answers) => {
    if (!validBallot(answers, K)) return { pts: new Array(K).fill(0), total: 0, actual: crowdOrder, counts };
    const { order: actual, counts: graded } = without(Number(answers[0]));
    const predicted = answers.slice(1).map(Number);
    const { pts, total } = scoreOrder(predicted, actual, K);
    return { pts, total, actual, counts: graded };
  };
  const totalFor = (p) => detailFor(p.answers).total;

  return { counts, crowdOrder, poolSize, detailFor, totalFor, useHouse, realCount, itemCount: K };
}

// Build a scoreGame-compatible { field, players:Map } for the daily/combined
// board. `players` is EVERY stored ballot [{ answers, created, name, userId,
// anonId }] — every ballot feeds the pool, but only NAMED (registered) players
// are ranked, exactly like the live board. Ranking + tiebreak match
// /api/outrank: adaptive total desc, then earliest submission. completion /
// placement are on the same 0..15 scale scoreGame uses.
export function scoreOutrankGame(puzzle, players, { houseCutoff = HOUSE_CUTOFF } = {}) {
  const { totalFor } = scoreOutrankField(puzzle, players, { houseCutoff });
  const total = puzzle.items.length * 2;
  const named = players
    .filter((p) => p.name)
    .map((p) => ({ ...p, score: totalFor(p) }));
  named.sort((a, b) => b.score - a.score || String(a.created).localeCompare(String(b.created)));
  const N = named.length;
  const out = new Map();
  named.forEach((p, i) => {
    const rank = i + 1;
    const ratio = total > 0 ? Math.max(0, Math.min(1, p.score / total)) : 0;
    // Ranks here are strict (ties break on submission time), so the tie span
    // is a single position. Same 0..15 scale scoreGame pays, same one helper.
    const { completion, placement, points } = gamePoints(puzzle.quizId, { lo: rank, field: N, ratio });
    const uk = p.userId ? `u:${p.userId}` : `a:${p.anonId}`;
    out.set(uk, {
      userKey: uk,
      username: p.name,
      score: p.score,
      total,
      guessesUsed: null,
      timeElapsed: null,
      completion,
      placement,
      points,
      rank,
      field: N,
    });
  });
  return { field: N, players: out };
}
