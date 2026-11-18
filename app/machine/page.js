import { Suspense } from 'react';
import MachineClient from './MachineClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Machine launched 2026-11-17 (owner: "push and implement immediately ... the
// mock-up here can be the first run"). /machine is the canonical, evergreen URL.
// This server page filters live<=today AND strips the stored machine (`sol`)
// before handing puzzles to the client, so neither a future board nor an answer
// ever reaches a browser. The `sunday` flag survives the strip.

export const metadata = {
  title: 'Free Daily Contraption Puzzle: Machine | Mind Loft',
  description:
    'A free daily physics puzzle like The Incredible Machine: drag ramps, springs and belts into place, press Run and make the chain reaction do the job.',
  alternates: { canonical: '/machine' },
  openGraph: {
    images: [{ url: '/og/machine.png', width: 1200, height: 630, alt: 'Machine, a daily contraption puzzle from Mind Loft' }],
    title: 'Machine: The Daily Contraption Puzzle',
    description: 'A machine that is almost built. Drag the last parts into place, press Run and watch the chain reaction.',
    url: '/machine',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/machine.png'],
    card: 'summary_large_image',
    title: 'Machine: The Daily Contraption Puzzle',
    description: 'A machine that is almost built. Drag the last parts into place, press Run and watch the chain reaction.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Machine',
  alternateName: 'Machine: The Daily Contraption Puzzle',
  url: `${SITE_URL}/machine`,
  description:
    'A free daily physics puzzle in the spirit of The Incredible Machine: a chain-reaction machine is mostly built, and you drag a few parts from a tray (ramps, springs, belts, fans, bumpers and more) into place, press Run and watch real physics play out. Balls carry weight and momentum, buttons open trapdoors and start fans, and the day is won when the ball lands in the hoop, rings the bell or drops in the bucket. Ranked on the fewest runs, then the clock.',
  genre: ['Puzzle', 'Physics puzzle', 'Logic puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/machine.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('machine'),
    { '@type': 'ListItem', position: 3, name: 'Machine' },
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
        <MachineClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="machine" stage={isStageServer('machine', searchParams)} />
    </>
  );
}
