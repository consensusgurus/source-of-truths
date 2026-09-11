import SortitClient from './SortitClient';
import { PUZZLES } from './puzzles';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDayNumber, kidsDateLabel, pickCycle } from '@/lib/kids-daily';

// Sort It: Links for kids. Twelve words, three named groups, tap a word and
// tap where it goes.

export const metadata = {
  title: 'Sort It | Kids Corner | Mind Loft',
  description: 'A free daily sorting game for kids. Twelve words, three groups. Tap a word, then tap the group it belongs to. No wrong-answer limit, just sort them all.',
  alternates: { canonical: '/kids/sortit' },
  openGraph: {
    title: 'Sort It | Kids Corner',
    description: 'Twelve words, three groups. Find who belongs together.',
    url: '/kids/sortit',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export const dynamic = 'force-dynamic';

export default function KidsSortitPage() {
  const today = etTodayISO();
  const p = pickCycle(PUZZLES, today);
  return (
    <SortitClient
      game={KIDS_DAILY_MAP.sortit}
      puzzle={{ num: p.num, groups: p.groups, board: p.board }}
      dayKey={today}
      dayNum={kidsDayNumber(today)}
      dayLabel={kidsDateLabel(today)}
    />
  );
}
