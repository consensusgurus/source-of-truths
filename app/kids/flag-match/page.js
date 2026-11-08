import LearningMatch from '../LearningMatch';

export const metadata = {
  title: 'Flag Match | Kids Corner | Mind Loft',
  description: 'A free matching memory game for kids. Match each flag to its country: Japan, France, Brazil, Canada and more. 24 cards, 12 pairs. Up to four players.',
  alternates: { canonical: '/kids/flag-match' },
  openGraph: {
    title: 'Flag Match | Kids Corner',
    description: 'Match each flag to its country: Japan, France, Brazil, Canada and more. Find all twelve pairs.',
    url: '/kids/flag-match',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export default function FlagMatchPage() {
  return <LearningMatch id="flag-match" />;
}
