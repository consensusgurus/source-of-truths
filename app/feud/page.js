import { Suspense } from 'react';
import FeudClient from './FeudClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Feud launched 2026-08-01 as a daily crowd-survey game: five everyday
// prompts, up to three free-text answers each, and a LIVE answer key — the key
// is the tally of what today's players themselves say, recomputed all day
// (adaptive, like Outwit and Outrank). Scoring happens server-side in
// /api/feud against the house pool + real answers.
//
// IMPORTANT: the client gets a STRIPPED view of each puzzle — the canonical
// answer buckets, alias keys, and `house` pools never ship to the browser, or
// the early crowd could be reverse-engineered before playing. Only the
// questions go to the client.

export const metadata = {
  title: 'Daily Crowd Survey Game, Match What Everyone Says: Feud | Mind Loft',
  description:
    'A free daily survey game with a LIVE answer key: five everyday prompts, three answers each, and the key is whatever today’s players say. Match the crowd, bank their percentages, and watch the shares shift all day.',
  alternates: { canonical: '/feud' },
  manifest: '/api/pwa-manifest?game=feud',
  icons: {
    // Favicon is the Mind Loft mark on every page, games included (owner rule, 2026-08-31).
    // Do NOT restore a per-game favicon here, and do NOT 'simplify' this by deleting the line:
    // ANY metadata.icons object suppresses the root app/icon.png inheritance (Next resolves the
    // file-convention icon only `if (!resolvedMetadata.icons)`), so removing it would leave the
    // tab on the 16px favicon.ico alone. The per-game apple-touch icon below and the .webmanifest
    // icons are deliberately untouched, so a home-screen or installed shortcut keeps the game's
    // own art. The now-unreferenced favicon-32.png files stay in /public.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/feud-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Feud' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/feud.png', width: 1200, height: 630, alt: 'Feud — the daily crowd-survey game from Mind Loft' }],
    title: 'Feud — The Daily Crowd-Survey Game',
    description:
      'The answer key is live: it’s whatever today’s players say. Five prompts, three answers each — match the crowd. From Mind Loft.',
    url: '/feud',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/feud.png'],
    card: 'summary_large_image',
    title: 'Feud — The Daily Crowd-Survey Game',
    description:
      'Five everyday prompts. Type what you think the crowd will say — every answer is a vote, and the key keeps moving all day.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Feud',
  alternateName: 'Feud — Daily Crowd-Survey Game',
  url: `${SITE_URL}/feud`,
  description:
    'A free daily crowd game: five everyday survey prompts, up to three answers each, and a live answer key built from every player’s answers. Match the crowd, bank the percentages, and watch the key move all day.',
  genre: ['Game theory', 'Party puzzle', 'Trivia puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1 },
  image: `${SITE_URL}/quiz-heroes/feud.png`,
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
    categoryCrumb('feud'),
    { '@type': 'ListItem', position: 3, name: 'Feud' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

// Strip everything the browser must not see: the buckets and the house pool.
function clientSafe(p) {
  return {
    num: p.num,
    quizId: p.quizId,
    live: p.live,
    dateLabel: p.dateLabel,
    sunday: !!p.sunday,
    prompts: p.prompts.map((pr) => ({ q: pr.q })),
  };
}

function ComingSoon({ first }) {
  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: "'Manrope', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 18 }}>
          {'FEUD'.split('').map((ch, i) => (
            <div key={i} style={{ width: 34, height: 34, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20, background: i >= 2 ? '#9f1239' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Feud launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily crowd-survey game with a live answer key — five prompts, and the answers are whatever the day&rsquo;s players say. Come back when the first crowd forms.
        </p>
        <a href="/daily" style={{ color: '#9f1239', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function FeudPage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today).map(clientSafe);
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
        <FeudClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="feud" stage={isStageServer('feud', searchParams)} />
    </>
  );
}
