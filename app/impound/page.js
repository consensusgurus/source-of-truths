import { Suspense } from 'react';
import ImpoundClient from './ImpoundClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Impound launched 2026-09-04 as the larger Parker: the same sliding-block jam
// on a seven by seven lot. It is a separate game rather than a bigger Parker
// because every banked Parker board, every stored perfect and every leaderboard
// row behind them assumes six, and Parker's 6x6 is close to used up anyway (its
// weekdays run a perfect line of 11 to 20 and its Sundays 32 to 38, against a
// ceiling in the low fifties that only a handful of positions reach).
//
// The week climbs in two rungs and every rung sits above the Parker rung it
// corresponds to: Monday to Wednesday run to a perfect line of 16 to 25,
// Thursday to Saturday 23 to 35, and Sundays 34 to 50. Puzzles are gated by
// Eastern date here, so tomorrow's board never reaches the browser.

export const metadata = {
  title: 'Free Daily Sliding Block Puzzle: Impound | Mind Loft',
  description:
    'A free daily sliding-block puzzle on a seven by seven lot, and the bigger sibling of Parker. Around twenty blocks that each slide on one axis, and a red block that has to reach the one gap in the wall. Every board is solved exactly, so you play against a real par and a perfect line that nobody can beat. No app, no signup, and a new jam every day.',
  alternates: { canonical: '/impound' },
  openGraph: {
    // Static share card, per the 2026-09-02 rule: a new daily ships
    // public/og/<key>.png plus these two lines, never an opengraph-image route.
    images: [{ url: '/og/impound.png', width: 1200, height: 630, alt: 'Impound — a daily puzzle from Mind Loft' }],
    title: 'Impound — The Bigger Daily Sliding Block Puzzle',
    description: 'Parker on a bigger lot. Seven by seven, twenty blocks in your way, and one gap in the wall. A new jam from Mind Loft, daily.',
    url: '/impound', type: 'website', siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/impound.png'],
    card: 'summary_large_image',
    title: 'Impound — The Bigger Daily Sliding Block Puzzle',
    description: 'A seven by seven lot, blocked in on all four sides, one gap in the wall. Slide your way out.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org', '@type': 'Game', name: 'Impound',
  alternateName: 'Impound — The Bigger Daily Sliding Block Puzzle',
  url: `${SITE_URL}/impound`,
  description:
    'A free daily sliding-block puzzle, and the bigger sibling of Parker. Around twenty blocks fill a seven by seven lot and each slides along one axis only; the red block must reach the exit gap on the middle rank. Every board is machine generated and solved exactly by breadth-first search, so the perfect line is the true fewest moves that exist rather than an estimate, and par sits a cushion above it as the number a clean solve lands on. Perfect scores ten and par scores eight. The week climbs: Monday to Wednesday run 16 to 25 moves, Thursday to Saturday 23 to 35, and Sundays 34 to 50.',
  genre: ['Sliding block puzzle', 'Logic puzzle', 'Puzzle'],
  gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};
const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('impound'),
    { '@type': 'ListItem', position: 3, name: 'Impound' },
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
          {'IMPOUND'.split('').map((ch, i) => (
            <div key={i} style={{ width: 36, height: 36, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20, background: i === 6 ? '#7c5c2e' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Impound launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          Parker on a bigger lot. Seven by seven, around twenty blocks in your way, and one gap in the wall. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: '#7c5c2e', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function ImpoundPage({ searchParams }) {
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
        <ImpoundClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="impound" stage={isStageServer('impound', searchParams)} />
    </>
  );
}
