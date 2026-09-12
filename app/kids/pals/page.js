import PalsClient from './PalsClient';
import { PUZZLES } from './puzzles';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDayNumber, kidsDateLabel, pickCycle } from '@/lib/kids-daily';

// Pixel Pals: Etch for kids. A 5x5 picture nonogram, clues of one or two
// numbers, and a picture at the end. The answer stays on the server; the
// client checks its own fill against the clues.

export const metadata = {
  title: 'Pixel Pals | Mind Loft Kids',
  description: 'A daily picture puzzle for kids. The numbers say how many squares in each row and column are colored in, and when every line matches, a picture pops out. Counting, planning ahead and checking your work, all in one 5x5 grid.',
  alternates: { canonical: '/kids/pals' },
  openGraph: {
    title: 'Pixel Pals | Mind Loft Kids',
    description: 'A daily picture puzzle for kids: count the numbers, color the squares, and a picture pops out. Counting and planning ahead in one small grid.',
    url: '/kids/pals',
    type: 'website',
    siteName: 'Mind Loft',
    images: ['/kids/opengraph-image'],
  },
  twitter: { card: 'summary_large_image', title: 'Pixel Pals | Mind Loft Kids', description: 'A daily picture puzzle for kids: count the numbers, color the squares, and a picture pops out. Counting and planning ahead in one small grid.', images: ['/kids/opengraph-image'] },
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
