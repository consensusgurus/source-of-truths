import { Suspense } from 'react';
import WantedClient from './WantedClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Wanted (launched 2026-11-26): the daily hidden picture hunt. One crowd scene a
// day, a list of things to find in it, and the clock (owner, 2026-11-26: "make
// each day a different scene", "Not community. Scored by time to completion").
// The scene is drawn by the browser from the day's seed (lib/wanted-engine.js).
// This server page filters live<=today before handing puzzles to the client, so
// a future day's seed never reaches a browser.
//
// THE WHERE'S WALDO REFERENCE IS A COMPARISON, NOTHING MORE (owner, 2026-11-26:
// "The description should reference where's Waldo"). Copy may say Wanted is in
// the spirit of those books. It never says Waldo is here, and nobody in the
// scene is drawn like him: the star is Otis, our own character.

export const metadata = {
  title: "Free Daily Seek and Find Puzzle Like Where's Waldo: Wanted | Mind Loft",
  description: "A free daily seek-and-find puzzle in the spirit of Where's Waldo: one new crowd scene every day and a list of things to find in it. Fastest time wins.",
  alternates: { canonical: '/wanted' },
  openGraph: {
    images: [{ url: '/og/wanted.png', width: 1200, height: 630, alt: 'Wanted, the daily hidden picture puzzle from Mind Loft' }],
    title: 'Wanted: The Daily Hidden Picture Puzzle',
    description: "In the spirit of Where's Waldo: a new crowd scene every day. Find Otis, his friends, and everything else on the list, as fast as you can.",
    url: '/wanted',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/wanted.png'],
    card: 'summary_large_image',
    title: 'Wanted: The Daily Hidden Picture Puzzle',
    description: "In the spirit of Where's Waldo: a new crowd scene every day. Find everything on the list, as fast as you can.",
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Wanted',
  alternateName: 'Wanted: The Daily Hidden Picture Puzzle',
  url: `${SITE_URL}/wanted`,
  description: "A free daily hidden picture puzzle in the spirit of Where's Waldo. Every day brings one new crowd scene, such as a fairground, a beach, or a harbor, with more than a thousand little figures and a list of things to find: Otis in his green cap and orange scarf, his friend Mabel, his dog Biscuit, lost things, odd scenes, and one-of-a-kind people. Drag and zoom to search, tap what you find, and the fastest finished hunt tops the leaderboard.",
  genre: ['Hidden object', 'Seek and find', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/wanted.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('wanted'),
    { '@type': 'ListItem', position: 3, name: 'Wanted' },
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
        <WantedClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="wanted" stage={isStageServer('wanted', searchParams)} />
    </>
  );
}
