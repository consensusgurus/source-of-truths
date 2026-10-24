// Aorb scoring (owner, 2026-10-23). Shared by /api/aorb (the per-question
// reveal, the finished result and the live board), /api/quiz/daily-combined and
// /api/quiz/daily-me (the per-game tab), and /api/quiz/crowd-today (the tile
// panel), so every surface reads one rule.
//
// Ten A-or-B pairs a day. On every pair the player makes TWO picks:
//   ME     their own honest pick, and
//   CROWD  their call on which side most of today's players picked as their own.
// A ballot is stored as ten [me, crowd] pairs.
//
// CROWD READ (the score). Each pair pays the share of today's players whose OWN
// pick sits on the side you called, as a whole number 0 to 100: call the 72 side
// and you earn 72, call the 28 side and you earn 28. The day's read is the
// average of the ten, rounded. Counted LEAVE-ONE-OUT: your own pick is taken out
// of the split you are scored against, so your ballot never props up your call.
//
// SURPRISE BONUS. One point on a pair when your own pick turned out MORE popular
// than the room predicted it would be: its share of everyone's own picks beats
// its share of everyone's crowd calls (both leave-one-out, so your own vote
// never moves either side). It rewards an honest pick, since it can never help
// your crowd read. Out of ten.
//
// DAY SCORE = crowd read + surprise bonus. Posted to the daily board capped at
// 100 (a read in the nineties with bonuses can only add up so far).
//
// ADAPTIVE: nothing is frozen. A score is a pure function of every ballot in the
// pool right now and is recomputed on every request, like Herd, Outwit, Outrank
// and Feud. The finished screen says so ("Live, moves until midnight").
//
// POOL RULE: the house crowd (HOUSE votes per pair, stored as counts in
// app/aorb/puzzles.js, an authored estimate) is in the pool only while at most
// HOUSE_CUTOFF real players are in. A house vote counts as both a pick and a
// call on the same side, so the house alone never pays a surprise bonus. From
// the eleventh player on, the pool is real ballots only, for everyone.
//
// EARLY READ: while fewer than EARLY_READ real players are in, surfaces flag the
// score as an early read (owner, 2026-10-23).
//
// RANKING: day score desc, then the unrounded crowd read desc, then earliest
// submission. rankAorb() is the one comparator.

import { gamePoints } from './daily-combined';

export const HOUSE = 50;
export const HOUSE_CUTOFF = 10;
export const EARLY_READ = 50;

function loo(counts, v) {
  const c = counts.slice();
  if (v === 0 || v === 1) c[v] = Math.max(0, c[v] - 1);
  return c;
}
function shareOf(c, v) {
  const tot = c[0] + c[1];
  return tot > 0 ? c[v] / tot : 0.5;
}

// One pair's context from its pool counts: picks = everyone's own picks, calls =
// everyone's crowd calls, each [A, B].
export function aorbContext(picks, calls) {
  // What a ballot [me, call] earns on this pair.
  const forPair = (me, call) => {
    const ok = (me === 0 || me === 1) && (call === 0 || call === 1);
    if (!ok) return { read: 0, readRaw: 0, bonus: 0, view: null };
    const P = loo(picks, me);
    const C = loo(calls, call);
    const readRaw = shareOf(P, call) * 100;
    const pickShare = shareOf(P, me);
    const callShare = shareOf(C, me);
    const bonus = pickShare > callShare + 1e-9 ? 1 : 0;
    const totP = P[0] + P[1];
    const pctA = totP > 0 ? Math.round((P[0] / totP) * 100) : 50;
    return {
      read: Math.round(readRaw),
      readRaw,
      bonus,
      // The reveal a player is shown: the split their point was scored on.
      view: {
        picks: P,
        pct: [pctA, 100 - pctA],
        crowd: P[0] === P[1] ? -1 : (P[0] > P[1] ? 0 : 1),
        expected: Math.round(callShare * 100),
        actual: Math.round(pickShare * 100),
      },
    };
  };
  return { picks, calls, forPair };
}

export function cleanAorbBallot(answers, puzzle) {
  if (!Array.isArray(answers) || answers.length !== puzzle.prompts.length) return null;
  const out = [];
  for (let i = 0; i < puzzle.prompts.length; i++) {
    const a = answers[i];
    if (!Array.isArray(a) || a.length !== 2) return null;
    const me = Number(a[0]), call = Number(a[1]);
    if (!(me === 0 || me === 1) || !(call === 0 || call === 1)) return null;
    out.push([me, call]);
  }
  return out;
}

export function scoreAorbField(puzzle, players, { houseCutoff = HOUSE_CUTOFF } = {}) {
  const realCount = players.length;
  const useHouse = realCount <= houseCutoff;
  const contexts = puzzle.prompts.map((pr, i) => {
    const h = useHouse && Array.isArray(pr.house) ? pr.house : [0, 0];
    const picks = [Number(h[0]) || 0, Number(h[1]) || 0];
    const calls = picks.slice();
    for (const p of players) {
      const a = p.answers && p.answers[i];
      if (!Array.isArray(a)) continue;
      // Strict: a null slot (a peek's unanswered pairs) must not read as 0.
      const me = a[0], call = a[1];
      if (me === 0 || me === 1) picks[me]++;
      if (call === 0 || call === 1) calls[call]++;
    }
    return aorbContext(picks, calls);
  });
  const detailFor = (p) => {
    let readSum = 0, bonus = 0;
    const per = contexts.map((c, i) => {
      const a = (p.answers && p.answers[i]) || [];
      const r = c.forPair(Number(a[0]), Number(a[1]));
      readSum += r.readRaw; bonus += r.bonus;
      return r;
    });
    const n = contexts.length || 1;
    const readRaw = readSum / n;
    const read = Math.round(readRaw);
    return { per, read, readRaw, bonus, total: read + bonus };
  };
  const poolSize = contexts[0] ? contexts[0].picks[0] + contexts[0].picks[1] : 0;
  return { contexts, detailFor, useHouse, realCount, poolSize, early: realCount < EARLY_READ };
}

// Sort entries { total, readRaw, created } in board order, in place, and return them.
export function rankAorb(entries) {
  entries.sort((a, b) => b.total - a.total || b.readRaw - a.readRaw || String(a.created).localeCompare(String(b.created)));
  return entries;
}

// The number posted to the daily board and the share string.
export function postedScore(total) {
  return Math.max(0, Math.min(100, Math.round(total)));
}

// scoreGame-compatible { field, players:Map } for the combined board: every
// ballot feeds the pool, only NAMED players rank.
export function scoreAorbGame(puzzle, players, { houseCutoff = HOUSE_CUTOFF } = {}) {
  const { detailFor } = scoreAorbField(puzzle, players, { houseCutoff });
  const named = rankAorb(players.filter((p) => p.name).map((p) => {
    const d = detailFor(p);
    return { ...p, total: d.total, readRaw: d.readRaw };
  }));
  const N = named.length;
  const out = new Map();
  named.forEach((p, i) => {
    const rank = i + 1;
    const ratio = Math.max(0, Math.min(1, p.total / 100));
    const { completion, placement, points } = gamePoints(puzzle.quizId, { lo: rank, field: N, ratio });
    const uk = p.userId ? `u:${p.userId}` : `a:${p.anonId}`;
    out.set(uk, {
      userKey: uk, username: p.name, score: postedScore(p.total), total: 100,
      guessesUsed: null, timeElapsed: null, completion, placement, points, rank, field: N,
    });
  });
  return { field: N, players: out };
}
