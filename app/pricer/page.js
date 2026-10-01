import { Suspense } from 'react';
import PricerClient from './PricerClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Pricer launched 2026-10-01 as a one-product price guess. (A bracket game
// once carried this name; it was pulled on 2026-08-09 before it ever ran.) One real product a
// day, five guesses at its price, hot and cold after each. The bank is resolved
// HERE and only the picked day's product ships to the browser, so tomorrow's
// price never reaches a client. Machine-verified by scripts/verify-pricer.mjs.

export const metadata = {
  title: 'Free Daily Price Guessing Game: Pricer | Mind Loft',
  description:
    'A free daily price game. One real product a day, five guesses at what it costs, and a higher-or-lower arrow with a hot-or-cold read after each. Amazon products on weekdays, a car or a watch on Sundays. No app, no signup.',
  alternates: { canonical: '/pricer' },
  manifest: '/api/pwa-manifest?game=pricer',
  icons: {
    // Favicon is the Mind Loft mark on every page, games included (owner rule, 2026-08-31).
    // Do NOT restore a per-game favicon here, and do NOT 'simplify' this by deleting the line:
    // ANY metadata.icons object suppresses the root app/icon.png inheritance.
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/pricer-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Pricer' },
  openGraph: {
    images: [{ url: '/og/pricer.png', width: 1200, height: 630, alt: 'Pricer — a daily puzzle from Mind Loft' }],
    title: 'Pricer — Guess the Price, Every Day',
    description: 'One real product a day. Five guesses at its price, hot or cold after each.',
    url: '/pricer', type: 'website', siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/pricer.png'], card: 'summary_large_image',
    title: 'Pricer — Guess the Price, Every Day',
    description: 'One real product a day. Five guesses at its price, hot or cold after each.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org', '@type': 'Game', name: 'Pricer',
  alternateName: 'Pricer — Daily Price Guessing Game', url: `${SITE_URL}/pricer`,
  description:
    'A free daily price-guessing game. One real product is shown each day and you have five guesses at its price; each guess says higher or lower and how hot you are. Your score is your closest guess out of 10, measured as a ratio, and a guess within 1% is a bullseye. Weekdays are Amazon products; Sundays are a big-ticket item at the maker’s starting price.',
  genre: ['Price guessing', 'Puzzle', 'Trivia'],
  gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};
const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('pricer'),
    { '@type': 'ListItem', position: 3, name: 'Pricer' },
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
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Pricer launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          One real product a day, five guesses at its price. Come back when the first one drops.
        </p>
        <a href="/" style={{ color: '#15803d', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

// What the client is allowed to see of a day. Everything the bank stores, so
// this is a whitelist rather than a strip: a new authoring field stays on the
// server until somebody decides it belongs on the page.
const shipDay = (p) => ({ name: p.name, cat: p.cat, price: p.price, shop: p.shop, href: p.href, img: p.img, note: p.note, gathered: p.gathered, credit: p.credit || null, creditUrl: p.creditUrl || null });

export default function PricerPage({ searchParams }) {
  const today = etTodayServer();
  let visible = PUZZLES.filter((p) => p.live <= today);
  // PRE-LAUNCH PREVIEW ONLY: before the first board is live, ?preview=1 opens
  // it so the page can be checked on production. Once any board is live this
  // does nothing, so it can never show a future price.
  if (!visible.length && searchParams && searchParams.preview === '1') visible = PUZZLES.slice(0, 1);
  if (!visible.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  const picked = (forceNum && visible.find((p) => p.num === forceNum)) || visible[visible.length - 1];
  const light = visible.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <PricerClient key={picked.num} puzzles={light} dayByNum={{ [picked.num]: shipDay(picked) }} forceNum={forceNum || picked.num} />
      </Suspense>
      <StageTail self="pricer" stage={isStageServer('pricer', searchParams)} />
    </>
  );
}
