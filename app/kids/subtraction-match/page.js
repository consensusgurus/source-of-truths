import LearningMatch from '../LearningMatch';

export const metadata = {
  title: 'Subtraction Match | Kids Corner | Mind Loft',
  description: 'A free matching memory game for kids. Match each subtraction problem to its answer, from 0 to 13. 28 cards, 14 pairs. Up to four players.',
  alternates: { canonical: '/kids/subtraction-match' },
  openGraph: {
    title: 'Subtraction Match | Kids Corner',
    description: 'Match each subtraction problem to its answer, from 0 to 13. Find all fourteen pairs.',
    url: '/kids/subtraction-match',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export default function SubtractionMatchPage() {
  return <LearningMatch id="subtraction-match" />;
}
