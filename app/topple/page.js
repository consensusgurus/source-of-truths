import { Suspense } from 'react';
import ToppleClient from './ToppleClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Topple launched 2026-10-20 as a daily Logic puzzle: roll a 1x1x2 block across
// a floor of tiles and land it on the spring (owner, 2026-10-19, "a
// block rolling clone of Bloxorz"; the spring replaced the original's hole the
// same evening, and a spring can be two tiles long, landed lying flat). Fragile tiles from Tuesday on; no switches
// and no bridges (owner, 2026-10-19). Scored on rolls against the exact
// minimum, the Parker model (lib/par.js). Puzzles are gated by Eastern date
// here, so tomorrow's board never reaches the browser.

export const metadata = {
  title: 'Free Daily Block Rolling Puzzle: Topple | Mind Loft',
  description:
    'A free daily block rolling puzzle. Tip a tall block across the tiles and land it on the spring in as few rolls as you can. Mind the fragile tiles.',
  alternates: { canonical: '/topple' },
  openGraph: {
    images: [{ url: '/og/topple.png', width: 1200, height: 630, alt: 'Topple, a daily block rolling puzzle from Mind Loft' }],
    title: 'Topple: A Daily Block Rolling Puzzle',
    description: 'Roll the block end over end and land it on the spring. One board a day, solved exactly, so par is real.',
    url: '/topple', type: 'website', siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/topple.png'],
    card: 'summary_large_image',
    title: 'Topple: A Daily Block Rolling Puzzle',
    description: 'Roll the block end over end and land it on the spring.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org', '@type': 'Game', name: 'Topple',
  alternateName: 'Topple: Daily Block Rolling Puzzle',
  url: `${SITE_URL}/topple`,
  description:
    'A free daily block rolling puzzle. A one by one by two block stands on a floor of tiles; every move tips it over an edge, so it lies flat, rolls along, and stands back up. Land it on the spring, which fires it off the board: standing on a one-tile spring, lying flat across a two-tile one. Fragile tiles, drawn with crack lines, hold the block lying flat but crack if it stands on them, and any part over the edge sends it back to the start. Every board is solved exactly, so perfect is the true fewest rolls and par sits a cushion above it. The week climbs from about fifteen rolls on Monday to nearly thirty on Saturday, and the Sunday Edition is a bigger board.',
  genre: ['Block rolling puzzle', 'Logic puzzle', 'Puzzle'],
  gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/topple.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};
const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('topple'),
    { '@type': 'ListItem', position: 3, name: 'Topple' },
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
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Topple</div>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: '#3f4757', margin: '0 0 16px' }}>
          Topple launches {first.dateLabel}. Roll the block and land it on the spring.
        </p>
        <a href="/" style={{ display: 'inline-block', background: '#2563eb', color: '#fff', fontWeight: 800, fontSize: 14, padding: '11px 22px', borderRadius: 9, textDecoration: 'none' }}>
          Today&rsquo;s slate
        </a>
      </div>
    </div>
  );
}

export default function TopplePage({ searchParams }) {
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
        <ToppleClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="topple" stage={isStageServer('topple', searchParams)} />
    </>
  );
}
