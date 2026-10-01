// scripts/wire-pricer.mjs — puts Pricer (the one-product price guess, launched
// 2026-10-02) back into every registry the bracket-era pull took it out of,
// plus the registries added since. Anchored: every anchor must match exactly
// once or the script throws; idempotent on re-run.
//
//   node scripts/wire-pricer.mjs <dir>     (<dir> = a fresh export of FETCH_HEAD)
import fs from 'fs';
import path from 'path';

const root = process.argv[2];
if (!root) { console.error('usage: node wire-pricer.mjs <dir>'); process.exit(1); }
let applied = 0, skipped = 0;
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const write = (f, s) => fs.writeFileSync(path.join(root, f), s);
function edit(file, anchor, replacement) {
  const src = read(file);
  // Skip only when the work is DONE: the replacement is there and the anchor
  // is gone. (A commented-out line contains its own uncommented text, so
  // 'replacement present' alone reads a pending edit as a finished one.)
  if (src.includes(replacement) && (replacement.includes(anchor) || !src.includes(anchor))) { skipped++; return; }
  const n = src.split(anchor).length - 1;
  if (n !== 1) throw new Error(`${file}: anchor matched ${n} times, expected 1\n  ${anchor.slice(0, 140)}`);
  write(file, src.replace(anchor, replacement));
  applied++;
}
// Replace the `PRICER PULLED` comment line carrying `tag`, plus the `extra`
// commented lines under it, with `replacement`.
function unpull(file, tag, extra, replacement) {
  const src = read(file);
  const lines = src.split('\n');
  const hits = lines.map((l, i) => (l.includes('PRICER PULLED') && l.includes(tag) ? i : -1)).filter((i) => i >= 0);
  if (!hits.length && src.includes(replacement)) { skipped++; return; }
  if (hits.length !== 1) throw new Error(`${file}: PRICER PULLED "${tag}" matched ${hits.length} times`);
  lines.splice(hits[0], 1 + extra, replacement);
  write(file, lines.join('\n'));
  applied++;
}

const TAG = 'Guess the price';
const HOW = 'One real product a day and five guesses at what it costs. Each guess says higher or lower and how hot you are, Freezing to Burning. Your score is your closest guess, 0 to 10, measured as a ratio so half and double are equally far; within 1% is a bullseye and ends the day. Amazon products on weekdays, a big-ticket item on Sundays.';
const COLOR = '#15803d', NAVY = '#4ade80';

// 1. the registry row, and the premiere pop-up window (owner: the new-game
//    pop-up for returning players, Fri 10/2 through Tue 10/6)
unpull('lib/daily-games.js', 'master registry entry', 1,
  `  { key: 'pricer', miss: 'Guesses', name: 'Pricer', cat: 'Numbers', tag: '${TAG}', how: '${HOW}', color: '${COLOR}', colorNavy: '${NAVY}' },`);
edit('lib/daily-games.js',
  `  { key: 'whittle', from: '2026-09-04', until: '2026-09-08' },`,
  `  { key: 'whittle', from: '2026-09-04', until: '2026-09-08' },\n  { key: 'pricer', from: '2026-10-02', until: '2026-10-06' },`);

// 2. Sunday Edition: the big-ticket day
unpull('lib/sunday-editions.js', 'sunday registry', 2, `  'pricer',`);
edit('lib/sunday-editions.js',
  `//   pricer  a field of 32 instead of 16, so 31 picks and five rounds`,
  `//   pricer  a big-ticket item (a car, a watch, a motorcycle) at the maker's starting price`);

// 3. the slate rows and tiles
unpull('app/DailyStrip.jsx', 'slate tile', 1,
  `  { key: 'pricer', href: '/pricer', name: 'Pricer', img: '/games/btn-pricer.png', store: 'sot_pricer_day', tag: "${TAG}" , cat: 'Numbers' },`);
unpull('app/DailyEndCard.jsx', 'end-card suggestion', 1,
  `  { key: 'pricer',  cat: 'numbers',  name: 'Pricer',  tag: '${TAG}', blurb: 'One real product a day and five guesses at its price, hot or cold after each. Your closest guess is your score.', href: '/pricer' },`);
edit('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['yose',`, `const LAUNCH_PIN = { keys: ['pricer', 'yose',`);
edit('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['yose',`, `const LAUNCH_PIN = { keys: ['pricer', 'yose',`);
unpull('app/DailyGamesPromo.jsx', 'promo tile', 1,
  `  { key: 'pricer', href: '/pricer', name: 'Pricer', tag: 'guess the price', store: 'sot_pricer_day', accent: '${COLOR}', bg: '#dcfce7', border: 'rgba(21,128,61,0.35)' },`);
unpull('app/DailyGamesGrid.jsx', 'games grid tile', 1,
  `  { key: 'pricer', href: '/pricer', name: 'Pricer', tag: '${TAG}', img: '/games/btn-pricer.png' },`);
for (const f of ['app/DailyGamesGrid.jsx', 'app/daily/DailyArchiveClient.jsx']) {
  edit(f, `  { key: 'numbers', label: 'Numbers', keys: ['tally', 'calc', 'carve', 'cipher', 'crunch', 'blitz', 'blitzed', 'sums'] },`,
    `  { key: 'numbers', label: 'Numbers', keys: ['tally', 'calc', 'carve', 'cipher', 'crunch', 'blitz', 'blitzed', 'sums', 'pricer'] },`);
}

// 4. the /daily index: import, map, card
unpull('app/daily/page.js', 'daily index import', 1, `import { PUZZLES as PRICER_FULL } from '../pricer/puzzles';`);
edit('app/daily/page.js',
  `// const PRICER = PRICER_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`,
  `const PRICER = PRICER_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`);
unpull('app/daily/page.js', 'daily index tile', 1,
  `  { key: 'pricer', name: 'Pricer', path: '/pricer', tag: '${TAG}', accent: '${COLOR}', bg: '#dcfce7', border: 'rgba(21,128,61,0.35)', src: PRICER },`);

// 5. the four puzzle maps (a game missing here has no board and no points)
unpull('lib/daily-slate.js', 'slate puzzle map', 6, `  pricer: P_pricer,`);
for (const f of ['app/api/quiz/sunday-slate/route.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js']) {
  unpull(f, '', 1, `import { PUZZLES as P_pricer } from '@/app/pricer/puzzles';`);
  edit(f, `whittle: P_whittle,`, `whittle: P_whittle, pricer: P_pricer,`);
}

// 6. the id alternations, the catalog set, the rail, the sitemap
edit('app/api/quiz/daily-status/route.js', `|whittle|diag|frame|rim|yose|crib)-`, `|whittle|diag|frame|rim|yose|crib|pricer)-`);
edit('app/quizzes/QuizHomeClient.jsx', `|whittle|diag|frame|rim|yose|crib)-`, `|whittle|diag|frame|rim|yose|crib|pricer)-`);
edit('lib/quiz-catalog.js', `'whittle', 'diag', 'frame', 'rim', 'yose', 'crib']);`, `'whittle', 'diag', 'frame', 'rim', 'yose', 'crib', 'pricer']);`);
edit('app/DailySlateRail.jsx', `'whittle', 'diag', 'frame', 'rim',`, `'whittle', 'pricer', 'diag', 'frame', 'rim',`);
edit('lib/sitemap-entries.js', `'whittle', 'diag', 'frame', 'rim',`, `'whittle', 'pricer', 'diag', 'frame', 'rim',`);
edit('lib/sitemap-entries.js',
  `// sitemap, never the stub. PRICER PULLED 2026-08-09 (see CLAUDE.md); restore by adding\n// 'pricer' back to this list.`,
  `// sitemap, never the stub.`);

// 7. the Numbers landing page counts its games in words
edit('lib/puzzle-categories.js',
  `    description: 'Eight free daily number puzzles: a countdown-style numbers game,`,
  `    description: 'Nine free daily number puzzles: a price-guessing game, a countdown-style numbers game,`);
edit('lib/puzzle-categories.js',
  `    lede: 'Eight number puzzles, one new board in each every day. A six-numbers-one-target game,`,
  `    lede: 'Nine number puzzles, one new board in each every day. A price you have five guesses to pin down, a six-numbers-one-target game,`);
edit('lib/puzzle-categories.js',
  `    keys: ['blitz', 'blitzed', 'crunch', 'calc', 'tally', 'carve', 'cipher', 'sums'],`,
  `    keys: ['blitz', 'blitzed', 'crunch', 'calc', 'tally', 'carve', 'cipher', 'sums', 'pricer'],`);
edit('lib/puzzle-categories.js',
  `crunch: 'Numbers game', calc: 'Calculator path', tally: 'Sum grid', carve: 'Equal-sum blocks', cipher: 'Cryptarithm',`,
  `crunch: 'Numbers game', calc: 'Calculator path', tally: 'Sum grid', carve: 'Equal-sum blocks', cipher: 'Cryptarithm', pricer: 'Price guessing',`);
edit('lib/puzzle-categories.js',
  `      ['Sunday Edition', 'Cipher stacks four addends, Tally grows to 6x6, Carve to a 7x7 in nine blocks.'],`,
  `      ['Sunday Edition', 'Cipher stacks four addends, Tally grows to 6x6, Carve to a 7x7 in nine blocks, and Pricer puts a car or a watch up for guessing.'],`);

// 8. verify-circuits' exclusion reason was written for the bracket
edit('scripts/verify-circuits.mjs',
  `  pricer: 'pulled from the server slate (GAME_PUZZLES), so it has no board, no field and no points',`,
  `  pricer: 'not in a circuit yet: a price guess has no natural partner among the number games (owner call)',`);

console.log(`wire-pricer: ${applied} edits applied, ${skipped} already present`);
