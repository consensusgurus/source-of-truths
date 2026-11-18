import { Suspense } from 'react';
import BotClient from './BotClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Bot launched 2026-11-18 (owner: "build and implement both"). /bot is the
// canonical, evergreen URL. This server page filters live<=today AND strips the
// stored answer (`sol`) before handing boards to the client, so neither a
// future board nor its answer reaches a browser; Show the answer fetches it
// from /api/daily-answer once the day is over. `par` stays: the result shows it.

export const metadata = {
  title: 'Free Daily Coding Puzzle: Bot, Program the Robot | Mind Loft',
  description:
    'A free daily programming puzzle. Write a short program that walks a robot round a 3D board and switches on every lamp, in as few commands as you can.',
  alternates: { canonical: '/bot' },
  openGraph: {
    images: [{ url: '/og/bot.png', width: 1200, height: 630, alt: 'Bot, a daily programming puzzle from Mind Loft' }],
    title: 'Bot: The Daily Programming Puzzle',
    description: 'Program a little robot to switch on every lamp. Forward, Jump, turn, Light up, and a P1 row that can call itself. A new board every day.',
    url: '/bot',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/bot.png'],
    card: 'summary_large_image',
    title: 'Bot: The Daily Programming Puzzle',
    description: 'Program a little robot to switch on every lamp. Forward, Jump, turn, Light up, and a P1 row that can call itself. A new board every day.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Bot',
  alternateName: 'Bot: The Daily Robot Programming Puzzle',
  url: `${SITE_URL}/bot`,
  description:
    'A free daily programming puzzle in the spirit of Logo turtles and Light-bot: write a short program of Forward, Jump, Left, Right and Light up commands, in a Main row and a P1 row that can call itself, so a robot on a small 3D board switches on every lamp. Small boards early in the week, bigger ones later, and a Sunday Edition with P2 and P3. Weekday par is the fewest commands possible, proved before the board ships. Ranked on the fewest commands, then the clock.',
  genre: ['Puzzle', 'Programming puzzle', 'Logic puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/bot.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('bot'),
    { '@type': 'ListItem', position: 3, name: 'Bot' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function Page({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today).map(({ sol, ...p }) => p);
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {/* Suspense is required: the client reads useSearchParams. */}
      <Suspense fallback={null}>
        <BotClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="bot" stage={isStageServer('bot', searchParams)} />
    </>
  );
}
