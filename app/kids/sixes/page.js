import SixesJrClient from './SixesJrClient';
import { PUZZLES } from '../../sixes/puzzles';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDateLabel, pickCycleAt, resolveKidsDay } from '@/lib/kids-daily';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

// Shape Sixes: the grown-up Sixes bank with shapes standing in for digits.
// Kids get the gentle boards only (level 1, naked singles all the way), cycled
// over the boards that are already live, so nothing ahead of today ever ships.

export const metadata = kidsMetadata('sixes');

// The browser chrome (address bar, installed-app cap) takes the kids butter
// ground, not the site navy; see html:has(.kd) in app/globals.css.
export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 5, userScalable: true, viewportFit: 'cover', themeColor: '#fff6e0' };

export const dynamic = 'force-dynamic';

export default function KidsSixesPage({ searchParams }) {
  const today = etTodayISO();
  const day = resolveKidsDay(searchParams, today);
  // The pool is the boards live AS OF THE DAY BEING SHOWN, not as of today.
  // The grown-up bank keeps going live, so a pool cut at today grows and every
  // archive day's pick would slide onto a different board, under a save slot
  // still holding the old board's state. Cut at the day's own date, each
  // puzzle number maps to the same board forever, and once the grown-up bank
  // stops publishing the pool freezes and simply loops (lib/kids-daily.js).
  const gentle = PUZZLES.filter((p) => p.live <= day.dateIso && p.level === 1 && !p.sunday);
  const pool = gentle.length ? gentle : PUZZLES.filter((p) => p.live <= day.dateIso);
  const p = pickCycleAt(pool, day.n);
  const board = p ? { given: p.given, sol: p.sol, num: p.num } : null;
  return (
    <>
      <KidsSeo id="sixes" />
    <SixesJrClient
      key={day.dateIso}
      game={KIDS_DAILY_MAP.sixes}
      board={board}
      dayKey={day.dateIso}
      dayNum={day.n}
      dayLabel={kidsDateLabel(day.dateIso)}
      todayNum={day.todayNum}
    />
    </>
  );
}
