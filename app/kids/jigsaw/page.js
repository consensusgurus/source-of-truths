import KidsJigsaw from '../KidsJigsaw';
import { kidsJigsawBoards, kidsJigsawDaily } from '../kids-jigsaw-boards';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDateLabel, resolveKidsDay } from '@/lib/kids-daily';

// The kids Puzzle Shelf (owner, 2026-11-13; was the Jigsaw and Tall Jigsaw
// tiles from 2026-11-11). One page, one screen: every Jig and Saw photo so far,
// the day's two first, each cut into 6, 12, 20 or 30 pieces for a kid.
// /kids/tall-jigsaw redirects here.

const DESC = 'A free jigsaw shelf for kids: every real photo from Mind Loft’s daily Jig and Saw on one screen, today’s two first. Pick any picture and cut it into 6, 12, 20 or 30 pieces. No sign-up, no ads, no timer.';

export const metadata = {
  title: 'Puzzle Shelf: Free Jigsaws for Kids | Mind Loft Kids',
  description: DESC,
  alternates: { canonical: '/kids/jigsaw' },
  openGraph: { title: 'Puzzle Shelf | Mind Loft Kids', description: DESC, url: '/kids/jigsaw', type: 'website', siteName: 'Mind Loft', images: ['/kids/opengraph-image'] },
  twitter: { card: 'summary_large_image', title: 'Puzzle Shelf | Mind Loft Kids', description: DESC, images: ['/kids/opengraph-image'] },
};

// The browser chrome takes the kids butter ground; see html:has(.kd).
export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 5, userScalable: true, viewportFit: 'cover', themeColor: '#fff6e0' };

export const dynamic = 'force-dynamic';

export default function KidsJigsawPage({ searchParams }) {
  const today = etTodayISO();
  const day = resolveKidsDay(searchParams, today);
  const boards = kidsJigsawBoards(today);
  const jig = kidsJigsawDaily(boards, 'jig', day.dateIso);
  const saw = kidsJigsawDaily(boards, 'saw', day.dateIso);
  return (
    <KidsJigsaw
      key={day.dateIso}
      game={KIDS_DAILY_MAP['jigsaw']}
      dailyKeys={[jig, saw].filter(Boolean).map((b) => b.key)}
      boards={boards}
      dayKey={day.dateIso}
      dayNum={day.n}
      dayLabel={kidsDateLabel(day.dateIso)}
      isToday={day.isToday}
      todayNum={day.todayNum}
      quizId="kids-jigsaw"
    />
  );
}
