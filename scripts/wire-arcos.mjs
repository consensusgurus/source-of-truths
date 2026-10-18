// scripts/wire-arcos.mjs — wires Arcos, the daily set of acrostics (Word),
// into every registry, beside Scram. Placement follows the rule in CLAUDE.md
// ("Placing a new daily"): one registry category (Word), one to four skills
// (Language, Memory, Deduction), the category key lists, one daily group
// (Crosswords), finish sets, and the category and crosswords page copy.
//
// Anchored edits: every anchor must match EXACTLY ONCE or the script throws,
// and an edit whose insertion is already present is skipped, so a re-run is safe.
//   node scripts/wire-arcos.mjs <dir>
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

const TAG = 'Three acrostics, one link';
const TAGLONG = 'Solve three clued acrostics, then find the word that ties them';
const HOW = 'Three clued acrostics: the first letters, the last letters and the diagonal each spell a hidden word. Then find the one word that goes with all three. Each acrostic is worth three, the finale one; time breaks ties.';
const BLURB = 'Three small acrostics hide three words in their first letters, last letters and diagonal. Find all three, then the word that ties them together.';
const COLOR = '#1e40af', NAVY = '#93c5fd', BG = '#dbeafe', BORDER = 'rgba(30,64,175,0.4)';

// 1. lib/daily-games.js: the row and the premiere
afterLine('lib/daily-games.js', "{ key: 'scram', miss: null, name: 'Scram', cat: 'Word'", [
  `  { key: 'arcos', miss: null, name: 'Arcos', cat: 'Word', tag: '${TAG}', tagLong: '${TAGLONG}', how: '${HOW}', color: '${COLOR}', colorNavy: '${NAVY}' },`]);
sub('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n  { key: 'arcos', from: '2026-10-18', until: '2026-10-22' },\n`);

// 2. lib/sunday-editions.js
afterLine('lib/sunday-editions.js', '//   scram   the long-answer day: every answer eight to twelve letters, often two words', [
  '//   arcos   five- and six-letter hidden words, and answers of five to seven letters']);
sub('lib/sunday-editions.js', `'garble', 'scram', 'scour',`, `'garble', 'scram', 'arcos', 'scour',`);

// 3. IQ: three acrostics and a finale pay linearly
sub('lib/quiz-xp.js', `'herd', 'scram', 'scour']);`, `'herd', 'scram', 'scour', 'arcos']);`);

// 4. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['squash', `, `const LAUNCH_PIN = { keys: ['arcos', 'squash', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['squash', `, `const LAUNCH_PIN = { keys: ['arcos', 'squash', `);
afterLine('app/DailyEndCard.jsx', "  scram: { accent: '#be123c', badgeBg: '#be123c', badgeInk: T.white, Fin: Trophy },", [
  `  arcos: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: Trophy },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'scram', cat: 'word',      name: 'Scram',", [
  `  { key: 'arcos', cat: 'word',      name: 'Arcos', tag: '${TAG}',       blurb: '${BLURB}', href: '/arcos' },`]);

// 5. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'scram', href: '/scram'", [
  `  { key: 'arcos', href: '/arcos', name: 'Arcos', tag: 'three acrostics, one link', store: 'sot_arcos_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'scram', href: '/scram'", [
  `  { key: 'arcos', href: '/arcos', name: 'Arcos', tag: '${TAG}', img: '/games/btn-arcos.png' },`]);
sub('app/DailyGamesGrid.jsx', `'garble', 'scram', 'scour', 'links',`, `'garble', 'scram', 'scour', 'arcos', 'links',`);
afterLine('app/DailyStrip.jsx', "{ key: 'scram', href: '/scram'", [
  `  { key: 'arcos', href: '/arcos', name: 'Arcos', img: '/games/btn-arcos.png', store: 'sot_arcos_day', tag: "${TAG}" , cat: 'Word' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { squash: `, `const ACCENTS = { arcos: '${NAVY}', squash: `);
sub('app/DailyStrip.jsx', `const TCOL = { squash: `, `const TCOL = { arcos: '${COLOR}', squash: `);

// 6. archive
sub('app/archive/page.js', `import { PUZZLES as SCRAM_FULL } from '../scram/puzzles';`,
  `import { PUZZLES as SCRAM_FULL } from '../scram/puzzles';\nimport { PUZZLES as ARCOS_FULL } from '../arcos/puzzles';`);
afterLine('app/archive/page.js', 'const SCRAM = SCRAM_FULL.map(', [
  'const ARCOS = ARCOS_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));']);
afterLine('app/archive/page.js', "{ key: 'scram', name: 'Scram', path: '/scram'", [
  `  { key: 'arcos', name: 'Arcos', path: '/arcos', tag: '${TAG}', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: ARCOS },`]);

// 7. the four puzzle-map registries
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_scram } from '@/app/scram/puzzles';`,
    `import { PUZZLES as P_scram } from '@/app/scram/puzzles';\nimport { PUZZLES as P_arcos } from '@/app/arcos/puzzles';`);
  sub(f, `scram: P_scram,`, `scram: P_scram, arcos: P_arcos,`);
}

// 8. alternations, rails, catalog, loft
sub('app/api/quiz/daily-status/route.js', `|gift|scram|scour|`, `|gift|scram|arcos|scour|`);
sub('app/quizzes/QuizHomeClient.jsx', `|gift|scram|scour|`, `|gift|scram|arcos|scour|`);
sub('app/DailySlateRail.jsx', `'gift', 'scram', 'scour',`, `'gift', 'scram', 'arcos', 'scour',`);
sub('lib/quiz-catalog.js', `'gift', 'scram', 'scour', `, `'gift', 'scram', 'arcos', 'scour', `);
sub('lib/loft.js', `'scram', 'scour',`, `'scram', 'arcos', 'scour',`);

// 9. skills, challenge metric, finish beat, glyph
sub('lib/daily-skills.js', `scram: ['lang', 'speed'], `, `scram: ['lang', 'speed'], arcos: ['lang', 'mem', 'ded'], `);
sub('lib/challenge-metric.js', `  squash: { unit: 'points', one: 'point', dir: 'high', say: 'scored' },`,
  `  squash: { unit: 'points', one: 'point', dir: 'high', say: 'scored' },\n  arcos: { unit: 'points', one: 'point', dir: 'high', say: 'scored' },`);
afterLine('lib/finish-beats.js', "  scram: grid('.sc-slot', false),", ["  arcos: { kind: 'arcband', last: true },"]);
afterLine('lib/game-glyphs.js', "  scram: 'M3 4h5v5H3z", [
  "  arcos: 'M5 4v16M19 4v16M5 4l14 16M3 4h4M17 20h4',  // two spines and the diagonal between them"]);

// 10. group and finish sets
sub('lib/daily-groups.js', `{ name: 'Crosswords', cat: 'Word', keys: ['emcee', 'encore', 'shards'] },`, `{ name: 'Crosswords', cat: 'Word', keys: ['emcee', 'encore', 'shards', 'arcos'] },`);
sub('lib/finish-sets.js', `{ name: 'Crosswords', cat: 'Word', keys: ['emcee', 'encore', 'shards'] },`, `{ name: 'Crosswords', cat: 'Word', keys: ['emcee', 'encore', 'shards', 'arcos'] },`);
sub('lib/finish-sets.js', `{ name: 'Word chains', cat: 'Word', keys: ['rung', 'hinge', 'links'] },`, `{ name: 'Word chains', cat: 'Word', keys: ['rung', 'hinge', 'links', 'arcos'] },`);

// 11. the word-games page and the crosswords page
const PC = 'lib/puzzle-categories.js';
sub(PC, `description: 'Nineteen free daily word games in one place: word ladders, a compound-word chain, themed scrambles, a word search, hidden-group puzzles, a hotter-or-colder word hunt, tile games, a copy-editing puzzle and six crosswords.`,
  `description: 'Twenty free daily word games in one place: word ladders, a compound-word chain, themed scrambles, a word search, hidden-group puzzles, a hotter-or-colder word hunt, tile games, a copy-editing puzzle and seven crosswords.`);
sub(PC, `lede: 'Nineteen word games, one new puzzle in each every day.`, `lede: 'Twenty word games, one new puzzle in each every day.`);
sub(PC, `tile games with a proven best score, and six crosswords.`, `tile games with a proven best score, and seven crosswords.`);
sub(PC, `'babel', 'emcee', 'encore', 'crux', 'glyph', 'shards', 'anon'],\n    generic: {\n      garble:`, `'babel', 'emcee', 'encore', 'arcos', 'crux', 'glyph', 'shards', 'anon'],\n    generic: {\n      garble:`);
sub(PC, `emcee: 'Mini crossword', encore: 'Daily crossword', crux:`, `emcee: 'Mini crossword', encore: 'Daily crossword', arcos: 'Set of acrostics', crux:`);
sub(PC, `Scour to an 18x18 grid, Tuck`, `Scour to an 18x18 grid, Arcos to five- and six-letter hidden words, Tuck`);
// crosswords page
sub(PC, `description: 'Play a free crossword every day: a five-by-five mini, a nine-by-nine full crossword, a codeword, a jigsaw crossword, an acrostic and a clueless crossword.`,
  `description: 'Play a free crossword every day: a five-by-five mini, a nine-by-nine, a daily set of acrostics, a codeword, a jigsaw crossword and a clueless crossword.`);
sub(PC, `a nine-by-nine for a proper sit-down, and four cousins`, `a nine-by-nine for a proper sit-down, a daily set of three clued acrostics, and four cousins`);
sub(PC, `keys: ['emcee', 'encore', 'crux', 'glyph', 'shards', 'anon'],`, `keys: ['emcee', 'encore', 'arcos', 'crux', 'glyph', 'shards', 'anon'],`);
sub(PC, `emcee: 'Mini crossword, 5x5', encore: 'Daily crossword, 9x9', crux:`, `emcee: 'Mini crossword, 5x5', encore: 'Daily crossword, 9x9', arcos: 'Set of acrostics', crux:`);
sub(PC, `Encore runs eleven by eleven on Sundays.',`, `Encore runs eleven by eleven on Sundays. Arcos keeps the clues and trades the grid for three small acrostics: the first letters, the last letters and the diagonal each spell a word, and a fourth word ties the three together.',`);
sub(PC, `'Sunday Edition', 'Emcee grows to 7x7, Encore to 11x11, Crux`, `'Sunday Edition', 'Emcee grows to 7x7, Encore to 11x11, Arcos to five- and six-letter hidden words, Crux`);

// 12. CLAUDE.md
afterLine('CLAUDE.md', '| Scram | every answer eight to twelve letters', [
  '| Arcos | five- and six-letter hidden words and answers of five to seven letters, against four letters on weekdays (from launch, 2026-10-18) |']);
{
  const src = rd('CLAUDE.md');
  const marker = '## Arcos (`/arcos`): the daily set of acrostics (launched 2026-10-18)';
  if (!src.includes(marker)) {
    wr('CLAUDE.md', src.replace(/\s*$/, '\n') + `
${marker}

Three small clued acrostics a day and a finale. Key/route \`arcos\`, category **Word**, \`miss: null\`,
legacy accent \`#1e40af\` / \`#93c5fd\`. Wired by \`scripts/wire-arcos.mjs\` (beside Scram everywhere).
Skills Language, Memory, Deduction. Daily group and finish set Crosswords, plus the Word chains set.

- **The day:** a FRONT acrostic (first letters spell a hidden word), a BACK one (last letters), a
  DIAGONAL one (letter N of row N; every row one length, the word plus one), then the FINALE: one word
  that pairs with all three hidden words from \`scripts/hinge-pairs.txt\` (CHECK, STAND, BREAK + POINT).
- **Scoring:** each acrostic is worth 3, minus 1 per row shown with "Show this answer" (armed by a second
  tap), and counts only when complete; the finale is worth 1 within three tries. Out of 10, time breaks
  ties, \`guessesUsed: 0\`. A wrong entry shakes, clears and costs nothing. In \`XP_LINEAR_DAILIES\`.
  The free first-play hint ghosts the spine letter.
- **Clues are never invented:** every answer and clue comes from the Emcee and Encore clue banks.
  \`scripts/gen-arcos.mjs\` (deterministic, append with \`--until\`) and the independent
  \`scripts/verify-arcos.mjs\`: the finale must be the ONLY word pairing with all three on either side,
  no clue carries any word of the day, nothing repeats in the bank. Bank 2026-10-18 to 2026-11-30.
- **Ramp:** hidden words Mon-Wed 4 letters, Thu-Sat 4-5 with a 5, Sunday Edition 5-6; answers Mon 4-5,
  Tue-Sat 4-6, Sunday 5-7.
- **Ending:** the \`arcband\` beat in \`lib/finish-beat.js\`: the three hidden words slide in as bands in the
  ramp's sky, mint and lime, then the finale drops in gold, before the iris.
`);
    applied++;
  } else skipped++;
}

console.log(`wire-arcos: ${applied} edits applied, ${skipped} already present`);
