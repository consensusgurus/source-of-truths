import { Suspense } from 'react';
import SandoClient from './SandoClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Sando launched 2026-08-13 as the fourth sudoku on the slate, after Suds,
// Quilt and Cages. It is a SANDWICH SUDOKU: an ordinary grid with a number
// printed outside every row and column giving the total of the digits lying
// between that line's 1 and its 9. Linked from the hub puzzles row, the footer,
// the /daily archive, and the sitemap (/sando is the canonical, evergreen URL —
// the dated /quiz/sando-* stubs canonicalize here). Weekdays run 20 printed
// digits down to 10 on a Monday-to-Saturday ramp; Sundays are a harder Edition
// printing just six.

export const metadata = {
  title: 'Free Daily Sandwich Sudoku: Sando | Mind Loft',
  description:
    'A free daily sandwich sudoku — the number beside each row and column is the total of the digits sitting between that line\u2019s 1 and its 9, so a 0 means the sandwich is empty and the two are side by side. Fill the 9×9 grid so every row, column, and 3×3 box holds 1–9 with no repeats. One logical solution and never a guess, notes and a free hint, a new board every day, and a harder Edition on Sundays.',
  alternates: { canonical: '/sando' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/sando.png', width: 1200, height: 630, alt: 'Sando — a daily sandwich sudoku from Mind Loft' }],
    title: 'Sando — A Daily Sandwich Sudoku',
    description:
      'Sandwich sudoku: each border clue totals the digits between that line\u2019s 1 and its 9, and a 0 means the sandwich is empty. One logical solution, never a guess. A new board from Mind Loft, daily.',
    url: '/sando',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/sando.png'],
    card: 'summary_large_image',
    title: 'Sando — A Daily Sandwich Sudoku',
    description:
      'Each margin clue totals the digits between that line\u2019s 1 and its 9, and a 0 means an empty sandwich. A daily sandwich sudoku.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Sando',
  alternateName: 'Sando — Daily Sandwich Sudoku',
  url: `${SITE_URL}/sando`,
  description:
    'A free daily sandwich sudoku: every row and column holds one 1 and one 9, and the number printed outside it is the total of the digits sitting between those two. Side by side, the sandwich is empty and the clue is 0; at the two ends, everything else is inside and the clue is 35. Fill the 9×9 grid so that every row, every column, and every 3×3 box contains the digits 1–9 exactly once and every sandwich adds up. Each board has one solution and can always be reached by logic alone — solve it with no errors for a perfect score, and ties break on fastest time.',
  genre: ['Logic puzzle', 'Sandwich sudoku', 'Sudoku', 'Number puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
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
    categoryCrumb('sando'),
    { '@type': 'ListItem', position: 3, name: 'Sando' },
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
          {'SANDO'.split('').map((ch, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, background: i === 4 ? '#15616b' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Sando launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily sandwich sudoku — the same 9×9 grid, with a number beside every row and column giving the total of the digits between that line&apos;s 1 and its 9. Side by side and the sandwich is empty, which is a 0. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: '#15616b', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function SandoPage({ searchParams }) {
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
        <SandoClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="sando" stage={isStageServer('sando', searchParams)} />
    </>
  );
}
