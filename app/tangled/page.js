import { Suspense } from 'react';
import TangledClient from './TangledClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Tangled launched 2026-11-07, the daily rope untangling puzzle (Logic).
// Rows are gated by Eastern date here like every other daily, so future boards
// never reach a browser.

export const metadata = {
  title: 'Free Daily Rope Untangling Puzzle: Tangled | Mind Loft',
  description:
    'A free daily rope untangling puzzle: move the pegs into empty holes until no two ropes cross. Same tangle for everyone, a new frame shape daily, fastest wins.',
  alternates: { canonical: '/tangled' },
  openGraph: {
    images: [{ url: '/og/tangled.png', width: 1200, height: 630, alt: 'Tangled, a daily rope untangling puzzle from Mind Loft' }],
    title: 'Tangled: A Daily Rope Untangling Puzzle',
    description: 'Ropes wound round each other on a frame of pegs. Move the pegs until no two ropes cross. The same tangle for everybody, and the fastest solve wins.',
    url: '/tangled',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/tangled.png'],
    card: 'summary_large_image',
    title: 'Tangled: A Daily Rope Untangling Puzzle',
    description: 'Ropes wound round each other on a frame of pegs. Move the pegs until no two ropes cross. The same tangle for everybody, and the fastest solve wins.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Tangled',
  alternateName: 'Tangled, Daily Rope Untangling Puzzle',
  url: `${SITE_URL}/tangled`,
  description:
    'A daily rope untangling puzzle. Ropes run between pegs round a frame that changes shape every day; move the pegs into empty holes until no two ropes cross. The same board for every player, ranked on time.',
  genre: ['Puzzle', 'Logic'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/tangled.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('tangled'),
    { '@type': 'ListItem', position: 3, name: 'Tangled' },
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
      <div style={{ maxWidth: 420, width: '100%', background: '#fff', border: '1px solid #0b0d12', borderRadius: 12, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Tangled</div>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: '#3f4757', margin: '0 0 16px' }}>
          Tangled launches {first.dateLabel}. Same ropes for everybody.
        </p>
        <a href="/" style={{ display: 'inline-block', background: '#2563eb', color: '#fff', fontWeight: 800, fontSize: 14, padding: '11px 22px', borderRadius: 9, textDecoration: 'none' }}>
          Today&rsquo;s slate
        </a>
      </div>
    </div>
  );
}

export default function TangledPage({ searchParams }) {
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
        <TangledClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="tangled" stage={isStageServer('tangled', searchParams)} />
    </>
  );
}
