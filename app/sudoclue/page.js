import { Suspense } from 'react';
import SudoclueClient from './SudoclueClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Sudoclue launched 2026-10-30 as a daily Logic puzzle: a murder mystery on a
// real place's floor plan. Place one person per row and column and deduce every
// hidden role (owner, 2026-10-30). Puzzles are gated by Eastern date here, so
// tomorrow's case never reaches the browser, and no answer ships at all: the
// client derives it from the clues (lib/sudoclue-engine.js).

export const metadata = {
  title: 'Free Daily Murder Mystery Logic Puzzle: Sudoclue | Mind Loft',
  description:
    'A free daily murder mystery logic puzzle. Place one suspect per row and column of a real place, then deduce the victim, the killer and every role.',
  alternates: { canonical: '/sudoclue' },
  openGraph: {
    images: [{ url: '/og/sudoclue.png', width: 1200, height: 630, alt: 'Sudoclue, a daily murder mystery logic puzzle from Mind Loft' }],
    title: 'Sudoclue: A Daily Murder Mystery Logic Grid',
    description: 'One person per row and column, a real place, and a killer who was alone with the victim. One case a day, exactly one answer.',
    url: '/sudoclue', type: 'website', siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/sudoclue.png'],
    card: 'summary_large_image',
    title: 'Sudoclue: A Daily Murder Mystery Logic Grid',
    description: 'One person per row and column, a real place, and a killer who was alone with the victim.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org', '@type': 'Game', name: 'Sudoclue',
  alternateName: 'Sudoclue: Daily Murder Mystery Logic Puzzle',
  url: `${SITE_URL}/sudoclue`,
  description:
    'A free daily murder mystery logic puzzle set in real places drawn as floor plans, from Central Park to Griffith Observatory. Place every person so there is exactly one in each row and each column, then deduce each hidden role: the victim, the killer (the only person alone in a room with the victim), the accomplice, and the guests, staff and family. Every case is machine verified to have exactly one answer. 7 by 7 early in the week, up to a 10 by 10 Sunday Edition.',
  genre: ['Logic puzzle', 'Deduction puzzle', 'Mystery puzzle', 'Puzzle'],
  gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/sudoclue.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};
const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('sudoclue'),
    { '@type': 'ListItem', position: 3, name: 'Sudoclue' },
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
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Sudoclue</div>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: '#3f4757', margin: '0 0 16px' }}>
          Sudoclue opens {first.dateLabel}. One person per row and column, and a killer to find.
        </p>
        <a href="/" style={{ display: 'inline-block', background: '#2563eb', color: '#fff', fontWeight: 800, fontSize: 14, padding: '11px 22px', borderRadius: 9, textDecoration: 'none' }}>
          Today&rsquo;s slate
        </a>
      </div>
    </div>
  );
}

export default function SudocluePage({ searchParams }) {
  const today = etTodayServer();
  const visible = PUZZLES.filter((p) => p.live <= today);
  if (!visible.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <SudoclueClient key={forceNum || 'today'} puzzles={visible} forceNum={forceNum} />
      </Suspense>
      <StageTail self="sudoclue" stage={isStageServer('sudoclue', searchParams)} />
    </>
  );
}
