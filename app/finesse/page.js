import { Suspense } from 'react';
import FinesseClient from './FinesseClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Finesse launched 2026-09-03 as the daily double dummy: all four hands face
// up, one suit trumps, and a contract that names how many of the tricks South
// has to take. The player holds South and the dummy; the two defenders are an
// exact solver. Nothing is hidden and nothing is shuffled at play time, so the
// contract is either there or it is not, and every deal is banked only after a
// search proves it exactly makeable.
//
// The week ramps by DECK SIZE rather than by rule: four ranks a suit on Monday
// with no trumps, the full eight on the Sunday Edition.
//
// /finesse is the canonical, evergreen URL; the dated /quiz/finesse-* stubs
// canonicalize here. This server page filters live<=today before handing deals
// to the client, so future boards never reach a browser.

export const metadata = {
  title: 'Free Daily Bridge Puzzle: Finesse | Mind Loft',
  description:
    'A free daily double dummy. All four hands face up, one suit trumps, and a perfect defence. Play South and the dummy and take the tricks the contract asks for. Three rules, no bidding, no luck, and a new deal every day.',
  alternates: { canonical: '/finesse' },
  openGraph: {
    // Static share card, pre-rendered once into public/og/ (see the 2026-09-02
    // build-time note in CLAUDE.md): a new daily ships the PNG, not a route.
    images: [{ url: '/og/finesse.png', width: 1200, height: 630, alt: 'Finesse — a daily double dummy from Mind Loft' }],
    title: 'Finesse — A Daily Double Dummy',
    description:
      'All four hands face up, one suit trumps, a perfect defence. Take the tricks the contract asks for. A daily bridge-style card puzzle with no luck in it, from Mind Loft.',
    url: '/finesse',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/finesse.png'],
    card: 'summary_large_image',
    title: 'Finesse — A Daily Double Dummy',
    description:
      'Four hands face up, one suit trumps, a defence that never errs. Find the line that brings the contract home.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Finesse',
  alternateName: 'Finesse — Daily Double Dummy',
  url: `${SITE_URL}/finesse`,
  description:
    'A free daily double dummy: a bridge-style card puzzle with all four hands face up. You play South and the dummy opposite, one suit is trumps, and the contract names how many tricks you must take. The defenders are played by an exact solver, so the deal has no luck in it. Every board is proved exactly makeable before it ships, and ties break on fastest time.',
  genre: ['Card game', 'Bridge', 'Logic puzzle', 'Puzzle'],
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
    categoryCrumb('finesse'),
    { '@type': 'ListItem', position: 3, name: 'Finesse' },
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
          {'FINESSE'.split('').map((ch, i) => (
            <div key={i} style={{ width: 34, height: 34, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20, background: i === 3 ? '#4c1d95' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Finesse launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily double dummy: four hands face up, one suit trumps, and a defence that never errs. Come back when the first deal drops.
        </p>
        <a href="/daily" style={{ color: '#4c1d95', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function FinessePage({ searchParams }) {
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
        <FinesseClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="finesse" stage={isStageServer('finesse', searchParams)} />
    </>
  );
}
