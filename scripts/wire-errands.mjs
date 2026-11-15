// scripts/wire-errands.mjs: wires Errands (the daily route-planning puzzle, Logic,
// owner 2026-11-15) into every registry in one pass, beside Bag and Seated.
// Placement follows "Placing a new daily" in docs/claude/daily-authoring.md.
//
// Skills: Planning and Mental Math. Finishing a trip that keeps every rule is 10
// and a give-up 0, so it is in SOLVE_ONLY; minutes behind the soonest possible
// trip are the miss column (lower first), then the clock.
// IT RUNS A SUNDAY EDITION (the Big Day: eight stops, six rules, three blocks dug
// up, the biggest town). Sets: the fifth of Everyday puzzles, and a new finish
// set, Out and about, with Chef and Bag.
//
// Anchored: every anchor must match EXACTLY ONCE or the script throws, and an
// edit whose replacement is already present is skipped, so a re-run is safe.
//   node scripts/wire-errands.mjs <dir>
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

const g = { key: 'errands', name: 'Errands', tag: 'Plan the round, be home soonest', promo: 'plan the round, be home soonest', tagLong: 'Pick the order of your stops round town, keep every rule and be home as soon as you can',
  how: 'A town of streets seen from above, a list of stops and a few rules. A shop shuts at a set time, another opens late, something you buy has to be home before it spoils, and one stop has to come before another. Tap the stops in the order you will drive them. The route draws itself, the timetable fills in and each rule turns green or red. Trying an order costs nothing; Drive Home commits the trip. You are ranked on minutes behind the soonest possible trip. The town grows from four stops on Monday to eight on Sunday.',
  blurb: 'A map, a list of stops and a few awkward opening hours. Find the order that gets you home soonest.',
  short: 'Plan your stops and be home as soon as you can.',
  color: '#be123c', navy: '#fda4af', bg: '#ffe4e6', border: 'rgba(190,18,60,0.4)' };

// 1. lib/daily-games.js
afterLine('lib/daily-games.js', "{ key: 'bag', miss: 'Re-bags', name: 'Bag',", [
  `  { key: '${g.key}', miss: 'Minutes behind', name: '${g.name}', cat: 'Logic', tag: '${g.tag}', tagLong: '${g.tagLong}', how: '${g.how}', color: '${g.color}', colorNavy: '${g.navy}' },`]);
sub('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n  { key: 'errands', from: '2026-11-15', until: '2026-11-19' },\n`);
sub('lib/daily-games.js', `'spin', 'connect', 'mop', 'chef', 'seated', 'bag', 'pack', 'fill',`, `'spin', 'connect', 'mop', 'chef', 'seated', 'bag', 'errands', 'pack', 'fill',`);
sub('lib/daily-row-stats.js', `  'Re-bags': 're-bag',\n`, `  'Re-bags': 're-bag',\n  'Minutes behind': 'minute behind',\n`);

// 2. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['bag', `, `const LAUNCH_PIN = { keys: ['errands', 'bag', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['bag', `, `const LAUNCH_PIN = { keys: ['errands', 'bag', `);
afterLine('app/DailyEndCard.jsx', "  bag: { accent: '#be123c', badgeBg: '#be123c', badgeInk: T.white, Fin: Trophy },", [
  `  ${g.key}: { accent: '${g.color}', badgeBg: '${g.color}', badgeInk: T.white, Fin: Trophy },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'bag', cat: 'logic', name: 'Bag',", [
  `  { key: '${g.key}', cat: 'logic', name: '${g.name}', tag: '${g.tag}', blurb: '${g.blurb}', href: '/${g.key}' },`]);

// 3. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'bag', href: '/bag'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.promo}', store: 'sot_${g.key}_day', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'bag', href: '/bag'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.tag}', img: '/games/btn-${g.key}.png' },`]);
sub('app/DailyGamesGrid.jsx', `'snug', 'connect', 'mop', 'chef', 'seated', 'bag', 'duet', 'lamps',`, `'snug', 'connect', 'mop', 'chef', 'seated', 'bag', 'errands', 'duet', 'lamps',`);
afterLine('app/DailyStrip.jsx', "{ key: 'bag', href: '/bag'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', img: '/games/btn-${g.key}.png', store: 'sot_${g.key}_day', tag: "${g.tag}" , cat: 'Logic' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { bag: `, `const ACCENTS = { errands: '${g.navy}', bag: `);
sub('app/DailyStrip.jsx', `const TCOL = { bag: `, `const TCOL = { errands: '${g.color}', bag: `);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as BAG_FULL } from '../bag/puzzles';`,
  `import { PUZZLES as BAG_FULL } from '../bag/puzzles';\nimport { PUZZLES as ERRANDS_FULL } from '../errands/puzzles';`);
afterLine('app/archive/page.js', 'const BAG = BAG_FULL.map(', [
  `const ERRANDS = ERRANDS_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`]);
afterLine('app/archive/page.js', "{ key: 'bag', name: 'Bag', path: '/bag'", [
  `  { key: '${g.key}', name: '${g.name}', path: '/${g.key}', tag: '${g.tag}', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}', src: ERRANDS },`]);

// 5. the daily puzzle maps and the Sunday slate
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_bag } from '@/app/bag/puzzles';`,
    `import { PUZZLES as P_bag } from '@/app/bag/puzzles';\nimport { PUZZLES as P_errands } from '@/app/errands/puzzles';`);
  sub(f, `bag: P_bag, `, `bag: P_bag, errands: P_errands, `);
}
sub('lib/sunday-editions.js', `'spin', 'connect', 'mop', 'chef', 'seated', 'bag', 'pack', 'duet', 'lamps', 'clade',`, `'spin', 'connect', 'mop', 'chef', 'seated', 'bag', 'errands', 'pack', 'duet', 'lamps', 'clade',`);
afterLine('lib/sunday-editions.js', '//   bag     the Big Shop: eighteen items', [
  '//   errands the Big Day: eight stops, six rules and three blocks dug up in a town of six by six corners, against four to seven stops on the other days']);

// 6. alternations, rails, catalog, loft, families, starting difficulty
sub('app/api/quiz/daily-status/route.js', `|spin|connect|mop|chef|seated|bag|pack|`, `|spin|connect|mop|chef|seated|bag|errands|pack|`);
sub('app/quizzes/QuizHomeClient.jsx', `|spin|connect|mop|chef|seated|bag|pack|`, `|spin|connect|mop|chef|seated|bag|errands|pack|`);
for (const f of ['app/DailySlateRail.jsx', 'lib/quiz-catalog.js', 'lib/loft.js']) sub(f, `'spin', 'connect', 'mop', 'chef', 'seated', 'bag', 'pack', 'duet',`, `'spin', 'connect', 'mop', 'chef', 'seated', 'bag', 'errands', 'pack', 'duet',`);
sub('lib/daily-families.js', `'stands', 'defuse', 'chef', 'seated', 'bag'],`, `'stands', 'defuse', 'chef', 'seated', 'bag', 'errands'],`);
afterLine('lib/daily-difficulty.js', '  bag: 2, // a starting estimate (2026-11-14)', [`  ${g.key}: 2, // a starting estimate (2026-11-15) until a week of plays rates it`]);

// 7. skills, glyph, blurb, preview drawings
sub('lib/daily-skills.js', `bag: ['plan', 'ded'], `, `bag: ['plan', 'ded'], errands: ['plan', 'math'], `);
afterLine('lib/game-glyphs.js', "  bag: 'M5.5 8.5h13l", [`  errands: 'M6 20V9h7a3 3 0 000-6H6M6 9h10a3 3 0 010 6h-3M6 20m-1.8 0a1.8 1.8 0 103.6 0 1.8 1.8 0 10-3.6 0M13 15m-1.6 0a1.6 1.6 0 103.2 0 1.6 1.6 0 10-3.2 0',  // a route doubling back through town to a stop`]);
afterLine('lib/game-blurbs.js', '  bag: "', [`  ${g.key}: "${g.short}",`]);
// (the drawing is checked by NAME, not by its text: it was redrawn after the first run, and a text check then
// inserted it a second time and broke the build)
if (!/\nconst Errands = /.test(rd('app/GamePreviewTiles.jsx'))) sub('app/GamePreviewTiles.jsx', `// three grocery bags side by side, filled to different heights`, `// a route through town on a grid of streets: home, and two stops joined along them
const Errands = () => (
  <g><path d="M112 22H184M112 46H184M112 70H184M124 10V82M148 10V82M172 10V82" className="sm3" /><path d="M124 70H148V46H172V22" className="s3" />
    <rect x={116} y={62} width={16} height={16} rx={3} className="d" /><circle cx={148} cy={46} r={7.5} className="w" /><circle cx={172} cy={22} r={7.5} className="w" /></g>
);
// three grocery bags side by side, filled to different heights`);
sub('app/GamePreviewTiles.jsx', `seated: Seated, bag: Bag, pack: Pack, duet: Duet,`, `seated: Seated, bag: Bag, errands: Errands, pack: Pack, duet: Duet,`);
sub('app/GamePreview.jsx', `// Bag: three items stacked in a bag, the lightest on top`, `// Errands: a route from home round three stops on a grid of streets
const Errands = () => (
  <g><path d="M118 66h42V42h44V20" className="s5" fill="none" /><rect x={110} y={58} width={16} height={16} rx={4} className="w" />
    <circle cx={160} cy={66} r={8} className="m" /><circle cx={160} cy={42} r={8} className="m" /><circle cx={204} cy={20} r={8} className="m" /></g>
);
// Bag: three items stacked in a bag, the lightest on top`);
sub('app/GamePreview.jsx', `seated: Seated, bag: Bag, pack: Pack, duet: Dots,`, `seated: Seated, bag: Bag, errands: Errands, pack: Pack, duet: Dots,`);

// 8. groups and finish sets
sub('lib/daily-groups.js', `keys: ['seated', 'bag', 'chef', 'mop'] },`, `keys: ['seated', 'bag', 'errands', 'chef', 'mop'] },`);
sub('lib/daily-groups.js', `  // Logic (25)`, `  // Logic (26)`);
afterLine('lib/finish-sets.js', `{ name: 'Chores', cat: 'Logic', keys: ['bag', 'mop', 'chef'] },`, [`  { name: 'Out and about', cat: 'Logic', keys: ['errands', 'chef', 'bag'] },`]);

// 9. the Everyday puzzles set page: four become five
const PS = 'lib/puzzle-sets.js';
sub(PS, `Seating Chart, Grocery Bagging, Kitchen Timing and Mop the House | Mind Loft',`, `Seating Chart, Grocery Bagging, Route Planning, Kitchen Timing and Mop the House | Mind Loft',`);
sub(PS, `Seating Chart, Grocery Bagging, Kitchen Timing and Mop Every Tile',`, `Seating Chart, Grocery Bagging, Route Planning, Kitchen Timing and Mop Every Tile',`);
sub(PS, `description: 'Four free daily logic puzzles taken from ordinary life: seat a room of guests so every request is met, bag a belt of groceries without crushing the eggs, fire the dishes`, `description: 'Five free daily logic puzzles taken from ordinary life: seat a room of guests so every request is met, bag a belt of groceries without crushing the eggs, plan a round of errands to be home soonest, fire the dishes`);
sub(PS, `lede: 'Four puzzles about jobs everyone knows.`, `lede: 'Five puzzles about jobs everyone knows.`);
sub(PS, `and heavy has to go low, eggs on top and cold together. Chef hands`, `and heavy has to go low, eggs on top and cold together. Errands hands you a map and a list of stops, and the bank shuts before the cleaners open. Chef hands`);
sub(PS, `Every bag turns green or red as soon as you pick something up. Chef is a kitchen`, `Every bag turns green or red as soon as you pick something up. Errands is a route puzzle: tap the stops in the order you will drive them, with shops that shut, shops that open late and shopping that spoils, and you are ranked on minutes behind the soonest possible trip. Chef is a kitchen`);
sub(PS, `Bag can always be bagged with nothing coming back out. Chef has`, `Bag can always be bagged with nothing coming back out. Errands has one order that is soonest home. Chef has`);
sub(PS, `Bag from a corner shop of eight items to a big shop of eighteen, Chef from`, `Bag from a corner shop of eight items to a big shop of eighteen, Errands from four stops to eight, Chef from`);
// (another set page already says "All five", so this one is anchored on the line before it)
sub(PS, `to a house on three.'],\n      ['Are they free?', 'All four, every day, no account required.'],`, `to a house on three.'],\n      ['Are they free?', 'All five, every day, no account required.'],`);

// 10. the logic-puzzles page: twenty-five become twenty-six
const PC = 'lib/puzzle-categories.js';
sub(PC, `description: 'Twenty-five free daily logic puzzles:`, `description: 'Twenty-six free daily logic puzzles:`);
sub(PC, `a seating chart puzzle, a grocery bagging puzzle, two`, `a seating chart puzzle, a grocery bagging puzzle, a route planning puzzle, two`);
sub(PC, `lede: 'Twenty-five logic puzzles with one new board apiece every day.`, `lede: 'Twenty-six logic puzzles with one new board apiece every day.`);
sub(PC, `'mop', 'chef', 'seated', 'bag', 'jester', 'judges', 'defuse',`, `'mop', 'chef', 'seated', 'bag', 'errands', 'jester', 'judges', 'defuse',`);
sub(PC, `bag: 'Grocery bagging puzzle', defuse:`, `bag: 'Grocery bagging puzzle', errands: 'Route planning puzzle', defuse:`);
sub(PC, `torn or mixed with what it must stay away from. Jesters`, `torn or mixed with what it must stay away from. Errands is a route puzzle: choose the order of your stops round town so every opening hour is kept and you are home soonest. Jesters`);
sub(PC, `Bag is the big shop in six bags, Alibi seats five suspects,`, `Bag is the big shop in six bags, Errands is eight stops round the biggest town, Alibi seats five suspects,`);
sub(PC, `['Are they free?', 'All twenty-five, every day, no account required.'],`, `['Are they free?', 'All twenty-six, every day, no account required.'],`);

// 11. the hand-built share card is kept by a full re-bake
sub('lib/og-stage-cards.js', `'pack', 'seated', 'bag']);`, `'pack', 'seated', 'bag', 'errands']);`);

console.log(`wire-errands: ${applied} edits applied, ${skipped} already present`);
