import { Suspense } from 'react';
import AnonClient from './AnonClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Anon launched 2026-08-07 as the 50th daily: a clueless acrostic. A passage in
// a grid, one box per letter, and a bank of answers that share those same
// letters, so typing in either half fills the other. The first letters of the
// spine answers spell the author, which is the payoff the game is named for.
// Boards are gated by Eastern date here, so tomorrow's passage never reaches the
// browser.

export const metadata = {
  title: 'Free Daily Acrostic Puzzle: Anon | Mind Loft',
  description:
    'A free daily acrostic with no clues. A passage sits in the grid, one box per letter, and every box also belongs to one answer in the bank, so a letter typed in either half appears in the other. Some answers carry a category you can recite in your head; about half carry none at all. Finish it and the first letters of the answers have spelled out who wrote it. New passage daily, longer one on Sundays.',
  alternates: { canonical: '/anon' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/anon.png', width: 1200, height: 630, alt: 'Anon — a daily acrostic with no clues, from Mind Loft' }],
    title: 'Anon — A Daily Acrostic With No Clues',
    description:
      'An unsigned passage, a bank of answers, and no clues anywhere. Fill it in and it tells you who wrote it.',
    url: '/anon',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/anon.png'],
    card: 'summary_large_image',
    title: 'Anon — A Daily Acrostic With No Clues',
    description: 'An unsigned passage and a bank of answers. Finish it and it names its own author.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Anon',
  alternateName: 'Anon — Daily Acrostic Puzzle',
  url: `${SITE_URL}/anon`,
  description:
    'A free daily acrostic puzzle with no clues. A passage from a published work sits in a grid of empty boxes, one box per letter, and every box also belongs to exactly one answer in the bank below, so the two halves are the same letters seen twice and a letter entered in either one appears in the other. Some answers carry a category tight enough to recite, such as a planet or a chess piece, and those are the way into the board; the rest carry no category at all and have to come from the passage reading as English. The first letters of the spine answers spell the author of the passage. There are no checks and no hints: a wrong answer stops the passage making sense, which is the only feedback the puzzle needs.',
  genre: ['Word puzzle', 'Acrostic', 'Crossword', 'Puzzle'],
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
    categoryCrumb('anon'),
    { '@type': 'ListItem', position: 3, name: 'Anon' },
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
          {'ANON'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 24, background: i === 0 ? '#8c2f39' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Anon launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily acrostic with no clues. An unsigned passage, a bank of answers, and the two halves fill each other in.
        </p>
        <a href="/daily" style={{ color: '#8c2f39', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function AnonPage({ searchParams }) {
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
        <AnonClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="anon" stage={isStageServer('anon', searchParams)} />
    </>
  );
}
