// Poll scoring (owner, 2026-11-16). Shared by /api/poll (the live result and
// board), /api/quiz/daily-combined and /api/quiz/daily-me (the per-game tab),
// and /api/quiz/crowd-today (the tile panel), so every surface reads one rule.
//
// Five questions a day, every one A or B. On each the player gives TWO things:
// their own pick, and their guess at the percentage of today's players who
// picked A (the first option). Only the guess is scored. Each question is worth
// an equal slice of 100 (20 points on a five-question day) and a guess loses a
// point for every percentage point it misses the real split by, never below 0.
//
// THE BALLOT IS ONE INTEGER A QUESTION: pick * 1000 + pct, so 0..100 is "I
// picked A" and 1000..1100 is "I picked B", with pct always the guessed share
// for A. encodePoll / decodePoll are the only code that knows this.
//
// LEAVE-ONE-OUT: the real split a player is scored against is the crowd minus
// their own pick, rounded to a whole percent, so nobody is graded on a number
// they moved themselves.
//
// ADAPTIVE: nothing is frozen. A score is a pure function of every ballot in
// the pool right now and is recomputed on every request, so it moves as the
// field fills in, exactly like Herd, Outwit, Outrank and Feud.
//
// POOL RULE: the house crowd (48 votes per question, stored as counts in
// app/poll/puzzles.js) is in the pool only while at most HOUSE_CUTOFF real
// players are in. From the eleventh on, the pool is real picks only.
//
// RANKING: points desc, then TOTAL MISS asc (the summed percentage points off,
// which still separates two players who both zeroed a question), then earliest
// submission. rankPoll() is the one comparator.
//
// THE LEAN: how far the player's guesses sat toward THEIR OWN side, averaged
// over the day (guessed share for the side they picked, minus its real share).
// Positive means they overrate how many people agree with them.

import { gamePoints } from './daily-combined';

export const HOUSE_CUTOFF = 10;
export const POLL_TOTAL = 100;

export function encodePoll(pick, pct) { return (pick ? 1000 : 0) + pct; }
export function decodePoll(v) {
  const n = Number(v);
  if (!Number.isInteger(n)) return null;
  const pick = n >= 1000 ? 1 : 0;
  const pct = n - pick * 1000;
  if (pct < 0 || pct > 100) return null;
  return { pick, pct };
}

export function perQuestion(puzzle) {
  const n = (puzzle && puzzle.prompts && puzzle.prompts.length) || 5;
  return POLL_TOTAL / n;
}

// One prompt's context from its pool counts [A, B].
export function pollContext(counts, per) {
  // The split this ballot is scored against: the pool without its own pick.
  const viewFor = (v) => {
    const d = decodePoll(v);
    const c = counts.slice();
    if (d) c[d.pick] = Math.max(0, c[d.pick] - 1);
    const n = c[0] + c[1];
    const actual = n > 0 ? Math.round((c[0] / n) * 100) : 50;
    return { counts: c, n, actual };
  };
  const errFor = (v) => {
    const d = decodePoll(v);
    if (!d) return 100;
    return Math.abs(d.pct - viewFor(v).actual);
  };
  const ptsFor = (v) => (decodePoll(v) ? Math.max(0, Math.round(per - errFor(v))) : 0);
  // Guessed share for the side the player picked, minus that side's real share.
  const leanFor = (v) => {
    const d = decodePoll(v);
    if (!d) return 0;
    const a = viewFor(v).actual;
    return d.pick === 0 ? d.pct - a : a - d.pct;
  };
  return { counts, viewFor, errFor, ptsFor, leanFor };
}

export function scorePollField(puzzle, players, { houseCutoff = HOUSE_CUTOFF } = {}) {
  const realCount = players.length;
  const useHouse = realCount <= houseCutoff;
  const per = perQuestion(puzzle);
  const contexts = puzzle.prompts.map((pr, i) => {
    const counts = useHouse && Array.isArray(pr.house) ? [Number(pr.house[0]) || 0, Number(pr.house[1]) || 0] : [0, 0];
    for (const p of players) {
      const d = decodePoll(p.answers && p.answers[i]);
      if (d) counts[d.pick]++;
    }
    return pollContext(counts, per);
  });
  const totalFor = (p) => contexts.reduce((s, c, i) => s + c.ptsFor(p.answers[i]), 0);
  const missFor = (p) => contexts.reduce((s, c, i) => s + c.errFor(p.answers[i]), 0);
  const leanFor = (p) => Math.round(contexts.reduce((s, c, i) => s + c.leanFor(p.answers[i]), 0) / (contexts.length || 1));
  const poolSize = contexts[0] ? contexts[0].counts[0] + contexts[0].counts[1] : 0;
  return { contexts, totalFor, missFor, leanFor, useHouse, realCount, poolSize, per };
}

// Sort entries { total, miss, created } in board order, in place, and return them.
export function rankPoll(entries) {
  entries.sort((a, b) => b.total - a.total || a.miss - b.miss || String(a.created).localeCompare(String(b.created)));
  return entries;
}

export function cleanPollBallot(answers, puzzle) {
  if (!Array.isArray(answers) || answers.length !== puzzle.prompts.length) return null;
  const out = [];
  for (let i = 0; i < puzzle.prompts.length; i++) {
    const d = decodePoll(answers[i]);
    if (!d) return null;
    out.push(encodePoll(d.pick, d.pct));
  }
  return out;
}

// scoreGame-compatible { field, players:Map } for the combined board: every
// ballot feeds the pool, only NAMED players rank.
export function scorePollGame(puzzle, players, { houseCutoff = HOUSE_CUTOFF } = {}) {
  const clean = players.filter((p) => cleanPollBallot(p.answers, puzzle));
  const { totalFor, missFor } = scorePollField(puzzle, clean, { houseCutoff });
  const named = rankPoll(clean.filter((p) => p.name).map((p) => ({ ...p, total: totalFor(p), miss: missFor(p) })));
  const N = named.length;
  const out = new Map();
  named.forEach((p, i) => {
    const rank = i + 1;
    const ratio = Math.max(0, Math.min(1, p.total / POLL_TOTAL));
    const { completion, placement, points } = gamePoints(puzzle.quizId, { lo: rank, field: N, ratio });
    const uk = p.userId ? `u:${p.userId}` : `a:${p.anonId}`;
    out.set(uk, {
      userKey: uk, username: p.name, score: p.total, total: POLL_TOTAL,
      guessesUsed: null, timeElapsed: null, completion, placement, points, rank, field: N,
    });
  });
  return { field: N, players: out };
}
