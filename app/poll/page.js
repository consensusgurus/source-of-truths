import { Suspense } from 'react';
import PollClient from './PollClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Poll launched 2026-11-16: five A-or-B questions a day. The player gives
// their own pick and guesses the percentage of players on each side, scored
// by /api/poll against the house crowd + real picks (lib/poll-score.js).
// The client gets a STRIPPED view: the house crowd never ships.

export const metadata = {
  title: 'Free Daily Poll Game, Guess How the Crowd Split: Poll | Mind Loft',
  description:
    'A free daily crowd game: five this-or-that questions. Pick your side, then guess the percentage of players who agree. Closest guess wins.',
  alternates: { canonical: '/poll' },
  manifest: '/api/pwa-manifest?game=poll',
  icons: {
    // Favicon is the Mind Loft mark on every page (owner rule, 2026-08-31). Do NOT delete this
    // line: ANY metadata.icons object suppresses the root app/icon.png inheritance.
    icon: [{ url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }, { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' }, { url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/poll-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Poll' },
  openGraph: {
    images: [{ url: '/og/poll.png', width: 1200, height: 630, alt: 'Poll, the daily guess-the-split crowd game from Mind Loft' }],
    title: 'Poll: Guess How the Crowd Split',
    description: 'Five this-or-that questions. Pick yours, then guess the percentage on each side. Closest guess wins. From Mind Loft.',
    url: '/poll',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/poll.png'],
    card: 'summary_large_image',
    title: 'Poll: Guess How the Crowd Split',
    description: 'Cheez-Its or Goldfish? Pick yours, then guess how everyone playing today split.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Poll',
  alternateName: 'Poll: Daily Guess the Split Game',
  url: `${SITE_URL}/poll`,
  description:
    'A free daily crowd game: five this-or-that questions. Give your own pick, then guess the percentage of players on each side. Scored out of 100 against the live player pool.',
  genre: ['Crowd game', 'Party game', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1 },
  image: `${SITE_URL}/og/poll.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('poll'),
    { '@type': 'ListItem', position: 3, name: 'Poll' },
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
    prompts: p.prompts.map((pr) => ({ q: pr.q, options: pr.options })),
  };
}

function ComingSoon({ first }) {
  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: "'Manrope', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Poll launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          Five this-or-that questions a day. Come back when the first poll opens.
        </p>
        <a href="/" style={{ color: T.ink, fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function PollPage({ searchParams }) {
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
        <PollClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="poll" stage={isStageServer('poll', searchParams)} />
    </>
  );
}
