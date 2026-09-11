import { Suspense } from 'react';
import SpanClient from './SpanClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Span launched 2026-07-12 alongside Links: linked from the hub puzzles row,
// the footer, and the sitemap (/span is the canonical, evergreen URL — the
// dated /quiz/span-* stubs canonicalize here).

export const metadata = {
  title: 'Free Daily Geography Border Puzzle: Span | Mind Loft',
  description:
    'A free daily geography puzzle — connect two countries with the shortest chain of land borders you can find. Perfect is the shortest road on the map. New route every day.',
  alternates: { canonical: '/span' },
  manifest: '/api/pwa-manifest?game=span',
  icons: {
    // Favicon is the Mind Loft mark on every page, games included (owner rule, 2026-08-31).
    // Do NOT restore a per-game favicon here, and do NOT 'simplify' this by deleting the line:
    // ANY metadata.icons object suppresses the root app/icon.png inheritance (Next resolves the
    // file-convention icon only `if (!resolvedMetadata.icons)`), so removing it would leave the
    // tab on the 16px favicon.ico alone. The per-game apple-touch icon below and the .webmanifest
    // icons are deliberately untouched, so a home-screen or installed shortcut keeps the game's
    // own art. The now-unreferenced favicon-32.png files stay in /public.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/span-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Span' },
  openGraph: {
    title: 'Span — A Daily Border-Hopping Geography Puzzle',
    description:
      'Two countries a day. Chain land borders between them in the fewest moves — perfect is the shortest road on the map. A new geography puzzle from Mind Loft.',
    url: '/span',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Span — A Daily Border-Hopping Geography Puzzle',
    description:
      'Two countries a day. Chain land borders between them in the fewest moves.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Span',
  alternateName: 'Span — Daily Geography Border Puzzle',
  url: `${SITE_URL}/span`,
  description:
    'A free daily geography puzzle: connect a start country to a destination with a chain of land borders. Perfect is the shortest possible road — every extra move costs a point, and misses break ties.',
  genre: ['Geography puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/quiz-heroes/span.png`,
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
    categoryCrumb('span'),
    { '@type': 'ListItem', position: 3, name: 'Span' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function SpanPage({ searchParams }) {
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
        <SpanClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="span" stage={isStageServer('span', searchParams)} />
    </>
  );
}
