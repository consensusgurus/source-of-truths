import { Suspense } from 'react';
import CrateClient from './CrateClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Crate launched 2026-11-18 (owner: "Build and implement crate"). /crate is the
// canonical, evergreen URL. This server page filters live<=today AND strips the
// stored line (`sol`) before handing puzzles to the client, so neither a future
// warehouse nor its answer ever reaches a browser. `best` (the move count of the
// shortest line) stays: the result shows it.

export const metadata = {
  title: 'Free Daily Sokoban Puzzle: Crate | Mind Loft',
  description:
    'A free daily box-pushing puzzle. Push every crate onto a spot in a warehouse, never pulling, in as few moves as you can.',
  alternates: { canonical: '/crate' },
  openGraph: {
    images: [{ url: '/og/crate.png', width: 1200, height: 630, alt: 'Crate, a daily warehouse puzzle from Mind Loft' }],
    title: 'Crate: The Daily Warehouse Puzzle',
    description: 'Push every crate onto a spot. No pulling, one crate at a time, and every step counts. A new warehouse every day.',
    url: '/crate',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/crate.png'],
    card: 'summary_large_image',
    title: 'Crate: The Daily Warehouse Puzzle',
    description: 'Push every crate onto a spot. No pulling, one crate at a time, and every step counts. A new warehouse every day.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Crate',
  alternateName: 'Crate: The Daily Sokoban Puzzle',
  url: `${SITE_URL}/crate`,
  description:
    'A free daily warehouse puzzle played by the classic box-pushing (Sokoban) rules: walk a worker around a warehouse and push every crate onto a marked spot. You can push, never pull, and never two crates at once. Three crates early in the week, four later and five on Sunday. Every warehouse is solved exactly before it goes live, and the result shows the shortest possible line beside yours. Ranked on the fewest moves, then the clock.',
  genre: ['Puzzle', 'Sokoban', 'Logic puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/crate.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('crate'),
    { '@type': 'ListItem', position: 3, name: 'Crate' },
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
        <CrateClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="crate" stage={isStageServer('crate', searchParams)} />
    </>
  );
}
