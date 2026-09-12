import SixesJrClient from './SixesJrClient';
import { PUZZLES } from '../../sixes/puzzles';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDayNumber, kidsDateLabel, pickCycle } from '@/lib/kids-daily';

// Shape Sixes: the grown-up Sixes bank with shapes standing in for digits.
// Kids get the gentle boards only (level 1, naked singles all the way), cycled
// over the boards that are already live, so nothing ahead of today ever ships.

export const metadata = {
  title: 'Shape Sixes | Mind Loft Kids',
  description: 'A daily shape sudoku for kids. Every row, column and box needs all six shapes, one of each, so kids learn to look along a row, down a column and around a box before they place anything. That is real logical reasoning, with shapes instead of numbers.',
  alternates: { canonical: '/kids/sixes' },
  openGraph: {
    title: 'Shape Sixes | Mind Loft Kids',
    description: 'A daily shape sudoku for kids: look along the row, down the column and around the box, then place the shape. Logical reasoning with shapes instead of numbers.',
    url: '/kids/sixes',
    type: 'website',
    siteName: 'Mind Loft',
    images: ['/kids/opengraph-image'],
  },
  twitter: { card: 'summary_large_image', title: 'Shape Sixes | Mind Loft Kids', description: 'A daily shape sudoku for kids: look along the row, down the column and around the box, then place the shape. Logical reasoning with shapes instead of numbers.', images: ['/kids/opengraph-image'] },
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
