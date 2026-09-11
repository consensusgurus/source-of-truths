import { Suspense } from 'react';
import FourClient from './FourClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Four launched 2026-07-30 as the 33rd daily: linked from the hub puzzles row,
// the footer, the /daily archive, and the sitemap (/four is the canonical,
// evergreen URL). Weekdays are a forced win in four of your moves; Sundays step
// up to five. Puzzles are gated by Eastern date here, so tomorrow's board (and
// the winning column that comes with it) never reaches the browser.

export const metadata = {
  title: 'Free Daily Connect Four Puzzle: Four | Mind Loft',
  description:
    'A free daily Connect Four puzzle. The position is already won for you, in four moves, and exactly one column keeps it. Drop the wrong one and there is no take-back: a perfect engine plays the game out, so the win never comes back. Keep a streak, and Sundays step up to a win in five.',
  alternates: { canonical: '/four' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/four.png', width: 1200, height: 630, alt: 'Four — a daily Connect Four puzzle from Mind Loft' }],
    title: 'Four — A Daily Connect Four Puzzle',
    description:
      'One column wins. Every other drop throws it away, and the engine does not give it back. A new position from Mind Loft, daily.',
    url: '/four',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/four.png'],
    card: 'summary_large_image',
    title: 'Four — A Daily Connect Four Puzzle',
    description: 'A forced win in four, and only one column keeps it. No take-backs.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Four',
  alternateName: 'Four — Daily Connect Four Puzzle',
  url: `${SITE_URL}/four`,
  description:
    'A free daily Connect Four puzzle. Each position is a real, reachable board with you to move and a forced win, with exactly one column that keeps it and every other drop losing it. A wrong drop is not refused: a perfect solver plays the rest of the game, so the win is gone for good and you play on for a draw. The win scores ten, a draw four, a loss one, and ties break on fewest wrong drops then fastest time. Weekdays are a win in four and Sundays a win in five.',
  genre: ['Connect Four puzzle', 'Logic puzzle', 'Puzzle'],
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
    categoryCrumb('four'),
    { '@type': 'ListItem', position: 3, name: 'Four' },
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
          {'FOUR'.split('').map((ch, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, background: i === 3 ? T.blueDark : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Four launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily Connect Four position. A forced win is already on the board and one column keeps it. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: T.blueDark, fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function FourPage({ searchParams }) {
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
        <FourClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="four" stage={isStageServer('four', searchParams)} />
    </>
  );
}
