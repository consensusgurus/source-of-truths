import { Suspense } from 'react';
import ListedClient from './ListedClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Listed launched 2026-07-27 as the 30th daily: linked from the hub puzzles row,
// the daily strip, the archive, the footer, and the sitemap (/listed is the
// canonical, evergreen URL — the dated /quiz/listed-* stubs canonicalize here).

export const metadata = {
  title: 'Free Daily Ranking Puzzle: Listed | Mind Loft',
  description:
    'A free daily ranking puzzle. Eight real things, one measurable quantity, five submits. Green locks a row that is exactly right, amber means you are off by one place. New list every day, and nine items in the Sunday Edition.',
  alternates: { canonical: '/listed' },
  manifest: '/api/pwa-manifest?game=listed',
  icons: {
    // Favicon is the Mind Loft mark on every page, games included (owner rule, 2026-08-31).
    // Do NOT restore a per-game favicon here, and do NOT 'simplify' this by deleting the line:
    // ANY metadata.icons object suppresses the root app/icon.png inheritance (Next resolves the
    // file-convention icon only `if (!resolvedMetadata.icons)`), so removing it would leave the
    // tab on the 16px favicon.ico alone. The per-game apple-touch icon below and the .webmanifest
    // icons are deliberately untouched, so a home-screen or installed shortcut keeps the game's
    // own art. The now-unreferenced favicon-32.png files stay in /public.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/listed-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Listed' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/listed.png', width: 1200, height: 630, alt: 'Listed: a daily ranking puzzle from Mind Loft' }],
    title: 'Listed: A Daily Ranking Puzzle',
    description:
      'Eight real things a day, shuffled. Rank them highest to lowest in five submits. Green locks, amber means you are one place off. Trivia, history and geography, rotating daily, from Mind Loft.',
    url: '/listed',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/listed.png'],
    card: 'summary_large_image',
    title: 'Listed: A Daily Ranking Puzzle',
    description:
      'Eight real things, one ranking, five submits. Green locks, amber means one place off.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Listed',
  alternateName: 'Listed: Daily Ranking Puzzle',
  url: `${SITE_URL}/listed`,
  description:
    'A free daily ranking puzzle: eight real things and one measurable quantity, shuffled. Arrange them highest to lowest. Each of your five submits grades every row, green for exactly right, amber for off by one place, and every green locks in with its real figure revealed.',
  genre: ['Puzzle', 'Trivia puzzle', 'Educational puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/quiz-heroes/listed.png`,
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
    categoryCrumb('listed'),
    { '@type': 'ListItem', position: 3, name: 'Listed' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function ListedPage({ searchParams }) {
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
        <ListedClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="listed" stage={isStageServer('listed', searchParams)} />
    </>
  );
}
