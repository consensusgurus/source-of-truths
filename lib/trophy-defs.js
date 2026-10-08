import { T } from '@/lib/theme';
// Trophy definitions for player profiles: PURE metadata, safe to import from
// any client component (no data imports, so it adds nothing to the bundle).
// The evaluation logic lives in lib/quiz-trophies.js (server only). Adding a
// trophy means adding a row here AND a criterion in quiz-trophies.js.
//
// tier:  bronze | silver | gold | diamond  (rarity/prestige band, see TROPHY_TIERS)
// group: volume | perfection | dedication | daily | standing | duels
// icon:  a lucide-react icon NAME; the client maps it to the component and
//        falls back to Trophy for unknown names.

export const TROPHY_TIERS = {
  bronze: { label: 'Bronze', bg: '#f6e9df', fg: '#8a4f24', ring: '#c8814b' },
  silver: { label: 'Silver', bg: '#eef0f2', fg: '#5b6472', ring: '#b8bcc4' },
  gold: { label: 'Gold', bg: '#fbf2dc', fg: '#8a5300', ring: T.gold },
  diamond: { label: 'Diamond', bg: '#e8effb', fg: T.accent, ring: T.blue },
};

export const TROPHY_GROUPS = [
  { key: 'standing', label: 'Standing' },
  { key: 'perfection', label: 'Perfection' },
  { key: 'daily', label: 'Daily Puzzles' },
  { key: 'dedication', label: 'Dedication' },
  { key: 'volume', label: 'Volume' },
  { key: 'circuits', label: 'Circuits' },
  { key: 'duels', label: 'Duels' },
];

export const TROPHIES = [
  // ── volume ──
  { id: 'first-quiz', name: 'Opening Act', desc: 'Finish your first game.', tier: 'bronze', group: 'volume', icon: 'Play' },
  { id: 'games-10', name: 'Warmed Up', desc: 'Finish 10 games.', tier: 'bronze', group: 'volume', icon: 'ListChecks' },
  { id: 'games-50', name: 'Grinder', desc: 'Finish 50 games.', tier: 'silver', group: 'volume', icon: 'Layers' },
  { id: 'games-100', name: 'Centurion', desc: 'Finish 100 games.', tier: 'gold', group: 'volume', icon: 'Shield' },
  { id: 'games-500', name: 'Iron Player', desc: 'Finish 500 games.', tier: 'diamond', group: 'volume', icon: 'Anchor' },
  { id: 'correct-1k', name: 'Thousand Club', desc: 'Bank 1,000 correct answers.', tier: 'silver', group: 'volume', icon: 'Hash' },
  { id: 'correct-10k', name: 'Encyclopedic', desc: 'Bank 10,000 correct answers.', tier: 'diamond', group: 'volume', icon: 'BookOpen' },
  { id: 'cats-5', name: 'Explorer', desc: 'Play games in 5 different categories.', tier: 'bronze', group: 'volume', icon: 'Compass' },
  { id: 'cats-all', name: 'Polymath', desc: 'Play games in every category on the site.', tier: 'gold', group: 'volume', icon: 'GraduationCap' },
  // ── perfection ──
  { id: 'perfect-1', name: 'Spotless', desc: 'Score 100% on a quiz.', tier: 'bronze', group: 'perfection', icon: 'Star' },
  { id: 'perfect-10', name: 'Perfectionist', desc: 'Ace 10 different quizzes.', tier: 'silver', group: 'perfection', icon: 'Sparkles' },
  { id: 'perfect-50', name: 'Immaculate', desc: 'Ace 50 different quizzes.', tier: 'gold', group: 'perfection', icon: 'Gem' },
  { id: 'perfect-brutal', name: 'Giant Slayer', desc: 'Score 100% on one of the hardest quizzes on the site.', tier: 'gold', group: 'perfection', icon: 'Zap' },
  { id: 'perfect-day3', name: 'Hot Hand', desc: 'Score three perfects in a single day.', tier: 'silver', group: 'perfection', icon: 'Flame' },
  // ── dedication ──
  { id: 'streak-7', name: 'Seven Straight', desc: 'Play 7 days in a row.', tier: 'silver', group: 'dedication', icon: 'CalendarCheck' },
  { id: 'streak-30', name: 'Monthly Habit', desc: 'Play 30 days in a row.', tier: 'gold', group: 'dedication', icon: 'CalendarDays' },
  { id: 'streak-100', name: 'Unbreakable', desc: 'Play 100 days in a row.', tier: 'diamond', group: 'dedication', icon: 'Infinity' },
  { id: 'days-30', name: 'Thirty Days In', desc: 'Play on 30 different days.', tier: 'silver', group: 'dedication', icon: 'Clock' },
  { id: 'days-100', name: 'Hundred Days', desc: 'Play on 100 different days.', tier: 'gold', group: 'dedication', icon: 'Hourglass' },
  { id: 'days-365', name: 'Year Club', desc: 'Play on 365 different days.', tier: 'diamond', group: 'dedication', icon: 'Cake' },
  // ── daily puzzles ──
  { id: 'daily-1', name: 'Daily Debut', desc: 'Play your first daily puzzle.', tier: 'bronze', group: 'daily', icon: 'Sunrise' },
  { id: 'daily-10games', name: 'Sampler', desc: 'Play 10 different daily games.', tier: 'silver', group: 'daily', icon: 'LayoutGrid' },
  { id: 'daily-all', name: 'Completionist', desc: 'Play every live daily game at least once.', tier: 'gold', group: 'daily', icon: 'CheckCircle2' },
  { id: 'daily-100', name: 'Devotee', desc: 'Play 100 daily puzzles.', tier: 'gold', group: 'daily', icon: 'Repeat' },
  { id: 'daily-win', name: "Day's Best", desc: 'Post the top score on a daily board.', tier: 'gold', group: 'daily', icon: 'Medal' },
  { id: 'daily-win10', name: 'Serial Champion', desc: 'Win 10 daily boards.', tier: 'diamond', group: 'daily', icon: 'Crown' },
  // ── standing ──
  { id: 'crown-1', name: 'Crown Holder', desc: 'Hold the best score on any quiz leaderboard.', tier: 'gold', group: 'standing', icon: 'Crown' },
  { id: 'crown-5', name: 'Crown Collector', desc: 'Hold the best score on 5 quiz leaderboards at once.', tier: 'diamond', group: 'standing', icon: 'Castle' },
  { id: 'top10', name: 'Top Ten', desc: 'Reach the top 10 of the global IQ ranking.', tier: 'diamond', group: 'standing', icon: 'TrendingUp' },
  { id: 'cat-top3', name: 'Podium', desc: 'Reach the top 3 in any category.', tier: 'gold', group: 'standing', icon: 'Medal' },
  { id: 'level-10', name: 'Double Digits', desc: 'Reach level 10.', tier: 'silver', group: 'standing', icon: 'ChevronsUp' },
  { id: 'master', name: 'Master Tier', desc: 'Reach level 18 and the Master tier.', tier: 'diamond', group: 'standing', icon: 'Award' },
  // ── duels ──
  // ── circuits ──
  // ONE PER CIRCUIT, plus a capstone. A circuit is five (or four) dailies of one
  // skill played as one sitting, so its trophy is earned by finishing every game
  // in it ON THE SAME DAY — which is the same test the circuit's leaderboard
  // uses to rank you, so the trophy and the board agree about what finishing
  // means.
  //
  // TIER IS THE CIRCUIT'S LENGTH in measured top-10 clock, not a guess at
  // difficulty: bronze under 6 minutes, silver to 20, gold beyond. Chess & Board
  // is four games totalling under two minutes and Crosswords is five totalling
  // forty-seven; calling those the same achievement would be a lie about which
  // one is hard. The Daily Five is gold whatever the day's roster costs, because
  // its roster changes daily and is the one circuit that cannot be farmed by
  // waiting for an easy day.
  //
  // LISTED LITERALLY, NOT GENERATED, on purpose. This file's contract is that it
  // is pure metadata a client can import for nothing; deriving these from
  // lib/circuits would drag lib/daily-games and lib/daily-five into every bundle
  // that shows a trophy case. scripts/verify-circuits.mjs asserts this list and
  // the rosters agree 1:1 — id, name, tier and icon — so adding a circuit
  // without its trophy fails the build gate rather than shipping a hole.
  { id: 'circuit-five', name: 'The Full Five', desc: 'Finish every game in the Daily Five on the same day.', tier: 'gold', group: 'circuits', icon: 'Star' },
  { id: 'circuit-crosswords', name: 'Fully Crossed', desc: 'Finish every game in the Crosswords circuit on the same day.', tier: 'gold', group: 'circuits', icon: 'Grid3x3' },
  { id: 'circuit-word-building', name: 'Master Builder', desc: 'Finish every game in the Word Building circuit on the same day.', tier: 'gold', group: 'circuits', icon: 'Hammer' },
  { id: 'circuit-wordplay', name: 'Wordsmith', desc: 'Finish every game in the Wordplay circuit on the same day.', tier: 'silver', group: 'circuits', icon: 'Feather' },
  { id: 'circuit-sudoku', name: 'Grid Locked', desc: 'Finish every game in the Sudoku circuit on the same day.', tier: 'gold', group: 'circuits', icon: 'Grid2x2' },
  { id: 'circuit-mental-math', name: 'Quick Reckoner', desc: 'Finish every game in the Mental Math circuit on the same day.', tier: 'silver', group: 'circuits', icon: 'Calculator' },
  { id: 'circuit-deduction', name: 'Case Closed', desc: 'Finish all five cases of Lawyering on the same day.', tier: 'silver', group: 'circuits', icon: 'Search' },
  { id: 'circuit-pencil', name: 'Sharpened', desc: 'Finish every game in the Pencil Puzzles circuit on the same day.', tier: 'silver', group: 'circuits', icon: 'PenTool' },
  { id: 'circuit-spatial', name: 'Way Finder', desc: 'Finish every game in the Spatial Puzzles circuit on the same day.', tier: 'bronze', group: 'circuits', icon: 'Compass' },
  { id: 'circuit-sorting', name: 'Sorted', desc: 'Finish every game in the Sorting circuit on the same day.', tier: 'silver', group: 'circuits', icon: 'ArrowDownUp' },
  { id: 'circuit-chess-board', name: 'Endgame Sweep', desc: 'Finish every game in the Board Games circuit on the same day.', tier: 'bronze', group: 'circuits', icon: 'Swords' },
  { id: 'circuit-chess', name: 'Grandmaster', desc: 'Finish every game in the Chess circuit on the same day.', tier: 'bronze', group: 'circuits', icon: 'Crown' },
  { id: 'circuit-table', name: 'Full Table', desc: 'Finish every game in the Table Games circuit on the same day.', tier: 'silver', group: 'circuits', icon: 'Spade' },
  { id: 'circuit-recall', name: 'Long Memory', desc: 'Finish every game in the Recall circuit on the same day.', tier: 'silver', group: 'circuits', icon: 'History' },
  { id: 'circuit-ranking', name: 'Called It', desc: 'Finish every game in the Ranking circuit on the same day.', tier: 'silver', group: 'circuits', icon: 'ListOrdered' },
  { id: 'circuit-arcade', name: 'High Score', desc: 'Finish every game in the Arcade circuit on the same day.', tier: 'silver', group: 'circuits', icon: 'Gamepad2' },
  { id: 'circuit-gauntlet', name: 'Last One Standing', desc: 'Finish every game in the Gauntlet circuit on the same day.', tier: 'bronze', group: 'circuits', icon: 'Shield' },
  { id: 'circuit-valet', name: 'Keys, Please', desc: 'Park all three lots of the Valet Gauntlet on the same day.', tier: 'silver', group: 'circuits', icon: 'Car' },
  { id: 'circuit-pricecheck', name: 'Sold', desc: 'Price all five tags of Price Check on the same day.', tier: 'bronze', group: 'circuits', icon: 'Tag' },
  { id: 'circuit-passport', name: 'Frequent Flyer', desc: 'Play all five rounds of Passport.', tier: 'bronze', group: 'circuits', icon: 'Plane' },
  { id: 'circuit-all', name: 'Grand Circuit', desc: 'Finish every circuit on the site at least once.', tier: 'diamond', group: 'circuits', icon: 'Route' },
  // ── duels ──
  { id: 'duel-1', name: 'First Blood', desc: 'Win a duel.', tier: 'bronze', group: 'duels', icon: 'Swords' },
  { id: 'duel-10', name: 'Duelist', desc: 'Win 10 duels.', tier: 'gold', group: 'duels', icon: 'Swords' },
];

export const TROPHY_BY_ID = Object.fromEntries(TROPHIES.map((t) => [t.id, t]));
