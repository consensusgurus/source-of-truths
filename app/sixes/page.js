import { Suspense } from 'react';
import SixesClient from './SixesClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Sixes launched 2026-08-14 as the daily 6x6 mini sudoku, the fifth sudoku on
// the site after Suds (classic 9x9), Quilt (jigsaw), Cages (killer) and Sando
// (sandwich). Its lane is SPEED: the other four are all full-size boards you sit
// down with, this is the one you finish standing up, so a solve scores a flat 10
// and the daily leaderboard is a straight race on the clock.
//
// /sixes is the canonical, evergreen URL; the dated /quiz/sixes-* stubs
// canonicalize here. This server page filters live<=today before handing
// puzzles to the client, so future boards and their solutions never reach a
// browser.

export const metadata = {
  title: 'Free Daily Mini Sudoku (6×6): Sixes | Mind Loft',
  description:
    'A free daily mini sudoku. Fill the 6×6 grid so every row, column, and 2×3 box holds 1–6 with no repeats. One logical solution, notes and a free hint, a new board every day, and a harder Edition on Sundays.',
  alternates: { canonical: '/sixes' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/sixes.png', width: 1200, height: 630, alt: 'Sixes — a daily mini sudoku from Mind Loft' }],
    title: 'Sixes — A Daily Mini Sudoku',
    description:
      'Fill the 6×6 grid so every row, column, and box holds 1–6 once. A two-minute sudoku with one logical solution, from Mind Loft, daily.',
    url: '/sixes',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/sixes.png'],
    card: 'summary_large_image',
    title: 'Sixes — A Daily Mini Sudoku',
    description:
      'Fill the 6×6 grid so every row, column, and box holds 1–6 once. The short sudoku: a clean solve wins and the clock breaks the tie.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Sixes',
  alternateName: 'Sixes — Daily Mini Sudoku',
  url: `${SITE_URL}/sixes`,
  description:
    'A free daily mini sudoku: fill a 6×6 grid so that every row, every column, and every 2×3 box contains the digits 1–6 exactly once. Each board has one solution reachable by pure logic — solve it for a perfect score, and ties break on fastest time.',
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
    categoryCrumb('sixes'),
    { '@type': 'ListItem', position: 3, name: 'Sixes' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

function ComingSoon({ first }) {
  // Rendered only if no puzzle is live yet. Never crash the route on an empty
  // visible set — show a friendly placeholder instead.
  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: "'Manrope', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 18 }}>
          {'SIXES'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 1 ? '#1d4ed8' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Sixes launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily mini sudoku — fill the 6×6 grid so every row, column, and box holds 1–6 once. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: '#1d4ed8', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function SixesPage({ searchParams }) {
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
        <SixesClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="sixes" stage={isStageServer('sixes', searchParams)} />
    </>
  );
}
