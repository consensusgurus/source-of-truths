import { Suspense } from 'react';
import NicheClient from './NicheClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Niche launched 2026-08-21 as the daily trivia grid: a 3x3 whose rows and
// columns are broad categories from one universe, a different universe every
// day of the week, and a 4x4 Countries Edition on Sundays. Every cell wants an
// answer satisfying both its headers, answers can be used once per board, and
// after each correct pick you see what share of today's players chose the
// same answer — the rarer your board, the bigger the brag.
//
// /niche is the canonical, evergreen URL; this server page filters
// live<=today before handing puzzles to the client, so future boards never
// reach a browser.

export const metadata = {
  title: 'Free Daily Trivia Grid: Niche | Mind Loft',
  description:
    'A free daily trivia grid. Fill the 3×3 with answers that fit both their row and column category — countries, states, animals, movies, TV, teams, and musicians, a different universe every day. Rare answers are the flex. New board daily, 4×4 Countries Edition on Sundays.',
  alternates: { canonical: '/niche' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/niche.png', width: 1200, height: 630, alt: 'Niche — the daily trivia grid from Mind Loft' }],
    title: 'Niche — The Daily Trivia Grid',
    description:
      'Fill the grid with answers that fit both their row and column, then see how rare your picks were against today’s players. A different universe every day of the week, from Mind Loft.',
    url: '/niche',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/niche.png'],
    card: 'summary_large_image',
    title: 'Niche — The Daily Trivia Grid',
    description:
      'Every cell wants an answer that fits two categories at once, and the rarer your pick the better the brag. A new universe every day.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Niche',
  alternateName: 'Niche — Daily Trivia Grid',
  url: `${SITE_URL}/niche`,
  description:
    'A free daily trivia grid: fill a 3×3 whose rows and columns are broad categories from one universe with answers that satisfy both at once. One universe per day of the week — countries, US states, animals, movies, TV shows, pro sports teams, musicians — with a 4×4 Countries Edition on Sundays. Score is cells filled; rarity against the day’s players is the flex.',
  genre: ['Trivia', 'Puzzle', 'Word game'],
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
    categoryCrumb('niche'),
    { '@type': 'ListItem', position: 3, name: 'Niche' },
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
          {'NICHE'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 1 ? '#115e59' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Niche launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily trivia grid — every cell wants an answer that fits two categories at once, and the rarer your pick the better. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: '#115e59', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function NichePage({ searchParams }) {
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
        <NicheClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="niche" stage={isStageServer('niche', searchParams)} />
    </>
  );
}
