import { Suspense } from 'react';
import QueenClient from './QueenClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Queen launched 2026-08-21 as a daily: linked from the hub puzzles row, the
// footer, the /daily archive, and the sitemap (/queen is the canonical,
// evergreen URL). The promotion budget ramps through the week and the Sunday
// Edition is a win in twelve. Puzzles are gated by Eastern date here, AND the
// key move is STRIPPED before the client sees a board, so neither tomorrow's
// position nor any day's answer ever reaches the browser.

export const metadata = {
  title: 'Free Daily Chess Endgame (King and Pawn): Queen | Mind Loft',
  description:
    'A free daily king-and-pawn endgame. White to move with a proven promotion in a fixed number of moves, exactly one first move that keeps it, and a perfect tablebase defence. Opposition, spare tempi, the square of the pawn: the endgame every chess player is told to learn first, one position a day.',
  alternates: { canonical: '/queen' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/queen.png', width: 1200, height: 630, alt: 'Queen — a daily king-and-pawn endgame from Mind Loft' }],
    title: 'Queen — A Daily Pawn Endgame',
    description:
      'Walk the pawn in against a perfect defence. One move keeps the win and every other throws it away. A new position from Mind Loft, daily.',
    url: '/queen',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/queen.png'],
    card: 'summary_large_image',
    title: 'Queen — A Daily Pawn Endgame',
    description: 'King and pawn against king. One move keeps the win.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Queen',
  alternateName: 'Queen — Daily King and Pawn Endgame',
  url: `${SITE_URL}/queen`,
  description:
    'A free daily chess endgame puzzle. Each position is a king and one pawn against a bare king, with a tablebase-proven safe promotion in a fixed number of moves and exactly one first move that keeps it. Tap a piece to see its legal squares, then walk the whole win in against a perfect defence: an unsafe promotion or a stalemate is the draw it is over the board. A clean solve earns a perfect score and ties break on fastest time. The budget deepens through the week and the Sunday Edition is a win in twelve.',
  genre: ['Chess puzzle', 'Logic puzzle', 'Puzzle'],
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
    categoryCrumb('queen'),
    { '@type': 'ListItem', position: 3, name: 'Queen' },
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
          {'QUEEN'.split('').map((ch, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, background: i === 0 ? '#a16207' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Queen launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily king-and-pawn endgame. Walk the pawn to the eighth rank against a perfect defence, with only one move that keeps the win. Come back when the first position drops.
        </p>
        <a href="/daily" style={{ color: '#a16207', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function QueenPage({ searchParams }) {
  const today = etTodayServer();
  // The key move never ships: the client computes everything it needs from the
  // position itself, so stripping keyUci/keySan here keeps the answer out of
  // the page payload entirely (Queen is a keepsAnswer game). The strip is a
  // rest-pattern so `sunday` and every other field survives it.
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today)
    .map(({ keyUci, keySan, ...rest }) => rest);
  if (!visiblePuzzles.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <QueenClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="queen" stage={isStageServer('queen', searchParams)} />
    </>
  );
}
