import BuildRunClient from './BuildRunClient';
import PageViewBeacon from '../PageViewBeacon';
import { buildableGames, parseRunKeys } from '@/lib/daily-run';

// BUILD YOUR DAY (owner, 2026-11-21), on the Build a Run page of 2026-11-07:
// pick any number of today's dailies, in order, for Mind Loft Daily (/my-day).
// The day lives in this browser (lib/daily-run.js), so this page stores
// nothing on the server. ?g=a,b prefills it. The URL stays /build-a-run so
// every old link and the page's search standing carry over.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Build Your Day: Your Own Daily Puzzle Lineup | Mind Loft',
  description: 'Pick the free daily puzzles you love, as many as you like, and Mind Loft Daily hands them to you every day, played straight through.',
  alternates: { canonical: '/build-a-run' },
  openGraph: { title: 'Build Your Day · Mind Loft', description: 'Pick your daily puzzles once. Get them every day.', url: '/build-a-run', type: 'website', siteName: 'Mind Loft', images: [{ url: '/run/card', width: 1200, height: 630, alt: 'Build your day of daily puzzles on Mind Loft' }] },
  twitter: { card: 'summary_large_image', title: 'Build Your Day · Mind Loft', description: 'Pick your daily puzzles once. Get them every day.', images: ['/run/card'] },
};

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function BuildRunPage({ searchParams }) {
  const today = etTodayServer();
  const games = buildableGames(today).map((g) => ({ key: g.key, name: g.name, cat: g.cat, tag: g.tag || '' }));
  const have = new Set(games.map((g) => g.key));
  const start = parseRunKeys(searchParams && searchParams.g).filter((k) => have.has(k));
  return (
    <>
      <PageViewBeacon id="build-a-run" />
      <BuildRunClient games={games} start={start} />
    </>
  );
}
