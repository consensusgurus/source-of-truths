import { Suspense } from 'react';
import ShoeClient from './ShoeClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Shoe launched 2026-08-21 as the daily blackjack shoe: five hands of
// blackjack off ONE fixed 36-card shoe, the same cards in the same order for
// every player, which turns blackjack from a gamble into a decision game a
// leaderboard can rank. Par is what basic strategy banks on the day's shoe
// (scores 8); the skill above it is the count. Sundays deal seven hands off
// the entire 52-card deck, where a perfect counter knows exactly what is left.
//
// /shoe is the canonical, evergreen URL; this server page filters live<=today
// before handing puzzles to the client, so tomorrow's shoe never reaches a
// browser.

export const metadata = {
  title: 'Free Daily Blackjack Puzzle: Shoe | Mind Loft',
  description:
    'A free daily blackjack puzzle. Five hands off one fixed shoe, the same cards in the same order for every player. Hit, stand, or double, count what you have seen, and beat the book line. New shoe daily, seven hands off the whole deck on Sundays.',
  alternates: { canonical: '/shoe' },
  openGraph: {
    title: 'Shoe — The Daily Blackjack Shoe',
    description:
      'Everyone plays the same shoe: five hands of blackjack, fixed deal, and a par set by basic strategy. Beat the book by counting. From Mind Loft.',
    url: '/shoe',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shoe — The Daily Blackjack Shoe',
    description:
      'Five hands of blackjack, one fixed shoe, the same cards for everyone. Par is the book line. The count is how you beat it.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Shoe',
  alternateName: 'Shoe — Daily Blackjack Puzzle',
  url: `${SITE_URL}/shoe`,
  description:
    'A free daily blackjack puzzle: five hands dealt from one fixed 36-card shoe, identical for every player, scored against the chips basic strategy banks on the same cards. Hit, stand, or double; dealer stands on all 17s; blackjack pays 3:2; no splits. Sundays deal seven hands off the entire 52-card deck.',
  genre: ['Card game', 'Puzzle', 'Strategy'],
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
    categoryCrumb('shoe'),
    { '@type': 'ListItem', position: 3, name: 'Shoe' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

function ComingSoon({ first }) {
  // Rendered only if no puzzle is live yet. Never crash the route on an empty
  // visible set — show a friendly placeholder instead.
  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: "'Manrope', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 18 }}>
          {'SHOE'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 1 ? '#0c4a6e' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Shoe deals {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily blackjack shoe — the same cards in the same order for every player, a par set by the book line, and a count to beat it with. Come back when the first shoe is dealt.
        </p>
        <a href="/daily" style={{ color: '#0c4a6e', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function ShoePage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today);
  if (!visiblePuzzles.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Suspense fallback={null}>
        <ShoeClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="shoe" stage={isStageServer('shoe', searchParams)} />
    </>
  );
}
