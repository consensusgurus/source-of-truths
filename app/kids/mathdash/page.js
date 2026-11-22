import MathDashClient from './MathDashClient';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDateLabel, resolveKidsDay } from '@/lib/kids-daily';
import { mathDashFor } from '@/lib/kids-mathdash';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

// Math Dash: Blitz for kids. Ten sums, three hearts, no clock that scolds.

export const metadata = kidsMetadata('mathdash');

// The browser chrome (address bar, installed-app cap) takes the kids butter
// ground, not the site navy; see html:has(.kd) in app/globals.css.
export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 5, userScalable: true, viewportFit: 'cover', themeColor: '#fff6e0' };

export const dynamic = 'force-dynamic';

export default function KidsMathDashPage({ searchParams }) {
  const today = etTodayISO();
  const day = resolveKidsDay(searchParams, today);
  const dayNum = day.n;
  const dow = new Date(`${day.dateIso}T12:00:00Z`).getUTCDay();
  const qs = mathDashFor(dayNum, dow === 0 || dow === 6);
  return (
    <>
      <KidsSeo id="mathdash" />
    <MathDashClient
      key={day.dateIso}
      game={KIDS_DAILY_MAP.mathdash}
      questions={qs}
      dayKey={day.dateIso}
      dayNum={dayNum}
      dayLabel={kidsDateLabel(day.dateIso)}
      todayNum={day.todayNum}
    />
    </>
  );
}
