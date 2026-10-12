import PriceCheckBoard from '../../pricecheck/leaderboard/PriceCheckBoard';

// /dojo/leaderboard (2026-10-12): the Enter the Dojo board, drawn exactly as
// Judged's, Price Check's and Passport's are, read through the dojo circuit.

export const metadata = {
  title: 'Enter the Dojo Leaderboard | Mind Loft',
  description: "Today's Enter the Dojo board, every crowned day, and the all-time champions. Three sudokus, scored half on solving and half on speed, out of 100.",
  alternates: { canonical: '/dojo/leaderboard' },
  openGraph: {
    title: 'Enter the Dojo Leaderboard | Mind Loft',
    description: "Today's Enter the Dojo board, every crowned day, and the all-time champions.",
    url: '/dojo/leaderboard',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export const dynamic = 'force-dynamic';

function etLabel() {
  try { return new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' }); }
  catch (e) { return ''; }
}

export default function DojoLeaderboardPage() {
  return <PriceCheckBoard dateLabel={etLabel()} circuit="dojo" name="Enter the Dojo" path="/dojo"
    emptyLine="Nobody has stepped onto the mat today yet. Yours would be the first belt tied."
    rankedLine="Ranked on the three grid scores, half solving and half speed" max={100} />;
}
