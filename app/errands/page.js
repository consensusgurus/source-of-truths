import { Suspense } from 'react';
import ErrandsClient from './ErrandsClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Errands launched 2026-11-15 (owner: "also do the same for errands"). /errands is the
// canonical, evergreen URL. This server page filters live<=today AND strips the
// stored order (`sol`) before handing puzzles to the client, so neither a
// future board nor an answer ever reaches a browser. The `sunday` flag survives
// the strip.

export const metadata = {
  title: "Free Daily Route Planning Puzzle: Errands | Mind Loft",
  description:
    "A free daily route planning puzzle: pick the order of your stops round town, keep every rule, and be home as soon as you can. New every day.",
  alternates: { canonical: '/errands' },
  openGraph: {
    images: [{ url: '/og/errands.png', width: 1200, height: 630, alt: "Errands, a daily route planning puzzle from Mind Loft" }],
    title: "Errands: The Daily Route Planning Puzzle",
    description: "Plan the round. Bank before it shuts, ice cream home in time.",
    url: '/errands',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/errands.png'],
    card: 'summary_large_image',
    title: "Errands: The Daily Route Planning Puzzle",
    description: "Plan the round. Bank before it shuts, ice cream home in time.",
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Errands',
  alternateName: "Errands: The Daily Route Planning Puzzle",
  url: `${SITE_URL}/errands`,
  description:
    "A free daily route planning puzzle: a town of streets seen from above, a list of stops and a few rules. A shop shuts at a set time, another opens late, something you buy has to be home before it spoils, and one stop has to come before another. Tap the stops in the order you will drive them and the route and timetable update as you go. The town grows from four stops on Monday to eight on Sunday, and the Errand Ladder ranks the trip by how many minutes behind the soonest possible one it finished.",
  genre: ["Logic puzzle", "Route planning puzzle", "Puzzle"],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/errands.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('errands'),
    { '@type': 'ListItem', position: 3, name: 'Errands' },
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
        <ErrandsClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="errands" stage={isStageServer('errands', searchParams)} />
    </>
  );
}
