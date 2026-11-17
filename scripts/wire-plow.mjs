// scripts/wire-plow.mjs: wires Plow (the daily plow-every-street snow puzzle,
// Logic, owner 2026-11-17) into every registry in one pass, beside Mow and Mop,
// its siblings. Placement follows "Placing a new daily" in
// docs/claude/daily-authoring.md.
//
// Skills: Spatial and Planning. A finished town is 10 and a give-up 0, so it is
// in SOLVE_ONLY; its miss column is Replays, ranked BEHIND the clock (CLOCK_FIRST
// in lib/daily-games.js). Mop, Mow and Plow are one FAMILY (chores): finishing one
// serves the others.
// IT RUNS A SUNDAY EDITION (a town of fifty-odd streets across a river with three
// bridges and three cul-de-sacs), so it is on SUNDAY_EDITION_GAMES and in the
// Sunday slate map.
// GROUPS AND SETS: the Around town puzzles group and set (Bag, Errands, Dash:
// three become four) and the Out and about finish set (three become four).
//
// Anchored: every anchor must match EXACTLY ONCE or the script throws, and an
// edit whose replacement is already present is skipped. Do not re-run it after
// a line it wrote has been changed by hand.
//   node scripts/wire-plow.mjs <dir>
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

const g = { key: 'plow', name: 'Plow', tag: 'Plow every street once, then park at the barn', promo: 'plow every street once, then park at the barn', tagLong: 'Plow every street of a snowed-in town exactly once and park at the salt barn',
  how: 'Plow every street of a town under snow exactly once, corner to corner, and finish at the salt barn. Streets run straight, curve, cut across blocks on diagonals, cross the river on bridges and run out to cul-de-sacs. Drive down a street you have already plowed and you replay from the depot with the clock still running. The town grows every day from Monday, up to a Sunday town of fifty-odd streets across a river. Ranked on the clock, then replays.',
  blurb: 'A town from above under fresh snow and one plow truck. Plow every street exactly once, round the blocks and over the bridges, and park at the salt barn.',
  short: 'Plow every street of the town once and park at the salt barn.',
  color: '#be123c', navy: '#fda4af', bg: '#ffe4e6', border: 'rgba(190,18,60,0.4)' };

// 1. lib/daily-games.js: the row, the premiere, solve-only, clock first, the family
afterLine('lib/daily-games.js', "{ key: 'mow', miss: ", [
  `  { key: '${g.key}', miss: 'Replays', name: '${g.name}', cat: 'Logic', tag: '${g.tag}', tagLong: '${g.tagLong}', how: '${g.how}', color: '${g.color}', colorNavy: '${g.navy}' },`]);
sub('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n  { key: 'plow', from: '2026-11-17', until: '2026-11-23' },\n`);
sub('lib/daily-games.js', `'connect', 'mop', 'mow', 'chef', 'seated', 'bag', 'errands', 'dash', 'pack', 'fill',`, `'connect', 'mop', 'mow', 'plow', 'chef', 'seated', 'bag', 'errands', 'dash', 'pack', 'fill',`);
sub('lib/daily-games.js', `  chores: ['mop', 'mow'],`, `  chores: ['mop', 'mow', 'plow'],`);
sub('lib/daily-games.js', `export const CLOCK_FIRST = new Set(['mop', 'mow']);`, `export const CLOCK_FIRST = new Set(['mop', 'mow', 'plow']);`);

// 2. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['mow', `, `const LAUNCH_PIN = { keys: ['plow', 'mow', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['mow', `, `const LAUNCH_PIN = { keys: ['plow', 'mow', `);
afterLine('app/DailyEndCard.jsx', "  mow: { accent: '#be123c', badgeBg: '#be123c', badgeInk: T.white, Fin: Trophy },", [
  `  ${g.key}: { accent: '${g.color}', badgeBg: '${g.color}', badgeInk: T.white, Fin: Trophy },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'mow', cat: 'logic', name: 'Mow',", [
  `  { key: '${g.key}', cat: 'logic', name: '${g.name}', tag: '${g.tag}', blurb: '${g.blurb}', href: '/${g.key}' },`]);

// 3. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'mow', href: '/mow'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.promo}', store: 'sot_${g.key}_day', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'mow', href: '/mow'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.tag}', img: '/games/btn-${g.key}.png' },`]);
sub('app/DailyGamesGrid.jsx', `'connect', 'mop', 'mow', 'chef',`, `'connect', 'mop', 'mow', 'plow', 'chef',`);
afterLine('app/DailyStrip.jsx', "{ key: 'mow', href: '/mow'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', img: '/games/btn-${g.key}.png', store: 'sot_${g.key}_day', tag: "${g.tag}" , cat: 'Logic' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { mow: `, `const ACCENTS = { plow: '${g.navy}', mow: `);
sub('app/DailyStrip.jsx', `const TCOL = { mow: `, `const TCOL = { plow: '${g.color}', mow: `);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as MOW_FULL } from '../mow/puzzles';`,
  `import { PUZZLES as MOW_FULL } from '../mow/puzzles';\nimport { PUZZLES as PLOW_FULL } from '../plow/puzzles';`);
afterLine('app/archive/page.js', 'const MOW = MOW_FULL.map(', [
  `const PLOW = PLOW_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`]);
afterLine('app/archive/page.js', "{ key: 'mow', name: 'Mow', path: '/mow'", [
  `  { key: '${g.key}', name: '${g.name}', path: '/${g.key}', tag: '${g.tag}', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}', src: PLOW },`]);

// 5. the daily puzzle maps and the Sunday slate
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_mow } from '@/app/mow/puzzles';`,
    `import { PUZZLES as P_mow } from '@/app/mow/puzzles';\nimport { PUZZLES as P_plow } from '@/app/plow/puzzles';`);
  sub(f, `mow: P_mow, `, `mow: P_mow, plow: P_plow, `);
}
sub('lib/sunday-editions.js', `'connect', 'mop', 'mow', 'chef',`, `'connect', 'mop', 'mow', 'plow', 'chef',`);
afterLine('lib/sunday-editions.js', '//   mow     the Estate:', [
  '//   plow    a town of fifty-odd streets across a river with three bridges and three cul-de-sacs, against about seventeen streets on Monday growing every day']);

// 6. alternations, rails, catalog, loft, families, starting difficulty
sub('app/api/quiz/daily-status/route.js', `|mop|mow|chef|`, `|mop|mow|plow|chef|`);
sub('app/quizzes/QuizHomeClient.jsx', `|mop|mow|chef|`, `|mop|mow|plow|chef|`);
for (const f of ['app/DailySlateRail.jsx', 'lib/quiz-catalog.js', 'lib/loft.js']) sub(f, `'connect', 'mop', 'mow', 'chef',`, `'connect', 'mop', 'mow', 'plow', 'chef',`);
sub('lib/daily-families.js', `'connect', 'paths', 'mop', 'mow'],`, `'connect', 'paths', 'mop', 'mow', 'plow'],`);
afterLine('lib/daily-difficulty.js', '  mow: 3, // a starting estimate', [`  ${g.key}: 3, // a starting estimate (2026-11-17) until a week of plays rates it`]);

// 7. skills, glyph, blurb, preview drawings
sub('lib/daily-skills.js', `mow: ['spa', 'plan'], `, `mow: ['spa', 'plan'], plow: ['spa', 'plan'], `);
afterLine('lib/game-glyphs.js', "  mow: 'M3 9l6 4", [`  plow: 'M2 8l5 1v6l-5 1M7 9h3v6H7zM10 8h9v8h-9zM12 18a1.5 1.5 0 1 0 .01 0M17 18a1.5 1.5 0 1 0 .01 0',  // a plow truck side on: the blade, the cab, the body, the wheels`]);
afterLine('lib/game-blurbs.js', '  mow: "', [`  ${g.key}: "${g.short}",`]);
if (!/\nconst Plow = /.test(rd('app/GamePreviewTiles.jsx'))) sub('app/GamePreviewTiles.jsx', `const Connect = () => (\n`, `// a snowy crossroads from above: one street plowed dark, the other still white, a block of houses, and the truck
const Plow = () => (
  <g><rect x={110} y={8} width={76} height={68} rx={4} className="w" /><path d="M110 42H186" className="s5" /><path d="M134 8V76" className="d6" />
    <rect x={150} y={14} width={26} height={18} rx={2} className="m" /><rect x={150} y={52} width={26} height={18} rx={2} className="m" />
    <rect x={128} y={20} width={12} height={16} rx={3} className="d" /><path d="M124 17H144" className="s3" /></g>
);
const Connect = () => (\n`);
sub('app/GamePreviewTiles.jsx', `  connect: Connect, mop: Mop, mow: Mow, `, `  connect: Connect, mop: Mop, mow: Mow, plow: Plow, `);
if (!/\nconst Plow = /.test(rd('app/GamePreview.jsx'))) sub('app/GamePreview.jsx', `const Park = () => (\n`, `// Plow: a town from above under snow, one street plowed dark through the crossroads, houses in the blocks, and the truck
const Plow = () => (
  <g><rect x={92} y={8} width={112} height={68} rx={4} className="w" /><path d="M92 42H204" className="s5" /><path d="M150 8V76" className="s5" />
    <path d="M92 42H150V76" className="d6" />
    <rect x={102} y={16} width={30} height={16} rx={2} className="m" /><rect x={166} y={16} width={30} height={16} rx={2} className="m" /><rect x={166} y={52} width={30} height={16} rx={2} className="m" />
    <rect x={144} y={50} width={12} height={16} rx={3} className="d" /><path d="M140 47H160" className="s3" /></g>
);
const Park = () => (\n`);
sub('app/GamePreview.jsx', `  connect: Dots, mop: Mop, mow: Mow, `, `  connect: Dots, mop: Mop, mow: Mow, plow: Plow, `);

// 8. groups and finish sets
sub('lib/daily-groups.js', `{ name: 'Around town puzzles', cat: 'Logic', keys: ['bag', 'errands', 'dash'] },`, `{ name: 'Around town puzzles', cat: 'Logic', keys: ['bag', 'errands', 'dash', 'plow'] },`);
sub('lib/daily-groups.js', `  // Logic (28)`, `  // Logic (29)`);
sub('lib/finish-sets.js', `{ name: 'Out and about', cat: 'Logic', keys: ['errands', 'chef', 'bag'] },`, `{ name: 'Out and about', cat: 'Logic', keys: ['errands', 'chef', 'bag', 'plow'] },`);

// 9. the Around town set page: three become four
const PS = 'lib/puzzle-sets.js';
sub(PS, `title: 'Free Daily Around Town Puzzles: Grocery Bagging, Route Planning and Delivery | Mind Loft',`, `title: 'Free Daily Around Town Puzzles: Bagging, Errands, Delivery, Snow Plow | Mind Loft',`);
sub(PS, `h1: 'Free Daily Around Town Puzzles: Grocery Bagging, Route Planning and a Delivery Shift',`, `h1: 'Free Daily Around Town Puzzles: Grocery Bagging, Route Planning, a Delivery Shift and the Snow Plow',`);
sub(PS, `description: 'Three free daily logic puzzles about getting things done around town: bag a belt of groceries without crushing the eggs, plan a round of errands to be home soonest, and drive a delivery shift for the most in tips.`,
  `description: 'Four free daily logic puzzles about getting things done around town: bag a belt of groceries without crushing the eggs, plan a round of errands to be home soonest, drive a delivery shift for the most in tips, and plow every snowy street once.`);
sub(PS, `lede: 'Three puzzles set out of the house.`, `lede: 'Four puzzles set out of the house.`);
sub(PS, `and every tip shrinks once its order runs late.'`, `and every tip shrinks once its order runs late. Plow hands you a town under fresh snow and a plow truck, and every street has to be plowed exactly once.'`);
sub(PS, `You are ranked on dollars short of the best possible shift.'`, `You are ranked on dollars short of the best possible shift. Plow is a route puzzle on a street map: drive corner to corner until every street is plowed exactly once, over the bridges and round the cul-de-sacs, and finish at the salt barn. Driving down a plowed street is a replay, and the clock decides it.'`);
sub(PS, `Dash has a best possible total for the night, and you are scored on how close you come.'],`, `Dash has a best possible total for the night, and you are scored on how close you come. Plow always has a clean route, and usually many.'],`);
sub(PS, `and Dash from five orders in an hour to ten restaurants and a two-hour shift on Sunday.'],`, `Dash from five orders in an hour to ten restaurants and a two-hour shift on Sunday, and Plow from a town of about seventeen streets to fifty-odd across a river.'],`);
sub(PS, `['Are they free?', 'All three, every day, no account required.'],\n    ],\n  },\n  {\n    name: 'Roll and route'`, `['Are they free?', 'All four, every day, no account required.'],\n    ],\n  },\n  {\n    name: 'Roll and route'`);

// 10. the logic-puzzles page: twenty-eight become twenty-nine
const PC = 'lib/puzzle-categories.js';
sub(PC, `description: 'Twenty-eight free daily logic puzzles:`, `description: 'Twenty-nine free daily logic puzzles:`);
sub(PC, `a mop-every-tile route puzzle, a lawn mowing puzzle, a kitchen timing puzzle,`, `a mop-every-tile route puzzle, a lawn mowing puzzle, a snow plow puzzle, a kitchen timing puzzle,`);
sub(PC, `lede: 'Twenty-eight logic puzzles with one new board apiece every day.`, `lede: 'Twenty-nine logic puzzles with one new board apiece every day.`);
sub(PC, `a one-route house to mop and a lawn to mow)`, `a one-route house to mop, a lawn to mow and a town of streets to plow)`);
sub(PC, `'connect', 'mop', 'mow', 'chef',`, `'connect', 'mop', 'mow', 'plow', 'chef',`);
sub(PC, `mow: 'Lawn mowing route puzzle', `, `mow: 'Lawn mowing route puzzle', plow: 'Snow plow route puzzle (every street once)', `);
sub(PC, `Mow is the same rule in a yard: mow every square once round the trees, pond and shed, and out the gate. `, `Mow is the same rule in a yard: mow every square once round the trees, pond and shed, and out the gate. Plow takes it to the streets: plow every street of a snowed-in town exactly once, corner to corner, and park at the salt barn. `);
sub(PC, `Mow is the nine by nine Estate, Chef`, `Mow is the nine by nine Estate, Plow is a town of fifty-odd streets across a river, Chef`);
sub(PC, `['Are they free?', 'All twenty-eight, every day, no account required.'],`, `['Are they free?', 'All twenty-nine, every day, no account required.'],`);

// 11. the hand-built share card is kept by a full re-bake, and its cut is the Details tile
sub('lib/og-stage-cards.js', `'filing', 'mop', 'mow', 'chef',`, `'filing', 'mop', 'mow', 'plow', 'chef',`);
sub('lib/share-tile.js', `'pack', 'chef', 'bag', 'mop', 'mow', `, `'pack', 'chef', 'bag', 'mop', 'mow', 'plow', `);

console.log(`wire-plow: ${applied} edits applied, ${skipped} already present`);
