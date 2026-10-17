// Herd scoring (owner, 2026-10-16). Shared by /api/herd (the live result and
// board), /api/quiz/daily-combined and /api/quiz/daily-me (the per-game tab),
// and /api/quiz/crowd-today (the tile panel), so every surface reads one rule.
//
// Ten questions, each with 2 to 4 options. A call pays 1 point when the option
// you picked is the herd's pick: the most-picked option, counted LEAVE-ONE-OUT
// (the crowd minus your own vote, so your ballot never props up your answer),
// with ties counting for every option tied at the top. Out of 10.
//
// ADAPTIVE: nothing is frozen. A score is a pure function of every pick in the
// pool right now and is recomputed on every request, so it moves as the field
// fills in, exactly like Outwit, Outrank and Feud.
//
// POOL RULE: the house crowd (48 votes per question, stored as counts in
// app/herd/puzzles.js) is in the pool only while at most HOUSE_CUTOFF real
// players are in. From the eleventh on, the pool is real picks only, for
// everyone.
//
// RANKING: points desc, then HERD SHARE desc (the summed leave-one-out share of
// the crowd that picked what you picked, a finer read of how squarely you sat
// in the herd), then earliest submission. rankHerd() is the one comparator.

import { gamePoints } from './daily-combined';

export const HOUSE_CUTOFF = 10;

function looCounts(counts, v) {
  const c = counts.slice();
  if (Number.isInteger(v) && v >= 0 && v < c.length) c[v] = Math.max(0, c[v] - 1);
  return c;
}

// One prompt's context from its pool counts.
export function herdContext(pr, counts) {
  const ptsFor = (v) => {
    if (!(Number.isInteger(v) && v >= 0 && v < counts.length)) return 0;
    const c = looCounts(counts, v);
    return c[v] >= Math.max(...c) ? 1 : 0;
  };
  const shareFor = (v) => {
    if (!(Number.isInteger(v) && v >= 0 && v < counts.length)) return 0;
    const c = looCounts(counts, v);
    const tot = c.reduce((a, b) => a + b, 0);
    return tot > 0 ? c[v] / tot : 1;
  };
  // The reveal a player is shown: the counts their point was scored on.
  const viewFor = (v) => {
    const c = looCounts(counts, Number(v));
    const max = Math.max(...c);
    const herd = c.map((n, i) => (n === max ? i : -1)).filter((i) => i >= 0);
    return { counts: c, herd };
  };
  return { counts, ptsFor, shareFor, viewFor };
}

export function scoreHerdField(puzzle, players, { houseCutoff = HOUSE_CUTOFF } = {}) {
  const realCount = players.length;
  const useHouse = realCount <= houseCutoff;
  const contexts = puzzle.prompts.map((pr, i) => {
    const K = pr.options.length;
    const counts = useHouse && Array.isArray(pr.house) ? pr.house.slice(0, K).map((n) => Number(n) || 0) : new Array(K).fill(0);
    while (counts.length < K) counts.push(0);
    for (const p of players) {
      const v = Number(p.answers && p.answers[i]);
      if (Number.isInteger(v) && v >= 0 && v < K) counts[v]++;
    }
    return herdContext(pr, counts);
  });
  const totalFor = (p) => contexts.reduce((s, c, i) => s + c.ptsFor(Number(p.answers[i])), 0);
  const shareFor = (p) => contexts.reduce((s, c, i) => s + c.shareFor(Number(p.answers[i])), 0);
  const poolSize = contexts[0] ? contexts[0].counts.reduce((a, b) => a + b, 0) : 0;
  return { contexts, totalFor, shareFor, useHouse, realCount, poolSize };
}

// Sort entries { total, share, created } in board order, in place, and return them.
export function rankHerd(entries) {
  entries.sort((a, b) => b.total - a.total || b.share - a.share || String(a.created).localeCompare(String(b.created)));
  return entries;
}

export function cleanHerdBallot(answers, puzzle) {
  if (!Array.isArray(answers) || answers.length !== puzzle.prompts.length) return null;
  const out = [];
  for (let i = 0; i < puzzle.prompts.length; i++) {
    const v = Number(answers[i]);
    if (!Number.isInteger(v) || v < 0 || v >= puzzle.prompts[i].options.length) return null;
    out.push(v);
  }
  return out;
}

// scoreGame-compatible { field, players:Map } for the combined board: every
// pick feeds the pool, only NAMED players rank.
export function scoreHerdGame(puzzle, players, { houseCutoff = HOUSE_CUTOFF } = {}) {
  const { totalFor, shareFor } = scoreHerdField(puzzle, players, { houseCutoff });
  const total = puzzle.prompts.length;
  const named = rankHerd(players.filter((p) => p.name).map((p) => ({ ...p, total: totalFor(p), share: shareFor(p) })));
  const N = named.length;
  const out = new Map();
  named.forEach((p, i) => {
    const rank = i + 1;
    const ratio = total > 0 ? Math.max(0, Math.min(1, p.total / total)) : 0;
    const { completion, placement, points } = gamePoints(puzzle.quizId, { lo: rank, field: N, ratio });
    const uk = p.userId ? `u:${p.userId}` : `a:${p.anonId}`;
    out.set(uk, {
      userKey: uk, username: p.name, score: p.total, total,
      guessesUsed: null, timeElapsed: null, completion, placement, points, rank, field: N,
    });
  });
  return { field: N, players: out };
}
