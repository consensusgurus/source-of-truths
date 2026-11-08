import LearningMatch from '../LearningMatch';

export const metadata = {
  title: 'Opposites Match | Kids Corner | Mind Loft',
  description: 'A free matching memory game for kids. Match each word to its opposite: hot and cold, big and small, day and night. 24 cards, 12 pairs. Up to four players.',
  alternates: { canonical: '/kids/opposites-match' },
  openGraph: {
    title: 'Opposites Match | Kids Corner',
    description: 'Match each word to its opposite: hot and cold, big and small, day and night. Find all twelve pairs.',
    url: '/kids/opposites-match',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export default function OppositesMatchPage() {
  return <LearningMatch id="opposites-match" />;
}
