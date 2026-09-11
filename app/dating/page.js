import { Suspense } from 'react';
import DatingClient from './DatingClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Dating launched 2026-07-14 alongside Crux/Garble/Links/Span: linked from
// the hub puzzles row, the footer, and the sitemap (/dating is the canonical,
// evergreen URL — the dated /quiz/dating-* stubs canonicalize here).

export const metadata = {
  title: 'Free Daily History Ordering Puzzle: Dating | Mind Loft',
  description:
    'A free daily history puzzle — put five moments from history in chronological order in three checks or fewer. Every correct placement locks in with its year. New puzzle every day, and six moments in the Sunday Edition.',
  alternates: { canonical: '/dating' },
  manifest: '/api/pwa-manifest?game=dating',
  icons: {
    // Favicon is the Mind Loft mark on every page, games included (owner rule, 2026-08-31).
    // Do NOT restore a per-game favicon here, and do NOT 'simplify' this by deleting the line:
    // ANY metadata.icons object suppresses the root app/icon.png inheritance (Next resolves the
    // file-convention icon only `if (!resolvedMetadata.icons)`), so removing it would leave the
    // tab on the 16px favicon.ico alone. The per-game apple-touch icon below and the .webmanifest
    // icons are deliberately untouched, so a home-screen or installed shortcut keeps the game's
    // own art. The now-unreferenced favicon-32.png files stay in /public.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/dating-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Dating' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/dating.png', width: 1200, height: 630, alt: 'Dating — a daily put-history-in-order puzzle from Mind Loft' }],
    title: 'Dating — A Daily Put-History-In-Order Puzzle',
    description:
      'Five moments a day, shuffled out of sequence. Arrange them oldest to newest in three checks or fewer. A new history puzzle from Mind Loft.',
    url: '/dating',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/dating.png'],
    card: 'summary_large_image',
    title: 'Dating — A Daily Put-History-In-Order Puzzle',
    description:
      'Five moments a day. Put them in chronological order in three checks or fewer.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Dating',
  alternateName: 'Dating — Daily History Ordering Puzzle',
  url: `${SITE_URL}/dating`,
  description:
    'A free daily history puzzle: five events, shuffled. Arrange them in chronological order — each of your three checks locks the events you placed correctly and reveals their years.',
  genre: ['History puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/quiz-heroes/dating.png`,
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
    categoryCrumb('dating'),
    { '@type': 'ListItem', position: 3, name: 'Dating' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function DatingPage({ searchParams }) {
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
        <DatingClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="dating" stage={isStageServer('dating', searchParams)} />
    </>
  );
}
