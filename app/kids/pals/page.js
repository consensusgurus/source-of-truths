import PalsClient from './PalsClient';
import { PUZZLES } from './puzzles';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDayNumber, kidsDateLabel, pickCycle } from '@/lib/kids-daily';

// Pixel Pals: Etch for kids. A 5x5 picture nonogram, clues of one or two
// numbers, and a picture at the end. The answer stays on the server; the
// client checks its own fill against the clues.

export const metadata = {
  title: 'Pixel Pals | Kids Corner | Mind Loft',
  description: 'A free daily picture puzzle for kids. Color the squares the numbers tell you and a picture appears. Five by five, a new picture every day.',
  alternates: { canonical: '/kids/pals' },
  openGraph: {
    title: 'Pixel Pals | Kids Corner',
    description: 'Color the squares the numbers say. A picture pops out. A new one every day.',
    url: '/kids/pals',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export const dynamic = 'force-dynamic';

export default function KidsPalsPage() {
  const today = etTodayISO();
  const p = pickCycle(PUZZLES, today);
  return (
    <PalsClient
      game={KIDS_DAILY_MAP.pals}
      puzzle={{ num: p.num, name: p.name, rows: p.rows, cols: p.cols }}
      dayKey={today}
      dayNum={kidsDayNumber(today)}
      dayLabel={kidsDateLabel(today)}
    />
  );
}
