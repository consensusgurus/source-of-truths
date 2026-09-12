import SortitClient from './SortitClient';
import { PUZZLES } from './puzzles';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDateLabel, pickCycleAt, resolveKidsDay } from '@/lib/kids-daily';

// Sort It: Links for kids. Twelve words, three named groups, tap a word and
// tap where it goes.

export const metadata = {
  title: 'Sort It | Mind Loft Kids',
  description: 'A daily sorting puzzle for kids. Twelve words, three named groups, and every word belongs to exactly one. Sorting things by what they have in common is one of the first thinking skills there is.',
  alternates: { canonical: '/kids/sortit' },
  openGraph: {
    title: 'Sort It | Mind Loft Kids',
    description: 'A daily sorting puzzle for kids: twelve words, three groups, find who belongs together. Categorizing by what things have in common.',
    url: '/kids/sortit',
    type: 'website',
    siteName: 'Mind Loft',
    images: ['/kids/opengraph-image'],
  },
  twitter: { card: 'summary_large_image', title: 'Sort It | Mind Loft Kids', description: 'A daily sorting puzzle for kids: twelve words, three groups, find who belongs together. Categorizing by what things have in common.', images: ['/kids/opengraph-image'] },
};

export const dynamic = 'force-dynamic';

export default function KidsSortitPage({ searchParams }) {
  const today = etTodayISO();
  const day = resolveKidsDay(searchParams, today);
  const p = pickCycleAt(PUZZLES, day.n);
  return (
    <SortitClient
      game={KIDS_DAILY_MAP.sortit}
      puzzle={{ num: p.num, groups: p.groups, board: p.board }}
      dayKey={day.dateIso}
      dayNum={day.n}
      dayLabel={kidsDateLabel(day.dateIso)}
      todayNum={day.todayNum}
    />
  );
}
