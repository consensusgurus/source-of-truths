import { Suspense } from 'react';
import SwornClient from './SwornClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Sworn launched 2026-07-18 as one of the daily puzzles: linked from
// the daily strip, the footer, the /daily archive, and the sitemap (/sworn is
// the canonical, evergreen URL — the dated /quiz/sworn-* stubs canonicalize
// here). One inquest a day, machine-verified to a unique consistent world
// AND to fall to pure propagation (scripts/verify-sworn.mjs).
//
// LEAK GUARD: clientSafe() strips each case's `solution` before it is passed
// to the client — the browser re-derives the unique (thief, liar-set) world
// from the testimony with its own brute-force solver, so the answer never
// ships.

export const metadata = {
  title: 'Daily Liars Puzzle, Find the Thief: Sworn | Mind Loft',
  description:
    'A free daily Knights-and-Knaves logic puzzle — a handful of locals under oath, exactly so many of them lying, one of them a thief. Work the contradictions and name the culprit. A new inquest every day, six sworn on Sundays.',
  alternates: { canonical: '/sworn' },
  manifest: '/api/pwa-manifest?game=sworn',
  icons: {
    // Favicon is the Mind Loft mark on every page, games included (owner rule, 2026-08-31).
    // Do NOT restore a per-game favicon here, and do NOT 'simplify' this by deleting the line:
    // ANY metadata.icons object suppresses the root app/icon.png inheritance (Next resolves the
    // file-convention icon only `if (!resolvedMetadata.icons)`), so removing it would leave the
    // tab on the 16px favicon.ico alone. The per-game apple-touch icon below and the .webmanifest
    // icons are deliberately untouched, so a home-screen or installed shortcut keeps the game's
    // own art. The now-unreferenced favicon-32.png files stay in /public.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/sworn-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Sworn' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/sworn.png', width: 1200, height: 630, alt: 'Sworn — the daily liars puzzle from Mind Loft' }],
    title: 'Sworn — A Fresh Pack of Liars Every Day',
    description:
      'Everyone testified. An exact number of them lied. One is the thief. Follow the contradictions, weigh the lie count, and name the culprit — exactly one story holds together. From Mind Loft.',
    url: '/sworn',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/sworn.png'],
    card: 'summary_large_image',
    title: 'Sworn — A Fresh Pack of Liars Every Day',
    description:
      'Five sworn statements, an exact number of lies, one thief. Crack today’s inquest.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Sworn',
  alternateName: 'Sworn — Daily Liars Puzzle',
  url: `${SITE_URL}/sworn`,
  description:
    'A free daily Knights-and-Knaves style logic puzzle: suspects give sworn statements, an exact number of them are lying, and one is the thief. Every case is machine-verified to have exactly one consistent world — pure deduction names the culprit.',
  genre: ['Logic puzzle', 'Deduction puzzle', 'Liars puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/quiz-heroes/sworn.png`,
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
    categoryCrumb('sworn'),
    { '@type': 'ListItem', position: 3, name: 'Sworn' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

// Strip the stored solution — the client re-derives it from the testimony.
function clientSafe(p) {
  const { solution, ...safe } = p;
  return safe;
}

function ComingSoon({ first }) {
  // Rendered only if no puzzle is live yet (before the first drop). Never crash
  // the route on an empty visible set — show a friendly placeholder instead.
  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: "'Manrope', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 18 }}>
          {'SWORN'.split('').map((ch, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, background: i === 0 ? '#be185d' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Sworn opens {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily liars puzzle &mdash; sworn statements, an exact number of lies, one thief. Come back when the first inquest is sworn.
        </p>
        <a href="/daily" style={{ color: '#be185d', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function SwornPage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today).map(clientSafe);
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
        <SwornClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="sworn" stage={isStageServer('sworn', searchParams)} />
    </>
  );
}
