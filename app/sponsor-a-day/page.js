import ReachForm from '../reach/ReachForm';
import PageViewBeacon from '../PageViewBeacon';

// Reach-out form from the home's left navigation (owner, 2026-11-08).
// Entries land in the admin Feedback tab (see app/reach/ReachForm.jsx).
export const metadata = {
  title: 'Sponsor a Day | Mind Loft',
  description: 'Put your name on a day of free daily puzzles at Mind Loft. Weekdays $100, weekends $60, booked up to three months out.',
  alternates: { canonical: '/sponsor-a-day' },
  openGraph: { title: 'Sponsor a Day · Mind Loft', description: 'Put your name on a day of free daily puzzles at Mind Loft. Weekdays $100, weekends $60, booked up to three months out.', url: '/sponsor-a-day', type: 'website', siteName: 'Mind Loft' },
};

export default function Page() {
  return (
    <>
      <PageViewBeacon id="sponsor-a-day" />
      <ReachForm kind="sponsor" />
    </>
  );
}
