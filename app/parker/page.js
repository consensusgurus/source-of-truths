import { Suspense } from 'react';
import ParkerClient from './ParkerClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Parker launched 2026-07-30 as the 34th daily (as "Park", briefly "Parker",
// settled as "Parker" on 2026-07-31, with /park and /parker both 308ing here). It is linked from the hub puzzles row, the footer,
// the /daily archive, and the sitemap (/parker is the canonical, evergreen URL).
// The week climbs in three rungs: Monday to Wednesday run to a perfect line of
// 11 to 14 moves, Thursday to Saturday 16 to 20, and Sundays 32 to 38. Puzzles
// are gated by Eastern date here, so tomorrow's board never reaches the browser.

export const metadata = {
  title: 'Free Daily Sliding Block Puzzle: Parker | Mind Loft',
  description:
    'A free daily sliding-block puzzle. A jammed six by six lot, blocks that each slide on one axis, and a red block that has to reach the one gap in the wall. Every board is solved exactly, so you play against a real par and a perfect line that nobody can beat. No app, no signup, and a new jam every day.',
  alternates: { canonical: '/parker' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/parker.png', width: 1200, height: 630, alt: 'Parker — a daily puzzle from Mind Loft' }],
    title: 'Parker — A Daily Sliding Block Puzzle',
    description: 'You are in the red one. Everybody has blocked you in, and there is one gap in the wall. A new jam from Mind Loft, daily.',
    url: '/parker', type: 'website', siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/parker.png'],
    card: 'summary_large_image',
    title: 'Parker — A Daily Sliding Block Puzzle',
    description: 'Blocked in on all four sides, one gap in the wall. Slide your way out.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org', '@type': 'Game', name: 'Parker',
  alternateName: 'Parker — Daily Sliding Block Puzzle',
  url: `${SITE_URL}/parker`,
  description:
    'A free daily sliding-block puzzle. Blocks fill a six by six lot and each slides along one axis only; the red block must reach the exit gap. Every board is machine generated and solved exactly, so the perfect line is the true fewest moves that exist rather than an estimate, and par sits a cushion above it as the number a clean solve lands on. Perfect scores ten and par scores eight. The week climbs: Monday to Wednesday run 11 to 14 moves, Thursday to Saturday 16 to 20, and Sundays 32 to 38.',
  genre: ['Sliding block puzzle', 'Logic puzzle', 'Puzzle'],
  gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};
const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('park'),
    { '@type': 'ListItem', position: 3, name: 'Parker' },
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
          {'PARKER'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 5 ? '#7c5c2e' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Parker launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily sliding-block jam. You are in the red one, everybody has blocked you in, and there is one gap in the wall. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: '#7c5c2e', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function ParkerPage({ searchParams }) {
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
        <ParkerClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="park" stage={isStageServer('park', searchParams)} />
    </>
  );
}
