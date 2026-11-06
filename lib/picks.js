// PICKS: the middle of Price Check (owner, 2026-11-06; live from PICKS_FROM).
//
// The run became one everyday item (Pricer), six quick picks, and one house
// (Realtor). The picks are this game. Six calls a day, in a fixed order:
//
//   1 ab    which costs more: the day's opening item vs the first challenger
//   2 ab    the pricier of those two stays on top; the next challenger takes it on
//   3 ou    over or under: one item against a round price line
//   4 ab    the item on top vs the third challenger
//   5 tags  three items, three price tags: put each tag on its item
//   6 ab    the item on top vs the last challenger, a close call
//
// Scoring, out of PICKS_MAX = 20: each ab or ou call is worth PICK_PTS (3),
// each tag placed right is worth 1, and a STREAK of fully right picks (a tag
// match counts only at 3 of 3) pays +1 when it reaches 3 and +1 when it reaches
// 6. 5 x 3 + 3 + 2 = 20.
//
// Items are rows of the retired Dealer, Agent and Curator banks, named by
// quizId in app/picks/puzzles.js and resolved through lib/price-ship.js, so a
// picks item shows the same photo, credit and "as of" sentence its own game did.
//
// Plain data and arithmetic: importable from the server, the client and the
// verifier (scripts/verify-picks.mjs).

export const PICKS_FROM = '2026-11-07';
export const PICK_KINDS = ['ab', 'ab', 'ou', 'ab', 'tags', 'ab'];
export const PICK_PTS = 3;
export const PICKS_MAX = 20;
export const STREAK_BONUS_AT = [3, 6];
// The five calls (ab and ou) in order, for the crowd code below.
export const CALL_IDX = PICK_KINDS.map((k, i) => (k === 'tags' ? -1 : i)).filter((i) => i >= 0);

// Who is on top before each ab pick, and who wins it. `day` carries resolved
// items with integer-cent `price`: { start, chain: [4], ou: { item, line }, tags: [3] }.
export function chainOf(day) {
  const out = [];
  let holder = day.start;
  let c = 0;
  PICK_KINDS.forEach((k, i) => {
    if (k === 'ab') {
      const ch = day.chain[c++];
      const win = holder.price >= ch.price ? 'top' : 'bot';
      out.push({ i, kind: k, top: holder, bot: ch, win, winner: win === 'top' ? holder : ch, loser: win === 'top' ? ch : holder });
      holder = win === 'top' ? holder : ch;
    } else {
      out.push({ i, kind: k, holder });
    }
  });
  return out;
}

// One answer per pick: 'top' | 'bot' for ab, 'over' | 'under' for ou, and for
// tags an array where answer[k] is the index of the item whose price tag the
// player put on item k (so a right placement is answer[k] === k).
export function rightOf(day, i, ans) {
  const kind = PICK_KINDS[i];
  if (ans == null) return 0;
  if (kind === 'ab') return chainOf(day)[i].win === ans ? 1 : 0;
  if (kind === 'ou') { const truth = day.ou.item.price > day.ou.line ? 'over' : 'under'; return ans === truth ? 1 : 0; }
  if (kind === 'tags') return Array.isArray(ans) ? ans.filter((v, k) => v === k).length : 0;
  return 0;
}

// The whole day so far: per-pick points, the streak and the score.
export function gradePicks(day, answers = []) {
  let score = 0, streak = 0, best = 0;
  const per = [];
  for (let i = 0; i < PICK_KINDS.length; i++) {
    const ans = answers[i];
    if (ans == null) break;
    const kind = PICK_KINDS[i];
    const r = rightOf(day, i, ans);
    const pts = kind === 'tags' ? r : r * PICK_PTS;
    const full = kind === 'tags' ? r === 3 : r === 1;
    streak = full ? streak + 1 : 0;
    best = Math.max(best, streak);
    const bonus = full && STREAK_BONUS_AT.includes(streak) ? 1 : 0;
    score += pts + bonus;
    per.push({ i, kind, right: r, pts, bonus, full, streak });
  }
  return { score, per, streak, best, done: per.length === PICK_KINDS.length };
}

// THE CROWD CODE. A finished row carries what the player got right in
// `first_guess` (the price games' crowd column), never their score: bit n set
// = call n (CALL_IDX order) right, bits 5-6 = tags right. Stored as code + 1
// because the column takes positive integers only.
export function crowdCode(day, answers) {
  let code = 0;
  CALL_IDX.forEach((pi, n) => { if (rightOf(day, pi, answers[pi]) === 1) code |= (1 << n); });
  const tagIdx = PICK_KINDS.indexOf('tags');
  code |= (Math.min(3, rightOf(day, tagIdx, answers[tagIdx])) << 5);
  return code + 1;
}
export function readCrowdCode(v) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 128) return null;
  const code = n - 1;
  return { calls: CALL_IDX.map((_, k) => !!(code & (1 << k))), tags: (code >> 5) & 3 };
}
