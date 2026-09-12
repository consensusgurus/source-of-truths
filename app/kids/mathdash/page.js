import MathDashClient from './MathDashClient';
import { etTodayISO } from '@/lib/daily-games';
import { KIDS_DAILY_MAP, kidsDayNumber, kidsDateLabel } from '@/lib/kids-daily';
import { mathDashFor } from '@/lib/kids-mathdash';

// Math Dash: Blitz for kids. Ten sums, three hearts, no clock that scolds.

export const metadata = {
  title: 'Math Dash | Mind Loft Kids',
  description: 'A daily arithmetic run for kids. Ten sums, three hearts, starting easy and getting a little bigger. Quick adding and subtracting inside 20, with a star for every right answer and the answer shown on every miss.',
  alternates: { canonical: '/kids/mathdash' },
  openGraph: {
    title: 'Math Dash | Mind Loft Kids',
    description: 'A daily arithmetic run for kids: ten sums, three hearts, adding and subtracting inside 20. A star for every right answer.',
    url: '/kids/mathdash',
    type: 'website',
    siteName: 'Mind Loft',
    images: ['/kids/opengraph-image'],
  },
  twitter: { card: 'summary_large_image', title: 'Math Dash | Mind Loft Kids', description: 'A daily arithmetic run for kids: ten sums, three hearts, adding and subtracting inside 20. A star for every right answer.', images: ['/kids/opengraph-image'] },
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
