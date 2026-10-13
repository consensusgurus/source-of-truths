import QuizNavHeader from '../quizzes/QuizNavHeader';
import TodayClient from './TodayClient';

// /today — LIVE PREVIEW of the category-first home (owner-approved mockup,
// 2026-08-24: marquee rows, white tiles, colored icons, info-card buttons,
// per-game drawer). The current homepage is untouched; this route exists so
// the owner can play with the real thing wired to real data before deciding
// whether it replaces the home console. Mockup lineage in the repo root:
// marquee-final-mockup.html (and the exploration files beside it).
//
// NOINDEX while it is a preview. If this graduates to the homepage, the
// canonical story changes and this file goes away with it.
export const metadata = {
  title: "Today's Puzzles | Mind Loft",
  description:
    'Every Mind Loft daily puzzle on one page, by category: word games, sudoku, logic, end game boards, trivia and more.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/today' },
};

// The stage/old-home choice comes from the URL, so it is made HERE, on the
// server, and handed down as the initial state (see TodayClient). Resolving it
// in a client effect painted the old home first on every load.
export default function TodayPage({ searchParams }) {
  const stageDefault = String((searchParams || {}).stage ?? '') !== '0';
  return (
    <div style={{ minHeight: '100vh', background: '#e7ecf3' }}>
      <QuizNavHeader />
      <TodayClient stageDefault={stageDefault} />
    </div>
  );
}
