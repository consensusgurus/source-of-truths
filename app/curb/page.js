import { Suspense } from 'react';
import CurbClient from './CurbClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Curb launched 2026-11-28: the daily parking game. Parallel park on weekdays,
// back a tractor-trailer into a loading dock on Sunday, ranked on time plus
// accuracy. /curb is the canonical, evergreen URL. This server page filters
// live<=today before handing boards to the client, so future boards never
// reach a browser.

export const metadata = {
  title: 'Free Daily Parallel Parking Game, Park the Car: Curb | Mind Loft',
  description:
    'A free daily parallel parking game: steer a real car into the gap, close to the curb and straight. Sundays, back a semi into the dock. New spot every day.',
  alternates: { canonical: '/curb' },
  openGraph: {
    images: [{ url: '/og/curb.png', width: 1200, height: 630, alt: 'Curb, a daily parallel parking game from Mind Loft' }],
    title: 'Curb: Can You Parallel Park?',
    description: 'Parallel park a real-steering car between two parked cars, close to the curb and fast. Sundays, back a tractor-trailer into the dock. New spot every day.',
    url: '/curb',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/curb.png'],
    card: 'summary_large_image',
    title: 'Curb: Can You Parallel Park?',
    description: 'Parallel park a real-steering car between two parked cars, close to the curb and fast. Sundays, back a tractor-trailer into the dock. New spot every day.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Curb',
  alternateName: 'Curb: The Daily Parallel Parking Game',
  url: `${SITE_URL}/curb`,
  description:
    'A free daily parking game. On weekdays you parallel park a car with real steering between two parked cars; on the Sunday Edition you back a tractor-trailer into a loading dock bay. Ranked on your time plus seconds for distance from the curb, angle and centering, and five seconds a bump. The gap tightens through the week.',
  genre: ['Driving game', 'Parking game', 'Simulation', 'Spatial puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/curb.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('curb'),
    { '@type': 'ListItem', position: 3, name: 'Curb' },
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
        <CurbClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="curb" stage={isStageServer('curb', searchParams)} />
    </>
  );
}
