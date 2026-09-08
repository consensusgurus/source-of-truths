import { Suspense } from 'react';
import DiagClient from './DiagClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';

// Diag launched 2026-09-08 as the daily diagonal sudoku (Sudoku X), the tenth
// sudoku on the site after Suds (classic), Quilt (jigsaw), Cages (killer),
// Sando (sandwich), Sixes (mini), Mercury (thermo), Polka (kropki), Diag
// (anti-knight) and Towers (skyscrapers). Its extra rule is two EXTRA HOUSES:
// each long diagonal, corner to corner, holds every digit once, so the board
// has 29 houses rather than 27 and prints fewer clues than a plain sudoku
// needs: Mon 26 down to Sat 16, and a fourteen-clue Sunday Edition.
//
// /diag is the canonical, evergreen URL; the dated /quiz/diag-* stubs
// canonicalize here. This server page filters live<=today before handing
// puzzles to the client, so future boards and their solutions never reach a
// browser.

export const metadata = {
  title: 'Free Daily Diagonal Sudoku (Sudoku X): Diag | Mind Loft',
  description:
    'A free daily diagonal sudoku, also called Sudoku X. An ordinary 9×9 plus one rule: both long diagonals hold 1 to 9 exactly once. One logical solution, notes and a free hint, a new board every day, and a fourteen-clue Edition on Sundays.',
  alternates: { canonical: '/diag' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/diag.png', width: 1200, height: 630, alt: 'Diag — a daily diagonal sudoku from Mind Loft' }],
    title: 'Diag — A Daily Diagonal Sudoku',
    description:
      'One rule added to sudoku: both long diagonals hold 1 to 9 once. Fewer clues, one logical solution, from Mind Loft, daily.',
    url: '/diag',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/diag.png'],
    card: 'summary_large_image',
    title: 'Diag — A Daily Diagonal Sudoku',
    description:
      'One rule added to sudoku: both long diagonals hold 1 to 9 once. A clean solve wins and the clock breaks the tie.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Diag',
  alternateName: 'Diag — Daily Diagonal Sudoku (Sudoku X)',
  url: `${SITE_URL}/diag`,
  description:
    'A free daily diagonal sudoku (Sudoku X): an ordinary 9×9 grid plus one extra rule, that each of the two long diagonals holds every digit exactly once. Each board has one solution reachable by pure logic — solve it for a perfect score, and ties break on fastest time.',
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
    { '@type': 'ListItem', position: 3, name: 'Diag' },
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
          {'DIAG'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 1 ? '#0e7490' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Diag launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily diagonal sudoku — both long diagonals hold 1 to 9 once. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: '#0e7490', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function DiagPage({ searchParams }) {
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
        <DiagClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="diag" stage={isStageServer('diag', searchParams)} />
    </>
  );
}
