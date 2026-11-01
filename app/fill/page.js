import { Suspense } from 'react';
import FillClient from './FillClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Fill launched 2026-11-01 with Swap, Slide, Spin, Fill, Connect and Pairs, the
// six dailies that share app/SimpleDaily.jsx. /fill is the canonical, evergreen
// URL. This server page filters live<=today before handing puzzles to the client,
// so future boards never reach a browser.

export const metadata = {
  title: "Free Daily Fill-In Puzzle (Criss-Cross): Fill | Mind Loft",
  description:
    "A free daily fill-in puzzle: an empty crossword grid and 16 to 18 words from one theme. Fit every word in; lengths and crossings are the only clues.",
  alternates: { canonical: '/fill' },
  openGraph: {
    images: [{ url: '/og/fill.png', width: 1200, height: 630, alt: "Fill, a daily fill-in puzzle from Mind Loft" }],
    title: "Fill: The Daily Fill-In Puzzle",
    description: "An empty grid, a list of themed words, and exactly one way to fit them all. A new criss-cross from Mind Loft, daily.",
    url: '/fill',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/fill.png'],
    card: 'summary_large_image',
    title: "Fill: The Daily Fill-In Puzzle",
    description: "An empty grid, a list of themed words, and exactly one way to fit them all. A new criss-cross from Mind Loft, daily.",
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Fill',
  alternateName: "Fill: The Daily Fill-In Puzzle",
  url: `${SITE_URL}/fill`,
  description:
    "A free daily fill-in puzzle (criss-cross): an empty crossword grid and 16 to 18 words from one theme, 22 on Sundays. Fit every word in its place using only the lengths and the crossings; every grid has exactly one solution, and the clock decides the leaderboard.",
  genre: ["Word puzzle", "Fill-in puzzle", "Criss-cross", "Puzzle"],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/fill.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('fill'),
    { '@type': 'ListItem', position: 3, name: 'Fill' },
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
        <FillClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="fill" stage={isStageServer('fill', searchParams)} />
    </>
  );
}
