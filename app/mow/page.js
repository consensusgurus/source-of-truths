import { Suspense } from 'react';
import MowClient from './MowClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Mow launched 2026-11-17 (owner, 2026-11-16: "the same concept as Mop, but
// outside of the house mowing the lawn"). /mow is the canonical, evergreen URL.
// This server page filters live<=today AND strips the stored route (`sol`)
// before handing puzzles to the client, so neither a future yard nor an answer
// ever reaches a browser. The `sunday` flag survives the strip.

export const metadata = {
  title: "Free Daily Lawn Mowing Puzzle: Mow Every Square Once | Mind Loft",
  description:
    "A free daily route puzzle: mow every square of a yard exactly once, round the trees, pond and shed, and leave by the gate. A bigger yard every day.",
  alternates: { canonical: '/mow' },
  openGraph: {
    images: [{ url: '/og/mow.png', width: 1200, height: 630, alt: "Mow, a daily mow-every-square lawn puzzle from Mind Loft" }],
    title: "Mow: The Daily Mow-Every-Square Lawn Puzzle",
    description: "One yard, one mower. Mow every square exactly once, round the trees and the pond, and get out the gate.",
    url: '/mow',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/mow.png'],
    card: 'summary_large_image',
    title: "Mow: The Daily Mow-Every-Square Lawn Puzzle",
    description: "One yard, one mower. Mow every square exactly once, round the trees and the pond, and get out the gate.",
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Mow',
  alternateName: "Mow: The Daily Mow-Every-Square Lawn Puzzle",
  url: `${SITE_URL}/mow`,
  description:
    "A free daily route puzzle: push a mower across a yard drawn from above, mowing every square of grass exactly once round the trees, bushes, flower beds, pond, shed and house, through the gates in the fences, and finish at the gate out. Running over mown grass is a replay with the clock still running. Yards grow from six by six on Monday to the nine by nine Estate on Sunday; every yard is solved before it is dealt and the clock decides the leaderboard.",
  genre: ["Logic puzzle", "Route puzzle", "Puzzle"],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/mow.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('mow'),
    { '@type': 'ListItem', position: 3, name: 'Mow' },
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
        <MowClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="mow" stage={isStageServer('mow', searchParams)} />
    </>
  );
}
