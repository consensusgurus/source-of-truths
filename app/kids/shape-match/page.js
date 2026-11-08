import LearningMatch from '../LearningMatch';

export const metadata = {
  title: 'Shape Match | Kids Corner | Mind Loft',
  description: 'A free matching memory game for kids. Match each shape to its name: circle, square, triangle, star, hexagon and more. 24 cards, 12 pairs. Up to four players.',
  alternates: { canonical: '/kids/shape-match' },
  openGraph: {
    title: 'Shape Match | Kids Corner',
    description: 'Match each shape to its name: circle, square, triangle, star, hexagon and more. Find all twelve pairs.',
    url: '/kids/shape-match',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export default function ShapeMatchPage() {
  return <LearningMatch id="shape-match" />;
}
