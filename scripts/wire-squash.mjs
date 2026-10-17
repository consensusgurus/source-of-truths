// scripts/wire-squash.mjs — wires Squash, the daily match-three fruit game,
// into every registry in one pass. Anchored on the Snake rows, so Squash sits
// beside Blocks, Snake, Dario and Sweep everywhere the Arcade is listed.
//
// NO NEW-GAME POP-UP (owner, 2026-10-17): Squash is added to NO_PREMIERE and
// gets no PREMIERES row. It still takes the launch pin, which only orders the
// to-play list.
//
// Anchored: every anchor must match EXACTLY ONCE or the script throws, and an
// edit whose replacement is already present is skipped, so a re-run is safe.
//
//   node scripts/wire-squash.mjs <dir>
import fs from 'fs';
import path from 'path';

const root = process.argv[2] || '.';
let applied = 0, skipped = 0;
const rd = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const wr = (f, s) => fs.writeFileSync(path.join(root, f), s);
function sub(file, anchor, replacement) {
  const src = rd(file);
  if (src.includes(replacement)) { skipped++; return; }
  const n = src.split(anchor).length - 1;
  if (n !== 1) throw new Error(`${file}: anchor matched ${n} times, expected 1\n  ${anchor.slice(0, 160)}`);
  wr(file, src.replace(anchor, replacement));
  applied++;
}

const NAME = 'Squash';
const TAG = 'Same fruit, same board';
const TAGLONG = 'Match-three with fruit; the same board and refills for everybody';
const HOW = 'Swap fruit to line up three of a kind, set off cascades and special fruit, and score what you can in a five-minute blitz. Everyone gets the same board and the same falling fruit, and your best run counts.';
const COLOR = '#db2777', NAVY = '#f9a8d4', BG = '#fce7f3', BORDER = 'rgba(219,39,119,0.4)';
const BLURB = 'A match-three with fruit: swap to line up three of a kind and chase the cascades. Same board and the same falling fruit for everybody, five minutes on the clock, and your best run counts.';

// ─── 1. lib/daily-games.js: the row, and no premiere ─────────────────────────
sub('lib/daily-games.js',
  `  { key: 'snake', miss: 'Moves', unit: 'apples',`,
  `  { key: 'squash', miss: null, unit: 'points', name: '${NAME}', cat: 'Arcade', tag: '${TAG}', tagLong: '${TAGLONG}', how: '${HOW}', color: '${COLOR}', colorNavy: '${NAVY}' },\n  { key: 'snake', miss: 'Moves', unit: 'apples',`);
sub('lib/daily-games.js',
  `// new-puzzle pop-up by owner ruling.\nexport const NO_PREMIERE = new Set(['dario']);`,
  `// new-puzzle pop-up by owner ruling, and Squash (owner, 2026-10-17) the same.\nexport const NO_PREMIERE = new Set(['dario', 'squash']);`);

// ─── 2. lib/sunday-editions.js ───────────────────────────────────────────────
sub('lib/sunday-editions.js',
  `//   snake   every apple grows the snake by two squares instead of one, so`,
  `//   squash  the same five-minute blitz on a 9x9 board, against the weekday 8x8\n//   snake   every apple grows the snake by two squares instead of one, so`);
sub('lib/sunday-editions.js', `'yose', 'blocks', 'snake', 'chomp',`, `'yose', 'blocks', 'snake', 'squash', 'chomp',`);

// ─── 3. IQ: one point a day, as for the other arcade games ───────────────────
sub('lib/quiz-xp.js', `export const XP_DAILY_CAP = { blocks: 1, sweep: 1, snake: 1, dario: 1 };`, `export const XP_DAILY_CAP = { blocks: 1, sweep: 1, snake: 1, dario: 1, squash: 1 };`);

// ─── 4. end card, launch pins ────────────────────────────────────────────────
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['squash', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['squash', `);
sub('app/DailyEndCard.jsx',
  `  blocks: { accent: '#1d4ed8', badgeBg: '#1d4ed8', badgeInk: T.white, Fin: Grid3x3 },`,
  `  blocks: { accent: '#1d4ed8', badgeBg: '#1d4ed8', badgeInk: T.white, Fin: Grid3x3 },\n  squash: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: Grid3x3 },`);
sub('app/DailyEndCard.jsx',
  `  { key: 'blocks', cat: 'arcade',`,
  `  { key: 'squash', cat: 'arcade',    name: '${NAME}', tag: '${TAG}',   blurb: '${BLURB}', href: '/squash' },\n  { key: 'blocks', cat: 'arcade',`);

// ─── 5. promo, grid, strip ───────────────────────────────────────────────────
sub('app/DailyGamesPromo.jsx',
  `  { key: 'blocks', href: '/blocks', name: 'Blocks',`,
  `  { key: 'squash', href: '/squash', name: '${NAME}', tag: 'same fruit, same board', store: 'sot_squash_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },\n  { key: 'blocks', href: '/blocks', name: 'Blocks',`);
sub('app/DailyGamesGrid.jsx',
  `  { key: 'blocks', href: '/blocks', name: 'Blocks', tag:`,
  `  { key: 'squash', href: '/squash', name: '${NAME}', tag: '${TAG}', img: '/games/btn-squash.png' },\n  { key: 'blocks', href: '/blocks', name: 'Blocks', tag:`);
sub('app/DailyGamesGrid.jsx', `{ key: 'arcade', label: 'Arcade', keys: ['blocks', 'snake', 'dario', 'sweep'] },`, `{ key: 'arcade', label: 'Arcade', keys: ['blocks', 'snake', 'squash', 'dario', 'sweep'] },`);
sub('app/DailyStrip.jsx',
  `  { key: 'blocks', href: '/blocks', name: 'Blocks', img:`,
  `  { key: 'squash', href: '/squash', name: '${NAME}', img: '/games/btn-squash.png', store: 'sot_squash_day', tag: "${TAG}" , cat: 'Arcade' },\n  { key: 'blocks', href: '/blocks', name: 'Blocks', img:`);
sub('app/DailyStrip.jsx', `const ACCENTS = { herd: '#fcd34d', `, `const ACCENTS = { squash: '${NAVY}', herd: '#fcd34d', `);
sub('app/DailyStrip.jsx', `const TCOL = { herd: '#92400e', `, `const TCOL = { squash: '${COLOR}', herd: '#92400e', `);

// ─── 6. archive ──────────────────────────────────────────────────────────────
sub('app/archive/page.js', `import { PUZZLES as BLOCKS_FULL } from '../blocks/puzzles';`,
  `import { PUZZLES as BLOCKS_FULL } from '../blocks/puzzles';\nimport { PUZZLES as SQUASH_FULL } from '../squash/puzzles';`);
sub('app/archive/page.js', `const BLOCKS = BLOCKS_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`,
  `const BLOCKS = BLOCKS_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));\nconst SQUASH = SQUASH_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`);
sub('app/archive/page.js',
  `  { key: 'blocks', name: 'Blocks', path: '/blocks',`,
  `  { key: 'squash', name: '${NAME}', path: '/squash', tag: '${TAG}', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: SQUASH },\n  { key: 'blocks', name: 'Blocks', path: '/blocks',`);

// ─── 7. the four puzzle-map registries ───────────────────────────────────────
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_snake } from '@/app/snake/puzzles';`,
    `import { PUZZLES as P_snake } from '@/app/snake/puzzles';\nimport { PUZZLES as P_squash } from '@/app/squash/puzzles';`);
}
sub('lib/daily-slate.js', `  snake: P_snake,\n`, `  snake: P_snake,\n  squash: P_squash,\n`);
for (const f of ['app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `snake: P_snake, `, `snake: P_snake, squash: P_squash, `);
}

// ─── 8. key lists and alternations ───────────────────────────────────────────
sub('app/api/quiz/daily-status/route.js', `|blocks|snake|dario|`, `|blocks|snake|squash|dario|`);
sub('app/quizzes/QuizHomeClient.jsx', `|blocks|snake|dario|`, `|blocks|snake|squash|dario|`);
sub('app/DailySlateRail.jsx', `'deep', 'anon', 'blocks', 'snake', 'dario',`, `'deep', 'anon', 'blocks', 'snake', 'squash', 'dario',`);
sub('lib/quiz-catalog.js', `'blocks', 'snake', 'dario', 'chomp',`, `'blocks', 'snake', 'squash', 'dario', 'chomp',`);
sub('lib/loft.js', `'blocks', 'snake', 'dario', 'bracket',`, `'blocks', 'snake', 'squash', 'dario', 'bracket',`);

// ─── 9. skills, challenge metric, finish beat, glyph ─────────────────────────
sub('lib/daily-skills.js', `snake: ['speed', 'plan'], blocks: ['speed', 'spa'],`, `snake: ['speed', 'plan'], squash: ['spa', 'plan'], blocks: ['speed', 'spa'],`);
sub('lib/challenge-metric.js', `  snake: { unit: 'apples', one: 'apple', dir: 'high', say: 'ate' },`,
  `  snake: { unit: 'apples', one: 'apple', dir: 'high', say: 'ate' },\n  squash: { unit: 'points', one: 'point', dir: 'high', say: 'scored' },`);
sub('lib/finish-beats.js', `  snake: { kind: 'lap', last: true },`, `  snake: { kind: 'lap', last: true },\n  squash: { kind: 'lap', last: true },`);
sub('lib/game-glyphs.js',
  `  snake: 'M4 19h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6M19.5 5h.01', // a winding snake and its apple`,
  `  snake: 'M4 19h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6M19.5 5h.01', // a winding snake and its apple\n  squash: 'M3 3h18v18H3zM8 8.5a2.5 2.5 0 1 0 .01 0M16 8.5a2.5 2.5 0 1 0 .01 0M8 15.5a2.5 2.5 0 1 0 .01 0M13.5 15.5h5', // a tray of fruit, one squashed flat`);

// ─── 10. the Arcade landing page and its set ─────────────────────────────────
const PC = 'lib/puzzle-categories.js';
sub(PC, `title: 'Free Daily Arcade Games: Falling Blocks, Snake, a Side-Scroller and Endless Minesweeper | Mind Loft',`,
  `title: 'Free Daily Arcade Games: Falling Blocks, Snake, Match-3, a Side-Scroller and Endless Minesweeper | Mind Loft',`);
sub(PC, `h1: 'Free Daily Arcade Games: Falling Blocks, Snake, a Side-Scroller and Endless Minesweeper',`,
  `h1: 'Free Daily Arcade Games: Falling Blocks, Snake, Match-3, a Side-Scroller and Endless Minesweeper',`);
sub(PC, `description: 'Four free daily arcade games with the same board for everyone: falling blocks in a fixed order that never speeds up, a snake game where everyone eats the same apples,`,
  `description: 'Five free daily arcade games with the same board for everyone: falling blocks in a fixed order that never speeds up, a snake game where everyone eats the same apples, Squash, a match-three with fruit and the same refills for everyone,`);
sub(PC, `lede: 'Four arcade games a day where everyone gets the same board.`, `lede: 'Five arcade games a day where everyone gets the same board.`);
sub(PC, `Snake is the classic with wrapping edges and the same apples for everyone.`,
  `Snake is the classic with wrapping edges and the same apples for everyone. Squash is a match-three with fruit: the same board and the same fruit dropping into each column, so a cascade is earned rather than lucky.`);
sub(PC, `    keys: ['blocks', 'snake', 'dario', 'sweep'],\n    generic: { blocks: 'Falling blocks, fixed order', snake: 'Snake game, same apples',`,
  `    keys: ['blocks', 'snake', 'squash', 'dario', 'sweep'],\n    generic: { blocks: 'Falling blocks, fixed order', snake: 'Snake game, same apples', squash: 'Match-3 fruit game',`);
sub(PC, `      ['Are they free?', 'Both, every day, no account required.'],\n    ],\n  },\n];`,
  `      ['Are they free?', 'All five, every day, no account required.'],\n    ],\n  },\n];`);
// The Arcade finish set is at the four-key ceiling (scripts/verify-finish-sets.mjs),
// so Squash gets a second, overlapping arcade set with the two other board games.
sub('scripts/verify-finish-sets.mjs',
  `if (!p || !p.open.includes('blocks') || !p.open.includes('snake')) fail('sweep should push blocks and snake');`,
  `if (!p || p.set.cat !== 'Arcade' || !p.open.includes('blocks')) fail('sweep should push an Arcade set with blocks open');`);
sub('lib/finish-sets.js', `  { name: 'Arcade', cat: 'Arcade', keys: ['sweep', 'blocks', 'snake', 'dario'] },`,
  `  { name: 'Arcade', cat: 'Arcade', keys: ['sweep', 'blocks', 'snake', 'dario'] },\n  { name: 'Puzzle arcade', cat: 'Arcade', keys: ['squash', 'blocks', 'sweep'] },`);

// ─── 11. CLAUDE.md ───────────────────────────────────────────────────────────
{
  const src = rd('CLAUDE.md');
  const marker = '## Squash (`/squash`): the daily match-three (launched 2026-10-17)';
  if (!src.includes(marker)) {
    wr('CLAUDE.md', src.replace(/\s*$/, '\n') + `
${marker}

A match-three with fruit as a daily. Key/route \`squash\`, category **Arcade**, \`miss: null\`,
\`unit: 'points'\` (a tally game: the score is raw points, uncapped, against the day's par), legacy
accent \`#db2777\` / \`#f9a8d4\`. Arcade rules throughout: unlimited runs, the board and the local
record keep the BEST run, \`XP_DAILY_CAP.squash = 1\`. Wired by \`scripts/wire-squash.mjs\`.
**No new-game pop-up (owner, 2026-10-17): \`squash\` is in NO_PREMIERE and has no PREMIERES row.**
Not in the Arcade circuit; whether it joins is an owner call.

- **The day is generated, not banked.** \`lib/squash-engine.js\` deals the opening board off the
  quizId and gives every COLUMN its own seeded stream of fruit, so the k-th fruit to drop into a
  column is the same for everybody. The same file is the engine the client plays and the verifier
  proves. \`app/squash/puzzles.js\` carries the frame (size, seconds) and a MEASURED par, written by
  \`scripts/gen-squash.mjs\`: the midpoint of a greedy bot and three random swappers
  (\`scripts/squash-par.mjs\`) at a blitz pace of 75 swaps, rounded to 100. Any engine change moves par; the verifier fails
  until the bank is regenerated.
- **Rules:** a FIVE-MINUTE BLITZ (owner, 2026-10-17; it launched an hour earlier as 25 moves):
  the clock starts on the first swap, swaps are unlimited until it runs out, and fruit already
  falling at zero still lands. Weekday 8x8, Sunday Edition 9x9; six fruit. Pausing (or hiding
  the tab) stops the clock and COVERS the board, so a pause cannot be used to plan. A swap that
  makes no match slides back and costs nothing. Four in a line makes a slicer (clears the line it
  cuts across), an L or T a bomb (3x3), five a punch bowl (clears a fruit kind). Special pairs
  combo with no match. Points: 10 a fruit times the cascade wave, plus 60 / 100 / 200 for making a
  slicer / bomb / bowl. A board with no move shuffles off a seeded stream.
- **Input:** drag onto a neighbour, or tap then tap; arrows + Enter on a keyboard. After 9 idle
  seconds the first valid swap in reading order wiggles (a nudge, never the best move).
- **Ties break on fewer swaps** (every run is five minutes). A run in progress is saved after
  every swap and every few seconds, and comes back paused.
- \`scripts/verify-squash.mjs\` checks the bank and the engine (every special and combo, the
  shuffle, determinism of the same moves, and that each par still matches the engine).
`);
    applied++;
  } else skipped++;
}

console.log(`wire-squash: ${applied} edits applied, ${skipped} already present`);
