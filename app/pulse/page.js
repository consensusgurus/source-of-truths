import { Suspense } from 'react';
import PulseClient from './PulseClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { QUESTION_MAP } from './questions';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Pulse: ten human body questions a day in five tiers of two, one life, twenty seconds a
// question, part of the Science Gauntlet. Only the picked day's ten ship to the
// browser; the rest of the bank never reaches a client.

export const metadata = {
  title: 'Free Daily The Human Body Quiz: Pulse | Mind Loft',
  description:
    'A free daily the human body quiz: 10 questions on anatomy and health and medicine, easy to expert. One wrong answer ends the run.',
  alternates: { canonical: '/pulse' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/pulse.png', width: 1200, height: 630, alt: 'Pulse, a daily puzzle from Mind Loft' }],
    title: 'Pulse: The Daily Human Body Gauntlet',
    description: 'Ten human body questions, one life. How far can you get before one wrong answer ends the run?',
    url: '/pulse', type: 'website', siteName: 'Mind Loft',
  },
  twitter: { images: ['/og/pulse.png'], card: 'summary_large_image', title: 'Pulse: The Daily Human Body Gauntlet', description: 'Ten human body questions, one life. How far can you get?' },
};

const gameJsonLd = {
  '@context': 'https://schema.org', '@type': 'Game', name: 'Pulse',
  alternateName: 'Pulse: Daily Human Body Quiz', url: `${SITE_URL}/pulse`,
  description:
    'A free daily the human body quiz and part of the Science Gauntlet. Ten multiple-choice questions climb from easy to expert in five rounds of two, each round asking the same two lanes: anatomy, then health and medicine. One wrong answer, or a twenty-second clock at zero, ends the run, and every question cleared is a point. Everyone plays the same ten in the same order each day, and the daily leaderboard ranks the longest runs with ties broken by time. Every answer is settled textbook science, never a count or a record that can change.',
  genre: ['Anatomy', 'Science', 'Trivia', 'Quiz'],
  gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/pulse.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};
const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('pulse'),
    { '@type': 'ListItem', position: 3, name: 'Pulse' },
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
          {'PULSE'.split('').map((ch, i) => (
            <div key={i} style={{ width: 38, height: 38, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, background: i === 0 ? '#b91c1c' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Pulse launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily human body gauntlet. Ten questions, one life. Come back when the first ten drop.
        </p>
        <a href="/" style={{ color: '#b91c1c', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function PulsePage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today);
  if (!visiblePuzzles.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  // Same pick logic as the client: the forced archive day if it is visible,
  // else today's. Only the picked day's questions are resolved and shipped.
  const picked = (forceNum && visiblePuzzles.find((p) => p.num === forceNum)) || visiblePuzzles[visiblePuzzles.length - 1];
  const questions = picked.qids.map((id) => QUESTION_MAP[id]).filter(Boolean);
  const lightPuzzles = visiblePuzzles.map(({ num, quizId, live, dateLabel }) => ({ num, quizId, live, dateLabel }));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <PulseClient key={picked.num} puzzles={lightPuzzles} questionsByNum={{ [picked.num]: questions }} forceNum={forceNum} />
      </Suspense>
      <StageTail self="pulse" stage={isStageServer('pulse', searchParams)} />
    </>
  );
}
