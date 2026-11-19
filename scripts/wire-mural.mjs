// scripts/wire-mural.mjs: wires Mural and MuralToo (the 4,000 piece jigsaws the
// whole site builds together, Visual; owner 2026-11-19: "Put them in visual,
// one of the two in Featured") into every registry in one pass, beside Jig and
// Saw. Placement follows "Placing a new daily" in docs/claude/daily-authoring.md.
//
// Skill: Spatial. They are TALLY games (unit: points): the daily result is the
// Mural points earned in that Eastern day, kept by mural_credit() (migration
// 70), so a result prints as "86 points", never a fraction, and completes on
// any score (solvesOnScore). The miss column is Firsts.
// NO SUNDAY EDITION: a mural is the same size every day.
// MuralToo's first board opens 2026-11-20, so it is in LAUNCH_DAILY and stays
// off every roster until then.
// GROUPS AND SETS: Jigsaws becomes its own group and set page (Jig, Saw, Mural,
// MuralToo), Photo puzzles keeps Swap, Slide and Spin; the Jigsaws finish set
// goes from two to four.
// FEATURED is not a list entry: lib/mural-shared.js muralFeaturedKey() picks
// the one closing soonest and StageToday leads the row with it.
//
// Anchored: every anchor must match EXACTLY ONCE or the script throws, and an
// edit whose replacement is already present is skipped.
//   node scripts/wire-mural.mjs <dir>
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

const HOW = (name, opens, span) => `One photograph cut into 4,000 pieces, and everyone on the site builds the same one. Your tray holds a random handful: drag a piece to its spot, or tap the piece and then the spot. Faded pieces are the ones the crowd has placed and bright ones are yours. Harder pieces pay more, a piece nobody has placed yet pays double, and the board updates itself every two minutes. There is no clock and no Give up. A new ${name} opens at ${opens} Eastern and runs ${span}; the points you earn count toward the day you earn them.`;
const MURAL = { key: 'mural', name: 'Mural', tag: 'The giant jigsaw we all build', promo: 'the giant jigsaw we all build', tagLong: 'A 4,000 piece jigsaw the whole site builds together, noon to noon',
  how: HOW('Mural', 'noon', 'for 24 hours'),
  blurb: 'One photograph in 4,000 pieces, built by everyone on the site at once. Harder pieces and first placements pay more.',
  short: 'A 4,000 piece jigsaw everyone builds together.',
  color: '#0369a1', navy: '#7dd3fc', bg: '#e0f2fe', border: 'rgba(3,105,161,0.38)' };
const TOO = { key: 'muraltoo', name: 'MuralToo', tag: 'The midnight giant jigsaw', promo: 'the midnight giant jigsaw', tagLong: 'A second 4,000 piece jigsaw built together, midnight to midnight',
  how: HOW('MuralToo', 'midnight', 'until the next midnight'),
  blurb: 'The twin of Mural: a second photograph in 4,000 pieces, built by everyone, from midnight to midnight Eastern.',
  short: 'The second 4,000 piece jigsaw, midnight to midnight.',
  color: '#4338ca', navy: '#a5b4fc', bg: '#e0e7ff', border: 'rgba(67,56,202,0.38)' };

// 1. registry rows (after Saw), launch day
afterLine('lib/daily-games.js', "{ key: 'saw', miss: null, name: 'Saw'", [MURAL, TOO].map((g) =>
  `  { key: '${g.key}', miss: 'Firsts', unit: 'points', solvesOnScore: true, name: '${g.name}', cat: 'Visual', tag: '${g.tag}', tagLong: '${g.tagLong}', how: '${g.how}', color: '${g.color}', colorNavy: '${g.navy}' },`));
sub('lib/daily-games.js', `export const LAUNCH_DAILY = { foodie: '2026-10-27', picks: '2026-11-07' };`, `export const LAUNCH_DAILY = { foodie: '2026-10-27', picks: '2026-11-07', mural: '2026-11-19', muraltoo: '2026-11-20' };`);

for (const g of [TOO, MURAL]) {
  // 2. end card
  afterLine('app/DailyEndCard.jsx', "  saw: { accent: '#0f766e', badgeBg: '#0f766e', badgeInk: T.white, Fin: Puzzle },", [
    `  ${g.key}: { accent: '${g.color}', badgeBg: '${g.color}', badgeInk: T.white, Fin: Puzzle },`]);
  afterLine('app/DailyEndCard.jsx', "{ key: 'saw',    cat: 'visual',", [
    `  { key: '${g.key}', cat: 'visual', name: '${g.name}', tag: '${g.tag}', blurb: '${g.blurb}', href: '/${g.key}' },`]);
  // 3. promo, grid, strip
  afterLine('app/DailyGamesPromo.jsx', "{ key: 'saw', href: '/saw'", [
    `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.promo}', store: 'sot_${g.key}_day', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}' },`]);
  afterLine('app/DailyGamesGrid.jsx', "{ key: 'saw', href: '/saw', name: 'Saw'", [
    `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.tag}', img: '/games/btn-${g.key}.png' },`]);
  afterLine('app/DailyStrip.jsx', "{ key: 'saw', href: '/saw', name: 'Saw'", [
    `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', img: '/games/btn-${g.key}.png', store: 'sot_${g.key}_day', tag: "${g.tag}" , cat: 'Visual' },`]);
  // 4. archive
  const UP = g.key.toUpperCase();
  sub('app/archive/page.js', `import { PUZZLES as SAW_FULL } from '../saw/puzzles';`,
    `import { PUZZLES as SAW_FULL } from '../saw/puzzles';\nimport { PUZZLES as ${UP}_FULL } from '../${g.key}/puzzles';`);
  afterLine('app/archive/page.js', 'const SAW = SAW_FULL.map(', [
    `const ${UP} = ${UP}_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`]);
  afterLine('app/archive/page.js', "{ key: 'saw', name: 'Saw', path: '/saw'", [
    `  { key: '${g.key}', name: '${g.name}', path: '/${g.key}', tag: '${g.tag}', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}', src: ${UP} },`]);
  // 5. the daily puzzle maps (no Sunday slate: no Sunday Edition)
  for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js']) {
    sub(f, `import { PUZZLES as P_saw } from '@/app/saw/puzzles';`,
      `import { PUZZLES as P_saw } from '@/app/saw/puzzles';\nimport { PUZZLES as P_${g.key} } from '@/app/${g.key}/puzzles';`);
  }
  afterLine('lib/daily-difficulty.js', "  saw: 1, // Jig's mechanics on a taller cut", [`  ${g.key}: 2, // a starting estimate (2026-11-19) until a week of plays rates it`]);
  afterLine('lib/game-blurbs.js', '  saw: "', [`  ${g.key}: "${g.short}",`]);
}
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js']) sub(f, `saw: P_saw, `, `saw: P_saw, mural: P_mural, muraltoo: P_muraltoo, `);
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['bot', 'peg', `, `const LAUNCH_PIN = { keys: ['mural', 'muraltoo', 'bot', 'peg', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['bot', 'peg', `, `const LAUNCH_PIN = { keys: ['mural', 'muraltoo', 'bot', 'peg', `);
sub('app/DailyGamesGrid.jsx', `label: 'Visual', keys: ['jig', 'saw', `, `label: 'Visual', keys: ['jig', 'saw', 'mural', 'muraltoo', `);
sub('app/DailyStrip.jsx', `const ACCENTS = { bot: `, `const ACCENTS = { mural: '${MURAL.navy}', muraltoo: '${TOO.navy}', bot: `);
sub('app/DailyStrip.jsx', `const TCOL = { bot: `, `const TCOL = { mural: '${MURAL.color}', muraltoo: '${TOO.color}', bot: `);

// 6. alternations, rails, catalog, loft
sub('app/api/quiz/daily-status/route.js', `|jig|saw|`, `|jig|saw|mural|muraltoo|`);
sub('app/quizzes/QuizHomeClient.jsx', `|jig|saw|`, `|jig|saw|mural|muraltoo|`);
for (const f of ['app/DailySlateRail.jsx', 'lib/quiz-catalog.js', 'lib/loft.js']) sub(f, `'jig', 'saw', `, `'jig', 'saw', 'mural', 'muraltoo', `);

// 7. skills, glyphs, preview drawings (the jigsaw drawing, as Saw uses)
sub('lib/daily-skills.js', `jig: ['spa'], saw: ['spa']`, `jig: ['spa'], saw: ['spa'], mural: ['spa'], muraltoo: ['spa']`);
afterLine('lib/game-glyphs.js', "  saw: 'M7 3h7v4.5a2 2 0 1 1 0 4V21H7v-4.5a2 2 0 1 0 0-4z',", [
  "  mural: 'M3 5h18v14H3zM9 5v14M15 5v14M3 12h18',  // a wide picture cut into a grid of pieces",
  "  muraltoo: 'M3 5h18v14H3zM9 5v14M15 5v14M3 12h18M17 8a2 2 0 1 0 2 2',  // the same grid with a moon in the corner: it opens at midnight"]);
sub('app/GamePreview.jsx', `jig: Jig, saw: Jig, `, `jig: Jig, saw: Jig, mural: Jig, muraltoo: Jig, `);

// 8. groups and finish sets
sub('lib/daily-groups.js', `{ name: 'Photo puzzles', cat: 'Visual', keys: ['jig', 'saw', 'swap', 'slide', 'spin'] },`,
  `{ name: 'Jigsaws', cat: 'Visual', keys: ['jig', 'saw', 'mural', 'muraltoo'] },\n  { name: 'Photo puzzles', cat: 'Visual', keys: ['swap', 'slide', 'spin'] },`);
sub('lib/finish-sets.js', `{ name: 'Jigsaws', cat: 'Visual', keys: ['jig', 'saw'] },`, `{ name: 'Jigsaws', cat: 'Visual', keys: ['jig', 'saw', 'mural', 'muraltoo'] },`);

// 10. the visual-puzzles page: nineteen become twenty-one
const PC = 'lib/puzzle-categories.js';
sub(PC, `description: 'Nineteen free daily visual and spatial puzzles: two jigsaws, three more photo puzzles,`, `description: 'Twenty-one free daily visual and spatial puzzles: two jigsaws, two 4,000 piece jigsaws everyone builds together, three more photo puzzles,`);
sub(PC, `lede: 'Nineteen puzzles you solve with your eyes and a sense of space, one new board apiece every day. Five put a photograph back together,`, `lede: 'Twenty-one puzzles you solve with your eyes and a sense of space, one new board apiece every day. Seven put a photograph back together, two of them 4,000 piece murals the whole site builds at once,`);
sub(PC, `keys: ['jig', 'saw', 'swap', 'slide', 'spin', 'spot',`, `keys: ['jig', 'saw', 'mural', 'muraltoo', 'swap', 'slide', 'spin', 'spot',`);
sub(PC, `jig: 'Jigsaw puzzle', saw: 'Jigsaw puzzle (portrait)', swap: 'Photo tile swap', slide: 'Sliding tile puzzle', spin: 'Photo rotation puzzle',\n      spot:`, `jig: 'Jigsaw puzzle', saw: 'Jigsaw puzzle (portrait)', mural: 'Shared 4,000 piece jigsaw puzzle', muraltoo: 'Shared 4,000 piece jigsaw puzzle (midnight)', swap: 'Photo tile swap', slide: 'Sliding tile puzzle', spin: 'Photo rotation puzzle',\n      spot:`);

// 11. share cards kept by a full re-bake; challenges on points
sub('lib/og-stage-cards.js', `export const HAND_BAKED = new Set(['sudoclue', `, `export const HAND_BAKED = new Set(['mural', 'muraltoo', 'sudoclue', `);
afterLine('lib/challenge-metric.js', "  blocks: { unit: 'points', one: 'point', dir: 'high', say: 'scored' },", [
  "  mural: { unit: 'points', one: 'point', dir: 'high', say: 'scored' },",
  "  muraltoo: { unit: 'points', one: 'point', dir: 'high', say: 'scored' },"]);

console.log(`wire-mural: ${applied} edits applied, ${skipped} already present`);
