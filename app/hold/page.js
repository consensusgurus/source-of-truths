import { Suspense } from 'react';
import HoldClient from './HoldClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Hold is the daily poker hold, a Cards daily. Ten five-card hands (fifteen on
// Sunday), each one a choice of which cards to hold before the draw. From
// 2026-11-09 every hand is a SHOWDOWN against two rival hands, face up, and a
// hold is valued by its exact chance to beat both over every draw from the 37
// cards nobody holds; earlier boards are Jacks or Better valued by expected
// return over the 47 undealt cards (lib/hold-core.js). scripts/verify-hold.mjs
// re-derives every figure with a separate engine.
//
// /hold is the canonical, evergreen URL. This server page filters live<=today
// before handing hands to the client, so tomorrow's deals never reach a
// browser.
export const metadata = {
  title: 'Free Daily Poker Puzzle: Hold | Mind Loft',
  description:
    'A free daily poker puzzle: ten hands, each against two face-up rival hands. Choose which cards to hold. Every hold is valued exactly, so the best one is a fact.',
  alternates: { canonical: '/hold' },
  openGraph: {
    // Static share card (2026-09-02 rule): pre-rendered once into public/og/.
    images: [{ url: '/og/hold.png', width: 1200, height: 630, alt: 'Hold, a daily poker puzzle from Mind Loft' }],
    title: 'Hold: A Daily Poker Puzzle',
    description:
      'A free daily poker puzzle: five cards against two rival hands, choose which to hold. Every hold is valued over every draw. Ten hands a day, fifteen on Sundays.',
    url: '/hold',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/hold.png'],
    card: 'summary_large_image',
    title: 'Hold: A Daily Poker Puzzle',
    description:
      'Ten poker hands against two rivals, one choice each: which cards to hold. The best hold is worked out exactly, and the clock breaks ties.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Hold',
  alternateName: 'Hold: A Daily Poker Puzzle',
  url: `${SITE_URL}/hold`,
  description:
    'A free daily poker puzzle: ten hands, each played against two rival hands dealt face up, and for each you choose which cards to hold before the draw. Every hold is valued by its exact chance to beat both rivals over every draw from the 37 cards nobody holds. One point for the best hold; ties break on fastest time.',
  genre: ['Card game', 'Poker', 'Video poker', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/hold.png`,
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
    categoryCrumb('hold'),
    { '@type': 'ListItem', position: 3, name: 'Hold' },
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
          {'HOLD'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 3 ? '#a21caf' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Hold launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily poker hold: five cards against two rivals, keep the right ones, and the draw does the rest. Come back when the first deal drops.
        </p>
        <a href="/" style={{ color: '#1d4ed8', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function HoldPage({ searchParams }) {
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
        <HoldClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="hold" stage={isStageServer('hold', searchParams)} />
    </>
  );
}
