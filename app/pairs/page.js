import { Suspense } from 'react';
import PairsClient from './PairsClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Pairs launched 2026-11-01 with Swap, Slide, Spin, Fill, Connect and Pairs, the
// six dailies that share app/SimpleDaily.jsx. /pairs is the canonical, evergreen
// URL. This server page filters live<=today before handing puzzles to the client,
// so future boards never reach a browser.

export const metadata = {
  title: "Free Daily Concentration Card Game: Pairs | Mind Loft",
  description:
    "A free daily game of Concentration with real playing cards: 36 cards face down, pair them by rank and colour in the fewest turns. 48 cards on Sundays.",
  alternates: { canonical: '/pairs' },
  openGraph: {
    images: [{ url: '/og/pairs.png', width: 1200, height: 630, alt: "Pairs, a daily Concentration card game from Mind Loft" }],
    title: "Pairs: The Daily Concentration Card Game",
    description: "Thirty-six cards face down. Pair each with its twin, same rank and colour, in the fewest turns.",
    url: '/pairs',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/pairs.png'],
    card: 'summary_large_image',
    title: "Pairs: The Daily Concentration Card Game",
    description: "Thirty-six cards face down. Pair each with its twin, same rank and colour, in the fewest turns.",
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Pairs',
  alternateName: "Pairs: The Daily Concentration Card Game",
  url: `${SITE_URL}/pairs`,
  description:
    "A free daily game of Concentration with a real deck: 36 cards face down (48 on Sundays), turned two at a time. A pair is two cards of the same rank and the same colour; a finished table ranks on turns, then the clock.",
  genre: ["Card game", "Memory game", "Concentration", "Puzzle"],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/pairs.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('pairs'),
    { '@type': 'ListItem', position: 3, name: 'Pairs' },
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
        <PairsClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="pairs" stage={isStageServer('pairs', searchParams)} />
    </>
  );
}
