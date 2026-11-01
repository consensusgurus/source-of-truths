import { Suspense } from 'react';
import SwapClient from './SwapClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Swap launched 2026-11-01 with Swap, Slide, Spin, Fill, Connect and Pairs, the
// six dailies that share app/SimpleDaily.jsx. /swap is the canonical, evergreen
// URL. This server page filters live<=today before handing puzzles to the client,
// so future boards never reach a browser.

export const metadata = {
  title: "Free Daily Photo Swap Puzzle: Swap | Mind Loft",
  description:
    "A free daily photo puzzle: a 6x6 photograph with every square out of place. Swap squares two at a time to fix it in the fewest swaps. 7x7 on Sundays.",
  alternates: { canonical: '/swap' },
  openGraph: {
    images: [{ url: '/og/swap.png', width: 1200, height: 630, alt: "Swap, a daily photo swap puzzle from Mind Loft" }],
    title: "Swap: The Daily Photo Swap Puzzle",
    description: "Every square of today\u2019s photo starts in the wrong place. Swap them back in as few swaps as you can.",
    url: '/swap',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/swap.png'],
    card: 'summary_large_image',
    title: "Swap: The Daily Photo Swap Puzzle",
    description: "Every square of today\u2019s photo starts in the wrong place. Swap them back in as few swaps as you can.",
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Swap',
  alternateName: "Swap: The Daily Photo Swap Puzzle",
  url: `${SITE_URL}/swap`,
  description:
    "A free daily photo puzzle: a photograph cut into a 6x6 grid (7x7 on Sundays) and shuffled so that no square starts in its place. Swap squares two at a time until the picture is whole; a finished picture ranks on swaps, then the clock.",
  genre: ["Photo puzzle", "Tile-swapping puzzle", "Puzzle"],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/swap.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('swap'),
    { '@type': 'ListItem', position: 3, name: 'Swap' },
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
        <SwapClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="swap" stage={isStageServer('swap', searchParams)} />
    </>
  );
}
