// scripts/wire-scram.mjs — wires Scram, the daily themed word scramble (Word),
// into every registry, beside Garble.
//
// Anchored edits: every anchor must match EXACTLY ONCE or the script throws,
// and an edit whose insertion is already present is skipped, so a re-run is safe.
//   node scripts/wire-scram.mjs <dir>
import fs from 'fs';
import path from 'path';
const root = process.argv[2] || '.';
let applied = 0, skipped = 0;
function rd(f) { return fs.readFileSync(path.join(root, f), 'utf8'); }
function wr(f, s) { fs.writeFileSync(path.join(root, f), s); }
function sub(f, anchor, repl) {
  const s = rd(f);
  if (s.includes(repl)) { skipped++; return; }
  const n = s.split(anchor).length - 1;
  if (n !== 1) throw new Error(`${f}: anchor matched ${n} times\n  ${anchor.slice(0, 160)}`);
  wr(f, s.replace(anchor, repl)); applied++;
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

const TAG = 'Ten themed scrambles';
const HOW = 'One broad theme a day and ten scrambled answers from it. Only the scramble\\u2019s letters are live on the keyboard, a full answer checks itself, and you can move between the ten freely. Score is answers solved; time breaks ties.';
const BLURB = 'One theme, ten scrambled answers, one clock. Cities one day, food or first names the next. Unscramble all ten as fast as you can.';
const COLOR = '#be123c', NAVY = '#fb7185', BG = '#fde8ec', BORDER = 'rgba(190,18,60,0.4)';

// 1. lib/daily-games.js
afterLine('lib/daily-games.js', "{ key: 'garble', miss: 'Miss', name: 'Garble', cat: 'Word'", [
  `  { key: 'scram', miss: null, name: 'Scram', cat: 'Word', tag: '${TAG}', how: '${HOW}', color: '${COLOR}', colorNavy: '${NAVY}' },`]);
afterLine('lib/daily-games.js', "{ key: 'swindle', from: '2026-10-14', until: '2026-10-18' },", [
  `  { key: 'scram', from: '2026-10-14', until: '2026-10-18' },`]);

// 2. lib/sunday-editions.js
afterLine('lib/sunday-editions.js', '//   garble  every answer is six letters instead of five (from 2026-07-26)', [
  '//   scram   the long-answer day: every answer eight to twelve letters, often two words']);
sub('lib/sunday-editions.js', `'garble', 'dating',`, `'garble', 'scram', 'dating',`);

// 3. app/DailyEndCard.jsx
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['scram', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['scram', `);
afterLine('app/DailyEndCard.jsx', "  garble: { accent: '#b7791f', badgeBg: GOLD, badgeInk: '#5c4a06', Fin: Trophy },", [
  `  scram: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: Trophy },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'garble', cat: 'word',      name: 'Garble',", [
  `  { key: 'scram', cat: 'word',      name: 'Scram', tag: '${TAG}',       blurb: '${BLURB}', href: '/scram' },`]);

// 4. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'garble', href: '/garble'", [
  `  { key: 'scram', href: '/scram', name: 'Scram', tag: 'ten themed scrambles', store: 'sot_scram_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'garble', href: '/garble'", [
  `  { key: 'scram', href: '/scram', name: 'Scram', tag: '${TAG}', img: '/games/btn-scram.png' },`]);
sub('app/DailyGamesGrid.jsx', `'shards', 'garble', 'links', 'stet',`, `'shards', 'garble', 'scram', 'links', 'stet',`);
afterLine('app/DailyStrip.jsx', "{ key: 'garble', href: '/garble'", [
  `  { key: 'scram', href: '/scram', name: 'Scram', img: '/games/btn-scram.png', store: 'sot_scram_day', tag: "${TAG}" , cat: 'Word' },`]);
sub('app/DailyStrip.jsx', `garble: '#f0c95a',`, `garble: '#f0c95a', scram: '${NAVY}',`);
sub('app/DailyStrip.jsx', `garble: '#8a6d1a',`, `garble: '#8a6d1a', scram: '${COLOR}',`);

// 5. archive
sub('app/archive/page.js', `import { PUZZLES as GARBLE } from '../garble/puzzles';`,
  `import { PUZZLES as GARBLE } from '../garble/puzzles';\nimport { PUZZLES as SCRAM_FULL } from '../scram/puzzles';`);
afterLine('app/archive/page.js', 'const SWINDLE = SWINDLE_FULL.map(', [
  'const SCRAM = SCRAM_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));']);
afterLine('app/archive/page.js', "{ key: 'garble', name: 'Garble', path: '/garble'", [
  `  { key: 'scram', name: 'Scram', path: '/scram', tag: 'Ten themed scrambles', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: SCRAM },`]);

// 6. the four puzzle-map registries
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_garble } from '@/app/garble/puzzles';`,
    `import { PUZZLES as P_garble } from '@/app/garble/puzzles';\nimport { PUZZLES as P_scram } from '@/app/scram/puzzles';`);
  sub(f, `garble: P_garble,`, `garble: P_garble, scram: P_scram,`);
}

// 7. alternations, rails, catalog, loft
sub('app/api/quiz/daily-status/route.js', `|cell|swindle|`, `|cell|swindle|scram|`);
sub('app/quizzes/QuizHomeClient.jsx', `|cell|swindle|`, `|cell|swindle|scram|`);
sub('app/DailySlateRail.jsx', `'hold', 'cell', 'swindle',`, `'hold', 'cell', 'swindle', 'scram',`);
sub('lib/quiz-catalog.js', `'swindle', 'pricer',`, `'swindle', 'scram', 'pricer',`);
sub('lib/loft.js', `'hold', 'cell', 'swindle',`, `'hold', 'cell', 'swindle', 'scram',`);

// 8. glyph and finish beat
afterLine('lib/game-glyphs.js', "  garble: 'M4 8h9M4 16h9M20 8l-4 4 4 4M16 12H8',", [
  "  scram: 'M3 4h5v5H3zM10 6h5v5h-5zM17 3h4.5v5H17zM3 19h4M10 19h4M17 19h4',  // three tumbled tiles over three blanks"]);
afterLine('lib/finish-beats.js', '  garble: {', ["  scram: grid('.sc-slot', false),"]);

// 9. groups, sets, IQ
sub('lib/daily-groups.js', `{ name: 'Letter shuffles', cat: 'Word', keys: ['rung', 'garble', 'barter'] },`, `{ name: 'Letter shuffles', cat: 'Word', keys: ['rung', 'garble', 'scram', 'barter'] },`);
sub('lib/finish-sets.js', `{ name: 'Letter shuffles', cat: 'Word', keys: ['rung', 'garble', 'barter'] },`, `{ name: 'Letter shuffles', cat: 'Word', keys: ['rung', 'garble', 'scram', 'barter'] },`);
sub('lib/quiz-xp.js', `'potluck', 'feud']);`, `'potluck', 'feud', 'scram']);`);

// 10. the word-games landing page
sub('lib/puzzle-categories.js', `title: 'Free Daily Word Games: Word Puzzles, Ladders, Scrambles and Crosswords | Mind Loft',\n    h1: 'Free Daily Word Games: Puzzles, Ladders, Scrambles and Crosswords',\n    description: 'Seventeen free daily word games in one place: word ladders, a compound-word chain, scrambles,`,
  `title: 'Free Daily Word Games: Word Puzzles, Ladders, Scrambles and Crosswords | Mind Loft',\n    h1: 'Free Daily Word Games: Puzzles, Ladders, Scrambles and Crosswords',\n    description: 'Eighteen free daily word games in one place: word ladders, a compound-word chain, themed scrambles,`);
sub('lib/puzzle-categories.js', `lede: 'Seventeen word games, one new puzzle in each every day. Ladders, a compound-word chain, scrambles,`,
  `lede: 'Eighteen word games, one new puzzle in each every day. Ladders, a compound-word chain, themed scrambles,`);
sub('lib/puzzle-categories.js', `keys: ['garble', 'rung', 'hinge', 'links',`, `keys: ['garble', 'scram', 'rung', 'hinge', 'links',`);
sub('lib/puzzle-categories.js', `garble: 'Word scramble', rung: 'Word ladder',`, `garble: 'Word scramble', scram: 'Themed word scramble', rung: 'Word ladder',`);
sub('lib/puzzle-categories.js', `Garble hands you five scrambles, Rung asks`, `Garble hands you five scrambles, Scram ten from one theme against the clock, Rung asks`);
sub('lib/puzzle-categories.js', `start: 'Garble or Rung if you want something quick.`, `start: 'Scram, Garble or Rung if you want something quick.`);
sub('lib/puzzle-categories.js', `'Garble goes to six-letter words, Tuck`, `'Garble goes to six-letter words, Scram to answers of eight to twelve letters, Tuck`);

// 11. CLAUDE.md
afterLine('CLAUDE.md', '| Garble | every answer is six letters instead of five (from 2026-07-26) |', [
  '| Scram | every answer eight to twelve letters, often two words, from themes deep enough in long answers (from launch, 2026-10-18) |']);
sub('CLAUDE.md', `## Sumo is the GREATER-THAN SUDOKU, and its signs are the grid lines (launched 2026-10-13)`,
`## Scram is the THEMED WORD SCRAMBLE, raced on the clock (launched 2026-10-14)

One broad theme a day (Cities, Countries, U.S. States, Food, Animals, Men's Names, Women's Names, Jobs,
Around the House, Sports and Games, Clothing, Nature, Music, The Human Body) and ten scrambled answers from
it. Route \`/scram\`, key \`scram\`, Word category, legacy hue rose #be123c. Look: option B of the "Scram
Input Options" canvas, the LIT KEYBOARD.

- **Only the scramble's letters are live.** The keyboard dims every other letter, and a small count marks a
  letter the answer needs more than once. So every full entry uses exactly the right letters, and a full
  wrong entry can only be a wrong ORDER: it shakes and clears. A full answer checks itself; there is no Enter.
- **Back, Next, numbered pips and Skip** (owner, 2026-10-14). The ten can be played in any order; letters
  typed into an answer stay when you leave it. Skip jumps to the next answer still open. On desktop the
  physical keyboard types and the arrow keys move.
- **Race the clock: score is answers solved out of ten, time breaks ties.** Registry \`miss: null\`, the
  client posts \`guessesUsed: 0\`, so the board goes straight from score to time. Wrong orders are counted
  locally only. In \`XP_LINEAR_DAILIES\`: ten independent answers pay linearly.
- **One right answer per scramble.** A word whose letters also spell another member of its theme is never
  dealt (LEMON/MELON, DIANA/NADIA, TOKYO/KYOTO). \`scram-pools.mjs\` carries an \`alsoValid\` list per theme of
  real members never dealt, so a clash whose other side the pool does not otherwise carry is still caught.
- **The ramp is answer length**: Mon 5-6, Tue 5-7, Wed 6-7, Thu 6-8, Fri 7-8, Sat 7-9, Sunday Edition 8-12,
  dealt only from themes flagged \`sunday\` (the names pools are too thin in long names). No answer is dealt
  twice in the bank, and a theme waits five days before it returns.
- **The scramble hides the answer**: never the answer, never its first letter first, at most a quarter of the
  letters in place, and no three-letter run of the answer intact. A word no shuffle can hide (REFEREE) is
  dropped from the pool rather than dealt weakly.
- \`scripts/gen-scram.mjs\` deals \`app/scram/puzzles.js\` from \`scripts/scram-pools.mjs\`; extend with
  \`--until <date>\`, which keeps every existing board byte for byte. \`scripts/verify-scram.mjs\` is independent
  (imports nothing from the generator) and re-checks every rule above. Bank 2026-10-14 to 2026-12-31.
- Client \`app/scram/ScramClient.jsx\` is built off GarbleClient's frame. Tile art \`scripts/gen-scram-tile.py\`.

## Sumo is the GREATER-THAN SUDOKU, and its signs are the grid lines (launched 2026-10-13)`);

console.log(`wire-scram: ${applied} edits applied, ${skipped} already present`);
