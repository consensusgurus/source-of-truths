// Puzzle data for the daily game. Imported ONLY by the server page
// component, which filters to live<=today before passing puzzles to
// the client — so future puzzles (and their answers) never ship to the
// browser bundle.
//
// Groups are ordered easiest -> trickiest (yellow, green, blue, red — the
// Crux palette). Authoring rules: 16 unique words; every word fits EXACTLY
// one group once the whole board is considered (red herrings are the game,
// ambiguity is a bug — if a word could complete two groups, one of those
// groups must already be full of its own members). Run the validator after
// any edit.
// OWNER RULE (2026-07-15): every puzzle also needs AT LEAST TWO cross-
// category collisions — words that plausibly read as another group on the
// same board — ideally more, while keeping exactly ONE valid grouping.
// OWNER RULE (2026-08-04): the uniqueness proof only sees the collisions you
// DECLARE, so an incomplete list proves nothing. When two or more words of
// group A read as group B and nothing in B is declared to read back, you are
// asserting that NO member of B could belong to A. State it: list the pair in
// `reverseChecked` as "A -> B". The verifier fails an unacknowledged one-way
// flow. This is the check that #24 needed: three planets were declared to read
// as Roman gods while JUPITER, sitting in the gods group, is itself a planet,
// so the board had five valid groupings and shipped anyway.
// OWNER RULE (2026-08-05): VARY THE MECHANIC, not just the topic. An audit of
// the first 80 puzzles found 312 of the 320 groups were flat "list of nouns in
// a taxonomy" categories and only 8 used a wordplay mechanic, while 29 group
// names repeated (Gemstones five times, Herbs / Shades of green / Snakes four
// each). A board of four taxonomies is the least interesting board this game
// can produce. Aim for at least one non-taxonomy group per puzzle, drawing on:
// compound blanks (___ board, Fire ___), homophones (sounds like a letter, a
// number, a country, a body part), hidden words, anagrams, reversals, silent
// letters, words spelled only in Roman numerals, and sets whose members all
// also belong to a neighbouring set (every zodiac sign is a constellation).
// The verifier now enforces the other half: from 2026-09-30 a category name
// already used twice anywhere in the bank is a hard failure, and the ten names
// already past that are reported as a standing review note.
//
// SAFE-BOARD PATTERN for uniqueness: give every group four members that belong
// nowhere else, and let the deliberate collisions point at groups that are
// already full. A MUTUAL swap is the trap to avoid: if A's word reads as B and
// B's word reads as A, both groups still total four after the swap, so the
// board has two valid groupings and the proof will (correctly) reject it.
export const PUZZLES = [
  {
    num: 1,
    quizId: 'links-7-12-26',
    live: '2026-07-12',
    dateLabel: 'July 12, 2026',
    groups: [
      { name: 'Ways to cook an egg', words: ['SCRAMBLE', 'POACH', 'FRY', 'DEVIL'] },
      { name: '___ market', words: ['STOCK', 'BLACK', 'FLEA', 'FARMERS'] },
      { name: 'Small fight', words: ['SCRAP', 'TUSSLE', 'SKIRMISH', 'DUSTUP'] },
      { name: '___fish', words: ['SWORD', 'CAT', 'JELLY', 'CUTTLE'] },
    ],
  },
  {
    num: 2,
    quizId: 'links-7-13-26',
    live: '2026-07-13',
    dateLabel: 'July 13, 2026',
    groups: [
      { name: 'NBA teams', words: ['HEAT', 'JAZZ', 'MAGIC', 'THUNDER'] },
      { name: 'Rough weather', words: ['HAIL', 'SLEET', 'GALE', 'SQUALL'] },
      { name: 'Music genres', words: ['FUNK', 'SOUL', 'SWING', 'BLUES'] },
      { name: '___storm', words: ['BRAIN', 'SAND', 'FIRE', 'SNOW'] },
    ],
  },
  {
    num: 3,
    quizId: 'links-7-14-26',
    live: '2026-07-14',
    dateLabel: 'July 14, 2026',
    groups: [
      { name: 'Coffee orders', words: ['LATTE', 'DRIP', 'AMERICANO', 'MACCHIATO'] },
      { name: 'Shades of brown', words: ['MOCHA', 'TAN', 'CHESTNUT', 'CARAMEL'] },
      { name: 'Boxing punches', words: ['JAB', 'HOOK', 'CROSS', 'UPPERCUT'] },
      { name: '___ roll', words: ['DRUM', 'BARREL', 'EGG', 'HONOR'] },
    ],
  },
  {
    num: 4,
    quizId: 'links-7-15-26',
    live: '2026-07-15',
    dateLabel: 'July 15, 2026',
    groups: [
      { name: 'Big cats', words: ['LION', 'TIGER', 'JAGUAR', 'LEOPARD'] },
      { name: 'Sneaker brands', words: ['PUMA', 'NIKE', 'ADIDAS', 'REEBOK'] },
      { name: 'Golf scores', words: ['EAGLE', 'BIRDIE', 'BOGEY', 'ALBATROSS'] },
      { name: 'Monkeys', words: ['HOWLER', 'SPIDER', 'CAPUCHIN', 'MANDRILL'] },
    ],
  },
  {
    num: 5,
    quizId: 'links-7-16-26',
    live: '2026-07-16',
    dateLabel: 'July 16, 2026',
    groups: [
      { name: 'Card games', words: ['BRIDGE', 'HEARTS', 'SOLITAIRE', 'RUMMY'] },
      { name: 'By the fireplace', words: ['POKER', 'LOG', 'GRATE', 'ASH'] },
      { name: 'Trees', words: ['OAK', 'ELM', 'BIRCH', 'CEDAR'] },
      { name: 'Keyboard keys', words: ['ENTER', 'SHIFT', 'TAB', 'ESCAPE'] },
    ],
  },
  {
    num: 6,
    quizId: 'links-7-17-26',
    live: '2026-07-17',
    dateLabel: 'July 17, 2026',
    groups: [
      { name: 'World capitals', words: ['OSLO', 'CAIRO', 'DUBLIN', 'QUITO'] },
      { name: 'Shades of blue', words: ['TEAL', 'COBALT', 'AZURE', 'INDIGO'] },
      { name: 'Organs', words: ['LIVER', 'SPLEEN', 'PANCREAS', 'BLADDER'] },
      { name: 'Beans', words: ['LIMA', 'KIDNEY', 'NAVY', 'PINTO'] },
    ],
  },
  {
    num: 7,
    quizId: 'links-7-18-26',
    live: '2026-07-18',
    dateLabel: 'July 18, 2026',
    // rev 2 (2026-07-15): CHICAGO and TITANIC were BOTH Broadway musicals AND
    // Best Picture winners — two valid solutions. TITANIC -> HAMILTON;
    // CHICAGO moves to Best Picture as the trap (musicals are full, and none
    // of CATS/RENT/WICKED/HAMILTON won Best Picture). HAIR reads musical too.
    groups: [
      { name: 'Tennis shots', words: ['LOB', 'VOLLEY', 'ACE', 'SMASH'] },
      { name: 'Broadway musicals', words: ['CATS', 'HAMILTON', 'RENT', 'WICKED'] },
      { name: 'Best Picture winners', words: ['GLADIATOR', 'CRASH', 'ARGO', 'CHICAGO'] },
      { name: '___ metal', words: ['HAIR', 'HEAVY', 'DEATH', 'PRECIOUS'] },
    ],
  },
  {
    num: 8,
    quizId: 'links-7-19-26',
    live: '2026-07-19',
    dateLabel: 'July 19, 2026',
    // rev 2 (2026-07-15): CIVIC -> EYE, STOP -> DELIVER for the two-collision
    // rule. EYE is a palindrome that reads body part (but the hiding group is
    // full and none of its four are palindromes); DELIVER reverses to REVILED
    // and hides LIVER (but ARMY/RIBBON/SHINE/HEARTH fill the hiding group and
    // none of them reverse to a word).
    groups: [
      { name: 'Palindromes', words: ['LEVEL', 'KAYAK', 'RADAR', 'EYE'] },
      { name: 'Body part hiding inside', words: ['ARMY', 'RIBBON', 'SHINE', 'HEARTH'] },
      { name: 'A new word backwards', words: ['STRESSED', 'DRAWER', 'STRAW', 'DELIVER'] },
      { name: 'Anagrams of countries', words: ['PAINS', 'CHAIN', 'RAIN', 'PURE'] },
    ],
  },
  {
    num: 9,
    quizId: 'links-7-20-26',
    live: '2026-07-20',
    dateLabel: 'July 20, 2026',
    groups: [
      { name: 'Herbs', words: ['BASIL', 'ROSEMARY', 'THYME', 'DILL'] },
      { name: 'Shades of green', words: ['SAGE', 'OLIVE', 'FOREST', 'MINT'] },
      { name: 'Money, slangily', words: ['CHEDDAR', 'DOUGH', 'BREAD', 'BACON'] },
      { name: 'Cheeses', words: ['BRIE', 'GOUDA', 'FETA', 'EDAM'] },
    ],
  },
  {
    num: 10,
    quizId: 'links-7-21-26',
    live: '2026-07-21',
    dateLabel: 'July 21, 2026',
    groups: [
      { name: 'US presidents', words: ['FORD', 'CARTER', 'GRANT', 'BUSH'] },
      { name: 'Car brands', words: ['DODGE', 'JEEP', 'TESLA', 'HONDA'] },
      { name: 'Avoid', words: ['DUCK', 'SKIRT', 'EVADE', 'PARRY'] },
      { name: 'NATO alphabet', words: ['TANGO', 'VICTOR', 'ROMEO', 'CHARLIE'] },
    ],
    collisions: [
      { word: 'FORD', reads: 'Car brands' },
      { word: 'DODGE', reads: 'Avoid' },
    ],
  },
  {
    num: 11,
    quizId: 'links-7-22-26',
    live: '2026-07-22',
    dateLabel: 'July 22, 2026',
    groups: [
      { name: 'Units of time', words: ['SECOND', 'MINUTE', 'DECADE', 'FORTNIGHT'] },
      { name: 'Tiny', words: ['TEENY', 'WEE', 'MICRO', 'DINKY'] },
      { name: 'Bond films', words: ['GOLDENEYE', 'SKYFALL', 'SPECTRE', 'THUNDERBALL'] },
      { name: '___glass', words: ['SPY', 'WINE', 'STAINED', 'HOUR'] },
    ],
    collisions: [
      { word: 'MINUTE', reads: 'Tiny' },
      { word: 'HOUR', reads: 'Units of time' },
      { word: 'SPY', reads: 'Bond films' },
    ],
  },
  {
    num: 12,
    quizId: 'links-7-23-26',
    live: '2026-07-23',
    dateLabel: 'July 23, 2026',
    // rev 2 (2026-07-15): Deserts -> Ancient Egypt for the two-collision rule.
    // NILE (river) now reads Egypt (Egypt is full — none of its four are
    // rivers) and AMAZON (tech) still reads river (rivers are full). ORACLE
    // gets a free ancient-world tease it can't cash in.
    groups: [
      { name: 'One-name singers', words: ['ADELE', 'DRAKE', 'SHAKIRA', 'BJORK'] },
      { name: 'Ancient Egypt', words: ['SPHINX', 'PYRAMID', 'PHARAOH', 'MUMMY'] },
      { name: 'Tech giants', words: ['AMAZON', 'APPLE', 'META', 'ORACLE'] },
      { name: 'Rivers', words: ['NILE', 'DANUBE', 'RHINE', 'VOLGA'] },
    ],
    collisions: [
      { word: 'AMAZON', reads: 'Rivers' },
      { word: 'NILE', reads: 'Ancient Egypt' },
    ],
  },
  {
    num: 13,
    quizId: 'links-7-24-26',
    live: '2026-07-24',
    dateLabel: 'July 24, 2026',
    groups: [
      { name: 'Dog breeds', words: ['PUG', 'POODLE', 'BEAGLE', 'CORGI'] },
      { name: 'Built big', words: ['HUSKY', 'BURLY', 'BEEFY', 'STOCKY'] },
      { name: 'Underwear', words: ['THONG', 'BIKINI', 'BOXER', 'TRUNKS'] },
      { name: 'Legal filings', words: ['BRIEF', 'TORT', 'APPEAL', 'MOTION'] },
    ],
    collisions: [
      { word: 'HUSKY', reads: 'Dog breeds' },
      { word: 'BOXER', reads: 'Dog breeds' },
      { word: 'BRIEF', reads: 'Underwear' },
    ],
  },
  {
    num: 14,
    quizId: 'links-7-25-26',
    live: '2026-07-25',
    dateLabel: 'July 25, 2026',
    groups: [
      { name: 'Planets', words: ['NEPTUNE', 'SATURN', 'URANUS', 'JUPITER'] },
      { name: 'Candy bars', words: ['MARS', 'TWIX', 'SNICKERS', 'BOUNTY'] },
      { name: 'Roman gods', words: ['VULCAN', 'JANUS', 'CUPID', 'MINERVA'] }, // was MERCURY (also a planet) -> MINERVA: kills the 4-way ambiguity
      { name: 'Famous sculptures', words: ['DAVID', 'PIETA', 'THINKER', 'VENUS'] },
    ],
    reverseChecked: [
      "Planets -> Roman gods",
    ],
    collisions: [
      { word: 'NEPTUNE', reads: 'Roman gods' },
      { word: 'SATURN', reads: 'Roman gods' },
      { word: 'JUPITER', reads: 'Roman gods' },
      { word: 'MARS', reads: 'Planets' },
      { word: 'MARS', reads: 'Roman gods' },
      { word: 'VENUS', reads: 'Planets' },
      { word: 'VENUS', reads: 'Roman gods' },
    ],
  },
  {
    num: 15,
    quizId: 'links-7-26-26',
    live: '2026-07-26',
    dateLabel: 'July 26, 2026',
    sunday: true,
    // SUNDAY EDITION: four cross-category collisions instead of the usual two.
    // The uniqueness argument is PINNING, and it is machine-checked: every
    // tempted group is full of words that fit nowhere else, so each collision
    // has to resolve back to its own group.
    //   ROOK  reads chess, but chess is already full (and CASTLE is its rook)
    //   KING  reads chess, but chess is full        -> must be a card
    //   QUEEN reads chess AND reads rock band, and BOTH are full -> card
    groups: [
      { name: 'Rock bands', words: ['KISS', 'RUSH', 'CREAM', 'JOURNEY'] },
      { name: 'Corvids', words: ['RAVEN', 'MAGPIE', 'JACKDAW', 'ROOK'] },
      { name: 'Deck of cards', words: ['ACE', 'JOKER', 'KING', 'QUEEN'] },
      { name: 'Chess pieces', words: ['BISHOP', 'KNIGHT', 'PAWN', 'CASTLE'] },
    ],
    reverseChecked: [
      "Deck of cards -> Chess pieces",
    ],
    collisions: [
      { word: 'ROOK', reads: 'Chess pieces' },
      { word: 'KING', reads: 'Chess pieces' },
      { word: 'QUEEN', reads: 'Chess pieces' },
      { word: 'QUEEN', reads: 'Rock bands' },
    ],
  },
  {
    num: 16,
    quizId: 'links-7-27-26',
    live: '2026-07-27',
    dateLabel: 'July 27, 2026',
    // collisions: RUBY reads gem (gems full) and CHERRY reads fruit (fruit full),
    // so both stay red. Exactly one valid grouping.
    groups: [
      { name: 'Fruits', words: ['LEMON', 'ORANGE', 'GRAPE', 'KIWI'] },
      { name: 'Shades of red', words: ['SCARLET', 'CRIMSON', 'RUBY', 'CHERRY'] },
      { name: 'Gemstones', words: ['PEARL', 'OPAL', 'SAPPHIRE', 'TOPAZ'] },
      { name: 'Metals', words: ['GOLD', 'SILVER', 'PLATINUM', 'BRONZE'] },
    ],
    collisions: [
      { word: 'CHERRY', reads: 'Fruits' },
      { word: 'RUBY', reads: 'Gemstones' },
    ],
  },
  {
    num: 17,
    quizId: 'links-7-28-26',
    live: '2026-07-28',
    dateLabel: 'July 28, 2026',
    // collisions: SALSA reads dip (dips full), SLIDE & SWING read baseball (full);
    // SEESAW & SANDBOX are playground-only, so they pull SLIDE & SWING in.
    groups: [
      { name: 'Dances', words: ['TANGO', 'SALSA', 'WALTZ', 'FOXTROT'] },
      { name: 'Party dips', words: ['GUACAMOLE', 'HUMMUS', 'QUESO', 'RANCH'] },
      { name: 'Playground fixtures', words: ['SLIDE', 'SEESAW', 'SANDBOX', 'SWING'] },
      { name: 'Baseball moves', words: ['BUNT', 'STEAL', 'PITCH', 'STRIKE'] },
    ],
    reverseChecked: [
      "Playground fixtures -> Baseball moves",
    ],
    collisions: [
      { word: 'SALSA', reads: 'Party dips' },
      { word: 'SLIDE', reads: 'Baseball moves' },
      { word: 'SWING', reads: 'Baseball moves' },
    ],
  },
  {
    num: 18,
    quizId: 'links-7-29-26',
    live: '2026-07-29',
    dateLabel: 'July 29, 2026',
    // collisions resolve to one grouping: LIME & OLIVE read fruit (fruit full),
    // MINT & SAGE read green (herbs need them), PINE reads green (yearn needs it).
    groups: [
      { name: 'Fruits', words: ['MANGO', 'PAPAYA', 'PEACH', 'APRICOT'] },
      { name: 'Shades of green', words: ['OLIVE', 'LIME', 'FOREST', 'JADE'] },
      { name: 'Herbs', words: ['BASIL', 'MINT', 'SAGE', 'DILL'] },
      { name: 'Yearn for', words: ['PINE', 'ACHE', 'LONG', 'CRAVE'] },
    ],
    reverseChecked: [
      "Shades of green -> Fruits",
      "Herbs -> Shades of green",
    ],
    collisions: [
      { word: 'LIME', reads: 'Fruits' },
      { word: 'OLIVE', reads: 'Fruits' },
      { word: 'MINT', reads: 'Shades of green' },
      { word: 'SAGE', reads: 'Shades of green' },
      { word: 'PINE', reads: 'Shades of green' },
    ],
  },
  {
    num: 19,
    quizId: 'links-7-30-26',
    live: '2026-07-30',
    dateLabel: 'July 30, 2026',
    // collisions: POUND reads weight (weights full), CROWN reads tooth (teeth full),
    // STONE reads "___ Age" (ages full). PESO & RAND anchor currency.
    groups: [
      { name: 'Currencies', words: ['PESO', 'POUND', 'CROWN', 'RAND'] },
      { name: 'Units of weight', words: ['OUNCE', 'GRAM', 'TON', 'STONE'] },
      { name: 'Tooth parts', words: ['ROOT', 'ENAMEL', 'GUM', 'PLAQUE'] },
      { name: '___ Age', words: ['BRONZE', 'IRON', 'ICE', 'GOLDEN'] },
    ],
    collisions: [
      { word: 'POUND', reads: 'Units of weight' },
      { word: 'CROWN', reads: 'Tooth parts' },
    ],
  },
  {
    num: 20,
    quizId: 'links-7-31-26',
    live: '2026-07-31',
    dateLabel: 'July 31, 2026',
    // collisions: TIDE & BOLD read detergent (detergents full: GAIN/ERA/ALL/CHEER),
    // STRIKE reads bowling (lanes full: SPARE/GUTTER/TURKEY/PIN). One grouping.
    groups: [
      { name: 'Text styles', words: ['ITALIC', 'UNDERLINE', 'STRIKE', 'BOLD'] },
      { name: 'Bowling terms', words: ['SPARE', 'GUTTER', 'TURKEY', 'PIN'] },
      { name: '___ pool', words: ['CAR', 'GENE', 'WHIRL', 'TIDE'] },
      { name: 'Laundry detergents', words: ['GAIN', 'ERA', 'ALL', 'CHEER'] },
    ],
    collisions: [
      { word: 'TIDE', reads: 'Laundry detergents' },
      { word: 'BOLD', reads: 'Laundry detergents' },
      { word: 'STRIKE', reads: 'Bowling terms' },
    ],
  },
  {
    num: 21,
    quizId: 'links-8-1-26',
    live: '2026-08-01',
    dateLabel: 'August 1, 2026',
    // collisions: IRIS reads flower (eyes full), JASMINE reads flower (princesses full),
    // ROSE reads flower (past-tense full). TULIP/DAHLIA/PANSY/PEONY anchor flowers.
    groups: [
      { name: 'Eye parts', words: ['PUPIL', 'RETINA', 'CORNEA', 'IRIS'] },
      { name: 'Disney princesses', words: ['BELLE', 'AURORA', 'MULAN', 'JASMINE'] },
      { name: 'Past-tense verbs', words: ['SANG', 'DREW', 'FLEW', 'ROSE'] },
      { name: 'Flowers', words: ['TULIP', 'DAHLIA', 'PANSY', 'PEONY'] },
    ],
    collisions: [
      { word: 'IRIS', reads: 'Flowers' },
      { word: 'JASMINE', reads: 'Flowers' },
      { word: 'ROSE', reads: 'Flowers' },
    ],
  },
  {
    num: 22,
    quizId: 'links-8-2-26',
    live: '2026-08-02',
    dateLabel: 'August 2, 2026',
    sunday: true,
    // SUNDAY EDITION: four cross-category collisions. Every shade of green also
    // reads as another group, but each tempted group is already full of its own
    // members, so all four resolve back to green. Exactly one valid grouping.
    //   EMERALD, JADE read gemstones (gems full: RUBY/SAPPHIRE/TOPAZ/OPAL)
    //   MINT reads herbs (herbs full: BASIL/PARSLEY/THYME/DILL)
    //   OLIVE reads pizza toppings (toppings full)
    groups: [
      { name: 'Pizza toppings', words: ['PEPPERONI', 'MUSHROOM', 'ONION', 'SAUSAGE'] },
      { name: 'Herbs', words: ['BASIL', 'PARSLEY', 'THYME', 'DILL'] },
      { name: 'Shades of green', words: ['OLIVE', 'JADE', 'EMERALD', 'MINT'] },
      { name: 'Gemstones', words: ['RUBY', 'SAPPHIRE', 'TOPAZ', 'OPAL'] },
    ],
    reverseChecked: [
      "Shades of green -> Gemstones",
    ],
    collisions: [
      { word: 'EMERALD', reads: 'Gemstones' },
      { word: 'JADE', reads: 'Gemstones' },
      { word: 'MINT', reads: 'Herbs' },
      { word: 'OLIVE', reads: 'Pizza toppings' },
    ],
  },
  {
    num: 23,
    quizId: 'links-8-3-26',
    live: '2026-08-03',
    dateLabel: 'August 3, 2026',
    // collisions: PYTHON reads programming languages (languages full), COBRA and
    // VIPER read muscle cars (cars full), so all three resolve back to snakes.
    groups: [
      { name: 'Board games', words: ['CHESS', 'RISK', 'CLUE', 'SORRY'] },
      { name: 'Snakes', words: ['PYTHON', 'COBRA', 'VIPER', 'MAMBA'] },
      { name: 'Programming languages', words: ['RUBY', 'JAVA', 'SWIFT', 'RUST'] },
      { name: 'Muscle cars', words: ['MUSTANG', 'CORVETTE', 'CAMARO', 'CHARGER'] },
    ],
    reverseChecked: [
      "Snakes -> Muscle cars",
    ],
    collisions: [
      { word: 'PYTHON', reads: 'Programming languages' },
      { word: 'COBRA', reads: 'Muscle cars' },
      { word: 'VIPER', reads: 'Muscle cars' },
    ],
  },
  {
    num: 24,
    quizId: 'links-8-4-26',
    live: '2026-08-04',
    dateLabel: 'August 4, 2026',
    // collisions: all four planets also read Roman gods, but the gods group is
    // full of gods that are NOT planets (MINERVA/APOLLO/JUNO/DIANA), so every
    // planet stays put. JUPITER was here and broke that: it is itself a planet,
    // which left the fourth god slot open to any of the five and gave the board
    // five valid groupings. Never seat a planet-named god in this group.
    groups: [
      { name: 'Planets', words: ['MARS', 'VENUS', 'SATURN', 'NEPTUNE'] },
      { name: 'Roman gods', words: ['MINERVA', 'APOLLO', 'JUNO', 'DIANA'] },
      { name: 'Car brands', words: ['HONDA', 'TOYOTA', 'FORD', 'TESLA'] },
      { name: 'Continents', words: ['ASIA', 'AFRICA', 'EUROPE', 'ANTARCTICA'] },
    ],
    reverseChecked: [
      "Planets -> Roman gods",
    ],
    collisions: [
      { word: 'MARS', reads: 'Roman gods' },
      { word: 'VENUS', reads: 'Roman gods' },
      { word: 'SATURN', reads: 'Roman gods' },
      { word: 'NEPTUNE', reads: 'Roman gods' },
      { word: 'SATURN', reads: 'Car brands' },
    ],
  },
  {
    num: 25,
    quizId: 'links-8-5-26',
    live: '2026-08-05',
    dateLabel: 'August 5, 2026',
    // collisions: RUBY & GARNET read gemstones (gems full), PYTHON reads snakes
    // (snakes full), so all resolve back to their home groups.
    groups: [
      { name: 'Shades of red', words: ['CRIMSON', 'SCARLET', 'RUBY', 'GARNET'] },
      { name: 'Gemstones', words: ['EMERALD', 'SAPPHIRE', 'DIAMOND', 'OPAL'] },
      { name: 'Programming languages', words: ['PYTHON', 'JAVA', 'SWIFT', 'RUST'] },
      { name: 'Snakes', words: ['COBRA', 'VIPER', 'MAMBA', 'ADDER'] },
    ],
    reverseChecked: [
      "Shades of red -> Gemstones",
    ],
    collisions: [
      { word: 'RUBY', reads: 'Gemstones' },
      { word: 'GARNET', reads: 'Gemstones' },
      { word: 'PYTHON', reads: 'Snakes' },
    ],
  },
  {
    num: 26,
    quizId: 'links-8-6-26',
    live: '2026-08-06',
    dateLabel: 'August 6, 2026',
    // collisions: ORANGE & LIME read colors (colors full), BASS reads fish
    // (fish full), so each stays in its home group.
    groups: [
      { name: 'Citrus fruits', words: ['LEMON', 'LIME', 'ORANGE', 'TANGERINE'] },
      { name: 'Colors', words: ['VIOLET', 'INDIGO', 'MAGENTA', 'CYAN'] },
      { name: 'Types of guitar', words: ['ACOUSTIC', 'ELECTRIC', 'BASS', 'CLASSICAL'] },
      { name: 'Fish', words: ['TROUT', 'SALMON', 'TUNA', 'COD'] },
    ],
    reverseChecked: [
      "Citrus fruits -> Colors",
    ],
    collisions: [
      { word: 'ORANGE', reads: 'Colors' },
      { word: 'LIME', reads: 'Colors' },
      { word: 'BASS', reads: 'Fish' },
    ],
  },
  {
    num: 27,
    quizId: 'links-8-7-26',
    live: '2026-08-07',
    dateLabel: 'August 7, 2026',
    // collisions: TEMPEST reads weather (Shakespeare needs it, weather full),
    // THUNDER reads NBA (NBA full), so both resolve to their home groups.
    groups: [
      { name: 'Shakespeare plays', words: ['HAMLET', 'MACBETH', 'OTHELLO', 'TEMPEST'] },
      { name: 'Weather phenomena', words: ['STORM', 'THUNDER', 'FOG', 'MIST'] },
      { name: 'NBA teams', words: ['HEAT', 'MAGIC', 'NETS', 'BUCKS'] },
      { name: 'Music genres', words: ['JAZZ', 'BLUES', 'SOUL', 'FUNK'] },
    ],
    collisions: [
      { word: 'TEMPEST', reads: 'Weather phenomena' },
      { word: 'THUNDER', reads: 'NBA teams' },
    ],
  },
  {
    num: 28,
    quizId: 'links-8-8-26',
    live: '2026-08-08',
    dateLabel: 'August 8, 2026',
    // collisions: SLOTH reads sins (sins full), PRIDE & ENVY read emotions
    // (emotions full), so each stays home.
    groups: [
      { name: 'Types of bears', words: ['POLAR', 'GRIZZLY', 'PANDA', 'SLOTH'] },
      { name: 'Seven deadly sins', words: ['GREED', 'WRATH', 'PRIDE', 'ENVY'] },
      { name: 'Ice cream flavors', words: ['VANILLA', 'CHOCOLATE', 'STRAWBERRY', 'PISTACHIO'] },
      { name: 'Emotions', words: ['JOY', 'FEAR', 'ANGER', 'LOVE'] },
    ],
    reverseChecked: [
      "Seven deadly sins -> Emotions",
    ],
    collisions: [
      { word: 'SLOTH', reads: 'Seven deadly sins' },
      { word: 'PRIDE', reads: 'Emotions' },
      { word: 'ENVY', reads: 'Emotions' },
    ],
  },
  {
    num: 29,
    quizId: 'links-8-9-26',
    live: '2026-08-09',
    dateLabel: 'August 9, 2026',
    sunday: true,
    // SUNDAY EDITION: four cross-category collisions. Every shade of pink also
    // reads as another group, but each tempted group is already full of its own
    // members, so all four resolve back to pink. Exactly one valid grouping.
    //   SALMON reads fish (fish full: TUNA/TROUT/BASS/COD)
    //   CORAL reads snakes (snakes full)
    //   BLUSH & ROUGE read makeup (makeup full)
    groups: [
      { name: 'Shades of pink', words: ['SALMON', 'CORAL', 'BLUSH', 'ROUGE'] },
      { name: 'Fish', words: ['TUNA', 'TROUT', 'BASS', 'COD'] },
      { name: 'Snakes', words: ['COBRA', 'VIPER', 'MAMBA', 'ADDER'] },
      { name: 'Makeup products', words: ['MASCARA', 'BRONZER', 'LINER', 'CONCEALER'] },
    ],
    reverseChecked: [
      "Shades of pink -> Makeup products",
    ],
    collisions: [
      { word: 'SALMON', reads: 'Fish' },
      { word: 'CORAL', reads: 'Snakes' },
      { word: 'BLUSH', reads: 'Makeup products' },
      { word: 'ROUGE', reads: 'Makeup products' },
    ],
  },
  {
    num: 30,
    quizId: 'links-8-10-26',
    live: '2026-08-10',
    dateLabel: 'August 10, 2026',
    // collisions: ASPEN reads Colorado ski towns (full), PINE reads candle
    // scents (full), so both stay in trees.
    groups: [
      { name: 'Trees', words: ['OAK', 'MAPLE', 'ASPEN', 'PINE'] },
      { name: 'Colorado ski towns', words: ['VAIL', 'BRECKENRIDGE', 'TELLURIDE', 'KEYSTONE'] },
      { name: 'Candle scents', words: ['LAVENDER', 'VANILLA', 'CITRUS', 'OCEAN'] },
      { name: 'Musical instruments', words: ['PIANO', 'VIOLIN', 'FLUTE', 'DRUMS'] },
    ],
    collisions: [
      { word: 'ASPEN', reads: 'Colorado ski towns' },
      { word: 'PINE', reads: 'Candle scents' },
    ],
  },
  {
    num: 31,
    quizId: 'links-8-11-26',
    live: '2026-08-11',
    dateLabel: 'August 11, 2026',
    groups: [
      { name: "Shades of blue", words: ['COBALT', 'AZURE', 'TEAL', 'NAVY'] },
      { name: "US military branches", words: ['ARMY', 'MARINES', 'AIR FORCE', 'COAST GUARD'] },
      { name: "Poker hands", words: ['FLUSH', 'STRAIGHT', 'PAIR', 'FULL HOUSE'] },
      { name: "Bathroom fixtures", words: ['SINK', 'TUB', 'MIRROR', 'TOILET'] },
    ],
    collisions: [
      { word: 'NAVY', reads: "US military branches" },
      { word: 'FLUSH', reads: "Bathroom fixtures" },
    ],
  },
  {
    num: 32,
    quizId: 'links-8-12-26',
    live: '2026-08-12',
    dateLabel: 'August 12, 2026',
    groups: [
      { name: "Types of bread", words: ['SOURDOUGH', 'PITA', 'NAAN', 'RYE'] },
      { name: "Whiskeys", words: ['BOURBON', 'SCOTCH', 'IRISH', 'JAPANESE'] },
      { name: "Dances", words: ['TANGO', 'WALTZ', 'SALSA', 'RUMBA'] },
      { name: "Condiments", words: ['KETCHUP', 'MUSTARD', 'RELISH', 'CHUTNEY'] },
    ],
    collisions: [
      { word: 'RYE', reads: "Whiskeys" },
      { word: 'SALSA', reads: "Condiments" },
    ],
  },
  {
    num: 33,
    quizId: 'links-8-13-26',
    live: '2026-08-13',
    dateLabel: 'August 13, 2026',
    groups: [
      { name: "Big cats", words: ['JAGUAR', 'PUMA', 'LYNX', 'OCELOT'] },
      { name: "Sportswear brands", words: ['ADIDAS', 'REEBOK', 'ASICS', 'FILA'] },
      { name: "Car makes", words: ['VOLVO', 'SUBARU', 'MAZDA', 'SKODA'] },
      { name: "Constellations", words: ['ORION', 'LYRA', 'DRACO', 'CYGNUS'] },
    ],
    collisions: [
      { word: 'JAGUAR', reads: "Car makes" },
      { word: 'PUMA', reads: "Sportswear brands" },
    ],
  },
  {
    num: 34,
    quizId: 'links-8-14-26',
    live: '2026-08-14',
    dateLabel: 'August 14, 2026',
    groups: [
      { name: "Herbs", words: ['BASIL', 'SAGE', 'ROSEMARY', 'THYME'] },
      { name: "Fictional detectives", words: ['POIROT', 'MARPLE', 'HOLMES', 'COLUMBO'] },
      { name: "Cocktails", words: ['NEGRONI', 'SIDECAR', 'GIMLET', 'SAZERAC'] },
      { name: "Pizza toppings", words: ['PEPPERONI', 'ANCHOVY', 'CAPERS', 'SALAMI'] },
    ],
    collisions: [
      { word: 'BASIL', reads: "Fictional detectives" },
      { word: 'THYME', reads: "Cocktails" },
    ],
  },
  {
    num: 35,
    quizId: 'links-8-15-26',
    live: '2026-08-15',
    dateLabel: 'August 15, 2026',
    groups: [
      // Roman gods must contain NO planet name, or the planet slots float:
      // JUPITER/MARS here left six planet-gods for four planet slots.
      { name: "Planets", words: ['MERCURY', 'VENUS', 'SATURN', 'NEPTUNE'] },
      { name: "Roman gods", words: ['MINERVA', 'BACCHUS', 'VULCAN', 'JANUS'] },
      { name: "Elements", words: ['CARBON', 'ARGON', 'COBALT', 'ZINC'] },
      { name: "Car models", words: ['CORSA', 'PASSAT', 'ASTRA', 'MONDEO'] },
    ],
    reverseChecked: [
      "Planets -> Roman gods",
    ],
    collisions: [
      { word: 'MERCURY', reads: "Roman gods" },
      { word: 'VENUS', reads: "Roman gods" },
      { word: 'SATURN', reads: "Roman gods" },
      { word: 'NEPTUNE', reads: "Roman gods" },
      { word: 'MERCURY', reads: "Elements" },
    ],
  },
  {
    num: 36,
    quizId: 'links-8-16-26',
    live: '2026-08-16',
    dateLabel: 'August 16, 2026',
    sunday: true,
    groups: [
      { name: "Shades of green", words: ['OLIVE', 'JADE', 'FERN', 'SAGE'] },
      { name: "Pizza toppings", words: ['PEPPERONI', 'ANCHOVY', 'CAPERS', 'SALAMI'] },
      // PERIDOT was here and is itself a shade of green, which opened a second
      // grouping against the Shades of green column. AMETHYST is not green.
      { name: "Gemstones", words: ['OPAL', 'GARNET', 'TOPAZ', 'AMETHYST'] },
      { name: "Girls' names", words: ['IRIS', 'RUBY', 'HAZEL', 'DAISY'] },
    ],
    reverseChecked: [
      "Shades of green -> Girls' names",
    ],
    collisions: [
      { word: 'OLIVE', reads: "Pizza toppings" },
      { word: 'JADE', reads: "Gemstones" },
      { word: 'FERN', reads: "Girls' names" },
      { word: 'SAGE', reads: "Girls' names" },
      { word: 'OLIVE', reads: "Girls' names" },
      { word: 'JADE', reads: "Girls' names" },
    ],
  },
  {
    num: 37,
    quizId: 'links-8-17-26',
    live: '2026-08-17',
    dateLabel: 'August 17, 2026',
    groups: [
      { name: "Chess pieces", words: ['BISHOP', 'ROOK', 'PAWN', 'KNIGHT'] },
      { name: "Church roles", words: ['VICAR', 'DEACON', 'CURATE', 'VERGER'] },
      { name: "Crows and kin", words: ['RAVEN', 'MAGPIE', 'JACKDAW', 'CHOUGH'] },
      { name: "Medieval jobs", words: ['COOPER', 'FLETCHER', 'REEVE', 'SMITH'] },
    ],
    collisions: [
      { word: 'BISHOP', reads: "Church roles" },
      { word: 'ROOK', reads: "Crows and kin" },
      { word: 'KNIGHT', reads: "Medieval jobs" },
    ],
  },
  {
    num: 38,
    quizId: 'links-8-18-26',
    live: '2026-08-18',
    dateLabel: 'August 18, 2026',
    groups: [
      { name: "Knots", words: ['BOWLINE', 'HITCH', 'CLOVE', 'REEF'] },
      { name: "Spices", words: ['CUMIN', 'ANISE', 'CARDAMOM', 'TURMERIC'] },
      { name: "Sails and rigging", words: ['JIB', 'BOOM', 'MAST', 'SHROUD'] },
      { name: "Weapons", words: ['MACE', 'HALBERD', 'FLAIL', 'PIKE'] },
    ],
    collisions: [
      { word: 'CLOVE', reads: "Spices" },
      { word: 'REEF', reads: "Sails and rigging" },
    ],
  },
  {
    num: 39,
    quizId: 'links-8-19-26',
    live: '2026-08-19',
    dateLabel: 'August 19, 2026',
    groups: [
      { name: "Pasta shapes", words: ['PENNE', 'FUSILLI', 'RIGATONI', 'ORZO'] },
      { name: "Opera terms", words: ['ARIA', 'TENOR', 'LIBRETTO', 'DIVA'] },
      { name: "Italian cities", words: ['SIENA', 'LUCCA', 'BARI', 'VERONA'] },
      { name: "Cheeses", words: ['PARMESAN', 'PECORINO', 'ASIAGO', 'TALEGGIO'] },
    ],
    collisions: [
      { word: 'ORZO', reads: "Italian cities" },
      { word: 'ASIAGO', reads: "Italian cities" },
    ],
  },
  {
    num: 40,
    quizId: 'links-8-20-26',
    live: '2026-08-20',
    dateLabel: 'August 20, 2026',
    groups: [
      { name: "Rivers of Europe", words: ['SEINE', 'LOIRE', 'ELBE', 'TAGUS'] },
      { name: "French words in English", words: ['CAFE', 'GENRE', 'MIRAGE', 'DEBUT'] },
      { name: "Bridge parts", words: ['SPAN', 'PIER', 'ARCH', 'PARAPET'] },
      { name: "Ship parts", words: ['HULL', 'KEEL', 'DECK', 'BOW'] },
    ],
    collisions: [
      { word: 'PIER', reads: "Ship parts" },
      { word: 'SEINE', reads: "French words in English" },
    ],
  },
  {
    num: 41,
    quizId: 'links-8-21-26',
    live: '2026-08-21',
    dateLabel: 'August 21, 2026',
    groups: [
      { name: "Card suits", words: ['HEARTS', 'CLUBS', 'SPADES', 'DIAMONDS'] },
      { name: "Garden tools", words: ['TROWEL', 'RAKE', 'HOE', 'DIBBER'] },
      { name: "London football clubs", words: ['ARSENAL', 'FULHAM', 'BRENTFORD', 'MILLWALL'] },
      { name: "Baseball verbs", words: ['STEAL', 'WALK', 'BUNT', 'SLIDE'] },
    ],
    collisions: [
      { word: 'SPADES', reads: "Garden tools" },
      { word: 'CLUBS', reads: "London football clubs" },
    ],
  },
  {
    num: 42,
    quizId: 'links-8-22-26',
    live: '2026-08-22',
    dateLabel: 'August 22, 2026',
    groups: [
      { name: "Coffee drinks", words: ['LATTE', 'MOCHA', 'CORTADO', 'RISTRETTO'] },
      { name: "Boxing punches", words: ['JAB', 'HOOK', 'UPPERCUT', 'CROSS'] },
      { name: "Sewing words", words: ['HEM', 'SEAM', 'BASTE', 'PLEAT'] },
      { name: "Darts terms", words: ['OCHE', 'BULL', 'TREBLE', 'LEG'] },
    ],
    reverseChecked: [
      "Boxing punches -> Sewing words",
    ],
    collisions: [
      { word: 'HOOK', reads: "Sewing words" },
      { word: 'CROSS', reads: "Sewing words" },
    ],
  },
  {
    num: 43,
    quizId: 'links-8-23-26',
    live: '2026-08-23',
    dateLabel: 'August 23, 2026',
    sunday: true,
    groups: [
      { name: "Types of cloud", words: ['CIRRUS', 'STRATUS', 'NIMBUS', 'CUMULUS'] },
      { name: "Halo words", words: ['AURA', 'CORONA', 'GLORY', 'RADIANCE'] },
      { name: "Beers", words: ['STELLA', 'PERONI', 'TIGER', 'ASAHI'] },
      { name: "Wild cats", words: ['LEOPARD', 'CARACAL', 'SERVAL', 'MARGAY'] },
    ],
    reverseChecked: [
      "Types of cloud -> Halo words",
    ],
    collisions: [
      { word: 'NIMBUS', reads: "Halo words" },
      { word: 'CORONA', reads: "Beers" },
      { word: 'TIGER', reads: "Wild cats" },
      { word: 'CIRRUS', reads: "Halo words" },
    ],
  },
  {
    num: 44,
    quizId: 'links-8-24-26',
    live: '2026-08-24',
    dateLabel: 'August 24, 2026',
    groups: [
      { name: "Musical keys", words: ['MINOR', 'MAJOR', 'SHARP', 'FLAT'] },
      { name: "Army ranks", words: ['COLONEL', 'CORPORAL', 'ENSIGN', 'BRIGADIER'] },
      { name: "Apartment words", words: ['STUDIO', 'LOFT', 'DUPLEX', 'MAISONETTE'] },
      { name: "Clever words", words: ['ASTUTE', 'KEEN', 'CANNY', 'SHREWD'] },
    ],
    collisions: [
      { word: 'MAJOR', reads: "Army ranks" },
      { word: 'FLAT', reads: "Apartment words" },
      { word: 'SHARP', reads: "Clever words" },
    ],
  },
  {
    num: 45,
    quizId: 'links-8-25-26',
    live: '2026-08-25',
    dateLabel: 'August 25, 2026',
    groups: [
      { name: "Poems", words: ['SONNET', 'HAIKU', 'ODE', 'ELEGY'] },
      { name: "Greek letters", words: ['DELTA', 'SIGMA', 'OMEGA', 'IOTA'] },
      { name: "River features", words: ['OXBOW', 'MEANDER', 'ESTUARY', 'SPIT'] },
      { name: "Watch brands", words: ['ROLEX', 'TISSOT', 'SEIKO', 'BREITLING'] },
    ],
    collisions: [
      { word: 'DELTA', reads: "River features" },
      { word: 'OMEGA', reads: "Watch brands" },
    ],
  },
  {
    num: 46,
    quizId: 'links-8-26-26',
    live: '2026-08-26',
    dateLabel: 'August 26, 2026',
    groups: [
      { name: "Fabrics", words: ['DENIM', 'TWEED', 'LINEN', 'SATIN'] },
      { name: "Irish counties", words: ['CLARE', 'KERRY', 'MAYO', 'SLIGO'] },
      { name: "Sandwich fillings", words: ['TUNA', 'HAM', 'PICKLE', 'CORNED BEEF'] },
      { name: "Girls' names", words: ['IRIS', 'RUBY', 'HAZEL', 'DAISY'] },
    ],
    reverseChecked: [
      "Irish counties -> Girls' names",
    ],
    collisions: [
      { word: 'MAYO', reads: "Sandwich fillings" },
      { word: 'CLARE', reads: "Girls' names" },
      { word: 'KERRY', reads: "Girls' names" },
    ],
  },
  {
    num: 47,
    quizId: 'links-8-27-26',
    live: '2026-08-27',
    dateLabel: 'August 27, 2026',
    groups: [
      { name: "Board games", words: ['RISK', 'CLUE', 'SORRY', 'TROUBLE'] },
      { name: "Words before WORD", words: ['BUZZ', 'CROSS', 'PASS', 'SWEAR'] },
      { name: "Insurance terms", words: ['PREMIUM', 'CLAIM', 'EXCESS', 'DEDUCTIBLE'] },
      { name: "Detective needs", words: ['MOTIVE', 'ALIBI', 'WITNESS', 'SUSPECT'] },
    ],
    collisions: [
      { word: 'RISK', reads: "Insurance terms" },
      { word: 'CLUE', reads: "Detective needs" },
    ],
  },
  {
    num: 48,
    quizId: 'links-8-28-26',
    live: '2026-08-28',
    dateLabel: 'August 28, 2026',
    groups: [
      { name: "Types of pepper", words: ['CAYENNE', 'PAPRIKA', 'CHIPOTLE', 'HABANERO'] },
      { name: "Wyoming towns", words: ['CHEYENNE', 'LARAMIE', 'CODY', 'SHERIDAN'] },
      { name: "Friendly ghosts", words: ['CASPER', 'SLIMER', 'BOO', 'BLINKY'] },
      { name: "US presidents", words: ['JACKSON', 'TAFT', 'POLK', 'HAYES'] },
    ],
    collisions: [
      { word: 'CASPER', reads: "Wyoming towns" },
      { word: 'JACKSON', reads: "Wyoming towns" },
    ],
  },
  {
    num: 49,
    quizId: 'links-8-29-26',
    live: '2026-08-29',
    dateLabel: 'August 29, 2026',
    groups: [
      { name: "Wind instruments", words: ['OBOE', 'CLARINET', 'BASSOON', 'PICCOLO'] },
      { name: "Ice cream flavours", words: ['VANILLA', 'RUM RAISIN', 'STRACCIATELLA', 'NEAPOLITAN'] },
      { name: "Nuts", words: ['PECAN', 'PISTACHIO', 'CASHEW', 'MACADAMIA'] },
      { name: "Italian greetings", words: ['CIAO', 'PRONTO', 'SALVE', 'ARRIVEDERCI'] },
    ],
    collisions: [
      { word: 'PISTACHIO', reads: "Ice cream flavours" },
      { word: 'PICCOLO', reads: "Italian greetings" },
    ],
  },
  {
    num: 50,
    quizId: 'links-8-30-26',
    live: '2026-08-30',
    dateLabel: 'August 30, 2026',
    sunday: true,
    groups: [
      { name: "Trees", words: ['ASH', 'LIME', 'PLANE', 'WILLOW'] },
      { name: "Citrus fruit", words: ['YUZU', 'POMELO', 'CITRON', 'BERGAMOT'] },
      { name: "Aircraft", words: ['GLIDER', 'BIPLANE', 'AIRSHIP', 'SEAPLANE'] },
      // HAZEL and HOLLY were here and are both trees, which let the Trees
      // column take any two of ASH/WILLOW/HAZEL/HOLLY: six valid groupings.
      { name: "Girls' names", words: ['IRIS', 'DAISY', 'POPPY', 'PEARL'] },
    ],
    reverseChecked: [
      "Trees -> Girls' names",
    ],
    collisions: [
      { word: 'LIME', reads: "Citrus fruit" },
      { word: 'PLANE', reads: "Aircraft" },
      { word: 'WILLOW', reads: "Girls' names" },
      { word: 'ASH', reads: "Girls' names" },
    ],
  },
  {
    num: 51,
    quizId: 'links-8-31-26',
    live: '2026-08-31',
    dateLabel: 'August 31, 2026',
    groups: [
      { name: "Deserts", words: ['GOBI', 'SAHARA', 'MOJAVE', 'ATACAMA'] },
      { name: "Nissan models", words: ['MICRA', 'QASHQAI', 'JUKE', 'LEAF'] },
      { name: "Tea types", words: ['OOLONG', 'ASSAM', 'MATCHA', 'ROOIBOS'] },
      { name: "Tree parts", words: ['BARK', 'ROOT', 'CANOPY', 'SAPWOOD'] },
    ],
    collisions: [
      { word: 'LEAF', reads: "Tree parts" },
      { word: 'ASSAM', reads: "Deserts" },
    ],
  },
  {
    num: 52,
    quizId: 'links-9-1-26',
    live: '2026-09-01',
    dateLabel: 'September 1, 2026',
    groups: [
      { name: "Types of bear", words: ['GRIZZLY', 'SLOTH', 'SUN', 'SPECTACLED'] },
      { name: "Slow movers", words: ['GLACIER', 'SNAIL', 'TORTOISE', 'SLUG'] },
      { name: "Deadly sins", words: ['GREED', 'ENVY', 'WRATH', 'PRIDE'] },
      { name: "Solar words", words: ['FLARE', 'ECLIPSE', 'CORONA', 'SUNSPOT'] },
    ],
    collisions: [
      { word: 'SLOTH', reads: "Slow movers" },
      { word: 'SLOTH', reads: "Deadly sins" },
      { word: 'SUN', reads: "Solar words" },
    ],
  },
  {
    num: 53,
    quizId: 'links-9-2-26',
    live: '2026-09-02',
    dateLabel: 'September 2, 2026',
    groups: [
      { name: "Golf scores", words: ['BIRDIE', 'BOGEY', 'EAGLE', 'ALBATROSS'] },
      { name: "Seabirds", words: ['GANNET', 'PETREL', 'SKUA', 'FULMAR'] },
      { name: "Basketball verbs", words: ['DUNK', 'ASSIST', 'REBOUND', 'BLOCK'] },
      { name: "Cinema words", words: ['SCREEN', 'USHER', 'TRAILER', 'MATINEE'] },
    ],
    reverseChecked: [
      "Golf scores -> Seabirds",
    ],
    collisions: [
      { word: 'ALBATROSS', reads: "Seabirds" },
      { word: 'EAGLE', reads: "Seabirds" },
    ],
  },
  {
    num: 54,
    quizId: 'links-9-3-26',
    live: '2026-09-03',
    dateLabel: 'September 3, 2026',
    groups: [
      { name: "Snakes", words: ['VIPER', 'MAMBA', 'ADDER', 'KRAIT'] },
      { name: "Dodge models", words: ['CHARGER', 'RAM', 'DART', 'DURANGO'] },
      { name: "Maths verbs", words: ['ADD', 'DIVIDE', 'SUM', 'FACTOR'] },
      { name: "Phone accessories", words: ['CASE', 'DOCK', 'LANYARD', 'POWERBANK'] },
    ],
    collisions: [
      { word: 'VIPER', reads: "Dodge models" },
      { word: 'CHARGER', reads: "Phone accessories" },
    ],
  },
  {
    num: 55,
    quizId: 'links-9-4-26',
    live: '2026-09-04',
    dateLabel: 'September 4, 2026',
    groups: [
      { name: "Weather fronts", words: ['WARM', 'COLD', 'STATIONARY', 'OCCLUDED'] },
      { name: "Types of war", words: ['CIVIL', 'TRADE', 'PROXY', 'GUERRILLA'] },
      { name: "Polite words", words: ['COURTEOUS', 'GRACIOUS', 'TACTFUL', 'DEFERENTIAL'] },
      { name: "Calls at sea", words: ['MAYDAY', 'AHOY', 'AVAST', 'BELAY'] },
    ],
    collisions: [
      { word: 'COLD', reads: "Types of war" },
      { word: 'CIVIL', reads: "Polite words" },
    ],
  },
  {
    num: 56,
    quizId: 'links-9-5-26',
    live: '2026-09-05',
    dateLabel: 'September 5, 2026',
    groups: [
      { name: "Egyptian gods", words: ['ISIS', 'OSIRIS', 'ANUBIS', 'HORUS'] },
      { name: "Hair styles", words: ['BOB', 'PIXIE', 'PERM', 'SHAG'] },
      { name: "Carpet types", words: ['PILE', 'BERBER', 'SISAL', 'AXMINSTER'] },
      { name: "Small fairies", words: ['SPRITE', 'ELF', 'IMP', 'BROWNIE'] },
    ],
    reverseChecked: [
      "Hair styles -> Small fairies",
    ],
    collisions: [
      { word: 'SHAG', reads: "Carpet types" },
      { word: 'PIXIE', reads: "Small fairies" },
      { word: 'BOB', reads: "Small fairies" },
    ],
  },
  {
    num: 57,
    quizId: 'links-9-6-26',
    live: '2026-09-06',
    dateLabel: 'September 6, 2026',
    sunday: true,
    groups: [
      { name: "Mountain ranges", words: ['ANDES', 'ATLAS', 'URALS', 'ROCKIES'] },
      { name: "Reference books", words: ['MEMOIR', 'THESAURUS', 'ALMANAC', 'GAZETTEER'] },
      { name: "Greek titans", words: ['CRONUS', 'RHEA', 'THEIA', 'HYPERION'] },
      // DIONE was here and is also a Titaness, which opened a third titan
      // candidate and gave the board three groupings. PANDORA is not a titan.
      { name: "Moons of Saturn", words: ['TITAN', 'PANDORA', 'MIMAS', 'ENCELADUS'] },
    ],
    reverseChecked: [
      "Greek titans -> Moons of Saturn",
    ],
    collisions: [
      { word: 'ATLAS', reads: "Reference books" },
      { word: 'ATLAS', reads: "Greek titans" },
      { word: 'ATLAS', reads: "Moons of Saturn" },
      { word: 'RHEA', reads: "Moons of Saturn" },
      { word: 'HYPERION', reads: "Moons of Saturn" },
    ],
  },
  {
    num: 58,
    quizId: 'links-9-7-26',
    live: '2026-09-07',
    dateLabel: 'September 7, 2026',
    groups: [
      { name: "Circus acts", words: ['TRAPEZE', 'JUGGLER', 'CLOWN', 'TIGHTROPE'] },
      { name: "Fish", words: ['BASS', 'SOLE', 'BREAM', 'DACE'] },
      { name: "Shoe parts", words: ['HEEL', 'TONGUE', 'LACE', 'INSOLE'] },
      { name: "Amp controls", words: ['TREBLE', 'GAIN', 'REVERB', 'VOLUME'] },
    ],
    collisions: [
      { word: 'SOLE', reads: "Shoe parts" },
      { word: 'BASS', reads: "Amp controls" },
    ],
  },
  {
    num: 59,
    quizId: 'links-9-8-26',
    live: '2026-09-08',
    dateLabel: 'September 8, 2026',
    groups: [
      { name: "Sherlock stories", words: ['SCANDAL', 'SPECKLED BAND', 'SILVER BLAZE', 'FINAL PROBLEM'] },
      { name: "Chess openings", words: ['SICILIAN', 'CARO-KANN', 'ENGLISH', 'BIRD'] },
      { name: "Birds", words: ['BITTERN', 'SHRIKE', 'WHEATEAR', 'GOLDCREST'] },
      { name: "Nationalities", words: ['DANISH', 'SWEDISH', 'POLISH', 'SPANISH'] },
    ],
    collisions: [
      { word: 'BIRD', reads: "Birds" },
      { word: 'ENGLISH', reads: "Nationalities" },
    ],
  },
  {
    num: 60,
    quizId: 'links-9-9-26',
    live: '2026-09-09',
    dateLabel: 'September 9, 2026',
    groups: [
      { name: "World currencies", words: ['PESO', 'DINAR', 'RAND', 'FORINT'] },
      { name: "South African words", words: ['BILTONG', 'VELDT', 'BRAAI', 'BAKKIE'] },
      { name: "Rugby nicknames", words: ['SPRINGBOK', 'WALLABY', 'ALL BLACK', 'PUMA'] },
      { name: "Tropical fruit", words: ['GUAVA', 'LYCHEE', 'PAPAYA', 'KIWI'] },
    ],
    collisions: [
      { word: 'RAND', reads: "South African words" },
      { word: 'KIWI', reads: "Rugby nicknames" },
    ],
  },
  {
    num: 61,
    quizId: 'links-9-10-26',
    live: '2026-09-10',
    dateLabel: 'September 10, 2026',
    groups: [
      { name: "Sausages", words: ['CHORIZO', 'BRATWURST', 'ANDOUILLE', 'MERGUEZ'] },
      { name: "Spanish loanwords", words: ['SIESTA', 'FIESTA', 'PLAZA', 'PATIO'] },
      { name: "Dog breeds", words: ['BASENJI', 'SALUKI', 'VIZSLA', 'BORZOI'] },
      { name: "Vodka brands", words: ['SMIRNOFF', 'BELUGA', 'KETEL', 'GREY GOOSE'] },
    ],
    collisions: [
      { word: 'CHORIZO', reads: "Spanish loanwords" },
      { word: 'BELUGA', reads: "Dog breeds" },
    ],
  },
  {
    num: 62,
    quizId: 'links-9-11-26',
    live: '2026-09-11',
    dateLabel: 'September 11, 2026',
    groups: [
      { name: "Sushi terms", words: ['NIGIRI', 'MAKI', 'SASHIMI', 'UNAGI'] },
      { name: "Martial arts", words: ['AIKIDO', 'JUDO', 'KENDO', 'SUMO'] },
      { name: "Japanese cities", words: ['OSAKA', 'KOBE', 'SENDAI', 'NARA'] },
      { name: "Beef cuts", words: ['SIRLOIN', 'BRISKET', 'FLANK', 'RUMP'] },
    ],
    collisions: [
      { word: 'KOBE', reads: "Beef cuts" },
      { word: 'SUMO', reads: "Japanese cities" },
    ],
  },
  {
    num: 63,
    quizId: 'links-9-12-26',
    live: '2026-09-12',
    dateLabel: 'September 12, 2026',
    groups: [
      { name: "Volcanoes", words: ['ETNA', 'FUJI', 'KRAKATOA', 'HEKLA'] },
      { name: "Camera brands", words: ['NIKON', 'LEICA', 'PENTAX', 'CANON'] },
      { name: "Icelandic words", words: ['GEYSIR', 'SKYR', 'SAGA', 'FJORD'] },
      { name: "Photography words", words: ['APERTURE', 'SHUTTER', 'BOKEH', 'EXPOSURE'] },
    ],
    collisions: [
      { word: 'FUJI', reads: "Camera brands" },
      { word: 'HEKLA', reads: "Icelandic words" },
      { word: 'CANON', reads: "Photography words" },
    ],
  },
  {
    num: 64,
    quizId: 'links-9-13-26',
    live: '2026-09-13',
    dateLabel: 'September 13, 2026',
    sunday: true,
    groups: [
      { name: "Cricket fielding spots", words: ['SLIP', 'GULLY', 'POINT', 'COVER'] },
      { name: "Book jacket parts", words: ['BLURB', 'SPINE', 'FLAP', 'ENDPAPER'] },
      { name: "Small valleys", words: ['RAVINE', 'GLEN', 'COOMBE', 'DELL'] },
      { name: "Body parts", words: ['SHIN', 'LOBE', 'SHOULDER', 'TEMPLE'] },
    ],
    reverseChecked: [
      "Cricket fielding spots -> Small valleys",
    ],
    collisions: [
      { word: 'COVER', reads: "Book jacket parts" },
      { word: 'GULLY', reads: "Small valleys" },
      { word: 'SPINE', reads: "Body parts" },
      { word: 'POINT', reads: "Small valleys" },
    ],
  },
  {
    num: 65,
    quizId: 'links-9-14-26',
    live: '2026-09-14',
    dateLabel: 'September 14, 2026',
    groups: [
      { name: "Poisonous plants", words: ['HEMLOCK', 'NIGHTSHADE', 'FOXGLOVE', 'OLEANDER'] },
      { name: "Conifers", words: ['LARCH', 'YEW', 'SPRUCE', 'CEDAR'] },
      { name: "Archery words", words: ['QUIVER', 'FLETCH', 'NOCK', 'BRACER'] },
      { name: "Shivering words", words: ['TREMBLE', 'SHUDDER', 'QUAKE', 'SHIVER'] },
    ],
    collisions: [
      { word: 'HEMLOCK', reads: "Conifers" },
      { word: 'QUIVER', reads: "Shivering words" },
      { word: 'YEW', reads: "Archery words" },
    ],
  },
  {
    num: 66,
    quizId: 'links-9-15-26',
    live: '2026-09-15',
    dateLabel: 'September 15, 2026',
    groups: [
      { name: "Types of tide", words: ['SPRING', 'NEAP', 'EBB', 'FLOOD'] },
      { name: "Seasons", words: ['SUMMER', 'AUTUMN', 'WINTER', 'MONSOON'] },
      { name: "Mattress parts", words: ['FOAM', 'TOPPER', 'SLAT', 'VALANCE'] },
      { name: "Disasters", words: ['FAMINE', 'DROUGHT', 'PLAGUE', 'WILDFIRE'] },
    ],
    reverseChecked: [
      "Types of tide -> Disasters",
    ],
    collisions: [
      { word: 'SPRING', reads: "Seasons" },
      { word: 'SPRING', reads: "Mattress parts" },
      { word: 'FLOOD', reads: "Disasters" },
      { word: 'EBB', reads: "Disasters" },
    ],
  },
  {
    num: 67,
    quizId: 'links-9-16-26',
    live: '2026-09-16',
    dateLabel: 'September 16, 2026',
    groups: [
      { name: "Wine faults", words: ['CORKED', 'OXIDISED', 'VOLATILE', 'MUSTY'] },
      { name: "Chemistry words", words: ['SOLUBLE', 'INERT', 'CATALYST', 'ISOTOPE'] },
      { name: "Bottle parts", words: ['CORK', 'NECK', 'PUNT', 'LABEL'] },
      { name: "Rugby kicks", words: ['CONVERSION', 'DROP', 'GRUBBER', 'GARRYOWEN'] },
    ],
    collisions: [
      { word: 'VOLATILE', reads: "Chemistry words" },
      { word: 'PUNT', reads: "Rugby kicks" },
    ],
  },
  {
    num: 68,
    quizId: 'links-9-17-26',
    live: '2026-09-17',
    dateLabel: 'September 17, 2026',
    groups: [
      { name: "Bee castes", words: ['DRONE', 'WORKER', 'QUEEN', 'NURSE'] },
      { name: "Aircraft types", words: ['GLIDER', 'BIPLANE', 'AIRSHIP', 'SEAPLANE'] },
      { name: "Music markings", words: ['TEMPO', 'REST', 'CODA', 'LEGATO'] },
      { name: "Chess endgame words", words: ['STALEMATE', 'PROMOTION', 'ZUGZWANG', 'OPPOSITION'] },
    ],
    collisions: [
      { word: 'DRONE', reads: "Aircraft types" },
      { word: 'QUEEN', reads: "Chess endgame words" },
      { word: 'DRONE', reads: "Music markings" },
    ],
  },
  {
    num: 69,
    quizId: 'links-9-18-26',
    live: '2026-09-18',
    dateLabel: 'September 18, 2026',
    groups: [
      { name: "Pastry types", words: ['CHOUX', 'FILO', 'PUFF', 'SHORTCRUST'] },
      { name: "Smoking words", words: ['DRAG', 'ASH', 'EMBER', 'STUB'] },
      { name: "Broadleaf trees", words: ['ELM', 'LIME', 'PLANE', 'BEECH'] },
      { name: "Citrus fruit", words: ['YUZU', 'POMELO', 'CITRON', 'BERGAMOT'] },
    ],
    collisions: [
      { word: 'PUFF', reads: "Smoking words" },
      { word: 'LIME', reads: "Citrus fruit" },
      { word: 'PLANE', reads: "Pastry types" },
    ],
  },
  {
    num: 70,
    quizId: 'links-9-19-26',
    live: '2026-09-19',
    dateLabel: 'September 19, 2026',
    groups: [
      { name: "Chicken dishes", words: ['KIEV', 'TIKKA', 'PICCATA', 'SATAY'] },
      { name: "Capital cities", words: ['LIMA', 'OSLO', 'DAKAR', 'SOFIA'] },
      { name: "Bank terms", words: ['CREDIT', 'DEBIT', 'LEDGER', 'OVERDRAFT'] },
      { name: "Film credit roles", words: ['GAFFER', 'BEST BOY', 'GRIP', 'FOLEY'] },
    ],
    collisions: [
      { word: 'KIEV', reads: "Capital cities" },
      { word: 'CREDIT', reads: "Film credit roles" },
    ],
  },
  {
    num: 71,
    quizId: 'links-9-20-26',
    live: '2026-09-20',
    dateLabel: 'September 20, 2026',
    sunday: true,
    groups: [
      { name: "Card suits", words: ['HEARTS', 'CLUBS', 'SPADES', 'DIAMONDS'] },
      { name: "Body organs", words: ['LIVER', 'KIDNEY', 'LUNG', 'SPLEEN'] },
      { name: "Garden tools", words: ['TROWEL', 'RAKE', 'HOE', 'DIBBER'] },
      { name: "Gemstones", words: ['OPAL', 'GARNET', 'TOPAZ', 'PERIDOT'] },
    ],
    reverseChecked: [
      "Card suits -> Gemstones",
    ],
    collisions: [
      { word: 'HEARTS', reads: "Body organs" },
      { word: 'SPADES', reads: "Garden tools" },
      { word: 'DIAMONDS', reads: "Gemstones" },
      { word: 'HEARTS', reads: "Gemstones" },
    ],
  },
  {
    num: 72,
    quizId: 'links-9-21-26',
    live: '2026-09-21',
    dateLabel: 'September 21, 2026',
    groups: [
      { name: "Ways to walk", words: ['AMBLE', 'SAUNTER', 'TRUDGE', 'STROLL'] },
      { name: "Open golf courses", words: ['TROON', 'MUIRFIELD', 'BIRKDALE', 'CARNOUSTIE'] },
      { name: "Lunch orders", words: ['SANDWICH', 'SOUP', 'WRAP', 'SALAD'] },
      { name: "Wrestling moves", words: ['SUPLEX', 'PIN', 'HEADLOCK', 'BODYSLAM'] },
    ],
    collisions: [
      { word: 'SANDWICH', reads: "Open golf courses" },
      { word: 'WRAP', reads: "Wrestling moves" },
    ],
  },
  {
    num: 73,
    quizId: 'links-9-22-26',
    live: '2026-09-22',
    dateLabel: 'September 22, 2026',
    groups: [
      { name: "Rain words", words: ['DRIZZLE', 'DOWNPOUR', 'SHOWER', 'SQUALL'] },
      { name: "Bathroom fittings", words: ['BASIN', 'TILE', 'GROUT', 'CISTERN'] },
      { name: "Party words", words: ['TOAST', 'FAVOUR', 'PINATA', 'STREAMER'] },
      { name: "Breakfast foods", words: ['PORRIDGE', 'KIPPER', 'CRUMPET', 'KEDGEREE'] },
    ],
    collisions: [
      { word: 'SHOWER', reads: "Bathroom fittings" },
      { word: 'SHOWER', reads: "Party words" },
      { word: 'TOAST', reads: "Breakfast foods" },
      { word: 'DRIZZLE', reads: "Breakfast foods" },
    ],
  },
  {
    num: 74,
    quizId: 'links-9-23-26',
    live: '2026-09-23',
    dateLabel: 'September 23, 2026',
    groups: [
      { name: "Fencing terms", words: ['FOIL', 'PARRY', 'LUNGE', 'RIPOSTE'] },
      { name: "Kitchen wraps", words: ['CLINGFILM', 'PARCHMENT', 'GREASEPROOF', 'BAKING PAPER'] },
      { name: "Gym moves", words: ['SQUAT', 'PLANK', 'BURPEE', 'CRUNCH'] },
      { name: "Sheet materials", words: ['PLYWOOD', 'VENEER', 'MDF', 'CHIPBOARD'] },
    ],
    collisions: [
      { word: 'FOIL', reads: "Kitchen wraps" },
      { word: 'PLANK', reads: "Sheet materials" },
      { word: 'LUNGE', reads: "Gym moves" },
    ],
  },
  {
    num: 75,
    quizId: 'links-9-24-26',
    live: '2026-09-24',
    dateLabel: 'September 24, 2026',
    groups: [
      { name: "Types of pen", words: ['BIRO', 'QUILL', 'FOUNTAIN', 'MARKER'] },
      { name: "Hedgehog and kin", words: ['SPINE', 'BRISTLE', 'BARB', 'PRICKLE'] },
      { name: "Town square features", words: ['PLAZA', 'PIAZZA', 'BANDSTAND', 'BENCH'] },
      { name: "Graveyard words", words: ['EPITAPH', 'PLOT', 'URN', 'HEADSTONE'] },
    ],
    collisions: [
      { word: 'QUILL', reads: "Hedgehog and kin" },
      { word: 'FOUNTAIN', reads: "Town square features" },
      { word: 'MARKER', reads: "Graveyard words" },
    ],
  },
  {
    num: 76,
    quizId: 'links-9-25-26',
    live: '2026-09-25',
    dateLabel: 'September 25, 2026',
    groups: [
      { name: "Pub games", words: ['DARTS', 'SKITTLES', 'DOMINOES', 'SHOVE HAPENNY'] },
      { name: "Sweets", words: ['HUMBUG', 'GOBSTOPPER', 'LIQUORICE', 'SHERBET'] },
      { name: "Swimming words", words: ['LANE', 'LENGTH', 'DIVE', 'TUMBLE TURN'] },
      { name: "Betting words", words: ['ODDS', 'STAKE', 'ACCA', 'PLACEPOT'] },
    ],
    collisions: [
      { word: 'SKITTLES', reads: "Sweets" },
      { word: 'DARTS', reads: "Betting words" },
    ],
  },
  {
    num: 77,
    quizId: 'links-9-26-26',
    live: '2026-09-26',
    dateLabel: 'September 26, 2026',
    groups: [
      { name: "Latin phrases", words: ['ERGO', 'IPSO FACTO', 'AD HOC', 'QUID PRO QUO'] },
      { name: "Money slang", words: ['DOSH', 'WONGA', 'QUID', 'READIES'] },
      { name: "Orchestra sections", words: ['BRASS', 'STRINGS', 'WOODWIND', 'PERCUSSION'] },
      { name: "Cheek words", words: ['GALL', 'NERVE', 'AUDACITY', 'TEMERITY'] },
    ],
    collisions: [
      { word: 'QUID', reads: "Latin phrases" },
      { word: 'BRASS', reads: "Cheek words" },
      { word: 'BRASS', reads: "Money slang" },
    ],
  },
  {
    num: 78,
    quizId: 'links-9-27-26',
    live: '2026-09-27',
    dateLabel: 'September 27, 2026',
    sunday: true,
    groups: [
      { name: "Thames bridges", words: ['TOWER', 'ALBERT', 'BATTERSEA', 'SOUTHWARK'] },
      { name: "Castle parts", words: ['KEEP', 'MOAT', 'BAILEY', 'PORTCULLIS'] },
      { name: "Power stations", words: ['DIDCOT', 'DRAX', 'SIZEWELL', 'RATCLIFFE'] },
      { name: "Prince consorts", words: ['PHILIP', 'FERDINAND', 'CLAUS', 'HENDRIK'] },
    ],
    reverseChecked: [
      "Thames bridges -> Castle parts",
    ],
    collisions: [
      { word: 'TOWER', reads: "Castle parts" },
      { word: 'BATTERSEA', reads: "Power stations" },
      { word: 'ALBERT', reads: "Prince consorts" },
      { word: 'SOUTHWARK', reads: "Castle parts" },
    ],
  },
  {
    num: 79,
    quizId: 'links-9-28-26',
    live: '2026-09-28',
    dateLabel: 'September 28, 2026',
    groups: [
      { name: "Potato dishes", words: ['MASH', 'ROAST', 'CHIP', 'DAUPHINOISE'] },
      { name: "Brewing words", words: ['WORT', 'SPARGE', 'HOPS', 'MALT'] },
      { name: "Startup words", words: ['PIVOT', 'UNICORN', 'RUNWAY', 'BURN RATE'] },
      { name: "Cricket deliveries", words: ['BOUNCER', 'YORKER', 'GOOGLY', 'SEAMER'] },
    ],
    collisions: [
      { word: 'MASH', reads: "Brewing words" },
      { word: 'CHIP', reads: "Startup words" },
    ],
  },
  {
    num: 80,
    quizId: 'links-9-29-26',
    live: '2026-09-29',
    dateLabel: 'September 29, 2026',
    groups: [
      { name: "Roof parts", words: ['EAVES', 'RIDGE', 'GABLE', 'SOFFIT'] },
      { name: "Mountain features", words: ['SCREE', 'ARETE', 'CIRQUE', 'COL'] },
      { name: "Camera kit", words: ['LENS', 'TRIPOD', 'FLASH', 'HOOD'] },
      { name: "Coffee gear", words: ['GRINDER', 'TAMPER', 'PORTAFILTER', 'FROTHER'] },
    ],
    collisions: [
      { word: 'RIDGE', reads: "Mountain features" },
      { word: 'HOOD', reads: "Roof parts" },
    ],
  },
  {
    num: 81,
    quizId: 'links-9-30-26',
    live: '2026-09-30',
    dateLabel: 'September 30, 2026',
    groups: [
      { name: "___ board", words: ['KEY', 'SURF', 'CARD', 'DASH'] },
      { name: "___ light", words: ['SPOT', 'MOON', 'HIGH', 'FLASH'] },
      { name: "___ work", words: ['NET', 'HOME', 'FIRE', 'GUESS'] },
      { name: "___ house", words: ['GREEN', 'LIGHT', 'FARM', 'WARE'] },
    ],
    collisions: [
      { word: 'KEY', reads: "___ light" },
      { word: 'FIRE', reads: "___ light" },
      { word: 'FIRE', reads: "___ house" },
      { word: 'GREEN', reads: "___ light" },
    ],
  },
  {
    num: 82,
    quizId: 'links-10-1-26',
    live: '2026-10-01',
    dateLabel: 'October 1, 2026',
    groups: [
      { name: "Sounds like a letter", words: ['QUEUE', 'WHY', 'SEA', 'EWE'] },
      { name: "Sounds like a number", words: ['WON', 'TOO', 'ATE', 'FORE'] },
      { name: "Bodies of water", words: ['GULF', 'SOUND', 'STRAIT', 'INLET'] },
      { name: "Sheep and goats", words: ['RAM', 'KID', 'NANNY', 'BILLY'] },
    ],
    collisions: [
      { word: 'SEA', reads: "Bodies of water" },
      { word: 'EWE', reads: "Sheep and goats" },
    ],
  },
  {
    num: 83,
    quizId: 'links-10-2-26',
    live: '2026-10-02',
    dateLabel: 'October 2, 2026',
    groups: [
      { name: "Hides a body part", words: ['SHINE', 'BEARD', 'CHIPS', 'CHINA'] },
      { name: "Hides an animal", words: ['CRATE', 'SCOWL', 'BATCH', 'SPIGOT'] },
      { name: "Card games", words: ['BRIDGE', 'HEARTS', 'RUMMY', 'CANASTA'] },
      { name: "Poker terms", words: ['FLOP', 'RIVER', 'BLIND', 'ANTE'] },
    ],
    collisions: [
      { word: 'HEARTS', reads: "Hides a body part" },
      { word: 'BEARD', reads: "Hides an animal" },
      { word: 'ANTE', reads: "Hides an animal" },
      { word: 'CHIPS', reads: "Poker terms" },
    ],
  },
  {
    num: 84,
    quizId: 'links-10-3-26',
    live: '2026-10-03',
    dateLabel: 'October 3, 2026',
    groups: [
      { name: "Another word backwards", words: ['STRAW', 'DRAWER', 'DESSERTS', 'SPOOL'] },
      { name: "Parts of a shoe", words: ['TONGUE', 'SOLE', 'WELT', 'EYELET'] },
      { name: "Cuts of beef", words: ['RIB', 'FLANK', 'CHUCK', 'SKIRT'] },
      { name: "Parts of a loaf", words: ['CRUST', 'HEEL', 'CRUMB', 'END'] },
    ],
    collisions: [
      { word: 'TONGUE', reads: "Cuts of beef" },
      { word: 'HEEL', reads: "Parts of a shoe" },
    ],
  },
  {
    num: 85,
    quizId: 'links-10-4-26',
    live: '2026-10-04',
    dateLabel: 'October 4, 2026',
    sunday: true,
    groups: [
      { name: "Greek letters", words: ['ALPHA', 'DELTA', 'SIGMA', 'OMEGA'] },
      { name: "NATO alphabet", words: ['BRAVO', 'TANGO', 'FOXTROT', 'WHISKEY'] },
      { name: "River features", words: ['MOUTH', 'BANK', 'BED', 'MEANDER'] },
      { name: "Ballroom dances", words: ['WALTZ', 'RUMBA', 'SAMBA', 'QUICKSTEP'] },
    ],
    reverseChecked: [
      "NATO alphabet -> Ballroom dances",
    ],
    collisions: [
      { word: 'ALPHA', reads: "NATO alphabet" },
      { word: 'DELTA', reads: "River features" },
      { word: 'TANGO', reads: "Ballroom dances" },
      { word: 'FOXTROT', reads: "Ballroom dances" },
    ],
  },
  {
    num: 86,
    quizId: 'links-10-5-26',
    live: '2026-10-05',
    dateLabel: 'October 5, 2026',
    groups: [
      { name: "Anagrams of animals", words: ['SHORE', 'SNEAK', 'LOIN', 'TOGA'] },
      { name: "Cuts of pork", words: ['BELLY', 'HOCK', 'CHOP', 'SHOULDER'] },
      { name: "Move stealthily", words: ['CREEP', 'SLINK', 'PROWL', 'TIPTOE'] },
      { name: "Roman dress", words: ['TUNIC', 'STOLA', 'SANDALS', 'LAUREL'] },
    ],
    collisions: [
      { word: 'LOIN', reads: "Cuts of pork" },
      { word: 'SNEAK', reads: "Move stealthily" },
      { word: 'TOGA', reads: "Roman dress" },
    ],
  },
  {
    num: 87,
    quizId: 'links-10-6-26',
    live: '2026-10-06',
    dateLabel: 'October 6, 2026',
    groups: [
      { name: "Fire ___", words: ['FLY', 'PROOF', 'PLACE', 'WORKS'] },
      { name: "Snow ___", words: ['BALL', 'FLAKE', 'DRIFT', 'PLOUGH'] },
      { name: "Book ___", words: ['SHELF', 'MARK', 'WORM', 'END'] },
      { name: "Card ___", words: ['SHARK', 'BOARD', 'HOLDER', 'TABLE'] },
    ],
    collisions: [
      { word: 'BALL', reads: "Fire ___" },
      { word: 'BOARD', reads: "Snow ___" },
    ],
  },
  {
    num: 88,
    quizId: 'links-10-7-26',
    live: '2026-10-07',
    dateLabel: 'October 7, 2026',
    groups: [
      { name: "Silent first letter", words: ['KNIFE', 'GNOME', 'WRIST', 'PSALM'] },
      { name: "Kitchen drawer", words: ['WHISK', 'PEELER', 'GRATER', 'SPATULA'] },
      { name: "Joints", words: ['ANKLE', 'ELBOW', 'HIP', 'SHOULDER'] },
      { name: "Money owed", words: ['ARREARS', 'DUES', 'TAB', 'LIABILITY'] },
    ],
    collisions: [
      { word: 'KNIFE', reads: "Kitchen drawer" },
      { word: 'WRIST', reads: "Joints" },
    ],
  },
  {
    num: 89,
    quizId: 'links-10-8-26',
    live: '2026-10-08',
    dateLabel: 'October 8, 2026',
    groups: [
      { name: "Written in Roman numerals", words: ['MIX', 'DIM', 'CIVIL', 'MILL'] },
      { name: "Bartender verbs", words: ['SHAKE', 'STIR', 'MUDDLE', 'STRAIN'] },
      { name: "Fade away", words: ['WANE', 'DULL', 'EBB', 'PALE'] },
      { name: "Courteous", words: ['POLITE', 'GENTEEL', 'GRACIOUS', 'CORDIAL'] },
    ],
    collisions: [
      { word: 'MIX', reads: "Bartender verbs" },
      { word: 'DIM', reads: "Fade away" },
      { word: 'CIVIL', reads: "Courteous" },
    ],
  },
  {
    num: 90,
    quizId: 'links-10-9-26',
    live: '2026-10-09',
    dateLabel: 'October 9, 2026',
    groups: [
      { name: "Sounds like a body part", words: ['MUSSEL', 'WASTE', 'HARE', 'NAVAL'] },
      { name: "Rabbit words", words: ['BUCK', 'DOE', 'WARREN', 'KIT'] },
      { name: "Navy ranks", words: ['ENSIGN', 'ADMIRAL', 'COMMODORE', 'MIDSHIPMAN'] },
      { name: "Rubbish", words: ['REFUSE', 'LITTER', 'DEBRIS', 'DROSS'] },
    ],
    collisions: [
      { word: 'HARE', reads: "Rabbit words" },
      { word: 'NAVAL', reads: "Navy ranks" },
      { word: 'WASTE', reads: "Rubbish" },
    ],
  },
  {
    num: 91,
    quizId: 'links-10-10-26',
    live: '2026-10-10',
    dateLabel: 'October 10, 2026',
    groups: [
      { name: "Sounds like a country", words: ['CHILLY', 'GREASE', 'HUNGRY', 'WHALES'] },
      { name: "Cold", words: ['FRIGID', 'NIPPY', 'BITTER', 'RAW'] },
      { name: "Lubricants", words: ['OIL', 'WAX', 'GRAPHITE', 'SILICONE'] },
      { name: "Giants of the sea", words: ['ORCAS', 'MANTAS', 'SHARKS', 'SQUIDS'] },
    ],
    collisions: [
      { word: 'CHILLY', reads: "Cold" },
      { word: 'GREASE', reads: "Lubricants" },
      { word: 'WHALES', reads: "Giants of the sea" },
    ],
  },
  {
    num: 92,
    quizId: 'links-10-11-26',
    live: '2026-10-11',
    dateLabel: 'October 11, 2026',
    sunday: true,
    groups: [
      { name: "Zodiac signs", words: ['LIBRA', 'ARIES', 'LEO', 'CANCER'] },
      { name: "Constellations", words: ['ORION', 'LYRA', 'DRACO', 'CYGNUS'] },
      { name: "___ cut", words: ['CREW', 'SHORT', 'BUZZ', 'PIXIE'] },
      { name: "Shapes of pasta", words: ['PENNE', 'ORZO', 'FUSILLI', 'RIGATONI'] },
    ],
    reverseChecked: [
      "Zodiac signs -> Constellations",
    ],
    collisions: [
      { word: 'LIBRA', reads: "Constellations" },
      { word: 'ARIES', reads: "Constellations" },
      { word: 'LEO', reads: "Constellations" },
      { word: 'CANCER', reads: "Constellations" },
    ],
  },
  {
    num: 93,
    quizId: 'links-10-12-26',
    live: '2026-10-12',
    dateLabel: 'October 12, 2026',
    groups: [
      { name: "___ball", words: ['FOOT', 'BASKET', 'MOTH', 'HAND'] },
      { name: "Shellfish", words: ['CLAM', 'OYSTER', 'SCALLOP', 'LOBSTER'] },
      { name: "Kitchen appliances", words: ['BLENDER', 'TOASTER', 'KETTLE', 'OVEN'] },
      { name: "Picnic gear", words: ['HAMPER', 'BLANKET', 'COOLER', 'THERMOS'] },
    ],
    collisions: [
      { word: 'BASKET', reads: "Picnic gear" },
      { word: 'COOLER', reads: "Kitchen appliances" },
    ],
  },
  {
    num: 94,
    quizId: 'links-10-13-26',
    live: '2026-10-13',
    dateLabel: 'October 13, 2026',
    groups: [
      { name: "Sounds like a vegetable", words: ['LEAK', 'BEAT', 'CARAT', 'MAZE'] },
      { name: "Rhythm words", words: ['METER', 'CADENCE', 'GROOVE', 'MEASURE'] },
      { name: "Diamond grading terms", words: ['CUT', 'CLARITY', 'COLOR', 'FLAWLESS'] },
      { name: "Run away", words: ['FLEE', 'BOLT', 'SCRAM', 'SKEDADDLE'] },
    ],
    collisions: [
      { word: 'BEAT', reads: "Rhythm words" },
      { word: 'CARAT', reads: "Diamond grading terms" },
    ],
  },
  {
    num: 95,
    quizId: 'links-10-14-26',
    live: '2026-10-14',
    dateLabel: 'October 14, 2026',
    groups: [
      { name: "Hides a color", words: ['PROSE', 'STANCE', 'SHRED', 'STEALTH'] },
      { name: "Kinds of writing", words: ['ESSAY', 'NOVEL', 'FABLE', 'SATIRE'] },
      { name: "Posture words", words: ['SLOUCH', 'HUNCH', 'STOOP', 'POISE'] },
      { name: "Kitchen cutting verbs", words: ['DICE', 'MINCE', 'JULIENNE', 'CUBE'] },
    ],
    collisions: [
      { word: 'PROSE', reads: "Kinds of writing" },
      { word: 'STANCE', reads: "Posture words" },
      { word: 'SHRED', reads: "Kitchen cutting verbs" },
    ],
  },
  {
    num: 96,
    quizId: 'links-10-15-26',
    live: '2026-10-15',
    dateLabel: 'October 15, 2026',
    groups: [
      { name: "Anagrams of fruits", words: ['REAP', 'MILE', 'LUMP', 'AMONG'] },
      { name: "Distance units", words: ['FURLONG', 'LEAGUE', 'FATHOM', 'KILOMETER'] },
      { name: "Farm chores", words: ['PLOW', 'SOW', 'HARROW', 'THRESH'] },
      { name: "Swellings", words: ['BUMP', 'NODULE', 'BLISTER', 'BUNION'] },
    ],
    collisions: [
      { word: 'MILE', reads: "Distance units" },
      { word: 'REAP', reads: "Farm chores" },
      { word: 'LUMP', reads: "Swellings" },
    ],
  },
  {
    num: 97,
    quizId: 'links-10-16-26',
    live: '2026-10-16',
    dateLabel: 'October 16, 2026',
    groups: [
      { name: "Honey___", words: ['BEE', 'COMB', 'DEW', 'SUCKLE'] },
      { name: "Insects", words: ['WASP', 'HORNET', 'BEETLE', 'CRICKET'] },
      { name: "Grooming tools", words: ['BRUSH', 'RAZOR', 'TWEEZERS', 'CLIPPERS'] },
      { name: "Wedding words", words: ['BRIDE', 'VOWS', 'VEIL', 'BOUQUET'] },
    ],
    collisions: [
      { word: 'BEE', reads: "Insects" },
      { word: 'COMB', reads: "Grooming tools" },
    ],
  },
  {
    num: 98,
    quizId: 'links-10-17-26',
    live: '2026-10-17',
    dateLabel: 'October 17, 2026',
    groups: [
      { name: "Silent B", words: ['LAMB', 'DEBT', 'TOMB', 'DOUBT'] },
      { name: "Young animals", words: ['CALF', 'FOAL', 'CUB', 'JOEY'] },
      { name: "Uncertainty", words: ['QUALM', 'MISGIVING', 'SUSPICION', 'HESITATION'] },
      { name: "Resting places", words: ['CRYPT', 'VAULT', 'SEPULCHER', 'MAUSOLEUM'] },
    ],
    collisions: [
      { word: 'LAMB', reads: "Young animals" },
      { word: 'DOUBT', reads: "Uncertainty" },
      { word: 'TOMB', reads: "Resting places" },
    ],
  },
  {
    num: 99,
    quizId: 'links-10-18-26',
    live: '2026-10-18',
    dateLabel: 'October 18, 2026',
    sunday: true,
    groups: [
      { name: "Hides a number", words: ['OFTEN', 'WEIGHT', 'CANINE', 'HEIGHT'] },
      { name: "Teeth", words: ['MOLAR', 'INCISOR', 'FANG', 'TUSK'] },
      { name: "Many times", words: ['FREQUENTLY', 'REPEATEDLY', 'REGULARLY', 'CONSTANTLY'] },
      { name: "Body measurements", words: ['WAIST', 'INSEAM', 'CHEST', 'HIPS'] },
    ],
    reverseChecked: [
      "Hides a number -> Body measurements",
    ],
    collisions: [
      { word: 'OFTEN', reads: "Many times" },
      { word: 'WEIGHT', reads: "Body measurements" },
      { word: 'HEIGHT', reads: "Body measurements" },
      { word: 'CANINE', reads: "Teeth" },
    ],
  },
  {
    num: 100,
    quizId: 'links-10-19-26',
    live: '2026-10-19',
    dateLabel: 'October 19, 2026',
    groups: [
      { name: "Pie flavors", words: ['PUMPKIN', 'KEY LIME', 'BLUEBERRY', 'RHUBARB'] },
      { name: "Halloween sights", words: ['COBWEB', 'SKELETON', 'CAULDRON', 'BAT'] },
      { name: "Door ___", words: ['KNOB', 'BELL', 'MAT', 'STEP'] },
      { name: "Nocturnal animals", words: ['ARMADILLO', 'BADGER', 'OPOSSUM', 'RACCOON'] },
    ],
    collisions: [
      { word: 'PUMPKIN', reads: "Halloween sights" },
      { word: 'BAT', reads: "Nocturnal animals" },
    ],
  },
  {
    num: 101,
    quizId: 'links-10-20-26',
    live: '2026-10-20',
    dateLabel: 'October 20, 2026',
    groups: [
      { name: "Backwards animals", words: ['REED', 'TANG', 'SNUG', 'TAR'] },
      { name: "Wetland plants", words: ['CATTAIL', 'BULRUSH', 'SEDGE', 'WATER LILY'] },
      { name: "Road surfaces", words: ['ASPHALT', 'GRAVEL', 'CONCRETE', 'COBBLESTONE'] },
      { name: "Cozy", words: ['HOMEY', 'COMFY', 'TOASTY', 'CUDDLY'] },
    ],
    collisions: [
      { word: 'REED', reads: "Wetland plants" },
      { word: 'TAR', reads: "Road surfaces" },
      { word: 'SNUG', reads: "Cozy" },
    ],
  },
  {
    num: 102,
    quizId: 'links-10-21-26',
    live: '2026-10-21',
    dateLabel: 'October 21, 2026',
    groups: [
      { name: "___paper", words: ['WALL', 'NEWS', 'TISSUE', 'TRACING'] },
      { name: "Newscast segments", words: ['WEATHER', 'SPORTS', 'TRAFFIC', 'HEADLINES'] },
      { name: "Barriers", words: ['FENCE', 'HEDGE', 'BARRICADE', 'RAILING'] },
      { name: "Things you blow", words: ['BUBBLE', 'WHISTLE', 'TRUMPET', 'FUSE'] },
    ],
    collisions: [
      { word: 'NEWS', reads: "Newscast segments" },
      { word: 'WALL', reads: "Barriers" },
    ],
  },
  {
    num: 103,
    quizId: 'links-10-22-26',
    live: '2026-10-22',
    dateLabel: 'October 22, 2026',
    groups: [
      { name: "Things with needles", words: ['CACTUS', 'COMPASS', 'PORCUPINE', 'SYRINGE'] },
      { name: "Rodents", words: ['BEAVER', 'GERBIL', 'CHIPMUNK', 'VOLE'] },
      { name: "Navigation instruments", words: ['SEXTANT', 'ASTROLABE', 'SONAR', 'CHRONOMETER'] },
      { name: "Desert sights", words: ['DUNE', 'OASIS', 'MESA', 'TUMBLEWEED'] },
    ],
    collisions: [
      { word: 'PORCUPINE', reads: "Rodents" },
      { word: 'COMPASS', reads: "Navigation instruments" },
      { word: 'CACTUS', reads: "Desert sights" },
    ],
  },
  {
    num: 104,
    quizId: 'links-10-23-26',
    live: '2026-10-23',
    dateLabel: 'October 23, 2026',
    groups: [
      { name: "Pass___", words: ['PORT', 'OVER', 'WORD', 'BOOK'] },
      { name: "Harbors", words: ['MARINA', 'WHARF', 'JETTY', 'QUAY'] },
      { name: "Fortified wines", words: ['SHERRY', 'MADEIRA', 'MARSALA', 'VERMOUTH'] },
      { name: "Finished", words: ['DONE', 'ENDED', 'COMPLETE', 'KAPUT'] },
    ],
    collisions: [
      { word: 'PORT', reads: "Harbors" },
      { word: 'PORT', reads: "Fortified wines" },
      { word: 'OVER', reads: "Finished" },
    ],
  },
  {
    num: 105,
    quizId: 'links-10-24-26',
    live: '2026-10-24',
    dateLabel: 'October 24, 2026',
    groups: [
      { name: "___jack", words: ['LUMBER', 'JUMPING', 'CRACKER', 'SKIP'] },
      { name: "Crunchy snacks", words: ['PRETZEL', 'PORK RIND', 'NACHO', 'BREADSTICK'] },
      { name: "Bouncy moves", words: ['HOP', 'BOUND', 'LEAP', 'GAMBOL'] },
      { name: "Move clumsily", words: ['LURCH', 'STAGGER', 'SHAMBLE', 'CLOMP'] },
    ],
    reverseChecked: [
      "___jack -> Bouncy moves",
    ],
    collisions: [
      { word: 'CRACKER', reads: "Crunchy snacks" },
      { word: 'SKIP', reads: "Bouncy moves" },
      { word: 'JUMPING', reads: "Bouncy moves" },
      { word: 'LUMBER', reads: "Move clumsily" },
    ],
  },
  {
    num: 106,
    quizId: 'links-10-25-26',
    live: '2026-10-25',
    dateLabel: 'October 25, 2026',
    sunday: true,
    groups: [
      { name: "Foot___", words: ['NOTE', 'PRINT', 'HILL', 'STOOL'] },
      { name: "Musical notation", words: ['STAFF', 'CLEF', 'FERMATA', 'SLUR'] },
      { name: "Written messages", words: ['MEMO', 'LETTER', 'POSTCARD', 'TELEGRAM'] },
      { name: "Office machine tasks", words: ['SCAN', 'FAX', 'COPY', 'COLLATE'] },
    ],
    collisions: [
      { word: 'NOTE', reads: "Musical notation" },
      { word: 'NOTE', reads: "Written messages" },
      { word: 'PRINT', reads: "Office machine tasks" },
      { word: 'FAX', reads: "Written messages" },
    ],
  },
  {
    num: 107,
    quizId: 'links-10-26-26',
    live: '2026-10-26',
    dateLabel: 'October 26, 2026',
    groups: [
      { name: "___cake", words: ['CUP', 'PAN', 'CHEESE', 'SPONGE'] },
      { name: "Cookware", words: ['SKILLET', 'WOK', 'CASSEROLE', 'STOCKPOT'] },
      { name: "Cleaning supplies", words: ['MOP', 'BROOM', 'BUCKET', 'DUSTPAN'] },
      { name: "Sea creatures", words: ['STARFISH', 'URCHIN', 'ANEMONE', 'SEAHORSE'] },
    ],
    collisions: [
      { word: 'PAN', reads: "Cookware" },
      { word: 'SPONGE', reads: "Cleaning supplies" },
      { word: 'SPONGE', reads: "Sea creatures" },
    ],
  },
  {
    num: 108,
    quizId: 'links-10-27-26',
    live: '2026-10-27',
    dateLabel: 'October 27, 2026',
    groups: [
      { name: "Anagrams of colors", words: ['LATE', 'SORE', 'CHEAP', 'CAROL'] },
      { name: "Kinds of song", words: ['BALLAD', 'LULLABY', 'ANTHEM', 'SHANTY'] },
      { name: "Low-cost", words: ['BUDGET', 'BARGAIN', 'AFFORDABLE', 'DISCOUNT'] },
      { name: "Behind schedule", words: ['TARDY', 'OVERDUE', 'DELAYED', 'BELATED'] },
    ],
    collisions: [
      { word: 'CAROL', reads: "Kinds of song" },
      { word: 'CHEAP', reads: "Low-cost" },
      { word: 'LATE', reads: "Behind schedule" },
    ],
  },
  {
    num: 109,
    quizId: 'links-10-28-26',
    live: '2026-10-28',
    dateLabel: 'October 28, 2026',
    groups: [
      { name: "Things with a trunk", words: ['ELEPHANT', 'REDWOOD', 'MAMMOTH', 'BAOBAB'] },
      { name: "Extinct animals", words: ['DODO', 'SABERTOOTH', 'TRILOBITE', 'PTERODACTYL'] },
      { name: "Enormous", words: ['GIGANTIC', 'COLOSSAL', 'TITANIC', 'IMMENSE'] },
      { name: "Circus words", words: ['RINGMASTER', 'BIG TOP', 'ACROBAT', 'CALLIOPE'] },
    ],
    collisions: [
      { word: 'MAMMOTH', reads: "Extinct animals" },
      { word: 'MAMMOTH', reads: "Enormous" },
      { word: 'ELEPHANT', reads: "Circus words" },
    ],
  },
  {
    num: 110,
    quizId: 'links-10-29-26',
    live: '2026-10-29',
    dateLabel: 'October 29, 2026',
    groups: [
      { name: "Hides a fruit", words: ['SPEAR', 'SLIME', 'FIGURE', 'PLUMBER'] },
      { name: "Tradespeople", words: ['ELECTRICIAN', 'CARPENTER', 'MASON', 'WELDER'] },
      { name: "Goo", words: ['OOZE', 'SLUDGE', 'GUNK', 'MUCK'] },
      { name: "Body shape", words: ['PHYSIQUE', 'BUILD', 'FRAME', 'SILHOUETTE'] },
    ],
    collisions: [
      { word: 'PLUMBER', reads: "Tradespeople" },
      { word: 'SLIME', reads: "Goo" },
      { word: 'FIGURE', reads: "Body shape" },
    ],
  },
  {
    num: 111,
    quizId: 'links-10-30-26',
    live: '2026-10-30',
    dateLabel: 'October 30, 2026',
    groups: [
      { name: "___flower", words: ['CAULI', 'MAY', 'CORN', 'WILD'] },
      { name: "Grains", words: ['BARLEY', 'OATS', 'MILLET', 'SORGHUM'] },
      { name: "Months", words: ['JUNE', 'APRIL', 'AUGUST', 'MARCH'] },
      { name: "Untamed", words: ['FERAL', 'SAVAGE', 'UNRULY', 'RAMPANT'] },
    ],
    collisions: [
      { word: 'CORN', reads: "Grains" },
      { word: 'MAY', reads: "Months" },
      { word: 'WILD', reads: "Untamed" },
    ],
  },
  {
    num: 112,
    quizId: 'links-10-31-26',
    live: '2026-10-31',
    dateLabel: 'October 31, 2026',
    groups: [
      { name: "Silent W", words: ['WRECK', 'ANSWER', 'WREATH', 'TWO'] },
      { name: "Holiday decorations", words: ['GARLAND', 'TINSEL', 'ORNAMENT', 'MISTLETOE'] },
      { name: "Reply", words: ['RETORT', 'RESPONSE', 'REJOINDER', 'COMEBACK'] },
      { name: "Ruin", words: ['DEMOLISH', 'TOTAL', 'TRASH', 'RAZE'] },
    ],
    collisions: [
      { word: 'WREATH', reads: "Holiday decorations" },
      { word: 'ANSWER', reads: "Reply" },
      { word: 'WRECK', reads: "Ruin" },
    ],
  },
  {
    num: 113,
    quizId: 'links-11-1-26',
    live: '2026-11-01',
    dateLabel: 'November 1, 2026',
    sunday: true,
    groups: [
      { name: "Birds of prey", words: ['HAWK', 'FALCON', 'OSPREY', 'KESTREL'] },
      { name: "Backyard birds", words: ['ROBIN', 'SPARROW', 'CARDINAL', 'BLUEJAY'] },
      { name: "Sell", words: ['VEND', 'TOUT', 'PEDDLE', 'MARKET'] },
      { name: "Catholic clergy", words: ['PRIEST', 'POPE', 'MONSIGNOR', 'ABBOT'] },
    ],
    reverseChecked: [
      "Birds of prey -> Backyard birds",
    ],
    collisions: [
      { word: 'HAWK', reads: "Backyard birds" },
      { word: 'FALCON', reads: "Backyard birds" },
      { word: 'OSPREY', reads: "Backyard birds" },
      { word: 'KESTREL', reads: "Backyard birds" },
      { word: 'HAWK', reads: "Sell" },
      { word: 'CARDINAL', reads: "Catholic clergy" },
    ],
  },
  {
    num: 114,
    quizId: 'links-11-2-26',
    live: '2026-11-02',
    dateLabel: 'November 2, 2026',
    groups: [
      { name: "Pencil case items", words: ['ERASER', 'SHARPENER', 'RULER', 'CRAYON'] },
      { name: "Monarchs", words: ['EMPEROR', 'CZAR', 'SULTAN', 'KAISER'] },
      { name: "Farm animals", words: ['COW', 'PIG', 'GOAT', 'DONKEY'] },
      { name: "Fools", words: ['DOLT', 'DUNCE', 'NITWIT', 'DOOFUS'] },
    ],
    collisions: [
      { word: 'RULER', reads: "Monarchs" },
      { word: 'DONKEY', reads: "Fools" },
    ],
  },
  {
    num: 115,
    quizId: 'links-11-3-26',
    live: '2026-11-03',
    dateLabel: 'November 3, 2026',
    groups: [
      { name: "Sounds like a tree", words: ['FUR', 'BEACH', 'YOU', 'PLAIN'] },
      { name: "Coat materials", words: ['WOOL', 'FLEECE', 'LEATHER', 'SUEDE'] },
      { name: "Coast features", words: ['COVE', 'CLIFF', 'LAGOON', 'HEADLAND'] },
      { name: "Unadorned", words: ['BASIC', 'SIMPLE', 'STARK', 'SPARTAN'] },
    ],
    collisions: [
      { word: 'FUR', reads: "Coat materials" },
      { word: 'BEACH', reads: "Coast features" },
      { word: 'PLAIN', reads: "Unadorned" },
    ],
  },
  {
    num: 116,
    quizId: 'links-11-4-26',
    live: '2026-11-04',
    dateLabel: 'November 4, 2026',
    groups: [
      { name: "Rain___", words: ['FALL', 'COAT', 'CHECK', 'MAKER'] },
      { name: "Tumble", words: ['TOPPLE', 'PLUNGE', 'SPRAWL', 'KEEL OVER'] },
      { name: "Wood finishes", words: ['VARNISH', 'LACQUER', 'SHELLAC', 'STAIN'] },
      { name: "Payment paperwork", words: ['BILL', 'INVOICE', 'RECEIPT', 'STATEMENT'] },
    ],
    collisions: [
      { word: 'FALL', reads: "Tumble" },
      { word: 'COAT', reads: "Wood finishes" },
      { word: 'CHECK', reads: "Payment paperwork" },
    ],
  },
  {
    num: 117,
    quizId: 'links-11-5-26',
    live: '2026-11-05',
    dateLabel: 'November 5, 2026',
    groups: [
      { name: "Anagrams of numbers", words: ['EON', 'TOW', 'ETHER', 'EVENS'] },
      { name: "Long spans of time", words: ['EPOCH', 'MILLENNIUM', 'CENTURY', 'GENERATION'] },
      { name: "Pull", words: ['HAUL', 'LUG', 'TUG', 'HEAVE'] },
      { name: "Anesthetics", words: ['CHLOROFORM', 'LIDOCAINE', 'PROPOFOL', 'EPIDURAL'] },
    ],
    collisions: [
      { word: 'EON', reads: "Long spans of time" },
      { word: 'TOW', reads: "Pull" },
      { word: 'ETHER', reads: "Anesthetics" },
    ],
  },
  {
    num: 118,
    quizId: 'links-11-6-26',
    live: '2026-11-06',
    dateLabel: 'November 6, 2026',
    groups: [
      { name: "Hides a vehicle", words: ['SCARF', 'ABUSE', 'CABIN', 'SAVANNA'] },
      { name: "Winter wear", words: ['MITTENS', 'EARMUFFS', 'BEANIE', 'GALOSHES'] },
      { name: "Rustic dwellings", words: ['COTTAGE', 'CHALET', 'BUNGALOW', 'LODGE'] },
      { name: "Grasslands", words: ['PRAIRIE', 'STEPPE', 'PAMPAS', 'MEADOW'] },
    ],
    collisions: [
      { word: 'SCARF', reads: "Winter wear" },
      { word: 'CABIN', reads: "Rustic dwellings" },
      { word: 'SAVANNA', reads: "Grasslands" },
    ],
  },
  {
    num: 119,
    quizId: 'links-11-7-26',
    live: '2026-11-07',
    dateLabel: 'November 7, 2026',
    groups: [
      { name: "___bone", words: ['WISH', 'BACK', 'JAW', 'CHEEK'] },
      { name: "Desire", words: ['LONGING', 'HANKERING', 'URGE', 'ITCH'] },
      { name: "Insolence", words: ['LIP', 'SASS', 'SNARK', 'IMPUDENCE'] },
      { name: "Chatter", words: ['GAB', 'YAK', 'BLAB', 'PRATTLE'] },
    ],
    collisions: [
      { word: 'WISH', reads: "Desire" },
      { word: 'CHEEK', reads: "Insolence" },
      { word: 'JAW', reads: "Chatter" },
    ],
  },
  {
    num: 120,
    quizId: 'links-11-8-26',
    live: '2026-11-08',
    dateLabel: 'November 8, 2026',
    sunday: true,
    groups: [
      { name: "Brass instruments", words: ['TUBA', 'TROMBONE', 'BUGLE', 'CORNET'] },
      { name: "Instruments", words: ['VIOLA', 'CELLO', 'HARP', 'TIMPANI'] },
      { name: "Pester", words: ['NAG', 'HOUND', 'HECTOR', 'NEEDLE'] },
      { name: "___fly", words: ['BUTTER', 'HORSE', 'DAMSEL', 'HOUSE'] },
    ],
    reverseChecked: [
      "Brass instruments -> Instruments",
    ],
    collisions: [
      { word: 'TUBA', reads: "Instruments" },
      { word: 'TROMBONE', reads: "Instruments" },
      { word: 'BUGLE', reads: "Instruments" },
      { word: 'CORNET', reads: "Instruments" },
      { word: 'HARP', reads: "Pester" },
    ],
  },
  {
    num: 121,
    quizId: 'links-11-9-26',
    live: '2026-11-09',
    dateLabel: 'November 9, 2026',
    groups: [
      { name: "Birthday party", words: ['BALLOON', 'PRESENTS', 'CANDLES', 'CONFETTI'] },
      { name: "Things that pop", words: ['POPCORN', 'BUBBLE WRAP', 'KNUCKLES', 'WEASEL'] },
      { name: "Small pets", words: ['HAMSTER', 'GUINEA PIG', 'FERRET', 'PARAKEET'] },
      { name: "Salad greens", words: ['LETTUCE', 'ARUGULA', 'SPINACH', 'ENDIVE'] },
    ],
    collisions: [
      { word: 'BALLOON', reads: "Things that pop" },
      { word: 'WEASEL', reads: "Small pets" },
    ],
  },
  {
    num: 122,
    quizId: 'links-11-10-26',
    live: '2026-11-10',
    dateLabel: 'November 10, 2026',
    groups: [
      { name: "___worm", words: ['EAR', 'SILK', 'INCH', 'GLOW'] },
      { name: "Bedsheet fabrics", words: ['PERCALE', 'FLANNEL', 'SATEEN', 'JERSEY'] },
      { name: "Move slowly", words: ['CRAWL', 'SIDLE', 'SHUFFLE', 'EDGE'] },
      { name: "Shine", words: ['GLEAM', 'SHIMMER', 'TWINKLE', 'GLINT'] },
    ],
    collisions: [
      { word: 'SILK', reads: "Bedsheet fabrics" },
      { word: 'INCH', reads: "Move slowly" },
      { word: 'GLOW', reads: "Shine" },
    ],
  },
  {
    num: 123,
    quizId: 'links-11-11-26',
    live: '2026-11-11',
    dateLabel: 'November 11, 2026',
    groups: [
      { name: "Things with scales", words: ['MAP', 'THERMOMETER', 'DRAGON', 'BATHROOM'] },
      { name: "Mythical beasts", words: ['GRIFFIN', 'CENTAUR', 'PHOENIX', 'MINOTAUR'] },
      { name: "Plan out", words: ['OUTLINE', 'DRAFT', 'SCHEME', 'ARRANGE'] },
      { name: "Medicine cabinet", words: ['BANDAGE', 'ASPIRIN', 'GAUZE', 'OINTMENT'] },
    ],
    collisions: [
      { word: 'MAP', reads: "Plan out" },
      { word: 'THERMOMETER', reads: "Medicine cabinet" },
      { word: 'DRAGON', reads: "Mythical beasts" },
    ],
  },
  {
    num: 124,
    quizId: 'links-11-12-26',
    live: '2026-11-12',
    dateLabel: 'November 12, 2026',
    groups: [
      { name: "Silent L", words: ['YOLK', 'PALM', 'HALF', 'CHALK'] },
      { name: "Egg parts", words: ['SHELL', 'ALBUMEN', 'MEMBRANE', 'WHITE'] },
      { name: "Tropical trees", words: ['BANYAN', 'MANGROVE', 'TEAK', 'EBONY'] },
      { name: "Fractions", words: ['THIRD', 'QUARTER', 'EIGHTH', 'TENTH'] },
    ],
    collisions: [
      { word: 'YOLK', reads: "Egg parts" },
      { word: 'PALM', reads: "Tropical trees" },
      { word: 'HALF', reads: "Fractions" },
    ],
  },
  {
    num: 125,
    quizId: 'links-11-13-26',
    live: '2026-11-13',
    dateLabel: 'November 13, 2026',
    groups: [
      { name: "___cream", words: ['SOUR', 'SHAVING', 'WHIPPED', 'NIGHT'] },
      { name: "Tastes", words: ['SALTY', 'UMAMI', 'SAVORY', 'TART'] },
      { name: "Beaten badly", words: ['TROUNCED', 'THRASHED', 'ROUTED', 'CLOBBERED'] },
      { name: "Times of day", words: ['DAWN', 'DUSK', 'NOON', 'MIDNIGHT'] },
    ],
    collisions: [
      { word: 'SOUR', reads: "Tastes" },
      { word: 'WHIPPED', reads: "Beaten badly" },
      { word: 'NIGHT', reads: "Times of day" },
    ],
  },
  {
    num: 126,
    quizId: 'links-11-14-26',
    live: '2026-11-14',
    dateLabel: 'November 14, 2026',
    groups: [
      { name: "Anagrams of birds", words: ['LOW', 'GREET', 'PINES', 'RAPTOR'] },
      { name: "Longs for", words: ['YEARNS', 'ACHES', 'HUNGERS', 'THIRSTS'] },
      { name: "Say hello", words: ['WELCOME', 'WAVE', 'HUG', 'HIGH FIVE'] },
      { name: "Dinosaurs", words: ['STEGOSAURUS', 'TRICERATOPS', 'BRONTOSAURUS', 'ANKYLOSAURUS'] },
    ],
    collisions: [
      { word: 'PINES', reads: "Longs for" },
      { word: 'GREET', reads: "Say hello" },
      { word: 'RAPTOR', reads: "Dinosaurs" },
    ],
  },
  {
    num: 127,
    quizId: 'links-11-15-26',
    live: '2026-11-15',
    dateLabel: 'November 15, 2026',
    sunday: true,
    groups: [
      { name: "Shades of purple", words: ['LILAC', 'ORCHID', 'HEATHER', 'PERIWINKLE'] },
      { name: "Bouquet flowers", words: ['CARNATION', 'GARDENIA', 'LILY', 'FREESIA'] },
      { name: "___pad", words: ['LAUNCH', 'SCRATCH', 'KNEE', 'MOUSE'] },
      { name: "Computer gear", words: ['MONITOR', 'KEYBOARD', 'WEBCAM', 'ROUTER'] },
    ],
    reverseChecked: [
      "Shades of purple -> Bouquet flowers",
    ],
    collisions: [
      { word: 'LILAC', reads: "Bouquet flowers" },
      { word: 'ORCHID', reads: "Bouquet flowers" },
      { word: 'HEATHER', reads: "Bouquet flowers" },
      { word: 'PERIWINKLE', reads: "Bouquet flowers" },
      { word: 'LILY', reads: "___pad" },
      { word: 'MOUSE', reads: "Computer gear" },
    ],
  },
  {
    num: 128,
    quizId: 'links-11-16-26',
    live: '2026-11-16',
    dateLabel: 'November 16, 2026',
    groups: [
      { name: "Blackjack terms", words: ['HIT', 'STAND', 'SPLIT', 'BUST'] },
      { name: "Police operations", words: ['RAID', 'STING', 'SWEEP', 'STAKEOUT'] },
      { name: "Gymnastics moves", words: ['CARTWHEEL', 'BACKFLIP', 'ROUNDOFF', 'HANDSPRING'] },
      { name: "Flops", words: ['FIASCO', 'DUD', 'WASHOUT', 'BOMB'] },
    ],
    collisions: [
      { word: 'BUST', reads: "Police operations" },
      { word: 'BUST', reads: "Flops" },
      { word: 'SPLIT', reads: "Gymnastics moves" },
    ],
  },
  {
    num: 129,
    quizId: 'links-11-17-26',
    live: '2026-11-17',
    dateLabel: 'November 17, 2026',
    groups: [
      { name: "___bag", words: ['BEAN', 'AIR', 'WIND', 'TEA'] },
      { name: "Legumes", words: ['LENTIL', 'CHICKPEA', 'PEANUT', 'EDAMAME'] },
      { name: "Tunes", words: ['MELODY', 'DITTY', 'JINGLE', 'REFRAIN'] },
      { name: "Brewed drinks", words: ['COFFEE', 'KOMBUCHA', 'ALE', 'MEAD'] },
    ],
    collisions: [
      { word: 'BEAN', reads: "Legumes" },
      { word: 'AIR', reads: "Tunes" },
      { word: 'TEA', reads: "Brewed drinks" },
    ],
  },
  {
    num: 130,
    quizId: 'links-11-18-26',
    live: '2026-11-18',
    dateLabel: 'November 18, 2026',
    groups: [
      { name: "Sounds like an animal", words: ['DEAR', 'HOARSE', 'BARE', 'MOUSSE'] },
      { name: "Endearments", words: ['DARLING', 'SWEETIE', 'SUGAR', 'BABE'] },
      { name: "Rough-voiced", words: ['GRAVELLY', 'RASPY', 'CROAKY', 'GRUFF'] },
      { name: "Hair products", words: ['GEL', 'POMADE', 'HAIRSPRAY', 'SERUM'] },
    ],
    collisions: [
      { word: 'DEAR', reads: "Endearments" },
      { word: 'HOARSE', reads: "Rough-voiced" },
      { word: 'MOUSSE', reads: "Hair products" },
    ],
  },
  {
    num: 131,
    quizId: 'links-11-19-26',
    live: '2026-11-19',
    dateLabel: 'November 19, 2026',
    groups: [
      { name: "Hides an instrument", words: ['CONUNDRUM', 'SHARPEN', 'REBELLION', 'ORGANIC'] },
      { name: "Head-scratchers", words: ['RIDDLE', 'ENIGMA', 'PUZZLER', 'BRAINTEASER'] },
      { name: "Health-food labels", words: ['NATURAL', 'GLUTEN-FREE', 'VEGAN', 'NON-GMO'] },
      { name: "Put an edge on", words: ['WHET', 'HONE', 'GRIND', 'STROP'] },
    ],
    collisions: [
      { word: 'CONUNDRUM', reads: "Head-scratchers" },
      { word: 'ORGANIC', reads: "Health-food labels" },
      { word: 'SHARPEN', reads: "Put an edge on" },
    ],
  },
  {
    num: 132,
    quizId: 'links-11-20-26',
    live: '2026-11-20',
    dateLabel: 'November 20, 2026',
    groups: [
      { name: "Butter___", words: ['MILK', 'NUT', 'FINGERS', 'FAT'] },
      { name: "Take advantage of", words: ['EXPLOIT', 'SWINDLE', 'GOUGE', 'BILK'] },
      { name: "Enthusiasts", words: ['BUFF', 'FIEND', 'JUNKIE', 'AFICIONADO'] },
      { name: "Plump", words: ['CHUBBY', 'STOUT', 'PORTLY', 'ROTUND'] },
    ],
    collisions: [
      { word: 'MILK', reads: "Take advantage of" },
      { word: 'NUT', reads: "Enthusiasts" },
      { word: 'FAT', reads: "Plump" },
    ],
  },
  {
    num: 133,
    quizId: 'links-11-21-26',
    live: '2026-11-21',
    dateLabel: 'November 21, 2026',
    groups: [
      { name: "Things with chips", words: ['COOKIE', 'CASINO', 'CIRCUIT', 'CREDIT CARD'] },
      { name: "Browser data", words: ['CACHE', 'BOOKMARK', 'HISTORY', 'PASSWORD'] },
      { name: "Gambling venues", words: ['RACETRACK', 'BINGO HALL', 'SPORTSBOOK', 'CARD ROOM'] },
      { name: "Loops", words: ['LAP', 'ORBIT', 'ROUND', 'REVOLUTION'] },
    ],
    collisions: [
      { word: 'COOKIE', reads: "Browser data" },
      { word: 'CASINO', reads: "Gambling venues" },
      { word: 'CIRCUIT', reads: "Loops" },
    ],
  },
  {
    num: 134,
    quizId: 'links-11-22-26',
    live: '2026-11-22',
    dateLabel: 'November 22, 2026',
    sunday: true,
    groups: [
      { name: "Dog commands", words: ['SIT', 'STAY', 'BEG', 'DOWN'] },
      { name: "Remain", words: ['LINGER', 'TARRY', 'ABIDE', 'DWELL'] },
      { name: "Sad", words: ['GLUM', 'MOROSE', 'DEJECTED', 'BLUE'] },
      { name: "Pillow stuffings", words: ['FEATHERS', 'KAPOK', 'POLYESTER', 'BUCKWHEAT'] },
    ],
    reverseChecked: [
      "Dog commands -> Remain",
    ],
    collisions: [
      { word: 'STAY', reads: "Remain" },
      { word: 'SIT', reads: "Remain" },
      { word: 'DOWN', reads: "Sad" },
      { word: 'DOWN', reads: "Pillow stuffings" },
    ],
  },
  {
    num: 135,
    quizId: 'links-11-23-26',
    live: '2026-11-23',
    dateLabel: 'November 23, 2026',
    groups: [
      { name: "On the farm", words: ['BARN', 'SILO', 'TRACTOR', 'HAYLOFT'] },
      { name: "Wizard of Oz characters", words: ['SCARECROW', 'TIN MAN', 'DOROTHY', 'TOTO'] },
      { name: "Yellow things", words: ['BANANA', 'CANARY', 'TAXI', 'BUMBLEBEE'] },
      { name: "Small dogs", words: ['CHIHUAHUA', 'POMERANIAN', 'DACHSHUND', 'SHIH TZU'] },
    ],
    collisions: [
      { word: 'SCARECROW', reads: "On the farm" },
      { word: 'TOTO', reads: "Small dogs" },
    ],
  },
  {
    num: 136,
    quizId: 'links-11-24-26',
    live: '2026-11-24',
    dateLabel: 'November 24, 2026',
    groups: [
      { name: "___chair", words: ['ARM', 'WHEEL', 'CLUB', 'EASY'] },
      { name: "A piece of cake", words: ['BREEZY', 'PAINLESS', 'EFFORTLESS', 'CINCH'] },
      { name: "Hit hard", words: ['SOCK', 'WALLOP', 'BELT', 'THUMP'] },
      { name: "Car parts", words: ['AXLE', 'BUMPER', 'FENDER', 'MUFFLER'] },
    ],
    collisions: [
      { word: 'EASY', reads: "A piece of cake" },
      { word: 'CLUB', reads: "Hit hard" },
      { word: 'WHEEL', reads: "Car parts" },
      { word: 'BELT', reads: "Car parts" },
    ],
  },
  {
    num: 137,
    quizId: 'links-11-25-26',
    live: '2026-11-25',
    dateLabel: 'November 25, 2026',
    groups: [
      { name: "Hides a tool", words: ['SHOE', 'BRAKES', 'SHAWL', 'ADVISE'] },
      { name: "Footwear", words: ['LOAFER', 'CLOG', 'MOCCASIN', 'SLIPPER'] },
      { name: "Offer guidance", words: ['COUNSEL', 'GUIDE', 'COACH', 'MENTOR'] },
      { name: "Wraps", words: ['PONCHO', 'STOLE', 'CAPE', 'SARONG'] },
    ],
    collisions: [
      { word: 'SHOE', reads: "Footwear" },
      { word: 'ADVISE', reads: "Offer guidance" },
      { word: 'SHAWL', reads: "Wraps" },
    ],
  },
  {
    num: 138,
    quizId: 'links-11-26-26',
    live: '2026-11-26',
    dateLabel: 'November 26, 2026',
    groups: [
      { name: "Anagrams of capitals", words: ['MORE', 'PAIRS', 'MAIL', 'UNITS'] },
      { name: "Post", words: ['PARCEL', 'PACKAGE', 'ENVELOPE', 'STAMP'] },
      { name: "Twosomes", words: ['DUOS', 'COUPLES', 'TWINS', 'DOUBLES'] },
      { name: "Extra", words: ['ADDITIONAL', 'SURPLUS', 'SUPPLEMENTARY', 'FURTHER'] },
    ],
    collisions: [
      { word: 'MAIL', reads: "Post" },
      { word: 'PAIRS', reads: "Twosomes" },
      { word: 'MORE', reads: "Extra" },
    ],
  },
  {
    num: 139,
    quizId: 'links-11-27-26',
    live: '2026-11-27',
    dateLabel: 'November 27, 2026',
    groups: [
      { name: "___print", words: ['FINE', 'THUMB', 'PAW', 'SMALL'] },
      { name: "Penalties", words: ['FORFEIT', 'SANCTION', 'SUSPENSION', 'EJECTION'] },
      { name: "Minor", words: ['PETTY', 'TRIVIAL', 'SLIGHT', 'NEGLIGIBLE'] },
      { name: "Fingers", words: ['PINKIE', 'INDEX', 'RING', 'MIDDLE'] },
    ],
    collisions: [
      { word: 'FINE', reads: "Penalties" },
      { word: 'SMALL', reads: "Minor" },
      { word: 'THUMB', reads: "Fingers" },
    ],
  },
  {
    num: 140,
    quizId: 'links-11-28-26',
    live: '2026-11-28',
    dateLabel: 'November 28, 2026',
    groups: [
      { name: "Things with teeth", words: ['ZIPPER', 'GEAR', 'SAW', 'PIRANHA'] },
      { name: "Sayings", words: ['ADAGE', 'MAXIM', 'APHORISM', 'MOTTO'] },
      { name: "Equipment", words: ['TACKLE', 'PARAPHERNALIA', 'APPARATUS', 'RIGGING'] },
      { name: "Fasteners", words: ['BUTTON', 'SNAP', 'BUCKLE', 'TOGGLE'] },
    ],
    collisions: [
      { word: 'SAW', reads: "Sayings" },
      { word: 'GEAR', reads: "Equipment" },
      { word: 'ZIPPER', reads: "Fasteners" },
    ],
  },
  {
    num: 141,
    quizId: 'links-11-29-26',
    live: '2026-11-29',
    dateLabel: 'November 29, 2026',
    sunday: true,
    groups: [
      { name: "On the Thanksgiving table", words: ['STUFFING', 'CRANBERRY', 'GRAVY', 'YAM'] },
      { name: "Nice extras", words: ['BONUS', 'PERK', 'BENEFIT', 'WINDFALL'] },
      { name: "Sauces", words: ['PESTO', 'AIOLI', 'MARINARA', 'HOLLANDAISE'] },
      { name: "Root vegetables", words: ['BEET', 'RADISH', 'JICAMA', 'DAIKON'] },
    ],
    reverseChecked: [
      "On the Thanksgiving table -> Sauces",
    ],
    collisions: [
      { word: 'GRAVY', reads: "Nice extras" },
      { word: 'GRAVY', reads: "Sauces" },
      { word: 'CRANBERRY', reads: "Sauces" },
      { word: 'YAM', reads: "Root vegetables" },
    ],
  },
  {
    num: 142,
    quizId: 'links-11-30-26',
    live: '2026-11-30',
    dateLabel: 'November 30, 2026',
    groups: [
      { name: "Winter Olympic sports", words: ['BIATHLON', 'LUGE', 'CURLING', 'BOBSLED'] },
      { name: "Hair tools", words: ['HAIR DRYER', 'STRAIGHTENER', 'DIFFUSER', 'ROLLER'] },
      { name: "Snowman parts", words: ['CARROT', 'COAL', 'PIPE', 'TOP HAT'] },
      { name: "In a Christmas stocking", words: ['CANDY CANE', 'GIFT CARD', 'LIP BALM', 'KEYCHAIN'] },
    ],
    collisions: [
      { word: 'CURLING', reads: "Hair tools" },
      { word: 'COAL', reads: "In a Christmas stocking" },
    ],
  },
];
