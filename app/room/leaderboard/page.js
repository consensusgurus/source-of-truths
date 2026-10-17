import PriceCheckBoard from '../../pricecheck/leaderboard/PriceCheckBoard';

// /room/leaderboard (2026-10-13): the Read the Room board, drawn exactly as
// Judged's and the Dojo's are, read through the room circuit.

export const metadata = {
  title: 'Read the Room Leaderboard | Mind Loft',
  description: "Tonight's Read the Room board, every settled day, and the all-time champions. Four crowd games, scored on how much of each room you out-read, out of 100.",
  alternates: { canonical: '/room/leaderboard' },
  openGraph: {
    title: 'Read the Room Leaderboard | Mind Loft',
    description: "Tonight's Read the Room board, every settled day, and the all-time champions.",
    url: '/room/leaderboard',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export const dynamic = 'force-dynamic';

function etLabel() {
  try { return new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' }); }
  catch (e) { return ''; }
}

export default function RoomLeaderboardPage() {
  return <PriceCheckBoard dateLabel={etLabel()} circuit="room" name="Read the Room" path="/room"
    emptyLine="Nobody has read every room tonight yet. Yours would be the first read on the board."
    rankedLine="Ranked on how much of each room you out-read, an equal share each, and it moves until midnight" max={100} />;
}
