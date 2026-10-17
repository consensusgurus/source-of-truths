// scripts/wire-herd.mjs: wires Herd, the daily crowd-selection game (Crowd
// Psychology), into every registry, beside Feud wherever Feud sits.
// Anchored edits: every anchor must match EXACTLY ONCE or the script throws,
// and an edit whose insertion is already present is skipped, so a re-run is safe.
//   node scripts/wire-herd.mjs [dir]
import fs from 'fs';
import path from 'path';
const root = process.argv[2] || '.';
let applied = 0, skipped = 0;
function rd(f) { return fs.readFileSync(path.join(root, f), 'utf8'); }
function wr(f, s) { fs.writeFileSync(path.join(root, f), s); }
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

const TAG = 'Pick what most people pick';
const TAGLONG = 'Ten quick A or B calls, scored on the crowd';
const HOW = "Ten quick questions, every one A or B. Pick the answer you think most of today's players picked: every call with the herd scores. It shifts all day.";
const BLURB = 'Ten quick this-or-that calls. Pick what you think most players picked; every call with the herd scores.';
const COLOR = '#92400e', NAVY = '#fcd34d', BG = '#fdf3e4', BORDER = 'rgba(146,64,14,0.4)';

// 1. lib/daily-games.js
afterLine('lib/daily-games.js', "{ key: 'feud', miss: null, name: 'Feud', cat: 'Crowd Psychology'", [
  `  { key: 'herd', miss: null, name: 'Herd', cat: 'Crowd Psychology', tag: '${TAG}', tagLong: '${TAGLONG}', how: "${HOW}", color: '${COLOR}', colorNavy: '${NAVY}' },`]);
afterLine('lib/daily-games.js', "{ key: 'gift', from: '2026-10-16', until: '2026-10-20' },", [
  `  { key: 'herd', from: '2026-10-17', until: '2026-10-21' },`]);

// 2. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['herd', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['herd', `);
afterLine('app/DailyEndCard.jsx', "  feud: { accent: '#9f1239', badgeBg: '#9f1239', badgeInk: T.white, Fin: BarChart3 },", [
  `  herd: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: BarChart3 },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'feud',   cat: 'crowd',", [
  `  { key: 'herd',   cat: 'crowd',     name: 'Herd',   tag: '${TAG}',      blurb: '${BLURB}', href: '/herd' },`]);

// 3. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'feud', href: '/feud'", [
  `  { key: 'herd', href: '/herd', name: 'Herd', tag: 'pick what most people pick', store: 'sot_herd_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'feud', href: '/feud'", [
  `  { key: 'herd', href: '/herd', name: 'Herd', tag: '${TAG}', img: '/games/btn-herd.png' },`]);
sub('app/DailyGamesGrid.jsx', `{ key: 'crowd', label: 'Crowd Psychology', keys: ['outwit', 'outrank', 'feud'] },`, `{ key: 'crowd', label: 'Crowd Psychology', keys: ['herd', 'outwit', 'outrank', 'feud'] },`);
afterLine('app/DailyStrip.jsx', "{ key: 'feud', href: '/feud'", [
  `  { key: 'herd', href: '/herd', name: 'Herd', img: '/games/btn-herd.png', store: 'sot_herd_day', tag: "${TAG}" , cat: 'Crowd Psychology' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { scour: '#7dd3fc',`, `const ACCENTS = { herd: '${NAVY}', scour: '#7dd3fc',`);
sub('app/DailyStrip.jsx', `const TCOL = { scour: '#0369a1',`, `const TCOL = { herd: '${COLOR}', scour: '#0369a1',`);
sub('app/DailyTilePanel.jsx', `const CROWD_GAMES = new Set(['outwit', 'outrank', 'feud']);`, `const CROWD_GAMES = new Set(['outwit', 'outrank', 'feud', 'herd']);`);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as FEUD_FULL } from '../feud/puzzles';`,
  `import { PUZZLES as FEUD_FULL } from '../feud/puzzles';\nimport { PUZZLES as HERD_FULL } from '../herd/puzzles';`);
afterLine('app/archive/page.js', 'const FEUD = FEUD_FULL.map(', [
  'const HERD = HERD_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));']);
afterLine('app/archive/page.js', "{ key: 'feud', name: 'Feud', path: '/feud'", [
  `  { key: 'herd', name: 'Herd', path: '/herd', tag: '${TAG}', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: HERD },`]);

// 5. the four puzzle-map registries
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_feud } from '@/app/feud/puzzles';`,
    `import { PUZZLES as P_feud } from '@/app/feud/puzzles';\nimport { PUZZLES as P_herd } from '@/app/herd/puzzles';`);
  sub(f, `feud: P_feud, babel: P_babel,`, `feud: P_feud, herd: P_herd, babel: P_babel,`);
}

// 6. alternations, rails, catalog, loft
sub('app/api/quiz/daily-status/route.js', `|outrank|shards|`, `|outrank|herd|shards|`);
sub('app/quizzes/QuizHomeClient.jsx', `|outrank|shards|`, `|outrank|herd|shards|`);
sub('app/DailySlateRail.jsx', `'extra', 'stet', 'outwit', 'outrank',`, `'extra', 'stet', 'outwit', 'outrank', 'herd',`);
sub('lib/quiz-catalog.js', `'outrank', 'shards',`, `'outrank', 'herd', 'shards',`);
sub('lib/loft.js', `'outrank', 'outwit', 'park',`, `'outrank', 'outwit', 'herd', 'park',`);

// 7. glyph, skills, scoring tables, medians, metric
afterLine('lib/game-glyphs.js', "  feud: 'M4 6h7v4H4z", [
  "  herd: 'M5 7a1.6 1.6 0 1 1 0 3.2a1.6 1.6 0 1 1 0-3.2M9 5a1.6 1.6 0 1 1 0 3.2a1.6 1.6 0 1 1 0-3.2M7 11a1.6 1.6 0 1 1 0 3.2a1.6 1.6 0 1 1 0-3.2M11 9.5a1.6 1.6 0 1 1 0 3.2a1.6 1.6 0 1 1 0-3.2M8 16a1.6 1.6 0 1 1 0 3.2a1.6 1.6 0 1 1 0-3.2M15 4v16M19.5 14a1.6 1.6 0 1 1 0 3.2a1.6 1.6 0 1 1 0-3.2',  // a herd on one side of the line, one stray"]);
sub('lib/daily-skills.js', `babel: ['lang', 'plan'], feud: ['ppl'],`, `babel: ['lang', 'plan'], feud: ['ppl'], herd: ['ppl'],`);
sub('lib/quiz-xp.js', `'potluck', 'feud',`, `'potluck', 'feud', 'herd',`);
sub('lib/game-medians.js', `outwit: 90, outrank: 90, feud: 90,`, `outwit: 90, outrank: 90, feud: 90, herd: 60,`);
sub('lib/challenge-metric.js', `  feud: { unit: 'points', one: 'point', dir: 'high' },`, `  feud: { unit: 'points', one: 'point', dir: 'high' },\n  herd: { unit: 'points', one: 'point', dir: 'high' },`);
sub('scripts/verify-circuits.mjs', `outwit: 90, outrank: 90, feud: 90,`, `outwit: 90, outrank: 90, feud: 90, herd: 60,`);

// 8. sets and the crowd category page
sub('lib/finish-sets.js', `{ name: 'Read the crowd', cat: 'Crowd Psychology', keys: ['outwit', 'outrank', 'feud'] },`, `{ name: 'Read the crowd', cat: 'Crowd Psychology', keys: ['herd', 'outwit', 'outrank', 'feud'] },`);
sub('lib/puzzle-categories.js', `    description: 'Three free daily games with no answer key: the answers are whatever today’s players say. Match the crowd’s top answers, avoid what the crowd picks, and call the order the crowd ranks things in. Live all day, new prompts at midnight Eastern, no signup.',
    lede: 'Three games where the answer key is the other players. Feud pays you for matching what the crowd says, Outwit pays you for not matching it, and Outrank asks you to call the order the rest of the day’s players put things in.`,
  `    description: 'Four free daily games with no answer key: the answers are whatever today’s players say. Side with the herd, match the crowd’s top answers, avoid what it picks, and call its order. Live all day, no signup.',
    lede: 'Four games where the answer key is the other players. Herd pays you for picking what most players picked, Feud for matching what the crowd says, Outwit for not matching it, and Outrank asks you to call the order the rest of the day’s players put things in.`);
sub('lib/puzzle-categories.js', `    keys: ['feud', 'outwit', 'outrank'],
    generic: { feud: 'Match the crowd', outwit: 'Beat the crowd', outrank: 'Predict the ranking' },`,
  `    keys: ['herd', 'feud', 'outwit', 'outrank'],
    generic: { herd: 'Pick with the herd', feud: 'Match the crowd', outwit: 'Beat the crowd', outrank: 'Predict the ranking' },`);
sub('lib/puzzle-categories.js', `      'Feud gives you five prompts and three guesses each,`, `      'Herd gives you ten quick calls and pays a point for every one that lands with the most-picked answer. Feud gives you five prompts and three guesses each,`);
sub('lib/puzzle-categories.js', `    start: 'Feud if you have watched the television version.`, `    start: 'Herd if you want something quick. Feud if you have watched the television version.`);
sub('lib/puzzle-categories.js', `      ['Are they free?', 'All three, every day, no account required.'],
    ],
  },
  {
    slug: 'arcade-games',`, `      ['Are they free?', 'All four, every day, no account required.'],
    ],
  },
  {
    slug: 'arcade-games',`);

console.log(`wire-herd: ${applied} edits applied, ${skipped} already present`);
