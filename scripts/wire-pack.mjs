// scripts/wire-pack.mjs: wires Pack (the daily 3D packing puzzle, Visual, owner
// 2026-11-14) into every registry in one pass, beside Chef, the daily launched
// the same day. Placement follows "Placing a new daily" in
// docs/claude/daily-authoring.md.
//
// Skills: Spatial and Planning. Getting everything in is 10 and a give-up 0, so it
// is in SOLVE_ONLY; re-packs are the miss column (lower first), then the clock,
// the same shape as Chef's penalty minutes.
// IT RUNS A SUNDAY EDITION (a moving van and a whole house), so it is on
// SUNDAY_EDITION_GAMES and in the Sunday slate map.
//
// Sets: Roll and route was full at five, so Tangled and Paths leave it and join
// Pack in a new daily group and set page, Pack and untangle. Roll and route goes
// from five to three. A new finish set, Tight fits, with Junkyard and Tangled.
//
// Anchored: every anchor must match EXACTLY ONCE or the script throws, and an
// edit whose replacement is already present is skipped, so a re-run is safe.
//   node scripts/wire-pack.mjs <dir>
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

const g = { key: 'pack', name: 'Pack', tag: 'Fit it all in the trunk', promo: 'fit it all in the trunk', tagLong: 'Load every bag, box and sofa into the vehicle in three dimensions',
  how: 'A pile of luggage or furniture sits on the curb and all of it has to fit in the vehicle. Pick an item, tap where it goes, and it drops straight down and rests on whatever is under it. Turn it, tip it onto another side, and walk round the vehicle to look from every corner. Nothing may sit above the roof line. A sofa has a seat and a back, and a table has room underneath. Taking an item back out is a re-pack, and the fewest re-packs ranks first. The vehicle grows from a hatchback on Monday to a moving van on Sunday.',
  blurb: 'A pile on the curb and one vehicle to fit it in. Drop each item into place, turn it, tip it, and look from every side.',
  short: 'Fit every bag, box and sofa into the vehicle.',
  color: '#a21caf', navy: '#f0abfc', bg: '#fae8ff', border: 'rgba(162,28,175,0.35)' };

// 1. lib/daily-games.js: the row, the premiere, solve-only
afterLine('lib/daily-games.js', "{ key: 'chef', miss: 'Penalty minutes', name: 'Chef',", [
  `  { key: '${g.key}', miss: 'Re-packs', name: '${g.name}', cat: 'Visual', tag: '${g.tag}', tagLong: '${g.tagLong}', how: '${g.how}', color: '${g.color}', colorNavy: '${g.navy}' },`]);
sub('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n  { key: 'pack', from: '2026-11-14', until: '2026-11-18' },\n`);
sub('lib/daily-games.js', `'spin', 'connect', 'mop', 'chef', 'fill',`, `'spin', 'connect', 'mop', 'chef', 'pack', 'fill',`);
sub('lib/daily-row-stats.js', `  'Penalty minutes': 'penalty minute',\n`, `  'Penalty minutes': 'penalty minute',\n  'Re-packs': 're-pack',\n`);

// 2. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['chef', `, `const LAUNCH_PIN = { keys: ['pack', 'chef', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['chef', `, `const LAUNCH_PIN = { keys: ['pack', 'chef', `);
afterLine('app/DailyEndCard.jsx', "  chef: { accent: '#be123c', badgeBg: '#be123c', badgeInk: T.white, Fin: Trophy },", [
  `  ${g.key}: { accent: '${g.color}', badgeBg: '${g.color}', badgeInk: T.white, Fin: Trophy },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'chef', cat: 'logic', name: 'Chef',", [
  `  { key: '${g.key}', cat: 'visual', name: '${g.name}', tag: '${g.tag}', blurb: '${g.blurb}', href: '/${g.key}' },`]);

// 3. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'chef', href: '/chef'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.promo}', store: 'sot_${g.key}_day', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'chef', href: '/chef'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.tag}', img: '/games/btn-${g.key}.png' },`]);
sub('app/DailyGamesGrid.jsx', `'topple', 'roll', 'tangled', 'paths', 'chomp'] },`, `'topple', 'roll', 'tangled', 'pack', 'paths', 'chomp'] },`);
afterLine('app/DailyStrip.jsx', "{ key: 'chef', href: '/chef'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', img: '/games/btn-${g.key}.png', store: 'sot_${g.key}_day', tag: "${g.tag}" , cat: 'Visual' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { chef: `, `const ACCENTS = { pack: '${g.navy}', chef: `);
sub('app/DailyStrip.jsx', `const TCOL = { chef: `, `const TCOL = { pack: '${g.color}', chef: `);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as CHEF_FULL } from '../chef/puzzles';`,
  `import { PUZZLES as CHEF_FULL } from '../chef/puzzles';\nimport { PUZZLES as PACK_FULL } from '../pack/puzzles';`);
afterLine('app/archive/page.js', 'const CHEF = CHEF_FULL.map(', [
  `const PACK = PACK_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`]);
afterLine('app/archive/page.js', "{ key: 'tangled', name: 'Tangled', path: '/tangled'", [
  `  { key: '${g.key}', name: '${g.name}', path: '/${g.key}', tag: '${g.tag}', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}', src: PACK },`]);

// 5. the three daily puzzle maps and the Sunday slate
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_chef } from '@/app/chef/puzzles';`,
    `import { PUZZLES as P_chef } from '@/app/chef/puzzles';\nimport { PUZZLES as P_pack } from '@/app/pack/puzzles';`);
  sub(f, `chef: P_chef, `, `chef: P_chef, pack: P_pack, `);
}
sub('lib/sunday-editions.js', `'spin', 'connect', 'mop', 'chef', 'duet', 'lamps', 'clade',`, `'spin', 'connect', 'mop', 'chef', 'pack', 'duet', 'lamps', 'clade',`);
afterLine('lib/sunday-editions.js', '//   chef    a brunch rush of twelve tickets', [
  '//   pack    a moving van (4 x 7 x 4) and sixteen pieces of a whole house, four of them shaped, against a car or small van on the other days']);

// 6. alternations, rails, catalog, loft, families, starting difficulty
sub('app/api/quiz/daily-status/route.js', `|spin|connect|mop|chef|`, `|spin|connect|mop|chef|pack|`);
sub('app/quizzes/QuizHomeClient.jsx', `|spin|connect|mop|chef|`, `|spin|connect|mop|chef|pack|`);
for (const f of ['app/DailySlateRail.jsx', 'lib/quiz-catalog.js', 'lib/loft.js']) sub(f, `'spin', 'connect', 'mop', 'chef', 'duet',`, `'spin', 'connect', 'mop', 'chef', 'pack', 'duet',`);
sub('lib/daily-families.js', `['topple', 'roll', 'chomp', 'tangled'],`, `['topple', 'roll', 'chomp', 'tangled', 'pack'],`);
afterLine('lib/daily-difficulty.js', '  chef: 3, // a starting estimate (2026-11-14)', [`  ${g.key}: 3, // a starting estimate (2026-11-14) until a week of plays rates it`]);

// 7. skills, glyph, blurb, preview drawings
sub('lib/daily-skills.js', `chef: ['plan', 'math'], `, `chef: ['plan', 'math'], pack: ['spa', 'plan'], `);
afterLine('lib/game-glyphs.js', "  chef: 'M7 14C4 14", [`  pack: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9M8 5.2l8 4.6',  // a packed box seen from a corner, taped across the top`]);
afterLine('lib/game-blurbs.js', '  chef: "', [`  ${g.key}: "${g.short}",`]);
sub('app/GamePreviewTiles.jsx', `// a pan on a burner, its handle out to the right, and two plates waiting`, `// a trunk seen from the side: three boxes in, one still to drop
const Pack = () => (
  <g><path d="M92 70H228V18" className="d6" fill="none" /><rect x={100} y={44} width={34} height={26} rx={3} className="sm" /><rect x={138} y={32} width={30} height={38} rx={3} className="d6" fill="none" />
    <rect x={172} y={50} width={48} height={20} rx={3} className="sm" /><rect x={178} y={12} width={30} height={22} rx={3} className="d6" fill="none" /></g>
);
// a pan on a burner, its handle out to the right, and two plates waiting`);
sub('app/GamePreviewTiles.jsx', `  connect: Connect, mop: Mop, chef: Chef, duet: Duet,`, `  connect: Connect, mop: Mop, chef: Chef, pack: Pack, duet: Duet,`);
sub('app/GamePreview.jsx', `// Chef: three plates on the pass, the middle one still to come`, `// Pack: four boxes fitted into one space, one of them the odd one out
const Pack = () => (
  <g><rect x={96} y={18} width={52} height={22} rx={4} className="w" /><rect x={152} y={18} width={68} height={22} rx={4} className="m" /><rect x={96} y={44} width={76} height={22} rx={4} className="m" /><rect x={176} y={44} width={44} height={22} rx={4} className="w" />
    <path d="M90 72H226" className="s5" /></g>
);
// Chef: three plates on the pass, the middle one still to come`);
sub('app/GamePreview.jsx', `  connect: Dots, mop: Mop, chef: Chef, duet: Dots,`, `  connect: Dots, mop: Mop, chef: Chef, pack: Pack, duet: Dots,`);

// 8. groups and finish sets
sub('lib/daily-groups.js', `{ name: 'Roll and route', cat: 'Visual', keys: ['topple', 'roll', 'chomp', 'paths', 'tangled'] },`,
  `{ name: 'Roll and route', cat: 'Visual', keys: ['topple', 'roll', 'chomp'] },\n  { name: 'Pack and untangle', cat: 'Visual', keys: ['pack', 'tangled', 'paths'] },`);
sub('lib/daily-groups.js', `// Visual (16):`, `// Visual (17):`);
sub('lib/category-kinds.js', `'Roll and route': 'move', `, `'Roll and route': 'move', 'Pack and untangle': 'move', `);
afterLine('lib/finish-sets.js', `{ name: 'Spatial puzzles', cat: 'Visual', keys: ['roll', 'park', 'tangled', 'topple'] },`, [`  { name: 'Tight fits', cat: 'Visual', keys: ['pack', 'junkyard', 'tangled'] },`]);

// 9. the set pages: Roll and route goes from five to three, and Pack and untangle is new
const PS = 'lib/puzzle-sets.js';
sub(PS, `eyebrow: 'Free daily route, rolling and rope untangling puzzles',`, `eyebrow: 'Free daily route and rolling puzzles',`);
sub(PS, `title: 'Free Daily Route Puzzles: Block Rolling, Die Rolling, Ropes, Eat in Order, Cheapest Network | Mind Loft',`, `title: 'Free Daily Route Puzzles: Block Rolling, Die Rolling and Eat in Order | Mind Loft',`);
sub(PS, `h1: 'Free Daily Route Puzzles: Block Rolling, Die Rolling, Rope Untangling, Eat in Order and the Cheapest Network',`, `h1: 'Free Daily Route Puzzles: Block Rolling, Die Rolling and Eat in Order',`);
sub(PS, `description: 'Five free daily puzzles about finding the way: roll a tall block onto the spring, roll a die to light numbered squares in order, untangle ropes on a frame of pegs, eat a cast of mascots in order, and wire every town for the least cost.`,
  `description: 'Three free daily puzzles about finding the way: roll a tall block onto the spring, roll a die to light numbered squares in order, and eat a cast of mascots in order.`);
sub(PS, `lede: 'Five puzzles where the answer is a route.`, `lede: 'Three puzzles where the answer is a route.`);
sub(PS, ` Tangled moves the pegs of crossing ropes until no two cross. Chomp eats a cast of mascots in order, and every square you touch stays yours. Paths links every town into one network for the least cost.',`, ` Chomp eats a cast of mascots in order, and every square you touch stays yours.',`);
sub(PS, ` Tangled is against the clock alone: any layout with no crossing ropes is a solve. Chomp is a route puzzle`, ` Chomp is a route puzzle`);
sub(PS, `the only things in your way are where you have already been. Paths gives you a set of towns and the cost of every link, and you build the cheapest network that reaches all of them.',`, `the only things in your way are where you have already been.',`);
sub(PS, `      ['Is there a best answer?', 'Yes. Topple, Roll and Paths measure you against a proven minimum, found by search before the board ships.'],\n      ['Are they free?', 'All five, every day, no account required.'],\n    ],\n  },\n`,
  `      ['Is there a best answer?', 'Yes. Topple and Roll measure you against a proven minimum, found by search before the board ships.'],\n      ['Are they free?', 'All three, every day, no account required.'],\n    ],\n  },\n  {\n    name: 'Pack and untangle', slug: 'pack-and-untangle',\n    eyebrow: 'Free daily spatial puzzles',\n    title: 'Free Daily Spatial Puzzles: 3D Packing, Rope Untangling and the Cheapest Network | Mind Loft',\n    h1: 'Free Daily Spatial Puzzles: 3D Packing, Rope Untangling and the Cheapest Network',\n    description: 'Three free daily puzzles about fitting things together in space: load a pile of luggage or furniture into a vehicle in three dimensions, untangle ropes on a frame of pegs, and wire every town for the least cost. New boards at midnight Eastern, no signup.',\n    lede: 'Three puzzles about how things fit. Pack hands you a pile on the curb and one vehicle, and every bag, box and sofa has to go in under the roof line. Tangled moves the pegs of crossing ropes until no two cross. Paths links every town into one network for the least cost.',\n    how: [\n      'Pack is a packing puzzle in three dimensions: pick an item, tap where it goes, and it drops straight down and rests on whatever is under it. You can turn it, tip it onto another side and walk round the vehicle, and a table has room underneath for whatever you load first. It is ranked on re-packs, the items you had to take back out. Tangled is against the clock alone: any layout with no crossing ropes is a solve. Paths gives you a set of towns and the cost of every link, and you build the cheapest network that reaches all of them.',\n    ],\n    faq: [\n      ['Is there a best answer?', 'Paths measures you against a proven minimum. Pack always has at least one way to fit everything, and a clean load takes no re-packs. Tangled counts any untangled layout.'],\n      ['Does Pack get harder through the week?', 'Yes. The vehicle grows from a hatchback on Monday to a moving van on Sunday, and by Friday the fit is exact.'],\n      ['Are they free?', 'All three, every day, no account required.'],\n    ],\n  },\n`);

// 10. the visual-puzzles page: sixteen become seventeen
const PC = 'lib/puzzle-categories.js';
sub(PC, `description: 'Sixteen free daily visual and spatial puzzles: two jigsaws, three more photo puzzles, spot the difference, a scene memory game, a zoomed-photo puzzle, three sizes of sliding block puzzle, a block rolling puzzle, a die rolling puzzle, a rope untangling puzzle,`,
  `description: 'Seventeen free daily visual and spatial puzzles: two jigsaws, three more photo puzzles, spot the difference, a scene memory game, a zoomed-photo puzzle, three sizes of sliding block puzzle, a block rolling puzzle, a die rolling puzzle, a rope untangling puzzle, a 3D packing puzzle,`);
sub(PC, `lede: 'Sixteen puzzles you solve with your eyes and a sense of space, one new board apiece every day. Five put a photograph back together, three test how closely you look, and eight ask you to move something through a tight spot: a red car out of a jammed lot, a block onto a spring, a die across a floor, ropes off each other,`,
  `lede: 'Seventeen puzzles you solve with your eyes and a sense of space, one new board apiece every day. Five put a photograph back together, three test how closely you look, and nine ask you to move something through a tight spot: a red car out of a jammed lot, a block onto a spring, a die across a floor, ropes off each other, a pile of luggage into a car trunk,`);
sub(PC, `'topple', 'roll', 'tangled', 'chomp', 'paths'],`, `'topple', 'roll', 'tangled', 'pack', 'chomp', 'paths'],`);
sub(PC, `tangled: 'Rope untangling puzzle', chomp:`, `tangled: 'Rope untangling puzzle', pack: '3D packing puzzle', chomp:`);
sub(PC, `Tangled moves the pegs of crossing ropes until no two cross. Chomp eats a cast of mascots in order, and Paths links every town into one network for the least cost.',\n    ],\n    startTitle`, `Tangled moves the pegs of crossing ropes until no two cross. Pack loads a pile of luggage or furniture into a vehicle in three dimensions, one drop at a time. Chomp eats a cast of mascots in order, and Paths links every town into one network for the least cost.',\n    ],\n    startTitle`);
sub(PC, `Topple rolls a bigger board and Roll lights six squares.'],`, `Topple rolls a bigger board, Roll lights six squares and Pack loads a moving van.'],`);
sub(PC, `['Are they free?', 'All sixteen, every day, no account required.'],`, `['Are they free?', 'All seventeen, every day, no account required.'],`);

// 11. the hand-built share card is kept by a full re-bake
sub('lib/og-stage-cards.js', `'filing', 'mop', 'chef']);`, `'filing', 'mop', 'chef', 'pack']);`);

// 12. SPACE CADET (owner, 2026-11-14: "Pack should be served to everyone who plays
// space cadet"). Pack joins as the fifth and last leg FROM 2026-11-15: today's run
// has already been flown as four, so 11-14 and earlier keep the four they ran with
// (the same dated roster Anon used to join Crossed). The run is out of 500 from
// then, and the time cutoffs move out to make room for the fifth puzzle.
const SC = 'lib/space-cadet.js';
sub(SC, `export const SPACE_KEYS = ['roll', 'park', 'tangled', 'topple'];`,
  `// PACK IS THE FIFTH LEG from SPACE_PACK_FROM (owner, 2026-11-14). Days before it ran four.\nexport const SPACE_KEYS_BEFORE = ['roll', 'park', 'tangled', 'topple'];\nexport const SPACE_PACK_FROM = '2026-11-15';\nexport const SPACE_KEYS = [...SPACE_KEYS_BEFORE, 'pack'];\nexport const spaceLegsFor = (iso) => (iso && iso < SPACE_PACK_FROM ? SPACE_KEYS_BEFORE.length : SPACE_KEYS.length);`);
sub(SC, `export const SPACE_MAX = SPACE_KEYS.length * SPACE_LEG_MAX;`, `export const SPACE_MAX = SPACE_KEYS.length * SPACE_LEG_MAX;\nexport const spaceMaxFor = (iso) => spaceLegsFor(iso) * SPACE_LEG_MAX;`);
sub(SC, `  topple: { name: 'Topple', form: 'The Block', chip: 'Land the block on the spring', band: '#d8b4fe' },\n`,
  `  topple: { name: 'Topple', form: 'The Block', chip: 'Land the block on the spring', band: '#d8b4fe' },\n  pack: { name: 'Pack', form: 'The Trunk', chip: 'Fit it all in', band: '#fdba74' },\n`);
{
  const s = rd(SC), a = s.indexOf('// [cutoff in points, name, short'), b = s.indexOf('export function spaceTierOf');
  if (a < 0 || b < 0) throw new Error('space-cadet.js: the ranks block moved');
  const block = `// [cutoff in points, name, short, chip colour, stripe, line, under (seconds)].
// The point cutoffs are the time cutoffs read through (legs x 100) - T/3. Four legs
// keep the cutoffs they launched with; five legs (with Pack) get 4:30 / 6:00 / 7:45 /
// 9:45 / 12:30. BOTH SETS ARE PLACEHOLDERS until real times exist.
const TIMES = { 4: [195, 255, 330, 420, 540], 5: [270, 360, 465, 585, 750] };
const NAMES = [
  ['Architect-Engineer', 'ARCHITECT', '#1e3a8a', '#bfdbfe', 'Sees the building before it is built.'],
  ['Air Traffic Controller', 'ATC', '#0e7490', '#a5f3fc', 'Keeps a hundred planes apart.'],
  ['Surveyor', 'SURVEYOR', '#15803d', '#bbf7d0', 'Maps the land by eye.'],
  ['Moving Day Pro', 'MOVER', '#b45309', '#fde68a', 'Gets the couch up the stairs.'],
  ['Flat-Pack Assembler', 'FLAT-PACK', '#be185d', '#fbcfe8', 'Only two screws left over.'],
];
export function spaceRanksFor(legs = SPACE_KEYS.length) {
  const t = TIMES[legs] || TIMES[5], max = legs * SPACE_LEG_MAX;
  return [...NAMES.map((n, i) => [Math.round(max - t[i] / 3), ...n, t[i]]), [0, 'Lost in Space', 'LOST', '#475569', '#e2e8f0', 'Finished, eventually. Tomorrow, the same run, quicker.', null]];
}
export const SPACE_RANKS = spaceRanksFor();
`;
  const tier = `export function spaceTierOf(points, allSolved = true, legs = SPACE_KEYS.length) {
  const R = spaceRanksFor(legs);
  if (!allSolved) return R.length - 1;
  const p = Number(points) || 0;
  for (let i = 0; i < R.length; i++) if (p >= R[i][0]) return i;
  return R.length - 1;
}
`;
  if (!s.includes('export function spaceRanksFor')) { wr(SC, s.slice(0, a) + block + tier + s.slice(s.indexOf('}\n', b) + 2)); applied++; } else skipped++;
}
sub(SC, `// Roll, Parker, Tangled, then Topple (owner's order), back to back on one page\n// (app/spacecadet).`, `// Roll, Parker, Tangled, Topple (owner's order), then Pack from 2026-11-15, back\n// to back on one page (app/spacecadet).`);

const CI = 'lib/circuits.js';
sub(CI, `import { SPACE_KEYS, SPACE_MAX, SPACE_FROM, spaceScorerFor } from './space-cadet.js';`, `import { SPACE_KEYS, SPACE_KEYS_BEFORE, SPACE_PACK_FROM, SPACE_FROM, spaceScorerFor, spaceMaxFor } from './space-cadet.js';`);
sub(CI, `spacecadet: { forDay: () => ({ fn: spaceScorerFor(), max: SPACE_MAX }) }`, `spacecadet: { forDay: (iso) => ({ fn: spaceScorerFor(), max: spaceMaxFor(iso) }) }`);
sub(CI, `    blurb: 'Four spatial puzzles on one page: roll a die, free a car, untangle the ropes, land a block. One clock across all four decides your rank.',`, `    blurb: 'Five spatial puzzles on one page: roll a die, free a car, untangle the ropes, land a block, pack a trunk. One clock across all five decides your rank.',`);
sub(CI, `      invite: "Four spatial puzzles, one clock: roll a die, free a car, untangle the ropes, land a block. Fast enough and you are an Architect-Engineer.",\n      result: "Four spatial puzzles, one rank.",`, `      invite: "Spatial puzzles on one clock: roll a die, free a car, untangle ropes, land a block, pack a trunk. Fast enough and you are an Architect-Engineer.",\n      result: "A run of spatial puzzles, one rank.",`);
sub(CI, `    path: '/spacecadet',\n    unit: '4 puzzles',`, `    path: '/spacecadet',\n    unit: '5 puzzles',`);
sub(CI, `    keys: SPACE_KEYS.slice(),\n    trophy: { name: 'Architect-Engineer',`, `    // PACK JOINS AS THE FINAL PUZZLE from SPACE_PACK_FROM (owner, 2026-11-14); the\n    // days before deal the four they ran with.\n    keys: SPACE_KEYS.slice(),\n    before: { keys: SPACE_KEYS_BEFORE.slice(), until: '2026-11-14' },\n    trophy: { name: 'Architect-Engineer',`);

const SP = 'app/spacecadet/page.js';
sub(SP, `import { PUZZLES as P_topple } from '../topple/puzzles';`, `import { PUZZLES as P_topple } from '../topple/puzzles';\nimport { PUZZLES as P_pack } from '../pack/puzzles';`);
sub(SP, `const BANKS = { roll: P_roll, park: P_park, tangled: P_tangled, topple: P_topple };`, `const BANKS = { roll: P_roll, park: P_park, tangled: P_tangled, topple: P_topple, pack: P_pack };`);
sub(SP, `const title = 'Space Cadet: Four Daily Spatial Puzzles in One Run | Mind Loft';`, `const title = 'Space Cadet: Five Daily Spatial Puzzles in One Run | Mind Loft';`);
sub(SP, `const description = 'A free daily spatial reasoning run: roll a die, free a car, untangle the ropes, land a block. One clock ranks you from Lost in Space to Architect-Engineer.';`, `const description = 'A free daily spatial run: roll a die, free a car, untangle ropes, land a block, pack a trunk. One clock ranks you from Lost in Space to Architect-Engineer.';`);
sub(SP, `Roll, Parker, Tangled and Topple on one clock,`, `Roll, Parker, Tangled, Topple and Pack on one clock,`);
// Pack's stored packing never ships with the run either
sub(SP, `    const p = bank.filter((x) => x.live === today)[0];\n    if (!p) continue;`, `    const p0 = bank.filter((x) => x.live === today)[0];\n    if (!p0) continue;\n    const p = key === 'pack' ? (({ sol, ...rest }) => rest)(p0) : p0;`);

const SCC = 'app/spacecadet/SpaceCadetClient.jsx';
sub(SCC, `import { SPACE_RUN_ID, SPACE_RANKS, SPACE_MAX, SPACE_LEG_MAX, SPACE_CAP, spaceTierOf, spaceLegPoints } from '@/lib/space-cadet';`, `import { SPACE_RUN_ID, SPACE_LEG_MAX, SPACE_CAP, spaceRanksFor, spaceTierOf, spaceLegPoints } from '@/lib/space-cadet';`);
sub(SCC, `  topple: dynamic(() => import('../topple/ToppleClient'), { ssr: false, loading: () => null }),\n`, `  topple: dynamic(() => import('../topple/ToppleClient'), { ssr: false, loading: () => null }),\n  pack: dynamic(() => import('../pack/PackClient'), { ssr: false, loading: () => null }),\n`);
{ const s = rd(SCC); if (s.includes('const B = SPACE_RANKS;\n')) { wr(SCC, s.replace('const B = SPACE_RANKS;\n', '')); applied++; } else skipped++; }
sub(SCC, `centerpiece={<Launch go={leaving} allBanked={allBanked} onStart={start} />}`, `centerpiece={<Launch go={leaving} allBanked={allBanked} onStart={start} B={B} NW={NW} />}`);
sub(SCC, `function Launch({ go, allBanked, onStart }) {`, `function Launch({ go, allBanked, onStart, B, NW }) {`);
sub(SCC, `allBanked ? 'All four flown today' : 'Cleared for launch'`, `allBanked ? \`All \${NW.toLowerCase()} flown today\` : 'Cleared for launch'`);
sub(SCC, `  const NW = COUNT_WORD[N] || String(N);\n`, `  const NW = COUNT_WORD[N] || String(N);\n  // The roster is dated (Pack is the fifth leg from 2026-11-15), so the ladder and the\n  // total follow the number of legs dealt today.\n  const B = useMemo(() => spaceRanksFor(N), [N]);\n  const SPACE_MAX = N * SPACE_LEG_MAX;\n`);
sub(SCC, `  const tier = spaceTierOf(total, allSolved);`, `  const tier = spaceTierOf(total, allSolved, N);`);
sub(SCC, `rule="One clock across all four puzzles. Your time decides your rank."`, `rule={\`One clock across all \${NW.toLowerCase()} puzzles. Your time decides your rank.\`}`);
sub(SCC, `\`\${fmtClock(runClock)} across all four\``, `\`\${fmtClock(runClock)} across all \${NW.toLowerCase()}\``);
sub(SCC, `Roll a die, free a car, untangle the ropes, land a block. Rank from`, `Roll a die, free a car, untangle the ropes, land a block\${N > 4 ? ', pack a trunk' : ''}. Rank from`);
sub(SCC, `// SPACE CADET: four spatial puzzles as one run (owner, 2026-11-07).`, `// SPACE CADET: spatial puzzles as one run (owner, 2026-11-07). Four legs at launch;\n// Pack is the fifth and last from 2026-11-15 (owner, 2026-11-14).`);

sub('app/spacecadet/leaderboard/page.js', `Four spatial puzzles on one clock, scored out of 400.`, `Five spatial puzzles on one clock, scored out of 500.`);
sub('app/spacecadet/leaderboard/page.js', `Nobody has finished all four puzzles today yet.`, `Nobody has finished every puzzle today yet.`);
sub('app/spacecadet/card/route.js', `'Four spatial puzzles on one clock: roll a die, free a car, untangle the ropes, land a block.'`, `'Five spatial puzzles on one clock: roll a die, free a car, untangle the ropes, land a block, pack a trunk.'`);
sub('lib/run-seo.js', `score: 'One clock across all four puzzles. Each solved puzzle is worth up to 100 points for speed, losing a point every three seconds, so the run is out of 400 and the total is really your time.`, `score: 'One clock across all five puzzles. Each solved puzzle is worth up to 100 points for speed, losing a point every three seconds, so the run is out of 500 and the total is really your time.`);
sub('app/circuits/RunDoorPop.jsx', `eyebrow: 'Daily run \\u00b7 Four spatial puzzles', once: 'game', everyone: true, from: '2026-11-07',`, `eyebrow: 'Daily run \\u00b7 Five spatial puzzles', once: 'game', everyone: true, from: '2026-11-07',`);
sub('app/circuits/RunDoorPop.jsx', `body: 'Roll, Parker, Tangled and Topple back to back on one page: roll a die, free a car, untangle the ropes, land a block. One clock across all four ranks you,`, `body: 'Roll, Parker, Tangled, Topple and Pack back to back on one page: roll a die, free a car, untangle the ropes, land a block, pack a trunk. One clock across all five ranks you,`);
sub('app/EntryDoor.jsx', `  spacecadet: 'Four spatial puzzles, one clock',`, `  spacecadet: 'Five spatial puzzles, one clock',`);
sub('app/SpaceCadetPop.jsx', `Four spatial puzzles on one page and one clock across all four.`, `Five spatial puzzles on one page and one clock across all five.`);

console.log(`wire-pack: ${applied} edits applied, ${skipped} already present`);
