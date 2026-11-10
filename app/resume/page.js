import { Suspense } from 'react';
import ResumeClient from './ResumeClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Resume launched 2026-11-09: name the famous person from their career
// profile, with six clues that open one at a time. /resume is the canonical,
// evergreen URL. This server page filters live<=today before handing puzzles to
// the client, so future answers never reach a browser.

export const metadata = {
  title: 'Free Daily Guess Who Game From a Resume: Resume | Mind Loft',
  description:
    'A free daily guess-who game: name the famous person from their career profile, with colleges, past jobs and fun facts. Fewest clues wins.',
  alternates: { canonical: '/resume' },
  openGraph: {
    images: [{ url: '/og/resume.png', width: 1200, height: 630, alt: 'Resume, a daily guess-the-famous-person-from-their-career-profile game from Mind Loft' }],
    title: 'Resume: Name the Famous Person From Their Career',
    description: 'Colleges, past jobs and fun facts, name and photo hidden. Name the person in the fewest clues. A new resume every day.',
    url: '/resume',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/resume.png'],
    card: 'summary_large_image',
    title: 'Resume: Name the Famous Person From Their Career',
    description: 'Colleges, past jobs and fun facts, name and photo hidden. Name the person in the fewest clues. A new resume every day.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Resume',
  alternateName: 'Resume: The Daily Guess Who From a Career Profile',
  url: `${SITE_URL}/resume`,
  description:
    'A free daily guess-who game: one famous person\u2019s career profile with the name and photo hidden, and six clues that open one at a time, from education and past jobs to fun facts. Fewer clues rank higher, then the clock.',
  genre: ['Trivia', 'Guessing game', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/resume.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('resume'),
    { '@type': 'ListItem', position: 3, name: 'Resume' },
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
        <ResumeClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="resume" stage={isStageServer('resume', searchParams)} />
    </>
  );
}
