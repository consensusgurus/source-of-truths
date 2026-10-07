// scripts/wire-snake.mjs — wires Snake, the third Arcade daily, into every
// registry in one pass. Anchored on the Blocks rows, so Snake sits beside
// Blocks and Sweep everywhere they are listed.
//
// NO PREMIERES ROW (owner, 2026-10-07): Snake launches without the new-puzzle
// pop-up. It still takes the launch pin, which only orders the to-play list.
//
// An ANCHORED script in the shape of scripts/wire-clade-dossier-lamps.mjs:
// every anchor must match EXACTLY ONCE or the script throws, and an edit whose
// replacement is already present is skipped, so a re-run is safe.
//
//   node scripts/wire-snake.mjs <dir>
import fs from 'fs';
import path from 'path';

const root = process.argv[2] || '.';
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

const NAME = 'Snake';
const TAG = 'Same apples, same order';
const HOW = 'The classic snake game with the same apples for everybody. The edges wrap, the pace never speeds up, and you can play as many runs as you like with your best one scored.';
const COLOR = '#65a30d', NAVY = '#bef08a', BG = '#eef7dc', BORDER = 'rgba(101,163,13,0.4)';
const BLURB = 'The classic snake game, with the same apples in the same order for everybody. The edges wrap, it never speeds up, and your best run counts. Every apple grows you by two on Sundays.';

// ─── 1. lib/daily-games.js ──────────────────────────────────────────────────
edit('lib/daily-games.js',
  `  { key: 'blocks', miss: 'Shapes', unit: 'rows',`,
  `  { key: 'snake', miss: 'Moves', unit: 'apples', name: '${NAME}', cat: 'Arcade', tag: '${TAG}', how: '${HOW}', color: '${COLOR}', colorNavy: '${NAVY}' },\n  { key: 'blocks', miss: 'Shapes', unit: 'rows',`);

// ─── 2. the miss label's singular ───────────────────────────────────────────
edit('lib/daily-row-stats.js', `  Misses: 'miss',\n`, `  Misses: 'miss',\n  Moves: 'move',\n`);

// ─── 3. lib/sunday-editions.js ──────────────────────────────────────────────
edit('lib/sunday-editions.js',
  `//   blocks  the well narrows from ten columns to eight, which is the right`,
  `//   snake   every apple grows the snake by two squares instead of one, so\n//           the board fills twice as fast and par drops from 20 to 15\n//   blocks  the well narrows from ten columns to eight, which is the right`);
edit('lib/sunday-editions.js', `'yose', 'blocks', 'chomp',`, `'yose', 'blocks', 'snake', 'chomp',`);

// ─── 4. IQ: one point a day, as for the other arcade games ──────────────────
edit('lib/quiz-xp.js', `export const XP_DAILY_CAP = { blocks: 1, sweep: 1 };`, `export const XP_DAILY_CAP = { blocks: 1, sweep: 1, snake: 1 };`);

// ─── 5. app/DailyEndCard.jsx + the daily-order pin ──────────────────────────
edit('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['snake', `);
edit('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['snake', `);
edit('app/DailyEndCard.jsx',
  `  blocks: { accent: '#1d4ed8',`,
  `  snake: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: Grid3x3 },\n  blocks: { accent: '#1d4ed8',`);
edit('app/DailyEndCard.jsx',
  `  { key: 'blocks', cat: 'arcade',`,
  `  { key: 'snake', cat: 'arcade',    name: '${NAME}', tag: '${TAG}',   blurb: '${BLURB}', href: '/snake' },\n  { key: 'blocks', cat: 'arcade',`);

// ─── 6. app/DailyGamesPromo.jsx ─────────────────────────────────────────────
edit('app/DailyGamesPromo.jsx',
  `  { key: 'blocks', href: '/blocks', name: 'Blocks',`,
  `  { key: 'snake', href: '/snake', name: '${NAME}', tag: 'same apples, same order', store: 'sot_snake_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },\n  { key: 'blocks', href: '/blocks', name: 'Blocks',`);

// ─── 7. app/DailyGamesGrid.jsx ──────────────────────────────────────────────
edit('app/DailyGamesGrid.jsx',
  `  { key: 'blocks', href: '/blocks', name: 'Blocks', tag:`,
  `  { key: 'snake', href: '/snake', name: '${NAME}', tag: '${TAG}', img: '/games/btn-snake.png' },\n  { key: 'blocks', href: '/blocks', name: 'Blocks', tag:`);
edit('app/DailyGamesGrid.jsx', `{ key: 'arcade', label: 'Arcade', keys: ['blocks', 'sweep'] },`, `{ key: 'arcade', label: 'Arcade', keys: ['blocks', 'snake', 'sweep'] },`);

// ─── 8. app/DailyStrip.jsx ──────────────────────────────────────────────────
edit('app/DailyStrip.jsx',
  `  { key: 'blocks', href: '/blocks', name: 'Blocks', img:`,
  `  { key: 'snake', href: '/snake', name: '${NAME}', img: '/games/btn-snake.png', store: 'sot_snake_day', tag: "${TAG}" , cat: 'Arcade' },\n  { key: 'blocks', href: '/blocks', name: 'Blocks', img:`);

// ─── 9. app/daily/page.js ───────────────────────────────────────────────────
edit('app/daily/page.js',
  `import { PUZZLES as BLOCKS_FULL } from '../blocks/puzzles';`,
  `import { PUZZLES as BLOCKS_FULL } from '../blocks/puzzles';\nimport { PUZZLES as SNAKE_FULL } from '../snake/puzzles';`);
{
  // The slim copy sits next to Blocks' own, whatever shape that line takes.
  const p = path.join(root, 'app/daily/page.js');
  const src = fs.readFileSync(p, 'utf8');
  const line = `const SNAKE = SNAKE_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`;
  if (src.includes(line)) skipped++;
  else {
    const m = src.match(/\nconst BLOCKS = [^\n]*\n/);
    if (!m) throw new Error('app/daily/page.js: const BLOCKS line not found');
    fs.writeFileSync(p, src.replace(m[0], `${m[0]}${line}\n`));
    applied++;
  }
}
edit('app/daily/page.js',
  `  { key: 'blocks', name: 'Blocks', path: '/blocks',`,
  `  { key: 'snake', name: '${NAME}', path: '/snake', tag: '${TAG}', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: SNAKE },\n  { key: 'blocks', name: 'Blocks', path: '/blocks',`);

// ─── 10. app/daily/DailyArchiveClient.jsx ───────────────────────────────────
edit('app/daily/DailyArchiveClient.jsx', `{ key: 'arcade', label: 'Arcade', keys: ['blocks', 'sweep'] },`, `{ key: 'arcade', label: 'Arcade', keys: ['blocks', 'snake', 'sweep'] },`);
edit('app/daily/DailyArchiveClient.jsx', `blocks: '#93b4f0', sweep:`, `blocks: '#93b4f0', snake: '${NAVY}', sweep:`);

// ─── 11. key lists ──────────────────────────────────────────────────────────
edit('lib/sitemap-entries.js', `'strata', 'blocks', 'chomp',`, `'strata', 'blocks', 'snake', 'chomp',`);
edit('app/DailySlateRail.jsx', `'anon', 'blocks', 'chomp',`, `'anon', 'blocks', 'snake', 'chomp',`);
edit('lib/quiz-catalog.js', `'blocks', 'chomp', 'sweep',`, `'blocks', 'snake', 'chomp', 'sweep',`);
edit('lib/loft.js', `'blocks', 'bracket', 'cages',`, `'blocks', 'snake', 'bracket', 'cages',`);
edit('app/api/quiz/daily-status/route.js', `|blocks|chomp|`, `|blocks|snake|chomp|`);
edit('app/quizzes/QuizHomeClient.jsx', `|blocks|chomp|`, `|blocks|snake|chomp|`);

// ─── 12. the puzzle-map registries, sunday-slate included ───────────────────
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  edit(f, `import { PUZZLES as P_blocks } from '@/app/blocks/puzzles';`,
    `import { PUZZLES as P_blocks } from '@/app/blocks/puzzles';\nimport { PUZZLES as P_snake } from '@/app/snake/puzzles';`);
}
edit('lib/daily-slate.js', `  blocks: P_blocks,\n`, `  blocks: P_blocks,\n  snake: P_snake,\n`);
for (const f of ['app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  edit(f, `blocks: P_blocks, chomp: P_chomp`, `blocks: P_blocks, snake: P_snake, chomp: P_chomp`);
}

// ─── 13. lib/game-glyphs.js ─────────────────────────────────────────────────
edit('lib/game-glyphs.js',
  `  blocks: 'M4 13h5v5H4zM9 13h5v5H9zM9 18h5v3H9zM14 3h5v5h-5zM19 3v5', // the same shapes`,
  `  blocks: 'M4 13h5v5H4zM9 13h5v5H9zM9 18h5v3H9zM14 3h5v5h-5zM19 3v5', // the same shapes\n  snake: 'M4 19h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6M19.5 5h.01', // a winding snake and its apple`);

// ─── 14. lib/puzzle-categories.js: the Arcade landing ───────────────────────
const PC = 'lib/puzzle-categories.js';
edit(PC,
  `    title: 'Free Daily Arcade Games: Falling Blocks and Endless Minesweeper, Same Board for Everyone | Mind Loft',`,
  `    title: 'Free Daily Arcade Games: Falling Blocks, Snake and Endless Minesweeper, Same Board for Everyone | Mind Loft',`);
edit(PC,
  `    h1: 'Free Daily Arcade Games: Falling Blocks and Endless Minesweeper',`,
  `    h1: 'Free Daily Arcade Games: Falling Blocks, Snake and Endless Minesweeper',`);
edit(PC,
  `    description: 'Two free daily arcade games with the same board for everyone: falling blocks in a fixed order that never speeds up, and a minesweeper`,
  `    description: 'Three free daily arcade games with the same board for everyone: falling blocks in a fixed order that never speeds up, a snake game where everyone eats the same apples, and a minesweeper`);
edit(PC,
  `    lede: 'Two arcade games a day where everyone gets the same board. Blocks drops the same shapes in the same order for everybody and never speeds up, so a run ends on a hole you left three shapes ago. Sweep`,
  `    lede: 'Three arcade games a day where everyone gets the same board. Blocks drops the same shapes in the same order for everybody and never speeds up, so a run ends on a hole you left three shapes ago. Snake is the classic with wrapping edges and the same apples for everyone. Sweep`);
edit(PC, `    keys: ['blocks', 'sweep'],\n    generic: { blocks: 'Falling blocks, fixed order', sweep: 'Endless minesweeper' },`,
  `    keys: ['blocks', 'snake', 'sweep'],\n    generic: { blocks: 'Falling blocks, fixed order', snake: 'Snake game, same apples', sweep: 'Endless minesweeper' },`);
edit(PC, `      ['Are they free?', 'Both, every day, no account required.'],`, `      ['Are they free?', 'All three, every day, no account required.'],`);

// ─── 15. lib/finish-sets.js: Snake joins the Arcade set ─────────────────────
edit('lib/finish-sets.js', `  { name: 'Arcade', cat: 'Arcade', keys: ['sweep', 'blocks'] },`, `  { name: 'Arcade', cat: 'Arcade', keys: ['sweep', 'blocks', 'snake'] },`);
edit('scripts/verify-finish-sets.mjs',
  `if (!p || p.open.join() !== 'blocks') fail('sweep should push blocks');`,
  `if (!p || !p.open.includes('blocks') || !p.open.includes('snake')) fail('sweep should push blocks and snake');`);

// ─── 16. CLAUDE.md ──────────────────────────────────────────────────────────
edit('CLAUDE.md',
  `| Lamps | a 10x10 board against the weekday 7x7 and 8x8 (from launch, 2026-10-04) |`,
  `| Lamps | a 10x10 board against the weekday 7x7 and 8x8 (from launch, 2026-10-04) |\n| Snake | every apple grows the snake by two instead of one, par 15 against the weekday 20 (from launch, 2026-10-11) |`);
{
  const p = path.join(root, 'CLAUDE.md');
  const src = fs.readFileSync(p, 'utf8');
  const marker = '## Snake (`/snake`): the third Arcade daily (launched 2026-10-07)';
  if (!src.includes(marker)) {
    fs.writeFileSync(p, src.replace(/\s*$/, '\n') + `
${marker}

The classic snake game as a daily. Key/route \`snake\`, category **Arcade** (beside Blocks and
Sweep), \`miss: 'Moves'\`, \`unit: 'apples'\` (a tally game: the score is the raw apple count,
uncapped, and a zero-apple run ranks on moves survived), legacy accent \`#65a30d\` / \`#bef08a\`.
Arcade rules throughout: unlimited runs, the board and the local record keep the BEST run, and
\`XP_DAILY_CAP.snake = 1\`. Wired by \`scripts/wire-snake.mjs\` (anchored on the Blocks rows).
**No PREMIERES row on purpose (owner, 2026-10-07): it launched without the new-puzzle pop-up.**
Not in the Arcade circuit (still Blocks and Sweep); whether it joins is an owner call.

- **The day's apples are generated, not banked.** \`lib/snake-engine.js\` \`dayPlan(quizId)\` is a
  seeded list of 800 squares; apple k lands on the k-th, or slides to the next free square in
  reading order when the snake is lying there. The same file is the engine the client plays and
  the verifier proves, so the two cannot drift. \`app/snake/puzzles.js\` carries only the frame
  (size 15, grow, par) and is written by \`scripts/gen-snake.mjs\`.
- **Rules:** a 15x15 board with WRAPPING edges and no wall, one square every 150ms for the whole
  run (\`STEP_MS\`, picked as "Relaxed" off the mockup), two turns may queue between ticks, a
  turn straight back is ignored, moving into the square the tail is leaving is legal, and only
  your own body ends a run. The first turn starts the clock; \`timeElapsed\` is moves x 150ms,
  so it is play time with pauses excluded.
- **Weekday par 20, Sunday Edition par 15 with every apple growing the snake by two.** A greedy
  solver eats a median 27 a weekday; par sits below it on the Blocks lesson that a solver is no
  guide to a human. Revisit once a fortnight of real scores exists.
- **The look (mockup v2, owner-approved):** no outer barrier, only a light grid; the snake is
  one tapering tube in the category accent (\`--stg-acc-ink\`) fading toward the ground, with a
  sheen, a darker head and eyes that look where it is going; the apple is ink with an accent
  stem; a faint dashed ring marks where the NEXT apple will land. Colours are read off the
  stage tokens through a probe element, so the canvas follows both registers.
- **A run in progress survives the tab:** leaving the page pauses and saves it
  (\`sot_snake_<num>\`, the engine snapshot without its plan), and the same run resumes.
- \`scripts/verify-snake.mjs\` checks the bank (contiguous dates, quizIds, Sunday frames) and
  the engine (determinism, wrap, reversal, tail-chase, self-bite, Sunday growth, and that a
  greedy run on every banked day eats apples).
`);
    applied++;
  } else skipped++;
}

console.log(`wire-snake: ${applied} edits applied, ${skipped} already present`);
