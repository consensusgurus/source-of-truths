import { Suspense } from 'react';
import SumsClient from './SumsClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Sums launched 2026-09-03 as the daily kakuro, the cross-sums crossword: a
// crossword-shaped grid where every run of white squares carries a total, digits
// 1 to 9, no repeats inside a run, one solution reachable by deduction alone.
// Its manners are the mini sudoku's: a wrong digit is never flagged, a solve is
// a flat 10, and the daily leaderboard is a straight race on the clock.
// Weekdays are 7x7 and the Sunday Edition is 11x11.
//
// /sums is the canonical, evergreen URL; the dated /quiz/sums-* stubs
// canonicalize here. This server page filters live<=today before handing
// puzzles to the client, so future boards and their solutions never reach a
// browser.

export const metadata = {
  title: 'Free Daily Kakuro Puzzle: Sums | Mind Loft',
  description:
    'A free daily kakuro, the cross-sums crossword. Fill every run of squares with digits 1 to 9 that add to the printed total, with no digit repeated in a run. One logical solution, notes and a free hint, a new 7×7 board every day and an 11×11 Edition on Sundays.',
  alternates: { canonical: '/sums' },
  openGraph: {
    // Static share card, pre-rendered once into public/og/ (see the 2026-09-02
    // build-time note in CLAUDE.md): a new daily ships the PNG, not a route.
    images: [{ url: '/og/sums.png', width: 1200, height: 630, alt: 'Sums — a daily kakuro from Mind Loft' }],
    title: 'Sums — A Daily Kakuro',
    description:
      'Every run of squares adds up to the total at its head, digits 1 to 9, no repeats. A daily cross-sums puzzle with one logical solution, from Mind Loft.',
    url: '/sums',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/sums.png'],
    card: 'summary_large_image',
    title: 'Sums — A Daily Kakuro',
    description:
      'Every run of squares adds up to the total at its head, digits 1 to 9, no repeats. One logical solution, and the clock decides the day.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Sums',
  alternateName: 'Sums — Daily Kakuro',
  url: `${SITE_URL}/sums`,
  description:
    'A free daily kakuro: a crossword-shaped grid where every run of white squares carries a total. Fill each run with digits 1 to 9 that add to its total, never repeating a digit inside a run. Each board has one solution reachable by deduction alone; solve it for a perfect score, and ties break on fastest time.',
  genre: ['Logic puzzle', 'Kakuro', 'Number puzzle', 'Puzzle'],
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
    categoryCrumb('sums'),
    { '@type': 'ListItem', position: 3, name: 'Sums' },
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
          {'SUMS'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 1 ? '#be185d' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Sums launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily kakuro: every run of squares adds up to the total at its head, digits 1 to 9, no repeats. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: '#be185d', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function SumsPage({ searchParams }) {
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
        <SumsClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="sums" stage={isStageServer('sums', searchParams)} />
    </>
  );
}
