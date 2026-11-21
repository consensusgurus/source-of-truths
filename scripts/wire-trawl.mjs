// scripts/wire-trawl.mjs: wires Trawl, the enormous daily word search (Word,
// launched 2026-11-20), into every registry, beside Scour wherever Scour sits.
//
// A TALLY game like Mural (unit: finds, solvesOnScore, bestRun): the daily
// result is the player's running total of finds, filed by /api/trawl as a new
// quiz_results row each time it grows (at most every ten minutes, or forced
// when the page is left), so the best row of the day is the latest. Trawl's own
// standings, on the page, rank unique finds first (owner, 2026-11-20).
// NO SUNDAY EDITION: every day is already enormous.
//
// Anchored edits: every anchor must match EXACTLY ONCE or the script throws,
// and an edit whose insertion is already present is skipped, so a re-run is safe.
//   node scripts/wire-trawl.mjs [dir]
import fs from 'fs';
import path from 'path';
const root = process.argv[2] || '.';
let applied = 0, skipped = 0;
const rd = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const wr = (f, s) => fs.writeFileSync(path.join(root, f), s);
function sub(f, anchor, repl) {
  const s = rd(f);
  if (s.includes(repl)) { skipped++; return; }
  const n = s.split(anchor).length - 1;
  if (n !== 1) throw new Error(`${f}: anchor matched ${n} times\n  ${anchor.slice(0, 160)}`);
  wr(f, s.replace(anchor, () => repl)); applied++;
}
function afterLine(f, marker, lines) {
  const s = rd(f);
  if (s.includes(lines[0])) { skipped++; return; }
  const parts = s.split('\n');
  const idx = parts.map((l, i) => (l.includes(marker) ? i : -1)).filter((i) => i >= 0);
  if (idx.length !== 1) throw new Error(`${f}: line marker matched ${idx.length} times: ${marker}`);
  parts.splice(idx[0] + 1, 0, lines.join('\n'));
  wr(f, parts.join('\n')); applied++;
}
// Add a key after another key inside a list literal on one line: `'scour', ` -> `'scour', 'trawl', `.
function addKey(f, before, key, quote = "'") {
  const s = rd(f);
  const a = `${quote}${before}${quote}, `;
  const r = `${quote}${before}${quote}, ${quote}${key}${quote}, `;
  if (s.includes(r)) { skipped++; return; }
  const n = s.split(a).length - 1;
  if (n !== 1) throw new Error(`${f}: key anchor ${a} matched ${n} times`);
  wr(f, s.replace(a, () => r)); applied++;
}
function addAlt(f) {
  const s = rd(f);
  if (s.includes('|trawl|')) { skipped++; return; }
  const n = s.split('|scour|').length - 1;
  if (n !== 1) throw new Error(`${f}: |scour| matched ${n} times`);
  wr(f, s.replace('|scour|', '|scour|trawl|')); applied++;
}

const TAG = 'The giant word search';
const TAGLONG = 'Hundreds of words on one big topic in one enormous grid';
const HOW = 'One enormous word search a day: hundreds of entries from one big topic, such as 700 movie titles, hidden in one huge grid in all eight directions. Everyone plays the same grid, each find shows how many players have found it, and the standings rank unique finds first and total finds second. No clock and no Give up.';
const BLURB = 'Hundreds of hidden words on one big topic in one enormous shared grid. Find the ones nobody else finds.';
const SHORT = 'A giant word search: hundreds of words, one topic.';
const COLOR = '#155e75', NAVY = '#67e8f9', BG = '#e0f7fa', BORDER = 'rgba(21,94,117,0.38)';

// 1. registry row and premiere
afterLine('lib/daily-games.js', "{ key: 'scour', miss: null, name: 'Scour'", [
  `  { key: 'trawl', miss: null, unit: 'finds', solvesOnScore: true, bestRun: true, name: 'Trawl', cat: 'Word', tag: '${TAG}', tagLong: '${TAGLONG}', how: '${HOW}', color: '${COLOR}', colorNavy: '${NAVY}' },`]);
afterLine('lib/daily-games.js', 'export const PREMIERES = [', [
  `  { key: 'trawl', from: '2026-11-20', until: '2026-11-27' },`]);

// 2. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['trawl', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['trawl', `);
afterLine('app/DailyEndCard.jsx', "  scour: { accent: '#0369a1', badgeBg: '#0369a1', badgeInk: T.white, Fin: Trophy },", [
  `  trawl: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: Trophy },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'scour', cat: 'word',", [
  `  { key: 'trawl', cat: 'word',      name: 'Trawl', tag: '${TAG}',       blurb: '${BLURB}', href: '/trawl' },`]);

// 3. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'scour', href: '/scour'", [
  `  { key: 'trawl', href: '/trawl', name: 'Trawl', tag: 'the giant word search', store: 'sot_trawl_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'scour', href: '/scour', name: 'Scour'", [
  `  { key: 'trawl', href: '/trawl', name: 'Trawl', tag: '${TAG}', img: '/games/btn-trawl.png' },`]);
sub('app/DailyGamesGrid.jsx', `'scram', 'scour', 'arcos'`, `'scram', 'scour', 'trawl', 'arcos'`);
afterLine('app/DailyStrip.jsx', "{ key: 'scour', href: '/scour', name: 'Scour'", [
  `  { key: 'trawl', href: '/trawl', name: 'Trawl', img: '/games/btn-trawl.png', store: 'sot_trawl_day', tag: "${TAG}" , cat: 'Word' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { `, `const ACCENTS = { trawl: '${NAVY}', `);
sub('app/DailyStrip.jsx', `const TCOL = { `, `const TCOL = { trawl: '${COLOR}', `);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as SCOUR_FULL } from '../scour/puzzles';`,
  `import { PUZZLES as SCOUR_FULL } from '../scour/puzzles';\nimport { PUZZLES as TRAWL_FULL } from '../trawl/puzzles';`);
afterLine('app/archive/page.js', 'const SCOUR = SCOUR_FULL.map(', [
  'const TRAWL = TRAWL_FULL.map(({ num, quizId, live, dateLabel }) => ({ num, quizId, live, dateLabel, sunday: false }));']);
afterLine('app/archive/page.js', "{ key: 'scour', name: 'Scour', path: '/scour'", [
  `  { key: 'trawl', name: 'Trawl', path: '/trawl', tag: '${TAG}', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: TRAWL },`]);

// 5. the daily puzzle maps (no Sunday slate)
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js']) {
  sub(f, `import { PUZZLES as P_scour } from '@/app/scour/puzzles';`,
    `import { PUZZLES as P_scour } from '@/app/scour/puzzles';\nimport { PUZZLES as P_trawl } from '@/app/trawl/puzzles';`);
  sub(f, `scour: P_scour, `, `scour: P_scour, trawl: P_trawl, `);
}

// 6. alternations, rails, catalog, loft
addAlt('app/api/quiz/daily-status/route.js');
addAlt('app/quizzes/QuizHomeClient.jsx');
addKey('app/DailySlateRail.jsx', 'scour', 'trawl');
addKey('lib/quiz-catalog.js', 'scour', 'trawl');
sub('lib/loft.js', `'idiom', 'scour',`, `'idiom', 'scour', 'trawl',`);

// 7. skills, glyph, preview, blurbs, difficulty, families, xp
sub('lib/daily-skills.js', `scour: ['speed', 'lang'],`, `scour: ['speed', 'lang'], trawl: ['lang', 'mem'],`);
afterLine('lib/game-glyphs.js', "  scour: 'M3 4h10M3 8h7M3 12h5", [
  "  trawl: 'M3 4h18M3 8h18M3 12h11M3 16h7M13 15a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M19.8 17.8L22 20',  // a page of letters under a magnifier: the big search"]);
sub('app/GamePreview.jsx', `scour: Search, `, `scour: Search, trawl: Search, `);
afterLine('lib/game-blurbs.js', '  scour: "', [`  trawl: "${SHORT}",`]);
afterLine('lib/daily-difficulty.js', '  scour: 1, // owner, 2026-10-18', [`  trawl: 1, // a starting estimate (2026-11-20): any find scores`]);
sub('lib/daily-families.js', `['strata', 'scour', 'fill'],`, `['strata', 'scour', 'trawl', 'fill'],`);
addKey('lib/quiz-xp.js', 'scour', 'trawl');
afterLine('lib/challenge-metric.js', "  mural: { unit: 'points', one: 'point', dir: 'high', say: 'scored' },", [
  "  trawl: { unit: 'finds', one: 'find', dir: 'high', say: 'found' },"]);

// 8. groups, sets, the word-puzzles page, share card
// (Word hunts, the finish set, is already four games: Trawl joins Theme fits instead.)
sub('lib/finish-sets.js', `{ name: 'Theme fits', cat: 'Word', keys: ['fill', 'scour', 'scram'] },`, `{ name: 'Theme fits', cat: 'Word', keys: ['fill', 'scour', 'scram', 'trawl'] },`);
addKey('lib/puzzle-categories.js', 'scour', 'trawl');
sub('lib/puzzle-categories.js', `scour: 'Word search', `, `scour: 'Word search', trawl: 'Giant shared word search', `);
sub('lib/og-stage-cards.js', `export const HAND_BAKED = new Set([`, `export const HAND_BAKED = new Set(['trawl', `);

const PCW = 'lib/puzzle-categories.js';
sub(PCW, `description: 'Twenty-six free daily word games in one place: grammar, vocabulary and spelling quizzes, word ladders, a compound-word chain, themed scrambles, a word search,`,
  `description: 'Twenty-seven free daily word games in one place: grammar, vocabulary and spelling quizzes, word ladders, a compound-word chain, themed scrambles, two word searches (one enormous),`);
sub(PCW, `lede: 'Twenty-six word games, one new puzzle in each every day.`, `lede: 'Twenty-seven word games, one new puzzle in each every day.`);
sub(PCW, `themed scrambles, a big themed word search, a hotter-or-colder`, `themed scrambles, a big themed word search and an enormous one the whole site shares, a hotter-or-colder`);
sub(PCW, `Scour hides a theme\\u2019s worth of words in a 15x15 grid,`, `Scour hides a theme\\u2019s worth of words in a 15x15 grid, Trawl hides hundreds from one big topic in a grid a hundred letters across and ranks you on the ones nobody else found,`);

// GROUPS: Letter tiles keeps the three rack games; Scour, Trawl and Strata, the
// three games about finding words hidden in a grid, become Word hunts.
sub('lib/daily-groups.js', `{ name: 'Letter tiles', cat: 'Word', keys: ['tuck', 'babel', 'lode', 'strata', 'scour'] },`,
  `{ name: 'Letter tiles', cat: 'Word', keys: ['tuck', 'babel', 'lode'] },\n  { name: 'Word hunts', cat: 'Word', keys: ['scour', 'trawl', 'strata'] },`);
const PS = 'lib/puzzle-sets.js';
sub(PS, `description: 'Five free daily word games where everyone gets the same letters: a fourteen-tile rack, a bag-empty endgame, a seven-letter honeycomb, a word excavation and a themed word search. New boards at midnight Eastern, no signup.',`,
  `description: 'Three free daily word games where everyone gets the same letters: a fourteen-tile rack, a bag-empty endgame and a seven-letter honeycomb. New boards at midnight Eastern, no signup.',`);
sub(PS, `lede: 'Five games about what you can build or find in a fixed set of letters, and the set is the same for everybody, so the board is a straight comparison of what each player found. A fourteen-tile rack, a bag-empty endgame, a seven-letter honeycomb, a dig for buried words and a big themed word search.',`,
  `lede: 'Three games about what you can build from a fixed set of letters, and the set is the same for everybody, so the board is a straight comparison of what each player found. A fourteen-tile rack, a bag-empty endgame and a seven-letter honeycomb.',`);
sub(PS, ` Strata buries words in layers and asks you to dig them out. Scour hides a day\\u2019s worth of themed words in a 15x15 grid, every one of them exactly once.',`, `',`);
sub(PS, `['Are they free?', 'All five, every day, no account required.'],
    ],
  },
  {
    name: 'Letter shuffles'`, `['Are they free?', 'All three, every day, no account required.'],
    ],
  },
  {
    name: 'Word hunts', slug: 'word-hunts',
    eyebrow: 'Free daily word searches',
    title: 'Free Daily Word Searches: Themed, Giant and Buried Words | Mind Loft',
    h1: 'Free Daily Word Searches: Themed, Giant and Buried Words',
    description: 'Three free daily word hunts: a themed word search on the clock, an enormous word search with hundreds of words that everyone shares, and a dig for buried words. New boards at midnight Eastern, no signup.',
    lede: 'Three games about finding words hidden in a grid. Scour is the quick one, a theme and a 15x15 grid against the clock. Trawl is enormous, hundreds of entries from one big topic in a grid a hundred letters across, and ranks you on the ones nobody else found. Strata buries words in layers for you to dig out.',
    how: [
      'Scour hides a day\\u2019s worth of themed words in a 15x15 grid, every one of them exactly once, and the clock breaks ties. Trawl is one huge shared grid: each find shows how many players found it before you, and the standings rank unique finds first. Strata buries words in layers and asks you to dig them out.',
    ],
    faq: [
      ['Are they free?', 'All three, every day, no account required.'],
    ],
  },
  {
    name: 'Letter shuffles'`);

console.log(`wire-trawl: ${applied} edits applied, ${skipped} already present`);
