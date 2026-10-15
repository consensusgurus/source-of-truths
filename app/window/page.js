import { Suspense } from 'react';
import WindowClient from './WindowClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Window launched 2026-10-13 as the daily windoku. Its extra rule is FOUR
// EXTRA HOUSES: four shaded 3x3 windows, at rows 2-4 / 6-8 and columns 2-4 /
// 6-8, each hold every digit once, so the board has 31 houses rather than 27
// and prints fewer clues than a plain sudoku needs: Mon 22 down to Sat 14, and
// a thirteen-clue Sunday Edition.
//
// /window is the canonical, evergreen URL; the dated /quiz/window-* stubs
// canonicalize here. This server page filters live<=today before handing
// puzzles to the client, so future boards and their solutions never reach a
// browser.

export const metadata = {
  title: 'Free Daily Windoku (Window Sudoku): Window | Mind Loft',
  description:
    'A free daily windoku (window sudoku): four shaded windows also hold 1 to 9 once. One logical solution, notes and a hint, and a new board every day.',
  alternates: { canonical: '/window' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/window.png', width: 1200, height: 630, alt: 'Window, a daily windoku from Mind Loft' }],
    title: 'Window: A Daily Windoku',
    description:
      'One rule added to sudoku: four shaded windows hold 1 to 9 once. Fewer clues, one logical solution, from Mind Loft, daily.',
    url: '/window',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/window.png'],
    card: 'summary_large_image',
    title: 'Window: A Daily Windoku',
    description:
      'One rule added to sudoku: four shaded windows hold 1 to 9 once. A clean solve wins and the clock breaks the tie.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Window',
  alternateName: 'Window: Daily Windoku (Window Sudoku, Hyper Sudoku)',
  url: `${SITE_URL}/window`,
  description:
    'A free daily windoku (window sudoku): an ordinary 9×9 grid plus one extra rule, that each of four shaded 3×3 windows holds every digit exactly once. Each board has one solution reachable by pure logic. Solve it for a perfect score, and ties break on fastest time.',
  genre: ['Logic puzzle', 'Sudoku', 'Number puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/window.png`,
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
    categoryCrumb('window'),
    { '@type': 'ListItem', position: 3, name: 'Window' },
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
          {'WINDOW'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 1 ? '#be185d' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Window launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily windoku: four shaded windows hold 1 to 9 once. Come back when the first board drops.
        </p>
        <a href="/" style={{ color: '#be185d', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function WindowPage({ searchParams }) {
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
        <WindowClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="window" stage={isStageServer('window', searchParams)} />
    </>
  );
}
