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
    name: 'Letter tiles', slug: 'letter-tiles',
    eyebrow: 'Free daily tile word games',
    title: 'Free Daily Letter Tile Games: Same Rack for All | Mind Loft',
    h1: 'Free Daily Letter Tile Games: Same Rack for Everyone, Highest Score Wins',
    description: 'Three free daily word games where everyone gets the same letters: a fourteen-tile rack, a bag-empty endgame and a seven-letter honeycomb. New boards at midnight Eastern, no signup.',
    lede: 'Three games about what you can build from a fixed set of letters, and the set is the same for everybody, so the board is a straight comparison of what each player found. A fourteen-tile rack, a bag-empty endgame and a seven-letter honeycomb.',
    how: [
      'Tuck deals everyone the same fourteen letters and ranks the highest-scoring board. Babel is an endgame: the bag is empty, the tiles left are known, and the best line can be worked out rather than hoped for. Lode gives you seven letters around a core letter and pays more the rarer the word. Strata buries words in layers and asks you to dig them out. Scour hides a day\u2019s worth of themed words in a 15x15 grid, every one of them exactly once.',
      'The tile games check against a Scrabble list, which is broader than everyday English, so an obscure two-letter word is a fair play.',
    ],
    faq: [
      ['Which word list counts?', 'A Scrabble list, which is broader than everyday English.'],
      ['Are they free?', 'All three, every day, no account required.'],
    ],
  },
  {
    name: 'Word hunts', slug: 'word-hunts',
    eyebrow: 'Free daily word searches',
    title: 'Free Daily Word Searches: Themed and Giant | Mind Loft',
    h1: 'Free Daily Word Searches: Themed, Giant and Buried Words',
    description: 'Three free daily word hunts: a themed word search on the clock, an enormous word search with hundreds of words that everyone shares, and a dig for buried words. New boards at midnight Eastern, no signup.',
    lede: 'Three games about finding words hidden in a grid. Scour is the quick one, a theme and a 15x15 grid against the clock. Search is enormous, hundreds of entries from one big topic in a grid a hundred letters across, and ranks you on the ones nobody else found. Strata buries words in layers for you to dig out.',
    how: [
      'Scour hides a day\u2019s worth of themed words in a 15x15 grid, every one of them exactly once, and the clock breaks ties. Search is one huge shared grid: each find shows how many players found it before you, and the standings rank unique finds first. Strata buries words in layers and asks you to dig them out.',
    ],
    faq: [
      ['Are they free?', 'All three, every day, no account required.'],
    ],
  },
  {
    name: 'Letter shuffles', slug: 'letter-shuffles',
    eyebrow: 'Free daily anagram and word ladder games',
    title: 'Free Daily Anagram Games: Scrambles and Ladders | Mind Loft',
    h1: 'Free Daily Anagram Games: Word Scrambles, Word Ladders and Letter Trades',
    description: 'Four free daily letter-shuffle games: themed word scrambles, five scrambles and a clued finale, a word ladder a letter at a time, and letter trades on a budget. New puzzles at midnight Eastern, no signup.',
    lede: 'Four games about moving letters around. Scram serves ten themed scrambles. Garble hands you five scrambled words and a finale built from them. Rung is the word ladder, one letter changed per step from the top word to the bottom. Barter trades two letters at a time toward six hidden words, on a budget of the proven minimum plus five.',
    how: [
      'Garble is the quickest: five scrambles, then a clued finale, in as few misses as you can. Rung is the classic word ladder, and the daily one has a proven shortest path that the board measures you against. Barter is the deep one: every trade costs a move, the minimum is known, and the board ranks on how close you got to it.',
    ],
    faq: [
      ['Do the ladders have one answer?', 'They have a proven shortest length. Any ladder of that length is a perfect solve.'],
      ['Are they free?', 'All four, every day, no account required.'],
    ],
  },
  {
    name: 'Word meanings', slug: 'word-meanings',
    eyebrow: 'Free daily word puzzles about meaning',
    title: 'Free Daily Word Association Puzzles: Groups, Chains | Mind Loft',
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
    name: 'Traffic jams', slug: 'traffic-jams',
    eyebrow: 'Free daily sliding block puzzles',
    title: 'Free Daily Sliding Block Puzzles: Get the Car Out | Mind Loft',
    h1: 'Free Daily Sliding Block Puzzles: Get the Red Car Out, in Three Sizes',
    description: 'Three free daily sliding block puzzles (the rush hour, traffic jam kind): a 6x6 lot, a 7x7 lot and an 8x8 lot, each with a proven minimum number of moves. Slide the blockers, get the red one out. New lots at midnight Eastern, no signup.',
    lede: 'The sliding block puzzle where everybody has blocked you in, every block is stuck on one axis, and there is one gap in the wall. Parker is the six by six lot, Impound the seven by seven, Junkyard the eight by eight, and each day’s lot has a proven minimum you are measured against.',
    how: [
      'Every block slides only along its own length, the red one has to reach the exit, and the count is moves, not time. The three sizes are three separate games because a lot’s size is frozen into every board and every stored perfect; finishing one hands you the next size up you have not played, so they read as one ladder.',
    ],
    faq: [
      ['Is the minimum really proven?', 'Yes. Every lot is solved by a search before it ships, and the board grades your run against that number.'],
      ['Can I replay a lot?', 'Yes. Replaying the same lot is the design, and the board ranks on your best grade, then on how many runs it took.'],
    ],
  },
  {
    name: 'Whodunits', slug: 'whodunits', circuit: 'deduction',
    eyebrow: 'Free daily deduction puzzles',
    title: 'Free Daily Whodunit Puzzles: Suspects and Liars | Mind Loft',
    h1: 'Free Daily Whodunit and Deduction Puzzles: Suspects, Liars and Alibis',
    description: 'Five free daily deduction puzzles: narrow four suspects to one across three grids, place a murder’s suspects one per row and column of a real place, an inequality grid with one liar, a puzzle about what two people can and cannot know, and five sworn statements with an exact number of lies. New cases at midnight Eastern, no signup.',
    lede: 'Five puzzles that give you statements instead of a grid to fill. Alibi is the nightly whodunit. Sudoclue sets a murder in a real place: one suspect per row and column, and every role to deduce. Fib is an inequality grid where one clue is false. Hearsay works out what two people know from what they say they do not. Sworn has five statements, an exact number of lies, and a thief to name.',
    how: [
      'Each case narrows to exactly one answer by logic, and each is checked before it ships so that it does. Alibi seats four suspects across three deduction boards. Sudoclue places its cast one per row and column on a real floor plan, then the detective\'s notes name the victim, the killer and the accomplice. Fib prints a grid of inequalities and exactly one of them is wrong. Hearsay is the knowledge puzzle: two people each hold one detail, and their conversation is the clue. Sworn tells you how many of the five statements are lies and one of them names the thief.',
    ],
    faq: [
      ['Do I ever have to guess?', 'No. Every case is proved to fall to logic alone.'],
      ['Are they free?', 'All five, every day, no account required.'],
    ],
  },
  {
    name: 'Observation puzzles', slug: 'observation-puzzles',
    eyebrow: 'Free daily observation puzzles',
    title: 'Free Daily Observation and Memory Puzzles | Mind Loft',
    h1: 'Free Daily Observation Puzzles: Spot the Difference, a Hidden Picture Hunt, Memory Games, and a Zoomed Photo',
    description: 'Five free daily puzzles won by paying attention: two photographs with seven differences, a crowd scene with a list of things to find, a street scene to study and then be questioned on, a panel that flashes for two seconds, and a photo shown at nine times zoom that pulls back a frame per miss. New boards at midnight Eastern, no signup.',
    lede: 'Five puzzles where everything you need is in front of you, if you look closely enough. Spot puts two copies of one photograph side by side with seven differences between them. Wanted is a new crowd scene every day with a list of things to find in it. Witness shows a street scene for twenty seconds and then asks what you saw. Glimpse flashes a panel of dots, a grid, a clock and a string for two seconds and asks about one of them. Focus shows one photo at nine times zoom and asks what it is.',
    how: [
      'Spot is spot the difference on a real photograph: tap what changed, zoom in for the small ones, and keep your misses down, because they count before the clock. Wanted is a hidden picture hunt in the spirit of Where\u2019s Waldo: one crowded scene a day, a fairground or a beach or a harbor, and a list of about sixteen things to find in it, starting with Otis in his green cap and orange scarf. A finished hunt ranks on the clock. Witness is a memory game: a street of shops, people, vehicles and sky, then six questions about colors, counts and what stood next to what, with the scene returned at the end so you can see what you missed. Glimpse is a flash memory game: five flashes, each gone in a second or two, each followed by one question scored on how close you were. Focus is a zoom puzzle: the photo pulls back a frame per miss, and the fewer frames you needed, the better.',
    ],
    faq: [
      ['Do they get harder through the week?', 'Witness and Glimpse do. The scene and the panel get busier from Monday to Sunday, while the clocks stay the same, and Glimpse adds a sixth, faster flash on Sunday.'],
      ['Are they free?', 'All five, every day, no account required.'],
    ],
  },
  {
    name: 'Grid drawing', slug: 'grid-drawing',
    eyebrow: 'Free daily pencil puzzles',
    title: 'Free Daily Pencil Puzzles: Nonogram, Slitherlink | Mind Loft',
    h1: 'Free Daily Pencil Puzzles: a Nonogram, a Slitherlink Loop and Shikaku',
    description: 'Three free daily pencil-and-paper logic puzzles drawn on a grid: a nonogram (picross), a slitherlink loop and shikaku rectangles. One solution each, reachable by logic. New boards at midnight Eastern, no signup.',
    lede: 'The puzzles you would draw with a pencil, on a grid you shade, loop or cut. Etch is the nonogram: a picture appears when the counts are satisfied. Hedge is slitherlink: one closed loop. Plot is shikaku: cut the board into rectangles.',
    how: [
      'Etch fills the squares the row and column counts force. Hedge draws one closed loop so every number has that many sides on it. Plot cuts the grid into rectangles so each number owns exactly its own area.',
    ],
    faq: [
      ['How big do they get?', 'Bigger through the week. The Sunday Edition runs the largest boards.'],
      ['Are they free?', 'All three, every day, no account required.'],
    ],
  },
  {
    name: 'Grid filling', slug: 'grid-filling',
    eyebrow: 'Free daily fill-the-grid puzzles',
    title: 'Free Daily Grid Puzzles: Binary, Light Up, Numberlink | Mind Loft',
    h1: 'Free Daily Grid Puzzles: a Binary Grid, a Light-Up Puzzle, Shape Fitting, Numberlink and a Robot to Program',
    description: 'Five free daily puzzles where you fill the board: a dots-and-rings binary grid, a light-up puzzle, a shape-fitting puzzle with exactly one way in, a dot-joining numberlink, and a robot you program to light every lamp. New boards at midnight Eastern, no signup.',
    lede: 'Five puzzles where the board starts nearly empty and you fill it. Duet is the binary grid: dots and rings, half and half. Lamps lights every square with no lamp shining on another. Snug fits a handful of pieces into a board exactly one way. Connect joins pairs of matching dots until every square is used. Bot writes a short program that walks a robot to every lamp and switches it on.',
    how: [
      'Duet fills every square with a dot or a ring so every row, column and walled room is half and half, never three alike in a line. Lamps places lamps that shine along their row and column until a wall, and a numbered wall touches exactly that many. Snug turns and flips its pieces until they cover the board. Connect lays one line between each pair of matching dots, never crossing another, and the board is done only when every square is used.',
    ],
    faq: [
      ['How big do they get?', 'Bigger through the week. Duet and Lamps run 10x10 on Sunday, Snug lays eight pieces on a 7x7, Connect runs 12x12, and Bot adds P2 and P3 rows on a bigger board.'],
      ['Are they free?', 'All five, every day, no account required.'],
    ],
  },
  {
    name: 'Jigsaws', slug: 'jigsaw-puzzles',
    eyebrow: 'Free daily jigsaw puzzles',
    title: 'Free Daily Online Jigsaw Puzzles, 80 to 4,000 Pieces | Mind Loft',
    h1: 'Free Daily Online Jigsaw Puzzles: Two to Solve Alone and a 4,000 Piece Mural to Build Together',
    description: 'Three free daily online jigsaw puzzles: an 80-piece jigsaw, a tall portrait jigsaw, and a 4,000 piece mural that every player builds together. Real photographs, no signup.',
    lede: 'Three jigsaws made from real photographs. Jig is the daily jigsaw. Saw is its tall sibling, the same jigsaw on a portrait photo. Mural is a 4,000 piece jigsaw that everyone on the site builds at the same time, open until the last piece is placed.',
    generic: { jig: 'Jigsaw puzzle', saw: 'Jigsaw puzzle (portrait)', mural: 'Shared 4,000 piece jigsaw puzzle', muraltoo: 'Shared 4,000 piece jigsaw puzzle (midnight)' },
    how: [
      'Jig cuts a new photograph into 80 interlocking pieces that snap into place, and the clock decides. Saw cuts a portrait photograph taller than wide, in 77 or 80 pieces, and plays the same way. Mural has no clock: your tray holds a handful of the 4,000 pieces, each one you place earns points, harder pieces pay more, and a piece nobody else has placed yet pays double. The shared picture fills in as the day goes on.',
    ],
    faq: [
      ['Where do the photos come from?', 'Wikimedia Commons featured pictures under free licences, credited beside each puzzle.'],
      ['How big do they get?', 'Jig is 80 pieces every day, Saw is 77 or 80, and Mural is 4,000 pieces, 80 across and 50 down.'],
      ['Do I have to finish a mural myself?', 'No. Everyone works on the same picture, so place as many or as few pieces as you like and the crowd does the rest.'],
      ['Are they free?', 'All three, every day, no account required.'],
    ],
  },
  {
    name: 'Photo puzzles', slug: 'photo-puzzles',
    eyebrow: 'Free daily photo puzzles',
    title: 'Free Daily Photo Puzzles: Sliding Puzzle, Swap and Spin | Mind Loft',
    h1: 'Free Daily Photo Puzzles: a Sliding Puzzle, a Swap Puzzle and a Spin Puzzle',
    description: 'Three free daily puzzles made from real photographs: a 5x5 sliding puzzle, a swap-the-squares puzzle and a turn-every-square puzzle. New photos at midnight Eastern, no signup.',
    lede: 'Three puzzles with a photograph to put back together. Slide is the classic sliding tile puzzle grown to five by five. Swap shuffles every square out of place and lets you trade two at a time. Spin turns nearly every square and asks you to set the picture straight.',
    generic: { swap: 'Photo tile swap', slide: 'Sliding tile puzzle', spin: 'Photo rotation puzzle' },
    how: [
      'Swap, Slide and Spin take the photographs the daily jigsaws used in earlier weeks and ask a different question of each: the fewest swaps to unscramble it, the fewest moves to slide it home through one gap, the fewest taps to turn every square straight.',
    ],
    faq: [
      ['Where do the photos come from?', 'Wikimedia Commons featured pictures under free licences, the same ones the daily jigsaws use.'],
      ['How big do they get?', 'Swap runs 6x6 and 7x7 on Sunday, Slide 5x5 and 6x6, and Spin 6x6 and 8x8.'],
      ['Are they free?', 'All three, every day, no account required.'],
    ],
  },
  {
    name: 'Sorting puzzles', slug: 'sorting-puzzles',
    eyebrow: 'Free daily placement and sorting puzzles',
    title: 'Free Daily Placement Puzzles: Queens, Star Battle | Mind Loft',
    h1: 'Free Daily Sorting Puzzles: Queens Placement, Two-Star Placement, Set Logic and Wire Cutting',
    description: 'Four free daily puzzles about putting things where they go: seat one jester per row, column and court with no two touching; seat two judges per row, column and court; place twelve words across seven overlapping regions; and cut a row of wires in the one safe order. New boards at midnight Eastern, no signup.',
    lede: 'Four puzzles about placement and order. Jesters is the queens puzzle with coloured courts. Judges is its two-per-row big sibling. Venn places twelve words across seven overlapping regions so every count adds up. Defuse prints a manual and a row of wires, and exactly one order of cuts obeys every rule.',
    how: [
      'Jesters seats one jester per row, per column and per coloured court, with no two ever touching, on a board that grows through the week. Judges seats two per row, column and court, so a second judge in a row is right and only a third quarrels. Venn is set logic drawn as circles. Defuse gives you a device and a manual of plain rules, some of which only apply when their condition is true of that device, and one wrong cut ends the day.',
    ],
    faq: [
      ['How big do the boards get?', 'Jesters grows from 8x8 on Monday to an 11x11 Sunday Edition. Judges is 10x10 all week and 12x12 on Sunday.'],
      ['Are they free?', 'All four, every day, no account required.'],
    ],
  },
  {
    name: 'Everyday puzzles', slug: 'everyday-puzzles',
    eyebrow: 'Free daily real-life logic puzzles',
    title: 'Free Daily Everyday Puzzles: Seating, Kitchen, Mop | Mind Loft',
    h1: 'Free Daily Everyday Puzzles: Seating Chart, Kitchen Timing, Mop the House and Mow the Lawn',
    description: 'Four free daily logic puzzles taken from life at home: seat a room of guests so every request is met, fire the dishes of a kitchen so every table goes out hot, mop every tile of a house exactly once, and mow every square of the lawn. New boards at midnight Eastern, no signup.',
    lede: 'Four puzzles about jobs everyone knows. Seated hands you a guest list and a stack of requests, and exactly one way of sharing out the tables keeps everybody happy. Chef hands you a line of stations and a rail of tickets, and the order you fire the dishes in decides how long every table waits. Mop sends one mop through a house until every tile has been mopped exactly once, and Mow does the same with a mower in the yard outside.',
    how: [
      'Seated is a seating chart puzzle: tap a guest, tap a chair, and watch each request turn green or red. Guests ask to sit side by side, directly across, at the same table or at different tables, and some need a particular table. It is ranked on re-seats, the guests you had to move. Chef is a kitchen run one minute at a time: every dish needs its own station for a set number of minutes, an order leaves only when all of it is ready, and a finished dish that sits costs double. Mop is one unbroken route through a house drawn from above: every tile once, never back over a wet one, past the furniture and through the doorways, finishing at the door. Mow is the same rule in the yard, round the trees, the pond and the shed and through the gates in the fences. Stepping back on a done square is a replay, and both rank on fewest replays, then the clock.',
    ],
    faq: [
      ['Is there one right answer?', 'Seated has exactly one way to share the guests between the tables, and Mop has a route that covers every tile. Chef has a best possible service, and you are scored on how close you come.'],
      ['Do they get harder through the week?', 'Yes. Seated grows from a dinner party at one table on Monday to a wedding reception of twenty on Sunday, Chef from four tickets to a twelve-ticket brunch, Mop from one floor to a house on three, and Mow from a six by six lawn to the nine by nine Estate.'],
      ['Are they free?', 'All four, every day, no account required.'],
    ],
  },
  {
    name: 'Around town puzzles', slug: 'around-town',
    eyebrow: 'Free daily errand and delivery puzzles',
    title: 'Free Daily Errand Puzzles: Bagging, Delivery, Plow | Mind Loft',
    h1: 'Free Daily Around Town Puzzles: Grocery Bagging, Route Planning, a Delivery Shift and the Snow Plow',
    description: 'Four free daily logic puzzles about getting things done around town: bag a belt of groceries without crushing the eggs, plan a round of errands to be home soonest, drive a delivery shift for the most in tips, and plow every snowy street once. New boards at midnight Eastern, no signup.',
    lede: 'Four puzzles set out of the house. Bag sends groceries down a belt, and heavy has to go low, eggs on top and cold together. Errands hands you a map and a list of stops, and the bank shuts before the cleaners open. Dash hands you an evening of delivery orders, more than there is time for, and every tip shrinks once its order runs late. Plow hands you a town under fresh snow and a plow truck, and every street has to be plowed exactly once.',
    how: [
      'Bag is a bagging puzzle: only the first few items on the belt are in reach, a bag holds four items and nine pounds, nothing may be crushed, and hot, cold and cleaning products each have a rule about who they share a bag with. Every bag turns green or red as soon as you pick something up. Errands is a route puzzle: tap the stops in the order you will drive them, with shops that shut, shops that open late and shopping that spoils, and you are ranked on minutes behind the soonest possible trip. Dash is a delivery puzzle: tap an order to pick it up and again to drop it off, with a bag that holds two, a clock that runs out and tips that fall a dollar for every two minutes the food is late. You are ranked on dollars short of the best possible shift. Plow is a route puzzle on a street map: drive corner to corner until every street is plowed exactly once, over the bridges and round the cul-de-sacs, and finish at the salt barn. Driving down a plowed street is a replay, and fewest replays, then the clock, decides it.',
    ],
    faq: [
      ['Is there one right answer?', 'Bag can always be bagged with nothing coming back out. Errands has one order that is soonest home. Dash has a best possible total for the night, and you are scored on how close you come. Plow always has a clean route, and usually many.'],
      ['Do they get harder through the week?', 'Yes. Bag grows from a corner shop of eight items to a big shop of eighteen, Errands from four stops to eight, Dash from five orders in an hour to ten restaurants and a two-hour shift on Sunday, and Plow from a town of about seventeen streets to fifty-odd across a river.'],
      ['Are they free?', 'All four, every day, no account required.'],
    ],
  },
  {
    name: 'Roll and route', slug: 'roll-and-route',
    eyebrow: 'Free daily route and rolling puzzles',
    title: 'Free Daily Route Puzzles: Block and Die Rolling | Mind Loft',
    h1: 'Free Daily Route Puzzles: Block Rolling, Die Rolling, Eat in Order and a Contraption',
    description: 'Four free daily puzzles about finding the way: roll a tall block onto the spring, roll a die to light numbered squares in order, eat a cast of mascots in order, and finish a ball-rolling contraption. New boards at midnight Eastern, no signup.',
    lede: 'Four puzzles where the answer is a route. Topple tips a tall block end over end until it lands on the spring. Roll tips a die across the floor to light numbered squares in order, each with its own number on top. Chomp eats a cast of mascots in order, and every square you touch stays yours. Machine sends balls rolling through a contraption you finish yourself.',
    how: [
      'Topple is the block rolling puzzle: every roll tips the block over an edge, a one-tile spring takes it standing and a two-tile spring takes it lying flat, and every board is solved exactly so par is real. Roll is its die rolling sibling: a numbered square stays shut until it is next and your roll would land its number on top, and cracked squares crumble once you leave them. Tangled is against the clock alone: any layout with no crossing ropes is a solve. Chomp is a route puzzle with no clock and nothing chasing you: the only things in your way are where you have already been. Machine is the physics puzzle of the four: drag ramps, springs and belts into a chain-reaction machine, press Run, and the balls carry real momentum to the hoop or the bell, ranked on how few runs it took.',
    ],
    faq: [
      ['Is there a best answer?', 'Yes. Topple and Roll measure you against a proven minimum, found by search before the board ships.'],
      ['Are they free?', 'All four, every day, no account required.'],
    ],
  },
  {
    name: 'Pack and untangle', slug: 'pack-and-untangle',
    eyebrow: 'Free daily spatial puzzles',
    title: 'Free Daily Spatial Puzzles: 3D Packing, Sokoban | Mind Loft',
    h1: 'Free Daily Spatial Puzzles: 3D Packing, Box Pushing, Rope Untangling and the Cheapest Network',
    description: 'Four free daily puzzles about fitting things together in space: load a pile of luggage or furniture into a vehicle in three dimensions, push crates onto their spots, untangle ropes on a frame of pegs, and wire every town for the least cost. New boards at midnight Eastern, no signup.',
    lede: 'Four puzzles about how things fit. Pack hands you a pile on the curb and one vehicle, and every bag, box and sofa has to go in under the roof line. Crate is the classic warehouse: push every crate onto a spot, never pulling. Tangled moves the pegs of crossing ropes until no two cross. Paths links every town into one network for the least cost.',
    how: [
      'Pack is a packing puzzle in three dimensions: pick an item, tap where it goes, and it drops straight down and rests on whatever is under it. You can turn it, tip it onto another side and walk round the vehicle, and a table has room underneath for whatever you load first. It is ranked on re-packs, the items you had to take back out. Crate is box pushing by the classic rules: walk into a crate to push it, never pull one, and never push two at once, ranked on moves with the shortest possible line shown beside yours. Tangled is against the clock alone: any layout with no crossing ropes is a solve. Paths gives you a set of towns and the cost of every link, and you build the cheapest network that reaches all of them.',
    ],
    faq: [
      ['Is there a best answer?', 'Paths and Crate measure you against a proven minimum. Pack always has at least one way to fit everything, and a clean load takes no re-packs. Tangled counts any untangled layout.'],
      ['Does Pack get harder through the week?', 'Yes. The vehicle grows from a hatchback on Monday to a moving van on Sunday, and by Friday the fit is exact.'],
      ['Are they free?', 'All four, every day, no account required.'],
    ],
  },
  {
    name: 'Rule finding', slug: 'rule-finding',
    eyebrow: 'Free daily inductive reasoning puzzles',
    title: 'Free Daily Reasoning Puzzles: LSAT and GMAT Style | Mind Loft',
    h1: 'Free Daily Rule-Finding Puzzles: Hidden Rules, Data Sufficiency, Analytical Reasoning and Results Tables',
    description: 'Five free daily puzzles about working out the rule: tell five candidate rules apart with a handful of tests, decide whether two statements settle a question, answer five questions about one setup of rules, rebuild a full results table from a few surviving facts, and sort nine statements into must, could and cannot be true. New puzzles at midnight Eastern, no signup.',
    lede: 'Five puzzles where the rule is the thing you are looking for. Axiom hides one rule and gives you a handful of tests to tell five candidates apart. Suffice is data sufficiency: two statements and a verdict on whether they settle it. Docket is the analytical reasoning section of a well-known test: one setup, five questions. Stands hands you a few surviving facts about a round robin and asks for the whole table back. Ergo gives you a few if-then rules and one fact, and you sort nine statements into must be true, could be true and cannot be true.',
    how: [
      'Axiom is the one nobody else has: one hidden rule splits the board, and each test you run has to buy you the most information. Suffice is the reasoning section of a well-known test: eight questions you never answer, two statements each, and you say whether they settle it. Stands is deduction from a results table: everyone played everyone once, and the surviving facts pin every result.',
    ],
    faq: [
      ['How is Axiom scored?', 'On how many tests it took you to name the rule. Fewer is better.'],
      ['Is Docket really a test section?', 'It is the analytical reasoning shape, one setup and five questions, written fresh every day.'],
      ['Are they free?', 'All five, every day, no account required.'],
    ],
  },
  // ── Trivia ──────────────────────────────────────────────────────────────
  {
    name: 'Trivia gauntlets', slug: 'trivia-gauntlets', circuit: 'gauntlet',
    eyebrow: 'Free daily one-life quizzes',
    title: 'Free Daily Trivia Gauntlets: One Life, Same Questions | Mind Loft',
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
    name: 'Ordering trivia', slug: 'ordering-trivia',
    eyebrow: 'Free daily ranking and ordering quizzes',
    title: 'Free Daily Ordering Trivia: History and Rankings | Mind Loft',
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
    name: 'Picture and story trivia', slug: 'picture-and-story-trivia',
    eyebrow: 'Free daily picture and headline puzzles',
    title: 'Free Daily Picture Trivia: Headlines and Charts | Mind Loft',
    h1: 'Free Daily Picture and Story Trivia: Redacted Headlines, Films Described Badly and Stock Charts',
    description: 'Free daily trivia puzzles you look at rather than read: uncover a redacted news story word by word, name films from deliberately bad descriptions, and name a company from its stock chart. New puzzles at midnight Eastern, no signup.',
    lede: 'Trivia for people who would rather look than read a question. Redact hands you an article with the words blacked out and you uncover it. Thread describes films badly and asks which ones they are, and what connects them. Tape shows five years of a stock chart with the prices hidden and asks which company it is.',
    how: [
      'Redact is about uncovering a story with as few reveals as it takes to name it. Thread is nine films described as unhelpfully as possible, with a thread running through them that is the second answer. Tape opens one clue at a time, and a wrong guess opens the next one, so fewer clues is the score.',
    ],
    faq: [
      ['Are they free?', 'All of them, every day, no account required.'],
    ],
  },
  {
    name: 'Single-topic trivia', slug: 'single-topic-trivia',
    eyebrow: 'Free daily one-topic quizzes',
    title: 'Free Daily Single-Topic Trivia and Blind Ranking | Mind Loft',
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
  {
    name: 'Guessing games', slug: 'guessing-games',
    eyebrow: 'Free daily trivia guessing games',
    title: 'Free Daily Guessing Games: Animal, Person, Company | Mind Loft',
    h1: 'Free Daily Trivia Guessing Games: Guess the Animal, Link Two Actors, Name the Resume and the IPO Filing',
    description: 'Five free daily trivia guessing games: guess the animal on the family tree, a five-fact guessing game, link two actors through their films, name a famous person from their resume and a famous company from its IPO filing. No signup.',
    lede: 'Five games where every guess tells you something. Clade hides one animal and answers every guess with the branch of the family tree it shares. Dossier hides a president, an element or a US state and compares five facts on every guess. Bacon names two actors and you guess your way from one to the other through films they made together. Resume shows a famous person’s career profile with the name hidden, and opens it up one section at a time. Filing does the same for a famous company, from the prospectus it filed to go public.',
    how: [
      'Clade and Dossier give you eight guesses, each one answered with how close it came, and fewer guesses score more. Bacon is played like Six Degrees of Kevin Bacon: name a film, type a co-star from it, and keep going to the target. A wrong film or co-star is a strike, and the fewer films you need, the better. Resume starts with where the person went to college; skills, early jobs, fun facts, later jobs and their headline open one by one, and every wrong guess opens the next. Filing starts with one risk factor; the cover page, competition, key metrics, the business and the founders in their own words follow.',
    ],
    faq: [
      ['How does Bacon pick its films?', 'Films from 1930 to 2025, mostly American, with the main billed cast from Wikipedia and IMDb. Small and uncredited parts are often missing.'],
      ['Who shows up in Resume?', 'Business leaders, stars and public figures with long, well-documented careers. The Sunday Edition is a deeper cut.'],
      ['Which companies show up in Filing?', 'Well-known companies that went public in the United States, quoted from the prospectus they filed with the SEC.'],
      ['Are they free?', 'All five, every day, no account required.'],
    ],
  },
  // ── Sudoku ──────────────────────────────────────────────────────────────
  {
    name: 'Classic sudokus', slug: 'classic-sudokus', circuit: 'dojo',
    eyebrow: 'Free classic sudoku online',
    title: 'Free Daily Classic Sudoku: 9x9, 6x6, Sudoku X | Mind Loft',
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
    name: 'Massive sudokus', slug: 'massive-sudokus',
    eyebrow: 'Free giant sudoku online',
    title: 'Free Giant Sudoku: 16x16 and Multi-Grid Sudoku | Mind Loft',
    h1: 'Free Giant Sudoku: 61 Linked Grids, 257 Linked 6x6 and a Daily 16x16',
    description: 'Three free giant sudokus: Colossus, 61 linked 9x9 grids on one board; Mammoth, 257 linked 6x6 grids; and Giant, a daily 16x16. One logical solution each, no signup.',
    lede: 'Three sudokus for a long sit. Colossus weaves 61 ordinary 9x9 sudokus into one enormous board, each sharing its four corner boxes with its neighbors. Mammoth does the same with 257 quick 6x6 sudokus. Giant is one grid, sixteen by sixteen, with the letters A to G beside the digits.',
    how: [
      'On Colossus and Mammoth everyone plays their own copy of the same board. Nothing is marked right or wrong until a whole sudoku is full, every sudoku is a pot of 100 points split among the players who solve it, and a board stays open until every sudoku has been solved by somebody, however long that takes. Giant is a new 16x16 every midnight Eastern, decided on the clock.',
    ],
    faq: [
      ['Do the puzzles ever need a guess?', 'No. Every sudoku on Colossus and Mammoth has one solution and can be finished from its own printed digits by logic alone, and so can every Giant.'],
      ['Are they free?', 'All three, no account required.'],
    ],
  },
  {
    name: 'Edge clue sudokus', slug: 'edge-clue-sudokus', circuit: 'dojo',
    eyebrow: 'Free killer, sandwich, frame and outside sudoku',
    title: 'Free Daily Killer, Sandwich, and Skyscraper Sudoku | Mind Loft',
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
    name: 'Marked sudokus', slug: 'marked-sudokus', circuit: 'dojo',
    eyebrow: 'Free jigsaw, windoku, arrow, anti-knight and palindrome sudoku',
    title: 'Free Daily Jigsaw, Windoku, Arrow and Palindrome Sudoku | Mind Loft',
    h1: 'Free Daily Jigsaw, Windoku, Arrow and Palindrome Sudoku',
    description: 'Five free daily sudokus with marks on the grid: jigsaw regions, four shaded windows, arrows that add up, an anti-knight rule, and lines that read the same both ways. One logical solution each.',
    lede: 'Five sudokus where the grid itself carries the extra rule. Quilt redraws the boxes as crooked regions. Window shades four extra boxes that also hold 1 to 9. Arrow runs lines out of circles, and each circle holds the total of the digits along its line. Knight forbids two of the same digit a chess knight’s move apart. Racecar draws lines that read the same from either end.',
    how: [
      'Quilt and Window are the gentlest steps into variants: Quilt only reshapes the boxes, and Window adds four more of them. Arrow adds small sums. Racecar pairs squares off from the ends of each line inward, so a digit found at one end is found at the other. Knight keeps every classic rule and adds one: no digit may repeat a knight’s move away.',
    ],
    faq: [
      ['Are they free?', 'All five, every day, no account required.'],
    ],
  },
  // ── Numbers ─────────────────────────────────────────────────────────────
  {
    name: 'Mental math', slug: 'mental-math', circuit: 'math',
    eyebrow: 'Free daily mental arithmetic games',
    title: 'Free Daily Mental Math Games Against the Clock | Mind Loft',
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
    name: 'Number grids', slug: 'number-grids', circuit: 'math',
    eyebrow: 'Free daily number grid puzzles',
    title: 'Free Daily Number Grid Puzzles: Kakuro and More | Mind Loft',
    h1: 'Free Daily Number Grid Puzzles: Kakuro, Equal-Sum Blocks, Sum Grids, a Cryptarithm and Balance Scales',
    description: 'Five free daily number puzzles about sums: a kakuro, a grid you slice into equal-sum blocks, a grid you fill from a rack so every line adds to its target, a cryptarithm where every letter is a digit, and balance scales where every shape has a weight. One solution each. New boards at midnight Eastern, no signup.',
    lede: 'Five puzzles about sums, most of them on a grid. Sums is the kakuro. Carve slices the grid into connected blocks that each add to the same number. Tally fills a grid from a rack so every row and column adds to its target. Cipher is the cryptarithm: every letter stands for a different digit and exactly one assignment makes the equation true. Scales is the balance puzzle: shapes sit on scales with numbered weights, and you work out what each shape weighs.',
    how: [
      'Sums is a crossword-shaped grid where every run adds to the total at its head, digits 1 to 9 with no repeats in a run. Carve is about where to cut. Tally is about where to place. Cipher is the one with no grid to fill: it is an equation in letters, and the digits are the answer. Scales has no grid either: every level scale is an equation and every tilted one tells you only which side is heavier.',
    ],
    faq: [
      ['Can a kakuro run repeat a digit?', 'No. Digits 1 to 9, each at most once in a run, which is most of what makes it solvable.'],
      ['Are they free?', 'All five, every day, no account required.'],
    ],
  },
  // ── End Game ────────────────────────────────────────────────────────────
  { name: 'Chess endings', page: '/chess-puzzles' },
  {
    name: 'Board endgames', slug: 'board-endgames', under: 'end-game-puzzles',
    eyebrow: 'Free daily board game endgame puzzles',
    title: 'Free Daily Connect Four and Checkers Puzzles | Mind Loft',
    h1: 'Free Daily Board Game Endgames: Connect Four, Quarto and Checkers',
    description: 'Three free daily endgame puzzles from board games other than chess: a won Connect Four position with one column that keeps it, a Quarto endgame where one placement and one handover force the win, and a checkers sweep in three. Played out against an engine. No signup.',
    lede: 'Three endgames from three boards, each a position you are already winning with exactly one move that keeps it. Four is Connect Four: one column wins and a wrong drop is not taken back. Gift is Quarto: place the piece you were handed, then choose the one your opponent has to play. Check is checkers: take every black piece inside three.',
    how: [
      'None of these is checked against a key. The position is played out against an engine that defends as well as it can, and the round ends when the game does, so a wrong move is not announced while you can still play. The board ranks solvers by how many attempts the solve took, and a replay counts.',
    ],
    faq: [
      ['Do I need to know the games?', 'The rules are stated on each page and the engine enforces them. The puzzle is reading the position a few moves deep.'],
      ['Are they free?', 'All three, every day, no account required.'],
    ],
  },
  {
    name: 'Territory endgames', slug: 'territory-endgames', under: 'end-game-puzzles',
    eyebrow: 'Free daily territory endgame puzzles',
    title: 'Free Daily Dots and Boxes, Othello, and Go | Mind Loft',
    h1: 'Free Daily Territory Endgames: Dots and Boxes, Othello and Go',
    description: 'Three free daily endgame puzzles where the count at the end decides it: a dots-and-boxes endgame where the free box is the trap, an Othello ending with ten squares left, and a Go endgame where a handful of open points decide it. Played out against an engine. No signup.',
    lede: 'Three endgames where the count at the end decides it, each a position you are already winning with exactly one move that keeps it. Chain is dots and boxes with the safe edges gone. Turn is Othello with ten squares left, where flipping the fewest discs is the habit that wins. Yose is Go: the walls are built, a handful of open points decide it, and two passes count the board.',
    how: [
      'None of these is checked against a key. The position is played out against an engine that defends as well as it can, and the round ends when the game does, so a wrong move is not announced while you can still play. The board ranks solvers by how many attempts the solve took, and a replay counts.',
    ],
    faq: [
      ['Do I need to know the games?', 'The rules are stated on each page and the engine enforces them. The puzzle is reading the position a few moves deep.'],
      ['Are they free?', 'All three, every day, no account required.'],
    ],
  },
];

// The set rows, joined to their groups (roster, category) and their category
// page (slug, generic labels). A set the copy above does not name is still
// listed on its category page, with a page only if it has copy.
export const PUZZLE_SETS = GROUPS.map((g) => {
  const s = SETS.find((x) => x.name === g.name) || {};
  // `under` pins a set's page to a category page other than its registry
  // category's: the two endgame sets stay at /end-game-puzzles/<set> now that
  // End Game is part of Table Games (2026-11-12), so their addresses did not move.
  const catSlug = s.under || CAT_TO_SLUG[g.cat];
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
