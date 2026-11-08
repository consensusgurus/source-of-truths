import { Suspense } from 'react';
import CarmenClient from './CarmenClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Carmen launched 2026-11-08: the daily globe chase. A Geography daily that
// also sits on the Trivia shelf (alsoCat in lib/daily-games.js).

export const metadata = {
  title: 'Free Daily Geography Game: Carmen, Chase a Thief | Mind Loft',
  description:
    'A free daily geography game: read detective clues and pin the city a thief fled to on a 3D globe. Closer pins score more. Five legs, six on Sundays.',
  alternates: { canonical: '/carmen' },
  openGraph: {
    images: [{ url: '/og/carmen.png', width: 1200, height: 630, alt: 'Carmen, a daily geography chase on a globe from Mind Loft' }],
    title: 'Carmen: A Daily Geography Chase on a Globe',
    description: 'A thief is loose. Read the evidence, pin her next city on the globe, and catch her on the final leg.',
    url: '/carmen',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/carmen.png'],
    card: 'summary_large_image',
    title: 'Carmen: A Daily Geography Chase on a Globe',
    description: 'A thief is loose. Read the evidence, pin her next city on the globe, and catch her on the final leg.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Carmen',
  alternateName: 'Carmen, Daily Geography Chase Game',
  url: `${SITE_URL}/carmen`,
  description:
    'A daily geography trivia game. Follow a thief city to city: read detective clues, drop a pin on a 3D globe, and score by how close you land. Five legs a day, six on Sundays.',
  genre: ['Geography', 'Trivia'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/carmen.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('carmen'),
    { '@type': 'ListItem', position: 3, name: 'Carmen' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

function ComingSoon({ first }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 420, width: '100%', background: '#fff', border: '1px solid #0b0d12', borderRadius: 12, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Carmen</div>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: '#3f4757', margin: '0 0 16px' }}>
          Carmen launches {first.dateLabel}. Same thief for everybody.
        </p>
        <a href="/" style={{ display: 'inline-block', background: '#2563eb', color: '#fff', fontWeight: 800, fontSize: 14, padding: '11px 22px', borderRadius: 9, textDecoration: 'none' }}>
          Today&rsquo;s slate
        </a>
      </div>
    </div>
  );
}

export default function CarmenPage({ searchParams }) {
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
        <CarmenClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="carmen" stage={isStageServer('carmen', searchParams)} />
    </>
  );
}
