import { Suspense } from 'react';
import GiftClient from './GiftClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Gift: the daily Quarto endgame. Place the piece you were handed, then choose
// the one your opponent plays; one first move forces the win. Puzzles are gated
// by Eastern date here, so tomorrow's position never reaches the browser, the
// winning piece to hand back never ships at all, and only the board being
// played keeps its position and its hint square: every other board goes out as
// the few fields the archive needs.

export const metadata = {
  title: 'Free Daily Quarto Puzzle: Gift | Mind Loft',
  description:
    'A free daily Quarto endgame. Place the piece you were handed, then choose the one your opponent plays. One first move forces the win. Find it.',
  alternates: { canonical: '/gift' },
  manifest: '/api/pwa-manifest?game=gift',
  icons: {
    // Favicon is the Mind Loft mark on every page, games included (owner rule, 2026-08-31).
    // Do NOT delete this line: ANY metadata.icons object suppresses the root app/icon.png
    // inheritance, so the tab would fall back to the 16px favicon.ico alone.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/gift-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Gift' },
  openGraph: {
    images: [{ url: '/og/gift.png', width: 1200, height: 630, alt: 'Gift, a daily Quarto endgame from Mind Loft' }],
    title: 'Gift: A Daily Quarto Puzzle',
    description: 'Place your piece, then choose what your opponent plays. One first move forces the win.',
    url: '/gift',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/gift.png'],
    card: 'summary_large_image',
    title: 'Gift: A Daily Quarto Puzzle',
    description: 'Every piece you hand over is one they get to play. Find the win.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Gift',
  alternateName: 'Gift: Daily Quarto Puzzle',
  url: `${SITE_URL}/gift`,
  description:
    'A free daily Quarto endgame. Sixteen pieces, each tall or short, dark or light, square or round, hollow or solid; four in a line that share any one trait win. You place the piece your opponent handed you, then choose the piece they must play. Exactly one first move forces the win against perfect defence, then you play it out. Sundays bring the longest win of the week.',
  genre: ['Board game puzzle', 'Logic puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/gift.png`,
  publisher: {
    '@type': 'Organization',
    name: 'Mind Loft',
    url: `${SITE_URL}`,
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('gift'),
    { '@type': 'ListItem', position: 3, name: 'Gift' },
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
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Gift launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily Quarto endgame. Place the piece you were handed, choose the one your opponent plays, and find the one move that forces the win.
        </p>
        <a href="/" style={{ color: '#7c3aed', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function GiftPage({ searchParams }) {
  const today = etTodayServer();
  const visible = PUZZLES.filter((p) => p.live <= today);
  if (!visible.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  // The board the client will pick (pickPuzzle in GiftClient): ?p= when it is
  // live, else today's. Only that one keeps its position and hint square, and
  // no board ships the piece to hand back.
  const playNum = (forceNum && visible.some((p) => p.num === forceNum)) ? forceNum : visible[visible.length - 1].num;
  const shipped = visible.map((p) => (p.num === playNum
    ? { num: p.num, quizId: p.quizId, live: p.live, dateLabel: p.dateLabel, sunday: p.sunday, board: p.board, hand: p.hand, winIn: p.winIn, keySq: p.keySq, total: p.total }
    : { num: p.num, quizId: p.quizId, live: p.live, dateLabel: p.dateLabel, sunday: p.sunday }));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <GiftClient key={forceNum || 'today'} puzzles={shipped} forceNum={forceNum} />
      </Suspense>
      <StageTail self="gift" stage={isStageServer('gift', searchParams)} />
    </>
  );
}
