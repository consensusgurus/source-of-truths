// scripts/wire-saw.mjs: wires Saw, the tall daily jigsaw (Logic, launched
// 2026-11-06), into every registry beside Jig. Anchored edits: every anchor
// must match EXACTLY ONCE or the script throws, and an edit already present is
// skipped, so a re-run is safe.
//   node scripts/wire-saw.mjs [dir]
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

const TAG = 'The tall jigsaw, no frame';
const TAGLONG = 'A tall photo in about 80 pieces; build it anywhere on the table';
const HOW = 'A new portrait photograph every day, cut into about 80 interlocking pieces, and no frame. Put pieces down anywhere on the table; two that belong together lock when they meet, and a group moves as one. Join them all; the clock decides.';
const BLURB = "Jig's tall sibling: a portrait photo in about 80 pieces and no frame. Build it anywhere on the table; pieces lock when they meet.";
const COLOR = '#0f766e', NAVY = '#5eead4', BG = '#ccfbf1', BORDER = 'rgba(15,118,110,0.4)';

// 1. lib/daily-games.js: the row, the premiere, the solve-only set, the family ladder
afterLine('lib/daily-games.js', "{ key: 'jig', miss: null, name: 'Jig', cat: 'Logic'", [
  `  { key: 'saw', miss: null, name: 'Saw', cat: 'Logic', tag: '${TAG}', tagLong: '${TAGLONG}', how: '${HOW}', color: '${COLOR}', colorNavy: '${NAVY}' },`]);
afterLine('lib/daily-games.js', "{ key: 'jig', from: '2026-10-15', until: '2026-10-19' },", [
  `  { key: 'saw', from: '2026-11-06', until: '2026-11-10' },`]);
sub('lib/daily-games.js', `'sixes', 'sums', 'snug', 'jig', 'swap',`, `'sixes', 'sums', 'snug', 'jig', 'saw', 'swap',`);
// Jig and Saw hand each other along (owner, 2026-11-06: "users who finish one
// should be suggested the other naturally"): Play similar offers the other
// jigsaw first while it is unplayed today.
sub('lib/daily-games.js', `  jam: ['park', 'impound', 'junkyard'],\n};`, `  jam: ['park', 'impound', 'junkyard'],\n  jigsaw: ['jig', 'saw'],\n};`);

// 2. lib/daily-families.js: the nearest relative of each is the other
sub('lib/daily-families.js', `['jig', 'swap', 'slide', 'spin', 'snug'],`, `['jig', 'saw', 'swap', 'slide', 'spin', 'snug'],`);

// 3. end card, launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['saw', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['saw', `);
afterLine('app/DailyEndCard.jsx', "  jig: { accent: '#0e7490', badgeBg: '#0e7490', badgeInk: T.white, Fin: Puzzle },", [
  `  saw: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: Puzzle },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'jig',    cat: 'logic',     name: 'Jig',", [
  `  { key: 'saw',    cat: 'logic',     name: 'Saw', tag: '${TAG}',   blurb: "${BLURB}", href: '/saw' },`]);

// 4. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'jig', href: '/jig'", [
  `  { key: 'saw', href: '/saw', name: 'Saw', tag: 'the tall jigsaw, no frame', store: 'sot_saw_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'jig', href: '/jig'", [
  `  { key: 'saw', href: '/saw', name: 'Saw', tag: '${TAG}', img: '/games/btn-saw.png' },`]);
sub('app/DailyGamesGrid.jsx', `'snug', 'jig', 'swap',`, `'snug', 'jig', 'saw', 'swap',`);
afterLine('app/DailyStrip.jsx', "{ key: 'jig', href: '/jig'", [
  `  { key: 'saw', href: '/saw', name: 'Saw', img: '/games/btn-saw.png', store: 'sot_saw_day', tag: "${TAG}" , cat: 'Logic' },`]);
sub('app/DailyStrip.jsx', `snug: '#91a7ff', jig: '#67e8f9',`, `snug: '#91a7ff', jig: '#67e8f9', saw: '${NAVY}',`);
sub('app/DailyStrip.jsx', `snug: '#3b5bdb', jig: '#0e7490',`, `snug: '#3b5bdb', jig: '#0e7490', saw: '${COLOR}',`);

// 5. archive
sub('app/archive/page.js', `import { PUZZLES as JIG_FULL } from '../jig/puzzles';`,
  `import { PUZZLES as JIG_FULL } from '../jig/puzzles';\nimport { PUZZLES as SAW_FULL } from '../saw/puzzles';`);
afterLine('app/archive/page.js', 'const JIG = JIG_FULL.map(', [
  'const SAW = SAW_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));']);
afterLine('app/archive/page.js', "{ key: 'jig', name: 'Jig', path: '/jig'", [
  `  { key: 'saw', name: 'Saw', path: '/saw', tag: '${TAG}', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: SAW },`]);

// 6. the four puzzle-map registries
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_jig } from '@/app/jig/puzzles';`,
    `import { PUZZLES as P_jig } from '@/app/jig/puzzles';\nimport { PUZZLES as P_saw } from '@/app/saw/puzzles';`);
  sub(f, `jig: P_jig,`, `jig: P_jig, saw: P_saw,`);
}

// 7. alternations, rails, catalog, loft
for (const f of ['app/api/quiz/daily-status/route.js', 'app/quizzes/QuizHomeClient.jsx']) sub(f, `|snug|jig|swap|`, `|snug|jig|saw|swap|`);
for (const f of ['app/DailySlateRail.jsx', 'lib/quiz-catalog.js', 'lib/loft.js']) sub(f, `'snug', 'jig', 'swap',`, `'snug', 'jig', 'saw', 'swap',`);

// 8. skills, difficulty, glyph
sub('lib/daily-skills.js', `snug: ['spa'], jig: ['spa'],`, `snug: ['spa'], jig: ['spa'], saw: ['spa'],`);
sub('lib/daily-difficulty.js', `  herd: 1, jig: 1, squash: 1, hold: 2,`, `  herd: 1, jig: 1, squash: 1, hold: 2,\n  saw: 2, // launch guess, 2026-11-06 (no frame is a little harder than Jig), until a week of plays rates it`);
afterLine('lib/game-glyphs.js', "  jig: 'M4 8h4.5a2.5 2.5 0 1 1 5 0H18v4.5a2.5 2.5 0 1 1 0 5V20H4z',", [
  "  saw: 'M7 3h7v4.5a2 2 0 1 1 0 4V21H7v-4.5a2 2 0 1 0 0-4z',  // one tall jigsaw piece, a tab on the right and a blank on the left"]);

// 9. groups and finish sets
sub('lib/daily-groups.js', `{ name: 'Photo puzzles', cat: 'Logic', keys: ['jig', 'swap', 'slide', 'spin'] },`, `{ name: 'Photo puzzles', cat: 'Logic', keys: ['jig', 'saw', 'swap', 'slide', 'spin'] },`);
sub('lib/finish-sets.js', `  { name: 'Photo puzzles', cat: 'Logic', keys: ['jig', 'swap', 'slide', 'spin'] },`,
  `  { name: 'Photo puzzles', cat: 'Logic', keys: ['jig', 'swap', 'slide', 'spin'] },\n  { name: 'Jigsaws', cat: 'Logic', keys: ['jig', 'saw'] },`);

// 10. the logic landing page, the photo set, the sitemap
sub('lib/puzzle-categories.js', `'snug', 'jig', 'swap', 'slide', 'spin', 'connect', 'park',`, `'snug', 'jig', 'saw', 'swap', 'slide', 'spin', 'connect', 'park',`);
sub('lib/puzzle-categories.js', `jig: 'Jigsaw puzzle', swap:`, `jig: 'Jigsaw puzzle', saw: 'Jigsaw puzzle (no frame)', swap:`);
sub('lib/puzzle-sets.js', `generic: { jig: 'Jigsaw puzzle', swap:`, `generic: { jig: 'Jigsaw puzzle', saw: 'Jigsaw puzzle (no frame)', swap:`);
sub('lib/sitemap-entries.js', `import { PUZZLES as JIG_PUZZLES } from '@/app/jig/puzzles';`, `import { PUZZLES as JIG_PUZZLES } from '@/app/jig/puzzles';\nimport { PUZZLES as SAW_PUZZLES } from '@/app/saw/puzzles';`);

console.log(`wire-saw: ${applied} edits applied, ${skipped} already present`);
