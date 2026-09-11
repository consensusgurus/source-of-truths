import { Suspense } from 'react';
import CagesClient from './CagesClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Cages launched 2026-08-12 as the third sudoku on the slate, after Suds and
// Quilt, and the only one of the three that prints no digits at all: it is a
// KILLER SUDOKU, where the grid is partitioned into cages labelled with the
// total of the digits inside them and those totals are the entire clue set.
// Linked from the hub puzzles row, the footer, the /daily archive, and the
// sitemap (/cages is the canonical, evergreen URL — the dated /quiz/cages-*
// stubs canonicalize here). Weekdays run 29-34 cages of at most four cells on a
// Monday-to-Saturday ramp; Sundays are a harder Edition at 27 cages and are the
// only day that prints a five-cell cage.

export const metadata = {
  title: 'Free Daily Killer Sudoku: Cages | Mind Loft',
  description:
    'A free daily killer sudoku — no digits printed, just cages labelled with the total of the digits inside them. Fill the 9×9 grid so every row, column, and 3×3 box holds 1–9 with no repeats. One logical solution and never a guess, notes and a free hint, a new board every day, and a harder Edition on Sundays.',
  alternates: { canonical: '/cages' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/cages.png', width: 1200, height: 630, alt: 'Cages — a daily killer sudoku from Mind Loft' }],
    title: 'Cages — A Daily Killer Sudoku',
    description:
      'Killer sudoku: not one digit is printed, and the cage totals are the whole clue set. One logical solution, never a guess. A new board from Mind Loft, daily.',
    url: '/cages',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/cages.png'],
    card: 'summary_large_image',
    title: 'Cages — A Daily Killer Sudoku',
    description:
      'A killer sudoku with no printed digits. Fill the 9×9 grid from the cage totals alone.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Cages',
  alternateName: 'Cages — Daily Killer Sudoku',
  url: `${SITE_URL}/cages`,
  description:
    'A free daily killer sudoku: no digits are printed at all. The 9×9 grid is partitioned into cages, each labelled with the total of the digits inside it and never repeating a digit, and those totals are the only clues. Fill the grid so that every row, every column, and every 3×3 box contains the digits 1–9 exactly once. Each board has one solution and can always be reached by logic alone — solve it with no errors for a perfect score, and ties break on fastest time.',
  genre: ['Logic puzzle', 'Killer sudoku', 'Sudoku', 'Number puzzle', 'Puzzle'],
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
    categoryCrumb('cages'),
    { '@type': 'ListItem', position: 3, name: 'Cages' },
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
          {'CAGES'.split('').map((ch, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, background: i === 4 ? '#6b21a8' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Cages launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily killer sudoku — the same 9×9 grid with no printed digits at all, just cages labelled with the total of the digits inside them. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: '#6b21a8', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function CagesPage({ searchParams }) {
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
        <CagesClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="cages" stage={isStageServer('cages', searchParams)} />
    </>
  );
}
