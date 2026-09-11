import { Suspense } from 'react';
import BlitzClient from './BlitzClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { PROBLEM_MAP } from './problems';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Blitz launched 2026-08-10. Twenty mental-arithmetic problems a day in five
// rounds of four, warm-up to flat out, fifteen seconds each and one life. The
// problem bank is resolved HERE, on the server, and only the picked day's
// twenty ship to the browser, so the rest of the bank never reaches a client.
// The generator fields (fam, sig) are stripped on the way out: they are
// authoring metadata for scripts/verify-blitz.mjs and no business of the page.

export const metadata = {
  title: 'Free Daily Mental Math Game: Blitz | Mind Loft',
  description:
    'A free daily mental arithmetic game. Twenty problems climb from two-digit addition to two-digit multiplication, percentages and cubes. Fifteen seconds each, one life, everyone plays the same twenty. No app, no signup, new problems every day.',
  alternates: { canonical: '/blitz' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/blitz.png', width: 1200, height: 630, alt: 'Blitz — a daily puzzle from Mind Loft' }],
    title: 'Blitz — The Daily Mental Math Ladder',
    description: 'Twenty problems, fifteen seconds each, one life. How far up can you get in your head?',
    url: '/blitz', type: 'website', siteName: 'Mind Loft',
  },
  twitter: { images: ['/og/blitz.png'], card: 'summary_large_image', title: 'Blitz — The Daily Mental Math Ladder', description: 'Twenty problems, fifteen seconds each, one life. No calculator, no second chances.' },
};

const gameJsonLd = {
  '@context': 'https://schema.org', '@type': 'Game', name: 'Blitz',
  alternateName: 'Blitz — Daily Mental Math', url: `${SITE_URL}/blitz`,
  description:
    'A free daily mental arithmetic game. Twenty multiple-choice problems climb from two-digit addition and the times tables to two-digit multiplication, awkward percentages, order of operations and cubes, in five rounds of four. A wrong answer, or a fifteen-second clock at zero, ends the run, and every problem cleared is a point. Every wrong option on the board is a real arithmetic mistake rather than filler, so the answer cannot be picked out by its last digit or its size. Everyone plays the same twenty problems in the same order each day, and the daily leaderboard ranks the longest runs with ties broken by time.',
  genre: ['Educational', 'Puzzle', 'Mental math'],
  gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};
const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('blitz'),
    { '@type': 'ListItem', position: 3, name: 'Blitz' },
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
          {'BLITZ'.split('').map((ch, i) => (
            <div key={i} style={{ width: 38, height: 38, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, background: i === 0 ? '#657512' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Blitz launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          Twenty problems a day, fifteen seconds each, one life. Come back when the first run drops.
        </p>
        <a href="/daily" style={{ color: '#657512', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function BlitzPage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today);
  if (!visiblePuzzles.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  // Same pick logic as the client: the forced archive day if it is visible,
  // else today's. Only the picked day's problems are resolved and shipped.
  const picked = (forceNum && visiblePuzzles.find((p) => p.num === forceNum)) || visiblePuzzles[visiblePuzzles.length - 1];
  const problems = picked.qids
    .map((id) => PROBLEM_MAP[id])
    .filter(Boolean)
    .map(({ tier, q, choices, correct }) => ({ tier, q, choices, correct }));
  // No `sunday`: Blitz has no Sunday Edition (see the note in puzzles.js).
  const lightPuzzles = visiblePuzzles.map(({ num, quizId, live, dateLabel }) => ({ num, quizId, live, dateLabel }));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <BlitzClient key={picked.num} puzzles={lightPuzzles} problemsByNum={{ [picked.num]: problems }} forceNum={forceNum} />
      </Suspense>
      <StageTail self="blitz" stage={isStageServer('blitz', searchParams)} />
    </>
  );
}
