import MixupClient from './MixupClient';
import { PUZZLES } from './puzzles';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDateLabel, pickCycleAt, resolveKidsDay } from '@/lib/kids-daily';

// Mix-Up: Garble for kids. Five jumbled words with a picture clue each.

export const metadata = {
  title: 'Mix-Up | Mind Loft Kids',
  description: 'A daily word scramble for kids. Five words got their letters jumbled, each with a picture hint. Swapping letters until a word reads right builds spelling, sound-it-out skills and patience.',
  alternates: { canonical: '/kids/mixup' },
  openGraph: {
    title: 'Mix-Up | Mind Loft Kids',
    description: 'A daily word scramble for kids: five jumbled words with picture hints. Swap letters until each one reads right. Spelling and sounding it out.',
    url: '/kids/mixup',
    type: 'website',
    siteName: 'Mind Loft',
    images: ['/kids/opengraph-image'],
  },
  twitter: { card: 'summary_large_image', title: 'Mix-Up | Mind Loft Kids', description: 'A daily word scramble for kids: five jumbled words with picture hints. Swap letters until each one reads right. Spelling and sounding it out.', images: ['/kids/opengraph-image'] },
};

export const dynamic = 'force-dynamic';

export default function KidsMixupPage({ searchParams }) {
  const today = etTodayISO();
  const day = resolveKidsDay(searchParams, today);
  const p = pickCycleAt(PUZZLES, day.n);
  return (
    <MixupClient
      game={KIDS_DAILY_MAP.mixup}
      puzzle={{ num: p.num, words: p.words }}
      dayKey={day.dateIso}
      dayNum={day.n}
      dayLabel={kidsDateLabel(day.dateIso)}
      todayNum={day.todayNum}
    />
  );
}
