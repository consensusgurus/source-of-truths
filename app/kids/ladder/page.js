import LadderClient from './LadderClient';
import { PUZZLES } from './puzzles';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDateLabel, pickCycleAt, resolveKidsDay } from '@/lib/kids-daily';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

// Ladder: Rung for kids. Three-letter words, one letter changes a step.
// The example ladder stays on the server until the climb is done.

export const metadata = kidsMetadata('ladder');

// The browser chrome (address bar, installed-app cap) takes the kids butter
// ground, not the site navy; see html:has(.kd) in app/globals.css.
export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 5, userScalable: true, viewportFit: 'cover', themeColor: '#fff6e0' };

export const dynamic = 'force-dynamic';

export default function KidsLadderPage({ searchParams }) {
  const today = etTodayISO();
  const day = resolveKidsDay(searchParams, today);
  const p = pickCycleAt(PUZZLES, day.n);
  return (
    <>
      <KidsSeo id="ladder" />
    <LadderClient
      key={day.dateIso}
      game={KIDS_DAILY_MAP.ladder}
      puzzle={{ num: p.num, start: p.start, end: p.end, best: p.best }}
      dayKey={day.dateIso}
      dayNum={day.n}
      dayLabel={kidsDateLabel(day.dateIso)}
      todayNum={day.todayNum}
    />
    </>
  );
}
