import LearningMatch from '../LearningMatch';

export const metadata = {
  title: 'Animal Sound Match | Kids Corner | Mind Loft',
  description: 'A free matching memory game for kids. Match each animal to the sound it makes: moo, woof, quack, roar and more. 24 cards, 12 pairs. Up to four players.',
  alternates: { canonical: '/kids/animal-sound-match' },
  openGraph: {
    title: 'Animal Sound Match | Kids Corner',
    description: 'Match each animal to the sound it makes: moo, woof, quack, roar and more. Find all twelve pairs.',
    url: '/kids/animal-sound-match',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export default function AnimalSoundMatchPage() {
  return <LearningMatch id="animal-sound-match" />;
}
