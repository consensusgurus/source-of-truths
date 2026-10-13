import { Suspense } from 'react';
import DarioClient from './DarioClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Dario, the daily side-scroller (Arcade). Rows are gated by Eastern date like
// every other daily; a row carries only the frame, and the day's course remix is
// generated from its quizId in the client (lib/dario-engine.js buildLevels).
//
// LAUNCHED 2026-10-07 into the Arcade beside Blocks, Snake and Sweep.

export const metadata = {
  title: 'Dario: A Daily Race to the Frontier | Mind Loft',
  description:
    'A free daily side-scrolling platformer: three levels of the AI race on a course remixed every day for everyone. Your fastest clear goes on the leaderboard.',
  alternates: { canonical: '/dario' },
  openGraph: {
    images: [{ url: '/og/dario-v3.png', width: 1200, height: 630, alt: 'Dario, a 16-bit pixel-art side-scroller racing through the AI race, from Mind Loft' }],
    title: 'Dario: A Daily Race to the Frontier',
    description: 'Stomp the SaaS bots, dodge the robotaxis and reach the AGI gate first. Three levels, one clock, a new course every day.',
    url: '/dario',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/dario-v3.png'],
    card: 'summary_large_image',
    title: 'Dario: A Daily Race to the Frontier',
    description: 'Stomp the SaaS bots, dodge the robotaxis and reach the AGI gate first. Three levels, one clock, a new course every day.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Dario',
  alternateName: 'Dario: Daily Side-Scrolling Platformer',
  url: `${SITE_URL}/dario`,
  description:
    'A free daily side-scrolling platformer: three levels, one clock, a course remixed every day and the same for everybody. Your fastest clear of the day ranks on the leaderboard.',
  genre: ['Platformer', 'Arcade', 'Action'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/dario-v3.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('dario'),
    { '@type': 'ListItem', position: 3, name: 'Dario' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function DarioPage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today);
  const list = visiblePuzzles.length ? visiblePuzzles : PUZZLES.slice(0, 1);
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <DarioClient key={forceNum || 'today'} puzzles={list} forceNum={forceNum} />
      </Suspense>
      <StageTail self="dario" stage={isStageServer('dario', searchParams)} />
    </>
  );
}
