import { Suspense } from 'react';
import DuetClient from './DuetClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Duet launched 2026-10-03 as the daily balanced grid: dots and rings, half
// and half in every row, column and walled room, never three alike in a line,
// with = and x marks between neighbours. 6x6 early in the week, 8x8 from
// Thursday, a 10x10 Sunday Edition.
//
// /duet is the canonical, evergreen URL; the dated /quiz/duet-* stubs
// canonicalize here. This server page filters live<=today before handing
// boards to the client, so future boards and their solutions never reach a
// browser.

export const metadata = {
  title: 'Free Daily Binary Logic Puzzle: Duet | Mind Loft',
  description:
    'A free daily logic grid. Fill every square with a dot or a ring: every row, column and walled room is half and half, never three alike in a line. One logical solution, a new board every day, 10x10 on Sundays.',
  alternates: { canonical: '/duet' },
  openGraph: {
    images: [{ url: '/og/duet.png', width: 1200, height: 630, alt: 'Duet, a daily dots-and-rings logic grid from Mind Loft' }],
    title: 'Duet: A Daily Dots-and-Rings Logic Grid',
    description:
      'Half dots, half rings, in every row, column and room. Never three alike. One logical solution, from Mind Loft, daily.',
    url: '/duet',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/duet.png'],
    card: 'summary_large_image',
    title: 'Duet: A Daily Dots-and-Rings Logic Grid',
    description:
      'Half dots, half rings, in every row, column and room. A clean solve wins and the clock breaks the tie.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Duet',
  alternateName: 'Duet, Daily Binary Logic Puzzle',
  url: `${SITE_URL}/duet`,
  description:
    'A free daily balanced binary logic puzzle (binairo, takuzu) with walled rooms: fill every square with a dot or a ring so every row, column and room is half and half, never three alike in a line, with = and x marks between neighbours. One solution reachable by pure logic; ties break on fastest time.',
  genre: ['Logic puzzle', 'Binary puzzle', 'Puzzle'],
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
    categoryCrumb('duet'),
    { '@type': 'ListItem', position: 3, name: 'Duet' },
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
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Duet launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily dots-and-rings logic grid. Come back when the first board drops.
        </p>
        <a href="/" style={{ color: '#1a7f37', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function DuetPage({ searchParams }) {
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
        <DuetClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="duet" stage={isStageServer('duet', searchParams)} />
    </>
  );
}
