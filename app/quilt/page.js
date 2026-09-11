import { Suspense } from 'react';
import QuiltClient from './QuiltClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Quilt launched 2026-08-11 as the second sudoku on the slate, alongside Suds:
// same 9×9 grid and the same rows-and-columns rule, but the nine 3×3 boxes are
// replaced by nine connected irregular regions. Linked from the hub puzzles row,
// the footer, the /daily archive, and the sitemap (/quilt is the canonical,
// evergreen URL — the dated /quiz/quilt-* stubs canonicalize here). Weekdays run
// 30-34 printed clues on a Monday-to-Saturday ramp; Sundays are a harder Edition
// at 26.

export const metadata = {
  title: 'Free Daily Jigsaw Sudoku: Quilt | Mind Loft',
  description:
    'A free daily jigsaw sudoku — fill the 9×9 grid so every row, column, and irregular region holds 1–9 with no repeats. One logical solution and never a guess, notes and a free hint, a new board every day, and a harder Edition on Sundays.',
  alternates: { canonical: '/quilt' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/quilt.png', width: 1200, height: 630, alt: 'Quilt — a daily jigsaw sudoku from Mind Loft' }],
    title: 'Quilt — A Daily Jigsaw Sudoku',
    description:
      'Sudoku with the boxes redrawn. Nine irregular regions, one logical solution, and a clean solve wins. A new board from Mind Loft, daily.',
    url: '/quilt',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/quilt.png'],
    card: 'summary_large_image',
    title: 'Quilt — A Daily Jigsaw Sudoku',
    description:
      'Fill the 9×9 grid so every row, column, and irregular region holds 1–9 once. An error-free solve wins.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Quilt',
  alternateName: 'Quilt — Daily Jigsaw Sudoku',
  url: `${SITE_URL}/quilt`,
  description:
    'A free daily jigsaw sudoku: fill a 9×9 grid so that every row, every column, and each of nine irregular regions contains the digits 1–9 exactly once. Each board has one solution and can always be reached by logic alone — solve it with no errors for a perfect score, and ties break on fastest time.',
  genre: ['Logic puzzle', 'Sudoku', 'Jigsaw sudoku', 'Number puzzle', 'Puzzle'],
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
    categoryCrumb('quilt'),
    { '@type': 'ListItem', position: 3, name: 'Quilt' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

function ComingSoon({ first }) {
  // Rendered only if no puzzle is live yet (before the first drop). Never crash
  // the route on an empty visible set — show a friendly placeholder instead.
  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: "'Manrope', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 18 }}>
          {'QUILT'.split('').map((ch, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, background: i === 4 ? '#a21caf' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Quilt launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily jigsaw sudoku — same 9×9 grid, but the boxes have been redrawn into nine irregular regions. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: '#a21caf', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function QuiltPage({ searchParams }) {
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
        <QuiltClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="quilt" stage={isStageServer('quilt', searchParams)} />
    </>
  );
}
