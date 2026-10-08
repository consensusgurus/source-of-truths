import PriceCheckBoard from '../../pricecheck/leaderboard/PriceCheckBoard';

// /judged/leaderboard (2026-10-08): the Judged run's board, drawn exactly
// as Price Check's and Passport's are, read through the deduction circuit
// (Judged keeps that id; see lib/law-school.js).

export const metadata = {
  title: 'Judged Leaderboard | Mind Loft',
  description: "Today's Judged board, every crowned day, and the all-time champions. Five logic cases, scored half on accuracy and half on speed, out of 100.",
  alternates: { canonical: '/judged/leaderboard' },
  openGraph: {
    title: 'Judged Leaderboard | Mind Loft',
    description: "Today's Judged board, every crowned day, and the all-time champions.",
    url: '/judged/leaderboard',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export const dynamic = 'force-dynamic';

function etLabel() {
  try { return new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' }); }
  catch (e) { return ''; }
}

export default function JudgedLeaderboardPage() {
  return <PriceCheckBoard dateLabel={etLabel()} circuit="deduction" name="Judged" path="/judged"
    emptyLine="Nobody has argued all five cases today yet. Yours would be the first file on the desk."
    rankedLine="Ranked on the five case scores, half accuracy and half speed" max={100} />;
}
