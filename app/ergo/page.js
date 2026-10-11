import { Suspense } from 'react';
import ErgoClient from './ErgoClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Ergo launched 2026-10-11 as the daily conditional-logic sort: a small cast,
// a handful of if-then rules, one fact for today, and nine statements (twelve
// on Sundays) to file as must, could or cannot be true. It leads the Judged
// run (owner, 2026-10-10).
//
// The bank carries no answer key. app/ergo/engine.js enumerates every lineup
// the rules and the fact allow and classifies each statement in the browser.
// Like Docket, the copy never names the standardized test this reasoning is
// drawn from.

export const metadata = {
  title: 'Daily If-Then Logic Puzzle: Ergo | Mind Loft',
  description:
    'A free daily conditional-logic puzzle. A few if-then rules, one fact for today, and nine statements to sort into must be true, could be true and cannot be true. Chain the rules, flip them, and spot the ones running backwards. Twelve on Sundays.',
  alternates: { canonical: '/ergo' },
  openGraph: {
    images: [{ url: '/og/ergo.png', width: 1200, height: 630, alt: 'Ergo, a daily if-then logic puzzle from Mind Loft' }],
    title: 'Ergo: Sort the If-Then Statements',
    description: 'A few rules, one fact, nine statements. Must, could or cannot? A new board every day, from Mind Loft.',
    url: '/ergo',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/ergo.png'],
    card: 'summary_large_image',
    title: 'Ergo: Sort the If-Then Statements',
    description: 'A few rules, one fact, nine statements. Must, could or cannot?',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Ergo',
  alternateName: 'Ergo, Daily Conditional Logic Puzzle',
  url: `${SITE_URL}/ergo`,
  description:
    'A free daily conditional reasoning puzzle. Each day gives a small cast, a handful of if-then rules about who does what, and one fact for today. Sort nine statements into must be true, could be true and cannot be true. Every verdict is proved by enumerating every lineup the rules allow.',
  genre: ['Logic puzzle', 'Deduction puzzle', 'Reasoning game', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/ergo.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('ergo'),
    { '@type': 'ListItem', position: 3, name: 'Ergo' },
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
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Ergo opens {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          A few if-then rules, one fact, and nine statements to sort. Come back for the first board.
        </p>
        <a href="/" style={{ color: '#5b3a9e', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function ErgoPage({ searchParams }) {
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
        <ErgoClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="ergo" stage={isStageServer('ergo', searchParams)} />
    </>
  );
}
