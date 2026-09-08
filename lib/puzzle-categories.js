// PUZZLE CATEGORY LANDING PAGES (Search Console audit, 2026-09-01).
//
// WHY. An individual daily ranks for its own name and little else: "cages"
// and "lode" are not what a stranger types. The terms with volume are the
// generic ones, "free online sudoku", "daily crossword", "logic puzzles", and
// no game page can carry them, because each is about ONE game. These pages
// are the ones that can: one per category, an H1 that is the query, a card
// per game with the GENERIC name first and ours second, real prose about how
// the puzzles work, and a link to every game in the set.
//
// THEY ARE ENTRY PAGES, NOT A NEW STEP IN THE FLOW. A returning player never
// needs one; they are for someone arriving from a search who has not heard of
// any of the games. Two places link them so they are not orphans (an orphan
// gets no PageRank, and the whole point is to give one): the category label
// in every game's cap (app/StageChrome.jsx) and the category labels in the
// daily roster in both footers (app/DailyRoster.jsx). Neither changes what a
// player sees beyond an underline.
//
// The roster of each page comes from lib/daily-games.js at render time, so a
// new game appears on its category page the day its registry row lands; only
// the generic label and the prose are written here. `keys` fixes the order
// (easiest first) where that matters and otherwise falls back to roster order.
//
// COPY RULES: no em dash (site copy rule), no answers, nothing that goes stale
// (no clue counts that a bank regeneration would move, except where the game's
// own page already states them).

import { DAILY_GAME_MAP, liveDailyKeys } from './daily-games.js';

export const PUZZLE_CATEGORIES = [
  {
    slug: 'sudoku',
    cat: 'Sudoku',
    label: 'Sudoku',
    eyebrow: 'Free online sudoku',
    title: 'Free Daily Sudoku: Thirteen Variants, One New Board Every Day | Mind Loft',
    h1: 'Free Daily Sudoku: Thirteen Variants, One New Board Every Day',
    description: 'Play free sudoku online: classic 9x9, a two-minute 6x6, ten variants (diagonal, jigsaw, killer, sandwich, frame, outside, thermo, kropki, anti-knight, skyscrapers) and one played backwards. One logical solution, never a guess, a new board every day, no signup.',
    lede: 'Classic 9x9, a two-minute 6x6, ten variant sudokus you will not find together anywhere else (diagonal, jigsaw, killer, sandwich, frame, outside, thermo, kropki, anti-knight and skyscrapers) and one played backwards, where the grid arrives solved and you take the clues out of it. Every board has one solution you can reach by logic alone, never a guess. No app, no signup, and a leaderboard decided on the clock.',
    keys: ['sixes', 'suds', 'diag', 'quilt', 'towers', 'mercury', 'sando', 'frame', 'rim', 'knight', 'cages', 'polka', 'whittle'],
    generic: {
      sixes: 'Mini sudoku, 6x6', suds: 'Classic sudoku, 9x9', diag: 'Diagonal sudoku (Sudoku X)', quilt: 'Jigsaw sudoku', towers: 'Skyscrapers',
      mercury: 'Thermo sudoku', sando: 'Sandwich sudoku', frame: 'Frame sudoku', rim: 'Outside sudoku', knight: 'Anti-knight sudoku', cages: 'Killer sudoku', polka: 'Kropki sudoku',
      whittle: 'Sudoku in reverse',
    },
    circuit: 'sudoku',
    howTitle: 'How to play sudoku',
    how: [
      'Fill the grid so that every row, every column and every box contains each digit exactly once. That is the whole rule. The skill is in reading what the printed clues force: a square where only one digit can go (a naked single), a digit that has only one square left in a house (a hidden single), and further up, pairs and locked candidates.',
      'Every Mind Loft board is checked before it ships so that the full solution is reachable by those techniques alone. If you find yourself guessing, there is a deduction you have not spotted yet, and the notes tool is the way to find it.',
    ],
    startTitle: 'Which variant should I start with?',
    start: 'Sixes if you have two minutes. Suds if you want the classic. Diag and Quilt are the gentlest steps into variants because the rules barely change: Diag adds the two diagonals as houses, Quilt only reshapes the boxes. Cages, Sando and Frame add arithmetic, Mercury and Polka add ordering, Knight and Towers change what sees what, and Rim prints nothing inside the grid at all. Whittle is the odd one out and worth saving until the rest feel easy: it hands you a solved grid and asks you to take the clues out of it.',
    week: [
      ['Monday', 'The most printed clues of the week. Singles only.'],
      ['Wednesday to Friday', 'Fewer clues; locked candidates and pairs start to appear.'],
      ['Saturday', 'The hardest weekday board.'],
      ['Sunday Edition', 'Bigger or sparser: a 7x7 Towers, a Mercury with eight printed digits, a Sando with six, a Frame with two, a Knight with thirteen, a Diag with fourteen, a Rim with thirteen of its thirty-six gutters.'],
    ],
    faq: [
      ['Is one of them not a fill-in sudoku?', 'Whittle is the reverse. The grid arrives solved with eighteen clues printed on it and you remove clues, one at a time, for as long as the grid still has exactly one answer. It is the same reasoning about what a clue is doing, asked from the other end.'],
      ['Is it really free, with no signup?', 'Yes. Every board is free in the browser. Signing up only puts your name on the leaderboard and keeps your streak across devices.'],
      ['Can I play yesterday’s puzzle?', 'Every past board is in the puzzle archive, unscored, so you can practice a variant before the day’s board counts.'],
      ['What is the Sudoku circuit?', 'Five of the twelve fill-in sudokus, rotating one a day, played as one run with one combined leaderboard.'],
      ['Do the puzzles ever need a guess?', 'No. Each board is proved to have exactly one solution and to fall to logic. Two independent solvers check every bank before it goes live.'],
    ],
  },
  {
    slug: 'crosswords',
    cat: 'Word',
    label: 'Crosswords',
    eyebrow: 'Free daily crossword puzzles',
    title: 'Free Daily Crossword Puzzles: Mini, Full-Size, Codeword and More | Mind Loft',
    h1: 'Free Daily Crossword Puzzles: Mini, Full-Size, Codeword and More',
    description: 'Play a free crossword every day: a five-by-five mini, a nine-by-nine full crossword, a codeword, a jigsaw crossword, an acrostic and a clueless crossword. New puzzles at midnight Eastern, no signup.',
    lede: 'A five-by-five mini you finish with your coffee, a nine-by-nine for a proper sit-down, and four cousins that keep the grid and change the clues: a codeword, a jigsaw crossword, an acrostic and a crossword with no clues at all. New puzzles every day at midnight Eastern, all free, no signup.',
    keys: ['emcee', 'encore', 'crux', 'glyph', 'shards', 'anon'],
    generic: {
      emcee: 'Mini crossword, 5x5', encore: 'Daily crossword, 9x9', crux: 'Clueless crossword', glyph: 'Codeword',
      shards: 'Jigsaw crossword', anon: 'Acrostic',
    },
    circuit: 'crosswords',
    howTitle: 'How the crosswords differ',
    how: [
      'Emcee and Encore are crosswords in the ordinary sense: fair clues, every square crossed both ways, and a timer that stops the moment the grid is right. Encore runs eleven by eleven on Sundays.',
      'The other four keep the interlocking grid and take the clues away. Glyph gives every letter a number and two starting letters. Shards shatters a solved grid into lettered pieces you fit back together. Anon hands you a passage and a bank of answers whose first letters spell its author. Crux gives you four category hints and an empty grid.',
    ],
    startTitle: 'Where to start',
    start: 'Emcee if you have a minute. Encore if you want a real crossword. Glyph is the easiest of the clueless four because the crossings do most of the work; Crux is the hardest, and the one most people come back for.',
    week: [
      ['Monday to Saturday', 'The grids get tighter and the clues less direct as the week goes on.'],
      ['Sunday Edition', 'Emcee grows to 7x7, Encore to 11x11, Crux to twelve hidden words.'],
    ],
    faq: [
      ['Are the crosswords free?', 'Yes, every one, every day. An account only keeps your streak and puts your time on the leaderboard.'],
      ['Can I check a square?', 'Emcee and Encore have a check control and count checks on the leaderboard, so a clean solve ranks above a checked one at the same time.'],
      ['Is there an archive?', 'Every past grid is in the puzzle archive and can be replayed unscored.'],
    ],
  },
  {
    slug: 'word-games',
    cat: 'Word',
    label: 'Word games',
    eyebrow: 'Free daily word games',
    title: 'Free Daily Word Games: Word Puzzles, Ladders, Scrambles and Crosswords | Mind Loft',
    h1: 'Free Daily Word Games: Puzzles, Ladders, Scrambles and Crosswords',
    description: 'Seventeen free daily word games in one place: word ladders, a compound-word chain, scrambles, hidden-group puzzles, a hotter-or-colder word hunt, tile games, a copy-editing puzzle and six crosswords. A new puzzle in each at midnight Eastern.',
    lede: 'Seventeen word games, one new puzzle in each every day. Ladders, a compound-word chain, scrambles, a hotter-or-colder word hunt, a copy-desk puzzle where you fix the sentence, tile games with a proven best score, and six crosswords. All free, no signup, and each has its own leaderboard.',
    keys: ['garble', 'rung', 'hinge', 'links', 'warmer', 'stet', 'strata', 'lode', 'barter', 'tuck', 'babel', 'emcee', 'encore', 'crux', 'glyph', 'shards', 'anon'],
    generic: {
      garble: 'Word scramble', rung: 'Word ladder', hinge: 'Compound-word chain', links: 'Hidden groups', warmer: 'Hotter or colder', stet: 'Copy-editing puzzle',
      strata: 'Word excavation', lode: 'Make words from seven letters', barter: 'Letter trade', tuck: 'Tile scoring', babel: 'Tile endgame',
      emcee: 'Mini crossword', encore: 'Daily crossword', crux: 'Clueless crossword', glyph: 'Codeword', shards: 'Jigsaw crossword', anon: 'Acrostic',
    },
    circuit: 'wordplay',
    howTitle: 'What kind of word game do you want?',
    how: [
      'Some of these are about finding words: Lode gives you seven letters and pays more for rarer finds, Garble hands you five scrambles, Rung asks you to walk one word to another a letter at a time. Some are about meaning: Warmer scores every guess by how close it is to a secret word, Links asks you to sort sixteen words into four hidden groups, Stet hides one wrong word in a sentence.',
      'The tile games are the deepest. Tuck deals everyone the same fourteen letters and ranks the highest-scoring board; Babel is an endgame where the bag is empty and the best line is knowable; Barter trades two letters at a time toward six hidden words on a budget of the proven minimum plus five.',
    ],
    startTitle: 'Where to start',
    start: 'Garble or Rung if you want something quick. Links if you like sorting. Warmer if you like a slow hunt. The crosswords have a page of their own.',
    week: [
      ['Monday to Saturday', 'Each game ramps through the week: rarer words, longer ladders, tighter groups.'],
      ['Sunday Edition', 'Garble goes to six-letter words, Tuck to a fifteen-letter rack, Links to four cross-category traps, Warmer to a rarer secret.'],
    ],
    faq: [
      ['Which word list do the games use?', 'The tile games and Shards check against a Scrabble list, which is broader than everyday English; the answer games use common words only.'],
      ['Are they free?', 'All of them, every day, with no account required.'],
    ],
  },
  {
    slug: 'logic-puzzles',
    cat: 'Logic',
    label: 'Logic puzzles',
    eyebrow: 'Free daily logic puzzles',
    title: 'Free Daily Logic Puzzles: Nonograms, Slitherlink, Deduction Grids and More | Mind Loft',
    h1: 'Free Daily Logic Puzzles: Nonograms, Slitherlink, Deduction Grids and More',
    description: 'Eighteen free daily logic puzzles: a nonogram, slitherlink, shikaku, three sizes of sliding block puzzle, whodunit deduction grids, liar puzzles and more. Every board has exactly one solution reachable by logic. New puzzles at midnight Eastern, no signup.',
    lede: 'Eighteen logic puzzles with one new board apiece every day. Pencil-and-paper classics (a nonogram, a slitherlink loop, shikaku rectangles, a sliding block puzzle in three sizes) alongside deduction puzzles built around suspects, liars, hidden rules and results tables. Every board has exactly one solution and can be reached without a guess.',
    keys: ['etch', 'hedge', 'plot', 'park', 'impound', 'junkyard', 'paths', 'jester', 'fib', 'axiom', 'venn', 'stands', 'alibi', 'sworn', 'hearsay', 'docket', 'suffice', 'chomp'],
    generic: {
      etch: 'Nonogram (picross)', hedge: 'Slitherlink', plot: 'Shikaku', park: 'Sliding block puzzle', impound: 'Sliding block puzzle (larger board)', junkyard: 'Sliding block puzzle (largest board)', paths: 'Network puzzle',
      jester: 'Queens placement', fib: 'Inequality grid with a liar', axiom: 'Find the hidden rule', venn: 'Set logic', stands: 'Results table deduction',
      alibi: 'Whodunit deduction grid', sworn: 'Liar puzzle', hearsay: 'Knowledge puzzle', docket: 'Analytical reasoning', suffice: 'Data sufficiency', chomp: 'Route puzzle',
    },
    circuit: 'deduction',
    howTitle: 'Two kinds of logic puzzle',
    how: [
      'The grid puzzles are the ones you may know from puzzle books. Etch is a nonogram: fill the squares the row and column counts force and a picture appears. Hedge is slitherlink: draw one closed loop so every number has that many sides on it. Plot is shikaku: cut the board into rectangles so each number owns exactly its own. Parker is the sliding block puzzle where you get the red one out, and Impound and Junkyard are the same puzzle on bigger lots.',
      'The deduction puzzles give you statements instead of a grid. Alibi narrows four suspects to one across three boards. Sworn has five sworn statements with an exact number of lies. Hearsay works out what two people can and cannot know. Docket and Suffice are the reasoning sections of two well-known standardized tests, one setup and five questions, or two statements and a verdict on whether they settle it.',
    ],
    startTitle: 'Where to start',
    start: 'Etch or Plot if you like a grid. Alibi if you like a whodunit. Axiom if you want something nobody else has: one hidden rule and a handful of tests to tell five candidate rules apart.',
    week: [
      ['Monday to Saturday', 'Bigger boards and fewer givens as the week goes on.'],
      ['Sunday Edition', 'Etch runs 20x20, Hedge 10x10, Alibi seats five suspects, Sworn swears six.'],
    ],
    faq: [
      ['Do any of these need a guess?', 'No. Every board is proved to fall to logic alone by a solver that is independent of the one that generated it.'],
      ['Are they free?', 'All sixteen, every day, no account required.'],
    ],
  },
  {
    slug: 'number-puzzles',
    cat: 'Numbers',
    label: 'Number puzzles',
    eyebrow: 'Free daily number puzzles',
    title: 'Free Daily Number Puzzles and Math Games | Mind Loft',
    h1: 'Free Daily Number Puzzles and Math Games',
    description: 'Eight free daily number puzzles: a countdown-style numbers game, a cryptarithm, mental arithmetic against the clock in two sizes, a calculator path, a kakuro, and grid puzzles about sums. New boards at midnight Eastern, no signup.',
    lede: 'Eight number puzzles, one new board in each every day. A six-numbers-one-target game, a cryptarithm where every letter is a digit, mental arithmetic against a clock with two numbers a line or three, a calculator you walk across, a kakuro, and three grid puzzles about sums. For sudoku, there is a page of its own.',
    keys: ['blitz', 'blitzed', 'crunch', 'calc', 'tally', 'carve', 'cipher', 'sums'],
    generic: {
      blitz: 'Mental math', blitzed: 'Three-number mental math', sums: 'Kakuro', crunch: 'Numbers game', calc: 'Calculator path', tally: 'Sum grid', carve: 'Equal-sum blocks', cipher: 'Cryptarithm',
    },
    circuit: 'mental-math',
    howTitle: 'What each one asks',
    how: [
      'Crunch gives you six numbers and a three-digit target: add, subtract, multiply and divide to hit it exactly. Blitz is twenty mental arithmetic problems, fifteen seconds each, one wrong answer ends the run; Blitzed is the same ladder with three numbers on every line, like 5 + 10 × 2, and twenty seconds. Calc is a keypad where the buttons alternate number and operator, so the route you walk from the first key to the last is a sum that has to land on the target.',
      'Cipher is a cryptarithm: every letter stands for a different digit and exactly one assignment makes the equation true. Tally fills a grid from a rack so every row and column adds to its target; Carve slices the grid into blocks that each add to the same number. Sums is the kakuro: a crossword-shaped grid where every run of squares adds up to the total at its head, digits 1 to 9, no repeats.',
    ],
    startTitle: 'Where to start',
    start: 'Blitz if you want a sprint, Blitzed if you want the sprint with a second step. Crunch if you liked the television version. Cipher if you want to think for ten minutes.',
    week: [
      ['Monday to Saturday', 'Bigger targets, more addends, less slack in the grids.'],
      ['Sunday Edition', 'Cipher stacks four addends, Tally grows to 6x6, Carve to a 7x7 in nine blocks.'],
    ],
    faq: [
      ['Is any of this timed?', 'Blitz and Blitzed are; the rest are scored on accuracy and steps, with the clock as the tiebreak.'],
      ['Are they free?', 'Yes, all of them, every day.'],
    ],
  },
  {
    slug: 'trivia-games',
    cat: 'Trivia',
    label: 'Trivia games',
    eyebrow: 'Free daily trivia games',
    title: 'Free Daily Trivia Games and Quizzes: One Life, Twenty-Five Questions | Mind Loft',
    h1: 'Free Daily Trivia Games: One Life, Twenty-Five Questions',
    description: 'Free daily trivia games: one-life gauntlets in sports, business, geography, film and quotations, a forty-question grab bag, and picture, headline, year and ranking puzzles. New questions every day, no signup.',
    lede: 'A shelf of trivia games with new questions every day. Seven one-life gauntlets where the questions climb from gimme to expert and one wrong answer ends the run, plus a zoomed-photo puzzle, a redacted-headline puzzle, a guess-the-year game and a ranking puzzle. All free, no signup, one leaderboard each.',
    keys: ['streak', 'deep', 'sport', 'atlas', 'biz', 'script', 'quotes', 'focus', 'thread', 'slot', 'extra', 'circa', 'dating', 'listed', 'bracket', 'niche', 'redact'],
    generic: {
      streak: 'Forty-question gauntlet', deep: 'One-topic gauntlet', sport: 'Sports trivia', atlas: 'Geography trivia', biz: 'Business trivia',
      script: 'Film and TV trivia', quotes: 'Who said it', focus: 'Zoomed photo', thread: 'Films described badly', slot: 'Blind ranking', extra: 'Redacted headline',
      circa: 'Guess the year', dating: 'Put history in order', listed: 'Ranking puzzle', bracket: 'Bracket of facts', niche: 'Trivia grid', redact: 'Uncover the article',
    },
    circuit: 'gauntlet',
    howTitle: 'How the gauntlets work',
    how: [
      'Streak, Deep, Sport, Atlas, Biz, Script and Quotes share one shape: a bank of four-choice questions in five tiers, twenty seconds a question, and one life. Everyone gets the same questions in the same order, so the leaderboard is a straight count of how far you got. Play five of them back to back as the Trivia Gauntlet and there is one combined board.',
      'The rest are puzzles rather than quizzes. Focus shows one photo at nine times zoom and pulls back a frame per miss. Extra redacts a historic headline and tears a word free with every wrong guess. Circa narrows the year with each miss. Listed asks you to rank eight real things top to bottom, and Slot deals ten things one at a time and makes you place each before you see the next.',
    ],
    startTitle: 'Where to start',
    start: 'Streak if you want the classic pub-quiz feel. Sport, Biz or Script if you have a specialty. Focus if you would rather look than read.',
    week: [
      ['Every day', 'The gauntlets run the same shape every day; the puzzles ramp through the week.'],
      ['Sunday Edition', 'Thread runs sixteen films and two threads, Slot twelve slots, Dating six events, Niche a 4x4 grid on countries.'],
    ],
    faq: [
      ['Are the questions the same for everyone?', 'Yes. Same questions, same order, same day, which is what makes the board fair.'],
      ['Are they free?', 'All of them, every day, no account required.'],
    ],
  },
  {
    slug: 'geography-games',
    cat: 'Geography',
    label: 'Geography games',
    eyebrow: 'Free daily geography games',
    title: 'Free Daily Geography Games: Borders, Distances and Countries | Mind Loft',
    h1: 'Free Daily Geography Games: Borders, Distances and Countries',
    description: 'Four free daily geography games: guess a secret city by distance, chain countries across shared borders, name every neighbor of a country, and a twenty-five-question geography gauntlet. New puzzles at midnight Eastern, no signup.',
    lede: 'Four geography games, one new puzzle in each every day. Home in on a secret city by the miles to it, cross the map by the shortest chain of land borders, name every neighbor of one country before three strikes, and run a twenty-five-question gauntlet with one life.',
    keys: ['ping', 'span', 'flank', 'atlas'],
    generic: { ping: 'Guess the city by distance', span: 'Border chain', flank: 'Name every neighbor', atlas: 'Geography gauntlet' },
    circuit: 'spatial',
    howTitle: 'How they play',
    how: [
      'Ping tells you the exact distance from each city you guess to the secret one, so every guess is a circle and the answer is where the circles meet. Span asks for the shortest chain of countries that share a land border between two you are given. Flank names one country and every country that borders it is an answer, with three wrong ones ending the run.',
      'Atlas is the geography gauntlet: five rounds of five cycling capitals, the physical world, flags and borders, places and landmarks, and countries and peoples, one life, twenty seconds a question.',
    ],
    startTitle: 'Where to start',
    start: 'Flank if you know your borders. Ping if you like triangulating. Atlas if you want a quiz.',
    week: [
      ['Monday to Saturday', 'Flank climbs from a single border on Monday to seven on Saturday; Ping picks a more out-of-the-way city as the week goes on.'],
      ['Sunday Edition', 'Flank hands you a giant with eight or more borders and a fourth strike; Span adds a country to route through or avoid.'],
    ],
    faq: [
      ['Which borders count?', 'Land borders between sovereign states, as the maps draw them today.'],
      ['Are they free?', 'Yes, all four, every day.'],
    ],
  },
  {
    slug: 'chess-puzzles',
    cat: 'End Game',
    label: 'Chess puzzles',
    eyebrow: 'Free daily chess puzzles',
    title: 'Free Daily Chess Puzzles: Mate in Two, Defend the Mate, Win the Endgame | Mind Loft',
    h1: 'Free Daily Chess Puzzles: Mate in Two, Defend the Mate, Win the Endgame',
    description: 'Three free daily chess puzzles played out against a real engine: find the forced mate in two, survive as Black against a mating attack, and convert a king-and-pawn endgame move by move. New positions at midnight Eastern, no signup.',
    lede: 'Three chess puzzles a day, each played out against an engine rather than checked against a key. Find the one move that forces mate and then deliver it against the most stubborn defence; find the one move that saves Black and keep finding it; walk a king-and-pawn endgame to promotion with every move exact.',
    keys: ['mate', 'defend', 'queen'],
    generic: { mate: 'Mate in two', defend: 'Defend the mate', queen: 'King and pawn endgame' },
    circuit: 'chess',
    howTitle: 'How these differ from a tactics trainer',
    how: [
      'A tactics trainer stops you at the first wrong move. These do not: the position is played out, the engine defends as well as it can, and the round ends only when the game does. So a move the key did not list but which forces mate anyway wins on its merits, and a mistake is not announced while you can still play.',
      'Mate is White to play and force checkmate in two against the best defence. Defend is Black to play and survive: White is threatening mate, several moves look like they answer it and exactly one does, and finding it only buys you the next one. Queen is a king-and-pawn endgame you are already winning, where one first move keeps the win and every move of the walk has to be exact.',
    ],
    startTitle: 'Where to start',
    start: 'Mate if you have done tactics puzzles before. Queen if you want to learn endgames. Defend is the hardest of the three.',
    week: [
      ['Monday to Saturday', 'Longer forcing lines and more plausible wrong moves as the week goes on.'],
      ['Sunday Edition', 'Defend asks for a hold of four moves; Queen asks for a win in twelve.'],
    ],
    faq: [
      ['What happens if I play a wrong move?', 'The game continues. The board ranks solvers by how many attempts the solve took, so you can replay the position and the replay counts.'],
      ['Are they free?', 'Yes, all three, every day.'],
    ],
  },
];

export const PUZZLE_CATEGORY_MAP = Object.fromEntries(PUZZLE_CATEGORIES.map((c) => [c.slug, c]));

export function puzzleCategory(slug) {
  return PUZZLE_CATEGORY_MAP[slug] || null;
}

// The games a category page lists, in its order, live only. A key named in
// `keys` that has retired drops out; a live game in the category not named in
// `keys` is appended in roster order so nothing new is missed.
export function categoryGames(cat, today) {
  const live = liveDailyKeys(today);
  const named = (cat.keys || []).filter((k) => live.includes(k));
  const rest = cat.slug === 'crosswords' || cat.slug === 'chess-puzzles' ? [] // curated subsets, not the whole category
    : live.filter((k) => DAILY_GAME_MAP[k] && DAILY_GAME_MAP[k].cat === cat.cat && !named.includes(k));
  return [...named, ...rest].map((k) => ({ ...DAILY_GAME_MAP[k], generic: (cat.generic || {})[k] || DAILY_GAME_MAP[k].tag }));
}

// The category page a registry `cat` label links to, or null. Sudoku, Word,
// Logic, Numbers, Trivia and Geography each have one; End Game maps to the
// chess page only for the three chess titles (see categoryHrefForGame).
const CAT_TO_SLUG = { Sudoku: 'sudoku', Word: 'word-games', Logic: 'logic-puzzles', Numbers: 'number-puzzles', Trivia: 'trivia-games', Geography: 'geography-games' };

export function categoryHref(cat) {
  const slug = CAT_TO_SLUG[cat];
  return slug ? `/${slug}` : null;
}

export function categoryHrefForGame(key) {
  if (key === 'mate' || key === 'defend' || key === 'queen') return '/chess-puzzles';
  const g = DAILY_GAME_MAP[key];
  return g ? categoryHref(g.cat) : null;
}
