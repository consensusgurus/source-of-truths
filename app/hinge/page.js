import { Suspense } from 'react';
import HingeClient from './HingeClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Hinge launched 2026-09-03 as the daily compound-word chain: six words (eight
// on the Sunday Edition), every neighbouring pair a compound or a common
// phrase read downward, the first and last word given and the letter counts of
// the rest. Any chain the vocabulary accepts counts. A solve is a flat 10, the
// clock is the score and detours (real words that do not hinge) break ties.
//
// /hinge is the canonical, evergreen URL; the dated /quiz/hinge-* stubs
// canonicalize here. This server page filters live<=today before handing
// puzzles to the client, so future chains never reach a browser.

export const metadata = {
  title: 'Free Daily Word Chain Puzzle: Hinge | Mind Loft',
  description:
    'A free daily compound-word chain. You get the first and last word; fill the words between so every pair makes a compound word or a common phrase, like fireplace, placemat, board game. Any chain that holds counts. A new chain every day and an eight-word Edition on Sundays.',
  alternates: { canonical: '/hinge' },
  openGraph: {
    // Static share card, pre-rendered once into public/og/ (see the 2026-09-02
    // build-time note in CLAUDE.md): a new daily ships the PNG, not a route.
    images: [{ url: '/og/hinge.png', width: 1200, height: 630, alt: 'Hinge — a daily word chain from Mind Loft' }],
    title: 'Hinge — A Daily Compound-Word Chain',
    description:
      'First word and last word given. Fill the chain so every pair of neighbours makes a compound word or a phrase everyone knows. Any chain that holds counts.',
    url: '/hinge',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/hinge.png'],
    card: 'summary_large_image',
    title: 'Hinge — A Daily Compound-Word Chain',
    description:
      'FIRE to PLAN in six words, every pair a compound. The clock is the score and detours break ties.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Hinge',
  alternateName: 'Hinge — Daily Word Chain',
  url: `${SITE_URL}/hinge`,
  description:
    'A free daily word chain: the first and last word are given, and every word between has to make a compound word or a common two-word phrase with its neighbours. Any chain the vocabulary accepts counts. Finish for a perfect score; ties break on fastest time, then fewest detours.',
  genre: ['Word game', 'Word puzzle', 'Puzzle'],
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
    categoryCrumb('hinge'),
    { '@type': 'ListItem', position: 3, name: 'Hinge' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

function ComingSoon({ first }) {
  // Rendered only if no puzzle is live yet. Never crash the route on an empty
  // visible set — show a friendly placeholder instead.
  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: "'Manrope', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 18 }}>
          {'HINGE'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 1 ? '#4f46e5' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Hinge launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily word chain: first and last word given, every pair between a compound or a phrase everyone knows. Come back when the first chain drops.
        </p>
        <a href="/daily" style={{ color: '#4f46e5', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function HingePage({ searchParams }) {
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
        <HingeClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="hinge" stage={isStageServer('hinge', searchParams)} />
    </>
  );
}
