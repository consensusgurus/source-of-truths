// scripts/wire-giant.mjs — wires the daily game `giant` (the 16x16 sudoku)
// into every registry.
//
// An ANCHORED script, per the daily-game checklist: half these registries fail
// SILENTLY when missed, so every anchor must match EXACTLY ONCE or the script
// throws, and it is idempotent (an edit whose finished text is already present
// is skipped, the whole-replacement test from wire-encore.mjs).
//
//   node scripts/wire-giant.mjs <dir>
//
// Giant joins the Sudoku category, the SUDOKU_POOL family list (home Sudoku
// shelf and the daily cap's hue) and the 'Classic sudokus' set, runs a Sunday
// Edition (ninety clues), and is deliberately NOT in the Enter the Dojo
// rotation (owner, 2026-10-13): lib/dojo.js is untouched.
import fs from 'fs';
import path from 'path';

const root = process.argv[2];
if (!root) { console.error('usage: node wire-giant.mjs <dir>'); process.exit(1); }

let applied = 0, skipped = 0;
function edit(file, anchor, replacement) {
  const p = path.join(root, file);
  const src = fs.readFileSync(p, 'utf8');
  if (src.includes(replacement)) { skipped++; return; }
  const n = src.split(anchor).length - 1;
  if (n !== 1) throw new Error(`${file}: anchor matched ${n} times, expected 1\n  ${anchor.slice(0, 120)}`);
  fs.writeFileSync(p, src.replace(anchor, replacement));
  applied++;
}
// Insert `text` immediately after the single occurrence of `anchor`.
const after = (file, anchor, text) => edit(file, anchor, anchor + text);

const TAG = 'The daily 16×16 sudoku';
const HOW = 'An ordinary sudoku, just bigger: sixteen rows, sixteen columns and sixteen 4x4 boxes, each holding 1 to 9 and A to G exactly once. 256 squares, one logical solution, and on a phone you can zoom into one quarter at a time.';
const BLURB = 'Sudoku at sixteen: rows, columns and 4x4 boxes each hold 1 to 9 and A to G. 256 squares and a proper long sit.';
const COLOR = '#3949ab', NAVY = '#a5b4fc', BG = '#eceefa', BORDER = 'rgba(57,73,171,0.4)';

// 1. lib/daily-games.js — the row, the premiere, and SOLVE_ONLY
edit('lib/daily-games.js',
  `  { key: 'rim', miss: null, name: 'Rim', cat: 'Sudoku',`,
  `  { key: 'giant', miss: null, name: 'Giant', cat: 'Sudoku', tag: '${TAG}', how: '${HOW}', color: '${COLOR}', colorNavy: '${NAVY}' },\n  { key: 'rim', miss: null, name: 'Rim', cat: 'Sudoku',`);
after('lib/daily-games.js',
  `  { key: 'rim', from: '2026-09-08', until: '2026-09-12' },`,
  `\n  { key: 'giant', from: '2026-10-13', until: '2026-10-17' },`);
edit('lib/daily-games.js',
  `'towers', 'frame', 'rim', 'diag',\n`,
  `'towers', 'frame', 'rim', 'diag', 'giant',\n`);

// 2. lib/sunday-editions.js
after('lib/sunday-editions.js', `  'rim',\n`, `  'giant',\n`);

// 3. app/DailyEndCard.jsx — LAUNCH_PIN, GAME_META, tile copy (LayoutGrid is already imported)
edit('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['ergo',`, `const LAUNCH_PIN = { keys: ['giant', 'ergo',`);
after('app/DailyEndCard.jsx',
  `  diag: { accent: '#0e7490', badgeBg: '#0e7490', badgeInk: T.white, Fin: MoveDiagonal },`,
  `\n  giant: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: LayoutGrid },`);
edit('app/DailyEndCard.jsx',
  `  { key: 'diag',  cat: 'sudoku' ,   name: 'Diag',`,
  `  { key: 'giant',  cat: 'sudoku' ,   name: 'Giant',  tag: '${TAG}',    blurb: '${BLURB}', href: '/giant' },\n  { key: 'diag',  cat: 'sudoku' ,   name: 'Diag',`);

// 4. app/api/quiz/daily-order/route.js
edit('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['ergo',`, `const LAUNCH_PIN = { keys: ['giant', 'ergo',`);

// 5. app/DailyGamesPromo.jsx
edit('app/DailyGamesPromo.jsx',
  `  { key: 'diag', href: '/diag', name: 'Diag',`,
  `  { key: 'giant', href: '/giant', name: 'Giant', tag: 'the daily 16×16 sudoku', store: 'sot_giant_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },\n  { key: 'diag', href: '/diag', name: 'Diag',`);

// 6. app/DailyGamesGrid.jsx — BOTH lists
edit('app/DailyGamesGrid.jsx',
  `  { key: 'diag', href: '/diag', name: 'Diag',`,
  `  { key: 'giant', href: '/giant', name: 'Giant', tag: '${TAG}', img: '/games/btn-giant.png' },\n  { key: 'diag', href: '/diag', name: 'Diag',`);
edit('app/DailyGamesGrid.jsx', `'knight', 'diag', 'frame', 'rim', 'whittle'] },`, `'knight', 'diag', 'frame', 'rim', 'giant', 'whittle'] },`);

// 7. app/DailyStrip.jsx — the row and both colour maps
edit('app/DailyStrip.jsx',
  `  { key: 'diag', href: '/diag', name: 'Diag',`,
  `  { key: 'giant', href: '/giant', name: 'Giant', img: '/games/btn-giant.png', store: 'sot_giant_day', tag: "${TAG}" , cat: 'Numbers' },\n  { key: 'diag', href: '/diag', name: 'Diag',`);
edit('app/DailyStrip.jsx', `const ACCENTS = { ergo:`, `const ACCENTS = { giant: '${NAVY}', ergo:`);
edit('app/DailyStrip.jsx', `const TCOL = { ergo:`, `const TCOL = { giant: '${COLOR}', ergo:`);

// 8. app/archive/page.js — import, map, card
after('app/archive/page.js', `import { PUZZLES as RIM_FULL } from '../rim/puzzles';`, `\nimport { PUZZLES as GIANT_FULL } from '../giant/puzzles';`);
edit('app/archive/page.js',
  `const RIM = RIM_FULL.map(`,
  `const GIANT = GIANT_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));\nconst RIM = RIM_FULL.map(`);
edit('app/archive/page.js',
  `  { key: 'rim', name: 'Rim', path: '/rim',`,
  `  { key: 'giant', name: 'Giant', path: '/giant', tag: 'Sudoku at sixteen', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: GIANT },\n  { key: 'rim', name: 'Rim', path: '/rim',`);

// 9. lib/sitemap-entries.js — keyed by route
edit('lib/sitemap-entries.js', `'dojo', 'room', 'diag', 'frame', 'rim',`, `'dojo', 'room', 'diag', 'frame', 'rim', 'giant',`);

// 10. the FOUR puzzle-map registries
for (const f of ['lib/daily-slate.js', 'app/api/quiz/sunday-slate/route.js',
                 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js']) {
  after(f, `import { PUZZLES as P_rim } from '@/app/rim/puzzles';`, `\nimport { PUZZLES as P_giant } from '@/app/giant/puzzles';`);
  edit(f, `frame: P_frame, rim: P_rim`, `frame: P_frame, rim: P_rim, giant: P_giant`);
}

// 11. the two hardcoded alternations
edit('app/api/quiz/daily-status/route.js', `|diag|frame|rim|yose|`, `|diag|frame|rim|giant|yose|`);
edit('app/quizzes/QuizHomeClient.jsx', `|diag|frame|rim|yose|`, `|diag|frame|rim|giant|yose|`);

// 12. app/DailySlateRail.jsx, lib/quiz-catalog.js, lib/loft.js
edit('app/DailySlateRail.jsx', `'curator', 'diag', 'frame', 'rim',`, `'curator', 'diag', 'frame', 'rim', 'giant',`);
edit('lib/quiz-catalog.js', `'whittle', 'diag', 'frame', 'rim', 'yose',`, `'whittle', 'diag', 'frame', 'rim', 'giant', 'yose',`);
edit('lib/loft.js', `'whittle', 'diag', 'frame', 'rim', 'yose',`, `'whittle', 'diag', 'frame', 'rim', 'giant', 'yose',`);

// 13. lib/game-glyphs.js — the board, four boxes each way
edit('lib/game-glyphs.js',
  `  rim: 'M6 6h12v12H6z`,
  `  giant: 'M3 3h18v18H3zM3 7.5h18M3 12h18M3 16.5h18M7.5 3v18M12 3v18M16.5 3v18', // a sixteen-box grid\n  rim: 'M6 6h12v12H6z`);

// 14. lib/puzzle-categories.js — the /sudoku landing page (count word moves)
edit('lib/puzzle-categories.js',
  `Free Daily Sudoku: Thirteen Variants, One New Board Every Day | Mind Loft',`,
  `Free Daily Sudoku: Fourteen Variants, One New Board Every Day | Mind Loft',`);
edit('lib/puzzle-categories.js',
  `    h1: 'Free Daily Sudoku: Thirteen Variants, One New Board Every Day',`,
  `    h1: 'Free Daily Sudoku: Fourteen Variants, One New Board Every Day',`);
edit('lib/puzzle-categories.js',
  `'Play free sudoku online: classic 9x9, a two-minute 6x6, ten variants`,
  `'Play free sudoku online: classic 9x9, a two-minute 6x6, a giant 16x16, ten variants`);
edit('lib/puzzle-categories.js',
  `    lede: 'Classic 9x9, a two-minute 6x6, ten variant sudokus`,
  `    lede: 'Classic 9x9, a two-minute 6x6, a giant 16x16, ten variant sudokus`);
edit('lib/puzzle-categories.js',
  `    keys: ['sixes', 'suds', 'diag', 'quilt',`,
  `    keys: ['sixes', 'suds', 'giant', 'diag', 'quilt',`);
edit('lib/puzzle-categories.js',
  `suds: 'Classic sudoku, 9x9', diag:`,
  `suds: 'Classic sudoku, 9x9', giant: 'Giant sudoku, 16x16', diag:`);
edit('lib/puzzle-categories.js',
  `    start: 'Sixes if you have two minutes. Suds if you want the classic.`,
  `    start: 'Sixes if you have two minutes. Suds if you want the classic. Giant if you have an evening.`);
edit('lib/puzzle-categories.js',
  `a Rim with thirteen of its thirty-six gutters.'],`,
  `a Rim with thirteen of its thirty-six gutters, a Giant with ninety of 256.'],`);

// 15. lib/daily-groups.js — 'Classic sudokus' goes to five (the ceiling)
edit('lib/daily-groups.js',
  `  { name: 'Classic sudokus', cat: 'Sudoku', keys: ['suds', 'sixes', 'diag', 'whittle'] },`,
  `  { name: 'Classic sudokus', cat: 'Sudoku', keys: ['suds', 'sixes', 'giant', 'diag', 'whittle'] },`);
edit('lib/daily-groups.js', `  // Sudoku (13)`, `  // Sudoku (14)`);

// 16. lib/finish-sets.js — every live game sits in at least one set
after('lib/finish-sets.js',
  `  { name: 'Edge sums', cat: 'Sudoku', keys: ['sando', 'rim', 'sixes'] },`,
  `\n  { name: 'Big grids', cat: 'Sudoku', keys: ['giant', 'suds', 'sando'] },`);

// 17. lib/circuits.js — the sudoku FAMILY list (home shelf, cap hue). NOT the Dojo.
edit('lib/circuits.js',
  `export const SUDOKU_POOL = ['towers', 'sixes', 'cages', 'suds', 'diag', 'rim', 'quilt', 'polka', 'knight', 'frame', 'mercury', 'sando'];`,
  `export const SUDOKU_POOL = ['towers', 'sixes', 'cages', 'suds', 'diag', 'rim', 'quilt', 'polka', 'knight', 'frame', 'mercury', 'sando', 'giant'];`);

// 18. lib/finish-beats.js — the sudoku ripple, sixteen boxes of 4x4
after('lib/finish-beats.js', `  rim: grid('.ri-cell'),`, `\n  giant: { kind: 'ripple', last: true, cell: '.gi-cell', box: [4, 4], per: 34 },`);


// 19. CLAUDE.md — the living document
after('CLAUDE.md',
  `| Rim | thirteen of the thirty-six gutters printed instead of the weekday 16 to 30 (from 2026-09-08) |`,
  `\n| Giant | ninety of 256 clues and the only day that needs more than singles, against 96 to 128 on weekdays (from 2026-10-18) |`);
edit('CLAUDE.md',
  `## Frame and Rim are the GUTTER SUDOKUS, and they share one engine (launched 2026-09-08)`,
  `## Giant is the 16x16 SUDOKU, and the phone plays it a quarter at a time (launched 2026-10-13)

An ordinary sudoku at sixteen: 16 rows, 16 columns and sixteen 4x4 boxes, each holding the
symbols 1 to 9 then A to G. The bank stores a symbol as 1..16; the client draws 10..16 as A..G
and the keyboard takes A-G. Route \`/giant\`, key \`giant\`, legacy hue slate indigo #3949ab.

- **NOT in Enter the Dojo (owner, 2026-10-13).** It joins the Sudoku category, \`SUDOKU_POOL\`
  (home Sudoku shelf, daily cap hue) and the 'Classic sudokus' set, but \`lib/dojo.js\` is untouched.
- **The ramp is CLUES, not technique, and that is measured.** \`node scripts/gen-giant.mjs
  --measure 12\`: a greedy dig under singles alone bottoms out at 90 to 98 clues (median 94), and
  under the full toolkit at 89 to 97 (median 94). The harder techniques buy almost nothing on a
  16x16, so a level-2 weekday above ~95 clues would be rejected forever. Weekdays run level 1:
  Mon 128, Tue 120, Wed 112, Thu 106, Fri 100, Sat 96. Only the **Sunday Edition (90)** is dug
  past the singles floor by local search and pinned to level 2.
- **Uniqueness is proved twice.** The verifier's policed logical solver only makes deductions
  that follow from the clues, so finishing the grid proves one solution; its exhaustive counter
  (per-cell option sets plus forced singles at every node) re-proves it on every weekday board.
  A Sunday costs the counter ~25s, so Sundays run it only under \`verify-giant.mjs --full\`.
  \`scripts/giant-mutation-test.mjs\` breaks the bank nine ways; all caught.
- **The phone has a WHOLE BOARD / ZOOM IN switch** (under 560px, remembered in
  \`sot_giant_zoom\`, zoom by default). Sixteen squares across 390px are ~22px, half a finger
  target, so the zoomed view plays one 8x8 quarter (two boxes each way) at full size with a
  minimap to move. Selecting a square anywhere brings its quarter into view. **A finished board
  always shows whole**: the finish ripple (\`lib/finish-beats.js\`, box [4, 4]) wants all 256.
- Client is \`mkgiant.py\` (not committed), a transform of DiagClient with the diagonal taken out.
- Bank 2026-10-13 to 2026-12-31 (80 boards). Extend with \`gen-giant.mjs --until\`; it only appends.

## Frame and Rim are the GUTTER SUDOKUS, and they share one engine (launched 2026-09-08)`);

console.log(`wire-giant (with CLAUDE.md): ${applied} edits applied, ${skipped} already present`);
