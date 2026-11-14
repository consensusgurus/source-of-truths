// scripts/wire-mop.mjs: wires Mop (the daily mop-every-tile route puzzle, Logic,
// owner 2026-11-13) into every registry in one pass, beside Connect, its nearest
// sibling. Placement follows "Placing a new daily" in docs/claude/daily-authoring.md.
//
// Skills: Spatial and Planning. A solve is 10 and anything else 0, ranked on the
// clock, so it is in SOLVE_ONLY (Solved / Unfinished) with no miss column.
// IT RUNS A SUNDAY EDITION (three floors), so it is on SUNDAY_EDITION_GAMES and
// in the Sunday slate map, and every Sunday row carries `sunday: true`.
//
// Sets: joins the Grid filling daily group and set page (four become five) and
// the Path finding finish set.
//
// Anchored: every anchor must match EXACTLY ONCE or the script throws, and an
// edit whose replacement is already present is skipped, so a re-run is safe.
//   node scripts/wire-mop.mjs <dir>
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

const g = { key: 'mop', name: 'Mop', NAMEUP: 'MOP', tag: 'Mop every tile once, then get out', promo: 'mop every tile once, then get out', tagLong: 'Mop every tile of the house exactly once and leave by the door',
  how: 'Mop every tile of a house exactly once, then get out the door. The house is drawn from above, with rooms, doorways and furniture, and a wet tile can never be stepped on again. Houses grow through the week, and Sunday is three floors joined by stairs. One route; the clock decides it.',
  blurb: 'A house from above and one mop. Cover every tile exactly once, never step on a wet one, and finish at the door.',
  short: 'Mop every tile of the house once and get out the door.',
  color: '#be123c', navy: '#fda4af', bg: '#ffe4e6', border: 'rgba(190,18,60,0.4)' };

// 1. lib/daily-games.js: the row, the premiere, solve-only
afterLine('lib/daily-games.js', "{ key: 'connect', miss: null, name: 'Connect',", [
  `  { key: '${g.key}', miss: null, name: '${g.name}', cat: 'Logic', tag: '${g.tag}', tagLong: '${g.tagLong}', how: '${g.how}', color: '${g.color}', colorNavy: '${g.navy}' },`]);
sub('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n  { key: 'mop', from: '2026-11-13', until: '2026-11-17' },\n`);
sub('lib/daily-games.js', `'swap', 'slide', 'spin', 'connect', 'fill', 'pairs', 'duet', 'lamps', 'cipher',`, `'swap', 'slide', 'spin', 'connect', 'mop', 'fill', 'pairs', 'duet', 'lamps', 'cipher',`);

// 2. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['spot', `, `const LAUNCH_PIN = { keys: ['mop', 'spot', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['spot', `, `const LAUNCH_PIN = { keys: ['mop', 'spot', `);
afterLine('app/DailyEndCard.jsx', "  defuse: { accent: '#7c2d12', badgeBg: '#7c2d12', badgeInk: T.white, Fin: Trophy },", [
  `  ${g.key}: { accent: '${g.color}', badgeBg: '${g.color}', badgeInk: T.white, Fin: Trophy },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'connect', cat: 'logic', name: 'Connect',", [
  `  { key: '${g.key}', cat: 'logic', name: '${g.name}', tag: '${g.tag}', blurb: '${g.blurb}', href: '/${g.key}' },`]);

// 3. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'connect', href: '/connect'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.promo}', store: 'sot_${g.key}_day', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'connect', href: '/connect'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.tag}', img: '/games/btn-${g.key}.png' },`]);
sub('app/DailyGamesGrid.jsx', `'sudoclue', 'snug', 'connect', 'duet', 'lamps', 'judges',`, `'sudoclue', 'snug', 'connect', 'mop', 'duet', 'lamps', 'judges',`);
afterLine('app/DailyStrip.jsx', "{ key: 'connect', href: '/connect'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', img: '/games/btn-${g.key}.png', store: 'sot_${g.key}_day', tag: "${g.tag}" , cat: 'Logic' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { spot: `, `const ACCENTS = { mop: '${g.navy}', spot: `);
sub('app/DailyStrip.jsx', `const TCOL = { spot: `, `const TCOL = { mop: '${g.color}', spot: `);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as CONNECT_FULL } from '../connect/puzzles';`,
  `import { PUZZLES as CONNECT_FULL } from '../connect/puzzles';\nimport { PUZZLES as MOP_FULL } from '../mop/puzzles';`);
afterLine('app/archive/page.js', 'const CONNECT = CONNECT_FULL.map(', [
  `const MOP = MOP_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`]);
afterLine('app/archive/page.js', "{ key: 'connect', name: 'Connect', path: '/connect'", [
  `  { key: '${g.key}', name: '${g.name}', path: '/${g.key}', tag: '${g.tag}', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}', src: MOP },`]);

// 5. the three daily puzzle maps and the Sunday slate
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_connect } from '@/app/connect/puzzles';`,
    `import { PUZZLES as P_connect } from '@/app/connect/puzzles';\nimport { PUZZLES as P_mop } from '@/app/mop/puzzles';`);
  sub(f, `connect: P_connect, `, `connect: P_connect, mop: P_mop, `);
}
sub('lib/sunday-editions.js', `'swap', 'slide', 'spin', 'connect', 'duet', 'lamps', 'clade',`, `'swap', 'slide', 'spin', 'connect', 'mop', 'duet', 'lamps', 'clade',`);
afterLine('lib/sunday-editions.js', '//   connect a 12x12 board, the top of a ramp', [
  '//   mop     a house on three floors (Upstairs, Ground Floor, Basement) joined by staircases, against one floor']);

// 6. alternations, rails, catalog, loft, families, starting difficulty
sub('app/api/quiz/daily-status/route.js', `|spin|connect|`, `|spin|connect|mop|`);
sub('app/quizzes/QuizHomeClient.jsx', `|spin|connect|`, `|spin|connect|mop|`);
for (const f of ['app/DailySlateRail.jsx', 'lib/quiz-catalog.js', 'lib/loft.js']) sub(f, `'spin', 'connect', 'duet',`, `'spin', 'connect', 'mop', 'duet',`);
sub('lib/daily-families.js', `'etch', 'plot', 'connect', 'paths'],`, `'etch', 'plot', 'connect', 'paths', 'mop'],`);
afterLine('lib/daily-difficulty.js', '  defuse: 3, // a starting estimate (2026-11-12)', [`  ${g.key}: 3, // a starting estimate (2026-11-13) until a week of plays rates it`]);

// 7. skills, glyph, blurb, preview drawings
sub('lib/daily-skills.js', `connect: ['spa', 'ded'], `, `connect: ['spa', 'ded'], mop: ['spa', 'plan'], `);
afterLine('lib/game-glyphs.js', "  defuse: 'M6 3v18", [`  mop: 'M17 3l-6 9M6 12h10l1 3H5zM7 15v5M10 15v6M13 15v6M16 15v5',  // a mop: the handle, the collar, the strands`]);
afterLine('lib/game-blurbs.js', '  defuse: "', [`  ${g.key}: "${g.short}",`]);
sub('app/GamePreviewTiles.jsx', `const Connect = () => (\n`, `// a floor of tiles half mopped (the dark ones still to do), a wall with a doorway, and the mop
const Mop = () => (
  <g><Grid x={112} y={6} n={4} sz={18} />
    {cells(112, 6, 4, 4, 18, (x, y, c, r, i) => ([2, 3, 7, 10, 11, 14, 15].includes(i) ? <rect key={i} x={x + 1} y={y + 1} width={16} height={16} className="sm" /> : null))}
    <path d="M148 6V24M148 42V78" className="d6" /><path d="M139 40L156 16" className="d6" /><path d="M130 40h18l3 12h-24z" className="d" /></g>
);
const Connect = () => (\n`);
sub('app/GamePreviewTiles.jsx', `  connect: Connect, duet: Duet,`, `  connect: Connect, mop: Mop, duet: Duet,`);
sub('app/GamePreview.jsx', `const Park = () => (\n`, `// Mop: a tiled floor, the left of it mopped, and the mop standing where it stopped
const Mop = () => (
  <g>{cells(90, 8, 6, 3, 22, (x, y, c, r, i) => <rect key={i} x={x + 1} y={y + 1} width={20} height={20} rx={2} className={c < 3 ? 'w' : 'm'} />)}
    <path d="M150 44L172 12" className="s5" /><path d="M138 44h24l4 16h-32z" className="d" /></g>
);
const Park = () => (\n`);
sub('app/GamePreview.jsx', `  connect: Dots, duet: Dots,`, `  connect: Dots, mop: Mop, duet: Dots,`);

// 8. groups and finish sets
sub('lib/daily-groups.js', `{ name: 'Grid filling', cat: 'Logic', keys: ['duet', 'lamps', 'snug', 'connect'] },`, `{ name: 'Grid filling', cat: 'Logic', keys: ['duet', 'lamps', 'snug', 'connect', 'mop'] },`);
sub('lib/finish-sets.js', `{ name: 'Path finding', cat: 'Logic', keys: ['hedge', 'plot', 'connect'] },`, `{ name: 'Path finding', cat: 'Logic', keys: ['hedge', 'plot', 'connect', 'mop'] },`);

// 9. the Grid filling set page: four become five
const PS = 'lib/puzzle-sets.js';
sub(PS, `description: 'Four free daily puzzles where you fill the board: a dots-and-rings binary grid, a light-up puzzle, a shape-fitting puzzle with exactly one way in, and a dot-joining numberlink.`,
  `description: 'Five free daily puzzles where you fill the board: a dots-and-rings binary grid, a light-up puzzle, a shape-fitting puzzle with exactly one way in, a dot-joining numberlink and a mop-every-tile route puzzle.`);
sub(PS, `lede: 'Four puzzles where the board starts nearly empty and you fill it.`, `lede: 'Five puzzles where the board starts nearly empty and you fill it.`);
sub(PS, `Connect joins pairs of matching dots until every square is used.',`, `Connect joins pairs of matching dots until every square is used. Mop sends one mop through a house until every tile has been mopped exactly once.',`);
sub(PS, `never crossing another, and the board is done only when every square is used.',\n    ],`, `never crossing another, and the board is done only when every square is used. Mop is one unbroken route through a house drawn from above: every tile once, never back over a wet one, past the furniture and through the doorways, finishing at the door.',\n    ],`);
sub(PS, `Snug lays eight pieces on a 7x7, and Connect runs 12x12.'],\n      ['Are they free?', 'All four, every day, no account required.'],`, `Snug lays eight pieces on a 7x7, Connect runs 12x12, and Mop is a house on three floors.'],\n      ['Are they free?', 'All five, every day, no account required.'],`);

// 10. the logic-puzzles page: twenty-one become twenty-two
const PC = 'lib/puzzle-categories.js';
sub(PC, `description: 'Twenty-one free daily logic puzzles: a nonogram, slitherlink, shikaku, a binary dots-and-rings grid, a light-every-square puzzle, a shape-fitting puzzle, a dot-joining numberlink, two`, `description: 'Twenty-two free daily logic puzzles: a nonogram, slitherlink, shikaku, a binary dots-and-rings grid, a light-every-square puzzle, a shape-fitting puzzle, a dot-joining numberlink, a mop-every-tile route puzzle, two`);
sub(PC, `lede: 'Twenty-one logic puzzles with one new board apiece every day. Pencil-and-paper classics (a nonogram, a slitherlink loop, shikaku rectangles, a balanced dots-and-rings grid, a light-every-square puzzle, a shape-fitting puzzle, a dot-joining numberlink) alongside`, `lede: 'Twenty-two logic puzzles with one new board apiece every day. Pencil-and-paper classics (a nonogram, a slitherlink loop, shikaku rectangles, a balanced dots-and-rings grid, a light-every-square puzzle, a shape-fitting puzzle, a dot-joining numberlink, a one-route house to mop) alongside`);
sub(PC, `'lamps', 'snug', 'connect', 'jester', 'judges', 'defuse',`, `'lamps', 'snug', 'connect', 'mop', 'jester', 'judges', 'defuse',`);
sub(PC, `connect: 'Numberlink (join the dots)', defuse:`, `connect: 'Numberlink (join the dots)', mop: 'Route puzzle (visit every tile once)', defuse:`);
sub(PC, `Connect is numberlink: join every pair of matching dots without crossing and use every square. Jesters`, `Connect is numberlink: join every pair of matching dots without crossing and use every square. Mop is a route puzzle: push a mop through a house, covering every tile exactly once and never stepping back on a wet one, and finish at the door. Jesters`);
sub(PC, `Connect runs 12x12, Alibi seats five suspects,`, `Connect runs 12x12, Mop is a house on three floors, Alibi seats five suspects,`);
sub(PC, `['Are they free?', 'All twenty-one, every day, no account required.'],`, `['Are they free?', 'All twenty-two, every day, no account required.'],`);

console.log(`wire-mop: ${applied} edits applied, ${skipped} already present`);
