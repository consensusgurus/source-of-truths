'use client';

import dynamic from 'next/dynamic';
import StageToday from './today/StageToday';
import HomeViewPing from './HomeViewPing';

// THE HOMEPAGE PICKS ITS SURFACE HERE (2026-09-25).
//
// The default home is the stage (StageToday). It used to be reached through
// QuizHomeClient, which ran all of its hooks and then early-returned
// <StageToday />. That cost two things on every home load: QuizHomeClient's
// bundle, which imports the full quiz bank and the full list data (~7.4MB of
// JS, measured on the live site), and ~15 data requests of its own that the
// stage never read (totals, recent, xp x3, stats, referrals, duel
// notifications, daily-combined, a second /me).
//
// WHY THIS IS A CLIENT COMPONENT WITH next/dynamic, NOT A TERNARY IN page.js.
// A ternary in the server page was tried first and measured on a preview
// build: the two 3.7MB chunks still loaded, because every client component a
// server component imports is part of that route's client entry whether or not
// it renders. Only a dynamic import from inside a client component becomes a
// separate chunk that downloads on demand. So QuizHomeClient (the ?stage=0
// opt-out) is lazy, and the stage never pays for it.
//
// HomeViewPing carries the one side effect of QuizHomeClient the stage still
// needs: the 'home' row in the per-quiz view analytics.
const QuizHomeClient = dynamic(() => import('./quizzes/QuizHomeClient'));

export default function HomeSwitch({ stage = true, sourceCount = 0 }) {
  if (!stage) return <QuizHomeClient variant="v3" sourceCount={sourceCount} stageDefault={false} />;
  return (
    <>
      <HomeViewPing />
      <StageToday />
    </>
  );
}
