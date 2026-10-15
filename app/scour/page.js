import { Suspense } from 'react';
import ScourClient from './ScourClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Scour launched 2026-10-15 as the daily themed word search: one theme a day,
// a 15x15 grid every weekday and an 18x18 Sunday Edition, every word hidden
// exactly once, raced on the clock.
//
// /scour is the canonical, evergreen URL; the dated /quiz/scour-* stubs
// canonicalize here. This server page filters live<=today before handing
// puzzles to the client, so future grids never reach a browser.

export const metadata = {
  title: 'Free Daily Themed Word Search: Scour | Mind Loft',
  description:
    'A free daily word search: one theme, a big 15x15 grid and 14 to 18 hidden words in any direction. Find them all against the clock. 18x18 on Sundays.',
  alternates: { canonical: '/scour' },
  openGraph: {
    images: [{ url: '/og/scour.png', width: 1200, height: 630, alt: 'Scour, a daily themed word search from Mind Loft' }],
    title: 'Scour: The Daily Themed Word Search',
    description:
      'One theme, one big grid, every word hidden once. Find today’s words faster than everyone else. A new word search from Mind Loft, daily.',
    url: '/scour',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/scour.png'],
    card: 'summary_large_image',
    title: 'Scour: The Daily Themed Word Search',
    description: 'One theme, one big grid, every word hidden once. How fast can you find them all?',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Scour',
  alternateName: 'Scour: Daily Themed Word Search',
  url: `${SITE_URL}/scour`,
  description:
    'A free daily themed word search: one theme a day (cities, countries, food, animals, jobs, first names and more), a 15x15 grid with 14 to 18 words hidden in it, and an 18x18 Sunday Edition with 26. Drag across a word or tap its first and last letters; every word is hidden exactly once, and the clock decides the leaderboard.',
  genre: ['Word puzzle', 'Word search', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/scour.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('scour'),
    { '@type': 'ListItem', position: 3, name: 'Scour' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function ScourPage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today);
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {/* Suspense is required: ScourClient reads useSearchParams (the stage flag). */}
      <Suspense fallback={null}>
        <ScourClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="scour" stage={isStageServer('scour', searchParams)} />
    </>
  );
}
