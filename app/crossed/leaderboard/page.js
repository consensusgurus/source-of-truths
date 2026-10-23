import PriceCheckBoard from '../../pricecheck/leaderboard/PriceCheckBoard';

// /crossed/leaderboard (2026-10-20): the Crossed Up board, drawn exactly as
// Judged's, Price Check's and the Dojo's are, read through the crossed circuit.

export const metadata = {
  title: 'Crossed Up Leaderboard | Mind Loft',
  description: "Today's Crossed Up board, every crowned day, and the all-time champions. Five crosswords, scored mostly on speed, out of 100.",
  alternates: { canonical: '/crossed/leaderboard' },
  openGraph: {
    title: 'Crossed Up Leaderboard | Mind Loft',
    description: "Today's Crossed Up board, every crowned day, and the all-time champions.",
    url: '/crossed/leaderboard',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export const dynamic = 'force-dynamic';

function etLabel() {
  try { return new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' }); }
  catch (e) { return ''; }
}

export default function CrossedLeaderboardPage() {
  return <PriceCheckBoard dateLabel={etLabel()} circuit="crossed" name="Crossed Up" path="/crossed"
    emptyLine="Nobody has finished every grid today yet. Yours would be the first rank on the board."
    rankedLine="Ranked on the puzzle scores, a fifth for solving and four fifths for speed" max={100} />;
}
