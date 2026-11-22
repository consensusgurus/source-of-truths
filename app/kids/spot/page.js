import KidsSpot from '../KidsSpot';
import { kidsSpotBoards, kidsSpotDaily } from '../kids-spot-boards';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDateLabel, resolveKidsDay } from '@/lib/kids-daily';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

// Spot for kids (owner, 2026-11-12): the same two photos and the same seven
// differences as today's Spot, with nothing counting against you. No clock,
// no misses, and "Show me one" rings a difference whenever a kid is stuck.

const DESC = 'A free daily spot the difference game for kids: two copies of one real photo with seven differences to find. Tap what changed. No timer, no sign-up, no ads, and a helper button when you are stuck.';

export const metadata = kidsMetadata('spot');

// The browser chrome takes the kids butter ground; see html:has(.kd).
export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 5, userScalable: true, viewportFit: 'cover', themeColor: '#fff6e0' };

export const dynamic = 'force-dynamic';

export default function KidsSpotPage({ searchParams }) {
  const today = etTodayISO();
  const day = resolveKidsDay(searchParams, today);
  const board = kidsSpotDaily(kidsSpotBoards(today), day.dateIso);
  return (
    <>
      <KidsSeo id="spot" />
    <KidsSpot
      key={day.dateIso}
      game={KIDS_DAILY_MAP.spot}
      board={board}
      dayKey={day.dateIso}
      dayNum={day.n}
      dayLabel={kidsDateLabel(day.dateIso)}
      todayNum={day.todayNum}
      quizId="kids-spot"
    />
    </>
  );
}
