// scripts/wire-chef.mjs: wires Chef (the daily kitchen puzzle, Logic, owner
// 2026-11-13) into every registry in one pass, beside Mop, the daily launched
// the day before. Placement follows "Placing a new daily" in
// docs/claude/daily-authoring.md.
//
// Skills: Planning and Mental Math. Finishing the service is 10 and a give-up 0,
// so it is in SOLVE_ONLY; the penalty is the miss column (lower first), then the
// clock, the same shape as Slide's moves.
// IT RUNS A SUNDAY EDITION (twelve tickets on the big line), so it is on
// SUNDAY_EDITION_GAMES and in the Sunday slate map.
//
// Sets: joins the Sorting puzzles daily group and set page (four become five)
// and a new finish set, Planning ahead, with Mop and Connect.
//
// Anchored: every anchor must match EXACTLY ONCE or the script throws, and an
// edit whose replacement is already present is skipped, so a re-run is safe.
//   node scripts/wire-chef.mjs <dir>
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


const g = { key: 'chef', name: 'Chef', tag: 'Get every order out together, hot', promo: 'get every order out together, hot', tagLong: 'Time every dish on a limited line so each order goes out together and hot',
  how: 'Run a restaurant kitchen one minute at a time. Tickets print through the service, every dish needs its own station for a set number of minutes, and the stations have limited room. Fire each dish so a whole order finishes together, put it on its tray and send it out hot. A minute a table waits costs one penalty minute and a minute a finished dish sits costs two. Services grow through the week, and Sunday is a brunch rush on a bigger line.',
  blurb: 'Tickets, a hot line and one clock that only moves when you say. Time every dish so the whole order leaves together.',
  short: 'Time every dish so each order goes out together and hot.',
  color: '#be123c', navy: '#fda4af', bg: '#ffe4e6', border: 'rgba(190,18,60,0.4)' };

// 1. lib/daily-games.js: the row, the premiere, solve-only
afterLine('lib/daily-games.js', "{ key: 'mop', miss: null, name: 'Mop',", [
  `  { key: '${g.key}', miss: 'Penalty minutes', name: '${g.name}', cat: 'Logic', tag: '${g.tag}', tagLong: '${g.tagLong}', how: '${g.how}', color: '${g.color}', colorNavy: '${g.navy}' },`]);
sub('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n  { key: 'chef', from: '2026-11-14', until: '2026-11-18' },\n`);
sub('lib/daily-games.js', `'spin', 'connect', 'mop', 'fill',`, `'spin', 'connect', 'mop', 'chef', 'fill',`);

sub('lib/daily-row-stats.js', `  Moves: 'move',\n`, `  Moves: 'move',\n  'Penalty minutes': 'penalty minute',\n`);

// 2. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['mop', `, `const LAUNCH_PIN = { keys: ['chef', 'mop', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['mop', `, `const LAUNCH_PIN = { keys: ['chef', 'mop', `);
afterLine('app/DailyEndCard.jsx', "  mop: { accent: '#be123c', badgeBg: '#be123c', badgeInk: T.white, Fin: Trophy },", [
  `  ${g.key}: { accent: '${g.color}', badgeBg: '${g.color}', badgeInk: T.white, Fin: Trophy },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'mop', cat: 'logic', name: 'Mop',", [
  `  { key: '${g.key}', cat: 'logic', name: '${g.name}', tag: '${g.tag}', blurb: '${g.blurb}', href: '/${g.key}' },`]);

// 3. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'mop', href: '/mop'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.promo}', store: 'sot_${g.key}_day', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'mop', href: '/mop'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.tag}', img: '/games/btn-${g.key}.png' },`]);
sub('app/DailyGamesGrid.jsx', `'snug', 'connect', 'mop', 'duet',`, `'snug', 'connect', 'mop', 'chef', 'duet',`);
afterLine('app/DailyStrip.jsx', "{ key: 'mop', href: '/mop'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', img: '/games/btn-${g.key}.png', store: 'sot_${g.key}_day', tag: "${g.tag}" , cat: 'Logic' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { mop: `, `const ACCENTS = { chef: '${g.navy}', mop: `);
sub('app/DailyStrip.jsx', `const TCOL = { mop: `, `const TCOL = { chef: '${g.color}', mop: `);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as MOP_FULL } from '../mop/puzzles';`,
  `import { PUZZLES as MOP_FULL } from '../mop/puzzles';\nimport { PUZZLES as CHEF_FULL } from '../chef/puzzles';`);
afterLine('app/archive/page.js', 'const MOP = MOP_FULL.map(', [
  `const CHEF = CHEF_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`]);
afterLine('app/archive/page.js', "{ key: 'mop', name: 'Mop', path: '/mop'", [
  `  { key: '${g.key}', name: '${g.name}', path: '/${g.key}', tag: '${g.tag}', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}', src: CHEF },`]);

// 5. the three daily puzzle maps and the Sunday slate
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_mop } from '@/app/mop/puzzles';`,
    `import { PUZZLES as P_mop } from '@/app/mop/puzzles';\nimport { PUZZLES as P_chef } from '@/app/chef/puzzles';`);
  sub(f, `mop: P_mop, `, `mop: P_mop, chef: P_chef, `);
}
sub('lib/sunday-editions.js', `'spin', 'connect', 'mop', 'duet', 'lamps', 'clade',`, `'spin', 'connect', 'mop', 'chef', 'duet', 'lamps', 'clade',`);
afterLine('lib/sunday-editions.js', '//   mop     a house on three floors', [
  '//   chef    a brunch rush of twelve tickets on the big line (three burners, two ovens, two grills, two fryers), against four to eight tickets on the small line']);

// 6. alternations, rails, catalog, loft, families, starting difficulty
sub('app/api/quiz/daily-status/route.js', `|spin|connect|mop|`, `|spin|connect|mop|chef|`);
sub('app/quizzes/QuizHomeClient.jsx', `|spin|connect|mop|`, `|spin|connect|mop|chef|`);
for (const f of ['app/DailySlateRail.jsx', 'lib/quiz-catalog.js', 'lib/loft.js']) sub(f, `'spin', 'connect', 'mop', 'duet',`, `'spin', 'connect', 'mop', 'chef', 'duet',`);
sub('lib/daily-families.js', `['axiom', 'ergo', 'docket', 'suffice', 'venn', 'stands', 'defuse'],`, `['axiom', 'ergo', 'docket', 'suffice', 'venn', 'stands', 'defuse', 'chef'],`);
afterLine('lib/daily-difficulty.js', '  mop: 3, // a starting estimate (2026-11-13)', [`  ${g.key}: 3, // a starting estimate (2026-11-14) until a week of plays rates it`]);

// 7. skills, glyph, blurb, preview drawings
sub('lib/daily-skills.js', `mop: ['spa', 'plan'], `, `mop: ['spa', 'plan'], chef: ['plan', 'math'], `);
afterLine('lib/game-glyphs.js', "  mop: 'M17 3l-6 9", [`  chef: 'M7 14C4 14 3 10 6 9 6 5 10 4 12 6 14 4 18 5 18 9 21 10 20 14 17 14V19H7zM7 17h10',  // a chef's hat: the crown and the band`]);
afterLine('lib/game-blurbs.js', '  mop: "', [`  ${g.key}: "${g.short}",`]);
sub('app/GamePreviewTiles.jsx', `// a floor of tiles half mopped`, `// a pan on a burner, its handle out to the right, and two plates waiting
const Chef = () => (
  <g><circle cx={134} cy={42} r={26} className="d6" fill="none" /><circle cx={134} cy={42} r={15} className="d6" fill="none" /><path d="M160 42H192" className="d6" />
    <rect x={168} y={10} width={18} height={10} rx={5} className="sm" /><rect x={168} y={64} width={18} height={10} rx={5} className="sm" /></g>
);
// a floor of tiles half mopped`);
sub('app/GamePreviewTiles.jsx', `  connect: Connect, mop: Mop, duet: Duet,`, `  connect: Connect, mop: Mop, chef: Chef, duet: Duet,`);
sub('app/GamePreview.jsx', `// Mop: a tiled floor, the left of it mopped`, `// Chef: three plates on the pass, the middle one still to come
const Chef = () => (
  <g>{[0, 1, 2].map((k) => <g key={k}><rect x={92 + k * 46} y={26} width={40} height={30} rx={15} className={k === 1 ? 'm' : 'w'} /><rect x={102 + k * 46} y={34} width={20} height={14} rx={7} className={k === 1 ? 'w' : 'm'} /></g>)}
    <path d="M88 64H228" className="s5" /></g>
);
// Mop: a tiled floor, the left of it mopped`);
sub('app/GamePreview.jsx', `  connect: Dots, mop: Mop, duet: Dots,`, `  connect: Dots, mop: Mop, chef: Chef, duet: Dots,`);

// 8. groups and finish sets
sub('lib/daily-groups.js', `{ name: 'Sorting puzzles', cat: 'Logic', keys: ['jester', 'judges', 'venn', 'defuse'] },`, `{ name: 'Sorting puzzles', cat: 'Logic', keys: ['jester', 'judges', 'venn', 'defuse', 'chef'] },`);
afterLine('lib/finish-sets.js', `{ name: 'Path finding', cat: 'Logic', keys: ['hedge', 'plot', 'connect', 'mop'] },`, [`  { name: 'Planning ahead', cat: 'Logic', keys: ['chef', 'mop', 'connect'] },`]);

// 9. the Sorting puzzles set page: four become five
const PS = 'lib/puzzle-sets.js';
sub(PS, `title: 'Free Daily Sorting Puzzles: Queens, Star Battle, Set Logic and Wire Cutting | Mind Loft',`, `title: 'Free Daily Sorting Puzzles: Queens, Star Battle, Set Logic, Wire Cutting and Kitchen Timing | Mind Loft',`);
sub(PS, `h1: 'Free Daily Sorting Puzzles: Queens Placement, Two-Star Placement, Set Logic and Wire Cutting',`, `h1: 'Free Daily Sorting Puzzles: Queens Placement, Two-Star Placement, Set Logic, Wire Cutting and Kitchen Timing',`);
sub(PS, `description: 'Four free daily puzzles about putting things where they go: seat one jester per row, column and court with no two touching; seat two judges per row, column and court; place twelve words across seven overlapping regions; and cut a row of wires in the one safe order.`,
  `description: 'Five free daily puzzles about putting things where they go: seat one jester per row, column and court with no two touching; seat two judges per row, column and court; place twelve words across seven overlapping regions; cut a row of wires in the one safe order; and fire the dishes of a kitchen in the order that sends every table out hot.`);
sub(PS, `lede: 'Four puzzles about placement and order.`, `lede: 'Five puzzles about placement and order.`);
sub(PS, `and exactly one order of cuts obeys every rule.',`, `and exactly one order of cuts obeys every rule. Chef hands you a line of stations and a rail of tickets, and the order you fire the dishes in decides how long every table waits.',`);
sub(PS, `and one wrong cut ends the day.',\n    ],`, `and one wrong cut ends the day. Chef is a kitchen run one minute at a time: every dish needs its own station for a set number of minutes, an order leaves only when all of it is ready, and a finished dish that sits costs double.',\n    ],`);
sub(PS, `Judges is 10x10 all week and 12x12 on Sunday.'],\n      ['Are they free?', 'All four, every day, no account required.'],`, `Judges is 10x10 all week and 12x12 on Sunday. Chef grows from four tickets on Monday to a twelve-ticket Sunday brunch.'],\n      ['Are they free?', 'All five, every day, no account required.'],`);

// 10. the logic-puzzles page: twenty-two become twenty-three
const PC = 'lib/puzzle-categories.js';
sub(PC, `description: 'Twenty-two free daily logic puzzles: a nonogram, slitherlink, shikaku, a binary dots-and-rings grid, a light-every-square puzzle, a shape-fitting puzzle, a dot-joining numberlink, a mop-every-tile route puzzle, two`, `description: 'Twenty-three free daily logic puzzles: a nonogram, slitherlink, shikaku, a binary dots-and-rings grid, a light-every-square puzzle, a shape-fitting puzzle, a dot-joining numberlink, a mop-every-tile route puzzle, a kitchen timing puzzle, two`);
sub(PC, `lede: 'Twenty-two logic puzzles with one new board apiece every day.`, `lede: 'Twenty-three logic puzzles with one new board apiece every day.`);
sub(PC, `hidden rules, results tables and a manual of wire-cutting rules. Every board has exactly one solution and can be reached without a guess.`, `hidden rules, results tables and a manual of wire-cutting rules, plus a restaurant kitchen to run against the clock on the wall. Every grid and deduction board has exactly one solution and can be reached without a guess.`);
sub(PC, `'snug', 'connect', 'mop', 'jester', 'judges', 'defuse',`, `'snug', 'connect', 'mop', 'chef', 'jester', 'judges', 'defuse',`);
sub(PC, `mop: 'Route puzzle (visit every tile once)', defuse:`, `mop: 'Route puzzle (visit every tile once)', chef: 'Kitchen timing puzzle (scheduling)', defuse:`);
sub(PC, `and finish at the door. Jesters`, `and finish at the door. Chef is a scheduling puzzle: fire each dish on a limited line so every order finishes together and leaves hot. Jesters`);
sub(PC, `Mop is a house on three floors, Alibi seats five suspects,`, `Mop is a house on three floors, Chef is a twelve-ticket brunch on a bigger line, Alibi seats five suspects,`);
sub(PC, `['Are they free?', 'All twenty-two, every day, no account required.'],`, `['Are they free?', 'All twenty-three, every day, no account required.'],`);

console.log(`wire-chef: ${applied} edits applied, ${skipped} already present`);
