import { Suspense } from 'react';
import WhittleClient from './WhittleClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Whittle is the sudoku played backwards, and the tenth sudoku on the site
// after Suds (classic 9x9), Quilt (jigsaw), Cages (killer), Sando (sandwich),
// Sixes (mini), Towers (skyscrapers), Mercury (thermo), Knight (anti-knight)
// and Polka (kropki). Every one of those hands you an empty grid; this one
// hands you a finished grid and asks you to empty it, taking clues away for as
// long as the board still has exactly one answer.
//
// NOTHING IS STRIPPED FROM THE PUZZLE HERE, and that is not an oversight. Every
// other daily hides its solution from the browser because knowing it is the
// game. Whittle SHOWS the solution on purpose — it never asks what the answer
// is, only what the grid can survive losing — so there is nothing to withhold.
// The live<=today filter still matters, because a future board's `perfect` is a
// measured fact about a day that has not happened yet.
//
// /whittle is the canonical, evergreen URL; the dated /quiz/whittle-* stubs
// canonicalize here.

export const metadata = {
  title: 'Free Daily Sudoku Played Backwards: Whittle | Mind Loft',
  description:
    'A free daily puzzle: a solved 6×6 sudoku with eighteen printed clues, and your job is to take clues away. A clue comes out only while the grid still has one answer. Reach the proven fewest for a perfect ten. New board daily.',
  alternates: { canonical: '/whittle' },
  openGraph: {
    images: [{ url: '/og/whittle.png', width: 1200, height: 630, alt: 'Whittle — the daily sudoku played backwards, from Mind Loft' }],
    title: 'Whittle — The Daily Sudoku, Backwards',
    description:
      'Take clues out of a solved sudoku for as long as it still has one answer. The order is the whole game. From Mind Loft, daily.',
    url: '/whittle',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/whittle.png'],
    card: 'summary_large_image',
    title: 'Whittle — The Daily Sudoku, Backwards',
    description:
      'A solved grid, eighteen clues, and one question: which can you take out? Reach the proven fewest for a perfect ten.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Whittle',
  alternateName: 'Whittle — The Daily Sudoku Played Backwards',
  url: `${SITE_URL}/whittle`,
  description:
    'A free daily logic puzzle. You are given a solved 6×6 sudoku with eighteen of its digits printed as clues, and you remove clues one at a time. A clue may be removed only while the grid still has exactly one solution, nothing can be put back, and the day ends when no clue can be removed. Every board carries the proven fewest clues any order can leave standing.',
  genre: ['Logic puzzle', 'Sudoku', 'Number puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('whittle'),
    { '@type': 'ListItem', position: 3, name: 'Whittle' },
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
          {'WHITTLE'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 3 ? '#854d0e' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Whittle launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The sudoku played backwards — a solved grid, and your job is to take the clues away without ever giving it a second answer. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: '#854d0e', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function WhittlePage({ searchParams }) {
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
        <WhittleClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="whittle" stage={isStageServer('whittle', searchParams)} />
    </>
  );
}
