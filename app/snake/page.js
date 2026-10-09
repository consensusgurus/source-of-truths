import { Suspense } from 'react';
import SnakeClient from './SnakeClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Snake launched 2026-10-07 as the third daily Arcade game, beside Blocks and
// Sweep. Rows are gated by Eastern date here like every other daily, though a
// row carries only the frame: the day's apple order is generated from its
// quizId in the client (lib/snake-engine.js).

export const metadata = {
  title: 'Free Daily Snake Game: Same Apples for Everyone | Mind Loft',
  description:
    'Snake is a free daily snake game. Everyone gets the same apples in the same order, so the leaderboard compares play and not luck. The edges wrap, the pace never speeds up, and you can play as many runs as you like with your best one scored. A Sunday Edition where every apple grows you by two.',
  alternates: { canonical: '/snake' },
  openGraph: {
    images: [{ url: '/og/snake.png', width: 1200, height: 630, alt: 'Snake, a daily snake game from Mind Loft' }],
    title: 'Snake: A Daily Snake Game',
    description: 'Same apples, same order, for everybody. The edges wrap, it never speeds up, and your best run counts.',
    url: '/snake',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/snake.png'],
    card: 'summary_large_image',
    title: 'Snake: A Daily Snake Game',
    description: 'Same apples, same order, for everybody. The edges wrap, it never speeds up, and your best run counts.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Snake',
  alternateName: 'Snake, Daily Snake Game',
  url: `${SITE_URL}/snake`,
  description:
    'A daily snake game. The same apple order for every player, wrapping edges, a fixed pace, and unlimited runs with your best one scored.',
  genre: ['Arcade', 'Snake'],
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
    categoryCrumb('snake'),
    { '@type': 'ListItem', position: 3, name: 'Snake' },
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
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Snake</div>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: '#3f4757', margin: '0 0 16px' }}>
          Snake launches {first.dateLabel}. Same apples, same order, for everybody.
        </p>
        <a href="/" style={{ display: 'inline-block', background: '#2563eb', color: '#fff', fontWeight: 800, fontSize: 14, padding: '11px 22px', borderRadius: 9, textDecoration: 'none' }}>
          Today&rsquo;s slate
        </a>
      </div>
    </div>
  );
}

export default function SnakePage({ searchParams }) {
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
        <SnakeClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="snake" stage={isStageServer('snake', searchParams)} />
    </>
  );
}
