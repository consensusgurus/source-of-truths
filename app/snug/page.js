import { Suspense } from 'react';
import SnugClient from './SnugClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Snug launched 2026-09-13 as the daily fit-the-shapes puzzle: a board with a
// few squares missing and a handful of pieces that fill it exactly one way.
// Its lane is SPATIAL: turn a piece in your head, find the corner it must take,
// and the rest falls in. A solve scores a flat 10 and the daily leaderboard is
// a straight race on the clock, the same manners as Sixes.
//
// /snug is the canonical, evergreen URL; the dated /quiz/snug-* stubs
// canonicalize here. This server page filters live<=today before handing
// puzzles to the client, so future boards and their solutions never reach a
// browser. The kids translation lives at /kids/fitit.

export const metadata = {
  title: 'Free Daily Shape-Fitting Puzzle: Snug | Mind Loft',
  description:
    'A free daily shape-fitting puzzle. Fit every piece into the board, turning and flipping as you need, so it is covered with nothing left over. The pieces only fit one way. A new board every day and a bigger Edition on Sundays.',
  alternates: { canonical: '/snug' },
  openGraph: {
    // Static share card (2026-09-02 rule): pre-rendered once into public/og/.
    images: [{ url: '/og/snug.png', width: 1200, height: 630, alt: 'Snug, a daily shape-fitting puzzle from Mind Loft' }],
    title: 'Snug: A Daily Shape-Fitting Puzzle',
    description:
      'Fit every piece into the board so it is covered exactly, turning and flipping as you go. The pieces only fit one way. From Mind Loft, daily.',
    url: '/snug',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/snug.png'],
    card: 'summary_large_image',
    title: 'Snug: A Daily Shape-Fitting Puzzle',
    description:
      'Fit every piece into the board so it is covered exactly, turning and flipping as you go. The pieces only fit one way. A clean solve wins and the clock breaks the tie.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Snug',
  alternateName: 'Snug: Daily Shape-Fitting Puzzle',
  url: `${SITE_URL}/snug`,
  description:
    'A free daily shape-fitting puzzle: a board with a few squares missing and a set of pieces that cover it exactly. Turn and flip the pieces as you need; every board has exactly one way to fit. Solve it for a perfect score, and ties break on fastest time.',
  genre: ['Logic puzzle', 'Spatial puzzle', 'Tiling puzzle', 'Puzzle'],
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
    categoryCrumb('snug'),
    { '@type': 'ListItem', position: 3, name: 'Snug' },
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
          {'SNUG'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 1 ? '#1d4ed8' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Snug launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily shape-fitting puzzle: fit every piece into the board so nothing is left over. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: '#1d4ed8', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function SnugPage({ searchParams }) {
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
        <SnugClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="snug" stage={isStageServer('snug', searchParams)} />
    </>
  );
}
