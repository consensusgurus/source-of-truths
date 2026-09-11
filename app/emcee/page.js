import { Suspense } from 'react';
import EmceeClient from './EmceeClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Emcee launched 2026-07-16 as the eleventh daily (slotted right after Crux):
// linked from the daily strip, the footer, the /daily archive, and the sitemap
// (/emcee is the canonical, evergreen URL — the dated /quiz/emcee-* stubs
// canonicalize here). Weekdays are a 5×5 mini with 10 words; Sundays step up
// to a 7×7 pinwheel with 22.

export const metadata = {
  title: 'Free Daily Mini Crossword: Emcee | Mind Loft',
  description:
    'A free daily mini crossword — a 5×5 grid of everyday words with fair Across and Down clues, done in a minute or two. The grid checks itself when the last square lands, and Sundays go bigger.',
  alternates: { canonical: '/emcee' },
  manifest: '/api/pwa-manifest?game=emcee',
  icons: {
    // Favicon is the Mind Loft mark on every page, games included (owner rule, 2026-08-31).
    // Do NOT restore a per-game favicon here, and do NOT 'simplify' this by deleting the line:
    // ANY metadata.icons object suppresses the root app/icon.png inheritance (Next resolves the
    // file-convention icon only `if (!resolvedMetadata.icons)`), so removing it would leave the
    // tab on the 16px favicon.ico alone. The per-game apple-touch icon below and the .webmanifest
    // icons are deliberately untouched, so a home-screen or installed shortcut keeps the game's
    // own art. The now-unreferenced favicon-32.png files stay in /public.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/emcee-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Emcee' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/emcee.png', width: 1200, height: 630, alt: 'Emcee — a daily mini crossword from Mind Loft' }],
    title: 'Emcee — A Daily Mini Crossword',
    description:
      'A proper mini crossword, five by five: everyday words, fair clues, and a timer that stops when the grid is right. A new grid from Mind Loft, daily.',
    url: '/emcee',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/emcee.png'],
    card: 'summary_large_image',
    title: 'Emcee — A Daily Mini Crossword',
    description:
      'A proper mini crossword, five by five: everyday words, fair clues, and a timer that stops when the grid is right.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Emcee',
  alternateName: 'Emcee — Daily Mini Crossword',
  url: `${SITE_URL}/emcee`,
  description:
    'A free daily mini crossword: a 5×5 grid of everyday words with numbered Across and Down clues, solvable in a minute or two. The grid checks itself the moment the last square is filled — a clean, fast solve tops the daily leaderboard, and Sundays step up to a 7×7 pinwheel.',
  genre: ['Word puzzle', 'Crossword', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/quiz-heroes/emcee.png`,
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
    categoryCrumb('emcee'),
    { '@type': 'ListItem', position: 3, name: 'Emcee' },
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
          {'EMCEE'.split('').map((ch, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, background: i === 1 || i === 2 ? '#c026d3' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Emcee launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily mini crossword — everyday words, fair clues, a minute or two. Come back when the first grid drops.
        </p>
        <a href="/daily" style={{ color: '#c026d3', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function EmceePage({ searchParams }) {
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
        <EmceeClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="emcee" stage={isStageServer('emcee', searchParams)} />
    </>
  );
}
