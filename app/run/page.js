import RunPageClient from './RunPageClient';
import PageViewBeacon from '../PageViewBeacon';
import { parseRunKeys, cleanRunName, cleanMaker } from '@/lib/daily-run';
import { DAILY_GAME_MAP } from '@/lib/daily-games';

// A BUILT RUN (owner, 2026-11-07): mindloftdaily.com/run?g=deep,strata&n=Morning+Coffee&by=Gator85.
// The whole run is the URL, so this page is the invite for someone handed the
// link, the progress page while they play, and the head-to-head finish once
// every game is played. Nothing about a run is stored on the server: each game
// posts its own ordinary result, and the board below is today's rows for these
// games ranked the way every run is (/api/quiz/daily-combined?keys=...&full=1).
export const dynamic = 'force-dynamic';

function readParams(sp) {
  const keys = parseRunKeys(sp && sp.g);
  const name = cleanRunName(sp && sp.n) || 'A Mind Loft Run';
  const by = cleanMaker(sp && sp.by);
  return { keys, name, by };
}

export async function generateMetadata({ searchParams }) {
  const { keys, name, by } = readParams(searchParams || {});
  const games = keys.map((k) => DAILY_GAME_MAP[k].name).join(', ');
  const title = `${name}${by ? `, a run by ${by}` : ''} | Mind Loft`;
  const description = keys.length >= 2
    ? `${keys.length} free daily puzzles back to back: ${games}. Play the run and see how you stack up.`
    : 'Build a run of daily puzzles on Mind Loft and share it with friends.';
  const q = new URLSearchParams({ g: keys.join(','), n: name, ...(by ? { by } : {}) }).toString();
  const img = `/run/card?${q}`;
  return {
    title, description,
    // One person's run and today's results: never a search landing page.
    robots: { index: false, follow: true },
    openGraph: { title: `${name} · Mind Loft`, description, type: 'website', siteName: 'Mind Loft', images: [{ url: img, width: 1200, height: 630, alt: `${name}, a run of daily puzzles on Mind Loft` }] },
    twitter: { card: 'summary_large_image', title: `${name} · Mind Loft`, description, images: [img] },
  };
}

export default function RunPage({ searchParams }) {
  const { keys, name, by } = readParams(searchParams || {});
  const fresh = !!(searchParams && searchParams.new === '1');
  return (
    <>
      <PageViewBeacon id="built-run" />
      <RunPageClient keys={keys} name={name} by={by} fresh={fresh} />
    </>
  );
}
