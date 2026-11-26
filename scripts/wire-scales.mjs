// scripts/wire-scales.mjs: wires Scales (the daily balance-scale weights
// puzzle, Numbers, owner 2026-11-26) into every registry in one pass, beside
// Cipher. Placement follows "Placing a new daily" in
// docs/claude/daily-authoring.md.
//
// Numbers, skills Math and Deduction. Solve or not (10 for a solve, 0 for a
// give-up), so it is on SOLVE_ONLY and prints Solved / Not solved; the miss
// column is Checks, which the plain board order ranks before the clock
// (owner: "Checks then time"); first try counts. Sunday Edition: six shapes
// and two tilted scales, so it is on SUNDAY_EDITION_GAMES and in the Sunday
// slate. Group Number grids (four become five, with its set page), finish set
// Work it out, family beside Cipher. Premieres 2026-11-26.
//
// Anchored: every anchor must match EXACTLY ONCE or the script throws, and an
// edit whose replacement is already present is skipped, so it is safe to re-run.
//   node scripts/wire-scales.mjs
import fs from 'fs';
import path from 'path';
import url from 'url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const R = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const W = (f, s) => fs.writeFileSync(path.join(ROOT, f), s);
let edits = 0, skipped = 0;
function one(f, a, b) {
  const s = R(f);
  if (s.includes(b)) { skipped++; return; }
  const n = s.split(a).length - 1;
  if (n !== 1) throw new Error(`${f}: anchor found ${n} times: ${a.slice(0, 110)}`);
  W(f, s.replace(a, () => b)); edits++;
}
function after(f, needle, add) {
  const s = R(f);
  if (s.includes(add.split('\n')[0])) { skipped++; return; }
  const lines = s.split('\n');
  const hit = lines.map((l, i) => (l.includes(needle) ? i : -1)).filter((i) => i >= 0);
  if (hit.length !== 1) throw new Error(`${f}: line anchor found ${hit.length} times: ${needle.slice(0, 110)}`);
  lines.splice(hit[0] + 1, 0, add);
  W(f, lines.join('\n')); edits++;
}

const C = '#c2410c', NAVY = '#fdba74', SOFT = '#ffedd5', BORDER = 'rgba(194,65,12,0.35)';
const TAG = 'Find what each shape weighs';
const TAGLONG = 'Shapes sit on balance scales; work out what each one weighs';
const HOW = 'A few balance scales hold shapes and numbered weights. Every shape has one hidden whole-number weight, the same on every scale. Give each shape a weight and check: every scale swings to where your weights put it, and you see how many match the picture, never which shape is wrong. Three shapes on Monday, six on Sunday, with tilted scales on the harder days. Ranked on the fewest checks, then the clock.';
const BLURB = 'Shapes and numbered weights on a few balance scales. Work out what each shape weighs in the fewest checks.';

// 1. the registry: the row, the premiere, solve-only
after('lib/daily-games.js', `  { key: 'cipher', miss: null, name: 'Cipher', cat: 'Numbers',`,
  `  { key: 'scales', miss: 'Checks', name: 'Scales', cat: 'Numbers', tag: '${TAG}', tagLong: '${TAGLONG}', how: '${HOW}', color: '${C}', colorNavy: '${NAVY}' },`);
one('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n  { key: 'scales', from: '2026-11-26', until: '2026-12-03' },\n`);
one('lib/daily-games.js', `'duet', 'lamps', 'cipher', 'hinge',`, `'duet', 'lamps', 'cipher', 'scales', 'hinge',`);
after('lib/daily-row-stats.js', `  Replays: 'replay',`, `  Checks: 'check',`);

// 2. the end card
after('app/DailyEndCard.jsx', `  cipher: { accent: '#0f766e', badgeBg: '#0f766e', badgeInk: T.white, Fin: KeyRound },`,
  `  scales: { accent: '${C}', badgeBg: '${C}', badgeInk: T.white, Fin: Trophy },`);
after('app/DailyEndCard.jsx', `  { key: 'cipher', cat: 'numbers',`,
  `  { key: 'scales', cat: 'numbers',   name: 'Scales', tag: '${TAG}', blurb: '${BLURB}', href: '/scales' },`);
for (const f of ['app/DailyEndCard.jsx', 'app/api/quiz/daily-order/route.js']) one(f, `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['scales', `);

// 3. promo, grid, strip
after('app/DailyGamesPromo.jsx', `  { key: 'cipher', href: '/cipher'`,
  `  { key: 'scales', href: '/scales', name: 'Scales', tag: 'find what each shape weighs', store: 'sot_scales_day', accent: '${C}', bg: '${SOFT}', border: '${BORDER}' },`);
after('app/DailyGamesGrid.jsx', `  { key: 'cipher', href: '/cipher'`,
  `  { key: 'scales', href: '/scales', name: 'Scales', tag: '${TAG}', img: '/games/btn-scales.png' },`);
one('app/DailyGamesGrid.jsx', `keys: ['tally', 'calc', 'carve', 'cipher', 'crunch',`, `keys: ['tally', 'calc', 'carve', 'cipher', 'scales', 'crunch',`);
after('app/DailyStrip.jsx', `  { key: 'cipher', href: '/cipher'`,
  `  { key: 'scales', href: '/scales', name: 'Scales', img: '/games/btn-scales.png', store: 'sot_scales_day', tag: "${TAG}" , cat: 'Numbers' },`);
one('app/DailyStrip.jsx', `const ACCENTS = { `, `const ACCENTS = { scales: '${NAVY}', `);
one('app/DailyStrip.jsx', `const TCOL = { `, `const TCOL = { scales: '${C}', `);

// 4. archive
after('app/archive/page.js', `import { PUZZLES as CIPHER } from '../cipher/puzzles';`, `import { PUZZLES as SCALES_FULL } from '../scales/puzzles';\nconst SCALES = SCALES_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`);
after('app/archive/page.js', `  { key: 'cipher', name: 'Cipher', path: '/cipher'`,
  `  { key: 'scales', name: 'Scales', path: '/scales', tag: '${TAG}', accent: '${C}', bg: '${SOFT}', border: '${BORDER}', src: SCALES },`);

// 5. the slate maps and the Sunday slate
after('lib/daily-slate.js', `import { PUZZLES as P_cipher } from '@/app/cipher/puzzles';`, `import { PUZZLES as P_scales } from '@/app/scales/puzzles';`);
one('lib/daily-slate.js', `cipher: P_cipher, `, `cipher: P_cipher, scales: P_scales, `);
one('lib/daily-difficulty.js', `cipher: 3, `, `cipher: 3, scales: 3, `);
after('lib/game-blurbs.js', `  cipher: "`, `  scales: "Shapes on balance scales. Work out what each one weighs.",`);
after('lib/sunday-editions.js', `//   cipher  four addends stacked instead of two`, `//   scales  six shapes and six scales, two of them tilted (five and one or two on Saturday)`);

// 6. every list that names the dailies beside Cipher
for (const f of ['app/api/quiz/sunday-slate/route.js', 'lib/sunday-editions.js', 'lib/quiz-catalog.js', 'lib/loft.js', 'app/DailySlateRail.jsx']) one(f, `'cipher', `, `'cipher', 'scales', `);
for (const f of ['app/api/quiz/daily-status/route.js', 'app/quizzes/QuizHomeClient.jsx']) one(f, `|alibi|cipher|ping|`, `|alibi|cipher|scales|ping|`);

// 7. skills, glyph, preview drawing, family
one('lib/daily-skills.js', `cipher: ['math', 'ded'], `, `cipher: ['math', 'ded'], scales: ['math', 'ded'], `);
after('lib/game-glyphs.js', `  cipher: 'M9 5h9M5 11h2M6 10v2M9 11h9M4 15h16M11 19h7',`,
  `  scales: 'M12 4v16M8 20h8M4 8h16M4 8l-2.5 6a2.5 2.5 0 0 0 5 0zM20 8l-2.5 6a2.5 2.5 0 0 0 5 0z',  // a balance: beam, post and two pans`);
one('app/GamePreviewTiles.jsx', `const Cipher = () => (\n`, `// Scales: a level beam on its stand, a circle and a square against a numbered weight
const Scales = () => (
  <g><rect x={112} y={52} width={72} height={4} rx={2} className="d" /><path d="M148 56l10 22h-20z" className="d" />
    <circle cx={124} cy={41} r={10} className="m" /><rect x={137} y={32} width={19} height={19} rx={3} className="w" />
    <path d="M164 34h14l5 18h-24z" className="d" /><T x={171} y={48} s={10} c="tw">9</T></g>
);
const Cipher = () => (\n`);
one('app/GamePreviewTiles.jsx', `cipher: Cipher, `, `cipher: Cipher, scales: Scales, `);
one('lib/daily-families.js', `['tally', 'carve', 'sums', 'cipher'],`, `['tally', 'carve', 'sums', 'cipher', 'scales'],`);

// 8. groups and finish sets
one('lib/daily-groups.js', `{ name: 'Number grids', cat: 'Numbers', keys: ['sums', 'carve', 'tally', 'cipher'] },`, `{ name: 'Number grids', cat: 'Numbers', keys: ['sums', 'carve', 'tally', 'cipher', 'scales'] },`);
after('lib/finish-sets.js', `{ name: 'Codes and cuts', cat: 'Numbers', keys: ['cipher', 'carve', 'blitzed'] },`, `  { name: 'Work it out', cat: 'Numbers', keys: ['scales', 'cipher', 'crunch'] },`);

// 9. the Number grids set page: four become five
const PS = 'lib/puzzle-sets.js';
one(PS, `h1: 'Free Daily Number Grid Puzzles: Kakuro, Equal-Sum Blocks, Sum Grids and a Cryptarithm',`, `h1: 'Free Daily Number Grid Puzzles: Kakuro, Equal-Sum Blocks, Sum Grids, a Cryptarithm and Balance Scales',`);
one(PS, `description: 'Four free daily number puzzles on a grid: a kakuro, a grid you slice into equal-sum blocks, a grid you fill from a rack so every line adds to its target, and a cryptarithm where every letter is a digit. One solution each.`,
  `description: 'Five free daily number puzzles about sums: a kakuro, a grid you slice into equal-sum blocks, a grid you fill from a rack so every line adds to its target, a cryptarithm where every letter is a digit, and balance scales where every shape has a weight. One solution each.`);
one(PS, `lede: 'Four puzzles about sums on a grid. Sums is the kakuro.`, `lede: 'Five puzzles about sums, most of them on a grid. Sums is the kakuro.`);
one(PS, `Cipher is the cryptarithm: every letter stands for a different digit and exactly one assignment makes the equation true.',\n    how: [`,
  `Cipher is the cryptarithm: every letter stands for a different digit and exactly one assignment makes the equation true. Scales is the balance puzzle: shapes sit on scales with numbered weights, and you work out what each shape weighs.',\n    how: [`);
one(PS, `Cipher is the one with no grid to fill: it is an equation in letters, and the digits are the answer.',`, `Cipher is the one with no grid to fill: it is an equation in letters, and the digits are the answer. Scales has no grid either: every level scale is an equation and every tilted one tells you only which side is heavier.',`);
one(PS, `which is most of what makes it solvable.'],\n      ['Are they free?', 'All four, every day, no account required.'],`, `which is most of what makes it solvable.'],\n      ['Are they free?', 'All five, every day, no account required.'],`);

// 10. the Numbers category page: one more
const PC = 'lib/puzzle-categories.js';
one(PC, `description: 'Sixteen free daily number puzzles: five price-guessing games, a countdown-style numbers game, a cryptarithm, five games`, `description: 'Seventeen free daily number puzzles: five price-guessing games, a countdown-style numbers game, a cryptarithm, a balance scale puzzle, five games`);
one(PC, `lede: 'Sixteen number puzzles, one new board in each every day.`, `lede: 'Seventeen number puzzles, one new board in each every day.`);
one(PC, `a cryptarithm where every letter is a digit, five games of mental arithmetic against a clock`, `a cryptarithm where every letter is a digit, a set of balance scales where every shape has a weight to find, five games of mental arithmetic against a clock`);
one(PC, `'calc', 'tally', 'carve', 'cipher', 'sums', 'pricer',`, `'calc', 'tally', 'carve', 'cipher', 'scales', 'sums', 'pricer',`);
one(PC, `cipher: 'Cryptarithm', pricer:`, `cipher: 'Cryptarithm', scales: 'Balance scale puzzle', pricer:`);
one(PC, `'Cipher is a cryptarithm: every letter stands for a different digit and exactly one assignment makes the equation true. Tally fills`, `'Cipher is a cryptarithm: every letter stands for a different digit and exactly one assignment makes the equation true. Scales puts shapes and numbered weights on a few balance scales and asks what each shape weighs, ranked on how few checks you need. Tally fills`);
one(PC, `'Cipher stacks four addends, Tally grows to 6x6, Carve to a 7x7 in nine blocks.'`, `'Cipher stacks four addends, Tally grows to 6x6, Carve to a 7x7 in nine blocks, and Scales has six shapes with two tilted scales.'`);

// 11. challenges and the share card lead with checks
after('lib/challenge-metric.js', `  park: { unit: 'moves', one: 'move', dir: 'low', solveFirst: true, field: 'guesses' },`, `  scales: { unit: 'checks', one: 'check', dir: 'low', solveFirst: true, field: 'guesses' },`);

console.log(`wire-scales: ${edits} edits, ${skipped} already present`);
