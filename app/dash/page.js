import { Suspense } from 'react';
import DashClient from './DashClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Dash launched 2026-11-15 (owner's own idea, "Build and implement"). /dash is the
// canonical, evergreen URL. This server page filters live<=today AND strips the
// stored shift (`sol`) before handing puzzles to the client, so neither a
// future board nor an answer ever reaches a browser. The `sunday` flag survives
// the strip.

export const metadata = {
  title: "Free Daily Delivery Driver Puzzle: Dash | Mind Loft",
  description:
    "A free daily delivery puzzle: one shift, too many orders and a bag that holds two. Pick your pickups and drop-offs to make the most in tips. New every day.",
  alternates: { canonical: '/dash' },
  openGraph: {
    images: [{ url: '/og/dash.png', width: 1200, height: 630, alt: "Dash, a daily delivery driver puzzle from Mind Loft" }],
    title: "Dash: The Daily Delivery Puzzle",
    description: "One shift, too many orders. Make the most in tips before the food goes cold.",
    url: '/dash',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/dash.png'],
    card: 'summary_large_image',
    title: "Dash: The Daily Delivery Puzzle",
    description: "One shift, too many orders. Make the most in tips before the food goes cold.",
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Dash',
  alternateName: "Dash: The Daily Delivery Puzzle",
  url: `${SITE_URL}/dash`,
  description:
    "A free daily delivery driver puzzle: a town of streets seen from above, restaurants with orders waiting and a door for each. There is never time to deliver them all. The bag holds two orders, every block and every stop costs minutes, and a tip shrinks once the food goes cold. Tap an order to pick it up and again to drop it off, and finish the shift with the most in tips. The town grows from five orders on Monday to ten restaurants on Sunday, and the Tip Ladder ranks the night by how many dollars short of the best possible shift it finished.",
  genre: ["Logic puzzle", "Route planning puzzle", "Delivery puzzle", "Puzzle"],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/dash.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('dash'),
    { '@type': 'ListItem', position: 3, name: 'Dash' },
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
        <DashClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="dash" stage={isStageServer('dash', searchParams)} />
    </>
  );
}
