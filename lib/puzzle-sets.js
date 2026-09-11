// PUZZLE SET LANDING PAGES (owner, 2026-09-11: "do that fully, for category
// and subcategory and circuit").
//
// A SET is one of the groups in lib/daily-groups.js: the three-to-five game
// shelves a category is split into (Crosswords, Traffic jams, Whodunits, Edge
// clue sudokus...). The category pages carry the head terms ("logic puzzles");
// these carry the next tier down, the terms a searcher types when they know
// what kind of puzzle they want ("sliding block puzzle", "nonogram", "killer
// sudoku", "pub quiz"), and no game page can, because each game is one
// example of the kind.
//
// ONE PAGE PER SET, NESTED UNDER ITS CATEGORY: /logic-puzzles/traffic-jams,
// /sudoku/edge-clue-sudokus. The roster is the group's live keys, read at
// render time, so a set page changes the day its group does and never before.
// The generic label per game is the category page's (lib/puzzle-categories.js)
// unless a set says otherwise, so there is one copy of "Killer sudoku".
//
// TWO SETS ALREADY HAVE A PAGE. Chess endings IS /chess-puzzles, and the two
// crossword sets together ARE /crosswords; each of those carries `page` and
// gets no route of its own, so the same games are not described twice under
// two URLs. The category page still lists them as sets and links the page.
//
// COPY RULES as for the categories: no em dash, no answers, nothing that goes
// stale with a bank regeneration.

import { GROUPS } from './daily-groups.js';
import { DAILY_GAME_MAP, liveDailyKeys } from './daily-games.js';
import { PUZZLE_CATEGORY_MAP, CAT_TO_SLUG } from './puzzle-categories.js';

const SETS = [
  // ── Word ────────────────────────────────────────────────────────────────
  { name: 'Crosswords', page: '/crosswords' },
  { name: 'Clueless crosswords', page: '/crosswords' },
  {
    name: 'Letter tiles', slug: 'letter-tiles', circuit: 'word-building',
    eyebrow: 'Free daily tile word games',
    title: 'Free Daily Letter Tile Games: Same Rack, Highest Score Wins | Mind Loft',
    h1: 'Free Daily Letter Tile Games: Same Rack for Everyone, Highest Score Wins',
    description: 'Four free daily tile word games where everyone gets the same letters: a fourteen-tile rack scored like a board game, a bag-empty endgame with a knowable best line, a seven-letter honeycomb that pays more for rarer words, and a word excavation. New racks at midnight Eastern, no signup.',
    lede: 'Four games about what you can build from a fixed set of letters, and the set is the same for everybody, so the board is a straight comparison of what each player found. A fourteen-tile rack, a bag-empty endgame, a seven-letter honeycomb and a dig for buried words.',
    how: [
      'Tuck deals everyone the same fourteen letters and ranks the highest-scoring board. Babel is an endgame: the bag is empty, the tiles left are known, and the best line can be worked out rather than hoped for. Lode gives you seven letters around a core letter and pays more the rarer the word. Strata buries words in layers and asks you to dig them out.',
      'The tile games check against a Scrabble list, which is broader than everyday English, so an obscure two-letter word is a fair play.',
    ],
    faq: [
      ['Which word list counts?', 'A Scrabble list, which is broader than everyday English.'],
      ['Are they free?', 'All four, every day, no account required.'],
    ],
  },
  {
    name: 'Letter shuffles', slug: 'letter-shuffles', circuit: 'wordplay',
    eyebrow: 'Free daily anagram and word ladder games',
    title: 'Free Daily Anagram Games: Word Scrambles, Word Ladders and Letter Trades | Mind Loft',
    h1: 'Free Daily Anagram Games: Word Scrambles, Word Ladders and Letter Trades',
    description: 'Three free daily letter-shuffle games: unscramble five words and a clued finale, walk one word to another a letter at a time, and trade letters two at a time toward six hidden words on a budget. New puzzles at midnight Eastern, no signup.',
    lede: 'Three games about moving letters around. Garble hands you five scrambled words and a finale built from them. Rung is the word ladder, one letter changed per step from the top word to the bottom. Barter trades two letters at a time toward six hidden words, on a budget of the proven minimum plus five.',
    how: [
      'Garble is the quickest: five scrambles, then a clued finale, in as few misses as you can. Rung is the classic word ladder, and the daily one has a proven shortest path that the board measures you against. Barter is the deep one: every trade costs a move, the minimum is known, and the board ranks on how close you got to it.',
    ],
    faq: [
      ['Do the ladders have one answer?', 'They have a proven shortest length. Any ladder of that length is a perfect solve.'],
      ['Are they free?', 'All three, every day, no account required.'],
    ],
  },
  {
    name: 'Word meanings', slug: 'word-meanings', circuit: 'wordplay',
    eyebrow: 'Free daily word puzzles about meaning',
    title: 'Free Daily Word Puzzles About Meaning: Hidden Groups, Compound Chains, Hotter or Colder | Mind Loft',
    h1: 'Free Daily Word Puzzles About Meaning: Hidden Groups, Compound Chains and Hotter or Colder',
    description: 'Four free daily word games about what words mean rather than how they are spelled: sort sixteen words into four hidden groups, chain compound words, hunt a secret word by how close each guess is in meaning, and fix the one wrong word in a sentence. No signup.',
    lede: 'Four games where the letters are not the point. Links asks you to sort sixteen words into the four hidden groups that connect them. Hinge chains compound words end to end. Warmer scores every guess by how close its meaning is to a secret word. Stet hides one wrong word in a sentence and asks you to fix it, or to stamp clean copy stet.',
    how: [
      'Links gives you four mistakes to find four groups, and the groups overlap on purpose. Hinge is a chain where each word joins the last to make a compound. Warmer is a slow hunt, cold to hot, that ends when you land on the word. Stet is the copy desk: read each sentence, tap the wrong word if there is one, and know when there is not.',
    ],
    faq: [
      ['How does Warmer score a guess?', 'By closeness of meaning to the secret word, not by spelling, so a synonym runs hot and an unrelated word runs cold.'],
      ['Are they free?', 'All four, every day, no account required.'],
    ],
  },
  // ── Logic ───────────────────────────────────────────────────────────────
  {
    name: 'Traffic jams', slug: 'traffic-jams', circuit: 'valet',
    eyebrow: 'Free daily sliding block puzzles',
    title: 'Free Daily Sliding Block Puzzles: Get the Red Car Out, in Three Sizes | Mind Loft',
    h1: 'Free Daily Sliding Block Puzzles: Get the Red Car Out, in Three Sizes',
    description: 'Three free daily sliding block puzzles (the rush hour, traffic jam kind): a 6x6 lot, a 7x7 lot and an 8x8 lot, each with a proven minimum number of moves. Slide the blockers, get the red one out. New lots at midnight Eastern, no signup.',
    lede: 'The sliding block puzzle where everybody has blocked you in, every block is stuck on one axis, and there is one gap in the wall. Parker is the six by six lot, Impound the seven by seven, Junkyard the eight by eight, and each day’s lot has a proven minimum you are measured against.',
    how: [
      'Every block slides only along its own length, the red one has to reach the exit, and the count is moves, not time. The three sizes are three separate games because a lot’s size is frozen into every board and every stored perfect; finishing one hands you the next size up you have not played, so they read as one ladder.',
      'The Valet Gauntlet plays all three back to back on one clock, fastest combined time first.',
    ],
    faq: [
      ['Is the minimum really proven?', 'Yes. Every lot is solved by a search before it ships, and the board grades your run against that number.'],
      ['Can I replay a lot?', 'Yes. Replaying the same lot is the design, and the board ranks on your best grade, then on how many runs it took.'],
    ],
  },
  {
    name: 'Whodunits', slug: 'whodunits', circuit: 'deduction',
    eyebrow: 'Free daily deduction puzzles',
    title: 'Free Daily Whodunit and Deduction Puzzles: Suspects, Liars and Alibis | Mind Loft',
    h1: 'Free Daily Whodunit and Deduction Puzzles: Suspects, Liars and Alibis',
    description: 'Four free daily deduction puzzles: narrow four suspects to one across three grids, find the thief among five sworn statements with an exact number of lies, an inequality grid with one liar, and a puzzle about what two people can and cannot know. New cases at midnight Eastern, no signup.',
    lede: 'Four puzzles that give you statements instead of a grid to fill. Alibi is the nightly whodunit. Sworn has five statements and an exact number of lies. Fib is an inequality grid where one clue is false. Hearsay works out what two people know from what they say they do not.',
    how: [
      'Each case narrows to exactly one answer by logic, and each is checked before it ships so that it does. Alibi seats four suspects across three deduction boards. Sworn tells you how many of the five statements are lies and one of them names the thief. Fib prints a grid of inequalities and exactly one of them is wrong. Hearsay is the knowledge puzzle: two people each hold one detail, and their conversation is the clue.',
    ],
    faq: [
      ['Do I ever have to guess?', 'No. Every case is proved to fall to logic alone.'],
      ['Are they free?', 'All four, every day, no account required.'],
    ],
  },
  {
    name: 'Grid drawing', slug: 'grid-drawing', circuit: 'pencil',
    eyebrow: 'Free daily pencil puzzles',
    title: 'Free Daily Pencil Puzzles: Nonogram, Slitherlink, Shikaku and Network | Mind Loft',
    h1: 'Free Daily Pencil Puzzles: Nonogram, Slitherlink, Shikaku and a Network Puzzle',
    description: 'Four free daily pencil-and-paper logic puzzles drawn on a grid: a nonogram (picross), a slitherlink loop, shikaku rectangles and a network you build from its costs. One solution each, reachable by logic. New boards at midnight Eastern, no signup.',
    lede: 'The puzzles you would draw with a pencil, on a grid you fill, loop, cut or wire. Etch is the nonogram: a picture appears when the counts are satisfied. Hedge is slitherlink: one closed loop. Plot is shikaku: cut the board into rectangles. Paths links every town into one network for the least cost.',
    how: [
      'Etch fills the squares the row and column counts force. Hedge draws one closed loop so every number has that many sides on it. Plot cuts the grid into rectangles so each number owns exactly its own area. Paths is the odd one out: a set of towns and the cost of every link, and you are building the cheapest network that reaches all of them.',
    ],
    faq: [
      ['How big do they get?', 'Bigger through the week. The Sunday Edition runs the largest boards.'],
      ['Are they free?', 'All four, every day, no account required.'],
    ],
  },
  {
    name: 'Sorting puzzles', slug: 'sorting-puzzles', circuit: 'sorting',
    eyebrow: 'Free daily placement and sorting puzzles',
    title: 'Free Daily Sorting Puzzles: Queens, Routes, Set Logic and Analytical Reasoning | Mind Loft',
    h1: 'Free Daily Sorting Puzzles: Queens Placement, Routes, Set Logic and Analytical Reasoning',
    description: 'Four free daily puzzles about putting things where they go: seat one jester per row, column and court with no two touching; find the route; place twelve words across seven overlapping regions; and an analytical reasoning setup with five questions. New boards at midnight Eastern, no signup.',
    lede: 'Four puzzles about placement. Jesters is the queens puzzle with coloured courts. Chomp eats a cast of mascots in order, and every square you touch stays yours. Venn places twelve words across seven overlapping regions so every count adds up. Docket is the analytical reasoning section of a well-known test: one setup, five questions.',
    how: [
      'Jesters seats one jester per row, per column and per coloured court, with no two ever touching; Thursday through Sunday seat two apiece. Chomp is a route puzzle with no clock and nothing chasing you: the only things in your way are where you have already been. Venn is set logic drawn as circles. Docket gives you a setup of rules and asks five questions about the arrangements it allows.',
    ],
    faq: [
      ['Is Docket really a test section?', 'It is the analytical reasoning shape, one setup and five questions, written fresh every day.'],
      ['Are they free?', 'All four, every day, no account required.'],
    ],
  },
  {
    name: 'Rule finding', slug: 'rule-finding', circuit: 'sorting',
    eyebrow: 'Free daily inductive reasoning puzzles',
    title: 'Free Daily Rule-Finding Puzzles: Hidden Rules, Data Sufficiency and Results Tables | Mind Loft',
    h1: 'Free Daily Rule-Finding Puzzles: Hidden Rules, Data Sufficiency and Results Tables',
    description: 'Three free daily puzzles about working out the rule: tell five candidate rules apart with a handful of tests, decide whether two statements settle a question, and rebuild a full results table from a few surviving facts. New puzzles at midnight Eastern, no signup.',
    lede: 'Three puzzles where the rule is the thing you are looking for. Axiom hides one rule and gives you a handful of tests to tell five candidates apart. Suffice is data sufficiency: two statements and a verdict on whether they settle it. Stands hands you a few surviving facts about a round robin and asks for the whole table back.',
    how: [
      'Axiom is the one nobody else has: one hidden rule splits the board, and each test you run has to buy you the most information. Suffice is the reasoning section of a well-known test: eight questions you never answer, two statements each, and you say whether they settle it. Stands is deduction from a results table: everyone played everyone once, and the surviving facts pin every result.',
    ],
    faq: [
      ['How is Axiom scored?', 'On how many tests it took you to name the rule. Fewer is better.'],
      ['Are they free?', 'All three, every day, no account required.'],
    ],
  },
  // ── Trivia ──────────────────────────────────────────────────────────────
  {
    name: 'Trivia gauntlets', slug: 'trivia-gauntlets', circuit: 'gauntlet',
    eyebrow: 'Free daily one-life quizzes',
    title: 'Free Daily Trivia Gauntlets: One Life, Same Questions for Everyone | Mind Loft',
    h1: 'Free Daily Trivia Gauntlets: One Life, Same Questions for Everyone',
    description: 'Five free daily one-life trivia quizzes: a forty-question grab bag, business, sports, film and television, and who said it. Four choices, twenty seconds, one wrong answer ends the run. Same questions in the same order for everyone. No signup.',
    lede: 'Five quizzes with one shape: a bank of four-choice questions climbing from gimme to expert, twenty seconds a question, and one life. Streak is the grab bag. Biz, Sport and Script are the specialist runs. Quotes asks who said it. Everyone gets the same questions in the same order, so the board is a straight count of how far you got.',
    how: [
      'The questions come in five tiers and the run climbs through them, so the first few are for everyone and the last few are for the people who know. One wrong answer ends the run and your score is the count. Play the whole family back to back as the Trivia Gauntlet and there is one combined board that ranks on questions right, shortest clock taking a tie.',
    ],
    faq: [
      ['Are the questions the same for everyone?', 'Yes. Same questions, same order, same day, which is what makes the board fair.'],
      ['Are they free?', 'All five, every day, no account required.'],
    ],
  },
  {
    name: 'Ordering trivia', slug: 'ordering-trivia', circuit: 'recall',
    eyebrow: 'Free daily ranking and ordering quizzes',
    title: 'Free Daily Ordering Trivia: Put History in Order, Rank the List, Fill the Bracket | Mind Loft',
    h1: 'Free Daily Ordering Trivia: Put History in Order, Rank the List, Fill the Bracket',
    description: 'Three free daily trivia puzzles about order rather than recall: arrange five historical moments oldest to newest, rank eight real things top to bottom, and pick fifteen winners through a sixteen-team bracket of facts. New puzzles at midnight Eastern, no signup.',
    lede: 'Three puzzles where knowing the answer is not enough, you have to know where it goes. Dating arranges five moments in time. Listed ranks eight real things in order, green for a lock and amber for one place off. Bracket makes fifteen picks through a sixteen-team bracket, where an early miss sinks every later line.',
    how: [
      'Dating gives you three checks to get five moments in order. Listed is the ranking puzzle: eight things, one order, and feedback that tells you what is placed and what is one off. Bracket is a tournament of facts: each matchup has a right answer, and picking the wrong winner early takes the rest of that line with it.',
    ],
    faq: [
      ['What does amber mean in Listed?', 'The item is one place from where it belongs.'],
      ['Are they free?', 'All three, every day, no account required.'],
    ],
  },
  {
    name: 'Picture and story trivia', slug: 'picture-and-story-trivia', circuit: 'recall',
    eyebrow: 'Free daily picture and headline puzzles',
    title: 'Free Daily Picture and Story Trivia: Zoomed Photos, Redacted Headlines, Films Described Badly | Mind Loft',
    h1: 'Free Daily Picture and Story Trivia: Zoomed Photos, Redacted Headlines and Films Described Badly',
    description: 'Free daily trivia puzzles you look at rather than read: name the subject of a photo shown at nine times zoom, uncover a redacted news story word by word, and name films from deliberately bad descriptions. New puzzles at midnight Eastern, no signup.',
    lede: 'Trivia for people who would rather look than read a question. Focus shows one photo at nine times zoom and pulls back a frame per miss. Redact hands you an article with the words blacked out and you uncover it. Thread describes films badly and asks which ones they are, and what connects them.',
    how: [
      'Focus is a zoom puzzle: the fewer frames you needed, the better. Redact is about uncovering a story with as few reveals as it takes to name it. Thread is nine films described as unhelpfully as possible, with a thread running through them that is the second answer.',
    ],
    faq: [
      ['Where do the photos come from?', 'Real photographs of real subjects, cropped by the puzzle rather than altered.'],
      ['Are they free?', 'All of them, every day, no account required.'],
    ],
  },
  {
    name: 'Single-topic trivia', slug: 'single-topic-trivia', circuit: 'recall',
    eyebrow: 'Free daily one-topic quizzes',
    title: 'Free Daily Single-Topic Trivia: One Subject, Fifteen Questions, a Trivia Grid and Blind Ranking | Mind Loft',
    h1: 'Free Daily Single-Topic Trivia: One Subject a Day, a Trivia Grid and a Blind Ranking',
    description: 'Three free daily trivia games that stay on one topic: a fifteen-question one-life quiz on a single subject, a trivia grid where every row and column is a category, and a blind ranking where ten things arrive one at a time. New topics at midnight Eastern, no signup.',
    lede: 'Three games that pick one subject and stay on it. Deep is fifteen questions on one topic with one life. Niche is the trivia grid: fill each cell with something that fits both its row and its column. Slot deals ten things one at a time and makes you place each before you see the next.',
    how: [
      'Deep runs like the gauntlets, climbing through the tiers, but on one subject a day, so a specialist can run the table. Niche is the grid: rows and columns are categories and every cell has to satisfy both. Slot is the blind ranking: the score is exact placements, and the near misses break ties.',
    ],
    faq: [
      ['Is the topic the same for everyone?', 'Yes. One topic a day, same questions in the same order.'],
      ['Are they free?', 'All three, every day, no account required.'],
    ],
  },
  // ── Sudoku ──────────────────────────────────────────────────────────────
  {
    name: 'Classic sudokus', slug: 'classic-sudokus', circuit: 'sudoku',
    eyebrow: 'Free classic sudoku online',
    title: 'Free Daily Classic Sudoku: 9x9, a Two-Minute 6x6, Sudoku X and One in Reverse | Mind Loft',
    h1: 'Free Daily Classic Sudoku: 9x9, a Two-Minute 6x6, Sudoku X and One Played in Reverse',
    description: 'Four free daily sudokus with the classic rules: a 9x9, a 6x6 mini, a diagonal sudoku (Sudoku X) and one played backwards, where the grid arrives solved and you remove clues. One logical solution each, never a guess. New boards at midnight Eastern, no signup.',
    lede: 'The sudokus that need no extra rule. Suds is the 9x9. Sixes is the 6x6 you finish in two minutes. Diag adds the two diagonals as houses and changes nothing else. Whittle is the same reasoning from the other end: the grid arrives solved and you take clues out for as long as it still has one answer.',
    how: [
      'Every row, every column and every box holds each digit exactly once, and every Mind Loft board falls to logic alone: singles first, then pairs and locked candidates as the week goes on. Diag adds two more houses, the diagonals. Whittle turns the question around, and the skill is knowing which clue is doing the work.',
    ],
    faq: [
      ['Do the puzzles ever need a guess?', 'No. Two independent solvers check every bank before it goes live.'],
      ['Are they free?', 'All four, every day, no account required.'],
    ],
  },
  {
    name: 'Edge clue sudokus', slug: 'edge-clue-sudokus', circuit: 'sudoku',
    eyebrow: 'Free killer, sandwich, frame and outside sudoku',
    title: 'Free Daily Killer, Sandwich, Frame, Outside and Skyscraper Sudoku | Mind Loft',
    h1: 'Free Daily Killer, Sandwich, Frame, Outside and Skyscraper Sudoku',
    description: 'Five free daily sudokus whose clues live outside the digits: killer cages that add up, sandwich sums between the 1 and the 9, frame sums of the first three, outside sudoku with nothing inside the grid, and skyscrapers you count from the edge. One logical solution each. New boards at midnight Eastern, no signup.',
    lede: 'Five sudokus that print their clues on the cages or in the gutters and leave the grid to you. Cages is killer sudoku. Sando is sandwich sudoku. Frame and Rim are the two gutter sudokus, one giving the sum of the first three digits from each edge and the other giving nothing inside the grid at all. Towers is skyscrapers, where the edge clue is how many buildings you can see.',
    how: [
      'The sudoku rule still holds in all five: each digit once per row, column and box. What changes is where the information comes from. Cages adds cage totals with no repeats inside a cage. Sando gives, for each row and column, the sum of the digits between the 1 and the 9. Frame prints the sum of the first three digits from each edge. Rim is Frame with nothing printed inside. Towers is not a sudoku at all but a skyscraper puzzle: digits are heights, and the edge clue counts how many you can see.',
    ],
    faq: [
      ['Which is the gentlest?', 'Cages, if you have done a killer sudoku before; the arithmetic is small and the cages do a lot of the work. Rim is the hardest of the five because it starts with an empty grid.'],
      ['Are they free?', 'All five, every day, no account required.'],
    ],
  },
  {
    name: 'Marked sudokus', slug: 'marked-sudokus', circuit: 'sudoku',
    eyebrow: 'Free jigsaw, thermo, kropki and anti-knight sudoku',
    title: 'Free Daily Jigsaw, Thermo, Kropki and Anti-Knight Sudoku | Mind Loft',
    h1: 'Free Daily Jigsaw, Thermo, Kropki and Anti-Knight Sudoku',
    description: 'Four free daily sudokus with marks on the grid: jigsaw regions instead of boxes, thermometers that must increase, kropki dots between consecutive or doubled digits, and an anti-knight rule that changes what sees what. One logical solution each. New boards at midnight Eastern, no signup.',
    lede: 'Four sudokus where the grid itself carries the extra rule. Quilt redraws the boxes as crooked regions. Mercury draws thermometers that rise from the bulb. Polka puts dots between cells whose digits are consecutive or doubled, and a missing dot means neither. Knight forbids two of the same digit a chess knight’s move apart.',
    how: [
      'Quilt is the gentlest step into variants: only the shape of the boxes changes. Mercury adds ordering, digits increasing along every thermometer. Polka is kropki: a white dot means consecutive, a black dot means one is double the other, and where there is no dot, neither is true. Knight keeps every classic rule and adds one: no digit may repeat a knight’s move away.',
    ],
    faq: [
      ['Does a missing kropki dot mean something?', 'Yes. Where two cells have no dot, their digits are neither consecutive nor one double the other. That negative clue does much of the work.'],
      ['Are they free?', 'All four, every day, no account required.'],
    ],
  },
  // ── Numbers ─────────────────────────────────────────────────────────────
  {
    name: 'Mental math', slug: 'mental-math', circuit: 'mental-math',
    eyebrow: 'Free daily mental arithmetic games',
    title: 'Free Daily Mental Math Games: Arithmetic Against the Clock, a Numbers Game and a Calculator Path | Mind Loft',
    h1: 'Free Daily Mental Math Games: Arithmetic Against the Clock, a Numbers Game and a Calculator Path',
    description: 'Four free daily mental arithmetic games: twenty problems at fifteen seconds each with one life, the same ladder with three numbers a line, a six-numbers-one-target countdown game, and a keypad you walk from the first key to the last. New problems at midnight Eastern, no signup.',
    lede: 'Four games that put arithmetic under a clock. Blitz is twenty problems, fifteen seconds each, one wrong answer ends the run. Blitzed is the same ladder with three numbers on every line. Crunch gives you six numbers and a three-digit target. Calc is a keypad whose buttons alternate number and operator, so the route you walk is the sum.',
    how: [
      'Blitz and Blitzed are sprints and are the only timed games in the family. Crunch is the television numbers game: add, subtract, multiply and divide six numbers to hit the target exactly, scored on steps. Calc is a path puzzle: start on the first key, end on the last, and the keys you pass through have to compute to the target.',
    ],
    faq: [
      ['Is it all timed?', 'Blitz and Blitzed are. Crunch and Calc are scored on accuracy and steps, with the clock as the tiebreak.'],
      ['Are they free?', 'All four, every day, no account required.'],
    ],
  },
  {
    name: 'Number grids', slug: 'number-grids', circuit: 'mental-math',
    eyebrow: 'Free daily number grid puzzles',
    title: 'Free Daily Number Grid Puzzles: Kakuro, Equal-Sum Blocks, Sum Grids and a Cryptarithm | Mind Loft',
    h1: 'Free Daily Number Grid Puzzles: Kakuro, Equal-Sum Blocks, Sum Grids and a Cryptarithm',
    description: 'Four free daily number puzzles on a grid: a kakuro, a grid you slice into equal-sum blocks, a grid you fill from a rack so every line adds to its target, and a cryptarithm where every letter is a digit. One solution each. New boards at midnight Eastern, no signup.',
    lede: 'Four puzzles about sums on a grid. Sums is the kakuro. Carve slices the grid into connected blocks that each add to the same number. Tally fills a grid from a rack so every row and column adds to its target. Cipher is the cryptarithm: every letter stands for a different digit and exactly one assignment makes the equation true.',
    how: [
      'Sums is a crossword-shaped grid where every run adds to the total at its head, digits 1 to 9 with no repeats in a run. Carve is about where to cut. Tally is about where to place. Cipher is the one with no grid to fill: it is an equation in letters, and the digits are the answer.',
    ],
    faq: [
      ['Can a kakuro run repeat a digit?', 'No. Digits 1 to 9, each at most once in a run, which is most of what makes it solvable.'],
      ['Are they free?', 'All four, every day, no account required.'],
    ],
  },
  // ── End Game ────────────────────────────────────────────────────────────
  { name: 'Chess endings', page: '/chess-puzzles' },
  {
    name: 'Board endgames', slug: 'board-endgames', circuit: 'chess-board',
    eyebrow: 'Free daily board game endgame puzzles',
    title: 'Free Daily Board Game Endgames: Connect Four, Checkers, Dots and Boxes, Othello | Mind Loft',
    h1: 'Free Daily Board Game Endgames: Connect Four, Checkers, Dots and Boxes and Othello',
    description: 'Four free daily endgame puzzles from board games other than chess: a won Connect Four position with one column that keeps it, a checkers sweep in three, a dots-and-boxes endgame where the free box is the trap, and an Othello ending with ten squares left. Played out against an engine. No signup.',
    lede: 'Four endgames from four boards, each a position you are already winning with exactly one move that keeps it. Four is Connect Four: one column wins and a wrong drop is not taken back. Check is checkers: take every black piece inside three. Chain is dots and boxes with the safe edges gone. Turn is Othello with ten squares left, where flipping the fewest discs is the habit that wins.',
    how: [
      'None of these is checked against a key. The position is played out against an engine that defends as well as it can, and the round ends when the game does, so a wrong move is not announced while you can still play. The board ranks solvers by how many attempts the solve took, and a replay counts.',
    ],
    faq: [
      ['Do I need to know the games?', 'The rules are stated on each page and the engine enforces them. The puzzle is reading the position a few moves deep.'],
      ['Are they free?', 'All four, every day, no account required.'],
    ],
  },
];

// The set rows, joined to their groups (roster, category) and their category
// page (slug, generic labels). A set the copy above does not name is still
// listed on its category page, with a page only if it has copy.
export const PUZZLE_SETS = GROUPS.map((g) => {
  const s = SETS.find((x) => x.name === g.name) || {};
  const catSlug = CAT_TO_SLUG[g.cat];
  const href = s.page || (s.slug ? `/${catSlug}/${s.slug}` : null);
  return { ...s, name: g.name, cat: g.cat, keys: g.keys, catSlug, href, own: !!(s.slug && !s.page) };
});

export function setsIn(cat) {
  return PUZZLE_SETS.filter((s) => s.cat === cat);
}

// The set page for /<catSlug>/<setSlug>, or null.
export function puzzleSet(catSlug, setSlug) {
  return PUZZLE_SETS.find((s) => s.own && s.catSlug === catSlug && s.slug === setSlug) || null;
}

// Every set with a page of its own, for the sitemap.
export function ownSets() {
  return PUZZLE_SETS.filter((s) => s.own);
}

// The set's games, live only, in group order, each with a generic label: the
// set's own if it names one, else the category page's, else the tag.
export function setGames(set, today) {
  const live = liveDailyKeys(today);
  const cat = PUZZLE_CATEGORY_MAP[set.catSlug];
  const gen = { ...((cat && cat.generic) || {}), ...(set.generic || {}) };
  return set.keys.filter((k) => live.includes(k) && DAILY_GAME_MAP[k])
    .map((k) => ({ ...DAILY_GAME_MAP[k], generic: gen[k] || DAILY_GAME_MAP[k].tag }));
}

// The set a game belongs to, with its href, or null (ungrouped categories).
export function setOfGame(key) {
  return PUZZLE_SETS.find((s) => s.keys.includes(key)) || null;
}
