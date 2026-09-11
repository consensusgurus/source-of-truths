import { Suspense } from 'react';
import FibClient from './FibClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Fib launched 2026-07-31 as the 39th daily: linked from the hub puzzles row,
// the footer, the /daily archive, and the sitemap (/fib is the canonical,
// evergreen URL). Weekdays are a 5x5 grid; Sundays step up to a 6x6 Edition.
// Puzzles are gated by Eastern date here, so tomorrow's grid (and its solution)
// never reaches the browser.

export const metadata = {
  title: 'Free Daily Logic Puzzle With One Lying Clue: Fib | Mind Loft',
  description:
    'A free daily logic grid where every row and column holds 1 to 5 once, the open end of each inequality sign points at the larger number, and exactly one of those signs is lying. Solve the grid, then accuse the clue that lied. One provable answer, no guessing, and a bigger 6x6 Edition on Sundays.',
  alternates: { canonical: '/fib' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/fib.png', width: 1200, height: 630, alt: 'Fib — a daily logic puzzle with one lying clue, from Mind Loft' }],
    title: 'Fib — One Clue Is Lying',
    description:
      'A Latin square with inequality clues, except one clue is false. Solve the grid and name the liar. A new logic puzzle from Mind Loft, daily.',
    url: '/fib',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/fib.png'],
    card: 'summary_large_image',
    title: 'Fib — One Clue Is Lying',
    description: 'The open end of every sign points at the larger number. One of them is lying. Solve the grid, then name the liar.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Fib',
  alternateName: 'Fib — Daily Logic Puzzle',
  url: `${SITE_URL}/fib`,
  description:
    'A free daily logic puzzle: fill an n by n grid so every row and column holds each number once, guided by inequality signs between neighbouring squares whose open end points at the larger number. Exactly one sign is false, so a contradiction may be your own mistake or may be the lie. Solve the grid and accuse the lying sign. Each board admits exactly one grid and exactly one lying clue, so the answer is provable with no guessing. A clean solve earns a perfect score, and ties break on fewest errors then fastest time.',
  genre: ['Logic puzzle', 'Latin square', 'Futoshiki', 'Deduction', 'Puzzle'],
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
    categoryCrumb('fib'),
    { '@type': 'ListItem', position: 3, name: 'Fib' },
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
          {'FIB'.split('').map((ch, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, background: i === 2 ? '#4c1d95' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Fib launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily grid with one lying clue — solve it, then name the sign that lied. Come back when the first grid drops.
        </p>
        <a href="/daily" style={{ color: '#4c1d95', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function FibPage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today);
  if (!visiblePuzzles.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <FibClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="fib" stage={isStageServer('fib', searchParams)} />
    </>
  );
}
