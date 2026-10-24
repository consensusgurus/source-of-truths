import { Suspense } from 'react';
import AorbClient from './AorbClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Aorb launched 2026-10-23: ten A-or-B pairs a day. On each the player makes
// their own pick and calls the crowd's; /api/aorb scores the call on the live
// split. The client gets a STRIPPED view: the house crowd and lanes never ship.

export const metadata = {
  title: 'Free Daily A or B Game, Read the Crowd: Aorb | Mind Loft',
  description:
    'A free daily A or B game: ten pairs, better movie, better burger, who is more attractive. Make your pick, then call the crowd. Scored on the real split.',
  alternates: { canonical: '/aorb' },
  manifest: '/api/pwa-manifest?game=aorb',
  icons: {
    // Favicon is the Mind Loft mark on every page (owner rule, 2026-08-31). Do NOT delete this
    // line: ANY metadata.icons object suppresses the root app/icon.png inheritance.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/aorb-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Aorb' },
  openGraph: {
    images: [{ url: '/og/aorb.png', width: 1200, height: 630, alt: 'Aorb, the daily A or B crowd game from Mind Loft' }],
    title: 'Aorb: A or B, and What Will Everyone Pick?',
    description: 'Ten pairs a day. Make your own pick, then call the crowd. Scored on the real split. From Mind Loft.',
    url: '/aorb',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/aorb.png'],
    card: 'summary_large_image',
    title: 'Aorb: A or B, and What Will Everyone Pick?',
    description: 'Ten A or B pairs. Your pick, then the crowd call.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Aorb',
  alternateName: 'Aorb: Daily A or B Game',
  url: `${SITE_URL}/aorb`,
  description:
    'A free daily A or B game: ten pairs, each with two picks, your own and your call on the crowd. The call scores the real split of today\'s players.',
  genre: ['Crowd game', 'Party game', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1 },
  image: `${SITE_URL}/og/aorb.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('aorb'),
    { '@type': 'ListItem', position: 3, name: 'Aorb' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

// Strip everything the browser must not see: the house crowd.
function clientSafe(p) {
  return {
    num: p.num,
    quizId: p.quizId,
    live: p.live,
    dateLabel: p.dateLabel,
    sunday: !!p.sunday,
    prompts: p.prompts.map((pr) => ({ q: pr.q, options: pr.options })),
  };
}

function ComingSoon({ first }) {
  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: "'Manrope', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Aorb launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          Ten A or B pairs a day. Come back when the first one opens.
        </p>
        <a href="/" style={{ color: T.ink, fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function AorbPage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today).map(clientSafe);
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
        <AorbClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="aorb" stage={isStageServer('aorb', searchParams)} />
    </>
  );
}
