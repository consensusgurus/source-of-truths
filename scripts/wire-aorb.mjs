// scripts/wire-aorb.mjs: wires Aorb, the daily A-or-B crowd game (Crowd
// Psychology), into every registry, beside Herd wherever Herd sits.
// Anchored edits: every anchor must match EXACTLY ONCE or the script throws,
// and an edit whose insertion is already present is skipped, so a re-run is safe.
//   node scripts/wire-aorb.mjs [dir]
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

const TAG = 'Your pick, then the crowd call';
const TAGLONG = 'Ten A or B pairs, your pick and the crowd call';
const HOW = "Ten A or B pairs. Tap Me on your own pick and Crowd on what most players picked. Your call scores the real split, out of 100. It moves all day.";
const BLURB = 'Ten A or B pairs. Make your own pick, then call the crowd; your call scores the real split.';
const COLOR = '#6d28d9', NAVY = '#c084fc', BG = '#f3edfd', BORDER = 'rgba(109,40,217,0.4)';

// 1. lib/daily-games.js: the row, and the premiere window
afterLine('lib/daily-games.js', "{ key: 'herd', miss: null, name: 'Herd', cat: 'Crowd Psychology'", [
  `  { key: 'aorb', miss: null, name: 'Aorb', cat: 'Crowd Psychology', tag: '${TAG}', tagLong: '${TAGLONG}', how: "${HOW}", color: '${COLOR}', colorNavy: '${NAVY}' },`]);
afterLine('lib/daily-games.js', "{ key: 'herd', from: '2026-10-17', until: '2026-10-21' },", [
  `  { key: 'aorb', from: '2026-10-23', until: '2026-10-27' },`]);

// 2. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['aorb', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['aorb', `);
afterLine('app/DailyEndCard.jsx', "  herd: { accent: '#92400e', badgeBg: '#92400e', badgeInk: T.white, Fin: BarChart3 },", [
  `  aorb: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: BarChart3 },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'herd',   cat: 'crowd',", [
  `  { key: 'aorb',   cat: 'crowd',     name: 'Aorb',   tag: '${TAG}',  blurb: '${BLURB}', href: '/aorb' },`]);

// 3. promo, grid, strip, tile panel
afterLine('app/DailyGamesPromo.jsx', "{ key: 'herd', href: '/herd'", [
  `  { key: 'aorb', href: '/aorb', name: 'Aorb', tag: 'your pick, then the crowd call', store: 'sot_aorb_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'herd', href: '/herd'", [
  `  { key: 'aorb', href: '/aorb', name: 'Aorb', tag: '${TAG}', img: '/games/btn-aorb.png' },`]);
sub('app/DailyGamesGrid.jsx', `{ key: 'crowd', label: 'Crowd Psychology', keys: ['herd', 'outwit', 'outrank', 'feud'] },`, `{ key: 'crowd', label: 'Crowd Psychology', keys: ['aorb', 'herd', 'outwit', 'outrank', 'feud'] },`);
afterLine('app/DailyStrip.jsx', "{ key: 'herd', href: '/herd'", [
  `  { key: 'aorb', href: '/aorb', name: 'Aorb', img: '/games/btn-aorb.png', store: 'sot_aorb_day', tag: "${TAG}" , cat: 'Crowd Psychology' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { roll: '#86efac',`, `const ACCENTS = { aorb: '${NAVY}', roll: '#86efac',`);
sub('app/DailyStrip.jsx', `const TCOL = { roll: '#166534',`, `const TCOL = { aorb: '${COLOR}', roll: '#166534',`);
sub('app/DailyTilePanel.jsx', `const CROWD_GAMES = new Set(['outwit', 'outrank', 'feud', 'herd']);`, `const CROWD_GAMES = new Set(['outwit', 'outrank', 'feud', 'herd', 'aorb']);`);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as HERD_FULL } from '../herd/puzzles';`,
  `import { PUZZLES as HERD_FULL } from '../herd/puzzles';\nimport { PUZZLES as AORB_FULL } from '../aorb/puzzles';`);
afterLine('app/archive/page.js', 'const HERD = HERD_FULL.map(', [
  'const AORB = AORB_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));']);
afterLine('app/archive/page.js', "{ key: 'herd', name: 'Herd', path: '/herd'", [
  `  { key: 'aorb', name: 'Aorb', path: '/aorb', tag: '${TAG}', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: AORB },`]);

// 5. the four puzzle-map registries
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_herd } from '@/app/herd/puzzles';`,
    `import { PUZZLES as P_herd } from '@/app/herd/puzzles';\nimport { PUZZLES as P_aorb } from '@/app/aorb/puzzles';`);
  const s = rd(f);
  if (!s.includes('aorb: P_aorb')) {
    const n = s.split('herd: P_herd,').length - 1;
    if (n !== 1) throw new Error(`${f}: herd: P_herd matched ${n}`);
    wr(f, s.replace('herd: P_herd,', 'herd: P_herd, aorb: P_aorb,')); applied++;
  } else skipped++;
}

// 6. alternations, rails, catalog, loft
sub('app/api/quiz/daily-status/route.js', `|outrank|herd|shards|`, `|outrank|herd|aorb|shards|`);
sub('app/quizzes/QuizHomeClient.jsx', `|outrank|herd|shards|`, `|outrank|herd|aorb|shards|`);
sub('app/DailySlateRail.jsx', `'extra', 'stet', 'outwit', 'outrank', 'herd',`, `'extra', 'stet', 'outwit', 'outrank', 'herd', 'aorb',`);
sub('lib/quiz-catalog.js', `'outrank', 'herd', 'shards',`, `'outrank', 'herd', 'aorb', 'shards',`);
sub('lib/loft.js', `'outrank', 'outwit', 'herd', 'park',`, `'outrank', 'outwit', 'herd', 'aorb', 'park',`);

// 7. glyph, skills, scoring tables, medians, metric, difficulty
afterLine('lib/game-glyphs.js', "  herd: 'M4 7a1 1 0 1 0 2 0", [
  "  aorb: 'M4 5h16v5H4zM4 14h16v5H4zM4 5v5M13 5v5M4 14v5M8 14v5',  // two option bars, each split by its vote"]);
sub('lib/daily-skills.js', `feud: ['ppl'], herd: ['ppl'],`, `feud: ['ppl'], herd: ['ppl'], aorb: ['ppl'],`);
sub('lib/quiz-xp.js', `'potluck', 'feud', 'herd',`, `'potluck', 'feud', 'herd', 'aorb',`);
sub('lib/game-medians.js', `outwit: 90, outrank: 90, feud: 90, herd: 60,`, `outwit: 90, outrank: 90, feud: 90, herd: 60, aorb: 90,`);
sub('scripts/verify-circuits.mjs', `outwit: 90, outrank: 90, feud: 90, herd: 60,`, `outwit: 90, outrank: 90, feud: 90, herd: 60, aorb: 90,`);
sub('lib/challenge-metric.js', `  herd: { unit: 'points', one: 'point', dir: 'high' },`, `  herd: { unit: 'points', one: 'point', dir: 'high' },\n  aorb: { unit: 'points', one: 'point', dir: 'high' },`);
sub('lib/daily-difficulty.js', `  herd: 1, jig: 1,`, `  herd: 1, aorb: 1, jig: 1,`);

// 8. sets and the crowd category page
afterLine('lib/finish-sets.js', "{ name: 'Read the crowd', cat: 'Crowd Psychology',", [
  "  { name: 'Call the split', cat: 'Crowd Psychology', keys: ['aorb', 'herd', 'feud'] },"]);
sub('lib/puzzle-categories.js', `    description: 'Four free daily games with no answer key: the answers are whatever today’s players say. Side with the herd, match the crowd’s top answers, avoid what it picks, and call its order. Live all day, no signup.',
    lede: 'Four games where the answer key is the other players. Herd pays you for picking what most players picked, Feud for matching what the crowd says,`,
  `    description: 'Five free daily games with no answer key: the answers are whatever today’s players say. Call the A or B split, side with the herd, match the crowd, avoid it, call its order.',
    lede: 'Five games where the answer key is the other players. Aorb asks for your own pick and your call on the crowd’s on ten A or B pairs, and pays your call by the real split. Herd pays you for picking what most players picked, Feud for matching what the crowd says,`);
sub('lib/puzzle-categories.js', `    keys: ['herd', 'feud', 'outwit', 'outrank'],
    generic: { herd: 'Pick with the herd',`,
  `    keys: ['aorb', 'herd', 'feud', 'outwit', 'outrank'],
    generic: { aorb: 'A or B, call the crowd', herd: 'Pick with the herd',`);
sub('lib/puzzle-categories.js', `      'Herd gives you ten quick calls and pays a point`, `      'Aorb gives you ten A or B pairs: you make your own pick, then call which side most players picked, and the call earns the share of the room on that side. Herd gives you ten quick calls and pays a point`);
sub('lib/puzzle-categories.js', `    start: 'Herd if you want something quick.`, `    start: 'Aorb if you like a debate. Herd if you want something quick.`);
sub('lib/puzzle-categories.js', `it keeps growing. The board settles at Eastern midnight.'],
      ['Are they free?', 'All four, every day, no account required.'],`, `it keeps growing. The board settles at Eastern midnight.'],
      ['Are they free?', 'All five, every day, no account required.'],`);

console.log(`wire-aorb: ${applied} edits applied, ${skipped} already present`);
