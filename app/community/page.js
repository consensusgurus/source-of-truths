import CommonsClient from './CommonsClient';

export const metadata = {
  title: 'Community | Mind Loft',
  description: 'The Mind Loft community: talk about today\u2019s puzzles once you finish them, pitch ideas for new ones, and play in clubs.',
  alternates: { canonical: '/community' },
  openGraph: { title: 'Community · Mind Loft', description: 'The Mind Loft community: talk about today\u2019s puzzles once you finish them, pitch ideas for new ones, and play in clubs.', url: '/community', type: 'website', siteName: 'Mind Loft' },
};

export default function Page() {
  return <CommonsClient />;
}
