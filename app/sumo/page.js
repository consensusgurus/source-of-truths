import { Suspense } from 'react';
import SumoClient from './SumoClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Sumo launched 2026-10-13 as the daily greater-than sudoku (inequality
// sudoku): an ordinary 9x9 plus a sign on every edge inside a box, drawn as a
// bend in the grid line aimed at the smaller square. It also deals as the
// variant in Enter the Dojo (lib/dojo.js) from 2026-10-14.
//
// /sumo is the canonical, evergreen URL; the dated /quiz/sumo-* stubs
// canonicalize here. This server page filters live<=today before handing
// puzzles to the client, so future boards never reach a browser.

export const metadata = {
  title: 'Free Daily Greater-Than Sudoku (Inequality Sudoku): Sumo | Mind Loft',
  description:
    'A free daily greater-than sudoku, also called inequality sudoku. An ordinary 9×9 plus 108 signs inside the boxes saying which square is bigger. One logical solution, notes and a free hint, a new board every day, and a Sunday Edition with no digits at all.',
  alternates: { canonical: '/sumo' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/sumo.png', width: 1200, height: 630, alt: 'Sumo, a daily greater-than sudoku from Mind Loft' }],
    title: 'Sumo: A Daily Greater-Than Sudoku',
    description:
      'Sudoku with signs: every line inside a box bends toward the smaller square. Almost no digits, one logical solution, from Mind Loft, daily.',
    url: '/sumo',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/sumo.png'],
    card: 'summary_large_image',
    title: 'Sumo: A Daily Greater-Than Sudoku',
    description:
      'Sudoku with signs: every line inside a box bends toward the smaller square. A clean solve wins and the clock breaks the tie.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Sumo',
  alternateName: 'Sumo: Daily Greater-Than Sudoku (Inequality Sudoku)',
  url: `${SITE_URL}/sumo`,
  description:
    'A free daily greater-than sudoku: an ordinary 9×9 grid plus a sign on every edge inside a box saying which of the two squares holds the larger digit. Each board has one solution reachable by pure logic. Solve it for a perfect score, and ties break on fastest time.',
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
    categoryCrumb('sumo'),
    { '@type': 'ListItem', position: 3, name: 'Sumo' },
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
          {'SUMO'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 1 ? '#8a6d0b' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Sumo launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily greater-than sudoku: the signs inside each box say which square is bigger. Come back when the first board drops.
        </p>
        <a href="/" style={{ color: '#8a6d0b', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function SumoPage({ searchParams }) {
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
        <SumoClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="sumo" stage={isStageServer('sumo', searchParams)} />
    </>
  );
}
