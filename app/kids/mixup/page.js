import MixupClient from './MixupClient';
import { PUZZLES } from './puzzles';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDayNumber, kidsDateLabel, pickCycle } from '@/lib/kids-daily';

// Mix-Up: Garble for kids. Five jumbled words with a picture clue each.

export const metadata = {
  title: 'Mix-Up | Kids Corner | Mind Loft',
  description: 'A free daily word jumble for kids. Five words got their letters mixed up. Look at the picture, tap two letters to swap them, and put each word back together.',
  alternates: { canonical: '/kids/mixup' },
  openGraph: {
    title: 'Mix-Up | Kids Corner',
    description: 'The letters got jumbled. Put five words back together, with a picture to help.',
    url: '/kids/mixup',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export const dynamic = 'force-dynamic';

export default function KidsMixupPage() {
  const today = etTodayISO();
  const p = pickCycle(PUZZLES, today);
  return (
    <MixupClient
      game={KIDS_DAILY_MAP.mixup}
      puzzle={{ num: p.num, words: p.words }}
      dayKey={today}
      dayNum={kidsDayNumber(today)}
      dayLabel={kidsDateLabel(today)}
    />
  );
}
