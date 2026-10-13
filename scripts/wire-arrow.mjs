// scripts/wire-arrow.mjs — wires Arrow (the daily arrow sudoku) into every
// registry, and deals it into Enter the Dojo's variant pool from 2026-10-14.
// Sits after Mercury, its nearest relative, in every list.
//
// An ANCHORED script in the shape of scripts/wire-duet.mjs: every anchor must
// match EXACTLY ONCE or the script throws, and an edit whose replacement is
// already present is skipped, so a re-run after a partial push is safe.
//
//   node scripts/wire-arrow.mjs <dir>
//
// Arrow runs a Sunday Edition (eight printed digits under twelve arrows), so
// it joins lib/sunday-editions.js and the sunday-slate route. It is
// solve-only (flat 10 or 0), so it joins SOLVE_ONLY too.
//
// THE DOJO POOL IS DATED. The variant is dealt by the date and the pool's
// length, so adding a member reshuffles every day from the change on. Days up
// to 2026-10-13 keep the pool they were dealt from (a nested `before` chain in
// lib/dojo.js), so no played day changes its variant.
import fs from 'fs';
import path from 'path';

const root = process.argv[2] || '.';
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

const A = {
  TAG: 'The daily arrow sudoku',
  HOW: 'An ordinary sudoku plus arrows: each arrow runs from a circle through a short line of squares, and the digit in the circle is the total of the digits along its line. Sundays print just eight digits under twelve arrows.',
  COLOR: '#86198f', NAVY: '#f0abfc', BG: '#fbf0fc', BORDER: 'rgba(134,25,143,0.4)',
  BLURB: 'Every circle is the sum of its arrow. Small sums laid over a 9x9, one logical solution, and Sundays print just eight digits.',
};

// ─── 1. lib/daily-games.js ──────────────────────────────────────────────────
edit('lib/daily-games.js',
  `colorNavy: '#f18c8c' },\n`,
  `colorNavy: '#f18c8c' },\n  { key: 'arrow', miss: null, name: 'Arrow', cat: 'Sudoku', tag: '${A.TAG}', how: '${A.HOW}', color: '${A.COLOR}', colorNavy: '${A.NAVY}' },\n`);
edit('lib/daily-games.js',
  `  { key: 'ergo', from: '2026-10-11', until: '2026-10-15' },`,
  `  { key: 'arrow', from: '2026-10-13', until: '2026-10-17' },\n  { key: 'ergo', from: '2026-10-11', until: '2026-10-15' },`);
edit('lib/daily-games.js',
  `'rim', 'diag', 'giant',\n`,
  `'rim', 'diag', 'giant', 'arrow',\n`);

// ─── 2. lib/sunday-editions.js ──────────────────────────────────────────────
edit('lib/sunday-editions.js',
  `//   mercury nine thermometers and eight printed digits, against six`,
  `//   arrow   twelve arrows and eight printed digits, against nine arrows\n//           and twenty-eight digits on a Monday\n//   mercury nine thermometers and eight printed digits, against six`);
edit('lib/sunday-editions.js', `'towers', 'mercury', 'polka',`, `'towers', 'mercury', 'arrow', 'polka',`);

// ─── 3. app/DailyEndCard.jsx + the daily-order pin ──────────────────────────
edit('app/DailyEndCard.jsx', `MoveDiagonal, Crop, Scan,\n} from 'lucide-react';`, `MoveDiagonal, Crop, Scan, MoveDownRight,\n} from 'lucide-react';`);
edit('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['giant',`, `const LAUNCH_PIN = { keys: ['arrow', 'giant',`);
edit('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['giant',`, `const LAUNCH_PIN = { keys: ['arrow', 'giant',`);
edit('app/DailyEndCard.jsx',
  `  mercury: { accent: '#991b1b', badgeBg: '#991b1b', badgeInk: T.white, Fin: Thermometer },`,
  `  mercury: { accent: '#991b1b', badgeBg: '#991b1b', badgeInk: T.white, Fin: Thermometer },\n  arrow: { accent: '${A.COLOR}', badgeBg: '${A.COLOR}', badgeInk: T.white, Fin: MoveDownRight },`);
edit('app/DailyEndCard.jsx',
  `href: '/mercury' },\n`,
  `href: '/mercury' },\n  { key: 'arrow', cat: 'sudoku' ,  name: 'Arrow', tag: '${A.TAG}',  blurb: '${A.BLURB}', href: '/arrow' },\n`);

// ─── 4. app/DailyGamesPromo.jsx ─────────────────────────────────────────────
edit('app/DailyGamesPromo.jsx',
  `store: 'sot_mercury_day', accent: '#991b1b', bg: '#fdf1f1', border: 'rgba(153,27,27,0.4)' },`,
  `store: 'sot_mercury_day', accent: '#991b1b', bg: '#fdf1f1', border: 'rgba(153,27,27,0.4)' },\n  { key: 'arrow', href: '/arrow', name: 'Arrow', tag: 'the daily arrow sudoku', store: 'sot_arrow_day', accent: '${A.COLOR}', bg: '${A.BG}', border: '${A.BORDER}' },`);

// ─── 5. app/DailyGamesGrid.jsx — both lists ─────────────────────────────────
edit('app/DailyGamesGrid.jsx',
  `  { key: 'mercury', href: '/mercury', name: 'Mercury', tag: 'The daily thermo sudoku', img: '/games/btn-mercury.png' },`,
  `  { key: 'mercury', href: '/mercury', name: 'Mercury', tag: 'The daily thermo sudoku', img: '/games/btn-mercury.png' },\n  { key: 'arrow', href: '/arrow', name: 'Arrow', tag: '${A.TAG}', img: '/games/btn-arrow.png' },`);
edit('app/DailyGamesGrid.jsx', `'sando', 'mercury', 'polka', 'knight',`, `'sando', 'mercury', 'arrow', 'polka', 'knight',`);

// ─── 6. app/DailyStrip.jsx ──────────────────────────────────────────────────
edit('app/DailyStrip.jsx',
  `store: 'sot_mercury_day', tag: "The daily thermo sudoku" , cat: 'Numbers' },`,
  `store: 'sot_mercury_day', tag: "The daily thermo sudoku" , cat: 'Numbers' },\n  { key: 'arrow', href: '/arrow', name: 'Arrow', img: '/games/btn-arrow.png', store: 'sot_arrow_day', tag: "${A.TAG}" , cat: 'Numbers' },`);
edit('app/DailyStrip.jsx', `const ACCENTS = { giant:`, `const ACCENTS = { arrow: '${A.NAVY}', giant:`);
edit('app/DailyStrip.jsx', `const TCOL = { giant:`, `const TCOL = { arrow: '${A.COLOR}', giant:`);

// ─── 7. app/archive/page.js ─────────────────────────────────────────────────
edit('app/archive/page.js',
  `import { PUZZLES as MERCURY_FULL } from '../mercury/puzzles';`,
  `import { PUZZLES as MERCURY_FULL } from '../mercury/puzzles';\nimport { PUZZLES as ARROW_FULL } from '../arrow/puzzles';`);
edit('app/archive/page.js',
  `const MERCURY = MERCURY_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`,
  `const MERCURY = MERCURY_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));\nconst ARROW = ARROW_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`);
edit('app/archive/page.js',
  `border: 'rgba(153,27,27,0.4)', src: MERCURY },`,
  `border: 'rgba(153,27,27,0.4)', src: MERCURY },\n  { key: 'arrow', name: 'Arrow', path: '/arrow', tag: '${A.TAG}', accent: '${A.COLOR}', bg: '${A.BG}', border: '${A.BORDER}', src: ARROW },`);

// ─── 8. lib/sitemap-entries.js ──────────────────────────────────────────────
edit('lib/sitemap-entries.js', `'towers', 'mercury', 'polka',`, `'towers', 'mercury', 'arrow', 'polka',`);

// ─── 9. the four puzzle-map registries, sunday-slate included ───────────────
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  edit(f, `import { PUZZLES as P_mercury } from '@/app/mercury/puzzles';`,
    `import { PUZZLES as P_mercury } from '@/app/mercury/puzzles';\nimport { PUZZLES as P_arrow } from '@/app/arrow/puzzles';`);
  edit(f, `mercury: P_mercury`, `mercury: P_mercury, arrow: P_arrow`);
}

// ─── 10. the two hardcoded alternations ─────────────────────────────────────
edit('app/api/quiz/daily-status/route.js', `|towers|mercury|polka|`, `|towers|mercury|arrow|polka|`);
edit('app/quizzes/QuizHomeClient.jsx', `|towers|mercury|polka|`, `|towers|mercury|arrow|polka|`);

// ─── 11. rails, catalog, loft ───────────────────────────────────────────────
edit('app/DailySlateRail.jsx', `'towers', 'mercury', 'polka',`, `'towers', 'mercury', 'arrow', 'polka',`);
edit('lib/quiz-catalog.js', `'towers', 'mercury', 'polka',`, `'towers', 'mercury', 'arrow', 'polka',`);
edit('lib/loft.js', `'mate', 'mercury', 'niche',`, `'mate', 'mercury', 'arrow', 'niche',`);

// ─── 12. lib/game-glyphs.js — a circle and its arrow ────────────────────────
edit('lib/game-glyphs.js',
  "  mercury: `${grid(4, 4, 16, 16, 3, 3)}M8 8a2 2 0 1 0 .01 0M10 8h8`, // a thermometer run",
  "  mercury: `${grid(4, 4, 16, 16, 3, 3)}M8 8a2 2 0 1 0 .01 0M10 8h8`, // a thermometer run\n  arrow: 'M3 7.5a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0M10.7 10.7L20 20M20 20h-6M20 20v-6', // a circle and its arrow");

// ─── 13. lib/finish-beats.js — ripple and lock, like every fill-in sudoku ───
edit('lib/finish-beats.js', `  knight: grid('.kn-cell'),`, `  knight: grid('.kn-cell'),\n  arrow: grid('.ar-cell'),`);

// ─── 14. lib/daily-groups.js + lib/finish-sets.js ───────────────────────────
edit('lib/daily-groups.js',
  `  { name: 'Marked sudokus', cat: 'Sudoku', keys: ['quilt', 'mercury', 'polka', 'knight'] },`,
  `  { name: 'Marked sudokus', cat: 'Sudoku', keys: ['quilt', 'mercury', 'arrow', 'polka', 'knight'] },`);
edit('lib/daily-groups.js', `  // Sudoku (14)`, `  // Sudoku (15)`);
edit('lib/finish-sets.js',
  `  { name: 'Sum sudokus', cat: 'Sudoku', keys: ['cages', 'sando', 'frame'] },`,
  `  { name: 'Sum sudokus', cat: 'Sudoku', keys: ['cages', 'sando', 'frame', 'arrow'] },`);
edit('lib/finish-sets.js',
  `  { name: 'Lines and dots', cat: 'Sudoku', keys: ['polka', 'mercury', 'quilt'] },`,
  `  { name: 'Lines and dots', cat: 'Sudoku', keys: ['polka', 'mercury', 'arrow', 'quilt'] },`);

// ─── 15. lib/puzzle-categories.js — the /sudoku landing page ───────────────
edit('lib/puzzle-categories.js',
  `    title: 'Free Daily Sudoku: Fourteen Variants, One New Board Every Day | Mind Loft',`,
  `    title: 'Free Daily Sudoku: Fifteen Variants, One New Board Every Day | Mind Loft',`);
edit('lib/puzzle-categories.js',
  `    h1: 'Free Daily Sudoku: Fourteen Variants, One New Board Every Day',`,
  `    h1: 'Free Daily Sudoku: Fifteen Variants, One New Board Every Day',`);
edit('lib/puzzle-categories.js',
  `classic 9x9, a two-minute 6x6, a giant 16x16, ten variants (diagonal, jigsaw, killer, sandwich, frame, outside, thermo, kropki, anti-knight, skyscrapers)`,
  `classic 9x9, a two-minute 6x6, a giant 16x16, eleven variants (diagonal, jigsaw, killer, sandwich, frame, outside, thermo, arrow, kropki, anti-knight, skyscrapers)`);
edit('lib/puzzle-categories.js',
  `ten variant sudokus you will not find together anywhere else (diagonal, jigsaw, killer, sandwich, frame, outside, thermo, kropki, anti-knight and skyscrapers)`,
  `eleven variant sudokus you will not find together anywhere else (diagonal, jigsaw, killer, sandwich, frame, outside, thermo, arrow, kropki, anti-knight and skyscrapers)`);
edit('lib/puzzle-categories.js',
  `'towers', 'mercury', 'sando', 'frame', 'rim', 'knight', 'cages', 'polka', 'whittle'],`,
  `'towers', 'mercury', 'sando', 'frame', 'rim', 'knight', 'cages', 'arrow', 'polka', 'whittle'],`);
edit('lib/puzzle-categories.js',
  `cages: 'Killer sudoku', polka: 'Kropki sudoku',`,
  `cages: 'Killer sudoku', arrow: 'Arrow sudoku', polka: 'Kropki sudoku',`);
edit('lib/puzzle-categories.js',
  `Cages, Sando and Frame add arithmetic,`,
  `Cages, Sando, Frame and Arrow add arithmetic,`);
edit('lib/puzzle-categories.js',
  `a Mercury with eight printed digits, a Sando with six,`,
  `a Mercury with eight printed digits, an Arrow with eight under twelve arrows, a Sando with six,`);

// ─── 16. lib/circuits.js — the sudoku family list and the Dojo's run games ──
edit('lib/circuits.js',
  `export const SUDOKU_POOL = ['towers', 'sixes', 'cages', 'suds', 'diag', 'rim', 'quilt', 'polka', 'knight', 'frame', 'mercury', 'sando', 'giant'];`,
  `export const SUDOKU_POOL = ['towers', 'sixes', 'cages', 'suds', 'diag', 'rim', 'quilt', 'polka', 'knight', 'frame', 'arrow', 'mercury', 'sando', 'giant'];`);
edit('lib/circuits.js',
  `import { dojoScorerFor, DOJO_MAX, DOJO_FIXED, DOJO_POOL, DOJO_POOL_BEFORE, dojoVariantFor } from './dojo.js';`,
  `import { dojoScorerFor, DOJO_MAX, DOJO_FIXED, DOJO_POOL, DOJO_POOL_BEFORE, DOJO_ALL_POOLS, dojoVariantFor } from './dojo.js';`);
edit('lib/circuits.js',
  `export const DOJO_RUN_GAMES = [...new Set([...DOJO_FIXED, ...DOJO_POOL, ...DOJO_POOL_BEFORE.pool])];`,
  `export const DOJO_RUN_GAMES = [...new Set([...DOJO_FIXED, ...DOJO_ALL_POOLS])];`);

// ─── 17. lib/dojo.js — Arrow joins the variant pool from 2026-10-14 ─────────
edit('lib/dojo.js',
  `export const DOJO_POOL = ['sando', 'quilt', 'mercury', 'knight', 'frame', 'diag'];
export const DOJO_POOL_BEFORE = { until: '2026-10-12', pool: ['sando', 'quilt', 'mercury', 'cages', 'knight', 'polka', 'frame', 'diag'] };`,
  `// ARROW JOINS FROM 2026-10-14 (owner, 2026-10-13), between Quilt and Mercury so
// no sum rule follows another (Sando and Frame are the other sums). The pool
// is DATED as a chain: each \`before\` covers days up to its \`until\` and may
// carry an older \`before\` of its own, so every played day keeps the variant
// it was dealt.
export const DOJO_POOL = ['sando', 'quilt', 'arrow', 'mercury', 'knight', 'frame', 'diag'];
export const DOJO_POOL_BEFORE = {
  until: '2026-10-13', pool: ['sando', 'quilt', 'mercury', 'knight', 'frame', 'diag'],
  before: { until: '2026-10-12', pool: ['sando', 'quilt', 'mercury', 'cages', 'knight', 'polka', 'frame', 'diag'] },
};
// Every game any era of the pool has dealt, for the run-games registry.
export const DOJO_ALL_POOLS = (() => {
  const out = [...DOJO_POOL];
  for (let b = DOJO_POOL_BEFORE; b; b = b.before) out.push(...b.pool);
  return [...new Set(out)];
})();`);
edit('lib/dojo.js',
  `export function dojoPoolFor(iso) {
  return iso && iso <= DOJO_POOL_BEFORE.until ? DOJO_POOL_BEFORE.pool : DOJO_POOL;
}`,
  `export function dojoPoolFor(iso) {
  if (!iso) return DOJO_POOL;
  let pool = DOJO_POOL;
  for (let b = DOJO_POOL_BEFORE; b; b = b.before) if (iso <= b.until) pool = b.pool;
  return pool;
}`);
edit('lib/dojo.js',
  `  diag: { form: 'Diagonal', chip: 'Both diagonals too', phrase: 'a diagonal sudoku' },`,
  `  diag: { form: 'Diagonal', chip: 'Both diagonals too', phrase: 'a diagonal sudoku' },\n  arrow: { form: 'Arrow', chip: 'Circles sum their arrows', phrase: 'an arrow sudoku' },`);
edit('lib/dojo.js',
  `  cages: [1195, 3600], polka: [1178, 3457],\n};`,
  `  cages: [1195, 3600], polka: [1178, 3457],\n  // Arrow had no boards when it joined (2026-10-14): seeded between Knight\n  // and Mercury, the nearest grids in shape. The adaptive clocks replace it as\n  // solves come in.\n  arrow: [470, 1900],\n};`);

// ─── 18. scripts/verify-circuits.mjs — walk the dated pool chain ────────────
edit('scripts/verify-circuits.mjs',
  `function slotPoolLocal(c, iso) {
  const b = c.slot && c.slot.before;
  return b && Array.isArray(b.pool) && iso <= b.until ? b.pool : c.slot.pool;
}`,
  `// The chain may nest (Arrow joined 2026-10-14): the deepest era whose
// \`until\` still covers the day wins.
function slotPoolLocal(c, iso) {
  let pool = c.slot.pool;
  for (let b = c.slot && c.slot.before; b && Array.isArray(b.pool); b = b.before) if (iso <= b.until) pool = b.pool;
  return pool;
}`);
edit('scripts/verify-circuits.mjs',
  `  if (c.slot.before) {
    const b = c.slot.before.until;
    const got = circuitKeysFor(c.id, b)[c.keys.length];
    const idxB = Math.floor(Date.parse(b + 'T12:00:00Z') / 86400000);
    const want = c.slot.before.pool[((idxB % c.slot.before.pool.length) + c.slot.before.pool.length) % c.slot.before.pool.length];
    if (got !== want) fails.push(\`\${c.id}: \${b} deals \${got}, but the dated pool says \${want}\`);
  }`,
  `  for (let era = c.slot.before; era; era = era.before) {
    const b = era.until;
    const got = circuitKeysFor(c.id, b)[c.keys.length];
    const idxB = Math.floor(Date.parse(b + 'T12:00:00Z') / 86400000);
    const want = era.pool[((idxB % era.pool.length) + era.pool.length) % era.pool.length];
    if (got !== want) fails.push(\`\${c.id}: \${b} deals \${got}, but the dated pool says \${want}\`);
  }`);

// ─── 19. app/dojo — the client map and the page's banks ─────────────────────
edit('app/dojo/DojoClient.jsx',
  `  mercury: dynamic(() => import('../mercury/MercuryClient'), { ssr: false, loading: () => null }),`,
  `  mercury: dynamic(() => import('../mercury/MercuryClient'), { ssr: false, loading: () => null }),\n  arrow: dynamic(() => import('../arrow/ArrowClient'), { ssr: false, loading: () => null }),`);
edit('app/dojo/page.js',
  `import { PUZZLES as P_mercury } from '../mercury/puzzles';`,
  `import { PUZZLES as P_mercury } from '../mercury/puzzles';\nimport { PUZZLES as P_arrow } from '../arrow/puzzles';`);
edit('app/dojo/page.js', `mercury: P_mercury,`, `mercury: P_mercury, arrow: P_arrow,`);

// ─── 20. CLAUDE.md ──────────────────────────────────────────────────────────
edit('CLAUDE.md',
  `| Rim | thirteen of the thirty-six gutters printed instead of the weekday 16 to 30 (from 2026-09-08) |`,
  `| Rim | thirteen of the thirty-six gutters printed instead of the weekday 16 to 30 (from 2026-09-08) |\n| Arrow | eight printed digits under twelve arrows, against twenty-eight under nine on a Monday (from launch, 2026-10-13) |`);
edit('CLAUDE.md',
  `## Frame and Rim are the GUTTER SUDOKUS, and they share one engine (launched 2026-09-08)`,
  `## Arrow (\`/arrow\`) is the ARROW SUDOKU, and a shaft is NOT a house (launched 2026-10-13)

Ordinary 9x9, ordinary boxes, ordinary printed digits, plus ARROWS: each runs from a circle through
a shaft of two to four squares (steps to any of the eight neighbours), and the circle holds the SUM
of the shaft. Key/route \`arrow\`, category **Sudoku**, \`miss: null\`, SOLVE_ONLY, first-play hint,
legacy accent fuchsia \`#86198f\` / navy \`#f0abfc\`. Wired by \`scripts/wire-arrow.mjs\` (beside
Mercury in every list). No PNG tiles; glyph in \`lib/game-glyphs.js\`; share card
\`public/og/arrow.png\` from \`scripts/bake-og.mjs arrow\`. Premiere 2026-10-13 to 10-17. The client
is a fork of Mercury with the thermometer overlay swapped for \`ArrowOverlay\` (a ring, a thin line
and an arrowhead, painted \`currentColor\` on a \`--stg-mute\` style colour per the SVG-paint rule),
and it carries Mercury's RunEmbed wiring.

- **A SHAFT IS NOT A HOUSE.** Digits may repeat along one arrow when the two squares share no row,
  column or box, so the arrow rule supplies sums and eliminations only, never a hidden single.
- **The ramp is the printed-given count** with the arrow count stepping up late in the week:
  Mon 28, Tue 25, Wed 22, Thu 19 (nine arrows, shafts 2-3), Fri 16, Sat 13 (ten), **Sunday 8**
  (twelve, shafts 2-4). Measured first: the greedy floor is 11 to 17 with nine arrows, 9 to 13
  with ten, 5 to 12 with twelve.
- **ARROW NECESSITY is checked**: on every board the printed digits read as a plain sudoku admit
  more than one grid. Layout rules: no shared squares, no turn of 90 degrees or more, no shaft
  touching itself, no two diagonal steps crossing.
- \`scripts/arrow-core.mjs\` + \`gen-arrow.mjs\` (deterministic, resumable through
  \`/tmp/build/arrow-bank.jsonl\`) build the bank: 111 days, 2026-10-13 to 2027-01-31.
  \`scripts/verify-arrow.mjs\` shares no code with the core and \`scripts/arrow-mutation-test.mjs\`
  breaks the bank eleven ways.
- **The uniqueness counter MUST propagate.** A cell-by-cell search with only a running-sum bound took
  78 seconds on one twelve-arrow Sunday; arrow support plus singles at every node takes milliseconds.
- **In Enter the Dojo's variant pool from 2026-10-14** (owner, 2026-10-13), between Quilt and
  Mercury. The pool's \`before\` is now a CHAIN (\`before.before\`), walked by \`dojoPoolFor\` and by
  verify-circuits, so 10-12 keeps its eight-game pool and 10-13 its six-game pool. Its seed clock
  [470, 1900] is an estimate the adaptive clocks replace.

## Frame and Rim are the GUTTER SUDOKUS, and they share one engine (launched 2026-09-08)`);

console.log(`wire-arrow: ${applied} edits applied, ${skipped} already present`);
