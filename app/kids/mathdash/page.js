import MathDashClient from './MathDashClient';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDayNumber, kidsDateLabel } from '@/lib/kids-daily';
import { mathDashFor } from '@/lib/kids-mathdash';

// Math Dash: Blitz for kids. Ten sums, three hearts, no clock that scolds.

export const metadata = {
  title: 'Math Dash | Kids Corner | Mind Loft',
  description: 'A free daily math game for kids. Ten sums, three hearts. Adding and taking away up to 20, a little harder each question. How many can you get?',
  alternates: { canonical: '/kids/mathdash' },
  openGraph: {
    title: 'Math Dash | Kids Corner',
    description: 'Ten sums, three hearts. How many can you get?',
    url: '/kids/mathdash',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export const dynamic = 'force-dynamic';

export default function KidsMathDashPage() {
  const today = etTodayISO();
  const dayNum = kidsDayNumber(today);
  const dow = new Date(`${today}T12:00:00Z`).getUTCDay();
  const qs = mathDashFor(dayNum, dow === 0 || dow === 6);
  return (
    <MathDashClient
      game={KIDS_DAILY_MAP.mathdash}
      questions={qs}
      dayKey={today}
      dayNum={dayNum}
      dayLabel={kidsDateLabel(today)}
    />
  );
}
