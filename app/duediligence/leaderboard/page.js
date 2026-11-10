import PriceCheckBoard from '../../pricecheck/leaderboard/PriceCheckBoard';
import { DD_MAX } from '@/lib/due-diligence';

// /duediligence/leaderboard (2026-11-10): the Due Diligence board, drawn as
// Space Cadet's is, read through the duediligence circuit.

export const metadata = {
  title: 'Due Diligence Leaderboard | Mind Loft',
  description: "Today's Due Diligence board, every crowned day, and the all-time champions. A stock chart, an IPO filing and a resume, scored out of 30.",
  alternates: { canonical: '/duediligence/leaderboard' },
  openGraph: {
    title: 'Due Diligence Leaderboard | Mind Loft',
    description: "Today's Due Diligence board, every crowned day, and the all-time champions.",
    url: '/duediligence/leaderboard',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export const dynamic = 'force-dynamic';

function etLabel() {
  try { return new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' }); }
  catch (e) { return ''; }
}

export default function DueDiligenceLeaderboardPage() {
  return <PriceCheckBoard dateLabel={etLabel()} circuit="duediligence" name="Due Diligence" path="/duediligence"
    emptyLine="Nobody has finished all three today yet. Yours would be the first rank on the board."
    rankedLine="Ranked on clues: each solved puzzle pays 11 minus the clues you opened" max={DD_MAX} />;
}
