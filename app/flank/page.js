import { Suspense } from 'react';
import FlankClient from './FlankClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { BORDERS } from './borders';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Flank launched 2026-08-28. One country a day; name every country that
// shares a land border with it before three wrong countries end the run
// (four on Sundays, which hand you a giant). The bank is resolved HERE, on
// the server, and only the picked day's country and answer set ship to the
// browser, so tomorrow's country never reaches a client.

export const metadata = {
  title: 'Free Daily Country Borders Game: Flank | Mind Loft',
  description:
    'A free daily geography game. One country is revealed each day; name every country on its land border before three wrong guesses end the run. Monday starts with one border, Sunday hands you a fourteen-neighbor giant. No app, no signup, a new country every day.',
  alternates: { canonical: '/flank' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/flank.png', width: 1200, height: 630, alt: 'Flank — a daily puzzle from Mind Loft' }],
    title: 'Flank — The Daily Borders Game',
    description: 'One country a day. Name every country on its border before three wrong guesses end the run.',
    url: '/flank', type: 'website', siteName: 'Mind Loft',
  },
  twitter: { images: ['/og/flank.png'], card: 'summary_large_image', title: 'Flank — The Daily Borders Game', description: 'One country a day. Name every country on its border.' },
};

const gameJsonLd = {
  '@context': 'https://schema.org', '@type': 'Game', name: 'Flank',
  alternateName: 'Flank — Daily Country Borders Quiz', url: `${SITE_URL}/flank`,
  description:
    'A free daily geography game. One country is revealed each day, and the puzzle is to name every country that shares a land border with it. A correct neighbor banks itself as soon as it is typed; a real country that does not border costs a strike, and three strikes end the run, with a fourth on the Sunday Edition giants. Everyone plays the same country each day, and the daily leaderboard ranks borders named, then fewest wrong guesses, then time.',
  genre: ['Geography', 'Trivia', 'Quiz', 'Word Game'],
  gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};
const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('flank'),
    { '@type': 'ListItem', position: 3, name: 'Flank' },
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
          {'FLANK'.split('').map((ch, i) => (
            <div key={i} style={{ width: 38, height: 38, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, background: i === 0 ? '#3f6212' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Flank launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily borders game. One country, every neighbor. Come back when the first country drops.
        </p>
        <a href="/daily" style={{ color: '#3f6212', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function FlankPage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today);
  if (!visiblePuzzles.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  // Same pick logic as the client: the forced archive day if it is visible,
  // else today's. Only the picked day's country and answers are shipped;
  // the light puzzles carry each day's total so the cross-device stats
  // merge can turn a scorePct back into a count.
  const picked = (forceNum && visiblePuzzles.find((p) => p.num === forceNum)) || visiblePuzzles[visiblePuzzles.length - 1];
  if (!BORDERS[picked.c]) return <ComingSoon first={PUZZLES[0]} />;
  const lightPuzzles = visiblePuzzles.map(({ num, quizId, live, dateLabel, sunday, a }) => ({ num, quizId, live, dateLabel, sunday, total: a.length }));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <FlankClient key={picked.num} puzzles={lightPuzzles} dayByNum={{ [picked.num]: { c: picked.c, a: picked.a } }} forceNum={forceNum} />
      </Suspense>
      <StageTail self="flank" stage={isStageServer('flank', searchParams)} />
    </>
  );
}
