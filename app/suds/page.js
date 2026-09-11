import { Suspense } from 'react';
import SudsClient from './SudsClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Suds launched 2026-07-15 as the seventh daily: linked from the hub puzzles row,
// the footer, the /daily archive, and the sitemap (/suds is the canonical,
// evergreen URL — the dated /quiz/suds-* stubs canonicalize here). Weekdays are
// a standard 9×9 board; Sundays step up to a harder Edition with fewer clues.

export const metadata = {
  title: 'Free Daily Sudoku: Suds | Mind Loft',
  description:
    'A free daily sudoku — fill the 9×9 grid so every row, column, and 3×3 box holds 1–9 with no repeats. One logical solution, notes and a free hint, a new board every day, and a harder Edition on Sundays.',
  alternates: { canonical: '/suds' },
  manifest: '/api/pwa-manifest?game=suds',
  icons: {
    // Favicon is the Mind Loft mark on every page, games included (owner rule, 2026-08-31).
    // Do NOT restore a per-game favicon here, and do NOT 'simplify' this by deleting the line:
    // ANY metadata.icons object suppresses the root app/icon.png inheritance (Next resolves the
    // file-convention icon only `if (!resolvedMetadata.icons)`), so removing it would leave the
    // tab on the 16px favicon.ico alone. The per-game apple-touch icon below and the .webmanifest
    // icons are deliberately untouched, so a home-screen or installed shortcut keeps the game's
    // own art. The now-unreferenced favicon-32.png files stay in /public.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/suds-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Suds' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/suds.png', width: 1200, height: 630, alt: 'Suds — a daily sudoku from Mind Loft' }],
    title: 'Suds — A Daily Sudoku',
    description:
      'Fill the 9×9 grid so every row, column, and box holds 1–9 once. One solution, clean solve wins. A new sudoku from Mind Loft, daily.',
    url: '/suds',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/suds.png'],
    card: 'summary_large_image',
    title: 'Suds — A Daily Sudoku',
    description:
      'Fill the 9×9 grid so every row, column, and box holds 1–9 once. A clean, error-free solve wins.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Suds',
  alternateName: 'Suds — Daily Sudoku',
  url: `${SITE_URL}/suds`,
  description:
    'A free daily sudoku: fill a 9×9 grid so that every row, column, and 3×3 box contains the digits 1–9 exactly once. Each board has one logical solution — solve it with no errors for a perfect score, and ties break on fewest errors then fastest time.',
  genre: ['Logic puzzle', 'Sudoku', 'Number puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/quiz-heroes/suds.png`,
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
    categoryCrumb('suds'),
    { '@type': 'ListItem', position: 3, name: 'Suds' },
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
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 18 }}>
          {'SUDS'.split('').map((ch, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, background: i === 3 ? '#ea580c' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Suds launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily sudoku — fill the 9×9 grid so every row, column, and box holds 1–9 once. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: '#ea580c', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function SudsPage({ searchParams }) {
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
        <SudsClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="suds" stage={isStageServer('suds', searchParams)} />
    </>
  );
}
