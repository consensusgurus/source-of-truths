import { Suspense } from 'react';
import RimClient from './RimClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';

// Rim launched 2026-09-08 as the daily outside sudoku, alongside Frame (frame
// sudoku): the two gutter sudokus, both built on Sando's border-clue layout
// with the gutter on all four sides. Rim prints NO digit inside the grid;
// outside some row and column ends it prints the three digits of that line's
// first three cells, unordered, and ramps how many of the thirty-six are
// printed: Mon 30 down to Sat 16, and a thirteen-triple Sunday Edition.
//
// /rim is the canonical, evergreen URL; the dated /quiz/rim-* stubs
// canonicalize here. This server page filters live<=today before handing
// puzzles to the client, so future boards and their solutions never reach a
// browser.

export const metadata = {
  title: 'Free Daily Outside Sudoku: Rim | Mind Loft',
  description:
    'A free daily outside sudoku. Nothing is printed inside the 9×9; outside some row and column ends, the three digits of the nearest three squares are printed, in no order. One logical solution, notes and a free hint, a new board every day, and a thirteen-clue Edition on Sundays.',
  alternates: { canonical: '/rim' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/rim.png', width: 1200, height: 630, alt: 'Rim — a daily outside sudoku from Mind Loft' }],
    title: 'Rim — A Daily Outside Sudoku',
    description:
      'Sudoku with nothing printed inside the grid: the clues sit in the margin. One logical solution, from Mind Loft, daily.',
    url: '/rim',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/rim.png'],
    card: 'summary_large_image',
    title: 'Rim — A Daily Outside Sudoku',
    description:
      'Sudoku with nothing printed inside the grid, only digits in the margin. A clean solve wins and the clock breaks the tie.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Rim',
  alternateName: 'Rim — Daily Outside Sudoku',
  url: `${SITE_URL}/rim`,
  description:
    'A free daily outside sudoku: a 9×9 grid with no digits printed inside it, where the three digits of the cells nearest an edge are printed outside some row and column ends. Each board has one solution reachable by pure logic — solve it for a perfect score, and ties break on fastest time.',
  genre: ['Logic puzzle', 'Sudoku', 'Number puzzle', 'Puzzle'],
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
    { '@type': 'ListItem', position: 2, name: 'Quizzes', item: `${SITE_URL}/quizzes` },
    { '@type': 'ListItem', position: 3, name: 'Rim' },
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
          {'RIM'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 1 ? '#4d7c0f' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Rim launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily outside sudoku — no digits inside the grid, only in the margin. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: '#4d7c0f', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function RimPage({ searchParams }) {
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
        <RimClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="rim" stage={isStageServer('rim', searchParams)} />
    </>
  );
}
