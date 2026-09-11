import { Suspense } from 'react';
import ShardsClient from './ShardsClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Shards launched 2026-07-24 as a daily puzzle: linked from the daily strip, the
// footer, the /daily archive, and the sitemap (/shards is the canonical,
// evergreen URL; the dated /quiz/shards-* stubs canonicalize here). One
// shattered mini crossword a day; players reassemble the lettered polyomino
// pieces into the one grid where every run is a real word.

export const metadata = {
  title: 'Daily Jigsaw Crossword: Shards | Mind Loft',
  description:
    'A free daily word puzzle: a mini crossword arrives already solved but shattered into lettered puzzle pieces. Reassemble them so every across and down run is a real word. No clues, one verified solution, a fresh grid every day.',
  alternates: { canonical: '/shards' },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Shards' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/shards.png', width: 1200, height: 630, alt: 'Shards - a daily jigsaw crossword from Mind Loft' }],
    title: 'Shards - The Daily Jigsaw Crossword',
    description:
      'The grid comes solved, then shattered into lettered pieces. Put it back together so every word reads true. A new daily word puzzle from Mind Loft.',
    url: '/shards',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/shards.png'],
    card: 'summary_large_image',
    title: 'Shards - The Daily Jigsaw Crossword',
    description:
      'Reassemble the shattered crossword so every across and down run is a real word. One verified solution a day.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Shards',
  alternateName: 'Shards - Daily Jigsaw Crossword',
  url: `${SITE_URL}/shards`,
  description:
    'A free daily word puzzle and jigsaw crossword: a filled mini crossword is shattered into rigid lettered polyomino pieces, and the player reassembles it so every across and down run of two or more letters is a dictionary word. Each day has exactly one verified reassembly.',
  genre: ['Word puzzle', 'Puzzle', 'Crossword'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/quiz-heroes/shards.png`,
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
    categoryCrumb('shards'),
    { '@type': 'ListItem', position: 3, name: 'Shards' },
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
          {'SHARDS'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 46, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 24, background: i % 2 === 0 ? '#0d9488' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.55)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Shards launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily jigsaw crossword: a solved grid, shattered into lettered pieces for you to reassemble. Come back when the first grid drops.
        </p>
        <a href="/daily" style={{ color: '#0d9488', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function ShardsPage({ searchParams }) {
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
        <ShardsClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="shards" stage={isStageServer('shards', searchParams)} />
    </>
  );
}
