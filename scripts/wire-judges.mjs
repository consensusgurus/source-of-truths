// scripts/wire-judges.mjs: wires Judges (the daily two-per-row placement
// puzzle, Logic) into every registry, beside Jesters / after Duet.
// ANCHORED in the shape of scripts/wire-duet.mjs: every anchor must match
// EXACTLY ONCE or the script throws; an edit whose replacement is already
// present is skipped, so a re-run is safe.
//   node scripts/wire-judges.mjs <dir>
// Judges runs a 12x12 Sunday Edition (sunday-editions + sunday-slate) and is
// solve-only (flat 10 or 0), so it joins SOLVE_ONLY like Jesters.
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

const D = {
  TAG: 'Two per row',
  HOW: 'Seat two judges per row, per column, and per colored court, with no two ever touching. 10x10 from Monday to Saturday, 12x12 on Sunday.',
  COLOR: '#7c2d12', NAVY: '#fdba74', BG: '#fde8dc', BORDER: 'rgba(124,45,18,0.35)',
  BLURB: 'Two judges in every row, column and colored court, and no two ever touch. A 10x10 bench all week, a 12x12 on Sunday.',
};

// 1. lib/daily-games.js
edit('lib/daily-games.js',
  `  { key: 'duet', miss: null, name: 'Duet', cat: 'Logic',`,
  `  { key: 'judges', miss: 'Placed', name: 'Judges', cat: 'Logic', tag: '${D.TAG}', how: '${D.HOW}', color: '${D.COLOR}', colorNavy: '${D.NAVY}' },\n  { key: 'duet', miss: null, name: 'Duet', cat: 'Logic',`);
edit('lib/daily-games.js',
  `  { key: 'duet', from: '2026-10-03', until: '2026-10-07' },`,
  `  { key: 'duet', from: '2026-10-03', until: '2026-10-07' },\n  { key: 'judges', from: '2026-10-04', until: '2026-10-08' },`);
edit('lib/daily-games.js', `'cipher', 'hinge', 'jester', 'yose',`, `'cipher', 'hinge', 'jester', 'judges', 'yose',`);

// 2. lib/sunday-editions.js
edit('lib/sunday-editions.js',
  `//   jester  an 11x11 board`,
  `//   judges  a 12x12 two-judge board against the weekday 10x10\n//   jester  an 11x11 board`);
edit('lib/sunday-editions.js', `'junkyard', 'snug', 'duet', 'check',`, `'junkyard', 'snug', 'duet', 'judges', 'check',`);

// 3. end card + the daily-order pin
edit('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['duet', `, `const LAUNCH_PIN = { keys: ['judges', 'duet', `);
edit('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['duet', `, `const LAUNCH_PIN = { keys: ['judges', 'duet', `);
edit('app/DailyEndCard.jsx',
  `  duet: { accent: '#1a7f37',`,
  `  judges: { accent: '${D.COLOR}', badgeBg: '${D.COLOR}', badgeInk: T.white, Fin: Crown },\n  duet: { accent: '#1a7f37',`);
edit('app/DailyEndCard.jsx',
  `  { key: 'duet',   cat: 'logic',`,
  `  { key: 'judges', cat: 'logic',     name: 'Judges', tag: '${D.TAG}',   blurb: '${D.BLURB}', href: '/judges' },\n  { key: 'duet',   cat: 'logic',`);

// 4. promo
edit('app/DailyGamesPromo.jsx',
  `  { key: 'duet', href: '/duet', name: 'Duet',`,
  `  { key: 'judges', href: '/judges', name: 'Judges', tag: 'two per row', store: 'sot_judges_day', accent: '${D.COLOR}', bg: '${D.BG}', border: '${D.BORDER}' },\n  { key: 'duet', href: '/duet', name: 'Duet',`);

// 5. grid, both lists
edit('app/DailyGamesGrid.jsx',
  `  { key: 'duet', href: '/duet', name: 'Duet', tag:`,
  `  { key: 'judges', href: '/judges', name: 'Judges', tag: '${D.TAG}', img: '/games/btn-judges.png' },\n  { key: 'duet', href: '/duet', name: 'Duet', tag:`);
edit('app/DailyGamesGrid.jsx', `'junkyard', 'snug', 'duet', 'fib',`, `'junkyard', 'snug', 'duet', 'judges', 'fib',`);

// 6. strip
edit('app/DailyStrip.jsx',
  `  { key: 'duet', href: '/duet', name: 'Duet', img:`,
  `  { key: 'judges', href: '/judges', name: 'Judges', img: '/games/btn-judges.png', store: 'sot_judges_day', tag: "${D.TAG}" , cat: 'Logic' },\n  { key: 'duet', href: '/duet', name: 'Duet', img:`);
edit('app/DailyStrip.jsx', `const ACCENTS = { passport:`, `const ACCENTS = { judges: '${D.NAVY}', passport:`);
edit('app/DailyStrip.jsx', `const TCOL = { passport:`, `const TCOL = { judges: '${D.COLOR}', passport:`);

// 7. /daily archive page
edit('app/daily/page.js',
  `import { PUZZLES as DUET_FULL } from '../duet/puzzles';`,
  `import { PUZZLES as DUET_FULL } from '../duet/puzzles';\nimport { PUZZLES as JUDGES_FULL } from '../judges/puzzles';`);
edit('app/daily/page.js',
  `const DUET = DUET_FULL.map(`,
  `const JUDGES = JUDGES_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));\nconst DUET = DUET_FULL.map(`);
edit('app/daily/page.js',
  `  { key: 'duet', name: 'Duet', path: '/duet',`,
  `  { key: 'judges', name: 'Judges', path: '/judges', tag: '${D.TAG}', accent: '${D.COLOR}', bg: '${D.BG}', border: '${D.BORDER}', src: JUDGES },\n  { key: 'duet', name: 'Duet', path: '/duet',`);

// 8. archive client
edit('app/daily/DailyArchiveClient.jsx', `'junkyard', 'snug', 'duet', 'fib',`, `'junkyard', 'snug', 'duet', 'judges', 'fib',`);
edit('app/daily/DailyArchiveClient.jsx', `snug: '#91a7ff', duet: '#bef264',`, `snug: '#91a7ff', duet: '#bef264', judges: '${D.NAVY}',`);

// 9. sitemap
edit('lib/sitemap-entries.js', `'junkyard', 'snug', 'duet', 'check',`, `'junkyard', 'snug', 'duet', 'judges', 'check',`);

// 10. puzzle-map registries, sunday-slate included
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  edit(f, `import { PUZZLES as P_duet } from '@/app/duet/puzzles';`,
    `import { PUZZLES as P_duet } from '@/app/duet/puzzles';\nimport { PUZZLES as P_judges } from '@/app/judges/puzzles';`);
  edit(f, `duet: P_duet`, `duet: P_duet, judges: P_judges`);
}

// 11. the two hardcoded alternations
edit('app/api/quiz/daily-status/route.js', `|duet|`, `|duet|judges|`);
edit('app/quizzes/QuizHomeClient.jsx', `|duet|`, `|duet|judges|`);

// 12. rails, catalog, loft
edit('app/DailySlateRail.jsx', `'junkyard', 'snug', 'duet', 'check',`, `'junkyard', 'snug', 'duet', 'judges', 'check',`);
edit('lib/quiz-catalog.js', `'junkyard', 'snug', 'duet', 'check',`, `'junkyard', 'snug', 'duet', 'judges', 'check',`);
edit('lib/loft.js', `'junkyard', 'snug', 'duet', 'mate',`, `'junkyard', 'snug', 'duet', 'judges', 'mate',`);

// 13. glyph: a gavel over its block
edit('lib/game-glyphs.js',
  `  duet: 'M3 3h18v18H3z`,
  `  judges: 'M9 3l6 6-3 3-6-6zM12 9l7 7M3 21h9',  // a gavel and its block\n  duet: 'M3 3h18v18H3z`);

// 14. the logic landing page
edit('lib/puzzle-categories.js',
  `    description: 'Twenty free daily logic puzzles: a nonogram, slitherlink, shikaku, a binary dots-and-rings grid, a shape-fitting puzzle,`,
  `    description: 'Twenty-one free daily logic puzzles: a nonogram, slitherlink, shikaku, a binary dots-and-rings grid, two queens-style placement puzzles, a shape-fitting puzzle,`);
edit('lib/puzzle-categories.js',
  `    lede: 'Twenty logic puzzles with one new board apiece every day.`,
  `    lede: 'Twenty-one logic puzzles with one new board apiece every day.`);
edit('lib/puzzle-categories.js',
  `'paths', 'jester', 'fib', 'axiom',`,
  `'paths', 'jester', 'judges', 'fib', 'axiom',`);
edit('lib/puzzle-categories.js',
  `      jester: 'Queens placement', fib:`,
  `      jester: 'Queens placement', judges: 'Two-star placement (Star Battle)', fib:`);
edit('lib/puzzle-categories.js',
  `'Etch runs 20x20, Hedge 10x10, Duet 10x10, Snug lays`,
  `'Etch runs 20x20, Hedge 10x10, Duet 10x10, Jesters 11x11, Judges 12x12, Snug lays`);
edit('lib/puzzle-categories.js',
  `      ['Are they free?', 'All twenty, every day, no account required.'],`,
  `      ['Are they free?', 'All twenty-one, every day, no account required.'],`);

// 15. groups and finish sets (a set holds 3 to 5)
edit('lib/daily-groups.js',
  `  { name: 'Sorting puzzles', cat: 'Logic', keys: ['jester', 'chomp', 'paths', 'docket', 'venn'] },`,
  `  { name: 'Sorting puzzles', cat: 'Logic', keys: ['jester', 'judges', 'chomp', 'paths', 'venn'] },`);
edit('lib/daily-groups.js',
  `  { name: 'Rule finding', cat: 'Logic', keys: ['axiom', 'suffice', 'stands'] },`,
  `  { name: 'Rule finding', cat: 'Logic', keys: ['axiom', 'suffice', 'stands', 'docket'] },`);
edit('lib/daily-groups.js', `  // Logic (20)`, `  // Logic (21)`);
edit('lib/finish-sets.js',
  `  { name: 'Deduction grids', cat: 'Logic', keys: ['docket', 'alibi', 'jester'] },`,
  `  { name: 'Deduction grids', cat: 'Logic', keys: ['docket', 'alibi', 'jester', 'judges'] },`);

// 16. CLAUDE.md
edit('CLAUDE.md',
  `| Duet | a 10x10 board against the weekday 6x6 and 8x8 (from launch, 2026-10-03) |`,
  `| Duet | a 10x10 board against the weekday 6x6 and 8x8 (from launch, 2026-10-03) |\n| Judges | a 12x12 two-judge board against the weekday 10x10 (from launch, 2026-10-04) |`);
{
  const p = path.join(root, 'CLAUDE.md');
  const src = fs.readFileSync(p, 'utf8');
  const marker = '## Judges (`/judges`): two per row, and Jesters back to one';
  if (!src.includes(marker)) {
    fs.writeFileSync(p, src.replace(/\s*$/, '\n') + `
${marker} (2026-10-04)

Owner ruling 2026-10-04: **Jesters is one jester per row, column and court every day again**, and its
week ramps by BOARD SIZE (Mon/Tue 8x8, Wed/Thu 9x9, Fri/Sat 10x10, Sunday Edition 11x11, the second day
of each size pair grading harder). The two-per-unit boards it ran Thursday to Sunday from 2026-08-21
became their own daily, **Judges**: key/route \`judges\`, category **Logic**, \`miss: 'Placed'\`,
SOLVE_ONLY, legacy accent \`#7c2d12\` / \`#fdba74\`, forked from JesterClient (gavel mark, \`STARS\`
defaults to 2). 10x10 Monday to Saturday dealt from six difficulty bands of the jester2-human tier
score, a 12x12 Sunday Edition. Wired by \`scripts/wire-judges.mjs\`. No PNG tiles; glyph in
\`lib/game-glyphs.js\`.

- **Jesters #79 (2026-10-04) was swapped in place** from a two-jester 10x10 to the first 11x11 a few
  minutes into its day (owner: everything live today). A save for the old board is discarded on load
  because the grid size no longer matches. Boards 2026-08-21 to 10-03 are frozen in their two-jester era,
  and \`scripts/verify-jester.mjs\` checks each era by its own rule (\`ONE_FROM = '2026-10-04'\`).
- **Generators.** One-jester boards: \`scripts/jester1-produce.mjs <size>\` (seeded seating, uneven court
  growth, boundary repair, the graded human solver). Judges boards: \`scripts/judges-produce.mjs <size>\`.
  Even court growth almost never converges to a unique 12x12 two-star board; what works is UNEVEN
  appetites (a few sprawling courts, many tight ones, skew 6 to 8) plus GREEDY repair that keeps the
  boundary move leaving the fewest rival seatings. Even so a 12x12 takes minutes of CPU each, so bank
  Sundays in a long job, not interactively. Courts must hold 4+ cells.
- **Hue collisions.** The stage paints court k with REGION_RAMP[k % 10], so on an 11x11 or 12x12 courts
  k and k+10 share a hue; the banks are labelled so those never touch (verify-judges checks it).
- **The client solver** (JudgesClient \`solveBoard\`) gained a one-seat-per-row column prune and a
  court-reach suffix prune; a 12x12 two-star board resolves in under 100ms.
- \`scripts/verify-judges.mjs\` shares no search code with the generator: its own cell-by-cell
  exhaustive count proves one seating, jester2-human proves no guessing, and it checks sizes by weekday,
  4+ cell contiguous courts, the hue rule, the Mon<...<Sat ramp, and no layout reused from Jesters.
`);
    applied++;
  } else skipped++;
}

console.log(`wire-judges: ${applied} edits applied, ${skipped} already present`);
