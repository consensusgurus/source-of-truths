import { Suspense } from 'react';
import HiredClient from './HiredClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { QUESTION_MAP } from './questions';
import { JOBS } from './offer';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Hired launches 2026-11-25 (owner: one job a day, five interview rounds). The
// bank is resolved HERE, on the server: only the picked day's twenty questions
// reach the browser, so the rest of the bank never does.

export const metadata = {
  title: 'Free Daily Job Interview Quiz: Hired | Mind Loft',
  description:
    'A free daily job skills quiz: one job a day, from accountant to chef, in five interview rounds of four questions. Get it right and get the offer.',
  alternates: { canonical: '/hired' },
  openGraph: {
    images: [{ url: '/og/hired.png', width: 1200, height: 630, alt: 'Hired, a daily job interview quiz from Mind Loft' }],
    title: 'Hired: The Daily Job Interview',
    description: 'One job a day. Five interview rounds, twenty questions. Can you get the offer?',
    url: '/hired', type: 'website', siteName: 'Mind Loft',
  },
  twitter: { images: ['/og/hired.png'], card: 'summary_large_image', title: 'Hired: The Daily Job Interview', description: 'One job a day. Five interview rounds. Can you get the offer?' },
};

const gameJsonLd = {
  '@context': 'https://schema.org', '@type': 'Game', name: 'Hired',
  alternateName: 'Hired: Daily Job Interview Quiz', url: `${SITE_URL}/hired`,
  description:
    'A free daily job skills quiz. Every day is an interview for one job, the same for everyone, from accountant and software developer to chef, bartender, Excel tutor and pilot. Twenty multiple-choice questions on that job come in five rounds of four, from an easy phone screen to a tough final round, with twenty seconds a question. A wrong answer ends that round, not the interview. The score is the number right, ties broken by time, and the interview ends with an offer letter whose title and salary rise with the score.',
  genre: ['Trivia', 'Quiz', 'Careers', 'Job Skills'],
  gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/hired.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};
const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('hired'),
    { '@type': 'ListItem', position: 3, name: 'Hired' },
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
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Hired opens {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>The daily job interview. One job a day, five rounds, twenty questions.</p>
        <a href="/" style={{ color: T.ink, fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function HiredPage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today);
  if (!visiblePuzzles.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  const picked = (forceNum && visiblePuzzles.find((p) => p.num === forceNum)) || visiblePuzzles[visiblePuzzles.length - 1];
  const questions = picked.qids.map((id) => QUESTION_MAP[id]).filter(Boolean);
  const lightPuzzles = visiblePuzzles.map(({ num, quizId, live, dateLabel, job }) => ({ num, quizId, live, dateLabel, job: JOBS[job] ? job : 'accountant' }));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <HiredClient key={picked.num} puzzles={lightPuzzles} questionsByNum={{ [picked.num]: questions }} forceNum={forceNum} />
      </Suspense>
      <StageTail self="hired" stage={isStageServer('hired', searchParams)} />
    </>
  );
}
