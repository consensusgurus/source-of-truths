// scripts/wire-mixtape-mishmash.mjs: wires Mixtape and Mishmash (owner,
// 2026-10-30: two more quiz-mix dailies in Potluck's format) into every
// registry Potluck sits in, directly after Potluck. Every anchor must match
// EXACTLY ONCE or the script throws; an edit already present is skipped.
//
//   node scripts/wire-mixtape-mishmash.mjs <dir>
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

const G = {
  mixtape: {
    name: 'Mixtape', color: '#9d2f6b', navy: '#f0a3c8', bg: '#fbeef5', border: 'rgba(157,47,107,0.4)', icon: 'Disc3',
    tag: 'Three more quizzes, one score', tagLow: 'three more quizzes, one score',
    sub: 'Three more quizzes a day',
    glyph: 'M3 6h18v12H3zM6 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0M14 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0M10 12h4M7 18l2-3h6l2 3', // a cassette: two reels and the tape between
  },
  mishmash: {
    name: 'Mishmash', color: '#2f7a5c', navy: '#8fd8b5', bg: '#ecf7f1', border: 'rgba(47,122,92,0.4)', icon: 'Shuffle',
    tag: 'Another three quizzes, one score', tagLow: 'another three quizzes, one score',
    sub: 'Another three quizzes a day',
    glyph: 'M3 7h4c4 0 6 10 10 10h4M3 17h4c4 0 6-10 10-10h4M18 4l3 3-3 3M18 14l3 3-3 3', // two crossing arrows, shuffled
  },
};
const HOW = (n) => `Three quizzes from the catalog a day, each a different kind and a different subject: one to type, one to match, one to spot in pictures or on a map. They play back to back in one run. Each is worth 10 points, scaled by how much of it you got, so the day is out of 30. ${n} never serves a quiz that Potluck or the other mix is serving the same day.`;
const BLURB = 'Three quizzes a day from the catalog, one to type, one to match and one to spot, each from a different subject, back to back. Each is worth 10.';
const KEYS = Object.keys(G);
const each = (fn) => KEYS.map(fn).join('');

// 1. lib/daily-games.js: the rows, and the points scoring kind.
edit('lib/daily-games.js',
  `color: '#b4532a', colorNavy: '#f4a582' },\n`,
  `color: '#b4532a', colorNavy: '#f4a582' },\n` + each((k) => `  { key: '${k}', miss: null, name: '${G[k].name}', cat: 'Trivia', tag: '${G[k].tag}', tagLong: 'Three catalog quizzes a day: type one, match one, spot one', how: '${HOW(G[k].name)}', color: '${G[k].color}', colorNavy: '${G[k].navy}' },\n`));
edit('lib/daily-games.js', `potluck: { v: 'points' },`, `potluck: { v: 'points' }, mixtape: { v: 'points' }, mishmash: { v: 'points' },`);

// 2. app/DailyEndCard.jsx: launch pin, icon import, meta, roster.
edit('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['mixtape', 'mishmash', `);
edit('app/DailyEndCard.jsx', `  Clapperboard, Quote, CookingPot, ZoomIn,`, `  Clapperboard, Quote, CookingPot, Disc3, Shuffle, ZoomIn,`);
edit('app/DailyEndCard.jsx',
  `  potluck: { accent: '#b4532a', badgeBg: '#b4532a', badgeInk: T.white, Fin: CookingPot },\n`,
  `  potluck: { accent: '#b4532a', badgeBg: '#b4532a', badgeInk: T.white, Fin: CookingPot },\n` + each((k) => `  ${k}: { accent: '${G[k].color}', badgeBg: '${G[k].color}', badgeInk: T.white, Fin: ${G[k].icon} },\n`));
edit('app/DailyEndCard.jsx',
  `href: '/potluck' },\n`,
  `href: '/potluck' },\n` + each((k) => `  { key: '${k}', cat: 'trivia',  name: '${G[k].name}', tag: '${G[k].tag}', blurb: '${BLURB}', href: '/${k}' },\n`));
edit('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['mixtape', 'mishmash', `);

// 3. app/DailyStrip.jsx
edit('app/DailyStrip.jsx',
  `  { key: 'potluck', href: '/potluck', name: 'Potluck', img: '/games/btn-potluck.png', store: 'sot_potluck_day', tag: "Three quizzes, one score" , cat: 'Trivia' },\n`,
  `  { key: 'potluck', href: '/potluck', name: 'Potluck', img: '/games/btn-potluck.png', store: 'sot_potluck_day', tag: "Three quizzes, one score" , cat: 'Trivia' },\n` + each((k) => `  { key: '${k}', href: '/${k}', name: '${G[k].name}', img: '/games/btn-${k}.png', store: 'sot_${k}_day', tag: "${G[k].tag}" , cat: 'Trivia' },\n`));
edit('app/DailyStrip.jsx', `potluck: '#f4a582',`, `potluck: '#f4a582', mixtape: '${G.mixtape.navy}', mishmash: '${G.mishmash.navy}',`);
edit('app/DailyStrip.jsx', `potluck: '#b4532a',`, `potluck: '#b4532a', mixtape: '${G.mixtape.color}', mishmash: '${G.mishmash.color}',`);

// 4. app/DailyGamesGrid.jsx
edit('app/DailyGamesGrid.jsx',
  `  { key: 'potluck', href: '/potluck', name: 'Potluck', tag: 'Three quizzes, one score', img: '/games/btn-potluck.png' },\n`,
  `  { key: 'potluck', href: '/potluck', name: 'Potluck', tag: 'Three quizzes, one score', img: '/games/btn-potluck.png' },\n` + each((k) => `  { key: '${k}', href: '/${k}', name: '${G[k].name}', tag: '${G[k].tag}', img: '/games/btn-${k}.png' },\n`));

// 5. app/DailyGamesPromo.jsx
edit('app/DailyGamesPromo.jsx',
  `border: 'rgba(180,83,42,0.4)' },\n`,
  `border: 'rgba(180,83,42,0.4)' },\n` + each((k) => `  { key: '${k}', href: '/${k}', name: '${G[k].name}', tag: '${G[k].tagLow}', store: 'sot_${k}_day', accent: '${G[k].color}', bg: '${G[k].bg}', border: '${G[k].border}' },\n`));

// 6. app/archive/page.js
edit('app/archive/page.js',
  `import { PUZZLES as POTLUCK_FULL } from '../potluck/puzzles';`,
  `import { PUZZLES as POTLUCK_FULL } from '../potluck/puzzles';\nimport { PUZZLES as MIXTAPE_FULL } from '../mixtape/puzzles';\nimport { PUZZLES as MISHMASH_FULL } from '../mishmash/puzzles';`);
edit('app/archive/page.js',
  `const POTLUCK = POTLUCK_FULL.map(({ num, quizId, live, dateLabel }) => ({ num, quizId, live, dateLabel }));`,
  `const POTLUCK = POTLUCK_FULL.map(({ num, quizId, live, dateLabel }) => ({ num, quizId, live, dateLabel }));\nconst MIXTAPE = MIXTAPE_FULL.map(({ num, quizId, live, dateLabel }) => ({ num, quizId, live, dateLabel }));\nconst MISHMASH = MISHMASH_FULL.map(({ num, quizId, live, dateLabel }) => ({ num, quizId, live, dateLabel }));`);
edit('app/archive/page.js',
  `border: 'rgba(180,83,42,0.4)', src: POTLUCK },\n`,
  `border: 'rgba(180,83,42,0.4)', src: POTLUCK },\n` + each((k) => `  { key: '${k}', name: '${G[k].name}', path: '/${k}', tag: '${G[k].tag}', accent: '${G[k].color}', bg: '${G[k].bg}', border: '${G[k].border}', src: ${k.toUpperCase()} },\n`));

// 7. plain key lists: 'potluck', -> 'potluck', 'mixtape', 'mishmash',
for (const f of ['app/DailyGamesGrid.jsx', 'app/DailySlateRail.jsx', 'lib/loft.js', 'lib/puzzle-categories.js', 'lib/quiz-catalog.js', 'lib/quiz-xp.js']) {
  edit(f, `'foodie', 'potluck', `, `'foodie', 'potluck', 'mixtape', 'mishmash', `);
}
edit('lib/puzzle-categories.js', `potluck: 'Three quizzes a day',`, `potluck: 'Three quizzes a day', mixtape: '${G.mixtape.sub}', mishmash: '${G.mishmash.sub}',`);

// 8. puzzle-map registries.
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js']) {
  edit(f, `import { PUZZLES as P_potluck } from '@/app/potluck/puzzles';`,
    `import { PUZZLES as P_potluck } from '@/app/potluck/puzzles';\nimport { PUZZLES as P_mixtape } from '@/app/mixtape/puzzles';\nimport { PUZZLES as P_mishmash } from '@/app/mishmash/puzzles';`);
  edit(f, `potluck: P_potluck,`, `potluck: P_potluck, mixtape: P_mixtape, mishmash: P_mishmash,`);
}

// 9. alternations.
edit('app/api/quiz/daily-status/route.js', `|foodie|potluck|`, `|foodie|potluck|mixtape|mishmash|`);
edit('app/quizzes/QuizHomeClient.jsx', `|foodie|potluck|`, `|foodie|potluck|mixtape|mishmash|`);

// 10. scoring: out of 30, graded out of the total, paid linearly, like Potluck.
edit('lib/quiz-scoring.js', `  if (key === 'crux' || key === 'potluck') return total;`, `  if (key === 'crux' || key === 'potluck' || key === 'mixtape' || key === 'mishmash') return total;`);

// 11. glyphs.
edit('lib/game-glyphs.js', `// a pot, its lid, two wisps\n`, `// a pot, its lid, two wisps\n` + each((k) => `  ${k}: '${G[k].glyph.split(' // ')[0]}',\n`));

// 12. skills, slate groups, finish sets.
edit('lib/daily-skills.js', `  potluck: ['mem'],`, `  potluck: ['mem'], mixtape: ['mem'], mishmash: ['mem'],`);
edit('lib/daily-groups.js', `  { name: 'Lists and quiz mix', cat: 'Trivia', keys: ['dating', 'listed', 'bracket', 'potluck'] },`, `  { name: 'Lists and rankings', cat: 'Trivia', keys: ['dating', 'listed', 'bracket'] },\n  { name: 'Quiz mixes', cat: 'Trivia', keys: ['potluck', 'mixtape', 'mishmash'] },`);
edit('lib/finish-sets.js',
  `  { name: 'Quiz night', cat: 'Trivia', keys: ['potluck', 'streak', 'listed'] },\n`,
  `  { name: 'Quiz night', cat: 'Trivia', keys: ['potluck', 'streak', 'listed'] },\n  { name: 'Three mixes', cat: 'Trivia', keys: ['potluck', 'mixtape', 'mishmash'] },\n`);

// 13. Potluck's About section names its two siblings.
edit('app/potluck/PotluckClient.jsx',
  `A new three every day at midnight Eastern. No app, no signup. More trivia:`,
  `A new three every day at midnight Eastern. No app, no signup. <a href="/mixtape" style={{ color: INK, fontWeight: 800 }}>Mixtape</a> and <a href="/mishmash" style={{ color: INK, fontWeight: 800 }}>Mishmash</a> serve three more each day. More trivia:`);

console.log(`wire-mixtape-mishmash: ${applied} edits applied, ${skipped} already present`);
