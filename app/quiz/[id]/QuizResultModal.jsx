'use client';
import React, { useMemo } from 'react';
import { RotateCcw, Swords } from 'lucide-react';
import { similarQuizzes } from '@/lib/quiz-similar';
import SimilarQuizTiles from './SimilarQuizTiles';
import QuizStandings from './QuizStandings';
import UpNextCard from './UpNextCard';
import ScrollToTopOnMount from './ScrollToTopOnMount';
import RegisterRankLine from './RegisterRankLine';
import { registerRank } from '@/lib/quiz-lb';
import { T } from '@/lib/theme';

// Shared end-of-game results for every quiz board (owner rule, 2026-07-02).
//
// This used to be a dismissable popup over a dimmed backdrop. It is now an
// INLINE results panel rendered in normal page flow (no portal, no overlay, no
// close X), matching the QuizClient results screen so every quiz type looks the
// same: score + percentile top-left, placement number top-right, the two
// stacked actions (Play again, Challenge a friend), a "Similar quizzes" grid,
// then the full leaderboard element the board passes in, then a Report link.
//
// The board still controls visibility with `open` and places this component
// where the results should appear. onClose / onPlaySimilar / onLeaderboard are
// accepted for back-compat but ignored (no popup to close; Play similar was
// replaced by the Similar quizzes grid; the leaderboard is shown inline).
//
// Props: open, eyebrow, score, total, headline, subline, placement (number|null
// for the top-right rank), leaderboard (node = the full leaderboard element),
// standings (node), quiz (Challenge + Similar quizzes), onPlayAgain, onReport.

const C = { cream: T.surface, ink: T.ink, ember: T.accent, forest: T.success, faded: T.muted, line: 'rgba(20,22,28,0.30)' };
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";
const stackBtn = { fontFamily: FONT, fontSize: 12.5, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 700, borderRadius: 10, padding: '14px 12px', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', boxSizing: 'border-box', textDecoration: 'none' };

export default function QuizResultModal({
  open,
  eyebrow,
  score,
  total,
  headline,
  subline,
  leaderboard = null,
  standings = null,
  quiz = null,
  placement = null,
  board = null,
  identity = null,
  lastElapsed = null,
  onRegister = null,
  onPlayAgain,
  onReport,
  onClose, onPlaySimilar, onLeaderboard,
}) {
  const regRank = (!identity && onRegister && board) ? registerRank(board.leaderboard, score, lastElapsed) : null;
  // One shared builder with the inline QuizClient end screen, so the rail is
  // identical on every board AND obeys the Business-News exclusion (a dated news
  // or company-earnings quiz is never a similar pick). This used to be a local
  // copy that filtered on category alone, which filled the rail of every market
  // news quiz with more market news quizzes.
  const similar = useMemo(() => similarQuizzes(quiz, 8), [quiz]);

  if (!open) return null;

  return (
    <div style={{ maxWidth: 640, margin: '16px auto 0' }}>
      <ScrollToTopOnMount />
      {/* Game stats, centred. The "You placed #N" block that used to sit opposite
          them was removed 2026-07-31 (owner): the same figure is now the This Quiz
          rank tile on the IQ card directly below, so showing it twice was noise.
          `placement` is still computed and passed down to feed that tile. */}
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        {eyebrow ? <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: `var(--stg-acc-ink,${C.ember})`, marginBottom: 6 }}>{eyebrow}</div> : null}
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 38, lineHeight: 1 }}>{score}<span style={{ fontSize: 22, color: `var(--stg-mute,${C.faded})` }}> / {total}</span></div>
        {(headline || subline) ? <p style={{ fontFamily: FONT, fontSize: 13, color: 'var(--stg-ink2,#4a4339)', margin: '6px 0 0' }}>{headline}{headline && subline ? ' · ' : ''}{subline}</p> : null}
      </div>

      <RegisterRankLine rank={regRank} onRegister={onRegister} />

      {/* The shared IQ end card. Most boards build the node themselves (they have
          the post-game profile); this injects the per-quiz figures only THIS
          component knows, chiefly `placement`, rather than threading the same
          computation through all twelve callers. The two boards that pass
          standings={null} and never fetch a profile (GridFill, LogicGrid) get the
          card rendered here instead, and it self-fetches what it needs, so every
          quiz ends on the same card. */}
      <div style={{ marginBottom: 12 }}>
        {React.isValidElement(standings)
          ? React.cloneElement(standings, { placement, quiz, board, identity, quizTotal: total })
          : <QuizStandings quiz={quiz} board={board} identity={identity} placement={placement} quizTotal={total} />}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {onPlayAgain ? <button onClick={onPlayAgain} style={{ ...stackBtn, background: T.cta, color: T.ctaInk }}><RotateCcw size={15} strokeWidth={2.5} /> Play again</button> : null}
        <UpNextCard quiz={quiz} />
      </div>

      {similar.length > 0 ? (
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: FONT, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: `var(--stg-acc-ink,${C.ember})`, marginBottom: 16 }}>Similar quizzes</div>
          <SimilarQuizTiles items={similar} />
        </div>
      ) : null}

      {leaderboard ? <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.line}` }}>{leaderboard}</div> : null}

      <div style={{ textAlign: 'center', marginTop: 14 }}>
        {onReport ? <button onClick={onReport} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', fontFamily: FONT, fontSize: 12, fontWeight: 600, color: `var(--stg-mute,${C.faded})`, textDecoration: 'underline', textUnderlineOffset: 3 }}>Report an error</button> : null}
      </div>
    </div>
  );
}
