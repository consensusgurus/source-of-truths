import { Suspense } from 'react';
import DocketClient from './DocketClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Docket launched as one of the daily puzzles: linked from the daily strip, the
// footer, the /daily archive, and the sitemap (/docket is the canonical,
// evergreen URL). One setup, four to seven conditions and five questions a
// weekday; Sundays run the stacked two-dimension board. Every answer is proved by
// exhaustive enumeration before it ships (scripts/verify-docket.mjs).
//
// The bank carries no answer key. app/docket/engine.js enumerates each day's
// arrangements in the browser and derives the key from the same conditions the
// player is reading, so the game cannot disagree with itself.
//
// NAMING: the format is the analytical reasoning section a well known
// standardized test retired. We reference it obliquely and never name it, here or
// in the copy. That is deliberate, both for tone and because the name is somebody
// else's trademark.

export const metadata = {
  title: 'Daily Logic Game: Docket | Mind Loft',
  description:
    'A free daily logic game in a familiar but retired section of an important standardized test: one setup, a handful of conditions, and five questions about what those conditions force. Five a day, a bigger two-dimension board on Sundays, every answer machine-proved.',
  alternates: { canonical: '/docket' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/docket.png', width: 1200, height: 630, alt: 'Docket — a daily logic game from Mind Loft' }],
    title: 'Docket — One Setup, Five Deductions',
    description:
      'Read a small formal world and a few conditions, work out what they force, then answer five questions off the same diagram. The reasoning format a well known standardized test retired. A new one every day, from Mind Loft.',
    url: '/docket',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/docket.png'],
    card: 'summary_large_image',
    title: 'Docket — One Setup, Five Deductions',
    description: 'A small world, a few conditions, and five questions about what they force. Today’s docket is up.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Docket',
  alternateName: 'Docket — Daily Logic Game',
  url: `${SITE_URL}/docket`,
  description:
    'A free daily analytical reasoning puzzle. Each day gives a setup describing a small world, a numbered list of conditions constraining it, and five multiple-choice questions about what the conditions do and do not force. Every answer is proved by exhaustive enumeration of the arrangements the conditions allow before the puzzle ships.',
  genre: ['Logic puzzle', 'Deduction puzzle', 'Reasoning game', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/docket.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('docket'),
    { '@type': 'ListItem', position: 3, name: 'Docket' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

// The generator's bookkeeping (difficulty band, sample counts) is of no use to a
// player, so only the arrangement count travels, which the results panel shows.
function clientSafe(p) {
  return { ...p, meta: { sols: p.meta ? p.meta.sols : 0 } };
}

function ComingSoon({ first }) {
  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: "'Manrope', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 18 }}>
          {'DOCKET'.split('').map((ch, i) => (
            <div key={i} style={{ width: 38, height: 38, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, background: i === 0 ? '#5b2333' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Docket opens {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          One setup, a handful of conditions, and five questions about what they force. Come back for the first one.
        </p>
        <a href="/daily" style={{ color: '#5b2333', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function DocketPage({ searchParams }) {
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
        <DocketClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="docket" stage={isStageServer('docket', searchParams)} />
    </>
  );
}
