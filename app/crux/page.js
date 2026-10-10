import { Suspense } from 'react';
import CruxClient from './CruxClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Crux is fully launched: linked from the hub (dated catalog entries), the
// footer, and the sitemap (/crux is the canonical, evergreen URL — the dated
// /quiz/crux-* stubs canonicalize here).

export const metadata = {
  title: 'Free Daily Word Puzzle: Crux | Mind Loft',
  description:
    'A clueless crossword and a free daily word puzzle. Eight hidden words interlock, and four categories are the only hints. New puzzle every day.',
  alternates: { canonical: '/crux' },
  manifest: '/api/pwa-manifest?game=crux',
  icons: {
    // Favicon is the Mind Loft mark on every page, games included (owner rule, 2026-08-31).
    // Do NOT restore a per-game favicon here, and do NOT 'simplify' this by deleting the line:
    // ANY metadata.icons object suppresses the root app/icon.png inheritance (Next resolves the
    // file-convention icon only `if (!resolvedMetadata.icons)`), so removing it would leave the
    // tab on the 16px favicon.ico alone. The per-game apple-touch icon below and the .webmanifest
    // icons are deliberately untouched, so a home-screen or installed shortcut keeps the game's
    // own art. The now-unreferenced favicon-32.png files stay in /public.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/crux-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Crux' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/crux.png', width: 1200, height: 630, alt: 'Crux — a daily word puzzle from Mind Loft' }],
    title: 'Crux — A Daily Word Puzzle',
    description:
      'A clueless crossword. Eight interlocking words, four categories to untangle, eighteen shared guesses. A new daily word puzzle from Mind Loft.',
    url: '/crux',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/crux.png'],
    card: 'summary_large_image',
    title: 'Crux — A Daily Word Puzzle',
    description:
      'A clueless crossword. Eight interlocking words, four categories to untangle, eighteen shared guesses.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Crux',
  alternateName: 'Crux — Daily Word Puzzle',
  url: `${SITE_URL}/crux`,
  description:
    'A clueless crossword and a free daily word puzzle. Four categories are the only hints: guess real words on a shared budget, lock letters into the grid, then file each solved word under its category.',
  genre: ['Word puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/quiz-heroes/crux.png`,
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
    categoryCrumb('crux'),
    { '@type': 'ListItem', position: 3, name: 'Crux' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function CruxPage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today);
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
        <CruxClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="crux" stage={isStageServer('crux', searchParams)} />
    </>
  );
}
