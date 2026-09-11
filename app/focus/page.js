import { Suspense } from 'react';
import FocusClient from './FocusClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Focus launched 2026-09-02. One photo a day zoomed in close;
// name it before six frames pull the camera all the way back. The bank is
// resolved HERE, on the server, and only the picked day's answer, attribution
// and focal point ship to the browser, so tomorrow's answer never reaches a
// client. The photo itself comes from /api/focus/img, which refuses a day
// that is not yet live.

export const metadata = {
  title: 'Free Daily Zoomed Photo Guessing Game: Focus | Mind Loft',
  description:
    'A free daily picture game. One photo a day is shown as a close zoomed-in crop; name it before six frames pull the camera all the way back. Landmarks, animals, paintings, machines, famous faces, the world from above and space, one subject a day. No app, no signup, a new photo every day.',
  alternates: { canonical: '/focus' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/focus.png', width: 1200, height: 630, alt: 'Focus — a daily puzzle from Mind Loft' }],
    title: 'Focus — The Daily Zoomed Photo Game',
    description: 'One photo a day, zoomed all the way in. Name it before the camera pulls all the way back.',
    url: '/focus', type: 'website', siteName: 'Mind Loft',
  },
  twitter: { images: ['/og/focus.png'], card: 'summary_large_image', title: 'Focus — The Daily Zoomed Photo Game', description: 'One photo a day, zoomed all the way in. Six frames to name it.' },
};

const gameJsonLd = {
  '@context': 'https://schema.org', '@type': 'Game', name: 'Focus',
  alternateName: 'Focus — Daily Zoomed Picture Quiz', url: `${SITE_URL}/focus`,
  description:
    'A free daily picture game. One photo is shown each day as a tight crop at nine times magnification, and the puzzle is to name it. Every wrong name pulls the camera back one frame; the sixth frame is the whole photo and one last guess. The earlier the frame, the more it scores. A different subject every day of the week, and everyone gets the same photo, so the daily leaderboard ranks by frame, then fewest wrong names, then time.',
  genre: ['Trivia', 'Picture Quiz', 'Quiz', 'Puzzle'],
  gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};
const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('focus'),
    { '@type': 'ListItem', position: 3, name: 'Focus' },
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
          {'FOCUS'.split('').map((ch, i) => (
            <div key={i} style={{ width: 38, height: 38, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, background: i === 0 ? '#8a4b08' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Focus launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily zoomed-photo game. One picture, six frames, one name. Come back when the first photo drops.
        </p>
        <a href="/daily" style={{ color: '#8a4b08', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function FocusPage({ searchParams }) {
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
        <FocusClient key={picked.num} puzzles={lightPuzzles} dayByNum={{ [picked.num]: { a: picked.a, lic: picked.lic, by: picked.by, fx: picked.fx, fy: picked.fy } }} forceNum={forceNum} />
      </Suspense>
      <StageTail self="focus" stage={isStageServer('focus', searchParams)} />
    </>
  );
}
