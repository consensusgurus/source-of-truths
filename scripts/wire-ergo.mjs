// scripts/wire-ergo.mjs: wires Ergo (the daily if-then sort, launched
// 2026-10-11) into every registry, beside Docket in each list. Anchored in the
// shape of scripts/wire-potluck.mjs: every anchor must match EXACTLY ONCE or
// the script throws, and an edit whose replacement is already present is
// skipped, so a re-run is safe.
//
// The Judged roster swap (Ergo in, Hearsay out, dated from 2026-10-11) is NOT
// done here; it lives in lib/circuits.js, lib/law-school.js and app/judged.
//
//   node scripts/wire-ergo.mjs <dir>
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
  color: '#5b3a9e', navy: '#c4b5fd', bg: '#f1ecfa', border: 'rgba(91,58,158,0.4)',
  tag: 'Must, could or cannot',
  how: 'A small cast, a handful of if-then rules about who does what, and one fact for today. Sort nine statements into must be true, could be true and cannot be true. Twelve on Sundays.',
  blurb: 'A few if-then rules, one fact, and nine statements to sort into must, could and cannot. Chain the rules, flip them, and watch for the ones running backwards.',
};
const DOCKET_ROW = `  { key: 'docket', miss: 'Wrong', name: 'Docket', cat: 'Logic',`;

// 1. lib/daily-games.js: the row, before Docket, and a premiere window.
edit('lib/daily-games.js', DOCKET_ROW,
  `  { key: 'ergo', miss: 'Wrong', name: 'Ergo', cat: 'Logic', tag: '${D.tag}', how: '${D.how}', color: '${D.color}', colorNavy: '${D.navy}' },\n${DOCKET_ROW}`);
edit('lib/daily-games.js',
  `  { key: 'potluck', from: '2026-10-10', until: '2026-10-14' },`,
  `  { key: 'ergo', from: '2026-10-11', until: '2026-10-15' },\n  { key: 'potluck', from: '2026-10-10', until: '2026-10-14' },`);

// 2. lib/sunday-editions.js: the comment and the list.
edit('lib/sunday-editions.js',
  `//   docket  the stacked board: seven entities over seven slots PLUS a second`,
  `//   ergo    twelve statements to sort instead of nine, under seven rules\n//   docket  the stacked board: seven entities over seven slots PLUS a second`);
edit('lib/sunday-editions.js', `'chomp', 'sweep', 'docket', 'defend',`, `'chomp', 'sweep', 'ergo', 'docket', 'defend',`);

// 3. app/DailyEndCard.jsx: launch pin, meta, roster tile; and the order pin.
edit('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['potluck',`, `const LAUNCH_PIN = { keys: ['ergo', 'potluck',`);
edit('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['potluck',`, `const LAUNCH_PIN = { keys: ['ergo', 'potluck',`);
edit('app/DailyEndCard.jsx',
  `  docket: { accent: '#5b2333', badgeBg: '#5b2333', badgeInk: T.white, Fin: Gavel },`,
  `  ergo: { accent: '${D.color}', badgeBg: '${D.color}', badgeInk: T.white, Fin: Waypoints },\n  docket: { accent: '#5b2333', badgeBg: '#5b2333', badgeInk: T.white, Fin: Gavel },`);
edit('app/DailyEndCard.jsx',
  `  { key: 'docket', cat: 'logic',      name: 'Docket',`,
  `  { key: 'ergo', cat: 'logic',        name: 'Ergo', tag: '${D.tag}', blurb: '${D.blurb}', href: '/ergo' },\n  { key: 'docket', cat: 'logic',      name: 'Docket',`);

// 4. app/DailyStrip.jsx: the row and both colour maps.
edit('app/DailyStrip.jsx',
  `  { key: 'docket', href: '/docket', name: 'Docket',`,
  `  { key: 'ergo', href: '/ergo', name: 'Ergo', img: '/games/btn-ergo.png', store: 'sot_ergo_day', tag: "${D.tag}" , cat: 'Logic' },\n  { key: 'docket', href: '/docket', name: 'Docket',`);
edit('app/DailyStrip.jsx', `const ACCENTS = { potluck:`, `const ACCENTS = { ergo: '${D.navy}', potluck:`);
edit('app/DailyStrip.jsx', `const TCOL = { potluck:`, `const TCOL = { ergo: '${D.color}', potluck:`);

// 5. app/DailyGamesGrid.jsx: both lists.
edit('app/DailyGamesGrid.jsx',
  `  { key: 'docket', href: '/docket', name: 'Docket', tag:`,
  `  { key: 'ergo', href: '/ergo', name: 'Ergo', tag: '${D.tag}', img: '/games/btn-ergo.png' },\n  { key: 'docket', href: '/docket', name: 'Docket', tag:`);
edit('app/DailyGamesGrid.jsx', `'chomp', 'docket', 'plot'] },`, `'chomp', 'ergo', 'docket', 'plot'] },`);

// 6. app/DailyGamesPromo.jsx
edit('app/DailyGamesPromo.jsx',
  `  { key: 'docket', href: '/docket', name: 'Docket',`,
  `  { key: 'ergo', href: '/ergo', name: 'Ergo', tag: 'must, could or cannot', store: 'sot_ergo_day', accent: '${D.color}', bg: '${D.bg}', border: '${D.border}' },\n  { key: 'docket', href: '/docket', name: 'Docket',`);

// 7. app/archive/page.js: import, light map, card.
edit('app/archive/page.js',
  `import { PUZZLES as DOCKET_FULL } from '../docket/puzzles';`,
  `import { PUZZLES as DOCKET_FULL } from '../docket/puzzles';\nimport { PUZZLES as ERGO_FULL } from '../ergo/puzzles';`);
{
  const p = path.join(root, 'app/archive/page.js');
  const src = fs.readFileSync(p, 'utf8');
  const line = `const ERGO = ERGO_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`;
  if (src.includes(line)) skipped++;
  else {
    const m = src.match(/\nconst DOCKET = [^\n]*\n/);
    if (!m) throw new Error('app/archive/page.js: const DOCKET line not found');
    fs.writeFileSync(p, src.replace(m[0], `${m[0]}${line}\n`));
    applied++;
  }
}
edit('app/archive/page.js',
  `  { key: 'docket', name: 'Docket', path: '/docket',`,
  `  { key: 'ergo', name: 'Ergo', path: '/ergo', tag: '${D.tag}', accent: '${D.color}', bg: '${D.bg}', border: '${D.border}', src: ERGO },\n  { key: 'docket', name: 'Docket', path: '/docket',`);

// 8. the plain key lists.
edit('lib/loft.js', `'deep', 'defend', 'docket',`, `'deep', 'defend', 'docket', 'ergo',`);
edit('lib/sitemap-entries.js', `  'docket', 'plot', 'barter',`, `  'ergo', 'docket', 'plot', 'barter',`);
edit('lib/quiz-catalog.js', `'sweep', 'docket', 'blitz',`, `'sweep', 'ergo', 'docket', 'blitz',`);
edit('app/DailySlateRail.jsx', `'sweep', 'docket', 'blitz',`, `'sweep', 'ergo', 'docket', 'blitz',`);

// 9. the puzzle-map registries, sunday-slate included.
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  edit(f, `import { PUZZLES as P_docket } from '@/app/docket/puzzles';`,
    `import { PUZZLES as P_docket } from '@/app/docket/puzzles';\nimport { PUZZLES as P_ergo } from '@/app/ergo/puzzles';`);
}
edit('lib/daily-slate.js', `  docket: P_docket,\n`, `  docket: P_docket,\n  ergo: P_ergo,\n`);
edit('app/api/quiz/daily-game/route.js', `sweep: P_sweep, docket: P_docket,`, `sweep: P_sweep, docket: P_docket, ergo: P_ergo,`);
edit('app/api/quiz/daily-unplayed/route.js', `sweep: P_sweep, docket: P_docket,`, `sweep: P_sweep, docket: P_docket, ergo: P_ergo,`);
edit('app/api/quiz/sunday-slate/route.js', `docket: P_docket, defend:`, `docket: P_docket, ergo: P_ergo, defend:`);

// 10. the two hardcoded alternations.
edit('app/api/quiz/daily-status/route.js', `|sweep|docket|`, `|sweep|docket|ergo|`);
edit('app/quizzes/QuizHomeClient.jsx', `|sweep|docket|`, `|sweep|docket|ergo|`);

// 11. glyph: an arrow with the three therefore dots.
edit('lib/game-glyphs.js',
  `  docket: 'M5 4h14v16H5zM8 9h8M8 13h8M8 17h4M9 4v3',          // a docket`,
  `  docket: 'M5 4h14v16H5zM8 9h8M8 13h8M8 17h4M9 4v3',          // a docket\n  ergo: 'M4 6h14M15 3l3 3-3 3M7 19h.01M17 19h.01M12 14h.01', // an arrow over the therefore dots`);

// 12. the logic landing page.
edit('lib/puzzle-categories.js', `'hearsay', 'docket', 'suffice', 'chomp'],`, `'hearsay', 'ergo', 'docket', 'suffice', 'chomp'],`);
edit('lib/puzzle-categories.js', `docket: 'Analytical reasoning',`, `ergo: 'If-then reasoning', docket: 'Analytical reasoning',`);

// 13. finish sets and slate groups (both verifiers want every live game in one).
edit('lib/finish-sets.js',
  `  { name: 'Sorting puzzles', cat: 'Logic', keys: ['venn', 'docket', 'stands'] },`,
  `  { name: 'Sorting puzzles', cat: 'Logic', keys: ['venn', 'docket', 'stands', 'ergo'] },`);
edit('lib/daily-groups.js',
  `  { name: 'Rule finding', cat: 'Logic', keys: ['axiom', 'suffice', 'stands', 'docket'] },`,
  `  { name: 'Rule finding', cat: 'Logic', keys: ['axiom', 'suffice', 'stands', 'docket', 'ergo'] },`);

// 14. the measured-clock snapshot: an estimate until the next re-measure.
edit('scripts/verify-circuits.mjs', `  impound: 150, junkyard: 240,`,
  `  impound: 150, junkyard: 240,\n  // Ergo launched 2026-10-11 with no clock data: nine statements to file, a\n  // little longer than Hearsay's one card. Replace at the next re-measure.\n  ergo: 120,`);

console.log(`wire-ergo: ${applied} edits applied, ${skipped} already present`);
