import PriceCheckBoard from '../../pricecheck/leaderboard/PriceCheckBoard';
import { ODD_MAX } from '@/lib/odd-jobs';

// /oddjobs/leaderboard (2026-11-21): the Odd Jobs board, drawn as Due
// Diligence's is, read through the oddjobs circuit.

export const metadata = {
  title: 'Odd Jobs Leaderboard | Mind Loft',
  description: "Today's Odd Jobs board, every crowned day, and the all-time champions. Mop, Mow and Plow, ranked on fewest replays, then the clock.",
  alternates: { canonical: '/oddjobs/leaderboard' },
  openGraph: {
    title: 'Odd Jobs Leaderboard | Mind Loft',
    description: "Today's Odd Jobs board, every crowned day, and the all-time champions.",
    url: '/oddjobs/leaderboard',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export const dynamic = 'force-dynamic';

function etLabel() {
  try { return new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' }); }
  catch (e) { return ''; }
}

export default function OddJobsLeaderboardPage() {
  return <PriceCheckBoard dateLabel={etLabel()} circuit="oddjobs" name="Odd Jobs" path="/oddjobs"
    emptyLine="Nobody has finished all three today yet. Yours would be the first rank on the board."
    rankedLine="Ranked on replays, then time: each finished job pays 100, less 20 a replay and up to 6 for the clock" max={ODD_MAX} />;
}
