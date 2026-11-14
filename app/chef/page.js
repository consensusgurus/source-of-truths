import { Suspense } from 'react';
import ChefClient from './ChefClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Chef launched 2026-11-14 (owner: a restaurant kitchen puzzle, "get the full
// orders out as efficiently as possible as they come in"). /chef is the
// canonical, evergreen URL. This server page filters live<=today AND strips the
// stored service (`sol`) before handing puzzles to the client, so neither a
// future board nor the best service ever reaches a browser. `best` stays: the
// Kitchen Ladder is measured against it. The `sunday` flag survives the strip.

export const metadata = {
  title: "Free Daily Kitchen Puzzle: Chef, Time Every Dish | Mind Loft",
  description:
    "A free daily kitchen puzzle: fire each dish on a limited line so every order finishes together and goes out hot. A bigger brunch service on Sunday.",
  alternates: { canonical: '/chef' },
  openGraph: {
    images: [{ url: '/og/chef.png', width: 1200, height: 630, alt: "Chef, a daily kitchen timing puzzle from Mind Loft" }],
    title: "Chef: The Daily Kitchen Puzzle",
    description: "Run the line. Time every dish so the whole order goes out hot.",
    url: '/chef',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/chef.png'],
    card: 'summary_large_image',
    title: "Chef: The Daily Kitchen Puzzle",
    description: "Run the line. Time every dish so the whole order goes out hot.",
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Chef',
  alternateName: "Chef: The Daily Kitchen Puzzle",
  url: `${SITE_URL}/chef`,
  description:
    "A free daily kitchen puzzle: tickets print through a service, every dish needs its own station for a set number of minutes, and the stations have limited room. Fire each dish so a whole order finishes together, tray it and send it out hot. A minute a table waits costs one penalty minute and a minute a finished dish sits costs two. Services grow from a short lunch on Monday to a Sunday brunch on a bigger line, and the Kitchen Ladder ranks the result against the best service found.",
  genre: ["Logic puzzle", "Scheduling puzzle", "Puzzle"],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/chef.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('chef'),
    { '@type': 'ListItem', position: 3, name: 'Chef' },
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
        <ChefClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="chef" stage={isStageServer('chef', searchParams)} />
    </>
  );
}
