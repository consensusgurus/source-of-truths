import { getQuiz } from '@/lib/quizzes';
import { renderQuizPromoCard } from '@/lib/og-stage-cards';

export const runtime = 'nodejs';

// The promo card, posted AS AN IMAGE with no link (better reach on X), so the
// URL is printed on the card rather than carried by the post.
//
// This used to render renderQuizQuestionCard for company quizzes: the first
// question plus its four choices, with the company's favicon fetched from
// Google at render time. Both are gone. The favicon was a network round trip
// inside an image route for a 60px decoration, and at the ~600px a timeline
// actually renders, four 26px choice chips are unreadable — the whole card
// spent on content that gives nothing away. The title, set large, does more.
export async function GET(req, { params }) {
  const id = decodeURIComponent(params.id);
  const quiz = getQuiz(id);
  if (quiz && quiz.series === 'fortune-500-hq') return new Response(null, { status: 302, headers: { Location: '/og/fortune-500-hq.png' } });
  return renderQuizPromoCard({
    id,
    title: quiz ? quiz.title : 'Mind Loft Quiz',
    blurb: quiz ? quiz.blurb : '',
    category: quiz ? quiz.category : 'Quiz',
  });
}
