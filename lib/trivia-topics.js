// THE TRIVIA PORTAL'S TOPICS (owner, 2026-11-21: "we want to make the site the
// top spot for multiple choice trivia. we have an enormous bank ... maybe users
// can play old questions by topic in same format", built from the "Trivia Portal
// Mockup" canvas with "same SEO" as the jigsaw portal).
//
// Eleven topics over the sixteen trivia banks (the five English banks left for
// the English Database on 2026-11-21, lib/qdb.js). A topic's LANES are the
// banks' own categories (the `cat` on each question), mapped where a bank's
// words differ; Deep Cuts from each day's topic. No question data here, so it
// is safe in a client bundle; lib/qdb-library.js (server only) reads the banks.

export const TRIVIA_TOPICS = [
  { slug: 'general-knowledge', label: 'General Knowledge', icon: 'brain', color: '#4cb8ee', banks: ['streak'],
    h1: 'General Knowledge Trivia Questions', title: 'General Knowledge Trivia Questions and Answers, Free Quiz | Mind Loft',
    blurb: 'Free general knowledge trivia: thousands of multiple choice questions on geography, science, history, sports, music, movies and words, from easy to expert.' },
  { slug: 'geography', label: 'Geography', icon: 'globe', color: '#5eead4', banks: ['atlas'],
    h1: 'Geography Trivia Questions', title: 'Geography Trivia Questions and Answers: Capitals, Flags, Places | Mind Loft',
    blurb: 'Free geography trivia: capitals, flags and borders, countries and peoples, landmarks and the physical world, in multiple choice questions from easy to expert.' },
  { slug: 'sports', label: 'Sports', icon: 'ball', color: '#55e195', banks: ['sport'],
    h1: 'Sports Trivia Questions', title: 'Sports Trivia Questions and Answers: NFL, NBA, MLB, Soccer | Mind Loft',
    blurb: 'Free sports trivia: NFL, NBA, MLB, soccer and the rest of the sporting world, in multiple choice questions from easy to expert.' },
  { slug: 'business', label: 'Business', icon: 'chart', color: '#93e44e', banks: ['biz'],
    h1: 'Business Trivia Questions', title: 'Business Trivia Questions and Answers: Brands, Markets, Founders | Mind Loft',
    blurb: 'Free business trivia: brands and products, markets and money, founders and bosses, famous deals and disasters, and business history.' },
  { slug: 'movies-and-tv', label: 'Movies and TV', icon: 'film', color: '#c8b84c', banks: ['script'],
    h1: 'Movie and TV Trivia Questions', title: 'Movie and TV Trivia Questions and Answers, Free Quiz | Mind Loft',
    blurb: 'Free movie and TV trivia: films, television, actors and directors, awards and box office, and behind the scenes, from easy to expert.' },
  { slug: 'famous-quotes', label: 'Famous Quotes', icon: 'quote', color: '#fdba74', banks: ['quotes'],
    h1: 'Famous Quotes Trivia: Who Said It?', title: 'Famous Quotes Quiz: Who Said It? Trivia Questions | Mind Loft',
    blurb: 'Free famous quotes trivia: name who said it, from presidents and wartime leaders to writers, scientists and lines from the screen.' },
  { slug: 'science', label: 'Science', icon: 'flask', color: '#f8834a', banks: ['sci', 'orbit', 'bond', 'gene', 'pulse', 'eureka'],
    h1: 'Science Trivia Questions', title: 'Science Trivia Questions and Answers: Space, Body, Chemistry | Mind Loft',
    blurb: 'Free science trivia: space, life science, the human body, chemistry and physics, and inventions, in multiple choice questions from easy to expert.' },
  { slug: 'history', label: 'History', icon: 'col', color: '#ef7e73', banks: ['history'],
    h1: 'History Trivia Questions', title: 'History Trivia Questions and Answers, Ancient to Modern | Mind Loft',
    blurb: 'Free history trivia: the ancient world, the Middle Ages, empires and revolutions, war and conflict, and the modern era, from easy to expert.' },
  { slug: 'art-music-and-books', label: 'Art, Music, and Books', icon: 'brush', color: '#f76bd4', banks: ['art'],
    h1: 'Art, Music, and Book Trivia Questions', title: 'Art, Music, and Book Trivia Questions and Answers | Mind Loft',
    blurb: 'Free arts trivia: painting, music, books, architecture and design, in multiple choice questions from easy to expert.' },
  { slug: 'food-and-drink', label: 'Food and Drink', icon: 'fork', color: '#b997f4', banks: ['foodie'],
    h1: 'Food and Drink Trivia Questions', title: 'Food Trivia Questions and Answers: Dishes, Drinks, Cooking | Mind Loft',
    blurb: 'Free food trivia: world dishes, ingredients, drinks, kitchen craft and food history, in multiple choice questions from easy to expert.' },
  { slug: 'deep-cuts', label: 'Deep Cuts', icon: 'dive', color: '#8797f4', banks: ['deep'],
    h1: 'Deep Cuts: Single-Topic Trivia Quizzes', title: 'Deep Cuts Trivia: Single-Topic Quizzes, Rome to Volcanoes | Mind Loft',
    blurb: 'Free single-topic trivia quizzes: each one goes deep on one subject, from Ancient Rome and Shakespeare to the solar system.' },
];

export const topicBySlug = (s) => TRIVIA_TOPICS.find((t) => t.slug === s) || null;
// The daily gauntlet each bank plays in, to its topic (for the links on the daily pages).
export const BANK_TOPIC = Object.fromEntries(TRIVIA_TOPICS.flatMap((t) => t.banks.map((b) => [b, t.slug])));

// DEEP SUBJECTS ALSO SIT UNDER THEIR PARENT TOPIC (owner, 2026-11-23: "yes, map deep subjects").
// Deep is one subject a day, and its questions used to be reachable only under
// Deep Cuts: an Ancient Rome day was not in History, a solar system day was in
// neither Science topic. Each Deep subject here is cross-filed into the topic
// named, as a subtopic of its own, so History gains "Ancient Rome" and so on.
// A value may list several topics: the FIRST that exists wins, so a subject
// moves to a new topic (Music, Books, Nature, Technology, Mythology) the day
// that topic joins TRIVIA_TOPICS, with nothing to edit here. A subject left out
// (Chess, Thanksgiving, Christmas Traditions, Magic and Illusion, Calendars and
// Timekeeping) has no honest parent and stays under Deep Cuts alone.
// A NEW DEEP SUBJECT needs a line here; scripts/verify-deep-parents.mjs lists
// any subject in the bank that is neither mapped nor in DEEP_NO_PARENT.
const ART = 'art-music-and-books';
const dp = (slugs, names) => names.map((n) => [n, slugs]);
export const DEEP_PARENT = Object.fromEntries([
  ...dp(['history'], ['Ancient Rome', 'Ancient Egypt', 'World War II', 'The American Presidency', 'The Cold War', 'The Renaissance', 'The Vikings', 'The American Civil War', 'The French Revolution', 'Ancient Greece', 'World War I', 'The Middle Ages', 'The Age of Exploration', 'The Industrial Revolution', 'The British Monarchy', 'The Civil Rights Movement', 'Napoleon', 'Ancient China', 'The Ottoman Empire', 'The American Revolution', 'The Aztecs and the Incas', 'The Titanic', 'Pirates', 'Ancient Mesopotamia', 'Castles', 'The Wild West', 'The Byzantine Empire', 'The Tudors', 'The Mongol Empire', 'The Great Depression', 'The Maya', 'Ancient Persia', 'The Roaring Twenties']),
  ...dp(['science'], ['The Solar System', 'The Human Body', 'Dinosaurs', 'Volcanoes', 'The Periodic Table', 'Space Exploration', 'Weather', 'Genetics', 'Physics', 'Evolution', 'The Brain', 'Earthquakes', 'Infectious Disease', 'Light and Color', 'Stars and Galaxies', 'Minerals and Gemstones', 'Electricity', 'Mathematics', 'Glaciers and the Ice Age', 'The Moon']),
  ...dp(['nature', 'science'], ['Birds', 'The Ocean', 'Sharks', 'Insects', 'Big Cats', 'Trees', 'Whales and Dolphins', 'Reptiles', 'Rainforests', 'Fungi', 'Horses', 'Dogs', 'Amphibians', 'Primates', 'Bears', 'Spiders', 'Elephants']),
  ...dp(['geography'], ['Antarctica', 'Rivers', 'Japan', 'Mountains', 'Africa', 'Australia', 'India', 'Islands', 'Deserts', 'Capital Cities', 'Canada', 'Italy', 'Lakes', 'The Fifty States', 'Caves', 'Ireland', 'Russia', 'Brazil']),
  ...dp(['sports'], ['The Olympics', 'Baseball', 'The World Cup', 'Basketball', 'American Football', 'Tennis', 'Golf', 'Boxing', 'Formula One', 'Ice Hockey', 'Cycling', 'Cricket']),
  ...dp(['movies-and-tv'], ['The Movies', 'Television', 'Animation']),
  ...dp(['music', ART], ['Classical Music', 'Jazz', 'Rock and Roll', 'The Beatles', 'Broadway Musicals', 'Opera', 'Country Music', 'Hip Hop', 'Musical Instruments']),
  ...dp(['books', ART], ['Shakespeare', 'Classic Novels', 'Poetry', 'Detective Fiction', 'Science Fiction', 'Fairy Tales', "Children's Literature", 'Comic Book Superheroes']),
  ...dp([ART], ['Painting', 'Architecture', 'Sculpture', 'Photography', 'Ballet']),
  ...dp(['mythology', 'history'], ['Greek Mythology', 'Norse Mythology', 'Arthurian Legend']),
  ...dp(['food-and-drink'], ['Coffee', 'Wine', 'Chocolate', 'Cheese', 'Tea', 'Spices', 'Bread and Baking']),
  ...dp(['technology', 'science'], ['Computers', 'Flight', 'Railways', 'Bridges', 'Codes and Ciphers']),
  ...dp(['technology', 'movies-and-tv'], ['Video Games']),
  ...dp(['business'], ['Money and Currency']),
]);
export const DEEP_NO_PARENT = ['Chess', 'Thanksgiving', 'Christmas Traditions', 'Magic and Illusion', 'Calendars and Timekeeping'];
// The topic a Deep subject is cross-filed into, or null.
export function deepParent(subject) {
  const want = DEEP_PARENT[subject];
  if (!want) return null;
  return want.find((slug) => TRIVIA_TOPICS.some((t) => t.slug === slug)) || null;
}
// The same subjects in the SCIENCE Database, by its own topics (lib/qdb.js SCIENCE_TOPICS).
export const DEEP_SCIENCE = Object.fromEntries([
  ...dp('space-and-physics', ['The Solar System', 'Space Exploration', 'Physics', 'Light and Color', 'Stars and Galaxies', 'Electricity', 'The Moon']),
  ...dp('chemistry', ['The Periodic Table']),
  ...dp('life-science', ['Genetics', 'Evolution', 'Dinosaurs']),
  ...dp('human-body', ['The Human Body', 'The Brain', 'Infectious Disease']),
  ...dp('general-science', ['Volcanoes', 'Weather', 'Earthquakes', 'Minerals and Gemstones', 'Mathematics', 'Glaciers and the Ice Age']),
]);

// Lane names where a bank's own categories differ from its topic's lanes.
export const LANE_MAP = {
  orbit: { 'Forces & Energy': 'Chemistry & Physics', Space: 'Space' },
  bond: { Elements: 'Chemistry & Physics', 'Compounds & Reactions': 'Chemistry & Physics' },
  gene: { 'Animals & Plants': 'Life Science', 'Cells & Evolution': 'Life Science' },
  pulse: { Anatomy: 'Human Body', 'Health & Medicine': 'Human Body' },
  eureka: { Inventions: 'Inventions', 'Scientists & Discoveries': 'Inventions' },
};

