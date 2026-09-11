import { Suspense } from 'react';
import StrataClient from './StrataClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Strata launched as one of the daily puzzles: linked from the daily strip, the
// footer, the /daily archive, and the sitemap (/strata is the canonical,
// evergreen URL). A 5x5 grid of letters a weekday, 6x7 and two threads on
// Sundays, every board machine-proved before it ships (scripts/verify-strata.mjs).
//
// LEAK GUARD: clientSafe() strips `owners` (the cell to word map) and `pool`
// (the rest of the day's category) before the day is handed to the client, so
// the browser gets the letters and the answer list but never the positions. It
// finds each placement by searching, exactly as the player does, which is also
// why the bank proves every placement unique.

export const metadata = {
  title: 'Daily Word Excavation Game: Strata | Mind Loft',
  description:
    'A free daily word game you dig out. Every letter belongs to one of the hidden words, all members of a category you are not told. Find a word and the letters above it fall, which is what lets you read the next one. Bigger grid and two threads on Sundays.',
  alternates: { canonical: '/strata' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/strata.png', width: 1200, height: 630, alt: 'Strata — a daily word game with gravity, from Mind Loft' }],
    title: 'Strata — Find a Word, Watch the Board Fall',
    description:
      'Every letter belongs to one of the day’s hidden words. Trace one and it lifts out, the letters above it drop, and the board you were reading is gone. A new grid every day. From Mind Loft.',
    url: '/strata',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/strata.png'],
    card: 'summary_large_image',
    title: 'Strata — Find a Word, Watch the Board Fall',
    description: 'A daily word grid with gravity. Most of today’s words cannot be read until the board collapses.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Strata',
  alternateName: 'Strata — Daily Word Excavation Game',
  url: `${SITE_URL}/strata`,
  description:
    'A free daily word game played on a grid of letters where every letter belongs to one of the hidden answers. Finding a word removes its letters and the remaining letters fall, reshaping the board so that words which could not be read before become readable. Every board is machine-proved to have no dead end in any order of play.',
  genre: ['Word game', 'Word search', 'Puzzle', 'Vocabulary game'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/strata.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('strata'),
    { '@type': 'ListItem', position: 3, name: 'Strata' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

// Hand over the letters and the answer list, never the map from cell to word.
function clientSafe(p) {
  const { owners, pool, ...rest } = p;
  return rest;
}

function ComingSoon({ first }) {
  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: "'Manrope', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 18 }}>
          {'STRATA'.split('').map((ch, i) => (
            <div key={i} style={{ width: 38, height: 38, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, background: i === 0 ? '#9a3412' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Strata opens {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          A grid of letters with a few words buried in it. Find one and everything above it falls. Come back for the first dig.
        </p>
        <a href="/daily" style={{ color: '#9a3412', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function StrataPage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today).map(clientSafe);
  if (!visiblePuzzles.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <StrataClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="strata" stage={isStageServer('strata', searchParams)} />
    </>
  );
}
