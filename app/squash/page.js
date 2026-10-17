import { Suspense } from 'react';
import SquashClient from './SquashClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Squash launched 2026-10-17 as a daily Arcade game, a match-three with fruit.
// Rows are gated by Eastern date here like every other daily, though a row
// carries only the frame and the par: the day's board and its refills are
// generated from its quizId in the client (lib/squash-engine.js).
// NO new-game pop-up (owner, 2026-10-17): squash is in NO_PREMIERE.

export const metadata = {
  title: 'Free Daily Match-3 Fruit Game: Squash | Mind Loft',
  description:
    'A free daily match-three fruit game. Swap fruit to line up three, set off cascades and special fruit, and beat par in 25 moves. Same board for everyone.',
  alternates: { canonical: '/squash' },
  manifest: '/api/pwa-manifest?game=squash',
  icons: {
    // Favicon is the Mind Loft mark on every page, games included (owner rule, 2026-08-31).
    // Do NOT delete this line: ANY metadata.icons object suppresses the root app/icon.png
    // inheritance, so the tab would fall back to the 16px favicon.ico alone.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/squash-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Squash' },
  openGraph: {
    images: [{ url: '/og/squash.png', width: 1200, height: 630, alt: 'Squash, a daily match-three fruit game from Mind Loft' }],
    title: 'Squash: A Daily Match-3 Fruit Game',
    description: 'Swap fruit, line up three of a kind, and chase the cascades. Same board for everybody, and your best run counts.',
    url: '/squash',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/squash.png'],
    card: 'summary_large_image',
    title: 'Squash: A Daily Match-3 Fruit Game',
    description: 'Swap fruit, line up three of a kind, and chase the cascades. Same board for everybody.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Squash',
  alternateName: 'Squash: Daily Match-3 Fruit Game',
  url: `${SITE_URL}/squash`,
  description:
    'A free daily match-three puzzle game. Swap neighbouring fruit to line up three or more of a kind; matches squash, fruit falls, and new fruit drops in. Four in a line makes a slicer, an L or T makes a bomb, and five makes a punch bowl that clears a whole fruit. Everyone plays the same board with the same refills, in 25 moves (30 on the Sunday Edition\'s 9x9 board), and your best run of the day counts.',
  genre: ['Arcade', 'Match-3', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/squash.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('squash'),
    { '@type': 'ListItem', position: 3, name: 'Squash' },
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
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Squash</div>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: '#3f4757', margin: '0 0 16px' }}>
          Squash launches {first.dateLabel}. The same fruit board for everybody.
        </p>
        <a href="/" style={{ display: 'inline-block', background: '#2563eb', color: '#fff', fontWeight: 800, fontSize: 14, padding: '11px 22px', borderRadius: 9, textDecoration: 'none' }}>
          Today&rsquo;s slate
        </a>
      </div>
    </div>
  );
}

export default function SquashPage({ searchParams }) {
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
        <SquashClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="squash" stage={isStageServer('squash', searchParams)} />
    </>
  );
}
