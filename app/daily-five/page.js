import { redirect } from 'next/navigation';
import DailyFiveSummary from './DailyFiveSummary';

// /daily-five — a run summary. Where a run ENDS: the board for that run, then
// one abridged result per game.
//
// IT SERVES EVERY CIRCUIT (owner, 2026-08-18). The bare URL is the marquee;
// /daily-five?circuit=<id> is one of the fourteen skill circuits, narrowed by
// the same query /api/quiz/daily-combined already takes. The client reads the
// param, so this server component stays static.
//
// ON THE STAGE, with the rest of the circuit family (2026-09-01). It wore
// QuizNavHeader's masthead and stat bar and NavyFrame's re-inked site footer,
// which is the chrome every other daily surface left on 2026-08-31.
//
// ⚠️ THE FRAME IS RENDERED BY DailyFiveSummary, NOT FROM HERE. Wrapping the
// summary in CircuitFrame at this level put a client component's `children`
// across the server boundary into another client component, and the route went
// inert: React #329, a render crash, leaving SSR markup with no effects, so the
// page read "0 of 0 played" with no date. That is the same signature this route
// showed at its August launch. Client rendering client is the shape
// /circuits/<id> already proved. Do not hoist the frame back up here.
//
// NOINDEX, on purpose. Every word on this page is either a leaderboard that
// changes hourly or one viewer's own results, so there is nothing here for a
// search engine to rank and nothing that would still be true tomorrow. It is a
// destination reached from a run, not from a search result. The run's public
// face is the circuit's own page, which IS indexed.
export const metadata = {
  title: 'Run Summary | Mind Loft',
  description: 'The board and your results for one of the daily runs on Mind Loft.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/daily-five' },
};

// The bare URL was the Daily Five, retired 2026-10-20: it goes to the runs.
export default function DailyFivePage({ searchParams }) {
  if (!searchParams || !searchParams.circuit) redirect('/circuits');
  return <DailyFiveSummary />;
}
