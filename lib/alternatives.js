// THE ALTERNATIVES PAGES (owner, 2026-11-28): one "<site> alternative" page per
// peer (NYT Games, Sporcle, Puzzmo, LinkedIn Games, Merriam-Webster, JetPunk,
// The Atlantic, Washington Post, Lumosity) and a small hub over them. Owner
// 2026-11-28: keep the "no ads" line on every page for now.
//
// WHY. A search for a competitor's brand ("nyt connections") is navigational
// and will not click a Mind Loft result. A search for "games like Connections",
// "free alternative to NYT Games" or "sites like Sporcle" is a reader looking
// for something new, and that is the click these pages are built to win. Each
// page maps the other site's best known puzzles to the closest Mind Loft daily,
// with a real paragraph per match, so the page reads as a guide and not a
// doorway page.
//
// RULES FOR THE COPY.
// - Name the other sites in plain text only: no logos, no styling, nothing
//   that suggests an affiliation. The footnote on every page says so.
// - Fair and factual about them. No claims about their ads, speed or design,
//   and nothing that goes stale fast (their prices, their exact paywall line).
// - Honest matches: where Mind Loft has no close copy (Wordle, Typeshift,
//   Memoku), say so and point at the nearest thing.
// - "Puzzles", not "games", in Mind Loft copy (the other sites' own product
//   names keep their word). No em dash. Title Case headings.
// - Every Mind Loft key must be a live daily: the page drops a key that is not
//   in DAILY_GAME_MAP, and scripts/verify-alternatives.mjs fails on one.
//
// LINKS. Footer (one link to the hub), /guides "More", each page to the other
// two, and a one-line pointer on the game page of each primary match
// (ALT_FOR_GAME below, read by app/StageTail.jsx).

export const ALTERNATIVES_UPDATED = '2026-11-28';

export const NOT_AFFILIATED = 'Mind Loft is an independent puzzle site and is not affiliated with any site named on this page. Their names and puzzle names are used only to describe and compare, and belong to their owners.';

export const ALTERNATIVES = [
  {
    slug: 'nyt-games-alternative',
    site: 'NYT Games',
    short: 'NYT Games',
    title: 'Free NYT Games Alternative: Puzzles Like Connections | Mind Loft',
    h1: 'A Free Alternative to NYT Games',
    description: 'Like Connections, Spelling Bee, Strands or the Mini? Mind Loft has 200+ free daily puzzles in the same spirit. A new board every midnight Eastern, no signup.',
    lede: "If your morning already runs through Wordle, Connections and the Mini, Mind Loft is a place to keep going. It is a free daily puzzle site with more than 200 dailies: word puzzles, crosswords, more than 40 kinds of sudoku, logic grids, trivia and card puzzles. Some of the NYT's daily puzzles, including the full crossword, sit behind a Games subscription. Every Mind Loft daily is free to play in full, with no ads. Below, each NYT puzzle is matched with the Mind Loft daily that plays most like it.",
    matches: [
      {
        theirs: 'Connections',
        keys: ['links', 'venn'],
        body: 'Links is the closest match on the site: sixteen words, four hidden groups, and four mistakes to spare. If you like the moment a red herring falls apart, Venn is the next stop. It asks you to sort twelve words into overlapping circles, so some words belong to two groups at once.',
      },
      {
        theirs: 'Spelling Bee',
        keys: ['lode', 'tuck'],
        body: 'Lode gives you seven letters and pays more for rarer words, so the long, odd finds count most, much like chasing a pangram. Tuck is the scoring cousin: fourteen shared letters and one best board, with the daily leaderboard deciding who used them best.',
      },
      {
        theirs: 'Strands',
        keys: ['strata', 'scour'],
        body: 'Strata buries words in a letter grid and every word you lift drops the letters above it, so the order you dig in matters. If you play Strands for the themed hunt, Scour is a themed word search on a 15 by 15 grid, against the clock.',
      },
      {
        theirs: 'The Crossword and the Mini',
        keys: ['emcee', 'encore', 'crux'],
        body: 'Emcee is a five by five daily mini with fair clues, about the length of a coffee. Encore is the bigger nine by nine grid, with larger Sunday boards. Crux is something the NYT does not run: a clueless crossword, eight interlocking words worked out from four category hints.',
      },
      {
        theirs: 'Wordle',
        noCopy: true,
        keys: ['warmer', 'ping', 'dossier'],
        body: "Mind Loft does not run a five-letter copy of Wordle. If what you like is guessing toward a hidden answer with feedback after each try, Warmer scores every guess by how close its meaning is to the secret word, Ping tells you how many miles your guess is from a secret city, and Dossier hands back five clues on every guess at a hidden president, element or state.",
      },
      {
        theirs: 'Sudoku',
        keys: ['suds', 'sixes', 'cages'],
        body: 'Suds is the classic 9 by 9, one answer and all logic. Sixes is a two-minute 6 by 6 for busy days, and Cages is a daily killer sudoku. Beyond those, the sudoku page holds more than 40 daily variants, from thermo and arrow to a 16 by 16 Giant.',
      },
      {
        theirs: 'Pips',
        keys: ['snug', 'plot'],
        body: 'Snug asks you to fit every piece onto a board where only one arrangement works, which scratches the same place-the-pieces itch as Pips. Plot cuts a board into rectangles of the sizes shown, another pure logic puzzle with no words at all.',
      },
      {
        theirs: 'Tiles',
        keys: ['mahj', 'pairs'],
        body: 'Mahj is a daily mahjong solitaire: clear 144 layered tiles in matching pairs. Pairs is concentration with a real deck, thirty-six cards face down. Both reward a calm eye for matching patterns.',
      },
      {
        theirs: 'Letter Boxed',
        noCopy: true,
        keys: ['hinge', 'rung'],
        body: 'There is no Letter Boxed on Mind Loft, but if you like chaining words, Hinge builds a six-word chain where each neighbouring pair makes a phrase, and Rung is a word ladder that changes one letter a rung.',
      },
    ],
    differences: [
      ['No Ads', 'No banners, no video ads and no pop-ups in the middle of a puzzle.'],
      ['Every Daily Is Free in Full', 'No subscription and no daily limit. An account only keeps your streak and puts your time on the leaderboard.'],
      ['More Kinds of Puzzle', 'More than 200 dailies across word puzzles, crosswords, sudoku, logic, trivia, geography, chess and cards, so there is always one more after the usual few.'],
      ['Leaderboards Count the First Try', 'Each daily has a leaderboard, and only your first try counts, so a score means the same thing for everyone.'],
      ['An Archive You Can Replay', 'Every past board of every daily is in the puzzle archive, free to replay unscored.'],
    ],
    faq: [
      ['Is there a free alternative to NYT Games?', 'Yes. Mind Loft is a free daily puzzle site with more than 200 dailies, including puzzles like Connections (Links), Spelling Bee (Lode) and the Mini (Emcee). No subscription is needed to play any of them in full.'],
      ['What is a good puzzle like Connections?', 'Links on Mind Loft: sixteen words to sort into four hidden groups, with a new board every day. Venn is a harder cousin where some words belong to two groups.'],
      ['Is there a free crossword like the NYT Crossword?', 'Mind Loft runs Emcee, a free five by five daily mini, and Encore, a free nine by nine daily crossword with bigger Sunday grids. Crux is a clueless crossword you solve from category hints.'],
      ['Is Mind Loft part of The New York Times?', 'No. Mind Loft is an independent puzzle site. NYT Games and its puzzle names belong to The New York Times.'],
    ],
  },
  {
    slug: 'sporcle-alternative',
    site: 'Sporcle',
    short: 'Sporcle',
    title: 'Sporcle Alternative: Free Trivia Quizzes, No Ads | Mind Loft',
    h1: 'A Sporcle Alternative for Quizzes and Daily Puzzles',
    description: 'Like Sporcle? Mind Loft has 2,000+ free quizzes, from name every country to map quizzes, plus 200+ free daily puzzles. No ads, no signup.',
    lede: 'Sporcle made the name-them-all quiz famous. Mind Loft has that too: more than 2,000 free quizzes on countries, capitals, flags, sports, film and more, with timers and leaderboards. Around them sits a set of more than 200 free daily puzzles, so there is something new every morning on top of the catalogue, and there are no ads anywhere. Below, each kind of Sporcle quiz is matched with where to find it on Mind Loft.',
    matches: [
      {
        theirs: 'Classic Name-Them-All Quizzes',
        quizzes: [['countries-of-the-world', 'Name Every Country in the World'], ['world-capitals', 'Name the Capital of Every Country'], ['flags-of-the-world', 'Name Every Country From Its Flag']],
        body: 'Type every answer you can before the clock runs out. These are the classics, and the full quiz index holds more than 2,000 more, from US states to the deep cuts.',
        more: [['/quizzes/all', 'Every quiz']],
      },
      {
        theirs: 'Map Quizzes',
        quizzes: [['erase-the-world-no-outline', 'Erase the World (No Outline)'], ['erase-europe-by-capital', 'Erase Europe by Capital'], ['fortune-500-hq-1', 'Fortune 500 HQ Hunt']],
        keys: ['ping', 'carmen', 'span'],
        body: 'The Erase quizzes clear a map as you name each country, with no outline to lean on in the hardest versions. HQ Hunt has you click where Fortune 500 companies keep their headquarters. For a daily map puzzle, Ping hides a city, Carmen sends you chasing a thief around the globe, and Span links two countries by shared borders.',
      },
      {
        theirs: 'Trivia Quizzes',
        keys: ['streak', 'deep', 'potluck'],
        body: 'Streak is forty mixed questions that climb from gimme to brutal. Deep takes one subject a day fifteen questions down. Potluck serves three catalogue quizzes a day under one score. Every past daily question is in the Trivia Database to play again.',
        more: [['/trivia-questions', 'Trivia Database'], ['/trivia-games', 'All trivia puzzles']],
      },
      {
        theirs: 'Logic Puzzles',
        keys: ['alibi', 'sudoclue', 'jester'],
        body: 'If you play the logic grid puzzles in the Sporcle Puzzle Library, Alibi is a nightly whodunit across three deduction boards, Sudoclue is a logic grid murder where you name the victim, killer and accomplice, and Jesters seats a royal court so no two rivals touch.',
      },
      {
        theirs: 'Acrostics and Crosswords',
        keys: ['anon', 'arcos', 'emcee'],
        body: 'Anon is a classic acrostic: the first letters of the answers spell the author of a hidden passage. Arcos is three small acrostics tied together by one last word. Emcee is a five by five daily mini crossword.',
        more: [['/acrostic-puzzles', 'Acrostic puzzles']],
      },
      {
        theirs: 'Word Ladders and Code Crackers',
        keys: ['rung', 'cipher', 'glyph'],
        body: 'Rung is a daily word ladder, one letter a rung. Cipher turns letters into digits and asks you to make the equation true, and Glyph is a crossword with no clues where every letter is a number.',
      },
      {
        theirs: 'Jigsaw Quizzes',
        keys: ['jig', 'saw', 'mural'],
        body: 'Jig is a new photograph every day cut into 80 pieces, and Saw is its tall sibling. Mural is one giant jigsaw that every player builds together.',
        more: [['/jig/shelf', 'Jigsaw Puzzle Shelf']],
      },
      {
        theirs: 'Head-to-Head Play',
        body: 'Finish any daily and you can send a friend a challenge to beat your result on the same board. Every daily also has its own leaderboard.',
        more: [['/challenges', 'Your challenges']],
      },
    ],
    differences: [
      ['No Ads', 'No banners, no video ads and no pop-ups eating the last seconds of a timed quiz.'],
      ['A Fresh Set Every Morning', 'More than 200 dailies reset at midnight Eastern, so there is always a new board on top of the quiz catalogue.'],
      ['Built for a Phone First', 'Quizzes and dailies are laid out for a phone screen, with typing, tapping and map clicks that work by thumb.'],
      ['First Try Counts', 'Daily leaderboards count only your first try, so a score means the same thing for everyone.'],
      ['Free, No Signup', 'Every quiz and every daily is free. An account only keeps your streak and your place on the board.'],
    ],
    faq: [
      ['What is a good alternative to Sporcle?', 'Mind Loft has more than 2,000 free quizzes in the same name-them-all and map formats, plus more than 200 free daily puzzles, from trivia gauntlets to logic grids and acrostics.'],
      ['Does Mind Loft have map quizzes like Sporcle?', 'Yes. The Erase quizzes clear a world or continent map as you name each country, and HQ Hunt has you click company headquarters on a US map. Ping, Carmen and Span are daily map puzzles.'],
      ['Are the quizzes free?', 'Yes, every quiz and every daily puzzle, with no ads. An account is optional and only keeps your streak and leaderboard place.'],
      ['Is Mind Loft part of Sporcle?', 'No. Mind Loft is an independent puzzle site. Sporcle and its quiz names belong to Sporcle, Inc.'],
    ],
  },
  {
    slug: 'puzzmo-alternative',
    site: 'Puzzmo',
    short: 'Puzzmo',
    title: 'Free Puzzmo Alternative: Daily Puzzles Like SpellTower | Mind Loft',
    h1: 'A Free Alternative to Puzzmo',
    description: 'Like SpellTower, Pile-Up Poker or the Puzzmo crossword? Mind Loft has 200+ free daily puzzles in the same spirit, with daily leaderboards. No signup.',
    lede: 'Puzzmo built a daily habit out of clever, original puzzles and a shared leaderboard. If you have finished the day there and want more, Mind Loft is a free daily puzzle site with more than 200 dailies: word puzzles, crosswords, sudoku, logic, chess endgames and card puzzles, each with its own leaderboard and no ads. Below, each Puzzmo puzzle is matched with the Mind Loft daily that plays most like it.',
    matches: [
      {
        theirs: 'Pile-Up Poker',
        keys: ['hands', 'hold'],
        body: 'Hands is the closest match on the site: deal 25 cards into a grid of ten poker hands and score the rows and columns. Hold is a different poker puzzle, ten hands against two rivals where you pick what to keep.',
      },
      {
        theirs: 'SpellTower',
        keys: ['strata', 'babel'],
        body: 'Strata buries words in a letter grid and each word you lift drops the letters above it, so you plan your way down the stack. Babel is a word-tile endgame: play out the last tiles for the best spread.',
      },
      {
        theirs: 'The Puzzmo Crossword',
        keys: ['encore', 'emcee', 'crux'],
        body: 'Encore is a nine by nine daily crossword with bigger Sunday grids, and Emcee is a five by five mini. Crux is a clueless crossword: eight interlocking words from four category hints.',
      },
      {
        theirs: 'Flipart',
        keys: ['snug', 'spin'],
        body: 'Snug asks you to fit every piece onto the board, and only one arrangement works. Spin is a photo cut into 36 turned squares that you tap back straight, a lighter rotate-the-pieces puzzle.',
      },
      {
        theirs: 'Typeshift',
        noCopy: true,
        keys: ['barter', 'garble'],
        body: 'Mind Loft has no letter dials, but Barter is close in feel: trade scrambled tiles two at a time until every row reads as a word. Garble untangles five scrambled words and then a clued finale.',
      },
      {
        theirs: 'Memoku',
        noCopy: true,
        keys: ['sixes', 'pairs', 'glimpse'],
        body: "There is no sudoku and memory hybrid on Mind Loft. For the sudoku half, Sixes is a quick 6 by 6. For the memory half, Pairs is concentration with a real deck, and Glimpse flashes a panel for two seconds and then asks one question about it.",
      },
      {
        theirs: 'Really Bad Chess',
        keys: ['mate', 'defend', 'swindle'],
        body: 'Mind Loft runs chess as daily puzzles rather than full games. Mate asks for the one move that forces checkmate, Defend puts you on defence against a mating threat, and Swindle asks White to find a draw from a lost position.',
        more: [['/chess-puzzles', 'All chess puzzles']],
      },
    ],
    differences: [
      ['No Ads', 'No banners, no video ads and no pop-ups in the middle of a puzzle.'],
      ['More Than 200 Dailies', 'Word puzzles, crosswords, more than 40 kinds of sudoku, logic grids, trivia, geography, chess and cards, every day.'],
      ['Free in Full', 'Every daily is free to play with no limit. An account only keeps your streak and puts your result on the leaderboard.'],
      ['First Try Counts', 'Daily leaderboards count only your first try, so a score means the same thing for everyone.'],
      ['Runs of Several Puzzles', 'Runs string several dailies into one session with one combined result, from a five-puzzle daily circuit to themed sudoku and spatial runs.'],
    ],
    faq: [
      ['Is there a free alternative to Puzzmo?', 'Mind Loft is a free daily puzzle site with more than 200 dailies, including Hands (a poker grid puzzle), Strata (a dig-out word puzzle) and Encore (a daily crossword).'],
      ['What is a puzzle like Pile-Up Poker?', 'Hands on Mind Loft: deal 25 cards into a five by five grid so its rows and columns make the best ten poker hands. A new deal every day.'],
      ['Does Mind Loft have chess puzzles?', 'Yes. Mate, Defend, Swindle and Queen are daily chess endgame puzzles, each with one best line to find.'],
      ['Is Mind Loft part of Puzzmo?', 'No. Mind Loft is an independent puzzle site. Puzzmo and its puzzle names belong to their owners.'],
    ],
  },
  {
    slug: 'linkedin-games-alternative',
    site: 'LinkedIn Games',
    short: 'LinkedIn Games',
    title: 'LinkedIn Games Alternative: Free Puzzles Like Queens | Mind Loft',
    h1: 'A Free Alternative to LinkedIn Games',
    description: 'Like Queens, Tango, Zip or Crossclimb? Mind Loft has free daily logic and word puzzles in the same spirit, 200+ of them, with no ads and no signup.',
    lede: 'LinkedIn turned a coffee break into Queens, Tango and Zip. If you finish those and want more of the same kind of thinking, Mind Loft is a free daily puzzle site with more than 200 dailies, many of them short grid logic puzzles with one clean answer. There are no ads, you need no account to play, and nothing you play is shared with your network. Below, each LinkedIn puzzle is matched with the Mind Loft daily that plays most like it.',
    matches: [
      {
        theirs: 'Queens',
        keys: ['jester', 'judges'],
        body: 'Jesters is the closest match on the site: one jester per row, column and coloured court, and no two may touch, not even diagonally. When that feels easy, Judges asks for two per row, column and court under the same no-touching rule.',
      },
      {
        theirs: 'Tango',
        keys: ['duet'],
        body: 'Duet fills a grid with dots and rings so every row and column is split half and half, and never three of one kind in a row. If you like the small deductions Tango is built on, this is the same family of puzzle.',
      },
      {
        theirs: 'Zip',
        keys: ['mop', 'connect'],
        body: 'Mop asks for one path through every tile of a house, once each, ending at the door, which is the same fill-every-cell idea as Zip. Connect joins matching pairs of dots with lines that never cross, until no square is left unused.',
      },
      {
        theirs: 'Crossclimb',
        keys: ['rung', 'hinge'],
        body: 'Rung is a daily word ladder that changes one letter a rung, the core of Crossclimb without the trivia clues. Hinge chains six words where each neighbouring pair makes a phrase.',
      },
      {
        theirs: 'Pinpoint',
        keys: ['links', 'crux'],
        body: 'If you like naming the thread that ties words together, Links hides four groups in sixteen words, and Crux builds a clueless crossword from four category hints.',
      },
      {
        theirs: 'Mini Sudoku',
        keys: ['sixes', 'suds'],
        body: 'Sixes is a 6 by 6 daily sudoku that takes about two minutes, and Suds is the classic 9 by 9 when you have longer.',
        more: [['/sudoku', 'All sudoku puzzles']],
      },
    ],
    differences: [
      ['No Ads', 'No banners, no video ads and no pop-ups in the middle of a puzzle.'],
      ['No Account Needed', 'Every daily plays in full without signing in. An account only keeps your streak and puts your time on the leaderboard.'],
      ['More Than 200 Dailies', 'Grid logic, word puzzles, crosswords, sudoku, trivia, chess and cards, so the habit does not end after a few minutes.'],
      ['First Try Counts', 'Daily leaderboards count only your first try, so a time means the same thing for everyone.'],
    ],
    faq: [
      ['Is there a puzzle like LinkedIn Queens?', 'Jesters on Mind Loft: one piece per row, column and coloured region, and no two may touch. Judges is the harder two-per-region version. Both are free daily puzzles.'],
      ['Is there a puzzle like Tango?', 'Duet: fill the grid with dots and rings so each row and column is half and half, with never three in a row.'],
      ['Do I need an account to play?', 'No. Every Mind Loft daily plays in full without one. An account only keeps your streak and leaderboard place.'],
      ['Is Mind Loft part of LinkedIn?', 'No. Mind Loft is an independent puzzle site. LinkedIn Games and its puzzle names belong to LinkedIn.'],
    ],
  },
  {
    slug: 'merriam-webster-games-alternative',
    site: 'Merriam-Webster Games',
    short: 'Merriam-Webster',
    title: 'Merriam-Webster Games Alternative: Free Word Puzzles | Mind Loft',
    h1: 'A Free Alternative to Merriam-Webster Games',
    description: 'Like Blossom, Quordle or the Merriam-Webster word quizzes? Mind Loft has free daily word puzzles and vocabulary, spelling and word origin quizzes. No ads.',
    lede: 'Merriam-Webster built a set of word puzzles and quizzes around the dictionary. If that is your corner of the puzzle world, Mind Loft runs more than 25 free daily word puzzles, plus daily vocabulary, spelling, grammar, idiom and word origin quizzes. There are no ads and no signup. Below, each Merriam-Webster favourite is matched with the Mind Loft daily that plays most like it.',
    matches: [
      {
        theirs: 'Blossom',
        keys: ['lode', 'tuck'],
        body: 'Lode gives you seven letters and pays more for rarer words, so a long, unusual find is worth chasing. Tuck is the scoring cousin: fourteen shared letters and one best board, ranked on the daily leaderboard.',
      },
      {
        theirs: 'Quordle and Octordle',
        noCopy: true,
        keys: ['warmer', 'dossier'],
        body: 'Mind Loft does not run a multi-board Wordle. If what you like is closing in on hidden answers from feedback, Warmer scores every guess by how close its meaning is to the secret word, and Dossier hands back five clues on every guess.',
      },
      {
        theirs: 'Vocabulary Quizzes',
        keys: ['vocab', 'origin', 'idiom'],
        body: 'Vocab runs from common words to rare ones. Origin asks where words come from, from Latin roots to loanwords, and Idiom covers sayings and what they really mean. Every past question is in the English Database to play again.',
        more: [['/english-questions', 'English Database']],
      },
      {
        theirs: 'Spelling and Grammar Quizzes',
        keys: ['spell', 'gram', 'stet'],
        body: 'Spell climbs from easy words to ones that trip experts, and Gram runs from everyday slips to the fine print. Stet hands you a sentence and asks you to find the one wrong word, or pass it clean.',
      },
      {
        theirs: 'The Crossword',
        keys: ['emcee', 'encore', 'crux'],
        body: 'Emcee is a five by five daily mini, Encore is a nine by nine daily crossword with bigger Sunday grids, and Crux is a clueless crossword built from four category hints.',
      },
    ],
    differences: [
      ['No Ads', 'No banners, no video ads and no pop-ups in the middle of a puzzle.'],
      ['A Daily Word Run', 'The English Gauntlet strings the vocabulary, spelling, grammar, origin and idiom dailies into one run with one combined result.'],
      ['More Than 200 Dailies', 'Beyond the word puzzles there are crosswords, sudoku, logic grids, trivia and card puzzles every day.'],
      ['Free, No Signup', 'Every daily is free to play in full. An account only keeps your streak and your place on the board.'],
    ],
    faq: [
      ['Is there a word puzzle like Blossom?', 'Lode on Mind Loft: build words from seven letters, with rarer words worth more. A new set of letters every day, free.'],
      ['Does Mind Loft have vocabulary quizzes?', 'Yes. Vocab, Spell, Gram, Origin and Idiom are free daily quizzes, and every past question is in the English Database.'],
      ['Is there a Quordle on Mind Loft?', 'No. The nearest puzzles are Warmer, which scores guesses by meaning, and Dossier, which gives clues on every guess.'],
      ['Is Mind Loft part of Merriam-Webster?', 'No. Mind Loft is an independent puzzle site. Merriam-Webster and its game names belong to Merriam-Webster.'],
    ],
  },
  {
    slug: 'jetpunk-alternative',
    site: 'JetPunk',
    short: 'JetPunk',
    title: 'JetPunk Alternative: Free Map Quizzes and Trivia, No Ads | Mind Loft',
    h1: 'A JetPunk Alternative for Quizzes and Daily Puzzles',
    description: 'Like JetPunk? Mind Loft has 2,000+ free quizzes, from typing every country to map quizzes, plus 200+ free daily puzzles. No ads, no signup.',
    lede: 'JetPunk is where a lot of people learned every country by typing them against a clock. Mind Loft has that kind of quiz too: more than 2,000 free quizzes on countries, capitals, flags, sports and film, with timers and leaderboards, and more than 200 free daily puzzles around them. There are no ads. Below, each kind of JetPunk quiz is matched with where to find it on Mind Loft.',
    matches: [
      {
        theirs: 'Typing Quizzes',
        quizzes: [['countries-of-the-world', 'Name Every Country in the World'], ['world-capitals', 'Name the Capital of Every Country'], ['flags-of-the-world', 'Name Every Country From Its Flag']],
        body: 'Type every answer you can before the clock runs out. These are the classics, and the full quiz index holds more than 2,000 more.',
        more: [['/quizzes/all', 'Every quiz']],
      },
      {
        theirs: 'Map Quizzes',
        quizzes: [['erase-the-world-no-outline', 'Erase the World (No Outline)'], ['erase-europe-by-capital', 'Erase Europe by Capital'], ['fortune-500-hq-1', 'Fortune 500 HQ Hunt']],
        keys: ['ping', 'span', 'carmen'],
        body: 'The Erase quizzes clear a map as you name each country, and the hardest versions give you no outline to lean on. HQ Hunt has you click where Fortune 500 companies keep their headquarters. For a daily map puzzle, Ping hides a city, Span links two countries by shared borders, and Carmen chases a thief around the globe.',
      },
      {
        theirs: 'Geography Trivia',
        keys: ['atlas'],
        body: 'Atlas is a daily geography quiz that runs from capitals to far corners. Every past question is in the Trivia Database to play again.',
        more: [['/geography-games', 'All geography puzzles'], ['/trivia-questions', 'Trivia Database']],
      },
      {
        theirs: 'General Knowledge Quizzes',
        keys: ['streak', 'deep', 'potluck'],
        body: 'Streak is forty mixed questions that climb from gimme to brutal, Deep takes one subject fifteen questions down, and Potluck serves three catalogue quizzes a day under one score.',
      },
    ],
    differences: [
      ['No Ads', 'No banners, no video ads and no pop-ups eating the last seconds of a timed quiz.'],
      ['A Fresh Set Every Morning', 'More than 200 dailies reset at midnight Eastern, on top of the quiz catalogue.'],
      ['Built for a Phone First', 'Typing, tapping and map clicks are laid out to work by thumb.'],
      ['Free, No Signup', 'Every quiz and every daily is free. An account only keeps your streak and your place on the board.'],
    ],
    faq: [
      ['What is a good alternative to JetPunk?', 'Mind Loft has more than 2,000 free quizzes in the same typing and map formats, plus more than 200 free daily puzzles, with no ads.'],
      ['Does Mind Loft have map quizzes?', 'Yes. The Erase quizzes clear a world or continent map as you name each country, and HQ Hunt uses a US map. Ping, Span and Carmen are daily map puzzles.'],
      ['Are the quizzes free?', 'Yes, every quiz and every daily puzzle, with no ads.'],
      ['Is Mind Loft part of JetPunk?', 'No. Mind Loft is an independent puzzle site. JetPunk and its quiz names belong to their owners.'],
    ],
  },
  {
    slug: 'atlantic-games-alternative',
    site: 'The Atlantic Games',
    short: 'The Atlantic',
    title: 'The Atlantic Games Alternative: Free Daily Puzzles | Mind Loft',
    h1: 'A Free Alternative to The Atlantic Games',
    description: 'Like Bracket City or The Atlantic Crossword? Mind Loft has 200+ free daily puzzles, from crosswords to history and trivia puzzles. No ads, no signup.',
    lede: 'The Atlantic Games added clever daily word and history puzzles to a magazine habit. If you want more in that vein, Mind Loft is a free daily puzzle site with more than 200 dailies, including crosswords, history puzzles and trivia. There are no ads and no signup. Below, each Atlantic puzzle is matched with the Mind Loft daily that plays most like it.',
    matches: [
      {
        theirs: 'Bracket City',
        noCopy: true,
        keys: ['redact', 'dating', 'niche'],
        body: 'Mind Loft has no nested-clue puzzle. If you like working toward one hidden fact, Redact uncovers a hidden article word by word until you can name its subject, and Dating asks you to put five historical moments in order. Niche fills a grid where every answer has to fit both its row and its column.',
      },
      {
        theirs: 'The Atlantic Crossword',
        keys: ['emcee', 'encore', 'crux'],
        body: 'Emcee is a five by five daily mini with fair clues. Encore is a nine by nine daily crossword with bigger Sunday grids, and Crux is a clueless crossword built from four category hints.',
      },
      {
        theirs: 'Stacks',
        noCopy: true,
        keys: ['barter', 'strata'],
        body: 'If you like moving letters until words appear, Barter trades scrambled tiles two at a time until every row reads, and Strata digs buried words out of a grid where each lift drops the letters above.',
      },
    ],
    differences: [
      ['No Ads', 'No banners, no video ads and no pop-ups in the middle of a puzzle.'],
      ['Every Daily Is Free in Full', 'No subscription: every past board is in the puzzle archive, free to replay unscored.'],
      ['More Than 200 Dailies', 'Crosswords, word puzzles, sudoku, logic grids, trivia, geography, chess and cards, every day.'],
      ['First Try Counts', 'Daily leaderboards count only your first try, so a score means the same thing for everyone.'],
    ],
    faq: [
      ['Is there a puzzle like Bracket City?', 'Not exactly. The nearest on Mind Loft are Redact, where you uncover a hidden article and name its subject, and Dating, where you put five moments in history in order.'],
      ['Is there a free daily crossword like The Atlantic Crossword?', 'Yes. Emcee is a free five by five daily mini and Encore a free nine by nine daily crossword.'],
      ['Can I play past puzzles?', 'Yes. Every past board of every daily is in the puzzle archive, free to replay unscored.'],
      ['Is Mind Loft part of The Atlantic?', 'No. Mind Loft is an independent puzzle site. The Atlantic Games and its puzzle names belong to The Atlantic.'],
    ],
  },
  {
    slug: 'washington-post-games-alternative',
    site: 'Washington Post Games',
    short: 'Washington Post',
    title: 'Washington Post Games Alternative: Free Daily Puzzles | Mind Loft',
    h1: 'A Free Alternative to Washington Post Games',
    description: 'Like the Washington Post daily crossword, sudoku, jigsaw or Keyword? Mind Loft has 200+ free daily puzzles in the same spirit. No ads, no signup.',
    lede: 'The Washington Post games page gathers crosswords, sudoku, solitaire, jigsaws and word puzzles in one place. Mind Loft is a free daily puzzle site built around the same staples, with more than 200 dailies, each with its own leaderboard. There are no ads and no signup. Below, each Washington Post favourite is matched with the Mind Loft daily that plays most like it.',
    matches: [
      {
        theirs: 'The Daily and Mini Crosswords',
        keys: ['emcee', 'encore', 'crux'],
        body: 'Emcee is a five by five daily mini, Encore a nine by nine daily crossword with bigger Sunday grids, and Crux a clueless crossword built from four category hints.',
      },
      {
        theirs: 'The Daily Sudoku and Diagonal Sudoku',
        keys: ['suds', 'diag'],
        body: 'Suds is the classic 9 by 9, and Diag is a daily sudoku where both long diagonals count too. The sudoku page holds more than 40 daily variants beyond those.',
        more: [['/sudoku', 'All sudoku puzzles']],
      },
      {
        theirs: 'Codeword',
        keys: ['glyph', 'cipher'],
        body: 'Glyph is the closest match on the site: a crossword with no clues where every letter is a number, and you crack all 26 from two given. Cipher turns letters into digits and asks you to make the equation true.',
      },
      {
        theirs: 'Fill Ins',
        keys: ['fill'],
        body: 'Fill hands you a themed list of words and an empty grid, and you fit each word in by length alone.',
      },
      {
        theirs: 'Keyword',
        noCopy: true,
        keys: ['shards', 'niche'],
        body: 'Mind Loft has no Keyword, but if you like completing words that cross, Shards asks you to reassemble a shattered word grid, and Niche fills a grid where every answer fits its row and its column.',
      },
      {
        theirs: 'The Daily Jigsaw',
        keys: ['jig', 'saw', 'mural'],
        body: 'Jig is a new photograph every day cut into 80 pieces, Saw is its tall sibling, and Mural is one giant jigsaw that every player builds together.',
        more: [['/jig/shelf', 'Jigsaw Puzzle Shelf']],
      },
      {
        theirs: 'Daily Solitaire and Mahjongg',
        keys: ['taire', 'cell', 'mahj'],
        body: 'Taire is a daily solitaire with a proven minimum to beat, Cell is the daily FreeCell deal, and Mahj clears 144 layered mahjong tiles in matching pairs. Every player gets the same deal, so the leaderboard ranks play and not luck.',
      },
      {
        theirs: 'Word Search',
        keys: ['scour', 'search'],
        body: 'Scour is a themed daily word search on a 15 by 15 grid, against the clock. Search is an enormous shared word search with hundreds of words to find.',
      },
      {
        theirs: 'Family Feud',
        keys: ['feud'],
        body: 'Feud gives you five prompts, and the answer key is what the crowd said. It sits with the other crowd puzzles, where the point is reading what most people think.',
      },
    ],
    differences: [
      ['No Ads', 'No banners, no video ads and no pop-ups between you and the puzzle.'],
      ['Leaderboards on Every Daily', 'Every player gets the same board, and only your first try counts, so a score means the same thing for everyone.'],
      ['An Archive You Can Replay', 'Every past board of every daily is in the puzzle archive, free to replay unscored.'],
      ['Free, No Signup', 'Every daily is free in full. An account only keeps your streak and your place on the board.'],
    ],
    faq: [
      ['Is there a free alternative to Washington Post Games?', 'Mind Loft is a free daily puzzle site with more than 200 dailies, including crosswords, sudoku, a daily jigsaw, solitaire, mahjong and word searches, with no ads.'],
      ['Is there a free daily Codeword puzzle?', 'Glyph on Mind Loft: a clueless crossword where every letter is a number, cracked from two given letters. New every day.'],
      ['Is there a free diagonal sudoku?', 'Yes. Diag is a free daily sudoku where both long diagonals must also hold one to nine.'],
      ['Is Mind Loft part of The Washington Post?', 'No. Mind Loft is an independent puzzle site. Washington Post Games and its game names belong to their owners.'],
    ],
  },
  {
    slug: 'lumosity-alternative',
    site: 'Lumosity',
    short: 'Lumosity',
    title: 'Lumosity Alternative: Free Memory and Logic Puzzles | Mind Loft',
    h1: 'A Free Alternative to Lumosity',
    description: 'Like Lumosity games for memory, attention, speed and problem solving? Mind Loft has 200+ free daily puzzles that work the same skills. No ads, no app.',
    lede: 'Lumosity sorts its games by skill: memory, attention, speed, problem solving, math and language. Mind Loft is not a brain-training program and makes no claims about one, but many of its more than 200 free dailies work the same skills, and every one is free in the browser with no ads and no app. Below, each Lumosity skill is matched with the Mind Loft dailies that use it most.',
    matches: [
      {
        theirs: 'Memory Games',
        keys: ['glimpse', 'witness', 'simon'],
        body: 'Glimpse flashes a panel for two seconds and then asks one question about it. Witness has you study a street scene and answer from memory, and Simon lights a sequence of pads that grows by one each round.',
      },
      {
        theirs: 'Attention Games',
        keys: ['spot', 'wanted'],
        body: 'Spot gives you two copies of one photo and seven differences to find. Wanted is a daily hidden picture hunt across a crowded scene.',
      },
      {
        theirs: 'Speed and Math Games',
        keys: ['blitz', 'crunch', 'calc'],
        body: 'Blitz is mental arithmetic at fifteen seconds a problem. Crunch asks you to combine six numbers to hit a three-digit target, and Calc walks the calculator keys to land on a number.',
        more: [['/number-puzzles', 'All number puzzles']],
      },
      {
        theirs: 'Problem Solving Games',
        keys: ['errands', 'pack', 'bot'],
        body: 'Errands asks you to plan a round of stops and be home soonest, a route-planning puzzle. Pack fits every bag, box and sofa into a vehicle, and Bot has you program a robot to light every lamp.',
      },
      {
        theirs: 'Language Games',
        keys: ['vocab', 'links', 'lode'],
        body: 'Vocab runs from common words to rare ones, Links hides four groups in sixteen words, and Lode builds words from seven letters, with rarer words worth more.',
      },
    ],
    differences: [
      ['No Ads, No App', 'Every daily runs in the browser on a phone or a computer, with no ads and nothing to install.'],
      ['Free in Full', 'There is no premium tier. Every daily is free to play every day.'],
      ['Real Puzzles, Fresh Daily', 'A new board in each of more than 200 dailies every midnight Eastern, with a leaderboard to see how you did against everyone else.'],
      ['Honest About the Science', 'Mind Loft makes no promise that puzzles improve your brain. Its articles on puzzles and cognitive health summarise what the research does and does not show.'],
    ],
    faq: [
      ['Is there a free alternative to Lumosity?', 'Mind Loft has more than 200 free daily puzzles that use memory, attention, speed, math and problem solving, with no ads and no app. It is a puzzle site, not a brain-training program.'],
      ['Do puzzles keep your brain sharp?', 'The evidence is mixed. The Mind Loft and Cognitive Health articles summarise the research on puzzles, reading, jigsaws and the brain.'],
      ['Does Mind Loft have memory games?', 'Yes. Glimpse, Witness and Simon are free daily memory puzzles.'],
      ['Is Mind Loft part of Lumosity?', 'No. Mind Loft is an independent puzzle site. Lumosity and its game names belong to Lumos Labs.'],
    ],
  },
];

export const ALTERNATIVES_MAP = Object.fromEntries(ALTERNATIVES.map((a) => [a.slug, a]));

export const ALT_HUB = {
  href: '/alternatives',
  title: 'Free Alternatives to NYT Games, Sporcle and More | Mind Loft',
  h1: 'Free Alternatives to NYT Games, Sporcle, LinkedIn Games and More',
  description: 'Puzzles like Connections, Queens, Blossom and Sporcle map quizzes, matched to free Mind Loft dailies. 200+ free daily puzzles, no ads, no signup.',
  lede: "Already play the dailies on NYT Games, Sporcle, LinkedIn or somewhere else? Each page below matches that site's best known puzzles with the free Mind Loft daily that plays most like it, so you can find your next one fast. Every Mind Loft daily is free, with no ads and no signup.",
};

// The game page pointer (app/StageTail.jsx): only the primary match for each
// row, so a game page names one other site at most. A row marked noCopy
// (Mind Loft has no close copy) never points, so Warmer never claims Wordle.
export const ALT_FOR_GAME = (() => {
  const out = {};
  for (const a of ALTERNATIVES) {
    for (const m of a.matches) {
      const k = !m.noCopy && m.keys && m.keys[0];
      if (k && !out[k]) out[k] = { slug: a.slug, site: a.short, theirs: m.theirs };
    }
  }
  return out;
})();
