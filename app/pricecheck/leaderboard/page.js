import PriceCheckBoard from './PriceCheckBoard';

// /pricecheck/leaderboard (owner, 2026-10-02): the Price Check run's board,
// drawn the way the Trivia Gauntlet run draws its Rankings panel: Today's
// board with the podium, the Archive of crowned days, and All time. The data
// is the same two reads the Gauntlet uses, /api/quiz/daily-combined and
// /api/quiz/daily-history, narrowed to the pricecheck circuit.

export const metadata = {
  title: 'Price Check Leaderboard | Mind Loft',
  description: "Today's Price Check board, every crowned day, and the all-time champions. Five real price tags, five guesses each, one combined score out of 50.",
  alternates: { canonical: '/pricecheck/leaderboard' },
  openGraph: {
    title: 'Price Check Leaderboard | Mind Loft',
    description: "Today's Price Check board, every crowned day, and the all-time champions.",
    url: '/pricecheck/leaderboard',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export const dynamic = 'force-dynamic';

function etLabel() {
  try { return new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' }); }
  catch (e) { return ''; }
}

export default function PriceCheckLeaderboardPage() {
  return <PriceCheckBoard dateLabel={etLabel()} />;
}
