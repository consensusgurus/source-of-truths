import { hasSundayEdition } from './sunday-editions.js';
// SINGLE SOURCE OF TRUTH for the daily-game roster and per-game display
// metadata. Every surface that shows a daily game (the Stat Hub, admin
// analytics, the combined leaderboard, the in-game board panel, and any future
// consumer) reads names, colors, categories, the roster (DAILY_KEYS), the dated
// quiz-id regex, and the 'Name: M/D/YY' label from here. Adding a new daily game
// then means adding ONE row to DAILY_GAMES below, plus its puzzles + client page.
//
//   color     = the game's own darker hue, for light backgrounds.
//   colorNavy = a lightened hue, for the dark navy leaderboard / strip.
//   miss      = the column header for this game's `guessesUsed` figure on the
//               daily leaderboards (DailyBoardPanel + DailyEndCard). Every game
//               posts that one shared field, but they mean DIFFERENT things by
//               it: Parker and Taire count moves, Garble and Span count misses,
//               Axiom counts tests, Crunch counts steps, Lode counts words
//               mined, Paths counts what its network cost to build.
//               Labelling them all "Miss" was wrong on most of the
//               roster (owner, 2026-08-01), so each row names its own figure.
//               `miss: null` means the game always posts 0 (no wrong answers to
//               count), and both boards then DROP the column for it rather than
//               show a column of zeros. Keep the word short: it sits in a narrow
//               right-aligned column and renders uppercase.
//
// Order matches lib/daily-combined DAILY_KEYS (the daily-slate order); retired
// games (RETIRED_DAILY, below the roster) are kept so their archived days keep
// scoring.
const RAW = [
  { key: 'crux', miss: 'Guesses', name: 'Crux', cat: 'Word', tag: 'A clueless crossword', how: 'Eight words interlock in an empty grid, and four category hints are the only clues you get.', color: '#0e1d40', colorNavy: '#5b9bff' },
  { key: 'emcee', miss: 'Checks', name: 'Emcee', cat: 'Word', tag: 'The daily mini crossword', how: 'Fill a five by five crossword from fair clues, and the timer stops when the grid is right.', color: '#c026d3', colorNavy: '#e879f9' },
  { key: 'garble', miss: 'Miss', name: 'Garble', cat: 'Word', tag: 'Untangle five words', how: 'Untangle five scrambled words, then the clued finale, in as few misses as you can manage.', color: '#8a6d1a', colorNavy: '#f0c95a' },
  { key: 'links', miss: 'Miss', name: 'Links', cat: 'Word', tag: 'Four hidden groups', how: 'Sort sixteen words into the four hidden groups that connect them, with four mistakes to spare.', color: '#166534', colorNavy: '#4ca878' },
  { key: 'span', miss: 'Miss', name: 'Span', cat: 'Geography', tag: 'Cross the map', how: 'Connect the two countries with the shortest chain of shared land borders you can find.', color: '#9d174d', colorNavy: '#e06aa0' },
  { key: 'dating', miss: 'Checks', name: 'Dating', cat: 'Trivia', tag: 'Put history in order', how: 'Arrange five historical moments oldest to newest, in three checks or fewer.', color: '#6d28d9', colorNavy: '#a483f0' },
  { key: 'tally', miss: 'Errors', name: 'Tally', cat: 'Numbers', tag: 'Balance the books', how: 'Fill the grid from your rack so every row and column adds up to its target.', color: '#15803d', colorNavy: '#4cb377' },
  { key: 'suds', miss: null, name: 'Suds', cat: 'Sudoku', tag: 'The daily sudoku', how: 'Fill the nine by nine grid so every row, column, and box holds one through nine exactly once.', color: '#ea580c', colorNavy: '#f0894c' },
  { key: 'circa', miss: 'Guesses', name: 'Circa', cat: 'Trivia', tag: 'Guess the year', how: 'Guess the year the moment happened, and each miss narrows the range.', color: '#0e7490', colorNavy: '#38b6cf' },
  { key: 'extra', miss: 'Tears', name: 'Extra', cat: 'Trivia', tag: 'Name the story', how: 'Name the redacted historic headline, and every wrong guess tears another word free.', color: '#b91c1c', colorNavy: '#e06a6a' },
  { key: 'quilt', miss: null, name: 'Quilt', cat: 'Sudoku', tag: 'Sudoku with no straight lines', how: 'The nine boxes have been redrawn into nine crooked regions. Every row, column and region still holds one through nine exactly once.', color: '#a21caf', colorNavy: '#eda5e6' },
  { key: 'carve', miss: 'Errors', name: 'Carve', cat: 'Numbers', tag: 'Equal-sum blocks', how: 'Slice the grid into connected blocks that each add up to the same target.', color: '#7c3aed', colorNavy: '#a483f0' },
  { key: 'stet', miss: 'Miss', name: 'Stet', cat: 'Word', tag: 'Spot the error, fix the copy', how: 'Each sentence may hide one wrong word, so tap it and fix it, or stamp clean copy stet.', color: '#0369a1', colorNavy: '#41b1e8' },
  { key: 'outwit', miss: null, name: 'Outwit', cat: 'Crowd Psychology', tag: 'Beat the crowd', how: 'Five prompts with no right answers, where the aim is to match what the crowd does today.', color: '#1f2937', colorNavy: '#c3cfe3' },
  { key: 'tuck', miss: 'Unused', name: 'Tuck', cat: 'Word', tag: 'Same letters, highest score wins', how: 'Everyone plays the same fourteen letters, and the highest scoring board wins the day.', color: '#92400e', colorNavy: '#e0a568' },
  { key: 'alibi', miss: 'Wrong', name: 'Alibi', cat: 'Logic', tag: 'Solve the nightly whodunit', how: "Four suspects and three deduction boards narrow tonight's case to exactly one answer.", color: '#8b1e2d', colorNavy: '#ef8896' },
  { key: 'cipher', miss: null, name: 'Cipher', cat: 'Numbers', tag: 'Crack the letter math', how: 'Every letter stands for a different digit, and exactly one solution makes the equation true.', color: '#0f766e', colorNavy: '#3fc9b8' },
  { key: 'ping', miss: 'Guesses', name: 'Ping', cat: 'Geography', tag: 'Guess the secret city', how: 'Guess a city, learn the exact miles to the secret one, and home in on it.', color: '#0284c7', colorNavy: '#4cb3f0' },
  { key: 'warmer', miss: 'Guesses', name: 'Warmer', cat: 'Word', tag: 'Hotter or colder', how: 'Every guess is scored by meaning, cold to hot, until you land on the secret word.', color: '#dc2626', colorNavy: '#f3705c' },
  { key: 'jester', miss: 'Placed', name: 'Jesters', href: '/jesters', cat: 'Logic', tag: 'Seat the court', how: 'Seat one jester per row, per column, and per colored court, with no two ever touching. Thursday through Sunday seat two apiece.', color: '#7c3aed', colorNavy: '#a78bfa' },
  { key: 'sworn', miss: 'Wrong', name: 'Sworn', cat: 'Logic', tag: 'Spot the liars', how: 'Five sworn statements contain an exact number of lies, and one of them names the thief.', color: '#be185d', colorNavy: '#f472b6' },
  { key: 'outrank', miss: null, name: 'Outrank', cat: 'Crowd Psychology', tag: 'Call the crowd\'s order', how: "Vote for your favorite, then call the order the rest of today's players put them in.", color: '#4338ca', colorNavy: '#818cf8' },
  { key: 'shards', miss: 'Miss', name: 'Shards', cat: 'Word', tag: 'Reassemble the crossword', how: 'The solved grid was shattered into lettered pieces, so put them back until every word reads true.', color: '#0d9488', colorNavy: '#2dd4bf' },
  { key: 'axiom', miss: 'Tests', name: 'Axiom', cat: 'Logic', tag: 'Find the hidden rule', how: 'One hidden rule splits the board, and your handful of tests must tell five candidate rules apart.', color: '#0f766e', colorNavy: '#5eead4' },
  { key: 'hearsay', miss: 'Wrong', name: 'Hearsay', cat: 'Logic', tag: 'Deduce what they don\'t know', how: 'Two people each know one detail, and their conversation narrows the shortlist to a single answer.', color: '#7c2d92', colorNavy: '#d8b4fe' },
  { key: 'venn', miss: 'Rejects', name: 'Venn', cat: 'Logic', tag: 'Sort the overlaps', how: 'Place twelve words across seven regions so the count on every circle adds up.', color: '#b45309', colorNavy: '#fbbf24' },
  { key: 'stands', miss: 'Rejects', name: 'Stands', cat: 'Logic', tag: 'Rebuild the results', how: 'Everyone played everyone once, so rebuild the full results table from the few surviving facts.', color: '#1d4ed8', colorNavy: '#93c5fd' },
  { key: 'bracket', miss: null, name: 'Bracket', cat: 'Trivia', tag: 'Name every winner', how: 'Make fifteen picks through a sixteen team bracket, where an early miss sinks every later line.', color: '#c2410c', colorNavy: '#fb923c' },
  // PRICER PULLED 2026-08-09 (see CLAUDE.md). Restore: grep -rn 'PRICER PULLED' master registry entry
  // { key: 'pricer', miss: null, name: 'Pricer', cat: 'Numbers', tag: 'Some days more, some days less', how: 'Sixteen real things from one category and one money question, which flips between most and least expensive by the day. Bracket them all before a single price is revealed.', color: '#15803d', colorNavy: '#4ade80' },
  { key: 'lode', miss: 'Words', name: 'Lode', cat: 'Word', tag: 'Seven letters, rare words pay', how: 'Build words from seven letters around the core letter, and the rarer the word the bigger the pay.', color: '#a16207', colorNavy: '#e0b13f' },
  { key: 'etch', miss: 'Errors', name: 'Etch', cat: 'Logic', tag: 'A picture in the numbers', how: 'Fill the squares the row and column clues force, and a picture appears.', color: '#4d7c0f', colorNavy: '#a3e635' },
  { key: 'hedge', miss: 'Errors', name: 'Hedge', cat: 'Logic', tag: 'Draw one closed loop', how: 'Draw one closed loop so every number has exactly that many sides on it.', color: '#0891b2', colorNavy: '#67e8f9' },
  { key: 'listed', miss: 'Checks', name: 'Listed', cat: 'Trivia', tag: 'Rank the list, top to bottom', how: 'Rank eight real things in order, where green locks a pick and amber means one place off.', color: '#86198f', colorNavy: '#e9b8f5' },
  { key: 'mate', keepsAnswer: true, miss: 'Tries', name: 'Mate', cat: 'End Game', tag: 'White to play and mate', how: 'Find the one move that forces checkmate, then play the line out against the best defence.', color: '#6b4423', colorNavy: '#d9b38c' },
  { key: 'four', keepsAnswer: true, miss: 'Tries', name: 'Four', cat: 'End Game', tag: 'One column wins', how: 'The position is already won for you. Find the single column that keeps it, because a wrong drop is not taken back.', color: '#233a63', colorNavy: '#9db8ff' },
  // Renamed Park -> Parker 2026-07-31 (via a short-lived Parker). The KEY stays
  // 'park' on purpose: it is the
  // quiz-id prefix ('park-M-D-YY'), the localStorage namespace and the button
  // image name, so renaming it would orphan the launch-month leaderboards and
  // every streak. Only the route and the display name moved, hence the href
  // override below.
  { key: 'park', keepsAnswer: true, attempts: 'graded', miss: 'Tries', name: 'Parker', href: '/parker', cat: 'Logic', tag: 'Get the red one out', how: 'Everybody has blocked you in, every block is stuck on one axis, and there is one gap in the wall.', color: '#7c5c2e', colorNavy: '#f0cf9a' },
  // Impound is Parker on a 7x7 lot, and it is a SEPARATE GAME rather than a
  // bigger Parker because every banked Parker board, every stored perfect and
  // every leaderboard row behind them assumes six. Same attempts shape as
  // Parker: it never hands over its answer, a replay of the same board is the
  // design, and every finish is a win of some size, so it ranks on score then
  // on how many runs it took.
  // Junkyard is the same jam at 8x8, and it is the LAST rung this family can
  // have: lib/jam-core packs occupancy into two 32-bit words, so 64 cells is
  // the engine's ceiling. Same attempts shape as the other two, and the three
  // hand each other along through GAME_FAMILIES below.
  { key: 'junkyard', keepsAnswer: true, attempts: 'graded', miss: 'Tries', name: 'Junkyard', cat: 'Logic', tag: 'Parker on the biggest lot', how: 'Parker on an eight by eight lot, the biggest of the three. Everything still slides on one axis and there is still one gap in the wall. Nearly thirty blocks now stand between you and it, and Monday already runs deeper than any Parker board short of a Sunday.', color: '#5c3a16', colorNavy: '#d9b070' },
  { key: 'impound', keepsAnswer: true, attempts: 'graded', miss: 'Tries', name: 'Impound', cat: 'Logic', tag: 'Parker on a bigger lot', how: 'Parker on a seven by seven lot. Everything is still stuck on one axis and there is still one gap in the wall. The lot is wider, the trucks run longer, and the shortest way out is nowhere near the one you can see.', color: '#6b4a1f', colorNavy: '#e3bd85' },
  { key: 'check', keepsAnswer: true, miss: 'Tries', name: 'Check', cat: 'End Game', tag: 'Red to play and sweep', how: 'Find the one move that takes every black piece inside three, then play it out with no take-back.', color: '#166e5a', colorNavy: '#5fd6b8' },
  { key: 'hinge', miss: 'Detours', name: 'Hinge', cat: 'Word', tag: 'Chain the compounds', how: 'Six words in a chain, and you get the first and the last. Fill the four between so every pair of neighbours makes a compound word or a phrase everyone knows: fireplace, placemat, board game. Any chain that holds counts; a real word that does not hinge is a detour, and detours break ties on the clock.', color: '#4f46e5', colorNavy: '#a5b4fc' },
  { key: 'rung', keepsAnswer: true, attempts: 'graded', miss: 'Tries', name: 'Rung', cat: 'Word', tag: 'One letter at a time', how: 'Climb from one five-letter word to another, changing a single letter a rung, in as few rungs as you can.', color: '#155e75', colorNavy: '#7fd4e8' },
  { key: 'taire', keepsAnswer: true, attempts: 'graded', miss: 'Tries', name: 'Taire', cat: 'Cards', tag: 'The daily solitaire', how: 'Twenty cards face up, two suits, and a perfect line that is the proven minimum, so nobody beats it.', color: '#1d6b4f', colorNavy: '#86efac' },
  { key: 'fib', miss: 'Errors', name: 'Fib', cat: 'Logic', tag: 'One clue is lying', how: 'The open end of each sign points at the larger number, but one of them is lying. Solve the grid, then name the liar.', color: '#4c1d95', colorNavy: '#c4b5fd' },
  { key: 'crunch', miss: 'Steps', name: 'Crunch', cat: 'Numbers', tag: 'Six numbers, one target', how: 'Add, subtract, multiply and divide six numbers into a three-digit target, never going negative or fractional.', color: '#b45309', colorNavy: '#f0c07a' },
  { key: 'streak', miss: 'Asked', name: 'Streak', cat: 'Trivia', subject: 'Grab bag', tag: 'Forty questions, one life', how: 'Forty trivia questions climb from gimme to brutal, and one wrong answer or an empty clock ends the run.', color: '#e11d48', colorNavy: '#fb7185' },
  { key: 'babel', keepsAnswer: true, solvesOnScore: true, miss: 'Stuck', name: 'Babel', cat: 'Word', tag: 'The bag is empty', how: 'Nothing left to draw, so their rack is knowable. Play the last tiles for the best spread you can force.', color: '#14532d', colorNavy: '#6ee7b7' },
  { key: 'feud', miss: null, name: 'Feud', cat: 'Crowd Psychology', tag: 'Match the crowd', how: "Five prompts, three answers each, and the answer key is whatever today's players say. It shifts all day.", color: '#9f1239', colorNavy: '#fda4af' },
  { key: 'finesse', keepsAnswer: true, miss: 'Tries', name: 'Finesse', cat: 'Cards', tag: 'The daily double dummy', how: 'All four hands are face up and one suit is trumps. You play South and the dummy opposite, and the two defenders play perfectly. Take the tricks the contract asks for. Follow suit if you can, the highest card of the suit led wins, a trump beats anything that is not one.', color: '#4c1d95', colorNavy: '#c4b5fd' },
  { key: 'hands', miss: 'Busts', name: 'Hands', cat: 'Cards', tag: 'The daily poker solitaire', how: 'Twenty five cards, one at a time, into a grid where every row and column is a poker hand. Same deal for everybody.', color: '#7f1d1d', colorNavy: '#fca5a5' },
  { key: 'glyph', miss: 'Checks', name: 'Glyph', cat: 'Word', tag: 'A crossword with no clues', how: 'Every letter is a number and the same number is always the same letter, so two given letters and the crossings have to carry you to all 26.', color: '#334155', colorNavy: '#94a3b8' },
  { key: 'chain', keepsAnswer: true, miss: 'Tries', name: 'Chain', cat: 'End Game', tag: 'Take them, or leave them', how: 'The safe edges are gone and the boxes are counted in your favour. One edge keeps it, and the free box is usually the trap.', color: '#4a044e', colorNavy: '#f0abfc' },
  { key: 'suffice', miss: 'Wrong', name: 'Suffice', cat: 'Logic', tag: 'Decide what is enough', how: 'Eight questions you never answer. Two statements each, and you say whether they settle it.', color: '#4338ca', colorNavy: '#a5b4fc' },
  { key: 'turn', keepsAnswer: true, miss: 'Tries', name: 'Turn', cat: 'End Game', tag: 'Ten squares left', how: 'An Othello endgame you are already winning. One square keeps it, and flipping the fewest discs is the habit that gets you beaten.', color: '#226218', colorNavy: '#8cda81' },
  { key: 'redact', miss: 'Guesses', name: 'Redact', cat: 'Trivia', tag: 'Uncover the story', how: 'An entire article about one famous subject, every word hidden. Guess words to uncover it wherever they appear, and name the subject to win.', color: '#27272a', colorNavy: '#b9bdc7' },
  { key: 'paths', miss: 'Cost', name: 'Paths', cat: 'Logic', tag: 'Link every town', how: 'One depot, a scatter of towns, a river in the way. Lay track until they all connect, and pay as little as you can for it. The terrain gets meaner as the week goes on.', color: '#065f46', colorNavy: '#34d399' },
  { key: 'deep', miss: 'Asked', name: 'Deep', cat: 'Trivia', subject: 'Trivia', tag: 'One topic, fifteen questions', how: 'One subject a day and fifteen questions on it, from gimmes to expert. One wrong answer ends the dive, so your score is how far down you got.', color: '#0c4a6e', colorNavy: '#7dd3fc' },
  { key: 'anon', miss: null, name: 'Anon', cat: 'Word', tag: 'A clueless acrostic', how: "An unsigned passage and a bank of answers that share its letters, and the answers' first letters spell whoever wrote it.", color: '#8c2f39', colorNavy: '#e8969f' },
  { key: 'strata', miss: 'Hints', name: 'Strata', cat: 'Word', tag: 'Dig the words out', how: 'Every letter belongs to a buried word, and lifting one out drops everything above it, which is how the next one becomes readable.', color: '#9a3412', colorNavy: '#f4a06a' },
  { key: 'chomp', keepsAnswer: true, fastRetry: true, attempts: 'graded', miss: 'Tries', name: 'Chomp', cat: 'Logic', tag: 'Eat them in order', how: 'A cast of mascots to eat in order, and every square you touch stays yours for the rest of the run. Nothing chases you and nothing is on a clock. The only things in your way are where you have already been and a few bolted-down bleachers, and the board is tight enough that finishing takes most of it.', color: '#a8430f', colorNavy: '#f0a071' },
  { key: 'sweep', miss: 'Digs', unit: 'cells', name: 'Sweep', cat: 'Arcade', tag: 'No bottom edge', how: 'Minesweeper that runs downward forever. Everyone digs the same field, and every field is checked before it ships so it never needs a guess. One life a run, and as many runs as you like with your best one scored.', color: '#0f766e', colorNavy: '#5eead4' },
  { key: 'blocks', miss: 'Shapes', unit: 'rows', name: 'Blocks', cat: 'Arcade', tag: 'Same shapes, same order', how: 'Falling shapes and the same order for everybody. Play as many runs as you like and your best one takes the board. It never speeds up, so a run ends on a hole you left three shapes ago.', color: '#1d4ed8', colorNavy: '#93b4f0' },
  { key: 'docket', miss: 'Wrong', name: 'Docket', cat: 'Logic', tag: 'One setup, five deductions', how: 'A setup, a handful of conditions, and five questions about what those conditions force. The reasoning section a well known standardized test ran for decades, then retired.', color: '#5b2333', colorNavy: '#c9a3ae' },
  { key: 'blitz', miss: 'Asked', name: 'Blitz', cat: 'Numbers', tag: 'Twenty problems, one life', how: 'Mental arithmetic against the clock. Twenty problems climb from the times tables to two-digit multiplication and cubes, fifteen seconds each, and one wrong answer ends the run.', color: '#657512', colorNavy: '#c3d94a' },
  { key: 'sums', miss: null, name: 'Sums', cat: 'Numbers', tag: 'The daily kakuro', how: 'Every run of squares adds up to the total printed at its head, digits 1 to 9, and no digit repeats inside a run. One solution, reachable by deduction alone, and the clock decides the day. Weekdays are 7x7, the Sunday Edition is 11x11.', color: '#be185d', colorNavy: '#f472b6' },
  { key: 'blitzed', miss: 'Asked', name: 'Blitzed', cat: 'Numbers', tag: 'Twenty problems, three numbers each', how: 'Blitz with a third element on every line: 5 + 10 × 2, never 47 × 6. Twenty problems climb from small chains to brackets, percentages with a tail, two-digit products and cubes, twenty seconds each, and one wrong answer ends the run. Multiply and divide before you add.', color: '#3f6d1f', colorNavy: '#a8e063' },
  { key: 'defend', keepsAnswer: true, miss: 'Tries', name: 'Defend', cat: 'End Game', tag: 'Black to play and survive', how: 'White is threatening mate. Five moves look like they answer it and exactly one does, and finding it only buys you the next one.', color: '#2f4f4f', colorNavy: '#8fbdbd' },
  { key: 'cages', miss: null, name: 'Cages', cat: 'Sudoku', tag: 'The daily killer sudoku', how: 'Killer sudoku: not one digit is printed. The grid is cut into cages labelled with the total of the digits inside them, and those totals are the whole clue set.', color: '#6b21a8', colorNavy: '#cba6f7' },
  { key: 'sando', miss: null, name: 'Sando', cat: 'Sudoku', tag: 'The daily sandwich sudoku', how: 'Sandwich sudoku: the number beside each row and column is the total of the digits lying between that line\u2019s 1 and its 9. Find those two and the grid falls out.', color: '#15616b', colorNavy: '#5ec8d0' },
  { key: 'plot', miss: 'Errors', name: 'Plot', cat: 'Logic', tag: 'Divide the whole board', how: 'Every number is the size of the plot it belongs to, so cut the board into rectangles until each number has exactly its own.', color: '#78350f', colorNavy: '#e0a86a' },
  { key: 'barter', keepsAnswer: true, attempts: 'trades', miss: 'Tries', name: 'Barter', cat: 'Word', tag: 'Trade the letters home', how: 'Every letter the answer needs is already on the board, scrambled. Trade two tiles at a time until all six words read true, on a budget of the proven minimum plus five.', color: '#be123c', colorNavy: '#fb7fa2' },
  { key: 'sixes', miss: null, name: 'Sixes', cat: 'Sudoku', tag: 'The daily mini sudoku', how: 'A 6x6 sudoku in six boxes two squares tall and three wide. Every row, column and box holds 1 to 6 exactly once. The short one: about two minutes, nothing counts against you, and the clock decides the day.', color: '#1d4ed8', colorNavy: '#7da2f5' },
  { key: 'niche', miss: 'Misses', name: 'Niche', cat: 'Trivia', tag: 'One answer, two categories', how: 'Fill the grid with answers that fit both their row and their column, from a different universe every day of the week. The score is cells filled, and the flex is rarity: after every correct pick you see how few of the day\'s players found the same one.', color: '#115e59', colorNavy: '#3ecfbd' },
  { key: 'shoe', miss: 'Busts', name: 'Shoe', cat: 'Cards', tag: 'The daily blackjack shoe', how: 'Five hands of blackjack off one fixed shoe, the same cards in the same order for everyone. Par is what the book line banks on the day\'s shoe; count what you have seen to beat it.', color: '#0c4a6e', colorNavy: '#7cc4ec' },
  { key: 'queen', keepsAnswer: true, miss: 'Tries', name: 'Queen', cat: 'End Game', tag: 'White to play and promote', how: 'A king and pawn endgame you are already winning. One first move keeps the win, and then every move of the walk has to be exact against a perfect defence.', color: '#a16207', colorNavy: '#f2c14e' },
  { key: 'towers', miss: null, name: 'Towers', cat: 'Sudoku', tag: 'Count the towers in view', how: 'Skyscrapers: every row and column holds each tower height once, and each border clue counts the towers visible from there, taller ones hiding shorter ones. 5x5 weekdays, 7x7 Sundays, nothing counted against you, the clock decides the day.', color: '#075985', colorNavy: '#58b7f2' },
  { key: 'mercury', miss: null, name: 'Mercury', cat: 'Sudoku', tag: 'The daily thermo sudoku', how: 'Thermo sudoku: digits get bigger along every thermometer from its round bulb, and the ordering does the work no sums are asked to do. Sundays print just eight digits under nine thermometers.', color: '#991b1b', colorNavy: '#f18c8c' },
  { key: 'atlas', miss: 'Asked', name: 'Atlas', cat: 'Geography', subject: 'Geography', tag: 'Twenty-five questions, one life', how: 'Twenty-five geography questions climb from gimme to expert, five rounds of five cycling capitals, the physical world, flags and borders, places and landmarks, and countries and peoples. One wrong answer or an empty clock ends the run.', color: '#047857', colorNavy: '#4ade9c' },
  { key: 'calc', miss: 'Tries', name: 'Calc', cat: 'Numbers', tag: 'Walk the calculator', how: 'The buttons alternate number, operator, number, so the route you walk from the first to the last is a sum. Read it left to right and land on exactly the target.', color: '#be123c', colorNavy: '#fb7185' },
  { key: 'sport', miss: 'Asked', name: 'Sport', cat: 'Trivia', subject: 'Sports', tag: 'Twenty-five questions, one life', how: 'Twenty-five sports questions climb from gimme to expert, five rounds of five cycling the NFL, the NBA, MLB, soccer and everything else. One wrong answer or an empty clock ends the run.', color: '#7c2d12', colorNavy: '#f2a56b' },
  { key: 'encore', miss: 'Checks', name: 'Encore', cat: 'Word', tag: 'The daily crossword', how: 'Fill the nine by nine crossword from fair clues, with every square crossed by an answer in both directions. The timer stops when the grid is right, and Sundays run eleven by eleven.', color: '#1d4ed8', colorNavy: '#86a9ff' },
  { key: 'knight', miss: null, name: 'Knight', cat: 'Sudoku', tag: 'The daily anti-knight sudoku', how: 'An ordinary sudoku plus one rule: a digit may not repeat anywhere a chess knight could jump to it, two squares one way and one square across. Nothing is drawn on the grid, the rule reaches across boxes instead of inside them, and the board prints far fewer digits than a sudoku usually needs.', color: '#3730a3', colorNavy: '#9d99f0' },
  { key: 'diag', miss: null, name: 'Diag', cat: 'Sudoku', tag: 'The daily diagonal sudoku', how: 'An ordinary sudoku plus one rule: each of the two long diagonals, corner to corner, also holds every digit exactly once. The diagonals are ruled across the grid and count as houses of their own, so the board prints fewer digits than a plain sudoku needs.', color: '#0e7490', colorNavy: '#7dd3fc' },
  { key: 'frame', miss: null, name: 'Frame', cat: 'Sudoku', tag: 'The daily frame sudoku', how: 'An ordinary sudoku plus a number outside every row and column end: the total of the first three squares reading in from that edge. Thirty-six sums, every one printed, and far fewer digits inside the grid than a sudoku usually needs.', color: '#b45309', colorNavy: '#f2c27a' },
  { key: 'rim', miss: null, name: 'Rim', cat: 'Sudoku', tag: 'The daily outside sudoku', how: 'A sudoku with nothing printed inside the grid. Outside some row and column ends, the three digits of the first three squares from that edge are printed, in no order. The blank gutters are the puzzle.', color: '#4d7c0f', colorNavy: '#bef264' },
  { key: 'polka', miss: null, name: 'Polka', cat: 'Sudoku', tag: 'No numbers, only dots', how: 'Kropki sudoku: not one digit is printed. A white dot means the neighbours differ by 1, a black dot means one is double the other, and no dot means neither, so the silences are clues too.', color: '#16a34a', colorNavy: '#67dd9a' },
  { key: 'biz', miss: 'Asked', name: 'Biz', cat: 'Trivia', subject: 'Business', tag: 'Twenty-five questions, one life', how: 'Twenty-five business questions climb from gimme to expert, five rounds of five cycling brands and products, markets and money, founders and bosses, deals and disasters, and business history. One wrong answer or an empty clock ends the run.', color: '#0f5132', colorNavy: '#4fbf8b' },
  { key: 'script', miss: 'Asked', name: 'Script', cat: 'Trivia', subject: 'Film & TV', tag: 'Twenty-five questions, one life', how: 'Twenty-five film and television questions climb from gimme to expert, five rounds of five cycling movies, television, actors and directors, awards and box office, and behind the scenes. One wrong answer or an empty clock ends the run.', color: '#4a1d6b', colorNavy: '#c9a4ea' },
  { key: 'quotes', miss: 'Asked', name: 'Quotes', cat: 'Trivia', subject: 'Quotations', tag: 'Twenty-five questions, one life', how: 'Twenty-five famous lines climb from gimme to expert, five rounds of five cycling presidents and politics, history and war, science and letters, books and authors, and screen lines. Four lanes ask who really said it and the fifth asks which character. One wrong answer or an empty clock ends the run.', color: '#3d4f7c', colorNavy: '#a8b8e8' },
  { key: 'focus', miss: 'Misses', name: 'Focus', cat: 'Trivia', tag: 'Name the zoomed-in photo', how: 'One photo a day, shown first as a tight crop at nine times. Type its name and pick it from the day’s list. Every wrong name pulls the camera back one frame; the sixth frame is the whole photo and one last guess. Frame 1 is 6 points, frame 6 is 1. A new subject every day of the week.', color: '#8a4b08', colorNavy: '#fdba74' },
  { key: 'thread', miss: 'Wrong calls', name: 'Thread', cat: 'Trivia', tag: 'Nine films described badly, one thread', how: 'Nine films, each described in one sentence by someone who missed the point, and all nine share one hidden thread. Type titles in any order, no penalty for a miss. Call the thread whenever you like: the earlier you call it right, the more it pays, and three wrong calls lock it. Sundays run sixteen films and two threads.', color: '#8b2c6b', colorNavy: '#e9a3d0' },
  // Slot posts nothing against you: the score is exact placements, the
  // near misses ride in `progress` as the tiebreak, so `miss` is null and the
  // board falls through score, then progress, then the clock.
  { key: 'slot', miss: null, name: 'Slot', cat: 'Trivia', tag: 'Ten things, one at a time', how: 'Ten real things on one axis arrive one at a time. Place each in a slot before you see the next, and nothing moves once it is down. The reveal shows the true order beside yours, and the order they arrive in is the difficulty: Monday deals the anchors first, Saturday the middle. Sundays run twelve slots.', color: '#4a5d23', colorNavy: '#b8cf6e' },
  { key: 'whittle', miss: 'Slips', name: 'Whittle', cat: 'Sudoku', tag: 'The sudoku, backwards', how: 'A solved 6x6 sudoku with eighteen clues printed on it, and the play is taking them away: a clue comes out only while the grid still has exactly one answer. Nothing goes back, so the order is the whole game, and every board carries the proven fewest clues any order can leave.', color: '#854d0e', colorNavy: '#dcae6a' },
  { key: 'flank', miss: 'Wrong', name: 'Flank', cat: 'Geography', tag: 'Name every neighbor', how: 'One country a day, and every country that shares a land border with it is an answer. Type them all before three wrong countries end the run. Mondays start with a single border and Sunday hands you a giant, with a fourth strike to spend.', color: '#3f6212', colorNavy: '#b1d977' },
];

// Each entry gets its conventional route, button image, and localStorage key.
// A row may override href when its route no longer matches its key (Parker,
// renamed from Park while keeping the 'park' quiz-id prefix). img and store stay
// key-derived so no asset or saved game has to move.
export const DAILY_GAMES = RAW.map((g) => ({
  ...g, href: g.href || `/${g.key}`, img: `/games/btn-${g.key}.png`, store: `sot_${g.key}_day`,
}));

export const DAILY_KEYS = DAILY_GAMES.map((g) => g.key);

// GAME FAMILIES (owner, 2026-09-04). A family is ONE puzzle at several fixed
// sizes, banked as separate games because the size is frozen into every board,
// every stored perfect and every leaderboard row behind them. Widening a live
// game is therefore never on; a new size is a new game, and the family is what
// ties them back together.
//
// The jam family is Parker (6x6), Impound (7x7) and Junkyard (8x8), listed in
// ascending size, and THAT ORDER IS THE LADDER: a player who finishes one is
// handed the next size up they have not played yet, wrapping back to the
// smallest, so the three read as one progression rather than three Logic
// entries that happen to look alike. Eight is the last rung there can be:
// lib/jam-core packs occupancy into two 32-bit words, so 64 cells is the
// engine's ceiling.
//
// THIS IS THE ONLY PLACE A FAMILY IS DECLARED. app/useNextUnplayed.js reads it
// through familyAfter() and nothing else keeps a second list of these keys, for
// the same reason the scoring comparators were collapsed into one factory: a
// second copy is a copy that drifts. scripts/verify-junkyard.mjs check 10
// asserts every member is present in BOTH rosters the pick resolves against,
// because a missing key is dropped silently and the ladder just loses a rung.
export const GAME_FAMILIES = {
  jam: ['park', 'impound', 'junkyard'],
};

// The rest of `key`'s family, in ladder order starting from the rung AFTER it
// and wrapping past the end. Empty for a game in no family, which is every
// other daily, so a caller can use it unconditionally.
export function familyAfter(key) {
  for (const members of Object.values(GAME_FAMILIES)) {
    const i = members.indexOf(key);
    if (i !== -1) return [...members.slice(i + 1), ...members.slice(0, i)];
  }
  return [];
}

// PREMIERES (owner, 2026-09-01). A returning player who has never played one
// of these is shown app/PremierePop.jsx on their first home arrival inside the
// window, once per browser. `from` and `until` are ET dates, inclusive: Thread
// and Focus show through the end of Saturday 2026-09-05 and then go silent for
// good. A new launch is one line here; name, tag and glyph come off its row.
export const PREMIERES = [
  { key: 'thread', from: '2026-09-01', until: '2026-09-05' },
  { key: 'focus', from: '2026-09-01', until: '2026-09-05' },
  { key: 'blitzed', from: '2026-09-03', until: '2026-09-07' },
  { key: 'sums', from: '2026-09-03', until: '2026-09-07' },
  { key: 'hinge', from: '2026-09-03', until: '2026-09-07' },
  { key: 'finesse', from: '2026-09-03', until: '2026-09-07' },
  { key: 'whittle', from: '2026-09-04', until: '2026-09-08' },
  { key: 'impound', from: '2026-09-04', until: '2026-09-08' },
  { key: 'slot', from: '2026-09-04', until: '2026-09-08' },
  { key: 'junkyard', from: '2026-09-04', until: '2026-09-08' },
  { key: 'diag', from: '2026-09-08', until: '2026-09-12' },
  { key: 'frame', from: '2026-09-08', until: '2026-09-12' },
  { key: 'rim', from: '2026-09-08', until: '2026-09-12' },
];

// GAMES THAT NEVER HAND OVER THEIR ANSWER (owner, 2026-08-09). Audited across
// all 56 clients: these twelve can reach the end of a run without the player ever
// being shown the solution. The six End Game titles say so in their own code
// ("the forced mate is still there in the position, so take another run at
// it"), and Parker, Rung, Taire and Chomp print par and perfect but never a
// route. Babel prints the benchmark and never the line. Barter joined them on
// 2026-08-26: it used to fill the grid in the moment the trade budget ran out,
// which is the one thing a board ranked on attempts cannot do, since a busted
// player would be handed the target and could re-execute it for a perfect 10.
//
// Everything else discloses on every terminal path: Crux fills its grid on a
// loss, Links prints the unsolved groups, Circa names the year, and the
// reveal-button games fill the solution in when you press it. A game that has
// already shown you the answer has nothing left to come back for, so it can
// never be "incomplete" -- it is simply done.
//
// Lode is deliberately NOT here. It withholds nothing because it HAS no single
// answer: it is an open word hunt you cash in whenever you like.
//
// This is what the slate's Incomplete today group is drawn from. A finished,
// non-abandoned run of one of these games that did not solve it is incomplete;
// the same run on any other game is complete.
export const KEEPS_ANSWER = new Set(DAILY_GAMES.filter((x) => x.keepsAnswer).map((x) => x.key));
export const DAILY_GAME_MAP = Object.fromEntries(DAILY_GAMES.map((g) => [g.key, g]));

// WHAT COUNTS AS SOLVED, FOR ONE STORED ROW (owner, 2026-08-10). Every daily
// posts `correct: won ? 1 : 0`, and the two routes that split a player's
// finished runs into Complete today and Incomplete today read that flag:
// api/quiz/daily-status for the slate and api/quiz/daily-game for the archive
// calendar. It is the right test wherever a game's WIN condition is also its
// COMPLETION condition, which is everywhere but here.
//
// Babel is the exception. You are playing an opponent, and the game's win is
// the solver BENCHMARK: the spread our own engine makes from your seat against
// the same defence. That is a stretch bar sitting well above the thing the
// player came to do, so a run that beat the computer by less than the benchmark
// was landing in the red group on a game the player had just won (owner report,
// 2026-08-10). A game flagged `solvesOnScore` completes on SCORE > 0 instead.
// On Babel that is exactly "beat the computer": the client posts
// `score: Math.max(0, spread)`, so a positive score is a positive spread, and a
// loss or a dead-even finish is 0 and stays incomplete.
//
// THIS IS A COMPLETION TEST AND NOTHING ELSE. The benchmark still owns every
// other verdict on Babel, all of which read the posted flag or the raw figures
// rather than this helper: the end card's win state, the share tick, the
// streak, and IQ Points, which grade score against total and so still curve
// toward the benchmark rather than paying a full solve for a one-point spread.
export const SOLVES_ON_SCORE = new Set(DAILY_GAMES.filter((x) => x.solvesOnScore).map((x) => x.key));

// The completion verdict for a stored quiz_results row. Rows written before
// correct_count existed (migration 24) fall back to the old score === total
// test, exactly as the two routes did inline before this moved here.
export function dailySolvedRow(row) {
  if (!row) return false;
  const m = DAILY_DATED_RE.exec(row.quiz_id || '');
  if (m && SOLVES_ON_SCORE.has(m[1])) return (Number(row.score) || 0) > 0;
  if (row.correct_count == null) {
    const total = Number(row.total) || 0;
    return total > 0 && Number(row.score) === total;
  }
  return Number(row.correct_count) > 0;
}

// TALLY GAMES (owner, 2026-08-08). Most dailies score against a fixed set of
// answers, so "7/10" reads correctly: three were missed. A tally game scores an
// open-ended count instead (Blocks: rows cleared), where the denominator is a
// PAR for the completion points and not a set of answers anyone failed to get.
// Rendering it as a fraction reads as a failure it is not, which is exactly
// what Blocks day one looked like: every real run showed as 0/10 or 1/10 on the
// slate and the loft. A tally game carries a `unit`, and two things follow:
//
//   1. every surface renders the bare count with its unit, "7 rows", never a
//      fraction. Go through dailyScoreText() so they all agree.
//   2. a ZERO-tally run breaks its tie on the second figure DESCENDING (shapes
//      SURVIVED), because nothing was cleared and survival is the only signal
//      left. Honored in lib/daily-combined scoreGame and lib/quiz-anon
//      buildLeaderboard, which must stay identical or the two boards disagree.
export function dailyUnit(key) { return (DAILY_GAME_MAP[key] || {}).unit || null; }

// The unit for a stored quiz_id ('blocks-8-9-26'), for the scoring code, which
// sees rows rather than game keys. Every row of one puzzle shares a quiz_id, so
// call this once per board and never once per comparison.
export function dailyUnitOfQuizId(id) {
  const m = DAILY_DATED_RE.exec(id || '');
  return m ? dailyUnit(m[1]) : null;
}

// ARCADE GAMES (owner, 2026-08-08). Every other daily is one puzzle with one
// answer, so the board keeps your FIRST attempt: a replay there is playing a
// puzzle whose answer you already know, and letting it score would make the
// board a test of who replayed. An arcade game has no answer to spoil. It is an
// endless run against a fixed shape order, so replaying IS the game, and an
// arcade cabinet's high-score table has always taken your best of the night.
// Arcade games therefore accept UNLIMITED submissions and rank a player on
// their BEST run of the day.
//
// Honored in TWO places that must stay identical, exactly like the tally
// tiebreak above, or the per-game board and the combined board disagree on
// order: lib/daily-combined scoreGame (the daily boards and the combined
// standings) and lib/quiz-anon buildLeaderboard (whose "first try" view becomes
// a best-run view on an arcade game).
//
// IQ Points are deliberately NOT part of this. XP_DAILY_CAP in lib/quiz-xp caps
// an arcade game's whole DAY at its ceiling however many runs are posted, so
// unlimited runs compete for the leaderboard without becoming a way to grind
// the standings. The leaderboard is the prize here; IQ is not.
export function isArcade(key) { return (DAILY_GAME_MAP[key] || {}).cat === 'Arcade'; }

// The arcade flag for a stored quiz_id ('blocks-8-9-26'), for the scoring code,
// which sees rows rather than game keys. Every row of one puzzle shares a
// quiz_id, so call this once per board and never once per comparison.
export function isArcadeQuizId(id) {
  const m = DAILY_DATED_RE.exec(id || '');
  return !!m && isArcade(m[1]);
}

// WHICH RUN IS THE BEST RUN (owner, 2026-08-14).
//
// isArcade says a player is credited with their BEST run of the day. Deciding
// WHICH run that is was left to whoever happened to be asking, and four callers
// asked four different questions. The two board scorers got it right off their
// own field comparators (lib/daily-combined scoreGame, lib/quiz-anon
// buildLeaderboard). The other two never asked at all: both guest row choosers
// (app/api/quiz/daily-combined and app/api/quiz/daily-game) hardcoded the lowest
// row id, so a guest's arcade points came off their first run, and recordStat in
// both arcade clients refused to overwrite an existing entry, so a player's own
// record and streak kept run one while the board beside it showed their best. A
// player who topped out in 3 rows and then cleared 40 was credited with 3.
//
// So the question gets ONE answer. `arcadeRanks(a, b, tally)` is negative when
// `a` is the better run, over anything row-shaped ({ score, guesses_used,
// time_elapsed }). It is the same three terms in the same order the two board
// comparators use, which for an arcade row is all they can reach: no arcade game
// is an End Game title or Pricer, and none posts `progress`, so their score /
// depth / clock chain reduces to exactly this. Proved rather than asserted: the
// deploy harness runs all three over random arcade fields and requires identical
// order on every pair.
//
// The two scorers keep their own comparators, because theirs also SORT the field
// and a selection rule that disagreed with the sort inside one file would be
// worse than the drift this replaces. They are the two callers that were already
// correct; this is for the two that were not.
//
// `tally` is the day's unit rule, passed in rather than looked up because the
// clients compare local stat entries that carry no quiz_id: on a tally game a
// ZERO-score run ranks on shapes SURVIVED rather than fewest used, or topping out
// in 8 shapes would outrank a five-minute run that also never cleared a row.
export function arcadeRanks(a, b, tally) {
  const second = (tally && Number(a.score) === 0)
    ? ((b.guesses_used ?? -1) - (a.guesses_used ?? -1))
    : ((a.guesses_used ?? 1e9) - (b.guesses_used ?? 1e9));
  return (b.score - a.score)
    || second
    || ((a.time_elapsed ?? 0) - (b.time_elapsed ?? 0));
}

// The comparator bound to one game's tally rule, or NULL when the game is not
// arcade. Null is the point: a caller writes `arcadeRank ? ... : <the old rule>`
// and every non-arcade game keeps its existing behavior untouched.
export function arcadeRanksForKey(key) {
  if (!isArcade(key)) return null;
  const tally = !!dailyUnit(key);
  return (a, b) => arcadeRanks(a, b, tally);
}

// The same, for code that holds a stored quiz_id ('blocks-8-9-26') rather than a
// game key. Every row of one puzzle shares a quiz_id, so bind this ONCE per
// board and never once per comparison.
export function arcadeRanksForQuizId(id) {
  const m = DAILY_DATED_RE.exec(id || '');
  return m ? arcadeRanksForKey(m[1]) : null;
}

// END GAME BOARDS RANK ON ATTEMPTS TO SOLVE (owner, 2026-08-12).
//
// Every other daily keeps a player's FIRST attempt, because a replay there is
// playing a puzzle whose answer you already know. The End Game titles are the
// one family where that is not true: they never hand over the answer (see
// KEEPS_ANSWER above), a loss scores 0, and the whole design invites you to take
// another run at the same position. So the question the board should answer is
// not "did you get it first time", it is "how many runs did it take you", and
// the player who solved Four in 24 tries ranks above the one who needed 25.
//
// Three tiers, then attempts, then the clock:
//   0  SOLVED   score reached total. Ranked by the attempt number the win
//               landed on, then by the time of THAT run (the number on screen
//               when they won), never the sum of their failed runs: a slow
//               loser is already ranked down by the extra attempt.
//   1  DRAWN    a partial score. Four is the only End Game game that can end
//               this way (a draw posts 4 of 10) and the owner ruled it its own
//               tier: the position was already won, so holding a draw is not
//               solving it, but it is not the same as losing either.
//   2  UNSOLVED score 0 on every run. Attempts are IGNORED here on purpose, or
//               the board would rank the player who gave up once above the one
//               who fought through five. They order on the existing depth term
//               (progress, then guesses) instead, so how far they got is what
//               separates them.
//
// Returns { chosen, info }. `info` covers EVERY row, so a board showing all
// attempts (the 'all' filter, playerPlacement) still sorts sensibly; `chosen` is
// the ONE row that represents each player, which is the winning run where there
// is one rather than the first run. Tiers agree with score order (10 > 4 > 0),
// so this subsumes the score term rather than fighting it.
//
// Lives HERE, in the registry both scoring files already import, rather than
// being copied into each of them. lib/daily-combined scoreGame and lib/quiz-anon
// buildLeaderboard have to agree on order exactly, and the way that guarantee
// has been kept until now is two hand-maintained copies of the same comparator.
// One shared function cannot drift.
export function isEndGame(key) { return (DAILY_GAME_MAP[key] || {}).cat === 'End Game'; }

export function isEndGameQuizId(id) {
  const m = DAILY_DATED_RE.exec(id || '');
  return !!m && isEndGame(m[1]);
}

// THE ATTEMPTS RULE IS A STRUCTURE, NOT A CATEGORY (owner, 2026-08-26).
//
// "Rank on how many runs it took" was written for End Game and gated on the End
// Game category, which is the same mistake wantsFastRetry made and had to undo:
// the category was where the structure happened to live, not what the structure
// IS. Three things make a board rankable on attempts, and none of them is a
// category:
//
//   1. the game never hands over its answer (KEEPS_ANSWER), so a replay is not
//      a re-execution of something it just showed you;
//   2. a replay of the SAME board is the design rather than a loophole, which
//      on these five is the whole pitch: every one of them prints a proven
//      minimum you are being invited to walk back toward;
//   3. there is one honest verdict per run to rank.
//
// Barter, Chomp, Parker, Rung and Taire pass all three and are not End Game
// titles, so the rule takes a MODE rather than a category test:
//
//   'binary'  the End Game shape. A run is solved, drawn or not finished, the
//             tiers carry the whole score signal (10 / 4 / 0), and attempts
//             separate the solvers. Unchanged, byte for byte.
//   'graded'  the efficiency shape. Every finish scores somewhere on a scale
//             (Barter 10 at par down to 1; the lib/par.js family 10 at perfect,
//             8 at par, floor 1), so SCORE leads and attempts are the tiebreak
//             that used to be dead: on four of the five the old second term,
//             guesses_used, is a pure function of the score (Barter's score IS
//             10 - 2 x trades over par), so it could never break a tie it was
//             asked to break, and the board fell straight through to the clock.
//
// A graded player is represented by their BEST run, not their first and not the
// one they won on, since every finish is a win of some size. Ties on score keep
// the EARLIER run, which is what makes "fewer runs" the tiebreak rather than a
// thing to farm.
//
// WHY THE ZERO-SCORE COHORT IS NOT RANKED ON ATTEMPTS. Same reason tier 2 is
// not: ranking them fewest-first puts the player who gave up once above the one
// who fought through five. They fall to the same depth term every other board
// uses.
export const ATTEMPTS_CUTOVER = { y: 2026, m: 8, d: 26 };

// DATE-GATED, because turning it on re-ranks days already played: an unscored
// replay somebody took last week would suddenly count, and a crown is decided
// once (see the day-freeze rule in CLAUDE.md). Same shape as bestNForSuffix and
// usesLadder in lib/daily-combined, kept HERE rather than imported because
// daily-combined imports this file and the other direction would be circular.
// An unparseable id reads as the CURRENT rule, exactly as those two treat one.
//
// End Game is deliberately NOT gated: its rule went live 2026-08-12 and every
// End Game day since has been scored under it, so gating it now would be the
// retroactive change this constant exists to prevent.
function attemptsSuffixLive(id, c) {
  const m = /(\d{1,2})-(\d{1,2})-(\d{2})$/.exec(String(id || ''));
  if (!m) return true;
  const mo = +m[1], da = +m[2], y = 2000 + +m[3];
  return y > c.y || (y === c.y && (mo > c.m || (mo === c.m && da >= c.d)));
}

// 'binary' | 'graded' | 'trades' | null, by game KEY. Null is every other daily:
// first attempt only, which is what a game whose answer you have already seen
// deserves. 'trades' is the attempts-first shape (owner, 2026-09-02): see the
// comparator below for why it is not just a reordered 'graded'.
export function attemptsMode(key) {
  if (isEndGame(key)) return 'binary';
  const m = (DAILY_GAME_MAP[key] || {}).attempts;
  return (m === 'graded' || m === 'trades') ? m : null;
}

// The same, for the scoring code, which sees stored quiz ids rather than keys.
// This is the one that applies the cutover, because only an id carries a date.
// Call it ONCE per board and never once per comparison.
export function attemptsModeForQuizId(id) {
  const m = DAILY_DATED_RE.exec(id || '');
  if (!m) return null;
  const mode = attemptsMode(m[1]);
  if (mode === 'graded' && !attemptsSuffixLive(id, ATTEMPTS_CUTOVER)) return null;
  return mode;
}

// THE FAST-RETRY PANEL IS NOT AN END GAME PROPERTY (owner, 2026-08-22).
//
// An unsolved finish on some dailies is answered by another go at it, now, not
// by a page of furniture (see the panel in app/LoftFinish.jsx). That started as
// a category test -- End Game, which ranks you on how many runs the solve took,
// and Arcade, which takes your best run of the day -- because those were the
// eight games where a replay changes the board. But WANTING a replay and having
// it SCORE are two different things, and Chomp is the case that separates them:
// it is Logic, so only its first attempt counts, and yet the re-deal is free,
// the board is small, and the rules push another run hard enough that the
// clearing run is usually the second one. Making a player read an IQ bar, a
// leaderboard and eight tiles of somewhere else to be before they can take it
// is the same wrong answer the panel was written to fix.
//
// So a game can opt in with `fastRetry: true` on its registry row, and the two
// categories keep it by default. The panel's own copy still comes from
// dailyAttemptRule below, so an opted-in game that keeps the first attempt says
// so on the button and cannot promise a score it does not pay. It still needs a
// real replay handler and an UNSOLVED finish; both are tested at the panel.
export function wantsFastRetry(key) {
  return !!attemptsMode(key) || isArcade(key) || !!(DAILY_GAME_MAP[key] || {}).fastRetry;
}

// ATTEMPT-RULE COPY (owner, 2026-08-12). Three kinds of daily count a replay
// three different ways, and until now NO reader-facing surface said so: an
// ordinary daily keeps your FIRST attempt, an End Game title ranks you on how
// many runs the solve took (isEndGame above), and an Arcade game takes your
// BEST run of the day (isArcade above). Worse, the replay buttons asserted
// "Practice run" on every game, which went wrong for End Game the day its
// board moved to attempts.
//
// The copy lives HERE, beside the two predicates that decide it, for the same
// reason endGamePlan does: a footnote kept in four components is four mirrors
// that drift, and a leaderboard caption that disagrees with lib/quiz-anon
// buildLeaderboard is worse than no caption. Any new rule goes here too.
//   `board`  the leaderboard footnote sentence
//   `replay` the sub-label under a "play again" control
//   `chip`   the short chip on the end card's replay button
// A null/unknown key falls to the ordinary first-attempt rule, which is what
// every game outside those two categories does.
export function dailyAttemptRule(key) {
  // Keyed by GAME, so it states TODAY's rule and cannot apply the cutover in
  // attemptsModeForQuizId. That is right for a control a player is about to
  // press: it describes the run they are about to take, never an archived day.
  if (attemptsMode(key) === 'trades') {
    return {
      board: 'Every attempt counts here, and the board ranks you on how few runs it took, then on trades.',
      replay: 'Replays count. The board ranks you on how few runs it took, so your first solve is your best standing.',
      chip: 'Replays count',
    };
  }
  if (attemptsMode(key) === 'graded') {
    return {
      board: 'Every attempt counts here, and your best run of the day takes the board, with fewer runs breaking the tie.',
      replay: 'Replays count. Your best run takes the board, and fewer runs breaks a tie.',
      chip: 'Replays count',
    };
  }
  if (isEndGame(key)) {
    return {
      board: 'Every attempt counts here, and the board ranks you on how many runs it took.',
      replay: 'Replays count. The board ranks you on how many runs the solve took.',
      chip: 'Replays count',
    };
  }
  if (isArcade(key)) {
    return {
      board: 'Runs are unlimited here, and your best run of the day takes the board.',
      replay: 'Runs are unlimited. Your best run of the day takes the board.',
      chip: 'Best run counts',
    };
  }
  return {
    board: 'Only your first attempt counts on the leaderboard.',
    replay: 'Practice run. Only your first attempt counts, and your streak stands.',
    chip: 'Practice run',
  };
}

// A single row's verdict. On BINARY the total is 10 on every End Game game, and
// a row written before `total` existed would read 0, so the guard keeps such a
// row out of the solved tier rather than crediting a win it cannot prove.
//
// On GRADED there is no drawn tier: every finish scores at least 1 by design
// (finishing always beats walking away, see lib/par.js), so the only distinction
// a tier can honestly carry is finished against nothing at all. The graded
// comparator ranks on SCORE anyway and never reads the tier, which is why the
// two agreeing costs nothing; the tier is emitted so the boards can tell a
// dash-because-unsolved apart from a game that posts no attempt count.
function endGameTier(r, graded) {
  const total = Number(r.total) || 0;
  const score = Number(r.score) || 0;
  if (graded) return score > 0 ? 0 : 2;
  if (total > 0 && score >= total) return 0;
  return score > 0 ? 1 : 2;
}

// Which of a player's two runs represents them. Strictly-better only, so a dead
// heat keeps the EARLIER run and nobody improves their standing by replaying to
// the same result.
function attemptBeats(a, b, ia, ib, graded, trades) {
  // TRADES: attempts lead, so the EARLIEST finished run is already the best
  // standing this player can hold and no later run can improve it. A player who
  // never finished is represented by the run that got furthest, exactly as
  // tier 2 is.
  if (trades) {
    const fa = (Number(a.score) || 0) > 0, fb = (Number(b.score) || 0) > 0;
    if (fa !== fb) return fa;
    if (fa) return false;
    const pa2 = Number.isFinite(a.progress) ? a.progress : -1;
    const pb2 = Number.isFinite(b.progress) ? b.progress : -1;
    return pa2 > pb2 || (pa2 === pb2 && (a.time_elapsed ?? Infinity) < (b.time_elapsed ?? Infinity));
  }
  if (graded) return (Number(a.score) || 0) > (Number(b.score) || 0);
  if (ia.tier !== ib.tier) return ia.tier < ib.tier;
  if (ia.tier !== 2) return false;              // first win, then first draw
  const pa = Number.isFinite(a.progress) ? a.progress : -1;
  const pb = Number.isFinite(b.progress) ? b.progress : -1;
  return pa > pb || (pa === pb && (a.time_elapsed ?? Infinity) < (b.time_elapsed ?? Infinity));
}

export function attemptsPlan(rows, mode) {
  const trades = mode === 'trades';
  // 'trades' shares the graded TIER (finished or not) and the graded flag every
  // other reader keys off; only the pick rule and the comparator differ.
  const graded = mode === 'graded' || trades;
  const keyOf = (r) => (r.user_id ? `u:${r.user_id}` : (r.anon_id ? `a:${r.anon_id}` : `r:${r.id}`));
  // Chronological by id, which is the order the attempts were actually played:
  // attempt N is the Nth row this player posted for this puzzle. Every End Game
  // run posts exactly one row (a win, a loss, a give-up, a restart, or the
  // pagehide abandon flush), so rows and runs are the same thing.
  const byUser = new Map();
  for (const r of (rows || []).slice().sort((a, b) => (a.id || 0) - (b.id || 0))) {
    if (!r) continue;
    const k = keyOf(r);
    let list = byUser.get(k);
    if (!list) { list = []; byUser.set(k, list); }
    list.push(r);
  }
  const info = new Map();
  const chosen = new Set();
  for (const list of byUser.values()) {
    for (let i = 0; i < list.length; i++) info.set(list[i], { tier: endGameTier(list[i], graded), tries: i + 1, graded, trades });
    // BINARY: the winning run represents the player, whichever attempt it landed
    // on; a draw only represents them when they never went on to win, so a player
    // who drew on try 1 and won on try 3 is a 3-try solver, not a drawer; and a
    // player who never finished is represented by the run that got FURTHEST, not
    // their first, because replays count for solvers so they count for everyone.
    // GRADED: their best-scoring run, ties to the earlier.
    let pick = 0;
    for (let i = 1; i < list.length; i++) {
      if (attemptBeats(list[i], list[pick], info.get(list[i]), info.get(list[pick]), graded, trades)) pick = i;
    }
    chosen.add(list[pick]);
  }
  return { chosen, info };
}

// The End Game plan, unchanged, kept as its own export for every caller and
// checker that was written against it.
export function endGamePlan(rows) { return attemptsPlan(rows, 'binary'); }

// THE COMPARATOR ITSELF LIVES HERE TOO (owner, 2026-08-26), for the reason the
// plan does: lib/daily-combined scoreGame and lib/quiz-anon buildLeaderboard have
// to agree on order exactly, and the way that guarantee was kept until now is
// two hand-maintained copies of the same twelve lines. One shared factory cannot
// drift. `depth` is passed in rather than reimplemented because each caller
// already owns its own (it folds in the tally rule, which is a property of the
// board and not of this rule).
export function attemptsRanker(plan, mode, depth) {
  const infoOf = (r) => plan.info.get(r);
  const clock = (a, b) => (a.time_elapsed ?? 0) - (b.time_elapsed ?? 0);
  if (mode === 'trades') {
    // ATTEMPTS FIRST (owner, 2026-09-02). Barter's score IS its trades
    // (10 - 2 x trades over par, floored at 1), so score and trades are one
    // quantity and trades is the finer of the two: two players both pinned to
    // the floor still differ in trades, and par is per-board so trades over par
    // sorts identically to raw trades within a day. Score therefore drops out
    // as a term rather than leading, and nothing is lost by it.
    //
    // A player who never finished sits BELOW every finisher and is never ranked
    // on attempts, for the reason tier 2 is not: fewest-first would put a
    // one-and-quit above someone who fought through five. They fall to depth.
    return (a, b) => {
      const A = infoOf(a), B = infoOf(b);
      if (!A || !B) return 0;
      const fa = (Number(a.score) || 0) > 0 ? 0 : 1;
      const fb = (Number(b.score) || 0) > 0 ? 0 : 1;
      return (fa - fb)
        || (fa === 0
          ? (A.tries - B.tries) || ((a.guesses_used ?? 1e9) - (b.guesses_used ?? 1e9))
          : depth(a, b))
        || clock(a, b);
    };
  }
  if (mode === 'graded') {
    // Score leads: a graded finish is worth what it scored, whatever run it
    // landed on. Attempts break the tie among finishers only; a zero falls to
    // depth, or the board would rank giving up once above fighting through five.
    return (a, b) => {
      const A = infoOf(a), B = infoOf(b);
      if (!A || !B) return 0;
      return ((Number(b.score) || 0) - (Number(a.score) || 0))
        || ((Number(a.score) || 0) > 0 ? A.tries - B.tries : depth(a, b))
        || clock(a, b);
    };
  }
  // An End Game row's tier already agrees with its score (10 solved, 4 drawn,
  // 0 unsolved), so the tier term REPLACES the score term rather than sitting
  // behind it.
  return (a, b) => {
    const A = infoOf(a), B = infoOf(b);
    if (!A || !B) return 0;
    return A.tier - B.tier
      || (A.tier < 2 ? A.tries - B.tries : depth(a, b))
      || clock(a, b);
  };
}

// One score, formatted the way its game reports it: "7 rows" for a tally game,
// "7/10" for everything else. Takes the game KEY, not the quiz id.
export function dailyScoreText(key, score, total) {
  if (score == null) return null;
  const u = dailyUnit(key);
  if (u) return `${score} ${Number(score) === 1 ? u.replace(/s$/, '') : u}`;
  return total != null && Number(total) > 0 ? `${score}/${total}` : String(score);
}

// RETIRED GAMES. A daily retires the day AFTER the final drop in its bank. It
// keeps scoring every archived day, so it stays in the roster above, in
// DAILY_KEYS and DAILY_DATED_RE, in the admin regexes and in the slate's puzzle
// map, and it stays playable at its own route and in the Retired section of the
// archive. What it loses is TODAY: it leaves the day roster, the Completionist
// count, and every hub lineup (games grid, home strip, slate rail, promo, and
// the end card's slate). The value is the LAST date the game ever drops, so the
// retirement lands on its own the next morning with no deploy on the day.
//
//   circa  owner ruling 2026-07-20. Bank capped at No. 7, which was that day.
//          Successor: Outrank.
//   extra  owner ruling 2026-08-07. Bank ends at No. 77 on 2026-09-29 and
//          nothing is banked past it. NEVER append another Extra puzzle,
//          including on a "grow all game inventory" pass - see CLAUDE-QUIZZES.md
//          section 7g. Successor: Redact.
export const RETIRED_DAILY = { circa: '2026-07-20', extra: '2026-09-29' };

// Today in Eastern time as 'YYYY-MM-DD', the timezone every daily's `live` date
// is written in. Falls back to UTC where Intl carries no zone data.
export function etTodayISO() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

// True once a game's final banked day is in the past. Both sides are ISO dates,
// so a plain string compare is the date compare. Pass `today` to test a date.
export function isRetiredDaily(key, today) {
  const last = RETIRED_DAILY[key];
  return !!last && (today || etTodayISO()) > last;
}

// The roster actually running today: DAILY_KEYS minus whatever has retired.
export function liveDailyKeys(today) {
  return DAILY_KEYS.filter((k) => !isRetiredDaily(k, today));
}

// Display name for a game key, with a Title-cased fallback for an unknown key.
export function dailyGameName(key) {
  const g = DAILY_GAME_MAP[key];
  return g ? g.name : (key ? key.charAt(0).toUpperCase() + key.slice(1) : key);
}

// A daily play is stored under the quiz_id '<key>-M-D-YY'. DAILY_DATED_RE matches
// only known games; DAILY_ANY_RE matches the shape for any key so a brand-new
// game still gets a clean 'Name: M/D/YY' label the moment it is added above.
export const DAILY_DATED_RE = new RegExp('^(' + DAILY_KEYS.join('|') + ')-(\\d{1,2})-(\\d{1,2})-(\\d{2})$');
const DAILY_ANY_RE = /^([a-z]+)-(\d{1,2})-(\d{1,2})-(\d{2})$/;
export function dailyLabel(id) {
  const m = DAILY_ANY_RE.exec(id || '');
  if (!m) return null;
  const [, key, mo, dy, yr] = m;
  const base = `${dailyGameName(key)}: ${Number(mo)}/${Number(dy)}/${yr}`;
  const date = new Date(Date.UTC(2000 + Number(yr), Number(mo) - 1, Number(dy)));
  if (date.getUTCDay() === 0 && hasSundayEdition(key)) return `${base} (Sunday Edition)`;
  return base;
}

// The department key a dated daily instance files under. Daily days used to be
// hand-seeded into QUIZZES with a matching per-id QUIZ_DEPT entry; this mirrors the
// departments those seeds carried (Word -> word, Geography -> geography,
// Numbers -> science, Logic and the rest -> entertainment) so a row derived from
// play data lands exactly where its seeded siblings did. Keyed off the roster's
// `cat` above, so a new game is filed the moment it is added there.
// Sudoku split out of Numbers on 2026-09-01 and files under the SAME department,
// deliberately: the nine grids' historical rows were seeded as 'science' while they
// were Numbers games, and a category move that also moved the department would have
// walked nine games' worth of play history into a different IQ bucket.
const DAILY_CAT_DEPT = { Word: 'word', Geography: 'geography', Numbers: 'science', Sudoku: 'science' };
export function dailyDept(id) {
  const m = DAILY_DATED_RE.exec(id || '');
  const g = m && DAILY_GAME_MAP[m[1]];
  return (g && DAILY_CAT_DEPT[g.cat]) || 'entertainment';
}
