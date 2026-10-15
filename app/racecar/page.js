import { Suspense } from 'react';
import RacecarClient from './RacecarClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Racecar launched 2026-10-15 as the daily palindrome sudoku. Grey lines run
// across an ordinary 9×9, and each reads the same from either end; the weekday
// ramp is the printed-given count and the Sunday Edition prints just fourteen
// digits under ten lines.
//
// /racecar is the canonical, evergreen URL; the dated /quiz/racecar-* stubs
// canonicalize here. This server page filters live<=today before handing
// puzzles to the client, so future boards and their solutions never reach a
// browser.

export const metadata = {
  title: 'Free Daily Palindrome Sudoku: Racecar | Mind Loft',
  description:
    'A free daily palindrome sudoku: every grey line reads the same from either end. One logical solution, notes and a hint, and a new board every day.',
  alternates: { canonical: '/racecar' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/racecar.png', width: 1200, height: 630, alt: 'Racecar, a daily palindrome sudoku from Mind Loft' }],
    title: 'Racecar: A Daily Palindrome Sudoku',
    description:
      'Every grey line reads the same both ways: a 9×9 palindrome sudoku with one logical solution, from Mind Loft, daily.',
    url: '/racecar',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/racecar.png'],
    card: 'summary_large_image',
    title: 'Racecar: A Daily Palindrome Sudoku',
    description:
      'Every grey line reads the same both ways. A clean solve wins and the clock breaks the tie.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Racecar',
  alternateName: 'Racecar: Daily Palindrome Sudoku',
  url: `${SITE_URL}/racecar`,
  description:
    'A free daily palindrome sudoku: an ordinary 9×9 grid plus grey lines, each of which reads the same forwards and backwards, so its end squares match and so on inward. Each board has one solution reachable by pure logic. Solve it for a perfect score, and ties break on fastest time.',
  genre: ['Logic puzzle', 'Sudoku', 'Number puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/racecar.png`,
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
    categoryCrumb('racecar'),
    { '@type': 'ListItem', position: 3, name: 'Racecar' },
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
          {'RACECAR'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 1 ? '#475569' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Racecar launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily palindrome sudoku: every grey line reads the same from either end. Come back when the first board drops.
        </p>
        <a href="/" style={{ color: '#475569', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function RacecarPage({ searchParams }) {
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
        <RacecarClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="racecar" stage={isStageServer('racecar', searchParams)} />
    </>
  );
}
