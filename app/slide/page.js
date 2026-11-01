import { Suspense } from 'react';
import SlideClient from './SlideClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Slide launched 2026-11-01 with Swap, Slide, Spin, Fill, Connect and Pairs, the
// six dailies that share app/SimpleDaily.jsx. /slide is the canonical, evergreen
// URL. This server page filters live<=today before handing puzzles to the client,
// so future boards never reach a browser.

export const metadata = {
  title: "Free Daily Sliding Tile Photo Puzzle: Slide | Mind Loft",
  description:
    "A free daily sliding tile puzzle: a 5x5 photograph with one square missing. Slide the squares through the gap until the picture is whole. 6x6 on Sundays.",
  alternates: { canonical: '/slide' },
  openGraph: {
    images: [{ url: '/og/slide.png', width: 1200, height: 630, alt: "Slide, a daily sliding tile photo puzzle from Mind Loft" }],
    title: "Slide: The Daily Sliding Photo Puzzle",
    description: "The 15-puzzle grown to a 5x5 photograph. Slide it back together in the fewest moves.",
    url: '/slide',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/slide.png'],
    card: 'summary_large_image',
    title: "Slide: The Daily Sliding Photo Puzzle",
    description: "The 15-puzzle grown to a 5x5 photograph. Slide it back together in the fewest moves.",
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Slide',
  alternateName: "Slide: The Daily Sliding Photo Puzzle",
  url: `${SITE_URL}/slide`,
  description:
    "A free daily sliding tile puzzle, the classic fifteen puzzle grown to a 5x5 photograph (6x6 on Sundays). Slide squares through the one gap until the picture is whole; every board is solvable, and a finished picture ranks on squares moved, then the clock.",
  genre: ["Sliding puzzle", "Photo puzzle", "Puzzle"],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/slide.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('slide'),
    { '@type': 'ListItem', position: 3, name: 'Slide' },
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
        <SlideClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="slide" stage={isStageServer('slide', searchParams)} />
    </>
  );
}
