import { Suspense } from 'react';
import ArrowClient from './ArrowClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Arrow launched 2026-10-13 as the daily arrow sudoku. Every arrow runs from
// a circle through a short line of squares, and the circle holds the sum of
// the line; the weekday ramp is the printed-given count and the Sunday
// Edition prints just eight digits under twelve arrows.
//
// /arrow is the canonical, evergreen URL; the dated /quiz/arrow-* stubs
// canonicalize here. This server page filters live<=today before handing
// puzzles to the client, so future boards and their solutions never reach a
// browser.

export const metadata = {
  title: 'Free Daily Arrow Sudoku: Arrow | Mind Loft',
  description:
    'A free daily arrow sudoku: each circled digit is the sum of the digits along its arrow. One logical solution, notes and a hint, and a new board every day.',
  alternates: { canonical: '/arrow' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/arrow.png', width: 1200, height: 630, alt: 'Arrow, a daily arrow sudoku from Mind Loft' }],
    title: 'Arrow: A Daily Arrow Sudoku',
    description:
      'Every circle is the sum of its arrow: a 9×9 sudoku with one logical solution, from Mind Loft, daily.',
    url: '/arrow',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/arrow.png'],
    card: 'summary_large_image',
    title: 'Arrow: A Daily Arrow Sudoku',
    description:
      'Every circle is the sum of its arrow: a 9×9 sudoku built on small sums. A clean solve wins and the clock breaks the tie.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Arrow',
  alternateName: 'Arrow: Daily Arrow Sudoku',
  url: `${SITE_URL}/arrow`,
  description:
    'A free daily arrow sudoku: an ordinary 9×9 grid plus arrows, each running from a circle through a line of squares whose digits add up to the circle. Each board has one solution reachable by pure logic. Solve it for a perfect score, and ties break on fastest time.',
  genre: ['Logic puzzle', 'Sudoku', 'Number puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/arrow.png`,
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
    categoryCrumb('arrow'),
    { '@type': 'ListItem', position: 3, name: 'Arrow' },
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
          {'ARROW'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 1 ? '#86198f' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Arrow launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily arrow sudoku: every circle is the sum of its arrow. Come back when the first board drops.
        </p>
        <a href="/" style={{ color: '#86198f', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function ArrowPage({ searchParams }) {
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
        <ArrowClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="arrow" stage={isStageServer('arrow', searchParams)} />
    </>
  );
}
