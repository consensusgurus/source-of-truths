import { Suspense } from 'react';
import PlowClient from './PlowClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Plow launched 2026-11-17 (owner: "mock up plow that is similar to mop / mow
// format but is plowing snowfilled streets", then "Push to live now with good
// share link image"). /plow is the canonical, evergreen URL. This server page
// filters live<=today AND strips the stored route (`sol`) before handing puzzles
// to the client, so neither a future town nor an answer ever reaches a browser.
// The `sunday` flag survives the strip.

export const metadata = {
  title: 'Free Daily Snow Plow Puzzle: Plow Every Street Once | Mind Loft',
  description:
    'A free daily route puzzle: plow every snowy street of a town exactly once, diagonals, bridges and cul-de-sacs included, and park at the salt barn.',
  alternates: { canonical: '/plow' },
  openGraph: {
    images: [{ url: '/og/plow.png', width: 1200, height: 630, alt: 'Plow, a daily plow-every-street snow puzzle from Mind Loft' }],
    title: 'Plow: The Daily Plow-Every-Street Snow Puzzle',
    description: 'One town under snow, one plow truck. Plow every street exactly once and get back to the salt barn.',
    url: '/plow',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/plow.png'],
    card: 'summary_large_image',
    title: 'Plow: The Daily Plow-Every-Street Snow Puzzle',
    description: 'One town under snow, one plow truck. Plow every street exactly once and get back to the salt barn.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Plow',
  alternateName: 'Plow: The Daily Plow-Every-Street Snow Puzzle',
  url: `${SITE_URL}/plow`,
  description:
    'A free daily route puzzle: drive a snow plow round a town drawn from above, plowing every street exactly once, corner to corner, along straight streets, curves, diagonals, bridges over the river and out to cul-de-sacs, and finish at the salt barn. Driving down a plowed street is a replay with the clock still running. Towns grow from about seventeen streets on Monday, the easy day, to more than fifty on Sunday; every town has a clean route and the clock decides the leaderboard.',
  genre: ['Logic puzzle', 'Route puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/plow.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('plow'),
    { '@type': 'ListItem', position: 3, name: 'Plow' },
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
        <PlowClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="plow" stage={isStageServer('plow', searchParams)} />
    </>
  );
}
