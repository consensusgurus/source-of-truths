import { Suspense } from 'react';
import ScalesClient from './ScalesClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Scales launched 2026-11-26: the daily balance-scale weights puzzle. Shapes
// and numbered weights sit on a few scales; work out what each shape weighs.
// /scales is the canonical, evergreen URL. This server page filters
// live<=today before handing boards to the client, so future boards never
// reach a browser.

export const metadata = {
  title: 'Free Daily Balance Scale Puzzle, Find Each Weight: Scales | Mind Loft',
  description:
    'A free daily balance scale puzzle: shapes sit on scales with numbered weights. Work out what each shape weighs, then check. One answer, new every day.',
  alternates: { canonical: '/scales' },
  openGraph: {
    images: [{ url: '/og/scales.png', width: 1200, height: 630, alt: 'Scales, a daily balance scale puzzle from Mind Loft' }],
    title: 'Scales: What Does Each Shape Weigh?',
    description: 'Shapes and numbered weights sit on a few scales. Work out what each shape weighs in the fewest checks. The same scales for everyone, new every day.',
    url: '/scales',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/scales.png'],
    card: 'summary_large_image',
    title: 'Scales: What Does Each Shape Weigh?',
    description: 'Shapes and numbered weights sit on a few scales. Work out what each shape weighs in the fewest checks. The same scales for everyone, new every day.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Scales',
  alternateName: 'Scales: The Daily Balance Scale Puzzle',
  url: `${SITE_URL}/scales`,
  description:
    'A free daily balance scale puzzle: shapes and numbered weights sit on a few scales, and every shape has one hidden whole-number weight. Work out each weight, then check the scales. Three shapes early in the week, six on the Sunday Edition, with tilted scales on the harder days. Ranked on the fewest checks, then the clock.',
  genre: ['Balance puzzle', 'Algebra puzzle', 'Number puzzle', 'Logic puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/scales.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('scales'),
    { '@type': 'ListItem', position: 3, name: 'Scales' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function Page({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today);
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {/* Suspense is required: the client reads useSearchParams. */}
      <Suspense fallback={null}>
        <ScalesClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="scales" stage={isStageServer('scales', searchParams)} />
    </>
  );
}
