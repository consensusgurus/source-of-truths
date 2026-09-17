// scripts/wire-yose-crib.mjs — wires two dailies into every registry:
//   yose  the daily Go endgame (End Game), sits after Turn in every list
//   crib  the daily cribbage throw (Cards), sits after Finesse in every list
//
// An ANCHORED script in the shape of scripts/wire-snug.mjs: every anchor must
// match EXACTLY ONCE or the script throws, and an edit whose replacement is
// already present is skipped, so a re-run after a partial push is safe.
//
//   node scripts/wire-yose-crib.mjs <dir>
//
// <dir> is a tree exported from a same-step `git archive FETCH_HEAD`. Both
// games run a Sunday Edition, so both join lib/sunday-editions.js and the
// sunday-slate route. Yose is End Game, so it also joins DEFEAT_GAMES, the
// 'Board endgames' set and the verify-endgame-board roster; Cards stays
// ungrouped at five games.
import fs from 'fs';
import path from 'path';

const root = process.argv[2];
if (!root) { console.error('usage: node wire-yose-crib.mjs <dir>'); process.exit(1); }

let applied = 0, skipped = 0;
function edit(file, anchor, replacement) {
  const p = path.join(root, file);
  const src = fs.readFileSync(p, 'utf8');
  if (src.includes(replacement)) { skipped++; return; }
  const n = src.split(anchor).length - 1;
  if (n !== 1) throw new Error(`${file}: anchor matched ${n} times, expected 1\n  ${anchor.slice(0, 140)}`);
  fs.writeFileSync(p, src.replace(anchor, replacement));
  applied++;
}

const Y = {
  TAG: 'The last points on the board',
  HOW: 'A Go endgame you are already winning. The walls are built and a handful of open points decide it; White answers perfectly and one first move keeps the win. Pass when nothing is worth playing, and two passes count the board by area.',
  COLOR: '#44403c', NAVY: '#d6d3d1', BG: '#efedeb', BORDER: 'rgba(68,64,60,0.4)',
  BLURB: 'A Go endgame you are already winning. A handful of open points, a perfect opponent, and one move that keeps the win. Nine by nine on Sundays.',
};
const C = {
  TAG: 'Six cards, throw two',
  HOW: 'Five hands of six cards, and for each you throw two to the crib, which alternates between yours and your opponent\\\'s. Every throw is valued exactly over every cut card and every crib, so the best throw is a fact. Two points for the best, one for a close one.',
  COLOR: '#a16207', NAVY: '#fcd34d', BG: '#fbf3dd', BORDER: 'rgba(161,98,7,0.4)',
  BLURB: 'Five cribbage hands, one choice each: which two cards go to the crib. Every throw is worked out exactly, so the best one is a fact. Seven hands on Sundays.',
};

// ─── 1. lib/daily-games.js — the rows and the premieres ────────────────────
edit('lib/daily-games.js',
  `  { key: 'turn', keepsAnswer: true, miss: 'Tries', name: 'Turn', cat: 'End Game',`,
  `  { key: 'yose', keepsAnswer: true, miss: 'Tries', name: 'Yose', cat: 'End Game', tag: '${Y.TAG}', how: '${Y.HOW}', color: '${Y.COLOR}', colorNavy: '${Y.NAVY}' },\n  { key: 'turn', keepsAnswer: true, miss: 'Tries', name: 'Turn', cat: 'End Game',`);
edit('lib/daily-games.js',
  `  { key: 'finesse', keepsAnswer: true, miss: 'Tries', name: 'Finesse', cat: 'Cards',`,
  `  { key: 'crib', miss: null, name: 'Crib', cat: 'Cards', tag: '${C.TAG}', how: '${C.HOW}', color: '${C.COLOR}', colorNavy: '${C.NAVY}' },\n  { key: 'finesse', keepsAnswer: true, miss: 'Tries', name: 'Finesse', cat: 'Cards',`);
edit('lib/daily-games.js',
  `  { key: 'snug', from: '2026-09-13', until: '2026-09-17' },`,
  `  { key: 'snug', from: '2026-09-13', until: '2026-09-17' },\n  { key: 'yose', from: '2026-09-17', until: '2026-09-21' },\n  { key: 'crib', from: '2026-09-17', until: '2026-09-21' },`);

// ─── 2. lib/sunday-editions.js ──────────────────────────────────────────────
edit('lib/sunday-editions.js',
  `//   turn    twelve empty squares instead of ten, which is two more plies of`,
  `//   yose    a 9x9 board with eleven open points against the weekday 7x7 and\n//           8x8 with six to ten, and at least three single-answer turns\n//   crib    seven hands instead of five, three of them decided by the crib\n//   turn    twelve empty squares instead of ten, which is two more plies of`);
edit('lib/sunday-editions.js',
  `'taire', 'finesse', 'fib',`,
  `'taire', 'finesse', 'crib', 'fib',`);
edit('lib/sunday-editions.js',
  `  'babel', 'glyph', 'chain', 'turn', 'blocks',`,
  `  'babel', 'glyph', 'chain', 'turn', 'yose', 'blocks',`);

// ─── 3. app/DailyEndCard.jsx ────────────────────────────────────────────────
edit('app/DailyEndCard.jsx',
  `const DEFEAT_GAMES = new Set(['four', 'mate', 'check', 'taire', 'chain', 'turn', 'defend', 'queen']);`,
  `const DEFEAT_GAMES = new Set(['four', 'mate', 'check', 'taire', 'chain', 'turn', 'yose', 'defend', 'queen']);`);
edit('app/DailyEndCard.jsx',
  `const LAUNCH_PIN = { keys: ['snug', 'frame',`,
  `const LAUNCH_PIN = { keys: ['yose', 'crib', 'snug', 'frame',`);
edit('app/DailyEndCard.jsx',
  `  finesse: { accent: '#4c1d95', badgeBg: '#4c1d95', badgeInk: T.white, Fin: Layers },`,
  `  finesse: { accent: '#4c1d95', badgeBg: '#4c1d95', badgeInk: T.white, Fin: Layers },\n  crib: { accent: '${C.COLOR}', badgeBg: '${C.COLOR}', badgeInk: T.white, Fin: Layers },\n  yose: { accent: '${Y.COLOR}', badgeBg: '${Y.COLOR}', badgeInk: T.white, Fin: Swords },`);
edit('app/DailyEndCard.jsx',
  `  { key: 'turn',   cat: 'endgame',     name: 'Turn',`,
  `  { key: 'yose',   cat: 'endgame',     name: 'Yose',   tag: '${Y.TAG}',            blurb: '${Y.BLURB}', href: '/yose' },\n  { key: 'turn',   cat: 'endgame',     name: 'Turn',`);
edit('app/DailyEndCard.jsx',
  `  { key: 'finesse',  cat: 'cards',     name: 'Finesse',`,
  `  { key: 'crib',  cat: 'cards',     name: 'Crib',  tag: '${C.TAG}', blurb: '${C.BLURB}', href: '/crib' },\n  { key: 'finesse',  cat: 'cards',     name: 'Finesse',`);

// ─── 4. app/api/quiz/daily-order/route.js ───────────────────────────────────
edit('app/api/quiz/daily-order/route.js',
  `const LAUNCH_PIN = { keys: ['snug', 'frame',`,
  `const LAUNCH_PIN = { keys: ['yose', 'crib', 'snug', 'frame',`);

// ─── 5. app/DailyGamesPromo.jsx ─────────────────────────────────────────────
edit('app/DailyGamesPromo.jsx',
  `  { key: 'turn', href: '/turn', name: 'Turn', tag: 'ten squares left', store: 'sot_turn_day', accent: '#226218', bg: '#e9f3e6', border: 'rgba(34,98,24,0.4)' },`,
  `  { key: 'turn', href: '/turn', name: 'Turn', tag: 'ten squares left', store: 'sot_turn_day', accent: '#226218', bg: '#e9f3e6', border: 'rgba(34,98,24,0.4)' },\n  { key: 'yose', href: '/yose', name: 'Yose', tag: 'the last points on the board', store: 'sot_yose_day', accent: '${Y.COLOR}', bg: '${Y.BG}', border: '${Y.BORDER}' },`);
edit('app/DailyGamesPromo.jsx',
  `  { key: 'finesse', href: '/finesse', name: 'Finesse', tag: 'the daily double dummy', store: 'sot_finesse_day', accent: '#4c1d95', bg: '#ede9fe', border: 'rgba(76,29,149,0.4)' },`,
  `  { key: 'finesse', href: '/finesse', name: 'Finesse', tag: 'the daily double dummy', store: 'sot_finesse_day', accent: '#4c1d95', bg: '#ede9fe', border: 'rgba(76,29,149,0.4)' },\n  { key: 'crib', href: '/crib', name: 'Crib', tag: 'six cards, throw two', store: 'sot_crib_day', accent: '${C.COLOR}', bg: '${C.BG}', border: '${C.BORDER}' },`);

// ─── 6. app/DailyGamesGrid.jsx — BOTH lists ─────────────────────────────────
edit('app/DailyGamesGrid.jsx',
  `  { key: 'turn', href: '/turn', name: 'Turn', tag: 'Ten squares left', img: '/games/btn-turn.png' },`,
  `  { key: 'turn', href: '/turn', name: 'Turn', tag: 'Ten squares left', img: '/games/btn-turn.png' },\n  { key: 'yose', href: '/yose', name: 'Yose', tag: '${Y.TAG}', img: '/games/btn-yose.png' },`);
edit('app/DailyGamesGrid.jsx',
  `  { key: 'finesse', href: '/finesse', name: 'Finesse', tag: 'The daily double dummy', img: '/games/btn-finesse.png' },`,
  `  { key: 'finesse', href: '/finesse', name: 'Finesse', tag: 'The daily double dummy', img: '/games/btn-finesse.png' },\n  { key: 'crib', href: '/crib', name: 'Crib', tag: '${C.TAG}', img: '/games/btn-crib.png' },`);
edit('app/DailyGamesGrid.jsx',
  `  { key: 'endgame', label: 'End Game', keys: ['mate', 'defend', 'queen', 'four', 'check', 'chain', 'turn'] },`,
  `  { key: 'endgame', label: 'End Game', keys: ['mate', 'defend', 'queen', 'four', 'check', 'chain', 'turn', 'yose'] },`);
edit('app/DailyGamesGrid.jsx',
  `  { key: 'cards', label: 'Cards', keys: ['taire', 'hands', 'shoe', 'finesse'] },`,
  `  { key: 'cards', label: 'Cards', keys: ['taire', 'hands', 'shoe', 'finesse', 'crib'] },`);

// ─── 7. app/DailyStrip.jsx ──────────────────────────────────────────────────
edit('app/DailyStrip.jsx',
  `  { key: 'turn', href: '/turn', name: 'Turn', img: '/games/btn-turn.png', store: 'sot_turn_day', tag: "Ten squares left" , cat: 'End Game' },`,
  `  { key: 'turn', href: '/turn', name: 'Turn', img: '/games/btn-turn.png', store: 'sot_turn_day', tag: "Ten squares left" , cat: 'End Game' },\n  { key: 'yose', href: '/yose', name: 'Yose', img: '/games/btn-yose.png', store: 'sot_yose_day', tag: "${Y.TAG}" , cat: 'End Game' },`);
edit('app/DailyStrip.jsx',
  `  { key: 'finesse', href: '/finesse', name: 'Finesse', img: '/games/btn-finesse.png', store: 'sot_finesse_day', tag: "The daily double dummy" , cat: 'Cards' },`,
  `  { key: 'finesse', href: '/finesse', name: 'Finesse', img: '/games/btn-finesse.png', store: 'sot_finesse_day', tag: "The daily double dummy" , cat: 'Cards' },\n  { key: 'crib', href: '/crib', name: 'Crib', img: '/games/btn-crib.png', store: 'sot_crib_day', tag: "${C.TAG}" , cat: 'Cards' },`);
edit('app/DailyStrip.jsx',
  `const ACCENTS = { snug: '#91a7ff',`,
  `const ACCENTS = { yose: '${Y.NAVY}', crib: '${C.NAVY}', snug: '#91a7ff',`);
edit('app/DailyStrip.jsx',
  `const TCOL = { snug: '#3b5bdb',`,
  `const TCOL = { yose: '${Y.COLOR}', crib: '${C.COLOR}', snug: '#3b5bdb',`);

// ─── 8. app/daily/page.js — imports, maps and cards ─────────────────────────
edit('app/daily/page.js',
  `import { PUZZLES as TURN_FULL } from '../turn/puzzles';`,
  `import { PUZZLES as TURN_FULL } from '../turn/puzzles';\nimport { PUZZLES as YOSE_FULL } from '../yose/puzzles';\nimport { PUZZLES as CRIB_FULL } from '../crib/puzzles';`);
edit('app/daily/page.js',
  `const TURN = TURN_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`,
  `const TURN = TURN_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));\nconst YOSE = YOSE_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));\nconst CRIB = CRIB_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`);
edit('app/daily/page.js',
  `  { key: 'turn', name: 'Turn', path: '/turn', tag: 'Ten squares left', accent: '#226218', bg: '#e9f3e6', border: 'rgba(34,98,24,0.4)', src: TURN },`,
  `  { key: 'turn', name: 'Turn', path: '/turn', tag: 'Ten squares left', accent: '#226218', bg: '#e9f3e6', border: 'rgba(34,98,24,0.4)', src: TURN },\n  { key: 'yose', name: 'Yose', path: '/yose', tag: '${Y.TAG}', accent: '${Y.COLOR}', bg: '${Y.BG}', border: '${Y.BORDER}', src: YOSE },`);
edit('app/daily/page.js',
  `  { key: 'finesse', name: 'Finesse', path: '/finesse', tag: 'The daily double dummy', accent: '#4c1d95', bg: '#ede9fe', border: 'rgba(76,29,149,0.4)', src: FINESSE },`,
  `  { key: 'finesse', name: 'Finesse', path: '/finesse', tag: 'The daily double dummy', accent: '#4c1d95', bg: '#ede9fe', border: 'rgba(76,29,149,0.4)', src: FINESSE },\n  { key: 'crib', name: 'Crib', path: '/crib', tag: '${C.TAG}', accent: '${C.COLOR}', bg: '${C.BG}', border: '${C.BORDER}', src: CRIB },`);

// ─── 9. app/daily/DailyArchiveClient.jsx ────────────────────────────────────
edit('app/daily/DailyArchiveClient.jsx',
  `  { key: 'endgame', label: 'End Game', keys: ['mate', 'defend', 'queen', 'four', 'check', 'chain', 'turn'] },`,
  `  { key: 'endgame', label: 'End Game', keys: ['mate', 'defend', 'queen', 'four', 'check', 'chain', 'turn', 'yose'] },`);
edit('app/daily/DailyArchiveClient.jsx',
  `  { key: 'cards', label: 'Cards', keys: ['taire', 'hands', 'shoe', 'finesse'] },`,
  `  { key: 'cards', label: 'Cards', keys: ['taire', 'hands', 'shoe', 'finesse', 'crib'] },`);
edit('app/daily/DailyArchiveClient.jsx',
  `finesse: '#c4b5fd', chain: '#f0abfc'`,
  `finesse: '#c4b5fd', crib: '${C.NAVY}', yose: '${Y.NAVY}', chain: '#f0abfc'`);

// ─── 10. lib/sitemap-entries.js ─────────────────────────────────────────────
edit('lib/sitemap-entries.js',
  `'babel', 'chain', 'turn', 'suffice',`,
  `'babel', 'chain', 'turn', 'yose', 'suffice',`);
edit('lib/sitemap-entries.js',
  `'anon', 'hands', 'finesse', 'atlas',`,
  `'anon', 'hands', 'finesse', 'crib', 'atlas',`);

// ─── 11. the puzzle-map registries, sunday-slate included ───────────────────
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  edit(f, `import { PUZZLES as P_finesse } from '@/app/finesse/puzzles';`,
    `import { PUZZLES as P_finesse } from '@/app/finesse/puzzles';\nimport { PUZZLES as P_yose } from '@/app/yose/puzzles';\nimport { PUZZLES as P_crib } from '@/app/crib/puzzles';`);
  edit(f, `finesse: P_finesse`, `finesse: P_finesse, yose: P_yose, crib: P_crib`);
}

// ─── 12. the two hardcoded alternations ─────────────────────────────────────
edit('app/api/quiz/daily-status/route.js', `|frame|rim`, `|frame|rim|yose|crib`);
edit('app/quizzes/QuizHomeClient.jsx', `|frame|rim`, `|frame|rim|yose|crib`);

// ─── 13. app/DailySlateRail.jsx ─────────────────────────────────────────────
edit('app/DailySlateRail.jsx',
  `'hands', 'finesse', 'chain', 'turn', 'suffice',`,
  `'hands', 'finesse', 'crib', 'chain', 'turn', 'yose', 'suffice',`);

// ─── 14. lib/quiz-catalog.js ────────────────────────────────────────────────
edit('lib/quiz-catalog.js', `'diag', 'frame', 'rim']`, `'diag', 'frame', 'rim', 'yose', 'crib']`);

// ─── 15. lib/loft.js ────────────────────────────────────────────────────────
edit('lib/loft.js',
  `'whittle', 'diag', 'frame', 'rim',\n]);`,
  `'whittle', 'diag', 'frame', 'rim', 'yose', 'crib',\n]);`);

// ─── 16. lib/game-glyphs.js ─────────────────────────────────────────────────
edit('lib/game-glyphs.js',
  `  finesse: 'M9 2h6v6H9zM16 9h6v6h-6zM9 16h6v6H9zM2 9h6v6H2z',                // four hands round a trick`,
  `  finesse: 'M9 2h6v6H9zM16 9h6v6h-6zM9 16h6v6H9zM2 9h6v6H2z',                // four hands round a trick
  crib: 'M2 7h20v10H2zM6 10.5h.01M10 10.5h.01M14 10.5h.01M18 10.5h.01M8 13.5h.01M12 13.5h.01M16 13.5h.01',  // a cribbage board, pegs in two tracks
  yose: 'M3 3v18M21 3v18M3 3h18M3 21h18M12 3v5M12 16v5M12 8a4 4 0 1 1 0 8a4 4 0 1 1 0-8',  // the board edge, one stone on the last point`);

// ─── 17. lib/puzzle-categories.js — the two landing pages ───────────────────
edit('lib/puzzle-categories.js',
  `    title: 'Free Daily Endgame Puzzles: Chess, Othello, Checkers, Connect Four and Dots | Mind Loft',`,
  `    title: 'Free Daily Endgame Puzzles: Chess, Go, Othello, Checkers, Connect Four and Dots | Mind Loft',`);
edit('lib/puzzle-categories.js',
  `    h1: 'Free Daily Endgame Puzzles: Chess, Othello, Checkers, Connect Four and Dots',`,
  `    h1: 'Free Daily Endgame Puzzles: Chess, Go, Othello, Checkers, Connect Four and Dots',`);
edit('lib/puzzle-categories.js',
  `    description: 'Seven free daily endgame puzzles played out against a real engine: mate in two, defend the mate, a king-and-pawn ending, an Othello ending,`,
  `    description: 'Eight free daily endgame puzzles played out against a real engine: mate in two, defend the mate, a king-and-pawn ending, a Go endgame, an Othello ending,`);
edit('lib/puzzle-categories.js',
  `    lede: 'Seven endgames a day, each one a position you are already winning with exactly one move that keeps it. Three from chess, and one each from Othello, checkers, Connect Four and dots and boxes.`,
  `    lede: 'Eight endgames a day, each one a position you are already winning with one move that keeps it. Three from chess, and one each from Go, Othello, checkers, Connect Four and dots and boxes.`);
edit('lib/puzzle-categories.js',
  `    keys: ['mate', 'defend', 'queen', 'turn', 'check', 'four', 'chain'],`,
  `    keys: ['mate', 'defend', 'queen', 'yose', 'turn', 'check', 'four', 'chain'],`);
edit('lib/puzzle-categories.js',
  `      turn: 'Othello endgame', check: 'Checkers sweep',`,
  `      yose: 'Go endgame', turn: 'Othello endgame', check: 'Checkers sweep',`);
edit('lib/puzzle-categories.js',
  `      ['Are they free?', 'Yes, all seven, every day, no account required.'],`,
  `      ['Are they free?', 'Yes, all eight, every day, no account required.'],`);
edit('lib/puzzle-categories.js',
  `      ['Sunday Edition', 'Defend asks for a hold of four moves; Queen asks for a win in twelve.'],\n    ],\n    faq: [\n      ['Do I need to know the game?'`,
  `      ['Sunday Edition', 'Defend asks for a hold of four moves; Queen asks for a win in twelve; Yose moves to the full 9x9 board.'],\n    ],\n    faq: [\n      ['Do I need to know the game?'`);
edit('lib/puzzle-categories.js',
  `    title: 'Free Daily Card Games: Solitaire, Poker Solitaire, Blackjack and Double Dummy | Mind Loft',`,
  `    title: 'Free Daily Card Games: Solitaire, Poker Solitaire, Blackjack, Cribbage and Double Dummy | Mind Loft',`);
edit('lib/puzzle-categories.js',
  `    h1: 'Free Daily Card Games: Solitaire, Poker Solitaire, Blackjack and Double Dummy Bridge',`,
  `    h1: 'Free Daily Card Games: Solitaire, Poker Solitaire, Blackjack, Cribbage and Double Dummy Bridge',`);
edit('lib/puzzle-categories.js',
  `    description: 'Four free daily card games with the same deal for everyone: a solitaire with a proven minimum line, a poker solitaire grid, five hands of blackjack off one fixed shoe, and a double dummy bridge problem against perfect defenders.`,
  `    description: 'Five free daily card games with the same deal for everyone: a solitaire with a proven minimum line, a poker solitaire grid, five hands of blackjack off one fixed shoe, a cribbage throw worked out exactly, and a double dummy bridge problem against perfect defenders.`);
edit('lib/puzzle-categories.js',
  `    lede: 'Four card games a day, and the deal is the same for everybody,`,
  `    lede: 'Five card games a day, and the deal is the same for everybody,`);
edit('lib/puzzle-categories.js',
  `five hands of blackjack off one fixed shoe, and a double dummy bridge problem with all four hands face up.'`,
  `five hands of blackjack off one fixed shoe, five cribbage throws valued exactly, and a double dummy bridge problem with all four hands face up.'`);
edit('lib/puzzle-categories.js',
  `    keys: ['taire', 'hands', 'shoe', 'finesse'],`,
  `    keys: ['taire', 'hands', 'shoe', 'crib', 'finesse'],`);
edit('lib/puzzle-categories.js',
  `shoe: 'Blackjack, fixed shoe', finesse: 'Double dummy bridge' },`,
  `shoe: 'Blackjack, fixed shoe', crib: 'Cribbage discard', finesse: 'Double dummy bridge' },`);
edit('lib/puzzle-categories.js',
  `so counting what you have seen is how you beat it. Finesse is a double dummy problem:`,
  `so counting what you have seen is how you beat it. Crib is the cribbage throw: six cards, two to the crib, and every choice valued over every cut card and every crib. Finesse is a double dummy problem:`);
edit('lib/puzzle-categories.js',
  `Taire if you like a solitaire with an answer. Finesse is the deepest of the four and worth a slow first sitting.`,
  `Taire if you like a solitaire with an answer. Crib if you have ever played cribbage. Finesse is the deepest of the five and worth a slow first sitting.`);
edit('lib/puzzle-categories.js',
  `      ['Are they free?', 'All four, every day, no account required.'],`,
  `      ['Are they free?', 'All five, every day, no account required.'],`);

// ─── 18. lib/daily-groups.js — Yose joins the board endgames ────────────────
edit('lib/daily-groups.js',
  `  { name: 'Board endgames', cat: 'End Game', keys: ['four', 'check', 'chain', 'turn'] },`,
  `  { name: 'Board endgames', cat: 'End Game', keys: ['four', 'check', 'chain', 'turn', 'yose'] },`);
edit('lib/daily-groups.js', `  // End Game (7)`, `  // End Game (8)`);
// Snug (Logic, 2026-09-13) was never placed in a set, which fails
// verify-daily-groups; it is a grid-drawing puzzle by kind.
edit('lib/daily-groups.js',
  `  { name: 'Grid drawing', cat: 'Logic', keys: ['etch', 'hedge', 'plot', 'paths'] },`,
  `  { name: 'Grid drawing', cat: 'Logic', keys: ['etch', 'hedge', 'plot', 'paths', 'snug'] },`);
edit('lib/daily-groups.js', `  // Logic (18)`, `  // Logic (19)`);

// ─── 19. scripts/verify-endgame-board.mjs — the roster ──────────────────────
edit('scripts/verify-endgame-board.mjs',
  `const EG = ['mate', 'four', 'check', 'chain', 'turn', 'defend', 'queen'];`,
  `const EG = ['mate', 'four', 'check', 'chain', 'turn', 'yose', 'defend', 'queen'];`);

// ─── 20. CLAUDE.md — the Sunday table rows and the launch section ──────────
edit('CLAUDE.md',
  `| Turn | twelve empty squares instead of ten (from 2026-08-05) |`,
  `| Turn | twelve empty squares instead of ten (from 2026-08-05) |\n| Yose | a 9x9 board with eleven open points against the weekday 7x7 and 8x8 (from launch, 2026-09-20) |\n| Crib | seven hands instead of five, three of them decided by the crib (from launch, 2026-09-20) |`);
{
  const p = path.join(root, 'CLAUDE.md');
  const src = fs.readFileSync(p, 'utf8');
  const marker = '## Yose (`/yose`) and Crib (`/crib`)';
  if (!src.includes(marker)) {
    fs.writeFileSync(p, src.replace(/\s*$/, '\n') + `
${marker}: a Go endgame and a cribbage throw (launched 2026-09-17)

Wired by \`scripts/wire-yose-crib.mjs\` (anchored on the Turn and Finesse rows, idempotent). No PNG
tiles; \`lib/game-glyphs.js\` has both. Share cards are static \`public/og/<key>.png\` from
\`scripts/bake-og.mjs yose crib\`. Premiere window 2026-09-17 to 09-21. Banks run 78 days,
2026-09-17 to 2026-12-03.

**Yose** — key/route \`yose\`, category **End Game** (the eighth), \`keepsAnswer: true\`,
\`miss: 'Tries'\`, legacy accent \`#44403c\` / navy \`#d6d3d1\`, in DEFEAT_GAMES and the
'Board endgames' set. A Go board whose walls are built and whose territories are settled; a few
OPEN POINTS (the only playable points) and a few LOOSE enemy stones decide it. Go rules with the
simple ko rule, suicide banned, a pass is a move, two passes end the game, AREA scoring. Every fixed
stone belongs to a group touching its own territory, so only loose stones can ever be captured.

- \`lib/yose-core.js\` is the engine, shared by the generator and the browser. It solves every
  position with NO pruning (the ko ban is part of the memo key) and the generator THROWS A BOARD
  AWAY if any line repeats a whole position, so no superko rule is ever needed and the value table
  is exact. \`komi\` is (root value - 0.5), so perfect play wins by exactly half a point.
- The engine's reply tie-break (lowest value, then most captures, then a real move before a pass,
  then the lowest point) is deterministic, so everybody who plays a line meets the same replies.
- **The ramp** (measured, a few hundred boards per shape): Mon 7x7 6 open, 1 or 2 winning first
  moves, >=1 forced decision; Tue 7x7 7 open, same; Wed 7x7 8 open, exactly one winner, >=2 forced;
  Thu 7x7 9 open, >=2; Fri 8x8 10 open, >=2; Sat 8x8 10 open, >=3; **Sunday 9x9 11 open, >=3**.
  A forced decision is a Black turn on the main line with two or more choices and exactly one that
  keeps the win. Passing is never the winning first move, at least two first moves lose, and the
  komi stays within 9 (11 on Sunday). Each day is generated from a seed off its date
  (\`gen-yose.mjs day\`), so days run in parallel and any one can be regenerated alone.
- \`scripts/verify-yose.mjs\` carries its OWN engine (2D grid, recursive groups, string keys,
  negamax) and re-derives everything, including that its memo size equals the stored \`nodes\`.
  A full run is about three and a half minutes; \`--quick\` skips solving the Sundays.
- The client counts an error for every Black move that lowers the position's value and SHOWS it
  only once the stones are counted. \`progress\` = Black moves that kept the value. The key point
  is ringed only for a player who won. The value table is warmed on mount, because a Sunday is up
  to a hundred thousand positions and the first search is the only expensive one.

**Crib** — key/route \`crib\`, category **Cards** (the fifth, still ungrouped), \`miss: null\`
(first attempt stands, the clock breaks ties), legacy accent \`#a16207\` / navy \`#fcd34d\`. Five
six-card hands a day (seven on Sunday), each one a choice of the two cards to throw, the crib
alternating yours / theirs starting with yours. A throw's value is the kept four's average over all
46 cut cards, plus the crib's average (over every cut and every pair of the 45 cards the opponent
might throw) when the crib is yours, minus it when it is theirs. 2 points for the best throw, 1
within 0.75 of it, so the score is out of 10 (14 on Sunday).

- \`lib/crib-core.js\` is the scorer and valuation (client and generator). \`scripts/gen-crib.mjs\`
  values random hands into pools (\`pool\`, both cribs per hand) and deals the calendar (\`bank\`).
- **The ramp is the GAP** between the best and second-best throw, measured (median 1.24 on random
  hands): Mon >=2.0; Tue 1.3-2.6; Wed 0.9-1.7 with >=1 crib-decided hand; Thu 0.6-1.15 >=1; Fri
  0.4-0.85 >=2; Sat 0.2-0.6 >=2; **Sunday 0.2-1.0, seven hands, >=3 crib-decided**. A hand is
  crib-decided (\`flip\`) when the four best cards to keep are NOT the best throw. No six-card set
  repeats; no rank pattern (plus crib side) inside 21 days.
- \`scripts/verify-crib.mjs\` has its own rank-pattern cached scorer, checks known hands (29, 28,
  24, flushes, nobs), and recomputes every value (tolerance 0.0015). Full run about five minutes;
  \`--quick\` recomputes the first hand per day.
- The reveal after each hand shows the top throws with hand, crib and value, and a deterministic
  cut (\`cutFor\`) with its breakdown, which is flavour and scores nothing.
`);
    applied++;
  } else skipped++;
}

console.log(`wire-yose-crib: ${applied} edits applied, ${skipped} already present`);
