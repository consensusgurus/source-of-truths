'use client';

// Today's board for a just-finished daily, for the Loft end card.
//
// Reads the SHARED board API every quiz surface already uses,
// GET /api/quiz/board?quizId=<id> -> { plays, best, leaderboards, ... }, where a
// row is { username, userKey, score, timeElapsed, tryNum, ... }. Nothing new is
// stored and no scoring lives here: the ordering is whatever the API returns,
// which is the one comparator in lib/quiz-anon.js. WHICH of the six boards it
// returns is read below, and is not a detail.
//
// THE RETRY LADDER IS THE POINT, exactly as in useIqStanding, and for the same
// reason: this read races the player's own result write, so a single fetch
// often lands before their row exists and they see a board they are missing
// from. The delays are GAPS between attempts, not cumulative targets. It stops
// early once the player's own row shows up, so a player who was already on the
// board pays for one request.
//
// THE RANK IS THE SERVER'S, NOT AN INDEX INTO THE TEN ROWS (owner, 2026-08-16).
// The board API returns the TOP TEN of each axis, and the end card used to rank
// the player by their position within them, so anyone who finished eleventh or
// worse had no row to be found in and the tile printed a dash (reported on Crux:
// 20/24 in a field of 108). Passing the identity gets `me` back: the placement
// on the FULL 'registered:first' board, that board's size, and the player's own
// row. `myRank` prefers it and only falls back to the row index, so a payload
// from an older deploy still renders.
//
// It also FIXES THE LADDER. "Am I on the board yet" was answered by scanning ten
// rows, which is false for most players however long they wait, so every finish
// outside the top ten burned all five attempts. `me.placement` answers it
// properly, so those players now stop on the first read like everyone else.
import { useEffect, useState } from 'react';
import { dailyMeIdentity } from './dailyMeClient';

const GAPS = [0, 1500, 2000, 2500, 4000];

export default function useDailyBoard({ quizId = null, active = false }) {
  const [board, setBoard] = useState(null);
  useEffect(() => {
    if (!active || !quizId) return undefined;
    let alive = true;
    let timer = null;
    let i = 0;

    // Who am I on this board? The API returns a userKey per row; the local
    // identity is either a signed-in email or the anon id, so match on the
    // name the server would have written.
    let mine = null;
    try {
      const ident = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null');
      if (ident && ident.username) mine = String(ident.username).toLowerCase();
    } catch (e) {}
    // The same identity the result was written under, so the server can find
    // this player's row under either key shape. Reused from dailyMeClient rather
    // than re-read here, so the two never drift on where the tokens live.
    const { anonId, email } = dailyMeIdentity();
    const who = new URLSearchParams();
    if (anonId) who.set('anonId', anonId);
    if (email) who.set('email', email);
    // 'registered:first' is the axis rendered below, named explicitly so the
    // rank and the rows can never come from different boards.
    if (who.toString()) who.set('placeOn', 'registered:first');
    const idq = who.toString() ? `&${who.toString()}` : '';

    const attempt = () => {
      fetch(`/api/quiz/board?quizId=${encodeURIComponent(quizId)}${idq}${i > 0 ? `&_=${Date.now()}` : ''}`)
        .then((r) => r.json())
        .then((d) => {
          if (!alive || !d) return;
          // READ THE RIGHT AXIS (owner, 2026-08-15). `d.leaderboard` is the
          // 'registered:all' board, which is one row per ATTEMPT: a player who
          // replayed today appeared once per run, and an owner report caught
          // Four printing two identical-looking Gator85 rows (0:20 and 1:20)
          // for one person. It is not only cosmetic, because the rank tile
          // above the board (`myRank` in LoftFinish) is the player's index in
          // THESE rows, so every duplicate moves the number the card reports.
          // The board this card mirrors is the on-page DailyBoardPanel's,
          // which is registered players at ONE ROW EACH, so read that:
          // 'registered:first'. On an End Game title that row is the run the
          // win landed on rather than the first attempt (endGamePlan), which
          // is the same run /api/quiz/daily-me ranks, so the two boards agree.
          // Same class of bug as the arcade ladder reading `leaderboard`
          // instead of `leaderboardFirst` in BlocksClient. The fallback keeps
          // an older or partial payload rendering rather than blanking the
          // board; an EMPTY 'registered:first' is a real answer (nobody signed
          // in has finished yet) and is kept as one.
          const lb = d.leaderboards || {};
          const rows = [lb['registered:first'], d.leaderboard].find((a) => Array.isArray(a)) || [];
          // The server's answer when it gave one, the ten visible rows otherwise.
          const me = d.me && d.me.placement != null ? d.me : null;
          // A guest's would-be placement (the board route deals their rows in
          // among the registered ones). Read for the claim tile only.
          const guest = !me && d.me && d.me.wouldBe && d.me.wouldBe.placement != null ? d.me.wouldBe : null;
          // Keep asking only while the player is not on the board yet. A found
          // placement settles it whatever rank it is; without one, fall back to
          // looking for them among the ten.
          const onIt = !!me || (mine && rows.some((r) => String(r.username || '').toLowerCase() === mine));
          // `settled` says the player's own position on this board is FINAL:
          // their row is here, or the ladder is spent, or there is no identity to
          // find them by. The end card's rank tile needs it to tell "still
          // landing" (show Calculating) from "you are genuinely not on it" (show
          // a dash); without it an identified player whose row never arrives
          // would read Calculating forever.
          const last = i >= GAPS.length - 1;
          setBoard({
            plays: d.plays || 0,
            // The day's shape, for the ending's field figure (2026-09-26).
            best: d.best != null ? d.best : null,
            scoreDist: d.scoreDist || null,
            timeDist: d.timeDist || null,
            rows,
            mine,
            myRank: me ? me.placement : null,
            field: me ? me.field : null,
            myRow: me ? me.row : null,
            guest,
            settled: !!onIt || last || !mine,
          });
          if (!onIt) schedule();
        })
        .catch(() => schedule());
    };
    const schedule = () => {
      i += 1;
      if (i < GAPS.length && alive) timer = setTimeout(attempt, GAPS[i]);
    };
    attempt();
    return () => { alive = false; clearTimeout(timer); };
  }, [quizId, active]);
  return board;
}
