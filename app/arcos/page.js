import { Suspense } from 'react';
import ArcosClient from './ArcosClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Arcos launched 2026-10-18 as the daily set of acrostics: three clued
// acrostics (first letters, last letters, the diagonal) and a finale word that
// goes with all three hidden words.
//
// /arcos is the canonical, evergreen URL; the dated /quiz/arcos-* stubs
// canonicalize here. This server page filters live<=today before handing
// puzzles to the client, so future boards (and their answers) never reach a
// browser.

export const metadata = {
  title: 'Free Daily Acrostic Puzzle: Arcos | Mind Loft',
  description:
    'A free daily set of acrostics: solve the clues and the first letters, last letters and diagonal each spell a hidden word, then find the word tying all three.',
  alternates: { canonical: '/arcos' },
  openGraph: {
    images: [{ url: '/og/arcos.png', width: 1200, height: 630, alt: 'Arcos, a daily set of acrostics from Mind Loft' }],
    title: 'Arcos: The Daily Set of Acrostics',
    description:
      'Three acrostics, three hidden words, and one more word that goes with all of them. A new word puzzle from Mind Loft, every day.',
    url: '/arcos',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/arcos.png'],
    card: 'summary_large_image',
    title: 'Arcos: The Daily Set of Acrostics',
    description: 'Three acrostics, three hidden words, one word that ties them together.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Arcos',
  alternateName: 'Arcos: Daily Set of Acrostics',
  url: `${SITE_URL}/arcos`,
  description:
    'A free daily set of acrostics. Solve the crossword clues in three acrostics: the first letters of the answers spell a hidden word, the last letters spell another, and the diagonal spells a third. Then find the one word that goes with all three. Each acrostic is worth three points and the finale one, with time breaking ties.',
  genre: ['Word puzzle', 'Acrostic', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/arcos.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('arcos'),
    { '@type': 'ListItem', position: 3, name: 'Arcos' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function ArcosPage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today);
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <ArcosClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="arcos" stage={isStageServer('arcos', searchParams)} />
    </>
  );
}
