import { Suspense } from 'react';
import LinksClient from './LinksClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Links launched 2026-07-12 alongside Span: linked from the hub puzzles row,
// the footer, and the sitemap (/links is the canonical, evergreen URL — the
// dated /quiz/links-* stubs canonicalize here).

export const metadata = {
  title: 'Free Daily Word Grouping Puzzle: Links | Mind Loft',
  description:
    'A free daily word grouping puzzle — sixteen words hide four threads of four. Find every thread before four mistakes find you. New puzzle every day, and the Sunday Edition lays twice as many traps.',
  alternates: { canonical: '/links' },
  manifest: '/api/pwa-manifest?game=links',
  icons: {
    // Favicon is the Mind Loft mark on every page, games included (owner rule, 2026-08-31).
    // Do NOT restore a per-game favicon here, and do NOT 'simplify' this by deleting the line:
    // ANY metadata.icons object suppresses the root app/icon.png inheritance (Next resolves the
    // file-convention icon only `if (!resolvedMetadata.icons)`), so removing it would leave the
    // tab on the 16px favicon.ico alone. The per-game apple-touch icon below and the .webmanifest
    // icons are deliberately untouched, so a home-screen or installed shortcut keeps the game's
    // own art. The now-unreferenced favicon-32.png files stay in /public.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/links-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Links' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/links.png', width: 1200, height: 630, alt: 'Links — a daily word grouping puzzle from Mind Loft' }],
    title: 'Links — A Daily Word Grouping Puzzle',
    description:
      'Sixteen words, four hidden groups, four mistakes to spare. The words that look like they belong together usually don’t. A new word puzzle from Mind Loft.',
    url: '/links',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/links.png'],
    card: 'summary_large_image',
    title: 'Links — A Daily Word Grouping Puzzle',
    description:
      'Sixteen words, four hidden groups, four mistakes to spare.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Links',
  alternateName: 'Links — Daily Word Grouping Puzzle',
  url: `${SITE_URL}/links`,
  description:
    'A free daily word grouping puzzle: sixteen words hide four threads of four. Bank each thread in its color, easiest yellow to trickiest red — four mistakes and the board wins.',
  genre: ['Word puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/quiz-heroes/links.png`,
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
    categoryCrumb('links'),
    { '@type': 'ListItem', position: 3, name: 'Links' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function LinksPage({ searchParams }) {
  const today = etTodayServer();
  // `collisions` is authoring metadata (which words are deliberate traps), so
  // it stays server-side — the groups themselves must ship for the client to
  // check a guess, but the trap map does not.
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today).map(({ collisions, ...safe }) => safe);
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
        <LinksClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="links" stage={isStageServer('links', searchParams)} />
    </>
  );
}
