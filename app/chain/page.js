import { Suspense } from 'react';
import ChainClient from './ChainClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Chain launched 2026-08-04 as the 44th daily: linked from the hub puzzles row,
// the footer, the /daily archive, and the sitemap (/chain is the canonical,
// evergreen URL). Weekdays are a 3 by 5 board; Sundays step up to 5 by 5.
// Puzzles are gated by Eastern date here, so tomorrow's board and the edge that
// wins it never reach the browser.

export const metadata = {
  title: 'Free Daily Dots and Boxes Puzzle: Chain | Mind Loft',
  description:
    'A free daily dots-and-boxes endgame. The boxes are counted, you are already winning, and exactly one edge keeps it. Draw the wrong one and there is no take-back: a perfect engine plays the game out, so the win never comes back. The free box is usually a trap, and some days it is not.',
  alternates: { canonical: '/chain' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/chain.png', width: 1200, height: 630, alt: 'Chain — a daily dots and boxes endgame from Mind Loft' }],
    title: 'Chain — A Daily Dots and Boxes Endgame',
    description:
      'One edge still wins it. Take the free box and you may have just lost the board. A new position from Mind Loft, daily.',
    url: '/chain',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/chain.png'],
    card: 'summary_large_image',
    title: 'Chain — A Daily Dots and Boxes Endgame',
    description: 'You are winning, one edge keeps it, and the free box is bait. No take-backs.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Chain',
  alternateName: 'Chain — Daily Dots and Boxes Puzzle',
  url: `${SITE_URL}/chain`,
  description:
    'A free daily dots-and-boxes puzzle, picked up at the endgame. Each position is a real, reachable board with you to move and the game already won, with exactly one edge that keeps the win and every other edge losing it. A wrong edge is not refused: a perfect solver plays the rest of the game, so the win is gone for good. Completing a box claims it and grants another move, and the board carries an odd number of boxes so a tie is impossible. The win scores ten, a loss one, and ties break on fewest errors then fastest time. Weekdays are a 3 by 5 board and Sundays a 5 by 5.',
  genre: ['Dots and boxes puzzle', 'Strategy puzzle', 'Puzzle'],
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
    categoryCrumb('chain'),
    { '@type': 'ListItem', position: 3, name: 'Chain' },
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
          {'CHAIN'.split('').map((ch, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, background: i === 4 ? '#4a044e' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Chain launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily boxes endgame. The safe moves are gone, you are winning, and one edge keeps it. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: T.blueDark, fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function ChainPage({ searchParams }) {
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
        <ChainClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="chain" stage={isStageServer('chain', searchParams)} />
    </>
  );
}
