import { Suspense } from 'react';
import DeepClient from './DeepClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { QUESTION_MAP } from './questions';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Deep launched 2026-08-07. One topic a day, fifteen questions on it in five
// rounds of three, easy to expert, twenty seconds each and one life. The
// question bank is resolved HERE, on the server, and only the picked day's
// fifteen ship to the browser, so the rest of the bank never reaches a client.

export const metadata = {
  title: 'Free Daily Single-Topic Trivia Game: Deep | Mind Loft',
  description:
    'A free daily trivia dive. One subject a day, fifteen questions on it, and they get harder the deeper you go. One wrong answer ends the run. Twenty seconds a question, everyone plays the same fifteen. No app, no signup, a new topic every day.',
  alternates: { canonical: '/deep' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/deep.png', width: 1200, height: 630, alt: 'Deep — a daily puzzle from Mind Loft' }],
    title: 'Deep — The Daily Single-Topic Trivia Dive',
    description: 'One topic, fifteen questions, one life. How far down a single subject can you get?',
    url: '/deep', type: 'website', siteName: 'Mind Loft',
  },
  twitter: { images: ['/og/deep.png'], card: 'summary_large_image', title: 'Deep — The Daily Single-Topic Trivia Dive', description: 'One topic, fifteen questions, one life. How deep can you go?' },
};

const gameJsonLd = {
  '@context': 'https://schema.org', '@type': 'Game', name: 'Deep',
  alternateName: 'Deep — Daily Single-Topic Trivia', url: `${SITE_URL}/deep`,
  description:
    'A free daily trivia game built on one subject. Fifteen multiple-choice questions on the same topic climb from questions anyone could answer to questions only a specialist will have, in five rounds of three. One wrong answer, or a twenty-second clock at zero, ends the dive, and every question cleared is a point. Everyone plays the same fifteen questions in the same order each day, and the daily leaderboard ranks the deepest dives with ties broken by time.',
  genre: ['Trivia', 'Quiz', 'Survival'],
  gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};
const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('deep'),
    { '@type': 'ListItem', position: 3, name: 'Deep' },
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
          {'DEEP'.split('').map((ch, i) => (
            <div key={i} style={{ width: 38, height: 38, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, background: i === 0 ? '#0c4a6e' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Deep launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          One topic a day, fifteen questions, one life. Come back when the first dive drops.
        </p>
        <a href="/daily" style={{ color: '#0c4a6e', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function DeepPage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today);
  if (!visiblePuzzles.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  // Same pick logic as the client: the forced archive day if it is visible,
  // else today's. Only the picked day's questions are resolved and shipped.
  const picked = (forceNum && visiblePuzzles.find((p) => p.num === forceNum)) || visiblePuzzles[visiblePuzzles.length - 1];
  const questions = picked.qids.map((id) => QUESTION_MAP[id]).filter(Boolean);
  const lightPuzzles = visiblePuzzles.map(({ num, quizId, live, dateLabel, sunday, topic }) => ({ num, quizId, live, dateLabel, sunday, topic }));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <DeepClient key={picked.num} puzzles={lightPuzzles} questionsByNum={{ [picked.num]: questions }} forceNum={forceNum} />
      </Suspense>
      <StageTail self="deep" stage={isStageServer('deep', searchParams)} />
    </>
  );
}
