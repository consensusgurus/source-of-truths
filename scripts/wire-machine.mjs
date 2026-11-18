// scripts/wire-machine.mjs: wires Machine (the daily contraption puzzle, Visual,
// owner 2026-11-17) into every registry in one pass, beside Pack, Topple and
// Roll. Placement follows "Placing a new daily" in docs/claude/daily-authoring.md.
//
// Skills: Spatial and Planning. A working machine is 10 and a give-up 0, so it
// is in SOLVE_ONLY; its miss column is Runs, ranked AHEAD of the clock (the
// default first-attempt order), so it is NOT in CLOCK_FIRST.
// IT RUNS A SUNDAY EDITION (a bigger board and more parts), so it is on
// SUNDAY_EDITION_GAMES and in the Sunday slate map.
// GROUPS AND SETS: the Roll and route group and set (Topple, Roll, Chomp: three
// become four) and the Rolling puzzles finish set (three become four).
// PREMIERE: first in the queue (owner, 2026-11-17: "make this the first pop-up
// people see upon return (put it to the front of the queue"): `front: true`.
//
// Anchored: every anchor must match EXACTLY ONCE or the script throws, and an
// edit whose replacement is already present is skipped.
//   node scripts/wire-machine.mjs <dir>
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

const g = { key: 'machine', name: 'Machine', tag: 'Finish the machine, then press Run', promo: 'finish the machine, then press Run', tagLong: 'Drag the last parts into place so the chain reaction does the job',
  how: 'A chain-reaction machine is mostly built. Drag ramps, springs, belts and more from the tray onto the board, press Run and watch real physics play out: balls carry weight and momentum, buttons open trapdoors and start fans, and the day is won when the ball lands in the hoop or rings the bell. Every run counts. Ranked on runs, then the clock.',
  blurb: 'A contraption that is almost built. Drag the last parts into place, press Run and watch the balls roll, bounce and set each other off.',
  short: 'Drag the last parts into place and run the machine.',
  color: '#b45309', navy: '#fbbf24', bg: '#fef3c7', border: 'rgba(180,83,9,0.35)' };

// 1. lib/daily-games.js: the row, the premiere (front of the queue), solve-only
afterLine('lib/daily-games.js', "{ key: 'pack', miss: 'Re-packs', name: 'Pack'", [
  `  { key: '${g.key}', miss: 'Runs', name: '${g.name}', cat: 'Visual', tag: '${g.tag}', tagLong: '${g.tagLong}', how: '${g.how}', color: '${g.color}', colorNavy: '${g.navy}' },`]);
sub('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n  // FRONT OF THE QUEUE (owner, 2026-11-17): Machine's card goes first, ahead of\n  // older launches still waiting (lib/premiere-queue.js reads \`front\`).\n  { key: 'machine', from: '2026-11-17', until: '2026-11-24', front: true },\n`);
sub('lib/daily-games.js', `'connect', 'mop', 'mow', 'plow', 'chef', 'seated', 'bag', 'errands', 'dash', 'pack', 'fill',`, `'connect', 'mop', 'mow', 'plow', 'chef', 'seated', 'bag', 'errands', 'dash', 'pack', 'machine', 'fill',`);

// 2. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['plow', `, `const LAUNCH_PIN = { keys: ['machine', 'plow', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['plow', `, `const LAUNCH_PIN = { keys: ['machine', 'plow', `);
afterLine('app/DailyEndCard.jsx', "  pack: { accent: '#a21caf', badgeBg: '#a21caf', badgeInk: T.white, Fin: Trophy },", [
  `  ${g.key}: { accent: '${g.color}', badgeBg: '${g.color}', badgeInk: T.white, Fin: Trophy },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'pack', cat: 'visual', name: 'Pack',", [
  `  { key: '${g.key}', cat: 'visual', name: '${g.name}', tag: '${g.tag}', blurb: '${g.blurb}', href: '/${g.key}' },`]);

// 3. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'pack', href: '/pack'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.promo}', store: 'sot_${g.key}_day', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'pack', href: '/pack'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.tag}', img: '/games/btn-${g.key}.png' },`]);
sub('app/DailyGamesGrid.jsx', `'topple', 'roll', 'tangled', 'pack', 'paths', 'chomp'] },`, `'topple', 'roll', 'tangled', 'pack', 'machine', 'paths', 'chomp'] },`);
afterLine('app/DailyStrip.jsx', "{ key: 'pack', href: '/pack'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', img: '/games/btn-${g.key}.png', store: 'sot_${g.key}_day', tag: "${g.tag}" , cat: 'Visual' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { plow: `, `const ACCENTS = { machine: '${g.navy}', plow: `);
sub('app/DailyStrip.jsx', `const TCOL = { plow: `, `const TCOL = { machine: '${g.color}', plow: `);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as PACK_FULL } from '../pack/puzzles';`,
  `import { PUZZLES as PACK_FULL } from '../pack/puzzles';\nimport { PUZZLES as MACHINE_FULL } from '../machine/puzzles';`);
afterLine('app/archive/page.js', 'const PACK = PACK_FULL.map(', [
  `const MACHINE = MACHINE_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`]);
afterLine('app/archive/page.js', "{ key: 'pack', name: 'Pack', path: '/pack'", [
  `  { key: '${g.key}', name: '${g.name}', path: '/${g.key}', tag: '${g.tag}', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}', src: MACHINE },`]);

// 5. the daily puzzle maps and the Sunday slate
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_plow } from '@/app/plow/puzzles';`,
    `import { PUZZLES as P_plow } from '@/app/plow/puzzles';\nimport { PUZZLES as P_machine } from '@/app/machine/puzzles';`);
  sub(f, `mow: P_mow, plow: P_plow, `, `mow: P_mow, plow: P_plow, machine: P_machine, `);
}
sub('lib/sunday-editions.js', `'connect', 'mop', 'mow', 'plow', 'chef',`, `'connect', 'mop', 'mow', 'plow', 'machine', 'chef',`);
afterLine('lib/sunday-editions.js', '//   plow    a town of fifty-odd streets', [
  '//   machine a bigger board with more parts in the tray, against a 14 x 10 board and four parts on weekdays']);

// 6. alternations, rails, catalog, loft, families, starting difficulty
sub('app/api/quiz/daily-status/route.js', `|mop|mow|plow|chef|`, `|mop|mow|plow|machine|chef|`);
sub('app/quizzes/QuizHomeClient.jsx', `|mop|mow|plow|chef|`, `|mop|mow|plow|machine|chef|`);
for (const f of ['app/DailySlateRail.jsx', 'lib/quiz-catalog.js', 'lib/loft.js']) sub(f, `'connect', 'mop', 'mow', 'plow', 'chef',`, `'connect', 'mop', 'mow', 'plow', 'machine', 'chef',`);
sub('lib/daily-families.js', `['topple', 'roll', 'chomp', 'tangled', 'pack'],`, `['topple', 'roll', 'chomp', 'tangled', 'pack', 'machine'],`);
afterLine('lib/daily-difficulty.js', '  pack: 3, // a starting estimate', [`  ${g.key}: 3, // a starting estimate (2026-11-17) until a week of plays rates it`]);

// 7. skills, glyph, blurb, preview drawings
sub('lib/daily-skills.js', `plow: ['spa', 'plan'], `, `plow: ['spa', 'plan'], machine: ['spa', 'plan'], `);
afterLine('lib/game-glyphs.js', "  pack: 'M12 3l8 4.5", [`  machine: 'M3 6h8l9 8M4 20h16M17 11a2.5 2.5 0 1 0 .01 0M6 9a2.5 2.5 0 1 0 .01 0M15 20v-3h4v3',  // a ball at the top of a ramp, another rolling down it, and the cup at the bottom`]);
afterLine('lib/game-blurbs.js', '  pack: "', [`  ${g.key}: "${g.short}",`]);
if (!/\nconst Machine = /.test(rd('app/GamePreviewTiles.jsx'))) sub('app/GamePreviewTiles.jsx', `const Pack = () => (\n`, `// a shelf with a ball rolling off it, a ramp below, a spring, and the hoop at the bottom
const Machine = () => (
  <g><path d="M108 24H146" className="s5" /><circle cx={138} cy={14} r={8} className="d" /><path d="M150 38L186 62" className="s5" />
    <rect x={112} y={56} width={22} height={6} rx={2} className="m" /><path d="M116 62l6 6l6-6l6 6" className="s2" /><path d="M170 70h20" className="s3" /><circle cx={180} cy={44} r={7} className="w" /></g>
);
const Pack = () => (\n`);
sub('app/GamePreviewTiles.jsx', `mop: Mop, mow: Mow, plow: Plow, `, `mop: Mop, mow: Mow, plow: Plow, machine: Machine, `);
if (!/\nconst Machine = /.test(rd('app/GamePreview.jsx'))) sub('app/GamePreview.jsx', `const Pack = () => (\n`, `// Machine: a shelf with a ball rolling off it, a ramp turning the fall, a spring, and the hoop
const Machine = () => (
  <g><path d="M92 22H140" className="s5" /><circle cx={130} cy={12} r={9} className="d" /><path d="M146 34L196 62" className="s5" />
    <rect x={100} y={58} width={30} height={8} rx={2} className="m" /><path d="M104 66l7 7l7-7l7 7" className="s2" /><path d="M200 74h22" className="s3" /><circle cx={178} cy={42} r={8} className="w" /></g>
);
const Pack = () => (\n`);
sub('app/GamePreview.jsx', `mop: Mop, mow: Mow, plow: Plow, `, `mop: Mop, mow: Mow, plow: Plow, machine: Machine, `);

// 8. groups and finish sets
sub('lib/daily-groups.js', `{ name: 'Roll and route', cat: 'Visual', keys: ['topple', 'roll', 'chomp'] },`, `{ name: 'Roll and route', cat: 'Visual', keys: ['topple', 'roll', 'chomp', 'machine'] },`);
sub('lib/finish-sets.js', `{ name: 'Rolling puzzles', cat: 'Visual', keys: ['topple', 'roll', 'chomp'] },`, `{ name: 'Rolling puzzles', cat: 'Visual', keys: ['topple', 'roll', 'chomp', 'machine'] },`);

// 9. the Roll and route set page: three become four
const PS = 'lib/puzzle-sets.js';
sub(PS, `title: 'Free Daily Route Puzzles: Block Rolling, Die Rolling and Eat in Order | Mind Loft',`, `title: 'Free Daily Route Puzzles: Block Rolling, Die Rolling, Eat in Order, Contraptions | Mind Loft',`);
sub(PS, `h1: 'Free Daily Route Puzzles: Block Rolling, Die Rolling and Eat in Order',`, `h1: 'Free Daily Route Puzzles: Block Rolling, Die Rolling, Eat in Order and a Contraption',`);
sub(PS, `description: 'Three free daily puzzles about finding the way: roll a tall block onto the spring, roll a die to light numbered squares in order, and eat a cast of mascots in order.`,
  `description: 'Four free daily puzzles about finding the way: roll a tall block onto the spring, roll a die to light numbered squares in order, eat a cast of mascots in order, and finish a ball-rolling contraption.`);
sub(PS, `lede: 'Three puzzles where the answer is a route.`, `lede: 'Four puzzles where the answer is a route.`);
sub(PS, `Chomp eats a cast of mascots in order, and every square you touch stays yours.'`, `Chomp eats a cast of mascots in order, and every square you touch stays yours. Machine sends balls rolling through a contraption you finish yourself.'`);
sub(PS, `Chomp is a route puzzle with no clock and nothing chasing you: the only things in your way are where you have already been.'`, `Chomp is a route puzzle with no clock and nothing chasing you: the only things in your way are where you have already been. Machine is the physics puzzle of the four: drag ramps, springs and belts into a chain-reaction machine, press Run, and the balls carry real momentum to the hoop or the bell, ranked on how few runs it took.'`);
sub(PS, `['Are they free?', 'All three, every day, no account required.'],\n    ],\n  },\n  {\n    name: 'Pack and untangle'`, `['Are they free?', 'All four, every day, no account required.'],\n    ],\n  },\n  {\n    name: 'Pack and untangle'`);

// 10. the visual-puzzles page: seventeen become eighteen
const PC = 'lib/puzzle-categories.js';
sub(PC, `description: 'Seventeen free daily visual and spatial puzzles:`, `description: 'Eighteen free daily visual and spatial puzzles:`);
sub(PC, `a 3D packing puzzle, a route you eat in order and a cheapest-network puzzle.`, `a 3D packing puzzle, a contraption puzzle, a route you eat in order and a cheapest-network puzzle.`);
sub(PC, `lede: 'Seventeen puzzles you solve with your eyes and a sense of space,`, `lede: 'Eighteen puzzles you solve with your eyes and a sense of space,`);
sub(PC, `and nine ask you to move something through a tight spot:`, `nine ask you to move something through a tight spot, and one asks you to finish a machine:`);
sub(PC, `'topple', 'roll', 'tangled', 'pack', 'chomp', 'paths'],`, `'topple', 'roll', 'tangled', 'pack', 'machine', 'chomp', 'paths'],`);
sub(PC, `pack: '3D packing puzzle', chomp:`, `pack: '3D packing puzzle', machine: 'Contraption puzzle (chain reaction)', chomp:`);
sub(PC, `Pack loads a pile of luggage or furniture into a vehicle in three dimensions, one drop at a time.`, `Pack loads a pile of luggage or furniture into a vehicle in three dimensions, one drop at a time. Machine is a chain-reaction contraption in real physics: drag the last ramps, springs and belts into place and press Run.`);
sub(PC, `['Are they free?', 'All seventeen, every day, no account required.'],`, `['Are they free?', 'All eighteen, every day, no account required.'],`);
sub(PC, `Roll lights six squares and Pack loads a moving van.'],`, `Roll lights six squares, Pack loads a moving van and Machine hands you a bigger machine and more parts.'],`);

// 11. the hand-built share card is kept by a full re-bake, and its cut is the Details tile
sub('lib/og-stage-cards.js', `'filing', 'mop', 'mow', 'plow', 'chef',`, `'filing', 'mop', 'mow', 'plow', 'machine', 'chef',`);
sub('lib/share-tile.js', `'pack', 'chef', 'bag', 'mop', 'mow', 'plow', `, `'pack', 'machine', 'chef', 'bag', 'mop', 'mow', 'plow', `);

console.log(`wire-machine: ${applied} edits applied, ${skipped} already present`);
