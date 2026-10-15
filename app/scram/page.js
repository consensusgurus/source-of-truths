import { Suspense } from 'react';
import ScramClient from './ScramClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Scram launched 2026-10-14 as the daily themed word scramble: one broad theme
// a day and ten scrambled answers from it, typed back on a keyboard where only
// the scramble's letters are live, against the clock.
//
// /scram is the canonical, evergreen URL; the dated /quiz/scram-* stubs
// canonicalize here. This server page filters live<=today before handing
// puzzles to the client, so future boards (and their answers) never reach a
// browser.

export const metadata = {
  title: 'Free Daily Themed Word Scramble Game: Scram | Mind Loft',
  description:
    'A free daily themed word scramble: ten scrambled cities, foods, animals or names to unscramble against the clock. A new theme daily, longer words on Sundays.',
  alternates: { canonical: '/scram' },
  openGraph: {
    images: [{ url: '/og/scram.png', width: 1200, height: 630, alt: 'Scram, a daily themed word scramble from Mind Loft' }],
    title: 'Scram: The Daily Themed Word Scramble',
    description:
      'One theme, ten scrambled answers, one clock. Unscramble today’s cities, foods or names faster than everyone else. A new word game from Mind Loft, daily.',
    url: '/scram',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/scram.png'],
    card: 'summary_large_image',
    title: 'Scram: The Daily Themed Word Scramble',
    description: 'One theme, ten scrambled answers, one clock. How fast can you unscramble today’s ten?',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Scram',
  alternateName: 'Scram: Daily Themed Word Scramble',
  url: `${SITE_URL}/scram`,
  description:
    'A free daily themed word scramble: one broad theme a day (cities, countries, food, animals, jobs, first names and more) and ten scrambled answers to unscramble. Only the scramble’s letters are live on the keyboard, a full answer checks itself, and the score is answers solved out of ten, with time breaking ties.',
  genre: ['Word puzzle', 'Word scramble', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/scram.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('scram'),
    { '@type': 'ListItem', position: 3, name: 'Scram' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function ScramPage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today);
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {/* Suspense is required: ScramClient reads useSearchParams (the stage flag). */}
      <Suspense fallback={null}>
        <ScramClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="scram" stage={isStageServer('scram', searchParams)} />
    </>
  );
}
