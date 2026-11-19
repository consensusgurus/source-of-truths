import TalkGameClient from '../../TalkGameClient';
import { DAILY_GAME_MAP } from '@/lib/daily-games';

// A discussion is only readable by a player with a result on the puzzle, so the
// page itself carries nothing a crawler could use: keep it out of the index.
export function generateMetadata({ params }) {
  const g = DAILY_GAME_MAP[String(params.game || '').toLowerCase()];
  const name = g ? g.name : 'Puzzle';
  return {
    title: `${name} Post-Game Talk | Mind Loft`,
    description: `Talk about today's ${name} with the players who finished it.`,
    robots: { index: false, follow: true },
  };
}

export default function Page({ params, searchParams }) {
  const key = String(params.game || '').toLowerCase();
  const date = typeof searchParams?.date === 'string' && /^\d{1,2}-\d{1,2}-\d{2}$/.test(searchParams.date) ? searchParams.date : null;
  return <TalkGameClient key={`${key}|${date || ''}`} gameKey={key} day={date} />;
}
