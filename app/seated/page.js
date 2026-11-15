import { Suspense } from 'react';
import SeatedClient from './SeatedClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Seated launched 2026-11-14 (owner: "Seated - it's great"). /seated is the
// canonical, evergreen URL. This server page filters live<=today AND strips the
// stored seating (`sol`) before handing puzzles to the client, so neither a
// future board nor an answer ever reaches a browser. The `sunday` flag survives
// the strip.

export const metadata = {
  title: "Free Daily Seating Chart Puzzle: Seated | Mind Loft",
  description:
    "A free daily seating chart logic puzzle: give every guest a chair and meet every request, from a dinner party on Monday to a wedding on Sunday.",
  alternates: { canonical: '/seated' },
  openGraph: {
    images: [{ url: '/og/seated.png', width: 1200, height: 630, alt: "Seated, a daily seating chart puzzle from Mind Loft" }],
    title: "Seated: The Daily Seating Chart Puzzle",
    description: "Seat the room. A dinner party on Monday, a wedding by Sunday.",
    url: '/seated',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/seated.png'],
    card: 'summary_large_image',
    title: "Seated: The Daily Seating Chart Puzzle",
    description: "Seat the room. A dinner party on Monday, a wedding by Sunday.",
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Seated',
  alternateName: "Seated: The Daily Seating Chart Puzzle",
  url: `${SITE_URL}/seated`,
  description:
    "A free daily seating chart logic puzzle: a room of round tables, a list of guests and a list of requests. Some guests must sit side by side, some must be kept at different tables, and some need a particular table. Tap a guest, tap a chair, and seat everyone so every request is met. The room grows from a dinner party at one table on Monday to a wedding reception of twenty on Sunday, and the Seating Ladder ranks the room by how few guests had to be moved.",
  genre: ["Logic puzzle", "Seating chart puzzle", "Puzzle"],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/seated.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('seated'),
    { '@type': 'ListItem', position: 3, name: 'Seated' },
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
        <SeatedClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="seated" stage={isStageServer('seated', searchParams)} />
    </>
  );
}
