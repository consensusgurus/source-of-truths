import { Suspense } from 'react';
import StandsClient from './StandsClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Stands launched 2026-07-24 as one of the daily puzzles: linked from the daily
// strip, the /daily archive, and the sitemap (/stands is the canonical,
// evergreen URL). One board a day, machine-verified (scripts/verify-stands.mjs).
//
// LEAK GUARD: no board stores its answer. The client re-derives it exactly as
// the verifier does, so nothing but the puzzle itself ever ships.

export const metadata = {
  title: 'Free Daily Logic Puzzle, Rebuild the Results: Stands | Mind Loft',
  description: 'A free daily logic puzzle. A small league played a full round robin, the results sheet was lost, and a handful of facts survive. Exactly one set of results fits them. New season every day.',
  alternates: { canonical: '/stands' },
  manifest: '/api/pwa-manifest?game=stands',
  icons: {
    // Favicon is the Mind Loft mark on every page, games included (owner rule, 2026-08-31).
    // Do NOT restore a per-game favicon here, and do NOT 'simplify' this by deleting the line:
    // ANY metadata.icons object suppresses the root app/icon.png inheritance (Next resolves the
    // file-convention icon only `if (!resolvedMetadata.icons)`), so removing it would leave the
    // tab on the 16px favicon.ico alone. The per-game apple-touch icon below and the .webmanifest
    // icons are deliberately untouched, so a home-screen or installed shortcut keeps the game's
    // own art. The now-unreferenced favicon-32.png files stay in /public.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/stands-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Stands' },
  openGraph: { images: [{ url: '/og/stands.png', width: 1200, height: 630, alt: 'Stands — a daily logic puzzle from Mind Loft' }], title: 'Stands — Rebuild the Lost Results Table', description: 'Everyone played everyone once. Win 3, draw 1. The sheet is gone and a few facts survive, and only one set of results fits them all.', url: '/stands', type: 'website', siteName: 'Mind Loft' },
  twitter: { images: ['/og/stands.png'], card: 'summary_large_image', title: 'Stands — Rebuild the Lost Results Table', description: 'Everyone played everyone once. Win 3, draw 1. The sheet is gone and a few facts survive, and only one set of results fits them all.' },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Stands',
  url: `${SITE_URL}/stands`,
  description: 'A free daily logic puzzle. A small league played a full round robin, the results sheet was lost, and a handful of facts survive. Exactly one set of results fits them. New season every day.',
  genre: ['Logic puzzle', 'Deduction puzzle', 'Constraint puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/quiz-heroes/stands.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};
const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('stands'),
    { '@type': 'ListItem', position: 3, name: 'Stands' },
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
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Stands opens {first ? first.dateLabel : 'soon'}.</h1>
        <a href="/daily" style={{ color: T.blueDeep, fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function StandsPage({ searchParams }) {
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
        <StandsClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="stands" stage={isStageServer('stands', searchParams)} />
    </>
  );
}
