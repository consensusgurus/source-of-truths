import GroupsTabClient from '../GroupsTabClient';

export const metadata = {
  title: 'Groups | Mind Loft',
  description: 'Mind Loft groups: a private daily leaderboard for your family, friends or office.',
  alternates: { canonical: '/community/groups' },
  openGraph: { title: 'Groups · Mind Loft', description: 'Mind Loft groups: a private daily leaderboard for your family, friends or office.', url: '/community/groups', type: 'website', siteName: 'Mind Loft' },
};

export default function Page() {
  return <GroupsTabClient />;
}
