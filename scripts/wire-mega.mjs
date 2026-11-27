// scripts/wire-mega.mjs: wires Colossus (9x9) and Mammoth (6x6), the massive
// sudokus (Sudoku, launched 2026-11-21), into every registry, beside Giant
// wherever Giant sits and beside Search in the flat lists of tally games.
//
// TALLY games like Search (unit: points, solvesOnScore, bestRun): every sudoku
// is a 100 point pot split among its solvers, and a player's result for an
// Eastern day is the points from the sudokus solved that day, one row per
// player per day kept current by /api/mega and settled when the board closes.
// NO SUNDAY EDITION: every day is already enormous.
//
// Anchored edits: every anchor must match EXACTLY ONCE or the script throws,
// and an edit whose insertion is already present is skipped, so a re-run is safe.
//   node scripts/wire-mega.mjs [dir]
import fs from 'fs';
import path from 'path';
const root = process.argv[2] || '.';
let applied = 0, skipped = 0;
const rd = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const wr = (f, s) => fs.writeFileSync(path.join(root, f), s);
function sub(f, anchor, repl) {
  const s = rd(f);
  if (s.includes(repl)) { skipped++; return; }
  const n = s.split(anchor).length - 1;
  if (n !== 1) throw new Error(`${f}: anchor matched ${n} times\n  ${anchor.slice(0, 160)}`);
  wr(f, s.replace(anchor, () => repl)); applied++;
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

const G = [
  {
    key: 'colossus', name: 'Colossus', color: '#9a3412', navy: '#fdba74', bg: '#fdebdc', border: 'rgba(154,52,18,0.38)', diff: 3, grid: 9,
    tag: 'The giant linked sudoku', tagLong: 'Sixty-one overlapping 9x9 sudokus on one enormous board',
    how: 'One enormous board of 61 ordinary 9x9 sudokus that overlap at their corner boxes, so a digit in a shared corner counts in both. Everyone plays their own copy. Nothing is marked right or wrong until a whole sudoku is full, and every sudoku is a pot of 100 points split among the players who solve it. A board runs until every sudoku has been solved by somebody, however long that takes. No clock and no Give up.',
    blurb: 'Sixty-one 9x9 sudokus woven into one enormous board. Solve the ones nobody else does.',
    short: 'A giant sudoku: 61 linked 9x9 grids on one board.', label: 'Giant linked sudoku, 61 grids',
    glyph: 'M2 2h12v12H2zM10 10h12v12H10zM6 2v12M2 6h12M2 10h8M10 2v8M14 14h8M18 10v12M14 14v8M10 18h12',
  },
  {
    key: 'mammoth', name: 'Mammoth', color: '#1e4fa3', navy: '#93c5fd', bg: '#e3edfc', border: 'rgba(30,79,163,0.38)', diff: 2, grid: 6,
    tag: 'The giant field of 6x6 sudokus', tagLong: '257 overlapping 6x6 sudokus on one enormous board',
    how: 'One enormous board of 257 small sudokus, each 6x6 with the digits 1 to 6, that overlap at their corner boxes, so a digit in a shared corner counts in both. Everyone plays their own copy. Nothing is marked right or wrong until a whole sudoku is full, and every sudoku is a pot of 100 points split among the players who solve it. A board runs until every sudoku has been solved by somebody, however long that takes. No clock and no Give up.',
    blurb: 'A field of 257 quick 6x6 sudokus woven into one enormous board. Solve the ones nobody else does.',
    short: 'A giant mini sudoku: 257 linked 6x6 grids.', label: 'Giant linked mini sudoku, 257 grids',
    glyph: 'M2 3h9v8H2zM8 8h9v8H8zM14 13h8v8h-8zM5 3v8M2 7h9M11 8v8M8 12h9M17 13v8M14 17h8',
  },
];
const KEYS = G.map((g) => `'${g.key}'`).join(', ');

// 1. registry rows and premieres
afterLine('lib/daily-games.js', "{ key: 'giant', miss: null, name: 'Giant'", G.map((g) =>
  `  { key: '${g.key}', miss: null, unit: 'points', solvesOnScore: true, bestRun: true, name: '${g.name}', cat: 'Sudoku', tag: '${g.tag}', tagLong: '${g.tagLong}', how: '${g.how}', color: '${g.color}', colorNavy: '${g.navy}' },`));
afterLine('lib/daily-games.js', 'export const PREMIERES = [', G.map((g) => `  { key: '${g.key}', from: '2026-11-21', until: '2026-11-28' },`));

// 2. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: [${KEYS}, `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: [${KEYS}, `);
afterLine('app/DailyEndCard.jsx', "  giant: { accent: '#3949ab', badgeBg: '#3949ab', badgeInk: T.white, Fin: LayoutGrid },", G.map((g) =>
  `  ${g.key}: { accent: '${g.color}', badgeBg: '${g.color}', badgeInk: T.white, Fin: LayoutGrid },`));
afterLine('app/DailyEndCard.jsx', "{ key: 'giant',  cat: 'sudoku' ,", G.map((g) =>
  `  { key: '${g.key}', cat: 'sudoku', name: '${g.name}', tag: '${g.tag}', blurb: '${g.blurb}', href: '/${g.key}' },`));

// 3. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'giant', href: '/giant', name: 'Giant'", G.map((g) =>
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.tag.charAt(0).toLowerCase() + g.tag.slice(1)}', store: 'sot_${g.key}_day', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}' },`));
afterLine('app/DailyGamesGrid.jsx', "{ key: 'giant', href: '/giant', name: 'Giant'", G.map((g) =>
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.tag}', img: '/games/btn-${g.key}.png' },`));
sub('app/DailyGamesGrid.jsx', `'giant', 'gianttoo', 'sumo'`, `'giant', 'gianttoo', ${KEYS}, 'sumo'`);
afterLine('app/DailyStrip.jsx', "{ key: 'giant', href: '/giant', name: 'Giant'", G.map((g) =>
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', img: '/games/btn-${g.key}.png', store: 'sot_${g.key}_day', tag: "${g.tag}" , cat: 'Numbers' },`));
sub('app/DailyStrip.jsx', `const ACCENTS = { `, `const ACCENTS = { ${G.map((g) => `${g.key}: '${g.navy}'`).join(', ')}, `);
sub('app/DailyStrip.jsx', `const TCOL = { `, `const TCOL = { ${G.map((g) => `${g.key}: '${g.color}'`).join(', ')}, `);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as GIANT_FULL } from '../giant/puzzles';`,
  `import { PUZZLES as GIANT_FULL } from '../giant/puzzles';\n${G.map((g) => `import { PUZZLES as ${g.key.toUpperCase()}_FULL } from '../${g.key}/puzzles';`).join('\n')}`);
afterLine('app/archive/page.js', 'const GIANT = GIANT_FULL.map(', G.map((g) =>
  `const ${g.key.toUpperCase()} = ${g.key.toUpperCase()}_FULL.map(({ num, quizId, live, dateLabel }) => ({ num, quizId, live, dateLabel, sunday: false }));`));
afterLine('app/archive/page.js', "{ key: 'giant', name: 'Giant', path: '/giant'", G.map((g) =>
  `  { key: '${g.key}', name: '${g.name}', path: '/${g.key}', tag: '${g.tag}', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}', src: ${g.key.toUpperCase()} },`));

// 5. the daily puzzle maps (no Sunday slate)
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js']) {
  sub(f, `import { PUZZLES as P_giant } from '@/app/giant/puzzles';`,
    `import { PUZZLES as P_giant } from '@/app/giant/puzzles';\n${G.map((g) => `import { PUZZLES as P_${g.key} } from '@/app/${g.key}/puzzles';`).join('\n')}`);
  sub(f, `giant: P_giant, `, `giant: P_giant, ${G.map((g) => `${g.key}: P_${g.key}`).join(', ')}, `);
}

// 6. alternations, rails, catalog, loft, xp: beside Search, the other tally game
for (const f of ['app/api/quiz/daily-status/route.js', 'app/quizzes/QuizHomeClient.jsx']) sub(f, '|search|', '|search|colossus|mammoth|');
for (const f of ['app/DailySlateRail.jsx', 'lib/quiz-catalog.js', 'lib/quiz-xp.js']) sub(f, `'search', `, `'search', ${KEYS}, `);
sub('lib/loft.js', `'idiom', 'scour', 'search',`, `'idiom', 'scour', 'search', ${KEYS},`);

// 7. skills, glyph, preview, blurbs, difficulty, families, challenge metric
sub('lib/daily-skills.js', `giant: ['grid'], `, `giant: ['grid'], ${G.map((g) => `${g.key}: ['grid']`).join(', ')}, `);
afterLine('lib/game-glyphs.js', "  giant: 'M3 3h18v18H3z", G.map((g) => `  ${g.key}: '${g.glyph}',  // sudokus overlapping at their corners: the massive ${g.grid}x${g.grid}`));
sub('app/GamePreview.jsx', `giant: () => <Grid n={16} />,`, `giant: () => <Grid n={16} />, colossus: () => <Grid n={9} />, mammoth: () => <Grid n={6} />,`);
afterLine('lib/game-blurbs.js', '  giant: "', G.map((g) => `  ${g.key}: "${g.short}",`));
sub('lib/daily-difficulty.js', `giant: 5, gianttoo: 5,`, `giant: 5, gianttoo: 5, colossus: 3, mammoth: 2, // starting estimates (2026-11-21): one solved sudoku scores`);
sub('lib/daily-families.js', `'giant', 'gianttoo', 'quilt'`, `'giant', 'gianttoo', ${KEYS}, 'quilt'`);
afterLine('lib/challenge-metric.js', "  search: { unit: 'points', one: 'point', dir: 'high', say: 'scored' },", G.map((g) =>
  `  ${g.key}: { unit: 'points', one: 'point', dir: 'high', say: 'scored' },`));

// 8. category page, groups, sets, featured, share card
const PC = 'lib/puzzle-categories.js';
sub(PC, `'kayaktoo', 'liptoo', 'gianttoo'],`, `'kayaktoo', 'liptoo', 'gianttoo', ${KEYS}],`);
sub(PC, `giant: 'Giant sudoku, 16x16', `, `giant: 'Giant sudoku, 16x16', ${G.map((g) => `${g.key}: '${g.label}'`).join(', ')}, `);
sub('lib/og-stage-cards.js', `export const HAND_BAKED = new Set([`, `export const HAND_BAKED = new Set([${KEYS}, `);
sub('lib/featured.js', `export const FEATURED_KEYS = ['search', `, `export const FEATURED_KEYS = ['search', ${KEYS}, `);
sub('lib/featured.js', `export const FEATURED_STAYS = new Set(['search'`, `export const FEATURED_STAYS = new Set(['search', ${KEYS}`);


// 9. the category lede and the big-grids finish set
sub(PC, ` Every board has one solution you can reach by logic alone, never a guess. No app, no signup, and a leaderboard decided on the clock.',`,
  ` Every board has one solution you can reach by logic alone, never a guess. And two are enormous: Colossus weaves 61 sudokus into one board and Mammoth weaves 257 small ones, each a pot of points split among the players who solve it. No app, no signup, and a leaderboard decided on the clock.',`);
sub('lib/finish-sets.js', `{ name: 'Big grids', cat: 'Sudoku', keys: ['giant', 'suds', 'sando'] },`, `{ name: 'Big grids', cat: 'Sudoku', keys: ['giant', 'colossus', 'mammoth', 'suds'] },`);
// 10. a group and its set page. A game may sit in one group only and a group holds three to
// five, so Giant moves from Classic sudokus to the new Massive sudokus beside the two boards.
sub('lib/daily-groups.js', `{ name: 'Classic sudokus', cat: 'Sudoku', keys: ['suds', 'sixes', 'giant', 'diag', 'whittle'] },`,
  `{ name: 'Classic sudokus', cat: 'Sudoku', keys: ['suds', 'sixes', 'diag', 'whittle'] },\n  { name: 'Massive sudokus', cat: 'Sudoku', keys: ['colossus', 'mammoth', 'giant'] },`);
const PS = 'lib/puzzle-sets.js';
sub(PS, `title: 'Free Daily Classic Sudoku: 9x9, a Two-Minute 6x6, a Giant 16x16, Sudoku X and One in Reverse | Mind Loft',`, `title: 'Free Daily Classic Sudoku: 9x9, a Two-Minute 6x6, Sudoku X and One in Reverse | Mind Loft',`);
sub(PS, `h1: 'Free Daily Classic Sudoku: 9x9, a Two-Minute 6x6, a Giant 16x16, Sudoku X and One Played in Reverse',`, `h1: 'Free Daily Classic Sudoku: 9x9, a Two-Minute 6x6, Sudoku X and One Played in Reverse',`);
sub(PS, `description: 'Five free daily sudokus with the classic rules: a 9x9, a 6x6 mini, a giant 16x16, a diagonal sudoku (Sudoku X) and one played backwards,`, `description: 'Four free daily sudokus with the classic rules: a 9x9, a 6x6 mini, a diagonal sudoku (Sudoku X) and one played backwards,`);
sub(PS, ` Sixes is the 6x6 you finish in two minutes. Giant is a 16x16 with the letters A to G beside the digits, for an evening. Diag adds`, ` Sixes is the 6x6 you finish in two minutes. Diag adds`);
sub(PS, `['Do the puzzles ever need a guess?', 'No. Two independent solvers check every bank before it goes live.'],
      ['Are they free?', 'All five, every day, no account required.'],
    ],
  },
  {
    name: 'Edge clue sudokus'`, `['Do the puzzles ever need a guess?', 'No. Two independent solvers check every bank before it goes live.'],
      ['Are they free?', 'All four, every day, no account required.'],
    ],
  },
  {
    name: 'Massive sudokus', slug: 'massive-sudokus',
    eyebrow: 'Free giant sudoku online',
    title: 'Free Giant Sudoku: 61 Linked Grids, 257 Linked 6x6 and a 16x16 | Mind Loft',
    h1: 'Free Giant Sudoku: 61 Linked Grids, 257 Linked 6x6 and a Daily 16x16',
    description: 'Three free giant sudokus: Colossus, 61 linked 9x9 grids on one board; Mammoth, 257 linked 6x6 grids; and Giant, a daily 16x16. One logical solution each, no signup.',
    lede: 'Three sudokus for a long sit. Colossus weaves 61 ordinary 9x9 sudokus into one enormous board, each sharing its four corner boxes with its neighbors. Mammoth does the same with 257 quick 6x6 sudokus. Giant is one grid, sixteen by sixteen, with the letters A to G beside the digits.',
    how: [
      'On Colossus and Mammoth everyone plays their own copy of the same board. Nothing is marked right or wrong until a whole sudoku is full, every sudoku is a pot of 100 points split among the players who solve it, and a board stays open until every sudoku has been solved by somebody, however long that takes. Giant is a new 16x16 every midnight Eastern, decided on the clock.',
    ],
    faq: [
      ['Do the puzzles ever need a guess?', 'No. Every sudoku on Colossus and Mammoth has one solution and can be finished from its own printed digits by logic alone, and so can every Giant.'],
      ['Are they free?', 'All three, no account required.'],
    ],
  },
  {
    name: 'Edge clue sudokus'`);

console.log(`wire-mega: ${applied} edits applied, ${skipped} already present`);
