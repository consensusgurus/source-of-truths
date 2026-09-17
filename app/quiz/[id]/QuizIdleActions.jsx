'use client';
import React from 'react';
import { T } from '@/lib/theme';

// Standard pre-quiz (idle screen) action block, shared by EVERY board format.
// The covered-board intro card on every quiz page renders this so the pre-quiz
// screen is identical across formats.
//
// (owner rule, 2026-07-16): the idle card shows ONLY the START button. The
// Challenge Someone + Leaderboard buttons and the Similar Quizzes grid were
// removed from this square. START stays on its own full-width line (double
// height on desktop, normal on mobile) via the .qz-start class. `quizId` and
// `onLeaderboard` are kept in the signature for call-site compatibility (every
// board still passes them) but are no longer rendered here.

const FONT = "'Manrope', system-ui, -apple-system, sans-serif";
const C = { cream: T.surface, ink: T.ink, ember: T.accent };

export default function QuizIdleActions({ onStart, startLabel = 'Start', startDisabled = false, quizId, onLeaderboard, style }) {
  const base = {
    fontFamily: FONT, fontSize: 12.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700,
    height: 52, padding: '0 10px', boxSizing: 'border-box', borderRadius: 10,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    border: 'none', cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap',
  };
  const startStyle = { ...base };
  delete startStyle.height; // height comes from the .qz-start class (2x on desktop, 1x on mobile)
  delete startStyle.fontSize; // font-size (and letter-spacing) come from the .qz-start class so it isn't overridden by the inline base
  delete startStyle.letterSpacing;
  return (
    <div style={{ maxWidth: 640, margin: '16px auto 0', ...style }}>
      <style dangerouslySetInnerHTML={{ __html: `.qz-start{height:104px;font-size:21px;letter-spacing:0.08em;}@media (max-width:760px){.qz-start{height:52px;font-size:12.5px;letter-spacing:0.05em;}}` }} />
      <button className="qz-start" onClick={onStart} disabled={startDisabled} style={{ ...startStyle, width: '100%', background: startDisabled ? `var(--stg-surf2,${C.ember})` : `var(--stg-acc,${C.ember})`, color: startDisabled ? `var(--stg-mute,${T.white})` : `var(--stg-onramp,${T.white})`, opacity: startDisabled ? 'var(--stg-inert-op,0.5)' : 1, cursor: startDisabled ? 'default' : 'pointer' }}>
        {startLabel}
      </button>
    </div>
  );
}
