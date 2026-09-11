import { Suspense } from 'react';
import PathsClient from './PathsClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Paths launched 2026-08-06 as the 50th daily: linked from the hub puzzles row,
// the footer, the /daily archive, and the sitemap (/paths is the canonical,
// evergreen URL). Boards ramp across the week (see the tier table in
// puzzles.js): a 9x9 lattice with eight towns Monday to Wednesday, cliffs from
// Thursday, old track and a ninth town on Friday and Saturday, and a 13x13
// Sunday Edition with eleven towns. Boards are gated by Eastern date here, so
// tomorrow's cheapest network never reaches the browser.

export const metadata = {
  title: 'Free Daily Network Puzzle: Paths | Mind Loft',
  description:
    'A free daily network puzzle. Link every town back to the depot for as little as you can, where ridge lanes cost double, river crossings cost triple, cliffs cannot be crossed at all and old track is free. Every board carries a proven cheapest network, so a perfect score is real. New board daily, harder as the week goes on, bigger 13x13 Edition on Sundays.',
  alternates: { canonical: '/paths' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/paths.png', width: 1200, height: 630, alt: 'Paths — a daily network puzzle from Mind Loft' }],
    title: 'Paths — A Daily Network Puzzle',
    description:
      'One depot, a scatter of towns, a river in the way. Link them all for as little as you can.',
    url: '/paths',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/paths.png'],
    card: 'summary_large_image',
    title: 'Paths — A Daily Network Puzzle',
    description: 'Link every town to the depot for as little as you can. A new board every day.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Paths',
  alternateName: 'Paths — Daily Network Puzzle',
  url: `${SITE_URL}/paths`,
  description:
    'A free daily network puzzle: lay track along a lattice of lanes until every town is linked back to the depot, spending as little as possible. An open lane costs one, a ridge lane costs two, and a river crossing costs three. Later in the week cliffs block lanes outright and stretches of old track are free to run along. Every board carries the exact cheapest network that exists on it, found by a Steiner-tree solver, so a perfect score is provable and nobody can beat it. Ties break on cost, then on time.',
  genre: ['Logic puzzle', 'Network puzzle', 'Optimisation puzzle', 'Puzzle'],
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
    categoryCrumb('paths'),
    { '@type': 'ListItem', position: 3, name: 'Paths' },
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
          {'PATHS'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 24, background: i === 4 ? '#065f46' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Paths launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily network puzzle — every town linked to the depot, for as little as you can. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: '#065f46', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function PathsPage({ searchParams }) {
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
        <PathsClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="paths" stage={isStageServer('paths', searchParams)} />
    </>
  );
}
