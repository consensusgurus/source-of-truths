import { catalogQuizzes } from '@/lib/quiz-catalog';
import QuizLandingClient from './QuizLandingClient';

// /quizzes — THE QUIZ HOME.
//
// This path used to 308 to `/`, because the quiz hub had moved to the site
// root and the root is the DAILY home, which carries the quizzes as one
// expandable drawer at its foot. That drawer stays exactly where it is; this
// is the surface behind it, and the surface every "back to the quizzes" link
// in the product now lands on (the quiz ending card, the challenge page, the
// quiz leaderboard and the quiz stats page all already pointed here).
//
// THE 308 IS GONE FROM next.config.js WITH THIS FILE. A permanent redirect is
// cached by the browser, so a reader who hit /quizzes while it was live may
// still be sent to `/` from their own cache for a while. That degrades to the
// daily home, which still has the drawer, so nothing breaks; it just takes a
// cache clear to see this page.
//
// IT IS THE SAME REGISTER AS THE DAILY HOME, deliberately: the same cap line,
// the same section rules, the same tiles, the same nine-step category ramp.
// The two halves of the site are one product and should not look like two.
export function generateMetadata() {
  const count = catalogQuizzes().length;
  const title = 'Quizzes | Mind Loft';
  const description = `${count.toLocaleString()} free timed quizzes across films, music, geography, sports, business and brands: name-them-all, matching, map and multiple-choice, sorted by topic with a leaderboard on every one.`;
  return {
    title,
    description,
    alternates: { canonical: '/quizzes' },
    openGraph: {
    images: [{ url: '/og/quizzes.png', width: 1200, height: 630, alt: 'Mind Loft quizzes' }],
      title: 'Mind Loft Quizzes',
      description,
      url: '/quizzes',
      type: 'website',
      siteName: 'Mind Loft',
    },
    twitter: {
    images: ['/og/quizzes.png'], card: 'summary_large_image', title: 'Mind Loft Quizzes', description },
  };
}

export default function QuizzesPage() {
  return <QuizLandingClient />;
}
