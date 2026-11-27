// scripts/wire-wanted.mjs: wires Wanted, the daily hidden picture hunt (Visual,
// launched 2026-11-26), into every registry, beside Glimpse wherever Glimpse sits.
//
// An ordinary solo daily on the clock (owner, 2026-11-26: "Not community.
// Scored by time to completion"): miss null, SOLVE_ONLY, no Sunday Edition.
// It was first wired that evening as a Search-style tally game; those edits
// (unit points, the Spot hand-off pin, FEATURED_STAYS, the challenge metric,
// the linear XP list) were taken back out by hand and are not in this script.
//
// Anchored edits: every anchor must match EXACTLY ONCE or the script throws,
// and an edit whose insertion is already present is skipped, so a re-run is safe.
//   node scripts/wire-wanted.mjs [dir]
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

const TAG = 'The daily hidden picture hunt';
const TAGLONG = 'One crowd scene a day and a list of things to find in it';
const HOW = 'One crowd scene a day, in the spirit of Where\\u2019s Waldo: a fairground, a beach, a harbor, each with more than a thousand little figures. Find everything on the list: Otis in his green cap and orange scarf, his friend Mabel, his dog Biscuit, and the lost things, odd scenes, and one-of-a-kind people hidden around them. Drag to move and pinch or scroll to zoom. A wrong tap costs nothing but time, and a finished hunt ranks on the clock.';
const BLURB = 'A new crowd scene every day and a list of things to find in it. Find Otis and all the rest, as fast as you can.';
const SHORT = 'A crowd scene a day: find everything on the list.';
const COLOR = '#b91c1c', NAVY = '#fca5a5', BG = '#fee2e2', BORDER = 'rgba(185,28,28,0.35)';

// 1. registry row, premiere, and SOLVE_ONLY
afterLine('lib/daily-games.js', "{ key: 'glimpse', miss: null, name: 'Glimpse'", [
  `  { key: 'wanted', miss: null, name: 'Wanted', cat: 'Visual', tag: '${TAG}', tagLong: '${TAGLONG}', how: '${HOW}', color: '${COLOR}', colorNavy: '${NAVY}' },`]);
afterLine('lib/daily-games.js', 'export const PREMIERES = [', [
  `  { key: 'wanted', from: '2026-11-26', until: '2026-12-03' },`]);
sub('lib/daily-games.js', `'defend', 'queen', 'swindle', 'gift',\n]);`, `'defend', 'queen', 'swindle', 'gift', 'wanted',\n]);`);

// 2. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['wanted', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['wanted', `);
afterLine('app/DailyEndCard.jsx', "  glimpse: { accent: '#86198f', badgeBg: '#86198f', badgeInk: T.white, Fin: Trophy },", [
  `  wanted: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: Trophy },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'glimpse',    cat: 'visual',", [
  `  { key: 'wanted',     cat: 'visual',     name: 'Wanted', tag: '${TAG}',     blurb: '${BLURB}', href: '/wanted' },`]);

// 3. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'glimpse', href: '/glimpse'", [
  `  { key: 'wanted', href: '/wanted', name: 'Wanted', tag: 'the daily hidden picture hunt', store: 'sot_wanted_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'glimpse', href: '/glimpse', name: 'Glimpse'", [
  `  { key: 'wanted', href: '/wanted', name: 'Wanted', tag: '${TAG}', img: '/games/btn-wanted.png' },`]);
sub('app/DailyGamesGrid.jsx', `'spot', 'witness', 'glimpse', 'focus', 'park'`, `'spot', 'wanted', 'witness', 'glimpse', 'focus', 'park'`);
afterLine('app/DailyStrip.jsx', "{ key: 'glimpse', href: '/glimpse', name: 'Glimpse'", [
  `  { key: 'wanted', href: '/wanted', name: 'Wanted', img: '/games/btn-wanted.png', store: 'sot_wanted_day', tag: "${TAG}" , cat: 'Visual' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { `, `const ACCENTS = { wanted: '${NAVY}', `);
sub('app/DailyStrip.jsx', `const TCOL = { `, `const TCOL = { wanted: '${COLOR}', `);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as GLIMPSE_FULL } from '../glimpse/puzzles';`,
  `import { PUZZLES as GLIMPSE_FULL } from '../glimpse/puzzles';\nimport { PUZZLES as WANTED_FULL } from '../wanted/puzzles';`);
afterLine('app/archive/page.js', 'const GLIMPSE = GLIMPSE_FULL.map(', [
  'const WANTED = WANTED_FULL.map(({ num, quizId, live, dateLabel }) => ({ num, quizId, live, dateLabel, sunday: false }));']);
afterLine('app/archive/page.js', "{ key: 'glimpse', name: 'Glimpse', path: '/glimpse'", [
  `  { key: 'wanted', name: 'Wanted', path: '/wanted', tag: '${TAG}', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: WANTED },`]);

// 5. the daily puzzle map (no Sunday slate)
sub('lib/daily-slate.js', `import { PUZZLES as P_glimpse } from '@/app/glimpse/puzzles';`,
  `import { PUZZLES as P_glimpse } from '@/app/glimpse/puzzles';\nimport { PUZZLES as P_wanted } from '@/app/wanted/puzzles';`);
sub('lib/daily-slate.js', `glimpse: P_glimpse, `, `glimpse: P_glimpse, wanted: P_wanted, `);

// 6. alternations, rails, catalog, loft
sub('app/api/quiz/daily-status/route.js', `|witness|glimpse|defuse|`, `|witness|glimpse|wanted|defuse|`);
sub('app/quizzes/QuizHomeClient.jsx', `|witness|glimpse|defuse|`, `|witness|glimpse|wanted|defuse|`);
for (const f of ['app/DailySlateRail.jsx', 'lib/quiz-catalog.js', 'lib/loft.js']) sub(f, `'witness', 'glimpse', 'defuse', `, `'witness', 'glimpse', 'wanted', 'defuse', `);

// 7. skills, glyph, preview, blurbs, difficulty, families, xp, challenge metric
sub('lib/daily-skills.js', `glimpse: ['mem', 'est'], `, `glimpse: ['mem', 'est'], wanted: ['speed', 'spa'], `);
afterLine('lib/game-glyphs.js', "  glimpse: 'M3 3h18v18H3z", [
  "  wanted: 'M7.5 8.5a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M6.5 7.5h8M4 20c0-3.6 2.8-6 6.5-6c1.2 0 2.3.25 3.2.7M14 17.5a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M19.2 19.7L21.5 22',  // a figure in a cap under a magnifier: the one to find"]);
if (!/\nconst Wanted = /.test(rd('app/GamePreviewTiles.jsx'))) sub('app/GamePreviewTiles.jsx', `const Witness = () => (\n`, `// Wanted: a crowd of little heads, one of them ringed
const Wanted = () => (
  <g><rect x={108} y={6} width={80} height={72} rx={4} className="w" />
    {[[118, 18], [131, 15], [145, 19], [160, 14], [174, 18], [122, 34], [137, 31], [166, 33], [179, 36], [116, 51], [130, 48], [145, 52], [173, 50], [124, 66], [139, 64], [153, 68], [168, 65], [181, 67]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3.5} className={i % 3 ? 'sm' : 'm'} />)}
    <circle cx={152} cy={36} r={3.5} className="d" /><rect x={147.5} y={31} width={9} height={2} rx={1} className="d" />
    <circle cx={152} cy={36} r={9} fill="none" stroke="#d22b2b" strokeWidth={2.5} /></g>
);
const Witness = () => (\n`);
sub('app/GamePreviewTiles.jsx', `glimpse: Glimpse, `, `glimpse: Glimpse, wanted: Wanted, `);
afterLine('lib/game-blurbs.js', '  glimpse: "', [`  wanted: "${SHORT}",`]);
afterLine('lib/daily-difficulty.js', '  glimpse: 3, // a starting estimate', [`  wanted: 2, // a starting estimate (2026-11-26) until a week of plays rates it`]);
sub('lib/daily-families.js', `['alibi', 'sudoclue', 'sworn', 'hearsay', 'fib', 'witness', 'glimpse'],`, `['alibi', 'sudoclue', 'sworn', 'hearsay', 'fib', 'witness', 'glimpse'],\n  ['spot', 'wanted', 'focus'],`);

// 8. featured, share card
sub('lib/featured.js', `export const FEATURED_KEYS = [`, `export const FEATURED_KEYS = ['wanted', `);
sub('lib/og-stage-cards.js', `export const HAND_BAKED = new Set([`, `export const HAND_BAKED = new Set(['wanted', `);

// 9. groups and finish sets (a finish set holds two to four: Spot and Wanted become Picture hunts), and the Observation puzzles set page: four become five
sub('lib/daily-groups.js', `{ name: 'Observation puzzles', cat: 'Visual', keys: ['spot', 'witness', 'glimpse', 'focus'] },`, `{ name: 'Observation puzzles', cat: 'Visual', keys: ['spot', 'wanted', 'witness', 'glimpse', 'focus'] },`);
sub('lib/finish-sets.js', `{ name: 'Sharp eyes', cat: 'Visual', keys: ['spot', 'witness', 'glimpse', 'focus'] },`, `{ name: 'Picture hunts', cat: 'Visual', keys: ['spot', 'wanted'] },\n  { name: 'Sharp eyes', cat: 'Visual', keys: ['witness', 'glimpse', 'focus'] },`);
const PS = 'lib/puzzle-sets.js';
sub(PS, `h1: 'Free Daily Observation Puzzles: Spot the Difference, a Scene to Remember, a Flash to Recall and a Zoomed Photo',`, `h1: 'Free Daily Observation Puzzles: Spot the Difference, a Hidden Picture Hunt, Memory Games, and a Zoomed Photo',`);
sub(PS, `description: 'Four free daily puzzles won by paying attention: two photographs with seven differences, a street scene`, `description: 'Five free daily puzzles won by paying attention: two photographs with seven differences, a crowd scene with a list of things to find, a street scene`);
sub(PS, `lede: 'Four puzzles where everything you need is in front of you, if you look closely enough. Spot puts two copies of one photograph side by side with seven differences between them.`, `lede: 'Five puzzles where everything you need is in front of you, if you look closely enough. Spot puts two copies of one photograph side by side with seven differences between them. Wanted is a new crowd scene every day with a list of things to find in it.`);
sub(PS, `because they count before the clock. Witness is a memory game:`, `because they count before the clock. Wanted is a hidden picture hunt in the spirit of Where\\u2019s Waldo: one crowded scene a day, a fairground or a beach or a harbor, and a list of about sixteen things to find in it, starting with Otis in his green cap and orange scarf. A finished hunt ranks on the clock. Witness is a memory game:`);
sub(PS, `and Glimpse adds a sixth, faster flash on Sunday.'],\n      ['Are they free?', 'All four, every day, no account required.'],`, `and Glimpse adds a sixth, faster flash on Sunday.'],\n      ['Are they free?', 'All five, every day, no account required.'],`);

// 10. the Visual category page: one more
const PC = 'lib/puzzle-categories.js';
sub(PC, `description: 'Twenty-one free daily visual and spatial puzzles: two jigsaws, a 4,000 piece jigsaw everyone builds together, three more photo puzzles, spot the difference, a scene memory game,`,
  `description: 'Twenty-two free daily visual and spatial puzzles: two jigsaws, a 4,000 piece jigsaw everyone builds together, three more photo puzzles, spot the difference, a daily hidden picture hunt, a scene memory game,`);
sub(PC, `lede: 'Twenty-one puzzles you solve with your eyes and a sense of space, one new board apiece every day. Six put a photograph back together, one of them a 4,000 piece mural the whole site builds at once, four test how closely you look,`,
  `lede: 'Twenty-two puzzles you solve with your eyes and a sense of space, one new board apiece every day. Six put a photograph back together, one of them a 4,000 piece mural the whole site builds at once, five test how closely you look,`);
sub(PC, `'spot', 'witness', 'glimpse', 'focus', 'park', 'impound',`, `'spot', 'wanted', 'witness', 'glimpse', 'focus', 'park', 'impound',`);
sub(PC, `spot: 'Spot the difference', witness: 'Scene memory game',`, `spot: 'Spot the difference', wanted: 'Hidden picture puzzle (seek and find)', witness: 'Scene memory game',`);
sub(PC, `with seven differences between them. Witness shows a street scene for twenty seconds and then asks six questions`, `with seven differences between them. Wanted is a hidden picture hunt in the spirit of Where\\u2019s Waldo: a new crowd scene every day and a list of things to find in it, against the clock. Witness shows a street scene for twenty seconds and then asks six questions`);
sub(PC, `['Are they free?', 'All twenty-one, every day, no account required.'],\n    ],\n  },\n  {\n    slug: 'number-puzzles',`, `['Are they free?', 'All twenty-two, every day, no account required.'],\n    ],\n  },\n  {\n    slug: 'number-puzzles',`);

console.log(`wire-wanted: ${applied} edits applied, ${skipped} already present`);
