import LadderClient from './LadderClient';
import { PUZZLES } from './puzzles';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDayNumber, kidsDateLabel, pickCycle } from '@/lib/kids-daily';

// Ladder: Rung for kids. Three-letter words, one letter changes a step.
// The example ladder stays on the server until the climb is done.

export const metadata = {
  title: 'Ladder | Kids Corner | Mind Loft',
  description: 'A free daily word ladder for kids. Change one letter at a time to climb from one three-letter word to another. Any real word is a step.',
  alternates: { canonical: '/kids/ladder' },
  openGraph: {
    title: 'Ladder | Kids Corner',
    description: 'Change one letter at a time to climb from CAT to DOG. A new ladder every day.',
    url: '/kids/ladder',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export const dynamic = 'force-dynamic';

export default function KidsLadderPage() {
  const today = etTodayISO();
  const p = pickCycle(PUZZLES, today);
  return (
    <LadderClient
      game={KIDS_DAILY_MAP.ladder}
      puzzle={{ num: p.num, start: p.start, end: p.end, best: p.best }}
      dayKey={today}
      dayNum={kidsDayNumber(today)}
      dayLabel={kidsDateLabel(today)}
    />
  );
}
