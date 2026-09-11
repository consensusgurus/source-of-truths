import { Suspense } from 'react';
import TowersClient from './TowersClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Towers launched 2026-08-24 as the daily skyscrapers puzzle, running with the
// sudoku family: a Latin square of tower heights with visibility clues on the
// border. Weekdays are 5x5 with the printed-clue count ramping down through
// the week; the Sunday Edition is 7x7.
//
// /towers is the canonical, evergreen URL; the dated /quiz/towers-* stubs
// canonicalize here. This server page filters live<=today before handing
// puzzles to the client, so future boards and their solutions never reach a
// browser.

export const metadata = {
  title: 'Free Daily Skyscrapers Puzzle: Towers | Mind Loft',
  description:
    'A free daily skyscrapers puzzle. Every row and column holds each tower height once, and the border clues count the towers you can see, taller ones hiding shorter ones. One logical solution, a new 5×5 board every day, and a 7×7 Edition on Sundays.',
  alternates: { canonical: '/towers' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/towers.png', width: 1200, height: 630, alt: 'Towers — a daily skyscrapers puzzle from Mind Loft' }],
    title: 'Towers — A Daily Skyscrapers Puzzle',
    description:
      'Count the towers in view: border clues, one logical solution, a new board daily from Mind Loft. 5×5 weekdays, 7×7 Sundays.',
    url: '/towers',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/towers.png'],
    card: 'summary_large_image',
    title: 'Towers — A Daily Skyscrapers Puzzle',
    description:
      'Count the towers in view: border clues, one logical solution, a new board daily. A clean solve wins and the clock breaks the tie.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Towers',
  alternateName: 'Towers — Daily Skyscrapers Puzzle',
  url: `${SITE_URL}/towers`,
  description:
    'A free daily skyscrapers puzzle: fill the grid so every row and column holds each tower height exactly once, guided by border clues that count the visible towers, taller ones hiding shorter ones behind them. One solution reachable by pure logic — solve it for a perfect score, and ties break on fastest time.',
  genre: ['Logic puzzle', 'Latin square', 'Number puzzle', 'Puzzle'],
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
    categoryCrumb('towers'),
    { '@type': 'ListItem', position: 3, name: 'Towers' },
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
          {'TOWERS'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 1 ? '#075985' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Towers launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily skyscrapers puzzle — border clues count the towers you can see, and every board falls to pure logic. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: '#075985', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function TowersPage({ searchParams }) {
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
        <TowersClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="towers" stage={isStageServer('towers', searchParams)} />
    </>
  );
}
