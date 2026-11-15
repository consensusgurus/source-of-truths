import { Suspense } from 'react';
import BagClient from './BagClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Bag launched 2026-11-14 (owner: "ok i like it but start gentle"). /bag is the
// canonical, evergreen URL. This server page filters live<=today AND strips the
// stored answer (`sol`) before handing puzzles to the client, so neither a
// future board nor an answer ever reaches a browser. The `sunday` flag survives
// the strip.

export const metadata = {
  title: "Free Daily Grocery Bagging Puzzle: Bag | Mind Loft",
  description:
    "A free daily grocery bagging puzzle: bag everything on the belt without crushing the eggs, from a corner shop on Monday to the big shop on Sunday.",
  alternates: { canonical: '/bag' },
  openGraph: {
    images: [{ url: '/og/bag.png', width: 1200, height: 630, alt: "Bag, a daily grocery bagging puzzle from Mind Loft" }],
    title: "Bag: The Daily Grocery Bagging Puzzle",
    description: "Bag it all. Heavy low, eggs on top, cold together.",
    url: '/bag',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/bag.png'],
    card: 'summary_large_image',
    title: "Bag: The Daily Grocery Bagging Puzzle",
    description: "Bag it all. Heavy low, eggs on top, cold together.",
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Bag',
  alternateName: "Bag: The Daily Grocery Bagging Puzzle",
  url: `${SITE_URL}/bag`,
  description:
    "A free daily grocery bagging puzzle: groceries come down a checkout belt and only the first few are in reach. Pick one and tap a bag. A bag holds four items and nine pounds, nothing may be crushed, cold things share one bag, hot food stays away from cold, and cleaning products stay away from food. Every bag shows green or red the moment an item is picked up. The shop grows from a corner shop on Monday to the big shop on Sunday, and the Bagging Ladder ranks the shop by how few items had to come back out.",
  genre: ["Logic puzzle", "Packing puzzle", "Puzzle"],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/bag.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('bag'),
    { '@type': 'ListItem', position: 3, name: 'Bag' },
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
        <BagClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="bag" stage={isStageServer('bag', searchParams)} />
    </>
  );
}
