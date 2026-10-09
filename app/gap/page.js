import { Suspense } from 'react';
import GapClient from './GapClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { PROBLEM_MAP } from './problems';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Gap launched 2026-10-09, one of the three games built for the Math Gauntlet:
// twenty problems a day in five rounds of four, warm-up to flat out, twenty
// seconds each and one life. Built exactly like app/blitzed/page.js:
// the problem bank is resolved HERE, on the server, and only the picked day's
// twenty ship to the browser, with the generator fields (fam, sig) stripped on
// the way out.

export const metadata = {
  title: 'Free Daily Missing-Number Math Game: Gap | Mind Loft',
  description:
    'A free daily mental math game where every line is an equation with one number missing, like 7 × ? = 56. Twenty problems climb from one-step sums to two-step lines, percentages, squares and roots. Twenty seconds each, one life, everyone plays the same twenty. No app, no signup, new problems every day.',
  alternates: { canonical: '/gap' },
  openGraph: {
    images: [{ url: '/og/gap.png', width: 1200, height: 630, alt: 'Gap, a daily puzzle from Mind Loft' }],
    title: 'Gap, The Daily Missing-Number Ladder',
    description: 'Twenty equations, one number missing from each, twenty seconds each, one life. Can you work them backwards?',
    url: '/gap', type: 'website', siteName: 'Mind Loft',
  },
  twitter: { images: ['/og/gap.png'], card: 'summary_large_image', title: 'Gap, The Daily Missing-Number Ladder', description: 'Twenty equations, one number missing from each, twenty seconds each, one life. Can you work them backwards?' },
};

const gameJsonLd = {
  '@context': 'https://schema.org', '@type': 'Game', name: 'Gap',
  alternateName: 'Gap, Missing-number mental math', url: `${SITE_URL}/gap`,
  description:
    'Twenty equations a day with one number taken out of each, like 7 × ? = 56, climbing from one-step sums to two-step lines, percentages, squares, cubes and roots in five rounds of four. A wrong answer, or a twenty-second clock at zero, ends the run, and every problem cleared is a point. Every wrong option is a real mistake, most often running the operation forwards, so the answer cannot be picked out by its size or its last digit. Everyone plays the same twenty in the same order each day.',
  genre: ['Educational', 'Puzzle', 'Mental math'],
  gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};
const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('gap'),
    { '@type': 'ListItem', position: 3, name: 'Gap' },
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
          {'GAP'.split('').map((ch, i) => (
            <div key={i} style={{ width: 38, height: 38, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, background: i === 0 ? '#9d174d' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Gap launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          Twenty equations a day, one number missing from each, twenty seconds each, one life. Come back when the first run drops.
        </p>
        <a href="/daily" style={{ color: '#9d174d', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function GapPage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today);
  if (!visiblePuzzles.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  const picked = (forceNum && visiblePuzzles.find((p) => p.num === forceNum)) || visiblePuzzles[visiblePuzzles.length - 1];
  const problems = picked.qids
    .map((id) => PROBLEM_MAP[id])
    .filter(Boolean)
    .map(({ tier, q, choices, correct }) => ({ tier, q, choices, correct }));
  // No `sunday`: Gap has no Sunday Edition (see the note in puzzles.js).
  const lightPuzzles = visiblePuzzles.map(({ num, quizId, live, dateLabel }) => ({ num, quizId, live, dateLabel }));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <GapClient key={picked.num} puzzles={lightPuzzles} problemsByNum={{ [picked.num]: problems }} forceNum={forceNum} />
      </Suspense>
      <StageTail self="gap" stage={isStageServer('gap', searchParams)} />
    </>
  );
}
