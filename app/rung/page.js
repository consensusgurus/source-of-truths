import { Suspense } from 'react';
import RungClient from './RungClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Rung launched 2026-07-30 as the 36th daily. Weekday ladders are 10 to 12
// rungs and Sundays 15 or more. Puzzles are gated by Eastern date here, so
// tomorrow's pair never reaches the browser.

export const metadata = {
  title: 'Free Daily Word Ladder: Rung | Mind Loft',
  description:
    'A free daily word ladder. Change one letter at a time to climb from one five-letter word to another, every rung a real word. You play against par, the length a clean climb comes in at, and perfect, the proven shortest ladder. No app, no signup, a new climb every day.',
  alternates: { canonical: '/rung' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/rung.png', width: 1200, height: 630, alt: 'Rung — a daily puzzle from Mind Loft' }],
    title: 'Rung — A Daily Word Ladder',
    description: 'One letter at a time, every rung a word. Beat par, chase the perfect ladder. A new climb from Mind Loft, daily.',
    url: '/rung', type: 'website', siteName: 'Mind Loft',
  },
  twitter: { images: ['/og/rung.png'], card: 'summary_large_image', title: 'Rung — A Daily Word Ladder', description: 'Change one letter at a time. Can you get under par?' },
};

const gameJsonLd = {
  '@context': 'https://schema.org', '@type': 'Game', name: 'Rung',
  alternateName: 'Rung — Daily Word Ladder', url: `${SITE_URL}/rung`,
  description:
    'A free daily word ladder puzzle. Climb from a start word to a target word changing one letter at a time, with every rung a real five-letter word. The perfect line is the exact shortest ladder, found by breadth-first search and confirmed by an independent bidirectional search, and most boards have only one shortest route. Par sits a cushion above perfect and is beatable. Perfect scores ten and par scores eight. Weekday perfect lines run 10 to 12 rungs and Sundays 15 or more.',
  genre: ['Word ladder', 'Word puzzle', 'Puzzle'],
  gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};
const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('rung'),
    { '@type': 'ListItem', position: 3, name: 'Rung' },
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
          {'RUNG'.split('').map((ch, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, background: i === 3 ? '#155e75' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Rung launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily word ladder. One letter at a time, every rung a word. Come back when the first climb drops.
        </p>
        <a href="/daily" style={{ color: '#155e75', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function RungPage({ searchParams }) {
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
        <RungClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="rung" stage={isStageServer('rung', searchParams)} />
    </>
  );
}
