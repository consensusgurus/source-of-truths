// THE IN-PLAY LADDER BESIDE AN ARCADE WELL (Blocks, Sweep), built from the
// same rows the right-hand panel's Board tab shows (owner, 2026-10-25: "why
// doesn't the leaderboard to the side of Blocks match the leaderboard in the
// sidebar?").
//
// Two things made the two disagree, and both are fixed here, once, for both
// games:
//
//  1. THE AXIS. The ladder read 'all:first', which puts GUESTS on the board,
//     while the panel (daily-me) and every other public board on the site
//     rank REGISTERED players only. So a guest sat at #3 beside the well and
//     was nowhere in the panel, and every rank under it was off by one. The
//     ladder now reads 'registered:first', the panel's own rows. 'all:first'
//     is still consulted, but only to find a GUEST viewer's own best run.
//
//  2. YOUR ROW. The ladder dropped your saved row and put the LIVE run in its
//     place, so a player who had banked 76 and started a fresh run read "You
//     13" at #5 while the panel said "You 76" at #2. An arcade board keeps
//     your BEST run, so "You" is now the better of your saved best and the run
//     on screen: your stored row stays exactly where the board put it until
//     the live run beats it, and only then moves.
//
// Returns { rows, rank, field, others } where `rows` is the top five plus your
// row behind a gap marker when you sit below them, and `others` is everyone
// but you in board order (Sweep's rival rail reads it).
export function buildLiveLadder(board, { live = 0, anonId = null, username = '', top = 5 } = {}) {
  const lbs = (board && board.leaderboards) || {};
  // NOT LOADED YET: say nothing rather than a one-row ladder with you at #1
  // that rearranges itself the moment the board lands.
  if (!Array.isArray(lbs['registered:first']) && !(board && Array.isArray(board.leaderboardFirst) && board.leaderboardFirst.length)) {
    return { rows: [], rank: null, field: 0, others: [], loaded: false };
  }
  const reg = Array.isArray(lbs['registered:first']) ? lbs['registered:first']
    : ((board && (board.leaderboardFirst || board.leaderboard)) || []);
  const all = Array.isArray(lbs['all:first']) ? lbs['all:first'] : ((board && board.leaderboardFirst) || []);
  const myKey = anonId ? `a:${anonId}` : null;
  const myName = String(username || '').toLowerCase();
  const isMine = (r) => (!!myKey && r.userKey === myKey)
    || (!!myName && String(r.username || '').toLowerCase() === myName);

  // Your best run so far today, from whichever axis holds you.
  const regMine = reg.findIndex(isMine);
  const guestRow = regMine < 0 ? all.find(isMine) : null;
  const stored = regMine >= 0 ? Number(reg[regMine].score) || 0 : (guestRow ? Number(guestRow.score) || 0 : null);
  const liveScore = Number(live) || 0;

  const others = reg.filter((r, i) => i !== regMine)
    .slice(0, 40)
    .map((r) => ({ name: r.username || 'player', score: r.score, me: false }));

  let at;
  let mine;
  if (regMine >= 0 && liveScore <= stored) {
    // The saved best still stands: keep the board's own placement for it.
    at = regMine;
    mine = stored;
  } else {
    mine = stored != null ? Math.max(stored, liveScore) : liveScore;
    at = others.findIndex((r) => (Number(r.score) || 0) < mine);
    if (at < 0) at = others.length;
  }
  if (at > others.length) at = others.length;
  const out = others.slice(0, at).concat([{ name: 'You', score: mine, me: true }], others.slice(at))
    .map((r, i) => ({ ...r, rank: i + 1 }));
  const meAt = out.findIndex((r) => r.me);
  return {
    rows: out.slice(0, top).concat(meAt >= top ? [{ gap: true }, out[meAt]] : []),
    rank: meAt + 1,
    field: out.length,
    others,
    loaded: true,
  };
}
