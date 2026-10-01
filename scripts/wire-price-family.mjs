// scripts/wire-price-family.mjs — puts Dealer, Realtor, Agent and Curator (the
// Price Check family, lib/price-games.js) into every registry Pricer is in,
// and takes Pricer out of the Sunday Edition (owner, 2026-10-01: no Sunday
// Edition; everything is Amazon). Anchored: each anchor must match exactly
// once or the script throws; idempotent on re-run.
//
//   node scripts/wire-price-family.mjs <dir>
import fs from 'fs';
import path from 'path';

const root = process.argv[2] || '.';
let applied = 0, skipped = 0;
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const write = (f, s) => fs.writeFileSync(path.join(root, f), s);
function edit(file, anchor, replacement) {
  const src = read(file);
  if (src.includes(replacement) && (replacement.includes(anchor) || !src.includes(anchor))) { skipped++; return; }
  const n = src.split(anchor).length - 1;
  if (n !== 1) throw new Error(`${file}: anchor matched ${n} times, expected 1\n  ${anchor.slice(0, 160)}`);
  write(file, src.replace(anchor, replacement));
  applied++;
}

const NEW = ['dealer', 'realtor', 'agent', 'curator'];
const G = {
  dealer: { name: 'Dealer', tag: 'Guess the sticker price', blurb: 'One vehicle a day, from a hatchback to a work van to a supercar, and five guesses at its starting price.', how: "One vehicle a day and five guesses at its starting MSRP, the maker's own base price. Each guess says higher or lower and how hot you are. Your closest guess is your score, 0 to 10; within 1% is a bullseye. Cars mostly, with a work van, a pickup or a motorcycle now and then.", dark: '#fbbf24' },
  realtor: { name: 'Realtor', tag: 'Guess the asking price', blurb: 'One house for sale a day, three photos and the basics, and five guesses at the asking price.', how: 'One home for sale a day: three photos, the city, the beds, baths and square feet. Five guesses at its asking price, each one higher or lower and hot or cold. Your closest guess is your score, 0 to 10; within 1% is a bullseye.', dark: '#7dd3fc' },
  agent: { name: 'Agent', tag: 'Guess the fare', blurb: 'One trip a day, a named flight or a hotel night, and five guesses at the fare.', how: 'One trip a day: a named flight (airline, day, date, time and cabin) or a hotel stay. Five guesses at the fare we were quoted, each one higher or lower and hot or cold. Your closest guess is your score, 0 to 10; within 1% is a bullseye.', dark: '#f472b6' },
  curator: { name: 'Curator', tag: 'Guess what it sold for', blurb: 'One luxury piece a day, off the auction block or off the shelf, and five guesses at the price.', how: "One luxury piece a day: a work sold at auction, priced with the buyer's premium, or a luxury item at its list price. Five guesses, each one higher or lower and hot or cold. Your closest guess is your score, 0 to 10; within 1% is a bullseye.", dark: '#c4b5fd' },
};
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const UP = (k) => k.toUpperCase();
const P = (k) => `P_${k}`;

// 1. the registry rows, Pricer's copy, and the premiere window
{
  const src = read('lib/daily-games.js');
  const line = src.split('\n').find((l) => l.startsWith("  { key: 'pricer',"));
  if (!line) throw new Error('no pricer row');
  const rows = NEW.map((k) => `  { key: '${k}', miss: 'Guesses', name: '${G[k].name}', cat: 'Numbers', tag: '${esc(G[k].tag)}', how: '${esc(G[k].how)}', color: '#15803d', colorNavy: '#4ade80' },`).join('\n');
  const fixedPricer = line.replace(/ Amazon products on weekdays,[^']*'/, " Everything is on Amazon, from hot sauce to laptops.'");
  edit('lib/daily-games.js', line, fixedPricer + '\n' + rows);
}
edit('lib/daily-games.js', `  { key: 'pricer', from: '2026-10-01', until: '2026-10-06' },`,
  `  { key: 'pricer', from: '2026-10-01', until: '2026-10-06' },\n` + NEW.map((k) => `  { key: '${k}', from: '2026-10-02', until: '2026-10-07' },`).join('\n'));

// 2. no Sunday Edition for Pricer
edit('lib/sunday-editions.js', `  'pricer',\n`, ``);
edit('lib/sunday-editions.js', `//   pricer  a big-ticket item (a car, a watch, a motorcycle) at the maker's starting price\n`, ``);

// 3. the slate rows and tiles
for (const [file, find, make] of [
  ['app/DailyStrip.jsx', (l) => l.startsWith("  { key: 'pricer', href: '/pricer', name: 'Pricer', img:"), (k) => `  { key: '${k}', href: '/${k}', name: '${G[k].name}', img: '/games/btn-${k}.png', store: 'sot_${k}_day', tag: "${G[k].tag}" , cat: 'Numbers' },`],
  ['app/DailyEndCard.jsx', (l) => l.startsWith("  { key: 'pricer',  cat: 'numbers'"), (k) => `  { key: '${k}',  cat: 'numbers',  name: '${G[k].name}',  tag: '${esc(G[k].tag)}', blurb: '${esc(G[k].blurb)}', href: '/${k}' },`],
  ['app/DailyEndCard.jsx', (l) => l.startsWith("  pricer: { accent: '#15803d'"), (k) => `  ${k}: { accent: '#15803d', badgeBg: '#15803d', badgeInk: T.white, Fin: TrophyFin },`],
  ['app/DailyGamesPromo.jsx', (l) => l.startsWith("  { key: 'pricer', href: '/pricer'"), (k) => `  { key: '${k}', href: '/${k}', name: '${G[k].name}', tag: '${esc(G[k].tag.toLowerCase())}', store: 'sot_${k}_day', accent: '#15803d', bg: '#dcfce7', border: 'rgba(21,128,61,0.35)' },`],
  ['app/DailyGamesGrid.jsx', (l) => l.startsWith("  { key: 'pricer', href: '/pricer', name: 'Pricer', tag:"), (k) => `  { key: '${k}', href: '/${k}', name: '${G[k].name}', tag: '${esc(G[k].tag)}', img: '/games/btn-${k}.png' },`],
  ['app/daily/page.js', (l) => l.startsWith("  { key: 'pricer', name: 'Pricer', path: '/pricer'"), (k) => `  { key: '${k}', name: '${G[k].name}', path: '/${k}', tag: '${esc(G[k].tag)}', accent: '#15803d', bg: '#dcfce7', border: 'rgba(21,128,61,0.35)', src: ${UP(k)} },`],
  ['app/daily/page.js', (l) => l.startsWith('const PRICER = PRICER_FULL.map('), (k) => `const ${UP(k)} = ${UP(k)}_FULL.map(({ num, quizId, live, dateLabel }) => ({ num, quizId, live, dateLabel, sunday: false }));`],
  ['app/daily/page.js', (l) => l.startsWith("import { PUZZLES as PRICER_FULL } from '../pricer/puzzles';"), (k) => `import { PUZZLES as ${UP(k)}_FULL } from '../${k}/puzzles';`],
  ['lib/daily-slate.js', (l) => l.startsWith("import { PUZZLES as P_pricer } from '@/app/pricer/puzzles';"), (k) => `import { PUZZLES as ${P(k)} } from '@/app/${k}/puzzles';`],
  ['lib/daily-slate.js', (l) => l === '  pricer: P_pricer,', (k) => `  ${k}: ${P(k)},`],
  ...['app/api/quiz/sunday-slate/route.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js'].map((f) => [f, (l) => l.startsWith("import { PUZZLES as P_pricer } from '@/app/pricer/puzzles';"), (k) => `import { PUZZLES as ${P(k)} } from '@/app/${k}/puzzles';`]),
]) {
  const src = read(file);
  const lines = src.split('\n');
  const hits = lines.filter(find);
  if (hits.length !== 1) throw new Error(`${file}: pricer anchor matched ${hits.length} lines`);
  edit(file, hits[0], hits[0] + '\n' + NEW.map(make).join('\n'));
}
for (const f of ['app/api/quiz/sunday-slate/route.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js']) {
  edit(f, `whittle: P_whittle, pricer: P_pricer,`, `whittle: P_whittle, pricer: P_pricer, ${NEW.map((k) => `${k}: ${P(k)},`).join(' ')}`);
}

// 4. lists that name Pricer inline
const LIST = NEW.map((k) => `'${k}'`).join(', ');
edit('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['pricer', `, `const LAUNCH_PIN = { keys: ['pricer', ${LIST}, `);
edit('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['pricer', `, `const LAUNCH_PIN = { keys: ['pricer', ${LIST}, `);
for (const f of ['app/DailyGamesGrid.jsx', 'app/daily/DailyArchiveClient.jsx']) {
  edit(f, `'blitz', 'blitzed', 'sums', 'pricer'] },`, `'blitz', 'blitzed', 'sums', 'pricer', ${LIST}] },`);
}
edit('app/daily/DailyArchiveClient.jsx', `bracket: '#fb923c', pricer: '#4ade80',`, `bracket: '#fb923c', pricer: '#4ade80', ${NEW.map((k) => `${k}: '${G[k].dark}',`).join(' ')}`);
edit('app/api/quiz/daily-status/route.js', `|yose|crib|pricer)-`, `|yose|crib|pricer|${NEW.join('|')})-`);
edit('app/quizzes/QuizHomeClient.jsx', `|yose|crib|pricer)-`, `|yose|crib|pricer|${NEW.join('|')})-`);
edit('lib/quiz-catalog.js', `'yose', 'crib', 'pricer']);`, `'yose', 'crib', 'pricer', ${LIST}]);`);
edit('app/DailySlateRail.jsx', `'whittle', 'pricer', 'diag',`, `'whittle', 'pricer', ${LIST}, 'diag',`);
edit('lib/sitemap-entries.js', `'whittle', 'pricer', 'diag',`, `'whittle', 'pricer', ${LIST}, 'pricecheck', 'diag',`);
edit('lib/loft.js', `'polka', 'pricer', 'queen',`, `'polka', 'pricer', ${LIST}, 'queen',`);

// 5. the Numbers landing page
edit('lib/puzzle-categories.js', `description: 'Nine free daily number puzzles: a price-guessing game,`, `description: 'Thirteen free daily number puzzles: five price-guessing games,`);
edit('lib/puzzle-categories.js', `lede: 'Nine number puzzles, one new board in each every day. A price you have five guesses to pin down,`, `lede: 'Thirteen number puzzles, one new board in each every day. Five prices to pin down (a product, a vehicle, a home, a trip and a luxury piece),`);
edit('lib/puzzle-categories.js', `'carve', 'cipher', 'sums', 'pricer'],`, `'carve', 'cipher', 'sums', 'pricer', ${LIST}],`);
edit('lib/puzzle-categories.js', `cipher: 'Cryptarithm', pricer: 'Price guessing',`, `cipher: 'Cryptarithm', pricer: 'Price guessing', dealer: 'Car prices', realtor: 'Home prices', agent: 'Travel prices', curator: 'Luxury prices',`);
edit('lib/puzzle-categories.js', `, and Pricer puts a car or a watch up for guessing.']`, `.']`);

// 6. sets, groups, glyphs
edit('lib/finish-sets.js', `  { name: 'Price and sums', cat: 'Numbers', keys: ['pricer', 'crunch', 'tally'] },`,
  `  { name: 'Price and sums', cat: 'Numbers', keys: ['pricer', 'crunch', 'tally'] },\n  { name: 'Big tickets', cat: 'Numbers', keys: ['dealer', 'realtor', 'curator'] },\n  { name: 'Prices on the move', cat: 'Numbers', keys: ['agent', 'dealer', 'pricer'] },`);
edit('lib/daily-groups.js', `  { name: 'Mental math', cat: 'Numbers', keys: ['blitz', 'blitzed', 'calc', 'crunch', 'pricer'] },`,
  `  { name: 'Mental math', cat: 'Numbers', keys: ['blitz', 'blitzed', 'calc', 'crunch'] },\n  { name: 'Price Check', cat: 'Numbers', keys: ['pricer', 'dealer', 'realtor', 'agent', 'curator'] },`);
edit('lib/game-glyphs.js', `  pricer: 'M3 11V4h7l10 10-7 7zM7.5 7a.5.5 0 1 0 .01 0',            // a price tag`,
  `  pricer: 'M3 11V4h7l10 10-7 7zM7.5 7a.5.5 0 1 0 .01 0',            // a price tag
  dealer: 'M3 16v-3l2.5-5h13L21 13v3zM3 16v2h3v-2M18 16v2h3v-2M7 13h.01M17 13h.01M6 10h12', // a car
  realtor: 'M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-6h4v6',            // a house
  agent: 'M2 15l20-7-3 9-6-3-2 5-2-6zM13 14l9-6',                   // a paper plane
  curator: 'M4 3h16v18H4zM7 6h10v12H7zM9 16l3-4 2 2 2-3',            // a framed picture`);

// 7. the leaderboard's closeness tiebreak covers the whole family
edit('lib/quiz-anon.js', `const pricer = typeof qid === 'string' && qid.startsWith('pricer-');`, `const pricer = typeof qid === 'string' && /^(pricer|dealer|realtor|agent|curator)-/.test(qid);`);
edit('lib/daily-combined.js', `const pricer = all.length ? (typeof all[0].quiz_id === 'string' && all[0].quiz_id.startsWith('pricer-')) : false;`, `const pricer = all.length ? (typeof all[0].quiz_id === 'string' && /^(pricer|dealer|realtor|agent|curator)-/.test(all[0].quiz_id)) : false;`);

// 8. verify-circuits: the family is a run now
edit('scripts/verify-circuits.mjs', `  pricer: 'not in a circuit yet: a price guess has no natural partner among the number games (owner call)',\n`, ``);
edit('scripts/verify-circuits.mjs', `  biz: 45,\n};`, `  biz: 45,\n  // The Price Check family, estimated (2026-10-01): five guesses, about a minute each.\n  pricer: 60, dealer: 60, realtor: 60, agent: 60, curator: 60,\n};`);

console.log(`wire-price-family: ${applied} edits applied, ${skipped} already present`);
