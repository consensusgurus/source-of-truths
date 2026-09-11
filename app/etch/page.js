import { Suspense } from 'react';
import EtchClient from './EtchClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Etch launched 2026-07-27 as the 29th daily: linked from the hub puzzles row,
// the footer, the /daily archive, and the sitemap (/etch is the canonical,
// evergreen URL). Mon-Fri are a 10x10 picture, Saturday steps up to 15x15, and
// Sunday is a 20x20 Edition. Puzzles are gated by Eastern date here, so
// tomorrow's picture (and its solution) never reaches the browser.
//
// That gate is also what makes the client's gallery safe: it only ever receives
// boards that are already live, so drawing their finished pictures leaks
// nothing about a puzzle nobody can play yet.

export const metadata = {
  title: 'Free Daily Nonogram (Picross): Etch | Mind Loft',
  description:
    'A free daily nonogram, also called picross or griddler. The row and column clues give the run lengths of filled squares. Fill the grid by pure logic, never guesswork, and a picture appears. One solution, a new picture every day, 10x10 on weekdays, a 15x15 on Saturday and a 20x20 Edition on Sunday.',
  alternates: { canonical: '/etch' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/etch.png', width: 1200, height: 630, alt: 'Etch — a daily nonogram from Mind Loft' }],
    title: 'Etch — A Daily Nonogram',
    description:
      'Row and column clues, one logical solution, and a picture at the end. A new picture-logic puzzle from Mind Loft, daily.',
    url: '/etch',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/etch.png'],
    card: 'summary_large_image',
    title: 'Etch — A Daily Nonogram',
    description: 'Fill the squares the clues force and a picture appears. One solution, no guessing.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Etch',
  alternateName: 'Etch — Daily Nonogram',
  url: `${SITE_URL}/etch`,
  description:
    'A free daily nonogram (picross): the numbers beside each row and above each column give the lengths of the filled runs in that line, in order. Fill every square the clues force and a hidden picture appears. Boards run 10x10 Monday to Friday, 15x15 on Saturday and 20x20 on Sunday. Each board has exactly one solution and is solvable by pure line logic, with no guessing. A clean, error-free solve earns a perfect score, and ties break on fewest errors then fastest time.',
  genre: ['Logic puzzle', 'Nonogram', 'Picross', 'Puzzle'],
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
    categoryCrumb('etch'),
    { '@type': 'ListItem', position: 3, name: 'Etch' },
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
          {'ETCH'.split('').map((ch, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, background: i === 3 ? '#4d7c0f' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Etch launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily nonogram — fill the squares the row and column clues force, and a picture appears. Come back when the first grid drops.
        </p>
        <a href="/daily" style={{ color: '#4d7c0f', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function EtchPage({ searchParams }) {
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
        <EtchClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="etch" stage={isStageServer('etch', searchParams)} />
    </>
  );
}
