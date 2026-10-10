// scripts/wire-potluck.mjs: wires Potluck (the daily quiz mix, three catalog
// quizzes a day, turned in when you choose) into every registry, beside Quotes
// in each list. Anchored in the shape of scripts/wire-script-quotes.mjs: every
// anchor must match EXACTLY ONCE or the script throws, and an edit whose
// replacement is already present is skipped, so a re-run is safe.
//
//   node scripts/wire-potluck.mjs <dir>
import fs from 'fs';
import path from 'path';

const root = process.argv[2] || '.';
let applied = 0, skipped = 0;
function edit(file, anchor, replacement) {
  const p = path.join(root, file);
  const src = fs.readFileSync(p, 'utf8');
  if (src.includes(replacement)) { skipped++; return; }
  const n = src.split(anchor).length - 1;
  if (n !== 1) throw new Error(`${file}: anchor matched ${n} times, expected 1\n  ${anchor.slice(0, 140)}`);
  fs.writeFileSync(p, src.replace(anchor, replacement));
  applied++;
}

const D = {
  color: '#b4532a', navy: '#f4a582', bg: '#fdf1ea', border: 'rgba(180,83,42,0.4)',
  tag: 'Three quizzes, one score',
  how: 'Three quizzes from the catalog a day, each a different kind and a different subject: one to type, one to match, one to spot on a map or in pictures. Each is worth 10 points, scaled by how much of it you got. Play any of them in any order and turn it in when you are done; finishing the third turns it in for you.',
  blurb: 'Three quizzes a day from the catalog, one to type, one to match and one to spot, each from a different subject. Each is worth 10; turn it in whenever you are done.',
};

// 1. lib/daily-games.js: the row, after Quotes, and a premiere window.
edit('lib/daily-games.js',
  `  { key: 'focus', miss: 'Misses', name: 'Focus', cat: 'Trivia',`,
  `  { key: 'potluck', miss: null, name: 'Potluck', cat: 'Trivia', tag: '${D.tag}', how: '${D.how}', color: '${D.color}', colorNavy: '${D.navy}' },\n  { key: 'focus', miss: 'Misses', name: 'Focus', cat: 'Trivia',`);
edit('lib/daily-games.js',
  `  { key: 'gap', from: '2026-10-09', until: '2026-10-13' },`,
  `  { key: 'potluck', from: '2026-10-10', until: '2026-10-14' },\n  { key: 'gap', from: '2026-10-09', until: '2026-10-13' },`);

// 2. app/DailyEndCard.jsx: launch pin, meta, end-card roster tile.
edit('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['gap',`, `const LAUNCH_PIN = { keys: ['potluck', 'gap',`);
edit('app/DailyEndCard.jsx', `  Clapperboard, Quote, ZoomIn,`, `  Clapperboard, Quote, CookingPot, ZoomIn,`);
edit('app/DailyEndCard.jsx',
  `  quotes: { accent: '#3d4f7c', badgeBg: '#3d4f7c', badgeInk: T.white, Fin: Quote },`,
  `  quotes: { accent: '#3d4f7c', badgeBg: '#3d4f7c', badgeInk: T.white, Fin: Quote },\n  potluck: { accent: '${D.color}', badgeBg: '${D.color}', badgeInk: T.white, Fin: CookingPot },`);
edit('app/DailyEndCard.jsx',
  `  { key: 'quotes', cat: 'trivia',   name: 'Quotes',`,
  `  { key: 'potluck', cat: 'trivia',  name: 'Potluck', tag: '${D.tag}', blurb: '${D.blurb}', href: '/potluck' },\n  { key: 'quotes', cat: 'trivia',   name: 'Quotes',`);
edit('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['gap',`, `const LAUNCH_PIN = { keys: ['potluck', 'gap',`);

// 3. app/DailyStrip.jsx: the row and both colour maps.
edit('app/DailyStrip.jsx',
  `  { key: 'quotes', href: '/quotes', name: 'Quotes', img: '/games/btn-quotes.png', store: 'sot_quotes_day', tag: "Who said it, one life" , cat: 'Trivia' },`,
  `  { key: 'quotes', href: '/quotes', name: 'Quotes', img: '/games/btn-quotes.png', store: 'sot_quotes_day', tag: "Who said it, one life" , cat: 'Trivia' },\n  { key: 'potluck', href: '/potluck', name: 'Potluck', img: '/games/btn-potluck.png', store: 'sot_potluck_day', tag: "${D.tag}" , cat: 'Trivia' },`);
edit('app/DailyStrip.jsx', `const ACCENTS = { gap:`, `const ACCENTS = { potluck: '${D.navy}', gap:`);
edit('app/DailyStrip.jsx', `const TCOL = { gap:`, `const TCOL = { potluck: '${D.color}', gap:`);

// 4. app/DailyGamesGrid.jsx: both lists.
edit('app/DailyGamesGrid.jsx',
  `  { key: 'quotes', href: '/quotes', name: 'Quotes', tag: 'Who said it, one life', img: '/games/btn-quotes.png' },`,
  `  { key: 'quotes', href: '/quotes', name: 'Quotes', tag: 'Who said it, one life', img: '/games/btn-quotes.png' },\n  { key: 'potluck', href: '/potluck', name: 'Potluck', tag: '${D.tag}', img: '/games/btn-potluck.png' },`);
edit('app/DailyGamesGrid.jsx', `'biz', 'script', 'quotes', 'focus',`, `'biz', 'script', 'quotes', 'potluck', 'focus',`);

// 5. app/DailyGamesPromo.jsx
edit('app/DailyGamesPromo.jsx',
  `  { key: 'quotes', href: '/quotes', name: 'Quotes', tag: 'who said it, one life', store: 'sot_quotes_day', accent: '#3d4f7c', bg: '#eef1f8', border: 'rgba(61,79,124,0.4)' },`,
  `  { key: 'quotes', href: '/quotes', name: 'Quotes', tag: 'who said it, one life', store: 'sot_quotes_day', accent: '#3d4f7c', bg: '#eef1f8', border: 'rgba(61,79,124,0.4)' },\n  { key: 'potluck', href: '/potluck', name: 'Potluck', tag: 'three quizzes, one score', store: 'sot_potluck_day', accent: '${D.color}', bg: '${D.bg}', border: '${D.border}' },`);

// 6. app/archive/page.js: import, light map, card.
edit('app/archive/page.js',
  `import { PUZZLES as QUOTES_FULL } from '../quotes/puzzles';`,
  `import { PUZZLES as QUOTES_FULL } from '../quotes/puzzles';\nimport { PUZZLES as POTLUCK_FULL } from '../potluck/puzzles';`);
edit('app/archive/page.js',
  `const QUOTES = QUOTES_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`,
  `const QUOTES = QUOTES_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));\nconst POTLUCK = POTLUCK_FULL.map(({ num, quizId, live, dateLabel }) => ({ num, quizId, live, dateLabel }));`);
edit('app/archive/page.js',
  `  { key: 'quotes', name: 'Quotes', path: '/quotes',`,
  `  { key: 'potluck', name: 'Potluck', path: '/potluck', tag: '${D.tag}', accent: '${D.color}', bg: '${D.bg}', border: '${D.border}', src: POTLUCK },\n  { key: 'quotes', name: 'Quotes', path: '/quotes',`);

// 7. the plain key lists.
for (const f of ['lib/loft.js', 'lib/sitemap-entries.js', 'lib/quiz-catalog.js', 'app/DailySlateRail.jsx']) {
  edit(f, `'script', 'quotes',`, `'script', 'quotes', 'potluck',`);
}

// 8. the puzzle-map registries (not sunday-slate: Potluck has no Sunday).
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js']) {
  edit(f, `import { PUZZLES as P_quotes } from '@/app/quotes/puzzles';`,
    `import { PUZZLES as P_quotes } from '@/app/quotes/puzzles';\nimport { PUZZLES as P_potluck } from '@/app/potluck/puzzles';`);
  edit(f, `quotes: P_quotes,`, `quotes: P_quotes, potluck: P_potluck,`);
}

// 9. the two hardcoded alternations.
edit('app/api/quiz/daily-status/route.js', `|script|quotes|`, `|script|quotes|potluck|`);
edit('app/quizzes/QuizHomeClient.jsx', `|script|quotes|`, `|script|quotes|potluck|`);

// 10. scoring: a day is a points total out of 30, graded out of that total
// (like Crux) and paid linearly (like the gauntlets), since it is three
// independent quizzes added up.
edit('lib/quiz-scoring.js', `  if (key === 'crux') return total;`, `  if (key === 'crux' || key === 'potluck') return total;`);
edit('lib/quiz-xp.js',
  `export const XP_LINEAR_DAILIES = new Set(['streak', 'atlas', 'sport', 'biz', 'script', 'quotes', 'feud']);`,
  `export const XP_LINEAR_DAILIES = new Set(['streak', 'atlas', 'sport', 'biz', 'script', 'quotes', 'potluck', 'feud']);`);

// 11. glyph: a pot with a lid and steam.
edit('lib/game-glyphs.js',
  `  quotes: 'M8 15c`,
  `  potluck: 'M4 11h16M5 11v6a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-6M10 9h4M12 9V8M9 6c-1-1 1-2 0-3M12 6c-1-1 1-2 0-3M15 6c-1-1 1-2 0-3M2 13h3M19 13h3', // a pot, its lid, two wisps\n  quotes: 'M8 15c`);

// 12. the trivia landing page.
edit('lib/puzzle-categories.js',
  `    keys: ['streak', 'deep', 'sport', 'atlas', 'biz', 'script', 'quotes', 'focus',`,
  `    keys: ['streak', 'deep', 'sport', 'atlas', 'biz', 'script', 'quotes', 'potluck', 'focus',`);
edit('lib/puzzle-categories.js',
  `quotes: 'Who said it', focus: 'Zoomed photo',`,
  `quotes: 'Who said it', potluck: 'Three quizzes a day', focus: 'Zoomed photo',`);

// 13. finish sets and the slate groups (both verifiers want every live game in one).
edit('lib/finish-sets.js',
  `  { name: 'Guess the picture', cat: 'Trivia', keys: ['focus', 'niche', 'script'] },`,
  `  { name: 'Guess the picture', cat: 'Trivia', keys: ['focus', 'niche', 'script'] },\n  { name: 'Quiz night', cat: 'Trivia', keys: ['potluck', 'streak', 'listed'] },`);
edit('lib/daily-groups.js',
  `  { name: 'Lists and quiz mix', cat: 'Trivia', keys: ['dating', 'listed', 'bracket', 'potluck'] },`,
  `  { name: 'Ordering trivia', cat: 'Trivia', keys: ['dating', 'listed', 'bracket', 'potluck'] },`);

console.log(`wire-potluck: ${applied} edits applied, ${skipped} already present`);
