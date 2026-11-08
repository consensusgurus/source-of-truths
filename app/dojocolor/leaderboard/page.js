import PriceCheckBoard from '../../pricecheck/leaderboard/PriceCheckBoard';

// /dojocolor/leaderboard (2026-11-08): the Enter the Dojo: In Color board,
// drawn exactly as the Dojo's, read through the dojocolor circuit.

export const metadata = {
  title: 'Enter the Dojo: In Color Leaderboard | Mind Loft',
  description: "Today's Enter the Dojo: In Color board, every crowned day, and the all-time champions. Three color sudokus, scored half on solving and half on speed, out of 100.",
  alternates: { canonical: '/dojocolor/leaderboard' },
  openGraph: {
    title: 'Enter the Dojo: In Color Leaderboard | Mind Loft',
    description: "Today's Enter the Dojo: In Color board, every crowned day, and the all-time champions.",
    url: '/dojocolor/leaderboard',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export const dynamic = 'force-dynamic';

function etLabel() {
  try { return new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' }); }
  catch (e) { return ''; }
}

export default function DojoColorLeaderboardPage() {
  return <PriceCheckBoard dateLabel={etLabel()} circuit="dojocolor" name="Enter the Dojo: In Color" path="/dojocolor"
    emptyLine="Nobody has stepped onto the mat today yet. Yours would be the first belt tied."
    rankedLine="Ranked on the three grid scores, half solving and half speed" max={100} />;
}
