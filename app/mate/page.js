import { Suspense } from 'react';
import MateClient from './MateClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Mate launched 2026-07-30 as the 32nd daily: linked from the hub puzzles row,
// the footer, the /daily archive, and the sitemap (/mate is the canonical,
// evergreen URL). Weekdays are a mate in two; Sundays step up to a mate in three
// Edition. Puzzles are gated by Eastern date here, so tomorrow's position (and
// the solution tree that comes with it) never reaches the browser.

export const metadata = {
  title: 'Free Daily Chess Puzzle (Mate in Two): Mate | Mind Loft',
  description:
    'A free daily chess puzzle. White to play and force checkmate in two, with exactly one first move that works. Tap a piece and its legal squares light up, so no chess notation is needed. Play the line out against Black’s best defence, keep a streak, and Sundays step up to a mate in three.',
  alternates: { canonical: '/mate' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/mate.png', width: 1200, height: 630, alt: 'Mate — a daily chess puzzle from Mind Loft' }],
    title: 'Mate — A Daily Chess Puzzle',
    description:
      'White to play and mate. One key move works and every other fails. A new position from Mind Loft, daily.',
    url: '/mate',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/mate.png'],
    card: 'summary_large_image',
    title: 'Mate — A Daily Chess Puzzle',
    description: 'White to play and force checkmate in two. Only one move does it.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Mate',
  alternateName: 'Mate — Daily Chess Puzzle',
  url: `${SITE_URL}/mate`,
  description:
    'A free daily chess mate puzzle. Each position has White to move and a forced checkmate in a fixed number of moves, with exactly one first move that works and every alternative refuted. Tap a piece to see its legal squares, then play the whole line: Black answers with its best defence and you deliver the mate. A clean solve earns a perfect score, and ties break on fewest misses then fastest time. Weekdays are mate in two and Sundays are mate in three.',
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
    categoryCrumb('mate'),
    { '@type': 'ListItem', position: 3, name: 'Mate' },
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
          {'MATE'.split('').map((ch, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, background: i === 3 ? '#6b4423' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Mate launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily chess endgame. White to play and force checkmate, with only one move that does it. Come back when the first position drops.
        </p>
        <a href="/daily" style={{ color: '#6b4423', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function MatePage({ searchParams }) {
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
        <MateClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="mate" stage={isStageServer('mate', searchParams)} />
    </>
  );
}
