import { Suspense } from 'react';
import ConnectClient from './ConnectClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Connect launched 2026-11-01 with Swap, Slide, Spin, Fill, Connect and Pairs, the
// six dailies that share app/SimpleDaily.jsx. /connect is the canonical, evergreen
// URL. This server page filters live<=today before handing puzzles to the client,
// so future boards never reach a browser.

export const metadata = {
  title: "Free Daily Dot-Joining Puzzle (Numberlink): Connect | Mind Loft",
  description:
    "A free daily numberlink puzzle: join every pair of matching dots with a line, never crossing and never through a blocked square, and use every open square. 9x9 to 12x12, one solution each.",
  alternates: { canonical: '/connect' },
  openGraph: {
    images: [{ url: '/og/connect.png', width: 1200, height: 630, alt: "Connect, a daily dot-joining puzzle from Mind Loft" }],
    title: "Connect: The Daily Dot-Joining Puzzle",
    description: "Join every pair of dots, never cross a line, and fill every open square. One solution, a bigger board every couple of days.",
    url: '/connect',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/connect.png'],
    card: 'summary_large_image',
    title: "Connect: The Daily Dot-Joining Puzzle",
    description: "Join every pair of dots, never cross a line, and fill every open square. One solution, a bigger board every couple of days.",
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Connect',
  alternateName: "Connect: The Daily Dot-Joining Puzzle",
  url: `${SITE_URL}/connect`,
  description:
    "A free daily numberlink puzzle: join every pair of matching dots with one line, lines never cross or pass a blocked square, and every open square must be used. Boards run 9x9 on Monday up to 11x11 on Saturday and 12x12 on Sunday, each proved to have exactly one solution; the clock decides the leaderboard.",
  genre: ["Logic puzzle", "Numberlink", "Puzzle"],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/connect.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('connect'),
    { '@type': 'ListItem', position: 3, name: 'Connect' },
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
        <ConnectClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="connect" stage={isStageServer('connect', searchParams)} />
    </>
  );
}
