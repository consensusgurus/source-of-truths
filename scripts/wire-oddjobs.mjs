// scripts/wire-oddjobs.mjs: places the Odd Jobs run (Mop, Mow, Plow; owner,
// 2026-11-21) everywhere Eagle Eye was placed, right after it.
// Anchored edits: every anchor must match EXACTLY ONCE or the script throws,
// and an edit whose insertion is already present is skipped, so a re-run is safe.
//   node scripts/wire-oddjobs.mjs <dir>
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
const LIST = (f, a) => sub(f, a, a.replace("'eagleeye'", "'eagleeye', 'oddjobs'"));

// 1. lib/circuits.js: import, engine, scorer, the circuit, lead and shown lists
sub('lib/circuits.js', `import { EE_KEYS, EE_MAX, EE_FROM, eeScorerFor } from './eagle-eye.js';`,
  `import { EE_KEYS, EE_MAX, EE_FROM, eeScorerFor } from './eagle-eye.js';\nimport { ODD_KEYS, ODD_MAX, ODD_FROM, oddScorerFor } from './odd-jobs.js';`);
sub('lib/circuits.js', `export const EE_RUN_GAMES = EE_KEYS.slice();`, `export const EE_RUN_GAMES = EE_KEYS.slice();\nexport const ODD_RUN_GAMES = ODD_KEYS.slice();`);
sub('lib/circuits.js', `export const RUN_ENGINES = { eagleeye: EE_RUN_GAMES, `, `export const RUN_ENGINES = { oddjobs: ODD_RUN_GAMES, eagleeye: EE_RUN_GAMES, `);
sub('lib/circuits.js', `const SCORERS = { eagleeye: { forDay: () => ({ fn: eeScorerFor(), max: EE_MAX }) }, `,
  `const SCORERS = { oddjobs: { forDay: () => ({ fn: oddScorerFor(), max: ODD_MAX }) }, eagleeye: { forDay: () => ({ fn: eeScorerFor(), max: EE_MAX }) }, `);
sub('lib/circuits.js', `    trophy: { name: 'Eagle Eye', tier: 'gold', icon: 'Star' },\n  },\n`, `    trophy: { name: 'Eagle Eye', tier: 'gold', icon: 'Star' },
  },
  {
    id: 'oddjobs',
    lead: 12,
    // ODD JOBS (owner, 2026-11-21): the chores run. Mop, Mow, then Plow, in
    // that order, on one page (app/oddjobs). Fewest replays first, then the
    // clock (lib/odd-jobs.js), out of 300, ranked from Couch Potato up to Foreman.
    name: 'Odd Jobs',
    blurb: 'Mop a house, mow a yard and plow a town, every tile, square and street exactly once. Fewest replays win, then the clock.',
    share: {
      invite: 'Are you a Couch Potato or a Foreman? Mop a house, mow a yard and plow a town, every tile, square and street exactly once.',
      result: 'Three jobs, no second pass.',
    },
    run: true,
    engine: 'oddjobs',
    path: '/oddjobs',
    unit: '3 puzzles',
    scorer: 'oddjobs',
    scoreFrom: ODD_FROM,
    ownerOrder: true,
    keys: ODD_KEYS.slice(),
    trophy: { name: 'Foreman', tier: 'gold', icon: 'Award' },
  },
`);
LIST('lib/circuits.js', `const LEAD_ORDER = ['pricecheck', 'gauntlet', 'triviaencore', 'passport', 'deduction', 'dojo', 'crossed', 'room', 'spacecadet', 'duediligence', 'eagleeye'];`);
LIST('lib/circuits.js', `const SHOWN = ['pricecheck', 'gauntlet', 'triviaencore', 'english', 'science', 'math', 'passport', 'deduction', 'dojo', 'dojocolor', 'crossed', 'room', 'spacecadet', 'duediligence', 'eagleeye'];`);

// 2. the trophy
sub('lib/trophy-defs.js', `  { id: 'circuit-eagleeye', name: 'Eagle Eye', desc: 'Finish all five puzzles of Eagle Eye on the same day.', tier: 'gold', group: 'circuits', icon: 'Star' },\n`,
  `  { id: 'circuit-eagleeye', name: 'Eagle Eye', desc: 'Finish all five puzzles of Eagle Eye on the same day.', tier: 'gold', group: 'circuits', icon: 'Star' },\n  { id: 'circuit-oddjobs', name: 'Foreman', desc: 'Finish all three jobs of Odd Jobs on the same day.', tier: 'gold', group: 'circuits', icon: 'Award' },\n`);

// 3. the finale piece: the dictionary, each rank defined by its line
sub('app/RunFinale.jsx', `  eagleeye: 'lens',\n`, `  eagleeye: 'lens',\n  // Odd Jobs (2026-11-21): the dictionary, each rank defined by its line.\n  oddjobs: 'dict',\n`);

// 4. run lists, redirects, home shelves
LIST('app/circuits/MoreRuns.jsx', `'crossed', 'room', 'spacecadet', 'duediligence', 'eagleeye'];`);
sub('app/circuits/[id]/run/page.js', `  if (runEngine(id) === 'eagleeye') redirect('/eagleeye');\n`,
  `  if (runEngine(id) === 'eagleeye') redirect('/eagleeye');\n  if (runEngine(id) === 'oddjobs') redirect('/oddjobs');\n`);
LIST('app/today/StageToday.jsx', `const CIRC_LEAD = ['pricecheck', 'gauntlet', 'triviaencore', 'passport', 'deduction', 'dojo', 'crossed', 'room', 'spacecadet', 'duediligence', 'eagleeye'];`);
LIST('app/today/StageToday.jsx', `'room', 'spacecadet', 'duediligence', 'eagleeye'];   // dojocolor beside the Dojo (2026-11-08)`);
sub('app/today/StageToday.jsx', `eagleeye: 'Eagle Eye', room: 'Room'`, `eagleeye: 'Eagle Eye', oddjobs: 'Odd Jobs', room: 'Room'`);
sub('app/today/StageToday.jsx', `eagleeye: 'Eye test' }`, `eagleeye: 'Eye test', oddjobs: 'Chores test' }`);
LIST('app/today/TodayClient.jsx', `const LEAD_CIRCUITS = ['pricecheck', 'gauntlet', 'triviaencore', 'passport', 'deduction', 'dojo', 'crossed', 'room', 'spacecadet', 'duediligence', 'eagleeye'];`);
sub('app/today/RunGateTile.jsx', "  eagleeye: ['visual puzzles', (n) => `${n} Looks. One Sharp Eye.`, 'Speed and accuracy decide your rank.'],\n",
  "  eagleeye: ['visual puzzles', (n) => `${n} Looks. One Sharp Eye.`, 'Speed and accuracy decide your rank.'],\n  oddjobs: ['chores', (n) => `${n} Jobs. No Second Pass.`, 'Fewest replays decide your rank, then the clock.'],\n");
sub('app/today/RunGateTile.jsx', `  science: <><path className="f2" d="M20 7v12L10 37.5`,
  `  oddjobs: <><path className="f2" d="M8 22L24 9l16 13v17H8z" /><rect className="f1" x="20" y="28" width="8" height="11" /><path d="M33 6l-7 14" /><path className="f1" d="M23 20h6l1 4h-8z" /></>,\n  science: <><path className="f2" d="M20 7v12L10 37.5`);
sub('app/EntryDoor.jsx', `  eagleeye: 'Five visual puzzles, speed and accuracy',\n`, `  eagleeye: 'Five visual puzzles, speed and accuracy',\n  oddjobs: 'Mop, mow and plow, fewest replays',\n`);

// 5. pop-up blocks, challenge category, SEO
for (const f of ['app/DrawingPop.jsx', 'app/ThanksPop.jsx']) sub(f, `|duediligence|eagleeye|admin|`, `|duediligence|eagleeye|oddjobs|admin|`);
sub('lib/challenge.js', `eagleeye: 'Visual', `, `eagleeye: 'Visual', oddjobs: 'Logic', `);
LIST('lib/run-seo.js', `'crossed', 'room', 'spacecadet', 'duediligence', 'eagleeye'];`);
sub('lib/run-seo.js', `  eagleeye: {\n    path: '/eagleeye',`, `  oddjobs: {
    path: '/oddjobs',
    accent: 'mop',
    kind: 'route puzzle run',
    score: 'Three jobs, each worth up to 100, so the run is out of 300: mop every tile of a house, mow every square of a yard, then plow every street of a town, each exactly once. Going back over your own work is a replay, and each replay costs 20. The clock costs at most 6 a job, so fewer replays always rank higher and time only breaks the tie. It ranks you from Couch Potato up to Foreman.',
  },
  eagleeye: {
    path: '/eagleeye',`);
sub('next.config.js', `      { source: '/eagle-eye', destination: '/eagleeye', permanent: true },\n`,
  `      { source: '/eagle-eye', destination: '/eagleeye', permanent: true },\n      // Odd Jobs (owner, 2026-11-21) lives at /oddjobs.\n      { source: '/odd-jobs', destination: '/oddjobs', permanent: true },\n      { source: '/chores', destination: '/oddjobs', permanent: false },\n`);

// 6. the run's tile art: a house with a mop, a lawn stripe, a snowy street
sub('app/CircuitArt.jsx', `  eagleeye: (\n`, `  oddjobs: (
    <>
      <path d="M56 58 L76 42 L96 58 V88 H56 Z" fill="currentColor" fillOpacity=".15" strokeWidth="2.5" strokeLinejoin="round" />
      <path className="k" d="M100 34 L86 66" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M80 66 H94 L96 76 H78 Z" fill="currentColor" fillOpacity=".3" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M112 62 H144 M112 72 H144 M112 82 H144" strokeWidth="3" strokeLinecap="round" />
      <rect x="152" y="70" width="40" height="14" rx="3" fill="currentColor" fillOpacity=".2" strokeWidth="2.5" />
      <path d="M156 77 H188" strokeWidth="1.8" />
    </>
  ),
  eagleeye: (\n`);

// 7. the run door on each member game's start gate (SimpleDaily GAME.runDoor)
sub('app/circuits/RunDoorPop.jsx', `  // EAGLE EYE (owner, 2026-11-13): once per game, to everyone, on the start\n`, `  // ODD JOBS (owner, 2026-11-21): once per game, to everyone, on the start
  // gate of Mop, Mow or Plow.
  oddjobs: {
    href: '/oddjobs', name: 'Odd Jobs', eyebrow: 'Daily run \\u00b7 Three chores', once: 'game', everyone: true, from: '2026-11-21',
    body: 'Mop, Mow and Plow back to back on one page: the house, the yard, then the town, every tile, square and street exactly once. Fewest replays rank you, then the clock, from Couch Potato up to Foreman.',
    go: 'Do all three', accent: '#fcd34d',
    tags: [['Mop', '#bae6fd'], ['Mow', '#bbf7d0'], ['Plow', '#fed7aa']],
  },
  // EAGLE EYE (owner, 2026-11-13): once per game, to everyone, on the start\n`);
sub('app/mop/MopClient.jsx', `  key: 'mop', name: 'Mop', cat: 'Logic', miss: 'Replays', missOne: 'replay',\n`, `  key: 'mop', name: 'Mop', cat: 'Logic', miss: 'Replays', missOne: 'replay', runDoor: 'oddjobs',\n`);
sub('app/mow/MowClient.jsx', `  key: 'mow', name: 'Mow', cat: 'Logic', miss: 'Replays', missOne: 'replay',\n`, `  key: 'mow', name: 'Mow', cat: 'Logic', miss: 'Replays', missOne: 'replay', runDoor: 'oddjobs',\n`);
sub('app/plow/PlowClient.jsx', `  key: 'plow', name: 'Plow', cat: 'Logic', miss: 'Replays', missOne: 'replay',\n`, `  key: 'plow', name: 'Plow', cat: 'Logic', miss: 'Replays', missOne: 'replay', runDoor: 'oddjobs',\n`);

// 8. the launch card: one run card for returning players (the premiere queue's
// one card a day, one pop-up a visit), standing in for the members' cards.
sub('lib/daily-games.js', `export const PREMIERE_RUNS = [\n`, `export const PREMIERE_RUNS = [
  // ODD JOBS (owner, 2026-11-21): Mop, Mow and Plow as one run. One card for the
  // run; while it is open it stands in for the Mow and Plow cards.
  { id: 'oddjobs', name: 'Odd Jobs', href: '/oddjobs', from: '2026-11-21', until: '2026-11-25', keys: ['mop', 'mow', 'plow'], cat: 'Logic',
    lede: 'A new daily run: three chores, no second pass. Mop the house, mow the yard, then plow the town, every tile, square and street exactly once. Fewest replays rank you, then the clock, from Couch Potato up to Foreman.',
    foot: 'Mop, Mow and Plow are also their own dailies on the Logic shelf.' },
`);

console.log(`wire-oddjobs: ${applied} applied, ${skipped} already present`);
