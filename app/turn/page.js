import { Suspense } from 'react';
import TurnClient from './TurnClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Turn launched 2026-08-05 as the 45th daily: linked from the hub puzzles row,
// the footer, the /daily archive, and the sitemap (/turn is the canonical,
// evergreen URL). Weekdays leave ten empty squares; Sundays leave twelve.
// Puzzles are gated by Eastern date here, so tomorrow's board and the square
// that wins it never reach the browser.

export const metadata = {
  title: 'Free Daily Othello Endgame Puzzle: Turn | Mind Loft',
  description:
    'A free daily Othello endgame. Ten squares left, the game is already won for you, and exactly one square keeps it. Play the wrong one and there is no take-back: a solver that reads the position to the last disc plays out the rest, so the win never comes back. Flipping the fewest discs is the right habit, and some days it is the losing move.',
  alternates: { canonical: '/turn' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/turn.png', width: 1200, height: 630, alt: 'Turn — a daily Othello endgame from Mind Loft' }],
    title: 'Turn — A Daily Othello Endgame',
    description:
      'One square still wins it. Flip the whole row or flip one disc: only one of them holds. A new position from Mind Loft, daily.',
    url: '/turn',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/turn.png'],
    card: 'summary_large_image',
    title: 'Turn — A Daily Othello Endgame',
    description: 'Ten squares left, you are winning, and one square keeps it. No take-backs.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Turn',
  alternateName: 'Turn — Daily Othello Endgame Puzzle',
  url: `${SITE_URL}/turn`,
  description:
    'A free daily Othello (Reversi) puzzle, picked up at the endgame. Each position is a real, reachable board with you to move and the game already won, with exactly one square that keeps the win and every other square ending level or behind. A wrong square is not refused: a solver that reads the position to the last disc plays out the rest, so the win is gone for good. A player with no legal square passes, which is most of the tactics at this stage. The win scores ten, a loss one, and ties break on fewest errors then fastest time. Weekdays leave ten empty squares and Sundays twelve.',
  genre: ['Othello puzzle', 'Reversi puzzle', 'Strategy puzzle', 'Puzzle'],
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
    categoryCrumb('turn'),
    { '@type': 'ListItem', position: 3, name: 'Turn' },
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
          {'TURN'.split('').map((ch, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, background: i === 3 ? '#226218' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Turn launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily Othello endgame. Ten squares left, you are winning, and one square keeps it. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: T.blueDark, fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function TurnPage({ searchParams }) {
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
        <TurnClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="turn" stage={isStageServer('turn', searchParams)} />
    </>
  );
}
