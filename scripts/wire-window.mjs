// scripts/wire-window.mjs: wires the daily game `window` (the windoku) into
// every registry.
//
// ANCHORED, per the daily-game checklist: every anchor must match EXACTLY ONCE
// or the script throws, and it is idempotent (an edit whose finished text is
// already present is skipped).
//
//   node scripts/wire-window.mjs <dir>
//
// Window is NOT in Enter the Dojo's pool (the owner did not ask for it).
import fs from 'fs';
import path from 'path';

const root = process.argv[2];
if (!root) { console.error('usage: node wire-window.mjs <dir>'); process.exit(1); }
let applied = 0, skipped = 0;
function edit(file, anchor, replacement) {
  const p = path.join(root, file);
  const src = fs.readFileSync(p, 'utf8');
  if (src.includes(replacement)) { skipped++; return; }
  const n = src.split(anchor).length - 1;
  if (n !== 1) { if (process.env.SOFT) { console.log(`MISS ${file} x${n}: ${anchor.slice(0, 150)}`); return; } throw new Error(`${file}: anchor matched ${n} times, expected 1\n  ${anchor.slice(0, 140)}`); }
  fs.writeFileSync(p, src.replace(anchor, replacement));
  applied++;
}
const after = (file, anchor, text) => edit(file, anchor, anchor + text);
const before = (file, anchor, text) => edit(file, anchor, text + anchor);

const TAG = 'The daily windoku';
const HOW = 'An ordinary sudoku plus four shaded windows: each window, a 3x3 block set between the boxes, also holds 1 to 9 once. Rows, columns and boxes still do too, and the windows do enough of the work that the board prints very few digits.';
const BLURB = 'Sudoku with four extra boxes: each shaded window holds 1 to 9 once. Few digits, all logic.';
const COLOR = '#be185d', NAVY = '#f9a8d4', BG = '#fdf2f8', BORDER = 'rgba(190,24,93,0.4)';

// 1. lib/daily-games.js
before('lib/daily-games.js', `  { key: 'sumo', miss: null, name: 'Sumo', cat: 'Sudoku',`,
  `  { key: 'window', miss: null, name: 'Window', cat: 'Sudoku', tag: '${TAG}', how: '${HOW}', color: '${COLOR}', colorNavy: '${NAVY}' },\n`);
after('lib/daily-games.js', `  { key: 'sumo', from: '2026-10-13', until: '2026-10-17' },`, `\n  { key: 'window', from: '2026-10-15', until: '2026-10-19' },`);
edit('lib/daily-games.js', `'diag', 'giant', 'arrow', 'sumo',\n`, `'diag', 'giant', 'arrow', 'sumo', 'window',\n`);

// 2. lib/sunday-editions.js
after('lib/sunday-editions.js', `  'sumo',\n`, `  'window',\n`);

// 3. app/DailyEndCard.jsx
edit('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['jig', 'scram',`, `const LAUNCH_PIN = { keys: ['jig', 'window', 'five', 'racecar', 'scram',`);
after('app/DailyEndCard.jsx', `  sumo: { accent: '#8a6d0b', badgeBg: '#8a6d0b', badgeInk: T.white, Fin: Grid3x3 },`,
  `\n  window: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: Grid3x3 },`);
before('app/DailyEndCard.jsx', `  { key: 'sumo',  cat: 'sudoku' ,   name: 'Sumo',`,
  `  { key: 'window',  cat: 'sudoku' ,   name: 'Window',  tag: '${TAG}',    blurb: '${BLURB}', href: '/window' },\n`);

// 4. daily-order
edit('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['jig', 'scram',`, `const LAUNCH_PIN = { keys: ['jig', 'window', 'five', 'racecar', 'scram',`);
for (const f of ['app/DailyEndCard.jsx', 'app/api/quiz/daily-order/route.js']) edit(f, `'hands', 'glyph', 'babel'], until: '2026-10-18' };`, `'hands', 'glyph', 'babel'], until: '2026-10-19' };`);

// 5-7. promo, grid, strip
before('app/DailyGamesPromo.jsx', `  { key: 'sumo', href: '/sumo', name: 'Sumo',`,
  `  { key: 'window', href: '/window', name: 'Window', tag: 'the daily windoku', store: 'sot_window_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },\n`);
before('app/DailyGamesGrid.jsx', `  { key: 'sumo', href: '/sumo', name: 'Sumo', tag:`,
  `  { key: 'window', href: '/window', name: 'Window', tag: '${TAG}', img: '/games/btn-window.png' },\n`);
edit('app/DailyGamesGrid.jsx', `'rim', 'giant', 'sumo', 'whittle'] },`, `'rim', 'giant', 'sumo', 'window', 'whittle'] },`);
before('app/DailyStrip.jsx', `  { key: 'sumo', href: '/sumo', name: 'Sumo', img:`,
  `  { key: 'window', href: '/window', name: 'Window', img: '/games/btn-window.png', store: 'sot_window_day', tag: "${TAG}" , cat: 'Numbers' },\n`);
edit('app/DailyStrip.jsx', `const ACCENTS = { sci:`, `const ACCENTS = { window: '${NAVY}', sci:`);
edit('app/DailyStrip.jsx', `const TCOL = { sci:`, `const TCOL = { window: '${COLOR}', sci:`);

// 8. archive
after('app/archive/page.js', `import { PUZZLES as SUMO_FULL } from '../sumo/puzzles';`, `\nimport { PUZZLES as WINDOW_FULL } from '../window/puzzles';`);
before('app/archive/page.js', `const SUMO = SUMO_FULL.map(`,
  `const WINDOW = WINDOW_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));\n`);
before('app/archive/page.js', `  { key: 'sumo', name: 'Sumo', path: '/sumo',`,
  `  { key: 'window', name: 'Window', path: '/window', tag: 'The windoku', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: WINDOW },\n`);

// 9. sitemap, slate rail, catalog, loft
for (const f of ['app/DailySlateRail.jsx', 'lib/quiz-catalog.js', 'lib/loft.js']) edit(f, `'rim', 'giant', 'sumo',`, `'rim', 'giant', 'sumo', 'window',`);

// 10. the four puzzle maps
for (const f of ['lib/daily-slate.js', 'app/api/quiz/sunday-slate/route.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js']) {
  after(f, `import { PUZZLES as P_sumo } from '@/app/sumo/puzzles';`, `\nimport { PUZZLES as P_window } from '@/app/window/puzzles';`);
  edit(f, `giant: P_giant, sumo: P_sumo`, `giant: P_giant, sumo: P_sumo, window: P_window`);
}

// 11. the two hardcoded alternations
edit('app/api/quiz/daily-status/route.js', `|giant|sumo|yose|`, `|giant|sumo|window|yose|`);
edit('app/quizzes/QuizHomeClient.jsx', `|giant|sumo|yose|`, `|giant|sumo|window|yose|`);

// 12. glyph: a frame holding four panes
before('lib/game-glyphs.js', `  sumo: 'M4 4h16v16H4z`,
  `  window: 'M3 3h18v18H3zM6 6h5v5H6zM13 6h5v5h-5zM6 13h5v5H6zM13 13h5v5h-5z', // a frame, four panes\n`);

// 13. /sudoku landing page
edit('lib/puzzle-categories.js', `Free Daily Sudoku: Sixteen Variants, One New Board Every Day | Mind Loft',`, `Free Daily Sudoku: Seventeen Variants, One New Board Every Day | Mind Loft',`);
edit('lib/puzzle-categories.js', `    h1: 'Free Daily Sudoku: Sixteen Variants, One New Board Every Day',`, `    h1: 'Free Daily Sudoku: Seventeen Variants, One New Board Every Day',`);
edit('lib/puzzle-categories.js', `a giant 16x16, twelve variants (diagonal, jigsaw, killer,`, `a giant 16x16, thirteen variants (diagonal, windoku, jigsaw, killer,`);
edit('lib/puzzle-categories.js', `a giant 16x16, twelve variant sudokus you will not find together anywhere else (diagonal, jigsaw, killer,`,
  `a giant 16x16, thirteen variant sudokus you will not find together anywhere else (diagonal, windoku, jigsaw, killer,`);
edit('lib/puzzle-categories.js', `'polka', 'sumo', 'whittle'],`, `'polka', 'sumo', 'window', 'whittle'],`);
edit('lib/puzzle-categories.js', `sumo: 'Greater-than sudoku',\n`, `sumo: 'Greater-than sudoku', window: 'Windoku',\n`);
edit('lib/puzzle-categories.js', `Diag and Quilt are the gentlest steps into variants because the rules barely change: Diag adds the two diagonals as houses, Quilt only reshapes the boxes.`,
  `Diag, Window and Quilt are the gentlest steps into variants because the rules barely change: Diag adds the two diagonals as houses, Window adds four shaded boxes, Quilt only reshapes the boxes.`);
edit('lib/puzzle-categories.js', `a Diag with fourteen,`, `a Diag with fourteen, a Window with thirteen,`);

// 14. groups and sets
edit('lib/daily-groups.js', `  { name: 'Marked sudokus', cat: 'Sudoku', keys: ['quilt', 'arrow', 'knight'] },`,
  `  { name: 'Marked sudokus', cat: 'Sudoku', keys: ['quilt', 'window', 'arrow', 'knight'] },`);
edit('lib/daily-groups.js', `  // Sudoku (16)`, `  // Sudoku (17)`);
after('lib/finish-sets.js', `  { name: 'Order sudokus', cat: 'Sudoku', keys: ['sumo', 'mercury', 'polka'] },`,
  `\n  { name: 'Extra houses', cat: 'Sudoku', keys: ['window', 'diag', 'quilt'] },`);

// 15. family list and the finish ripple
edit('lib/circuits.js', `'mercury', 'sando', 'giant', 'sumo'];`, `'mercury', 'sando', 'giant', 'sumo', 'window'];`);
after('lib/finish-beats.js', `  sumo: grid('.sm-cell'),`, `\n  window: grid('.wi-cell'),`);

// 16. CLAUDE.md
after('CLAUDE.md', `| Sumo | no digits at all, only the 108 signs, and it needs more than singles (from 2026-10-18) |`,
  `\n| Window | thirteen clues against 22 on Mondays, and it needs more than singles (from 2026-10-18) |`);
before('CLAUDE.md', `## Sumo is the GREATER-THAN SUDOKU, and its signs are the grid lines (launched 2026-10-13)`,
`## Window is the WINDOKU, and a window is a HOUSE (launched 2026-10-15)

An ordinary 9x9 plus four shaded 3x3 WINDOWS (rows 2-4 / 6-8 by columns 2-4 / 6-8, 1-based), each
holding 1 to 9 once: 31 houses, not 27. Route \`/window\` (owner named it Window, not Windoku), key
\`window\`, legacy hue rose #be185d. Careful: \`window\` is also the browser global, so never name a
variable \`window\`; as an object key and a string it is fine.

- **A fork of Diag**, made by \`mkwin_client.py\` / \`mkwin_scripts.py\` (not committed): the two
  diagonals swapped for the four windows in the peer set, tint and note scrub; the ruled X becomes
  four framed windows. Class prefix \`wi-\`.
- **The ramp is measured lower than Diag's** because the windows cover 36 squares (the diagonals 17):
  Mon 22, Tue 20, Wed 18, Thu 16 at level 1 (singles); Fri 15, Sat 14, Sunday Edition 13 at level 2
  (also locked candidates and subsets). Twelve did not come in 150 s of search, so 13 is the floor.
- Generator \`scripts/gen-window.mjs\` (appends only; \`--until\` to extend), independent verifier
  \`scripts/verify-window.mjs\` (unique, logic-only at the pinned level, window necessity),
  \`window-mutation-test.mjs\` (9 of 9). Bank 2026-10-15 to 2027-01-31.
- **Not in Enter the Dojo** (not asked for).

`);

console.log(`wire-window: ${applied} edits applied, ${skipped} already present`);
