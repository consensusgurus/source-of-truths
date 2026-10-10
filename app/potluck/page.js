import { Suspense } from 'react';
import PotluckClient from './PotluckClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { getQuiz } from '@/lib/quizzes';
import { quizDept, DEPT_LABEL } from '@/lib/quiz-departments';
import { POTLUCK_FAMILY, FAMILY_LABEL, potluckAnswerCount } from '@/lib/potluck';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Potluck launched 2026-10-10 (owner, 2026-10-09): three quizzes from the
// catalog a day, a different kind and a different subject each, scored
// together and turned in when you choose. The day's three are resolved HERE,
// on the server, so the 4MB quiz catalog never reaches the browser: the client
// gets only the titles, labels and sizes it shows.

export const metadata = {
  title: 'Free Daily Quiz Mix: Potluck | Mind Loft',
  description:
    'A free daily trivia mix. Three quizzes a day, each a different kind and a different subject: one to name, one to match, one to spot. Play any of them, turn it in when you are done, and race the daily leaderboard. No app, no signup, a new three every day.',
  alternates: { canonical: '/potluck' },
  openGraph: {
    images: [{ url: '/og/potluck.png', width: 1200, height: 630, alt: 'Potluck, a daily puzzle from Mind Loft' }],
    title: 'Potluck: Three Quizzes a Day',
    description: 'Three quizzes, three subjects, one score. Turn it in when you are done.',
    url: '/potluck', type: 'website', siteName: 'Mind Loft',
  },
  twitter: { images: ['/og/potluck.png'], card: 'summary_large_image', title: 'Potluck: Three Quizzes a Day', description: 'Three quizzes, three subjects, one score.' },
};

const gameJsonLd = {
  '@context': 'https://schema.org', '@type': 'Game', name: 'Potluck',
  alternateName: 'Potluck: Daily Quiz Mix', url: `${SITE_URL}/potluck`,
  description:
    'A free daily trivia game made of three quizzes from the Mind Loft catalog. Every day brings one quiz where you type the answers, one where you match them, and one where you find them on a map or in pictures, each from a different subject. Each quiz is worth 10 points, scaled by how much of it you got, so the day is scored out of 30, and the combined clock breaks ties. Play as many of the three as you like and turn it in when you are done; finishing the third turns it in automatically. Everyone gets the same three each day.',
  genre: ['Trivia', 'Quiz'],
  gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};
const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('potluck'),
    { '@type': 'ListItem', position: 3, name: 'Potluck' },
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
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Potluck opens {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          Three quizzes a day, each a different kind and a different subject, one score. Come back at midnight Eastern.
        </p>
        <a href="/" style={{ color: T.ink, fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

function fmtClock(sec) {
  const s = Math.max(0, Number(sec) || 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function PotluckPage({ searchParams }) {
  const today = etTodayServer();
  const visible = PUZZLES.filter((p) => p.live <= today);
  if (!visible.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  const picked = (forceNum && visible.find((p) => p.num === forceNum)) || visible[visible.length - 1];
  const quizzes = picked.quizzes.map((id) => {
    const q = getQuiz(id);
    if (!q) return { id, title: id, dept: '', family: 'typed', familyLabel: '', answers: 0, clock: '' };
    const family = POTLUCK_FAMILY[q.format || 'default'] || 'typed';
    return {
      id,
      title: q.title,
      dept: DEPT_LABEL[quizDept(q)] || q.category || 'Quiz',
      family,
      familyLabel: FAMILY_LABEL[family],
      answers: potluckAnswerCount(q),
      noun: q.noun || '',
      clock: fmtClock(q.timeLimit),
    };
  });
  const light = visible.map(({ num, quizId, live, dateLabel }) => ({ num, quizId, live, dateLabel }));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <PotluckClient key={picked.num} puzzles={light} day={{ ...picked }} quizzes={quizzes} forceNum={forceNum} />
      </Suspense>
      <StageTail self="potluck" stage={isStageServer('potluck', searchParams)} />
    </>
  );
}
