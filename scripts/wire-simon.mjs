// scripts/wire-simon.mjs — wires Simon, the Arcade's repeat-the-sequence
// memory daily (owner, 2026-11-07), into every registry in one pass. Anchored
// on the Squash rows, so Simon sits beside Squash everywhere the Arcade is
// listed.
//
// NO NEW-GAME POP-UP, as for Dario and Squash: Simon is added to NO_PREMIERE
// and gets no PREMIERES row. It still takes the launch pin, which only orders
// the to-play list. No Sunday Edition (Arcade plays the same every day), so it
// is NOT on SUNDAY_EDITION_GAMES or in the Sunday slate map.
//
// Anchored: every anchor must match EXACTLY ONCE or the script throws, and an
// edit whose replacement is already present is skipped, so a re-run is safe.
//
//   node scripts/wire-simon.mjs <dir>
import fs from 'fs';
import path from 'path';

const root = process.argv[2] || '.';
let applied = 0, skipped = 0;
const rd = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const wr = (f, s) => fs.writeFileSync(path.join(root, f), s);
function sub(file, anchor, replacement) {
  const src = rd(file);
  if (src.includes(replacement)) { skipped++; return; }
  const n = src.split(anchor).length - 1;
  if (n !== 1) throw new Error(`${file}: anchor matched ${n} times, expected 1\n  ${anchor.slice(0, 160)}`);
  wr(file, src.replace(anchor, replacement));
  applied++;
}

const NAME = 'Simon';
const TAG = 'Same sequence, one more each round';
const TAGLONG = 'Repeat the sequence of nine pads as it grows; the same sequence for everybody';
const HOW = 'Watch nine pads light up one at a time, then tap them back in the same order. Every round adds one more, the pace never speeds up, and one wrong tap ends the run. Everyone gets the same sequence, and your best run counts.';
const COLOR = '#7c3aed', NAVY = '#c4b5fd', BG = '#f3e8ff', BORDER = 'rgba(124,58,237,0.4)';
const BLURB = 'Watch the pads light up and tap them back in order, one more every round. Same sequence for everybody, a steady pace, no sound, and your best run counts.';

// ─── 1. lib/daily-games.js: the row, and no premiere ─────────────────────────
sub('lib/daily-games.js',
  `  { key: 'squash', miss: null, unit: 'points',`,
  `  { key: 'simon', miss: null, unit: 'steps', name: '${NAME}', cat: 'Arcade', tag: '${TAG}', tagLong: '${TAGLONG}', how: '${HOW}', color: '${COLOR}', colorNavy: '${NAVY}' },\n  { key: 'squash', miss: null, unit: 'points',`);
sub('lib/daily-games.js', `export const NO_PREMIERE = new Set(['dario', 'squash']);`, `export const NO_PREMIERE = new Set(['dario', 'squash', 'simon']);`);

// ─── 2. IQ: one point a day, as for the other arcade games ───────────────────
sub('lib/quiz-xp.js', `squash: 1 };`, `squash: 1, simon: 1 };`);

// ─── 3. end card, launch pins ────────────────────────────────────────────────
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['simon', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['simon', `);
sub('app/DailyEndCard.jsx',
  `  squash: { accent: '#db2777', badgeBg: '#db2777', badgeInk: T.white, Fin: Grid3x3 },`,
  `  squash: { accent: '#db2777', badgeBg: '#db2777', badgeInk: T.white, Fin: Grid3x3 },\n  simon: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: Grid3x3 },`);
sub('app/DailyEndCard.jsx',
  `  { key: 'squash', cat: 'arcade',`,
  `  { key: 'simon', cat: 'arcade',    name: '${NAME}', tag: '${TAG}',   blurb: '${BLURB}', href: '/simon' },\n  { key: 'squash', cat: 'arcade',`);

// ─── 4. promo, grid, strip ───────────────────────────────────────────────────
sub('app/DailyGamesPromo.jsx',
  `  { key: 'squash', href: '/squash', name: 'Squash',`,
  `  { key: 'simon', href: '/simon', name: '${NAME}', tag: 'same sequence, one more each round', store: 'sot_simon_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },\n  { key: 'squash', href: '/squash', name: 'Squash',`);
sub('app/DailyGamesGrid.jsx',
  `  { key: 'squash', href: '/squash', name: 'Squash', tag:`,
  `  { key: 'simon', href: '/simon', name: '${NAME}', tag: '${TAG}', img: '/games/btn-simon.png' },\n  { key: 'squash', href: '/squash', name: 'Squash', tag:`);
sub('app/DailyGamesGrid.jsx', `{ key: 'arcade', label: 'Arcade', keys: ['blocks', 'snake', 'squash', 'dario', 'sweep'] },`, `{ key: 'arcade', label: 'Arcade', keys: ['blocks', 'snake', 'squash', 'simon', 'dario', 'sweep'] },`);
sub('app/DailyStrip.jsx',
  `  { key: 'squash', href: '/squash', name: 'Squash', img:`,
  `  { key: 'simon', href: '/simon', name: '${NAME}', img: '/games/btn-simon.png', store: 'sot_simon_day', tag: "${TAG}" , cat: 'Arcade' },\n  { key: 'squash', href: '/squash', name: 'Squash', img:`);
sub('app/DailyStrip.jsx', ` squash: '#f9a8d4', herd:`, ` squash: '#f9a8d4', simon: '${NAVY}', herd:`);
sub('app/DailyStrip.jsx', ` squash: '#db2777', herd:`, ` squash: '#db2777', simon: '${COLOR}', herd:`);

// ─── 5. archive ──────────────────────────────────────────────────────────────
sub('app/archive/page.js', `import { PUZZLES as SQUASH_FULL } from '../squash/puzzles';`,
  `import { PUZZLES as SQUASH_FULL } from '../squash/puzzles';\nimport { PUZZLES as SIMON_FULL } from '../simon/puzzles';`);
{
  const f = 'app/archive/page.js';
  const src = rd(f);
  const line = `const SIMON = SIMON_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`;
  if (src.includes(line)) skipped++;
  else {
    const m = src.match(/\nconst SQUASH = [^\n]*\n/);
    if (!m) throw new Error(`${f}: const SQUASH line not found`);
    wr(f, src.replace(m[0], `${m[0]}${line}\n`));
    applied++;
  }
}
sub('app/archive/page.js',
  `  { key: 'squash', name: 'Squash', path: '/squash',`,
  `  { key: 'simon', name: '${NAME}', path: '/simon', tag: '${TAG}', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: SIMON },\n  { key: 'squash', name: 'Squash', path: '/squash',`);

// ─── 6. the three daily puzzle maps (no Sunday slate: no Sunday Edition) ─────
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js']) {
  sub(f, `import { PUZZLES as P_squash } from '@/app/squash/puzzles';`,
    `import { PUZZLES as P_squash } from '@/app/squash/puzzles';\nimport { PUZZLES as P_simon } from '@/app/simon/puzzles';`);
}
sub('lib/daily-slate.js', `  squash: P_squash,\n`, `  squash: P_squash,\n  simon: P_simon,\n`);
for (const f of ['app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js']) {
  sub(f, `squash: P_squash, `, `squash: P_squash, simon: P_simon, `);
}

// ─── 7. key lists and alternations ───────────────────────────────────────────
sub('app/api/quiz/daily-status/route.js', `|snake|squash|dario|`, `|snake|squash|simon|dario|`);
sub('app/quizzes/QuizHomeClient.jsx', `|snake|squash|dario|`, `|snake|squash|simon|dario|`);
sub('app/DailySlateRail.jsx', `'snake', 'squash', 'dario',`, `'snake', 'squash', 'simon', 'dario',`);
sub('lib/quiz-catalog.js', `'snake', 'squash', 'dario', 'chomp',`, `'snake', 'squash', 'simon', 'dario', 'chomp',`);
sub('lib/loft.js', `'snake', 'squash', 'dario', 'bracket',`, `'snake', 'squash', 'simon', 'dario', 'bracket',`);
sub('lib/daily-families.js', `['snake', 'squash', 'blocks', 'sweep', 'dario'],`, `['snake', 'squash', 'simon', 'blocks', 'sweep', 'dario'],`);
sub('lib/daily-difficulty.js', `herd: 1, jig: 1, squash: 1, hold: 2,`, `herd: 1, jig: 1, squash: 1, hold: 2,\n  simon: 3, // a starting estimate (2026-11-07) until a week of plays rates it`);

// ─── 8. skills, challenge metric, finish beat, glyph ─────────────────────────
// Memory first, as for Pairs: the game is recall of what was just shown.
sub('lib/daily-skills.js', `squash: ['spa', 'speed'],`, `squash: ['spa', 'speed'], simon: ['mem', 'speed'],`);
sub('lib/challenge-metric.js', `  squash: { unit: 'points', one: 'point', dir: 'high', say: 'scored' },`,
  `  squash: { unit: 'points', one: 'point', dir: 'high', say: 'scored' },\n  simon: { unit: 'steps', one: 'step', dir: 'high', say: 'repeated' },`);
// The pads ripple out from the last one tapped, like the crossword squares.
sub('lib/finish-beats.js', `  squash: { kind: 'lap', last: true },`, `  squash: { kind: 'lap', last: true },\n  simon: { kind: 'ripple', last: true, cell: '.sm-pad', box: null },`);
sub('lib/game-glyphs.js',
  `  squash: 'M3 3h18v18H3zM8 6a2 2 0 1 0 .01 0M16 6a2 2 0 1 0 .01 0M8 14a2 2 0 1 0 .01 0M13.5 16.5h5', // a tray of fruit, one squashed flat`,
  `  squash: 'M3 3h18v18H3zM8 6a2 2 0 1 0 .01 0M16 6a2 2 0 1 0 .01 0M8 14a2 2 0 1 0 .01 0M13.5 16.5h5', // a tray of fruit, one squashed flat\n  simon: 'M3 3h5v5H3zM9.5 3h5v5h-5zM16 3h5v5h-5zM3 9.5h5v5H3zM16 9.5h5v5h-5zM3 16h5v5H3zM9.5 16h5v5h-5zM16 16h5v5h-5zM10.5 10.5h3v3h-3z', // nine pads, the middle one lit`);

// ─── 9. the Arcade landing page and its set ──────────────────────────────────
const PC = 'lib/puzzle-categories.js';
sub(PC, `title: 'Free Daily Arcade Games: Falling Blocks, Snake, Match-3, a Side-Scroller and Endless Minesweeper | Mind Loft',`,
  `title: 'Free Daily Arcade Games: Falling Blocks, Snake, Match-3, Simon, a Side-Scroller and Endless Minesweeper | Mind Loft',`);
sub(PC, `h1: 'Free Daily Arcade Games: Falling Blocks, Snake, Match-3, a Side-Scroller and Endless Minesweeper',`,
  `h1: 'Free Daily Arcade Games: Falling Blocks, Snake, Match-3, Simon, a Side-Scroller and Endless Minesweeper',`);
sub(PC, `description: 'Five free daily arcade games with the same board for everyone: falling blocks in a fixed order that never speeds up, a snake game where everyone eats the same apples, Squash, a match-three with fruit and the same refills for everyone,`,
  `description: 'Six free daily arcade games with the same board for everyone: falling blocks in a fixed order that never speeds up, a snake game where everyone eats the same apples, Squash, a match-three with fruit and the same refills for everyone, Simon, a memory sequence that grows by one each round,`);
sub(PC, `lede: 'Five arcade games a day where everyone gets the same board.`, `lede: 'Six arcade games a day where everyone gets the same board.`);
sub(PC, `so a cascade is earned rather than lucky.`,
  `so a cascade is earned rather than lucky. Simon lights nine pads in a sequence you tap back, one more every round, at a pace that never speeds up.`);
sub(PC, `    keys: ['blocks', 'snake', 'squash', 'dario', 'sweep'],\n    generic: { blocks: 'Falling blocks, fixed order', snake: 'Snake game, same apples', squash: 'Match-3 fruit game',`,
  `    keys: ['blocks', 'snake', 'squash', 'simon', 'dario', 'sweep'],\n    generic: { blocks: 'Falling blocks, fixed order', snake: 'Snake game, same apples', squash: 'Match-3 fruit game', simon: 'Simon memory game',`);
sub(PC, `      ['Are they free?', 'All five, every day, no account required.'],`, `      ['Are they free?', 'All six, every day, no account required.'],`);
sub('lib/finish-sets.js', `  { name: 'Puzzle arcade', cat: 'Arcade', keys: ['squash', 'blocks', 'sweep'] },`,
  `  { name: 'Puzzle arcade', cat: 'Arcade', keys: ['squash', 'blocks', 'sweep', 'simon'] },`);

// ─── 9b. Arcade passes five games, so it is grouped in full (lib/daily-groups) ─
sub('lib/daily-groups.js',
  `  { name: 'Card tables', cat: 'Cards', keys: ['shoe', 'crib', 'finesse', 'pairs'] },`,
  `  { name: 'Card tables', cat: 'Cards', keys: ['shoe', 'crib', 'finesse', 'pairs'] },\n  // Arcade (6): grouped from 2026-11-07, when Simon took it past five\n  { name: 'Action arcade', cat: 'Arcade', keys: ['snake', 'dario', 'blocks'] },\n  { name: 'Puzzle arcade', cat: 'Arcade', keys: ['squash', 'sweep', 'simon'] },`);
sub('lib/daily-groups.js', `// A category with five games or fewer (Geography, Cards, Crowd Psychology,\n// Arcade) has NO groups and is its own set; groupOf() returns null there and\n// every reader falls back to the category.`, `// A category with five games or fewer (Geography, Crowd Psychology) has NO\n// groups and is its own set; groupOf() returns null there and every reader\n// falls back to the category.`);

// ─── 10. the game's own doc ──────────────────────────────────────────────────
{
  const f = 'docs/claude/games-other.md';
  const src = rd(f);
  const marker = '## Simon (`/simon`): the Arcade memory sequence daily (launched 2026-11-07)';
  if (!src.includes(marker)) {
    wr(f, src.replace(/\s*$/, '\n') + `
${marker}

Repeat the sequence, as a daily. Key/route \`simon\`, category **Arcade**, \`miss: null\`,
\`unit: 'steps'\` (a tally game: the score is the longest sequence repeated in full, raw and
uncapped, against par 10), legacy accent \`${COLOR}\` / \`${NAVY}\`. Skills Memory then Focus and
Speed. Arcade rules throughout: unlimited runs, the board and the local record keep the BEST
run, \`XP_DAILY_CAP.simon = 1\`. Wired by \`scripts/wire-simon.mjs\` (anchored on the Squash rows).
No new-game pop-up (NO_PREMIERE, as Dario and Squash). No Sunday Edition.

- **Owner rulings (2026-11-07, off the mockup):** nine pads (after trying four and six), a
  STEADY pace that never speeds up, and NO SOUND AT ALL. Named Simon (first called Echo).
- **The day is generated, not banked.** \`lib/simon-engine.js\` \`dayPlan(quizId)\` is a seeded
  list of 200 pads that never lights one pad three times running. The same file is the engine
  the client plays and the verifier proves. \`app/simon/puzzles.js\` carries only the frame (par),
  written by \`scripts/gen-simon.mjs\`.
- **Pace:** every pad is lit \`LIT_MS\` 520ms with \`GAP_MS\` 180ms between, after a \`LEAD_MS\`
  700ms beat, in every round.
- **Ties break on total TAPPING time** (the clock runs only while it is your turn; watching is
  free). \`guessesUsed\` is not posted. A hidden tab during the show replays the show from the top
  when it comes back; the tapping clock is never paused.
- **The look:** a 3x3 grid of pads wearing REGION_RAMP hues 0 to 8 through \`regionStyle\` /
  \`regionMix\` (the site pastels), 1px ink outlines, an outline shape a pad (circle, triangle,
  square, diamond, hexagon, star, plus, crescent, heart) so the sequence reads without colour.
  A miss shakes the tapped pad and rings the wanted one.
- **A run does not resume after a reload:** the abandon flush posts it as it stood.
- **Give up** (tap twice) ends the run and posts the steps already earned.
- \`scripts/verify-simon.mjs\` checks the bank and the engine.
`);
    applied++;
  } else skipped++;
}

console.log(`wire-simon: ${applied} edits applied, ${skipped} already present`);
