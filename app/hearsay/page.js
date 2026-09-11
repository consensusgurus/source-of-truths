import { Suspense } from 'react';
import HearsayClient from './HearsayClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Hearsay launched 2026-07-25 as one of the daily puzzles: linked from the daily
// strip, the /daily archive, and the sitemap (/hearsay is the canonical,
// evergreen URL — the dated /quiz/hearsay-* stubs canonicalize here). One case
// a day, machine-verified to leave exactly one card and to stay ambiguous until
// the final line (scripts/verify-hearsay.mjs).
//
// LEAK GUARD: no case stores its answer. The client replays the same
// public-announcement simulation the generator used, so the surviving card is
// derived in the browser rather than shipped.

export const metadata = {
  title: 'Free Daily Logic Puzzle, Deduce What They Know: Hearsay | Mind Loft',
  description:
    'A free daily logic puzzle in the Cheryl’s Birthday family. Two people are each told one detail of a secret card, then they talk. Work out which card it is from what they admit they do not know. New case every day.',
  alternates: { canonical: '/hearsay' },
  manifest: '/api/pwa-manifest?game=hearsay',
  icons: {
    // Favicon is the Mind Loft mark on every page, games included (owner rule, 2026-08-31).
    // Do NOT restore a per-game favicon here, and do NOT 'simplify' this by deleting the line:
    // ANY metadata.icons object suppresses the root app/icon.png inheritance (Next resolves the
    // file-convention icon only `if (!resolvedMetadata.icons)`), so removing it would leave the
    // tab on the 16px favicon.ico alone. The per-game apple-touch icon below and the .webmanifest
    // icons are deliberately untouched, so a home-screen or installed shortcut keeps the game's
    // own art. The now-unreferenced favicon-32.png files stay in /public.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/hearsay-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Hearsay' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/hearsay.png', width: 1200, height: 630, alt: 'Hearsay — the daily puzzle of what other people do not know' }],
    title: 'Hearsay — Deduce It From What They Don’t Know',
    description:
      'Each of them was told one detail and nothing else. Then they speak. Every admission of ignorance cuts the shortlist, and exactly one card survives. A new daily logic puzzle from Mind Loft.',
    url: '/hearsay',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/hearsay.png'],
    card: 'summary_large_image',
    title: 'Hearsay — Deduce It From What They Don’t Know',
    description: 'Two people, one detail each, and a conversation that narrows a shortlist to one. Play today’s case.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Hearsay',
  alternateName: 'Hearsay — Daily Epistemic Logic Puzzle',
  url: `${SITE_URL}/hearsay`,
  description:
    'A free daily logic puzzle in the Cheryl’s Birthday tradition: each character is privately told one attribute of a secret card, and their statements about what they can and cannot deduce narrow a public shortlist to exactly one answer.',
  genre: ['Logic puzzle', 'Deduction puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/quiz-heroes/hearsay.png`,
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
    categoryCrumb('hearsay'),
    { '@type': 'ListItem', position: 3, name: 'Hearsay' },
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
          {'HEARSAY'.split('').map((ch, i) => (
            <div key={i} style={{ width: 38, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 0 ? '#7c2d92' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Hearsay opens {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily puzzle of what other people do not know. Come back when the first case is heard.
        </p>
        <a href="/daily" style={{ color: '#7c2d92', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function HearsayPage({ searchParams }) {
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
        <HearsayClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="hearsay" stage={isStageServer('hearsay', searchParams)} />
    </>
  );
}
