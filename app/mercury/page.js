import { Suspense } from 'react';
import MercuryClient from './MercuryClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Mercury launched 2026-08-24 as the daily thermo sudoku, the sixth sudoku on
// the site after Suds (classic), Quilt (jigsaw), Cages (killer), Sando
// (sandwich) and Sixes (mini). Digits strictly increase along every
// thermometer from its bulb; the weekday ramp is the printed-given count and
// the Sunday Edition prints just eight digits under nine thermometers.
//
// /mercury is the canonical, evergreen URL; the dated /quiz/mercury-* stubs
// canonicalize here. This server page filters live<=today before handing
// puzzles to the client, so future boards and their solutions never reach a
// browser.

export const metadata = {
  title: 'Free Daily Thermo Sudoku: Mercury | Mind Loft',
  description:
    'A free daily thermo sudoku. An ordinary 9×9 plus thermometers: digits climb from each bulb to its tip. One logical solution, notes and a free hint, a new board every day, and a nine-thermometer Edition on Sundays.',
  alternates: { canonical: '/mercury' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/mercury.png', width: 1200, height: 630, alt: 'Mercury — a daily thermo sudoku from Mind Loft' }],
    title: 'Mercury — A Daily Thermo Sudoku',
    description:
      'Digits climb the thermometers: a 9×9 sudoku with pure visual ordering and one logical solution, from Mind Loft, daily.',
    url: '/mercury',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/mercury.png'],
    card: 'summary_large_image',
    title: 'Mercury — A Daily Thermo Sudoku',
    description:
      'Digits climb the thermometers: a 9×9 sudoku with pure visual ordering. A clean solve wins and the clock breaks the tie.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Mercury',
  alternateName: 'Mercury — Daily Thermo Sudoku',
  url: `${SITE_URL}/mercury`,
  description:
    'A free daily thermo sudoku: an ordinary 9×9 grid plus thermometers along which the digits strictly increase from bulb to tip. Each board has one solution reachable by pure logic — solve it for a perfect score, and ties break on fastest time.',
  genre: ['Logic puzzle', 'Sudoku', 'Number puzzle', 'Puzzle'],
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
    categoryCrumb('mercury'),
    { '@type': 'ListItem', position: 3, name: 'Mercury' },
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
          {'MERCURY'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 1 ? '#991b1b' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Mercury launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily thermo sudoku — digits climb every thermometer from its bulb. Come back when the first board drops.
        </p>
        <a href="/daily" style={{ color: '#991b1b', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function MercuryPage({ searchParams }) {
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
        <MercuryClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="mercury" stage={isStageServer('mercury', searchParams)} />
    </>
  );
}
