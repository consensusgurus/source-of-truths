import ClubsClient from '../ClubsClient';

export const metadata = {
  title: 'Clubs | Mind Loft',
  description: 'Mind Loft clubs: a private daily leaderboard for your family, friends or office.',
  alternates: { canonical: '/community/clubs' },
  openGraph: { title: 'Clubs · Mind Loft', description: 'Mind Loft clubs: a private daily leaderboard for your family, friends or office.', url: '/community/clubs', type: 'website', siteName: 'Mind Loft' },
};

export default function Page() {
  return <ClubsClient />;
}
