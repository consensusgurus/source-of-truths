import PeersClient from '../PeersClient';

export const metadata = {
  title: 'Puzzle Peers | Mind Loft',
  description: 'Other puzzle makers and sites we like, coming soon. Send us a site to list, or request one.',
  alternates: { canonical: '/community/peers' },
  openGraph: { title: 'Puzzle Peers · Mind Loft', description: 'Other puzzle makers and sites we like, coming soon. Send us a site to list, or request one.', url: '/community/peers', type: 'website', siteName: 'Mind Loft' },
};

export default function Page() {
  return <PeersClient />;
}
