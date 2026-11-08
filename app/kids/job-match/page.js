import LearningMatch from '../LearningMatch';

export const metadata = {
  title: 'Job Match | Kids Corner | Mind Loft',
  description: 'A free matching memory game for kids. Match each job to its tool: firefighter and fire hose, doctor and stethoscope. 24 cards, 12 pairs. Up to four players.',
  alternates: { canonical: '/kids/job-match' },
  openGraph: {
    title: 'Job Match | Kids Corner',
    description: 'Match each job to its tool: firefighter and fire hose, doctor and stethoscope. Find all twelve pairs.',
    url: '/kids/job-match',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export default function JobMatchPage() {
  return <LearningMatch id="job-match" />;
}
