import { Suspense } from 'react';
import SlotClient from './SlotClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Slot launched 2026-09-04. Ten things on one axis, dealt one at a time,
// each placed before the next is shown. The bank is resolved HERE, on the
// server, and only the picked day's items and reveal order ship to the
// browser, so tomorrow's answers never reach a client. The shared daily
// consumers get the light rows only.

export const metadata = {
  title: 'Free Daily Blind Ranking Puzzle, Ten Things One at a Time: Slot | Mind Loft',
  description:
    'A free daily blind ranking puzzle. Ten real things on one axis arrive one at a time, and each has to be placed in a slot before the next is shown. Nothing moves once it is down. No app, no signup, a new board every day.',
  alternates: { canonical: '/slot' },
  openGraph: {
    // Static share card, per the 2026-09-02 rule: a new daily ships
    // public/og/<key>.png plus these two lines, never an opengraph-image route.
    images: [{ url: '/og/slot.png', width: 1200, height: 630, alt: 'Slot, a daily puzzle from Mind Loft' }],
    title: 'Slot: The Daily Blind Ranking Puzzle',
    description: 'Ten things, one at a time. Place each before you see the next, and nothing moves once it is down.',
    url: '/slot', type: 'website', siteName: 'Mind Loft',
  },
  twitter: { images: ['/og/slot.png'], card: 'summary_large_image', title: 'Slot: The Daily Blind Ranking Puzzle', description: 'Ten things, one at a time. Place each before you see the next.' },
};

const gameJsonLd = {
  '@context': 'https://schema.org', '@type': 'Game', name: 'Slot',
  alternateName: 'Slot: Daily Blind Ranking Puzzle', url: `${SITE_URL}/slot`,
  description:
    'A free daily blind ranking puzzle. Ten real things on one hard numeric axis (countries by population, films by running time, metals by density) arrive one at a time, and each has to be dropped into an empty slot before the next is shown. A placement never moves. Score is exact placements out of ten, every board carries a par set by the order of arrival, and the Sunday Edition runs twelve slots. Everyone gets the same board, so the daily leaderboard ranks by exact placements, then near misses, then time.',
  genre: ['Trivia', 'Puzzle', 'Quiz'],
  gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};
const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('slot'),
    { '@type': 'ListItem', position: 3, name: 'Slot' },
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
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 18 }}>
          {'SLOT'.split('').map((ch, i) => (
            <div key={i} style={{ width: 38, height: 38, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, background: i === 0 ? '#4a5d23' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Slot launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily blind ranking. Ten things, one at a time. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: '#4a5d23', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function SlotPage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today);
  if (!visiblePuzzles.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  const picked = (forceNum && visiblePuzzles.find((p) => p.num === forceNum)) || visiblePuzzles[visiblePuzzles.length - 1];
  const lightPuzzles = visiblePuzzles.map(({ num, quizId, live, dateLabel, sunday, par }) => ({ num, quizId, live, dateLabel, sunday, par }));
  // The numeric value stays on the server; the reveal prints the display string.
  const day = {
    axis: picked.axis, top: picked.top, bottom: picked.bottom, unit: picked.unit, dir: picked.dir, source: picked.source, par: picked.par,
    items: picked.items.map(([name, , display]) => [name, display]), reveal: picked.reveal,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <SlotClient key={picked.num} puzzles={lightPuzzles} dayByNum={{ [picked.num]: day }} forceNum={forceNum} />
      </Suspense>
      <StageTail self="slot" stage={isStageServer('slot', searchParams)} />
    </>
  );
}
