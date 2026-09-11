import { Suspense } from 'react';
import LodeClient from './LodeClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Lode launched 2026-07-25 as a daily puzzle: linked from the daily strip, the
// footer, the /daily archive, and the sitemap (/lode is the canonical, evergreen
// URL — the dated /quiz/lode-* stubs canonicalize here). Seven letters, one core
// letter, and scoring that pays for rare words rather than long ones.
//
// The whole scored word list lives in the puzzle object, so this SERVER
// component is what keeps future boards out of the browser: filter live<=today
// before anything reaches the client.

export const metadata = {
  title: 'Free Daily Word Puzzle, Seven Letters, Rare Words Pay: Lode | Mind Loft',
  description:
    'A free daily word puzzle and a fresh spin on the letters puzzle. Seven letters, one core letter every word must use, and points that reward rare words over long ones. Strike the vein, then chase the Mother Lode. New board every day.',
  alternates: { canonical: '/lode' },
  manifest: '/api/pwa-manifest?game=lode',
  icons: {
    // Favicon is the Mind Loft mark on every page, games included (owner rule, 2026-08-31).
    // Do NOT restore a per-game favicon here, and do NOT 'simplify' this by deleting the line:
    // ANY metadata.icons object suppresses the root app/icon.png inheritance (Next resolves the
    // file-convention icon only `if (!resolvedMetadata.icons)`), so removing it would leave the
    // tab on the 16px favicon.ico alone. The per-game apple-touch icon below and the .webmanifest
    // icons are deliberately untouched, so a home-screen or installed shortcut keeps the game's
    // own art. The now-unreferenced favicon-32.png files stay in /public.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/lode-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Lode' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/lode.png', width: 1200, height: 630, alt: 'Lode — the daily letter-mining word puzzle from Mind Loft' }],
    title: 'Lode — A Daily Word Puzzle Where Rare Words Pay',
    description:
      'Seven letters, one core letter, four letters minimum. Common words are chip shots; the rare ones are worth three times as much. Strike the vein, then dig for the Mother Lode.',
    url: '/lode',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/lode.png'],
    card: 'summary_large_image',
    title: 'Lode — A Daily Word Puzzle Where Rare Words Pay',
    description:
      'Seven letters, one core letter, and scoring that rewards the words nobody else finds.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Lode',
  alternateName: 'Lode — Daily Letter-Mining Word Puzzle',
  url: `${SITE_URL}/lode`,
  description:
    'A free daily word puzzle: everyone gets the same seven letters and one core letter that every word must contain. Words are four letters or longer and letters may be reused. Points scale with how rare a word is rather than how long it is, a pangram uses every letter, and each day carries a vein to strike and a Mother Lode to chase.',
  genre: ['Word puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/quiz-heroes/lode.png`,
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
    categoryCrumb('lode'),
    { '@type': 'ListItem', position: 3, name: 'Lode' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

function ComingSoon({ first }) {
  // Rendered only if no board is live yet. Never crash the route on an empty
  // visible set — show a friendly placeholder instead.
  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: "'Manrope', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 18 }}>
          {'LODE'.split('').map((ch, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, background: i === 0 ? T.goldInk : '#2b2f38', color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.6)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Lode launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily letter-mining word puzzle &mdash; seven letters, one core, and points that pay for the rare finds. Come back when the first seam opens.
        </p>
        <a href="/daily" style={{ color: T.goldInk, fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function LodePage({ searchParams }) {
  const today = etTodayServer();
  const live = PUZZLES.filter((p) => p.live <= today);
  if (!live.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;

  // `extra` (the real-but-unscored words, ~88 a board) is only ever consulted
  // for the board being PLAYED, but every live board ships to the browser so the
  // archive works. Sending all of them would grow the payload by about 0.75 KB
  // per board per day forever, for data that is dead weight on all but one. So
  // it is stripped from the rest here.
  //
  // This mirrors pickPuzzle() in LodeClient: forceNum when it matches, else the
  // newest live board. `live` is already filtered to live<=today, so "newest
  // live" is simply the last one. If the two ever disagree the board just falls
  // back to refusing unscored words, which is the old behaviour, not a break.
  const activeNum = (forceNum && live.some((p) => p.num === forceNum))
    ? forceNum
    : live[live.length - 1].num;
  const visiblePuzzles = live.map((p) => (
    p.num === activeNum || !p.extra ? p : { ...p, extra: undefined }
  ));
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
        <LodeClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="lode" stage={isStageServer('lode', searchParams)} />
    </>
  );
}
