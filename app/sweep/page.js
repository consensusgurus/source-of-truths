import { Suspense } from 'react';
import SweepClient from './SweepClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Sweep launched 2026-08-08 as the second daily in the Arcade category, beside
// Blocks: linked from the hub puzzles row, the footer, the /daily archive, and
// the sitemap (/sweep is the canonical, evergreen URL). Rows are gated by
// Eastern date here, the same as every other daily.
//
// Sweep DOES ship its board, unlike Blocks, and it has to: the numbers a player
// reads are counted off the mine map, so a client-side minesweeper cannot exist
// without one. Every browser minesweeper ever written has the same property.
// What the gate below still guarantees is that no FUTURE day's field is ever in
// the page, which is the part that would actually matter.

export const metadata = {
  title: 'Free Daily Minesweeper With No Bottom: Sweep | Mind Loft',
  description:
    'Sweep is a free daily minesweeper that runs downward forever. Everyone digs the same field, and every field is checked before it ships so it can always be solved without guessing. One life a run, unlimited runs, and your best one takes the leaderboard.',
  alternates: { canonical: '/sweep' },
  openGraph: {
    title: 'Sweep — A Daily Minesweeper With No Bottom',
    description: 'The same field for everybody, no guessing ever required, and no bottom edge.',
    url: '/sweep',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sweep — A Daily Minesweeper With No Bottom',
    description: 'The same field for everybody, no guessing ever required, and no bottom edge.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Sweep',
  alternateName: 'Sweep — Daily Minesweeper',
  url: `${SITE_URL}/sweep`,
  description:
    'A daily minesweeper with no bottom edge. The same field for every player, proven solvable without guessing, one life a run and unlimited runs.',
  genre: ['Arcade', 'Puzzle', 'Minesweeper', 'Logic'],
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
    categoryCrumb('sweep'),
    { '@type': 'ListItem', position: 3, name: 'Sweep' },
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
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Sweep</div>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: '#3f4757', margin: '0 0 16px' }}>
          Sweep launches {first.dateLabel}. The same field for everybody, and no bottom edge.
        </p>
        <a href="/daily" style={{ display: 'inline-block', background: '#2563eb', color: '#fff', fontWeight: 800, fontSize: 14, padding: '11px 22px', borderRadius: 9, textDecoration: 'none' }}>
          Today&rsquo;s slate
        </a>
      </div>
    </div>
  );
}

export default function SweepPage({ searchParams }) {
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
        <SweepClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="sweep" stage={isStageServer('sweep', searchParams)} />
    </>
  );
}
