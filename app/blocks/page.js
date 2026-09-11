import { Suspense } from 'react';
import BlocksClient from './BlocksClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Blocks launched 2026-08-08 as the daily Arcade game: linked from the hub
// puzzles row, the footer, the /daily archive, and the sitemap (/blocks is the
// canonical, evergreen URL). Weekdays drop into a 10-wide well; Sundays narrow
// it to 8. Rows are gated by Eastern date here, the same as every other daily,
// though Blocks leaks less than most by construction: the row carries only the
// frame, and the day's shape order is generated from its quizId in the client.

export const metadata = {
  title: 'Free Daily Falling-Shapes Puzzle: Blocks | Mind Loft',
  description:
    'Blocks is a free daily falling-shapes puzzle. Everyone gets the same shapes in the same order, so the leaderboard compares decisions and not luck. Play as many runs as you like and your best one takes the board, it never speeds up, and you can pause and come back whenever you like. Nine shapes: the classic seven plus a corner and a plus.',
  alternates: { canonical: '/blocks' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/blocks.png', width: 1200, height: 630, alt: 'Blocks — a daily falling-shapes puzzle from Mind Loft' }],
    title: 'Blocks — A Daily Falling-Shapes Puzzle',
    description: 'Same shapes, same order, for everybody. Unlimited runs, best one counts, and it never speeds up.',
    url: '/blocks',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/blocks.png'],
    card: 'summary_large_image',
    title: 'Blocks — A Daily Falling-Shapes Puzzle',
    description: 'Same shapes, same order, for everybody. Unlimited runs, best one counts, and it never speeds up.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Blocks',
  alternateName: 'Blocks — Daily Falling-Shapes Puzzle',
  url: `${SITE_URL}/blocks`,
  description:
    'A daily falling-shapes puzzle. The same shape order for every player, unlimited runs with your best one scored, a fixed drop rate and a short well.',
  genre: ['Arcade', 'Puzzle', 'Falling blocks'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('blocks'),
    { '@type': 'ListItem', position: 3, name: 'Blocks' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

function ComingSoon({ first }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 420, width: '100%', background: '#fff', border: '2px solid #0b0d12', borderRadius: 12, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Blocks</div>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: '#3f4757', margin: '0 0 16px' }}>
          Blocks launches {first.dateLabel}. Same shapes, same order, for everybody.
        </p>
        <a href="/daily" style={{ display: 'inline-block', background: '#2563eb', color: '#fff', fontWeight: 800, fontSize: 14, padding: '11px 22px', borderRadius: 9, textDecoration: 'none' }}>
          Today&rsquo;s slate
        </a>
      </div>
    </div>
  );
}

export default function BlocksPage({ searchParams }) {
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
        <BlocksClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="blocks" stage={isStageServer('blocks', searchParams)} />
    </>
  );
}
