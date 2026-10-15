// scripts/wire-jig.mjs: wires Jig, the daily jigsaw (Logic), into every
// registry, beside Snug.
//
// Anchored edits: every anchor must match EXACTLY ONCE or the script throws,
// and an edit whose insertion is already present is skipped, so a re-run is safe.
//   node scripts/wire-jig.mjs <dir>
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

const TAG = 'The daily jigsaw';
const HOW = 'A new photograph every day, cut into 48 to 80 interlocking pieces. Drag each piece to its place and it snaps in; sort the tray by edges or colors. Finish the picture; the clock decides.';
const BLURB = 'A new photograph every day, cut into interlocking pieces, the same cut for everyone. Drag them into place, sort the tray by edges or colors, and race the clock.';
const COLOR = '#0e7490', NAVY = '#67e8f9', BG = '#e6f4f7', BORDER = 'rgba(14,116,144,0.38)';

// 1. lib/daily-games.js
afterLine('lib/daily-games.js', "{ key: 'snug', miss: null, name: 'Snug', cat: 'Logic'", [
  `  { key: 'jig', miss: null, name: 'Jig', cat: 'Logic', tag: '${TAG}', how: '${HOW}', color: '${COLOR}', colorNavy: '${NAVY}' },`]);
afterLine('lib/daily-games.js', "{ key: 'scram', from: '2026-10-14', until: '2026-10-18' },", [
  `  { key: 'jig', from: '2026-10-15', until: '2026-10-19' },`]);
sub('lib/daily-games.js', `'sixes', 'sums', 'snug',`, `'sixes', 'sums', 'snug', 'jig',`);

// 2. lib/sunday-editions.js
sub('lib/sunday-editions.js', '//   snug    a 7x7 board', '//   jig     the 80-piece cut, the biggest of the week (Saturday is 77)\n//   snug    a 7x7 board');
sub('lib/sunday-editions.js', `'junkyard', 'snug', 'duet',`, `'junkyard', 'snug', 'jig', 'duet',`);

// 3. end card, launch pin, order
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['jig', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['jig', `);
afterLine('app/DailyEndCard.jsx', "  snug: { accent: '#3b5bdb', badgeBg: '#3b5bdb', badgeInk: T.white, Fin: Puzzle },", [
  `  jig: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: Puzzle },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'snug',   cat: 'logic',     name: 'Snug',", [
  `  { key: 'jig',    cat: 'logic',     name: 'Jig', tag: '${TAG}',   blurb: '${BLURB}', href: '/jig' },`]);

// 4. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'snug', href: '/snug'", [
  `  { key: 'jig', href: '/jig', name: 'Jig', tag: 'the daily jigsaw', store: 'sot_jig_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'snug', href: '/snug'", [
  `  { key: 'jig', href: '/jig', name: 'Jig', tag: '${TAG}', img: '/games/btn-jig.png' },`]);
sub('app/DailyGamesGrid.jsx', `'junkyard', 'snug', 'duet',`, `'junkyard', 'snug', 'jig', 'duet',`);
afterLine('app/DailyStrip.jsx', "{ key: 'snug', href: '/snug'", [
  `  { key: 'jig', href: '/jig', name: 'Jig', img: '/games/btn-jig.png', store: 'sot_jig_day', tag: "${TAG}" , cat: 'Logic' },`]);
sub('app/DailyStrip.jsx', `snug: '#91a7ff',`, `snug: '#91a7ff', jig: '${NAVY}',`);
sub('app/DailyStrip.jsx', `snug: '#3b5bdb',`, `snug: '#3b5bdb', jig: '${COLOR}',`);

// 5. archive
sub('app/archive/page.js', `import { PUZZLES as SNUG_FULL } from '../snug/puzzles';`,
  `import { PUZZLES as SNUG_FULL } from '../snug/puzzles';\nimport { PUZZLES as JIG_FULL } from '../jig/puzzles';`);
afterLine('app/archive/page.js', 'const SNUG = SNUG_FULL.map(', [
  'const JIG = JIG_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));']);
afterLine('app/archive/page.js', "{ key: 'snug', name: 'Snug', path: '/snug'", [
  `  { key: 'jig', name: 'Jig', path: '/jig', tag: 'The daily jigsaw', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: JIG },`]);

// 6. the four puzzle-map registries
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_snug } from '@/app/snug/puzzles';`,
    `import { PUZZLES as P_snug } from '@/app/snug/puzzles';\nimport { PUZZLES as P_jig } from '@/app/jig/puzzles';`);
  sub(f, `snug: P_snug,`, `snug: P_snug, jig: P_jig,`);
}

// 7. alternations, rails, catalog, loft
sub('app/api/quiz/daily-status/route.js', `|junkyard|snug|duet|`, `|junkyard|snug|jig|duet|`);
sub('app/quizzes/QuizHomeClient.jsx', `|junkyard|snug|duet|`, `|junkyard|snug|jig|duet|`);
sub('app/DailySlateRail.jsx', `'junkyard', 'snug', 'duet',`, `'junkyard', 'snug', 'jig', 'duet',`);
sub('lib/quiz-catalog.js', `'junkyard', 'snug', 'duet',`, `'junkyard', 'snug', 'jig', 'duet',`);
sub('lib/loft.js', `'junkyard', 'snug', 'duet',`, `'junkyard', 'snug', 'jig', 'duet',`);

// 8. glyph
afterLine('lib/game-glyphs.js', "  snug: 'M3 3h6v6H3z", [
  "  jig: 'M4 8h4.5a2.5 2.5 0 1 1 5 0H18v4.5a2.5 2.5 0 1 1 0 5V20H4z',  // one jigsaw piece, a tab on top and on the right"]);

// 9. groups and sets (the Grid filling set's landing copy in lib/puzzle-sets.js was rewritten for four by hand)
sub('lib/daily-groups.js', `{ name: 'Grid filling', cat: 'Logic', keys: ['duet', 'lamps', 'snug'] },`, `{ name: 'Grid filling', cat: 'Logic', keys: ['duet', 'lamps', 'snug', 'jig'] },`);
sub('lib/finish-sets.js', `{ name: 'Fit the pieces', cat: 'Logic', keys: ['snug', 'jester', 'plot'] },`, `{ name: 'Fit the pieces', cat: 'Logic', keys: ['snug', 'jig', 'jester', 'plot'] },`);

// 10. the logic landing page
sub('lib/puzzle-categories.js', `description: 'Twenty-three free daily logic puzzles: a nonogram,`, `description: 'Twenty-four free daily logic puzzles: a daily jigsaw, a nonogram,`);
sub('lib/puzzle-categories.js', `lede: 'Twenty-three logic puzzles with one new board apiece every day.`, `lede: 'Twenty-four logic puzzles with one new board apiece every day, a daily jigsaw among them.`);
sub('lib/puzzle-categories.js', `'duet', 'lamps', 'snug', 'park',`, `'duet', 'lamps', 'snug', 'jig', 'park',`);
sub('lib/puzzle-categories.js', `['Are they free?', 'All twenty-three,`, `['Are they free?', 'All twenty-four,`);
sub('lib/puzzle-categories.js', `snug: 'Shape-fitting (polyomino tiling)',`, `snug: 'Shape-fitting (polyomino tiling)', jig: 'Jigsaw puzzle',`);

// 11. CLAUDE.md
afterLine('CLAUDE.md', '| Snug | a 7x7 board with four holes and eight pieces', [
  '| Jig | the 80-piece cut, the biggest of the week against Saturday\'s 77 (from launch, 2026-10-15) |']);
sub('CLAUDE.md', `## Scram is the THEMED WORD SCRAMBLE, raced on the clock (launched 2026-10-14)`,
`## Jig is the DAILY JIGSAW, one Commons photo cut the same way for everyone (launched 2026-10-15)

Route \`/jig\`, key \`jig\`, Logic, legacy hue cyan #0e7490. Owner rulings 2026-10-15, all from the mockup
canvas "Daily Jigsaw Mockup":

- **The cut is capped at 80 and kept close to it all week**: Mon 8x6 48, Tue 9x6 54, Wed 10x6 60, Thu 9x7 63,
  Fri 10x7 70, Sat 11x7 77, Sunday Edition 10x8 80. Pieces are drawn LARGE on screen; on a phone the tray is a
  two-row horizontal strip.
- **Real photos**: every day is a Wikimedia Commons FEATURED picture under a free licence (never GFDL-only),
  landscape, scored for detail (no more than a fifth flat) and approved on a contact sheet. The pool is
  \`scripts/jig-photos.mjs\`; \`scripts/gen-jig.mjs\` deals it from launch, deterministic from the pool's ORDER,
  so extend the bank by appending to the pool, never reordering. Photos are fetched through \`/api/jig/img?n=\`
  (Focus's design: Special:FilePath, one-year edge cache, 404 for a day not yet live), which also makes them
  same-origin for the canvas colour read.
- **The empty board shows nothing.** No outline of an empty spot is ever drawn: an outline is its piece's shape.
- **The tray is All, or Sort into two bins**, by Edges (edge pieces / middle) or by Colors (one of four colour
  groups k-means'd from the photo's per-piece averages, named by hue / the rest). Same on the phone.
- **Drag to place**, snap within 0.42 of a piece of its own spot; a wrong drop goes back to the tray for nothing.
  A tap picks a piece for a tap on the board. Pieces never rotate. Placed pieces lock.
- **Scoring is Snug's**: flat 10 on a solve, \`miss: null\`, the clock decides. Peek shows the picture for a
  moment and adds 15 seconds to the clock (\`pen\` in the save, included in \`timeElapsed\`). The free first-play
  hint drops a corner in. In SOLVE_ONLY.
- Wired by \`scripts/wire-jig.mjs\`. Tile art \`scripts/gen-jig-tile.py\`. Checker \`scripts/verify-jig.mjs\`.

## Scram is the THEMED WORD SCRAMBLE, raced on the clock (launched 2026-10-14)`);

console.log(`wire-jig: ${applied} edits applied, ${skipped} already present`);
