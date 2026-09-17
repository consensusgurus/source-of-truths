import GroupsHomeClient from './GroupsHomeClient';

export const metadata = {
  title: 'Groups | Mind Loft',
  description: 'Make a group for the people you play with. Share one link, and everyone gets a private daily leaderboard, per-game rankings, stats and history.',
  alternates: { canonical: '/groups' },
  openGraph: {
    title: 'Mind Loft · Groups',
    description: 'A private daily leaderboard for the people you play with.',
    url: '/groups',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export default function GroupsPage() {
  return <GroupsHomeClient />;
}
