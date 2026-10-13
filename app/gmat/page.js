import ExamQuizClient from '../exams/ExamQuizClient';
import { EXAMS } from '../exams/examData';

const exam = EXAMS.gmat;

export const metadata = {
  title: `${exam.label} Practice: Where Will You Get In? | Mind Loft`,
  description: exam.blurb,
  robots: { index: false, follow: false },
  alternates: { canonical: '/gmat' },
};

export default function GmatPage() {
  return <ExamQuizClient examKey="gmat" />;
}
