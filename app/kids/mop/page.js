import KidsMopClient from './KidsMopClient';
import { PUZZLES } from './puzzles';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDateLabel, pickCycleAt, resolveKidsDay } from '@/lib/kids-daily';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

// Mop for kids (owner, 2026-11-15): the grown-up Mop's rule on a little
// one-floor house, 4x4 to 5x5. The bank cycles (scripts/gen-kids-mop.mjs).

const DESC = 'A free daily mopping puzzle for kids. Push the mop over every tile of a little house once, never step on a wet tile, and get out the door. Planning a route is real problem solving, and Show me helps whenever you are stuck.';

export const metadata = kidsMetadata('mop');

// The browser chrome takes the kids butter ground; see html:has(.kd).
export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 5, userScalable: true, viewportFit: 'cover', themeColor: '#fff6e0' };

export const dynamic = 'force-dynamic';

export default function KidsMopPage({ searchParams }) {
  const today = etTodayISO();
  const day = resolveKidsDay(searchParams, today);
  const board = pickCycleAt(PUZZLES, day.n);
  return (
    <>
      <KidsSeo id="mop" />
    <KidsMopClient
      key={day.dateIso}
      game={KIDS_DAILY_MAP.mop}
      board={board || null}
      dayKey={day.dateIso}
      dayNum={day.n}
      dayLabel={kidsDateLabel(day.dateIso)}
      todayNum={day.todayNum}
    />
    </>
  );
}
