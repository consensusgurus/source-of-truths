import LearningMatch from '../LearningMatch';

export const metadata = {
  title: 'Times Table Match | Kids Corner | Mind Loft',
  description: 'A free matching memory game for kids. Practice the times tables: match each multiplication fact to its answer. 28 cards, 14 pairs. Up to four players.',
  alternates: { canonical: '/kids/times-table-match' },
  openGraph: {
    title: 'Times Table Match | Kids Corner',
    description: 'Practice the times tables: match each multiplication fact to its answer. Find all fourteen pairs.',
    url: '/kids/times-table-match',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export default function TimesTableMatchPage() {
  return <LearningMatch id="times-table-match" />;
}
