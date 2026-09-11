import { Suspense } from 'react';
import GarbleClient from './GarbleClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Garble is fully launched: linked from the hub (dated catalog entries), the
// footer, and the sitemap (/garble is the canonical, evergreen URL — the dated
// /quiz/garble-* stubs canonicalize here).

export const metadata = {
  title: 'Free Daily Word Scramble Puzzle: Garble | Mind Loft',
  description:
    'A free daily word scramble puzzle — untangle five garbled words, feed their gold letters into a clued finale, and finish in the fewest misses. New puzzle every day, and a six-letter Sunday Edition each week.',
  alternates: { canonical: '/garble' },
  manifest: '/api/pwa-manifest?game=garble',
  icons: {
    // Favicon is the Mind Loft mark on every page, games included (owner rule, 2026-08-31).
    // Do NOT restore a per-game favicon here, and do NOT 'simplify' this by deleting the line:
    // ANY metadata.icons object suppresses the root app/icon.png inheritance (Next resolves the
    // file-convention icon only `if (!resolvedMetadata.icons)`), so removing it would leave the
    // tab on the 16px favicon.ico alone. The per-game apple-touch icon below and the .webmanifest
    // icons are deliberately untouched, so a home-screen or installed shortcut keeps the game's
    // own art. The now-unreferenced favicon-32.png files stay in /public.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/garble-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Garble' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/garble.png', width: 1200, height: 630, alt: 'Garble — a daily word scramble puzzle from Mind Loft' }],
    title: 'Garble — A Daily Word Scramble',
    description:
      'Five garbled words, one clued finale. Untangle it in the fewest misses. A new word puzzle from Mind Loft.',
    url: '/garble',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/garble.png'],
    card: 'summary_large_image',
    title: 'Garble — A Daily Word Scramble',
    description: 'Five garbled words, one clued finale. Untangle it in the fewest misses.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Garble',
  alternateName: 'Garble — Daily Word Scramble',
  url: `${SITE_URL}/garble`,
  description:
    'A free daily word scramble puzzle: untangle five garbled words using exactly the letters shown. Each solution donates its gold letters to a clued finale — solve the finale any time to end the puzzle. Fewest misses wins the tiebreak.',
  genre: ['Word puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/quiz-heroes/garble.png`,
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
    categoryCrumb('garble'),
    { '@type': 'ListItem', position: 3, name: 'Garble' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function GarblePage({ searchParams }) {
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
      {/* SUSPENSE IS REQUIRED, not decoration. GarbleClient reads
          useSearchParams (the stage flag), and Next fails the BUILD for a
          statically rendered page that calls it outside a boundary:
          "useSearchParams() should be wrapped in a suspense boundary". Every
          other daily page already had this; Garble did not, because Garble
          never read the query until the stage converter gave it a reason to. */}
      <Suspense fallback={null}>
        <GarbleClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="garble" stage={isStageServer('garble', searchParams)} />
    </>
  );
}
