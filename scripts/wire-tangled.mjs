// scripts/wire-tangled.mjs — wires Tangled, the daily rope untangling puzzle
// (Logic, owner 2026-11-07), into every registry in one pass, beside Roll.
// Skills Spatial and Planning (Roll's pair), daily group Roll and route (now
// five), a new finish set Spatial puzzles (the Space Cadet four), and the
// logic-puzzles page copy.
//
// Ranked on time alone (miss: null, as Snug): any solve scores 10, a give-up 0,
// and the board breaks ties on the clock. NO SUNDAY EDITION: Sunday is simply
// the week's biggest board (eight ropes), so Tangled is not on
// SUNDAY_EDITION_GAMES nor in the Sunday slate map. It takes the launch pin and
// a premiere (the new-game pop-up), like Roll.
//
// Anchored: every anchor must match EXACTLY ONCE or the script throws, and an
// edit whose replacement is already present is skipped, so a re-run is safe.
//   node scripts/wire-tangled.mjs <dir>
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
  wr(f, s.replace(anchor, repl)); applied++;
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

const NAME = 'Tangled';
const TAG = 'Untangle the ropes';
const TAGLONG = 'Move the pegs until no two ropes cross';
const HOW = 'Ropes run between pegs in holes round a frame, wound round each other where they cross. Drag a peg into an empty hole until no two ropes cross. The frame changes shape every day, and the clock decides.';
const BLURB = 'Ropes wound round each other on a frame of pegs. Move the pegs into the empty holes until nothing crosses, against the clock.';
const COLOR = '#0f766e', NAVY = '#5eead4', BG = '#ccfbf1', BORDER = 'rgba(15,118,110,0.35)';

// 1. lib/daily-games.js: the row, the premiere, time-first
afterLine('lib/daily-games.js', "{ key: 'roll', keepsAnswer: true,", [
  `  { key: 'tangled', miss: null, name: '${NAME}', cat: 'Logic', tag: '${TAG}', tagLong: '${TAGLONG}', how: '${HOW}', color: '${COLOR}', colorNavy: '${NAVY}' },`]);
sub('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n  { key: 'tangled', from: '2026-11-07', until: '2026-11-11' },\n`);

// 2. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['simon', `, `const LAUNCH_PIN = { keys: ['tangled', 'simon', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['simon', `, `const LAUNCH_PIN = { keys: ['tangled', 'simon', `);
afterLine('app/DailyEndCard.jsx', "  roll: { accent: '#166534', badgeBg: '#166534', badgeInk: T.white, Fin: Trophy },", [
  `  tangled: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: Trophy },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'roll',       cat: 'logic',", [
  `  { key: 'tangled',    cat: 'logic',     name: '${NAME}', tag: '${TAG}',     blurb: '${BLURB}', href: '/tangled' },`]);

// 3. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'roll', href: '/roll'", [
  `  { key: 'tangled', href: '/tangled', name: '${NAME}', tag: 'untangle the ropes', store: 'sot_tangled_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'roll', href: '/roll'", [
  `  { key: 'tangled', href: '/tangled', name: '${NAME}', tag: '${TAG}', img: '/games/btn-tangled.png' },`]);
sub('app/DailyGamesGrid.jsx', `'topple', 'roll', 'sudoclue',`, `'topple', 'roll', 'tangled', 'sudoclue',`);
afterLine('app/DailyStrip.jsx', "{ key: 'roll', href: '/roll'", [
  `  { key: 'tangled', href: '/tangled', name: '${NAME}', img: '/games/btn-tangled.png', store: 'sot_tangled_day', tag: "${TAG}" , cat: 'Logic' },`]);
sub('app/DailyStrip.jsx', ` roll: '#86efac',`, ` roll: '#86efac', tangled: '${NAVY}',`);
sub('app/DailyStrip.jsx', ` roll: '#166534',`, ` roll: '#166534', tangled: '${COLOR}',`);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as ROLL_FULL } from '../roll/puzzles';`,
  `import { PUZZLES as ROLL_FULL } from '../roll/puzzles';\nimport { PUZZLES as TANGLED_FULL } from '../tangled/puzzles';`);
afterLine('app/archive/page.js', 'const ROLL = ROLL_FULL.map(', [
  'const TANGLED = TANGLED_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));']);
afterLine('app/archive/page.js', "{ key: 'roll', name: 'Roll', path: '/roll'", [
  `  { key: 'tangled', name: '${NAME}', path: '/tangled', tag: '${TAG}', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: TANGLED },`]);

// 5. the three daily puzzle maps (no Sunday slate: no Sunday Edition)
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js']) {
  sub(f, `import { PUZZLES as P_roll } from '@/app/roll/puzzles';`,
    `import { PUZZLES as P_roll } from '@/app/roll/puzzles';\nimport { PUZZLES as P_tangled } from '@/app/tangled/puzzles';`);
  sub(f, `topple: P_topple, roll: P_roll, sudoclue: P_sudoclue,`, `topple: P_topple, roll: P_roll, tangled: P_tangled, sudoclue: P_sudoclue,`);
}

// 6. alternations, rails, catalog, loft
sub('app/api/quiz/daily-status/route.js', `|topple|roll|sudoclue|`, `|topple|roll|tangled|sudoclue|`);
sub('app/quizzes/QuizHomeClient.jsx', `|topple|roll|sudoclue|`, `|topple|roll|tangled|sudoclue|`);
sub('app/DailySlateRail.jsx', `'topple', 'roll', 'sudoclue',`, `'topple', 'roll', 'tangled', 'sudoclue',`);
sub('lib/quiz-catalog.js', `'topple', 'roll', 'sudoclue',`, `'topple', 'roll', 'tangled', 'sudoclue',`);
sub('lib/loft.js', `'topple', 'roll', 'sudoclue',`, `'topple', 'roll', 'tangled', 'sudoclue',`);
sub('lib/daily-families.js', `  ['topple', 'roll', 'chomp'],`, `  ['topple', 'roll', 'chomp', 'tangled'],`);
sub('lib/daily-difficulty.js', `herd: 1, jig: 1, squash: 1, hold: 2,`, `herd: 1, jig: 1, squash: 1, hold: 2,\n  tangled: 2, // a starting estimate (2026-11-07) until a week of plays rates it`);

// 7. skills, glyph
sub('lib/daily-skills.js', `roll: ['spa', 'plan'], `, `roll: ['spa', 'plan'], tangled: ['spa', 'plan'], `);
// No finish-beats row: like Roll and Topple, Tangled takes the default beat.
afterLine('lib/game-glyphs.js', "  roll: 'M4 8l8-4 8 4v8l-8 4-8-4z", [
  "  tangled: 'M12 3a9 9 0 1 0 .01 0M6 8c5 1 7 7 12 8M6 16c5-1 7-7 12-8',  // a ring of pegs with two ropes crossing"]);

// 8. group and finish set
sub('lib/daily-groups.js', `  { name: 'Roll and route', cat: 'Logic', keys: ['topple', 'roll', 'chomp', 'paths'] },`,
  `  { name: 'Roll and route', cat: 'Logic', keys: ['topple', 'roll', 'chomp', 'paths', 'tangled'] },`);
sub('lib/finish-sets.js', `  { name: 'Rolling puzzles', cat: 'Logic', keys: ['topple', 'roll', 'chomp'] },`,
  `  { name: 'Rolling puzzles', cat: 'Logic', keys: ['topple', 'roll', 'chomp'] },\n  { name: 'Spatial puzzles', cat: 'Logic', keys: ['roll', 'park', 'tangled', 'topple'] },`);

// 9. the logic-puzzles page
const PC = 'lib/puzzle-categories.js';
sub(PC, `description: 'Thirty-two free daily logic puzzles:`, `description: 'Thirty-three free daily logic puzzles:`);
sub(PC, `a block rolling puzzle, a die rolling puzzle, whodunit deduction grids,`, `a block rolling puzzle, a die rolling puzzle, a rope untangling puzzle, whodunit deduction grids,`);
sub(PC, `lede: 'Thirty-two logic puzzles with one new board apiece every day`, `lede: 'Thirty-three logic puzzles with one new board apiece every day`);
sub(PC, `a die you roll onto numbered squares) alongside`, `a die you roll onto numbered squares, ropes to untangle) alongside`);
sub(PC, `'topple', 'roll', 'sudoclue',`, `'topple', 'roll', 'tangled', 'sudoclue',`);
sub(PC, `roll: 'Die rolling puzzle', sudoclue:`, `roll: 'Die rolling puzzle', tangled: 'Rope untangling puzzle', sudoclue:`);
sub(PC, `['Are they free?', 'All thirty-two, every day, no account required.'],`, `['Are they free?', 'All thirty-three, every day, no account required.'],`);

// 10. the game's own doc
{
  const f = 'docs/claude/games-other.md';
  const src = rd(f);
  const marker = '## Tangled (`/tangled`): the daily rope untangling puzzle (launched 2026-11-07)';
  if (!src.includes(marker)) {
    wr(f, src.replace(/\s*$/, '\n') + `
${marker}

From an ad the owner sent (2026-11-07): rope ends on pegs round a frame, move an end to an empty hole,
solved when no ropes cross. Key/route \`tangled\`, category **Logic**, \`miss: null\` (ranked on TIME
alone, as Snug: owner, "no one cares about par"), legacy accent \`${COLOR}\` / \`${NAVY}\`. Wired by
\`scripts/wire-tangled.mjs\` (beside Roll). Skills Spatial and Planning, daily group Roll and route,
finish set Spatial puzzles. Third leg of the Space Cadet run.

- **Rules** (\`lib/tangled-engine.js\`, shared by client, generator and verifier): holes evenly round a
  convex outline (polygon sides bowed out by BULGE so no three holes line up), R ropes and R*2+2 holes
  (always two empty). Two ropes cross exactly when their ends INTERLEAVE round the edge; that test is
  the only one used. Solved = no crossing pair; ANY such layout counts.
- **Bank** (\`scripts/gen-tangled.mjs\`, deterministic off the date): a random non-crossing matching,
  scrambled backward 60 times, keeping the tangle with the most spread-out crossings and the most cords.
  Ropes Mon 4, Tue/Wed 5, Thu/Fri 6, Sat 7, Sun 8; frame shape cycles circle, hexagon, square,
  triangle, rectangle, diamond, pentagon by day of year (octagon dropped: it read as the circle). No
  Sunday Edition. \`scripts/verify-tangled.mjs\` checks every row and BFS-proves the weekday boards
  solvable (2 to 4 moves). Bank 2026-11-07 to 2027-01-31.
- **The board** (\`app/tangled/TangledBoard.jsx\`, ported from the approved mockup): verlet ropes, ONE
  cream rope colour with coloured pegs (a rope's two pegs never match), no brown. Crossing pairs WIND
  INTO TWO-STRAND CORDS fixed at the board's start; a tangle unwinds only once its ropes stop crossing,
  never while one is held (owner: tangles must not come apart just by moving pegs).
- **Give up** (two taps) stops the clock, eases the ropes back to \`solved\` and posts 0. Replay is
  practice: unsaved, unposted.
`);
    applied++;
  } else skipped++;
}

console.log(`wire-tangled: ${applied} edits applied, ${skipped} already present`);
