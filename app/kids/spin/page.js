import KidsSpinClient from './KidsSpinClient';
import { PUZZLES as SPIN } from '@/app/spin/puzzles';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDateLabel, resolveKidsDay } from '@/lib/kids-daily';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

// Spin for kids (owner, 2026-11-15: "a kids version of our game where you
// have to rotate puzzle pieces"). The SAME photo grown-up Spin played on the
// day shown, cut into big squares (3x3, or 4x4 on the toggle) instead of 6x6.
// No bank of its own: only Spin rows live by today ever reach the browser, and
// a kids day before Spin existed falls back to Spin's newest live photo.

const DESC = 'A free daily photo puzzle for kids. A picture is cut into big squares and every one is turned. Tap a square to spin it until the whole picture is the right way up. No timer, no sign-up, no ads.';

export const metadata = kidsMetadata('spin');

// The browser chrome takes the kids butter ground; see html:has(.kd).
export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 5, userScalable: true, viewportFit: 'cover', themeColor: '#fff6e0' };

export const dynamic = 'force-dynamic';

export default function KidsSpinPage({ searchParams }) {
  const today = etTodayISO();
  const day = resolveKidsDay(searchParams, today);
  const live = SPIN.filter((p) => p.live <= today);
  const row = live.find((p) => p.live === day.dateIso) || live[live.length - 1] || null;
  const board = row ? { num: row.num, jig: row.jig ?? null, saw: row.saw ?? null } : null;
  return (
    <>
      <KidsSeo id="spin" />
    <KidsSpinClient
      key={day.dateIso}
      game={KIDS_DAILY_MAP.spin}
      board={board}
      dayKey={day.dateIso}
      dayNum={day.n}
      dayLabel={kidsDateLabel(day.dateIso)}
      todayNum={day.todayNum}
    />
    </>
  );
}
