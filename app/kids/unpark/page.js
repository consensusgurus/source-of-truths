import UnparkClient from './UnparkClient';
import { PUZZLES } from '../../parker/puzzles';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDayNumber, kidsDateLabel, pickCycle } from '@/lib/kids-daily';

// Unpark: Parker for kids. The grown-up Parker bank, cycled over the gentle
// boards only (par 14 and under, the Monday-to-Wednesday rung), cars instead
// of blocks, and nothing scored against the kid.

export const metadata = {
  title: 'Unpark | Mind Loft Kids',
  description: 'A daily sliding puzzle for kids. Cars only move along their own lanes, and the red one has to get out. Working out which car to move first, and what that frees up, is planning and spatial thinking in a form kids already love.',
  alternates: { canonical: '/kids/unpark' },
  openGraph: {
    title: 'Unpark | Mind Loft Kids',
    description: 'A daily sliding puzzle for kids: move the other cars so the red one can drive out. Planning ahead and spatial thinking.',
    url: '/kids/unpark',
    type: 'website',
    siteName: 'Mind Loft',
    images: ['/kids/opengraph-image'],
  },
  twitter: { card: 'summary_large_image', title: 'Unpark | Mind Loft Kids', description: 'A daily sliding puzzle for kids: move the other cars so the red one can drive out. Planning ahead and spatial thinking.', images: ['/kids/opengraph-image'] },
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
