import { Suspense } from 'react';
import DarioClient from './DarioClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Dario, the daily side-scroller (Arcade). Rows are gated by Eastern date like
// every other daily; a row carries only the frame, and the day's course remix is
// generated from its quizId in the client (lib/dario-engine.js buildLevels).
//
// HELD FOR REVIEW (owner, 2026-10-07): the page is live at /dario but noindexed
// and kept off every slate, grid and category list (REVIEW_HOLD in
// lib/daily-games.js). Lift both to launch.

export const metadata = {
  title: 'Dario: A Daily Race to the Frontier | Mind Loft',
  description:
    'Dario is a free daily side-scrolling platformer. Run three levels of the AI race, past parody billboards, and reach the AGI gate as fast as you can. The course is remixed every day, the same for everybody, and your fastest clear counts.',
  alternates: { canonical: '/dario' },
  robots: { index: false, follow: false },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('dario'),
    { '@type': 'ListItem', position: 3, name: 'Dario' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function DarioPage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today);
  const list = visiblePuzzles.length ? visiblePuzzles : PUZZLES.slice(0, 1);
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <DarioClient key={forceNum || 'today'} puzzles={list} forceNum={forceNum} />
      </Suspense>
      <StageTail self="dario" stage={isStageServer('dario', searchParams)} />
    </>
  );
}
