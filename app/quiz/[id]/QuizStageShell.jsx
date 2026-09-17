'use client';
// THE SERVER PAINT OF A QUIZ PAGE (2026-09-17).
//
// /quiz/[id] is ISR (revalidate, for cost: see page.js) and QuizClient calls
// useSearchParams, so Next bails the whole client out of the static render and
// ships only its Suspense fallback. That fallback was null, which made the
// first paint the "About this quiz" section alone on a navy page; the stage,
// the cap and the idle card then arrived on top of it and pushed it down. Read
// as a flicker into a different design on every quiz.
//
// This is that fallback: the same stage root, the same StageChrome cap with
// the same props QuizClient gives it before a start, and the same idle card.
// It holds the page's height so the About section stays below the fold. When
// the client lands it replaces this with a near-identical tree.
//
// RULES: nothing here may read window, storage or the URL during render
// (useSearchParams in this tree would bail the fallback too). StageChrome and
// useStageTheme are safe: both render their defaults and correct in effects,
// exactly as they do inside QuizClient.
import React from 'react';
import StageChrome from '../../StageChrome';
import QuizIdleActions from './QuizIdleActions';
import { QUIZ_ACC_VARS } from '@/lib/quiz-stage';
import { useStageTheme } from '@/lib/stage-theme';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";

export default function QuizStageShell({ quizId, title, cat, total, clockMax, headline, body, blurb, ownBoard = false }) {
  const [stageTheme] = useStageTheme();
  return (
    <div className="stage-page" data-stage-theme={stageTheme} aria-busy="true"
      style={{ ...QUIZ_ACC_VARS, minHeight: '100vh', position: 'relative', overflowX: 'clip', background: 'var(--stg-ground)', color: 'var(--stg-ink,#e9edf4)' }}>
      {ownBoard ? null : (
        <>
          <StageChrome
            name={title}
            cat={cat}
            dateLabel={`${total} ${total === 1 ? 'answer' : 'answers'}`}
            figures={[{ v: `0/${total}`, k: 'Score' }, { v: clockMax, k: 'Time left' }]}
            progress={0}
            quizId={quizId}
            scoreWord="correct"
            stripOn
            panelBody={<div style={{ padding: 16, fontFamily: SANS, color: 'var(--stg-mute)' }}>Loading the standings…</div>}
          />
          <div className="qz-pagewrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '8px 38px 80px' }}>
            <style dangerouslySetInnerHTML={{ __html: '@media(max-width:560px){.qz-pagewrap{padding-left:14px !important;padding-right:14px !important;}}' }} />
            <div className="qzs-gap" aria-hidden="true" />
            <div style={{ textAlign: 'center', padding: '26px 24px 30px', borderRadius: 10, border: '1.5px solid var(--stg-line)', background: 'var(--stg-surf)', marginTop: 4 }}>
              <h2 style={{ fontFamily: SANS, fontWeight: 800, fontSize: 26, margin: '2px 0 6px' }}>{headline}</h2>
              <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.5, color: 'var(--stg-ink2,#4a4339)', maxWidth: 470, margin: '0 auto 6px' }}>{body}</p>
              <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.5, color: 'var(--stg-mute,#8b95a8)', maxWidth: 460, margin: '0 auto 16px' }}>{blurb}</p>
              <QuizIdleActions onStart={() => {}} quizId={quizId} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
