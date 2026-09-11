import SixesJrClient from './SixesJrClient';
import { PUZZLES } from '../../sixes/puzzles';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDayNumber, kidsDateLabel, pickCycle } from '@/lib/kids-daily';

// Shape Sixes: the grown-up Sixes bank with shapes standing in for digits.
// Kids get the gentle boards only (level 1, naked singles all the way), cycled
// over the boards that are already live, so nothing ahead of today ever ships.

export const metadata = {
  title: 'Shape Sixes | Kids Corner | Mind Loft',
  description: 'A free daily 6x6 shape sudoku for kids. Every row, column and box gets all six shapes, one of each. Tap a square, tap a shape. Nothing counts against you.',
  alternates: { canonical: '/kids/sixes' },
  openGraph: {
    title: 'Shape Sixes | Kids Corner',
    description: 'A daily 6x6 shape sudoku for kids. Every row, column and box gets all six shapes.',
    url: '/kids/sixes',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export const dynamic = 'force-dynamic';

export default function KidsSixesPage() {
  const today = etTodayISO();
  const gentle = PUZZLES.filter((p) => p.live <= today && p.level === 1 && !p.sunday);
  const pool = gentle.length ? gentle : PUZZLES.filter((p) => p.live <= today);
  const p = pickCycle(pool, today);
  const board = p ? { given: p.given, sol: p.sol, num: p.num } : null;
  return (
    <SixesJrClient
      game={KIDS_DAILY_MAP.sixes}
      board={board}
      dayKey={today}
      dayNum={kidsDayNumber(today)}
      dayLabel={kidsDateLabel(today)}
    />
  );
}
