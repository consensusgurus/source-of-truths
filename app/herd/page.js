import { Suspense } from 'react';
import HerdClient from './HerdClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Herd launched 2026-10-17: ten crowd questions a day, every one A or B
// each, scored by /api/herd against the house crowd + real picks. It opens
// Read the Room. The client gets a STRIPPED view: the house crowd never ships.

export const metadata = {
  title: 'Free Daily Crowd Game, Pick What Most People Pick: Herd | Mind Loft',
  description:
    'A free daily crowd game: ten quick this-or-that questions. Pick what you think most players picked, and score a point for every call that lands with the herd.',
  alternates: { canonical: '/herd' },
  manifest: '/api/pwa-manifest?game=herd',
  icons: {
    // Favicon is the Mind Loft mark on every page (owner rule, 2026-08-31). Do NOT delete this
    // line: ANY metadata.icons object suppresses the root app/icon.png inheritance.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/herd-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Herd' },
  openGraph: {
    images: [{ url: '/og/herd.png', width: 1200, height: 630, alt: 'Herd, the daily crowd game from Mind Loft' }],
    title: 'Herd: Pick What Most People Pick',
    description: 'Ten quick questions. Pick what you think most players picked. Every call with the herd scores. From Mind Loft.',
    url: '/herd',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/herd.png'],
    card: 'summary_large_image',
    title: 'Herd: Pick What Most People Pick',
    description: 'Ten quick this-or-that calls against everyone playing today.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Herd',
  alternateName: 'Herd: Daily Crowd Game',
  url: `${SITE_URL}/herd`,
  description:
    'A free daily crowd game: ten quick this-or-that questions. Pick what you think most players picked; every call that lands with the herd scores a point. Scored against the live player pool.',
  genre: ['Crowd game', 'Party game', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1 },
  image: `${SITE_URL}/og/herd.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('herd'),
    { '@type': 'ListItem', position: 3, name: 'Herd' },
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
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Herd launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          Ten quick crowd calls a day. Come back when the first herd forms.
        </p>
        <a href="/" style={{ color: T.ink, fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function HerdPage({ searchParams }) {
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
        <HerdClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="herd" stage={isStageServer('herd', searchParams)} />
    </>
  );
}
