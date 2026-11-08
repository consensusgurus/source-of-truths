import ReachForm from '../reach/ReachForm';
import PageViewBeacon from '../PageViewBeacon';

// Reach-out form from the home's left navigation (owner, 2026-11-08).
// Entries land in the admin Feedback tab (see app/reach/ReachForm.jsx).
export const metadata = {
  title: 'Submit or List a Puzzle | Mind Loft',
  description: 'Made a daily puzzle or run a puzzle site? Send it to Mind Loft to be featured or listed.',
  alternates: { canonical: '/submit-a-puzzle' },
  openGraph: { title: 'Submit or List a Puzzle · Mind Loft', description: 'Made a daily puzzle or run a puzzle site? Send it to Mind Loft to be featured or listed.', url: '/submit-a-puzzle', type: 'website', siteName: 'Mind Loft' },
};

export default function Page() {
  return (
    <>
      <PageViewBeacon id="submit-a-puzzle" />
      <ReachForm kind="submit" />
    </>
  );
}
