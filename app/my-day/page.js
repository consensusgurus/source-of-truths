import DayClient from './DayClient';
import PageViewBeacon from '../PageViewBeacon';

// MIND LOFT DAILY (owner, 2026-11-21): the player's own puzzles, picked once
// on Build Your Day (/build-a-run), handed over every day as one paper. The
// day lives in this browser (lib/daily-run.js), so the page is all client.
export const metadata = {
  title: 'Mind Loft Daily: Your Own Daily Puzzle Paper | Mind Loft',
  description: 'Pick the free daily puzzles you love once, and Mind Loft Daily hands them to you every day as one paper: front page, every puzzle in order, then the back page.',
  alternates: { canonical: '/my-day' },
  openGraph: { title: 'Mind Loft Daily', description: 'Your puzzles. One paper. Every day.', url: '/my-day', type: 'website', siteName: 'Mind Loft', images: [{ url: '/run/card', width: 1200, height: 630, alt: 'Mind Loft Daily' }] },
  twitter: { card: 'summary_large_image', title: 'Mind Loft Daily', description: 'Your puzzles. One paper. Every day.', images: ['/run/card'] },
};

export default function MyDayPage() {
  return (
    <>
      <PageViewBeacon id="my-day" />
      <DayClient />
    </>
  );
}
