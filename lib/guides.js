// THE PUZZLE GUIDES: /guides and /guides/<slug> (owner, 2026-11-25).
//
// WHY. A game page ranks for "play <genre> online" ("free daily windoku").
// A searcher who types "how to solve windoku" or "killer sudoku tips" wants a
// different page: rules, a method, and the tricks, then a board to try them
// on. Without one, Google answers those queries with other sites, or makes the
// game page compete with itself. So each guide owns the HOW-TO intent for one
// genre and hands the reader to the matching daily, and the daily's tail
// (app/StageTail.jsx) links back. The game page and the guide never target the
// same words: the game title says "Free Daily X", the guide title says "How to
// Solve X".
//
// WHERE THEY ARE LINKED (so no guide is ever an orphan):
//   - /guides, the hub, from the site footer (app/Footer.jsx FOOTER_COLS);
//   - each guide's game page, through StageTail (guideForGame below);
//   - each category page's "More puzzles" row (lib/puzzle-categories.js adds
//     guidesForCategory to `related`);
//   - the sitemap (lib/sitemap-entries.js).
//
// ADDING A GUIDE: append an entry. `game` must be a live registry key; `also`
// lists the other dailies the guide fits (colour twins, 6x6 siblings), which
// get the same tail link. Keep `title` under 70 characters ending
// "| Mind Loft" and `description` under 160, as every page on the site.
// scripts/verify-guides.mjs checks all of it.
//
// COPY RULES: no em dash, Oxford comma, Title Case for titles and headings
// that act as titles, no answers to any real board, and nothing that goes
// stale (no clue counts a bank regeneration would move).

export const GUIDE_CATS = ['Sudoku', 'Word', 'Logic', 'Numbers'];

export const GUIDES = [
  {
    slug: 'how-to-solve-sudoku',
    game: 'suds',
    also: ['sudstoo', 'sixes', 'sixestoo'],
    cat: 'Sudoku',
    name: 'Sudoku',
    title: 'How to Solve Sudoku: Rules, Strategy, and Tips | Mind Loft',
    h1: 'How to Solve Sudoku',
    description: 'How to solve sudoku step by step: the three rules, scanning, pencil marks, naked and hidden singles, pairs, and pointing. Then try it on a free daily sudoku.',
    intro: 'Sudoku looks like a numbers game, but there is no arithmetic in it. It is a logic puzzle about placement: nine digits, and three overlapping sets of houses that each need all nine exactly once. Every well-made board has one solution you can reach without guessing, and the whole skill is learning where to look next.',
    rules: [
      'The grid is 9 rows by 9 columns, split into nine 3x3 boxes.',
      'Each row, each column, and each box holds the digits 1 to 9 exactly once.',
      'Some digits are printed. You fill in the rest so all three rules hold everywhere.',
    ],
    steps: [
      ['Scan one digit at a time', 'Pick a digit that already appears often, say 5. For each box with no 5 yet, look along the rows and columns that pass through it. Every row and column that already holds a 5 rules out its squares in that box. When only one square is left, that is the 5.'],
      ['Fill the nearly full houses', 'A row, column, or box with only one or two empty squares is quick to finish: list the missing digits and check which one each square can take.'],
      ['Start pencil marks when scanning stalls', 'Write the small candidates in each empty square: every digit not already in its row, column, or box. On a phone, use the notes mode. Pencil marks turn a hard search into a visible one.'],
      ['Look for singles in the marks', 'A naked single is a square with only one candidate left. A hidden single is a digit that has only one possible square in a row, column, or box, even if that square still shows other marks. Both are certain placements.'],
      ['Clean up after every placement', 'Each digit you place erases that digit from the marks of every square it sees. Skipping this step is the most common reason a solver gets stuck on a board that is not actually stuck.'],
    ],
    tips: [
      ['Naked pairs', 'If two squares in one house both show exactly the same two candidates, say 3 and 7, those two digits must go in those two squares. Erase 3 and 7 from every other square in that house. The same works for three squares sharing three candidates.'],
      ['Pointing', 'If, inside one box, every possible square for a digit sits on the same row, the digit must land on that row inside that box. So you can erase it from the rest of that row, outside the box. It works for columns too.'],
      ['Box and line reduction', 'The reverse of pointing: if, in one row, every possible square for a digit sits inside the same box, erase that digit from the rest of the box.'],
      ['Never guess', 'On a properly made sudoku there is always a logical next step. If you cannot find one, it is usually a missed cleanup or a missed hidden single, so rescan before you try anything fancier.'],
    ],
    mistakes: [
      'Placing a digit because it "looks right" and building on it. One wrong digit can carry you a long way before it collides.',
      'Forgetting to erase pencil marks after a placement.',
      'Only ever scanning rows and columns. Boxes hide the most hidden singles.',
    ],
    faq: [
      ['Is sudoku a math puzzle?', 'No. The digits could be letters or colors and nothing would change. Mind Loft has color versions for exactly that reason.'],
      ['What is the best first move in sudoku?', 'Scan for the digit that is already printed the most, and check every box that is still missing it.'],
      ['How long does a daily sudoku take?', 'A gentle 9x9 takes most players five to fifteen minutes. The 6x6 versions take two or three.'],
    ],
  },
  {
    slug: 'how-to-solve-windoku',
    game: 'window',
    also: ['windowtoo'],
    cat: 'Sudoku',
    name: 'Windoku',
    title: 'How to Solve Windoku: Rules and the Hidden Regions | Mind Loft',
    h1: 'How to Solve Windoku',
    description: 'How to solve windoku (window sudoku): the four extra windows, the five hidden regions most players miss, and a step-by-step method. Play a free windoku daily.',
    intro: 'Windoku is ordinary sudoku with four extra regions: shaded 3x3 windows that sit between the boxes. Each window also holds 1 to 9 once. That sounds like a small change, but it gives every square near the middle of the board one more set of neighbors, and it quietly creates five more regions that nobody draws.',
    rules: [
      'Every row, column, and 3x3 box holds 1 to 9 exactly once, as in sudoku.',
      'The four shaded windows (rows 2 to 4 and 6 to 8, crossed with columns 2 to 4 and 6 to 8) each hold 1 to 9 exactly once too.',
    ],
    steps: [
      ['Treat each window as a fourth house', 'When you scan for a digit, check the windows as well as rows, columns, and boxes. A window overlaps four boxes, so a digit placed in one box often pins down where it can sit in the window next door.'],
      ['Scan the overlaps first', 'The squares where a window and a box overlap are seen by the most houses. They are usually where the first placements are.'],
      ['Use the hidden regions', 'Read the section below. Most players solve windoku without them and get stuck halfway.'],
      ['Pencil mark with the windows in mind', 'A square inside a window has one more house to clear candidates from. Erase window peers as carefully as row and column peers.'],
    ],
    tips: [
      ['The five hidden regions', 'Take rows 2 to 4. Together they hold each digit three times. The two windows in those rows take two of each, so the three squares left in columns 1, 5, and 9 of those rows must hold each digit exactly once. That is a hidden nine-square region. The same is true for rows 6 to 8, for columns 2 to 4 and 6 to 8 (using rows 1, 5, and 9), and for the nine squares where rows 1, 5, 9 meet columns 1, 5, 9. Five extra houses, none of them drawn.'],
      ['The center cross', 'Row 5 and column 5 never touch a window, but the hidden regions do. A digit missing from the center lines often has only one home once you count the hidden regions.'],
      ['Window pairs', 'Naked pairs and pointing work inside a window exactly as they do inside a box.'],
    ],
    mistakes: [
      'Forgetting the windows when erasing candidates.',
      'Thinking the corners and edges are ordinary sudoku. The hidden regions reach them too.',
    ],
    faq: [
      ['Is windoku harder than sudoku?', 'The extra rule means fewer printed digits, so it can feel harder at first. Once you use the hidden regions it usually goes faster than a sudoku of the same level.'],
      ['Why is it called windoku?', 'The four shaded blocks look like the panes of a window.'],
      ['Is there a color windoku?', 'Yes. WindowToo uses colors in place of digits, with the same rules.'],
    ],
  },
  {
    slug: 'how-to-solve-killer-sudoku',
    game: 'cages',
    also: ['coop'],
    cat: 'Sudoku',
    name: 'Killer Sudoku',
    title: 'How to Solve Killer Sudoku: Cage Sums and the Rule of 45 | Mind Loft',
    h1: 'How to Solve Killer Sudoku',
    description: 'How to solve killer sudoku: cage totals, the rule of 45, unique sum combinations, and the order to work in. Then play a free killer sudoku every day.',
    intro: 'Killer sudoku prints no digits at all. The grid is cut into cages, each labeled with the total of the digits inside it, and those totals are the only clues. It mixes sudoku logic with a little addition, and the addition is always the same few facts, which you learn quickly.',
    rules: [
      'Every row, column, and 3x3 box holds 1 to 9 exactly once.',
      'The digits in each cage add up to the number printed in its corner.',
      'A digit never repeats inside a cage.',
    ],
    steps: [
      ['Find the cages with only one combination', 'Some totals can only be made one way. Two squares adding to 3 must be 1 and 2. Two squares adding to 17 must be 8 and 9. Three squares adding to 6 must be 1, 2, and 3. Mark those candidates first.'],
      ['Use the rule of 45', 'Every row, column, and box adds up to 45. If the cages inside one box cover all but one square, that square is 45 minus their totals. If a cage pokes one square out of a box, the same subtraction tells you that stray square.'],
      ['Combine boxes and lines', 'The rule of 45 works on groups too: two rows add to 90, three boxes along a band add to 135. Look for a set of cages that almost exactly covers a group.'],
      ['Then solve it as a sudoku', 'Once a few digits are placed, ordinary scanning and pencil marks take over, with the cage sums as an extra check on every square.'],
    ],
    tips: [
      ['Learn the short list', 'For two squares: 3 is 1+2, 4 is 1+3, 16 is 7+9, 17 is 8+9. For three squares: 6 is 1+2+3, 7 is 1+2+4, 23 is 6+8+9, 24 is 7+8+9. Those eight cover most openings.'],
      ['Odd and even', 'A two-square cage with an odd total holds one odd and one even digit. Small clues like this narrow candidates fast.'],
      ['Innies and outies', 'A square inside a box but in a cage that mostly sits outside it is an "outie" to the neighboring box. Writing the 45 sum for the box with the innies and outies named usually gives one of them away.'],
    ],
    mistakes: [
      'Repeating a digit inside a cage because the sum still works.',
      'Doing sums in your head and forgetting them. Write the candidates down.',
    ],
    faq: [
      ['Is killer sudoku hard?', 'It is usually rated harder than classic sudoku, but the rule of 45 opens almost every board, and a 6x6 version (Coop) is a gentle way in.'],
      ['Do I need to be good at math?', 'No. You only add small numbers, and the useful combinations are a short list you will remember after a few games.'],
      ['What does 45 mean in killer sudoku?', '1 + 2 + 3 + ... + 9 = 45, so every row, column, and box sums to 45.'],
    ],
  },
  {
    slug: 'how-to-solve-greater-than-sudoku',
    game: 'sumo',
    also: ['bout'],
    cat: 'Sudoku',
    name: 'Greater-Than Sudoku',
    title: 'How to Solve Greater-Than Sudoku (Inequality Sudoku) | Mind Loft',
    h1: 'How to Solve Greater-Than Sudoku',
    description: 'How to solve greater-than sudoku: reading the signs, chains that force a 1 or a 9, and how to narrow every box. Then play a free inequality sudoku daily.',
    intro: 'Greater-than sudoku, also called inequality or comparison sudoku, prints almost no digits. Instead, between neighboring squares inside each box, a small sign points at the smaller of the two. The puzzle is about order: which square in a box is the biggest, which is the smallest, and how a long chain of signs squeezes the middle.',
    rules: [
      'Every row, column, and 3x3 box holds 1 to 9 exactly once.',
      'Between two side-by-side squares inside a box, the sign points to the smaller one.',
    ],
    steps: [
      ['Find each box\'s 9 and its 1', 'A square that is bigger than all of its neighbors in the box is a candidate for 9. A square that is smaller than all of them is a candidate for 1. Often only one or two squares in a box qualify.'],
      ['Count down the chains', 'If four squares form a chain where each is bigger than the next, the top of the chain is at least 4 and the bottom is at most 6. Write those limits as candidates.'],
      ['Combine with rows and columns', 'Once a box has its 9 placed, scanning the row and column clears 9 from the boxes beside it, which moves their 9 somewhere else. Order and placement feed each other.'],
      ['Pencil mark ranges, not just digits', 'In this variant a square\'s candidates are often a range, such as 5 to 9. Keep those ranges tight as the signs tell you more.'],
    ],
    tips: [
      ['Longest chain first', 'The longest run of signs pointing the same way in a box gives the strongest limits. Start there.'],
      ['Middle squares', 'A square with signs pointing both in and out of it can never be 1 or 9. Clearing extremes from the middle squares often leaves one square for the 1.'],
      ['Twos and eights', 'Once the 1 is placed, the 2 must be next to a sign pointing at the 1, or be the smallest of what is left. The same goes for 8 beside the 9.'],
    ],
    mistakes: [
      'Reading the sign backwards. The narrow point aims at the smaller digit.',
      'Applying signs across box edges. On Mind Loft the signs only appear inside the boxes.',
    ],
    faq: [
      ['What is inequality sudoku?', 'Another name for greater-than sudoku: the clues are greater-than and less-than signs between squares instead of printed digits.'],
      ['Is there a smaller version?', 'Yes. Bout is a 6x6 greater-than sudoku for a quicker solve.'],
      ['Is there only one answer?', 'Yes. Every daily board has a single solution you can reach by logic.'],
    ],
  },
  {
    slug: 'how-to-solve-16x16-sudoku',
    game: 'giant',
    also: ['gianttoo', 'colossus'],
    cat: 'Sudoku',
    name: '16x16 Sudoku',
    title: 'How to Solve a 16x16 Sudoku: Tips for Giant Sudoku | Mind Loft',
    h1: 'How to Solve a 16x16 Sudoku',
    description: 'How to solve 16x16 sudoku: the sixteen symbols, scanning a 256-square grid, pencil marks that stay readable, and pacing. Play a free giant sudoku daily.',
    intro: 'A 16x16 sudoku is the classic puzzle at a bigger size: sixteen rows, sixteen columns, and sixteen 4x4 boxes. The logic is the same as a 9x9, but there is so much more board that organization matters as much as technique. Mind Loft\'s Giant uses the digits 1 to 9 and the letters A to G as its sixteen symbols.',
    rules: [
      'The grid is 16 by 16, split into sixteen 4x4 boxes.',
      'Each row, column, and box holds each of the sixteen symbols (1 to 9 and A to G) exactly once.',
    ],
    steps: [
      ['Work one quarter at a time', 'Treat the board as four 8x8 quarters, each with four boxes. Finish the easy placements in one quarter before moving on. On a phone, Giant lets you zoom into a quarter.'],
      ['Scan symbol by symbol', 'Pick a symbol that appears often and check every box missing it, exactly as in a 9x9. With sixteen symbols, scanning finds a lot more than you expect before pencil marks are needed.'],
      ['Mark the boxes, not the whole grid', 'Full pencil marks on 256 squares are unreadable. Mark one box or one row at a time, where you are working, and only mark squares with four or fewer candidates.'],
      ['Count what is missing', 'In a row with three empty squares, list the three missing symbols. On a big board this is often faster than scanning.'],
    ],
    tips: [
      ['Letters are just symbols', 'A to G carry no order and no value. Read them the same way you read digits.'],
      ['Hidden singles are everywhere', 'With sixteen squares per house, a symbol often has only one legal home well before any square has one candidate. Look for the symbol, not the square.'],
      ['Take breaks', 'A 16x16 is long. Coming back with fresh eyes catches the placements you have been staring past.'],
    ],
    mistakes: [
      'Marking every square at once and losing track.',
      'Confusing similar shapes, like B and 8. Slow down on those.',
    ],
    faq: [
      ['How long does a 16x16 sudoku take?', 'Most players take thirty minutes to an hour or more. It is a long sit, not a quick daily.'],
      ['Why letters?', 'Sixteen symbols are needed and there are only nine digits, so A to G fill the rest.'],
      ['Is there something bigger?', 'Colossus links 61 ordinary 9x9 sudokus into one shared board, and the whole site solves it together.'],
    ],
  },
  {
    slug: 'how-to-solve-kropki-sudoku',
    game: 'polka',
    also: ['dot'],
    cat: 'Sudoku',
    name: 'Kropki Sudoku',
    title: 'How to Solve Kropki Sudoku: White Dots, Black Dots | Mind Loft',
    h1: 'How to Solve Kropki Sudoku',
    description: 'How to solve kropki sudoku: what white and black dots mean, why the missing dots are clues, and the digits that can never sit beside a black dot.',
    intro: 'Kropki sudoku prints no digits. Instead, small dots sit on the borders between neighboring squares. A white dot means the two digits are one apart. A black dot means one is exactly double the other. And on Mind Loft every possible dot is shown, so a border with no dot is a clue too: neither relationship holds.',
    rules: [
      'Every row, column, and 3x3 box holds 1 to 9 exactly once.',
      'A white dot between two squares: the digits differ by 1, like 4 and 5.',
      'A black dot: one digit is double the other, like 3 and 6.',
      'No dot: the digits are neither one apart nor double.',
    ],
    steps: [
      ['List the black-dot pairs', 'Only four pairs can sit on a black dot: 1 and 2, 2 and 4, 3 and 6, 4 and 8. So 5, 7, and 9 can never touch a black dot. Clear them from every square beside one.'],
      ['Mind the 1 and 2 trap', 'A 1 beside a 2 fits both rules (one apart, and double), so either dot may be printed between them. Do not assume a white dot rules out 1 and 2, or that a black dot does.'],
      ['Read the chains', 'A row of white dots, like four squares in a line each one apart from the next, must be a run of consecutive digits in some order. A chain of black dots, such as three squares, can only be 1, 2, 4 or 2, 4, 8.'],
      ['Use the silences', 'A square with no dots on any side cannot be one apart from or double any neighbor. That rules out a lot, especially for small digits, which have many partners.'],
    ],
    tips: [
      ['Fives, sevens, and nines', 'A 5 or a 7 can sit on a white dot but never a black one. A 9 can only sit on a white dot, next to an 8.'],
      ['Count the dots around a square', 'A square with four dots needs four different partners. Very few digits can do that, so it narrows fast.'],
    ],
    mistakes: [
      'Forgetting that no dot is information.',
      'Putting 5, 7, or 9 next to a black dot.',
    ],
    faq: [
      ['What does kropki mean?', 'Kropki is Polish for dots.'],
      ['Is there a 6x6 kropki?', 'Yes. Dot is the 6x6 version, with the same dot rules on digits 1 to 6.'],
      ['Do I need to know math?', 'Only doubling and counting by one. The pairs are a short list.'],
    ],
  },
  {
    slug: 'how-to-solve-thermo-sudoku',
    game: 'mercury',
    also: ['mercurytoo', 'fever'],
    cat: 'Sudoku',
    name: 'Thermo Sudoku',
    title: 'How to Solve Thermo Sudoku: Thermometer Rules and Tips | Mind Loft',
    h1: 'How to Solve Thermo Sudoku',
    description: 'How to solve thermo sudoku: digits rise along each thermometer, so long thermometers pin down their ends. Rules, method, and tips, then a free daily board.',
    intro: 'Thermo sudoku adds thermometers to the grid: gray shapes with a round bulb at one end. Digits must get bigger as you move away from the bulb. There is no adding, only ordering, and a long thermometer can decide most of its squares before you place anything else.',
    rules: [
      'Every row, column, and 3x3 box holds 1 to 9 exactly once.',
      'Along each thermometer, digits strictly increase from the bulb to the tip.',
    ],
    steps: [
      ['Measure every thermometer', 'A thermometer with n squares limits each square. On a 9-long thermometer every square is fixed: 1 at the bulb up to 9 at the tip. On a 6-long one, the bulb is 1 to 4 and the tip is 6 to 9.'],
      ['Write the ranges', 'For each square on a thermometer, its lowest possible digit is its position from the bulb, and its highest is 9 minus the squares still ahead of it. Mark those ranges.'],
      ['Tighten with sudoku', 'Each placement in a row or box shrinks the ranges on nearby thermometers, and each tighter range can force a placement. Go back and forth.'],
      ['Watch the crossings', 'Where two thermometers cross or share a box, both sets of limits apply to the same squares. Those squares often have one candidate.'],
    ],
    tips: [
      ['Bulbs are small, tips are big', 'A bulb can never be 9 and a tip can never be 1. Clear those first on every thermometer.'],
      ['Strictly bigger', 'Two neighbors on a thermometer cannot be equal, and in the same row or box they could not be anyway.'],
    ],
    mistakes: [
      'Reading the thermometer from the wrong end. Count from the bulb.',
      'Forgetting that a gap of more than one is allowed: 2 then 7 is fine.',
    ],
    faq: [
      ['Is there a rainbow thermo sudoku?', 'Yes. MercuryToo uses colors that climb the rainbow along each thermometer in place of digits.'],
      ['Is there a 6x6 thermo?', 'Fever is the 6x6 version, with digits 1 to 6.'],
      ['Why so few printed digits?', 'The thermometers do the work. On the hardest days only a handful of digits are printed.'],
    ],
  },
  {
    slug: 'how-to-solve-sandwich-sudoku',
    game: 'sando',
    also: ['snack'],
    cat: 'Sudoku',
    name: 'Sandwich Sudoku',
    title: 'How to Solve Sandwich Sudoku: Sums Between 1 and 9 | Mind Loft',
    h1: 'How to Solve Sandwich Sudoku',
    description: 'How to solve sandwich sudoku: the clue is the sum between each line\'s 1 and 9. The sums of 0 and 35, gap lengths, and a method that works every day.',
    intro: 'In sandwich sudoku, a number sits beside each row and above each column. It is the total of the digits lying between that line\'s 1 and its 9, the bread of the sandwich. Find where the 1 and 9 sit and the rest of the grid falls out.',
    rules: [
      'Every row, column, and 3x3 box holds 1 to 9 exactly once.',
      'The clue beside a row or column is the sum of the digits between its 1 and its 9.',
    ],
    steps: [
      ['Start with the extremes', 'A clue of 0 means the 1 and 9 are side by side. A clue of 35 means everything else (2 to 8) lies between them, so the 1 and 9 sit at the two ends of the line.'],
      ['Work out the gap length', 'A small sum can only be made by a few digits: a sum of 2 can only be the single digit 2, so the 1 and 9 are two squares apart. A sum of 5 is either the single digit 5 or 2 + 3. List the possible gap lengths for each clue.'],
      ['Place the bread', 'Combine gap lengths with where 1s and 9s can go in the boxes. Each row and column has one 1 and one 9, so they move together.'],
      ['Fill the filling', 'Once the 1 and 9 are fixed, the clue tells you which digits are inside the sandwich and which are outside. That splits the row into two groups to solve.'],
    ],
    tips: [
      ['Big sums mean long gaps', 'A sum of 30 needs at least five digits between the 1 and the 9, since four digits top out at 8 + 7 + 6 + 5 = 26.'],
      ['Outside the sandwich', 'Whatever is not inside adds up to 35 minus the clue. That is sometimes the easier side to reason about.'],
    ],
    mistakes: [
      'Counting the 1 and 9 in the sum. Only the digits between them count.',
      'Assuming the 1 comes first. The 9 can be on either side.',
    ],
    faq: [
      ['Why 35?', '2 + 3 + 4 + 5 + 6 + 7 + 8 = 35, every digit except the bread.'],
      ['Is there a 6x6 sandwich sudoku?', 'Yes. Snack is the 6x6 version, with 1 and 6 as the bread.'],
    ],
  },
  {
    slug: 'how-to-solve-an-acrostic-puzzle',
    game: 'anon',
    also: ['arcos'],
    related: [['/acrostic-puzzles', 'Acrostic puzzles']],
    cat: 'Word',
    name: 'Acrostic Puzzle',
    title: 'How to Solve an Acrostic Puzzle: Clues, Grid, and Author | Mind Loft',
    h1: 'How to Solve an Acrostic Puzzle',
    description: 'How to solve an acrostic puzzle: work the clues, carry letters into the quote, guess words in the quote, and spell the author from first letters. Play free.',
    intro: 'An acrostic is two puzzles that solve each other. There is a hidden passage, a quotation, and a list of clued answers. Every letter of every answer belongs somewhere in the passage, and the first letters of the answers, read down, spell who wrote it. Progress on either side feeds the other.',
    rules: [
      'Fill in the answers. Each answer\'s letters are tied to squares in the passage, so every letter you place in an answer also appears in the passage, and the reverse.',
      'Answers may carry a clue, a category hint, or nothing at all. On Anon about half carry nothing, which is why the passage is often the way in.',
      'Read the first letters of the answers, top to bottom, to spell the author (and on some puzzles, the work).',
    ],
    steps: [
      ['Take the easy answers first', 'Skip around. Any answer with a plain hint gives you letters that land in the passage straight away.'],
      ['Look at the passage for short words', 'Once a few letters are in, the passage shows two- and three-letter words like THE, AND, and OF. Fill them and carry those letters back to the clues.'],
      ['Guess the shape of the quote', 'Long passages read like real sentences. A word ending in _NG is often ING, and a single-letter word is usually A or I.'],
      ['Use the author', 'Once a few first letters appear, the author\'s name can often be guessed, which hands you the first letter of every remaining answer.'],
    ],
    tips: [
      ['Work back and forth', 'The solver who only does clues, or only does the passage, stalls. Switch every few letters.'],
      ['Letters are used once', 'Each letter of the passage comes from exactly one answer, so a letter already accounted for cannot be used again.'],
    ],
    mistakes: [
      'Trying to solve every clue before looking at the passage.',
      'Forgetting the first-letter author check, which catches wrong answers early.',
    ],
    faq: [
      ['What is the difference between an acrostic and a crossword?', 'A crossword\'s answers cross each other. An acrostic\'s answers never cross; they all feed one hidden passage instead.'],
      ['What is Arcos?', 'Mind Loft\'s other acrostic: three short clued acrostics where the first letters, last letters, and diagonal spell hidden words, then one word that ties them together.'],
      ['Where can I find more acrostics?', 'The acrostic puzzles page lists both Mind Loft acrostics and how they differ.'],
    ],
  },
  {
    slug: 'how-to-solve-a-nonogram',
    game: 'etch',
    also: [],
    cat: 'Logic',
    name: 'Nonogram',
    title: 'How to Solve a Nonogram (Picross): Rules and Tips | Mind Loft',
    h1: 'How to Solve a Nonogram',
    description: 'How to solve nonograms (Picross, Griddlers): reading the clues, the overlap trick, marking empty squares, and edges. Then play a free daily nonogram.',
    intro: 'A nonogram, also called Picross, Griddlers, or paint by numbers, is a grid of blank squares with numbers beside each row and above each column. The numbers say how many filled squares run together in that line, in order. Fill the squares the clues force and a picture appears.',
    rules: [
      'Each clue is a list of run lengths. "3 1" means a run of 3 filled squares, then at least one gap, then a run of 1.',
      'Runs appear in the order given, left to right or top to bottom.',
      'Every row and column clue must be satisfied at once.',
    ],
    steps: [
      ['Start with the big clues', 'In a 10-wide row, a clue of 10 fills the whole row. A clue of 8 leaves only two spare squares, so the middle six squares must be filled however the run slides.'],
      ['Use the overlap trick', 'For any single run, picture it pushed as far left as it goes, then as far right. Squares covered in both positions are filled for certain. This works for multi-run clues too, run by run.'],
      ['Mark empty squares', 'Put an X (Etch\'s Mark tool) in squares that must be empty. Empties are as useful as fills: they cut lines into shorter pieces.'],
      ['Work the edges', 'A filled square touching the border starts a run, so the whole first run of that clue can be drawn from the edge.'],
      ['Switch direction often', 'Each square you fill in a row is new information for its column. Go across, then down, then across again.'],
    ],
    tips: [
      ['Finished lines', 'When a line has all its runs, mark every other square in it empty right away.'],
      ['Clue sums', 'Add a clue\'s runs plus one gap between each. If that equals the line length, the whole line is decided.'],
    ],
    mistakes: [
      'Guessing to see a picture early. The picture comes from the logic, not the other way round.',
      'Not marking empties, then losing track of which squares are free.',
    ],
    faq: [
      ['Is a nonogram the same as Picross?', 'Yes. Picross, Griddlers, Hanjie, and paint by numbers are all names for the same puzzle.'],
      ['Is there always one answer?', 'Every Mind Loft nonogram has a single solution you can reach by logic alone.'],
    ],
  },
  {
    slug: 'how-to-solve-slitherlink',
    game: 'hedge',
    also: [],
    cat: 'Logic',
    name: 'Slitherlink',
    title: 'How to Solve Slitherlink: Rules, Patterns, and Tips | Mind Loft',
    h1: 'How to Solve Slitherlink',
    description: 'How to solve slitherlink loop puzzles: the one-loop rule, zeros, threes in corners, adjacent threes, and crossing out edges. Play a free slitherlink daily.',
    intro: 'Slitherlink is a grid of dots with numbers in some of the squares. You draw one closed loop along the lines between the dots. Each number tells you how many of its four sides the loop uses. No branches, no crossings, and only one loop.',
    rules: [
      'Draw a single closed loop along the grid lines.',
      'The loop never crosses or touches itself and never branches.',
      'A number in a square equals how many of that square\'s four sides the loop uses. Squares without a number can use any count.',
    ],
    steps: [
      ['Cross out around every 0', 'A 0 uses no sides, so mark all four as not loop. That often leaves dots nearby with only two ways out.'],
      ['Use threes in corners', 'A 3 in a corner of the grid must use the two outer sides, because a loop cannot turn sharply around the outside of the grid there.'],
      ['Find adjacent threes', 'Two 3s side by side share an edge: the loop must use the line between them and the two outer lines parallel to it.'],
      ['Follow the dots', 'Every dot has either zero or two loop lines. If a dot has one line in and only one possible way out, draw it. If a dot has two lines already, cross out the rest.'],
      ['Avoid small loops', 'Near the end, any line that would close a loop before all the numbers are satisfied must be crossed out.'],
    ],
    tips: [
      ['Cross out freely', 'Marking where the loop cannot go is half the game. Every X makes a nearby dot easier.'],
      ['Inside and outside', 'The loop splits the grid into inside and outside. Squares on opposite sides of a loop line are on opposite sides; that view solves the hard boards.'],
    ],
    mistakes: [
      'Closing a small loop that satisfies nearby numbers but leaves others unfinished.',
      'Forgetting that a dot cannot have three lines.',
    ],
    faq: [
      ['What is slitherlink also called?', 'Fences, Loop the Loop, and Takegaki. On Mind Loft it is Hedge.'],
      ['Is there one solution?', 'Yes. Each daily board has a single loop you can find by logic alone.'],
    ],
  },
  {
    slug: 'how-to-solve-kakuro',
    game: 'sums',
    also: [],
    cat: 'Numbers',
    name: 'Kakuro',
    title: 'How to Solve Kakuro: Rules, Sum Combos, and Tips | Mind Loft',
    h1: 'How to Solve Kakuro',
    description: 'How to solve kakuro (cross sums): runs that add to their clue, no repeats, the unique combinations to learn, and crossing runs. Play a free daily kakuro.',
    intro: 'Kakuro, also called cross sums, looks like a crossword filled with digits. Each run of white squares has a total printed at its head, and the digits in the run must add up to it. Like a sudoku, no digit repeats within a run. Unlike a sudoku, there is no rule that a row must hold every digit.',
    rules: [
      'Fill each white square with a digit from 1 to 9.',
      'The digits in each across or down run add up to the clue at its start.',
      'No digit repeats within a run.',
    ],
    steps: [
      ['Find runs with one combination', 'Some totals can only be made one way. Two squares summing to 3 are 1 and 2; two squares summing to 17 are 8 and 9; three squares summing to 6 are 1, 2, and 3; three summing to 24 are 7, 8, and 9.'],
      ['Cross the candidates', 'Where an across run and a down run meet, the square must suit both. If the across run allows {1, 2} and the down run allows {2, 4}, the square is 2.'],
      ['Work from the corners', 'Short runs at the edges of the grid usually have few combinations. They give the first placements.'],
      ['Track what a run still needs', 'Once some squares in a run are filled, subtract them. A run of four summing to 20 with 9 and 7 placed needs two digits summing to 4, which must be 1 and 3.'],
    ],
    tips: [
      ['The magic list', 'For two squares: 3, 4, 16, 17 each have one combo. For three: 6, 7, 23, 24. For four: 10, 11, 29, 30. Learn those twelve and most boards open.'],
      ['Big digits are rare in small sums', 'A two-square run summing to 5 can only use 1 to 4. Clear the rest.'],
    ],
    mistakes: [
      'Repeating a digit inside a run because the total works.',
      'Forgetting the crossing run when choosing a digit.',
    ],
    faq: [
      ['Is kakuro harder than sudoku?', 'It uses a little more arithmetic, but the combination list makes it predictable. Many sudoku players enjoy it as a next step.'],
      ['How big is the daily kakuro?', 'Weekdays are 7x7. The Sunday Edition is 11x11.'],
    ],
  },
  {
    slug: 'how-to-solve-logic-grid-puzzles',
    game: 'alibi',
    also: ['sudoclue'],
    cat: 'Logic',
    name: 'Logic Grid Puzzle',
    title: 'How to Solve Logic Grid Puzzles: A Step-by-Step Method | Mind Loft',
    h1: 'How to Solve Logic Grid Puzzles',
    description: 'How to solve logic grid puzzles: setting up the grid, marking Xs and checks, carrying facts across boards, and spotting the clue that breaks it open.',
    intro: 'A logic grid puzzle gives you a few people, a few traits each, and a list of clues. The grid crosses every category with every other, so each square asks one yes-or-no question: is this suspect the one with the knife? The answer comes from marking what cannot be true until only one thing can.',
    rules: [
      'Each item in one category matches exactly one item in each other category.',
      'Every clue is true. Together they leave exactly one answer.',
    ],
    steps: [
      ['Mark the direct clues', 'Clues like "the gardener did not have the rope" are an X in one square. Do all of these first.'],
      ['Check when a row has one space left', 'If every square in a row but one has an X, that one is a check. A check then means every other square in its row and column inside that board is an X.'],
      ['Carry facts across boards', 'If the gardener was in the library, and the person in the library had the candlestick, the gardener had the candlestick. Copy each check into every board it touches.'],
      ['Reread the hard clues', 'Comparative clues ("earlier than", "next to") rarely solve anything at the start, but after a few checks they usually decide a whole row.'],
    ],
    tips: [
      ['Use the Xs as much as the checks', 'Most of the solve is ruling things out. An X carried across boards is as valuable as a check.'],
      ['Either-or clues', '"Either the cook or the butler was in the hall" means both cannot be. If one of them is ruled out of the hall, the other is in it.'],
    ],
    mistakes: [
      'Placing a check from a hunch.',
      'Forgetting to transfer a fact to the other boards.',
    ],
    faq: [
      ['What is Alibi?', 'Mind Loft\'s daily whodunit logic grid: four suspects and three deduction boards narrowing to one guilty answer.'],
      ['What is Sudoclue?', 'A murder-mystery logic puzzle on a grid, part logic grid and part sudoku.'],
    ],
  },
];

export const GUIDE_MAP = Object.fromEntries(GUIDES.map((g) => [g.slug, g]));

const BY_GAME = {};
for (const g of GUIDES) for (const k of [g.game, ...(g.also || [])]) if (!BY_GAME[k]) BY_GAME[k] = g;

// The guide a daily's tail links to, or null.
export function guideForGame(key) {
  return BY_GAME[key] || null;
}

// The guides a category page lists in its "More puzzles" row.
export function guidesForCategory(cat) {
  return GUIDES.filter((g) => g.cat === cat);
}

// The link text used everywhere a guide is linked: its H1.
export function guideLabel(g) {
  return g.h1;
}
