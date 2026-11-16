// scripts/wire-dash.mjs: wires Dash (the daily delivery puzzle, Logic, owner
// 2026-11-15) into every registry in one pass, beside Errands.
// Placement follows "Placing a new daily" in docs/claude/daily-authoring.md.
//
// Skills: Planning and Mental Math. Ending a shift with a delivery is 10 and a
// give-up 0, so it is in SOLVE_ONLY; dollars short of the best possible shift are
// the miss column (lower first), then the clock.
// IT RUNS A SUNDAY EDITION (the Big Night: ten restaurants, two hours, a bag of
// three, the biggest town).
// SETS: Everyday puzzles was full at five, so it is split in two: Everyday puzzles
// keeps the three at home (Seated, Chef, Mop) and a new set, Around town puzzles, takes
// Bag, Errands and Dash. Finish set: On the clock (Dash, Errands, Chef).
//
// Anchored: every anchor must match EXACTLY ONCE or the script throws, and an
// edit whose replacement is already present is skipped. DO NOT RE-RUN IT after a
// drawing or a line it wrote has been changed by hand (see the 2026-11-15 note in
// docs/claude/games-other.md: a re-run of wire-errands broke a build).
//   node scripts/wire-dash.mjs <dir>
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

const g = { key: 'dash', name: 'Dash', tag: 'Too many orders, make the most in tips', promo: 'too many orders, make the most in tips', tagLong: 'Drive one delivery shift with more orders than you can carry and finish with the most in tips',
  how: 'A town of streets seen from above, restaurants with orders waiting and a door for each. There is never time to deliver them all. Tap an order to pick it up and again to drop it off. Every block and every stop costs minutes, the bag holds two, and a tip shrinks once the food goes cold. Each order shows when you would arrive and what it would pay. Trying a plan costs nothing; End Shift commits the night. You are ranked on dollars short of the best possible shift. The town grows from five orders on Monday to ten restaurants on Sunday.',
  blurb: 'One shift, too many orders and a bag that holds two. Choose what to carry and make the most in tips.',
  short: 'Drive a delivery shift and make the most in tips.',
  color: '#be123c', navy: '#fda4af', bg: '#ffe4e6', border: 'rgba(190,18,60,0.4)' };

// 1. lib/daily-games.js
afterLine('lib/daily-games.js', "{ key: 'errands', miss: 'Minutes behind', name: 'Errands',", [
  `  { key: '${g.key}', miss: 'Dollars short', name: '${g.name}', cat: 'Logic', tag: '${g.tag}', tagLong: '${g.tagLong}', how: '${g.how}', color: '${g.color}', colorNavy: '${g.navy}' },`]);
sub('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n  { key: 'dash', from: '2026-11-15', until: '2026-11-20' },\n`);
sub('lib/daily-games.js', `'spin', 'connect', 'mop', 'chef', 'seated', 'bag', 'errands', 'pack', 'fill',`, `'spin', 'connect', 'mop', 'chef', 'seated', 'bag', 'errands', 'dash', 'pack', 'fill',`);
sub('lib/daily-row-stats.js', `  'Minutes behind': 'minute behind',\n`, `  'Minutes behind': 'minute behind',\n  'Dollars short': 'dollar short',\n`);

// 2. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['errands', `, `const LAUNCH_PIN = { keys: ['dash', 'errands', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['errands', `, `const LAUNCH_PIN = { keys: ['dash', 'errands', `);
afterLine('app/DailyEndCard.jsx', "  errands: { accent: '#be123c', badgeBg: '#be123c', badgeInk: T.white, Fin: Trophy },", [
  `  ${g.key}: { accent: '${g.color}', badgeBg: '${g.color}', badgeInk: T.white, Fin: Trophy },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'errands', cat: 'logic', name: 'Errands',", [
  `  { key: '${g.key}', cat: 'logic', name: '${g.name}', tag: '${g.tag}', blurb: '${g.blurb}', href: '/${g.key}' },`]);

// 3. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'errands', href: '/errands'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.promo}', store: 'sot_${g.key}_day', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'errands', href: '/errands'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.tag}', img: '/games/btn-${g.key}.png' },`]);
sub('app/DailyGamesGrid.jsx', `'mop', 'chef', 'seated', 'bag', 'errands', 'duet', 'lamps',`, `'mop', 'chef', 'seated', 'bag', 'errands', 'dash', 'duet', 'lamps',`);
afterLine('app/DailyStrip.jsx', "{ key: 'errands', href: '/errands'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', img: '/games/btn-${g.key}.png', store: 'sot_${g.key}_day', tag: "${g.tag}" , cat: 'Logic' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { errands: `, `const ACCENTS = { dash: '${g.navy}', errands: `);
sub('app/DailyStrip.jsx', `const TCOL = { errands: `, `const TCOL = { dash: '${g.color}', errands: `);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as ERRANDS_FULL } from '../errands/puzzles';`,
  `import { PUZZLES as ERRANDS_FULL } from '../errands/puzzles';\nimport { PUZZLES as DASH_FULL } from '../dash/puzzles';`);
afterLine('app/archive/page.js', 'const ERRANDS = ERRANDS_FULL.map(', [
  `const DASH = DASH_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`]);
afterLine('app/archive/page.js', "{ key: 'errands', name: 'Errands', path: '/errands'", [
  `  { key: '${g.key}', name: '${g.name}', path: '/${g.key}', tag: '${g.tag}', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}', src: DASH },`]);

// 5. the daily puzzle maps and the Sunday slate
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_errands } from '@/app/errands/puzzles';`,
    `import { PUZZLES as P_errands } from '@/app/errands/puzzles';\nimport { PUZZLES as P_dash } from '@/app/dash/puzzles';`);
  sub(f, `errands: P_errands, `, `errands: P_errands, dash: P_dash, `);
}
sub('lib/sunday-editions.js', `'mop', 'chef', 'seated', 'bag', 'errands', 'pack', 'duet', 'lamps', 'clade',`, `'mop', 'chef', 'seated', 'bag', 'errands', 'dash', 'pack', 'duet', 'lamps', 'clade',`);
afterLine('lib/sunday-editions.js', '//   errands the Big Day: eight stops', [
  '//   dash    the Big Night: ten restaurants, a two-hour shift and a bag of three in a town of seven by seven corners, against five to nine orders on the other days']);

// 6. alternations, rails, catalog, loft, families, starting difficulty
sub('app/api/quiz/daily-status/route.js', `|mop|chef|seated|bag|errands|pack|`, `|mop|chef|seated|bag|errands|dash|pack|`);
sub('app/quizzes/QuizHomeClient.jsx', `|mop|chef|seated|bag|errands|pack|`, `|mop|chef|seated|bag|errands|dash|pack|`);
for (const f of ['app/DailySlateRail.jsx', 'lib/quiz-catalog.js', 'lib/loft.js']) sub(f, `'mop', 'chef', 'seated', 'bag', 'errands', 'pack', 'duet',`, `'mop', 'chef', 'seated', 'bag', 'errands', 'dash', 'pack', 'duet',`);
sub('lib/daily-families.js', `'chef', 'seated', 'bag', 'errands'],`, `'chef', 'seated', 'bag', 'errands', 'dash'],`);
afterLine('lib/daily-difficulty.js', '  errands: 2, // a starting estimate (2026-11-15)', [`  ${g.key}: 2, // a starting estimate (2026-11-15) until a week of plays rates it`]);

// 7. skills, glyph, blurb, preview drawings
sub('lib/daily-skills.js', `errands: ['plan', 'math'], `, `errands: ['plan', 'math'], dash: ['plan', 'math'], `);
afterLine('lib/game-glyphs.js', "  errands: 'M6 20V9h7", [`  dash: 'M12 21s-6-5.7-6-10.5a6 6 0 0112 0C18 15.3 12 21 12 21zM12 7.2v6.6M13.9 8.9c-.4-.6-1-.9-1.9-.9-1 0-1.8.5-1.8 1.3 0 1.9 3.7.9 3.7 2.8 0 .8-.8 1.3-1.9 1.3-.8 0-1.5-.3-1.9-.9',  // a map pin with a dollar in it: a delivery worth making`]);
afterLine('lib/game-blurbs.js', '  errands: "', [`  ${g.key}: "${g.short}",`]);
// (checked by NAME, so a redrawn picture is never inserted twice)
if (!/\nconst Dash = /.test(rd('app/GamePreviewTiles.jsx'))) sub('app/GamePreviewTiles.jsx', `// three grocery bags side by side, filled to different heights`, `// a delivery run on a grid of streets: restaurants are circles, doors are squares
const Dash = () => (
  <g><path d="M112 22H184M112 46H184M112 70H184M124 10V82M148 10V82M172 10V82" className="sm3" /><path d="M124 22H172V70H148" className="s3" />
    <circle cx={124} cy={22} r={7.5} className="w" /><rect x={164.5} y={38.5} width={15} height={15} rx={3} className="d" /><circle cx={148} cy={70} r={7.5} className="w" /><rect x={116.5} y={62.5} width={15} height={15} rx={3} className="m" /></g>
);
// three grocery bags side by side, filled to different heights`);
sub('app/GamePreviewTiles.jsx', `bag: Bag, errands: Errands, pack: Pack, duet: Duet,`, `bag: Bag, errands: Errands, dash: Dash, pack: Pack, duet: Duet,`);
if (!/\nconst Dash = /.test(rd('app/GamePreview.jsx'))) sub('app/GamePreview.jsx', `// Bag: three items stacked in a bag, the lightest on top`, `// Dash: a delivery run, two restaurants (circles) and a door (a square)
const Dash = () => (
  <g><path d="M120 22h84v44h-44" className="s5" fill="none" /><circle cx={120} cy={22} r={8} className="m" /><circle cx={204} cy={44} r={8} className="m" />
    <rect x={152} y={58} width={16} height={16} rx={4} className="w" /></g>
);
// Bag: three items stacked in a bag, the lightest on top`);
sub('app/GamePreview.jsx', `bag: Bag, errands: Errands, pack: Pack, duet: Dots,`, `bag: Bag, errands: Errands, dash: Dash, pack: Pack, duet: Dots,`);

// 8. groups and finish sets: Everyday puzzles splits in two
sub('lib/daily-groups.js', `  { name: 'Everyday puzzles', cat: 'Logic', keys: ['seated', 'bag', 'errands', 'chef', 'mop'] },`,
  `  { name: 'Everyday puzzles', cat: 'Logic', keys: ['seated', 'chef', 'mop'] },\n  { name: 'Around town puzzles', cat: 'Logic', keys: ['bag', 'errands', 'dash'] },`);
sub('lib/daily-groups.js', `  // Logic (26)`, `  // Logic (27)`);
afterLine('lib/finish-sets.js', `{ name: 'Out and about', cat: 'Logic', keys: ['errands', 'chef', 'bag'] },`, [`  { name: 'On the clock', cat: 'Logic', keys: ['dash', 'errands', 'chef'] },`]);

// 9. the set pages: Everyday puzzles is rewritten for three, Around town is new
const PS = 'lib/puzzle-sets.js';
{
  const s = rd(PS), a = s.indexOf(`  {\n    name: 'Everyday puzzles', slug: 'everyday-puzzles',`), b = s.indexOf(`  {\n    name: 'Roll and route', slug: 'roll-and-route',`);
  if (s.includes(`name: 'Around town puzzles', slug: 'around-town'`)) skipped++;
  else {
    if (a < 0 || b < a) throw new Error('puzzle-sets: the Everyday puzzles record was not found');
    const block = `  {
    name: 'Everyday puzzles', slug: 'everyday-puzzles',
    eyebrow: 'Free daily real-life logic puzzles',
    title: 'Free Daily Everyday Puzzles: Seating Chart, Kitchen Timing and Mop the House | Mind Loft',
    h1: 'Free Daily Everyday Puzzles: Seating Chart, Kitchen Timing and Mop Every Tile',
    description: 'Three free daily logic puzzles taken from life at home: seat a room of guests so every request is met, fire the dishes of a kitchen so every table goes out hot, and mop every tile of a house exactly once. New boards at midnight Eastern, no signup.',
    lede: 'Three puzzles about jobs everyone knows. Seated hands you a guest list and a stack of requests, and exactly one way of sharing out the tables keeps everybody happy. Chef hands you a line of stations and a rail of tickets, and the order you fire the dishes in decides how long every table waits. Mop sends one mop through a house until every tile has been mopped exactly once.',
    how: [
      'Seated is a seating chart puzzle: tap a guest, tap a chair, and watch each request turn green or red. Guests ask to sit side by side, directly across, at the same table or at different tables, and some need a particular table. It is ranked on re-seats, the guests you had to move. Chef is a kitchen run one minute at a time: every dish needs its own station for a set number of minutes, an order leaves only when all of it is ready, and a finished dish that sits costs double. Mop is one unbroken route through a house drawn from above: every tile once, never back over a wet one, past the furniture and through the doorways, finishing at the door.',
    ],
    faq: [
      ['Is there one right answer?', 'Seated has exactly one way to share the guests between the tables, and Mop has a route that covers every tile. Chef has a best possible service, and you are scored on how close you come.'],
      ['Do they get harder through the week?', 'Yes. Seated grows from a dinner party at one table on Monday to a wedding reception of twenty on Sunday, Chef from four tickets to a twelve-ticket brunch, and Mop from one floor to a house on three.'],
      ['Are they free?', 'All three, every day, no account required.'],
    ],
  },
  {
    name: 'Around town puzzles', slug: 'around-town',
    eyebrow: 'Free daily errand and delivery puzzles',
    title: 'Free Daily Around Town Puzzles: Grocery Bagging, Route Planning and Delivery | Mind Loft',
    h1: 'Free Daily Around Town Puzzles: Grocery Bagging, Route Planning and a Delivery Shift',
    description: 'Three free daily logic puzzles about getting things done around town: bag a belt of groceries without crushing the eggs, plan a round of errands to be home soonest, and drive a delivery shift for the most in tips. New boards at midnight Eastern, no signup.',
    lede: 'Three puzzles set out of the house. Bag sends groceries down a belt, and heavy has to go low, eggs on top and cold together. Errands hands you a map and a list of stops, and the bank shuts before the cleaners open. Dash hands you an evening of delivery orders, more than there is time for, and every tip shrinks once the food goes cold.',
    how: [
      'Bag is a bagging puzzle: only the first few items on the belt are in reach, a bag holds four items and nine pounds, nothing may be crushed, and hot, cold and cleaning products each have a rule about who they share a bag with. Every bag turns green or red as soon as you pick something up. Errands is a route puzzle: tap the stops in the order you will drive them, with shops that shut, shops that open late and shopping that spoils, and you are ranked on minutes behind the soonest possible trip. Dash is a delivery puzzle: tap an order to pick it up and again to drop it off, with a bag that holds two, a clock that runs out and tips that fall a dollar for every two minutes the food is late. You are ranked on dollars short of the best possible shift.',
    ],
    faq: [
      ['Is there one right answer?', 'Bag can always be bagged with nothing coming back out. Errands has one order that is soonest home. Dash has a best possible total for the night, and you are scored on how close you come.'],
      ['Do they get harder through the week?', 'Yes. Bag grows from a corner shop of eight items to a big shop of eighteen, Errands from four stops to eight, and Dash from five orders in an hour to ten restaurants and a two-hour shift on Sunday.'],
      ['Are they free?', 'All three, every day, no account required.'],
    ],
  },
`;
    wr(PS, s.slice(0, a) + block + s.slice(b)); applied++;
  }
}

// 10. the logic-puzzles page: twenty-six become twenty-seven
const PC = 'lib/puzzle-categories.js';
sub(PC, `description: 'Twenty-six free daily logic puzzles:`, `description: 'Twenty-seven free daily logic puzzles:`);
sub(PC, `a grocery bagging puzzle, a route planning puzzle, two`, `a grocery bagging puzzle, a route planning puzzle, a delivery puzzle, two`);
sub(PC, `lede: 'Twenty-six logic puzzles with one new board apiece every day.`, `lede: 'Twenty-seven logic puzzles with one new board apiece every day.`);
sub(PC, `'mop', 'chef', 'seated', 'bag', 'errands', 'jester', 'judges', 'defuse',`, `'mop', 'chef', 'seated', 'bag', 'errands', 'dash', 'jester', 'judges', 'defuse',`);
sub(PC, `errands: 'Route planning puzzle', defuse:`, `errands: 'Route planning puzzle', dash: 'Delivery puzzle', defuse:`);
sub(PC, `so every opening hour is kept and you are home soonest. Jesters`, `so every opening hour is kept and you are home soonest. Dash is a delivery puzzle: one evening shift, more orders than there is time for, and tips that shrink once the food goes cold. Jesters`);
sub(PC, `Errands is eight stops round the biggest town, Alibi seats five suspects,`, `Errands is eight stops round the biggest town, Dash is ten restaurants and a two-hour shift, Alibi seats five suspects,`);
sub(PC, `['Are they free?', 'All twenty-six, every day, no account required.'],`, `['Are they free?', 'All twenty-seven, every day, no account required.'],`);

// 11. the hand-built share card is kept by a full re-bake, and its cut is the Details tile
sub('lib/og-stage-cards.js', `'pack', 'seated', 'bag', 'errands']);`, `'pack', 'seated', 'bag', 'errands', 'dash']);`);
sub('lib/share-tile.js', `'series', 'seated', 'errands',\n];`, `'series', 'seated', 'errands', 'dash',\n];`);

console.log(`wire-dash: ${applied} edits applied, ${skipped} already present`);
