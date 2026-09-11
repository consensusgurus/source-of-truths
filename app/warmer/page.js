import { Suspense } from 'react';
import WarmerClient from './WarmerClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Warmer launched 2026-07-18 as the seventeenth daily: linked from the daily
// strip, the /daily archive, the puzzles grids, and the sitemap (/warmer is the
// canonical, evergreen URL — the dated /quiz/warmer-* stubs canonicalize here).
// One secret word a day; guess by meaning, hotter or colder, until you land it.
// The Sunday Edition picks a rarer word (deeper in the frequency-ordered vocab).
//
// The server picks the ACTIVE puzzle (today, or ?p=N from the archive) and sends
// only THAT day's similarity ranking to the client, plus a slim answer-free meta
// list of the rest — so future words never reach the browser.
//
// It sends the ranking in its STORED form: `o`, the packed base64 string (see
// ./order-codec.js), which the client decodes. That is half the bytes of the
// 32,300-number JSON array the page used to inline, and it keeps the decode in
// exactly one place. The active day is rebuilt field by field rather than spread
// from the board, so the only ranking that can ever cross to the browser is the
// one named here.

export const metadata = {
  title: 'Daily Word Puzzle, Hotter or Colder: Warmer | Mind Loft',
  description:
    'A free daily word puzzle — one secret word, and every guess tells you how close it is in meaning on a cold-to-hot spectrum. Ocean is scorching for "sea," pencil is freezing. Unlimited guesses; the leaderboard ranks fewest guesses, fastest time. The Sunday Edition hides a rarer word.',
  alternates: { canonical: '/warmer' },
  manifest: '/api/pwa-manifest?game=warmer',
  icons: {
    // Favicon is the Mind Loft mark on every page, games included (owner rule, 2026-08-31).
    // Do NOT restore a per-game favicon here, and do NOT 'simplify' this by deleting the line:
    // ANY metadata.icons object suppresses the root app/icon.png inheritance (Next resolves the
    // file-convention icon only `if (!resolvedMetadata.icons)`), so removing it would leave the
    // tab on the 16px favicon.ico alone. The per-game apple-touch icon below and the .webmanifest
    // icons are deliberately untouched, so a home-screen or installed shortcut keeps the game's
    // own art. The now-unreferenced favicon-32.png files stay in /public.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/warmer-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Warmer' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/warmer.png', width: 1200, height: 630, alt: 'Warmer — a daily hot-and-cold word puzzle from Mind Loft' }],
    title: 'Warmer — Hotter or Colder',
    description:
      'One secret word a day. Every guess is scored by meaning, cold to hot, until you land the word. A new one every day from Mind Loft.',
    url: '/warmer',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/warmer.png'],
    card: 'summary_large_image',
    title: 'Warmer — Hotter or Colder',
    description: 'One secret word a day. Guess by meaning — hotter or colder — until you land it.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Warmer',
  alternateName: 'Warmer — Daily Hot-and-Cold Word Puzzle',
  url: `${SITE_URL}/warmer`,
  description:
    'A free daily word puzzle: one secret word, and every guess is scored by how close it is in meaning on a cold-to-hot spectrum. Unlimited guesses — the daily leaderboard ranks players on fewest guesses, fastest time breaking ties.',
  genre: ['Word puzzle', 'Guessing puzzle', 'Vocabulary puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/quiz-heroes/warmer.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('warmer'),
    { '@type': 'ListItem', position: 3, name: 'Warmer' },
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
          {'WARMER'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 24, background: i === 5 ? '#dc2626' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Warmer launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily hot-and-cold word hunt — one secret word, guessed by meaning. Come back when the first word drops.
        </p>
        <a href="/daily" style={{ color: '#dc2626', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function WarmerPage({ searchParams }) {
  const today = etTodayServer();
  const visible = PUZZLES.filter((p) => p.live <= today);
  if (!visible.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  // The active puzzle: the requested archive day (if live) or the latest drop.
  let active = forceNum ? visible.find((p) => p.num === forceNum) : null;
  if (!active) active = visible[visible.length - 1];
  // Slim, answer-free meta for the rest (prev-day link, streaks, "is this today").
  const meta = visible.map((p) => ({ num: p.num, quizId: p.quizId, live: p.live, dateLabel: p.dateLabel, sunday: p.sunday }));
  // The one day whose ranking crosses to the client, listed explicitly.
  const activeDay = {
    num: active.num, quizId: active.quizId, live: active.live,
    dateLabel: active.dateLabel, sunday: active.sunday, o: active.o,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <WarmerClient key={forceNum || 'today'} active={activeDay} puzzles={meta} forceNum={forceNum} />
      </Suspense>
      <StageTail self="warmer" stage={isStageServer('warmer', searchParams)} />
    </>
  );
}
