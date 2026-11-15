// scripts/wire-bag.mjs: wires Bag (the daily grocery-bagging puzzle, Logic, owner
// 2026-11-14) into every registry in one pass, beside Seated, launched the same
// day. Placement follows "Placing a new daily" in docs/claude/daily-authoring.md.
//
// Skills: Planning and Deduction. Bagging everything is 10 and a give-up 0, so it
// is in SOLVE_ONLY; re-bags are the miss column (lower first), then the clock.
// IT RUNS A SUNDAY EDITION (the Big Shop: eighteen items, six bags, a melon that
// rides alone), so it is on SUNDAY_EDITION_GAMES and in the Sunday slate map.
// Sets: it joins Seated, Chef and Mop in Everyday puzzles (three become four), and
// a new finish set, Chores, with Mop and Chef.
//
// Anchored: every anchor must match EXACTLY ONCE or the script throws, and an
// edit whose replacement is already present is skipped, so a re-run is safe.
//   node scripts/wire-bag.mjs <dir>
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

const g = { key: 'bag', name: 'Bag', tag: 'Bag the groceries, crush nothing', promo: 'bag the groceries, crush nothing', tagLong: 'Bag everything on the belt without crushing, tearing or mixing what must stay apart',
  how: 'Groceries come down a checkout belt and only the first few are in reach. Pick one and tap a bag. A bag holds four items and nine pounds, nothing may be crushed, cold things share one bag, hot food stays away from cold, and cleaning products stay away from food. Every item is marked with its weight and what it takes on top, and every bag turns green or red the moment you pick something up. Taking an item back out is a re-bag, and the fewest re-bags ranks first. The shop grows from a corner shop on Monday to the big shop on Sunday.',
  blurb: 'A belt of groceries and a row of bags. Heavy low, eggs on top, cold together, and nothing comes back out.',
  short: 'Bag the groceries without crushing the eggs.',
  color: '#be123c', navy: '#fda4af', bg: '#ffe4e6', border: 'rgba(190,18,60,0.4)' };

// 1. lib/daily-games.js: the row, the premiere (top of its day, so its card is the last of the day's queue), solve-only
afterLine('lib/daily-games.js', "{ key: 'seated', miss: 'Re-seats', name: 'Seated',", [
  `  { key: '${g.key}', miss: 'Re-bags', name: '${g.name}', cat: 'Logic', tag: '${g.tag}', tagLong: '${g.tagLong}', how: '${g.how}', color: '${g.color}', colorNavy: '${g.navy}' },`]);
sub('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n  { key: 'bag', from: '2026-11-14', until: '2026-11-18' },\n`);
sub('lib/daily-games.js', `'spin', 'connect', 'mop', 'chef', 'seated', 'pack', 'fill',`, `'spin', 'connect', 'mop', 'chef', 'seated', 'bag', 'pack', 'fill',`);
sub('lib/daily-row-stats.js', `  'Re-seats': 're-seat',\n`, `  'Re-seats': 're-seat',\n  'Re-bags': 're-bag',\n`);

// 2. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['seated', `, `const LAUNCH_PIN = { keys: ['bag', 'seated', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['seated', `, `const LAUNCH_PIN = { keys: ['bag', 'seated', `);
afterLine('app/DailyEndCard.jsx', "  seated: { accent: '#be123c', badgeBg: '#be123c', badgeInk: T.white, Fin: Trophy },", [
  `  ${g.key}: { accent: '${g.color}', badgeBg: '${g.color}', badgeInk: T.white, Fin: Trophy },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'seated', cat: 'logic', name: 'Seated',", [
  `  { key: '${g.key}', cat: 'logic', name: '${g.name}', tag: '${g.tag}', blurb: '${g.blurb}', href: '/${g.key}' },`]);

// 3. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'seated', href: '/seated'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.promo}', store: 'sot_${g.key}_day', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'seated', href: '/seated'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.tag}', img: '/games/btn-${g.key}.png' },`]);
sub('app/DailyGamesGrid.jsx', `'snug', 'connect', 'mop', 'chef', 'seated', 'duet', 'lamps',`, `'snug', 'connect', 'mop', 'chef', 'seated', 'bag', 'duet', 'lamps',`);
afterLine('app/DailyStrip.jsx', "{ key: 'seated', href: '/seated'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', img: '/games/btn-${g.key}.png', store: 'sot_${g.key}_day', tag: "${g.tag}" , cat: 'Logic' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { seated: `, `const ACCENTS = { bag: '${g.navy}', seated: `);
sub('app/DailyStrip.jsx', `const TCOL = { seated: `, `const TCOL = { bag: '${g.color}', seated: `);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as SEATED_FULL } from '../seated/puzzles';`,
  `import { PUZZLES as SEATED_FULL } from '../seated/puzzles';\nimport { PUZZLES as BAG_FULL } from '../bag/puzzles';`);
afterLine('app/archive/page.js', 'const SEATED = SEATED_FULL.map(', [
  `const BAG = BAG_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`]);
afterLine('app/archive/page.js', "{ key: 'seated', name: 'Seated', path: '/seated'", [
  `  { key: '${g.key}', name: '${g.name}', path: '/${g.key}', tag: '${g.tag}', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}', src: BAG },`]);

// 5. the three daily puzzle maps and the Sunday slate
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_seated } from '@/app/seated/puzzles';`,
    `import { PUZZLES as P_seated } from '@/app/seated/puzzles';\nimport { PUZZLES as P_bag } from '@/app/bag/puzzles';`);
  sub(f, `seated: P_seated, `, `seated: P_seated, bag: P_bag, `);
}
sub('lib/sunday-editions.js', `'spin', 'connect', 'mop', 'chef', 'seated', 'pack', 'duet', 'lamps', 'clade',`, `'spin', 'connect', 'mop', 'chef', 'seated', 'bag', 'pack', 'duet', 'lamps', 'clade',`);
afterLine('lib/sunday-editions.js', '//   seated  a wedding reception: twenty guests', [
  '//   bag     the Big Shop: eighteen items into six bags with two hot items, three cleaning products and a melon that rides alone, against eight to thirteen items in three or four bags on the other days']);

// 6. alternations, rails, catalog, loft, families, starting difficulty
sub('app/api/quiz/daily-status/route.js', `|spin|connect|mop|chef|seated|pack|`, `|spin|connect|mop|chef|seated|bag|pack|`);
sub('app/quizzes/QuizHomeClient.jsx', `|spin|connect|mop|chef|seated|pack|`, `|spin|connect|mop|chef|seated|bag|pack|`);
for (const f of ['app/DailySlateRail.jsx', 'lib/quiz-catalog.js', 'lib/loft.js']) sub(f, `'spin', 'connect', 'mop', 'chef', 'seated', 'pack', 'duet',`, `'spin', 'connect', 'mop', 'chef', 'seated', 'bag', 'pack', 'duet',`);
sub('lib/daily-families.js', `'stands', 'defuse', 'chef', 'seated'],`, `'stands', 'defuse', 'chef', 'seated', 'bag'],`);
afterLine('lib/daily-difficulty.js', '  seated: 2, // a starting estimate (2026-11-14)', [`  ${g.key}: 2, // a starting estimate (2026-11-14) until a week of plays rates it`]);

// 7. skills, glyph, blurb, preview drawings
sub('lib/daily-skills.js', `seated: ['ded', 'plan'], `, `seated: ['ded', 'plan'], bag: ['plan', 'ded'], `);
afterLine('lib/game-glyphs.js', "  seated: 'M12 8a4 4 0", [`  bag: 'M5.5 8.5h13l-1.4 12.5H6.9zM9 8.5V7a3 3 0 016 0v1.5M9.5 13h5',  // a paper grocery bag with its handle`]);
afterLine('lib/game-blurbs.js', '  seated: "', [`  ${g.key}: "${g.short}",`]);
sub('app/GamePreviewTiles.jsx', `// a round table from above: five guests seated and one chair still empty`, `// three grocery bags side by side, filled to different heights
const Bag = () => (
  <g><path d="M104 22h34l-3 50h-28z" className="d6" fill="none" /><rect x={110} y={46} width={22} height={22} rx={3} className="sm" />
    <path d="M143 22h34l-3 50h-28z" className="d6" fill="none" /><rect x={149} y={32} width={22} height={36} rx={3} className="sm" />
    <path d="M182 22h34l-3 50h-28z" className="d6" fill="none" /><rect x={188} y={56} width={22} height={12} rx={3} className="sm" /></g>
);
// a round table from above: five guests seated and one chair still empty`);
sub('app/GamePreviewTiles.jsx', `  connect: Connect, mop: Mop, chef: Chef, seated: Seated, pack: Pack, duet: Duet,`, `  connect: Connect, mop: Mop, chef: Chef, seated: Seated, bag: Bag, pack: Pack, duet: Duet,`);
sub('app/GamePreview.jsx', `// Seated: two round tables from above, one chair at the second still empty`, `// Bag: three items stacked in a bag, the lightest on top
const Bag = () => (
  <g><path d="M126 14h68l-5 60h-58z" className="s5" fill="none" /><rect x={138} y={54} width={44} height={14} rx={3} className="m" /><rect x={138} y={37} width={44} height={14} rx={3} className="m" /><rect x={146} y={22} width={28} height={12} rx={3} className="w" /></g>
);
// Seated: two round tables from above, one chair at the second still empty`);
sub('app/GamePreview.jsx', `  connect: Dots, mop: Mop, chef: Chef, seated: Seated, pack: Pack, duet: Dots,`, `  connect: Dots, mop: Mop, chef: Chef, seated: Seated, bag: Bag, pack: Pack, duet: Dots,`);

// 8. groups and finish sets
sub('lib/daily-groups.js', `{ name: 'Everyday puzzles', cat: 'Logic', keys: ['seated', 'chef', 'mop'] },`, `{ name: 'Everyday puzzles', cat: 'Logic', keys: ['seated', 'bag', 'chef', 'mop'] },`);
sub('lib/daily-groups.js', `  // Logic (24)`, `  // Logic (25)`);
afterLine('lib/finish-sets.js', `{ name: 'Who sits where', cat: 'Logic', keys: ['seated', 'alibi', 'jester'] },`, [`  { name: 'Chores', cat: 'Logic', keys: ['bag', 'mop', 'chef'] },`]);

// 9. the Everyday puzzles set page: three become four
const PS = 'lib/puzzle-sets.js';
sub(PS, `title: 'Free Daily Everyday Puzzles: Seating Chart, Kitchen Timing and Mop the House | Mind Loft',`, `title: 'Free Daily Everyday Puzzles: Seating Chart, Grocery Bagging, Kitchen Timing and Mop the House | Mind Loft',`);
sub(PS, `h1: 'Free Daily Everyday Puzzles: Seating Chart, Kitchen Timing and Mop Every Tile',`, `h1: 'Free Daily Everyday Puzzles: Seating Chart, Grocery Bagging, Kitchen Timing and Mop Every Tile',`);
sub(PS, `description: 'Three free daily logic puzzles taken from ordinary life: seat a room of guests so every request is met, fire the dishes`, `description: 'Four free daily logic puzzles taken from ordinary life: seat a room of guests so every request is met, bag a belt of groceries without crushing the eggs, fire the dishes`);
sub(PS, `lede: 'Three puzzles about jobs everyone knows. Seated hands you a guest list and a stack of requests, and exactly one way of sharing out the tables keeps everybody happy. Chef hands`, `lede: 'Four puzzles about jobs everyone knows. Seated hands you a guest list and a stack of requests, and exactly one way of sharing out the tables keeps everybody happy. Bag sends groceries down a belt, and heavy has to go low, eggs on top and cold together. Chef hands`);
sub(PS, `It is ranked on re-seats, the guests you had to move. Chef is a kitchen`, `It is ranked on re-seats, the guests you had to move. Bag is a bagging puzzle: only the first few items on the belt are in reach, a bag holds four items and nine pounds, nothing may be crushed, and hot, cold and cleaning products each have a rule about who they share a bag with. Every bag turns green or red as soon as you pick something up. Chef is a kitchen`);
sub(PS, `and Mop has a route that covers every tile. Chef has a best possible service`, `and Mop has a route that covers every tile. Bag can always be bagged with nothing coming back out. Chef has a best possible service`);
sub(PS, `to a wedding reception of twenty on Sunday, Chef from four tickets`, `to a wedding reception of twenty on Sunday, Bag from a corner shop of eight items to a big shop of eighteen, Chef from four tickets`);
sub(PS, `to a house on three.'],\n      ['Are they free?', 'All three, every day, no account required.'],`, `to a house on three.'],\n      ['Are they free?', 'All four, every day, no account required.'],`);

// 10. the logic-puzzles page: twenty-four become twenty-five
const PC = 'lib/puzzle-categories.js';
sub(PC, `description: 'Twenty-four free daily logic puzzles:`, `description: 'Twenty-five free daily logic puzzles:`);
sub(PC, `a kitchen timing puzzle, a seating chart puzzle, two`, `a kitchen timing puzzle, a seating chart puzzle, a grocery bagging puzzle, two`);
sub(PC, `lede: 'Twenty-four logic puzzles with one new board apiece every day.`, `lede: 'Twenty-five logic puzzles with one new board apiece every day.`);
sub(PC, `'snug', 'connect', 'mop', 'chef', 'seated', 'jester', 'judges', 'defuse',`, `'snug', 'connect', 'mop', 'chef', 'seated', 'bag', 'jester', 'judges', 'defuse',`);
sub(PC, `seated: 'Seating chart puzzle', defuse:`, `seated: 'Seating chart puzzle', bag: 'Grocery bagging puzzle', defuse:`);
sub(PC, `so that every request about who sits with whom is met. Jesters`, `so that every request about who sits with whom is met. Bag is a bagging puzzle: load a belt of groceries into bags so nothing is crushed, torn or mixed with what it must stay away from. Jesters`);
sub(PC, `Seated is a wedding reception of twenty, Alibi seats five suspects,`, `Seated is a wedding reception of twenty, Bag is the big shop in six bags, Alibi seats five suspects,`);
sub(PC, `['Are they free?', 'All twenty-four, every day, no account required.'],`, `['Are they free?', 'All twenty-five, every day, no account required.'],`);

// 11. the hand-built share card is kept by a full re-bake
sub('lib/og-stage-cards.js', `'filing', 'mop', 'chef', 'pack', 'seated']);`, `'filing', 'mop', 'chef', 'pack', 'seated', 'bag']);`);

console.log(`wire-bag: ${applied} edits applied, ${skipped} already present`);
