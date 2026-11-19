'use client';
import React, { useMemo } from 'react';
import { RotateCcw, Shuffle, Swords, Play, ArrowRight } from 'lucide-react';
import { nextQuizMeta } from '@/lib/quiz-similar';
import { T } from '@/lib/theme';

// Persistent end-of-quiz results panel.
//
// Every quiz board ends by popping a results popup (the QuizResultModal on the
// map/geo/globe/timed/grid boards, the Game Over overlay in QuizClient), which
// is dismissable. This panel renders in the play area so closing the popup
// reveals a usable results screen instead of nothing: a compact header (final
// score, then Play Again / Play Similar / Share) and, where supplied, an answer
// key (the correct answers and how the player did).
//
// Props:
//   score, total      — the final tally, printed once (omit with hideScore when
//                       the board already shows a live scoreboard while ended).
//   hideScore         — drop the score line, render just the action buttons.
//   rows              — optional answer-key rows: [{ label, detail?, sub?, good? }].
//   answersTitle      — heading above the rows.
//   onPlayAgain, onPlaySimilar — handlers; a missing one drops its button. The
//   Challenge Someone button links to the duel composer with this quiz
//   prefilled (needs `quiz`); the old onShare prop is accepted but ignored.

const C = { cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent, forest: T.success, faded: T.muted };
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";

function btn(bg, fg, outline) {
  return { fontFamily: FONT, fontSize: 11, letterSpacing: '0.02em', textTransform: 'uppercase', fontWeight: 700, padding: '0 6px', lineHeight: '42px', border: outline ? `1.5px solid var(--stg-line2,${C.ink})` : 'none', borderRadius: 10, background: bg, color: fg, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, whiteSpace: 'nowrap', overflow: 'hidden' };
}

export default function QuizDoneRecap({ score, total, hideScore = false, rows = null, answersTitle = 'The answers', quiz = null, mobile = false, onPlayAgain, onPlaySimilar }) {
  // The "play next" pick (next unplayed series part, else unplayed in the same
  // category/department, else any) shown by TITLE on a full-width button below
  // the action row. Computed client-side; falls back to the generic "Play
  // Similar" button when no quiz is supplied or no pick exists.
  const nextMeta = useMemo(() => {
    if (typeof window === 'undefined' || !quiz) return null;
    try { return nextQuizMeta(quiz); } catch (e) { return null; }
  }, [quiz]);

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ background: `var(--stg-surf2,${C.paper})`, borderRadius: 12, border: `1px solid var(--stg-line,${C.faded}33)`, padding: hideScore ? '12px 14px' : '13px 14px' }}>
        {hideScore ? null : (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, lineHeight: 1 }}>{score}<span style={{ fontSize: 17, color: `var(--stg-mute,${C.faded})` }}>/{total}</span></div>
            <div style={{ fontFamily: FONT, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: `var(--stg-mute,${C.faded})` }}>Final score</div>
          </div>
        )}
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: mobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', alignItems: 'stretch' }}>
          {onPlayAgain ? (
            <button onClick={onPlayAgain} style={btn(C.ember, T.white)}><RotateCcw size={13} strokeWidth={2.5} /> Play Again</button>
          ) : null}
          {onPlaySimilar ? (
            nextMeta ? (
              <button onClick={onPlaySimilar} style={{ width: '100%', boxSizing: 'border-box', textAlign: 'left', padding: '8px 12px', borderRadius: 10, border: 'none', background: C.forest, color: T.white, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Play size={18} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'block', fontFamily: FONT, fontSize: 9, letterSpacing: '0.13em', textTransform: 'uppercase', fontWeight: 800, opacity: 0.88 }}>{nextMeta.label}{nextMeta.badge ? ` · part ${nextMeta.badge.part} of ${nextMeta.badge.total}` : ''}</span>
                  <span style={{ display: 'block', fontFamily: FONT, fontSize: 14, fontWeight: 700, lineHeight: 1.18 }}>{nextMeta.title}</span>
                </span>
                <ArrowRight size={16} strokeWidth={2.5} style={{ flexShrink: 0 }} />
              </button>
            ) : (
              <button onClick={onPlaySimilar} style={btn(C.forest, T.white)}><Shuffle size={13} strokeWidth={2.5} /> Play Similar</button>
            )
          ) : null}
        </div>
      </div>

      {rows && rows.length > 0 ? (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontFamily: FONT, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: `var(--stg-acc-ink,${C.ember})`, fontWeight: 700, marginBottom: 10 }}>{answersTitle}</div>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {rows.map((r, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, border: `1px solid ${r.good ? `var(--stg-good,${C.forest})` : `var(--stg-line,${C.faded + '33'})`}`, marginBottom: 8, background: r.good ? `var(--stg-surf,${T.white})` : `var(--stg-surf2,${C.paper})` }}>
                <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: `var(--stg-mute,${C.faded})`, minWidth: 20 }}>{i + 1}</span>
                <span style={{ flex: 1, fontFamily: FONT, fontSize: 15, fontWeight: 600 }}>{r.label}</span>
                {r.detail != null ? <span style={{ fontFamily: FONT, fontSize: 12, color: `var(--stg-mute,${C.faded})` }}>{r.detail}</span> : null}
                {r.sub != null ? <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: r.good ? C.forest : `var(--stg-mute,${C.faded})`, minWidth: 44, textAlign: 'right' }}>{r.sub}</span> : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
