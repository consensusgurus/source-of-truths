// scripts/wire-crate.mjs: wires Crate (the daily warehouse puzzle, Sokoban
// rules, Visual, owner 2026-11-18: "Build and implement crate") into every
// registry in one pass, beside Machine and Pack. Placement follows "Placing a
// new daily" in docs/claude/daily-authoring.md.
//
// Skills: Spatial and Planning. A finished warehouse is 10 and a give-up 0, so
// it is in SOLVE_ONLY; its miss column is Moves, ranked AHEAD of the clock (the
// default first-attempt order: guesses_used is the move count), so it is NOT in
// CLOCK_FIRST or MOVES_FIRST (those are attempts-mode and clock-first rules).
// IT RUNS A SUNDAY EDITION (five crates), so it is on SUNDAY_EDITION_GAMES and in
// the Sunday slate map.
// GROUPS AND SETS: the Pack and untangle group and set page (three become four:
// crates are packing) and the Tight fits finish set (three become four).
// PREMIERE: an ordinary card behind Machine's front-of-queue one.
//
// Anchored: every anchor must match EXACTLY ONCE or the script throws, and an
// edit whose replacement is already present is skipped.
//   node scripts/wire-crate.mjs <dir>
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

const g = { key: 'crate', name: 'Crate', tag: 'Push every crate onto a spot', promo: 'push every crate onto a spot', tagLong: 'Push every crate onto a spot in as few moves as you can, never pulling',
  how: 'A warehouse, a worker and a few crates. Walk into a crate to push it one square; you can never pull one and never push two at once, so a crate in a corner is stuck for good. Put every crate on a spot. Every step counts, Undo included, and the result shows the shortest possible line beside yours. Ranked on moves, then the clock.',
  blurb: 'Push every crate onto a spot in a warehouse. No pulling, one crate at a time, and every step counts.',
  short: 'Push every crate onto a spot, never pulling.',
  color: '#a16207', navy: '#facc15', bg: '#fef9c3', border: 'rgba(161,98,7,0.35)' };

// 1. lib/daily-games.js: the row, the premiere, solve-only
afterLine('lib/daily-games.js', "{ key: 'machine', miss: 'Runs', name: 'Machine'", [
  `  { key: '${g.key}', miss: 'Moves', name: '${g.name}', cat: 'Visual', tag: '${g.tag}', tagLong: '${g.tagLong}', how: '${g.how}', color: '${g.color}', colorNavy: '${g.navy}' },`]);
afterLine('lib/daily-games.js', "{ key: 'machine', from: '2026-11-17', until: '2026-11-24', front: true },", [
  `  { key: 'crate', from: '2026-11-18', until: '2026-11-25' },`]);
sub('lib/daily-games.js', `'dash', 'pack', 'machine', 'fill',`, `'dash', 'pack', 'machine', 'crate', 'fill',`);

// 2. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['machine', `, `const LAUNCH_PIN = { keys: ['crate', 'machine', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['machine', `, `const LAUNCH_PIN = { keys: ['crate', 'machine', `);
afterLine('app/DailyEndCard.jsx', "  machine: { accent: '#b45309', badgeBg: '#b45309', badgeInk: T.white, Fin: Trophy },", [
  `  ${g.key}: { accent: '${g.color}', badgeBg: '${g.color}', badgeInk: T.white, Fin: Trophy },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'machine', cat: 'visual', name: 'Machine',", [
  `  { key: '${g.key}', cat: 'visual', name: '${g.name}', tag: '${g.tag}', blurb: '${g.blurb}', href: '/${g.key}' },`]);

// 3. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'machine', href: '/machine'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.promo}', store: 'sot_${g.key}_day', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'machine', href: '/machine'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.tag}', img: '/games/btn-${g.key}.png' },`]);
sub('app/DailyGamesGrid.jsx', `'tangled', 'pack', 'machine', 'paths', 'chomp'] },`, `'tangled', 'pack', 'machine', 'crate', 'paths', 'chomp'] },`);
afterLine('app/DailyStrip.jsx', "{ key: 'machine', href: '/machine'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', img: '/games/btn-${g.key}.png', store: 'sot_${g.key}_day', tag: "${g.tag}" , cat: 'Visual' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { machine: `, `const ACCENTS = { crate: '${g.navy}', machine: `);
sub('app/DailyStrip.jsx', `const TCOL = { machine: `, `const TCOL = { crate: '${g.color}', machine: `);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as MACHINE_FULL } from '../machine/puzzles';`,
  `import { PUZZLES as MACHINE_FULL } from '../machine/puzzles';\nimport { PUZZLES as CRATE_FULL } from '../crate/puzzles';`);
afterLine('app/archive/page.js', 'const MACHINE = MACHINE_FULL.map(', [
  `const CRATE = CRATE_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`]);
afterLine('app/archive/page.js', "{ key: 'machine', name: 'Machine', path: '/machine'", [
  `  { key: '${g.key}', name: '${g.name}', path: '/${g.key}', tag: '${g.tag}', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}', src: CRATE },`]);

// 5. the daily puzzle maps and the Sunday slate
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_machine } from '@/app/machine/puzzles';`,
    `import { PUZZLES as P_machine } from '@/app/machine/puzzles';\nimport { PUZZLES as P_crate } from '@/app/crate/puzzles';`);
  sub(f, `machine: P_machine, `, `machine: P_machine, crate: P_crate, `);
}
sub('lib/sunday-editions.js', `'plow', 'machine', 'chef',`, `'plow', 'machine', 'crate', 'chef',`);
afterLine('lib/sunday-editions.js', '//   machine a bigger board with more parts in the tray', [
  '//   crate   five crates, against three on Monday and Tuesday and four the rest of the week']);

// 6. alternations, rails, catalog, loft, starting difficulty
sub('app/api/quiz/daily-status/route.js', `|plow|machine|chef|`, `|plow|machine|crate|chef|`);
sub('app/quizzes/QuizHomeClient.jsx', `|plow|machine|chef|`, `|plow|machine|crate|chef|`);
for (const f of ['app/DailySlateRail.jsx', 'lib/quiz-catalog.js', 'lib/loft.js']) sub(f, `'plow', 'machine', 'chef',`, `'plow', 'machine', 'crate', 'chef',`);
afterLine('lib/daily-difficulty.js', '  machine: 3, // a starting estimate', [`  ${g.key}: 3, // a starting estimate (2026-11-18) until a week of plays rates it`]);

// 7. skills, glyph, blurb, preview drawings
sub('lib/daily-skills.js', `machine: ['spa', 'plan'], `, `machine: ['spa', 'plan'], crate: ['spa', 'plan'], `);
afterLine('lib/game-glyphs.js', "  machine: 'M3 6h8l9 8", [`  crate: 'M4 9h8v8H4zM4 9l8 8M12 9l-8 8M16 13h4M18 11l2 2-2 2',  // a crate with its cross brace and an arrow pushing it`]);
afterLine('lib/game-blurbs.js', '  machine: "', [`  ${g.key}: "${g.short}",`]);
if (!/\nconst Crate = /.test(rd('app/GamePreviewTiles.jsx'))) sub('app/GamePreviewTiles.jsx', `const Machine = () => (\n`, `// a warehouse: two crates, one already on its spot, a spot waiting, and the worker
const Crate = () => (
  <g><rect x={108} y={30} width={28} height={28} rx={3} className="m" /><path d="M112 34l20 20M132 34l-20 20" className="s2" />
    <rect x={150} y={30} width={28} height={28} rx={3} className="w" /><circle cx={164} cy={78} r={8} className="s3" /><circle cx={122} cy={78} r={9} className="d" /></g>
);
const Machine = () => (\n`);
sub('app/GamePreviewTiles.jsx', `plow: Plow, machine: Machine, `, `plow: Plow, machine: Machine, crate: Crate, `);
if (!/\nconst Crate = /.test(rd('app/GamePreview.jsx'))) sub('app/GamePreview.jsx', `const Machine = () => (\n`, `// Crate: two crates, one already on its spot, a spot waiting, and the worker
const Crate = () => (
  <g><rect x={96} y={26} width={32} height={32} rx={3} className="m" /><path d="M100 30l24 24M124 30l-24 24" className="s2" />
    <rect x={146} y={26} width={32} height={32} rx={3} className="w" /><circle cx={162} cy={80} r={9} className="s3" /><circle cx={112} cy={80} r={10} className="d" /></g>
);
const Machine = () => (\n`);
sub('app/GamePreview.jsx', `plow: Plow, machine: Machine, `, `plow: Plow, machine: Machine, crate: Crate, `);

// 8. groups and finish sets
sub('lib/daily-groups.js', `{ name: 'Pack and untangle', cat: 'Visual', keys: ['pack', 'tangled', 'paths'] },`, `{ name: 'Pack and untangle', cat: 'Visual', keys: ['pack', 'crate', 'tangled', 'paths'] },`);
sub('lib/finish-sets.js', `{ name: 'Tight fits', cat: 'Visual', keys: ['pack', 'junkyard', 'tangled'] },`, `{ name: 'Tight fits', cat: 'Visual', keys: ['pack', 'crate', 'junkyard', 'tangled'] },`);

// 9. the Pack and untangle set page: three become four
const PS = 'lib/puzzle-sets.js';
sub(PS, `title: 'Free Daily Spatial Puzzles: 3D Packing, Rope Untangling and the Cheapest Network | Mind Loft',`, `title: 'Free Daily Spatial Puzzles: 3D Packing, Box Pushing, Rope Untangling, Networks | Mind Loft',`);
sub(PS, `h1: 'Free Daily Spatial Puzzles: 3D Packing, Rope Untangling and the Cheapest Network',`, `h1: 'Free Daily Spatial Puzzles: 3D Packing, Box Pushing, Rope Untangling and the Cheapest Network',`);
sub(PS, `description: 'Three free daily puzzles about fitting things together in space: load a pile of luggage or furniture into a vehicle in three dimensions, untangle ropes`,
  `description: 'Four free daily puzzles about fitting things together in space: load a pile of luggage or furniture into a vehicle in three dimensions, push crates onto their spots, untangle ropes`);
sub(PS, `lede: 'Three puzzles about how things fit. Pack hands you a pile on the curb and one vehicle, and every bag, box and sofa has to go in under the roof line.`,
  `lede: 'Four puzzles about how things fit. Pack hands you a pile on the curb and one vehicle, and every bag, box and sofa has to go in under the roof line. Crate is the classic warehouse: push every crate onto a spot, never pulling.`);
sub(PS, `ranked on re-packs, the items you had to take back out. Tangled is against the clock alone: any layout with no crossing ropes is a solve.`, `ranked on re-packs, the items you had to take back out. Crate is box pushing by the classic rules: walk into a crate to push it, never pull one, and never push two at once, ranked on moves with the shortest possible line shown beside yours. Tangled is against the clock alone: any layout with no crossing ropes is a solve.`);
sub(PS, `['Is there a best answer?', 'Paths measures you against a proven minimum. Pack always`, `['Is there a best answer?', 'Paths and Crate measure you against a proven minimum. Pack always`);
sub(PS, `['Are they free?', 'All three, every day, no account required.'],\n    ],\n  },\n  {\n    name: 'Rule finding'`, `['Are they free?', 'All four, every day, no account required.'],\n    ],\n  },\n  {\n    name: 'Rule finding'`);

// 10. the visual-puzzles page: eighteen become nineteen
const PC = 'lib/puzzle-categories.js';
sub(PC, `description: 'Eighteen free daily visual and spatial puzzles:`, `description: 'Nineteen free daily visual and spatial puzzles:`);
sub(PC, `a 3D packing puzzle, a contraption puzzle, a route you eat in order`, `a 3D packing puzzle, a box pushing puzzle, a contraption puzzle, a route you eat in order`);
sub(PC, `lede: 'Eighteen puzzles you solve with your eyes and a sense of space,`, `lede: 'Nineteen puzzles you solve with your eyes and a sense of space,`);
sub(PC, `nine ask you to move something through a tight spot, and one asks you to finish a machine:`, `ten ask you to move something through a tight spot, and one asks you to finish a machine:`);
sub(PC, `a pile of luggage into a car trunk, a route`, `a pile of luggage into a car trunk, crates onto their spots, a route`);
sub(PC, `'tangled', 'pack', 'machine', 'chomp', 'paths'],`, `'tangled', 'pack', 'crate', 'machine', 'chomp', 'paths'],`);
sub(PC, `pack: '3D packing puzzle', machine:`, `pack: '3D packing puzzle', crate: 'Box pushing puzzle (Sokoban)', machine:`);
sub(PC, `one drop at a time. Machine is a chain-reaction`, `one drop at a time. Crate pushes crates onto their spots in a warehouse, never pulling, measured against the shortest possible line. Machine is a chain-reaction`);
sub(PC, `found by search before the board ships.'],\n      ['Are they free?', 'All eighteen, every day, no account required.'],`, `found by search before the board ships.'],\n      ['Are they free?', 'All nineteen, every day, no account required.'],`);
sub(PC, `Pack loads a moving van and Machine hands you a bigger machine and more parts.'],`, `Pack loads a moving van, Crate has five crates and Machine hands you a bigger machine and more parts.'],`);
sub(PC, `The sliding block puzzles, Topple, Roll and Paths measure you against a proven minimum`, `The sliding block puzzles, Topple, Roll, Crate and Paths measure you against a proven minimum`);

// 11. the hand-built share card is kept by a full re-bake
sub('lib/og-stage-cards.js', `'plow', 'machine', 'chef',`, `'plow', 'machine', 'crate', 'chef',`);

// 12. a challenge is fought on moves (the board's first decider), not the clock
afterLine('lib/challenge-metric.js', "  junkyard: { unit: 'moves', one: 'move', dir: 'low', solveFirst: true, field: 'guesses' },", [
  "  crate: { unit: 'moves', one: 'move', dir: 'low', solveFirst: true, field: 'guesses' },"]);

console.log(`wire-crate: ${applied} edits applied, ${skipped} already present`);
