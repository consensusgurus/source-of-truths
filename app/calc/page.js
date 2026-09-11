import { Suspense } from 'react';
import CalcClient from './CalcClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Calc launched 2026-08-25: walk the calculator. The board is a checkerboard of
// buttons that alternate number, operator, number, and you walk from the
// top-left button to the bottom-right one a touching button at a time. The walk
// is a sum, it reads left to right the way a calculator does, and it has to come
// out at the target.
//
// Its lane in the Numbers row is SEARCH. Suds, Quilt, Cages, Sando, Sixes and
// Polka are all deduction, Crunch and Cipher are arithmetic on a fixed set of
// numbers, and this is the one where the arithmetic is fixed and the ROUTE is
// what you are hunting for. That is also why difficulty is banded on how many of
// a board's legal routes hit the target rather than on grid size alone.
//
// /calc is the canonical, evergreen URL; the dated /quiz/calc-* stubs
// canonicalize here. This server page filters live<=today before handing puzzles
// to the client, so future boards never reach a browser.

export const metadata = {
  title: 'Free Daily Number Path Puzzle: Calc | Mind Loft',
  description:
    'A free daily number puzzle. Walk from the first button to the last across a grid of numbers and operators, one touching button at a time, and land on exactly the target. Reads left to right like a calculator. A new board every day, and three targets on Sundays.',
  alternates: { canonical: '/calc' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/calc.png', width: 1200, height: 630, alt: 'Calc — a daily number path puzzle from Mind Loft' }],
    title: 'Calc — Walk the Calculator',
    description:
      'Step across a grid of numbers and operators from the first button to the last, and land on exactly the target. A free daily number puzzle from Mind Loft.',
    url: '/calc',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/calc.png'],
    card: 'summary_large_image',
    title: 'Calc — Walk the Calculator',
    description:
      'One route across the buttons comes out at the target. Find it. A free daily number puzzle from Mind Loft.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Calc',
  alternateName: 'Calc — Daily Number Path Puzzle',
  url: `${SITE_URL}/calc`,
  description:
    'A free daily number puzzle: walk across a grid of calculator buttons from the top-left to the bottom-right, one touching button at a time, building a sum that reads left to right. Land on exactly the target to win. No button may be used twice, and a division that would not come out whole is not a legal step.',
  genre: ['Number puzzle', 'Logic puzzle', 'Math puzzle', 'Puzzle'],
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
    categoryCrumb('calc'),
    { '@type': 'ListItem', position: 3, name: 'Calc' },
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
          {'CALC'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 1 ? '#be123c' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Calc launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          Walk the calculator — step across a grid of numbers and operators and land on exactly the target. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: '#1d4ed8', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function CalcPage({ searchParams }) {
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
        <CalcClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="calc" stage={isStageServer('calc', searchParams)} />
    </>
  );
}
