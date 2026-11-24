import { Suspense } from 'react';
import PegClient from './PegClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Peg launched 2026-11-18 (owner: "build and implement both"). /peg is the
// canonical, evergreen URL. This server page filters live<=today AND strips the
// stored answer (`sol`) before handing boards to the client, so neither a
// future board nor its answer reaches a browser; Show the answer fetches it
// from /api/daily-answer once the day is over.

export const metadata = {
  title: 'Free Daily Peg Solitaire: Peg | Mind Loft',
  description:
    'A free daily peg solitaire on the classic 33-hole cross board. Jump pegs off until one is left, and finish it in the center hole.',
  alternates: { canonical: '/peg' },
  openGraph: {
    images: [{ url: '/og/peg.png', width: 1200, height: 630, alt: 'Peg, a daily peg solitaire from Mind Loft' }],
    title: 'Daily Peg Solitaire: Peg',
    description: 'Jump pegs off the classic cross board until one is left, in the center hole. A new starting shape every day.',
    url: '/peg',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/peg.png'],
    card: 'summary_large_image',
    title: 'Daily Peg Solitaire: Peg',
    description: 'Jump pegs off the classic cross board until one is left, in the center hole. A new starting shape every day.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Peg',
  alternateName: 'Peg: The Daily Peg Solitaire Puzzle',
  url: `${SITE_URL}/peg`,
  description:
    'A free daily peg solitaire on the classic 33-hole English cross board. A peg jumps over a neighbor into the empty hole beyond and the jumped peg comes off; the goal is one peg left, in the center hole. Each day starts from a different shape, about ten pegs early in the week and two dozen or more on Sunday, and every start is built backwards from the finish so it can be solved. Every jump counts, Undo included. Ranked on the fewest jumps, then the clock.',
  genre: ['Puzzle', 'Peg solitaire', 'Board game'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/peg.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('peg'),
    { '@type': 'ListItem', position: 3, name: 'Peg' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function Page({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today).map(({ sol, ...p }) => p);
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {/* Suspense is required: the client reads useSearchParams. */}
      <Suspense fallback={null}>
        <PegClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="peg" stage={isStageServer('peg', searchParams)} />
    </>
  );
}
