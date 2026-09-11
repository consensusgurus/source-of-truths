import { Suspense } from 'react';
import HandsClient from './HandsClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Hands launched 2026-08-04 as the 43rd daily and the first game in the new
// Cards category, alongside Taire. Twenty six cards off a standard deck, dealt
// one at a time into a five by five grid that scores as ten poker hands, five
// rows and five columns. Everybody plays the identical shuffle, which is the
// whole point: poker is luck, but a fixed deal turns it into a decision game
// and makes a daily leaderboard mean something.
//
// One muck a day is the only lever. Spending it discards the card on offer and
// takes the next one, blind, so the board is always these 26 cards minus
// exactly one. Deals are gated by Eastern date here, so tomorrow's never
// reaches the browser.

export const metadata = {
  title: 'Free Daily Poker Solitaire Puzzle: Hands | Mind Loft',
  description:
    'A free daily poker puzzle. Twenty five cards are dealt one at a time into a five by five grid, and every row and column scores as a poker hand. Nothing is shuffled mid game and everybody plays the identical deal, so there is no luck in it, only the order you commit to. One muck a day, no undo. Play against par, the score an ordinary round comes home with, and ace, the best our solver managed playing blind. No app, no signup, and a new deal every day.',
  alternates: { canonical: '/hands' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/hands.png', width: 1200, height: 630, alt: 'Hands — a daily puzzle from Mind Loft' }],
    title: 'Hands — A Daily Poker Solitaire Puzzle',
    description: 'Same deal for everybody, so the leaderboard ranks decisions and not luck. Ten hands, one muck, no undo. A new deal from Mind Loft, daily.',
    url: '/hands', type: 'website', siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/hands.png'],
    card: 'summary_large_image',
    title: 'Hands — A Daily Poker Solitaire Puzzle',
    description: 'Twenty five cards, ten poker hands, one muck. Beat par if you can.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org', '@type': 'Game', name: 'Hands',
  alternateName: 'Hands — Daily Poker Solitaire Puzzle',
  url: `${SITE_URL}/hands`,
  description:
    'A free daily poker solitaire puzzle. Cards arrive one at a time from a fixed 26 card deal and are placed into a five by five grid, which is read as ten poker hands: five rows and five columns, each card serving one of each. A placed card never moves and there is no undo. Every player in the world gets the identical shuffle, so the game carries no luck and the leaderboard ranks decisions. One muck a day discards the card on offer and takes the next one sight unseen, so the finished board is always the 26 cards minus exactly one. Hands are scored on the British table, where a straight pays more than a flush. Each deal ships with two targets that are both real solver playouts rather than formulas: par, the median of four hundred blind runs, which scores eight, and ace, the best of those runs, which scores ten.',
  genre: ['Card puzzle', 'Poker', 'Solitaire', 'Puzzle'],
  gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};
const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('hands'),
    { '@type': 'ListItem', position: 3, name: 'Hands' },
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
          {'HANDS'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 24, background: i === 4 ? '#7f1d1d' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Hands launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily poker solitaire. Same deal for everybody, ten hands to build, one muck to spend. Come back when the first deal drops.
        </p>
        <a href="/daily" style={{ color: '#7f1d1d', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function HandsPage({ searchParams }) {
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
        <HandsClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="hands" stage={isStageServer('hands', searchParams)} />
    </>
  );
}
