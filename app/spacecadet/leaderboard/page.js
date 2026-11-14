import PriceCheckBoard from '../../pricecheck/leaderboard/PriceCheckBoard';
import { SPACE_MAX } from '@/lib/space-cadet';

// /spacecadet/leaderboard (2026-11-07): the Space Cadet board, drawn exactly as
// Crossed Up's and the Dojo's are, read through the spacecadet circuit.

export const metadata = {
  title: 'Space Cadet Leaderboard | Mind Loft',
  description: "Today's Space Cadet board, every crowned day, and the all-time champions. Five spatial puzzles on one clock, scored out of 500.",
  alternates: { canonical: '/spacecadet/leaderboard' },
  openGraph: {
    title: 'Space Cadet Leaderboard | Mind Loft',
    description: "Today's Space Cadet board, every crowned day, and the all-time champions.",
    url: '/spacecadet/leaderboard',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export const dynamic = 'force-dynamic';

function etLabel() {
  try { return new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' }); }
  catch (e) { return ''; }
}

export default function SpaceCadetLeaderboardPage() {
  return <PriceCheckBoard dateLabel={etLabel()} circuit="spacecadet" name="Space Cadet" path="/spacecadet"
    emptyLine="Nobody has finished every puzzle today yet. Yours would be the first rank on the board."
    rankedLine="Ranked on speed: each solved puzzle pays up to 100, a point lost every three seconds" max={SPACE_MAX} />;
}
