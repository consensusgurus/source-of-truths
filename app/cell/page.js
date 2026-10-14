import { Suspense } from 'react';
import CellClient from './CellClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Cell, the daily FreeCell, launched 2026-10-14 in the Cards category: a small
// deck dealt face up (32 cards, ace to eight, in six columns; the Sunday Edition
// 40 cards, ace to ten, in seven), FreeCell rules with safe autoplay, and a
// perfect line that is the proven minimum, par a cushion above it (lib/par.js).
// The week takes free cells away, four on Monday down to two by Friday. Deals
// are gated by Eastern date here, so tomorrow's board never reaches the browser.

export const metadata = {
  title: 'Free Daily FreeCell Solitaire: Cell | Mind Loft',
  description:
    'A free daily FreeCell on a small deck, every card face up. Runs move as one move, safe cards go home free, and perfect is the proven fewest moves.',
  alternates: { canonical: '/cell' },
  openGraph: {
    // Static share card, pre-rendered into public/og/ (scripts/bake-og.mjs cell).
    images: [{ url: '/og/cell.png', width: 1200, height: 630, alt: 'Cell, a daily FreeCell from Mind Loft' }],
    title: 'Cell: A Daily FreeCell',
    description: 'Every card face up, a few free cells, and a perfect line nobody beats. A new deal from Mind Loft, daily.',
    url: '/cell', type: 'website', siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/cell.png'],
    card: 'summary_large_image',
    title: 'Cell: A Daily FreeCell',
    description: 'A small FreeCell deal, nothing hidden, no luck. Get under par if you can.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org', '@type': 'Game', name: 'Cell',
  alternateName: 'Cell: Daily FreeCell',
  url: `${SITE_URL}/cell`,
  description:
    'A free daily FreeCell solitaire on a smaller deck. Thirty-two cards, ace through eight in four suits, are dealt face up into six columns beside a few free cells, and every card must be sent home to its foundation, built up by suit from the ace. Columns build down in alternating colors, a run of cards moves as one move when the open free cells and empty columns can carry it, and safe cards go home on their own at no cost. Every deal is solved exactly, so the perfect line is the true minimum number of moves, proved again by a second independent solver. Par sits a cushion above perfect. The week takes free cells away, from four on Monday to two by Friday, and the Sunday Edition deals forty cards, ace through ten, in seven columns.',
  genre: ['Solitaire', 'FreeCell', 'Card puzzle', 'Logic puzzle'],
  gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/cell.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};
const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('cell'),
    { '@type': 'ListItem', position: 3, name: 'Cell' },
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
          {'CELL'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 24, background: i === 3 ? '#0e7490' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Cell launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily FreeCell. Every card face up, a few free cells, and a perfect line nobody can beat. Come back when the first deal drops.
        </p>
        <a href="/" style={{ color: '#0e7490', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function CellPage({ searchParams }) {
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
        <CellClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="cell" stage={isStageServer('cell', searchParams)} />
    </>
  );
}
