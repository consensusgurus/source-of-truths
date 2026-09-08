// scripts/wire-frame-rim.mjs — wires the daily games `frame` and `rim` (the two
// gutter sudokus, launched together) into every registry.
//
// Done as an ANCHORED script rather than by hand, per the daily-game checklist:
// half these registries fail SILENTLY when missed (a key in one list and not
// its partner is dropped with no error and no gap), so every anchor here must
// match EXACTLY ONCE or the script throws. It is idempotent — an edit whose
// replacement is already present is skipped — so a re-run after a partial push
// is safe.
//
//   node scripts/wire-frame-rim.mjs <dir>
//
// <dir> is a tree exported from a same-step `git archive FETCH_HEAD`, never the
// working tree. Both games join the Sudoku category after Diag, the rotating
// Sudoku circuit pool (ten -> TWELVE, `rotate` stays 5), the 'Edge clue
// sudokus' set (three -> five, the ceiling), and both run a Sunday Edition.
// Share cards are `node scripts/bake-og.mjs frame rim`, run after this script.
import fs from 'fs';
import path from 'path';

const root = process.argv[2];
if (!root) { console.error('usage: node wire-frame-rim.mjs <dir>'); process.exit(1); }

let applied = 0, skipped = 0;
function edit(file, anchor, replacement) {
  const p = path.join(root, file);
  const src = fs.readFileSync(p, 'utf8');
  if (src.includes(replacement)) { skipped++; return; }
  const n = src.split(anchor).length - 1;
  if (n !== 1) throw new Error(`${file}: anchor matched ${n} times, expected 1\n  ${anchor.slice(0, 120)}`);
  fs.writeFileSync(p, src.replace(anchor, replacement));
  applied++;
}

const F = {
  TAG: 'The daily frame sudoku',
  HOW: 'An ordinary sudoku plus a number outside every row and column end: the total of the first three squares reading in from that edge. Thirty-six sums, every one printed, and far fewer digits inside the grid than a sudoku usually needs.',
  COLOR: '#b45309', NAVY: '#f2c27a', BG: '#fdf3e3', BORDER: 'rgba(180,83,9,0.4)',
  BLURB: 'Sudoku with the sum of the outer three squares printed at every row and column end. Thirty-six sums, and the board prints as few as two digits.',
};
const R = {
  TAG: 'The daily outside sudoku',
  HOW: 'A sudoku with nothing printed inside the grid. Outside some row and column ends, the three digits of the first three squares from that edge are printed, in no order. The blank gutters are the puzzle.',
  COLOR: '#4d7c0f', NAVY: '#bef264', BG: '#f1f8e6', BORDER: 'rgba(77,124,15,0.4)',
  BLURB: 'Sudoku with nothing printed inside the grid: the clues sit in the margin, three digits at a time, and the blank gutters are the puzzle.',
};

// ─── 1. lib/daily-games.js — two rows after Diag, plus the premieres ────────
edit('lib/daily-games.js',
  `  { key: 'polka', miss: null, name: 'Polka', cat: 'Sudoku', tag: 'No numbers, only dots',`,
  `  { key: 'frame', miss: null, name: 'Frame', cat: 'Sudoku', tag: '${F.TAG}', how: '${F.HOW}', color: '${F.COLOR}', colorNavy: '${F.NAVY}' },\n  { key: 'rim', miss: null, name: 'Rim', cat: 'Sudoku', tag: '${R.TAG}', how: '${R.HOW}', color: '${R.COLOR}', colorNavy: '${R.NAVY}' },\n  { key: 'polka', miss: null, name: 'Polka', cat: 'Sudoku', tag: 'No numbers, only dots',`);
edit('lib/daily-games.js',
  `  { key: 'diag', from: '2026-09-08', until: '2026-09-12' },\n];`,
  `  { key: 'diag', from: '2026-09-08', until: '2026-09-12' },\n  { key: 'frame', from: '2026-09-08', until: '2026-09-12' },\n  { key: 'rim', from: '2026-09-08', until: '2026-09-12' },\n];`);

// ─── 2. lib/sunday-editions.js ──────────────────────────────────────────────
edit('lib/sunday-editions.js',
  `  'whittle',\n  'diag',`,
  `  'whittle',\n  'diag',\n  'frame',\n  'rim',`);

// ─── 3. app/DailyEndCard.jsx — icon import, LAUNCH_PIN, GAME_META, tile copy ─
edit('app/DailyEndCard.jsx',
  `  Clapperboard, Quote, ZoomIn, Axe, Truck, Rows3, Boxes, MoveDiagonal,\n} from 'lucide-react';`,
  `  Clapperboard, Quote, ZoomIn, Axe, Truck, Rows3, Boxes, MoveDiagonal, Crop, Scan,\n} from 'lucide-react';`);
edit('app/DailyEndCard.jsx',
  `const LAUNCH_PIN = { keys: ['diag',`,
  `const LAUNCH_PIN = { keys: ['frame', 'rim', 'diag',`);
edit('app/DailyEndCard.jsx',
  `  diag: { accent: '#0e7490', badgeBg: '#0e7490', badgeInk: T.white, Fin: MoveDiagonal },`,
  `  diag: { accent: '#0e7490', badgeBg: '#0e7490', badgeInk: T.white, Fin: MoveDiagonal },\n  frame: { accent: '${F.COLOR}', badgeBg: '${F.COLOR}', badgeInk: T.white, Fin: Crop },\n  rim: { accent: '${R.COLOR}', badgeBg: '${R.COLOR}', badgeInk: T.white, Fin: Scan },`);
edit('app/DailyEndCard.jsx',
  `  { key: 'polka',  cat: 'sudoku' ,   name: 'Polka',`,
  `  { key: 'frame',  cat: 'sudoku' ,   name: 'Frame',  tag: '${F.TAG}',    blurb: '${F.BLURB}', href: '/frame' },\n  { key: 'rim',  cat: 'sudoku' ,   name: 'Rim',  tag: '${R.TAG}',    blurb: '${R.BLURB}', href: '/rim' },\n  { key: 'polka',  cat: 'sudoku' ,   name: 'Polka',`);

// ─── 4. app/api/quiz/daily-order/route.js — the LAUNCH_PIN mirror ───────────
edit('app/api/quiz/daily-order/route.js',
  `const LAUNCH_PIN = { keys: ['diag',`,
  `const LAUNCH_PIN = { keys: ['frame', 'rim', 'diag',`);

// ─── 5. app/DailyGamesPromo.jsx ─────────────────────────────────────────────
edit('app/DailyGamesPromo.jsx',
  `  { key: 'diag', href: '/diag', name: 'Diag', tag: 'the daily diagonal sudoku', store: 'sot_diag_day', accent: '#0e7490', bg: '#e8f6fa', border: 'rgba(14,116,144,0.4)' },`,
  `  { key: 'diag', href: '/diag', name: 'Diag', tag: 'the daily diagonal sudoku', store: 'sot_diag_day', accent: '#0e7490', bg: '#e8f6fa', border: 'rgba(14,116,144,0.4)' },\n  { key: 'frame', href: '/frame', name: 'Frame', tag: 'the daily frame sudoku', store: 'sot_frame_day', accent: '${F.COLOR}', bg: '${F.BG}', border: '${F.BORDER}' },\n  { key: 'rim', href: '/rim', name: 'Rim', tag: 'the daily outside sudoku', store: 'sot_rim_day', accent: '${R.COLOR}', bg: '${R.BG}', border: '${R.BORDER}' },`);

// ─── 6. app/DailyGamesGrid.jsx — BOTH lists, or the tile is dropped silently ─
edit('app/DailyGamesGrid.jsx',
  `  { key: 'diag', href: '/diag', name: 'Diag', tag: 'The daily diagonal sudoku', img: '/games/btn-diag.png' },`,
  `  { key: 'diag', href: '/diag', name: 'Diag', tag: 'The daily diagonal sudoku', img: '/games/btn-diag.png' },\n  { key: 'frame', href: '/frame', name: 'Frame', tag: '${F.TAG}', img: '/games/btn-frame.png' },\n  { key: 'rim', href: '/rim', name: 'Rim', tag: '${R.TAG}', img: '/games/btn-rim.png' },`);
edit('app/DailyGamesGrid.jsx',
  `  { key: 'sudoku', label: 'Sudoku', keys: ['suds', 'sixes', 'towers', 'quilt', 'cages', 'sando', 'mercury', 'polka', 'knight', 'diag', 'whittle'] },`,
  `  { key: 'sudoku', label: 'Sudoku', keys: ['suds', 'sixes', 'towers', 'quilt', 'cages', 'sando', 'mercury', 'polka', 'knight', 'diag', 'frame', 'rim', 'whittle'] },`);

// ─── 7. app/DailyStrip.jsx — the row, plus both colour maps ─────────────────
edit('app/DailyStrip.jsx',
  `  { key: 'diag', href: '/diag', name: 'Diag', img: '/games/btn-diag.png', store: 'sot_diag_day', tag: "The daily diagonal sudoku" , cat: 'Numbers' },`,
  `  { key: 'diag', href: '/diag', name: 'Diag', img: '/games/btn-diag.png', store: 'sot_diag_day', tag: "The daily diagonal sudoku" , cat: 'Numbers' },\n  { key: 'frame', href: '/frame', name: 'Frame', img: '/games/btn-frame.png', store: 'sot_frame_day', tag: "${F.TAG}" , cat: 'Numbers' },\n  { key: 'rim', href: '/rim', name: 'Rim', img: '/games/btn-rim.png', store: 'sot_rim_day', tag: "${R.TAG}" , cat: 'Numbers' },`);
edit('app/DailyStrip.jsx',
  `const ACCENTS = { diag: '#7dd3fc',`,
  `const ACCENTS = { frame: '${F.NAVY}', rim: '${R.NAVY}', diag: '#7dd3fc',`);
edit('app/DailyStrip.jsx',
  `const TCOL = { diag: '#0e7490',`,
  `const TCOL = { frame: '${F.COLOR}', rim: '${R.COLOR}', diag: '#0e7490',`);

// ─── 8. app/daily/page.js — import AND the map AND the card, or the build fails
edit('app/daily/page.js',
  `import { PUZZLES as DIAG_FULL } from '../diag/puzzles';`,
  `import { PUZZLES as DIAG_FULL } from '../diag/puzzles';\nimport { PUZZLES as FRAME_FULL } from '../frame/puzzles';\nimport { PUZZLES as RIM_FULL } from '../rim/puzzles';`);
edit('app/daily/page.js',
  `const DIAG = DIAG_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`,
  `const DIAG = DIAG_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));\nconst FRAME = FRAME_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));\nconst RIM = RIM_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`);
edit('app/daily/page.js',
  `  { key: 'diag', name: 'Diag', path: '/diag', tag: 'Sudoku plus the two diagonals', accent: '#0e7490', bg: '#e8f6fa', border: 'rgba(14,116,144,0.4)', src: DIAG },`,
  `  { key: 'diag', name: 'Diag', path: '/diag', tag: 'Sudoku plus the two diagonals', accent: '#0e7490', bg: '#e8f6fa', border: 'rgba(14,116,144,0.4)', src: DIAG },\n  { key: 'frame', name: 'Frame', path: '/frame', tag: 'Sums at every edge', accent: '${F.COLOR}', bg: '${F.BG}', border: '${F.BORDER}', src: FRAME },\n  { key: 'rim', name: 'Rim', path: '/rim', tag: 'Nothing printed inside', accent: '${R.COLOR}', bg: '${R.BG}', border: '${R.BORDER}', src: RIM },`);

// ─── 9. app/daily/DailyArchiveClient.jsx — family keys + the navy accents ───
edit('app/daily/DailyArchiveClient.jsx',
  `  { key: 'sudoku', label: 'Sudoku', keys: ['suds', 'sixes', 'towers', 'quilt', 'cages', 'sando', 'mercury', 'polka', 'knight', 'diag', 'whittle'] },`,
  `  { key: 'sudoku', label: 'Sudoku', keys: ['suds', 'sixes', 'towers', 'quilt', 'cages', 'sando', 'mercury', 'polka', 'knight', 'diag', 'frame', 'rim', 'whittle'] },`);
edit('app/daily/DailyArchiveClient.jsx',
  `whittle: '#dcae6a', diag: '#7dd3fc',`,
  `whittle: '#dcae6a', diag: '#7dd3fc', frame: '${F.NAVY}', rim: '${R.NAVY}',`);

// ─── 10. lib/sitemap-entries.js — keyed by ROUTE ────────────────────────────
edit('lib/sitemap-entries.js',
  `'slot', 'whittle', 'diag',`,
  `'slot', 'whittle', 'diag', 'frame', 'rim',`);

// ─── 11. the FOUR puzzle-map registries ─────────────────────────────────────
for (const f of ['lib/daily-slate.js', 'app/api/quiz/sunday-slate/route.js',
                 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js']) {
  edit(f, `import { PUZZLES as P_diag } from '@/app/diag/puzzles';`,
    `import { PUZZLES as P_diag } from '@/app/diag/puzzles';\nimport { PUZZLES as P_frame } from '@/app/frame/puzzles';\nimport { PUZZLES as P_rim } from '@/app/rim/puzzles';`);
  edit(f, `diag: P_diag`, `diag: P_diag, frame: P_frame, rim: P_rim`);
}

// ─── 12 + 13. the two hardcoded alternations ────────────────────────────────
edit('app/api/quiz/daily-status/route.js', `|whittle|diag)-\\d+-\\d+-\\d+$/;`, `|whittle|diag|frame|rim)-\\d+-\\d+-\\d+$/;`);
edit('app/quizzes/QuizHomeClient.jsx', `|whittle|diag)-/;`, `|whittle|diag|frame|rim)-/;`);

// ─── 14. app/DailySlateRail.jsx — the A-Z rail ──────────────────────────────
edit('app/DailySlateRail.jsx', `'slot', 'whittle', 'diag',`, `'slot', 'whittle', 'diag', 'frame', 'rim',`);

// ─── 15. lib/quiz-catalog.js ────────────────────────────────────────────────
edit('lib/quiz-catalog.js', `'slot', 'whittle', 'diag']);`, `'slot', 'whittle', 'diag', 'frame', 'rim']);`);

// ─── 16. lib/loft.js — WITHOUT this the client renders the pre-Loft page ────
edit('lib/loft.js', `'slot', 'whittle', 'diag',`, `'slot', 'whittle', 'diag', 'frame', 'rim',`);

// ─── 17. lib/game-glyphs.js — no entry means NO icon and no error ───────────
// Frame: the board inside a heavier frame, the gutter drawn as the margin.
// Rim: an empty board with tick marks at its rim, since nothing sits inside.
edit('lib/game-glyphs.js',
  `  diag: 'M4 4h16v16H4zM4 9.33h16M4 14.67h16M9.33 4v16M14.67 4v16M4 4l16 16M20 4L4 20', // the X across the grid`,
  `  diag: 'M4 4h16v16H4zM4 9.33h16M4 14.67h16M9.33 4v16M14.67 4v16M4 4l16 16M20 4L4 20', // the X across the grid
  frame: 'M2 2h20v20H2zM7 7h10v10H7zM12 2v5M12 17v5M2 12h5M17 12h5',                    // the grid inside its gutter
  rim: 'M6 6h12v12H6zM6 3v3M12 3v3M18 3v3M3 6h3M3 12h3M3 18h3M21 6h-3M21 12h-3M21 18h-3M6 21v-3M12 21v-3M18 21v-3', // clues at the rim`);

// ─── 18. lib/puzzle-categories.js — the /sudoku landing page ───────────────
edit('lib/puzzle-categories.js',
  `    title: 'Free Daily Sudoku: Eleven Variants, One New Board Every Day | Mind Loft',`,
  `    title: 'Free Daily Sudoku: Thirteen Variants, One New Board Every Day | Mind Loft',`);
edit('lib/puzzle-categories.js',
  `    h1: 'Free Daily Sudoku: Eleven Variants, One New Board Every Day',`,
  `    h1: 'Free Daily Sudoku: Thirteen Variants, One New Board Every Day',`);
edit('lib/puzzle-categories.js',
  `    description: 'Play free sudoku online: classic 9x9, a two-minute 6x6, eight variants (diagonal, jigsaw, killer, sandwich, thermo, kropki, anti-knight, skyscrapers) and one played backwards.`,
  `    description: 'Play free sudoku online: classic 9x9, a two-minute 6x6, ten variants (diagonal, jigsaw, killer, sandwich, frame, outside, thermo, kropki, anti-knight, skyscrapers) and one played backwards.`);
edit('lib/puzzle-categories.js',
  `    lede: 'Classic 9x9, a two-minute 6x6, eight variant sudokus you will not find together anywhere else (diagonal, jigsaw, killer, sandwich, thermo, kropki, anti-knight and skyscrapers) and one played backwards,`,
  `    lede: 'Classic 9x9, a two-minute 6x6, ten variant sudokus you will not find together anywhere else (diagonal, jigsaw, killer, sandwich, frame, outside, thermo, kropki, anti-knight and skyscrapers) and one played backwards,`);
edit('lib/puzzle-categories.js',
  `    keys: ['sixes', 'suds', 'diag', 'quilt', 'towers', 'mercury', 'sando', 'knight', 'cages', 'polka', 'whittle'],`,
  `    keys: ['sixes', 'suds', 'diag', 'quilt', 'towers', 'mercury', 'sando', 'frame', 'rim', 'knight', 'cages', 'polka', 'whittle'],`);
edit('lib/puzzle-categories.js',
  `      mercury: 'Thermo sudoku', sando: 'Sandwich sudoku', knight: 'Anti-knight sudoku', cages: 'Killer sudoku', polka: 'Kropki sudoku',`,
  `      mercury: 'Thermo sudoku', sando: 'Sandwich sudoku', frame: 'Frame sudoku', rim: 'Outside sudoku', knight: 'Anti-knight sudoku', cages: 'Killer sudoku', polka: 'Kropki sudoku',`);
edit('lib/puzzle-categories.js',
  `Cages and Sando add arithmetic, Mercury and Polka add ordering, and Knight and Towers change what sees what.`,
  `Cages, Sando and Frame add arithmetic, Mercury and Polka add ordering, Knight and Towers change what sees what, and Rim prints nothing inside the grid at all.`);
edit('lib/puzzle-categories.js',
  `a Sando with six, a Knight with thirteen, a Diag with fourteen.'],`,
  `a Sando with six, a Frame with two, a Knight with thirteen, a Diag with fourteen, a Rim with thirteen of its thirty-six gutters.'],`);
edit('lib/puzzle-categories.js',
  `      ['What is the Sudoku circuit?', 'Five of the ten fill-in sudokus, rotating one a day, played as one run with one combined leaderboard.'],`,
  `      ['What is the Sudoku circuit?', 'Five of the twelve fill-in sudokus, rotating one a day, played as one run with one combined leaderboard.'],`);

// ─── 19. lib/daily-groups.js — 'Edge clue sudokus' goes from three to FIVE ──
// Both games read their clues off the gutter, which is exactly what that set
// names; five is the ceiling and this fills it.
edit('lib/daily-groups.js',
  `  { name: 'Edge clue sudokus', cat: 'Sudoku', keys: ['cages', 'sando', 'towers'] },`,
  `  { name: 'Edge clue sudokus', cat: 'Sudoku', keys: ['cages', 'sando', 'frame', 'rim', 'towers'] },`);
edit('lib/daily-groups.js', `  // Sudoku (11)`, `  // Sudoku (13)`);

// ─── 20. lib/circuits.js — the Sudoku pool goes from ten to TWELVE ──────────
edit('lib/circuits.js',
  `    keys: ['towers', 'sixes', 'cages', 'suds', 'diag', 'quilt', 'polka', 'knight', 'mercury', 'sando'],`,
  `    keys: ['towers', 'sixes', 'cages', 'suds', 'diag', 'rim', 'quilt', 'polka', 'knight', 'frame', 'mercury', 'sando'],`);
edit('lib/circuits.js',
  `    // roster is a POOL of ten and the circuit plays FIVE of them a day,`,
  `    // roster is a POOL of twelve and the circuit plays FIVE of them a day,`);
edit('lib/circuits.js',
  `    // every pool member plays five days in every ten, and the day's five`,
  `    // every pool member plays five days in every twelve, and the day's five`);
edit('lib/circuits.js',
  `    // suds 482 / diag ~550 est / quilt 699 / polka ~750 est / knight ~800 est /\n    // mercury ~900 est / sando 1171. Every 5-window totals 1705s or more, so\n    // the trophy stays gold on every day's mix (scripts/verify-circuits.mjs\n    // recomputes all ten windows).`,
  `    // suds 482 / diag ~550 est / rim ~600 est / quilt 699 / polka ~750 est /\n    // knight ~800 est / frame ~850 est / mercury ~900 est / sando 1171. Every\n    // 5-window totals 1705s or more, so the trophy stays gold on every day's\n    // mix (scripts/verify-circuits.mjs recomputes all twelve windows).`);
edit('app/circuits/SudokuCircuitPop.jsx',
  `//   over a pool of ten (lib/circuits.js), so a sudoku that is in the pool but`,
  `//   over a pool of twelve (lib/circuits.js), so a sudoku that is in the pool but`);

// ─── 21. scripts/verify-circuits.mjs — estimated medians ────────────────────
edit('scripts/verify-circuits.mjs',
  `  diag: 550,`,
  `  diag: 550,\n  // Frame and Rim launched 2026-09-08 with no live clock data yet: estimated\n  // from their shape. Rim is an outside sudoku that falls to singles (between\n  // Diag and Quilt); Frame is thirty-six sums over a near-empty grid, Sando's\n  // cousin but with three-cell groups (between Knight and Mercury). Replace\n  // both with measured medians at the next snapshot re-measure.\n  rim: 600,\n  frame: 850,`);

// ─── 22. CLAUDE.md — the living document ────────────────────────────────────
edit('CLAUDE.md',
  `| Diag | fourteen printed digits instead of the weekday 16 to 26 (from 2026-09-08) |`,
  `| Diag | fourteen printed digits instead of the weekday 16 to 26 (from 2026-09-08) |\n| Frame | two printed digits instead of the weekday 4 to 14, under all thirty-six sums (from 2026-09-08) |\n| Rim | thirteen of the thirty-six gutters printed instead of the weekday 16 to 30 (from 2026-09-08) |`);
edit('CLAUDE.md',
  `## Diag is the DIAGONAL SUDOKU (Sudoku X), and a diagonal IS a house (launched 2026-09-08)`,
  `## Frame and Rim are the GUTTER SUDOKUS, and they share one engine (launched 2026-09-08)

Two sudokus built on Sando's border-clue layout with the gutter on all FOUR sides (an 11x11
grid, the 9x9 in the middle). Both read the same thing, a line's first three cells counting in
from an edge (thirty-six such triples), and print different facts about it:

- **Frame** prints the SUM of the three (6 to 24), all thirty-six of them on every board, the
  way Sando prints all eighteen. The ramp is the digits printed INSIDE the grid: Mon 14 / Tue
  12 / Wed 10 / Thu 8 / Fri 6 / Sat 4 / **Sun 2**. Measured before choosing: under all 36 sums
  a random 8-digit board falls to logic 4 times in 5, a 2-digit board 1 in 7, a 0-digit board
  1 in 50. The verifier also proves the gutter is load-bearing (the digits alone admit >1 grid).
- **Rim** prints the three DIGITS as an unordered set and prints NOTHING inside the grid, ever
  (\`given\` is all zeros, kept for shape). A full set of 36 triples pins the grid every time with
  singles alone, so the ramp is how many are printed and the blank gutters are the puzzle: Mon
  30 / Tue 27 / Wed 24 / Thu 21 / Fri 18 / Sat 16 / **Sun 13** of 36. Measured: a greedy dig
  bottoms out at 13 to 17 (mode 15), so Sunday is the floor of the rulebook.
- **Neither has a \`level\` field**, and that is a measured finding as with Sando: every trial and
  banked board falls to the gutter deduction plus naked and hidden singles or does not fall at
  all. Both verifiers assert level 1 exactly. A printed Rim triple is a naked triple handed to
  the player, which is why it is the gentler of the two.
- **One generator, \`scripts/gen-gutter.mjs frame|rim\`**, on \`scripts/gutter-core.mjs\`; one
  independent solver library, \`scripts/gutter-check-lib.mjs\` (Set candidates, house/digit
  branching, policed against the truth), behind \`verify-frame.mjs\` and \`verify-rim.mjs\` (a
  file named \`verify-*.mjs\` is a checker to verify-all, which is why the shared library is not).
  \`scripts/gutter-mutation-test.mjs frame|rim\` breaks each bank nine ways; all caught.
- **Clients are one transform of DiagClient** (\`mkgutter.py\`, not committed): the diagonal rule
  out, a \`gutterCell\` renderer in, the heavy rules moved onto the outer cells since the
  container now wraps the gutter. Selecting a square lights the gutters that speak about it; a
  gutter whose three squares are filled marks itself right or wrong (Frame shows the
  difference, Rim a tick or a cross). Frame's gutter track is 0.66 of a square, Rim's 0.8
  because it carries three digits.
- **Both joined the rotating Sudoku circuit**, pool ten -> TWELVE, \`rotate\` still 5, so each
  member plays five days in every twelve. Medians are ESTIMATES (rim 600, frame 850). Both sit
  in the 'Edge clue sudokus' set, which is now at its five-key ceiling.
- **Legacy slate hues:** Frame amber #b45309, Rim moss #4d7c0f. The pages wear the Sudoku ramp.

## Diag is the DIAGONAL SUDOKU (Sudoku X), and a diagonal IS a house (launched 2026-09-08)`);

console.log(`wire-frame-rim: ${applied} edits applied, ${skipped} already present`);
