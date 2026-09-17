import { Suspense } from 'react';
import CribClient from './CribClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Crib launched 2026-09-17 as the daily cribbage throw, the fifth Cards daily.
// Five six-card hands (seven on Sunday), each one a choice of which two cards
// to throw to the crib, alternating between your crib and your opponent's.
// Every throw is valued exactly over every cut card and every pair the
// opponent could throw (lib/crib-core.js); scripts/verify-crib.mjs re-derives
// every figure with a separate scorer.
//
// /crib is the canonical, evergreen URL. This server page filters live<=today
// before handing hands to the client, so tomorrow's hands never reach a
// browser.
export const metadata = {
  title: 'Free Daily Cribbage Puzzle: Crib | Mind Loft',
  description:
    "A free daily cribbage puzzle. Five hands of six cards, and for each one you choose the two to throw to the crib, sometimes yours and sometimes your opponent's. Every throw is valued exactly over every cut card, so the best throw is a fact, not an opinion. A new deal every day and seven hands on Sundays.",
  alternates: { canonical: '/crib' },
  openGraph: {
    // Static share card (2026-09-02 rule): pre-rendered once into public/og/.
    images: [{ url: '/og/crib.png', width: 1200, height: 630, alt: 'Crib, a daily cribbage puzzle from Mind Loft' }],
    title: 'Crib: A Daily Cribbage Puzzle',
    description:
      'Six cards, throw two. Every throw valued over every cut card and every crib. From Mind Loft, daily.',
    url: '/crib',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/crib.png'],
    card: 'summary_large_image',
    title: 'Crib: A Daily Cribbage Puzzle',
    description:
      'Five cribbage hands, one choice each: which two cards go to the crib. The best throw is worked out exactly, and the clock breaks ties.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Crib',
  alternateName: 'Crib: A Daily Cribbage Puzzle',
  url: `${SITE_URL}/crib`,
  description:
    'A free daily cribbage puzzle: five six-card hands, and for each you choose the two cards to throw to the crib. Every throw is valued over all 46 cut cards and every pair the opponent might throw. Two points for the best throw, one for a close one; ties break on fastest time.',
  genre: ['Card game', 'Cribbage', 'Puzzle'],
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
    categoryCrumb('crib'),
    { '@type': 'ListItem', position: 3, name: 'Crib' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

function ComingSoon({ first }) {
  // Rendered only if no puzzle is live yet. Never crash the route on an empty
  // visible set; show a friendly placeholder instead.
  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: "'Manrope', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 18 }}>
          {'CRIB'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 3 ? '#a21caf' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Crib launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily cribbage throw: six cards, keep four, and the crib does the rest. Come back when the first deal drops.
        </p>
        <a href="/daily" style={{ color: '#1d4ed8', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function CribPage({ searchParams }) {
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
        <CribClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="crib" stage={isStageServer('crib', searchParams)} />
    </>
  );
}
