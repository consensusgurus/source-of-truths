import PriceCheckBoard from '../../pricecheck/leaderboard/PriceCheckBoard';

// /lawyering/leaderboard (2026-10-08): the Lawyering run's board, drawn exactly
// as Price Check's and Passport's are, read through the deduction circuit
// (Lawyering keeps that id; see lib/law-school.js).

export const metadata = {
  title: 'Lawyering Leaderboard | Mind Loft',
  description: "Today's Lawyering board, every crowned day, and the all-time champions. Five logic cases, each scored out of 10, one combined score out of 50.",
  alternates: { canonical: '/lawyering/leaderboard' },
  openGraph: {
    title: 'Lawyering Leaderboard | Mind Loft',
    description: "Today's Lawyering board, every crowned day, and the all-time champions.",
    url: '/lawyering/leaderboard',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export const dynamic = 'force-dynamic';

function etLabel() {
  try { return new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' }); }
  catch (e) { return ''; }
}

export default function LawyeringLeaderboardPage() {
  return <PriceCheckBoard dateLabel={etLabel()} circuit="deduction" name="Lawyering" path="/lawyering"
    emptyLine="Nobody has argued all five cases today yet. Yours would be the first file on the desk."
    rankedLine="Ranked on the five case scores, each out of 10, added up" />;
}
