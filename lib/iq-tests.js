// The /iq tests: one adaptive trivia test per category, built from questions
// that have ALREADY been played on the daily gauntlets.
//
// WHY ONLY PLAYED QUESTIONS. A test can only say where a person stands if it
// knows how hard each question is, and the only honest measure of that is how
// real players did on it. Streak, Deep, Atlas, Sport and Biz are one life in a
// fixed order, so a day's score distribution tells us exactly who reached each
// question and who got past it. scripts/iq/calibrate.mjs turns that into a
// difficulty per question (lib/iq-items.js). A question from a day that has not
// run yet has no data AND would spoil a daily, so it is never in a test.
//
// WHAT THE NUMBER MEANS. The scale is PLAYER-NORMED: 100 is the typical Mind
// Loft player of the games the questions came from, and 15 points is one
// standard deviation of that field. It is IQ-shaped so it reads at a glance,
// and every surface that prints it says it is measured against Mind Loft
// players, not a clinical IQ.
//
// A TEST IS A LIST OF SOURCES. Each source is a gauntlet game plus the lanes
// (Streak's `cat`, the others' `cat`) or, for Deep, the day TOPICS that belong
// to the category. `all: true` takes every question in the game.

export const IQ_TESTS = [
  {
    slug: 'general',
    name: 'General Knowledge',
    short: 'General',
    ramp: 4,
    blurb: 'A little of everything: history, science, screen, music, sport, words and the grab bag.',
    sources: [
      { game: 'streak', all: true },
      { game: 'deep', topics: ['Chess', 'Painting', 'Architecture'] },
    ],
  },
  {
    slug: 'geography',
    name: 'Geography',
    short: 'Geography',
    ramp: 5,
    blurb: 'Capitals, flags, borders, landmarks and the shape of the planet.',
    sources: [
      { game: 'atlas', all: true },
      { game: 'streak', cats: ['Geography'] },
      { game: 'deep', topics: ['Antarctica', 'Rivers', 'Japan', 'Mountains', 'Africa', 'Australia', 'India', 'Canada', 'Islands', 'Deserts', 'Capital Cities'] },
    ],
  },
  {
    slug: 'history',
    name: 'History',
    short: 'History',
    ramp: 0,
    blurb: 'Empires, wars, revolutions and the people who ran them.',
    sources: [
      { game: 'streak', cats: ['History'] },
      { game: 'deep', topics: ['Ancient Rome', 'Ancient Egypt', 'World War II', 'The American Presidency', 'The Cold War', 'The Renaissance', 'The Vikings', 'The American Civil War', 'The French Revolution', 'Ancient Greece', 'World War I', 'The Middle Ages', 'The Age of Exploration', 'The Industrial Revolution', 'The British Monarchy', 'The Civil Rights Movement', 'Napoleon', 'Ancient China', 'The Ottoman Empire'] },
    ],
  },
  {
    slug: 'science',
    name: 'Science and Nature',
    short: 'Science',
    ramp: 1,
    blurb: 'Physics, chemistry, the body, space and the living world.',
    sources: [
      { game: 'streak', cats: ['Science'] },
      { game: 'deep', topics: ['The Solar System', 'The Human Body', 'Dinosaurs', 'Volcanoes', 'Birds', 'The Periodic Table', 'The Ocean', 'Space Exploration', 'Weather', 'Sharks', 'Insects', 'Big Cats', 'Trees', 'Genetics', 'Physics', 'Evolution', 'The Brain', 'Whales and Dolphins', 'Reptiles', 'Earthquakes', 'Rainforests', 'Fungi', 'Infectious Disease', 'Light and Color', 'Stars and Galaxies'] },
    ],
  },
  {
    slug: 'screen',
    name: 'Movies and TV',
    short: 'Movies & TV',
    ramp: 7,
    blurb: 'Films, shows, stars and the people behind the camera.',
    sources: [
      { game: 'streak', cats: ['Movies & TV'] },
      { game: 'deep', topics: ['The Movies', 'Television'] },
    ],
  },
  {
    slug: 'music',
    name: 'Music',
    short: 'Music',
    ramp: 6,
    blurb: 'Composers, bands, songs and the stage.',
    sources: [
      { game: 'streak', cats: ['Music'] },
      { game: 'deep', topics: ['Classical Music', 'Jazz', 'Rock and Roll', 'The Beatles', 'Broadway Musicals'] },
    ],
  },
  {
    slug: 'literature',
    name: 'Words and Books',
    short: 'Words & Books',
    ramp: 9,
    blurb: 'Authors, novels, poetry, myth and the language itself.',
    sources: [
      { game: 'streak', cats: ['Words & Books'] },
      { game: 'deep', topics: ['Shakespeare', 'Greek Mythology', 'Classic Novels', 'Poetry', 'Detective Fiction', 'Science Fiction'] },
    ],
  },
  {
    slug: 'sports',
    name: 'Sports',
    short: 'Sports',
    ramp: 3,
    blurb: 'The NFL, NBA, MLB, soccer and everything else with a scoreboard.',
    sources: [
      { game: 'sport', all: true },
      { game: 'streak', cats: ['Sports'] },
      { game: 'deep', topics: ['The Olympics', 'Baseball', 'The World Cup', 'Basketball', 'American Football', 'Tennis', 'Golf', 'Boxing'] },
    ],
  },
  {
    slug: 'business',
    name: 'Business',
    short: 'Business',
    ramp: 2,
    blurb: 'Brands, markets, founders, deals and business history.',
    sources: [
      { game: 'biz', all: true },
      { game: 'deep', topics: ['Coffee'] },
    ],
  },
];

export const IQ_TEST_MAP = Object.fromEntries(IQ_TESTS.map((t) => [t.slug, t]));

// Test length: the adaptive run asks MIN_ITEMS, then keeps going only while the
// estimate is still loose, and never runs past MAX_ITEMS. Same shape as the reference test the
// owner pointed at (25 and up to 5 more).
export const MIN_ITEMS = 25;
export const MAX_ITEMS = 30;
export const TARGET_SE = 0.42;   // past MIN_ITEMS, stop as soon as the posterior SD is under this
export const SECONDS_PER_ITEM = 20; // the gauntlets' own clock, which is the clock the difficulties were measured under
