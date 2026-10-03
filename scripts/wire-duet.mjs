// scripts/wire-duet.mjs — wires Duet (the daily balanced grid, Logic) into
// every registry. Sits after Snug in every list.
//
// An ANCHORED script in the shape of scripts/wire-yose-crib.mjs: every anchor
// must match EXACTLY ONCE or the script throws, and an edit whose replacement
// is already present is skipped, so a re-run after a partial push is safe.
//
//   node scripts/wire-duet.mjs <dir>
//
// Duet runs a Sunday Edition (10x10), so it joins lib/sunday-editions.js and
// the sunday-slate route. It is solve-only (flat 10 or 0), so it joins
// SOLVE_ONLY too.
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
  TAG: 'Half dots, half rings',
  HOW: 'Fill every square with a dot or a ring. Every row, every column and every walled room holds half of each, never three alike in a line, and an = or an x between two squares says they match or differ. Tap a square to cycle it.',
  COLOR: '#1a7f37', NAVY: '#bef264', BG: '#e8f5ec', BORDER: 'rgba(26,127,55,0.35)',
  BLURB: 'Dots and rings, half and half in every row, column and walled room, never three alike in a line. Six by six early in the week, eight by eight from Thursday, ten by ten on Sundays.',
};

// ─── 1. lib/daily-games.js ──────────────────────────────────────────────────
edit('lib/daily-games.js',
  `  { key: 'snug', miss: null, name: 'Snug', cat: 'Logic',`,
  `  { key: 'duet', miss: null, name: 'Duet', cat: 'Logic', tag: '${D.TAG}', how: '${D.HOW}', color: '${D.COLOR}', colorNavy: '${D.NAVY}' },\n  { key: 'snug', miss: null, name: 'Snug', cat: 'Logic',`);
edit('lib/daily-games.js',
  `  { key: 'crib', from: '2026-09-17', until: '2026-09-21' },`,
  `  { key: 'crib', from: '2026-09-17', until: '2026-09-21' },\n  { key: 'duet', from: '2026-10-03', until: '2026-10-07' },`);
edit('lib/daily-games.js', `'sixes', 'sums', 'snug',`, `'sixes', 'sums', 'snug', 'duet',`);

// ─── 2. lib/sunday-editions.js ──────────────────────────────────────────────
edit('lib/sunday-editions.js',
  `//   snug    a 7x7 board`,
  `//   duet    a 10x10 board against the weekday 6x6 and 8x8\n//   snug    a 7x7 board`);
edit('lib/sunday-editions.js', `'junkyard', 'snug', 'check',`, `'junkyard', 'snug', 'duet', 'check',`);

// ─── 3. app/DailyEndCard.jsx + the daily-order pin ──────────────────────────
edit('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['pricer',`, `const LAUNCH_PIN = { keys: ['duet', 'pricer',`);
edit('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['pricer',`, `const LAUNCH_PIN = { keys: ['duet', 'pricer',`);
edit('app/DailyEndCard.jsx',
  `  snug: { accent: '#3b5bdb',`,
  `  duet: { accent: '${D.COLOR}', badgeBg: '${D.COLOR}', badgeInk: T.white, Fin: Blocks },\n  snug: { accent: '#3b5bdb',`);
edit('app/DailyEndCard.jsx',
  `  { key: 'snug',   cat: 'logic',`,
  `  { key: 'duet',   cat: 'logic',     name: 'Duet', tag: '${D.TAG}',   blurb: '${D.BLURB}', href: '/duet' },\n  { key: 'snug',   cat: 'logic',`);

// ─── 4. app/DailyGamesPromo.jsx ─────────────────────────────────────────────
edit('app/DailyGamesPromo.jsx',
  `  { key: 'snug', href: '/snug', name: 'Snug',`,
  `  { key: 'duet', href: '/duet', name: 'Duet', tag: 'half dots, half rings', store: 'sot_duet_day', accent: '${D.COLOR}', bg: '${D.BG}', border: '${D.BORDER}' },\n  { key: 'snug', href: '/snug', name: 'Snug',`);

// ─── 5. app/DailyGamesGrid.jsx — both lists ─────────────────────────────────
edit('app/DailyGamesGrid.jsx',
  `  { key: 'snug', href: '/snug', name: 'Snug', tag:`,
  `  { key: 'duet', href: '/duet', name: 'Duet', tag: '${D.TAG}', img: '/games/btn-duet.png' },\n  { key: 'snug', href: '/snug', name: 'Snug', tag:`);
edit('app/DailyGamesGrid.jsx', `'junkyard', 'snug', 'fib',`, `'junkyard', 'snug', 'duet', 'fib',`);

// ─── 6. app/DailyStrip.jsx ──────────────────────────────────────────────────
edit('app/DailyStrip.jsx',
  `  { key: 'snug', href: '/snug', name: 'Snug', img:`,
  `  { key: 'duet', href: '/duet', name: 'Duet', img: '/games/btn-duet.png', store: 'sot_duet_day', tag: "${D.TAG}" , cat: 'Logic' },\n  { key: 'snug', href: '/snug', name: 'Snug', img:`);
edit('app/DailyStrip.jsx', `const ACCENTS = { yose:`, `const ACCENTS = { duet: '${D.NAVY}', yose:`);
edit('app/DailyStrip.jsx', `const TCOL = { yose:`, `const TCOL = { duet: '${D.COLOR}', yose:`);

// ─── 7. app/daily/page.js ───────────────────────────────────────────────────
edit('app/daily/page.js',
  `import { PUZZLES as SNUG_FULL } from '../snug/puzzles';`,
  `import { PUZZLES as SNUG_FULL } from '../snug/puzzles';\nimport { PUZZLES as DUET_FULL } from '../duet/puzzles';`);
edit('app/daily/page.js',
  `const SNUG = SNUG_FULL.map(`,
  `const DUET = DUET_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));\nconst SNUG = SNUG_FULL.map(`);
edit('app/daily/page.js',
  `  { key: 'snug', name: 'Snug', path: '/snug',`,
  `  { key: 'duet', name: 'Duet', path: '/duet', tag: '${D.TAG}', accent: '${D.COLOR}', bg: '${D.BG}', border: '${D.BORDER}', src: DUET },\n  { key: 'snug', name: 'Snug', path: '/snug',`);

// ─── 8. app/daily/DailyArchiveClient.jsx ────────────────────────────────────
edit('app/daily/DailyArchiveClient.jsx', `'junkyard', 'snug', 'fib',`, `'junkyard', 'snug', 'duet', 'fib',`);
edit('app/daily/DailyArchiveClient.jsx', `snug: '#91a7ff',`, `snug: '#91a7ff', duet: '${D.NAVY}',`);

// ─── 9. lib/sitemap-entries.js ──────────────────────────────────────────────
edit('lib/sitemap-entries.js', `'junkyard', 'snug', 'check',`, `'junkyard', 'snug', 'duet', 'check',`);

// ─── 10. the puzzle-map registries, sunday-slate included ───────────────────
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  edit(f, `import { PUZZLES as P_snug } from '@/app/snug/puzzles';`,
    `import { PUZZLES as P_snug } from '@/app/snug/puzzles';\nimport { PUZZLES as P_duet } from '@/app/duet/puzzles';`);
  edit(f, `snug: P_snug`, `snug: P_snug, duet: P_duet`);
}

// ─── 11. the two hardcoded alternations ─────────────────────────────────────
edit('app/api/quiz/daily-status/route.js', `|snug|`, `|snug|duet|`);
edit('app/quizzes/QuizHomeClient.jsx', `|snug|`, `|snug|duet|`);

// ─── 12. rails, catalog, loft ───────────────────────────────────────────────
edit('app/DailySlateRail.jsx', `'junkyard', 'snug', 'check',`, `'junkyard', 'snug', 'duet', 'check',`);
edit('lib/quiz-catalog.js', `'junkyard', 'snug', 'check',`, `'junkyard', 'snug', 'duet', 'check',`);
edit('lib/loft.js', `'junkyard', 'snug', 'mate',`, `'junkyard', 'snug', 'duet', 'mate',`);

// ─── 13. lib/game-glyphs.js — the board quartered, a dot and a ring ─────────
edit('lib/game-glyphs.js',
  `  snug: 'M3 3h6v6H3z`,
  `  duet: 'M3 3h18v18H3zM12 3v9H3M7.5 7.5h.01M14.5 16.5a2 2 0 1 0 4 0a2 2 0 1 0-4 0',  // a walled room, one dot, one ring\n  snug: 'M3 3h6v6H3z`);

// ─── 14. lib/puzzle-categories.js — the logic landing page ──────────────────
edit('lib/puzzle-categories.js',
  `    description: 'Nineteen free daily logic puzzles: a nonogram, slitherlink, shikaku, a shape-fitting puzzle,`,
  `    description: 'Twenty free daily logic puzzles: a nonogram, slitherlink, shikaku, a binary dots-and-rings grid, a shape-fitting puzzle,`);
edit('lib/puzzle-categories.js',
  `    lede: 'Nineteen logic puzzles with one new board apiece every day. Pencil-and-paper classics (a nonogram, a slitherlink loop, shikaku rectangles, a shape-fitting puzzle,`,
  `    lede: 'Twenty logic puzzles with one new board apiece every day. Pencil-and-paper classics (a nonogram, a slitherlink loop, shikaku rectangles, a balanced dots-and-rings grid, a shape-fitting puzzle,`);
edit('lib/puzzle-categories.js',
  `    keys: ['etch', 'hedge', 'plot', 'snug', 'park',`,
  `    keys: ['etch', 'hedge', 'plot', 'duet', 'snug', 'park',`);
edit('lib/puzzle-categories.js',
  `plot: 'Shikaku', snug: 'Shape-fitting (polyomino tiling)',`,
  `plot: 'Shikaku', duet: 'Binary puzzle (binairo) with rooms', snug: 'Shape-fitting (polyomino tiling)',`);
edit('lib/puzzle-categories.js',
  `Plot is shikaku: cut the board into rectangles so each number owns exactly its own. Snug`,
  `Plot is shikaku: cut the board into rectangles so each number owns exactly its own. Duet is a binary grid: dots and rings, half and half in every row, column and walled room, never three alike in a line. Snug`);
edit('lib/puzzle-categories.js',
  `'Etch runs 20x20, Hedge 10x10, Snug lays`,
  `'Etch runs 20x20, Hedge 10x10, Duet 10x10, Snug lays`);
edit('lib/puzzle-categories.js',
  `      ['Are they free?', 'All sixteen, every day, no account required.'],\n    ],\n  },\n  {\n    slug: 'number-puzzles',`,
  `      ['Are they free?', 'All twenty, every day, no account required.'],\n    ],\n  },\n  {\n    slug: 'number-puzzles',`);

// ─── 15. lib/daily-groups.js + lib/finish-sets.js ───────────────────────────
// A set holds 3 to 5 (verify-daily-groups), so Paths, the route puzzle,
// moves beside Chomp, the other route puzzle, to make room.
edit('lib/daily-groups.js',
  `  { name: 'Grid drawing', cat: 'Logic', keys: ['etch', 'hedge', 'plot', 'paths', 'snug'] },`,
  `  { name: 'Grid drawing', cat: 'Logic', keys: ['etch', 'hedge', 'plot', 'snug', 'duet'] },`);
edit('lib/daily-groups.js',
  `  { name: 'Sorting puzzles', cat: 'Logic', keys: ['jester', 'chomp', 'docket', 'venn'] },`,
  `  { name: 'Sorting puzzles', cat: 'Logic', keys: ['jester', 'chomp', 'paths', 'docket', 'venn'] },`);
edit('lib/daily-groups.js', `  // Logic (19)`, `  // Logic (20)`);
edit('lib/finish-sets.js',
  `  { name: 'Fill the grid', cat: 'Logic', keys: ['etch', 'snug', 'suffice'] },`,
  `  { name: 'Fill the grid', cat: 'Logic', keys: ['etch', 'snug', 'suffice', 'duet'] },`);
edit('lib/finish-sets.js',
  `  { name: 'Grid drawing', cat: 'Logic', keys: ['etch', 'hedge', 'plot'] },`,
  `  { name: 'Grid drawing', cat: 'Logic', keys: ['etch', 'hedge', 'plot', 'duet'] },`);

// ─── 15b. lib/puzzle-sets.js — the two set pages follow their groups ───────
edit('lib/puzzle-sets.js',
  `    title: 'Free Daily Pencil Puzzles: Nonogram, Slitherlink, Shikaku and Network | Mind Loft',
    h1: 'Free Daily Pencil Puzzles: Nonogram, Slitherlink, Shikaku and a Network Puzzle',
    description: 'Four free daily pencil-and-paper logic puzzles drawn on a grid: a nonogram (picross), a slitherlink loop, shikaku rectangles and a network you build from its costs. One solution each, reachable by logic. New boards at midnight Eastern, no signup.',
    lede: 'The puzzles you would draw with a pencil, on a grid you fill, loop, cut or wire. Etch is the nonogram: a picture appears when the counts are satisfied. Hedge is slitherlink: one closed loop. Plot is shikaku: cut the board into rectangles. Paths links every town into one network for the least cost.',
    how: [
      'Etch fills the squares the row and column counts force. Hedge draws one closed loop so every number has that many sides on it. Plot cuts the grid into rectangles so each number owns exactly its own area. Paths is the odd one out: a set of towns and the cost of every link, and you are building the cheapest network that reaches all of them.',
    ],
    faq: [
      ['How big do they get?', 'Bigger through the week. The Sunday Edition runs the largest boards.'],
      ['Are they free?', 'All four, every day, no account required.'],`,
  `    title: 'Free Daily Pencil Puzzles: Nonogram, Slitherlink, Shikaku, Binary Grid and Shape Fitting | Mind Loft',
    h1: 'Free Daily Pencil Puzzles: Nonogram, Slitherlink, Shikaku, a Binary Grid and Shape Fitting',
    description: 'Five free daily pencil-and-paper logic puzzles drawn on a grid: a nonogram (picross), a slitherlink loop, shikaku rectangles, a dots-and-rings binary grid and a shape-fitting puzzle. One solution each, reachable by logic. New boards at midnight Eastern, no signup.',
    lede: 'The puzzles you would draw with a pencil, on a grid you fill, loop, cut or balance. Etch is the nonogram: a picture appears when the counts are satisfied. Hedge is slitherlink: one closed loop. Plot is shikaku: cut the board into rectangles. Duet is the binary grid: dots and rings, half and half. Snug fits a handful of pieces into a board exactly one way.',
    how: [
      'Etch fills the squares the row and column counts force. Hedge draws one closed loop so every number has that many sides on it. Plot cuts the grid into rectangles so each number owns exactly its own area. Duet fills every square with a dot or a ring so every row, column and walled room is half and half, never three alike in a line. Snug turns and flips its pieces until they cover the board.',
    ],
    faq: [
      ['How big do they get?', 'Bigger through the week. The Sunday Edition runs the largest boards.'],
      ['Are they free?', 'All five, every day, no account required.'],`);
edit('lib/puzzle-sets.js',
  `    title: 'Free Daily Sorting Puzzles: Queens, Routes, Set Logic and Analytical Reasoning | Mind Loft',
    h1: 'Free Daily Sorting Puzzles: Queens Placement, Routes, Set Logic and Analytical Reasoning',
    description: 'Four free daily puzzles about putting things where they go: seat one jester per row, column and court with no two touching; find the route; place twelve words across seven overlapping regions; and an analytical reasoning setup with five questions. New boards at midnight Eastern, no signup.',
    lede: 'Four puzzles about placement. Jesters is the queens puzzle with coloured courts. Chomp eats a cast of mascots in order, and every square you touch stays yours. Venn places twelve words across seven overlapping regions so every count adds up. Docket is the analytical reasoning section of a well-known test: one setup, five questions.',
    how: [
      'Jesters seats one jester per row, per column and per coloured court, with no two ever touching; Thursday through Sunday seat two apiece. Chomp is a route puzzle with no clock and nothing chasing you: the only things in your way are where you have already been. Venn is set logic drawn as circles. Docket gives you a setup of rules and asks five questions about the arrangements it allows.',
    ],
    faq: [
      ['Is Docket really a test section?', 'It is the analytical reasoning shape, one setup and five questions, written fresh every day.'],
      ['Are they free?', 'All four, every day, no account required.'],`,
  `    title: 'Free Daily Sorting Puzzles: Queens, Routes, Networks, Set Logic and Analytical Reasoning | Mind Loft',
    h1: 'Free Daily Sorting Puzzles: Queens Placement, Routes, Networks, Set Logic and Analytical Reasoning',
    description: 'Five free daily puzzles about putting things where they go: seat one jester per row, column and court with no two touching; find the route; wire every town for the least cost; place twelve words across seven overlapping regions; and an analytical reasoning setup with five questions. New boards at midnight Eastern, no signup.',
    lede: 'Five puzzles about placement. Jesters is the queens puzzle with coloured courts. Chomp eats a cast of mascots in order, and every square you touch stays yours. Paths links every town into one network for the least cost. Venn places twelve words across seven overlapping regions so every count adds up. Docket is the analytical reasoning section of a well-known test: one setup, five questions.',
    how: [
      'Jesters seats one jester per row, per column and per coloured court, with no two ever touching; Thursday through Sunday seat two apiece. Chomp is a route puzzle with no clock and nothing chasing you: the only things in your way are where you have already been. Paths gives you a set of towns and the cost of every link, and you build the cheapest network that reaches all of them. Venn is set logic drawn as circles. Docket gives you a setup of rules and asks five questions about the arrangements it allows.',
    ],
    faq: [
      ['Is Docket really a test section?', 'It is the analytical reasoning shape, one setup and five questions, written fresh every day.'],
      ['Are they free?', 'All five, every day, no account required.'],`);

// ─── 16. CLAUDE.md ──────────────────────────────────────────────────────────
edit('CLAUDE.md',
  `| Crib | seven hands instead of five, three of them decided by the crib (from launch, 2026-09-20) |`,
  `| Crib | seven hands instead of five, three of them decided by the crib (from launch, 2026-09-20) |\n| Duet | a 10x10 board against the weekday 6x6 and 8x8 (from launch, 2026-10-04) |`);
{
  const p = path.join(root, 'CLAUDE.md');
  const src = fs.readFileSync(p, 'utf8');
  const marker = '## Duet (`/duet`): the daily balanced grid';
  if (!src.includes(marker)) {
    fs.writeFileSync(p, src.replace(/\s*$/, '\n') + `
${marker} (launched 2026-10-03)

A variant of the balanced binary puzzle (binairo / takuzu, the family LinkedIn's Tango belongs to)
with WALLED ROOMS: dots and rings, half of each in every row, column and room, never three alike in
a line, '=' / 'x' marks between neighbours. Key/route \`duet\`, category **Logic**, \`miss: null\`,
SOLVE_ONLY (flat 10, the clock decides), first-play hint via hint-gate, legacy accent \`#1a7f37\` /
\`#bef264\` (the Logic step; on the stage the ramp paints it). Wired by \`scripts/wire-duet.mjs\`
(anchored on the Snug rows, idempotent). No PNG tiles; glyph in \`lib/game-glyphs.js\`. Share card
\`public/og/duet.png\` from \`scripts/bake-og.mjs duet\`. Premiere window 2026-10-03 to 10-07.

- \`scripts/duet-core.mjs\` is the generator's engine: full grid, rooms grown to balanced even sizes
  (2 to 6), then clues (printed squares and marks) stripped while a GRADED solver still finishes.
  Level 0 is pencil work (marks, the pair and gap rules, a full line or room); level 1 is a line read
  (every legal pattern for a row or column). \`cost\` = squares first settled by a line read.
- **The ramp**: Mon 6x6 cost 0, Tue 6x6 2-6, Wed 6x6 7+, Thu 8x8 0-6, Fri 8x8 7-13, Sat 8x8 the
  hardest of a pool (14+), **Sunday 10x10** the hardest of a pool (16+). Day 1 (2026-10-03, a
  Saturday) is the launch board and takes the Monday spec. Bank 78 days to 2026-12-19,
  \`node scripts/gen-duet.mjs > app/duet/puzzles.js\` (deterministic, seeded off each date).
- \`scripts/verify-duet.mjs\` imports nothing from the core: its own backtracking counter proves
  exactly one solution, its own logical solver proves no guessing, and it checks rooms (connected,
  even, balanced), marks and givens against the solution, sizes by weekday, Monday finishing on
  pencil work, the other days needing a line read, dates, quizIds and no repeated board.
- The client flags RULE BREAKS live (three alike, a line or room over half, a broken mark) but
  never a square that is merely wrong. Tap cycles empty, dot, ring.
`);
    applied++;
  } else skipped++;
}

console.log(`wire-duet: ${applied} edits applied, ${skipped} already present`);
