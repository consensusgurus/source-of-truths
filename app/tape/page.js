import { Suspense } from 'react';
import TapeClient from './TapeClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Tape launched 2026-11-06: name the company from five years of its stock
// chart, with six clues that open one at a time. /tape is the canonical,
// evergreen URL. This server page filters live<=today before handing puzzles to
// the client, so future answers never reach a browser.

export const metadata = {
  title: 'Free Daily Stock Chart Guessing Game: Tape | Mind Loft',
  description:
    'A free daily stock market game: name the company from five years of its chart, prices hidden. Any Russell 3000 stock counts. Fewest clues wins.',
  alternates: { canonical: '/tape' },
  openGraph: {
    images: [{ url: '/og/tape.png', width: 1200, height: 630, alt: 'Tape, a daily guess-the-company-from-its-stock-chart game from Mind Loft' }],
    title: 'Tape: Name the Company From Its Stock Chart',
    description: 'Five years of a stock chart, prices hidden. Name the company in the fewest clues. A new chart every day.',
    url: '/tape',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/tape.png'],
    card: 'summary_large_image',
    title: 'Tape: Name the Company From Its Stock Chart',
    description: 'Five years of a stock chart, prices hidden. Name the company in the fewest clues. A new chart every day.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Tape',
  alternateName: 'Tape: The Daily Stock Chart Guessing Game',
  url: `${SITE_URL}/tape`,
  description:
    'A free daily stock market guessing game: five years of one company’s weekly stock chart with the prices hidden, and six clues that open one at a time. Any Russell 3000 company is a fair guess; fewer clues rank higher, then the clock.',
  genre: ['Trivia', 'Guessing game', 'Stock market game', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/tape.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('tape'),
    { '@type': 'ListItem', position: 3, name: 'Tape' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function Page({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today);
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {/* Suspense is required: the client reads useSearchParams. */}
      <Suspense fallback={null}>
        <TapeClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="tape" stage={isStageServer('tape', searchParams)} />
    </>
  );
}
