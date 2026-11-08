import LearningMatch from '../LearningMatch';

export const metadata = {
  title: 'Rhyme Match | Kids Corner | Mind Loft',
  description: 'A free matching memory game for kids. Match the rhyming words: cat and hat, moon and spoon, frog and log. 24 cards, 12 pairs. Up to four players.',
  alternates: { canonical: '/kids/rhyme-match' },
  openGraph: {
    title: 'Rhyme Match | Kids Corner',
    description: 'Match the rhyming words: cat and hat, moon and spoon, frog and log. Find all twelve pairs.',
    url: '/kids/rhyme-match',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export default function RhymeMatchPage() {
  return <LearningMatch id="rhyme-match" />;
}
