import ExamQuizClient from '../exams/ExamQuizClient';
import { EXAMS } from '../exams/examData';

const exam = EXAMS.sat;

export const metadata = {
  title: `${exam.label} Practice: Where Will You Get In? | Mind Loft`,
  description: exam.blurb,
  robots: { index: false, follow: false },
  alternates: { canonical: '/sat' },
};

export default function SatPage() {
  return <ExamQuizClient examKey="sat" />;
}
