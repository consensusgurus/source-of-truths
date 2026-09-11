import { Suspense } from 'react';
import DefendClient from './DefendClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Defend launched 2026-08-11 as the 58th daily and the sixth End Game title:
// linked from the hub puzzles row, the footer, the /daily archive, and the
// sitemap (/defend is the canonical, evergreen URL). It is Mate read from the
// other side of the board, Black to play and survive. Weekdays hold for three,
// Sundays step up to a hold for four. The launch bank held for two with three
// parries; the floors moved on 2026-08-12 after day one showed a three-parry
// board could be brute-forced by trying each parry in turn. Puzzles are gated by Eastern date here,
// so tomorrow's position (and the move that saves it) never reaches the browser.

export const metadata = {
  title: 'Free Daily Chess Puzzle (Black to Play and Survive): Defend | Mind Loft',
  description:
    'A free daily chess puzzle from the defending side. White is threatening mate, at least five moves look like they answer it, and exactly one does. Tap a piece and its legal squares light up, so no chess notation is needed. Finding the save only buys the next one: hold the position for three moves against White’s best try, keep a streak, and Sundays hold for four.',
  alternates: { canonical: '/defend' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/defend.png', width: 1200, height: 630, alt: 'Defend — a daily chess puzzle from Mind Loft' }],
    title: 'Defend — A Daily Chess Puzzle',
    description:
      'Black to play and survive. Five moves look like a defence, one is, and finding it only buys you the next one. A new position from Mind Loft, daily.',
    url: '/defend',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/defend.png'],
    card: 'summary_large_image',
    title: 'Defend — A Daily Chess Puzzle',
    description: 'White is threatening mate. Five moves look like they stop it. One does.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Defend',
  alternateName: 'Defend — Daily Chess Puzzle',
  url: `${SITE_URL}/defend`,
  description:
    'A free daily chess defence puzzle. Each position has Black to move with White already threatening checkmate, and every legal move loses to a forced mate except one, with at least five that look like they answer the threat. Tap a piece to see its legal squares, then play the position out: White answers with its stubbornest try and exactly one move survives again. Surviving earns a perfect score, and ties break on fewest misses then fastest time. Weekdays hold for three moves and Sundays hold for four.',
  genre: ['Chess puzzle', 'Logic puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
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
    categoryCrumb('defend'),
    { '@type': 'ListItem', position: 3, name: 'Defend' },
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
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 18 }}>
          {'DEFEND'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 24, background: i === 5 ? '#2f4f4f' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Defend launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily chess save. White is threatening mate, five moves look like they answer it, and one does. Come back when the first position drops.
        </p>
        <a href="/daily" style={{ color: '#2f4f4f', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function DefendPage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today);
  if (!visiblePuzzles.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <DefendClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="defend" stage={isStageServer('defend', searchParams)} />
    </>
  );
}
