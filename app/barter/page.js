import { Suspense } from 'react';
import BarterClient from './BarterClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Barter launched 2026-08-14: the daily letter-trade lattice. Six words
// interlock in a 5x5 grid, every needed letter is on the board scrambled, and
// you trade two tiles at a time against a budget of par + 5, where par is the
// proven minimum. Sundays step up to a 7x7 Edition with eight words. Puzzles
// are gated by Eastern date here, so tomorrow's board (and its answer) never
// reaches the browser.

export const metadata = {
  title: 'Free Daily Letter-Trade Word Puzzle: Barter | Mind Loft',
  description:
    'A free daily word puzzle. Six words interlock in a lattice, every letter is already on the board, and you trade two tiles at a time. Green locks, yellow belongs in a crossing word, and the budget is the proven minimum number of trades plus five. Solve at par for a perfect game, with a bigger 7x7 Edition on Sundays.',
  alternates: { canonical: '/barter' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/barter.png', width: 1200, height: 630, alt: 'Barter — the daily letter-trade puzzle from Mind Loft' }],
    title: 'Barter — Trade the Letters Home',
    description:
      'Every letter the answer needs is already on the board. Trade two tiles at a time and solve the lattice at par. A new board from Mind Loft, daily.',
    url: '/barter',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/barter.png'],
    card: 'summary_large_image',
    title: 'Barter — Trade the Letters Home',
    description: 'Six interlocking words, scrambled in place. Trade tiles home against a proven par.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Barter',
  alternateName: 'Barter — Daily Letter-Trade Puzzle',
  url: `${SITE_URL}/barter`,
  description:
    'A free daily word puzzle. Six words interlock in a lattice and every letter the answer needs is already on the board, scrambled. Trade two tiles at a time: green means home and locks, yellow means the letter belongs elsewhere in a word crossing that square. The trade budget is the proven minimum (par) plus five, so solving at par is a perfect game. Sundays run a bigger 7x7 Edition with eight words.',
  genre: ['Word puzzle', 'Logic puzzle', 'Puzzle'],
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
    categoryCrumb('barter'),
    { '@type': 'ListItem', position: 3, name: 'Barter' },
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
          {'BARTER'.split('').map((ch, i) => (
            <div key={i} style={{ width: 38, height: 38, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, background: i === 5 ? '#be123c' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Barter launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily letter-trade puzzle — every letter is already on the board, and you trade two tiles at a time until the words read true. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: '#be123c', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function BarterPage({ searchParams }) {
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
        <BarterClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="barter" stage={isStageServer('barter', searchParams)} />
    </>
  );
}
