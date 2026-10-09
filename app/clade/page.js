import { Suspense } from 'react';
import CladeClient from './CladeClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Clade is the daily animal family-tree game: one hidden animal, eight
// guesses, and every guess answered with the closest branch of the tree it
// shares with the answer.
//
// /clade is the canonical, evergreen URL; the dated /quiz/clade-* stubs
// canonicalize here. This server page filters live<=today before handing
// puzzles to the client, so future answers never reach a browser.

export const metadata = {
  title: 'Free Daily Animal Guessing Game: Clade | Mind Loft',
  description:
    'A free daily animal guessing game. Name an animal and learn the closest branch of the family tree it shares with the hidden one. Eight guesses to close in, a new animal every day, a rare one on Sundays.',
  alternates: { canonical: '/clade' },
  openGraph: {
    images: [{ url: '/og/clade.png', width: 1200, height: 630, alt: 'Clade, a daily animal family-tree guessing game from Mind Loft' }],
    title: 'Clade: Guess the Animal by Its Family Tree',
    description:
      'Every guess tells you the closest branch it shares with the hidden animal. Eight guesses, from Mind Loft, daily.',
    url: '/clade',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/clade.png'],
    card: 'summary_large_image',
    title: 'Clade: Guess the Animal by Its Family Tree',
    description:
      'Name an animal, learn the branch it shares with the hidden one, and close in. Fewer guesses score more.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Clade',
  alternateName: 'Clade, Daily Animal Family Tree Game',
  url: `${SITE_URL}/clade`,
  description:
    'A free daily animal guessing game built on the tree of life: each guess is answered with the closest branch of the animal family tree that it shares with the hidden animal. Eight guesses; fewer guesses score more and ties break on fastest time.',
  genre: ['Trivia', 'Guessing game', 'Puzzle'],
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
    categoryCrumb('clade'),
    { '@type': 'ListItem', position: 3, name: 'Clade' },
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
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Clade launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily animal family-tree game. Come back when the first animal drops.
        </p>
        <a href="/" style={{ color: '#1a7f37', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function CladePage({ searchParams }) {
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
        <CladeClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="clade" stage={isStageServer('clade', searchParams)} />
    </>
  );
}
