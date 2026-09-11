import { Suspense } from 'react';
import RedactClient from './RedactClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Redact launched as one of the daily puzzles: linked from the daily strip,
// the footer, the /daily archive, and the sitemap (/redact is the canonical,
// evergreen URL). One in-house capsule article a day, every content word
// hidden; guess words to uncover them and name the subject to win.
//
// PACKING: clientSafe() base64-packs each day's answer, text, and alias map
// before it is passed to the client. That is an obfuscation against casual
// view-source (the Extra stance), not a security boundary.

export const metadata = {
  title: 'Daily Uncover-the-Article Game: Redact | Mind Loft',
  description:
    'A free daily deduction game: an entire article about a mystery subject is blacked out, and every word you guess is uncovered wherever it appears. Name the subject to win. A new article every day, harder on Sundays.',
  alternates: { canonical: '/redact' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/redact.png', width: 1200, height: 630, alt: 'Redact — a daily uncover-the-article game from Mind Loft' }],
    title: 'Redact — Uncover the Article',
    description:
      'Every meaningful word of today’s article is hidden behind a black block. Guess words, watch the story surface, and name the subject. From Mind Loft.',
    url: '/redact',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/redact.png'],
    card: 'summary_large_image',
    title: 'Redact — Uncover the Article',
    description: 'An entire article, blacked out. Guess words to reveal it and name the subject. Today’s article is up.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Redact',
  alternateName: 'Redact — Daily Uncover-the-Article Game',
  url: `${SITE_URL}/redact`,
  description:
    'A free daily word-deduction game. A capsule article about one famous subject is fully redacted; guessing a word reveals every occurrence of it, and the player wins by uncovering the subject’s name. A category chip gives the opening minutes direction, and Sunday subjects are harder.',
  genre: ['Word game', 'Deduction puzzle', 'Trivia game', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/redact.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('redact'),
    { '@type': 'ListItem', position: 3, name: 'Redact' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

// Base64-pack the day's answer key material; the client unpacks it.
function clientSafe(p) {
  const { answer, text, aka, ...rest } = p;
  const enc = Buffer.from(JSON.stringify({ answer, text, aka: aka || {} }), 'utf8').toString('base64');
  return { ...rest, enc };
}

function ComingSoon({ first }) {
  // Rendered only if no day is live yet. Never crash the route on an empty
  // visible set — show a friendly placeholder instead.
  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: "'Manrope', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 18 }}>
          {'REDACT'.split('').map((ch, i) => (
            <div key={i} style={{ width: 38, height: 38, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, background: i === 0 ? '#b45309' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Redact opens {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          An entire article, blacked out. Guess words to uncover it and name the subject. Come back for the first one.
        </p>
        <a href="/daily" style={{ color: '#b45309', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function RedactPage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today).map(clientSafe);
  if (!visiblePuzzles.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <RedactClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="redact" stage={isStageServer('redact', searchParams)} />
    </>
  );
}
