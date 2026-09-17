import { Suspense } from 'react';
import YoseClient from './YoseClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Yose launched 2026-09-17 as the daily Go endgame, the eighth End Game title.
// A small board whose territories are settled, a handful of open points still
// to play, and a komi set so that perfect play wins by exactly half a point.
// You are Black; the engine plays White and never misses. The whole game tree
// is solved when the board is made (scripts/gen-yose.mjs) and again, with a
// separate engine, by scripts/verify-yose.mjs.
//
// /yose is the canonical, evergreen URL. This server page filters live<=today
// before handing boards to the client, so tomorrow's board never reaches a
// browser.
export const metadata = {
  title: 'Free Daily Go Endgame Puzzle: Yose | Mind Loft',
  description:
    'A free daily Go endgame. The territories are settled and a few points are still open. You play Black against a perfect engine, and the komi is set so that best play wins by exactly half a point, so every point counts. A new board every day and a bigger 9x9 Edition on Sundays.',
  alternates: { canonical: '/yose' },
  openGraph: {
    // Static share card (2026-09-02 rule): pre-rendered once into public/og/.
    images: [{ url: '/og/yose.png', width: 1200, height: 630, alt: 'Yose, a daily Go endgame from Mind Loft' }],
    title: 'Yose: A Daily Go Endgame',
    description:
      'A few open points, a perfect opponent, and a komi that leaves you exactly half a point. From Mind Loft, daily.',
    url: '/yose',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/yose.png'],
    card: 'summary_large_image',
    title: 'Yose: A Daily Go Endgame',
    description:
      'The territories are settled and a few points are still open. Best play wins by half a point, and any point given away loses. A new Go endgame every day.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Yose',
  alternateName: 'Yose: A Daily Go Endgame',
  url: `${SITE_URL}/yose`,
  description:
    'A free daily Go endgame: a small board with its territories settled and a few open points left. You play Black against an engine that plays perfectly, and the komi is set so best play wins by exactly half a point. Ranked on how many attempts the win took, then time.',
  genre: ['Board game', 'Go', 'Endgame puzzle', 'Puzzle'],
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
    categoryCrumb('yose'),
    { '@type': 'ListItem', position: 3, name: 'Yose' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

function ComingSoon({ first }) {
  // Rendered only if no puzzle is live yet. Never crash the route on an empty
  // visible set; show a friendly placeholder instead.
  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: "'Manrope', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 18 }}>
          {'YOSE'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 0 ? '#6b4e1e' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Yose launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily Go endgame: a few open points, a perfect opponent, and half a point to win by. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: '#1d4ed8', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function YosePage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today);
  if (!visiblePuzzles.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Suspense fallback={null}>
        <YoseClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="yose" stage={isStageServer('yose', searchParams)} />
    </>
  );
}
