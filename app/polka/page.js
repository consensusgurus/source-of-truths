import { Suspense } from 'react';
import PolkaClient from './PolkaClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Polka launched 2026-08-24 as the daily kropki sudoku: not one digit printed,
// only white dots (neighbours differ by 1), black dots (one is double the
// other), and silences (neither). Difficulty is a measured cost ramping
// Monday to Saturday, and the Sunday Edition is a deal from the top of the
// distribution.
//
// /polka is the canonical, evergreen URL; the dated /quiz/polka-* stubs
// canonicalize here. This server page filters live<=today before handing
// puzzles to the client, so future deals and their solutions never reach a
// browser.

export const metadata = {
  title: 'Free Daily Kropki Sudoku: Polka | Mind Loft',
  description:
    'A free daily kropki sudoku. No digits printed, only dots: white means neighbours differ by 1, black means one is double the other, no dot means neither. One logical solution, a new deal every day, hardest on Sundays.',
  alternates: { canonical: '/polka' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/polka.png', width: 1200, height: 630, alt: 'Polka — a daily kropki sudoku from Mind Loft' }],
    title: 'Polka — A Daily Kropki Sudoku',
    description:
      'No numbers, only dots. Solve the 9×9 from the dot pattern and its silences: one logical solution, from Mind Loft, daily.',
    url: '/polka',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/polka.png'],
    card: 'summary_large_image',
    title: 'Polka — A Daily Kropki Sudoku',
    description:
      'No numbers, only dots. Solve the 9×9 from the dot pattern and its silences. A clean solve wins and the clock breaks the tie.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Polka',
  alternateName: 'Polka — Daily Kropki Sudoku',
  url: `${SITE_URL}/polka`,
  description:
    'A free daily kropki sudoku: a 9×9 grid with no digits printed at all. White dots mark neighbours that differ by 1, black dots mark a digit and its double, and the absence of a dot is a clue too. One solution reachable by pure logic — solve it for a perfect score, and ties break on fastest time.',
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
    categoryCrumb('polka'),
    { '@type': 'ListItem', position: 3, name: 'Polka' },
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
          {'POLKA'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 1 ? '#16a34a' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Polka launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily kropki sudoku — no numbers, only dots, and the silences between them. Come back when the first deal drops.
        </p>
        <a href="/daily" style={{ color: '#16a34a', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function PolkaPage({ searchParams }) {
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
        <PolkaClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="polka" stage={isStageServer('polka', searchParams)} />
    </>
  );
}
