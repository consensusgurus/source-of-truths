import ExamHubClient from './ExamHubClient';

// Hidden / unlinked hub. noindex so it stays out of search until surfaced.
export const metadata = {
  title: 'Practice Tests: Where Will You Get In? | Mind Loft',
  description:
    'Hard, real-style practice questions for the LSAT, GMAT, SAT, ACT, GRE, and MCAT. Match your score to a shortlist of schools.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/exams' },
};

export default function ExamsPage() {
  return <ExamHubClient />;
}
