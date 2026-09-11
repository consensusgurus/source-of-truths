import { Suspense } from 'react';
import ThreadClient from './ThreadClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Thread launched 2026-09-01. Nine films described badly, one hidden thread.
// The bank is resolved HERE, on the server, and only the picked day's tiles,
// threads and decoys ship to the browser, so tomorrow's answers never reach
// a client. The shared daily consumers get the light rows only.

export const metadata = {
  title: 'Free Daily Movie Puzzle, Nine Films and One Hidden Thread: Thread | Mind Loft',
  description:
    'A free daily movie puzzle. Nine films are each described in one sentence by someone who missed the point, and all nine share one hidden thread. Name the films, call the thread, and call it early for more points. No app, no signup, a new board every day.',
  alternates: { canonical: '/thread' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/thread.png', width: 1200, height: 630, alt: 'Thread — a daily puzzle from Mind Loft' }],
    title: 'Thread — The Daily Badly Described Movie Puzzle',
    description: 'Nine films described by someone who missed the point. Name them, then call the one thing they all share.',
    url: '/thread', type: 'website', siteName: 'Mind Loft',
  },
  twitter: { images: ['/og/thread.png'], card: 'summary_large_image', title: 'Thread — The Daily Badly Described Movie Puzzle', description: 'Nine films described badly. Name them, then call the thread.' },
};

const gameJsonLd = {
  '@context': 'https://schema.org', '@type': 'Game', name: 'Thread',
  alternateName: 'Thread — Daily Movie Logline Puzzle', url: `${SITE_URL}/thread`,
  description:
    'A free daily movie puzzle. Nine films are each described in one sentence by someone who technically watched them and missed the point, and all nine share one hidden thread: a director, an actor, a year, a city, a way of ending. Name the films in any order, then call the thread. The earlier the call, the more it pays; three wrong calls lock it. Sundays run sixteen films and two threads. Everyone gets the same board, so the daily leaderboard ranks by score, then by how early the thread was called, then time.',
  genre: ['Trivia', 'Movies', 'Puzzle', 'Quiz'],
  gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};
const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('thread'),
    { '@type': 'ListItem', position: 3, name: 'Thread' },
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
          {'THREAD'.split('').map((ch, i) => (
            <div key={i} style={{ width: 38, height: 38, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, background: i === 0 ? '#8b2c6b' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Thread launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily badly described movie puzzle. Nine films, one thread. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: '#8b2c6b', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function ThreadPage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today);
  if (!visiblePuzzles.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  const picked = (forceNum && visiblePuzzles.find((p) => p.num === forceNum)) || visiblePuzzles[visiblePuzzles.length - 1];
  const lightPuzzles = visiblePuzzles.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <ThreadClient key={picked.num} puzzles={lightPuzzles} dayByNum={{ [picked.num]: { tiles: picked.tiles, threads: picked.threads, decoys: picked.decoys || [] } }} forceNum={forceNum} />
      </Suspense>
      <StageTail self="thread" stage={isStageServer('thread', searchParams)} />
    </>
  );
}
