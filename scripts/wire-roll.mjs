// scripts/wire-roll.mjs — wires Roll, the daily die-rolling puzzle (Logic),
// into every registry, beside Topple, its sibling. Placement follows the rule in
// CLAUDE.md ("Placing a new daily"): one registry category (Logic), skills
// Spatial and Planning (Topple's pair, and both are what the game makes you do),
// the category key lists, the Roll and route daily group, a finish set (Rolling
// puzzles, new, since Slide and shift is at its ceiling of four), and the
// logic-puzzles page copy.
//
// Anchored edits: every anchor must match EXACTLY ONCE or the script throws,
// and an edit whose insertion is already present is skipped, so a re-run is safe.
//   node scripts/wire-roll.mjs <dir>
import fs from 'fs';
import path from 'path';
const root = process.argv[2] || '.';
let applied = 0, skipped = 0;
function rd(f) { return fs.readFileSync(path.join(root, f), 'utf8'); }
function wr(f, s) { fs.writeFileSync(path.join(root, f), s); }
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

const TAG = 'Light the squares in order';
const TAGLONG = 'Roll a die across the floor and light the numbered squares in order';
const HOW = 'Every roll tips the die over an edge. Light the numbered squares 1, 2, 3 in order, each by landing on it with that number on top. A square stays shut until it is next.';
const BLURB = 'A die on a floor of tiles. Roll it to light the numbered squares in order, each with its own number on top, in as few rolls as you can.';
const COLOR = '#166534', NAVY = '#86efac', BG = '#dcfce7', BORDER = 'rgba(22,101,52,0.35)';

// 1. lib/daily-games.js: the row and the premiere
afterLine('lib/daily-games.js', "{ key: 'topple', keepsAnswer: true,", [
  `  { key: 'roll', keepsAnswer: true, attempts: 'graded', miss: 'Tries', name: 'Roll', cat: 'Logic', tag: '${TAG}', tagLong: '${TAGLONG}', how: '${HOW}', color: '${COLOR}', colorNavy: '${NAVY}' },`]);
sub('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n  { key: 'roll', from: '2026-10-20', until: '2026-10-24' },\n`);

// 2. lib/sunday-editions.js
afterLine('lib/sunday-editions.js', '//   topple   a bigger board, a perfect line of 30 to 38', [
  '//   roll     six numbered squares and cracks on a bigger floor, a perfect line of 36 to 44 rolls']);
sub('lib/sunday-editions.js', `'junkyard', 'topple', 'snug',`, `'junkyard', 'topple', 'roll', 'snug',`);

// 3. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['topple', `, `const LAUNCH_PIN = { keys: ['roll', 'topple', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['topple', `, `const LAUNCH_PIN = { keys: ['roll', 'topple', `);
afterLine('app/DailyEndCard.jsx', "  topple: { accent: '#3f6212', badgeBg: '#3f6212', badgeInk: T.white, Fin: Trophy },", [
  `  roll: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: Trophy },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'topple',     cat: 'logic',", [
  `  { key: 'roll',       cat: 'logic',     name: 'Roll', tag: '${TAG}',     blurb: '${BLURB}', href: '/roll' },`]);

// 4. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'topple', href: '/topple'", [
  `  { key: 'roll', href: '/roll', name: 'Roll', tag: 'light the squares in order', store: 'sot_roll_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'topple', href: '/topple'", [
  `  { key: 'roll', href: '/roll', name: 'Roll', tag: '${TAG}', img: '/games/btn-roll.png' },`]);
sub('app/DailyGamesGrid.jsx', `'junkyard', 'topple', 'snug',`, `'junkyard', 'topple', 'roll', 'snug',`);
afterLine('app/DailyStrip.jsx', "{ key: 'topple', href: '/topple'", [
  `  { key: 'roll', href: '/roll', name: 'Roll', img: '/games/btn-roll.png', store: 'sot_roll_day', tag: "${TAG}" , cat: 'Logic' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { topple: `, `const ACCENTS = { roll: '${NAVY}', topple: `);
sub('app/DailyStrip.jsx', `const TCOL = { topple: `, `const TCOL = { roll: '${COLOR}', topple: `);

// 5. archive
sub('app/archive/page.js', `import { PUZZLES as TOPPLE_FULL } from '../topple/puzzles';`,
  `import { PUZZLES as TOPPLE_FULL } from '../topple/puzzles';\nimport { PUZZLES as ROLL_FULL } from '../roll/puzzles';`);
afterLine('app/archive/page.js', 'const TOPPLE = TOPPLE_FULL.map(', [
  'const ROLL = ROLL_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));']);
afterLine('app/archive/page.js', "{ key: 'topple', name: 'Topple', path: '/topple'", [
  `  { key: 'roll', name: 'Roll', path: '/roll', tag: '${TAG}', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: ROLL },`]);

// 6. the four puzzle-map registries
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_topple } from '@/app/topple/puzzles';`,
    `import { PUZZLES as P_topple } from '@/app/topple/puzzles';\nimport { PUZZLES as P_roll } from '@/app/roll/puzzles';`);
  sub(f, `topple: P_topple, snug: P_snug,`, `topple: P_topple, roll: P_roll, snug: P_snug,`);
}

// 7. alternations, rails, catalog, loft
sub('app/api/quiz/daily-status/route.js', `|junkyard|topple|snug|`, `|junkyard|topple|roll|snug|`);
sub('app/quizzes/QuizHomeClient.jsx', `|junkyard|topple|snug|`, `|junkyard|topple|roll|snug|`);
sub('app/DailySlateRail.jsx', `'junkyard', 'topple', 'snug',`, `'junkyard', 'topple', 'roll', 'snug',`);
sub('lib/quiz-catalog.js', `'junkyard', 'topple', 'snug',`, `'junkyard', 'topple', 'roll', 'snug',`);
sub('lib/loft.js', `'impound', 'junkyard', 'topple', 'snug',`, `'impound', 'junkyard', 'topple', 'roll', 'snug',`);

// 8. skills, challenge metric, glyph
sub('lib/daily-skills.js', `topple: ['spa', 'plan'], `, `topple: ['spa', 'plan'], roll: ['spa', 'plan'], `);
sub('lib/challenge-metric.js', `  topple: { unit: 'rolls', one: 'roll', dir: 'low', solveFirst: true },`,
  `  topple: { unit: 'rolls', one: 'roll', dir: 'low', solveFirst: true },\n  roll: { unit: 'rolls', one: 'roll', dir: 'low', solveFirst: true },`);
afterLine('lib/game-glyphs.js', "  topple: 'M4 20h16M7 20V8h5v12M12 14h7v6M15 4l2 2-2 2',", [
  "  roll: 'M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8M9 8.4h.01M15 8.4h.01M8 14h.01M16 14h.01',  // a die seen from a corner, three faces and their pips"]);

// 9. group and finish set
sub('lib/daily-groups.js', `  { name: 'Roll and route', cat: 'Logic', keys: ['topple', 'chomp', 'paths'] },`,
  `  { name: 'Roll and route', cat: 'Logic', keys: ['topple', 'roll', 'chomp', 'paths'] },`);
sub('lib/finish-sets.js', `  { name: 'Slide and shift', cat: 'Logic', keys: ['chomp', 'park', 'junkyard', 'topple'] },`,
  `  { name: 'Slide and shift', cat: 'Logic', keys: ['chomp', 'park', 'junkyard', 'topple'] },\n  { name: 'Rolling puzzles', cat: 'Logic', keys: ['topple', 'roll', 'chomp'] },`);

// 9b. the Roll and route set page: now four
const PS = 'lib/puzzle-sets.js';
sub(PS, `    eyebrow: 'Free daily route and block rolling puzzles',
    title: 'Free Daily Route Puzzles: Block Rolling, Eat in Order, Cheapest Network | Mind Loft',
    h1: 'Free Daily Route Puzzles: Block Rolling, Eat in Order and the Cheapest Network',
    description: 'Three free daily puzzles about finding the way: roll a tall block onto the spring, eat a cast of mascots in order, and wire every town for the least cost. New boards at midnight Eastern, no signup.',
    lede: 'Three puzzles where the answer is a route. Topple tips a tall block end over end until it lands on the spring. Chomp eats a cast of mascots in order, and every square you touch stays yours. Paths links every town into one network for the least cost.',
    how: [
      'Topple is the block rolling puzzle: every roll tips the block over an edge, a one-tile spring takes it standing and a two-tile spring takes it lying flat, and every board is solved exactly so par is real. Chomp`,
`    eyebrow: 'Free daily route, block rolling and die rolling puzzles',
    title: 'Free Daily Route Puzzles: Block Rolling, Die Rolling, Eat in Order, Cheapest Network | Mind Loft',
    h1: 'Free Daily Route Puzzles: Block Rolling, Die Rolling, Eat in Order and the Cheapest Network',
    description: 'Four free daily puzzles about finding the way: roll a tall block onto the spring, roll a die to light numbered squares in order, eat a cast of mascots in order, and wire every town for the least cost. New boards at midnight Eastern, no signup.',
    lede: 'Four puzzles where the answer is a route. Topple tips a tall block end over end until it lands on the spring. Roll tips a die across the floor to light numbered squares in order, each with its own number on top. Chomp eats a cast of mascots in order, and every square you touch stays yours. Paths links every town into one network for the least cost.',
    how: [
      'Topple is the block rolling puzzle: every roll tips the block over an edge, a one-tile spring takes it standing and a two-tile spring takes it lying flat, and every board is solved exactly so par is real. Roll is its die rolling sibling: a numbered square stays shut until it is next and your roll would land its number on top, and cracked squares crumble once you leave them. Chomp`);
sub(PS, `      ['Is there a best answer?', 'Yes. Topple and Paths measure you against a proven minimum, found by search before the board ships.'],
      ['Are they free?', 'All three, every day, no account required.'],`,
`      ['Is there a best answer?', 'Yes. Topple, Roll and Paths measure you against a proven minimum, found by search before the board ships.'],
      ['Are they free?', 'All four, every day, no account required.'],`);

// 10. the logic-puzzles page
const PC = 'lib/puzzle-categories.js';
sub(PC, `description: 'Twenty-five free daily logic puzzles: a daily jigsaw,`, `description: 'Twenty-six free daily logic puzzles: a daily jigsaw,`);
sub(PC, `three sizes of sliding block puzzle, a block rolling puzzle, whodunit deduction grids,`, `three sizes of sliding block puzzle, a block rolling puzzle, a die rolling puzzle, whodunit deduction grids,`);
sub(PC, `lede: 'Twenty-five logic puzzles with one new board apiece every day`, `lede: 'Twenty-six logic puzzles with one new board apiece every day`);
sub(PC, `a sliding block puzzle in three sizes, a block you roll end over end) alongside`, `a sliding block puzzle in three sizes, a block you roll end over end, a die you roll onto numbered squares) alongside`);
sub(PC, `'park', 'impound', 'junkyard', 'topple', 'paths', 'jester',`, `'park', 'impound', 'junkyard', 'topple', 'roll', 'paths', 'jester',`);
sub(PC, `topple: 'Block rolling puzzle', paths:`, `topple: 'Block rolling puzzle', roll: 'Die rolling puzzle', paths:`);
sub(PC, `standing on a one-tile spring or lying flat across a two-tile one.'`, `standing on a one-tile spring or lying flat across a two-tile one. Roll is its die rolling sibling: light the numbered squares in order, each by landing on it with that number on top.'`);
sub(PC, `Topple rolls a bigger board, Alibi`, `Topple rolls a bigger board, Roll lights six squares, Alibi`);
sub(PC, `['Are they free?', 'All twenty-five, every day, no account required.'],\n    ],\n  },`, `['Are they free?', 'All twenty-six, every day, no account required.'],\n    ],\n  },`);

// 11. CLAUDE.md
afterLine('CLAUDE.md', '| Topple | a bigger board with a perfect line of 30 to 38 rolls', [
  '| Roll | six numbered squares and cracked squares on a bigger floor, a perfect line of 36 to 44 rolls against 9 to 32 on weekdays (from launch, 2026-10-25) |']);
{
  const src = rd('CLAUDE.md');
  const marker = '## Roll (`/roll`): the daily die-rolling puzzle (launched 2026-10-20)';
  if (!src.includes(marker)) {
    wr('CLAUDE.md', src.replace(/\s*$/, '\n') + `
${marker}

Topple's sibling (owner, 2026-10-20: "could it use the same engine as topple? ... touch 3 or 4 or 5 in
order with numbers matching across a grid"). Key/route \`roll\`, category **Logic**, \`miss: 'Tries'\`,
\`attempts: 'graded'\`, \`keepsAnswer\`, legacy accent \`#166534\` / \`#86efac\`; on the stage it wears the
Logic ramp like Topple (the die is \`--stg-acc\`, pips \`--stg-onramp\`). Wired by \`scripts/wire-roll.mjs\`
(beside Topple). Skills Spatial and Planning, daily group Roll and route, finish set Rolling puzzles.

- **The rules** (\`lib/roll-engine.js\`, shared by client and generator): a die, four rolls, each a quarter turn
  over an edge, tracked as top/north/east (opposites sum to seven). Squares numbered 1 to N must be LIT IN
  ORDER: a square lights when the die lands on it with that number on top. **A numbered square is BLOCKED
  (owner ruling, 2026-10-20)** unless it is next AND the roll would land its number on top; a blocked roll,
  or a roll off the floor, is refused and costs nothing (the die tips and settles back). Lit squares are
  ordinary floor. Orange CRACKED squares crumble once the die rolls off them.
- **No hint** (owner, 2026-10-20). Undo ('Z') and Restart ('X', which also mends the cracks) are free moves in
  the list but never refund a roll: rolls = every U/D/L/R recorded. Scoring is Topple's (\`lib/par.js\`),
  Give up posts 0. The pad marks the key that would light the next square and dims blocked ones.
- **The bank** (\`scripts/gen-roll.mjs\`, deterministic off the date, extend with \`--until <date> --append
  --write\`): random-walk floors, kept only when the BFS perfect is in the day's band, the blocked rule costs
  rolls (crossing numbers freely is at least 2 shorter, 3 from four numbers), cracks change the answer, and
  the die never starts showing 1; the best of 24 legal boards is kept and dead floor trimmed. Ramp: Mon 3
  numbers 9-12, Tue 3 13-17, Wed 4 17-21, Thu 4 + cracks 19-24, Fri 5 23-28, Sat 5 + cracks 26-32, Sunday
  Edition 6 + cracks 36-44. \`scripts/verify-roll.mjs\` re-solves every board with an INDEPENDENT six-face
  permutation solver. Bank 2026-10-20 to 2027-01-31.
- **The board** (\`app/roll/RollBoard.jsx\`) is Topple's canvas with a LEAN (\`KX\`) so the die shows its top,
  front and right faces (owner, 2026-10-20: "a diagonal view so can see 3 sides at once"); rows and columns
  stay square to the screen so the arrows read straight.
`);
    applied++;
  } else skipped++;
}

console.log(`wire-roll: ${applied} edits applied, ${skipped} already present`);
