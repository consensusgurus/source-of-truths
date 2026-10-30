// scripts/wire-sudoclue.mjs: wires Sudoclue, the daily murder-mystery logic
// grid (Logic), into every registry, beside Roll. Placement follows the rule in
// CLAUDE.md ("Placing a new daily"): one registry category (Logic), skill
// Deduction (Alibi's), the category key lists, the Whodunits group and finish
// set (beside Alibi, Sworn and Fib), and the logic-puzzles page copy.
//
// Anchored edits: every anchor must match EXACTLY ONCE or the script throws,
// and an edit whose insertion is already present is skipped, so a re-run is safe.
//   node scripts/wire-sudoclue.mjs <dir>
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

const TAG = 'Find the killer, place the suspects';
const TAGLONG = 'One suspect per row and column on a real floor plan, and every role to deduce';
const HOW = 'Place one person in every row and every column of a real place, then deduce each hidden role. The killer was the only person alone in a room with the victim.';
const BLURB = 'A murder in a real place. Put one suspect in every row and column, then name the victim, the killer and the accomplice from the clues.';
const COLOR = '#be123c', NAVY = '#fb7185', BG = '#ffe4e6', BORDER = 'rgba(190,18,60,0.35)';

// 1. lib/daily-games.js: the row and the premiere
afterLine('lib/daily-games.js', "{ key: 'roll', keepsAnswer: true,", [
  `  { key: 'sudoclue', miss: 'Wrong', name: 'Sudoclue', cat: 'Logic', tag: '${TAG}', tagLong: '${TAGLONG}', how: '${HOW}', color: '${COLOR}', colorNavy: '${NAVY}' },`]);
sub('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n  { key: 'sudoclue', from: '2026-10-30', until: '2026-11-03' },\n`);

// 2. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['sudoclue', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['sudoclue', `);
afterLine('app/DailyEndCard.jsx', "  roll: { accent: '#166534', badgeBg: '#166534', badgeInk: T.white, Fin: Trophy },", [
  `  sudoclue: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: Trophy },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'roll',       cat: 'logic',", [
  `  { key: 'sudoclue',   cat: 'logic',     name: 'Sudoclue', tag: '${TAG}',     blurb: '${BLURB}', href: '/sudoclue' },`]);

// 3. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'roll', href: '/roll'", [
  `  { key: 'sudoclue', href: '/sudoclue', name: 'Sudoclue', tag: 'find the killer', store: 'sot_sudoclue_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'roll', href: '/roll'", [
  `  { key: 'sudoclue', href: '/sudoclue', name: 'Sudoclue', tag: '${TAG}', img: '/games/btn-sudoclue.png' },`]);
sub('app/DailyGamesGrid.jsx', `'topple', 'roll', `, `'topple', 'roll', 'sudoclue', `);
afterLine('app/DailyStrip.jsx', "{ key: 'roll', href: '/roll'", [
  `  { key: 'sudoclue', href: '/sudoclue', name: 'Sudoclue', img: '/games/btn-sudoclue.png', store: 'sot_sudoclue_day', tag: "${TAG}" , cat: 'Logic' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { `, `const ACCENTS = { sudoclue: '${NAVY}', `);
sub('app/DailyStrip.jsx', `const TCOL = { `, `const TCOL = { sudoclue: '${COLOR}', `);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as ROLL_FULL } from '../roll/puzzles';`,
  `import { PUZZLES as ROLL_FULL } from '../roll/puzzles';\nimport { PUZZLES as SUDOCLUE_FULL } from '../sudoclue/puzzles';`);
afterLine('app/archive/page.js', 'const ROLL = ROLL_FULL.map(', [
  'const SUDOCLUE = SUDOCLUE_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));']);
afterLine('app/archive/page.js', "{ key: 'roll', name: 'Roll', path: '/roll'", [
  `  { key: 'sudoclue', name: 'Sudoclue', path: '/sudoclue', tag: '${TAG}', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: SUDOCLUE },`]);

// 5. the four puzzle-map registries
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_roll } from '@/app/roll/puzzles';`,
    `import { PUZZLES as P_roll } from '@/app/roll/puzzles';\nimport { PUZZLES as P_sudoclue } from '@/app/sudoclue/puzzles';`);
  sub(f, `roll: P_roll, `, `roll: P_roll, sudoclue: P_sudoclue, `);
}

// 6. alternations, rails, catalog, loft
sub('app/api/quiz/daily-status/route.js', `|topple|roll|`, `|topple|roll|sudoclue|`);
sub('app/quizzes/QuizHomeClient.jsx', `|topple|roll|`, `|topple|roll|sudoclue|`);
sub('app/DailySlateRail.jsx', `'topple', 'roll', `, `'topple', 'roll', 'sudoclue', `);
sub('lib/quiz-catalog.js', `'topple', 'roll', `, `'topple', 'roll', 'sudoclue', `);
sub('lib/loft.js', `'topple', 'roll', `, `'topple', 'roll', 'sudoclue', `);

// 7. skills, glyph
sub('lib/daily-skills.js', ` alibi: ['ded'],`, ` alibi: ['ded'], sudoclue: ['ded', 'spa'],`);
afterLine('lib/game-glyphs.js', "  alibi: 'M11 11a6 6", [
  "  sudoclue: 'M4 4h16v16H4zM4 10h16M10 4v16M15 13.5a2 2 0 1 0 .01 0M15 16v3',  // a floor plan with one figure in it"]);

// 8. group and finish set
sub('lib/daily-groups.js', `  { name: 'Whodunits', cat: 'Logic', keys: ['alibi', 'sworn', 'fib', 'hearsay'] },`,
  `  { name: 'Whodunits', cat: 'Logic', keys: ['alibi', 'sudoclue', 'sworn', 'fib', 'hearsay'] },`);
sub('lib/finish-sets.js', `  { name: 'Whodunits', cat: 'Logic', keys: ['alibi', 'sworn', 'fib'] },`,
  `  { name: 'Whodunits', cat: 'Logic', keys: ['alibi', 'sudoclue', 'sworn', 'fib'] },`);

// 9. the logic-puzzles page
const PC = 'lib/puzzle-categories.js';
sub(PC, `description: 'Twenty-six free daily logic puzzles: a daily jigsaw,`, `description: 'Twenty-seven free daily logic puzzles: a daily jigsaw,`);
sub(PC, `a die rolling puzzle, whodunit deduction grids,`, `a die rolling puzzle, whodunit deduction grids, a murder mystery placed one suspect per row and column,`);
sub(PC, `lede: 'Twenty-six logic puzzles with one new board apiece every day`, `lede: 'Twenty-seven logic puzzles with one new board apiece every day`);
sub(PC, `'topple', 'roll', 'paths',`, `'topple', 'roll', 'sudoclue', 'paths',`);
sub(PC, `roll: 'Die rolling puzzle',`, `roll: 'Die rolling puzzle', sudoclue: 'Murder mystery logic grid',`);
sub(PC, `['Are they free?', 'All twenty-six, every day, no account required.'],`, `['Are they free?', 'All twenty-seven, every day, no account required.'],`);

console.log(`wire-sudoclue: ${applied} applied, ${skipped} already present`);
