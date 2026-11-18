// scripts/wire-bot-peg.mjs: wires Bot (the daily programming puzzle, Logic) and
// Peg (the daily peg solitaire, Table Games) into every registry in one pass
// (owner, 2026-11-18: "build and implement both"). Placement follows "Placing a
// new daily" in docs/claude/daily-authoring.md.
//
// BOT, Logic: skills Planning and Deduction. Ranked on commands then the clock
// (guesses_used is the command count of the winning program), a solve 10 and a
// give-up 0, so SOLVE_ONLY. Group Grid filling (four become five, with its set
// page), finish set Planning ahead. Sunday Edition: P2 and P3 on a bigger board.
// PEG, Table Games: skills Planning and Spatial. Ranked on jumps (undone ones
// included) then the clock, SOLVE_ONLY. Group Solitaire and poker (Hold moves
// to Card tables, so both stay at five), finish set Solitaire and cribbage.
// Sunday Edition: 24 to 30 pegs.
// Both premiere 11-18 to 11-25 behind Machine and Crate, and both fight a
// challenge on their count, not the clock.
//
// Anchored: every anchor must match EXACTLY ONCE or the script throws, and an
// edit whose replacement is already present is skipped.
//   node scripts/wire-bot-peg.mjs <dir>
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

const BOT = { key: 'bot', name: 'Bot', cat: 'Logic', endCat: 'logic', miss: 'Commands', tag: 'Program the robot to light every lamp', promo: 'program the robot to light every lamp', tagLong: 'Write a short program that walks a robot to every lamp and switches it on',
  how: 'A robot on a small 3D board of tiles, and a program to write: Forward, Jump, Left, Right and Light up, in a Main row and a P1 row that can call itself. Light up switches on the lamp underfoot; switch on every lamp. Runs are free, and the program that finishes is the score: fewest commands, then the clock. Weekday par is the fewest possible.',
  blurb: 'Write a short program that walks a robot round a 3D board and switches on every lamp. Runs are free; fewest commands wins.',
  short: 'Program a robot to switch on every lamp.',
  color: '#be123c', navy: '#fda4af', bg: '#ffe4e6', border: 'rgba(190,18,60,0.35)', after: { reg: "{ key: 'dash', miss: 'Dollars short'", end: "{ key: 'dash', cat: 'logic'", promo: "{ key: 'dash', href: '/dash'" } };
const PEG = { key: 'peg', name: 'Peg', cat: 'Table Games', endCat: 'endgame', miss: 'Jumps', tag: 'The daily peg solitaire', promo: 'the daily peg solitaire', tagLong: 'Jump pegs off the cross board until one is left, in the center',
  how: 'The classic 33-hole cross board with a different starting shape every day. A peg jumps over a neighbor into the empty hole beyond, and the jumped peg comes off. Leave one peg, in the center hole. Every jump counts, Undo included, so the best possible is one fewer than the pegs. Ranked on jumps, then the clock.',
  blurb: 'Peg solitaire on the classic cross board. Jump pegs off until one is left, in the center hole. Every jump counts.',
  short: 'Jump pegs off until one is left, in the center.',
  color: '#1d6b4f', navy: '#86efac', bg: '#e6f2ec', border: 'rgba(29,107,79,0.35)', after: { reg: "{ key: 'taire', keepsAnswer: true, attempts: 'graded'", end: "{ key: 'taire',  cat: 'endgame'", promo: "{ key: 'taire', href: '/taire'" } };

for (const g of [BOT, PEG]) {
  // 1. registry row, premiere
  afterLine('lib/daily-games.js', g.after.reg, [
    `  { key: '${g.key}', miss: '${g.miss}', name: '${g.name}', cat: '${g.cat}', tag: '${g.tag}', tagLong: '${g.tagLong}', how: '${g.how}', color: '${g.color}', colorNavy: '${g.navy}' },`]);
  afterLine('lib/daily-games.js', "{ key: 'crate', from: '2026-11-18', until: '2026-11-25' },", [`  { key: '${g.key}', from: '2026-11-18', until: '2026-11-25' },`]);
  // 2. end card
  afterLine('app/DailyEndCard.jsx', "  crate: { accent: '#a16207', badgeBg: '#a16207', badgeInk: T.white, Fin: Trophy },", [
    `  ${g.key}: { accent: '${g.color}', badgeBg: '${g.color}', badgeInk: T.white, Fin: Trophy },`]);
  afterLine('app/DailyEndCard.jsx', g.after.end, [
    `  { key: '${g.key}', cat: '${g.endCat}', name: '${g.name}', tag: '${g.tag}', blurb: '${g.blurb}', href: '/${g.key}' },`]);
  // 3. promo, grid, strip
  afterLine('app/DailyGamesPromo.jsx', g.after.promo, [
    `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.promo}', store: 'sot_${g.key}_day', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}' },`]);
  afterLine('app/DailyGamesGrid.jsx', "{ key: 'crate', href: '/crate', name: 'Crate'", [
    `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.tag}', img: '/games/btn-${g.key}.png' },`]);
  afterLine('app/DailyStrip.jsx', "{ key: 'crate', href: '/crate', name: 'Crate'", [
    `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', img: '/games/btn-${g.key}.png', store: 'sot_${g.key}_day', tag: "${g.tag}" , cat: '${g.cat}' },`]);
  // 4. archive
  const UP = g.key.toUpperCase();
  sub('app/archive/page.js', `import { PUZZLES as CRATE_FULL } from '../crate/puzzles';`,
    `import { PUZZLES as CRATE_FULL } from '../crate/puzzles';\nimport { PUZZLES as ${UP}_FULL } from '../${g.key}/puzzles';`);
  afterLine('app/archive/page.js', 'const CRATE = CRATE_FULL.map(', [
    `const ${UP} = ${UP}_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`]);
  afterLine('app/archive/page.js', "{ key: 'crate', name: 'Crate', path: '/crate'", [
    `  { key: '${g.key}', name: '${g.name}', path: '/${g.key}', tag: '${g.tag}', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}', src: ${UP} },`]);
  // 5. the daily puzzle maps and the Sunday slate
  for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
    sub(f, `import { PUZZLES as P_crate } from '@/app/crate/puzzles';`,
      `import { PUZZLES as P_crate } from '@/app/crate/puzzles';\nimport { PUZZLES as P_${g.key} } from '@/app/${g.key}/puzzles';`);
  }
  afterLine('lib/daily-difficulty.js', '  crate: 3, // a starting estimate', [`  ${g.key}: 3, // a starting estimate (2026-11-18) until a week of plays rates it`]);
  afterLine('lib/game-blurbs.js', '  crate: "', [`  ${g.key}: "${g.short}",`]);
}
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) sub(f, `crate: P_crate, `, `crate: P_crate, bot: P_bot, peg: P_peg, `);
sub('lib/daily-games.js', `'machine', 'crate', 'fill',`, `'machine', 'crate', 'bot', 'peg', 'fill',`);
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['crate', `, `const LAUNCH_PIN = { keys: ['bot', 'peg', 'crate', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['crate', `, `const LAUNCH_PIN = { keys: ['bot', 'peg', 'crate', `);
sub('app/DailyGamesGrid.jsx', `'errands', 'dash', `, `'errands', 'dash', 'bot', `);
sub('app/DailyGamesGrid.jsx', `label: 'Table Games', keys: ['taire', `, `label: 'Table Games', keys: ['taire', 'peg', `);
sub('app/DailyStrip.jsx', `const ACCENTS = { crate: `, `const ACCENTS = { bot: '${BOT.navy}', peg: '${PEG.navy}', crate: `);
sub('app/DailyStrip.jsx', `const TCOL = { crate: `, `const TCOL = { bot: '${BOT.color}', peg: '${PEG.color}', crate: `);
sub('lib/sunday-editions.js', `'machine', 'crate', `, `'machine', 'crate', 'bot', 'peg', `);
afterLine('lib/sunday-editions.js', '//   crate   five crates', [
  '//   bot     P2 and P3 rows on a bigger board (up to 7 x 7, five to eight lamps)',
  '//   peg     24 to 30 pegs, against about ten on Monday and Tuesday']);

// 6. alternations, rails, catalog, loft
sub('app/api/quiz/daily-status/route.js', `|machine|crate|`, `|machine|crate|bot|peg|`);
sub('app/quizzes/QuizHomeClient.jsx', `|machine|crate|`, `|machine|crate|bot|peg|`);
for (const f of ['app/DailySlateRail.jsx', 'lib/quiz-catalog.js', 'lib/loft.js']) sub(f, `'machine', 'crate', `, `'machine', 'crate', 'bot', 'peg', `);

// 7. skills, glyphs, preview drawings
sub('lib/daily-skills.js', `crate: ['spa', 'plan'], `, `crate: ['spa', 'plan'], bot: ['plan', 'ded'], peg: ['plan', 'spa'], `);
afterLine('lib/game-glyphs.js', "  crate: 'M4 9h8v8H4z", [
  "  bot: 'M7 9h10v9H7zM9 6h6v3M12 3v3M10 13h.01M14 13h.01M4 21h16',  // the robot: a box body, a head, an antenna, two eyes, on the floor",
  "  peg: 'M12 3v4M12 17v4M3 12h4M17 12h4M12 10a2 2 0 1 0 0 4a2 2 0 1 0 0-4',  // the cross board: four arms and the center peg"]);
for (const f of ['app/GamePreviewTiles.jsx', 'app/GamePreview.jsx']) {
  if (!/\nconst Bot = /.test(rd(f))) sub(f, `const Crate = () => (\n`, `// Bot: a robot on a raised tile beside a lit lamp and a dark one
const Bot = () => (
  <g><rect x={104} y={56} width={36} height={22} rx={3} className="w" /><rect x={112} y={30} width={20} height={22} rx={6} className="m" /><circle cx={118} cy={40} r={2.5} className="d" /><circle cx={126} cy={40} r={2.5} className="d" />
    <circle cx={160} cy={62} r={9} className="s3" /><circle cx={186} cy={62} r={9} className="s2" /></g>
);
// Peg: a few pegs on the arm of the cross board, one in the center
const Peg = () => (
  <g><circle cx={110} cy={56} r={9} className="m" /><circle cx={132} cy={56} r={9} className="m" /><circle cx={154} cy={56} r={6} className="w" /><circle cx={176} cy={56} r={9} className="m" /><circle cx={154} cy={34} r={9} className="m" /><circle cx={154} cy={78} r={6} className="w" /></g>
);
const Crate = () => (\n`);
  sub(f, `machine: Machine, crate: Crate, `, `machine: Machine, crate: Crate, bot: Bot, peg: Peg, `);
}

// 8. groups and finish sets
sub('lib/daily-groups.js', `{ name: 'Grid filling', cat: 'Logic', keys: ['duet', 'lamps', 'snug', 'connect'] },`, `{ name: 'Grid filling', cat: 'Logic', keys: ['duet', 'lamps', 'snug', 'connect', 'bot'] },`);
sub('lib/daily-groups.js', `{ name: 'Solitaire and poker', cat: 'Table Games', keys: ['taire', 'cell', 'mahj', 'hold', 'hands'] },`, `{ name: 'Solitaire and poker', cat: 'Table Games', keys: ['taire', 'cell', 'peg', 'mahj', 'hands'] },`);
sub('lib/daily-groups.js', `{ name: 'Card tables', cat: 'Table Games', keys: ['shoe', 'crib', 'finesse', 'pairs'] },`, `{ name: 'Card tables', cat: 'Table Games', keys: ['shoe', 'hold', 'crib', 'finesse', 'pairs'] },`);
sub('lib/finish-sets.js', `{ name: 'Planning ahead', cat: 'Logic', keys: ['chef', 'mop', 'connect'] },`, `{ name: 'Planning ahead', cat: 'Logic', keys: ['chef', 'mop', 'connect', 'bot'] },`);
sub('lib/finish-sets.js', `{ name: 'Solitaire and cribbage', cat: 'Table Games', keys: ['taire', 'crib', 'shoe'] },`, `{ name: 'Solitaire and cribbage', cat: 'Table Games', keys: ['taire', 'peg', 'crib', 'shoe'] },`);

// 9. the Grid filling set page: four become five
const PS = 'lib/puzzle-sets.js';
sub(PS, `title: 'Free Daily Grid Puzzles: Binary Grid, Light Up, Shape Fitting and Numberlink | Mind Loft',`, `title: 'Free Daily Grid Puzzles: Binary Grid, Light Up, Shapes, Numberlink, Robot | Mind Loft',`);
sub(PS, `h1: 'Free Daily Grid Puzzles: a Binary Grid, a Light-Up Puzzle, Shape Fitting and Numberlink',`, `h1: 'Free Daily Grid Puzzles: a Binary Grid, a Light-Up Puzzle, Shape Fitting, Numberlink and a Robot to Program',`);
sub(PS, `description: 'Four free daily puzzles where you fill the board: a dots-and-rings binary grid, a light-up puzzle, a shape-fitting puzzle with exactly one way in, and a dot-joining numberlink.`, `description: 'Five free daily puzzles where you fill the board: a dots-and-rings binary grid, a light-up puzzle, a shape-fitting puzzle with exactly one way in, a dot-joining numberlink, and a robot you program to light every lamp.`);
sub(PS, `lede: 'Four puzzles where the board starts nearly empty and you fill it.`, `lede: 'Five puzzles where the board starts nearly empty and you fill it.`);
sub(PS, `Connect joins pairs of matching dots until every square is used.',`, `Connect joins pairs of matching dots until every square is used. Bot writes a short program that walks a robot to every lamp and switches it on.',`);
sub(PS, `['How big do they get?', 'Bigger through the week. Duet and Lamps run 10x10 on Sunday, Snug lays eight pieces on a 7x7, and Connect runs 12x12.'],\n      ['Are they free?', 'All four, every day, no account required.'],`,
  `['How big do they get?', 'Bigger through the week. Duet and Lamps run 10x10 on Sunday, Snug lays eight pieces on a 7x7, Connect runs 12x12, and Bot adds P2 and P3 rows on a bigger board.'],\n      ['Are they free?', 'All five, every day, no account required.'],`);

// 10. the category pages
const PC = 'lib/puzzle-categories.js';
// Logic: twenty-nine become thirty
sub(PC, `description: 'Twenty-nine free daily logic puzzles: a nonogram,`, `description: 'Thirty free daily logic puzzles: a nonogram,`);
sub(PC, `a dot-joining numberlink, a mop-every-tile route puzzle,`, `a dot-joining numberlink, a robot programming puzzle, a mop-every-tile route puzzle,`);
sub(PC, `lede: 'Twenty-nine logic puzzles with one new board apiece every day.`, `lede: 'Thirty logic puzzles with one new board apiece every day.`);
sub(PC, `plus a restaurant kitchen to run against the clock on the wall.`, `plus a restaurant kitchen to run against the clock on the wall and a robot to program.`);
sub(PC, `'connect', 'mop', 'mow', 'plow', 'chef', 'seated', 'bag', 'errands', 'dash', 'jester',`, `'connect', 'mop', 'mow', 'plow', 'chef', 'seated', 'bag', 'errands', 'dash', 'bot', 'jester',`);
sub(PC, `dash: 'Delivery puzzle', defuse:`, `dash: 'Delivery puzzle', bot: 'Robot programming puzzle (Light-bot style)', defuse:`);
sub(PC, `Dash is a delivery puzzle: one evening shift, more orders than there is time for, and tips that shrink when an order runs late.`, `Dash is a delivery puzzle: one evening shift, more orders than there is time for, and tips that shrink when an order runs late. Bot is a programming puzzle: write a short program of Forward, Jump, turns and Light up, with a P1 row that can call itself, so a robot switches on every lamp on a little 3D board.`);
sub(PC, `Dash is ten restaurants and a two-hour shift, Alibi`, `Dash is ten restaurants and a two-hour shift, Bot adds P2 and P3 on a bigger board, Alibi`);
sub(PC, `['Are they free?', 'All twenty-nine, every day, no account required.'],`, `['Are they free?', 'All thirty, every day, no account required.'],`);
// Table Games: nineteen become twenty
sub(PC, `description: 'Nineteen free daily card and board games with the same deal or position for everyone: nine card and tile games (solitaire, FreeCell, mahjong solitaire, Concentration, poker solitaire, video poker, blackjack, cribbage and double dummy bridge) and ten endgames`,
  `description: 'Twenty free daily card and board games with the same deal or position for everyone: nine card and tile games (solitaire, FreeCell, mahjong solitaire, Concentration, poker solitaire, video poker, blackjack, cribbage and double dummy bridge), a peg solitaire, and ten endgames`);
sub(PC, `lede: 'Nineteen games from the card table and the game board, one new deal or position apiece every day. The nine card and tile games give everybody the same deal, which is what makes a leaderboard possible in games that are usually about luck.`,
  `lede: 'Twenty games from the card table and the game board, one new deal or position apiece every day. The nine card and tile games give everybody the same deal, which is what makes a leaderboard possible in games that are usually about luck. Peg is the classic peg solitaire, from a new starting shape each day.`);
sub(PC, `keys: ['taire', 'cell', 'mahj', 'pairs', 'hands', 'hold', 'shoe', 'crib', 'finesse', 'mate', 'defend',`, `keys: ['taire', 'cell', 'peg', 'mahj', 'pairs', 'hands', 'hold', 'shoe', 'crib', 'finesse', 'mate', 'defend',`);
sub(PC, `      taire: 'Solitaire', mahj: 'Mahjong solitaire', pairs: 'Concentration (memory)', hands: 'Poker solitaire', shoe: 'Blackjack, fixed shoe', crib: 'Cribbage discard', hold: 'Video poker', cell: 'FreeCell', finesse: 'Double dummy bridge',\n      mate:`,
  `      taire: 'Solitaire', peg: 'Peg solitaire', mahj: 'Mahjong solitaire', pairs: 'Concentration (memory)', hands: 'Poker solitaire', shoe: 'Blackjack, fixed shoe', crib: 'Cribbage discard', hold: 'Video poker', cell: 'FreeCell', finesse: 'Double dummy bridge',\n      mate:`);
sub(PC, `and Finesse is a double dummy bridge problem with all four hands face up.',`, `and Finesse is a double dummy bridge problem with all four hands face up. Peg is peg solitaire on the 33-hole cross board: jump pegs off until one is left, in the center.',`);
sub(PC, `['Are they free?', 'All nineteen, every day, no account required.'],\n    ],\n  },\n  {\n    slug: 'chess-puzzles',`, `['Are they free?', 'All twenty, every day, no account required.'],\n    ],\n  },\n  {\n    slug: 'chess-puzzles',`);

// 11. share cards kept by a full re-bake; challenges on the count
sub('lib/og-stage-cards.js', `'machine', 'crate', `, `'machine', 'crate', 'bot', 'peg', `);
afterLine('lib/challenge-metric.js', "  crate: { unit: 'moves', one: 'move', dir: 'low', solveFirst: true, field: 'guesses' },", [
  "  bot: { unit: 'commands', one: 'command', dir: 'low', solveFirst: true, field: 'guesses' },",
  "  peg: { unit: 'jumps', one: 'jump', dir: 'low', solveFirst: true, field: 'guesses' },"]);

// 12. Peg is a board game, not a card game, in the FAQ's sentences
sub('lib/game-seo.js', `case 'Table Games': return isEndGame(key) ? 'endgame puzzle' : 'card game';`, `case 'Table Games': return isEndGame(key) ? 'endgame puzzle' : key === 'peg' ? 'board game' : 'card game';`);

console.log(`wire-bot-peg: ${applied} edits applied, ${skipped} already present`);
