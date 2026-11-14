import { Suspense } from 'react';
import PackClient from './PackClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Pack launched 2026-11-14 (owner: "a 3D packing puzzle. Trunk of a car, by
// Sunday it's a moving van"). /pack is the canonical, evergreen URL. This server
// page filters live<=today AND strips the stored packing (`sol`) before handing
// puzzles to the client, so neither a future board nor a packing ever reaches a
// browser. The `sunday` flag survives the strip.

export const metadata = {
  title: "Free Daily Packing Puzzle: Pack, Fit It All In | Mind Loft",
  description:
    "A free daily 3D packing puzzle: fit every bag, box and sofa into the day's vehicle, from a car trunk on Monday to a moving van on Sunday.",
  alternates: { canonical: '/pack' },
  openGraph: {
    images: [{ url: '/og/pack.png', width: 1200, height: 630, alt: "Pack, a daily 3D packing puzzle from Mind Loft" }],
    title: "Pack: The Daily Packing Puzzle",
    description: "Load it all in. A car trunk on Monday, a moving van by Sunday.",
    url: '/pack',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/pack.png'],
    card: 'summary_large_image',
    title: "Pack: The Daily Packing Puzzle",
    description: "Load it all in. A car trunk on Monday, a moving van by Sunday.",
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Pack',
  alternateName: "Pack: The Daily Packing Puzzle",
  url: `${SITE_URL}/pack`,
  description:
    "A free daily 3D packing puzzle: a pile of luggage or furniture has to fit in the day's vehicle. Pick an item, tap where it goes and it drops straight down; turn it, tip it and walk round the vehicle to find the fit. Nothing may sit above the roof line. Sofas have a seat and a back and tables have room underneath. The vehicle grows from a hatchback on Monday to a moving van on Sunday, and the Packing Ladder ranks the load by how few items had to come back out.",
  genre: ["Spatial puzzle", "Packing puzzle", "Puzzle"],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/pack.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('pack'),
    { '@type': 'ListItem', position: 3, name: 'Pack' },
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
        <PackClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="pack" stage={isStageServer('pack', searchParams)} />
    </>
  );
}
