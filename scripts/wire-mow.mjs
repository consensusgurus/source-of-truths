// scripts/wire-mow.mjs: wires Mow (the daily mow-every-square lawn puzzle,
// Logic, owner 2026-11-16) into every registry in one pass, beside Mop, its
// indoor sibling. Placement follows "Placing a new daily" in
// docs/claude/daily-authoring.md.
//
// Skills: Spatial and Planning. A finished yard is 10 and a give-up 0, so it is
// in SOLVE_ONLY; its miss column is Replays, ranked BEHIND the clock (CLOCK_FIRST
// in lib/daily-games.js). Mop moves to the same rule here (its miss becomes
// Replays). The two are a FAMILY (owner: "when a player finishes mow / mop, they
// should always be served the other").
// IT RUNS A SUNDAY EDITION (the Estate, nine by nine), so it is on
// SUNDAY_EDITION_GAMES and in the Sunday slate map.
// SETS: joins Everyday puzzles (three become four) and the Chores finish set.
//
// Anchored: every anchor must match EXACTLY ONCE or the script throws, and an
// edit whose replacement is already present is skipped. Do not re-run it after
// a line it wrote has been changed by hand.
//   node scripts/wire-mow.mjs <dir>
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

const g = { key: 'mow', name: 'Mow', tag: 'Mow every square once, then out the gate', promo: 'mow every square once, then out the gate', tagLong: 'Mow every square of the yard exactly once and leave by the gate',
  how: 'Mow every square of grass in a yard exactly once, then get out the gate. The yard is drawn from above, with fences, gates, trees, bushes, a pond, a shed and sometimes the house. Run over grass you have already mown and you replay from the gate with the clock still running. The yard grows a size every day, up to the nine by nine Estate on Sunday. Ranked on the clock, then replays.',
  blurb: 'A yard from above and one mower. Mow every square of grass exactly once, round the trees and the pond, and out the gate.',
  short: 'Mow every square of the yard once and get out the gate.',
  color: '#be123c', navy: '#fda4af', bg: '#ffe4e6', border: 'rgba(190,18,60,0.4)' };

// 1. lib/daily-games.js: the row, Mop's new miss, the premiere, solve-only, the family
afterLine('lib/daily-games.js', "{ key: 'mop', miss: ", [
  `  { key: '${g.key}', miss: 'Replays', name: '${g.name}', cat: 'Logic', tag: '${g.tag}', tagLong: '${g.tagLong}', how: '${g.how}', color: '${g.color}', colorNavy: '${g.navy}' },`]);
sub('lib/daily-games.js', `{ key: 'mop', miss: null, name: 'Mop',`, `{ key: 'mop', miss: 'Replays', name: 'Mop',`);
sub('lib/daily-games.js', `a wet tile can never be stepped on again. Houses grow through the week, and Sunday is three floors joined by stairs. One route; the clock decides it.'`,
  `stepping on a wet tile is a replay from the door, the clock still running. Houses grow through the week, and Sunday is three floors joined by stairs. Ranked on the clock, then replays.'`);
sub('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n  { key: 'mow', from: '2026-11-17', until: '2026-11-22' },\n`);
sub('lib/daily-games.js', `'spin', 'connect', 'mop', 'chef', 'seated', 'bag', 'errands', 'dash', 'pack', 'fill',`, `'spin', 'connect', 'mop', 'mow', 'chef', 'seated', 'bag', 'errands', 'dash', 'pack', 'fill',`);
sub('lib/daily-games.js', `  jigsaw: ['jig', 'saw'],\n};`, `  jigsaw: ['jig', 'saw'],\n  // owner, 2026-11-16: "when a player finishes mow / mop, they should always be served the other"\n  chores: ['mop', 'mow'],\n};`);

// 2. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['poll', `, `const LAUNCH_PIN = { keys: ['mow', 'poll', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['poll', `, `const LAUNCH_PIN = { keys: ['mow', 'poll', `);
afterLine('app/DailyEndCard.jsx', "  mop: { accent: '#be123c', badgeBg: '#be123c', badgeInk: T.white, Fin: Trophy },", [
  `  ${g.key}: { accent: '${g.color}', badgeBg: '${g.color}', badgeInk: T.white, Fin: Trophy },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'mop', cat: 'logic', name: 'Mop',", [
  `  { key: '${g.key}', cat: 'logic', name: '${g.name}', tag: '${g.tag}', blurb: '${g.blurb}', href: '/${g.key}' },`]);

// 3. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'mop', href: '/mop'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.promo}', store: 'sot_${g.key}_day', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'mop', href: '/mop'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.tag}', img: '/games/btn-${g.key}.png' },`]);
sub('app/DailyGamesGrid.jsx', `'connect', 'mop', 'chef',`, `'connect', 'mop', 'mow', 'chef',`);
afterLine('app/DailyStrip.jsx', "{ key: 'mop', href: '/mop'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', img: '/games/btn-${g.key}.png', store: 'sot_${g.key}_day', tag: "${g.tag}" , cat: 'Logic' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { dash: `, `const ACCENTS = { mow: '${g.navy}', dash: `);
sub('app/DailyStrip.jsx', `const TCOL = { dash: `, `const TCOL = { mow: '${g.color}', dash: `);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as MOP_FULL } from '../mop/puzzles';`,
  `import { PUZZLES as MOP_FULL } from '../mop/puzzles';\nimport { PUZZLES as MOW_FULL } from '../mow/puzzles';`);
afterLine('app/archive/page.js', 'const MOP = MOP_FULL.map(', [
  `const MOW = MOW_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`]);
afterLine('app/archive/page.js', "{ key: 'mop', name: 'Mop', path: '/mop'", [
  `  { key: '${g.key}', name: '${g.name}', path: '/${g.key}', tag: '${g.tag}', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}', src: MOW },`]);

// 5. the daily puzzle maps and the Sunday slate
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_mop } from '@/app/mop/puzzles';`,
    `import { PUZZLES as P_mop } from '@/app/mop/puzzles';\nimport { PUZZLES as P_mow } from '@/app/mow/puzzles';`);
  sub(f, `mop: P_mop, `, `mop: P_mop, mow: P_mow, `);
}
sub('lib/sunday-editions.js', `'connect', 'mop', 'chef',`, `'connect', 'mop', 'mow', 'chef',`);
afterLine('lib/sunday-editions.js', '//   mop     a house on three floors', [
  '//   mow     the Estate: a nine by nine yard with the house in it, against six by six on Monday growing a size a day']);

// 6. alternations, rails, catalog, loft, families, starting difficulty
sub('app/api/quiz/daily-status/route.js', `|mop|chef|seated|`, `|mop|mow|chef|seated|`);
sub('app/quizzes/QuizHomeClient.jsx', `|mop|chef|seated|`, `|mop|mow|chef|seated|`);
for (const f of ['app/DailySlateRail.jsx', 'lib/quiz-catalog.js', 'lib/loft.js']) sub(f, `'connect', 'mop', 'chef',`, `'connect', 'mop', 'mow', 'chef',`);
sub('lib/daily-families.js', `'connect', 'paths', 'mop'],`, `'connect', 'paths', 'mop', 'mow'],`);
afterLine('lib/daily-difficulty.js', '  mop: 3, // a starting estimate (2026-11-13)', [`  ${g.key}: 3, // a starting estimate (2026-11-16) until a week of plays rates it`]);

// 7. skills, glyph, blurb, preview drawings
sub('lib/daily-skills.js', `mop: ['spa', 'plan'], `, `mop: ['spa', 'plan'], mow: ['spa', 'plan'], `);
afterLine('lib/game-glyphs.js', "  mop: 'M17 3l-6 9", [`  mow: 'M3 9l6 4M3 6v6M9 11h11v6H9zM10 17v2M19 17v2M14 14h2',  // a push mower: the handle, the deck, the wheels`]);
afterLine('lib/game-blurbs.js', '  mop: "', [`  ${g.key}: "${g.short}",`]);
if (!/\nconst Mow = /.test(rd('app/GamePreviewTiles.jsx'))) sub('app/GamePreviewTiles.jsx', `const Connect = () => (\n`, `// a lawn from above: the left of it mown in stripes, a tree in the way, a fence with a gate, and the mower
const Mow = () => (
  <g><rect x={110} y={8} width={76} height={68} rx={4} className="w" /><path d="M150 8V30M150 48V76" className="s3" />
    <path d="M119 19H141M119 31H141M119 43H141M119 55H141M119 67H141" className="sm5" />
    <circle cx={170} cy={26} r={11} className="m" /><rect x={160} y={56} width={20} height={14} rx={3} className="d" /><path d="M160 63H150" className="s3" /></g>
);
const Connect = () => (\n`);
sub('app/GamePreviewTiles.jsx', `  connect: Connect, mop: Mop, `, `  connect: Connect, mop: Mop, mow: Mow, `);
if (!/\nconst Mow = /.test(rd('app/GamePreview.jsx'))) sub('app/GamePreview.jsx', `const Park = () => (\n`, `// Mow: a lawn from above with a fence and a gate, stripes where it has been mown, a tree in the way, and the mower
const Mow = () => (
  <g><rect x={92} y={8} width={112} height={68} rx={4} className="w" /><path d="M150 8V30M150 48V76" className="s3" />
    <path d="M101 19H141M101 31H141M101 43H141M101 55H141" className="sm5" />
    <circle cx={180} cy={28} r={13} className="m" />
    <rect x={160} y={56} width={24} height={14} rx={3} className="d" /><path d="M160 63H148" className="s3" /></g>
);
const Park = () => (\n`);
sub('app/GamePreview.jsx', `  connect: Dots, mop: Mop, `, `  connect: Dots, mop: Mop, mow: Mow, `);

// 8. groups and finish sets
sub('lib/daily-groups.js', `{ name: 'Everyday puzzles', cat: 'Logic', keys: ['seated', 'chef', 'mop'] },`, `{ name: 'Everyday puzzles', cat: 'Logic', keys: ['seated', 'chef', 'mop', 'mow'] },`);
sub('lib/daily-groups.js', `  // Logic (27)`, `  // Logic (28)`);
sub('lib/finish-sets.js', `{ name: 'Chores', cat: 'Logic', keys: ['bag', 'mop', 'chef'] },`, `{ name: 'Chores', cat: 'Logic', keys: ['bag', 'mop', 'mow', 'chef'] },`);

// 9. the Everyday puzzles set page: three become four
const PS = 'lib/puzzle-sets.js';
sub(PS, `title: 'Free Daily Everyday Puzzles: Seating Chart, Kitchen Timing and Mop the House | Mind Loft',`, `title: 'Free Daily Everyday Puzzles: Seating, Kitchen, Mop and Mow | Mind Loft',`);
sub(PS, `h1: 'Free Daily Everyday Puzzles: Seating Chart, Kitchen Timing and Mop Every Tile',`, `h1: 'Free Daily Everyday Puzzles: Seating Chart, Kitchen Timing, Mop the House and Mow the Lawn',`);
sub(PS, `description: 'Three free daily logic puzzles taken from life at home: seat a room of guests so every request is met, fire the dishes of a kitchen so every table goes out hot, and mop every tile of a house exactly once.`,
  `description: 'Four free daily logic puzzles taken from life at home: seat a room of guests so every request is met, fire the dishes of a kitchen so every table goes out hot, mop every tile of a house exactly once, and mow every square of the lawn.`);
sub(PS, `lede: 'Three puzzles about jobs everyone knows.`, `lede: 'Four puzzles about jobs everyone knows.`);
sub(PS, `Mop sends one mop through a house until every tile has been mopped exactly once.'`, `Mop sends one mop through a house until every tile has been mopped exactly once, and Mow does the same with a mower in the yard outside.'`);
sub(PS, `Mop is one unbroken route through a house drawn from above: every tile once, never back over a wet one, past the furniture and through the doorways, finishing at the door.'`,
  `Mop is one unbroken route through a house drawn from above: every tile once, never back over a wet one, past the furniture and through the doorways, finishing at the door. Mow is the same rule in the yard, round the trees, the pond and the shed and through the gates in the fences. Both rank on the clock, and stepping back on a done square is a replay.'`);
sub(PS, `and Mop from one floor to a house on three.`, `Mop from one floor to a house on three, and Mow from a six by six lawn to the nine by nine Estate.`);
sub(PS, `['Are they free?', 'All three, every day, no account required.'],\n    ],\n  },\n  {\n    name: 'Around town puzzles'`, `['Are they free?', 'All four, every day, no account required.'],\n    ],\n  },\n  {\n    name: 'Around town puzzles'`);

// 10. the logic-puzzles page: twenty-seven become twenty-eight
const PC = 'lib/puzzle-categories.js';
sub(PC, `description: 'Twenty-seven free daily logic puzzles:`, `description: 'Twenty-eight free daily logic puzzles:`);
sub(PC, `a mop-every-tile route puzzle, a kitchen timing puzzle,`, `a mop-every-tile route puzzle, a lawn mowing puzzle, a kitchen timing puzzle,`);
sub(PC, `lede: 'Twenty-seven logic puzzles with one new board apiece every day.`, `lede: 'Twenty-eight logic puzzles with one new board apiece every day.`);
sub(PC, `a one-route house to mop)`, `a one-route house to mop and a lawn to mow)`);
sub(PC, `'connect', 'mop', 'chef',`, `'connect', 'mop', 'mow', 'chef',`);
sub(PC, `mop: 'Route puzzle (visit every tile once)', `, `mop: 'Route puzzle (visit every tile once)', mow: 'Lawn mowing route puzzle', `);
sub(PC, `never stepping back on a wet one, and finish at the door. `, `never stepping back on a wet one, and finish at the door. Mow is the same rule in a yard: mow every square once round the trees, pond and shed, and out the gate. `);
sub(PC, `Mop is a house on three floors, Chef`, `Mop is a house on three floors, Mow is the nine by nine Estate, Chef`);
sub(PC, `['Are they free?', 'All twenty-seven, every day, no account required.'],`, `['Are they free?', 'All twenty-eight, every day, no account required.'],`);

// 11. the hand-built share card is kept by a full re-bake, and its cut is the Details tile
sub('lib/og-stage-cards.js', `'filing', 'mop', 'chef',`, `'filing', 'mop', 'mow', 'chef',`);
sub('lib/share-tile.js', `'pack', 'chef', 'bag', 'mop', `, `'pack', 'chef', 'bag', 'mop', 'mow', `);

console.log(`wire-mow: ${applied} edits applied, ${skipped} already present`);
