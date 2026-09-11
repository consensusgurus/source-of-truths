import { Suspense } from 'react';
import PlotClient from './PlotClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Plot launched 2026-08-14 as the 61st daily: linked from the hub puzzles row,
// the footer, the /daily archive, and the sitemap (/plot is the canonical,
// evergreen URL). Weekdays are a 10x10 board; Sundays step up to a 12x12
// Edition. Puzzles are gated by Eastern date here, so tomorrow's board (and its
// solution) never reaches the browser.

export const metadata = {
  title: 'Free Daily Rectangle Puzzle (Shikaku): Plot | Mind Loft',
  description:
    'A free daily rectangle puzzle, also called shikaku or divide by squares. Every number is the size of the plot it belongs to, so divide the whole board into rectangles that each hold one number and cover exactly that many cells. One solution, pure deduction with no guessing, and a bigger 12x12 Edition on Sundays.',
  alternates: { canonical: '/plot' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/plot.png', width: 1200, height: 630, alt: 'Plot — a daily rectangle puzzle from Mind Loft' }],
    title: 'Plot — A Daily Rectangle Puzzle',
    description:
      'Every number is the size of its own plot. Divide the board into rectangles until the whole map is claimed. A new logic puzzle from Mind Loft, daily.',
    url: '/plot',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/plot.png'],
    card: 'summary_large_image',
    title: 'Plot — A Daily Rectangle Puzzle',
    description: 'Every number is the size of its own plot. Divide the whole board, one solution, no guessing.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Plot',
  alternateName: 'Plot — Daily Rectangle Puzzle',
  url: `${SITE_URL}/plot`,
  description:
    'A free daily rectangle puzzle (shikaku): numbers are scattered across a grid and each one gives the area of the plot it belongs to. Divide the whole board into rectangles so that every rectangle contains exactly one number and covers exactly that many cells. Each board has exactly one solution and is reachable by pure deduction, with no guessing. A clean, error-free solve earns a perfect score, and ties break on fewest errors then fastest time.',
  genre: ['Logic puzzle', 'Shikaku', 'Puzzle'],
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
    categoryCrumb('plot'),
    { '@type': 'ListItem', position: 3, name: 'Plot' },
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
          {'PLOT'.split('').map((ch, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, background: i === 3 ? '#78350f' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Plot launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily rectangle puzzle — every number is the size of its own plot, and the whole board has to be divided up. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: '#78350f', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function PlotPage({ searchParams }) {
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
        <PlotClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="plot" stage={isStageServer('plot', searchParams)} />
    </>
  );
}
