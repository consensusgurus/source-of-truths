import { Suspense } from 'react';
import StetClient from './StetClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Stet launched 2026-07-17 as the twelfth daily: linked from the daily strip,
// the footer, the /daily archive, and the sitemap (/stet is the canonical,
// evergreen URL — the dated /quiz/stet-* stubs canonicalize here). One news
// brief a day, one wrong word per sentence; tap it, fix it. Sundays run seven
// sentences with finer copy-desk calls.

export const metadata = {
  title: 'Daily Copy-Desk Word Puzzle, Find the Wrong Word or Grammar Slip: Stet | Mind Loft',
  description:
    "A free daily word puzzle — you're the copy editor. Almost every sentence in today's brief hides one wrong word or grammar slip (real words only, so spellcheck can't save you): free reign, should of, a mute point. But some sentences are clean — stamp those 'stet.' Tap it, fix it, keep a clean desk.",
  alternates: { canonical: '/stet' },
  manifest: '/api/pwa-manifest?game=stet',
  icons: {
    // Favicon is the Mind Loft mark on every page, games included (owner rule, 2026-08-31).
    // Do NOT restore a per-game favicon here, and do NOT 'simplify' this by deleting the line:
    // ANY metadata.icons object suppresses the root app/icon.png inheritance (Next resolves the
    // file-convention icon only `if (!resolvedMetadata.icons)`), so removing it would leave the
    // tab on the 16px favicon.ico alone. The per-game apple-touch icon below and the .webmanifest
    // icons are deliberately untouched, so a home-screen or installed shortcut keeps the game's
    // own art. The now-unreferenced favicon-32.png files stay in /public.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/stet-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Stet' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/stet.png', width: 1200, height: 630, alt: 'Stet — the daily copy-desk puzzle from Mind Loft' }],
    title: 'Stet — The Daily Copy-Desk Puzzle',
    description:
      'One news brief a day, one wrong word per sentence — maybe. Every error is a real word, so spellcheck is no help. Tap it, fix it — or stamp clean copy stet. From Mind Loft.',
    url: '/stet',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/stet.png'],
    card: 'summary_large_image',
    title: 'Stet — The Daily Copy-Desk Puzzle',
    description:
      'Almost every sentence hides one wrong word. Spellcheck can’t see it. Can you? Careful — some are clean.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Stet',
  alternateName: 'Stet — Daily Copy-Desk Word Puzzle',
  url: `${SITE_URL}/stet`,
  description:
    'A free daily word puzzle: a short news brief where almost every sentence hides one wrong word — an eggcorn, a swapped homophone, a malaprop, a grammar slip. Every error is a real word, so a spellchecker sails past it. Tap the word, type the fix — or stamp clean copy stet.',
  genre: ['Word puzzle', 'Language puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/quiz-heroes/stet.png`,
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
    categoryCrumb('stet'),
    { '@type': 'ListItem', position: 3, name: 'Stet' },
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
          {'STET'.split('').map((ch, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, background: i === 0 ? '#0369a1' : T.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Stet launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily copy-desk puzzle — one wrong word per sentence, maybe. Come back when the first brief lands.
        </p>
        <a href="/daily" style={{ color: '#0369a1', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function StetPage({ searchParams }) {
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
        <StetClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="stet" stage={isStageServer('stet', searchParams)} />
    </>
  );
}
