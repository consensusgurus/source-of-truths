// scripts/wire-bacon.mjs: wires Bacon (link two actors through the films they
// share, Trivia) into every registry, beside Tape. Placement follows "Placing a
// new daily" in docs/claude/daily-authoring.md: category Trivia, skills Memory
// and Planning, the category key lists, and a new Guessing games group (Clade,
// Dossier, Bacon) split off Single-topic trivia, which keeps Deep, Niche and
// Slot. The set page prose for both is rewritten here, plus the On screen
// finish set and the trivia page copy.
//
// Anchored edits: every anchor must match EXACTLY ONCE or the script throws,
// and an edit whose insertion is already present is skipped, so a re-run is safe.
//   node scripts/wire-bacon.mjs <dir>
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

const TAG = 'Link two actors through films';
const TAGLONG = 'Two actors a day, linked through films they made together';
const HOW = 'Link two actors through films they made together: name a film, type a co-star from it, and keep going. A wrong film or co-star is a strike; three end the day. Fewer films score more.';
const BLURB = 'Two actors a day. Link them through films they made together, typing every co-star, in the fewest films. A classic star on Sundays.';
const COLOR = '#9a3412', NAVY = '#fdba74', BG = '#fdeee2', BORDER = 'rgba(154,52,18,0.35)';

// 1. lib/daily-games.js: the row, the premiere, the score view
afterLine('lib/daily-games.js', "  { key: 'tape', miss: 'Clues', name: 'Tape',", [
  `  { key: 'bacon', miss: 'Films', name: 'Bacon', cat: 'Trivia', tag: '${TAG}', tagLong: '${TAGLONG}', how: '${HOW}', color: '${COLOR}', colorNavy: '${NAVY}' },`]);
sub('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n  { key: 'bacon', from: '2026-11-07', until: '2026-11-11' },\n`);
sub('lib/daily-games.js', `dossier: VERDICT(), tape: VERDICT(),`, `dossier: VERDICT(), tape: VERDICT(), bacon: VERDICT(),`);

// 2. Sunday Editions
sub('lib/sunday-editions.js', `//   tape    a smaller company, from deeper in the Russell 3000`, `//   tape    a smaller company, from deeper in the Russell 3000\n//   bacon   starts from a classic star, par 3 or 4`);
sub('lib/sunday-editions.js', `'clade', 'dossier', 'tape', 'judges',`, `'clade', 'dossier', 'tape', 'bacon', 'judges',`);

// 3. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['tape', `, `const LAUNCH_PIN = { keys: ['bacon', 'tape', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['tape', `, `const LAUNCH_PIN = { keys: ['bacon', 'tape', `);
afterLine('app/DailyEndCard.jsx', "  tape: { accent: '#1e5a8a', badgeBg: '#1e5a8a', badgeInk: T.white, Fin: LayoutGrid },", [
  `  bacon: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: LayoutGrid },`]);
afterLine('app/DailyEndCard.jsx', "  { key: 'tape',      cat: 'trivia',", [
  `  { key: 'bacon',     cat: 'trivia',     name: 'Bacon', tag: '${TAG}',   blurb: '${BLURB}', href: '/bacon' },`]);

// 4. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "  { key: 'tape', href: '/tape'", [
  `  { key: 'bacon', href: '/bacon', name: 'Bacon', tag: 'link two actors through films', store: 'sot_bacon_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },`]);
afterLine('app/DailyGamesGrid.jsx', "  { key: 'tape', href: '/tape'", [
  `  { key: 'bacon', href: '/bacon', name: 'Bacon', tag: '${TAG}', img: '/games/btn-bacon.png' },`]);
sub('app/DailyGamesGrid.jsx', `'clade', 'dossier', 'tape', 'redact',`, `'clade', 'dossier', 'tape', 'bacon', 'redact',`);
afterLine('app/DailyStrip.jsx', "  { key: 'tape', href: '/tape'", [
  `  { key: 'bacon', href: '/bacon', name: 'Bacon', img: '/games/btn-bacon.png', store: 'sot_bacon_day', tag: "${TAG}" , cat: 'Trivia' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { tape: `, `const ACCENTS = { bacon: '${NAVY}', tape: `);
sub('app/DailyStrip.jsx', `const TCOL = { tape: `, `const TCOL = { bacon: '${COLOR}', tape: `);

// 5. archive
sub('app/archive/page.js', `import { PUZZLES as TAPE_FULL } from '../tape/puzzles';`,
  `import { PUZZLES as TAPE_FULL } from '../tape/puzzles';\nimport { PUZZLES as BACON_FULL } from '../bacon/puzzles';`);
afterLine('app/archive/page.js', 'const TAPE = TAPE_FULL.map(', [
  'const BACON = BACON_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));']);
afterLine('app/archive/page.js', "  { key: 'tape', name: 'Tape', path: '/tape'", [
  `  { key: 'bacon', name: 'Bacon', path: '/bacon', tag: '${TAG}', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: BACON },`]);

// 6. the four puzzle-map registries
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_tape } from '@/app/tape/puzzles';`,
    `import { PUZZLES as P_tape } from '@/app/tape/puzzles';\nimport { PUZZLES as P_bacon } from '@/app/bacon/puzzles';`);
  sub(f, `tape: P_tape, `, `tape: P_tape, bacon: P_bacon, `);
}

// 7. alternations, rails, catalog, loft
sub('app/api/quiz/daily-status/route.js', `|dossier|tape|`, `|dossier|tape|bacon|`);
sub('app/quizzes/QuizHomeClient.jsx', `|dossier|tape|`, `|dossier|tape|bacon|`);
sub('app/DailySlateRail.jsx', `'dossier', 'tape', `, `'dossier', 'tape', 'bacon', `);
sub('lib/quiz-catalog.js', `'dossier', 'tape', `, `'dossier', 'tape', 'bacon', `);
sub('lib/loft.js', `'dossier', 'tape', `, `'dossier', 'tape', 'bacon', `);

// 8. skills, glyph, challenge metric, miss label, family
sub('lib/daily-skills.js', `tape: ['mem', 'ded'],`, `tape: ['mem', 'ded'], bacon: ['mem', 'plan'],`);
afterLine('lib/game-glyphs.js', "  tape: 'M3 3v18h18M6 15l4-5 3 3 4-6 3 3',", [
  "  bacon: 'M5 7a2 2 0 1 0 0.01 0M19 17a2 2 0 1 0 0.01 0M7 7h5v10h5M10 10h4v4h-4z',  // two actors linked through a film"]);
afterLine('lib/challenge-metric.js', "  tape: { unit: 'clues'", [
  "  bacon: { unit: 'films', one: 'film', dir: 'low', solveFirst: true, field: 'guesses' },"]);
sub('lib/daily-row-stats.js', `  Clues: 'clue',`, `  Clues: 'clue',\n  Films: 'film',`);
sub('lib/daily-families.js', `['thread', 'focus', 'script', 'redact', 'dossier', 'clade', 'tape'],`, `['thread', 'focus', 'script', 'redact', 'dossier', 'clade', 'tape', 'bacon'],`);

// 9. groups and finish sets. Single-topic trivia had five; the two guessing
// games leave it for a new Guessing games group with Bacon.
sub('lib/daily-groups.js', `  { name: 'Single-topic trivia', cat: 'Trivia', keys: ['deep', 'niche', 'slot', 'clade', 'dossier'] },`,
  `  { name: 'Single-topic trivia', cat: 'Trivia', keys: ['deep', 'niche', 'slot'] },\n  { name: 'Guessing games', cat: 'Trivia', keys: ['clade', 'dossier', 'bacon'] },`);
sub('lib/finish-sets.js', `  { name: 'Words on screen', cat: 'Trivia', keys: ['quotes', 'script', 'thread'] },`,
  `  { name: 'Words on screen', cat: 'Trivia', keys: ['quotes', 'script', 'thread'] },\n  { name: 'On screen', cat: 'Trivia', keys: ['bacon', 'script', 'thread'] },`);

// 10. the set pages
const PS = 'lib/puzzle-sets.js';
sub(PS, `    title: 'Free Daily Single-Topic Trivia: One Subject, a Trivia Grid, Blind Ranking and Two Guessing Games | Mind Loft',
    h1: 'Free Daily Single-Topic Trivia: One Subject a Day, a Trivia Grid, a Blind Ranking and Two Guessing Games',
    description: 'Five free daily trivia games that stay on one topic: a fifteen-question one-life quiz on a single subject, a trivia grid where every row and column is a category, a blind ranking where ten things arrive one at a time, a guess-the-animal game played on the family tree, and a guessing game that compares five facts on every guess. New topics at midnight Eastern, no signup.',
    lede: 'Five games that pick one subject and stay on it. Deep is fifteen questions on one topic with one life. Niche is the trivia grid: fill each cell with something that fits both its row and its column. Slot deals ten things one at a time and makes you place each before you see the next. Clade hides one animal and answers every guess with the branch of the family tree it shares. Dossier hides a president, an element or a US state and compares five facts on every guess.',
    how: [
      'Deep runs like the gauntlets, climbing through the tiers, but on one subject a day, so a specialist can run the table. Niche is the grid: rows and columns are categories and every cell has to satisfy both. Slot is the blind ranking: the score is exact placements, and the near misses break ties. Clade and Dossier are guessing games: eight guesses, each one answered with how close it came, and fewer guesses score more.',
    ],
    faq: [
      ['Is the topic the same for everyone?', 'Yes. One topic a day, same questions in the same order.'],
      ['Are they free?', 'All five, every day, no account required.'],
    ],
  },`, `    title: 'Free Daily Single-Topic Trivia: One Subject, a Trivia Grid and a Blind Ranking | Mind Loft',
    h1: 'Free Daily Single-Topic Trivia: One Subject a Day, a Trivia Grid and a Blind Ranking',
    description: 'Three free daily trivia games that stay on one topic: a fifteen-question one-life quiz on a single subject, a trivia grid where every row and column is a category, and a blind ranking where ten things arrive one at a time. New topics at midnight Eastern, no signup.',
    lede: 'Three games that pick one subject and stay on it. Deep is fifteen questions on one topic with one life. Niche is the trivia grid: fill each cell with something that fits both its row and its column. Slot deals ten things one at a time and makes you place each before you see the next.',
    how: [
      'Deep runs like the gauntlets, climbing through the tiers, but on one subject a day, so a specialist can run the table. Niche is the grid: rows and columns are categories and every cell has to satisfy both. Slot is the blind ranking: the score is exact placements, and the near misses break ties.',
    ],
    faq: [
      ['Is the topic the same for everyone?', 'Yes. One topic a day, same questions in the same order.'],
      ['Are they free?', 'All three, every day, no account required.'],
    ],
  },
  {
    name: 'Guessing games', slug: 'guessing-games',
    eyebrow: 'Free daily trivia guessing games',
    title: 'Free Daily Trivia Guessing Games: Guess the Animal, Guess the Answer, Link the Actors | Mind Loft',
    h1: 'Free Daily Trivia Guessing Games: Guess the Animal, Guess the Answer and Link Two Actors',
    description: 'Three free daily trivia guessing games: a guess-the-animal game played on the family tree, a guessing game that compares five facts on every guess, and a game where you link two actors through the films they share. No signup.',
    lede: 'Three games where every guess tells you something. Clade hides one animal and answers every guess with the branch of the family tree it shares. Dossier hides a president, an element or a US state and compares five facts on every guess. Bacon names two actors and you guess your way from one to the other through films they made together.',
    how: [
      'Clade and Dossier give you eight guesses, each one answered with how close it came, and fewer guesses score more. Bacon is played like Six Degrees of Kevin Bacon: name a film, type a co-star from it, and keep going to the target. A wrong film or co-star is a strike, and the fewer films you need, the better.',
    ],
    faq: [
      ['How does Bacon pick its films?', 'American films from 1930 to 2022, with the main cast Wikipedia lists for each one.'],
      ['Are they free?', 'All three, every day, no account required.'],
    ],
  },`);

// 11. the trivia page
const PC = 'lib/puzzle-categories.js';
sub(PC, `'niche', 'clade', 'dossier', 'tape', 'redact'],`, `'niche', 'clade', 'dossier', 'tape', 'bacon', 'redact'],`);
sub(PC, `tape: 'Stock chart guessing game',`, `tape: 'Stock chart guessing game', bacon: 'Six degrees of Kevin Bacon',`);
sub(PC, `and picture, headline, stock chart, year and ranking puzzles. New questions every day, no signup.'`, `and picture, headline, stock chart, movie link, year and ranking puzzles. New questions every day, no signup.'`);

console.log(`wire-bacon: ${applied} applied, ${skipped} already present`);
