import { Suspense } from 'react';
import SufficeClient from './SufficeClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Suffice launched as one of the daily puzzles: linked from the daily strip,
// the footer, the /daily archive, and the sitemap (/suffice is the canonical,
// evergreen URL). Eight data-sufficiency items a weekday, twelve on Sundays,
// every answer machine-proved before it ships (scripts/verify-suffice.mjs).
//
// LEAK GUARD: clientSafe() strips each item's `letter` before the day is passed
// to the client, which re-derives it from `chk` with app/suffice/engine.js. The
// answer key never ships over the wire (the Sworn pattern).

export const metadata = {
  title: 'Daily Data Sufficiency Puzzle: Suffice | Mind Loft',
  description:
    'A free daily logic game built on the data-sufficiency format: a question you never answer, and two statements. Decide what is enough to settle it. Eight items a day, twelve on Sundays, every answer machine-proved.',
  alternates: { canonical: '/suffice' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/suffice.png', width: 1200, height: 630, alt: 'Suffice — a daily data-sufficiency puzzle from Mind Loft' }],
    title: 'Suffice — Decide What Is Enough',
    description:
      'You are given a question and two statements, and you never answer the question. You say whether the statements settle it. A new set every day. From Mind Loft.',
    url: '/suffice',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/suffice.png'],
    card: 'summary_large_image',
    title: 'Suffice — Decide What Is Enough',
    description: 'A question you never answer and two statements. Is that enough? Today’s set is up.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Suffice',
  alternateName: 'Suffice — Daily Data Sufficiency Puzzle',
  url: `${SITE_URL}/suffice`,
  description:
    'A free daily logic game in the data-sufficiency format: each item pairs a question with two statements, and the player decides which statements are enough to settle it rather than answering the question. Every item is machine-proved by exhaustive decision before it ships.',
  genre: ['Logic puzzle', 'Deduction puzzle', 'Reasoning game', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/suffice.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('suffice'),
    { '@type': 'ListItem', position: 3, name: 'Suffice' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

// Strip the answer key — the client re-derives each letter from `chk`.
function clientSafe(p) {
  return { ...p, items: p.items.map(({ letter, ...rest }) => rest) };
}

function ComingSoon({ first }) {
  // Rendered only if no day is live yet. Never crash the route on an empty
  // visible set — show a friendly placeholder instead.
  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: "'Manrope', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 18 }}>
          {'SUFFICE'.split('').map((ch, i) => (
            <div key={i} style={{ width: 38, height: 38, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, background: i === 0 ? '#4338ca' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Suffice opens {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          A question you never answer, and two statements. You decide whether they settle it. Come back for the first set.
        </p>
        <a href="/daily" style={{ color: '#4338ca', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function SufficePage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today).map(clientSafe);
  if (!visiblePuzzles.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <SufficeClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="suffice" stage={isStageServer('suffice', searchParams)} />
    </>
  );
}
