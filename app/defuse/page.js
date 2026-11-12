import { Suspense } from 'react';
import DefuseClient from './DefuseClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Defuse launched 2026-11-12: the daily wire-cutting logic puzzle. A device,
// a manual of rules, and exactly one safe order of cuts. /defuse is the
// canonical, evergreen URL. This server page filters live<=today before handing
// puzzles to the client, so future boards never reach a browser.

export const metadata = {
  title: 'Free Daily Wire Cutting Logic Puzzle: Defuse | Mind Loft',
  description:
    'A free daily logic puzzle: read the manual, then cut the wires in the one safe order. One wrong cut ends the day. Boards grow from four wires to seven.',
  alternates: { canonical: '/defuse' },
  openGraph: {
    images: [{ url: '/og/defuse.png', width: 1200, height: 630, alt: 'Defuse, a daily wire cutting logic puzzle from Mind Loft' }],
    title: 'Defuse: Read the Manual, Cut the Wires in the One Safe Order',
    description: 'A row of colored wires and a manual of rules. Exactly one order of cuts obeys them all, and one wrong cut ends the day. A new device every day.',
    url: '/defuse',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/defuse.png'],
    card: 'summary_large_image',
    title: 'Defuse: Read the Manual, Cut the Wires in the One Safe Order',
    description: 'A row of colored wires and a manual of rules. Exactly one order of cuts obeys them all, and one wrong cut ends the day. A new device every day.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Defuse',
  alternateName: 'Defuse: The Daily Bomb Defusal Logic Puzzle',
  url: `${SITE_URL}/defuse`,
  description:
    'A free daily logic puzzle: a device with colored wires, a serial number, batteries and an indicator light, and a manual of rules that leave exactly one safe order of cuts. A solve ranks on the clock; one wrong cut ends the day.',
  genre: ['Logic puzzle', 'Deduction', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/defuse.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('defuse'),
    { '@type': 'ListItem', position: 3, name: 'Defuse' },
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
        <DefuseClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="defuse" stage={isStageServer('defuse', searchParams)} />
    </>
  );
}
