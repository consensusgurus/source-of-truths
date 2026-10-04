import { Suspense } from 'react';
import JudgesClient from './JudgesClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Judges launched 2026-10-05: the two-per-row placement puzzle (Star Battle,
// two stars). It took over the two-jester boards Jesters ran Thursday to
// Sunday from 2026-08-21 to 2026-10-04, when Jesters went back to one jester a
// day. Seat two judges in every row, column and colored court, none touching.
// 10x10 Monday to Saturday, climbing by measured deduction depth, and a 12x12
// Sunday Edition. Every board is machine-verified to a unique seating that
// falls to pure deduction (scripts/verify-judges.mjs).
//
// LEAK GUARD: clientSafe() strips each board's `solution` before it reaches
// the client; the browser re-derives the seating from the regions.

export const metadata = {
  title: 'Daily Logic Puzzle, Two Per Row: Judges | Mind Loft',
  description:
    'A free daily placement puzzle in the Star Battle family: seat two judges in every row, column and colored court, with no two judges touching. Exactly one solution, pure deduction. A 10x10 bench every day and a 12x12 Sunday Edition.',
  alternates: { canonical: '/judges' },
  openGraph: {
    images: [{ url: '/og/judges.png', width: 1200, height: 630, alt: 'Judges, the daily two-per-row placement puzzle from Mind Loft' }],
    title: 'Judges: Seat the Bench, Two Per Row',
    description:
      'Two judges per row, per column, per colored court, and no two may touch. Every board is machine-verified to a single solution reachable by pure deduction. From Mind Loft.',
    url: '/judges',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/judges.png'],
    card: 'summary_large_image',
    title: 'Judges: Seat the Bench, Two Per Row',
    description:
      'Two judges per row, column and court, none touching. Exactly one solution. 12x12 on Sundays.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Judges',
  alternateName: 'Judges, Daily Two-Star Placement Puzzle',
  url: `${SITE_URL}/judges`,
  description:
    'A free daily Star Battle-style logic puzzle with two stars: seat two judges in every row, every column and every colored court, with no two judges touching, even diagonally. Monday to Saturday run 10x10 boards that climb in difficulty through the week, and the Sunday Edition is a 12x12. Every board is machine-verified to have exactly one solution reachable by pure deduction.',
  genre: ['Logic puzzle', 'Placement puzzle', 'Star Battle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('judges'),
    { '@type': 'ListItem', position: 3, name: 'Judges', item: `${SITE_URL}/judges` },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

function clientSafe(p) {
  const { solution, ...safe } = p;
  return safe;
}

function ComingSoon({ first }) {
  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: "'Manrope', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 18 }}>
          {'JUDGES'.split('').map((ch, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, background: i === 0 ? '#7c2d12' : T.ink, color: T.white }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Judges opens {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The two-per-row placement puzzle: two judges in every row, column and court, none touching, exactly one solution. Until the first bench is seated, try Jesters, one per row.
        </p>
        <a href="/jesters" style={{ color: '#7c2d12', fontWeight: 800, textDecoration: 'underline' }}>Play Jesters &rarr;</a>
      </div>
    </div>
  );
}

export default function JudgesPage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today).map(clientSafe);
  if (!visiblePuzzles.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <JudgesClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="judges" stage={isStageServer('judges', searchParams)} />
    </>
  );
}
