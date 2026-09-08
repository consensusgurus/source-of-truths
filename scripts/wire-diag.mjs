// scripts/wire-diag.mjs — wires the daily game `diag` into every registry.
//
// Done as an ANCHORED script rather than by hand, per the daily-game checklist:
// half these registries fail SILENTLY when missed (a key in one list and not
// its partner is dropped with no error and no gap), so every anchor here must
// match EXACTLY ONCE or the script throws. It is idempotent — an edit whose
// replacement is already present is skipped — so a re-run after a partial push
// is safe.
//
//   node scripts/wire-diag.mjs <dir>
//
// <dir> is a tree exported from a same-step `git archive FETCH_HEAD`, never the
// working tree, which satisfies the stale-base rule for free. Pass `.` only
// when working locally against a tree you know is current.
//
// Diag is the tenth FILL-IN sudoku (Whittle, the eleventh Sudoku row, is played
// backwards and sits outside the circuit pool). It joins the Sudoku category,
// the rotating Sudoku circuit pool (nine -> TEN, `rotate` stays 5), the
// 'Classic sudokus' set, and runs a Sunday Edition (fourteen clues). The share
// card is `node scripts/bake-og.mjs diag`, run after this script.
import fs from 'fs';
import path from 'path';

const root = process.argv[2];
if (!root) { console.error('usage: node wire-diag.mjs <dir>'); process.exit(1); }

let applied = 0, skipped = 0;
// The idempotency test is "is the finished text already here", i.e. the WHOLE
// replacement, never a suffix of it. See wire-encore.mjs for why.
function edit(file, anchor, replacement) {
  const p = path.join(root, file);
  const src = fs.readFileSync(p, 'utf8');
  if (src.includes(replacement)) { skipped++; return; }
  const n = src.split(anchor).length - 1;
  if (n !== 1) throw new Error(`${file}: anchor matched ${n} times, expected 1\n  ${anchor.slice(0, 120)}`);
  fs.writeFileSync(p, src.replace(anchor, replacement));
  applied++;
}

const TAG = 'The daily diagonal sudoku';
const HOW = 'An ordinary sudoku plus one rule: each of the two long diagonals, corner to corner, also holds every digit exactly once. The diagonals are ruled across the grid and count as houses of their own, so the board prints fewer digits than a plain sudoku needs.';
// The page is painted by the Sudoku category ramp; this pair is the legacy
// slate-row hue that tells Diag apart from its ten siblings in the one table
// that still carries a per-game colour.
const COLOR = '#0e7490', NAVY = '#7dd3fc', BG = '#e8f6fa', BORDER = 'rgba(14,116,144,0.4)';

// ─── 1. lib/daily-games.js — the single source of truth, plus the premiere ──
// Placed after Knight so the fill-in sudokus stay contiguous in the canonical
// daily order, which is what the filter strip reads.
edit('lib/daily-games.js',
  `  { key: 'polka', miss: null, name: 'Polka', cat: 'Sudoku', tag: 'No numbers, only dots',`,
  `  { key: 'diag', miss: null, name: 'Diag', cat: 'Sudoku', tag: '${TAG}', how: '${HOW}', color: '${COLOR}', colorNavy: '${NAVY}' },\n  { key: 'polka', miss: null, name: 'Polka', cat: 'Sudoku', tag: 'No numbers, only dots',`);
edit('lib/daily-games.js',
  `  { key: 'junkyard', from: '2026-09-04', until: '2026-09-08' },\n];`,
  `  { key: 'junkyard', from: '2026-09-04', until: '2026-09-08' },\n  { key: 'diag', from: '2026-09-08', until: '2026-09-12' },\n];`);

// ─── 2. lib/sunday-editions.js — the fourteen-clue Sunday Edition ──────────
edit('lib/sunday-editions.js',
  `  'flank',\n  'whittle',`,
  `  'flank',\n  'whittle',\n  'diag',`);

// ─── 3. app/DailyEndCard.jsx — icon import, LAUNCH_PIN, GAME_META, tile copy ─
edit('app/DailyEndCard.jsx',
  `  Clapperboard, Quote, ZoomIn, Axe, Truck, Rows3, Boxes,\n} from 'lucide-react';`,
  `  Clapperboard, Quote, ZoomIn, Axe, Truck, Rows3, Boxes, MoveDiagonal,\n} from 'lucide-react';`);
edit('app/DailyEndCard.jsx',
  `const LAUNCH_PIN = { keys: ['junkyard',`,
  `const LAUNCH_PIN = { keys: ['diag', 'junkyard',`);
edit('app/DailyEndCard.jsx',
  `  polka: { accent: '#16a34a', badgeBg: '#16a34a', badgeInk: T.white, Fin: CircleDot },`,
  `  polka: { accent: '#16a34a', badgeBg: '#16a34a', badgeInk: T.white, Fin: CircleDot },\n  diag: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: MoveDiagonal },`);
edit('app/DailyEndCard.jsx',
  `  { key: 'polka',  cat: 'sudoku' ,   name: 'Polka',`,
  `  { key: 'diag',  cat: 'sudoku' ,   name: 'Diag',  tag: '${TAG}',    blurb: 'Sudoku X: both long diagonals hold 1 to 9 as well, so two extra houses cross the grid and the board prints fewer clues.', href: '/diag' },\n  { key: 'polka',  cat: 'sudoku' ,   name: 'Polka',`);

// ─── 4. app/api/quiz/daily-order/route.js — the LAUNCH_PIN mirror ───────────
edit('app/api/quiz/daily-order/route.js',
  `const LAUNCH_PIN = { keys: ['junkyard',`,
  `const LAUNCH_PIN = { keys: ['diag', 'junkyard',`);

// ─── 5. app/DailyGamesPromo.jsx ─────────────────────────────────────────────
edit('app/DailyGamesPromo.jsx',
  `  { key: 'polka', href: '/polka', name: 'Polka', tag: 'the daily kropki sudoku', store: 'sot_polka_day', accent: '#16a34a', bg: '#ecf9f1', border: 'rgba(22,163,74,0.4)' },`,
  `  { key: 'polka', href: '/polka', name: 'Polka', tag: 'the daily kropki sudoku', store: 'sot_polka_day', accent: '#16a34a', bg: '#ecf9f1', border: 'rgba(22,163,74,0.4)' },\n  { key: 'diag', href: '/diag', name: 'Diag', tag: 'the daily diagonal sudoku', store: 'sot_diag_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },`);

// ─── 6. app/DailyGamesGrid.jsx — BOTH lists, or the tile is dropped silently ─
edit('app/DailyGamesGrid.jsx',
  `  { key: 'polka', href: '/polka', name: 'Polka', tag: 'No numbers, only dots', img: '/games/btn-polka.png' },`,
  `  { key: 'polka', href: '/polka', name: 'Polka', tag: 'No numbers, only dots', img: '/games/btn-polka.png' },\n  { key: 'diag', href: '/diag', name: 'Diag', tag: '${TAG}', img: '/games/btn-diag.png' },`);
edit('app/DailyGamesGrid.jsx',
  `  { key: 'sudoku', label: 'Sudoku', keys: ['suds', 'sixes', 'towers', 'quilt', 'cages', 'sando', 'mercury', 'polka', 'knight', 'whittle'] },`,
  `  { key: 'sudoku', label: 'Sudoku', keys: ['suds', 'sixes', 'towers', 'quilt', 'cages', 'sando', 'mercury', 'polka', 'knight', 'diag', 'whittle'] },`);

// ─── 7. app/DailyStrip.jsx — the row, plus both colour maps ─────────────────
// `cat: 'Numbers'` matches every sudoku already in this file (this console
// predates the Sudoku category); a lone divergent row would group Diag on its
// own rather than with its family.
edit('app/DailyStrip.jsx',
  `  { key: 'polka', href: '/polka', name: 'Polka', img: '/games/btn-polka.png', store: 'sot_polka_day', tag: "No numbers, only dots" , cat: 'Numbers' },`,
  `  { key: 'polka', href: '/polka', name: 'Polka', img: '/games/btn-polka.png', store: 'sot_polka_day', tag: "No numbers, only dots" , cat: 'Numbers' },\n  { key: 'diag', href: '/diag', name: 'Diag', img: '/games/btn-diag.png', store: 'sot_diag_day', tag: "${TAG}" , cat: 'Numbers' },`);
edit('app/DailyStrip.jsx',
  `const ACCENTS = { junkyard: '#d9b070',`,
  `const ACCENTS = { diag: '${NAVY}', junkyard: '#d9b070',`);
edit('app/DailyStrip.jsx',
  `const TCOL = { junkyard: '#5c3a16',`,
  `const TCOL = { diag: '${COLOR}', junkyard: '#5c3a16',`);

// ─── 8. app/daily/page.js — import AND the map AND the card, or the build fails
edit('app/daily/page.js',
  `import { PUZZLES as WHITTLE_FULL } from '../whittle/puzzles';`,
  `import { PUZZLES as WHITTLE_FULL } from '../whittle/puzzles';\nimport { PUZZLES as DIAG_FULL } from '../diag/puzzles';`);
edit('app/daily/page.js',
  `const WHITTLE = WHITTLE_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`,
  `const WHITTLE = WHITTLE_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));\nconst DIAG = DIAG_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`);
edit('app/daily/page.js',
  `  { key: 'whittle', name: 'Whittle', path: '/whittle', tag: 'The sudoku, backwards', accent: '#854d0e', bg: '#fdf6e9', border: 'rgba(133,77,14,0.4)', src: WHITTLE },`,
  `  { key: 'whittle', name: 'Whittle', path: '/whittle', tag: 'The sudoku, backwards', accent: '#854d0e', bg: '#fdf6e9', border: 'rgba(133,77,14,0.4)', src: WHITTLE },\n  { key: 'diag', name: 'Diag', path: '/diag', tag: 'Sudoku plus the two diagonals', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: DIAG },`);

// ─── 9. app/daily/DailyArchiveClient.jsx — family keys + the navy accent ────
edit('app/daily/DailyArchiveClient.jsx',
  `  { key: 'sudoku', label: 'Sudoku', keys: ['suds', 'sixes', 'towers', 'quilt', 'cages', 'sando', 'mercury', 'polka', 'knight', 'whittle'] },`,
  `  { key: 'sudoku', label: 'Sudoku', keys: ['suds', 'sixes', 'towers', 'quilt', 'cages', 'sando', 'mercury', 'polka', 'knight', 'diag', 'whittle'] },`);
edit('app/daily/DailyArchiveClient.jsx',
  `polka: '#67dd9a', knight: '#9d99f0', whittle: '#dcae6a',`,
  `polka: '#67dd9a', knight: '#9d99f0', whittle: '#dcae6a', diag: '${NAVY}',`);

// ─── 10. lib/sitemap-entries.js — keyed by ROUTE ────────────────────────────
edit('lib/sitemap-entries.js',
  `'script', 'quotes', 'focus', 'thread', 'slot', 'whittle',`,
  `'script', 'quotes', 'focus', 'thread', 'slot', 'whittle', 'diag',`);

// ─── 11. the FOUR puzzle-map registries (the checklist's "three routes") ────
for (const f of ['lib/daily-slate.js', 'app/api/quiz/sunday-slate/route.js',
                 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js']) {
  edit(f, `import { PUZZLES as P_whittle } from '@/app/whittle/puzzles';`,
    `import { PUZZLES as P_whittle } from '@/app/whittle/puzzles';\nimport { PUZZLES as P_diag } from '@/app/diag/puzzles';`);
  edit(f, `whittle: P_whittle`, `whittle: P_whittle, diag: P_diag`);
}

// ─── 12. app/api/quiz/daily-status/route.js — the hardcoded alternation ─────
edit('app/api/quiz/daily-status/route.js',
  `|whittle)-\\d+-\\d+-\\d+$/;`,
  `|whittle|diag)-\\d+-\\d+-\\d+$/;`);

// ─── 13. app/quizzes/QuizHomeClient.jsx — its own alternation ───────────────
edit('app/quizzes/QuizHomeClient.jsx',
  `|whittle)-/;`,
  `|whittle|diag)-/;`);

// ─── 14. app/DailySlateRail.jsx — the A-Z rail, the 17th registry ───────────
edit('app/DailySlateRail.jsx',
  `'slot', 'whittle',`,
  `'slot', 'whittle', 'diag',`);

// ─── 15. lib/quiz-catalog.js — a no-op for a standalone daily, kept in step ─
edit('lib/quiz-catalog.js',
  `'slot', 'whittle']);`,
  `'slot', 'whittle', 'diag']);`);

// ─── 16. lib/loft.js — WITHOUT this the client renders the pre-Loft page ────
edit('lib/loft.js',
  `'script', 'quotes', 'focus', 'thread', 'slot', 'whittle',`,
  `'script', 'quotes', 'focus', 'thread', 'slot', 'whittle', 'diag',`);

// ─── 17. lib/game-glyphs.js — no entry means NO icon and no error ───────────
// The board with its X: Knight's 3x3 grid with both diagonals ruled across it.
edit('lib/game-glyphs.js',
  `  knight: 'M4 4h16v16H4zM4 9.33h16M4 14.67h16M9.33 4v16M14.67 4v16M7 7v5h5',        // a knight`,
  `  knight: 'M4 4h16v16H4zM4 9.33h16M4 14.67h16M9.33 4v16M14.67 4v16M7 7v5h5',        // a knight
  diag: 'M4 4h16v16H4zM4 9.33h16M4 14.67h16M9.33 4v16M14.67 4v16M4 4l16 16M20 4L4 20', // the X across the grid`);

// ─── 18. lib/puzzle-categories.js — the /sudoku landing page ───────────────
// The sudoku entry SPELLS ITS COUNT AS A WORD in title and h1, and its FAQ
// counts the circuit's fill-in pool. Both move with Diag.
edit('lib/puzzle-categories.js',
  `    title: 'Free Daily Sudoku: Ten Variants, One New Board Every Day | Mind Loft',`,
  `    title: 'Free Daily Sudoku: Eleven Variants, One New Board Every Day | Mind Loft',`);
edit('lib/puzzle-categories.js',
  `    h1: 'Free Daily Sudoku: Ten Variants, One New Board Every Day',`,
  `    h1: 'Free Daily Sudoku: Eleven Variants, One New Board Every Day',`);
edit('lib/puzzle-categories.js',
  `    description: 'Play free sudoku online: classic 9x9, a two-minute 6x6, seven variants (jigsaw, killer, sandwich, thermo, kropki, anti-knight, skyscrapers) and one played backwards. One logical solution, never a guess, a new board every day, no signup.',`,
  `    description: 'Play free sudoku online: classic 9x9, a two-minute 6x6, eight variants (diagonal, jigsaw, killer, sandwich, thermo, kropki, anti-knight, skyscrapers) and one played backwards. One logical solution, never a guess, a new board every day, no signup.',`);
edit('lib/puzzle-categories.js',
  `    lede: 'Classic 9x9, a two-minute 6x6, seven variant sudokus you will not find together anywhere else (jigsaw, killer, sandwich, thermo, kropki, anti-knight and skyscrapers) and one played backwards,`,
  `    lede: 'Classic 9x9, a two-minute 6x6, eight variant sudokus you will not find together anywhere else (diagonal, jigsaw, killer, sandwich, thermo, kropki, anti-knight and skyscrapers) and one played backwards,`);
edit('lib/puzzle-categories.js',
  `    keys: ['sixes', 'suds', 'quilt', 'towers', 'mercury', 'sando', 'knight', 'cages', 'polka', 'whittle'],`,
  `    keys: ['sixes', 'suds', 'diag', 'quilt', 'towers', 'mercury', 'sando', 'knight', 'cages', 'polka', 'whittle'],`);
edit('lib/puzzle-categories.js',
  `      sixes: 'Mini sudoku, 6x6', suds: 'Classic sudoku, 9x9', quilt: 'Jigsaw sudoku', towers: 'Skyscrapers',`,
  `      sixes: 'Mini sudoku, 6x6', suds: 'Classic sudoku, 9x9', diag: 'Diagonal sudoku (Sudoku X)', quilt: 'Jigsaw sudoku', towers: 'Skyscrapers',`);
edit('lib/puzzle-categories.js',
  `    start: 'Sixes if you have two minutes. Suds if you want the classic. Quilt is the gentlest step into variants because the rules do not change, only the shape of the boxes.`,
  `    start: 'Sixes if you have two minutes. Suds if you want the classic. Diag and Quilt are the gentlest steps into variants because the rules barely change: Diag adds the two diagonals as houses, Quilt only reshapes the boxes.`);
edit('lib/puzzle-categories.js',
  `      ['Sunday Edition', 'Bigger or sparser: a 7x7 Towers, a Mercury with eight printed digits, a Sando with six, a Knight with thirteen.'],`,
  `      ['Sunday Edition', 'Bigger or sparser: a 7x7 Towers, a Mercury with eight printed digits, a Sando with six, a Knight with thirteen, a Diag with fourteen.'],`);
edit('lib/puzzle-categories.js',
  `      ['What is the Sudoku circuit?', 'Five of the nine fill-in sudokus, rotating one a day, played as one run with one combined leaderboard.'],`,
  `      ['What is the Sudoku circuit?', 'Five of the ten fill-in sudokus, rotating one a day, played as one run with one combined leaderboard.'],`);

// ─── 19. lib/daily-groups.js — the 'Classic sudokus' set goes to four ───────
// Diag is the closest thing to a plain sudoku on the slate (two more houses,
// nothing else changes), so it sits with Suds and Sixes rather than with the
// marked grids, and that set stays under the five-key ceiling.
edit('lib/daily-groups.js',
  `  { name: 'Classic sudokus', cat: 'Sudoku', keys: ['suds', 'sixes', 'whittle'] },`,
  `  { name: 'Classic sudokus', cat: 'Sudoku', keys: ['suds', 'sixes', 'diag', 'whittle'] },`);
edit('lib/daily-groups.js',
  `  // Sudoku (10)`,
  `  // Sudoku (11)`);

// ─── 20. lib/circuits.js — the Sudoku pool goes from nine to TEN ────────────
// The rotating pool is stored in ascending measured order and the window
// re-sorts to it, so Diag slots between Suds and Quilt on its estimated
// median. `rotate` stays 5: the circuit still plays five a day, each pool
// member now appearing five days in every ten rather than every nine.
edit('lib/circuits.js',
  `    keys: ['towers', 'sixes', 'cages', 'suds', 'quilt', 'polka', 'knight', 'mercury', 'sando'],`,
  `    keys: ['towers', 'sixes', 'cages', 'suds', 'diag', 'quilt', 'polka', 'knight', 'mercury', 'sando'],`);
// (The circuit's reader-facing blurb and share copy lead with FIVE and name no
// pool size since 2026-09-05, so nothing there moves.)
edit('lib/circuits.js',
  `    // roster is a POOL of nine and the circuit plays FIVE of them a day,`,
  `    // roster is a POOL of ten and the circuit plays FIVE of them a day,`);
edit('lib/circuits.js',
  `    // every pool member plays five days in every nine, and the day's five`,
  `    // every pool member plays five days in every ten, and the day's five`);
edit('lib/circuits.js',
  `    // suds 482 / quilt 699 / polka ~750 est / knight ~800 est /\n    // mercury ~900 est / sando 1171. Every 5-window totals 1705s or more, so\n    // the trophy stays gold on every day's mix (scripts/verify-circuits.mjs\n    // recomputes all nine windows).`,
  `    // suds 482 / diag ~550 est / quilt 699 / polka ~750 est / knight ~800 est /\n    // mercury ~900 est / sando 1171. Every 5-window totals 1705s or more, so\n    // the trophy stays gold on every day's mix (scripts/verify-circuits.mjs\n    // recomputes all ten windows).`);
edit('app/circuits/SudokuCircuitPop.jsx',
  `//   over a pool of nine (lib/circuits.js), so a sudoku that is in the pool but`,
  `//   over a pool of ten (lib/circuits.js), so a sudoku that is in the pool but`);

// ─── 21. scripts/verify-circuits.mjs — Diag's estimated median ──────────────
edit('scripts/verify-circuits.mjs',
  `  knight: 800,`,
  `  knight: 800,\n  // Diag launched 2026-09-08 with no live clock data yet: estimated from its\n  // shape (a 14-to-26 clue diagonal 9x9; two extra houses make it easier than\n  // a plain Suds board of the same count, so between Suds and Quilt). Replace\n  // with the measured median at the next snapshot re-measure.\n  diag: 550,`);

// ─── 22. CLAUDE.md — the living document, per its own standing instruction ──
edit('CLAUDE.md',
  `| Knight | thirteen printed digits instead of the weekday 16 to 28 (from 2026-08-28) |`,
  `| Knight | thirteen printed digits instead of the weekday 16 to 28 (from 2026-08-28) |\n| Diag | fourteen printed digits instead of the weekday 16 to 26 (from 2026-09-08) |`);
edit('CLAUDE.md',
  `## Knight is the ANTI-KNIGHT SUDOKU, and the rule has to be LOAD-BEARING (launched 2026-08-28)`,
  `## Diag is the DIAGONAL SUDOKU (Sudoku X), and a diagonal IS a house (launched 2026-09-08)

The tenth fill-in sudoku, after Suds, Quilt, Cages, Sando, Sixes, Mercury, Polka, Knight and
Towers (Whittle, the eleventh Sudoku row, is played backwards). Ordinary 9x9, ordinary boxes,
ordinary printed digits, plus one rule: each of the two long diagonals, corner to corner, also
holds every digit exactly once. The diagonals are tinted and ruled across the grid.

- **A DIAGONAL IS A HOUSE, which is the whole difference from Knight.** The nine cells of a
  diagonal all see each other and between them hold 1 to 9, so hidden singles, locked candidates
  and subsets read off a diagonal exactly as off a row. Generator, verifier and client all carry
  the two diagonals in UNITS (29 houses, not 27) as well as in the peer set. The centre cell sits
  on both and sees 24 cells, more than any other.
- **DIAGONAL NECESSITY is a checked property.** On every board the same clues read as an
  ORDINARY sudoku admit more than one grid, so the rule is never decoration. \`scripts/verify-diag.mjs\`
  counts solutions a second time with the diagonals off and fails at one.
- **The ramp is TWO measured axes, both pinned per weekday.** \`printed\` runs Mon 26, Tue 24,
  Wed 22, Thu 20, Fri 18, Sat 16 and **Sunday 14**. \`level\` is 1 Mon-Thu and 2 Fri-Sun, pinned
  (an easy day must NOT need the harder toolkit, a hard day must). The Sunday count is what the
  rulebook can prove, not a round number: measured on 180 random digs at level 2 the greedy floor
  is 17 to 23 clues (the diagonals touch only 17 of 81 cells, so the rule bites far less than the
  knight rule), and the generator reaches 16 and 14 by ITERATED LOCAL SEARCH, putting two to five
  clues back and re-digging in a fresh order. Thirteen was not reached at level 2 in 2,500
  iterations on six grids. Do not lower the Sunday count without a harder-technique solver.
- **Generator and verifier share NO code**, as with Knight and Cages. \`gen-diag.mjs\` uses bitmask
  candidates and branches on the emptiest cell; \`verify-diag.mjs\` uses Set candidates and
  branches on the house-and-digit with the fewest placements, POLICING its logical solver against
  the known solution. \`scripts/diag-mutation-test.mjs\` breaks the bank nine ways (a diagonal
  repeat at r1c1/r2c2 among them, two cells that share no row, column or box) and every one
  must be caught.
- **Diag joined the rotating Sudoku circuit**, pool nine -> TEN, \`rotate\` still 5, so each pool
  member plays five days in every ten. Its median (550s, between Suds and Quilt) is an ESTIMATE in
  verify-circuits; replace it at the next re-measure. It sits in the 'Classic sudokus' set.
- **Legacy slate hue is cyan #0e7490.** The page itself wears the Sudoku category ramp.

## Knight is the ANTI-KNIGHT SUDOKU, and the rule has to be LOAD-BEARING (launched 2026-08-28)`);

console.log(`wire-diag: ${applied} edits applied, ${skipped} already present`);
