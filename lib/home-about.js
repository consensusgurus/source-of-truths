// THE HOMEPAGE'S CRAWLABLE ABOUT BLOCK (owner, 2026-10-01: "get on page one for
// 'puzzle site'"). The stage home is a dashboard of tiles, so a crawler reading
// it found game names and no sentence saying what the site IS. This is that
// sentence, plus a link to every puzzle category page and a short FAQ.
//
// ONE SOURCE FOR BOTH HALVES: app/today/HomeAbout.jsx renders the FAQ visibly
// and app/page.js emits the same entries as FAQPage JSON-LD. Google requires
// FAQ markup to match visible text, so never edit one without the other; they
// cannot drift while both read HOME_FAQ.
//
// COPY RULES: no em dash, nothing that goes stale (no exact game count; "more
// than 80" matches the homepage metadata), no answers to any puzzle.

export const HOME_ABOUT_LEAD = [
  'Mind Loft is a free daily puzzle site. More than 80 puzzles reset every night at midnight Eastern: word games and crosswords, sudoku variants, logic puzzles, number puzzles, chess and endgame positions, card games, trivia, and geography games.',
  'Everyone in the world plays the same board on the same day, so every puzzle has its own daily leaderboard, and a combined board ranks who did best across all of them. Most games ramp from a gentler Monday to a tougher Saturday, and many run a bigger Sunday Edition.',
  'There is nothing to install and nothing to pay. Play in the browser on a phone, tablet or computer, as a guest or under a display name that puts you on the boards and keeps your streaks.',
];

// Order: the categories people search for most first.
export const HOME_ABOUT_LINKS = [
  ['sudoku', 'Sudoku'],
  ['crosswords', 'Crosswords'],
  ['word-games', 'Word games'],
  ['logic-puzzles', 'Logic puzzles'],
  ['number-puzzles', 'Number puzzles and math games'],
  ['chess-puzzles', 'Chess puzzles'],
  ['end-game-puzzles', 'Endgame puzzles'],
  ['card-games', 'Card games'],
  ['trivia-games', 'Trivia games'],
  ['geography-games', 'Geography games'],
  ['crowd-psychology-games', 'Crowd psychology games'],
  ['arcade-games', 'Arcade games'],
];

export const HOME_FAQ = [
  ['Is Mind Loft free?',
    'Yes. Every daily puzzle and every quiz on Mind Loft is free to play in your browser, with no subscription and no app to download.'],
  ['How often are new puzzles posted?',
    'Every day. All of the daily puzzles reset at midnight Eastern time, and past days stay playable from each game’s archive.'],
  ['Do I need an account to play?',
    'No. You can play any puzzle as a guest. Choosing a display name puts your results on the daily leaderboards and keeps your streaks and stats.'],
  ['What kinds of puzzles are on Mind Loft?',
    'Word games, mini and full-size crosswords, more than a dozen sudoku variants, logic puzzles such as nonograms and deduction grids, number and math puzzles, chess and endgame puzzles, card games, daily trivia, geography games, and arcade games.'],
  ['Does everyone get the same puzzle?',
    'Yes. Each day’s board is the same for every player, which is what makes the daily leaderboards a fair race.'],
];

export function homeFaqLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HOME_FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
}
