// Kids Corner games that are live and playable. These count toward the
// site-wide quiz total shown in the header, alongside the trivia quizzes
// (lib/quizzes.js) and the exam practice tests (app/exams/examData.js).
//
// Keep this in sync with app/kids/KidsHubClient.jsx: every playable game on
// the hub (the seven dailies in lib/kids-daily.js and every READY match tile)
// belongs here, and nothing that is still "coming soon" does.
export const KIDS_GAMES = [
  // The seven daily puzzles (lib/kids-daily.js), one board a day each.
  { id: 'sixes', title: 'Shape Sixes', href: '/kids/sixes' },
  { id: 'pals', title: 'Pixel Pals', href: '/kids/pals' },
  { id: 'mixup', title: 'Mix-Up', href: '/kids/mixup' },
  { id: 'sortit', title: 'Sort It', href: '/kids/sortit' },
  { id: 'ladder', title: 'Ladder', href: '/kids/ladder' },
  { id: 'unpark', title: 'Unpark', href: '/kids/unpark' },
  { id: 'mathdash', title: 'Math Dash', href: '/kids/mathdash' },
  // The match games (app/kids/MatchGame.jsx).
  { id: 'memory-match', title: 'Treats Match', href: '/kids/memory-match' },
  { id: 'pizza-match', title: 'Pizza Match', href: '/kids/pizza-match' },
  { id: 'dog-match', title: 'Dog Match', href: '/kids/dog-match' },
  { id: 'color-match', title: 'Color Match', href: '/kids/color-match' },
  { id: 'addition-match', title: 'Addition Match', href: '/kids/addition-match' },
  { id: 'letter-match', title: 'Letter Match', href: '/kids/letter-match' },
  { id: 'fantasy-match', title: 'Fantasy Match', href: '/kids/fantasy-match' },
  { id: 'word-match', title: 'Word Match', href: '/kids/word-match' },
  { id: 'number-match', title: 'Number Match', href: '/kids/number-match' },
];

export const KIDS_GAME_COUNT = KIDS_GAMES.length;
