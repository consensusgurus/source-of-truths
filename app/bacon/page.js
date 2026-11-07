import { Suspense } from 'react';
import BaconClient from './BaconClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Bacon launched 2026-11-07: link two actors through the films they share, the
// Six Degrees of Kevin Bacon game, every actor typed. /bacon is the canonical,
// evergreen URL. This server page filters live<=today before handing puzzles to
// the client, so future pairs never reach a browser.

export const metadata = {
  title: 'Free Daily Six Degrees of Kevin Bacon Game: Bacon | Mind Loft',
  description:
    'A free daily movie game like Six Degrees of Kevin Bacon: link two actors through films they made together, typing every co-star. Fewest films wins.',
  alternates: { canonical: '/bacon' },
  openGraph: {
    images: [{ url: '/og/bacon.png', width: 1200, height: 630, alt: 'Bacon, a daily link-two-actors-through-their-films game from Mind Loft' }],
    title: 'Bacon: Link Two Actors Through Their Films',
    description: 'Two actors a day. Link them through films they made together, in the fewest films. A new pair every day.',
    url: '/bacon',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/bacon.png'],
    card: 'summary_large_image',
    title: 'Bacon: Link Two Actors Through Their Films',
    description: 'Two actors a day. Link them through films they made together, in the fewest films. A new pair every day.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Bacon',
  alternateName: 'Bacon: The Daily Six Degrees of Kevin Bacon Game',
  url: `${SITE_URL}/bacon`,
  description:
    'A free daily movie trivia game played like Six Degrees of Kevin Bacon: two actors a day, linked through films they made together. Name a film, type a co-star from it, and reach the target in seven films or fewer; fewer films rank higher, then the clock.',
  genre: ['Trivia', 'Movie trivia', 'Word association', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/bacon.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('bacon'),
    { '@type': 'ListItem', position: 3, name: 'Bacon' },
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
        <BaconClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="bacon" stage={isStageServer('bacon', searchParams)} />
    </>
  );
}
