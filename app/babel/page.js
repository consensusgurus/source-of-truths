import { Suspense } from 'react';
import BabelClient from './BabelClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Babel launched 2026-08-02 as one of the daily puzzles: linked from the daily
// strip, the footer, the /daily archive, and the sitemap (/babel is the
// canonical, evergreen URL). One word tile endgame a day: the bag is empty, you
// hold five tiles and your opponent holds the rest, and the last few plays
// decide the spread.

export const metadata = {
  title: 'Daily Word Tile Endgame Puzzle, The Bag Is Empty: Babel | Mind Loft',
  description:
    'A free daily word puzzle for endgame players. The bag is empty, so your opponent’s rack is not a secret: it is the bag minus the board minus your own tiles. Race them out or block the lane they need, and beat the solver’s benchmark on spread.',
  alternates: { canonical: '/babel' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/babel.png', width: 1200, height: 630, alt: 'Babel — the daily word tile endgame from Mind Loft' }],
    title: 'Babel — The Daily Word Tile Endgame',
    description:
      'Five tiles, no bag, and one exchange left. Their rack is knowable, so the only question is whether to race or block. From Mind Loft.',
    url: '/babel',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/babel.png'],
    card: 'summary_large_image',
    title: 'Babel — The Daily Word Tile Endgame',
    description: 'The bag is empty and their rack is knowable. Go out first, or make them sit on a tile they cannot play.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Babel',
  alternateName: 'Babel — Daily Word Tile Endgame Puzzle',
  url: `${SITE_URL}/babel`,
  description:
    'A free daily word puzzle: a word tile game picked up at the very end. The bag is empty, the player holds five tiles (six in the Sunday Edition) and the opponent holds the rest, so the opponent’s rack can be deduced exactly from the bag, the board and your own rack. Scoring is by spread, and every position ships with a benchmark achieved by the same solver that plays the defence.',
  genre: ['Word puzzle', 'Puzzle', 'Strategy puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/games/hero/babel.png`,
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
    categoryCrumb('babel'),
    { '@type': 'ListItem', position: 3, name: 'Babel' },
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
          {'BABEL'.split('').map((ch, i) => (
            <div key={i} style={{ width: 42, height: 42, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 25, background: i === 0 ? '#14532d' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Babel launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily word tile endgame. Empty bag, five tiles, and one exchange left to win.
        </p>
        <a href="/daily" style={{ color: '#14532d', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function BabelPage({ searchParams }) {
  const today = etTodayServer();
  // Strip `foe` on the way out. The client re-derives the opponent's rack from
  // the bag, the board and the player's own tiles, which is the same sum the
  // player is being asked to do, so the browser never receives anything the
  // player could not work out at the table. The banked value stays in the
  // module purely so scripts/verify-babel.mjs can check the derivation.
  const visiblePuzzles = PUZZLES
    .filter((p) => p.live <= today)
    .map(({ foe, ...rest }) => rest);
  if (!visiblePuzzles.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <BabelClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="babel" stage={isStageServer('babel', searchParams)} />
    </>
  );
}
