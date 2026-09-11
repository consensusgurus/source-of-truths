import { Suspense } from 'react';
import AxiomClient from './AxiomClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Axiom launched 2026-07-25 as one of the daily puzzles: linked from the daily
// strip, the /daily archive, and the sitemap (/axiom is the canonical,
// evergreen URL — the dated /quiz/axiom-* stubs canonicalize here). One board a
// day, machine-verified to have exactly one consistent rule AND to need at
// least two tests to isolate it (scripts/verify-axiom.mjs).
//
// LEAK GUARD: no board stores its answer. Tile verdicts must ship (the board
// answers tests locally), but which candidate is the rule is derived in the
// browser by finding the one spec that agrees with every tile.

export const metadata = {
  title: 'Free Daily Logic Puzzle, Find the Hidden Rule: Axiom | Mind Loft',
  description:
    'A free daily logic puzzle. One hidden rule splits a board of words, five candidate rules are on the table, and you get a handful of tests to tell them apart. New board every day.',
  alternates: { canonical: '/axiom' },
  manifest: '/api/pwa-manifest?game=axiom',
  icons: {
    // Favicon is the Mind Loft mark on every page, games included (owner rule, 2026-08-31).
    // Do NOT restore a per-game favicon here, and do NOT 'simplify' this by deleting the line:
    // ANY metadata.icons object suppresses the root app/icon.png inheritance (Next resolves the
    // file-convention icon only `if (!resolvedMetadata.icons)`), so removing it would leave the
    // tab on the 16px favicon.ico alone. The per-game apple-touch icon below and the .webmanifest
    // icons are deliberately untouched, so a home-screen or installed shortcut keeps the game's
    // own art. The now-unreferenced favicon-32.png files stay in /public.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/axiom-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Axiom' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/axiom.png', width: 1200, height: 630, alt: 'Axiom — the daily hidden-rule puzzle from Mind Loft' }],
    title: 'Axiom — Find the Hidden Rule',
    description:
      'Green tiles obey a rule you cannot see. Red ones break it. Five candidates, a handful of tests, and most tiles teach you nothing. A new daily logic puzzle from Mind Loft.',
    url: '/axiom',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/axiom.png'],
    card: 'summary_large_image',
    title: 'Axiom — Find the Hidden Rule',
    description: 'One hidden rule, five candidates, and a test budget that punishes guessing. Play today’s board.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Axiom',
  alternateName: 'Axiom — Daily Rule-Induction Puzzle',
  url: `${SITE_URL}/axiom`,
  description:
    'A free daily logic puzzle: a hidden rule splits a board of words into green and red, five candidate rules are listed, and a small budget of tests decides which one fits. Every board is machine-verified to have exactly one consistent rule.',
  genre: ['Logic puzzle', 'Deduction puzzle', 'Word puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/quiz-heroes/axiom.png`,
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
    categoryCrumb('axiom'),
    { '@type': 'ListItem', position: 3, name: 'Axiom' },
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
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 18 }}>
          {'AXIOM'.split('').map((ch, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, background: i === 0 ? '#0f766e' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Axiom opens {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily hidden-rule puzzle. Green tiles obey it, red tiles break it, and most tiles teach you nothing at all.
        </p>
        <a href="/daily" style={{ color: '#0f766e', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function AxiomPage({ searchParams }) {
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
        <AxiomClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="axiom" stage={isStageServer('axiom', searchParams)} />
    </>
  );
}
