import { Suspense } from 'react';
import MahjClient from './MahjClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Mahj is the daily 144-tile mahjong solitaire, a Cards daily. The full set
// every day on that weekday's layout, cleared in pairs of free tiles, timed.
// Every deal is clearable by construction (lib/mahj-core.js) and
// scripts/verify-mahj.mjs replays a clearing order with its own geometry.
//
// /mahj is the canonical, evergreen URL. This server page filters live<=today
// before handing deals to the client, so tomorrow's boards never reach a
// browser.
export const metadata = {
  title: 'Free Daily Mahjong Solitaire: Mahj | Mind Loft',
  description:
    'A free daily mahjong solitaire: all 144 tiles, cleared in pairs of free tiles. A new layout each weekday, every deal proven clearable, and timed.',
  alternates: { canonical: '/mahj' },
  openGraph: {
    images: [{ url: '/og/mahj.png', width: 1200, height: 630, alt: 'Mahj, a daily mahjong solitaire from Mind Loft' }],
    title: 'Mahj: A Daily Mahjong Solitaire',
    description:
      'A free daily mahjong solitaire: 144 tiles, match free pairs to clear the board. A new layout each weekday, and the Pyramid on Sunday.',
    url: '/mahj',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/mahj.png'],
    card: 'summary_large_image',
    title: 'Mahj: A Daily Mahjong Solitaire',
    description:
      'All 144 tiles, cleared two of a kind at a time, against the clock. Every deal is proven clearable.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Mahj',
  alternateName: 'Mahj: A Daily Mahjong Solitaire',
  url: `${SITE_URL}/mahj`,
  description:
    'A free daily mahjong solitaire: the full set of 144 tiles on a layout that changes each weekday. Clear the board by matching pairs of free tiles, a tile being free when nothing sits on top of it and its left or right side is open. Every deal is proven clearable, and a full clear ranks on the clock.',
  genre: ['Tile game', 'Mahjong solitaire', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/mahj.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('mahj'),
    { '@type': 'ListItem', position: 3, name: 'Mahj' },
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
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Mahj launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily mahjong solitaire: 144 tiles, cleared two of a kind at a time. Come back when the first deal drops.
        </p>
        <a href="/" style={{ color: '#1d4ed8', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function MahjPage({ searchParams }) {
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
        <MahjClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="mahj" stage={isStageServer('mahj', searchParams)} />
    </>
  );
}
