import { Suspense } from 'react';
import KnightClient from './KnightClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Knight launched 2026-08-28 as the daily anti-knight sudoku, the eighth
// sudoku on the site after Suds (classic), Quilt (jigsaw), Cages (killer),
// Sando (sandwich), Sixes (mini), Mercury (thermo) and Polka (kropki). It is
// the first of them whose extra rule is a CELL-TO-CELL EXCLUSION rather than a
// region shape, an arithmetic clue or a neighbour relation: no digit repeats a
// chess knight's move away, nothing is drawn on the grid, and the constraint
// reaches across boxes instead of inside them. That is why the board can print
// so few digits: Mon 28 down to Sat 16, and a thirteen-clue Sunday Edition.
//
// /knight is the canonical, evergreen URL; the dated /quiz/knight-* stubs
// canonicalize here. This server page filters live<=today before handing
// puzzles to the client, so future boards and their solutions never reach a
// browser.

export const metadata = {
  title: 'Free Daily Anti-Knight Sudoku: Knight | Mind Loft',
  description:
    'A free daily anti-knight sudoku. An ordinary 9×9 plus one rule: no digit repeats a chess knight’s move away. Select a square and its knights light up. One logical solution, notes and a free hint, a new board every day, and a thirteen-clue Edition on Sundays.',
  alternates: { canonical: '/knight' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/knight.png', width: 1200, height: 630, alt: 'Knight — a daily anti-knight sudoku from Mind Loft' }],
    title: 'Knight — A Daily Anti-Knight Sudoku',
    description:
      'One rule added to sudoku: no digit repeats a knight’s move away. Far fewer clues, one logical solution, from Mind Loft, daily.',
    url: '/knight',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/knight.png'],
    card: 'summary_large_image',
    title: 'Knight — A Daily Anti-Knight Sudoku',
    description:
      'One rule added to sudoku: no digit repeats a knight’s move away. A clean solve wins and the clock breaks the tie.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Knight',
  alternateName: 'Knight — Daily Anti-Knight Sudoku',
  url: `${SITE_URL}/knight`,
  description:
    'A free daily anti-knight sudoku: an ordinary 9×9 grid plus one extra rule, that no digit may repeat a chess knight’s move away from itself. Each board has one solution reachable by pure logic — solve it for a perfect score, and ties break on fastest time.',
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
    categoryCrumb('knight'),
    { '@type': 'ListItem', position: 3, name: 'Knight' },
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
          {'KNIGHT'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 1 ? '#3730a3' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Knight launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily anti-knight sudoku — no digit repeats a knight&apos;s move away. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: '#3730a3', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function KnightPage({ searchParams }) {
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
        <KnightClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="knight" stage={isStageServer('knight', searchParams)} />
    </>
  );
}
