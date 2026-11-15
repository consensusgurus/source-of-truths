import KidsMopClient from './KidsMopClient';
import { PUZZLES } from './puzzles';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDateLabel, pickCycleAt, resolveKidsDay } from '@/lib/kids-daily';

// Mop for kids (owner, 2026-11-15): the grown-up Mop's rule on a little
// one-floor house, 4x4 to 5x5. The bank cycles (scripts/gen-kids-mop.mjs).

const DESC = 'A free daily mopping puzzle for kids. Push the mop over every tile of a little house once, never step on a wet tile, and get out the door. Planning a route is real problem solving, and Show me helps whenever you are stuck.';

export const metadata = {
  title: 'Mop | Mind Loft Kids',
  description: DESC,
  alternates: { canonical: '/kids/mop' },
  openGraph: { title: 'Mop | Mind Loft Kids', description: DESC, url: '/kids/mop', type: 'website', siteName: 'Mind Loft', images: ['/kids/opengraph-image'] },
  twitter: { card: 'summary_large_image', title: 'Mop | Mind Loft Kids', description: DESC, images: ['/kids/opengraph-image'] },
};

// The browser chrome takes the kids butter ground; see html:has(.kd).
export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 5, userScalable: true, viewportFit: 'cover', themeColor: '#fff6e0' };

export const dynamic = 'force-dynamic';

export default function KidsMopPage({ searchParams }) {
  const today = etTodayISO();
  const day = resolveKidsDay(searchParams, today);
  const board = pickCycleAt(PUZZLES, day.n);
  return (
    <KidsMopClient
      key={day.dateIso}
      game={KIDS_DAILY_MAP.mop}
      board={board || null}
      dayKey={day.dateIso}
      dayNum={day.n}
      dayLabel={kidsDateLabel(day.dateIso)}
      todayNum={day.todayNum}
    />
  );
}
