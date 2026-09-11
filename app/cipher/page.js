import { Suspense } from 'react';
import CipherClient from './CipherClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Cipher launched 2026-07-18 as one of the daily puzzles: linked from the daily
// strip, the footer, the /daily archive, and the sitemap (/cipher is the
// canonical, evergreen URL — the dated /quiz/cipher-* stubs canonicalize
// here). One cryptarithm a day, machine-verified to a unique solution.

export const metadata = {
  title: 'Daily Cryptarithm, Crack the Letter Math: Cipher | Mind Loft',
  description:
    'A free daily cryptarithm — one WORD + WORD = WORD equation where every letter hides a different digit. Exactly one solution, no guessing required. Crack it clean for a perfect 10, and take on four addends in the Sunday Edition.',
  alternates: { canonical: '/cipher' },
  manifest: '/api/pwa-manifest?game=cipher',
  icons: {
    // Favicon is the Mind Loft mark on every page, games included (owner rule, 2026-08-31).
    // Do NOT restore a per-game favicon here, and do NOT 'simplify' this by deleting the line:
    // ANY metadata.icons object suppresses the root app/icon.png inheritance (Next resolves the
    // file-convention icon only `if (!resolvedMetadata.icons)`), so removing it would leave the
    // tab on the 16px favicon.ico alone. The per-game apple-touch icon below and the .webmanifest
    // icons are deliberately untouched, so a home-screen or installed shortcut keeps the game's
    // own art. The now-unreferenced favicon-32.png files stay in /public.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/cipher-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Cipher' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/cipher.png', width: 1200, height: 630, alt: 'Cipher — the daily cryptarithm from Mind Loft' }],
    title: 'Cipher — The Daily Cryptarithm',
    description:
      'One letter-arithmetic equation a day: every letter is a different digit, and there is exactly one solution. From Mind Loft.',
    url: '/cipher',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/cipher.png'],
    card: 'summary_large_image',
    title: 'Cipher — The Daily Cryptarithm',
    description:
      'Every letter hides a digit. One equation a day, exactly one solution — crack it clean for a perfect 10.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Cipher',
  alternateName: 'Cipher — Daily Cryptarithm Puzzle',
  url: `${SITE_URL}/cipher`,
  description:
    'A free daily cryptarithm (alphametic) puzzle: one WORD + WORD = WORD equation where every letter stands for a different digit. The week ramps from two addends to three, with four in the Sunday Edition. Each puzzle is machine-verified to have exactly one solution, so pure column logic cracks it — no guessing.',
  genre: ['Number puzzle', 'Logic puzzle', 'Math puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/quiz-heroes/cipher.png`,
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
    categoryCrumb('cipher'),
    { '@type': 'ListItem', position: 3, name: 'Cipher' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

function ComingSoon({ first }) {
  // Rendered only if no puzzle is live yet (before the first drop). Never crash
  // the route on an empty visible set — show a friendly placeholder instead.
  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: "'Manrope', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 18 }}>
          {'CIPHER'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 23, background: i === 0 ? '#0f766e' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Cipher launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily cryptarithm — every letter hides a digit, and there is exactly one solution. Come back when the first equation drops.
        </p>
        <a href="/daily" style={{ color: '#0f766e', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function CipherPage({ searchParams }) {
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
        <CipherClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="cipher" stage={isStageServer('cipher', searchParams)} />
    </>
  );
}
