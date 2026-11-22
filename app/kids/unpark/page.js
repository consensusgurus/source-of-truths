import UnparkClient from './UnparkClient';
import { PUZZLES } from '../../parker/puzzles';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDateLabel, pickCycleAt, resolveKidsDay } from '@/lib/kids-daily';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

// Unpark: Parker for kids. The grown-up Parker bank, cycled over the gentle
// boards only (par 14 and under, the Monday-to-Wednesday rung), cars instead
// of blocks, and nothing scored against the kid.

export const metadata = kidsMetadata('unpark');

// The browser chrome (address bar, installed-app cap) takes the kids butter
// ground, not the site navy; see html:has(.kd) in app/globals.css.
export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 5, userScalable: true, viewportFit: 'cover', themeColor: '#fff6e0' };

export const dynamic = 'force-dynamic';

export default function KidsUnparkPage({ searchParams }) {
  const today = etTodayISO();
  const day = resolveKidsDay(searchParams, today);
  // The pool is the boards live AS OF THE DAY BEING SHOWN, not as of today.
  // The grown-up bank keeps going live, so a pool cut at today grows and every
  // archive day's pick would slide onto a different board, under a save slot
  // still holding the old board's state. Cut at the day's own date, each
  // puzzle number maps to the same board forever, and once the grown-up bank
  // stops publishing the pool freezes and simply loops (lib/kids-daily.js).
  const gentle = PUZZLES.filter((p) => p.live <= day.dateIso && !p.sunday && p.par <= 14);
  const pool = gentle.length ? gentle : PUZZLES.filter((p) => p.live <= day.dateIso);
  const p = pickCycleAt(pool, day.n);
  const board = p ? { num: p.num, pieces: p.pieces, par: p.par } : null;
  return (
    <>
      <KidsSeo id="unpark" />
    <UnparkClient
      key={day.dateIso}
      game={KIDS_DAILY_MAP.unpark}
      board={board}
      dayKey={day.dateIso}
      dayNum={day.n}
      dayLabel={kidsDateLabel(day.dateIso)}
      todayNum={day.todayNum}
    />
    </>
  );
}
