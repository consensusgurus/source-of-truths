import { Suspense } from 'react';
import WitnessClient from './WitnessClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Witness launched 2026-11-12: the daily scene-memory game. A street scene
// shows for twenty seconds, then six questions from memory. /witness is the
// canonical, evergreen URL. This server page filters live<=today before handing
// puzzles to the client, so future scenes and answers never reach a browser.

export const metadata = {
  title: 'Free Daily Memory Game, What Did You See: Witness | Mind Loft',
  description:
    'A free daily memory game: study a street scene for twenty seconds, then answer six questions about what you saw. The scene gets busier through the week.',
  alternates: { canonical: '/witness' },
  openGraph: {
    images: [{ url: '/og/witness.png', width: 1200, height: 630, alt: 'Witness, a daily scene memory game from Mind Loft' }],
    title: 'Witness: Study the Scene, Then Answer From Memory',
    description: 'Twenty seconds with a street scene, then it disappears. What color was the van? How many people were waiting? A new scene every day.',
    url: '/witness',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/witness.png'],
    card: 'summary_large_image',
    title: 'Witness: Study the Scene, Then Answer From Memory',
    description: 'Twenty seconds with a street scene, then it disappears. What color was the van? How many people were waiting? A new scene every day.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Witness',
  alternateName: 'Witness: The Daily Scene Memory Game',
  url: `${SITE_URL}/witness`,
  description:
    'A free daily memory game: one illustrated street scene shown for twenty seconds, then six multiple choice questions about what was in it. Scenes grow more detailed from Monday to Sunday. Scored on answers right, then the clock.',
  genre: ['Memory game', 'Observation game', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/witness.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('witness'),
    { '@type': 'ListItem', position: 3, name: 'Witness' },
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
        <WitnessClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="witness" stage={isStageServer('witness', searchParams)} />
    </>
  );
}
