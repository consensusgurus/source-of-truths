import FriendsClient from '../FriendsClient';

export const metadata = {
  title: 'Puzzle Friends | Mind Loft',
  description: 'Other puzzle makers and sites we like, coming soon. Send us a site to list, or request one.',
  alternates: { canonical: '/community/friends' },
  openGraph: { title: 'Puzzle Friends · Mind Loft', description: 'Other puzzle makers and sites we like, coming soon. Send us a site to list, or request one.', url: '/community/friends', type: 'website', siteName: 'Mind Loft' },
};

export default function Page() {
  return <FriendsClient />;
}
