// scripts/wire-topple.mjs — wires Topple, the daily block-rolling puzzle (Logic),
// into every registry, beside Junkyard. Placement follows the rule in CLAUDE.md
// ("Placing a new daily"): one registry category (Logic), skills Spatial and
// Planning (the pair Parker carries, and both are what the game makes you do),
// the category key lists, a daily group (Roll and route, new), a finish set
// (Slide and shift), and the logic-puzzles page copy.
//
// Anchored edits: every anchor must match EXACTLY ONCE or the script throws,
// and an edit whose insertion is already present is skipped, so a re-run is safe.
//   node scripts/wire-topple.mjs <dir>
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

const TAG = 'Roll the block onto the spring';
const TAGLONG = 'Tip a tall block end over end and land it on the spring';
const HOW = 'Every roll tips the block over an edge. Land it on the spring: standing on a one-tile spring, lying flat across a two-tile one. Fall off or stand on an orange tile and you start over.';
const BLURB = 'A tall block on a floor of tiles. Tip it end over end and land it on the spring in as few rolls as you can, minding the tiles that crack.';
const COLOR = '#3f6212', NAVY = '#bef264', BG = '#ecfccb', BORDER = 'rgba(63,98,18,0.35)';

// 1. lib/daily-games.js: the row and the premiere
afterLine('lib/daily-games.js', "{ key: 'junkyard', keepsAnswer: true,", [
  `  { key: 'topple', keepsAnswer: true, attempts: 'graded', miss: 'Tries', name: 'Topple', cat: 'Logic', tag: '${TAG}', tagLong: '${TAGLONG}', how: '${HOW}', color: '${COLOR}', colorNavy: '${NAVY}' },`]);
sub('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n  { key: 'topple', from: '2026-10-20', until: '2026-10-24' },\n`);

// 2. lib/sunday-editions.js
afterLine('lib/sunday-editions.js', '//   junkyard a perfect line of 44 and up', [
  '//   topple   a bigger board, a perfect line of 30 to 38 rolls against 15 to 28 on weekdays']);
sub('lib/sunday-editions.js', `'impound', 'junkyard', 'snug',`, `'impound', 'junkyard', 'topple', 'snug',`);

// 3. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['gram', `, `const LAUNCH_PIN = { keys: ['topple', 'gram', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['gram', `, `const LAUNCH_PIN = { keys: ['topple', 'gram', `);
afterLine('app/DailyEndCard.jsx', "  junkyard: { accent: '#5c3a16', badgeBg: '#5c3a16', badgeInk: T.white, Fin: Boxes },", [
  `  topple: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: Trophy },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'junkyard',   cat: 'logic',", [
  `  { key: 'topple',     cat: 'logic',     name: 'Topple', tag: '${TAG}',     blurb: '${BLURB}', href: '/topple' },`]);

// 4. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'junkyard', href: '/junkyard'", [
  `  { key: 'topple', href: '/topple', name: 'Topple', tag: 'roll the block onto the spring', store: 'sot_topple_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'junkyard', href: '/junkyard'", [
  `  { key: 'topple', href: '/topple', name: 'Topple', tag: '${TAG}', img: '/games/btn-topple.png' },`]);
sub('app/DailyGamesGrid.jsx', `'park', 'impound', 'junkyard', 'snug',`, `'park', 'impound', 'junkyard', 'topple', 'snug',`);
afterLine('app/DailyStrip.jsx', "{ key: 'junkyard', href: '/junkyard'", [
  `  { key: 'topple', href: '/topple', name: 'Topple', img: '/games/btn-topple.png', store: 'sot_topple_day', tag: "${TAG}" , cat: 'Logic' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { gram: `, `const ACCENTS = { topple: '${NAVY}', gram: `);
sub('app/DailyStrip.jsx', `const TCOL = { gram: `, `const TCOL = { topple: '${COLOR}', gram: `);

// 5. archive
sub('app/archive/page.js', `import { PUZZLES as JUNKYARD_FULL } from '../junkyard/puzzles';`,
  `import { PUZZLES as JUNKYARD_FULL } from '../junkyard/puzzles';\nimport { PUZZLES as TOPPLE_FULL } from '../topple/puzzles';`);
afterLine('app/archive/page.js', 'const JUNKYARD = JUNKYARD_FULL.map(', [
  'const TOPPLE = TOPPLE_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));']);
afterLine('app/archive/page.js', "{ key: 'junkyard', name: 'Junkyard', path: '/junkyard'", [
  `  { key: 'topple', name: 'Topple', path: '/topple', tag: '${TAG}', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: TOPPLE },`]);

// 6. the four puzzle-map registries
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_junkyard } from '@/app/junkyard/puzzles';`,
    `import { PUZZLES as P_junkyard } from '@/app/junkyard/puzzles';\nimport { PUZZLES as P_topple } from '@/app/topple/puzzles';`);
  sub(f, `junkyard: P_junkyard, snug: P_snug,`, `junkyard: P_junkyard, topple: P_topple, snug: P_snug,`);
}

// 7. alternations, rails, catalog, loft
sub('app/api/quiz/daily-status/route.js', `|junkyard|snug|`, `|junkyard|topple|snug|`);
sub('app/quizzes/QuizHomeClient.jsx', `|junkyard|snug|`, `|junkyard|topple|snug|`);
sub('app/DailySlateRail.jsx', `'junkyard', 'snug',`, `'junkyard', 'topple', 'snug',`);
sub('lib/quiz-catalog.js', `'junkyard', 'snug',`, `'junkyard', 'topple', 'snug',`);
sub('lib/loft.js', `'impound', 'junkyard', 'snug',`, `'impound', 'junkyard', 'topple', 'snug',`);

// 8. skills, challenge metric, glyph
sub('lib/daily-skills.js', `  junkyard: ['spa', 'plan'], `, `  junkyard: ['spa', 'plan'], topple: ['spa', 'plan'], `);
sub('lib/challenge-metric.js', `  junkyard: { unit: 'moves', one: 'move', dir: 'low', solveFirst: true },`,
  `  junkyard: { unit: 'moves', one: 'move', dir: 'low', solveFirst: true },\n  topple: { unit: 'rolls', one: 'roll', dir: 'low', solveFirst: true },`);
afterLine('lib/game-glyphs.js', "  junkyard: 'M21 11V3H3v18h18v-5", [
  "  topple: 'M4 20h16M7 20V8h5v12M12 14h7v6M15 4l2 2-2 2',  // a block standing, one tipped over, and the turn between"]);

// 9. group and finish set. Topple is neither a traffic jam nor a sort, so it
// opens a new group with the two route puzzles, which leave Sorting puzzles.
sub('lib/daily-groups.js', `  { name: 'Sorting puzzles', cat: 'Logic', keys: ['jester', 'judges', 'chomp', 'paths', 'venn'] },`,
  `  { name: 'Sorting puzzles', cat: 'Logic', keys: ['jester', 'judges', 'venn'] },\n  { name: 'Roll and route', cat: 'Logic', keys: ['topple', 'chomp', 'paths'] },`);
sub('lib/finish-sets.js', `{ name: 'Slide and shift', cat: 'Logic', keys: ['chomp', 'park', 'junkyard'] },`, `{ name: 'Slide and shift', cat: 'Logic', keys: ['chomp', 'park', 'junkyard', 'topple'] },`);

// 9b. the set pages: Sorting puzzles is now three, Roll and route is new
const PS = 'lib/puzzle-sets.js';
sub(PS, `    title: 'Free Daily Sorting Puzzles: Queens, Star Battle, Routes, Networks and Set Logic | Mind Loft',
    h1: 'Free Daily Sorting Puzzles: Queens Placement, Two-Star Placement, Routes, Networks and Set Logic',
    description: 'Five free daily puzzles about putting things where they go: seat one jester per row, column and court with no two touching; seat two judges per row, column and court; find the route; wire every town for the least cost; and place twelve words across seven overlapping regions. New boards at midnight Eastern, no signup.',
    lede: 'Five puzzles about placement. Jesters is the queens puzzle with coloured courts. Judges is its two-per-row big sibling. Chomp eats a cast of mascots in order, and every square you touch stays yours. Paths links every town into one network for the least cost. Venn places twelve words across seven overlapping regions so every count adds up.',
    how: [
      'Jesters seats one jester per row, per column and per coloured court, with no two ever touching, on a board that grows through the week. Judges seats two per row, column and court, so a second judge in a row is right and only a third quarrels. Chomp is a route puzzle with no clock and nothing chasing you: the only things in your way are where you have already been. Paths gives you a set of towns and the cost of every link, and you build the cheapest network that reaches all of them. Venn is set logic drawn as circles.',
    ],
    faq: [
      ['How big do the boards get?', 'Jesters grows from 8x8 on Monday to an 11x11 Sunday Edition. Judges is 10x10 all week and 12x12 on Sunday.'],
      ['Are they free?', 'All five, every day, no account required.'],
    ],
  },`, `    title: 'Free Daily Sorting Puzzles: Queens, Star Battle and Set Logic | Mind Loft',
    h1: 'Free Daily Sorting Puzzles: Queens Placement, Two-Star Placement and Set Logic',
    description: 'Three free daily puzzles about putting things where they go: seat one jester per row, column and court with no two touching; seat two judges per row, column and court; and place twelve words across seven overlapping regions. New boards at midnight Eastern, no signup.',
    lede: 'Three puzzles about placement. Jesters is the queens puzzle with coloured courts. Judges is its two-per-row big sibling. Venn places twelve words across seven overlapping regions so every count adds up.',
    how: [
      'Jesters seats one jester per row, per column and per coloured court, with no two ever touching, on a board that grows through the week. Judges seats two per row, column and court, so a second judge in a row is right and only a third quarrels. Venn is set logic drawn as circles.',
    ],
    faq: [
      ['How big do the boards get?', 'Jesters grows from 8x8 on Monday to an 11x11 Sunday Edition. Judges is 10x10 all week and 12x12 on Sunday.'],
      ['Are they free?', 'All three, every day, no account required.'],
    ],
  },
  {
    name: 'Roll and route', slug: 'roll-and-route',
    eyebrow: 'Free daily route and block rolling puzzles',
    title: 'Free Daily Route Puzzles: Block Rolling, Eat in Order, Cheapest Network | Mind Loft',
    h1: 'Free Daily Route Puzzles: Block Rolling, Eat in Order and the Cheapest Network',
    description: 'Three free daily puzzles about finding the way: roll a tall block onto the spring, eat a cast of mascots in order, and wire every town for the least cost. New boards at midnight Eastern, no signup.',
    lede: 'Three puzzles where the answer is a route. Topple tips a tall block end over end until it lands on the spring. Chomp eats a cast of mascots in order, and every square you touch stays yours. Paths links every town into one network for the least cost.',
    how: [
      'Topple is the block rolling puzzle: every roll tips the block over an edge, a one-tile spring takes it standing and a two-tile spring takes it lying flat, and every board is solved exactly so par is real. Chomp is a route puzzle with no clock and nothing chasing you: the only things in your way are where you have already been. Paths gives you a set of towns and the cost of every link, and you build the cheapest network that reaches all of them.',
    ],
    faq: [
      ['Is there a best answer?', 'Yes. Topple and Paths measure you against a proven minimum, found by search before the board ships.'],
      ['Are they free?', 'All three, every day, no account required.'],
    ],
  },`);

// 10. the logic-puzzles page
const PC = 'lib/puzzle-categories.js';
sub(PC, `description: 'Twenty-four free daily logic puzzles: a daily jigsaw,`, `description: 'Twenty-five free daily logic puzzles: a daily jigsaw,`);
sub(PC, `three sizes of sliding block puzzle, whodunit deduction grids,`, `three sizes of sliding block puzzle, a block rolling puzzle, whodunit deduction grids,`);
sub(PC, `lede: 'Twenty-four logic puzzles with one new board apiece every day`, `lede: 'Twenty-five logic puzzles with one new board apiece every day`);
sub(PC, `a sliding block puzzle in three sizes) alongside`, `a sliding block puzzle in three sizes, a block you roll end over end) alongside`);
sub(PC, `'park', 'impound', 'junkyard', 'paths', 'jester',`, `'park', 'impound', 'junkyard', 'topple', 'paths', 'jester',`);
sub(PC, `junkyard: 'Sliding block puzzle (largest board)', paths:`, `junkyard: 'Sliding block puzzle (largest board)', topple: 'Block rolling puzzle', paths:`);
sub(PC, `and Impound and Junkyard are the same puzzle on bigger lots.'`, `and Impound and Junkyard are the same puzzle on bigger lots. Topple is the block rolling puzzle: tip a tall block end over end and land it on the spring, standing on a one-tile spring or lying flat across a two-tile one.'`);
sub(PC, `Snug lays eight pieces on a 7x7, Alibi`, `Snug lays eight pieces on a 7x7, Topple rolls a bigger board, Alibi`);
sub(PC, `['Are they free?', 'All twenty-four, every day, no account required.'],\n    ],\n  },`, `['Are they free?', 'All twenty-five, every day, no account required.'],\n    ],\n  },`);

// 11. CLAUDE.md
afterLine('CLAUDE.md', '| Arcos | five- and six-letter hidden words', [
  '| Topple | a bigger board with a perfect line of 30 to 38 rolls, against 15 to 28 on weekdays (from launch, 2026-10-25) |']);
{
  const src = rd('CLAUDE.md');
  const marker = '## Topple (`/topple`): the daily block-rolling puzzle (launched 2026-10-20)';
  if (!src.includes(marker)) {
    wr('CLAUDE.md', src.replace(/\s*$/, '\n') + `
${marker}

Owner, 2026-10-19: "a block rolling clone of Bloxorz", Logic, scored on moves against par. Key/route
\`topple\`, category **Logic**, \`miss: 'Tries'\`, legacy accent \`#3f6212\` / \`#bef264\`. On the stage it
wears the Logic ramp (the block is \`--stg-acc\`). Wired by \`scripts/wire-topple.mjs\` (beside Junkyard).
Skills Spatial and Planning. Daily group Roll and route (new, with Chomp and Paths, which left Sorting
puzzles), finish set Slide and shift.

- **The rules** (\`lib/topple-engine.js\`, shared by client and generator): a 1x1x2 block, four rolls, each a
  quarter turn over an edge. Any part over empty space: it falls, back to the start. Standing on an orange
  FRAGILE tile: it cracks, back to the start. **No switches and no bridges** (owner, 2026-10-19).
- **The goal is a SPRING, not a hole** (owner, 2026-10-19): it fires the block off the top of the board. A
  spring is ONE tile (land standing) or TWO side by side (land LYING FLAT across both). Monday is always one
  tile; other days about half and half off the date's seed.
- **Scoring is Parker's** (\`lib/par.js\`): \`perfect\` is the exact BFS minimum and scores 10, par is
  a cushion above it and scores 8. **Every roll counts**, including those before a fall and a restart (a
  restart is an \`'X'\` in the move list, not a roll): a fall is the only undo, so a free one would let a
  player search the board by hand. Give up posts 0. One free hint on a first play lights the next roll.
- **The bank is GROWN** by \`scripts/gen-topple.mjs\` (deterministic off the date; extend with
  \`--until <date> --append --write\`): rooms and corridors, then a hill climb for a longer perfect line,
  more reachable positions and a blocky floor; fragile tiles must change the answer; dead floor is trimmed.
  Ramp: Mon plain 12-16, Tue 14-18, Wed 16-20, Thu 18-23, Fri 20-25, Sat 22-28, Sunday Edition 30-38 on a
  bigger board. \`scripts/verify-topple.mjs\` re-solves every board with an INDEPENDENT cube-rotation solver.
  Bank 2026-10-20 to 2027-01-31.
- **The board** (\`app/topple/ToppleBoard.jsx\`) is a canvas in a three-quarter view where up on the screen
  is up on the board (the isometric mockup made the arrow keys read as diagonals). Colours are stage tokens
  resolved through a hidden probe at draw time, so it follows the light switch. Arrows/WASD, swipe, or the pad.
`);
    applied++;
  } else skipped++;
}

console.log(`wire-topple: ${applied} edits applied, ${skipped} already present`);
