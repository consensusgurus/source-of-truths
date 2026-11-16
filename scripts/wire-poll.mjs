// scripts/wire-poll.mjs: wires Poll, the daily crowd-percentage game (Crowd
// Psychology, launched 2026-11-16), into every registry, beside Herd wherever
// Herd sits. Anchored edits: every anchor must match EXACTLY ONCE or the script
// throws, and an edit whose insertion is already present is skipped, so a
// re-run is safe.
//   node scripts/wire-poll.mjs [dir]
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

const TAG = 'Guess how the crowd split';
const TAGLONG = 'Five A or B questions: pick yours, guess the percentage';
const HOW = "Five A or B questions. Give your own pick, then guess the percentage of today's players on each side. The closer the guess, the more it scores. It shifts all day.";
const BLURB = 'Five this-or-that questions. Pick yours, then guess the percentage of players on each side; the closer the guess, the more it scores.';
const COLOR = '#0f766e', NAVY = '#5eead4', BG = '#e6f7f4', BORDER = 'rgba(15,118,110,0.4)';

// 1. lib/daily-games.js: the registry row and the premiere window
afterLine('lib/daily-games.js', "{ key: 'herd', miss: null, name: 'Herd', cat: 'Crowd Psychology'", [
  `  { key: 'poll', miss: null, name: 'Poll', cat: 'Crowd Psychology', tag: '${TAG}', tagLong: '${TAGLONG}', how: "${HOW}", color: '${COLOR}', colorNavy: '${NAVY}' },`]);
afterLine('lib/daily-games.js', 'export const PREMIERES = [', [
  `  { key: 'poll', from: '2026-11-16', until: '2026-11-21' },`]);

// 2. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['poll', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['poll', `);
afterLine('app/DailyEndCard.jsx', "  herd: { accent: '#92400e', badgeBg: '#92400e', badgeInk: T.white, Fin: BarChart3 },", [
  `  poll: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: BarChart3 },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'herd',   cat: 'crowd',", [
  `  { key: 'poll',   cat: 'crowd',     name: 'Poll',   tag: '${TAG}',      blurb: '${BLURB}', href: '/poll' },`]);

// 3. promo, grid, strip, tile panel
afterLine('app/DailyGamesPromo.jsx', "{ key: 'herd', href: '/herd'", [
  `  { key: 'poll', href: '/poll', name: 'Poll', tag: 'guess how the crowd split', store: 'sot_poll_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'herd', href: '/herd'", [
  `  { key: 'poll', href: '/poll', name: 'Poll', tag: '${TAG}', img: '/games/btn-poll.png' },`]);
sub('app/DailyGamesGrid.jsx', `{ key: 'crowd', label: 'Crowd Psychology', keys: ['herd', 'outwit', 'outrank', 'feud'] },`, `{ key: 'crowd', label: 'Crowd Psychology', keys: ['herd', 'poll', 'outwit', 'outrank', 'feud'] },`);
afterLine('app/DailyStrip.jsx', "{ key: 'herd', href: '/herd'", [
  `  { key: 'poll', href: '/poll', name: 'Poll', img: '/games/btn-poll.png', store: 'sot_poll_day', tag: "${TAG}" , cat: 'Crowd Psychology' },`]);
sub('app/DailyStrip.jsx', `herd: '#fcd34d', scour: '#7dd3fc',`, `herd: '#fcd34d', poll: '${NAVY}', scour: '#7dd3fc',`);
sub('app/DailyStrip.jsx', `herd: '#92400e', scour: '#0369a1',`, `herd: '#92400e', poll: '${COLOR}', scour: '#0369a1',`);
sub('app/DailyTilePanel.jsx', `const CROWD_GAMES = new Set(['outwit', 'outrank', 'feud', 'herd']);`, `const CROWD_GAMES = new Set(['outwit', 'outrank', 'feud', 'herd', 'poll']);`);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as HERD_FULL } from '../herd/puzzles';`,
  `import { PUZZLES as HERD_FULL } from '../herd/puzzles';\nimport { PUZZLES as POLL_FULL } from '../poll/puzzles';`);
afterLine('app/archive/page.js', 'const HERD = HERD_FULL.map(', [
  'const POLL = POLL_FULL.map(({ num, quizId, live, dateLabel }) => ({ num, quizId, live, dateLabel, sunday: false }));']);
afterLine('app/archive/page.js', "{ key: 'herd', name: 'Herd', path: '/herd'", [
  `  { key: 'poll', name: 'Poll', path: '/poll', tag: '${TAG}', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: POLL },`]);

// 5. the puzzle-map registries (no Sunday Edition, so not the Sunday slate)
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js']) {
  sub(f, `import { PUZZLES as P_herd } from '@/app/herd/puzzles';`,
    `import { PUZZLES as P_herd } from '@/app/herd/puzzles';\nimport { PUZZLES as P_poll } from '@/app/poll/puzzles';`);
  sub(f, `herd: P_herd, babel: P_babel,`, `herd: P_herd, poll: P_poll, babel: P_babel,`);
}

// 6. alternations, rails, catalog, loft
sub('app/api/quiz/daily-status/route.js', `|outrank|herd|shards|`, `|outrank|herd|poll|shards|`);
sub('app/quizzes/QuizHomeClient.jsx', `|outrank|herd|shards|`, `|outrank|herd|poll|shards|`);
sub('app/DailySlateRail.jsx', `'outwit', 'outrank', 'herd',`, `'outwit', 'outrank', 'herd', 'poll',`);
sub('lib/quiz-catalog.js', `'outrank', 'herd', 'shards',`, `'outrank', 'herd', 'poll', 'shards',`);
sub('lib/loft.js', `'outrank', 'outwit', 'herd', 'park',`, `'outrank', 'outwit', 'herd', 'poll', 'park',`);

// 7. glyph, skills, blurb, difficulty, family, scoring tables, medians, metric
afterLine('lib/game-glyphs.js', "  herd: 'M4 7a1 1 0 1 0 2 0", [
  "  poll: 'M4 5h6.5v5H4zM13.5 5H20v5h-6.5zM4 16.5h16M14 14.2a2.3 2.3 0 1 0 0 4.6a2.3 2.3 0 1 0 0-4.6',"]);
sub('lib/daily-skills.js', `feud: ['ppl'], herd: ['ppl'],`, `feud: ['ppl'], herd: ['ppl'], poll: ['ppl'],`);
afterLine('lib/game-blurbs.js', '  herd: "Ten A or B questions. Pick what most players picked.",', [
  '  poll: "Five A or B questions. Guess how the crowd split.",']);
sub('lib/daily-difficulty.js', `  herd: 1, jig: 1,`, `  herd: 1, poll: 1, jig: 1,`);
sub('lib/daily-families.js', `['outwit', 'outrank', 'feud', 'herd'],`, `['outwit', 'outrank', 'feud', 'herd', 'poll'],`);
sub('lib/quiz-xp.js', `'feud', 'herd', 'scram',`, `'feud', 'herd', 'poll', 'scram',`);
sub('lib/game-medians.js', `feud: 90, herd: 60,`, `feud: 90, herd: 60, poll: 75,`);
sub('lib/challenge-metric.js', `  herd: { unit: 'points', one: 'point', dir: 'high' },`, `  herd: { unit: 'points', one: 'point', dir: 'high' },\n  poll: { unit: 'points', one: 'point', dir: 'high' },`);

// 8. sets and the crowd category page (five games now)
sub('lib/finish-sets.js', `{ name: 'Read the crowd', cat: 'Crowd Psychology', keys: ['herd', 'outwit', 'outrank', 'feud'] },`,
  `{ name: 'Read the crowd', cat: 'Crowd Psychology', keys: ['herd', 'outwit', 'outrank', 'feud'] },\n  { name: 'Call the split', cat: 'Crowd Psychology', keys: ['herd', 'poll'] },`);
sub('lib/puzzle-categories.js', `    description: 'Four free daily games with no answer key: the answers are whatever today’s players say. Side with the herd, match the crowd, avoid it, call its order.',`,
  `    description: 'Five free daily games with no answer key: the answers are whatever today’s players say. Side with the herd, guess the split, match the crowd, avoid it.',`);
sub('lib/puzzle-categories.js', `    lede: 'Four games where the answer key is the other players. Herd pays you for picking what most players picked, Feud for matching`,
  `    lede: 'Five games where the answer key is the other players. Herd pays you for picking what most players picked, Poll for guessing the percentage on each side of a question, Feud for matching`);
sub('lib/puzzle-categories.js', `    keys: ['herd', 'feud', 'outwit', 'outrank'],
    generic: { herd: 'Pick with the herd', feud: 'Match the crowd', outwit: 'Beat the crowd', outrank: 'Predict the ranking' },`,
  `    keys: ['herd', 'poll', 'feud', 'outwit', 'outrank'],
    generic: { herd: 'Pick with the herd', poll: 'Guess the split', feud: 'Match the crowd', outwit: 'Beat the crowd', outrank: 'Predict the ranking' },`);
sub('lib/puzzle-categories.js', `      'Herd gives you ten quick calls and pays a point for every one that lands with the most-picked answer. Feud gives you`,
  `      'Herd gives you ten quick calls and pays a point for every one that lands with the most-picked answer. Poll asks five this-or-that questions, takes your own pick, then scores your guess at the percentage of players on each side. Feud gives you`);
sub('lib/puzzle-categories.js', `    start: 'Herd if you want something quick. Feud if you have watched`, `    start: 'Herd if you want something quick. Poll if you think you know people. Feud if you have watched`);
sub('lib/puzzle-categories.js', `      ['Are they free?', 'All four, every day, no account required.'],
    ],
  },
  {
    slug: 'arcade-games',`, `      ['Are they free?', 'All five, every day, no account required.'],
    ],
  },
  {
    slug: 'arcade-games',`);

console.log(`wire-poll: ${applied} edits applied, ${skipped} already present`);
