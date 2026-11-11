import KidsJigsaw from '../KidsJigsaw';
import { kidsJigsawBoards, kidsJigsawDaily } from '../kids-jigsaw-boards';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDateLabel, resolveKidsDay } from '@/lib/kids-daily';

// Tall Jigsaw: today's Saw photo for kids, cut into 6, 12, 20 or 30 pieces
// (owner, 2026-11-11). Same picture as the grown-up daily, a kid-sized cut.
// "All pictures" opens the kids Jigsaw Puzzle Shelf (every Jig and Saw photo).

const DESC = 'A free daily tall jigsaw for kids: the same portrait photo as today\u2019s Saw, cut into 6, 12, 20 or 30 pieces. Drag each piece home, then pick any past picture from the Jigsaw Puzzle Shelf. No sign-up, no ads, no timer.';

export const metadata = {
  title: 'Tall Jigsaw | Mind Loft Kids',
  description: DESC,
  alternates: { canonical: '/kids/tall-jigsaw' },
  openGraph: { title: 'Tall Jigsaw | Mind Loft Kids', description: DESC, url: '/kids/tall-jigsaw', type: 'website', siteName: 'Mind Loft', images: ['/kids/opengraph-image'] },
  twitter: { card: 'summary_large_image', title: 'Tall Jigsaw | Mind Loft Kids', description: DESC, images: ['/kids/opengraph-image'] },
};

// The browser chrome takes the kids butter ground; see html:has(.kd).
export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 5, userScalable: true, viewportFit: 'cover', themeColor: '#fff6e0' };

export const dynamic = 'force-dynamic';

export default function KidsTallJigsawPage({ searchParams }) {
  const today = etTodayISO();
  const day = resolveKidsDay(searchParams, today);
  const boards = kidsJigsawBoards(today);
  const daily = kidsJigsawDaily(boards, 'saw', day.dateIso);
  return (
    <KidsJigsaw
      key={day.dateIso}
      game={KIDS_DAILY_MAP['tall-jigsaw']}
      dailyKey={daily ? daily.key : 'shelf'}
      boards={boards}
      dayKey={day.dateIso}
      dayNum={day.n}
      dayLabel={kidsDateLabel(day.dateIso)}
      isToday={day.isToday}
      todayNum={day.todayNum}
      quizId="kids-tall-jigsaw"
      startShape="tall"
    />
  );
}
