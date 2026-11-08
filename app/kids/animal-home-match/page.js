import LearningMatch from '../LearningMatch';

export const metadata = {
  title: 'Animal Home Match | Kids Corner | Mind Loft',
  description: 'A free matching memory game for kids. Match each animal to its home: bird and nest, bee and hive, spider and web. 24 cards, 12 pairs. Up to four players.',
  alternates: { canonical: '/kids/animal-home-match' },
  openGraph: {
    title: 'Animal Home Match | Kids Corner',
    description: 'Match each animal to its home: bird and nest, bee and hive, spider and web. Find all twelve pairs.',
    url: '/kids/animal-home-match',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export default function AnimalHomeMatchPage() {
  return <LearningMatch id="animal-home-match" />;
}
