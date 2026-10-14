import { Suspense } from 'react';
import SwindleClient from './SwindleClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Swindle: White to play and draw. White is badly lost, and exactly one first
// move saves the game by stalemate, perpetual check or threefold repetition, or
// by taking so much that nobody can mate. Puzzles are gated by Eastern date
// here, so tomorrow's position never reaches the browser, and only the board
// being played ships its book (the drawing lines and the defence's replies):
// every other board goes out as the few fields the archive needs.

export const metadata = {
  title: 'Free Daily Chess Draw Puzzle: Swindle | Mind Loft',
  description:
    'A free daily chess puzzle. White is lost, and exactly one move saves a draw by stalemate, perpetual check or repetition. Find it, then hold on.',
  alternates: { canonical: '/swindle' },
  openGraph: {
    images: [{ url: '/og/swindle.png', width: 1200, height: 630, alt: 'Swindle, a daily chess draw puzzle from Mind Loft' }],
    title: 'Swindle: A Daily Chess Puzzle',
    description: 'White to play and draw. Every move but one loses to mate. Find the swindle.',
    url: '/swindle',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/swindle.png'],
    card: 'summary_large_image',
    title: 'Swindle: A Daily Chess Puzzle',
    description: 'White is lost. One move draws. Find it.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Swindle',
  alternateName: 'Swindle: Daily Chess Draw Puzzle',
  url: `${SITE_URL}/swindle`,
  description:
    'A free daily chess puzzle where White is badly lost and must find the one first move that forces a draw, by stalemate, perpetual check, threefold repetition or winning down to too little material to mate. Every other move loses to a forced mate. Tap a piece to see its legal squares, then play the draw out against a computer defence that tries to avoid it. Sundays bring the deepest draw of the week.',
  genre: ['Chess puzzle', 'Logic puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/swindle.png`,
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
    categoryCrumb('swindle'),
    { '@type': 'ListItem', position: 3, name: 'Swindle' },
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
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Swindle launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily chess draw. White is lost, every move but one loses, and one move saves half a point. Come back when the first position drops.
        </p>
        <a href="/" style={{ color: '#9a3412', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function SwindlePage({ searchParams }) {
  const today = etTodayServer();
  const visible = PUZZLES.filter((p) => p.live <= today);
  if (!visible.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  // The board the client will pick (pickPuzzle in SwindleClient): ?p= when it is
  // live, else today's. Only that one keeps its book and line.
  const playNum = (forceNum && visible.some((p) => p.num === forceNum)) ? forceNum : visible[visible.length - 1].num;
  const shipped = visible.map((p) => (p.num === playNum ? p : {
    num: p.num, quizId: p.quizId, live: p.live, dateLabel: p.dateLabel, sunday: p.sunday,
  }));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <SwindleClient key={forceNum || 'today'} puzzles={shipped} forceNum={forceNum} />
      </Suspense>
      <StageTail self="swindle" stage={isStageServer('swindle', searchParams)} />
    </>
  );
}
