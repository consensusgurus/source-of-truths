// scripts/wire-seated.mjs: wires Seated (the daily seating-chart puzzle, Logic,
// owner 2026-11-14) into every registry in one pass, beside Chef and Pack, the
// dailies launched the same day. Placement follows "Placing a new daily" in
// docs/claude/daily-authoring.md.
//
// Skills: Deduction and Planning. Seating the room is 10 and a give-up 0, so it is
// in SOLVE_ONLY; re-seats are the miss column (lower first), then the clock, the
// same shape as Pack's re-packs.
// IT RUNS A SUNDAY EDITION (a wedding reception of twenty at four tables), so it
// is on SUNDAY_EDITION_GAMES and in the Sunday slate map.
//
// Sets: every Logic group was full at five, so Chef leaves Sorting puzzles and
// Mop leaves Grid filling (each goes back to four, with the copy it had before)
// and the three "practical puzzles" share a new daily group and set page,
// Everyday puzzles. A new finish set, Who sits where, with Alibi and Jesters.
//
// Anchored: every anchor must match EXACTLY ONCE or the script throws, and an
// edit whose replacement is already present is skipped, so a re-run is safe.
//   node scripts/wire-seated.mjs <dir>
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

const g = { key: 'seated', name: 'Seated', tag: 'Seat the room, meet every request', promo: 'seat the room, meet every request', tagLong: 'Seat every guest at the right table so every request is met',
  how: 'A room of round tables, a list of guests and a list of requests. Two guests are not speaking and want different tables, two came together and sit side by side, one needs the table by the door. Tap a guest, then tap a chair. Each request turns green when it is met and red when it is broken. Moving a guest who already had a chair is a re-seat, and the fewest re-seats ranks first. The room grows from a dinner party at one table on Monday to a wedding reception of twenty on Sunday.',
  blurb: 'Round tables, a guest list and a stack of requests. Work out who sits where so nobody is unhappy.',
  short: 'Seat every guest so every request is met.',
  color: '#be123c', navy: '#fda4af', bg: '#ffe4e6', border: 'rgba(190,18,60,0.4)' };

// 1. lib/daily-games.js: the row, the premiere, solve-only
afterLine('lib/daily-games.js', "{ key: 'chef', miss: 'Penalty minutes', name: 'Chef',", [
  `  { key: '${g.key}', miss: 'Re-seats', name: '${g.name}', cat: 'Logic', tag: '${g.tag}', tagLong: '${g.tagLong}', how: '${g.how}', color: '${g.color}', colorNavy: '${g.navy}' },`]);
sub('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n  { key: 'seated', from: '2026-11-14', until: '2026-11-18' },\n`);
sub('lib/daily-games.js', `'spin', 'connect', 'mop', 'chef', 'pack', 'fill',`, `'spin', 'connect', 'mop', 'chef', 'seated', 'pack', 'fill',`);
sub('lib/daily-row-stats.js', `  'Re-packs': 're-pack',\n`, `  'Re-packs': 're-pack',\n  'Re-seats': 're-seat',\n`);

// 2. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['pack', `, `const LAUNCH_PIN = { keys: ['seated', 'pack', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['pack', `, `const LAUNCH_PIN = { keys: ['seated', 'pack', `);
afterLine('app/DailyEndCard.jsx', "  chef: { accent: '#be123c', badgeBg: '#be123c', badgeInk: T.white, Fin: Trophy },", [
  `  ${g.key}: { accent: '${g.color}', badgeBg: '${g.color}', badgeInk: T.white, Fin: Trophy },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'chef', cat: 'logic', name: 'Chef',", [
  `  { key: '${g.key}', cat: 'logic', name: '${g.name}', tag: '${g.tag}', blurb: '${g.blurb}', href: '/${g.key}' },`]);

// 3. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'chef', href: '/chef'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.promo}', store: 'sot_${g.key}_day', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'chef', href: '/chef'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.tag}', img: '/games/btn-${g.key}.png' },`]);
sub('app/DailyGamesGrid.jsx', `'snug', 'connect', 'mop', 'chef', 'duet', 'lamps',`, `'snug', 'connect', 'mop', 'chef', 'seated', 'duet', 'lamps',`);
afterLine('app/DailyStrip.jsx', "{ key: 'chef', href: '/chef'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', img: '/games/btn-${g.key}.png', store: 'sot_${g.key}_day', tag: "${g.tag}" , cat: 'Logic' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { pack: `, `const ACCENTS = { seated: '${g.navy}', pack: `);
sub('app/DailyStrip.jsx', `const TCOL = { pack: `, `const TCOL = { seated: '${g.color}', pack: `);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as CHEF_FULL } from '../chef/puzzles';`,
  `import { PUZZLES as CHEF_FULL } from '../chef/puzzles';\nimport { PUZZLES as SEATED_FULL } from '../seated/puzzles';`);
afterLine('app/archive/page.js', 'const CHEF = CHEF_FULL.map(', [
  `const SEATED = SEATED_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`]);
afterLine('app/archive/page.js', "{ key: 'chef', name: 'Chef', path: '/chef'", [
  `  { key: '${g.key}', name: '${g.name}', path: '/${g.key}', tag: '${g.tag}', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}', src: SEATED },`]);

// 5. the three daily puzzle maps and the Sunday slate
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_chef } from '@/app/chef/puzzles';`,
    `import { PUZZLES as P_chef } from '@/app/chef/puzzles';\nimport { PUZZLES as P_seated } from '@/app/seated/puzzles';`);
  sub(f, `chef: P_chef, `, `chef: P_chef, seated: P_seated, `);
}
sub('lib/sunday-editions.js', `'spin', 'connect', 'mop', 'chef', 'pack', 'duet', 'lamps', 'clade',`, `'spin', 'connect', 'mop', 'chef', 'seated', 'pack', 'duet', 'lamps', 'clade',`);
afterLine('lib/sunday-editions.js', '//   chef    a brunch rush of twelve tickets', [
  '//   seated  a wedding reception: twenty guests at four tables of five and up to twenty requests, against one to three tables on the other days']);

// 6. alternations, rails, catalog, loft, families, starting difficulty
sub('app/api/quiz/daily-status/route.js', `|spin|connect|mop|chef|pack|`, `|spin|connect|mop|chef|seated|pack|`);
sub('app/quizzes/QuizHomeClient.jsx', `|spin|connect|mop|chef|pack|`, `|spin|connect|mop|chef|seated|pack|`);
for (const f of ['app/DailySlateRail.jsx', 'lib/quiz-catalog.js', 'lib/loft.js']) sub(f, `'spin', 'connect', 'mop', 'chef', 'pack', 'duet',`, `'spin', 'connect', 'mop', 'chef', 'seated', 'pack', 'duet',`);
sub('lib/daily-families.js', `['axiom', 'ergo', 'docket', 'suffice', 'venn', 'stands', 'defuse', 'chef'],`, `['axiom', 'ergo', 'docket', 'suffice', 'venn', 'stands', 'defuse', 'chef', 'seated'],`);
afterLine('lib/daily-difficulty.js', '  chef: 3, // a starting estimate (2026-11-14)', [`  ${g.key}: 2, // a starting estimate (2026-11-14) until a week of plays rates it`]);

// 7. skills, glyph, blurb, preview drawings
sub('lib/daily-skills.js', `chef: ['plan', 'math'], `, `chef: ['plan', 'math'], seated: ['ded', 'plan'], `);
afterLine('lib/game-glyphs.js', "  chef: 'M7 14C4 14", [`  seated: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 1.9a1.7 1.7 0 100 3.4 1.7 1.7 0 000-3.4zM19.4 6.1a1.7 1.7 0 100 3.4 1.7 1.7 0 000-3.4zM19.4 14.5a1.7 1.7 0 100 3.4 1.7 1.7 0 000-3.4zM12 18.7a1.7 1.7 0 100 3.4 1.7 1.7 0 000-3.4zM4.6 14.5a1.7 1.7 0 100 3.4 1.7 1.7 0 000-3.4zM4.6 6.1a1.7 1.7 0 100 3.4 1.7 1.7 0 000-3.4z',  // a round table from above with six chairs`]);
afterLine('lib/game-blurbs.js', '  chef: "', [`  ${g.key}: "${g.short}",`]);
sub('app/GamePreviewTiles.jsx', `// a trunk seen from the side: three boxes in, one still to drop`, `// a round table from above: five guests seated and one chair still empty
const Seated = () => (
  <g><circle cx={160} cy={44} r={15} className="d6" fill="none" />
    <circle cx={160} cy={15} r={7} className="sm" /><circle cx={185} cy={29.5} r={7} className="sm" /><circle cx={185} cy={58.5} r={7} className="sm" />
    <circle cx={160} cy={73} r={7} className="d6" fill="none" /><circle cx={135} cy={58.5} r={7} className="sm" /><circle cx={135} cy={29.5} r={7} className="sm" /></g>
);
// a trunk seen from the side: three boxes in, one still to drop`);
sub('app/GamePreviewTiles.jsx', `  connect: Connect, mop: Mop, chef: Chef, pack: Pack, duet: Duet,`, `  connect: Connect, mop: Mop, chef: Chef, seated: Seated, pack: Pack, duet: Duet,`);
sub('app/GamePreview.jsx', `// Pack: four boxes fitted into one space, one of them the odd one out`, `// Seated: two round tables from above, one chair at the second still empty
const Seated = () => (
  <g><circle cx={128} cy={42} r={12} className="w" /><circle cx={128} cy={20} r={6} className="m" /><circle cx={150} cy={42} r={6} className="m" /><circle cx={128} cy={64} r={6} className="m" /><circle cx={106} cy={42} r={6} className="m" />
    <circle cx={192} cy={42} r={12} className="w" /><circle cx={192} cy={20} r={6} className="m" /><circle cx={214} cy={42} r={6} className="w" /><circle cx={192} cy={64} r={6} className="m" /><circle cx={170} cy={42} r={6} className="m" /></g>
);
// Pack: four boxes fitted into one space, one of them the odd one out`);
sub('app/GamePreview.jsx', `  connect: Dots, mop: Mop, chef: Chef, pack: Pack, duet: Dots,`, `  connect: Dots, mop: Mop, chef: Chef, seated: Seated, pack: Pack, duet: Dots,`);

// 8. groups and finish sets: Chef and Mop go back out of their groups and join Seated in a new one
sub('lib/daily-groups.js', `{ name: 'Grid filling', cat: 'Logic', keys: ['duet', 'lamps', 'snug', 'connect', 'mop'] },`, `{ name: 'Grid filling', cat: 'Logic', keys: ['duet', 'lamps', 'snug', 'connect'] },`);
sub('lib/daily-groups.js', `{ name: 'Sorting puzzles', cat: 'Logic', keys: ['jester', 'judges', 'venn', 'defuse', 'chef'] },`,
  `{ name: 'Sorting puzzles', cat: 'Logic', keys: ['jester', 'judges', 'venn', 'defuse'] },\n  { name: 'Everyday puzzles', cat: 'Logic', keys: ['seated', 'chef', 'mop'] },`);
sub('lib/category-kinds.js', `'Sorting puzzles': 'test', `, `'Sorting puzzles': 'test', 'Everyday puzzles': 'test', `);
afterLine('lib/finish-sets.js', `{ name: 'Planning ahead', cat: 'Logic', keys: ['chef', 'mop', 'connect'] },`, [`  { name: 'Who sits where', cat: 'Logic', keys: ['seated', 'alibi', 'jester'] },`]);

// 9. the set pages. The edits wire-mop.mjs and wire-chef.mjs made to Grid filling and
// Sorting puzzles are run backwards, read straight out of those scripts so not a word
// is retyped, and Everyday puzzles is new.
const PS = 'lib/puzzle-sets.js';
for (const src of ['wire-chef.mjs', 'wire-mop.mjs']) {
  const text = fs.readFileSync(new URL(src, import.meta.url), 'utf8');
  const calls = [...text.matchAll(/^sub\(PS, `((?:[^`\\]|\\.)*)`,\s*`((?:[^`\\]|\\.)*)`\);$/gm)];
  if (calls.length < 5) throw new Error(`${src}: expected its set-page edits, found ${calls.length}`);
  const lit = (x) => new Function('return `' + x + '`')();
  for (const c of calls.reverse()) sub(PS, lit(c[2]), lit(c[1]));
}
sub(PS, `  {\n    name: 'Roll and route', slug: 'roll-and-route',`, `  {
    name: 'Everyday puzzles', slug: 'everyday-puzzles',
    eyebrow: 'Free daily real-life logic puzzles',
    title: 'Free Daily Everyday Puzzles: Seating Chart, Kitchen Timing and Mop the House | Mind Loft',
    h1: 'Free Daily Everyday Puzzles: Seating Chart, Kitchen Timing and Mop Every Tile',
    description: 'Three free daily logic puzzles taken from ordinary life: seat a room of guests so every request is met, fire the dishes of a kitchen so every table goes out hot, and mop every tile of a house exactly once. New boards at midnight Eastern, no signup.',
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
    name: 'Roll and route', slug: 'roll-and-route',`);

// 10. the logic-puzzles page: twenty-three become twenty-four
const PC = 'lib/puzzle-categories.js';
sub(PC, `description: 'Twenty-three free daily logic puzzles: a nonogram, slitherlink, shikaku, a binary dots-and-rings grid, a light-every-square puzzle, a shape-fitting puzzle, a dot-joining numberlink, a mop-every-tile route puzzle, a kitchen timing puzzle, two`,
  `description: 'Twenty-four free daily logic puzzles: a nonogram, slitherlink, shikaku, a binary dots-and-rings grid, a light-every-square puzzle, a shape-fitting puzzle, a dot-joining numberlink, a mop-every-tile route puzzle, a kitchen timing puzzle, a seating chart puzzle, two`);
sub(PC, `lede: 'Twenty-three logic puzzles with one new board apiece every day.`, `lede: 'Twenty-four logic puzzles with one new board apiece every day.`);
sub(PC, `'snug', 'connect', 'mop', 'chef', 'jester', 'judges', 'defuse',`, `'snug', 'connect', 'mop', 'chef', 'seated', 'jester', 'judges', 'defuse',`);
sub(PC, `chef: 'Kitchen timing puzzle (scheduling)', defuse:`, `chef: 'Kitchen timing puzzle (scheduling)', seated: 'Seating chart puzzle', defuse:`);
sub(PC, `and leaves hot. Jesters`, `and leaves hot. Seated is a seating chart: give every guest a chair so that every request about who sits with whom is met. Jesters`);
sub(PC, `Chef is a twelve-ticket brunch on a bigger line, Alibi seats five suspects,`, `Chef is a twelve-ticket brunch on a bigger line, Seated is a wedding reception of twenty, Alibi seats five suspects,`);
sub(PC, `['Are they free?', 'All twenty-three, every day, no account required.'],`, `['Are they free?', 'All twenty-four, every day, no account required.'],`);

// 11. the hand-built share card is kept by a full re-bake
sub('lib/og-stage-cards.js', `'filing', 'mop', 'chef', 'pack']);`, `'filing', 'mop', 'chef', 'pack', 'seated']);`);

console.log(`wire-seated: ${applied} edits applied, ${skipped} already present`);
