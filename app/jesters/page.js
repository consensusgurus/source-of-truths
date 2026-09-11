import { Suspense } from 'react';
import JesterClient from './JesterClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Jesters launched 2026-07-18 as one of the daily puzzles: linked from
// the daily strip, the footer, the /daily archive, and the sitemap (/jesters is
// the canonical, evergreen URL — the dated /quiz/jester-* stubs canonicalize
// here). One court a day, machine-verified to a unique solution AND to fall
// to pure deduction (scripts/verify-jester.mjs).
//
// LEAK GUARD: clientSafe() strips each board's `solution` before it is passed
// to the client — the browser re-derives the unique seating from the regions
// with its own backtracking solver, so the answer never ships.

export const metadata = {
  title: 'Daily Logic Puzzle, Seat the Court: Jesters | Mind Loft',
  description:
    'A free daily placement puzzle in the Star Battle family — seat a jester in every row, column and colored court, with no two jesters touching. Exactly one solution, pure deduction. A new court every day, harder as the week goes on, and two jesters per row from Thursday through Sunday.',
  alternates: { canonical: '/jesters' },
  // The manifest keeps its old filename and its `id: "/jester"` on purpose:
  // changing a PWA id orphans every installed copy. Only start_url moved.
  manifest: '/api/pwa-manifest?game=jester',
  icons: {
    // Favicon is the Mind Loft mark on every page, games included (owner rule, 2026-08-31).
    // Do NOT restore a per-game favicon here, and do NOT 'simplify' this by deleting the line:
    // ANY metadata.icons object suppresses the root app/icon.png inheritance (Next resolves the
    // file-convention icon only `if (!resolvedMetadata.icons)`), so removing it would leave the
    // tab on the 16px favicon.ico alone. The per-game apple-touch icon below and the .webmanifest
    // icons are deliberately untouched, so a home-screen or installed shortcut keeps the game's
    // own art. The now-unreferenced favicon-32.png files stay in /public.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/jester-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Jesters' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/jesters.png', width: 1200, height: 630, alt: 'Jesters — the daily court-placement puzzle from Mind Loft' }],
    title: 'Jesters — Seat the Court, Every Day',
    description:
      'One jester per row, per column, per colored court, and no two may touch. Two apiece from Thursday through Sunday. Every board is machine-verified to a single solution reachable by pure deduction. From Mind Loft.',
    url: '/jesters',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/jesters.png'],
    card: 'summary_large_image',
    title: 'Jesters — Seat the Court, Every Day',
    description:
      'One jester per row, column and court, two from Thursday through Sunday. No touching. Exactly one solution, seat today’s court.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Jesters',
  alternateName: 'Jesters — Daily Court-Placement Logic Puzzle',
  url: `${SITE_URL}/jesters`,
  description:
    'A free daily Star Battle-style logic puzzle: seat a jester in every row, every column and every colored court, with no two jesters touching, even diagonally. Boards are graded so the week climbs from a gentle Monday, seating two jesters per row, column and court from Thursday through Sunday, with Sunday the hardest. Every board is machine-verified to have exactly one solution reachable by pure deduction — no guessing.',
  genre: ['Logic puzzle', 'Placement puzzle', 'Star Battle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/quiz-heroes/jester.png`,
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
    categoryCrumb('jester'),
    { '@type': 'ListItem', position: 3, name: 'Jesters', item: `${SITE_URL}/jesters` },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

// Strip the stored solution — the client re-derives it from the regions.
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
          {'JESTER'.split('').map((ch, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, background: i === 0 ? '#7c3aed' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Jesters opens {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily court-placement puzzle &mdash; a jester per row, column and court, no touching, exactly one solution. Come back when the first court convenes.
        </p>
        <a href="/daily" style={{ color: '#7c3aed', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function JesterPage({ searchParams }) {
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
        <JesterClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="jester" stage={isStageServer('jester', searchParams)} />
    </>
  );
}
