import { Suspense } from 'react';
import AlibiClient from './AlibiClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Alibi launched 2026-07-18 as one of the daily puzzles: linked from
// the daily strip, the footer, the /daily archive, and the sitemap (/alibi is
// the canonical, evergreen URL — the dated /quiz/alibi-* stubs canonicalize
// here). One whodunit a day, machine-verified to a unique solution.
//
// LEAK GUARD: clientSafe() strips each case's `solution` before it is passed
// to the client — the browser re-derives the unique arrangement from the
// clues with its own brute-force solver, so the answer never ships.

export const metadata = {
  title: 'Daily Logic Puzzle, Solve the Whodunit: Alibi | Mind Loft',
  description:
    'A free daily logic deduction puzzle — four suspects, four rooms, four departure times, four curious items, and five of each in the Sunday Edition. Every witness statement is true; work the deduction boards and close the case. A new mystery every day.',
  alternates: { canonical: '/alibi' },
  manifest: '/api/pwa-manifest?game=alibi',
  icons: {
    // Favicon is the Mind Loft mark on every page, games included (owner rule, 2026-08-31).
    // Do NOT restore a per-game favicon here, and do NOT 'simplify' this by deleting the line:
    // ANY metadata.icons object suppresses the root app/icon.png inheritance (Next resolves the
    // file-convention icon only `if (!resolvedMetadata.icons)`), so removing it would leave the
    // tab on the 16px favicon.ico alone. The per-game apple-touch icon below and the .webmanifest
    // icons are deliberately untouched, so a home-screen or installed shortcut keeps the game's
    // own art. The now-unreferenced favicon-32.png files stay in /public.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/alibi-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Alibi' },
  openGraph: {
    title: 'Alibi — A Fresh Mystery Every Day',
    description:
      'Four suspects, one stolen treasure. Work the deduction boards, corner the truth, and close the case — every statement is true, and there is exactly one solution. From Mind Loft.',
    url: '/alibi',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alibi — A Fresh Mystery Every Day',
    description:
      'Four suspects, three deduction boards, exactly one solution. Close tonight’s case.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Alibi',
  alternateName: 'Alibi — Daily Logic Deduction Puzzle',
  url: `${SITE_URL}/alibi`,
  description:
    'A free daily Einstein-style logic puzzle dressed as a whodunit: four suspects, four rooms, four departure times, four items, with a five-suspect Sunday Edition. Every witness statement is true, and each case is machine-verified to have exactly one solution — pure deduction closes it.',
  genre: ['Logic puzzle', 'Deduction puzzle', 'Mystery puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/quiz-heroes/alibi.png`,
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
    categoryCrumb('alibi'),
    { '@type': 'ListItem', position: 3, name: 'Alibi' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

// Strip the stored solution — the client re-derives it from the clues.
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
          {'ALIBI'.split('').map((ch, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, background: i === 0 ? '#8b1e2d' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Alibi opens {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The nightly whodunit — four suspects, three deduction boards, exactly one solution. Come back when the first case opens.
        </p>
        <a href="/daily" style={{ color: '#8b1e2d', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function AlibiPage({ searchParams }) {
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
        <AlibiClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="alibi" stage={isStageServer('alibi', searchParams)} />
    </>
  );
}
