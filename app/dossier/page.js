import { Suspense } from 'react';
import DossierClient from './DossierClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Dossier is the daily attribute guessing game: one hidden president, element
// or US state, and every guess answered across five attributes with a match,
// a higher or a lower.
//
// /dossier is the canonical, evergreen URL; the dated /quiz/dossier-* stubs
// canonicalize here. This server page filters live<=today before handing
// puzzles to the client, so future answers never reach a browser.

export const metadata = {
  title: 'Free Daily Trivia Guessing Game: Dossier | Mind Loft',
  description:
    'A free daily trivia guessing game. Name a US president, a chemical element or a US state and see how five of its facts compare with the hidden answer: a match, higher or lower. Eight guesses, six on Sundays.',
  alternates: { canonical: '/dossier' },
  openGraph: {
    images: [{ url: '/og/dossier.png', width: 1200, height: 630, alt: 'Dossier, a daily five-clue trivia guessing game from Mind Loft' }],
    title: 'Dossier: Five Clues on Every Guess',
    description:
      'Each guess shows what matches the hidden answer and what runs higher or lower. Eight guesses, from Mind Loft, daily.',
    url: '/dossier',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/dossier.png'],
    card: 'summary_large_image',
    title: 'Dossier: Five Clues on Every Guess',
    description:
      'Presidents, elements and states. Each guess shows what matches and what runs higher or lower. Fewer guesses score more.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Dossier',
  alternateName: 'Dossier, Daily Attribute Guessing Game',
  url: `${SITE_URL}/dossier`,
  description:
    'A free daily trivia guessing game: name a US president, a chemical element or a US state and compare five of its attributes with the hidden answer, each marked as a match, higher or lower. Eight guesses; fewer guesses score more and ties break on fastest time.',
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
    categoryCrumb('dossier'),
    { '@type': 'ListItem', position: 3, name: 'Dossier' },
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
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Dossier launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily five-clue guessing game. Come back when the first answer drops.
        </p>
        <a href="/daily" style={{ color: '#1a7f37', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function DossierPage({ searchParams }) {
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
        <DossierClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="dossier" stage={isStageServer('dossier', searchParams)} />
    </>
  );
}
