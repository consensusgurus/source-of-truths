import { Suspense } from 'react';
import FrameClient from './FrameClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';

// Frame launched 2026-09-08 as the daily frame sudoku, alongside Rim (outside
// sudoku): the two gutter sudokus, both built on Sando's border-clue layout
// with the gutter on all four sides. Frame prints, outside every row and
// column end, the SUM of the first three cells reading in from that edge,
// thirty-six sums on every board, and ramps the digits printed inside the
// grid: Mon 14 down to Sat 4, and a two-digit Sunday Edition.
//
// /frame is the canonical, evergreen URL; the dated /quiz/frame-* stubs
// canonicalize here. This server page filters live<=today before handing
// puzzles to the client, so future boards and their solutions never reach a
// browser.

export const metadata = {
  title: 'Free Daily Frame Sudoku: Frame | Mind Loft',
  description:
    'A free daily frame sudoku. An ordinary 9×9 plus a number outside every row and column end: the sum of the three squares nearest that edge. Thirty-six sums, one logical solution, notes and a free hint, a new board every day, and a two-digit Edition on Sundays.',
  alternates: { canonical: '/frame' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/frame.png', width: 1200, height: 630, alt: 'Frame — a daily frame sudoku from Mind Loft' }],
    title: 'Frame — A Daily Frame Sudoku',
    description:
      'Sudoku with the sum of the outer three squares printed at every row and column end. Fewer clues, one logical solution, from Mind Loft, daily.',
    url: '/frame',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/frame.png'],
    card: 'summary_large_image',
    title: 'Frame — A Daily Frame Sudoku',
    description:
      'Sudoku with a sum printed at every row and column end. A clean solve wins and the clock breaks the tie.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Frame',
  alternateName: 'Frame — Daily Frame Sudoku',
  url: `${SITE_URL}/frame`,
  description:
    'A free daily frame sudoku: an ordinary 9×9 grid with the sum of the three cells nearest each edge printed outside every row and column end. Each board has one solution reachable by pure logic — solve it for a perfect score, and ties break on fastest time.',
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
    { '@type': 'ListItem', position: 3, name: 'Frame' },
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
          {'FRAME'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 1 ? '#b45309' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Frame launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily frame sudoku — a sum outside every row and column end. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: '#b45309', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function FramePage({ searchParams }) {
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
        <FrameClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="frame" stage={isStageServer('frame', searchParams)} />
    </>
  );
}
