import LearningMatch from '../LearningMatch';

export const metadata = {
  title: 'Counting Match | Kids Corner | Mind Loft',
  description: 'A free matching memory game for kids. Count the dots on each card and match it to the right number, from 1 to 12. 24 cards, 12 pairs. Up to four players.',
  alternates: { canonical: '/kids/counting-match' },
  openGraph: {
    title: 'Counting Match | Kids Corner',
    description: 'Count the dots on each card and match it to the right number, from 1 to 12. Find all twelve pairs.',
    url: '/kids/counting-match',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export default function CountingMatchPage() {
  return <LearningMatch id="counting-match" />;
}
