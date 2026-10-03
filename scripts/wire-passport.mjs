// scripts/wire-passport.mjs: wires Passport (the daily geography run, one
// mystery country in five rounds, out of 50) into every registry. It sits after
// Flank in every list, and it is BOTH a Geography daily and a circuit tile
// (owner, 2026-10-03), the way Price Check is a tile, and it takes the Daily
// Five's place in the home's lead three and first-visit pins.
//
// An ANCHORED script in the shape of scripts/wire-duet.mjs: every anchor must
// match EXACTLY ONCE or the script throws, and an edit whose replacement is
// already present is skipped, so a re-run after a partial push is safe.
//
//   node scripts/wire-passport.mjs <dir>
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

const D = {
  TAG: 'One country, five rounds',
  HOW: 'One mystery country a day, played in five rounds of 10 points: name it from a landmark photo that pulls back with every wrong guess, build its flag in three picks, name its land neighbors before three strikes, drop a pin on its capital, and call five countries bigger or smaller. Your score out of 50 decides which passport you travel home on. Sundays bring a country with eight or more neighbors.',
  COLOR: '#9f1239', NAVY: '#fda4af', BG: '#fdf2f4', BORDER: 'rgba(159,18,57,0.35)',
  BLURB: 'One mystery country in five rounds: a landmark, its flag, its neighbors, its capital and its size. Score out of 50 and travel home on the passport you earned. Sundays bring a country with eight or more neighbors.',
};

// ─── 1. lib/daily-games.js ──────────────────────────────────────────────────
// Passport posts no misses: the score is the five rounds summed, so `miss` is
// null and the board falls through score, then the clock.
edit('lib/daily-games.js',
  `colorNavy: '#b1d977' },\n];`,
  `colorNavy: '#b1d977' },\n  { key: 'passport', miss: null, name: 'Passport', cat: 'Geography', tag: '${D.TAG}', how: '${D.HOW}', color: '${D.COLOR}', colorNavy: '${D.NAVY}' },\n];`);
edit('lib/daily-games.js',
  `  { key: 'duet', from: '2026-10-03', until: '2026-10-07' },`,
  `  { key: 'duet', from: '2026-10-03', until: '2026-10-07' },\n  { key: 'passport', from: '2026-10-03', until: '2026-10-07' },`);

// ─── 2. lib/sunday-editions.js ──────────────────────────────────────────────
edit('lib/sunday-editions.js',
  `//   duet    a 10x10 board against the weekday 6x6 and 8x8`,
  `//   duet    a 10x10 board against the weekday 6x6 and 8x8\n//   passport  a country with eight or more land neighbors for the borders round`);
edit('lib/sunday-editions.js', `  'flank',\n`, `  'flank',\n  'passport',\n`);

// ─── 3. app/DailyEndCard.jsx + the daily-order pin ──────────────────────────
edit('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['duet',`, `const LAUNCH_PIN = { keys: ['passport', 'duet',`);
edit('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['duet',`, `const LAUNCH_PIN = { keys: ['passport', 'duet',`);
edit('app/DailyEndCard.jsx', `Milestone, CornerUpRight,`, `Milestone, Plane, CornerUpRight,`);
edit('app/DailyEndCard.jsx',
  `  flank: { accent: '#3f6212',`,
  `  passport: { accent: '${D.COLOR}', badgeBg: '${D.COLOR}', badgeInk: T.white, Fin: Plane },\n  flank: { accent: '#3f6212',`);
edit('app/DailyEndCard.jsx',
  `  { key: 'flank', cat: 'geography',`,
  `  { key: 'passport', cat: 'geography', name: 'Passport', tag: '${D.TAG}', blurb: '${D.BLURB}', href: '/passport' },\n  { key: 'flank', cat: 'geography',`);

// ─── 4. app/DailyGamesPromo.jsx ─────────────────────────────────────────────
edit('app/DailyGamesPromo.jsx',
  `  { key: 'flank', href: '/flank', name: 'Flank',`,
  `  { key: 'passport', href: '/passport', name: 'Passport', tag: 'one country, five rounds', store: 'sot_passport_day', accent: '${D.COLOR}', bg: '${D.BG}', border: '${D.BORDER}' },\n  { key: 'flank', href: '/flank', name: 'Flank',`);

// ─── 5. app/DailyGamesGrid.jsx: both lists ──────────────────────────────────
edit('app/DailyGamesGrid.jsx',
  `  { key: 'flank', href: '/flank', name: 'Flank', tag:`,
  `  { key: 'passport', href: '/passport', name: 'Passport', tag: '${D.TAG}', img: '/games/btn-passport.png' },\n  { key: 'flank', href: '/flank', name: 'Flank', tag:`);
edit('app/DailyGamesGrid.jsx', `keys: ['atlas', 'flank', 'span', 'ping'] },`, `keys: ['atlas', 'flank', 'passport', 'span', 'ping'] },`);

// ─── 6. app/DailyStrip.jsx ──────────────────────────────────────────────────
edit('app/DailyStrip.jsx',
  `  { key: 'flank', href: '/flank', name: 'Flank', img:`,
  `  { key: 'passport', href: '/passport', name: 'Passport', img: '/games/btn-passport.png', store: 'sot_passport_day', tag: "${D.TAG}" , cat: 'Geography' },\n  { key: 'flank', href: '/flank', name: 'Flank', img:`);
edit('app/DailyStrip.jsx', `const ACCENTS = { duet:`, `const ACCENTS = { passport: '${D.NAVY}', duet:`);
edit('app/DailyStrip.jsx', `const TCOL = { duet:`, `const TCOL = { passport: '${D.COLOR}', duet:`);

// ─── 7. app/daily/page.js ───────────────────────────────────────────────────
edit('app/daily/page.js',
  `import { PUZZLES as FLANK_FULL } from '../flank/puzzles';`,
  `import { PUZZLES as FLANK_FULL } from '../flank/puzzles';\nimport { PUZZLES as PASSPORT_FULL } from '../passport/puzzles';`);
edit('app/daily/page.js',
  `const FLANK = FLANK_FULL.map(`,
  `const PASSPORT = PASSPORT_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));\nconst FLANK = FLANK_FULL.map(`);
edit('app/daily/page.js',
  `  { key: 'flank', name: 'Flank', path: '/flank',`,
  `  { key: 'passport', name: 'Passport', path: '/passport', tag: '${D.TAG}', accent: '${D.COLOR}', bg: '${D.BG}', border: '${D.BORDER}', src: PASSPORT },\n  { key: 'flank', name: 'Flank', path: '/flank',`);

// ─── 8. app/daily/DailyArchiveClient.jsx ────────────────────────────────────
edit('app/daily/DailyArchiveClient.jsx', `keys: ['atlas', 'flank', 'span', 'ping'] },`, `keys: ['atlas', 'flank', 'passport', 'span', 'ping'] },`);
edit('app/daily/DailyArchiveClient.jsx', `flank: '#b1d977',`, `flank: '#b1d977', passport: '${D.NAVY}',`);

// ─── 9. lib/sitemap-entries.js, rails, catalog, loft ────────────────────────
for (const f of ['lib/sitemap-entries.js', 'app/DailySlateRail.jsx', 'lib/quiz-catalog.js', 'lib/loft.js']) {
  edit(f, `'flank', 'knight',`, `'flank', 'passport', 'knight',`);
}

// ─── 10. the puzzle-map registries, sunday-slate included ───────────────────
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  edit(f, `import { PUZZLES as P_flank } from '@/app/flank/puzzles';`,
    `import { PUZZLES as P_flank } from '@/app/flank/puzzles';\nimport { PUZZLES as P_passport } from '@/app/passport/puzzles';`);
  edit(f, `flank: P_flank,`, `flank: P_flank, passport: P_passport,`);
}

// ─── 11. the two hardcoded alternations ─────────────────────────────────────
edit('app/api/quiz/daily-status/route.js', `|flank|knight|`, `|flank|passport|knight|`);
edit('app/quizzes/QuizHomeClient.jsx', `|flank|knight|`, `|flank|passport|knight|`);

// ─── 12. lib/game-glyphs.js: a passport booklet with a globe ────────────────
edit('lib/game-glyphs.js',
  `  flank: 'M12 12a2.5`,
  `  passport: 'M6 2h12a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM9 10a3 3 0 1 0 6 0a3 3 0 1 0-6 0M9 10h6M12 7c-1 1.6-1 4.4 0 6c1-1.6 1-4.4 0-6M9 17h6', // a booklet, a globe, a line\n  flank: 'M12 12a2.5`);

// ─── 13. lib/puzzle-categories.js: the geography landing page ───────────────
edit('lib/puzzle-categories.js',
  `    description: 'Four free daily geography games: guess a secret city by distance, chain countries across shared borders, name every neighbor of a country, and a twenty-five-question geography gauntlet. New puzzles at midnight Eastern, no signup.',`,
  `    description: 'Five free daily geography games: guess a secret city by distance, chain countries across shared borders, name every neighbor of a country, a twenty-five-question geography gauntlet, and a mystery country in five rounds. New puzzles at midnight Eastern, no signup.',`);
edit('lib/puzzle-categories.js',
  `    lede: 'Four geography games, one new puzzle in each every day. Home in on a secret city by the miles to it, cross the map by the shortest chain of land borders, name every neighbor of one country before three strikes, and run a twenty-five-question gauntlet with one life.',`,
  `    lede: 'Five geography games, one new puzzle in each every day. Home in on a secret city by the miles to it, cross the map by the shortest chain of land borders, name every neighbor of one country before three strikes, run a twenty-five-question gauntlet with one life, and track down one mystery country from its landmark, flag, neighbors, capital and size.',`);
edit('lib/puzzle-categories.js',
  `    keys: ['ping', 'span', 'flank', 'atlas'],\n    generic: { ping: 'Guess the city by distance', span: 'Border chain', flank: 'Name every neighbor', atlas: 'Geography gauntlet' },`,
  `    keys: ['ping', 'span', 'flank', 'atlas', 'passport'],\n    generic: { ping: 'Guess the city by distance', span: 'Border chain', flank: 'Name every neighbor', atlas: 'Geography gauntlet', passport: 'Mystery country in five rounds' },`);
edit('lib/puzzle-categories.js',
  `      'Atlas is the geography gauntlet: five rounds of five cycling capitals, the physical world, flags and borders, places and landmarks, and countries and peoples, one life, twenty seconds a question.',\n    ],`,
  `      'Atlas is the geography gauntlet: five rounds of five cycling capitals, the physical world, flags and borders, places and landmarks, and countries and peoples, one life, twenty seconds a question.',\n      'Passport is one mystery country played five ways, 10 points a round: name it from a landmark photo that pulls back with every miss, build its flag, name its neighbors, pin its capital and call its size against five others. The total out of 50 decides which real passport you travel home on.',\n    ],`);
edit('lib/puzzle-categories.js',
  `    start: 'Flank if you know your borders. Ping if you like triangulating. Atlas if you want a quiz.',`,
  `    start: 'Flank if you know your borders. Ping if you like triangulating. Atlas if you want a quiz. Passport if you want a little of everything.',`);
edit('lib/puzzle-categories.js',
  `      ['Sunday Edition', 'Flank hands you a giant with eight or more borders and a fourth strike; Span adds a country to route through or avoid.'],`,
  `      ['Sunday Edition', 'Flank hands you a giant with eight or more borders and a fourth strike; Passport picks a country with eight or more neighbors; Span adds a country to route through or avoid.'],`);
edit('lib/puzzle-categories.js',
  `      ['Are they free?', 'Yes, all four, every day.'],`,
  `      ['Are they free?', 'Yes, all five, every day.'],`);

// ─── 14. lib/finish-sets.js ─────────────────────────────────────────────────
edit('lib/finish-sets.js',
  `  { name: 'Countries', cat: 'Geography', keys: ['atlas', 'flank', 'ping'] },`,
  `  { name: 'Countries', cat: 'Geography', keys: ['atlas', 'flank', 'ping', 'passport'] },`);

// ─── 15. lib/circuits.js: the circuit tile, and the lead swap ───────────────
edit('lib/circuits.js',
  `export const PRICE_RUN_GAMES = ['pricer', 'dealer', 'realtor', 'agent', 'curator'];
export const RUN_ENGINES = { quiz: RUN_GAMES, jam: JAM_RUN_GAMES, price: PRICE_RUN_GAMES };`,
  `export const PRICE_RUN_GAMES = ['pricer', 'dealer', 'realtor', 'agent', 'curator'];
// Passport (owner, 2026-10-03): ONE daily that is already a five-round run
// (app/passport/PassportClient.jsx), scored out of 50, so its engine serves
// exactly itself. It is the one SOLO circuit: a tile on the shelf like Price
// Check, with a roster of one. isSoloCircuit is what lets the two-game floors
// (the verifier, the trophy roster, /circuits) admit it and nothing else.
export const PASSPORT_RUN_GAMES = ['passport'];
export const RUN_ENGINES = { quiz: RUN_GAMES, jam: JAM_RUN_GAMES, price: PRICE_RUN_GAMES, passport: PASSPORT_RUN_GAMES };
export function isSoloCircuit(id) {
  const c = circuitById(id);
  return !!(c && c.solo);
}`);
edit('lib/circuits.js',
  `    keys: ['pricer', 'dealer', 'realtor', 'agent', 'curator'],   // 60 x 5 est = 300
    trophy: { name: 'Sold', tier: 'bronze', icon: 'Tag' },
  },`,
  `    keys: ['pricer', 'dealer', 'realtor', 'agent', 'curator'],   // 60 x 5 est = 300
    trophy: { name: 'Sold', tier: 'bronze', icon: 'Tag' },
  },
  {
    id: 'passport',
    name: 'Passport',
    // NEW on 2026-10-03 (owner). One mystery country in five
    // rounds, at its own address (mindloftdaily.com/passport). It is a
    // Geography daily AND a circuit tile, and it takes the Daily Five's place
    // in the lead three on the home and in the first-visit pins.
    lead: 4,
    blurb: 'One mystery country in five rounds: a landmark, its flag, its neighbors, its capital and its size. Score out of 50.',
    share: {
      invite: "One mystery country a day: its landmark, flag, neighbors, capital and size. One score out of 50, and a real passport to travel home on.",
      result: "One country, one score. Which passport do you get?",
    },
    run: true,
    engine: 'passport',
    path: '/passport',
    solo: true,
    // What the shelf's eyebrow says in place of "1 games".
    unit: '5 rounds',
    // The board is the daily's own score out of 50, clock as the tiebreak.
    score: 'correct',
    keys: ['passport'],   // 240 est
    trophy: { name: 'Frequent Flyer', tier: 'bronze', icon: 'Plane' },
  },`);
edit('lib/circuits.js',
  `const LEAD_ORDER = ['pricecheck', 'gauntlet', MARQUEE_ID, 'sudoku'];   // owner, 2026-10-03: Price Check leads`,
  `const LEAD_ORDER = ['pricecheck', 'gauntlet', 'passport', MARQUEE_ID, 'sudoku'];   // owner, 2026-10-03: Price Check leads; Passport takes the Five's third place`);

// ─── 16. lib/trophy-defs.js ─────────────────────────────────────────────────
edit('lib/trophy-defs.js',
  `  { id: 'circuit-pricecheck', name: 'Sold', desc: 'Price all five tags of Price Check on the same day.', tier: 'bronze', group: 'circuits', icon: 'Tag' },`,
  `  { id: 'circuit-pricecheck', name: 'Sold', desc: 'Price all five tags of Price Check on the same day.', tier: 'bronze', group: 'circuits', icon: 'Tag' },\n  { id: 'circuit-passport', name: 'Frequent Flyer', desc: 'Play all five rounds of Passport.', tier: 'bronze', group: 'circuits', icon: 'Plane' },`);

// ─── 17. the two-game floors admit the solo circuit ─────────────────────────
edit('lib/quiz-trophies.js', `import { ALL_CIRCUITS, circuitKeysFor } from './circuits.js';`, `import { ALL_CIRCUITS, circuitKeysFor, isSoloCircuit } from './circuits.js';`);
edit('app/circuits/page.js', `import { ALL_CIRCUITS, DISPLAY_CIRCUITS, circuitGamesFor, circuitPageHref, isMarquee } from '@/lib/circuits';`, `import { ALL_CIRCUITS, DISPLAY_CIRCUITS, circuitGamesFor, circuitPageHref, isMarquee, isSoloCircuit } from '@/lib/circuits';`);
edit('lib/quiz-trophies.js',
  `ALL_CIRCUITS.map((c) => [c.id, circuitKeysFor(c.id, iso)]).filter(([, k]) => k.length >= 2)`,
  `ALL_CIRCUITS.map((c) => [c.id, circuitKeysFor(c.id, iso)]).filter(([id, k]) => k.length >= 2 || (k.length === 1 && isSoloCircuit(id)))`);
edit('app/circuits/page.js',
  `  }).filter((r) => r.names.length >= 2);`,
  `  }).filter((r) => r.names.length >= 2 || (r.names.length === 1 && isSoloCircuit(r.id)));`);
edit('scripts/verify-circuits.mjs',
  `  if (!Array.isArray(c.keys) || c.keys.length < 2) fails.push(\`\${c.id}: needs at least 2 games to be a run\`);`,
  `  if (!Array.isArray(c.keys) || c.keys.length < (c.solo ? 1 : 2)) fails.push(\`\${c.id}: needs at least 2 games to be a run\`);\n  if (c.solo && (c.keys.length !== 1 || !c.run || !c.path)) fails.push(\`\${c.id}: a solo circuit is one daily that is its own run, at its own path\`);`);
edit('scripts/verify-circuits.mjs',
  `  if (live.length < 2) {`,
  `  if (live.length < (c.solo ? 1 : 2) && !(c.solo && !LAUNCHED(c.keys[0]))) {`);
edit('scripts/verify-circuits.mjs',
  `      const unit = runEngine(c.id) === 'price' ? PRICE_RUN_GAMES : RUN_GAMES;`,
  `      const unit = runEngine(c.id) === 'quiz' ? RUN_GAMES : (RUN_ENGINES[runEngine(c.id)] || RUN_GAMES);`);
edit('scripts/verify-circuits.mjs',
  `  niche: 150,\n`,
  `  niche: 150,\n  // Passport launched 2026-10-03 with no clock data: five rounds, each about\n  // a Flank or a Focus in length, so estimated at four minutes.\n  passport: 240,\n`);
edit('scripts/verify-circuits.mjs',
  `import { SHARE_HOST } from '../lib/site.js';`,
  `import { SHARE_HOST } from '../lib/site.js';\nimport { PUZZLES as PASSPORT_PUZZLES } from '../app/passport/puzzles.js';\n// A solo circuit before its daily's first day has no live game yet, which is\n// launch, not a broken roster.\nconst LAUNCHED = (k) => k !== 'passport' || PASSPORT_PUZZLES.some((p) => p.live <= new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }));`);

// ─── 18. the home: Passport takes the Five's place in the lead three ────────
edit('app/today/StageToday.jsx',
  `const CIRC_LEAD = ['pricecheck', 'gauntlet', 'five'];`,
  `const CIRC_LEAD = ['pricecheck', 'gauntlet', 'passport'];   // owner, 2026-10-03: Passport replaces the Daily Five`);
edit('app/today/StageToday.jsx',
  `  const pinCircs = useMemo(() => ['pricecheck', 'gauntlet', 'five']`,
  `  // Passport took the Five's place on 2026-10-03 (owner).\n  const pinCircs = useMemo(() => ['pricecheck', 'gauntlet', 'passport']`);
edit('app/today/StageToday.jsx',
  `      return { id: c.id, name: c.name, blurb: c.blurb || '', games, n, pop, hue: hueFor(games[0].cat) };`,
  `      return { id: c.id, name: c.name, blurb: c.blurb || '', unit: c.unit || '', games, n, pop, hue: hueFor(games[0].cat) };`);
edit('app/today/StageToday.jsx',
  `                  <span className="sty-pine">{c.games.length} games</span>`,
  `                  <span className="sty-pine">{c.unit || \`\${c.games.length} games\`}</span>`);
edit('app/today/TodayClient.jsx',
  `const LEAD_CIRCUITS = ['pricecheck', 'gauntlet', 'five'];   // the shelf's front three (owner, 2026-10-03)`,
  `const LEAD_CIRCUITS = ['pricecheck', 'gauntlet', 'passport'];   // the shelf's front three (owner, 2026-10-03; Passport replaced the Five)`);

// ─── 19. CLAUDE.md ──────────────────────────────────────────────────────────
edit('CLAUDE.md',
  `| Flank | a giant country with 8 to 14 borders instead of the weekday ramp's 1 to 7, and a fourth strike to spend (from launch, 2026-08-28) |`,
  `| Flank | a giant country with 8 to 14 borders instead of the weekday ramp's 1 to 7, and a fourth strike to spend (from launch, 2026-08-28) |\n| Passport | a country with eight or more land neighbors for the borders round (from launch, 2026-10-03) |`);
{
  const p = path.join(root, 'CLAUDE.md');
  const src = fs.readFileSync(p, 'utf8');
  const marker = '## Passport (`/passport`): the daily geography run';
  if (!src.includes(marker)) {
    fs.writeFileSync(p, src.replace(/\s*$/, '\n') + `
${marker} (launched 2026-10-04)

One mystery country a day, played in five rounds of 10 points, one score out of 50, ending on a
real passport. Key/route \`passport\`, category **Geography**, \`miss: null\`, legacy accent
\`#9f1239\` / \`#fda4af\`. It is BOTH a daily and a circuit tile (\`lib/circuits.js\` id
\`passport\`, \`solo: true\`, engine \`passport\`, path \`/passport\`, score \`correct\`), and it took
the Daily Five's place in the home's lead three (CIRC_LEAD, pinCircs, TodayClient LEAD_CIRCUITS,
LEAD_ORDER) on 2026-10-03. Wired by \`scripts/wire-passport.mjs\` (anchored on the Flank rows).
Premiere window 2026-10-03 to 10-07. Share card \`public/og/passport.png\` from
\`scripts/bake-og.mjs passport\`.

- **Rounds** (\`lib/passport.js\`): Landmark (a Commons photo zoomed 5.2x, 3.2x, 1.9x, 1x; 10/8/5/3
  for the country named at each frame), Flag (colors, layout, then the real flag; 10 less 3 a miss,
  never below 1), Borders (share of land neighbors named, out of 10, three strikes; island days name
  the nearest countries across the water instead), Capital (a pin on a baked map; full marks within
  one step, a point off per step, the step scaling with the country's size), Numbers (five
  bigger-or-smaller land-area calls, 2 points each). The country stays hidden until the landmark
  round ends.
- **The ladder** (owner): one real passport per inhabited continent in true Henley Passport Index
  2026 order: Sierra Leone 0+, Mexico 30+, Brazil 38+, Australia 44+, Switzerland 48+, Japan 50. The
  share line names the passport and the round scores, never the day's country.
- **The bank**: \`scripts/passport-facts.mjs\` (schedule, landmarks, flags, capitals),
  \`scripts/passport-factbook.mjs\` (areas and capital points, CIA World Factbook), borders from
  \`app/flank/borders.js\`. \`node scripts/gen-passport.mjs\` writes \`app/passport/puzzles.js\` (the light
  index) and \`app/passport/days.js\` (the full days, maps baked as SVG paths in a rotated Mercator,
  which needs \`d3-geo topojson-client world-atlas\` installed with \`--no-save\`). Stocked 31 days
  2026-10-03 to 2026-11-02. \`scripts/verify-passport.mjs\` checks it. Sundays are countries with 8+ neighbors.
- The page resolves the day on the server and ships only that day, with the Commons title
  stripped; the photo comes from \`/api/passport/img?n=\`, which refuses a day not yet live. Flags are
  flag-icons SVGs (MIT) in \`public/passport/flags/\`.
`);
    applied++;
  } else skipped++;
}

console.log(`wire-passport: ${applied} edits applied, ${skipped} already present`);
