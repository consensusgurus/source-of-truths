import { Suspense } from 'react';
import LampsClient from './LampsClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Lamps is the daily light-placement puzzle: light every white square, no
// lamp shining on another, every numbered wall touching exactly that many.
//
// /lamps is the canonical, evergreen URL; the dated /quiz/lamps-* stubs
// canonicalize here. This server page filters live<=today before handing
// boards to the client, so future boards and their solutions never reach a
// browser.

export const metadata = {
  title: 'Free Daily Light-Up Logic Puzzle: Lamps | Mind Loft',
  description:
    'A free daily logic puzzle. Place lamps to light every square: a lamp shines along its row and column until a wall, no lamp may shine on another, and numbered walls say how many lamps touch them. One logical solution, 10x10 on Sundays.',
  alternates: { canonical: '/lamps' },
  openGraph: {
    images: [{ url: '/og/lamps.png', width: 1200, height: 630, alt: 'Lamps, a daily light-every-square logic puzzle from Mind Loft' }],
    title: 'Lamps: Light Every Square, a Daily Logic Puzzle',
    description:
      'Place lamps until every square is lit. No lamp may shine on another. One logical solution, from Mind Loft, daily.',
    url: '/lamps',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/lamps.png'],
    card: 'summary_large_image',
    title: 'Lamps: Light Every Square, a Daily Logic Puzzle',
    description:
      'Place lamps until every square is lit. A clean solve wins and the clock breaks the tie.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Lamps',
  alternateName: 'Lamps, Daily Light-Up Logic Puzzle',
  url: `${SITE_URL}/lamps`,
  description:
    'A free daily light-placement logic puzzle (akari): place lamps so every white square is lit, no lamp shines on another, and every numbered wall touches exactly that many lamps. One solution reachable by pure logic; ties break on fastest time.',
  genre: ['Logic puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  publisher: {
    '@type': 'Organization',
    name: 'Mind Loft',
    url: `${SITE_URL}`,
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('lamps'),
    { '@type': 'ListItem', position: 3, name: 'Lamps' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

function ComingSoon({ first }) {
  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: "'Manrope', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Lamps launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily light-every-square logic puzzle. Come back when the first board drops.
        </p>
        <a href="/" style={{ color: '#1a7f37', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function LampsPage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today);
  if (!visiblePuzzles.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Suspense fallback={null}>
        <LampsClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="lamps" stage={isStageServer('lamps', searchParams)} />
    </>
  );
}
