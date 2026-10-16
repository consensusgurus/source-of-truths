'use client';

// The quiz end card, in the daily puzzles' Loft format.
//
// It is a thin adapter, not a second end card: everything it renders comes out
// of the shared <LoftFinish>, the same component all 65 dailies flip to. The
// point of the exercise is that a player finishing a quiz and a player
// finishing a daily land on the SAME object, so anything that improves one
// improves the other. Nothing here restates a rule that lives in LoftFinish.
//
// WHY THIS IS ITS OWN COMPONENT AND NOT A BLOCK INSIDE QuizClient. The card
// needs two hooks, useIqStanding and useDayStats, and useDayStats has no
// `active` gate: it fires its fetch the moment it mounts. Calling it in
// QuizClient would put one extra request on every one of the ~1,200 quiz page
// loads, whether or not the player ever finishes. A child that is mounted only
// once the round is over pays for it only when the card is actually shown, and
// hooks cannot be called conditionally, so a child is the only way to get that.
//
// It also keeps the diff in QuizClient (2,249 lines) down to the flip wrapper.
//
// THREE THINGS A QUIZ DOES NOT HAVE, and how each is handled rather than left
// to print a dash:
//   * an ARCHIVE. A daily has a bank of dated puzzles; a quiz is one board.
//     `archive` is omitted, so LoftFinish renders no archive button.
//   * a DAY. The four day tiles are daily-shaped (today's board, this game all
//     time, category today, day streak). The quiz passes its own three through
//     the `dayTiles` prop instead.
//   * a MISS COLUMN. Quizzes count nothing against you, so `missLabel` is
//     omitted and the board renders score and time only.
// The IQ bar is NOT one of them: IQ Points are site-wide and a quiz banks them
// exactly as a daily does, so useIqStanding and useDayStats are the same reads
// here as there.
import React, { useEffect, useState } from 'react';
import LoftFinish from '../../LoftFinish';
import useIqStanding from '../../useIqStanding';
import useDayStats from '../../useDayStats';
import { quizDept, DEPT_LABEL } from '@/lib/quiz-departments';
import { CONTEST, contestIsLive } from '@/lib/contest';

function fmtTime(s) {
  if (s == null) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}`;
}

export default function QuizLoftFinish({
  quiz,
  score,
  total,
  elapsed,
  board,
  identity,
  topScore = false,
  timedOut = false,
  beatPct = null,
  next = null,
  canReveal = false,
  copied = false,
  onReveal,
  onReplay,
  onShare,
  onJoin,
  // WHICH ENDING. LoftFinish decides between its own card and the stage's
  // curtain, and on a daily it decides from the URL, which is correct there
  // because the stage is sitewide. On a quiz the stage is still a review path,
  // so the page SAYS which one it is rather than letting the card guess and
  // open a curtain at the foot of a cream page. Null hands the decision back.
  stage = null,
}) {
  const iq = useIqStanding({ quizId: quiz.id, active: true });
  const day = useDayStats();

  // The contest CTA reads the clock, so it is set in an effect. Doing it during
  // render would make the server and client disagree and React would throw.
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);

  const win = total > 0 && score === total;
  const outcome = win ? 'won' : score > 0 ? 'part' : 'lost';
  // 'New record' outranks 'Perfect' because it is the rarer thing and the
  // player already knows a full score is full.
  const title = topScore ? 'New record' : win ? 'Perfect' : score > 0 ? 'Partly solved' : timedOut ? "Time's up" : 'Not solved';

  const detail = [
    `${score}/${total}`,
    fmtTime(elapsed),
    beatPct != null ? `beat ${beatPct}% of attempts` : null,
  ].filter(Boolean).join(' · ');

  // LoftFinish's board shape, built from the quiz board payload. `rows` is the
  // top ten it prints; `myRank` and `field` answer for a player below them, and
  // both come off the server so the tile and the rows can never disagree.
  const rows = Array.isArray(board.leaderboard) ? board.leaderboard : [];
  const all = Array.isArray(board.leaderboardAll) ? board.leaderboardAll : rows;
  const mine = identity && identity.username ? String(identity.username).toLowerCase() : null;
  const myIdxAll = mine ? all.findIndex((r) => String(r.username || '').toLowerCase() === mine) : -1;
  const myRank = board.placement != null ? board.placement : (myIdxAll >= 0 ? myIdxAll + 1 : null);
  const lbBoard = {
    plays: board.plays || 0,
    rows: rows.slice(0, 10),
    mine,
    settled: true,
    myRank,
    field: all.length || board.plays || null,
    myRow: myIdxAll >= 0 ? all[myIdxAll] : null,
  };

  const deptTag = DEPT_LABEL[quizDept(quiz)] || quiz.category || 'Quiz';

  // A player who has not picked a display name cannot be shown the answers,
  // because revealing them is what posting the score buys. So the option says
  // what it actually does in each of the three states rather than promising a
  // reveal it cannot deliver.
  const canRevealNow = canReveal && !!identity;
  const revealOpt = canRevealNow && !win
    ? { tone: 'reveal', label: 'Reveal the answers', sub: 'Show what you missed', onClick: onReveal }
    : { tone: 'board', label: 'Return to the board', sub: 'Your finished board', onClick: onReveal };

  return (
    <LoftFinish
      onStage={stage}
      title={title}
      detail={detail}
      outcome={outcome}
      iq={iq}
      day={day}
      board={lbBoard}
      /* A QUIZ'S BOARD IS ITS ALL-TIME BOARD (owner, 2026-09-04). There is one
         board per quiz, it never rolls at Eastern midnight, and every ending
         the shared card writes was worded for a daily: a player who came third
         was being told they came "#3 of 41 today" on a table that has been
         accumulating since the quiz was published. `boardWhen` is the short
         form the stage ending prints on the figure itself. */
      boardLabel={'All-time board'}
      boardWhen={'all time'}
      replaySub="Practice run. Only your first attempt counts on the leaderboard."
      dayTiles={[
        {
          value: myRank != null ? `#${Number(myRank).toLocaleString()}` : '—',
          label: myRank != null && lbBoard.field
            ? `of ${Number(lbBoard.field).toLocaleString()} all time`
            : 'all time',
        },
        {
          value: board.plays ? Number(board.plays).toLocaleString() : '—',
          label: board.plays === 1 ? 'has played it' : 'have played it',
        },
        {
          value: beatPct != null ? `${beatPct}%` : '—',
          label: 'of attempts beaten',
        },
      ]}
      options={[
        revealOpt,
        next && {
          tone: 'similar',
          label: 'Play similar',
          sub: `${next.title} · ${deptTag}`,
          href: `/quiz/${encodeURIComponent(next.id)}`,
        },
        {
          kind: 'gold',
          label: copied ? 'Copied' : shareCta,
          sub: 'Your result, no spoilers',
          onClick: onShare,
        },
        { tone: 'replay', label: 'Play again', onClick: onReplay },
        {
          tone: 'another',
          label: 'Challenge someone',
          sub: 'Send this quiz head to head',
          href: `/duel/new?quiz=${encodeURIComponent(quiz.id)}`,
        },
        !identity && {
          tone: 'main',
          label: 'Post to the leaderboard',
          sub: canReveal ? 'Pick a name, and see the answers' : 'Pick a name, no password',
          onClick: onJoin,
        },
        quiz.listId && {
          tone: 'main',
          label: 'See the full list',
          sub: 'The ranking behind this quiz',
          href: `/list/${quiz.listId}`,
        },
        /* BACK TO WHERE THE QUIZZES ARE (owner, 2026-09-04). It pointed at
           /quizzes, which was a 308 to the daily home, so it was changed to
           the hash of that home QUIZZES drawer. /quizzes is now the quiz home
           itself -- the same cap, the same shelves, the same ramp, with the
           featured row and the whole catalogue by topic -- so the ending sends
           the reader THERE rather than to the foot of a page about the
           dailies. The daily home keeps its drawer either way. */
        { tone: 'main', label: 'Back to all quizzes', sub: 'Every topic, and the day picks', href: '/#sty-quizzes' },
      ]}
    />
  );
}
