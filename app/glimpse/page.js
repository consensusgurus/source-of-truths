import { Suspense } from 'react';
import GlimpseClient from './GlimpseClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Glimpse launched 2026-11-22: the daily flash-recall game. A panel of dots,
// a lit grid, a clock and a string flashes for a second or two, then one
// question about one part of it. /glimpse is the canonical, evergreen URL.
// This server page filters live<=today before handing boards to the client,
// so future boards never reach a browser.

export const metadata = {
  title: 'Free Daily Flash Memory Game, One Look Only: Glimpse | Mind Loft',
  description:
    'A free daily memory game: dots, a grid, a clock and a string flash for two seconds, then one question about one of them. One look only.',
  alternates: { canonical: '/glimpse' },
  openGraph: {
    images: [{ url: '/og/glimpse.png', width: 1200, height: 630, alt: 'Glimpse, a daily flash memory game from Mind Loft' }],
    title: 'Glimpse: One Look, Then One Question',
    description: 'A panel flashes for two seconds. How many dots? Which squares were lit? What time was it? Five flashes a day, the same for everyone.',
    url: '/glimpse',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/glimpse.png'],
    card: 'summary_large_image',
    title: 'Glimpse: One Look, Then One Question',
    description: 'A panel flashes for two seconds. How many dots? Which squares were lit? What time was it? Five flashes a day, the same for everyone.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Glimpse',
  alternateName: 'Glimpse: The Daily Flash Memory Game',
  url: `${SITE_URL}/glimpse`,
  description:
    'A free daily memory game: a panel of dots, a lit grid, a clock and a string flashes for a second or two, then one question about one part of it, scored 0 to 100 on how close you were. Five flashes a day, six on the Sunday Edition. Ranked on points, then the clock.',
  genre: ['Memory game', 'Visual memory', 'Estimation game', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/glimpse.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('glimpse'),
    { '@type': 'ListItem', position: 3, name: 'Glimpse' },
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
        <GlimpseClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="glimpse" stage={isStageServer('glimpse', searchParams)} />
    </>
  );
}
