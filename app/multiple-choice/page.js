import MultipleChoiceClient from './MultipleChoiceClient';
import PageViewBeacon from '../PageViewBeacon';

// MULTIPLE CHOICE LEADERS (owner, 2026-11-03): mindloftdaily.com/multiple-choice.
// Every correct answer across the five multiple choice runs (Trivia Gauntlet,
// Trivia Encore, Math, Science and English Gauntlets), today, the last week,
// the last month and all time. Full page with only a Back button. It replaced
// Polymath on every surface a player sees. Board data: /api/quiz/multiple-choice.
//
// noindex, like every board page: every figure on it is a live leaderboard.
export const metadata = {
  title: 'Multiple Choice Leaders | Mind Loft',
  description: 'The leaders across Mind Loft’s five multiple choice runs: the Trivia Gauntlet, Trivia Encore, Math Gauntlet, Science Gauntlet and English Gauntlet.',
  alternates: { canonical: '/multiple-choice' },
  robots: { index: false, follow: true },
};

export default function MultipleChoicePage() {
  return (
    <>
      <PageViewBeacon id="multiple-choice" />
      <MultipleChoiceClient />
    </>
  );
}
