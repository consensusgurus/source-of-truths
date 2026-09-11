import { Suspense } from 'react';
import EncoreClient from './EncoreClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Encore launched 2026-08-27 as the big-grid companion to Emcee: where Emcee is
// a 5x5 mini you finish in a minute, Encore is a 9x9 on weekdays (about 26
// answers) and an 11x11 Sunday Edition (about 44). Linked from the daily strip,
// the /daily archive and the sitemap; /encore is the canonical, evergreen URL.
//
// The server filters live<=today BEFORE handing puzzles to the client, so
// tomorrow's grid and its answers never ship to a browser.

export const metadata = {
  title: 'Free Daily Crossword: Encore | Mind Loft',
  description:
    'A free daily crossword: a 9x9 grid of everyday words with fair Across and Down clues, fully checked so every letter is confirmed by a crossing. The grid checks itself when the last square lands, and Sundays step up to 11x11.',
  alternates: { canonical: '/encore' },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Encore' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/encore.png', width: 1200, height: 630, alt: 'Encore — the daily crossword from Mind Loft' }],
    title: 'Encore — A Daily Crossword',
    description:
      'The big grid, every day: nine by nine, around twenty-six answers, everyday words and fair clues. A new crossword from Mind Loft, daily.',
    url: '/encore',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/encore.png'],
    card: 'summary_large_image',
    title: 'Encore — A Daily Crossword',
    description:
      'The big grid, every day: nine by nine, around twenty-six answers, everyday words and fair clues.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Encore',
  alternateName: 'Encore — Daily Crossword',
  url: `${SITE_URL}/encore`,
  description:
    'A free daily crossword: a 9x9 grid of everyday words with numbered Across and Down clues, fully checked so every square belongs to both an across and a down answer. The grid checks itself the moment the last square is filled, a clean fast solve tops the daily leaderboard, and the Sunday Edition steps up to 11x11.',
  genre: ['Word puzzle', 'Crossword', 'Puzzle'],
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
    categoryCrumb('encore'),
    { '@type': 'ListItem', position: 3, name: 'Encore' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

function ComingSoon({ first }) {
  // Rendered only if no puzzle is live yet (before the first drop). Never crash
  // the route on an empty visible set — show a friendly placeholder instead.
  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: "'Manrope', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 18 }}>
          {'ENCORE'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 0 || i === 5 ? '#1d4ed8' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Encore launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily crossword, nine by nine. Everyday words, fair clues, a few minutes well spent. Come back when the first grid drops.
        </p>
        <a href="/daily" style={{ color: '#1d4ed8', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function EncorePage({ searchParams }) {
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
        <EncoreClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="encore" stage={isStageServer('encore', searchParams)} />
    </>
  );
}
