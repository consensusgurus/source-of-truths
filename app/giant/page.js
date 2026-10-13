import { Suspense } from 'react';
import GiantClient from './GiantClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Giant launched 2026-10-13 as the daily 16x16 sudoku: sixteen rows, columns
// and 4x4 boxes holding 1 to 9 and A to G. Clues fall from 128 of 256 on
// Monday to 96 on Saturday, and the Sunday Edition prints ninety. Not part of
// the Enter the Dojo rotation (owner, 2026-10-13).
//
// /giant is the canonical, evergreen URL. This server page filters
// live<=today before handing puzzles to the client, so future boards and their
// solutions never reach a browser.

export const metadata = {
  title: 'Free Daily 16x16 Sudoku: Giant | Mind Loft',
  description:
    'A free daily 16×16 sudoku (hexadoku): place 1 to 9 and A to G once in every row, column and box. One logical solution and a new board every day.',
  alternates: { canonical: '/giant' },
  openGraph: {
    images: [{ url: '/og/giant.png', width: 1200, height: 630, alt: 'Giant, a daily 16×16 sudoku from Mind Loft' }],
    title: 'Giant: A Daily 16×16 Sudoku',
    description:
      'Sudoku at sixteen: 256 squares, 1 to 9 and A to G. One logical solution, a new board every day, from Mind Loft.',
    url: '/giant',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/giant.png'],
    card: 'summary_large_image',
    title: 'Giant: A Daily 16×16 Sudoku',
    description:
      'Sudoku at sixteen: 256 squares, 1 to 9 and A to G. A clean solve wins and the clock breaks the tie.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Giant',
  alternateName: 'Giant: Daily 16×16 Sudoku (Hexadoku)',
  url: `${SITE_URL}/giant`,
  description:
    'A free daily 16×16 sudoku: sixteen rows, columns and 4×4 boxes, each holding the symbols 1 to 9 and A to G exactly once. Each board has one solution reachable by pure logic. Solve it for a perfect score, and ties break on fastest time.',
  genre: ['Logic puzzle', 'Sudoku', 'Number puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/giant.png`,
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
    categoryCrumb('giant'),
    { '@type': 'ListItem', position: 3, name: 'Giant' },
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
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 18 }}>
          {'GIANT'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 1 ? '#3949ab' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Giant launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily 16×16 sudoku. Come back when the first board drops.
        </p>
        <a href="/" style={{ color: '#3949ab', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function GiantPage({ searchParams }) {
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
        <GiantClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="giant" stage={isStageServer('giant', searchParams)} />
    </>
  );
}
