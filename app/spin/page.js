import { Suspense } from 'react';
import SpinClient from './SpinClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Spin launched 2026-11-01 with Swap, Slide, Spin, Fill, Connect and Pairs, the
// six dailies that share app/SimpleDaily.jsx. /spin is the canonical, evergreen
// URL. This server page filters live<=today before handing puzzles to the client,
// so future boards never reach a browser.

export const metadata = {
  title: "Free Daily Photo Rotation Puzzle: Spin | Mind Loft",
  description:
    "A free daily photo puzzle: a 6x6 photograph with nearly every square turned. Tap to turn each one a quarter until the picture is straight. 8x8 on Sundays.",
  alternates: { canonical: '/spin' },
  openGraph: {
    images: [{ url: '/og/spin.png', width: 1200, height: 630, alt: "Spin, a daily photo rotation puzzle from Mind Loft" }],
    title: "Spin: The Daily Photo Rotation Puzzle",
    description: "Every square of today\u2019s photo is turned. Set the picture straight in the fewest taps.",
    url: '/spin',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/spin.png'],
    card: 'summary_large_image',
    title: "Spin: The Daily Photo Rotation Puzzle",
    description: "Every square of today\u2019s photo is turned. Set the picture straight in the fewest taps.",
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Spin',
  alternateName: "Spin: The Daily Photo Rotation Puzzle",
  url: `${SITE_URL}/spin`,
  description:
    "A free daily photo rotation puzzle: a photograph cut into a 6x6 grid (8x8 on Sundays) with nearly every square turned. Tap a square to turn it a quarter clockwise until the whole picture is straight; a finished picture ranks on taps, then the clock.",
  genre: ["Photo puzzle", "Rotation puzzle", "Puzzle"],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/spin.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('spin'),
    { '@type': 'ListItem', position: 3, name: 'Spin' },
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
        <SpinClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="spin" stage={isStageServer('spin', searchParams)} />
    </>
  );
}
