// scripts/wire-dario.mjs — wires Dario, the daily side-scroller, into the
// registries that SCORE it, and holds it off every surface that LISTS games.
//
// HELD FOR REVIEW (owner, 2026-10-07): /dario is live and noindexed, its runs
// post and rank like any arcade daily, and the all-time fastest list works, but
// it is in REVIEW_HOLD, so no slate, grid, category, count, sitemap or "play
// similar" offers it. To launch: drop it from REVIEW_HOLD, take the robots line
// off app/dario/page.js, and wire the display lists the way scripts/wire-snake.mjs
// does (grids, strip, promo, archive, categories, finish sets, sitemap).
//
// Anchored: every anchor must match EXACTLY ONCE or the script throws, and an
// edit whose replacement is already present is skipped.
//
//   node scripts/wire-dario.mjs <dir>
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

const HOW = 'A side-scrolling run through three levels of the AI race, past parody billboards, to the AGI gate. The course is remixed every day, the same for everybody, and your fastest full clear is the one that counts.';

edit('lib/daily-games.js',
  `  { key: 'snake', miss: 'Moves',`,
  `  { key: 'dario', miss: null, name: 'Dario', cat: 'Arcade', tag: 'Race to the frontier', how: '${HOW}', color: '#c2410c', colorNavy: '#fdba74' },\n  { key: 'snake', miss: 'Moves',`);

edit('lib/daily-games.js',
  `export const RUN_ONLY = new Set(['passport']);\nexport function isRunOnly(key) { return !!key && RUN_ONLY.has(key); }`,
  `export const RUN_ONLY = new Set(['passport']);\n// HELD FOR REVIEW (owner, 2026-10-07): a game that scores and ranks like any\n// daily but is offered on no list, slate, grid or count until it launches. It\n// rides the run-only filters because they are exactly the display filters.\nexport const REVIEW_HOLD = new Set(['dario']);\nexport function isRunOnly(key) { return !!key && (RUN_ONLY.has(key) || REVIEW_HOLD.has(key)); }`);
edit('lib/daily-games.js',
  `  return DAILY_KEYS.filter((k) => !isRetiredDaily(k, today) && !RUN_ONLY.has(k));`,
  `  return DAILY_KEYS.filter((k) => !isRetiredDaily(k, today) && !RUN_ONLY.has(k) && !REVIEW_HOLD.has(k));`);

for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js']) {
  edit(f, `import { PUZZLES as P_snake } from '@/app/snake/puzzles';`,
    `import { PUZZLES as P_snake } from '@/app/snake/puzzles';\nimport { PUZZLES as P_dario } from '@/app/dario/puzzles';`);
}
edit('lib/daily-slate.js', `  snake: P_snake,\n`, `  snake: P_snake,\n  dario: P_dario,\n`);
edit('app/api/quiz/daily-game/route.js', `snake: P_snake`, `snake: P_snake, dario: P_dario`);

edit('lib/quiz-xp.js', `export const XP_DAILY_CAP = { blocks: 1, sweep: 1, snake: 1 };`, `export const XP_DAILY_CAP = { blocks: 1, sweep: 1, snake: 1, dario: 1 };`);
edit('lib/loft.js', `'blocks', 'snake', 'bracket',`, `'blocks', 'snake', 'dario', 'bracket',`);
edit('lib/game-glyphs.js',
  `  snake: 'M4 19h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6M19.5 5h.01', // a winding snake and its apple`,
  `  snake: 'M4 19h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6M19.5 5h.01', // a winding snake and its apple\n  dario: 'M3 20h18M5 20v-4h4v4M14 20V9h6v11M10 7a2 2 0 1 0 0.01 0M10 9v5l-2 3M10 12l3 2', // a runner, a block and a tower`);

console.log(`wire-dario: ${applied} edits applied, ${skipped} already present`);
