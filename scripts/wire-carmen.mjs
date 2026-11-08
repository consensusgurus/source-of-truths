// scripts/wire-carmen.mjs: wires Carmen, the daily globe chase (owner,
// 2026-11-08), into every registry in one pass, beside Ping.
//
// Category Geography (green by default, owner) AND the Trivia shelf: the owner
// asked for it "in each", in each category's colour where it is shown there.
// The registry row carries `alsoCat: 'Trivia'`; the home groups it into both
// panes (app/today/StageToday.jsx), the Trivia landing page and slate list name
// it, and every other surface keeps its one registry `cat`.
//
// Points (SCORE_VIEW points), miss column 'Tips'. Sunday Edition: a sixth leg
// from the harder tiers. Premiere pop-up and the launch pin.
//
// Anchored: every anchor must match EXACTLY ONCE or the script throws, and an
// edit whose replacement is already present is skipped, so a re-run is safe.
//   node scripts/wire-carmen.mjs <dir>
import fs from 'fs';
import path from 'path';
const root = process.argv[2] || '.';
let applied = 0, skipped = 0;
const rd = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const wr = (f, s) => fs.writeFileSync(path.join(root, f), s);
function sub(f, anchor, repl) {
  const s = rd(f);
  if (s.includes(repl)) { skipped++; return; }
  const n = s.split(anchor).length - 1;
  if (n !== 1) throw new Error(`${f}: anchor matched ${n} times\n  ${anchor.slice(0, 160)}`);
  wr(f, s.replace(anchor, repl)); applied++;
}
function afterLine(f, marker, lines) {
  const s = rd(f);
  if (s.includes(lines[0])) { skipped++; return; }
  const parts = s.split('\n');
  const idx = parts.map((l, i) => (l.includes(marker) ? i : -1)).filter((i) => i >= 0);
  if (idx.length !== 1) throw new Error(`${f}: line marker matched ${idx.length} times: ${marker}`);
  parts.splice(idx[0] + 1, 0, lines.join('\n'));
  wr(f, parts.join('\n')); applied++;
}

const NAME = 'Carmen';
const TAG = 'Chase a thief across the globe';
const TAGLONG = 'Read the detective clues and pin the city she fled to on a 3D globe';
const HOW = 'A thief flies city to city. Read the tips, drop a pin on the globe where she went, and score by how close you land: five legs, six on Sundays. Pin the last one within 500 km to catch her.';
const BLURB = 'A thief is loose. Read the evidence, pin each city she flees to on a spinning globe, and catch her on the final leg.';
const COLOR = '#4d7c0f', NAVY = '#bef264', BG = '#ecfccb', BORDER = 'rgba(77,124,15,0.35)';

// 1. lib/daily-games.js: the row (with the Trivia shelf), points, the premiere
afterLine('lib/daily-games.js', "{ key: 'ping', miss: 'Guesses', name: 'Ping', cat: 'Geography',", [
  `  { key: 'carmen', miss: 'Tips', name: '${NAME}', cat: 'Geography', alsoCat: 'Trivia', tag: '${TAG}', tagLong: '${TAGLONG}', how: '${HOW}', color: '${COLOR}', colorNavy: '${NAVY}' },`]);
sub('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n  { key: 'carmen', from: '2026-11-08', until: '2026-11-12' },\n`);
sub('lib/daily-games.js', `  passport: { v: 'points' }, potluck: { v: 'points' },`, `  passport: { v: 'points' }, potluck: { v: 'points' }, carmen: { v: 'points' },`);
sub('lib/challenge-metric.js', `  hands: { unit: 'points', one: 'point', dir: 'high' },\n`, `  hands: { unit: 'points', one: 'point', dir: 'high' },\n  carmen: { unit: 'points', one: 'point', dir: 'high', say: 'scored' },\n`);

// 2. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['mercurytoo', `, `const LAUNCH_PIN = { keys: ['carmen', 'mercurytoo', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['mercurytoo', `, `const LAUNCH_PIN = { keys: ['carmen', 'mercurytoo', `);
afterLine('app/DailyEndCard.jsx', "  ping:   { accent: '#0284c7', badgeBg: '#0284c7', badgeInk: T.white, Fin: Globe },", [
  `  carmen: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: Globe },`]);
afterLine('app/DailyEndCard.jsx', "{ key: 'ping',   cat: 'geography', name: 'Ping',", [
  `  { key: 'carmen', cat: 'geography', name: '${NAME}', tag: '${TAG}', blurb: '${BLURB}', href: '/carmen' },`]);

// 3. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'ping', href: '/ping', name: 'Ping'", [
  `  { key: 'carmen', href: '/carmen', name: '${NAME}', tag: 'chase a thief across the globe', store: 'sot_carmen_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },`]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'ping', href: '/ping', name: 'Ping', tag: 'Find the secret city'", [
  `  { key: 'carmen', href: '/carmen', name: '${NAME}', tag: '${TAG}', img: '/games/btn-carmen.png' },`]);
sub('app/DailyGamesGrid.jsx', `keys: ['atlas', 'flank', 'span', 'ping'] },`, `keys: ['atlas', 'flank', 'span', 'ping', 'carmen'] },`);
sub('app/DailyGamesGrid.jsx', `'tape', 'bacon', 'redact', 'dating', 'extra'] },`, `'tape', 'bacon', 'redact', 'dating', 'extra', 'carmen'] },`);
afterLine('app/DailyStrip.jsx', "{ key: 'ping', href: '/ping', name: 'Ping', img: '/games/btn-ping.png'", [
  `  { key: 'carmen', href: '/carmen', name: '${NAME}', img: '/games/btn-carmen.png', store: 'sot_carmen_day', tag: "${TAG}" , cat: 'Geography', alsoCat: 'Trivia' },`]);
sub('app/DailyStrip.jsx', ` roll: '#86efac',`, ` roll: '#86efac', carmen: '#c4e08a',`);
sub('app/DailyStrip.jsx', ` roll: '#166534',`, ` roll: '#166534', carmen: '${COLOR}',`);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as PING } from '../ping/puzzles';`,
  `import { PUZZLES as PING } from '../ping/puzzles';\nimport { PUZZLES as CARMEN_FULL } from '../carmen/puzzles';`);
afterLine('app/archive/page.js', `import { PUZZLES as CARMEN_FULL } from '../carmen/puzzles';`, [
  `// Carmen's rows carry whole case files; the archive needs only the frame.\nconst CARMEN = CARMEN_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`]);
afterLine('app/archive/page.js', "{ key: 'ping', name: 'Ping', path: '/ping'", [
  `  { key: 'carmen', name: '${NAME}', path: '/carmen', tag: '${TAG}', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: CARMEN },`]);

// 5. the daily puzzle maps, the Sunday slate included (Sunday Edition)
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_ping } from '@/app/ping/puzzles';`,
    `import { PUZZLES as P_ping } from '@/app/ping/puzzles';\nimport { PUZZLES as P_carmen } from '@/app/carmen/puzzles';`);
  sub(f, ` ping: P_ping,`, ` ping: P_ping, carmen: P_carmen,`);
}

// 6. alternations, rails, catalog, loft, Sunday registry
sub('app/api/quiz/daily-status/route.js', `|cipher|ping|warmer|`, `|cipher|ping|carmen|warmer|`);
sub('app/quizzes/QuizHomeClient.jsx', `|cipher|ping|warmer|`, `|cipher|ping|carmen|warmer|`);
sub('app/DailySlateRail.jsx', `'cipher', 'ping', 'warmer',`, `'cipher', 'ping', 'carmen', 'warmer',`);
sub('lib/quiz-catalog.js', `'cipher', 'ping', 'warmer',`, `'cipher', 'ping', 'carmen', 'warmer',`);
sub('lib/loft.js', `'paths', 'ping', 'plot',`, `'paths', 'ping', 'carmen', 'plot',`);
sub('lib/sunday-editions.js', `  'extra', 'carve', 'stet', 'ping', 'jester', 'sworn',`, `  'extra', 'carve', 'stet', 'ping', 'carmen', 'jester', 'sworn',`);
sub('lib/sunday-editions.js', `//   ping    a trickier, more out-of-the-way city\n`, `//   ping    a trickier, more out-of-the-way city\n//   carmen  a sixth leg, and the harder cities (lib/carmen-engine.js TIERS_BY_DOW)\n`);
sub('lib/daily-families.js', `  ['span', 'flank', 'ping', 'atlas'],`, `  ['span', 'flank', 'ping', 'atlas', 'carmen'],`);
sub('lib/daily-difficulty.js', `herd: 1, jig: 1, squash: 1, hold: 2,`, `herd: 1, jig: 1, squash: 1, hold: 2,\n  carmen: 2, // a starting estimate (2026-11-08) until a week of plays rates it`);

// 6b. the miss column's singular, the Details blurb, the board preview
sub('lib/daily-row-stats.js', `  Clues: 'clue',\n`, `  Clues: 'clue',\n  Tips: 'tip',\n`);
sub('lib/game-blurbs.js', `  ping: 'Guess a city, learn the exact miles to the secret one, and home in on it guess by guess.',\n`, `  ping: 'Guess a city, learn the exact miles to the secret one, and home in on it guess by guess.',\n  carmen: 'Follow a thief city to city: read the detective tips and pin each city she flees to on a globe.',\n`);
sub('app/GamePreview.jsx', `  ping: Ping, span: () => <Globe />,`, `  ping: Ping, carmen: () => <Globe />, span: () => <Globe />,`);

// 7. skills, glyph
sub('lib/daily-skills.js', `flank: ['mem'],`, `flank: ['mem'], carmen: ['mem', 'ded'],`);
afterLine('lib/game-glyphs.js', "  ping: 'M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11zM12 8a2 2 0 1 0 .01 0', // a pin", [
  "  carmen: 'M12 3a9 9 0 1 0 .01 0M3.5 9h17M3.5 15h17M12 3c-3.2 3-3.2 15 0 18M12 3c3.2 3 3.2 15 0 18', // a globe"]);

// 8. finish sets (Geography has no daily groups: five games or fewer)
sub('lib/finish-sets.js', `  { name: 'Countries', cat: 'Geography', keys: ['atlas', 'flank', 'ping'] },`,
  `  { name: 'Countries', cat: 'Geography', keys: ['atlas', 'flank', 'ping'] },\n  { name: 'Cities of the world', cat: 'Geography', keys: ['carmen', 'ping', 'atlas'] },`);

// 9. the landing pages: Geography (its own) and Trivia (the second shelf)
const PC = 'lib/puzzle-categories.js';
sub(PC, `description: 'Four free daily geography games: guess a secret city by distance,`, `description: 'Five free daily geography games: chase a thief across a 3D globe, guess a secret city by distance,`);
sub(PC, `lede: 'Four geography games, one new puzzle in each every day. Home in on a secret city`, `lede: 'Five geography games, one new puzzle in each every day. Chase a thief across a spinning globe from clues, home in on a secret city`);
sub(PC, `keys: ['ping', 'span', 'flank', 'atlas'],`, `keys: ['carmen', 'ping', 'span', 'flank', 'atlas'],`);
sub(PC, `generic: { ping: 'Guess the city by distance', span: 'Border chain',`, `generic: { carmen: 'Globe chase', ping: 'Guess the city by distance', span: 'Border chain',`);
sub(PC, `      'Atlas is the geography gauntlet: five rounds`, `      'Carmen is a chase: a thief flies city to city, and each leg you read detective tips and drop a pin on a 3D globe, scoring by how close you land. Catch her within 500 km on the last leg.',\n      'Atlas is the geography gauntlet: five rounds`);
sub(PC, `as the maps draw them today.'],\n      ['Are they free?', 'Yes, all four, every day.'],`, `as the maps draw them today.'],\n      ['Are they free?', 'Yes, all five, every day.'],`);
sub(PC, `['Sunday Edition', 'Flank hands you a giant with eight or more borders and a fourth strike; Span adds a country to route through or avoid.'],`,
  `['Sunday Edition', 'Flank hands you a giant with eight or more borders and a fourth strike; Span adds a country to route through or avoid; Carmen runs six legs through harder cities.'],`);
sub(PC, `'clade', 'dossier', 'tape', 'bacon', 'redact'],\n    generic: {\n      streak:`, `'clade', 'dossier', 'tape', 'bacon', 'redact', 'carmen'],\n    generic: {\n      streak:`);
sub(PC, `bacon: 'Six degrees of Kevin Bacon', redact: 'Uncover the article',`, `bacon: 'Six degrees of Kevin Bacon', redact: 'Uncover the article', carmen: 'Geography detective chase',`);
sub(PC, `picture, headline, stock chart, movie link, year and ranking puzzles.`, `picture, headline, stock chart, movie link, globe chase, year and ranking puzzles.`);

// 10. the game's own doc
{
  const f = 'docs/claude/games-other.md';
  const src = rd(f);
  const marker = '## Carmen (`/carmen`): the daily globe chase (launched 2026-11-08)';
  if (!src.includes(marker)) {
    wr(f, src.replace(/\s*$/, '\n') + `
${marker}

Owner idea (2026-11-08): an "amazing" geography trivia game about locating places on a globe, modeled on
the Where in the World format, named Carmen. ORIGINAL IP ONLY: rotating original suspects (The Magpie, The
Silver Fox, ...) and loot; never the Sandiego surname, the red coat and fedora look, or anything from the
show, and keep "Sandiego" out of metadata. Key/route \`carmen\`, category **Geography** with
\`alsoCat: 'Trivia'\` (owner: "place it in each", green by default), \`miss: 'Tips'\`, SCORE_VIEW points.
Wired by \`scripts/wire-carmen.mjs\` (beside Ping). Skills Memory, Deduction.

- **Rules** (\`lib/carmen-engine.js\`, shared by client, generator, verifier): five legs, six on the Sunday
  Edition. A leg scores 1000 within 50 km, else round(1000 * exp(-km/2000)), minus 150 per extra tip, floor 0.
  Caught if the last pin is within 500 km. Rank ladder Rookie, Beat Cop, Gumshoe, Inspector, Sherlock Holmes
  (owner: Sherlock Holmes on top) at fifths of the day's maximum.
- **Tips** (owner, 2026-11-08): Evidence (free), Witness, Informant, easiest last, detective voice plus geography,
  and EVERY TIP POINTS TO THE CITY, not just its country: keep the country detail and add a city-only item.
  Never the city's name; tips 1 and 2 never the country's.
- **Pool** \`scripts/carmen-pool.json\`: 113 cities, three tips each, tier 1 to 3, authored in four regional
  passes and fact-checked by a separate reviewer (the content-review gate; ledger entry \`carmen\`).
- **Bank** \`scripts/gen-carmen.mjs\` (deterministic, append-only, frozen past): hops >= 800 km and across a
  border, no city back within 14 days, never the same day's Ping city, suspect and loot never repeat on
  consecutive days. \`scripts/verify-carmen.mjs\` rechecks every rule. Bank 2026-11-08 to 2026-12-13.
- **Look** (owner pick of three mockups): Noir, black water and lime land (\`lib/carmen-globe.js\`, d3-geo
  orthographic, land from \`public/carmen/world-110m.json\`). Run-style interstitials: the case file with an
  OPEN stamp, a leg card per leg, the flight drawn with the camera following, ring bursts and a grade stamp,
  then "Caught!" or "She got away" and a dark light show (stamp, leg bars, total, rank ladder) before the
  standard ending. The shell holds the ending (SimpleDaily \`GAME.holdMs\`) and the board releases it.
- **SimpleDaily gained four optional GAME hooks for it** (no other game changes): \`holdMs\`, \`title\`,
  \`metric\`, and boardProps \`held\` / \`release\` / \`gaveUp\`.
`);
    applied++;
  } else skipped++;
}

console.log(`wire-carmen: ${applied} edits applied, ${skipped} already present`);
