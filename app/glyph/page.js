import { Suspense } from 'react';
import GlyphClient from './GlyphClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Glyph launched 2026-08-02 as the 42nd daily: linked from the hub puzzles row,
// the footer, the /daily archive, and the sitemap (/glyph is the canonical,
// evergreen URL). Weekdays are a 15x15 codeword; Sundays step up to a 17x17
// Edition. Puzzles are gated by Eastern date here, so tomorrow's grid (and its
// key) never reaches the browser.

export const metadata = {
  title: 'Free Daily Codeword Puzzle: Glyph | Mind Loft',
  description:
    'A free daily codeword, the crossword with no clues. Every letter is replaced by a number from 1 to 26, the same number always meaning the same letter. Crack the whole alphabet from two or three given letters. One solution, a new grid every day, and a bigger 17x17 Edition on Sundays.',
  alternates: { canonical: '/glyph' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/glyph.png', width: 1200, height: 630, alt: 'Glyph — a daily codeword from Mind Loft' }],
    title: 'Glyph — A Daily Codeword',
    description:
      'No clues. Every letter is a number, and the same number always means the same letter. Crack the code, fill the grid.',
    url: '/glyph',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/glyph.png'],
    card: 'summary_large_image',
    title: 'Glyph — A Daily Codeword',
    description: 'A crossword with no clues. Every letter is a number. Crack all 26.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Glyph',
  alternateName: 'Glyph — Daily Codeword',
  url: `${SITE_URL}/glyph`,
  description:
    'A free daily codeword puzzle: a filled crossword grid where every letter has been replaced by a number from 1 to 26, consistently across the board. There are no clues. Working from two or three given letters, letter frequency, word shapes and the crossings, you deduce what every number stands for. All 26 letters appear in every key, each board uses only common dictionary words, and each has exactly one consistent solution, so it is always solvable by deduction and never by guesswork. A clean solve with no checks earns a perfect score, and ties break on fewest checks then fastest time.',
  genre: ['Word puzzle', 'Codeword', 'Cipher', 'Puzzle'],
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
    categoryCrumb('glyph'),
    { '@type': 'ListItem', position: 3, name: 'Glyph' },
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
          {'GLYPH'.split('').map((ch, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, background: i === 4 ? '#334155' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Glyph launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily codeword — every letter is a number, and there are no clues at all. Come back when the first grid drops.
        </p>
        <a href="/daily" style={{ color: '#334155', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function GlyphPage({ searchParams }) {
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
        <GlyphClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="glyph" stage={isStageServer('glyph', searchParams)} />
    </>
  );
}
