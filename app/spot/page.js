import { Suspense } from 'react';
import SpotClient from './SpotClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Spot launched 2026-11-12: the daily spot the difference game. Two copies of
// one past Jig photograph, the second altered in seven places. /spot is the
// canonical, evergreen URL. This server page filters live<=today before handing
// puzzles to the client, so a future photo's file name and its answer key never
// reach a browser (the pairs sit in public/spot under opaque names).

export const metadata = {
  title: 'Free Daily Spot the Difference Game: Spot | Mind Loft',
  description:
    'A free daily spot the difference game: two copies of one real photograph with seven differences. Tap what changed. Fewest misses, then the clock.',
  alternates: { canonical: '/spot' },
  openGraph: {
    images: [{ url: '/og/spot.png', width: 1200, height: 630, alt: 'Spot, a daily spot the difference game from Mind Loft' }],
    title: 'Spot: Two Photos, Seven Differences',
    description: 'Two copies of one photograph, and the second has been changed in seven places. A boat is gone, a roof turned blue. A new pair every day.',
    url: '/spot',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/spot.png'],
    card: 'summary_large_image',
    title: 'Spot: Two Photos, Seven Differences',
    description: 'Two copies of one photograph, and the second has been changed in seven places. A boat is gone, a roof turned blue. A new pair every day.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Spot',
  alternateName: 'Spot: The Daily Spot the Difference Game',
  url: `${SITE_URL}/spot`,
  description:
    'A free daily spot the difference game: two copies of one real photograph, the second altered in seven places. Tap either photo where they differ, zoom in to look closer, and take a hint if you are stuck. Scored on differences found, then fewest misses, then the clock.',
  genre: ['Spot the difference', 'Observation game', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/spot.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('spot'),
    { '@type': 'ListItem', position: 3, name: 'Spot' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function Page({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today);
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {/* Suspense is required: the client reads useSearchParams. */}
      <Suspense fallback={null}>
        <SpotClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="spot" stage={isStageServer('spot', searchParams)} />
    </>
  );
}
