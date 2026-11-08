'use client';

import MatchGame from './MatchGame';
import { LEARNING_MATCHES } from './learning-matches';

// One client for every learning match set (app/kids/learning-matches.js).
// The page passes the set's id; the view counter key is kids-<id>, the same
// shape as the older match games.
export default function LearningMatch({ id }) {
  const m = LEARNING_MATCHES[id];
  return (
    <MatchGame
      pairs={m.pairs}
      cols={m.cols}
      quizId={`kids-${id}`}
      title={m.title}
      intro={m.intro}
    />
  );
}
