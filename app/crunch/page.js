import { Suspense } from 'react';
import CrunchClient from './CrunchClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Crunch launched 2026-07-30 as the 37th daily. Weekday rounds can be solved with four or
// five of the six numbers; Sundays need all six. Puzzles are gated by Eastern
// date here, so tomorrow's round never reaches the browser.

export const metadata = {
  title: 'Free Daily Numbers Game: Crunch | Mind Loft',
  description:
    'A free daily numbers game. Six numbers, four operations, and a three-digit target to hit exactly. Every round is proved solvable before it ships. No app, no signup, a new round every day.',
  alternates: { canonical: '/crunch' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/crunch.png', width: 1200, height: 630, alt: 'Crunch — a daily puzzle from Mind Loft' }],
    title: 'Crunch — A Daily Numbers Game',
    description: 'Six numbers, four operations, one target. Always reachable, rarely obvious. A new round from Mind Loft, daily.',
    url: '/crunch', type: 'website', siteName: 'Mind Loft',
  },
  twitter: { images: ['/og/crunch.png'], card: 'summary_large_image', title: 'Crunch — A Daily Numbers Game', description: 'Six numbers and a target. Can you get there exactly?' },
};

const gameJsonLd = {
  '@context': 'https://schema.org', '@type': 'Game', name: 'Crunch',
  alternateName: 'Rung — Daily Word Ladder', url: `${SITE_URL}/crunch`,
  description:
    'A free daily numbers game in the Countdown mould. Six numbers, the four operations, and a three-digit target. Every intermediate value must be a positive whole number, and you need not use all six. Every round is proved to have an exact solution by two independent solvers before it ships, and the difficulty is set by how many of the six the shortest solution needs: four or five on weekdays, all six on Sundays. Hitting the target exactly scores ten, within five scores seven, within ten scores five.',
  genre: ['Numbers game', 'Arithmetic puzzle', 'Puzzle'],
  gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};
const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('crunch'),
    { '@type': 'ListItem', position: 3, name: 'Crunch' },
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
          {'CRUNCH'.split('').map((ch, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, background: i === 3 ? '#b45309' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Crunch launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily numbers round. Six numbers, four operations, one target. Come back when the first round drops.
        </p>
        <a href="/daily" style={{ color: '#b45309', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function CrunchPage({ searchParams }) {
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
        <CrunchClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="crunch" stage={isStageServer('crunch', searchParams)} />
    </>
  );
}
