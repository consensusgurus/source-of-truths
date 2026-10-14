// scripts/wire-hold-cell-swindle.mjs: wires three dailies into every registry
//   hold     the daily video poker hold (Cards), after Crib
//   cell     the daily FreeCell (Cards), after Hold
//   swindle  White to play and draw (End Game), after Defend
// Anchored edits: every anchor must match EXACTLY ONCE or the script throws,
// and an edit whose insertion is already present is skipped, so a re-run is safe.
//   node scripts/wire-hold-cell-swindle.mjs <dir>
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
// Insert whole lines after the one line containing `marker`.
function afterLine(f, marker, lines) {
  const s = rd(f);
  const ins = lines.join('\n');
  if (s.includes(lines[0])) { skipped++; return; }
  const parts = s.split('\n');
  const idx = parts.map((l, i) => (l.includes(marker) ? i : -1)).filter((i) => i >= 0);
  if (idx.length !== 1) throw new Error(`${f}: line marker matched ${idx.length} times: ${marker}`);
  parts.splice(idx[0] + 1, 0, ins);
  wr(f, parts.join('\n')); applied++;
}

const H = { TAG: 'Video poker hold', HOW: 'Ten Jacks or Better hands: tap the cards to hold, then draw. Every hold is valued exactly over every draw, so the best hold is a fact. One point for the best hold; the draw itself is luck.', COLOR: '#b91c1c', NAVY: '#fca5a5', BG: '#fdecec', BORDER: 'rgba(185,28,28,0.4)',
  BLURB: 'Ten video poker hands a day, and one question each: which cards do you keep? Every hold is valued exactly over every draw. Fifteen hands on Sundays.' };
const C = { TAG: 'The daily FreeCell', HOW: 'Thirty-two cards face up, a few free cells, and a perfect line that is the proven minimum. Runs move as one move and safe cards go home free.', COLOR: '#0e7490', NAVY: '#67e8f9', BG: '#e6f4f7', BORDER: 'rgba(14,116,144,0.4)',
  BLURB: 'FreeCell on a small deck, every card face up, and a perfect line proven to be the fewest moves. Forty cards on Sundays.' };
const S = { TAG: 'White to play and draw', HOW: 'You are White and badly lost. One move saves a draw by stalemate, perpetual check, threefold repetition or bare kings; every other move gets mated.', COLOR: '#9a3412', NAVY: '#fb923c', BG: '#fbede6', BORDER: 'rgba(154,52,18,0.4)',
  BLURB: 'A lost position with one way out. Find the stalemate, the perpetual check or the swindle that holds the draw, then play it out.' };

// 1. lib/daily-games.js
afterLine('lib/daily-games.js', "{ key: 'crib', miss: null, name: 'Crib', cat: 'Cards'", [
  `  { key: 'hold', miss: null, name: 'Hold', cat: 'Cards', tag: '${H.TAG}', how: '${H.HOW}', color: '${H.COLOR}', colorNavy: '${H.NAVY}' },`,
  `  { key: 'cell', keepsAnswer: true, attempts: 'graded', miss: 'Tries', name: 'Cell', cat: 'Cards', tag: '${C.TAG}', how: '${C.HOW}', color: '${C.COLOR}', colorNavy: '${C.NAVY}' },`]);
afterLine('lib/daily-games.js', "{ key: 'defend', keepsAnswer: true, miss: 'Tries', name: 'Defend', cat: 'End Game'", [
  `  { key: 'swindle', keepsAnswer: true, miss: 'Tries', name: 'Swindle', cat: 'End Game', tag: '${S.TAG}', how: '${S.HOW}', color: '${S.COLOR}', colorNavy: '${S.NAVY}' },`]);
afterLine('lib/daily-games.js', "{ key: 'judges', from: '2026-10-04', until: '2026-10-08' },", [
  `  { key: 'hold', from: '2026-10-14', until: '2026-10-18' },`,
  `  { key: 'cell', from: '2026-10-14', until: '2026-10-18' },`,
  `  { key: 'swindle', from: '2026-10-14', until: '2026-10-18' },`]);
sub('lib/daily-games.js', `  'mate', 'check', 'chain', 'turn', 'defend', 'queen',\n]);`, `  'mate', 'check', 'chain', 'turn', 'defend', 'queen', 'swindle',\n]);`);

// 2. lib/sunday-editions.js
sub('lib/sunday-editions.js', `//   crib    seven hands instead of five, three of them decided by the crib`,
  `//   crib    seven hands instead of five, three of them decided by the crib\n//   hold    fifteen hands instead of ten, at least five of them traps where\n//           the rule of thumb is wrong\n//   cell    forty cards (ace to ten) in seven columns on two free cells,\n//           against the weekday thirty-two in six\n//   swindle the deepest draw of the week, five White moves or more`);
sub('lib/sunday-editions.js', `'taire', 'finesse', 'crib', 'fib',`, `'taire', 'finesse', 'crib', 'hold', 'cell', 'fib',`);
sub('lib/sunday-editions.js', `'ergo', 'docket', 'defend',\n`, `'ergo', 'docket', 'defend', 'swindle',\n`);

// 3. app/DailyEndCard.jsx
sub('app/DailyEndCard.jsx', `'yose', 'defend', 'queen']);`, `'yose', 'defend', 'queen', 'swindle']);`);
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['hold', 'cell', 'swindle', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['hold', 'cell', 'swindle', `);
afterLine('app/DailyEndCard.jsx', "  crib: { accent: '#a16207', badgeBg: '#a16207', badgeInk: T.white, Fin: Layers },", [
  `  hold: { accent: '${H.COLOR}', badgeBg: '${H.COLOR}', badgeInk: T.white, Fin: Layers },`,
  `  cell: { accent: '${C.COLOR}', badgeBg: '${C.COLOR}', badgeInk: T.white, Fin: Club },`,
  `  swindle: { accent: '${S.COLOR}', badgeBg: '${S.COLOR}', badgeInk: T.white, Fin: Swords },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'crib',  cat: 'cards',     name: 'Crib',", [
  `  { key: 'hold',  cat: 'cards',     name: 'Hold',  tag: '${H.TAG}', blurb: '${H.BLURB}', href: '/hold' },`,
  `  { key: 'cell',  cat: 'cards',     name: 'Cell',  tag: '${C.TAG}', blurb: '${C.BLURB}', href: '/cell' },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'defend', cat: 'endgame',     name: 'Defend',", [
  `  { key: 'swindle', cat: 'endgame',     name: 'Swindle', tag: '${S.TAG}',   blurb: '${S.BLURB}', href: '/swindle' },`]);

// 4. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'crib', href: '/crib'", [
  `  { key: 'hold', href: '/hold', name: 'Hold', tag: 'video poker hold', store: 'sot_hold_day', accent: '${H.COLOR}', bg: '${H.BG}', border: '${H.BORDER}' },`,
  `  { key: 'cell', href: '/cell', name: 'Cell', tag: 'the daily FreeCell', store: 'sot_cell_day', accent: '${C.COLOR}', bg: '${C.BG}', border: '${C.BORDER}' },`]);
afterLine('app/DailyGamesPromo.jsx', "{ key: 'defend', href: '/defend'", [
  `  { key: 'swindle', href: '/swindle', name: 'Swindle', tag: 'white to play and draw', store: 'sot_swindle_day', accent: '${S.COLOR}', bg: '${S.BG}', border: '${S.BORDER}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'crib', href: '/crib'", [
  `  { key: 'hold', href: '/hold', name: 'Hold', tag: '${H.TAG}', img: '/games/btn-hold.png' },`,
  `  { key: 'cell', href: '/cell', name: 'Cell', tag: '${C.TAG}', img: '/games/btn-cell.png' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'defend', href: '/defend'", [
  `  { key: 'swindle', href: '/swindle', name: 'Swindle', tag: '${S.TAG}', img: '/games/btn-swindle.png' },`]);
sub('app/DailyGamesGrid.jsx', `keys: ['mate', 'defend', 'queen', 'four', 'check', 'chain', 'turn', 'yose'] },`, `keys: ['mate', 'defend', 'swindle', 'queen', 'four', 'check', 'chain', 'turn', 'yose'] },`);
sub('app/DailyGamesGrid.jsx', `keys: ['taire', 'hands', 'shoe', 'finesse', 'crib'] },`, `keys: ['taire', 'cell', 'hands', 'hold', 'shoe', 'finesse', 'crib'] },`);
afterLine('app/DailyStrip.jsx', "{ key: 'crib', href: '/crib'", [
  `  { key: 'hold', href: '/hold', name: 'Hold', img: '/games/btn-hold.png', store: 'sot_hold_day', tag: "${H.TAG}" , cat: 'Cards' },`,
  `  { key: 'cell', href: '/cell', name: 'Cell', img: '/games/btn-cell.png', store: 'sot_cell_day', tag: "${C.TAG}" , cat: 'Cards' },`]);
afterLine('app/DailyStrip.jsx', "{ key: 'defend', href: '/defend'", [
  `  { key: 'swindle', href: '/swindle', name: 'Swindle', img: '/games/btn-swindle.png', store: 'sot_swindle_day', tag: "${S.TAG}" , cat: 'End Game' },`]);
sub('app/DailyStrip.jsx', `crib: '#fcd34d', `, `crib: '#fcd34d', hold: '${H.NAVY}', cell: '${C.NAVY}', swindle: '${S.NAVY}', `);
sub('app/DailyStrip.jsx', `crib: '#a16207', snug`, `crib: '#a16207', hold: '${H.COLOR}', cell: '${C.COLOR}', swindle: '${S.COLOR}', snug`);

// 5. archive
sub('app/archive/page.js', `import { PUZZLES as CRIB_FULL } from '../crib/puzzles';`,
  `import { PUZZLES as CRIB_FULL } from '../crib/puzzles';\nimport { PUZZLES as HOLD_FULL } from '../hold/puzzles';\nimport { PUZZLES as CELL_FULL } from '../cell/puzzles';\nimport { PUZZLES as SWINDLE_FULL } from '../swindle/puzzles';`);
afterLine('app/archive/page.js', 'const CRIB = CRIB_FULL.map(', [
  'const HOLD = HOLD_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));',
  'const CELL = CELL_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));',
  'const SWINDLE = SWINDLE_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));']);
afterLine('app/archive/page.js', "{ key: 'crib', name: 'Crib', path: '/crib'", [
  `  { key: 'hold', name: 'Hold', path: '/hold', tag: '${H.TAG}', accent: '${H.COLOR}', bg: '${H.BG}', border: '${H.BORDER}', src: HOLD },`,
  `  { key: 'cell', name: 'Cell', path: '/cell', tag: '${C.TAG}', accent: '${C.COLOR}', bg: '${C.BG}', border: '${C.BORDER}', src: CELL },`]);
afterLine('app/archive/page.js', "{ key: 'defend', name: 'Defend', path: '/defend'", [
  `  { key: 'swindle', name: 'Swindle', path: '/swindle', tag: '${S.TAG}', accent: '${S.COLOR}', bg: '${S.BG}', border: '${S.BORDER}', src: SWINDLE },`]);

// 6. the four puzzle-map registries
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_crib } from '@/app/crib/puzzles';`,
    `import { PUZZLES as P_crib } from '@/app/crib/puzzles';\nimport { PUZZLES as P_hold } from '@/app/hold/puzzles';\nimport { PUZZLES as P_cell } from '@/app/cell/puzzles';\nimport { PUZZLES as P_swindle } from '@/app/swindle/puzzles';`);
  sub(f, `crib: P_crib,`, `crib: P_crib, hold: P_hold, cell: P_cell, swindle: P_swindle,`);
}

// 7. alternations, rails, catalog, loft
sub('app/api/quiz/daily-status/route.js', `|yose|crib|`, `|yose|crib|hold|cell|swindle|`);
sub('app/quizzes/QuizHomeClient.jsx', `|yose|crib|`, `|yose|crib|hold|cell|swindle|`);
sub('app/DailySlateRail.jsx', `'finesse', 'crib', 'chain',`, `'finesse', 'crib', 'hold', 'cell', 'swindle', 'chain',`);
sub('lib/quiz-catalog.js', `'yose', 'crib', 'pricer',`, `'yose', 'crib', 'hold', 'cell', 'swindle', 'pricer',`);
sub('lib/loft.js', `'sumo', 'yose', 'crib',`, `'sumo', 'yose', 'crib', 'hold', 'cell', 'swindle',`);

// 8. glyphs, finish beats
afterLine('lib/game-glyphs.js', "  crib: 'M2 7h20v10H2z", [
  "  hold: 'M2 9h3.6v9H2zM6.2 6h3.6v9H6.2zM10.2 6h3.6v9h-3.6zM14.2 6h3.6v9h-3.6zM18.4 9H22v9h-3.6z',  // five cards, the middle three held up",
  "  cell: 'M3 4h5v6H3zM10 4h4v6h-4zM16 4h5v6h-5zM4 13h4v7H4zM10 13h4v7h-4zM16 13h4v7h-4z',  // free cells over three columns",
  "  swindle: 'M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18M12 12m-2.4 0a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0 -4.8 0',  // a board, one ringed square"]);
afterLine('lib/finish-beats.js', "  crib: { kind: 'cascade', last: true, card: '.cb-card' },", [
  "  hold: { kind: 'cascade', last: true, card: '.hl-card' },",
  "  cell: { kind: 'cascade', last: true, card: '.cel-card' },"]);

// 9. groups and sets
sub('lib/daily-groups.js', `cat: 'End Game', keys: ['mate', 'defend', 'queen'] },`, `cat: 'End Game', keys: ['mate', 'defend', 'swindle', 'queen'] },`);
sub('lib/finish-sets.js', `cat: 'End Game', keys: ['mate', 'defend', 'queen'] },`, `cat: 'End Game', keys: ['mate', 'defend', 'swindle', 'queen'] },`);
sub('lib/finish-sets.js', `cat: 'Cards', keys: ['taire', 'crib', 'hands'] },`, `cat: 'Cards', keys: ['taire', 'crib', 'hands', 'hold', 'cell'] },`);

// 10. landing pages
sub('lib/puzzle-categories.js', `    keys: ['mate', 'defend', 'queen'],\n`, `    keys: ['mate', 'defend', 'swindle', 'queen'],\n`);
sub('lib/puzzle-categories.js', `defend: 'Defend the mate', queen:`, `defend: 'Defend the mate', swindle: 'Swindle a draw', queen:`);
sub('lib/puzzle-categories.js', `keys: ['mate', 'defend', 'queen', 'yose', 'turn', 'check', 'four', 'chain'],`, `keys: ['mate', 'defend', 'swindle', 'queen', 'yose', 'turn', 'check', 'four', 'chain'],`);
sub('lib/puzzle-categories.js', `defend: 'Chess: defend the mate', queen:`, `defend: 'Chess: defend the mate', swindle: 'Chess: swindle a draw', queen:`);
sub('lib/puzzle-categories.js', `if (key === 'mate' || key === 'defend' || key === 'queen') return '/chess-puzzles';`, `if (key === 'mate' || key === 'defend' || key === 'swindle' || key === 'queen') return '/chess-puzzles';`);
sub('lib/puzzle-categories.js', `keys: ['taire', 'hands', 'shoe', 'crib', 'finesse'],`, `keys: ['taire', 'cell', 'hands', 'hold', 'shoe', 'crib', 'finesse'],`);
sub('lib/puzzle-categories.js', `crib: 'Cribbage discard', finesse:`, `crib: 'Cribbage discard', hold: 'Video poker', cell: 'FreeCell', finesse:`);
sub('scripts/verify-endgame-board.mjs', `'yose', 'defend', 'queen'];`, `'yose', 'defend', 'queen', 'swindle'];`);

console.log(`wire-hold-cell-swindle: ${applied} edits applied, ${skipped} already present`);
