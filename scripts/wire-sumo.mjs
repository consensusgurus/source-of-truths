// scripts/wire-sumo.mjs — wires the daily game `sumo` (the greater-than
// sudoku) into every registry AND into Enter the Dojo's variant rotation.
//
// ANCHORED, per the daily-game checklist: every anchor must match EXACTLY ONCE
// or the script throws, and it is idempotent (an edit whose finished text is
// already present is skipped).
//
//   node scripts/wire-sumo.mjs <dir>
//
// THE DOJO (owner, 2026-10-13): Sumo joins DOJO_POOL from 2026-10-14, the same
// day Arrow does (commit d1eb5e092, which made DOJO_POOL_BEFORE a dated chain).
// 2026-10-14 had not been played, so the from-10-14 pool simply grows to eight;
// no new era is needed and every played day keeps its variant.
import fs from 'fs';
import path from 'path';

const root = process.argv[2];
if (!root) { console.error('usage: node wire-sumo.mjs <dir>'); process.exit(1); }
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
const after = (file, anchor, text) => edit(file, anchor, anchor + text);
const before = (file, anchor, text) => edit(file, anchor, text + anchor);

const TAG = 'The daily greater-than sudoku';
const HOW = 'An ordinary sudoku plus signs: every line inside a 3x3 box bends into a small point aimed at the smaller of its two squares. Rows, columns and boxes still hold 1 to 9 once, and the signs do so much of the work that the board prints almost no digits.';
const BLURB = 'Sudoku with signs: every line inside a box points at the smaller square. Almost no digits, all logic.';
const COLOR = '#8a6d0b', NAVY = '#f5d06b', BG = '#faf5e6', BORDER = 'rgba(138,109,11,0.4)';

// 1. lib/daily-games.js
before('lib/daily-games.js', `  { key: 'giant', miss: null, name: 'Giant', cat: 'Sudoku',`,
  `  { key: 'sumo', miss: null, name: 'Sumo', cat: 'Sudoku', tag: '${TAG}', how: '${HOW}', color: '${COLOR}', colorNavy: '${NAVY}' },\n`);
after('lib/daily-games.js', `  { key: 'giant', from: '2026-10-13', until: '2026-10-17' },`, `\n  { key: 'sumo', from: '2026-10-13', until: '2026-10-17' },`);
edit('lib/daily-games.js', `'diag', 'giant', 'arrow',\n`, `'diag', 'giant', 'arrow', 'sumo',\n`);

// 2. lib/sunday-editions.js
after('lib/sunday-editions.js', `  'giant',\n`, `  'sumo',\n`);

// 3. app/DailyEndCard.jsx
edit('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['arrow', 'giant', 'ergo',`, `const LAUNCH_PIN = { keys: ['sumo', 'arrow', 'giant', 'ergo',`);
after('app/DailyEndCard.jsx', `  giant: { accent: '#3949ab', badgeBg: '#3949ab', badgeInk: T.white, Fin: LayoutGrid },`,
  `\n  sumo: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: Grid3x3 },`);
before('app/DailyEndCard.jsx', `  { key: 'giant',  cat: 'sudoku' ,   name: 'Giant',`,
  `  { key: 'sumo',  cat: 'sudoku' ,   name: 'Sumo',  tag: '${TAG}',    blurb: '${BLURB}', href: '/sumo' },\n`);

// 4. daily-order
edit('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['arrow', 'giant', 'ergo',`, `const LAUNCH_PIN = { keys: ['sumo', 'arrow', 'giant', 'ergo',`);

// 5-7. promo, grid, strip
before('app/DailyGamesPromo.jsx', `  { key: 'giant', href: '/giant', name: 'Giant',`,
  `  { key: 'sumo', href: '/sumo', name: 'Sumo', tag: 'the daily greater-than sudoku', store: 'sot_sumo_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },\n`);
before('app/DailyGamesGrid.jsx', `  { key: 'giant', href: '/giant', name: 'Giant', tag:`,
  `  { key: 'sumo', href: '/sumo', name: 'Sumo', tag: '${TAG}', img: '/games/btn-sumo.png' },\n`);
edit('app/DailyGamesGrid.jsx', `'rim', 'giant', 'whittle'] },`, `'rim', 'giant', 'sumo', 'whittle'] },`);
before('app/DailyStrip.jsx', `  { key: 'giant', href: '/giant', name: 'Giant', img:`,
  `  { key: 'sumo', href: '/sumo', name: 'Sumo', img: '/games/btn-sumo.png', store: 'sot_sumo_day', tag: "${TAG}" , cat: 'Numbers' },\n`);
edit('app/DailyStrip.jsx', `const ACCENTS = { arrow:`, `const ACCENTS = { sumo: '${NAVY}', arrow:`);
edit('app/DailyStrip.jsx', `const TCOL = { arrow:`, `const TCOL = { sumo: '${COLOR}', arrow:`);

// 8. archive
after('app/archive/page.js', `import { PUZZLES as GIANT_FULL } from '../giant/puzzles';`, `\nimport { PUZZLES as SUMO_FULL } from '../sumo/puzzles';`);
before('app/archive/page.js', `const GIANT = GIANT_FULL.map(`,
  `const SUMO = SUMO_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));\n`);
before('app/archive/page.js', `  { key: 'giant', name: 'Giant', path: '/giant',`,
  `  { key: 'sumo', name: 'Sumo', path: '/sumo', tag: 'The greater-than sudoku', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: SUMO },\n`);

// 9. sitemap, slate rail, catalog, loft
for (const f of ['lib/sitemap-entries.js', 'app/DailySlateRail.jsx', 'lib/quiz-catalog.js', 'lib/loft.js']) edit(f, `'rim', 'giant',`, `'rim', 'giant', 'sumo',`);

// 10. the four puzzle maps
for (const f of ['lib/daily-slate.js', 'app/api/quiz/sunday-slate/route.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js']) {
  after(f, `import { PUZZLES as P_giant } from '@/app/giant/puzzles';`, `\nimport { PUZZLES as P_sumo } from '@/app/sumo/puzzles';`);
  edit(f, `rim: P_rim, giant: P_giant`, `rim: P_rim, giant: P_giant, sumo: P_sumo`);
}

// 11. the two hardcoded alternations
edit('app/api/quiz/daily-status/route.js', `|giant|yose|`, `|giant|sumo|yose|`);
edit('app/quizzes/QuizHomeClient.jsx', `|giant|yose|`, `|giant|sumo|yose|`);

// 12. glyph: a box whose middle lines bend
before('lib/game-glyphs.js', `  giant: 'M3 3h18v18H3z`,
  `  sumo: 'M4 4h16v16H4zM9.3 4v4.6l1.6 1.4-1.6 1.4v8.6M14.7 4v8.6l-1.6 1.4 1.6 1.4v2.6M4 9.3h10.6l1.4 1.6 1.4-1.6H20', // a box, its lines bent into signs\n`);

// 13. /sudoku landing page
edit('lib/puzzle-categories.js', `Free Daily Sudoku: Fifteen Variants, One New Board Every Day | Mind Loft',`, `Free Daily Sudoku: Sixteen Variants, One New Board Every Day | Mind Loft',`);
edit('lib/puzzle-categories.js', `    h1: 'Free Daily Sudoku: Fifteen Variants, One New Board Every Day',`, `    h1: 'Free Daily Sudoku: Sixteen Variants, One New Board Every Day',`);
edit('lib/puzzle-categories.js', `a giant 16x16, eleven variants (diagonal, jigsaw, killer, sandwich, frame, outside, thermo, arrow, kropki, anti-knight, skyscrapers)`,
  `a giant 16x16, twelve variants (diagonal, jigsaw, killer, sandwich, frame, outside, thermo, arrow, kropki, greater-than, anti-knight, skyscrapers)`);
edit('lib/puzzle-categories.js', `a giant 16x16, eleven variant sudokus you will not find together anywhere else (diagonal, jigsaw, killer, sandwich, frame, outside, thermo, arrow, kropki, anti-knight and skyscrapers)`,
  `a giant 16x16, twelve variant sudokus you will not find together anywhere else (diagonal, jigsaw, killer, sandwich, frame, outside, thermo, arrow, kropki, greater-than, anti-knight and skyscrapers)`);
edit('lib/puzzle-categories.js', `'knight', 'cages', 'arrow', 'polka', 'whittle'],`, `'knight', 'cages', 'arrow', 'polka', 'sumo', 'whittle'],`);
edit('lib/puzzle-categories.js', `polka: 'Kropki sudoku',\n`, `polka: 'Kropki sudoku', sumo: 'Greater-than sudoku',\n`);
edit('lib/puzzle-categories.js', `Mercury and Polka add ordering,`, `Mercury, Polka and Sumo add ordering,`);
edit('lib/puzzle-categories.js', `a Giant with ninety of 256.'],`, `a Giant with ninety of 256, a Sumo with no digits at all.'],`);
edit('lib/puzzle-categories.js', `(sandwich, jigsaw, thermo, anti-knight, frame or diagonal)`, `(sandwich, jigsaw, arrow, thermo, anti-knight, greater-than, frame or diagonal)`);

// 14. groups and sets. Every Sudoku group was at its five-key ceiling once
// Arrow joined Marked, so Marked splits: the order rules (thermo, kropki,
// greater-than) become their own group.
edit('lib/daily-groups.js', `  { name: 'Marked sudokus', cat: 'Sudoku', keys: ['quilt', 'mercury', 'arrow', 'polka', 'knight'] },`,
  `  { name: 'Marked sudokus', cat: 'Sudoku', keys: ['quilt', 'arrow', 'knight'] },\n  { name: 'Order sudokus', cat: 'Sudoku', keys: ['mercury', 'polka', 'sumo'] },`);
edit('lib/daily-groups.js', `  // Sudoku (15)`, `  // Sudoku (16)`);
after('lib/finish-sets.js', `  { name: 'Big grids', cat: 'Sudoku', keys: ['giant', 'suds', 'sando'] },`,
  `\n  { name: 'Order sudokus', cat: 'Sudoku', keys: ['sumo', 'mercury', 'polka'] },`);

// 15. family list and the finish ripple
edit('lib/circuits.js', `'mercury', 'sando', 'giant'];`, `'mercury', 'sando', 'giant', 'sumo'];`);
after('lib/finish-beats.js', `  giant: { kind: 'ripple', last: true, cell: '.gi-cell', box: [4, 4], per: 34 },`, `\n  sumo: grid('.sm-cell'),`);

// 16. ENTER THE DOJO. Eight from 2026-10-14. Sums (Sando, Arrow, Frame) are
// never neighbours, nor are the two order rules (Mercury, Sumo), around the
// whole cycle. 2026-10-14 still deals Diag, as it did on the seven-game pool.
edit('lib/dojo.js',
  `export const DOJO_POOL = ['sando', 'quilt', 'arrow', 'mercury', 'knight', 'frame', 'diag'];`,
  `// SUMO JOINS FROM 2026-10-14 TOO (owner, 2026-10-13). That day was not yet
// played, so the pool just grows to eight. Sums (Sando, Arrow, Frame) are
// never neighbours around the cycle, nor are the two order rules (Mercury,
// Sumo), and 2026-10-14 still deals Diag, as it did on the seven-game pool.
export const DOJO_POOL = ['sando', 'quilt', 'arrow', 'mercury', 'diag', 'sumo', 'frame', 'knight'];`);
after('lib/dojo.js', `  arrow: { form: 'Arrow', chip: 'Circles sum their arrows', phrase: 'an arrow sudoku' },`,
  `\n  sumo: { form: 'Greater-Than', chip: 'Every bend points at the smaller', phrase: 'a greater-than sudoku' },`);
after('lib/dojo.js', `  arrow: [470, 1900],`,
  `\n  // Sumo had no boards when it joined (2026-10-14) either: seeded between\n  // Knight and Diag, and the adaptive clocks replace it as solves come in.\n  sumo: [520, 1500],`);
after('app/dojo/page.js', `import { PUZZLES as P_diag } from '../diag/puzzles';`, `\nimport { PUZZLES as P_sumo } from '../sumo/puzzles';`);
edit('app/dojo/page.js', `frame: P_frame, diag: P_diag };`, `frame: P_frame, diag: P_diag, sumo: P_sumo };`);
after('app/dojo/DojoClient.jsx', `  diag: dynamic(() => import('../diag/DiagClient'), { ssr: false, loading: () => null }),`,
  `\n  sumo: dynamic(() => import('../sumo/SumoClient'), { ssr: false, loading: () => null }),`);

// 17. CLAUDE.md
after('CLAUDE.md', `| Giant | ninety of 256 clues and the only day that needs more than singles, against 96 to 128 on weekdays (from 2026-10-18) |`,
  `\n| Sumo | no digits at all, only the 108 signs, and it needs more than singles (from 2026-10-18) |`);
before('CLAUDE.md', `## Giant is the 16x16 SUDOKU, and the phone plays it a quarter at a time (launched 2026-10-13)`,
`## Sumo is the GREATER-THAN SUDOKU, and its signs are the grid lines (launched 2026-10-13)

An ordinary 9x9 plus a sign on every edge INSIDE a 3x3 box (12 per box, 108 in all) saying
which square holds the larger digit. Route \`/sumo\`, key \`sumo\`, legacy hue ochre #8a6d0b.

- **The signs ARE the grid lines (owner pick E1, 2026-10-13).** No < or > glyphs: every in-box
  line is drawn as one SVG path that bends at its middle into a point aimed at the SMALLER
  square, in \`--stg-cell-dot\`, so it reads as a line in both registers. The cells' own in-box
  borders are transparent; only box borders are borders. Mockups: the "Greater-Than Sudoku
  Options" canvas artifact.
- **The ramp is digits, then technique, and that is measured** (\`gen-sumo.mjs --measure\`): the
  greedy floor is 0 to 7 printed digits and ~15% of grids are unique with none. Mon 8, Tue 6,
  Wed 4, Thu 2, Fri 0 at level 1 (sign reading + singles); Sat 2 and the Sunday Edition 0 at
  level 2 (also locked candidates and subsets). Sign reading is in BOTH levels: box chains
  (k squares chained below means at least k+1) and bound propagation along every sign.
- **In Enter the Dojo from 2026-10-14**, joining with Arrow the same day: the from-10-14 pool
  is eight, ordered so no two sum rules (Sando, Arrow, Frame) and no two order rules (Mercury,
  Sumo) are neighbours around the cycle. Sumo first deals 2026-10-15. Seed clock [520, 1500];
  the adapting clocks replace it as solves come in.
- **Groups:** Marked sudokus split when Sumo arrived (every Sudoku group was at the five-key
  ceiling): Marked keeps Quilt, Arrow, Knight; Order sudokus is Mercury, Polka, Sumo.
- Engine \`scripts/sumo-core.mjs\` (generator only); \`verify-sumo.mjs\` is independent and policed;
  \`sumo-mutation-test.mjs\` (10 of 10). Client is \`mksumo.py\` (not committed), a transform of
  DiagClient. Bank 2026-10-13 to 2026-12-31; extend with \`gen-sumo.mjs --until\` (appends only).

`);

console.log(`wire-sumo: ${applied} edits applied, ${skipped} already present`);
