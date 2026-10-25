import { Suspense } from 'react';
import RollClient from './RollClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Roll launched 2026-10-20 as a daily Logic puzzle, Topple's sibling: roll a
// die across a floor of tiles and light the numbered squares in order, each
// with its own number on top (owner, 2026-10-20). A numbered square is blocked
// until it is next and the roll would land its number on top. Cracked squares
// from Thursday. Scored on rolls against the exact minimum, the Parker model
// (lib/par.js). Puzzles are gated by Eastern date here, so tomorrow's board
// never reaches the browser.

export const metadata = {
  title: 'Free Daily Die Rolling Puzzle: Roll | Mind Loft',
  description:
    'A free daily die rolling puzzle. Roll a die across the tiles and light the numbered squares in order, each with its own number on top, in the fewest rolls.',
  alternates: { canonical: '/roll' },
  openGraph: {
    images: [{ url: '/og/roll.png', width: 1200, height: 630, alt: 'Roll, a daily die rolling puzzle from Mind Loft' }],
    title: 'Roll: A Daily Die Rolling Puzzle',
    description: 'Roll the die and light the numbered squares in order, each with its own number on top. One board a day, solved exactly, so par is real.',
    url: '/roll', type: 'website', siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/roll.png'],
    card: 'summary_large_image',
    title: 'Roll: A Daily Die Rolling Puzzle',
    description: 'Roll the die and light the numbered squares in order, each with its own number on top.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org', '@type': 'Game', name: 'Roll',
  alternateName: 'Roll: Daily Die Rolling Puzzle',
  url: `${SITE_URL}/roll`,
  description:
    'A free daily die rolling puzzle. A die sits on a floor of tiles and every move rolls it over one edge. Squares numbered 1 to 6 must be lit in order, and a square lights when the die lands on it with that number on top. A numbered square stays shut until it is next and the roll would land its number on top, and cracked squares, drawn with crack lines, crumble once the die rolls off them. Every board is solved exactly, so perfect is the true fewest rolls and par sits a cushion above it. Three squares on Monday, five by Friday, and the Sunday Edition lights six on a bigger floor.',
  genre: ['Die rolling puzzle', 'Logic puzzle', 'Puzzle'],
  gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/roll.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};
const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('roll'),
    { '@type': 'ListItem', position: 3, name: 'Roll' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

function ComingSoon({ first }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 420, width: '100%', background: '#fff', border: '2px solid #0b0d12', borderRadius: 12, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Roll</div>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: '#3f4757', margin: '0 0 16px' }}>
          Roll launches {first.dateLabel}. Roll the die and light the squares in order.
        </p>
        <a href="/" style={{ display: 'inline-block', background: '#2563eb', color: '#fff', fontWeight: 800, fontSize: 14, padding: '11px 22px', borderRadius: 9, textDecoration: 'none' }}>
          Today&rsquo;s slate
        </a>
      </div>
    </div>
  );
}

export default function RollPage({ searchParams }) {
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
        <RollClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="roll" stage={isStageServer('roll', searchParams)} />
    </>
  );
}
