// THE TRIVIA PORTAL'S TOPICS (owner, 2026-11-21: "we want to make the site the
// top spot for multiple choice trivia. we have an enormous bank ... maybe users
// can play old questions by topic in same format", built from the "Trivia Portal
// Mockup" canvas with "same SEO" as the jigsaw portal).
//
// Twelve topics over the twenty-one gauntlet banks. A topic's LANES are the
// banks' own categories (the `cat` on each question), mapped where a bank's
// words differ; Words takes its lanes from the five English banks, Deep Cuts
// from each day's topic. No question data here, so it is safe in a client
// bundle; lib/trivia-library.js (server only) reads the banks.

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
  { slug: 'words', label: 'Words', icon: 'abc', color: '#8797f4', banks: ['gram', 'vocab', 'spell', 'origin', 'idiom'],
    h1: 'Word Trivia: Grammar, Vocabulary, and Spelling', title: 'Word Quiz: Grammar, Vocabulary, Spelling, and Idiom Questions | Mind Loft',
    blurb: 'Free word trivia: grammar, vocabulary, spelling, word origins and idioms, in multiple choice questions from easy to expert.' },
  { slug: 'deep-cuts', label: 'Deep Cuts', icon: 'dive', color: '#4cb8ee', banks: ['deep'],
    h1: 'Deep Cuts: Single-Topic Trivia Quizzes', title: 'Deep Cuts Trivia: Single-Topic Quizzes, Rome to Volcanoes | Mind Loft',
    blurb: 'Free single-topic trivia quizzes: each one goes deep on one subject, from Ancient Rome and Shakespeare to the solar system.' },
];

export const topicBySlug = (s) => TRIVIA_TOPICS.find((t) => t.slug === s) || null;
// The daily gauntlet each bank plays in, to its topic (for the links on the daily pages).
export const BANK_TOPIC = Object.fromEntries(TRIVIA_TOPICS.flatMap((t) => t.banks.map((b) => [b, t.slug])));

// Lane names where a bank's own categories differ from its topic's lanes.
export const LANE_MAP = {
  orbit: { 'Forces & Energy': 'Chemistry & Physics', Space: 'Space' },
  bond: { Elements: 'Chemistry & Physics', 'Compounds & Reactions': 'Chemistry & Physics' },
  gene: { 'Animals & Plants': 'Life Science', 'Cells & Evolution': 'Life Science' },
  pulse: { Anatomy: 'Human Body', 'Health & Medicine': 'Human Body' },
  eureka: { Inventions: 'Inventions', 'Scientists & Discoveries': 'Inventions' },
  gram: '*Grammar', vocab: '*Vocabulary', spell: '*Spelling', origin: '*Word Origins', idiom: '*Idioms',
};

export const LEVELS = [
  ['ramp', 'Ramp'], ['1', 'Gimme'], ['2', 'Easy'], ['3', 'Medium'], ['4', 'Hard'], ['5', 'Expert'],
];
export const MODES = [
  { key: 'gauntlet', label: 'Gauntlet', sub: 'one life, gets harder' },
  { key: 'practice', label: 'Practice', sub: 'no lives, see answers' },
  { key: 'sprint', label: 'Sprint', sub: '60 seconds' },
  { key: 'streak', label: 'Streak', sub: 'until you miss' },
];
export const COUNTS = [10, 25, 50];
export const Q_SECONDS = 20;
export const SPRINT_SECONDS = 60;
// This browser's practice record: { t: {topic: [seen, right]}, l: {'topic|lane': [seen, right]},
// b: {'topic|mode|n': best}, m: [missed question keys, newest first, at most MISS_CAP] }.
export const STORE_KEY = 'sot_trivia_practice';
export const MISS_CAP = 300;
