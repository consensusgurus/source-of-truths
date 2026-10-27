// scripts/wire-mahj.mjs: wires Mahj, the daily 144-tile mahjong solitaire
// (Cards), into every registry, beside Hold wherever Hold sits.
// Anchored edits: every anchor must match EXACTLY ONCE or the script throws,
// and an edit whose insertion is already present is skipped, so a re-run is safe.
//   node scripts/wire-mahj.mjs [dir]
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

const TAG = 'The daily mahjong solitaire';
const TAGLONG = '144 tiles, matched in pairs of free tiles, against the clock';
const HOW = 'All 144 tiles, stacked in layers on a layout that changes each weekday. Tap two free tiles with the same face to clear them; a tile is free when nothing sits on it and its left or right side is open. Timed, and every deal is proven clearable.';
const BLURB = 'All 144 mahjong tiles, cleared two of a kind at a time, against the clock. A new layout each weekday and the Pyramid on Sunday.';
const COLOR = '#a21caf', NAVY = '#e879f9', BG = '#fbe8fd', BORDER = 'rgba(162,28,175,0.4)';

// 1. lib/daily-games.js: the row and the premiere window
afterLine('lib/daily-games.js', "{ key: 'hold', miss: null, name: 'Hold', cat: 'Cards'", [
  `  { key: 'mahj', miss: null, name: 'Mahj', cat: 'Cards', tag: '${TAG}', tagLong: '${TAGLONG}', how: '${HOW}', color: '${COLOR}', colorNavy: '${NAVY}' },`]);
afterLine('lib/daily-games.js', "{ key: 'hold', from: '2026-10-14', until: '2026-10-18' },", [
  `  { key: 'mahj', from: '2026-10-25', until: '2026-10-29' },`]);

// 2. Sunday Edition: the Pyramid, the hardest deal of the week
sub('lib/sunday-editions.js', `//   cell    forty cards (ace to ten) in seven columns on two free cells,`,
  `//   mahj    the classic Pyramid layout, and the hardest deal of the week by\n//           measured ease (from launch, 2026-10-25)\n//   cell    forty cards (ace to ten) in seven columns on two free cells,`);
sub('lib/sunday-editions.js', `'crib', 'hold', 'cell', 'fib',`, `'crib', 'hold', 'cell', 'mahj', 'fib',`);

// 3. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['mahj', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['mahj', `);
afterLine('app/DailyEndCard.jsx', "  hold: { accent: '#b91c1c', badgeBg: '#b91c1c', badgeInk: T.white, Fin: Layers },", [
  `  mahj: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: Layers },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'hold',  cat: 'cards',     name: 'Hold',", [
  `  { key: 'mahj',  cat: 'cards',     name: 'Mahj',  tag: '${TAG}', blurb: '${BLURB}', href: '/mahj' },`]);

// 4. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'hold', href: '/hold'", [
  `  { key: 'mahj', href: '/mahj', name: 'Mahj', tag: 'the daily mahjong solitaire', store: 'sot_mahj_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'hold', href: '/hold'", [
  `  { key: 'mahj', href: '/mahj', name: 'Mahj', tag: '${TAG}', img: '/games/btn-mahj.png' },`]);
sub('app/DailyGamesGrid.jsx', `keys: ['taire', 'cell', 'hands', 'hold', 'shoe', 'finesse', 'crib'] },`, `keys: ['taire', 'cell', 'mahj', 'hands', 'hold', 'shoe', 'finesse', 'crib'] },`);
afterLine('app/DailyStrip.jsx', "{ key: 'hold', href: '/hold'", [
  `  { key: 'mahj', href: '/mahj', name: 'Mahj', img: '/games/btn-mahj.png', store: 'sot_mahj_day', tag: "${TAG}" , cat: 'Cards' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { `, `const ACCENTS = { mahj: '${NAVY}', `);
sub('app/DailyStrip.jsx', `const TCOL = { `, `const TCOL = { mahj: '${COLOR}', `);

// 5. archive
sub('app/archive/page.js', `import { PUZZLES as HOLD_FULL } from '../hold/puzzles';`,
  `import { PUZZLES as HOLD_FULL } from '../hold/puzzles';\nimport { PUZZLES as MAHJ_FULL } from '../mahj/puzzles';`);
afterLine('app/archive/page.js', 'const HOLD = HOLD_FULL.map(', [
  'const MAHJ = MAHJ_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));']);
afterLine('app/archive/page.js', "{ key: 'hold', name: 'Hold', path: '/hold'", [
  `  { key: 'mahj', name: 'Mahj', path: '/mahj', tag: '${TAG}', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: MAHJ },`]);

// 6. the four puzzle-map registries
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_hold } from '@/app/hold/puzzles';`,
    `import { PUZZLES as P_hold } from '@/app/hold/puzzles';\nimport { PUZZLES as P_mahj } from '@/app/mahj/puzzles';`);
  const s = rd(f);
  if (!s.includes('mahj: P_mahj')) {
    const n = s.split('hold: P_hold,').length - 1;
    if (n !== 1) throw new Error(`${f}: hold: P_hold matched ${n}`);
    wr(f, s.replace('hold: P_hold,', 'hold: P_hold, mahj: P_mahj,')); applied++;
  } else skipped++;
}

// 7. alternations, rails, catalog, loft
sub('app/api/quiz/daily-status/route.js', `|hold|cell|swindle|`, `|hold|cell|mahj|swindle|`);
sub('app/quizzes/QuizHomeClient.jsx', `|hold|cell|swindle|`, `|hold|cell|mahj|swindle|`);
sub('app/DailySlateRail.jsx', `'hold', 'cell', 'swindle',`, `'hold', 'cell', 'mahj', 'swindle',`);
sub('lib/quiz-catalog.js', `'hold', 'cell', 'swindle',`, `'hold', 'cell', 'mahj', 'swindle',`);
sub('lib/loft.js', `'hold', 'cell', 'swindle',`, `'hold', 'cell', 'mahj', 'swindle',`);

// 8. glyph, skills, medians, difficulty
afterLine('lib/game-glyphs.js', "  hold: 'M2 9h3.6v9H2z", [
  "  mahj: 'M4 9h7v11H4zM13 9h7v11h-7zM8.5 3h7v11h-7z',  // three tiles, one stacked on the pair below"]);
sub('lib/daily-skills.js', `crib: ['plan'], hold: ['est'], cell: ['plan'],`, `crib: ['plan'], hold: ['est'], cell: ['plan'], mahj: ['spa', 'plan', 'speed'],`);
sub('lib/game-medians.js', `outwit: 90, outrank: 90, feud: 90, herd: 60,`, `outwit: 90, outrank: 90, feud: 90, herd: 60,\n  // Mahj launched 2026-10-25: an estimate until there is a field to pool.\n  mahj: 600,`);
sub('lib/daily-difficulty.js', `art: 3, calc: 3, cell: 3,`, `art: 3, calc: 3, cell: 3, mahj: 3,`);

// 9. groups and sets
sub('lib/daily-groups.js', `{ name: 'Solitaire and poker', cat: 'Cards', keys: ['taire', 'cell', 'hold', 'hands'] },`, `{ name: 'Solitaire and poker', cat: 'Cards', keys: ['taire', 'cell', 'mahj', 'hold', 'hands'] },`);
afterLine('lib/finish-sets.js', "{ name: 'Poker and FreeCell', cat: 'Cards',", [
  "  { name: 'Tiles and solitaire', cat: 'Cards', keys: ['mahj', 'taire', 'cell'] },"]);

// 10. the card games landing page
const PC = 'lib/puzzle-categories.js';
sub(PC, `title: 'Free Daily Card Games: Solitaire, FreeCell, Video Poker, Blackjack, Cribbage and Double Dummy | Mind Loft',`,
  `title: 'Free Daily Card Games: Solitaire, FreeCell, Mahjong, Video Poker, Blackjack, Cribbage and Double Dummy | Mind Loft',`);
sub(PC, `h1: 'Free Daily Card Games: Solitaire, FreeCell, Poker Solitaire, Video Poker, Blackjack, Cribbage and Double Dummy Bridge',`,
  `h1: 'Free Daily Card Games: Solitaire, FreeCell, Mahjong Solitaire, Poker Solitaire, Video Poker, Blackjack, Cribbage and Double Dummy Bridge',`);
sub(PC, `description: 'Seven free daily card games with the same deal for everyone: a solitaire and a FreeCell deal with proven minimum lines, a poker solitaire grid,`,
  `description: 'Eight free daily card and tile games with the same deal for everyone: a solitaire and a FreeCell deal with proven minimum lines, a 144-tile mahjong solitaire, a poker solitaire grid,`);
sub(PC, `lede: 'Seven card games a day, and the deal is the same for everybody,`, `lede: 'Eight card and tile games a day, and the deal is the same for everybody,`);
sub(PC, `each with a perfect line that is the proven minimum, a poker solitaire where every row and column is a hand,`,
  `each with a perfect line that is the proven minimum, a mahjong solitaire on all 144 tiles, a poker solitaire where every row and column is a hand,`);
sub(PC, `    keys: ['taire', 'cell', 'hands', 'hold', 'shoe', 'crib', 'finesse'],\n    generic: { taire: 'Solitaire',`,
  `    keys: ['taire', 'cell', 'mahj', 'hands', 'hold', 'shoe', 'crib', 'finesse'],\n    generic: { taire: 'Solitaire', mahj: 'Mahjong solitaire',`);
sub(PC, `with a run moving as one move. Hold is Jacks or Better video poker:`,
  `with a run moving as one move. Mahj is mahjong solitaire on the full 144 tiles: clear the board in pairs of free tiles, on a layout that changes each weekday, against the clock. Hold is Jacks or Better video poker:`);
sub(PC, `Taire or Cell if you like a solitaire with an answer.`, `Taire or Cell if you like a solitaire with an answer. Mahj if you grew up on mahjong tiles.`);
sub(PC, `      ['Are they free?', 'All seven, every day, no account required.'],\n    ],\n  },`,
  `      ['Are they free?', 'All eight, every day, no account required.'],\n    ],\n  },`);

console.log(`wire-mahj: ${applied} edits applied, ${skipped} already present`);
