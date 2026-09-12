import LadderClient from './LadderClient';
import { PUZZLES } from './puzzles';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDateLabel, pickCycleAt, resolveKidsDay } from '@/lib/kids-daily';

// Ladder: Rung for kids. Three-letter words, one letter changes a step.
// The example ladder stays on the server until the climb is done.

export const metadata = {
  title: 'Ladder | Mind Loft Kids',
  description: 'A daily word ladder for kids. Change one letter at a time to climb from one three-letter word to another, and every step has to be a real word. Phonics, spelling and thinking a step ahead.',
  alternates: { canonical: '/kids/ladder' },
  openGraph: {
    title: 'Ladder | Mind Loft Kids',
    description: 'A daily word ladder for kids: change one letter at a time, every step a real word, and climb from one word to another. Phonics plus planning.',
    url: '/kids/ladder',
    type: 'website',
    siteName: 'Mind Loft',
    images: ['/kids/opengraph-image'],
  },
  twitter: { card: 'summary_large_image', title: 'Ladder | Mind Loft Kids', description: 'A daily word ladder for kids: change one letter at a time, every step a real word, and climb from one word to another. Phonics plus planning.', images: ['/kids/opengraph-image'] },
};

export const dynamic = 'force-dynamic';

export default function KidsLadderPage({ searchParams }) {
  const today = etTodayISO();
  const day = resolveKidsDay(searchParams, today);
  const p = pickCycleAt(PUZZLES, day.n);
  return (
    <LadderClient
      game={KIDS_DAILY_MAP.ladder}
      puzzle={{ num: p.num, start: p.start, end: p.end, best: p.best }}
      dayKey={day.dateIso}
      dayNum={day.n}
      dayLabel={kidsDateLabel(day.dateIso)}
      todayNum={day.todayNum}
    />
  );
}
