// THE QUESTION DATABASES (owner, 2026-11-21). The Trivia Database
// (/trivia-questions) came first ("make the site the top spot for multiple
// choice trivia ... play old questions by topic in same format"); the same day
// the owner asked for "similar pages for math and English ... same SEO, same
// style", so one engine now serves three databases:
//
//   trivia   /trivia-questions   the sixteen trivia gauntlet banks, eleven topics
//   math     /math-questions     the five Math Gauntlet banks, one topic each
//   english  /english-questions  the five English Gauntlet banks, one topic each
//   science  /science-questions  the six science banks, one topic each (also in Trivia)
//
// Every question has ALREADY RUN as a daily; lib/qdb-library.js (server only)
// reads the banks and never hands out a question whose day has not come.
// This file holds no question data, so it is safe in a client bundle.
//
// The pages wear the gauntlet stage (owner, 2026-11-21: "ideally trivia ends up
// looking like the gauntlet play pages"): a pastel ground, one dark ink, the
// topics as answer tiles. The setup has three modes (owner, same day: Streak
// merged into Gauntlet, whose length gains an Endless choice) and a Difficulty
// in the site's own bands (owner: "Should be difficulty setting"; the bands are
// Gentle, Moderate, Tough, ruled 2026-11-08), plus Mixed, which climbs.

import { TRIVIA_TOPICS } from './trivia-topics.js';

export const MATH_TOPICS = [
  { slug: 'mental-arithmetic', label: 'Mental Arithmetic', color: '#fcd34d', banks: ['blitz'], daily: { href: '/blitz', name: 'Blitz' },
    h1: 'Mental Math Questions', title: 'Mental Math Questions and Answers: Free Arithmetic Quiz | Mind Loft',
    blurb: 'Free mental math practice: addition, subtraction, multiplication, division, percentages, and order of operations, in multiple choice problems from gentle to tough.' },
  { slug: 'multi-step', label: 'Multi-Step Problems', color: '#5eead4', banks: ['blitzed'], daily: { href: '/blitzed', name: 'Blitzed' },
    h1: 'Multi-Step Math Problems', title: 'Multi-Step Math Problems: Free Order of Operations Quiz | Mind Loft',
    blurb: 'Free multi-step math problems: three numbers and two operations at once, squares and roots, worked out in your head, from gentle to tough.' },
  { slug: 'missing-numbers', label: 'Missing Numbers', color: '#93e44e', banks: ['gap'], daily: { href: '/gap', name: 'Gap' },
    h1: 'Missing Number Math Problems', title: 'Missing Number Problems: Free Algebra Practice Quiz | Mind Loft',
    blurb: 'Free missing number problems: find the number that makes each equation true, from simple sums to brackets and powers. Algebra practice without the x.' },
  { slug: 'number-sequences', label: 'Number Sequences', color: '#7dd3fc', banks: ['series'], daily: { href: '/series', name: 'Series' },
    h1: 'Number Sequence Questions: What Comes Next?', title: 'Number Sequence Puzzles: What Comes Next? Free Quiz | Mind Loft',
    blurb: 'Free number sequence puzzles: find the next number in steps, doublings, squares, cubes, and Fibonacci-style runs, from gentle to tough.' },
  { slug: 'find-the-equation', label: 'Find the Equation', color: '#a5b4fc', banks: ['back'], daily: { href: '/back', name: 'Back' },
    h1: 'Find the Equation: Which One Makes It?', title: 'Find the Equation Math Quiz: Which One Makes the Number? | Mind Loft',
    blurb: 'Free math quiz played backwards: you get the answer and pick the one line of four that makes it, from simple sums to powers and percentages.' },
];

export const ENGLISH_TOPICS = [
  { slug: 'grammar', label: 'Grammar', color: '#7dd3fc', banks: ['gram'], daily: { href: '/gram', name: 'Gram' },
    h1: 'Grammar Quiz Questions', title: 'Grammar Quiz: Free Grammar Questions and Answers | Mind Loft',
    blurb: 'Free grammar questions: word choice, punctuation, and sentence structure, the mistakes everyone makes, in multiple choice from gentle to tough.' },
  { slug: 'vocabulary', label: 'Vocabulary', color: '#a5b4fc', banks: ['vocab'], daily: { href: '/vocab', name: 'Vocab' },
    h1: 'Vocabulary Quiz Questions', title: 'Vocabulary Quiz: Free Word Meaning Questions and Answers | Mind Loft',
    blurb: 'Free vocabulary questions: definitions, synonyms, and opposites, from everyday words to the ones you meet in a good book, gentle to tough.' },
  { slug: 'spelling', label: 'Spelling', color: '#c4b5fd', banks: ['spell'], daily: { href: '/spell', name: 'Spell' },
    h1: 'Spelling Quiz Questions', title: 'Spelling Quiz: Free Commonly Misspelled Words Test | Mind Loft',
    blurb: 'Free spelling quiz: pick the word spelled right, or spot the one a copy editor would flag, from everyday words to the famously tricky ones.' },
  { slug: 'word-origins', label: 'Word Origins', color: '#f9a8d4', banks: ['origin'], daily: { href: '/origin', name: 'Origin' },
    h1: 'Word Origin Quiz Questions', title: 'Word Origins Quiz: Etymology Questions and Answers | Mind Loft',
    blurb: 'Free word origin questions: the roots behind everyday words and the people and places things are named after, in multiple choice from gentle to tough.' },
  { slug: 'idioms', label: 'Idioms', color: '#fdba74', banks: ['idiom'], daily: { href: '/idiom', name: 'Idiom' },
    h1: 'Idiom Quiz Questions', title: 'Idioms Quiz: Free Sayings and Proverbs Questions | Mind Loft',
    blurb: 'Free idioms quiz: say what a saying means, or finish the proverb, from a piece of cake to the early bird, in multiple choice from gentle to tough.' },
];

export const SCIENCE_TOPICS = [
  { slug: 'general-science', label: 'General Science', color: '#fb923c', banks: ['sci'], daily: { href: '/sci', name: 'Sci' },
    h1: 'General Science Trivia Questions', title: 'Science Trivia Questions and Answers: Free General Science Quiz | Mind Loft',
    blurb: 'Free general science questions: space, life science, the human body, chemistry and physics, and inventions, in multiple choice from gentle to tough.' },
  { slug: 'space-and-physics', label: 'Space and Physics', color: '#a5b4fc', banks: ['orbit'], daily: { href: '/orbit', name: 'Orbit' },
    h1: 'Space and Physics Quiz Questions', title: 'Space and Physics Quiz: Free Astronomy and Forces Questions | Mind Loft',
    blurb: 'Free space and physics questions: planets, stars, and missions, plus forces, energy, light, and motion, in multiple choice from gentle to tough.' },
  { slug: 'chemistry', label: 'Chemistry', color: '#5eead4', banks: ['bond'], daily: { href: '/bond', name: 'Bond' },
    h1: 'Chemistry Quiz Questions', title: 'Chemistry Quiz: Free Elements and Reactions Questions | Mind Loft',
    blurb: 'Free chemistry questions: the elements and the periodic table, compounds, and reactions, in multiple choice from gentle to tough.' },
  { slug: 'life-science', label: 'Life Science', color: '#86efac', banks: ['gene'], daily: { href: '/gene', name: 'Gene' },
    h1: 'Biology and Life Science Quiz Questions', title: 'Biology Quiz: Free Life Science Questions and Answers | Mind Loft',
    blurb: 'Free biology questions: cells, genetics, and evolution, plus animals and plants, in multiple choice from gentle to tough.' },
  { slug: 'human-body', label: 'Human Body', color: '#f9a8d4', banks: ['pulse'], daily: { href: '/pulse', name: 'Pulse' },
    h1: 'Human Body Quiz Questions', title: 'Human Body Quiz: Free Anatomy and Health Questions | Mind Loft',
    blurb: 'Free human body questions: anatomy, organs, and systems, plus health and medicine, in multiple choice from gentle to tough.' },
  { slug: 'inventions-and-discoveries', label: 'Inventions and Discoveries', color: '#fcd34d', banks: ['eureka'], daily: { href: '/eureka', name: 'Eureka' },
    h1: 'Inventions and Discoveries Quiz Questions', title: 'Inventions Quiz: Free Scientists and Discoveries Questions | Mind Loft',
    blurb: 'Free questions on inventions and the scientists behind them: who discovered what, and what changed the world, from gentle to tough.' },
];

export const QDBS = {
  trivia: {
    key: 'trivia', name: 'Trivia Database', base: '/trivia-questions', ground: '#7dd3fc', cat: 'Trivia',
    noun: 'trivia questions', one: 'question', many: 'questions', topics: TRIVIA_TOPICS,
    ask: 'What should we quiz you on?', mix: 'Mixed Bag', qSeconds: 20,
    today: [{ href: '/trivia', name: 'Trivia Gauntlet', sub: 'Six new quizzes, one life each' }, { href: '/encore', name: 'Trivia Encore', sub: 'Five more from the other banks' }],
    og: '/og/trivia-questions.png',
  },
  math: {
    key: 'math', name: 'Math Database', base: '/math-questions', ground: '#6ee7b7', cat: 'Numbers',
    noun: 'math problems', one: 'problem', many: 'problems', topics: MATH_TOPICS,
    ask: 'What should we test you on?', mix: 'Mixed Math', qSeconds: 15,
    today: [{ href: '/math', name: 'Math Gauntlet', sub: 'Five new math games, one life each' }],
    og: '/og/math-questions.png',
  },
  english: {
    key: 'english', name: 'English Database', base: '/english-questions', ground: '#a5b4fc', cat: 'Word',
    noun: 'English questions', one: 'question', many: 'questions', topics: ENGLISH_TOPICS,
    ask: 'What should we test you on?', mix: 'Mixed English', qSeconds: 20,
    today: [{ href: '/english', name: 'English Gauntlet', sub: 'Five new quizzes, one life each' }],
    og: '/og/english-questions.png',
  },
  // THE SCIENCE DATABASE (owner, 2026-11-21: "We also need to build a science
  // database. It will be separate, but the same options will also exist within
  // trivia"). The six science banks, one topic each; the same questions also
  // play inside the Trivia Database's Science topic.
  science: {
    key: 'science', name: 'Science Database', base: '/science-questions', ground: '#fdba74', cat: 'Trivia',
    noun: 'science questions', one: 'question', many: 'questions', topics: SCIENCE_TOPICS,
    ask: 'Choose your topic(s):', mix: 'Mixed Science', qSeconds: 20,
    today: [{ href: '/science', name: 'Science Gauntlet', sub: 'Five new science quizzes, one life each' }],
    og: '/og/science-questions.png',
  },
};
export const QDB_KEYS = Object.keys(QDBS);
export const qdbTopic = (db, slug) => (QDBS[db] ? QDBS[db].topics.find((t) => t.slug === slug) || null : null);

// Every bank to its database and topic, for the links on the daily pages.
// A bank in two databases (the science banks) links to the one listed LAST, so the
// Science Gauntlet's dailies point at the Science Database.
export const BANK_DB = Object.fromEntries(QDB_KEYS.flatMap((db) => QDBS[db].topics.flatMap((t) => t.banks.map((b) => [b, { db, slug: t.slug, label: t.label, base: QDBS[db].base, name: QDBS[db].name }]))));
// The runs, to the database their end screen points at.
export const RUN_DB = { gauntlet: 'trivia', triviaencore: 'trivia', science: 'science', english: 'english', math: 'math' };

// Difficulty: the banks grade every question on five tiers; the site names three bands.
export const DIFFICULTY = [['ramp', 'Mixed'], ['g', 'Gentle'], ['m', 'Moderate'], ['t', 'Tough']];
export const DIFF_TIERS = { g: [1, 2], m: [3], t: [4, 5] };
export const tierBand = (t) => (t <= 2 ? 'Gentle' : t === 3 ? 'Moderate' : 'Tough');
export const MODES = [
  { key: 'practice', label: 'Practice', sub: 'No clock, see answers' },
  { key: 'gauntlet', label: 'Gauntlet', sub: 'One miss ends it' },
  { key: 'sprint', label: 'Sprint', sub: '60 seconds' },
];
export const COUNTS = [10, 25, 50, 0];   // 0 is Endless (Gauntlet only)
export const ENDLESS_N = 120;
export const SPRINT_SECONDS = 60;
// This browser's record, per database: { t: {topic: [seen, right]}, l: {'topic|lane': [seen, right]},
// b: {'topic|mode|n': best}, m: [missed question keys, newest first, at most MISS_CAP] }.
// Trivia keeps its first key so records from the first day carry over.
export const storeKey = (db) => (db === 'trivia' ? 'sot_trivia_practice' : `sot_${db}_practice`);
export const setupKey = (db) => `sot_${db}_setup`;
export const MISS_CAP = 300;
