import { Suspense } from 'react';
import OutwitClient from './OutwitClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Outwit launched 2026-07-17 as the thirteenth daily: linked from the daily
// strip, the footer, the /daily archive, and the sitemap (/outwit is the
// canonical, evergreen URL — the dated /quiz/outwit-* stubs canonicalize
// here). Five game-theory prompts a day against the whole player field; scoring
// happens server-side in /api/outwit against the house crowd + real picks.
//
// IMPORTANT: the client gets a STRIPPED view of each puzzle — the `house`
// arrays (and the herd question's truth) never ship to the browser, or the
// crowd could be reverse-engineered before playing.

export const metadata = {
  title: 'Daily Crowd Puzzle, Beat Everyone Playing Today: Outwit | Mind Loft',
  description:
    'A free daily puzzle where the puzzle is other people. Five game-theory prompts against the whole field: dodge the popular pick, read the herd, meet the crowd, be the rare bird, then undercut the average by a fraction that changes daily. Six prompts in the Sunday Edition. Then see where everyone actually went.',
  alternates: { canonical: '/outwit' },
  manifest: '/api/pwa-manifest?game=outwit',
  icons: {
    // Favicon is the Mind Loft mark on every page, games included (owner rule, 2026-08-31).
    // Do NOT restore a per-game favicon here, and do NOT 'simplify' this by deleting the line:
    // ANY metadata.icons object suppresses the root app/icon.png inheritance (Next resolves the
    // file-convention icon only `if (!resolvedMetadata.icons)`), so removing it would leave the
    // tab on the 16px favicon.ico alone. The per-game apple-touch icon below and the .webmanifest
    // icons are deliberately untouched, so a home-screen or installed shortcut keeps the game's
    // own art. The now-unreferenced favicon-32.png files stay in /public.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/outwit-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Outwit' },
  openGraph: {
    // Static share card (2026-09-02): pre-rendered once into public/og/, replacing the per-game
    // opengraph-image / twitter-image routes that satori re-rendered on every deploy.
    images: [{ url: '/og/outwit.png', width: 1200, height: 630, alt: 'Outwit — the daily crowd puzzle from Mind Loft' }],
    title: 'Outwit — The Daily Crowd Puzzle',
    description:
      'Your opponent is everyone playing today. Five quick prompts, no right answers — only what the crowd does. From Mind Loft.',
    url: '/outwit',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/outwit.png'],
    card: 'summary_large_image',
    title: 'Outwit — The Daily Crowd Puzzle',
    description:
      'Five prompts against everyone playing today. Predict the crowd, then watch the real numbers roll in.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Outwit',
  alternateName: 'Outwit — Daily Crowd Puzzle',
  url: `${SITE_URL}/outwit`,
  description:
    'A free daily game-theory puzzle: five prompts against every other player. Pick what the fewest pick, guess the crowd median, match the crowd favorite, make the rarest pick, then undercut the average by the day\u2019s fraction, which changes daily. Scored against the real player pool.',
  genre: ['Game theory', 'Trivia puzzle', 'Party puzzle', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1 },
  image: `${SITE_URL}/quiz-heroes/outwit.png`,
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
    categoryCrumb('outwit'),
    { '@type': 'ListItem', position: 3, name: 'Outwit' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

// Strip everything the browser must not see: house crowds and herd truths.
function clientSafe(p) {
  return {
    num: p.num,
    quizId: p.quizId,
    live: p.live,
    dateLabel: p.dateLabel,
    // `sunday` MUST survive this strip or the Sunday Edition badge never
    // renders (see the Sunday Editions section of CLAUDE.md).
    sunday: !!p.sunday,
    prompts: p.prompts.map((pr) => ({
      type: pr.type,
      tag: pr.tag,
      q: pr.q,
      ...(pr.options ? { options: pr.options } : {}),
      ...(pr.min != null ? { min: pr.min, max: pr.max } : {}),
    })),
  };
}

function ComingSoon({ first }) {
  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: "'Manrope', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 18 }}>
          {'OUTWIT'.split('').map((ch, i) => (
            <div key={i} style={{ width: 38, height: 38, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, background: i >= 3 ? '#1f2937' : T.ink, color: i >= 3 ? T.gold : T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Outwit launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily crowd puzzle — five prompts against everyone playing. Come back when the first crowd forms.
        </p>
        <a href="/daily" style={{ color: '#1f2937', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function OutwitPage({ searchParams }) {
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
        <OutwitClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="outwit" stage={isStageServer('outwit', searchParams)} />
    </>
  );
}
