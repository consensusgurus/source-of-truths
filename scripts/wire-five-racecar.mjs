// scripts/wire-five-racecar.mjs: wires the two line sudokus, Five (German
// whispers) and Racecar (palindrome), into every registry. Run AFTER
// wire-window.mjs: each entry is anchored on Window's, so the three land
// together.
//
// ANCHORED, per the daily-game checklist: every anchor must match EXACTLY ONCE
// or the script throws. Run it ONCE: the key-list inserts are not idempotent.
//
//   node scripts/wire-five-racecar.mjs <dir>
import fs from 'fs';
import path from 'path';

const root = process.argv[2];
if (!root) { console.error('usage: node wire-five-racecar.mjs <dir>'); process.exit(1); }
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

const G = [
  { key: 'five', Name: 'Five', P: 'FIVE', tag: 'The daily whispers sudoku', short: 'The whispers sudoku', lower: 'the daily German whispers sudoku',
    how: 'An ordinary sudoku plus green lines: any two squares next to each other on a line differ by at least 5. Rows, columns and boxes still hold 1 to 9 once.',
    blurb: 'Neighbours on a green line differ by at least 5. Lows and highs alternate, and a 5 never fits.',
    color: '#15803d', navy: '#86efac', bg: '#effaf2', border: 'rgba(21,128,61,0.4)', beat: '.fv-cell', generic: 'German whispers sudoku',
    glyph: 'M3 17l4.5-10 4.5 10 4.5-10 4.5 10', glyphNote: '// a whispers line: every step a big swing' },
  { key: 'racecar', Name: 'Racecar', P: 'RACECAR', tag: 'The daily palindrome sudoku', short: 'The palindrome sudoku', lower: 'the daily palindrome sudoku',
    how: 'An ordinary sudoku plus grey lines that read the same from either end, so the two end squares of every line match, then the next two in. Rows, columns and boxes still hold 1 to 9 once.',
    blurb: 'Every grey line reads the same both ways, so its ends match. Pair them off from the outside in.',
    color: '#475569', navy: '#cbd5e1', bg: '#f3f5f8', border: 'rgba(71,85,105,0.4)', beat: '.rc-cell', generic: 'Palindrome sudoku',
    glyph: 'M5 7q7 13 14 0M3 7a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M17 7a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M12 3v3', glyphNote: '// a line that mirrors: matching ends, one axis' },
];

for (const g of [...G].reverse()) {
  // Lists of keys: insert straight after Window. Racecar runs first, so the
  // finished order is window, five, racecar. (Not idempotent: run once.)
  const listAdd = (file) => edit(file, `'sumo', 'window'`, `'sumo', 'window', '${g.key}'`);
  // 1. lib/daily-games.js: registry row, premiere, solve-only
  after('lib/daily-games.js', `color: '#be185d', colorNavy: '#f9a8d4' },\n`,
    `  { key: '${g.key}', miss: null, name: '${g.Name}', cat: 'Sudoku', tag: '${g.tag}', how: '${g.how}', color: '${g.color}', colorNavy: '${g.navy}' },\n`);
  after('lib/daily-games.js', `  { key: 'window', from: '2026-10-15', until: '2026-10-19' },`, `\n  { key: '${g.key}', from: '2026-10-15', until: '2026-10-19' },`);
  listAdd('lib/daily-games.js');
  // 2. Sunday Editions
  after('lib/sunday-editions.js', `  'window',\n`, `  '${g.key}',\n`);
  // 3. end card
  after('app/DailyEndCard.jsx', `  window: { accent: '#be185d', badgeBg: '#be185d', badgeInk: T.white, Fin: Grid3x3 },`,
    `\n  ${g.key}: { accent: '${g.color}', badgeBg: '${g.color}', badgeInk: T.white, Fin: Grid3x3 },`);
  const winRow = `  { key: 'window',  cat: 'sudoku' ,   name: 'Window',`;
  {
    const p = path.join(root, 'app/DailyEndCard.jsx'); const s = fs.readFileSync(p, 'utf8');
    const i = s.indexOf(winRow); const j = s.indexOf('\n', i) + 1;
    after('app/DailyEndCard.jsx', s.slice(i, j), `  { key: '${g.key}',  cat: 'sudoku' ,   name: '${g.Name}',  tag: '${g.tag}',    blurb: '${g.blurb}', href: '/${g.key}' },\n`);
  }
  // 4-7. promo, grid, strip
  {
    const p = path.join(root, 'app/DailyGamesPromo.jsx'); const s = fs.readFileSync(p, 'utf8');
    const i = s.indexOf(`  { key: 'window', href: '/window'`); const j = s.indexOf('\n', i) + 1;
    after('app/DailyGamesPromo.jsx', s.slice(i, j), `  { key: '${g.key}', href: '/${g.key}', name: '${g.Name}', tag: '${g.lower.replace('the ', 'the ')}', store: 'sot_${g.key}_day', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}' },\n`);
  }
  after('app/DailyGamesGrid.jsx', `  { key: 'window', href: '/window', name: 'Window', tag: 'The daily windoku', img: '/games/btn-window.png' },\n`,
    `  { key: '${g.key}', href: '/${g.key}', name: '${g.Name}', tag: '${g.tag}', img: '/games/btn-${g.key}.png' },\n`);
  listAdd('app/DailyGamesGrid.jsx');
  after('app/DailyStrip.jsx', `  { key: 'window', href: '/window', name: 'Window', img: '/games/btn-window.png', store: 'sot_window_day', tag: "The daily windoku" , cat: 'Numbers' },\n`,
    `  { key: '${g.key}', href: '/${g.key}', name: '${g.Name}', img: '/games/btn-${g.key}.png', store: 'sot_${g.key}_day', tag: "${g.tag}" , cat: 'Numbers' },\n`);
  edit('app/DailyStrip.jsx', `const ACCENTS = { window: '#f9a8d4',`, `const ACCENTS = { window: '#f9a8d4', ${g.key}: '${g.navy}',`);
  edit('app/DailyStrip.jsx', `const TCOL = { window: '#be185d',`, `const TCOL = { window: '#be185d', ${g.key}: '${g.color}',`);
  // 8. archive
  after('app/archive/page.js', `import { PUZZLES as WINDOW_FULL } from '../window/puzzles';`, `\nimport { PUZZLES as ${g.P}_FULL } from '../${g.key}/puzzles';`);
  after('app/archive/page.js', `const WINDOW = WINDOW_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));\n`,
    `const ${g.P} = ${g.P}_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));\n`);
  {
    const p = path.join(root, 'app/archive/page.js'); const s = fs.readFileSync(p, 'utf8');
    const i = s.indexOf(`  { key: 'window', name: 'Window', path: '/window'`); const j = s.indexOf('\n', i) + 1;
    after('app/archive/page.js', s.slice(i, j), `  { key: '${g.key}', name: '${g.Name}', path: '/${g.key}', tag: '${g.short}', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}', src: ${g.P} },\n`);
  }
  // 9. slate rail, catalog, loft
  for (const f of ['app/DailySlateRail.jsx', 'lib/quiz-catalog.js', 'lib/loft.js']) listAdd(f);
  // 10. the four puzzle maps
  for (const f of ['lib/daily-slate.js', 'app/api/quiz/sunday-slate/route.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js']) {
    after(f, `import { PUZZLES as P_window } from '@/app/window/puzzles';`, `\nimport { PUZZLES as P_${g.key} } from '@/app/${g.key}/puzzles';`);
    edit(f, `sumo: P_sumo, window: P_window`, `sumo: P_sumo, window: P_window, ${g.key}: P_${g.key}`);
  }
  // 11. the two hardcoded alternations
  edit('app/api/quiz/daily-status/route.js', `|sumo|window|`, `|sumo|window|${g.key}|`);
  edit('app/quizzes/QuizHomeClient.jsx', `|sumo|window|`, `|sumo|window|${g.key}|`);
  // 12. glyph
  after('lib/game-glyphs.js', `  window: 'M3 3h18v18H3zM6 6h5v5H6zM13 6h5v5h-5zM6 13h5v5H6zM13 13h5v5h-5z', // a frame, four panes\n`,
    `  ${g.key}: '${g.glyph}', ${g.glyphNote}\n`);
  // 13. /sudoku landing keys + generic name
  listAdd('lib/puzzle-categories.js');
  edit('lib/puzzle-categories.js', `window: 'Windoku',`, `window: 'Windoku', ${g.key}: '${g.generic}',`);
  // 15. circuit family, finish ripple
  listAdd('lib/circuits.js');
  after('lib/finish-beats.js', `  window: grid('.wi-cell'),`, `\n  ${g.key}: grid('${g.beat}'),`);
}

// /sudoku landing prose, groups, sets (once, for both)
const PC = 'lib/puzzle-categories.js';
edit(PC, `Free Daily Sudoku: Seventeen Variants, One New Board Every Day | Mind Loft',`, `Free Daily Sudoku: Nineteen Variants, One New Board Every Day | Mind Loft',`);
edit(PC, `    h1: 'Free Daily Sudoku: Seventeen Variants, One New Board Every Day',`, `    h1: 'Free Daily Sudoku: Nineteen Variants, One New Board Every Day',`);
edit(PC, `a giant 16x16, thirteen variants (diagonal, windoku, jigsaw, killer, sandwich, frame, outside, thermo, arrow, kropki, greater-than, anti-knight, skyscrapers) and one played backwards. One logical solution, never a guess, a new board every day, no signup.'`,
  `a giant 16x16, fifteen variants (diagonal, windoku, jigsaw, killer, sandwich, thermo, arrow, whispers, palindrome, kropki and more) and one played backwards. One logical solution, never a guess, no signup.'`);
edit(PC, `thirteen variant sudokus you will not find together anywhere else (diagonal, windoku, jigsaw, killer, sandwich, frame, outside, thermo, arrow, kropki, greater-than, anti-knight and skyscrapers)`,
  `fifteen variant sudokus you will not find together anywhere else (diagonal, windoku, jigsaw, killer, sandwich, frame, outside, thermo, arrow, German whispers, palindrome, kropki, greater-than, anti-knight and skyscrapers)`);
edit(PC, `Cages, Sando, Frame and Arrow add arithmetic, Mercury, Polka and Sumo add ordering,`, `Cages, Sando, Frame and Arrow add arithmetic, Mercury, Polka and Sumo add ordering, Five and Racecar draw lines with a rule of their own,`);
edit(PC, `a Window with thirteen,`, `a Window with thirteen, a Five with eleven under eight lines, a Racecar with fourteen under ten,`);
edit('lib/daily-groups.js', `  { name: 'Marked sudokus', cat: 'Sudoku', keys: ['quilt', 'window', 'arrow', 'knight'] },`,
  `  { name: 'Marked sudokus', cat: 'Sudoku', keys: ['quilt', 'window', 'arrow', 'knight', 'racecar'] },`);
edit('lib/daily-groups.js', `  { name: 'Order sudokus', cat: 'Sudoku', keys: ['mercury', 'polka', 'sumo'] },`,
  `  { name: 'Order sudokus', cat: 'Sudoku', keys: ['mercury', 'polka', 'sumo', 'five'] },`);
edit('lib/daily-groups.js', `  // Sudoku (17)`, `  // Sudoku (19)`);
after('lib/finish-sets.js', `  { name: 'Extra houses', cat: 'Sudoku', keys: ['window', 'diag', 'quilt'] },`,
  `\n  { name: 'Line sudokus', cat: 'Sudoku', keys: ['five', 'racecar', 'mercury', 'arrow'] },`);

console.log(`wire-five-racecar: ${applied} edits applied, ${skipped} already present`);
