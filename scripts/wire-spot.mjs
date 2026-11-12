// scripts/wire-spot.mjs: wires Spot (the daily spot the difference game, Logic,
// owner 2026-11-12) into every registry in one pass, beside Witness and Defuse.
// Placement follows "Placing a new daily" in docs/claude/daily-authoring.md.
//
// Skill: Focus and Speed. Scored as a real count (differences found out of
// seven), so it is NOT in SCORE_VIEW and keeps its fraction; the registry miss
// column is Misses (a wrong tap is one, a hint is two). NO SUNDAY EDITION, so it
// is not on SUNDAY_EDITION_GAMES nor in the Sunday slate map.
//
// Sets: joins the Close reading daily group and set page (Witness, Defuse,
// Sworn, Spot) and the photo family; a new finish set, Sharp eyes (Spot, Witness).
//
// Anchored: every anchor must match EXACTLY ONCE or the script throws, and an
// edit whose replacement is already present is skipped, so a re-run is safe.
//   node scripts/wire-spot.mjs <dir>
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

const g = { key: 'spot', name: 'Spot', NAMEUP: 'SPOT', tag: 'Find the seven differences', promo: 'find the seven differences', tagLong: 'Two copies of one photo, seven differences to find',
  how: 'Two copies of one real photograph, and the second has been changed in seven places. Tap either photo where they differ, and zoom in to look closer. A wrong tap is a miss and a hint is two. Scored on differences found, then fewest misses, then the clock.',
  blurb: 'Two copies of one photograph, seven differences. A boat is gone, a roof turned blue. Tap what changed.',
  short: 'Two copies of one photo, seven differences to find.',
  color: '#be123c', navy: '#fda4af', bg: '#ffe4e6', border: 'rgba(190,18,60,0.35)' };

// 1. lib/daily-games.js: the row and the premiere
afterLine('lib/daily-games.js', "{ key: 'defuse', miss: 'Cuts', name: 'Defuse',", [
  `  { key: '${g.key}', miss: 'Misses', name: '${g.name}', cat: 'Logic', tag: '${g.tag}', tagLong: '${g.tagLong}', how: '${g.how}', color: '${g.color}', colorNavy: '${g.navy}' },`]);
sub('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n  { key: 'spot', from: '2026-11-12', until: '2026-11-16' },\n`);

// 2. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['witness', `, `const LAUNCH_PIN = { keys: ['spot', 'witness', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['witness', `, `const LAUNCH_PIN = { keys: ['spot', 'witness', `);
afterLine('app/DailyEndCard.jsx', "  defuse: { accent: '#7c2d12', badgeBg: '#7c2d12', badgeInk: T.white, Fin: Trophy },", [
  `  ${g.key}: { accent: '${g.color}', badgeBg: '${g.color}', badgeInk: T.white, Fin: Trophy },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'defuse',    cat: 'logic',", [
  `  { key: '${g.key}',    cat: 'logic',     name: '${g.name}', tag: '${g.tag}',     blurb: '${g.blurb}', href: '/${g.key}' },`]);

// 3. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'defuse', href: '/defuse'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.promo}', store: 'sot_${g.key}_day', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'defuse', href: '/defuse'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.tag}', img: '/games/btn-${g.key}.png' },`]);
sub('app/DailyGamesGrid.jsx', `'witness', 'defuse', 'sudoclue',`, `'witness', 'defuse', 'spot', 'sudoclue',`);
afterLine('app/DailyStrip.jsx', "{ key: 'defuse', href: '/defuse'", [
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', img: '/games/btn-${g.key}.png', store: 'sot_${g.key}_day', tag: "${g.tag}" , cat: 'Logic' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { witness: `, `const ACCENTS = { spot: '${g.navy}', witness: `);
sub('app/DailyStrip.jsx', `const TCOL = { witness: `, `const TCOL = { spot: '${g.color}', witness: `);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as DEFUSE_FULL } from '../defuse/puzzles';`,
  `import { PUZZLES as DEFUSE_FULL } from '../defuse/puzzles';\nimport { PUZZLES as SPOT_FULL } from '../spot/puzzles';`);
afterLine('app/archive/page.js', 'const DEFUSE = DEFUSE_FULL.map(', [
  `const SPOT = SPOT_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`]);
afterLine('app/archive/page.js', "{ key: 'defuse', name: 'Defuse', path: '/defuse'", [
  `  { key: '${g.key}', name: '${g.name}', path: '/${g.key}', tag: '${g.tag}', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}', src: SPOT },`]);

// 5. the three daily puzzle maps (no Sunday slate: no Sunday Edition)
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js']) {
  sub(f, `import { PUZZLES as P_defuse } from '@/app/defuse/puzzles';`,
    `import { PUZZLES as P_defuse } from '@/app/defuse/puzzles';\nimport { PUZZLES as P_spot } from '@/app/spot/puzzles';`);
  sub(f, `witness: P_witness, defuse: P_defuse, sudoclue: P_sudoclue,`, `witness: P_witness, defuse: P_defuse, spot: P_spot, sudoclue: P_sudoclue,`);
}

// 6. alternations, rails, catalog, loft, families, starting difficulty
sub('app/api/quiz/daily-status/route.js', `|witness|defuse|sudoclue|`, `|witness|defuse|spot|sudoclue|`);
sub('app/quizzes/QuizHomeClient.jsx', `|witness|defuse|sudoclue|`, `|witness|defuse|spot|sudoclue|`);
for (const f of ['app/DailySlateRail.jsx', 'lib/quiz-catalog.js', 'lib/loft.js']) sub(f, `'witness', 'defuse', 'sudoclue',`, `'witness', 'defuse', 'spot', 'sudoclue',`);
sub('lib/daily-families.js', `  ['jig', 'saw', 'swap', 'slide', 'spin', 'snug'],`, `  ['jig', 'saw', 'swap', 'slide', 'spin', 'snug', 'spot'],`);
afterLine('lib/daily-difficulty.js', '  defuse: 3, // a starting estimate (2026-11-12)', [`  ${g.key}: 2, // a starting estimate (2026-11-12) until a week of plays rates it`]);

// 7. skills, glyphs, challenge metric, blurbs, preview tiles
sub('lib/daily-skills.js', `defuse: ['ded'], `, `defuse: ['ded'], spot: ['speed'], `);
afterLine('lib/game-glyphs.js', "  defuse: 'M6 3v18", [`  spot: 'M3 6h8v12H3zM13 6h8v12h-8zM7 9.5a1.5 1.5 0 1 0 .01 0M17 7.5a3 3 0 1 0 .01 0',  // two copies of a picture, a ring on the second`]);
afterLine('lib/challenge-metric.js', "  witness: { unit: 'right'", ["  spot: { unit: 'differences', one: 'difference', dir: 'high', say: 'found' },"]);
afterLine('lib/game-blurbs.js', '  defuse: "', [`  ${g.key}: "${g.short}",`]);
sub('app/GamePreviewTiles.jsx', `const Connect = () => (\n`, `// two copies of one small picture; the sun is gone from the second, and a dot marks it
const Spot = () => (
  <g><rect x={110} y={12} width={36} height={60} rx={4} className="w" /><rect x={150} y={12} width={36} height={60} rx={4} className="w" />
    <circle cx={134} cy={28} r={6} className="m" /><rect x={116} y={50} width={24} height={14} className="sm" /><rect x={156} y={50} width={24} height={14} className="sm" />
    <circle cx={174} cy={28} r={3.5} className="d" /></g>
);
const Connect = () => (\n`);
sub('app/GamePreviewTiles.jsx', `witness: Witness, defuse: Defuse,`, `witness: Witness, defuse: Defuse, spot: Spot,`);

// 8. groups and finish sets
sub('lib/daily-groups.js', `  { name: 'Close reading', cat: 'Logic', keys: ['witness', 'defuse', 'sworn'] },`, `  { name: 'Close reading', cat: 'Logic', keys: ['witness', 'defuse', 'sworn', 'spot'] },`);
sub('lib/finish-sets.js', `  { name: 'Jigsaws', cat: 'Logic', keys: ['jig', 'saw'] },`, `  { name: 'Jigsaws', cat: 'Logic', keys: ['jig', 'saw'] },\n  { name: 'Sharp eyes', cat: 'Logic', keys: ['spot', 'witness'] },`);

// 9. the Close reading set page: three become four
const PS = 'lib/puzzle-sets.js';
sub(PS, `description: 'Three free daily puzzles won by paying attention: a street scene to study and then be questioned on, a manual whose rules leave one safe order of wire cuts, and five sworn statements with an exact number of lies.`,
  `description: 'Four free daily puzzles won by paying attention: a street scene to study and then be questioned on, two photographs with seven differences, a manual whose rules leave one safe order of wire cuts, and five sworn statements with an exact number of lies.`);
sub(PS, `lede: 'Three puzzles where everything you need is in front of you, if you look closely enough. Witness shows a street scene for twenty seconds and then asks what you saw. Defuse`,
  `lede: 'Four puzzles where everything you need is in front of you, if you look closely enough. Witness shows a street scene for twenty seconds and then asks what you saw. Spot puts two copies of one photograph side by side with seven differences between them. Defuse`);
sub(PS, `with the scene returned at the end so you can see what you missed. Defuse gives you`, `with the scene returned at the end so you can see what you missed. Spot is spot the difference on a real photograph: tap what changed, zoom in for the small ones, and keep your misses down, because they count before the clock. Defuse gives you`);
sub(PS, `while the twenty seconds and the one-wrong-cut rule stay the same.'],
      ['Are they free?', 'All three, every day, no account required.'],`, `while the twenty seconds and the one-wrong-cut rule stay the same.'],
      ['Are they free?', 'All four, every day, no account required.'],`);

// 10. the logic-puzzles page: thirty-five become thirty-six
const PC = 'lib/puzzle-categories.js';
sub(PC, `description: 'Thirty-five free daily logic puzzles: two daily jigsaws and three more photo puzzles,`, `description: 'Thirty-six free daily logic puzzles: two daily jigsaws, a spot the difference game and three more photo puzzles,`);
sub(PC, `lede: 'Thirty-five logic puzzles with one new board apiece every day, five photo puzzles among them.`, `lede: 'Thirty-six logic puzzles with one new board apiece every day, six photo puzzles among them.`);
sub(PC, `'witness', 'defuse', 'sudoclue',`, `'witness', 'defuse', 'spot', 'sudoclue',`);
sub(PC, `defuse: 'Wire-cutting logic puzzle', sudoclue:`, `defuse: 'Wire-cutting logic puzzle', spot: 'Spot the difference', sudoclue:`);
sub(PC, `Witness is the odd one out, a memory game: twenty seconds with a street scene, then six questions about what you saw.',`, `Witness is the odd one out, a memory game: twenty seconds with a street scene, then six questions about what you saw. Spot is the other test of a sharp eye: two copies of one photograph and seven differences to find.',`);
sub(PC, `['Are they free?', 'All thirty-five, every day, no account required.'],`, `['Are they free?', 'All thirty-six, every day, no account required.'],`);

console.log(`wire-spot: ${applied} edits applied, ${skipped} already present`);
