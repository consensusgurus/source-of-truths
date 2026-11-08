import LearningMatch from '../LearningMatch';

export const metadata = {
  title: 'Clock Match | Kids Corner | Mind Loft',
  description: 'A free matching memory game for kids. Learn to tell time: match each clock face to its time, on the hour and half hour. 24 cards, 12 pairs. Up to four players.',
  alternates: { canonical: '/kids/clock-match' },
  openGraph: {
    title: 'Clock Match | Kids Corner',
    description: 'Learn to tell time: match each clock face to its time, on the hour and half hour. Find all twelve pairs.',
    url: '/kids/clock-match',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export default function ClockMatchPage() {
  return <LearningMatch id="clock-match" />;
}
