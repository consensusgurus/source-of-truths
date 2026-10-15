// scripts/wire-scour.mjs: wires Scour, the daily themed word search (Word),
// into every registry, beside Scram.
//
// Anchored edits: every anchor must match EXACTLY ONCE or the script throws,
// and an edit whose insertion is already present is skipped, so a re-run is safe.
//   node scripts/wire-scour.mjs <dir>
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

const TAG = 'The daily word search';
const HOW = 'One theme a day and a big 15x15 grid with 14 to 18 words from it hidden inside, in any of eight directions. Drag across a word or tap its first and last letters; a wrong line costs nothing. Score is words found; time breaks ties.';
const BLURB = 'One theme, one big grid, every word hidden exactly once. Drag across the words or tap their first and last letters, and find them all against the clock.';
const COLOR = '#0369a1', NAVY = '#7dd3fc', BG = '#e0f2fe', BORDER = 'rgba(3,105,161,0.38)';

// 1. lib/daily-games.js
afterLine('lib/daily-games.js', "{ key: 'scram', miss: null, name: 'Scram', cat: 'Word'", [
  `  { key: 'scour', miss: null, name: 'Scour', cat: 'Word', tag: '${TAG}', how: '${HOW}', color: '${COLOR}', colorNavy: '${NAVY}' },`]);
afterLine('lib/daily-games.js', "{ key: 'scram', from: '2026-10-14', until: '2026-10-18' },", [
  `  { key: 'scour', from: '2026-10-15', until: '2026-10-19' },`]);

// 2. lib/sunday-editions.js
afterLine('lib/sunday-editions.js', '//   scram   the long-answer day', [
  '//   scour   an 18x18 grid with twenty-six words in all eight directions']);
sub('lib/sunday-editions.js', `'garble', 'scram', 'dating',`, `'garble', 'scram', 'scour', 'dating',`);

// 3. end card, launch pin, order
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['scour', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['scour', `);
afterLine('app/DailyEndCard.jsx', "  scram: { accent: '#be123c', badgeBg: '#be123c', badgeInk: T.white, Fin: Trophy },", [
  `  scour: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: Trophy },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'scram', cat: 'word',      name: 'Scram',", [
  `  { key: 'scour', cat: 'word',      name: 'Scour', tag: '${TAG}',       blurb: '${BLURB}', href: '/scour' },`]);

// 4. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'scram', href: '/scram'", [
  `  { key: 'scour', href: '/scour', name: 'Scour', tag: 'the daily word search', store: 'sot_scour_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'scram', href: '/scram'", [
  `  { key: 'scour', href: '/scour', name: 'Scour', tag: '${TAG}', img: '/games/btn-scour.png' },`]);
sub('app/DailyGamesGrid.jsx', `'shards', 'garble', 'scram', 'links',`, `'shards', 'garble', 'scram', 'scour', 'links',`);
afterLine('app/DailyStrip.jsx', "{ key: 'scram', href: '/scram'", [
  `  { key: 'scour', href: '/scour', name: 'Scour', img: '/games/btn-scour.png', store: 'sot_scour_day', tag: "${TAG}" , cat: 'Word' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { window:`, `const ACCENTS = { scour: '${NAVY}', window:`);
sub('app/DailyStrip.jsx', `const TCOL = { window:`, `const TCOL = { scour: '${COLOR}', window:`);

// 5. archive
sub('app/archive/page.js', `import { PUZZLES as SCRAM_FULL } from '../scram/puzzles';`,
  `import { PUZZLES as SCRAM_FULL } from '../scram/puzzles';\nimport { PUZZLES as SCOUR_FULL } from '../scour/puzzles';`);
afterLine('app/archive/page.js', 'const SCRAM = SCRAM_FULL.map(', [
  'const SCOUR = SCOUR_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));']);
afterLine('app/archive/page.js', "{ key: 'scram', name: 'Scram', path: '/scram'", [
  `  { key: 'scour', name: 'Scour', path: '/scour', tag: 'The daily word search', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: SCOUR },`]);

// 6. the four puzzle-map registries
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_scram } from '@/app/scram/puzzles';`,
    `import { PUZZLES as P_scram } from '@/app/scram/puzzles';\nimport { PUZZLES as P_scour } from '@/app/scour/puzzles';`);
  sub(f, `scram: P_scram,`, `scram: P_scram, scour: P_scour,`);
}

// 7. alternations, rails, catalog, loft
sub('app/api/quiz/daily-status/route.js', `|swindle|scram|`, `|swindle|scram|scour|`);
sub('app/quizzes/QuizHomeClient.jsx', `|swindle|scram|`, `|swindle|scram|scour|`);
sub('app/DailySlateRail.jsx', `'swindle', 'scram',`, `'swindle', 'scram', 'scour',`);
sub('lib/quiz-catalog.js', `'swindle', 'scram',`, `'swindle', 'scram', 'scour',`);
sub('lib/loft.js', `'cell', 'swindle', 'scram',`, `'cell', 'swindle', 'scram', 'scour',`);

// 8. glyph and finish beat
afterLine('lib/game-glyphs.js', "  scram: 'M3 4h5v5H3z", [
  "  scour: 'M3 4h10M3 8h7M3 12h5M9.5 14a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0M17.2 17.2L21 21',  // rows of letters under a magnifier"]);
afterLine('lib/finish-beats.js', "  scram: grid('.sc-slot', false),", ["  scour: xword('.so-cell'),"]);

// 9. groups, sets, IQ
sub('lib/daily-groups.js', `{ name: 'Letter tiles', cat: 'Word', keys: ['tuck', 'babel', 'lode', 'strata'] },`, `{ name: 'Letter tiles', cat: 'Word', keys: ['tuck', 'babel', 'lode', 'strata', 'scour'] },`);
sub('lib/finish-sets.js', `{ name: 'Word hunts', cat: 'Word', keys: ['lode', 'strata', 'shards'] },`, `{ name: 'Word hunts', cat: 'Word', keys: ['lode', 'strata', 'scour', 'shards'] },`);
sub('lib/quiz-xp.js', `'potluck', 'feud', 'scram']);`, `'potluck', 'feud', 'scram', 'scour']);`);

// 10. the letter tiles set page (lib/puzzle-sets.js)
sub('lib/puzzle-sets.js', `description: 'Four free daily tile word games where everyone gets the same letters: a fourteen-tile rack scored like a board game, a bag-empty endgame with a knowable best line, a seven-letter honeycomb that pays more for rarer words, and a word excavation. New racks at midnight Eastern, no signup.',`,
  `description: 'Five free daily word games where everyone gets the same letters: a fourteen-tile rack, a bag-empty endgame, a seven-letter honeycomb, a word excavation and a themed word search. New boards at midnight Eastern, no signup.',`);
sub('lib/puzzle-sets.js', `lede: 'Four games about what you can build from a fixed set of letters, and the set is the same for everybody, so the board is a straight comparison of what each player found. A fourteen-tile rack, a bag-empty endgame, a seven-letter honeycomb and a dig for buried words.',`,
  `lede: 'Five games about what you can build or find in a fixed set of letters, and the set is the same for everybody, so the board is a straight comparison of what each player found. A fourteen-tile rack, a bag-empty endgame, a seven-letter honeycomb, a dig for buried words and a big themed word search.',`);
sub('lib/puzzle-sets.js', `Strata buries words in layers and asks you to dig them out.',`,
  `Strata buries words in layers and asks you to dig them out. Scour hides a day\\u2019s worth of themed words in a 15x15 grid, every one of them exactly once.',`);
sub('lib/puzzle-sets.js', `['Are they free?', 'All four, every day, no account required.'],\n    ],\n  },\n  {\n    name: 'Letter shuffles',`,
  `['Are they free?', 'All five, every day, no account required.'],\n    ],\n  },\n  {\n    name: 'Letter shuffles',`);

// 11. the word-games landing page
sub('lib/puzzle-categories.js', `description: 'Eighteen free daily word games in one place: word ladders, a compound-word chain, themed scrambles,`,
  `description: 'Nineteen free daily word games in one place: word ladders, a compound-word chain, themed scrambles, a word search,`);
sub('lib/puzzle-categories.js', `lede: 'Eighteen word games, one new puzzle in each every day. Ladders, a compound-word chain, themed scrambles,`,
  `lede: 'Nineteen word games, one new puzzle in each every day. Ladders, a compound-word chain, themed scrambles, a big themed word search,`);
sub('lib/puzzle-categories.js', `keys: ['garble', 'scram', 'rung',`, `keys: ['garble', 'scram', 'scour', 'rung',`);
sub('lib/puzzle-categories.js', `scram: 'Themed word scramble', rung:`, `scram: 'Themed word scramble', scour: 'Word search', rung:`);
sub('lib/puzzle-categories.js', `Scram ten from one theme against the clock, Rung`, `Scram ten from one theme against the clock, Scour hides a theme\\u2019s worth of words in a 15x15 grid, Rung`);
sub('lib/puzzle-categories.js', `Scram to answers of eight to twelve letters, Tuck`, `Scram to answers of eight to twelve letters, Scour to an 18x18 grid, Tuck`);

console.log(`wire-scour: ${applied} edits applied, ${skipped} already present`);

// 12. CLAUDE.md
afterLine('CLAUDE.md', '| Scram | every answer eight to twelve letters', [
  '| Scour | an 18x18 grid with twenty-six words in all eight directions, against the weekday 15x15 (from 2026-10-18) |']);
sub('CLAUDE.md', `## Jig is the DAILY JIGSAW, one Commons photo cut the same way for everyone (launched 2026-10-15)`,
`## Scour is the THEMED WORD SEARCH, 15x15 every day (launched 2026-10-15)

Route \`/scour\`, key \`scour\`, Word, legacy hue sky #0369a1. Owner, 2026-10-15: "make even the normal day
large, maybe 15x15 daily". One theme a day from Scram's pools (\`scripts/scram-pools.mjs\`), never Scram's
theme that day and never a word from a Scram board within three days.

- **The ramp is directions, word count and decoys, never size**: Mon 14 words across and down, Tue 15
  adding diagonal down, Wed 16 adding diagonal up, Thu 16 adding backward, Fri 17 adding up, Sat 18 in all
  eight; the **Sunday Edition is 18x18 with 26 words** in all eight. Decoys (a list word's first letters
  planted elsewhere) and overlap rise through the week. Every list word reads in the grid EXACTLY ONCE
  counting all eight directions, so the client checks a line by its letters and no answer key ships.
- **Race the clock**: score is words found, time breaks ties, \`miss: null\`, \`guessesUsed: 0\`, in
  \`XP_LINEAR_DAILIES\`. A wrong line costs nothing.
- **A line is checked on LIFT**: drag (snaps to the nearest of eight directions) or tap first letter then
  last; releasing off the board or Escape throws a line away; tapping the anchor again lets go.
- \`scripts/gen-scour.mjs\` deals \`app/scour/puzzles.js\` (\`--until\` extends and keeps every board,
  \`--rebuild\` only before launch); \`scripts/verify-scour.mjs\` is independent. Bank 2026-10-15 to
  2026-12-31. A Scram redeal can clash with Scour's ±3-day word rule; re-run the verifier after one.
  Tile art \`scripts/gen-scour-tile.py\`; wired by \`scripts/wire-scour.mjs\`.

## Jig is the DAILY JIGSAW, one Commons photo cut the same way for everyone (launched 2026-10-15)`);
console.log(`wire-scour (CLAUDE.md): done`);
