import { Suspense } from 'react';
import FilingClient from './FilingClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Filing launched 2026-11-10: name the company from its IPO filing (Form S-1),
// six clues that unseal one at a time, the middle leg of the Due Diligence run.
// /filing is the canonical, evergreen URL. This server page filters live<=today
// before handing puzzles to the client, so future answers never reach a browser.

export const metadata = {
  title: 'Free Daily Guess the Company From Its IPO Filing: Filing | Mind Loft',
  description:
    'A free daily business guessing game: name the company from its IPO filing, the SEC Form S-1, with the name blacked out. Fewest clues wins.',
  alternates: { canonical: '/filing' },
  openGraph: {
    images: [{ url: '/og/filing.png', width: 1200, height: 630, alt: 'Filing, a daily name-the-company-from-its-IPO-filing game from Mind Loft' }],
    title: 'Filing: Name the Company From Its IPO Filing',
    description: 'A Form S-1 with the name blacked out. Risk factors, competitors, key metrics. Name the company in the fewest clues. A new filing every day.',
    url: '/filing',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/filing.png'],
    card: 'summary_large_image',
    title: 'Filing: Name the Company From Its IPO Filing',
    description: 'A Form S-1 with the name blacked out. Risk factors, competitors, key metrics. Name the company in the fewest clues. A new filing every day.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Filing',
  alternateName: 'Filing: The Daily Guess the Company From Its S-1',
  url: `${SITE_URL}/filing`,
  description:
    'A free daily business guessing game: one public company’s Form S-1, the IPO filing, with the name blacked out, and six clues that unseal one at a time, from a risk factor to its own words. Fewer clues rank higher, then the clock.',
  genre: ['Trivia', 'Guessing game', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/filing.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('filing'),
    { '@type': 'ListItem', position: 3, name: 'Filing' },
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
        <FilingClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="filing" stage={isStageServer('filing', searchParams)} />
    </>
  );
}
