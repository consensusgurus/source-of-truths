// scripts/wire-curb.mjs: wires Curb (the daily parking game, Visual, owner
// 2026-11-28) into every registry in one pass, beside Machine. Placement
// follows "Placing a new daily" in docs/claude/daily-authoring.md.
//
// Visual, skills Spatial and Planning. Park or not (10 or 0), so it is on
// SOLVE_ONLY; no miss column: the ranked time is the clock plus accuracy and
// bump seconds, added by the shell through GAME.extraSec, and the plain board
// order ranks it. First try counts. Sunday Edition: a tractor-trailer at a
// loading dock, so it is on SUNDAY_EDITION_GAMES and in the Sunday slate.
// Group Pack and untangle (four become five, with its set page), a new finish
// set Behind the wheel (Curb, Parker, Pack), family beside Parker. Premieres
// 2026-11-28.
//
// Anchored: every anchor must match EXACTLY ONCE or the script throws, and an
// edit whose replacement is already present is skipped, so it is safe to re-run.
//   node scripts/wire-curb.mjs
import fs from 'fs';
import path from 'path';
import url from 'url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const R = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const W = (f, s) => fs.writeFileSync(path.join(ROOT, f), s);
let edits = 0, skipped = 0;
function one(f, a, b) {
  const s = R(f);
  if (s.includes(b)) { skipped++; return; }
  const n = s.split(a).length - 1;
  if (n !== 1) throw new Error(`${f}: anchor found ${n} times: ${a.slice(0, 110)}`);
  W(f, s.replace(a, () => b)); edits++;
}
function after(f, needle, add) {
  const s = R(f);
  if (s.includes(add.split('\n')[0])) { skipped++; return; }
  const lines = s.split('\n');
  const hit = lines.map((l, i) => (l.includes(needle) ? i : -1)).filter((i) => i >= 0);
  if (hit.length !== 1) throw new Error(`${f}: line anchor found ${hit.length} times: ${needle.slice(0, 110)}`);
  lines.splice(hit[0] + 1, 0, add);
  W(f, lines.join('\n')); edits++;
}

const C = '#1e40af', NAVY = '#93c5fd', SOFT = '#dbeafe', BORDER = 'rgba(30,64,175,0.35)';
const TAG = 'Parallel park, close and quick';
const TAGLONG = 'Parallel park a real-steering car between two cars; Sundays, back a semi into the dock';
const HOW = 'A top-down street with a gap between two parked cars. Steer with the slider, hold Drive or Reverse, and park: the car steers like a real one, so you swing wide, back in and straighten up. The vehicle, the room, the curb side, hydrants and traffic change daily and the gap tightens through the week. On Sunday you back a tractor-trailer into a loading dock. Ranked on your time plus seconds for every inch from the curb, every degree off straight and every bump.';
const BLURB = 'Parallel park a real-steering car between two parked cars, close to the curb and quick. On Sundays, back a tractor-trailer into the dock.';

// 1. the registry: the row, the premiere, solve-only
after('lib/daily-games.js', `  { key: 'machine', miss: 'Runs', name: 'Machine', cat: 'Visual',`,
  `  { key: 'curb', miss: null, name: 'Curb', cat: 'Visual', tag: '${TAG}', tagLong: '${TAGLONG}', how: '${HOW}', color: '${C}', colorNavy: '${NAVY}' },`);
one('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n  { key: 'curb', from: '2026-11-28', until: '2026-12-05' },\n`);
one('lib/daily-games.js', `'dash', 'pack', 'machine', 'crate', 'bot',`, `'dash', 'pack', 'machine', 'curb', 'crate', 'bot',`);

// 2. the end card and the launch pins
after('app/DailyEndCard.jsx', `  machine: { accent: '#b45309', badgeBg: '#b45309', badgeInk: T.white, Fin: Trophy },`,
  `  curb: { accent: '${C}', badgeBg: '${C}', badgeInk: T.white, Fin: Trophy },`);
after('app/DailyEndCard.jsx', `  { key: 'machine', cat: 'visual', name: 'Machine',`,
  `  { key: 'curb', cat: 'visual', name: 'Curb', tag: '${TAG}', blurb: '${BLURB}', href: '/curb' },`);
for (const f of ['app/DailyEndCard.jsx', 'app/api/quiz/daily-order/route.js']) one(f, `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['curb', `);

// 3. promo, grid, strip
after('app/DailyGamesPromo.jsx', `  { key: 'machine', href: '/machine'`,
  `  { key: 'curb', href: '/curb', name: 'Curb', tag: 'parallel park, close and quick', store: 'sot_curb_day', accent: '${C}', bg: '${SOFT}', border: '${BORDER}' },`);
after('app/DailyGamesGrid.jsx', `  { key: 'machine', href: '/machine'`,
  `  { key: 'curb', href: '/curb', name: 'Curb', tag: '${TAG}', img: '/games/btn-curb.png' },`);
one('app/DailyGamesGrid.jsx', `'tangled', 'pack', 'machine', 'c`, `'tangled', 'pack', 'machine', 'curb', 'c`);
after('app/DailyStrip.jsx', `  { key: 'machine', href: '/machine'`,
  `  { key: 'curb', href: '/curb', name: 'Curb', img: '/games/btn-curb.png', store: 'sot_curb_day', tag: "${TAG}" , cat: 'Visual' },`);
one('app/DailyStrip.jsx', `const ACCENTS = { `, `const ACCENTS = { curb: '${NAVY}', `);
one('app/DailyStrip.jsx', `const TCOL = { `, `const TCOL = { curb: '${C}', `);

// 4. archive
after('app/archive/page.js', `import { PUZZLES as MACHINE_FULL } from '../machine/puzzles';`,
  `import { PUZZLES as CURB_FULL } from '../curb/puzzles';\nconst CURB = CURB_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`);
after('app/archive/page.js', `  { key: 'machine', name: 'Machine', path: '/machine'`,
  `  { key: 'curb', name: 'Curb', path: '/curb', tag: '${TAG}', accent: '${C}', bg: '${SOFT}', border: '${BORDER}', src: CURB },`);

// 5. the slate map and the Sunday slate
after('lib/daily-slate.js', `import { PUZZLES as P_machine } from '@/app/machine/puzzles';`, `import { PUZZLES as P_curb } from '@/app/curb/puzzles';`);
one('lib/daily-slate.js', `machine: P_machine, `, `machine: P_machine, curb: P_curb, `);
after('lib/sunday-editions.js', `//   machine a bigger board with more parts in the tray`, `//   curb    a tractor-trailer backed into a loading-dock bay, against a car parallel parked Monday to Saturday`);

// 6. every list that names the dailies beside Machine
for (const f of ['app/api/quiz/sunday-slate/route.js', 'lib/sunday-editions.js', 'lib/quiz-catalog.js', 'lib/loft.js', 'app/DailySlateRail.jsx']) one(f, `'machine', `, `'machine', 'curb', `);
for (const f of ['app/api/quiz/daily-status/route.js', 'app/quizzes/QuizHomeClient.jsx']) one(f, `|machine|`, `|machine|curb|`);
one('lib/daily-difficulty.js', `  machine: 3, // a starting estimate (2026-11-17) until a week of plays rates it`, `  machine: 3, // a starting estimate (2026-11-17) until a week of plays rates it\n  curb: 3, // a starting estimate (2026-11-28) until a week of plays rates it`);
after('lib/game-blurbs.js', `  machine: "`, `  curb: "Parallel park a real-steering car, close to the curb and quick.",`);

// 7. skills, glyph, preview drawings, family
one('lib/daily-skills.js', `machine: ['spa', 'plan'], `, `machine: ['spa', 'plan'], curb: ['spa', 'plan'], `);
after('lib/game-glyphs.js', `  machine: 'M3 6h8l9 8M4 20h16`,
  `  curb: 'M20 3v18M6 4h8a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM7 8h6M7 16h6',  // a car seen from above, parked against the curb line`);
const TILE = `// Curb: a curb along the right, two parked cars, and the blue car sliding into the gap between them
const Curb = () => (
  <g><path d="M190 4V80" className="s5" /><rect x={166} y={6} width={18} height={26} rx={4} className="m" /><rect x={166} y={56} width={18} height={24} rx={4} className="m" />
    <rect x={150} y={30} width={18} height={28} rx={4} className="d" transform="rotate(-14 159 44)" /><path d="M112 20v48" className="s3" /></g>
);
`;
for (const f of ['app/GamePreviewTiles.jsx', 'app/GamePreview.jsx']) {
  if (!/\nconst Curb = /.test(R(f))) one(f, `const Machine = () => (\n`, TILE + `const Machine = () => (\n`);
  one(f, `machine: Machine, `, `machine: Machine, curb: Curb, `);
}
one('lib/daily-families.js', `['park', 'impound', 'junkyard'],`, `['park', 'impound', 'junkyard', 'curb'],`);

// 8. groups and finish sets
one('lib/daily-groups.js', `{ name: 'Pack and untangle', cat: 'Visual', keys: ['pack', 'crate', 'tangled', 'paths'] },`, `{ name: 'Pack and untangle', cat: 'Visual', keys: ['pack', 'crate', 'tangled', 'paths', 'curb'] },`);
after('lib/finish-sets.js', `{ name: 'Tight fits', cat: 'Visual', keys: ['pack', 'crate', 'junkyard', 'tangled'] },`, `  { name: 'Behind the wheel', cat: 'Visual', keys: ['curb', 'park', 'pack'] },`);

// 9. the Pack and untangle set page: four become five
const PS = 'lib/puzzle-sets.js';
one(PS, `h1: 'Free Daily Spatial Puzzles: 3D Packing, Box Pushing, Rope Untangling and the Cheapest Network',`, `h1: 'Free Daily Spatial Puzzles: 3D Packing, Box Pushing, Rope Untangling, the Cheapest Network and Parallel Parking',`);
one(PS, `description: 'Four free daily puzzles about fitting things together in space: load a pile of luggage or furniture into a vehicle in three dimensions, push crates onto their spots, untangle ropes on a frame of pegs, and wire every town for the least cost.`,
  `description: 'Five free daily puzzles about fitting things together in space: load a vehicle in three dimensions, push crates onto their spots, untangle ropes, wire every town for the least cost, and parallel park.`);
one(PS, `lede: 'Four puzzles about how things fit.`, `lede: 'Five puzzles about how things fit.`);
one(PS, `Paths links every town into one network for the least cost.',\n    how: [`, `Paths links every town into one network for the least cost. Curb fits a car into a gap at the curb, or a trailer into a dock bay on Sunday.',\n    how: [`);
one(PS, `and you build the cheapest network that reaches all of them.',`, `and you build the cheapest network that reaches all of them. Curb is a parking game with real steering: swing wide, back in and straighten up, ranked on your time plus seconds for every inch from the curb and every degree off straight.',`);
one(PS, `['Are they free?', 'All four, every day, no account required.'],\n    ],\n  },\n  {\n    name: 'Rule finding'`, `['Are they free?', 'All five, every day, no account required.'],\n    ],\n  },\n  {\n    name: 'Rule finding'`);

// 10. the visual-puzzles page: twenty-two become twenty-three
const PC = 'lib/puzzle-categories.js';
one(PC, `description: 'Twenty-two free daily visual and spatial puzzles:`, `description: 'Twenty-three free daily visual and spatial puzzles:`);
one(PC, `a box pushing puzzle, a contraption puzzle, a route you eat in order`, `a box pushing puzzle, a contraption puzzle, a parallel parking game, a route you eat in order`);
one(PC, `lede: 'Twenty-two puzzles you solve with your eyes and a sense of space,`, `lede: 'Twenty-three puzzles you solve with your eyes and a sense of space,`);
one(PC, `ten ask you to move something through a tight spot, and one asks you to finish a machine:`, `eleven ask you to move something through a tight spot, and one asks you to finish a machine:`);
one(PC, `a pile of luggage into a car trunk, crates onto their spots,`, `a pile of luggage into a car trunk, a car into a parking spot, crates onto their spots,`);
one(PC, `'pack', 'crate', 'machine', 'chomp', 'paths'],`, `'pack', 'crate', 'machine', 'curb', 'chomp', 'paths'],`);
one(PC, `machine: 'Contraption puzzle (chain reaction)', chomp:`, `machine: 'Contraption puzzle (chain reaction)', curb: 'Parallel parking game', chomp:`);
one(PC, `drag the last ramps, springs and belts into place and press Run. Chomp`, `drag the last ramps, springs and belts into place and press Run. Curb is parallel parking with real steering, and a tractor-trailer at a loading dock on Sunday. Chomp`);
one(PC, `Machine hands you a bigger machine and more parts,`, `Machine hands you a bigger machine and more parts, Curb swaps the car for a tractor-trailer,`);
one(PC, `['Are they free?', 'All twenty-two, every day, no account required.'],`, `['Are they free?', 'All twenty-three, every day, no account required.'],`);

console.log(`wire-curb: ${edits} edits, ${skipped} already present`);
