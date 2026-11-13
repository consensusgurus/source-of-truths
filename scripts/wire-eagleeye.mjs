// scripts/wire-eagleeye.mjs: places the Eagle Eye run (Spot, Jig, Saw, Scour,
// Witness; owner, 2026-11-13) everywhere Due Diligence was placed, right after it.
// Anchored edits: every anchor must match EXACTLY ONCE or the script throws,
// and an edit whose insertion is already present is skipped, so a re-run is safe.
//   node scripts/wire-eagleeye.mjs <dir>
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
const LIST = (f, a) => sub(f, a, a.replace("'duediligence'", "'duediligence', 'eagleeye'"));

// 1. lib/circuits.js: import, engine, scorer, the circuit, lead and shown lists
sub('lib/circuits.js', `import { DD_KEYS, DD_MAX, DD_FROM, ddScorerFor } from './due-diligence.js';`,
  `import { DD_KEYS, DD_MAX, DD_FROM, ddScorerFor } from './due-diligence.js';\nimport { EE_KEYS, EE_MAX, EE_FROM, eeScorerFor } from './eagle-eye.js';`);
sub('lib/circuits.js', `export const DD_RUN_GAMES = DD_KEYS.slice();`, `export const DD_RUN_GAMES = DD_KEYS.slice();\nexport const EE_RUN_GAMES = EE_KEYS.slice();`);
sub('lib/circuits.js', `export const RUN_ENGINES = { duediligence: DD_RUN_GAMES, `, `export const RUN_ENGINES = { eagleeye: EE_RUN_GAMES, duediligence: DD_RUN_GAMES, `);
sub('lib/circuits.js', `const SCORERS = { duediligence: { forDay: () => ({ fn: ddScorerFor(), max: DD_MAX }) }, `,
  `const SCORERS = { eagleeye: { forDay: () => ({ fn: eeScorerFor(), max: EE_MAX }) }, duediligence: { forDay: () => ({ fn: ddScorerFor(), max: DD_MAX }) }, `);
sub('lib/circuits.js', `    trophy: { name: 'Ken Griffin', tier: 'gold', icon: 'TrendingUp' },\n  },\n`, `    trophy: { name: 'Ken Griffin', tier: 'gold', icon: 'TrendingUp' },
  },
  {
    id: 'eagleeye',
    lead: 11,
    // EAGLE EYE (owner, 2026-11-13): the visual run. Spot, Jig, Saw, Scour, then
    // Witness, in that order, on one page (app/eagleeye). Time and accuracy both
    // count, each where it is relevant to the leg (lib/eagle-eye.js), out of
    // 500, ranked from Mole up to Eagle Eye.
    name: 'Eagle Eye',
    blurb: 'Spot the differences, build two jigsaws, sweep a word search and remember a scene. Five visual puzzles in one run, scored on speed and accuracy.',
    share: {
      invite: 'Are you a Mole or an Eagle Eye? Five visual puzzles in one run: differences, two jigsaws, a word search and a memory test.',
      result: 'Five looks, one sharp eye.',
    },
    run: true,
    engine: 'eagleeye',
    path: '/eagleeye',
    unit: '5 puzzles',
    scorer: 'eagleeye',
    scoreFrom: EE_FROM,
    ownerOrder: true,
    keys: EE_KEYS.slice(),
    trophy: { name: 'Eagle Eye', tier: 'gold', icon: 'Star' },
  },
`);
LIST('lib/circuits.js', `const LEAD_ORDER = ['pricecheck', 'gauntlet', 'triviaencore', 'passport', 'deduction', 'dojo', 'crossed', 'room', 'spacecadet', 'duediligence'];`);
LIST('lib/circuits.js', `const SHOWN = ['pricecheck', 'gauntlet', 'triviaencore', 'english', 'science', 'math', 'passport', 'deduction', 'dojo', 'dojocolor', 'crossed', 'room', 'spacecadet', 'duediligence'];`);

// 2. the trophy
sub('lib/trophy-defs.js', `  { id: 'circuit-duediligence', name: 'Ken Griffin', desc: 'Finish all three puzzles of Due Diligence on the same day.', tier: 'gold', group: 'circuits', icon: 'TrendingUp' },\n`,
  `  { id: 'circuit-duediligence', name: 'Ken Griffin', desc: 'Finish all three puzzles of Due Diligence on the same day.', tier: 'gold', group: 'circuits', icon: 'TrendingUp' },\n  { id: 'circuit-eagleeye', name: 'Eagle Eye', desc: 'Finish all five puzzles of Eagle Eye on the same day.', tier: 'gold', group: 'circuits', icon: 'Star' },\n`);

// 3. the finale piece: the lens (app/RunFinale.jsx PIECES.lens)
sub('app/RunFinale.jsx', `  duediligence: 'chart',\n`, `  duediligence: 'chart',\n  // Eagle Eye (2026-11-13): the lens, which pulls each rank into focus.\n  eagleeye: 'lens',\n`);

// 4. run lists, redirects, home shelves
LIST('app/circuits/MoreRuns.jsx', `'crossed', 'room', 'spacecadet', 'duediligence'];`);
sub('app/circuits/[id]/run/page.js', `  if (runEngine(id) === 'duediligence') redirect('/duediligence');\n`,
  `  if (runEngine(id) === 'duediligence') redirect('/duediligence');\n  if (runEngine(id) === 'eagleeye') redirect('/eagleeye');\n`);
LIST('app/today/StageToday.jsx', `const CIRC_LEAD = ['pricecheck', 'gauntlet', 'triviaencore', 'passport', 'deduction', 'dojo', 'crossed', 'room', 'spacecadet', 'duediligence'];`);
LIST('app/today/StageToday.jsx', `const PILL_CIRCUITS = ['gauntlet', 'triviaencore', 'english', 'science', 'math', 'pricecheck', 'passport', 'deduction', 'dojo', 'dojocolor', 'crossed', 'room', 'spacecadet', 'duediligence'];`);
sub('app/today/StageToday.jsx', `duediligence: 'Diligence', `, `duediligence: 'Diligence', eagleeye: 'Eagle Eye', `);
sub('app/today/StageToday.jsx', `duediligence: 'Business test' }`, `duediligence: 'Business test', eagleeye: 'Eye test' }`);
LIST('app/today/TodayClient.jsx', `const LEAD_CIRCUITS = ['pricecheck', 'gauntlet', 'triviaencore', 'passport', 'deduction', 'dojo', 'crossed', 'room', 'spacecadet', 'duediligence'];`);
sub('app/today/RunGateTile.jsx', "  duediligence: ['business puzzles', (n) => `${n} Checks. One Deal.`, 'Fewer clues decide your rank.'],\n",
  "  duediligence: ['business puzzles', (n) => `${n} Checks. One Deal.`, 'Fewer clues decide your rank.'],\n  eagleeye: ['visual puzzles', (n) => `${n} Looks. One Sharp Eye.`, 'Speed and accuracy decide your rank.'],\n");
sub('app/EntryDoor.jsx', `  duediligence: 'A chart, a filing and a resume, fewest clues',\n`, `  duediligence: 'A chart, a filing and a resume, fewest clues',\n  eagleeye: 'Five visual puzzles, speed and accuracy',\n`);

// 5. pop-up blocks, challenge category, SEO
for (const f of ['app/DrawingPop.jsx', 'app/ThanksPop.jsx']) sub(f, `|spacecadet|duediligence|admin|`, `|spacecadet|duediligence|eagleeye|admin|`);
sub('lib/challenge.js', `duediligence: 'Trivia', `, `duediligence: 'Trivia', eagleeye: 'Visual', `);
LIST('lib/run-seo.js', `'crossed', 'room', 'spacecadet', 'duediligence'];`);
sub('lib/run-seo.js', `  pricecheck: {\n    path: '/pricecheck',`, `  eagleeye: {
    path: '/eagleeye',
    accent: 'spot',
    kind: 'visual puzzle run',
    score: 'Five puzzles, each worth up to 100, so the run is out of 500. Accuracy comes first: the differences you find in Spot, the words you find in Scour, the questions you get right in Witness, and whether each jigsaw gets finished. Speed then decides how much of each leg you keep, except in Witness, which is a memory test scored on answers alone. It ranks you from Mole up to Eagle Eye.',
  },
  pricecheck: {
    path: '/pricecheck',`);
sub('next.config.js', `      { source: '/due-diligence', destination: '/duediligence', permanent: true },\n`,
  `      { source: '/due-diligence', destination: '/duediligence', permanent: true },\n      // Eagle Eye (owner, 2026-11-13) lives at /eagleeye.\n      { source: '/eagle-eye', destination: '/eagleeye', permanent: true },\n`);

// 6. the run's tile art: a jigsaw piece, an eye, a magnifier
sub('app/CircuitArt.jsx', `  duediligence: (\n`, `  eagleeye: (
    <>
      <path d="M58 44 H72 C70 36 82 36 80 44 H94 V58 C102 56 102 68 94 66 V80 H58 Z" fill="currentColor" fillOpacity=".15" strokeWidth="2.5" strokeLinejoin="round" />
      <path className="k" d="M104 62 C116 42 148 42 160 62 C148 82 116 82 104 62 Z" strokeWidth="4.5" strokeLinejoin="round" fill="none" />
      <circle cx="132" cy="62" r="9" fill="currentColor" stroke="none" />
      <circle cx="176" cy="88" r="10" fill="currentColor" fillOpacity=".2" strokeWidth="2.5" />
      <path d="M183 96 L192 106" strokeWidth="3.5" strokeLinecap="round" />
    </>
  ),
  duediligence: (\n`);

// 7. the run door on each member game's start gate
sub('app/circuits/RunDoorPop.jsx', `  room: {\n    href: '/room', name: 'Read the Room',`, `  // EAGLE EYE (owner, 2026-11-13): once per game, to everyone, on the start
  // gate of Spot, Jig, Saw, Scour or Witness.
  eagleeye: {
    href: '/eagleeye', name: 'Eagle Eye', eyebrow: 'Daily run \\u00b7 Five visual puzzles', once: 'game', everyone: true, from: '2026-11-13',
    body: 'Spot, Jig, Saw, Scour and Witness back to back on one page: find the differences, build two jigsaws, sweep a word search, remember a scene. Speed and accuracy rank you, from Mole up to Eagle Eye.',
    go: 'Run all five', accent: '#f0abfc',
    tags: [['Spot', '#fda4af'], ['Jig', '#fde68a'], ['Saw', '#a7e8cf'], ['Scour', '#bae6fd'], ['Witness', '#d8b4fe']],
  },
  room: {\n    href: '/room', name: 'Read the Room',`);

// 8. the home pop-up, beside Space Cadet's
sub('app/today/StageToday.jsx', `import SpaceCadetPop from '../SpaceCadetPop';\n`, `import SpaceCadetPop from '../SpaceCadetPop';\nimport EagleEyePop from '../EagleEyePop';\n`);
sub('app/today/StageToday.jsx', `      <SpaceCadetPop />\n`, `      <SpaceCadetPop />\n      {/* EAGLE EYE: once per browser, everyone (new and returning), home only, never mid puzzle. See app/EagleEyePop.jsx. */}\n      <EagleEyePop />\n`);

console.log(`wire-eagleeye: ${applied} applied, ${skipped} already present`);
