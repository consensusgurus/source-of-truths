import { Suspense } from 'react';
import FeverClient from './FeverClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Fever: the 6x6 version of mercury.
// Launched 2026-11-08 (owner: the color twins, the Small 6x6 sudokus and
// MercuryToo, one push). This server page filters live<=today before handing
// boards to the client, so future boards and their solutions never reach a browser.

export const metadata = {
  title: "Free Daily 6×6 Thermo Sudoku: Fever | Mind Loft",
  description: "Free daily 6x6 twin of Mercury: digits rise along every thermometer from the bulb. One logical solution, new every day.",
  alternates: { canonical: '/fever' },
  openGraph: {
    images: [{ url: '/og/fever.png', width: 1200, height: 630, alt: "Fever, a daily 6×6 thermo sudoku from Mind Loft" }],
    title: "Free Daily 6×6 Thermo Sudoku: Fever",
    description: "Free daily 6x6 twin of Mercury: digits rise along every thermometer from the bulb. One logical solution, new every day.",
    url: '/fever',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/fever.png'],
    card: 'summary_large_image',
    title: "Free Daily 6×6 Thermo Sudoku: Fever",
    description: "Free daily 6x6 twin of Mercury: digits rise along every thermometer from the bulb. One logical solution, new every day.",
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Fever',
  alternateName: "Fever: Daily 6×6 thermo sudoku",
  url: `${SITE_URL}/fever`,
  description: "Free daily 6x6 twin of Mercury: digits rise along every thermometer from the bulb. One logical solution, new every day.",
  genre: ['Logic puzzle', 'Sudoku', 'Number puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/fever.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('fever'),
    { '@type': 'ListItem', position: 3, name: 'Fever' },
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
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Fever launches {first ? first.dateLabel : 'soon'}.</h1>
        <a href="/" style={{ color: T.ink, fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function Page({ searchParams }) {
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
        <FeverClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="fever" stage={isStageServer('fever', searchParams)} />
    </>
  );
}
