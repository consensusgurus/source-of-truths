// scripts/wire-glimpse.mjs: wires Glimpse (the daily flash-recall game, Visual,
// owner 2026-11-22) into every registry in one pass, beside Witness. Placement
// follows "Placing a new daily" in docs/claude/daily-authoring.md.
//
// Visual, skills Memory and Estimation. Scored in POINTS (every flash 0
// to 100 on closeness, out of 500, 600 on Sunday), so SCORE_VIEW 'points' and
// never a fraction; ranked on points, then the clock; first try counts.
// Sunday Edition: a sixth flash at 1.25 seconds with two questions, so it is on
// SUNDAY_EDITION_GAMES and in the Sunday slate. Group Observation puzzles (three
// become four, with its set page), finish set Sharp eyes, family beside Witness.
// Premieres 2026-11-22.
//
// Anchored: every anchor must match EXACTLY ONCE or the script throws, and an
// edit whose replacement is already present is skipped.
//   node scripts/wire-glimpse.mjs <dir>
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

const G = { key: 'glimpse', name: 'Glimpse', tag: 'One look, then one question', promo: 'one look, then one question', tagLong: 'A panel flashes for two seconds; then one question about it',
  how: 'A panel of dots, a lit grid, a clock and a string of characters flashes for a second or two, then disappears. One question follows about one part of it, and you do not know which. Every answer scores up to 100 on how close it was. Five flashes, getting faster; ranked on points, then the clock.',
  blurb: 'Dots, a grid, a clock and a string flash for two seconds. Then one question about one of them, scored on how close you were.',
  short: 'A panel flashes for two seconds, then one question about it.',
  color: '#86198f', navy: '#f0abfc', bg: '#fae8ff', border: 'rgba(134,25,143,0.35)' };

// 1. lib/daily-games.js: the row, the premiere, the points view
afterLine('lib/daily-games.js', "  { key: 'witness', miss: null, name: 'Witness', cat: 'Visual',", [
  `  { key: 'glimpse', miss: null, name: '${G.name}', cat: 'Visual', tag: '${G.tag}', tagLong: '${G.tagLong}', how: '${G.how}', color: '${G.color}', colorNavy: '${G.navy}' },`]);
sub('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n  { key: 'glimpse', from: '2026-11-22', until: '2026-11-29' },\n`);
sub('lib/daily-games.js', `passport: { v: 'points' }, potluck: { v: 'points' }, carmen: { v: 'points' },`, `passport: { v: 'points' }, potluck: { v: 'points' }, carmen: { v: 'points' }, glimpse: { v: 'points' },`);

// 2. the end card
afterLine('app/DailyEndCard.jsx', "  witness: { accent: '#9f1239', badgeBg: '#9f1239', badgeInk: T.white, Fin: Trophy },", [
  `  glimpse: { accent: '${G.color}', badgeBg: '${G.color}', badgeInk: T.white, Fin: Trophy },`]);
afterLine('app/DailyEndCard.jsx', "  { key: 'witness',    cat: 'visual',", [
  `  { key: 'glimpse',    cat: 'visual',     name: '${G.name}', tag: '${G.tag}',     blurb: '${G.blurb}', href: '/glimpse' },`]);
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['colossus', `, `const LAUNCH_PIN = { keys: ['glimpse', 'colossus', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['colossus', `, `const LAUNCH_PIN = { keys: ['glimpse', 'colossus', `);

// 3. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "  { key: 'witness', href: '/witness'", [
  `  { key: 'glimpse', href: '/glimpse', name: '${G.name}', tag: '${G.promo}', store: 'sot_glimpse_day', accent: '${G.color}', bg: '${G.bg}', border: '${G.border}' },`]);
afterLine('app/DailyGamesGrid.jsx', "  { key: 'witness', href: '/witness'", [
  `  { key: 'glimpse', href: '/glimpse', name: '${G.name}', tag: '${G.tag}', img: '/games/btn-glimpse.png' },`]);
sub('app/DailyGamesGrid.jsx', `'spot', 'witness', 'focus', 'park'`, `'spot', 'witness', 'glimpse', 'focus', 'park'`);
afterLine('app/DailyStrip.jsx', "  { key: 'witness', href: '/witness'", [
  `  { key: 'glimpse', href: '/glimpse', name: '${G.name}', img: '/games/btn-glimpse.png', store: 'sot_glimpse_day', tag: "${G.tag}" , cat: 'Visual' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { colossus: `, `const ACCENTS = { glimpse: '${G.navy}', colossus: `);
sub('app/DailyStrip.jsx', `const TCOL = { colossus: `, `const TCOL = { glimpse: '${G.color}', colossus: `);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as WITNESS_FULL } from '../witness/puzzles';`,
  `import { PUZZLES as WITNESS_FULL } from '../witness/puzzles';\nimport { PUZZLES as GLIMPSE_FULL } from '../glimpse/puzzles';`);
afterLine('app/archive/page.js', 'const WITNESS = WITNESS_FULL.map(', [
  `const GLIMPSE = GLIMPSE_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`]);
afterLine('app/archive/page.js', "  { key: 'witness', name: 'Witness', path: '/witness'", [
  `  { key: 'glimpse', name: '${G.name}', path: '/glimpse', tag: '${G.tag}', accent: '${G.color}', bg: '${G.bg}', border: '${G.border}', src: GLIMPSE },`]);

// 5. the daily puzzle maps and the Sunday slate
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js']) {
  sub(f, `import { PUZZLES as P_witness } from '@/app/witness/puzzles';`, `import { PUZZLES as P_witness } from '@/app/witness/puzzles';\nimport { PUZZLES as P_glimpse } from '@/app/glimpse/puzzles';`);
  sub(f, `witness: P_witness, `, `witness: P_witness, glimpse: P_glimpse, `);
}
sub('app/api/quiz/sunday-slate/route.js', `import { PUZZLES as P_peg } from '@/app/peg/puzzles';`, `import { PUZZLES as P_peg } from '@/app/peg/puzzles';\nimport { PUZZLES as P_glimpse } from '@/app/glimpse/puzzles';`);
sub('app/api/quiz/sunday-slate/route.js', `peg: P_peg, `, `peg: P_peg, glimpse: P_glimpse, `);
afterLine('lib/daily-difficulty.js', '  witness: 2, // a starting estimate', [`  glimpse: 3, // a starting estimate (2026-11-22) until a week of plays rates it`]);
afterLine('lib/game-blurbs.js', '  witness: "', [`  glimpse: "${G.short}",`]);
sub('lib/sunday-editions.js', `'machine', 'crate', 'bot', 'peg', `, `'machine', 'crate', 'bot', 'peg', 'glimpse', `);
afterLine('lib/sunday-editions.js', '//   peg     24 to 30 pegs', [
  '//   glimpse a sixth flash at 1.25 seconds with two questions, and the fullest panels of the week (out of 600)']);

// 6. alternations, rails, catalog, loft
sub('app/api/quiz/daily-status/route.js', `|witness|defuse|`, `|witness|glimpse|defuse|`);
sub('app/quizzes/QuizHomeClient.jsx', `|witness|defuse|`, `|witness|glimpse|defuse|`);
for (const f of ['app/DailySlateRail.jsx', 'lib/quiz-catalog.js', 'lib/loft.js']) sub(f, `'tangled', 'witness', 'defuse', `, `'tangled', 'witness', 'glimpse', 'defuse', `);

// 7. skills, glyph, preview drawings, family
sub('lib/daily-skills.js', `witness: ['mem'], `, `witness: ['mem'], glimpse: ['mem', 'est'], `);
afterLine('lib/game-glyphs.js', "  witness: 'M2 12s4-7", [
  "  glimpse: 'M3 3h18v18H3zM12 3v18M3 12h18M7 7h.01M8.5 8.5h.01M6 9h.01M16.5 9V6.5M16.5 9l1.8 1.2',  // the four-quadrant panel: dots, a clock hand"]);
for (const f of ['app/GamePreviewTiles.jsx']) {  // app/GamePreview.jsx falls back to TILE_BY_KEY
  if (!/\nconst Glimpse = /.test(rd(f))) sub(f, `const Witness = () => (\n`, `// Glimpse: the four-quadrant panel, dots top left, a lit grid top right, a clock, a string
const Glimpse = () => (
  <g><rect x={112} y={6} width={72} height={72} rx={4} className="w" /><rect x={147.5} y={6} width={1} height={72} className="d" /><rect x={112} y={41.5} width={72} height={1} className="d" />
    <circle cx={121} cy={15} r={2.5} className="d" /><circle cx={130} cy={22} r={2.5} className="d" /><circle cx={138} cy={14} r={2.5} className="m" /><circle cx={124} cy={31} r={2.5} className="m" /><circle cx={137} cy={32} r={2.5} className="d" />
    <rect x={155} y={13} width={9} height={9} rx={1.5} className="m" /><rect x={167} y={13} width={9} height={9} rx={1.5} className="sm" /><rect x={155} y={25} width={9} height={9} rx={1.5} className="sm" /><rect x={167} y={25} width={9} height={9} rx={1.5} className="m" />
    <circle cx={130} cy={60} r={11} className="sm" /><rect x={129} y={51} width={2} height={10} className="d" /><rect x={129} y={59} width={8} height={2} className="d" />
    <rect x={154} y={57} width={24} height={6} rx={3} className="d" /></g>
);
const Witness = () => (\n`);
  sub(f, `witness: Witness, `, `witness: Witness, glimpse: Glimpse, `);
}
sub('lib/daily-families.js', `['alibi', 'sudoclue', 'sworn', 'hearsay', 'fib', 'witness'],`, `['alibi', 'sudoclue', 'sworn', 'hearsay', 'fib', 'witness', 'glimpse'],`);

// 8. groups and finish sets
sub('lib/daily-groups.js', `{ name: 'Observation puzzles', cat: 'Visual', keys: ['spot', 'witness', 'focus'] },`, `{ name: 'Observation puzzles', cat: 'Visual', keys: ['spot', 'witness', 'glimpse', 'focus'] },`);
sub('lib/finish-sets.js', `{ name: 'Sharp eyes', cat: 'Visual', keys: ['spot', 'witness', 'focus'] },`, `{ name: 'Sharp eyes', cat: 'Visual', keys: ['spot', 'witness', 'glimpse', 'focus'] },`);

// 9. the Observation puzzles set page: three become four
const PS = 'lib/puzzle-sets.js';
sub(PS, `title: 'Free Daily Observation Puzzles: Spot the Difference, a Scene to Remember, a Zoomed Photo | Mind Loft',`, `title: 'Free Daily Observation Puzzles: Spot the Difference, Memory Games, Zoomed Photo | Mind Loft',`);
sub(PS, `h1: 'Free Daily Observation Puzzles: Spot the Difference, a Scene to Remember and a Zoomed Photo',`, `h1: 'Free Daily Observation Puzzles: Spot the Difference, a Scene to Remember, a Flash to Recall and a Zoomed Photo',`);
sub(PS, `description: 'Three free daily puzzles won by paying attention: two photographs with seven differences, a street scene to study and then be questioned on, and a photo`, `description: 'Four free daily puzzles won by paying attention: two photographs with seven differences, a street scene to study and then be questioned on, a panel that flashes for two seconds, and a photo`);
sub(PS, `lede: 'Three puzzles where everything you need is in front of you, if you look closely enough.`, `lede: 'Four puzzles where everything you need is in front of you, if you look closely enough.`);
sub(PS, `Witness shows a street scene for twenty seconds and then asks what you saw. Focus shows one photo at nine times zoom and asks what it is.',`, `Witness shows a street scene for twenty seconds and then asks what you saw. Glimpse flashes a panel of dots, a grid, a clock and a string for two seconds and asks about one of them. Focus shows one photo at nine times zoom and asks what it is.',`);
sub(PS, `with the scene returned at the end so you can see what you missed. Focus is a zoom puzzle:`, `with the scene returned at the end so you can see what you missed. Glimpse is a flash memory game: five flashes, each gone in a second or two, each followed by one question scored on how close you were. Focus is a zoom puzzle:`);
sub(PS, `['Do they get harder through the week?', 'Witness does. The scene gets busier from Monday to Sunday, while the twenty seconds stay the same.'],\n      ['Are they free?', 'All three, every day, no account required.'],`,
  `['Do they get harder through the week?', 'Witness and Glimpse do. The scene and the panel get busier from Monday to Sunday, while the clocks stay the same, and Glimpse adds a sixth, faster flash on Sunday.'],\n      ['Are they free?', 'All four, every day, no account required.'],`);

// 10. the Visual category page: one more
const PC = 'lib/puzzle-categories.js';
sub(PC, `description: 'Twenty free daily visual and spatial puzzles: two jigsaws, a 4,000 piece jigsaw everyone builds together, three more photo puzzles, spot the difference, a scene memory game, a zoomed-photo puzzle,`,
  `description: 'Twenty-one free daily visual and spatial puzzles: two jigsaws, a 4,000 piece jigsaw everyone builds together, three more photo puzzles, spot the difference, a scene memory game, a flash memory game, a zoomed-photo puzzle,`);
sub(PC, `lede: 'Twenty puzzles you solve with your eyes and a sense of space, one new board apiece every day. Six put a photograph back together, one of them a 4,000 piece mural the whole site builds at once, three test how closely you look,`,
  `lede: 'Twenty-one puzzles you solve with your eyes and a sense of space, one new board apiece every day. Six put a photograph back together, one of them a 4,000 piece mural the whole site builds at once, four test how closely you look,`);
sub(PC, `'spot', 'witness', 'focus', 'park', 'impound',`, `'spot', 'witness', 'glimpse', 'focus', 'park', 'impound',`);
sub(PC, `spot: 'Spot the difference', witness: 'Scene memory game', focus: 'Zoomed photo',`, `spot: 'Spot the difference', witness: 'Scene memory game', glimpse: 'Flash memory game', focus: 'Zoomed photo',`);
sub(PC, `Witness shows a street scene for twenty seconds and then asks six questions about what you saw. Focus shows`, `Witness shows a street scene for twenty seconds and then asks six questions about what you saw. Glimpse flashes a panel of dots, a lit grid, a clock and a string for two seconds, then asks about one of them. Focus shows`);
sub(PC, `Crate has five crates and Machine hands you a bigger machine and more parts.'],`, `Crate has five crates, Machine hands you a bigger machine and more parts, and Glimpse adds a sixth, faster flash.'],`);
sub(PC, `['Are they free?', 'All twenty, every day, no account required.'],\n    ],\n  },\n  {\n    slug: 'number-puzzles',`, `['Are they free?', 'All twenty-one, every day, no account required.'],\n    ],\n  },\n  {\n    slug: 'number-puzzles',`);

// 11. share card and challenges on points
afterLine('lib/challenge-metric.js', "  witness: { unit: 'right', one: 'right', dir: 'high', say: 'got' },", [
  "  glimpse: { unit: 'points', one: 'point', dir: 'high', say: 'scored' },"]);

console.log(`wire-glimpse: ${applied} edits applied, ${skipped} already present`);
