import { Suspense } from 'react';
import PriceGame from './PriceGame';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';
import { PRICE_GAMES } from '@/lib/price-games';
import { shipFor } from '@/lib/price-ship';

// The server half of every Price Check family page. The bank is resolved
// HERE and only the picked day's item ships to the browser, so tomorrow's
// price never reaches a client.

export function priceMetadata(key) {
  const g = PRICE_GAMES[key];
  const title = `${g.name}: ${g.tag}, Every Day`;
  return {
    title: `Free Daily Price Guessing Game: ${g.name} | Mind Loft`,
    description: `A free daily price game. ${g.blurb} A higher-or-lower arrow and a hot-or-cold read after each. Part of Price Check. No app, no signup.`,
    alternates: { canonical: g.path },
    manifest: `/api/pwa-manifest?game=${key}`,
    icons: {
      // Favicon is the Mind Loft mark on every page, games included (owner rule, 2026-08-31).
      // ANY metadata.icons object suppresses the root app/icon.png inheritance, so it is restated.
      icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
      apple: [{ url: '/pricer-icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: g.name },
    openGraph: {
      images: [{ url: `/og/${key}.png`, width: 1200, height: 630, alt: `${g.name}, a daily price game from Mind Loft` }],
      title, description: g.blurb, url: g.path, type: 'website', siteName: 'Mind Loft',
    },
    twitter: { images: [`/og/${key}.png`], card: 'summary_large_image', title, description: g.blurb },
  };
}

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

function ComingSoon({ g, first }) {
  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: "'Manrope', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>{g.name} launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>{g.lead} Come back when the first one drops.</p>
        <a href="/" style={{ color: '#15803d', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function PricePage({ gameKey, PUZZLES, searchParams }) {
  const g = PRICE_GAMES[gameKey];
  const today = etTodayServer();
  let visible = PUZZLES.filter((p) => p.live <= today);
  // PRE-LAUNCH PREVIEW ONLY: before the first board is live, ?preview=1 opens
  // it so the page can be checked on production. Once any board is live this
  // does nothing, so it can never show a future price.
  if (!visible.length && searchParams && searchParams.preview === '1') visible = PUZZLES.slice(0, 1);
  if (!visible.length) return <ComingSoon g={g} first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  const picked = (forceNum && visible.find((p) => p.num === forceNum)) || visible[visible.length - 1];
  const light = visible.map(({ num, quizId, live, dateLabel }) => ({ num, quizId, live, dateLabel }));
  const gameJsonLd = {
    '@context': 'https://schema.org', '@type': 'Game', name: g.name,
    alternateName: `${g.name}, Daily Price Guessing Game`, url: `${SITE_URL}${g.path}`,
    description: `A free daily price-guessing game. ${g.how}`,
    genre: ['Price guessing', 'Puzzle', 'Trivia'],
    gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
    numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
    publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
      categoryCrumb(gameKey),
      { '@type': 'ListItem', position: 3, name: g.name },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <PriceGame key={picked.num} game={gameKey} puzzles={light} dayByNum={{ [picked.num]: shipFor(gameKey, picked) }} forceNum={forceNum || picked.num} />
      </Suspense>
      <StageTail self={gameKey} stage={isStageServer(gameKey, searchParams)} />
    </>
  );
}
