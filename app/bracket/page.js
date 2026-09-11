import { Suspense } from 'react';
import BracketClient from './BracketClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Bracket launched 2026-07-24: the puzzle specced in puzzle-spec-seeded.md. Sixteen
// real things, one comparison metric a day, fifteen picks that propagate, and no
// feedback until the reveal. Machine-verified (scripts/verify-bracket.mjs).
//
// LEAK GUARD: no board stores its winners. Every item ships with its real value
// and the client recomputes each matchup, exactly as the verifier does.

export const metadata = {
  title: 'Free Daily Puzzle, Fill the Bracket of Facts: Bracket | Mind Loft',
  description:
    'A free daily bracket puzzle. Sixteen real things, one comparison question, fifteen picks, and no feedback until the end. Your picks propagate, so one bad call in round one busts everything downstream. New field every day.',
  alternates: { canonical: '/bracket' },
  manifest: '/api/pwa-manifest?game=bracket',
  icons: {
    // Favicon is the Mind Loft mark on every page, games included (owner rule, 2026-08-31).
    // Do NOT restore a per-game favicon here, and do NOT 'simplify' this by deleting the line:
    // ANY metadata.icons object suppresses the root app/icon.png inheritance (Next resolves the
    // file-convention icon only `if (!resolvedMetadata.icons)`), so removing it would leave the
    // tab on the 16px favicon.ico alone. The per-game apple-touch icon below and the .webmanifest
    // icons are deliberately untouched, so a home-screen or installed shortcut keeps the game's
    // own art. The now-unreferenced favicon-32.png files stay in /public.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/bracket-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Bracket' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/bracket.png', width: 1200, height: 630, alt: 'Bracket — the daily bracket of facts from Mind Loft' }],
    title: 'Bracket — The Daily Bracket of Facts',
    description: 'Sixteen contenders, one question, fifteen picks. Your winners carry forward, so a first-round mistake takes every later line down with it.',
    url: '/bracket', type: 'website', siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/bracket.png'],
    card: 'summary_large_image',
    title: 'Bracket — The Daily Bracket of Facts',
    description: 'Sixteen contenders, one question, and a bracket that busts exactly like your Final Four.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org', '@type': 'Game', name: 'Bracket',
  url: `${SITE_URL}/bracket`,
  description: 'A free daily bracket puzzle: sixteen real things seeded into a single-elimination draw, one comparison question for the day, and picks that propagate like a real pool sheet.',
  genre: ['Trivia puzzle', 'Bracket puzzle', 'Puzzle'],
  gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/quiz-heroes/bracket.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};
const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('bracket'),
    { '@type': 'ListItem', position: 3, name: 'Bracket' },
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
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Bracket opens {first ? first.dateLabel : 'soon'}.</h1>
        <a href="/daily" style={{ color: '#c2410c', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}
export default function BracketPage({ searchParams }) {
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
        <BracketClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="bracket" stage={isStageServer('bracket', searchParams)} />
    </>
  );
}
