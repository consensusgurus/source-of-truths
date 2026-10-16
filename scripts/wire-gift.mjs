// scripts/wire-gift.mjs: wires Gift, the daily Quarto endgame (End Game), into
// every registry, after Swindle wherever Swindle sits.
// Anchored edits: every anchor must match EXACTLY ONCE or the script throws,
// and an edit whose insertion is already present is skipped, so a re-run is safe.
//   node scripts/wire-gift.mjs [dir]
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

const G = {
  TAG: 'The daily Quarto endgame',
  TAGLONG: 'Place the piece you were handed, then pick the one they must play',
  HOW: 'Place the piece your opponent handed you, then choose the one they play. Four in a line sharing any one trait wins. One first move forces the win.',
  COLOR: '#7c3aed', NAVY: '#c4b5fd', BG: '#f1eafe', BORDER: 'rgba(124,58,237,0.4)',
  BLURB: 'A Quarto endgame: place the piece you were handed, then choose the one your opponent must play. One first move forces the win.',
};

// 1. lib/daily-games.js
afterLine('lib/daily-games.js', "{ key: 'swindle', keepsAnswer: true, miss: 'Tries', name: 'Swindle', cat: 'End Game'", [
  `  { key: 'gift', keepsAnswer: true, miss: 'Tries', name: 'Gift', cat: 'End Game', tag: '${G.TAG}', tagLong: '${G.TAGLONG}', how: '${G.HOW}', color: '${G.COLOR}', colorNavy: '${G.NAVY}' },`]);
afterLine('lib/daily-games.js', "{ key: 'swindle', from: '2026-10-14', until: '2026-10-18' },", [
  `  { key: 'gift', from: '2026-10-16', until: '2026-10-20' },`]);
sub('lib/daily-games.js', `  'mate', 'check', 'chain', 'turn', 'defend', 'queen', 'swindle',\n]);`, `  'mate', 'check', 'chain', 'turn', 'defend', 'queen', 'swindle', 'gift',\n]);`);

// 2. lib/sunday-editions.js
sub('lib/sunday-editions.js', `//   swindle the deepest draw of the week, five White moves or more`,
  `//   swindle the deepest draw of the week, five White moves or more\n//   gift    a win in five where the last piece on the board decides it,\n//           against the weekday wins in two to four`);
sub('lib/sunday-editions.js', `'ergo', 'docket', 'defend', 'swindle',`, `'ergo', 'docket', 'defend', 'swindle', 'gift',`);

// 3. app/DailyEndCard.jsx and the launch pins
sub('app/DailyEndCard.jsx', `'yose', 'defend', 'queen', 'swindle']);`, `'yose', 'defend', 'queen', 'swindle', 'gift']);`);
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['gift', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['gift', `);
afterLine('app/DailyEndCard.jsx', "  swindle: { accent: '#9a3412', badgeBg: '#9a3412', badgeInk: T.white, Fin: Swords },", [
  `  gift: { accent: '${G.COLOR}', badgeBg: '${G.COLOR}', badgeInk: T.white, Fin: Swords },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'swindle', cat: 'endgame',", [
  `  { key: 'gift', cat: 'endgame',     name: 'Gift', tag: '${G.TAG}',   blurb: '${G.BLURB}', href: '/gift' },`]);

// 4. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'swindle', href: '/swindle'", [
  `  { key: 'gift', href: '/gift', name: 'Gift', tag: 'the daily quarto endgame', store: 'sot_gift_day', accent: '${G.COLOR}', bg: '${G.BG}', border: '${G.BORDER}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'swindle', href: '/swindle'", [
  `  { key: 'gift', href: '/gift', name: 'Gift', tag: '${G.TAG}', img: '/games/btn-gift.png' },`]);
sub('app/DailyGamesGrid.jsx', `keys: ['mate', 'defend', 'swindle', 'queen', 'four', 'check', 'chain', 'turn', 'yose'] },`, `keys: ['mate', 'defend', 'swindle', 'queen', 'four', 'gift', 'check', 'chain', 'turn', 'yose'] },`);
afterLine('app/DailyStrip.jsx', "{ key: 'swindle', href: '/swindle'", [
  `  { key: 'gift', href: '/gift', name: 'Gift', img: '/games/btn-gift.png', store: 'sot_gift_day', tag: "${G.TAG}" , cat: 'End Game' },`]);
sub('app/DailyStrip.jsx', `swindle: '#fb923c', `, `swindle: '#fb923c', gift: '${G.NAVY}', `);
sub('app/DailyStrip.jsx', `swindle: '#9a3412', `, `swindle: '#9a3412', gift: '${G.COLOR}', `);

// 5. archive
sub('app/archive/page.js', `import { PUZZLES as SWINDLE_FULL } from '../swindle/puzzles';`,
  `import { PUZZLES as SWINDLE_FULL } from '../swindle/puzzles';\nimport { PUZZLES as GIFT_FULL } from '../gift/puzzles';`);
afterLine('app/archive/page.js', 'const SWINDLE = SWINDLE_FULL.map(', [
  'const GIFT = GIFT_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));']);
afterLine('app/archive/page.js', "{ key: 'swindle', name: 'Swindle', path: '/swindle'", [
  `  { key: 'gift', name: 'Gift', path: '/gift', tag: '${G.TAG}', accent: '${G.COLOR}', bg: '${G.BG}', border: '${G.BORDER}', src: GIFT },`]);

// 6. the four puzzle-map registries
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_swindle } from '@/app/swindle/puzzles';`,
    `import { PUZZLES as P_swindle } from '@/app/swindle/puzzles';\nimport { PUZZLES as P_gift } from '@/app/gift/puzzles';`);
  sub(f, `swindle: P_swindle,`, `swindle: P_swindle, gift: P_gift,`);
}

// 7. alternations, rails, catalog, loft
sub('app/api/quiz/daily-status/route.js', `|cell|swindle|`, `|cell|swindle|gift|`);
sub('app/quizzes/QuizHomeClient.jsx', `|cell|swindle|`, `|cell|swindle|gift|`);
sub('app/DailySlateRail.jsx', `'cell', 'swindle', 'scram',`, `'cell', 'swindle', 'gift', 'scram',`);
sub('lib/quiz-catalog.js', `'cell', 'swindle', 'scram',`, `'cell', 'swindle', 'gift', 'scram',`);
sub('lib/loft.js', `'cell', 'swindle', 'scram',`, `'cell', 'swindle', 'gift', 'scram',`);

// 8. glyph: the round board with four pieces, one of each kind
afterLine('lib/game-glyphs.js', "  swindle: 'M3 3h18v18H3z", [
  "  gift: 'M12 2.5a9.5 9.5 0 1 1 0 19a9.5 9.5 0 1 1 0-19M7.5 7.5h3v3h-3zM15 7.5a1.5 1.5 0 1 1 0 3a1.5 1.5 0 1 1 0-3M9 13.5a1.5 1.5 0 1 1 0 3a1.5 1.5 0 1 1 0-3M13.5 13.5h3v3h-3z',  // the round board, four pieces"]);

// 9. groups and sets. End Game is ten games now, past the five-key ceiling of
// Board endgames, so it splits into the line games and the territory games.
sub('lib/daily-groups.js', `  { name: 'Board endgames', cat: 'End Game', keys: ['four', 'check', 'chain', 'turn', 'yose'] },`,
  `  { name: 'Board endgames', cat: 'End Game', keys: ['four', 'gift', 'check'] },\n  { name: 'Territory endgames', cat: 'End Game', keys: ['chain', 'turn', 'yose'] },`);
sub('lib/daily-groups.js', `  // End Game (9)`, `  // End Game (10): Board endgames split on 2026-10-16, when Gift took it past five`);
sub('lib/finish-sets.js', `  { name: 'Board endgames', cat: 'End Game', keys: ['four', 'check', 'turn'] },`, `  { name: 'Board endgames', cat: 'End Game', keys: ['four', 'gift', 'check', 'turn'] },`);

// 10. landing pages
sub('lib/puzzle-categories.js', `keys: ['mate', 'defend', 'swindle', 'queen', 'yose', 'turn', 'check', 'four', 'chain'],`, `keys: ['mate', 'defend', 'swindle', 'queen', 'yose', 'turn', 'check', 'four', 'gift', 'chain'],`);
sub('lib/puzzle-categories.js', `yose: 'Go endgame', turn: 'Othello endgame', check: 'Checkers sweep', four: 'Connect Four endgame', chain: 'Dots and boxes endgame',`,
  `yose: 'Go endgame', turn: 'Othello endgame', check: 'Checkers sweep', four: 'Connect Four endgame', gift: 'Quarto endgame', chain: 'Dots and boxes endgame',`);
sub('lib/puzzle-categories.js', `    title: 'Free Daily Endgame Puzzles: Chess, Go, Othello, Checkers, Connect Four and Dots | Mind Loft',\n    h1: 'Free Daily Endgame Puzzles: Chess, Go, Othello, Checkers, Connect Four and Dots',`,
  `    title: 'Free Daily Endgame Puzzles: Chess, Go, Othello, Checkers, Connect Four, Quarto and Dots | Mind Loft',\n    h1: 'Free Daily Endgame Puzzles: Chess, Go, Othello, Checkers, Connect Four, Quarto and Dots',`);
sub('lib/puzzle-categories.js', `description: 'Nine free daily endgame puzzles played out against a real engine: mate in two, defend the mate, save a lost chess game with a draw, a king-and-pawn ending, a Go endgame, an Othello ending, a checkers sweep, a won Connect Four position and a dots-and-boxes endgame.`,
  `description: 'Ten free daily endgame puzzles played out against a real engine: mate in two, defend the mate, save a lost chess game with a draw, a king-and-pawn ending, a Go endgame, an Othello ending, a checkers sweep, a won Connect Four position, a Quarto endgame and a dots-and-boxes endgame.`);
sub('lib/puzzle-categories.js', `lede: 'Nine endgames a day, each one a position where a single move keeps the result: eight you are already winning, and one lost chess game where one move holds the draw. Four from chess, and one each from Go, Othello, checkers, Connect Four and dots and boxes.`,
  `lede: 'Ten endgames a day, each one a position where a single move keeps the result: nine you are already winning, and one lost chess game where one move holds the draw. Four from chess, and one each from Go, Othello, checkers, Connect Four, Quarto and dots and boxes.`);
sub('lib/puzzle-categories.js', `['Sunday Edition', 'Defend asks for a hold of four moves; Queen asks for a win in twelve; Yose moves to the full 9x9 board.'],`,
  `['Sunday Edition', 'Defend asks for a hold of four moves; Queen asks for a win in twelve; Yose moves to the full 9x9 board; Gift is a win in five decided by the last piece.'],`);
sub('lib/puzzle-categories.js', `['Are they free?', 'Yes, all nine, every day, no account required.'],`, `['Are they free?', 'Yes, all ten, every day, no account required.'],`);

// 11. the board endgames set page, now three line games, and a new set page
sub('lib/puzzle-sets.js', `    title: 'Free Daily Board Game Endgames: Go, Connect Four, Checkers, Dots and Boxes, Othello | Mind Loft',
    h1: 'Free Daily Board Game Endgames: Go, Connect Four, Checkers, Dots and Boxes and Othello',
    description: 'Five free daily endgame puzzles from board games other than chess: a won Connect Four position with one column that keeps it, a checkers sweep in three, a dots-and-boxes endgame where the free box is the trap, an Othello ending with ten squares left, and a Go endgame where a handful of open points decide it. Played out against an engine. No signup.',
    lede: 'Five endgames from five boards, each a position you are already winning with exactly one move that keeps it. Four is Connect Four: one column wins and a wrong drop is not taken back. Check is checkers: take every black piece inside three. Chain is dots and boxes with the safe edges gone. Turn is Othello with ten squares left, where flipping the fewest discs is the habit that wins. Yose is Go: the walls are built, a handful of open points decide it, and two passes count the board.',`,
  `    title: 'Free Daily Board Game Endgames: Connect Four, Quarto and Checkers | Mind Loft',
    h1: 'Free Daily Board Game Endgames: Connect Four, Quarto and Checkers',
    description: 'Three free daily endgame puzzles from board games other than chess: a won Connect Four position with one column that keeps it, a Quarto endgame where one placement and one handover force the win, and a checkers sweep in three. Played out against an engine. No signup.',
    lede: 'Three endgames from three boards, each a position you are already winning with exactly one move that keeps it. Four is Connect Four: one column wins and a wrong drop is not taken back. Gift is Quarto: place the piece you were handed, then choose the one your opponent has to play. Check is checkers: take every black piece inside three.',`);
sub('lib/puzzle-sets.js', `      ['Are they free?', 'All five, every day, no account required.'],
    ],
  },
];`, `      ['Are they free?', 'All three, every day, no account required.'],
    ],
  },
  {
    name: 'Territory endgames', slug: 'territory-endgames', circuit: 'chess-board',
    eyebrow: 'Free daily territory endgame puzzles',
    title: 'Free Daily Territory Endgames: Dots and Boxes, Othello and Go | Mind Loft',
    h1: 'Free Daily Territory Endgames: Dots and Boxes, Othello and Go',
    description: 'Three free daily endgame puzzles where the count at the end decides it: a dots-and-boxes endgame where the free box is the trap, an Othello ending with ten squares left, and a Go endgame where a handful of open points decide it. Played out against an engine. No signup.',
    lede: 'Three endgames where the count at the end decides it, each a position you are already winning with exactly one move that keeps it. Chain is dots and boxes with the safe edges gone. Turn is Othello with ten squares left, where flipping the fewest discs is the habit that wins. Yose is Go: the walls are built, a handful of open points decide it, and two passes count the board.',
    how: [
      'None of these is checked against a key. The position is played out against an engine that defends as well as it can, and the round ends when the game does, so a wrong move is not announced while you can still play. The board ranks solvers by how many attempts the solve took, and a replay counts.',
    ],
    faq: [
      ['Do I need to know the games?', 'The rules are stated on each page and the engine enforces them. The puzzle is reading the position a few moves deep.'],
      ['Are they free?', 'All three, every day, no account required.'],
    ],
  },
];`);

// 12. the checkers that list the End Game titles
sub('scripts/verify-endgame-board.mjs', `'yose', 'defend', 'queen', 'swindle'];`, `'yose', 'defend', 'queen', 'swindle', 'gift'];`);

console.log(`wire-gift: ${applied} edits applied, ${skipped} already present`);
