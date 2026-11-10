// scripts/wire-duediligence.mjs: places the Due Diligence run (Tape, Filing,
// Resume; owner, 2026-11-10) everywhere Space Cadet was placed, right after it.
// Anchored edits: every anchor must match EXACTLY ONCE or the script throws,
// and an edit whose insertion is already present is skipped, so a re-run is safe.
//   node scripts/wire-duediligence.mjs <dir>
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
const LIST = (f, a) => sub(f, a, a.replace("'spacecadet'", "'spacecadet', 'duediligence'"));

// 1. lib/circuits.js: import, engine, scorer, the circuit, lead and shown lists
sub('lib/circuits.js', `import { SPACE_KEYS, SPACE_MAX, SPACE_FROM, spaceScorerFor } from './space-cadet.js';`,
  `import { SPACE_KEYS, SPACE_MAX, SPACE_FROM, spaceScorerFor } from './space-cadet.js';\nimport { DD_KEYS, DD_MAX, DD_FROM, ddScorerFor } from './due-diligence.js';`);
sub('lib/circuits.js', `export const SPACE_RUN_GAMES = SPACE_KEYS.slice();`, `export const SPACE_RUN_GAMES = SPACE_KEYS.slice();\nexport const DD_RUN_GAMES = DD_KEYS.slice();`);
sub('lib/circuits.js', `export const RUN_ENGINES = { spacecadet: SPACE_RUN_GAMES, `, `export const RUN_ENGINES = { duediligence: DD_RUN_GAMES, spacecadet: SPACE_RUN_GAMES, `);
sub('lib/circuits.js', `const SCORERS = { spacecadet: { forDay: () => ({ fn: spaceScorerFor(), max: SPACE_MAX }) }, `,
  `const SCORERS = { duediligence: { forDay: () => ({ fn: ddScorerFor(), max: DD_MAX }) }, spacecadet: { forDay: () => ({ fn: spaceScorerFor(), max: SPACE_MAX }) }, `);
sub('lib/circuits.js', `    trophy: { name: 'Architect-Engineer', tier: 'gold', icon: 'Rocket' },\n  },\n`, `    trophy: { name: 'Architect-Engineer', tier: 'gold', icon: 'Rocket' },
  },
  {
    id: 'duediligence',
    lead: 10,
    // DUE DILIGENCE (owner, 2026-11-10): the company run. Tape, Filing, then
    // Resume, in that order, on one page (app/duediligence). Clues decide: each
    // solved leg pays its page's 11 minus clues (lib/due-diligence.js), out of
    // 30, ranked from Anon Fintwit Account up to Ken Griffin.
    name: 'Due Diligence',
    blurb: 'A stock chart, an IPO filing and a resume on one page. Name the stock, the company and the person in the fewest clues.',
    share: {
      invite: 'A stock chart, an IPO filing and a resume. Name all three in the fewest clues and you are Ken Griffin.',
      result: 'Three checks, one deal.',
    },
    run: true,
    engine: 'duediligence',
    path: '/duediligence',
    unit: '3 puzzles',
    scorer: 'duediligence',
    scoreFrom: DD_FROM,
    ownerOrder: true,
    keys: DD_KEYS.slice(),
    trophy: { name: 'Ken Griffin', tier: 'gold', icon: 'TrendingUp' },
  },
`);
LIST('lib/circuits.js', `const LEAD_ORDER = ['pricecheck', 'gauntlet', 'triviaencore', 'passport', 'deduction', 'dojo', 'crossed', 'room', 'spacecadet'];`);
LIST('lib/circuits.js', `const SHOWN = ['pricecheck', 'gauntlet', 'triviaencore', 'english', 'science', 'math', 'passport', 'deduction', 'dojo', 'dojocolor', 'crossed', 'room', 'spacecadet'];`);

// 2. the trophy
sub('lib/trophy-defs.js', `  { id: 'circuit-spacecadet', name: 'Architect-Engineer', desc: 'Finish all four puzzles of Space Cadet on the same day.', tier: 'gold', group: 'circuits', icon: 'Rocket' },\n`,
  `  { id: 'circuit-spacecadet', name: 'Architect-Engineer', desc: 'Finish all four puzzles of Space Cadet on the same day.', tier: 'gold', group: 'circuits', icon: 'Rocket' },\n  { id: 'circuit-duediligence', name: 'Ken Griffin', desc: 'Finish all three puzzles of Due Diligence on the same day.', tier: 'gold', group: 'circuits', icon: 'TrendingUp' },\n`);

// 3. the finale piece: the wallet of cards, as Price Check
sub('app/RunFinale.jsx', `  spacecadet: 'dict',\n`, `  spacecadet: 'dict',\n  // Due Diligence (2026-11-10): the wallet, a card per rank.\n  duediligence: 'wallet',\n`);

// 4. run lists, redirects, home shelves
LIST('app/circuits/MoreRuns.jsx', `'crossed', 'room', 'spacecadet'];`);
sub('app/circuits/[id]/run/page.js', `  if (runEngine(id) === 'spacecadet') redirect('/spacecadet');\n`,
  `  if (runEngine(id) === 'spacecadet') redirect('/spacecadet');\n  if (runEngine(id) === 'duediligence') redirect('/duediligence');\n`);
LIST('app/today/StageToday.jsx', `const CIRC_LEAD = ['pricecheck', 'gauntlet', 'triviaencore', 'passport', 'deduction', 'dojo', 'crossed', 'room', 'spacecadet'];`);
LIST('app/today/StageToday.jsx', `const PILL_CIRCUITS = ['gauntlet', 'triviaencore', 'english', 'science', 'math', 'pricecheck', 'passport', 'deduction', 'dojo', 'dojocolor', 'crossed', 'room', 'spacecadet'];`);
sub('app/today/StageToday.jsx', `spacecadet: 'Space Cadet', `, `spacecadet: 'Space Cadet', duediligence: 'Diligence', `);
sub('app/today/StageToday.jsx', `spacecadet: 'Spatial test' }`, `spacecadet: 'Spatial test', duediligence: 'Business test' }`);
LIST('app/today/TodayClient.jsx', `const LEAD_CIRCUITS = ['pricecheck', 'gauntlet', 'triviaencore', 'passport', 'deduction', 'dojo', 'crossed', 'room', 'spacecadet'];`);
sub('app/today/RunGateTile.jsx', "  spacecadet: ['spatial puzzles', (n) => `${n} Legs. One Launch.`, 'One clock decides your rank.'],\n",
  "  spacecadet: ['spatial puzzles', (n) => `${n} Legs. One Launch.`, 'One clock decides your rank.'],\n  duediligence: ['business puzzles', (n) => `${n} Checks. One Deal.`, 'Fewer clues decide your rank.'],\n");
sub('app/EntryDoor.jsx', `  spacecadet: 'Four spatial puzzles, one clock',\n`, `  spacecadet: 'Four spatial puzzles, one clock',\n  duediligence: 'A chart, a filing and a resume, fewest clues',\n`);

// 5. pop-up blocks, challenge category, SEO
for (const f of ['app/DrawingPop.jsx', 'app/ThanksPop.jsx']) sub(f, `|room|spacecadet|admin|`, `|room|spacecadet|duediligence|admin|`);
sub('lib/challenge.js', `spacecadet: 'Logic', `, `spacecadet: 'Logic', duediligence: 'Trivia', `);
LIST('lib/run-seo.js', `'crossed', 'room', 'spacecadet'];`);
sub('lib/run-seo.js', `  pricecheck: {\n    path: '/pricecheck',`, `  duediligence: {
    path: '/duediligence',
    accent: 'filing',
    kind: 'business trivia run',
    score: 'Three puzzles, each worth 10: name the company from its stock chart, then a company from its IPO filing, then a famous person from their resume. The first clue pays 10 and every extra clue a point less, so the run is out of 30. It ranks you from Anon Fintwit Account up to Ken Griffin.',
  },
  pricecheck: {
    path: '/pricecheck',`);
sub('next.config.js', `      { source: '/spatial', destination: '/spacecadet', permanent: false },\n`,
  `      { source: '/spatial', destination: '/spacecadet', permanent: false },\n      // Due Diligence (owner, 2026-11-10) lives at /duediligence.\n      { source: '/due-diligence', destination: '/duediligence', permanent: true },\n`);

// 6. the run's tile art: a chart line, a filing page, a profile head
sub('app/CircuitArt.jsx', `  spacecadet: (\n`, `  duediligence: (
    <>
      <path className="k" d="M56 92 L74 70 L88 80 L106 46" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="114" y="24" width="38" height="50" rx="3" fill="currentColor" fillOpacity=".15" strokeWidth="2.5" />
      <g fill="currentColor" stroke="none"><rect x="120" y="34" width="18" height="5" /><rect x="120" y="45" width="26" height="3" /><rect x="120" y="53" width="22" height="3" /><rect x="120" y="61" width="26" height="3" /></g>
      <circle cx="172" cy="78" r="9" fill="currentColor" fillOpacity=".25" strokeWidth="2.5" />
      <path d="M156 102 C158 92 164 88 172 88 C180 88 186 92 188 102" strokeWidth="2.5" fill="none" />
    </>
  ),
  spacecadet: (\n`);

console.log(`wire-duediligence: ${applied} applied, ${skipped} already present`);
