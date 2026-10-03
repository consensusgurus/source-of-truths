import PriceCheckBoard from '../../pricecheck/leaderboard/PriceCheckBoard';

// /passport/leaderboard (owner, 2026-10-03): Passport's board, drawn exactly
// as Price Check's and the Trivia Gauntlet's are: Today's board with the
// podium, the Archive of crowned days, and All time, read through the
// passport circuit.

export const metadata = {
  title: 'Passport Leaderboard | Mind Loft',
  description: "Today's Passport board, every crowned day, and the all-time champions. One mystery country, five rounds, one score out of 50.",
  alternates: { canonical: '/passport/leaderboard' },
  openGraph: {
    title: 'Passport Leaderboard | Mind Loft',
    description: "Today's Passport board, every crowned day, and the all-time champions.",
    url: '/passport/leaderboard',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export const dynamic = 'force-dynamic';

function etLabel() {
  try { return new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' }); }
  catch (e) { return ''; }
}

export default function PassportLeaderboardPage() {
  return <PriceCheckBoard dateLabel={etLabel()} circuit="passport" name="Passport" path="/passport"
    emptyLine="Nobody has landed today's country yet. Yours would be the first passport on the board."
    rankedLine="Ranked on the five round scores added up" />;
}
