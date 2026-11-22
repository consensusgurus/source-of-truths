import FitItClient from './FitItClient';
import { PUZZLES } from './puzzles';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDateLabel, pickCycleAt, resolveKidsDay } from '@/lib/kids-daily';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

// Fit It: Snug for kids. A 5x5 board with a few squares missing and four or
// five pieces, each already turned the right way, that fill it exactly one way.

export const metadata = kidsMetadata('fitit');

// The browser chrome (address bar, installed-app cap) takes the kids butter
// ground, not the site navy; see html:has(.kd) in app/globals.css.
export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 5, userScalable: true, viewportFit: 'cover', themeColor: '#fff6e0' };

export const dynamic = 'force-dynamic';

export default function KidsFitItPage({ searchParams }) {
  const today = etTodayISO();
  const day = resolveKidsDay(searchParams, today);
  const p = pickCycleAt(PUZZLES, day.n);
  const board = p ? { num: p.num, mask: p.mask, pieces: p.pieces, sol: p.sol } : null;
  return (
    <>
      <KidsSeo id="fitit" />
    <FitItClient
      key={day.dateIso}
      game={KIDS_DAILY_MAP.fitit}
      board={board}
      dayKey={day.dateIso}
      dayNum={day.n}
      dayLabel={kidsDateLabel(day.dateIso)}
      todayNum={day.todayNum}
    />
    </>
  );
}
