import UnparkClient from './UnparkClient';
import { PUZZLES } from '../../parker/puzzles';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDayNumber, kidsDateLabel, pickCycle } from '@/lib/kids-daily';

// Unpark: Parker for kids. The grown-up Parker bank, cycled over the gentle
// boards only (par 14 and under, the Monday-to-Wednesday rung), cars instead
// of blocks, and nothing scored against the kid.

export const metadata = {
  title: 'Unpark | Kids Corner | Mind Loft',
  description: 'A free daily sliding-car puzzle for kids. Slide the other cars out of the way and drive the red car out through the gap. A new lot every day.',
  alternates: { canonical: '/kids/unpark' },
  openGraph: {
    title: 'Unpark | Kids Corner',
    description: 'Slide the cars out of the way and drive the red one out. A new lot every day.',
    url: '/kids/unpark',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export const dynamic = 'force-dynamic';

export default function KidsUnparkPage() {
  const today = etTodayISO();
  const gentle = PUZZLES.filter((p) => p.live <= today && !p.sunday && p.par <= 14);
  const pool = gentle.length ? gentle : PUZZLES.filter((p) => p.live <= today);
  const p = pickCycle(pool, today);
  const board = p ? { num: p.num, pieces: p.pieces, par: p.par } : null;
  return (
    <UnparkClient
      game={KIDS_DAILY_MAP.unpark}
      board={board}
      dayKey={today}
      dayNum={kidsDayNumber(today)}
      dayLabel={kidsDateLabel(today)}
    />
  );
}
