import PriceCheckBoard from '../../pricecheck/leaderboard/PriceCheckBoard';
import { EE_MAX } from '@/lib/eagle-eye';

// /eagleeye/leaderboard (2026-11-13): the Eagle Eye board, drawn exactly as
// Space Cadet's and the Dojo's are, read through the eagleeye circuit.

export const metadata = {
  title: 'Eagle Eye Leaderboard | Mind Loft',
  description: "Today's Eagle Eye board, every crowned day, and the all-time champions. Five visual puzzles in one run, scored out of 500.",
  alternates: { canonical: '/eagleeye/leaderboard' },
  openGraph: {
    title: 'Eagle Eye Leaderboard | Mind Loft',
    description: "Today's Eagle Eye board, every crowned day, and the all-time champions.",
    url: '/eagleeye/leaderboard',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export const dynamic = 'force-dynamic';

function etLabel() {
  try { return new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' }); }
  catch (e) { return ''; }
}

export default function EagleEyeLeaderboardPage() {
  return <PriceCheckBoard dateLabel={etLabel()} circuit="eagleeye" name="Eagle Eye" path="/eagleeye"
    emptyLine="Nobody has finished all five puzzles today yet. Yours would be the first rank on the board."
    rankedLine="Ranked on accuracy and speed: each puzzle pays up to 100" max={EE_MAX} />;
}
