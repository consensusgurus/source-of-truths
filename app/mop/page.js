import { Suspense } from 'react';
import MopClient from './MopClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Mop launched 2026-11-13 (owner: "mop every tile in a house once and only once
// and get out"). /mop is the canonical, evergreen URL. This server page filters
// live<=today AND strips the stored route (`sol`) before handing puzzles to the
// client, so neither a future board nor an answer ever reaches a browser. The
// `sunday` flag survives the strip.

export const metadata = {
  title: "Free Daily Route Puzzle: Mop Every Tile Once | Mind Loft",
  description:
    "A free daily route puzzle: mop every tile of a house exactly once, never step on a wet tile, and leave by the door. Three floors on Sunday.",
  alternates: { canonical: '/mop' },
  openGraph: {
    images: [{ url: '/og/mop.png', width: 1200, height: 630, alt: "Mop, a daily mop-every-tile route puzzle from Mind Loft" }],
    title: "Mop: The Daily Mop-Every-Tile Puzzle",
    description: "One house, one mop. Mop every tile exactly once, never step on a wet one, and get out the door.",
    url: '/mop',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/mop.png'],
    card: 'summary_large_image',
    title: "Mop: The Daily Mop-Every-Tile Puzzle",
    description: "One house, one mop. Mop every tile exactly once, never step on a wet one, and get out the door.",
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Mop',
  alternateName: "Mop: The Daily Mop-Every-Tile Puzzle",
  url: `${SITE_URL}/mop`,
  description:
    "A free daily route puzzle: push a mop through a house drawn from above, covering every tile exactly once without stepping on a tile already mopped, and finish at the door. Houses run six by six on Monday up to eight by eight on Saturday, with a three-floor house joined by staircases on Sunday; every board is solved before it is dealt and the clock decides the leaderboard.",
  genre: ["Logic puzzle", "Route puzzle", "Puzzle"],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/mop.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('mop'),
    { '@type': 'ListItem', position: 3, name: 'Mop' },
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
        <MopClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="mop" stage={isStageServer('mop', searchParams)} />
    </>
  );
}
