import BuildRunClient from './BuildRunClient';
import PageViewBeacon from '../PageViewBeacon';
import { buildableGames, parseRunKeys, cleanRunName } from '@/lib/daily-run';

// BUILD A RUN (owner, 2026-11-07): pick 2 to 8 of today's dailies, put them in
// order, name the run and share the link. The run lives entirely in the link
// (see lib/daily-run.js), so this page stores nothing on the server.
// ?g=a,b&n=Name prefills it, which is how a maker edits a run.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Build a Run: Make Your Own Daily Puzzle Challenge | Mind Loft',
  description: 'Pick two to eight free daily puzzles, put them in order and share the run. Friends play the same games and see how they stack up against you.',
  alternates: { canonical: '/build-a-run' },
  openGraph: { title: 'Build a Run · Mind Loft', description: 'Pick your daily puzzles, name the run, send the link.', url: '/build-a-run', type: 'website', siteName: 'Mind Loft', images: [{ url: '/run/card', width: 1200, height: 630, alt: 'Build a run of daily puzzles on Mind Loft' }] },
  twitter: { card: 'summary_large_image', title: 'Build a Run · Mind Loft', description: 'Pick your daily puzzles, name the run, send the link.', images: ['/run/card'] },
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
  const startName = cleanRunName(searchParams && searchParams.n);
  return (
    <>
      <PageViewBeacon id="build-a-run" />
      <BuildRunClient games={games} start={start} startName={startName} />
    </>
  );
}
