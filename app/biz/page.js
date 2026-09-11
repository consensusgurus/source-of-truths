import { Suspense } from 'react';
import BizClient from './BizClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { QUESTION_MAP } from './questions';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Biz launched 2026-08-27. Twenty-five business questions a day in five tiers
// of five, one life, twenty seconds a question. The question bank is resolved
// HERE, on the server, and only the picked day's twenty-five ship to the
// browser, so the rest of the bank never reaches a client.

export const metadata = {
  title: 'Free Daily Business Trivia Game: Biz | Mind Loft',
  description:
    'A free daily business quiz. Twenty-five questions on brands, markets, founders, deals and business history climb from easy to expert, and one wrong answer ends the run. Twenty seconds a question, one life, everyone plays the same twenty-five. No app, no signup, a new twenty-five every day.',
  alternates: { canonical: '/biz' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/biz.png', width: 1200, height: 630, alt: 'Biz, a daily puzzle from Mind Loft' }],
    title: 'Biz — The Daily Business Gauntlet',
    description: 'Twenty-five questions on business, one life. How far can you get before one wrong answer ends the run?',
    url: '/biz', type: 'website', siteName: 'Mind Loft',
  },
  twitter: { images: ['/og/biz.png'], card: 'summary_large_image', title: 'Biz — The Daily Business Gauntlet', description: 'Twenty-five questions on business, one life. How far can you get?' },
};

const gameJsonLd = {
  '@context': 'https://schema.org', '@type': 'Game', name: 'Biz',
  alternateName: 'Biz — Daily Business Trivia', url: `${SITE_URL}/biz`,
  description:
    'A free daily business trivia game. Twenty-five multiple-choice questions climb from easy to expert in five rounds of five, cycling the same five lanes each round: brands and products, markets and money, founders and bosses, deals and disasters, and business history. One wrong answer, or a twenty-second clock at zero, ends the run, and every question cleared is a point. Everyone plays the same twenty-five questions in the same order each day, and the daily leaderboard ranks the longest runs with ties broken by time. Every answer is a settled fact rather than a share price, a job title or a ranking that moves next week.',
  genre: ['Business', 'Trivia', 'Quiz', 'Survival'],
  gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};
const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('biz'),
    { '@type': 'ListItem', position: 3, name: 'Biz' },
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
          {'BIZ'.split('').map((ch, i) => (
            <div key={i} style={{ width: 38, height: 38, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, background: i === 0 ? '#0f5132' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Biz launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily business gauntlet. Twenty-five questions, one life. Come back when the first twenty-five drop.
        </p>
        <a href="/daily" style={{ color: '#0f5132', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function BizPage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today);
  if (!visiblePuzzles.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  // Same pick logic as the client: the forced archive day if it is visible,
  // else today's. Only the picked day's questions are resolved and shipped.
  const picked = (forceNum && visiblePuzzles.find((p) => p.num === forceNum)) || visiblePuzzles[visiblePuzzles.length - 1];
  const questions = picked.qids.map((id) => QUESTION_MAP[id]).filter(Boolean);
  const lightPuzzles = visiblePuzzles.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <BizClient key={picked.num} puzzles={lightPuzzles} questionsByNum={{ [picked.num]: questions }} forceNum={forceNum} />
      </Suspense>
      <StageTail self="biz" stage={isStageServer('biz', searchParams)} />
    </>
  );
}
