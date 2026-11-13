// Kids Corner games that are live and playable. These count toward the
// site-wide quiz total shown in the header, alongside the trivia quizzes
// (lib/quizzes.js) and the exam practice tests (app/exams/examData.js).
//
// Keep this in sync with app/kids/KidsHubClient.jsx: every playable game on
// the hub (the seven dailies in lib/kids-daily.js and every READY match tile)
// belongs here, and nothing that is still "coming soon" does.
export const KIDS_GAMES = [
  // The six daily puzzles (lib/kids-daily.js), one board a day each.
  { id: 'sixes', title: 'Shape Sixes', href: '/kids/sixes' },
  { id: 'mixup', title: 'Mix-Up', href: '/kids/mixup' },
  { id: 'sortit', title: 'Sort It', href: '/kids/sortit' },
  { id: 'ladder', title: 'Ladder', href: '/kids/ladder' },
  { id: 'unpark', title: 'Unpark', href: '/kids/unpark' },
  { id: 'mathdash', title: 'Math Dash', href: '/kids/mathdash' },
  { id: 'fitit', title: 'Fit It', href: '/kids/fitit' },
  { id: 'jigsaw', title: 'Puzzle Shelf', href: '/kids/jigsaw' },
  { id: 'spot', title: 'Spot', href: '/kids/spot' },
  // The match games (app/kids/MatchGame.jsx).
  { id: 'color-match', title: 'Color Match', href: '/kids/color-match' },
  { id: 'letter-match', title: 'Letter Match', href: '/kids/letter-match' },
  { id: 'addition-match', title: 'Addition Match', href: '/kids/addition-match' },
  { id: 'memory-match', title: 'Treats Match', href: '/kids/memory-match' },
  { id: 'pizza-match', title: 'Pizza Match', href: '/kids/pizza-match' },
  { id: 'dog-match', title: 'Dog Match', href: '/kids/dog-match' },
  { id: 'fantasy-match', title: 'Fantasy Match', href: '/kids/fantasy-match' },
  { id: 'word-match', title: 'Word Match', href: '/kids/word-match' },
  { id: 'number-match', title: 'Number Match', href: '/kids/number-match' },
  // The learning match sets (app/kids/learning-matches.js), 2026-11-07.
  { id: 'shape-match', title: 'Shape Match', href: '/kids/shape-match' },
  { id: 'counting-match', title: 'Counting Match', href: '/kids/counting-match' },
  { id: 'subtraction-match', title: 'Subtraction Match', href: '/kids/subtraction-match' },
  { id: 'times-table-match', title: 'Times Table Match', href: '/kids/times-table-match' },
  { id: 'clock-match', title: 'Clock Match', href: '/kids/clock-match' },
  { id: 'mama-baby-match', title: 'Mama and Baby Match', href: '/kids/mama-baby-match' },
  { id: 'animal-sound-match', title: 'Animal Sound Match', href: '/kids/animal-sound-match' },
  { id: 'opposites-match', title: 'Opposites Match', href: '/kids/opposites-match' },
  { id: 'rhyme-match', title: 'Rhyme Match', href: '/kids/rhyme-match' },
  { id: 'flag-match', title: 'Flag Match', href: '/kids/flag-match' },
  { id: 'animal-home-match', title: 'Animal Home Match', href: '/kids/animal-home-match' },
  { id: 'job-match', title: 'Job Match', href: '/kids/job-match' },
];

export const KIDS_GAME_COUNT = KIDS_GAMES.length;
