import MixupClient from './MixupClient';
import { PUZZLES } from './puzzles';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDateLabel, pickCycleAt, resolveKidsDay } from '@/lib/kids-daily';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

// Mix-Up: Garble for kids. Five jumbled words with a picture clue each.

export const metadata = kidsMetadata('mixup');

// The browser chrome (address bar, installed-app cap) takes the kids butter
// ground, not the site navy; see html:has(.kd) in app/globals.css.
export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 5, userScalable: true, viewportFit: 'cover', themeColor: '#fff6e0' };

export const dynamic = 'force-dynamic';

export default function KidsMixupPage({ searchParams }) {
  const today = etTodayISO();
  const day = resolveKidsDay(searchParams, today);
  const p = pickCycleAt(PUZZLES, day.n);
  return (
    <>
      <KidsSeo id="mixup" />
    <MixupClient
      key={day.dateIso}
      game={KIDS_DAILY_MAP.mixup}
      puzzle={{ num: p.num, words: p.words }}
      dayKey={day.dateIso}
      dayNum={day.n}
      dayLabel={kidsDateLabel(day.dateIso)}
      todayNum={day.todayNum}
    />
    </>
  );
}
