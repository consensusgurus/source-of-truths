import LearningMatch from '../LearningMatch';

export const metadata = {
  title: 'Mama and Baby Match | Kids Corner | Mind Loft',
  description: 'A free matching memory game for kids. Match each animal to the name of its baby: calf, puppy, kitten, joey and more. 24 cards, 12 pairs. Up to four players.',
  alternates: { canonical: '/kids/mama-baby-match' },
  openGraph: {
    title: 'Mama and Baby Match | Kids Corner',
    description: 'Match each animal to the name of its baby: calf, puppy, kitten, joey and more. Find all twelve pairs.',
    url: '/kids/mama-baby-match',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export default function MamaBabyMatchPage() {
  return <LearningMatch id="mama-baby-match" />;
}
