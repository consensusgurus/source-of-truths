// scripts/wire-six.mjs: wires the six dailies of 2026-11-01 into every
// registry. Swap, Slide, Spin and Connect are Logic and sit beside Jig; Fill is Word
// and sits beside Arcos; Pairs is Cards and sits beside Mahj. Placement follows
// "Placing a new daily" in docs/claude/daily-authoring.md.
//
// Anchored edits: every anchor must match EXACTLY ONCE or the script throws, and
// an edit whose insertion is already present is skipped, so a re-run is safe.
//   node scripts/wire-six.mjs <dir>
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

const G = {
  swap: { name: 'Swap', cat: 'Logic', miss: 'Swaps', tag: 'Swap the photo back together', tagLong: 'A photo in squares, every one out of place; swap them home', how: 'A new photograph every day, cut into a 6x6 grid with every square out of place. Tap two squares to swap them, and fix the picture in as few swaps as you can. Fewest swaps, then the clock.', color: '#9a3412', navy: '#fdba74', bg: '#ffedd5', border: 'rgba(154,52,18,0.4)', fin: 'Puzzle', blurb: 'A photograph cut into squares, every one out of place. Swap two at a time until the picture is whole, in as few swaps as you can.', unit: 'swaps', one: 'swap', glyph: "'M4 4h7v7H4zM13 13h7v7h-7zM14 7h4l-2-2M10 17H6l2 2',  // two squares and the arrows that trade them" },
  slide: { name: 'Slide', cat: 'Logic', miss: 'Moves', tag: 'The sliding photo puzzle', tagLong: 'A 5x5 photo with one square missing; slide it back together', how: 'The 15-puzzle grown to a 5x5 photograph. One square is missing; slide the others through the gap until the picture is whole. Fewest moves, then the clock.', color: '#1e40af', navy: '#93c5fd', bg: '#dbeafe', border: 'rgba(30,64,175,0.4)', fin: 'Puzzle', blurb: 'The classic sliding puzzle on a 5x5 photograph. Slide the squares through the one gap until the picture is whole.', unit: 'moves', one: 'move', glyph: "'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM16 17h4M18 15l2 2-2 2',  // three squares, a gap and the slide into it" },
  spin: { name: 'Spin', cat: 'Logic', miss: 'Taps', tag: 'Turn every square straight', tagLong: 'A photo in squares, nearly every one turned; set them straight', how: 'A new photograph every day, cut into a 6x6 grid with nearly every square turned. Tap a square to turn it a quarter clockwise until the whole picture is straight. Fewest taps, then the clock.', color: '#6d28d9', navy: '#c4b5fd', bg: '#ede9fe', border: 'rgba(109,40,217,0.4)', fin: 'Puzzle', blurb: 'A photograph cut into squares, nearly every one turned. Tap each round, a quarter at a time, until the picture is straight.', unit: 'taps', one: 'tap', glyph: "'M5 5h14v14H5zM12 2a10 10 0 0 1 10 10M22 12l-2-2M22 12l2-2',  // a square and the quarter turn round it" },
  connect: { name: 'Connect', cat: 'Logic', miss: null, tag: 'Join the dots, fill the board', tagLong: 'Join every pair of dots without crossing, using every square', how: 'Pairs of matching dots on a board of 9x9 up to 12x12. Join each pair with one line, lines never cross, and every square has to be used. One solution; the clock decides.', color: '#be123c', navy: '#fda4af', bg: '#ffe4e6', border: 'rgba(190,18,60,0.4)', fin: 'Puzzle', blurb: 'Pairs of matching dots on a big board. Join each pair with one line, never crossing, until every square is used.', glyph: "'M5 5h0M19 19h0M5 5v7h7v7h7M19 5h0M5 19h0M19 5v4h-6',  // two pairs of dots and the lines between them" },
  fill: { name: 'Fill', cat: 'Word', miss: null, tag: 'Fit every word in the grid', tagLong: 'An empty crossword grid and a themed word list; fit them all', how: 'An empty crossword-shaped grid and 16 to 18 words from one theme. Fit every word in; the lengths and the crossings are the only clues, and there is exactly one way. The clock decides.', color: '#047857', navy: '#6ee7b7', bg: '#d1fae5', border: 'rgba(4,120,87,0.4)', fin: 'Trophy', blurb: 'An empty crossword grid and a list of themed words. Fit every one in, with the lengths and crossings as your only clues.', glyph: "'M3 9h18v5H3zM9 3h5v18H9zM3 9v5M21 9v5',  // an across and a down crossing in an empty grid" },
  pairs: { name: 'Pairs', cat: 'Cards', miss: 'Turns', tag: 'Concentration with a real deck', tagLong: '36 cards face down; pair them by rank and colour', how: 'Thirty-six playing cards face down. Turn two at a time and find every pair: the same rank in the same colour. Fewest turns, then the clock.', color: '#b91c1c', navy: '#fca5a5', bg: '#fee2e2', border: 'rgba(185,28,28,0.4)', fin: 'Layers', blurb: 'Thirty-six cards face down. Turn two at a time and pair each card with its twin, same rank and colour, in the fewest turns.', unit: 'turns', one: 'turn', glyph: "'M3 6h8v13H3zM13 5h8v13h-8zM7 12.5h0M17 11.5h0',  // two cards face up, a pair" },
};
const LOGIC = ['swap', 'slide', 'spin', 'connect'];
const ALL = Object.keys(G);
const q = (s) => s.replace(/'/g, "\\'");
const row = (k) => { const g = G[k]; return `  { key: '${k}', miss: ${g.miss ? `'${g.miss}'` : 'null'}, name: '${g.name}', cat: '${g.cat}', tag: '${q(g.tag)}', tagLong: '${q(g.tagLong)}', how: '${q(g.how)}', color: '${g.color}', colorNavy: '${g.navy}' },`; };

// 1. lib/daily-games.js: the rows, the premieres, the solve-only set
afterLine('lib/daily-games.js', "{ key: 'jig', miss: null, name: 'Jig', cat: 'Logic'", LOGIC.map(row));
afterLine('lib/daily-games.js', "{ key: 'arcos', miss: null, name: 'Arcos', cat: 'Word'", [row('fill')]);
afterLine('lib/daily-games.js', "{ key: 'mahj', miss: null, name: 'Mahj', cat: 'Cards'", [row('pairs')]);
sub('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n${ALL.map((k) => `  { key: '${k}', from: '2026-11-01', until: '2026-11-05' },`).join('\n')}\n`);
sub('lib/daily-games.js', `'sixes', 'sums', 'snug', 'jig',`, `'sixes', 'sums', 'snug', 'jig', 'swap', 'slide', 'spin', 'connect', 'fill', 'pairs',`);

// 2. Sunday Editions: all six run one
sub('lib/sunday-editions.js', `'snug', 'jig',`, `'snug', 'jig', 'swap', 'slide', 'spin', 'connect',`);
sub('lib/sunday-editions.js', `'scram', 'arcos',`, `'scram', 'arcos', 'fill',`);
sub('lib/sunday-editions.js', `'cell', 'mahj',`, `'cell', 'mahj', 'pairs',`);
afterLine('lib/sunday-editions.js', '//   arcos   five- and six-letter hidden words', [
  '//   fill    22 words on a board up to 17x17, against 16 to 18 on 15x15',
  '//   swap    a 7x7 photo, against 6x6',
  '//   slide   a 6x6 photo, against 5x5',
  '//   spin    an 8x8 photo, against 6x6',
  '//   connect a 12x12 board, the top of a ramp that runs 9x9 on Monday to 11x11 on Saturday',
  '//   pairs   48 cards (24 pairs) on an 8x6 table, against 36',
]);

// 3. end card, launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: [${ALL.map((k) => `'${k}'`).join(', ')}, `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: [${ALL.map((k) => `'${k}'`).join(', ')}, `);
afterLine('app/DailyEndCard.jsx', "  mahj: { accent: '#a21caf', badgeBg: '#a21caf', badgeInk: T.white, Fin: Layers },",
  ALL.map((k) => `  ${k}: { accent: '${G[k].color}', badgeBg: '${G[k].color}', badgeInk: T.white, Fin: ${G[k].fin} },`));
const ecCat = { Logic: 'logic', Word: 'word', Cards: 'cards' };
afterLine('app/DailyEndCard.jsx', "{ key: 'mahj',  cat: 'cards',     name: 'Mahj',",
  ALL.map((k) => `  { key: '${k}', cat: '${ecCat[G[k].cat]}', name: '${G[k].name}', tag: '${q(G[k].tag)}', blurb: '${q(G[k].blurb)}', href: '/${k}' },`));

// 4. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'mahj', href: '/mahj'",
  ALL.map((k) => `  { key: '${k}', href: '/${k}', name: '${G[k].name}', tag: '${q(G[k].tag.toLowerCase())}', store: 'sot_${k}_day', accent: '${G[k].color}', bg: '${G[k].bg}', border: '${G[k].border}' },`));
afterLine('app/DailyGamesGrid.jsx', "{ key: 'mahj', href: '/mahj'",
  ALL.map((k) => `  { key: '${k}', href: '/${k}', name: '${G[k].name}', tag: '${q(G[k].tag)}', img: '/games/btn-${k}.png' },`));
sub('app/DailyGamesGrid.jsx', `'snug', 'jig',`, `'snug', 'jig', 'swap', 'slide', 'spin', 'connect',`);
sub('app/DailyGamesGrid.jsx', `'scour', 'arcos',`, `'scour', 'arcos', 'fill',`);
sub('app/DailyGamesGrid.jsx', `'cell', 'mahj',`, `'cell', 'mahj', 'pairs',`);
afterLine('app/DailyStrip.jsx', "{ key: 'mahj', href: '/mahj'",
  ALL.map((k) => `  { key: '${k}', href: '/${k}', name: '${G[k].name}', img: '/games/btn-${k}.png', store: 'sot_${k}_day', tag: "${G[k].tag}" , cat: '${G[k].cat}' },`));
sub('app/DailyStrip.jsx', `const ACCENTS = { `, `const ACCENTS = { ${ALL.map((k) => `${k}: '${G[k].navy}'`).join(', ')}, `);
sub('app/DailyStrip.jsx', `const TCOL = { `, `const TCOL = { ${ALL.map((k) => `${k}: '${G[k].color}'`).join(', ')}, `);

// 5. archive
sub('app/archive/page.js', `import { PUZZLES as MAHJ_FULL } from '../mahj/puzzles';`,
  `import { PUZZLES as MAHJ_FULL } from '../mahj/puzzles';\n${ALL.map((k) => `import { PUZZLES as ${k.toUpperCase()}_FULL } from '../${k}/puzzles';`).join('\n')}`);
afterLine('app/archive/page.js', 'const MAHJ = MAHJ_FULL.map(',
  ALL.map((k) => `const ${k.toUpperCase()} = ${k.toUpperCase()}_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`));
afterLine('app/archive/page.js', "{ key: 'mahj', name: 'Mahj', path: '/mahj'",
  ALL.map((k) => `  { key: '${k}', name: '${G[k].name}', path: '/${k}', tag: '${q(G[k].tag)}', accent: '${G[k].color}', bg: '${G[k].bg}', border: '${G[k].border}', src: ${k.toUpperCase()} },`));

// 6. the four puzzle-map registries
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_mahj } from '@/app/mahj/puzzles';`,
    `import { PUZZLES as P_mahj } from '@/app/mahj/puzzles';\n${ALL.map((k) => `import { PUZZLES as P_${k} } from '@/app/${k}/puzzles';`).join('\n')}`);
  sub(f, `mahj: P_mahj,`, `mahj: P_mahj, ${ALL.map((k) => `${k}: P_${k},`).join(' ')}`);
}

// 7. alternations, rails, catalog, loft
for (const f of ['app/api/quiz/daily-status/route.js', 'app/quizzes/QuizHomeClient.jsx']) {
  sub(f, `|snug|jig|`, `|snug|jig|swap|slide|spin|connect|`);
  sub(f, `|scram|arcos|`, `|scram|arcos|fill|`);
  sub(f, `|cell|mahj|`, `|cell|mahj|pairs|`);
}
for (const f of ['app/DailySlateRail.jsx', 'lib/quiz-catalog.js', 'lib/loft.js']) {
  sub(f, `'snug', 'jig',`, `'snug', 'jig', 'swap', 'slide', 'spin', 'connect',`);
  sub(f, `'scram', 'arcos',`, `'scram', 'arcos', 'fill',`);
  sub(f, `'cell', 'mahj',`, `'cell', 'mahj', 'pairs',`);
}

// 8. skills, difficulty, challenge metric, glyphs
sub('lib/daily-skills.js', `snug: ['spa'], jig: ['spa'],`, `snug: ['spa'], jig: ['spa'], swap: ['spa', 'plan'], slide: ['spa', 'plan'], spin: ['spa'], connect: ['spa', 'ded'], fill: ['lang', 'ded'], pairs: ['mem'],`);
sub('lib/daily-difficulty.js', `  arcos: 1, // owner, 2026-10-18`, `  arcos: 1, // owner, 2026-10-18\n  swap: 2, slide: 3, spin: 2, connect: 3, fill: 3, pairs: 2, // launch guesses, 2026-11-01, until a week of plays rates them`);
for (const k of ['swap', 'slide', 'spin', 'pairs']) {
  sub('lib/challenge-metric.js', `  taire: { unit: 'moves', one: 'move', dir: 'low', solveFirst: true, field: 'guesses' },`,
    `  taire: { unit: 'moves', one: 'move', dir: 'low', solveFirst: true, field: 'guesses' },\n  ${k}: { unit: '${G[k].unit}', one: '${G[k].one}', dir: 'low', solveFirst: true, field: 'guesses' },`);
}
afterLine('lib/game-glyphs.js', "  mahj: 'M4 9h7v11H4z", ALL.map((k) => `  ${k}: ${G[k].glyph}`));

// 9. groups and finish sets
sub('lib/daily-groups.js', `{ name: 'Grid filling', cat: 'Logic', keys: ['duet', 'lamps', 'snug', 'jig'] },`,
  `{ name: 'Grid filling', cat: 'Logic', keys: ['duet', 'lamps', 'snug', 'connect'] },\n  { name: 'Photo puzzles', cat: 'Logic', keys: ['jig', 'swap', 'slide', 'spin'] },`);
sub('lib/daily-groups.js', `{ name: 'Crosswords', cat: 'Word', keys: ['emcee', 'encore', 'shards', 'arcos'] },`, `{ name: 'Crosswords', cat: 'Word', keys: ['emcee', 'encore', 'shards', 'arcos', 'fill'] },`);
sub('lib/daily-groups.js', `{ name: 'Card tables', cat: 'Cards', keys: ['shoe', 'crib', 'finesse'] },`, `{ name: 'Card tables', cat: 'Cards', keys: ['shoe', 'crib', 'finesse', 'pairs'] },`);
sub('lib/finish-sets.js', `{ name: 'Fit the pieces', cat: 'Logic', keys: ['snug', 'jig', 'jester', 'plot'] },`,
  `{ name: 'Fit the pieces', cat: 'Logic', keys: ['snug', 'jig', 'jester', 'plot'] },\n  { name: 'Photo puzzles', cat: 'Logic', keys: ['jig', 'swap', 'slide', 'spin'] },`);
sub('lib/finish-sets.js', `{ name: 'Path finding', cat: 'Logic', keys: ['paths', 'hedge', 'plot'] },`, `{ name: 'Path finding', cat: 'Logic', keys: ['paths', 'hedge', 'plot', 'connect'] },`);
sub('lib/finish-sets.js', `{ name: 'Word hunts', cat: 'Word', keys: ['lode', 'strata', 'scour', 'shards'] },`,
  `{ name: 'Word hunts', cat: 'Word', keys: ['lode', 'strata', 'scour', 'shards'] },\n  { name: 'Theme fits', cat: 'Word', keys: ['fill', 'scour', 'scram'] },`);
sub('lib/finish-sets.js', `{ name: 'Tiles and solitaire', cat: 'Cards', keys: ['mahj', 'taire', 'cell'] },`, `{ name: 'Tiles and solitaire', cat: 'Cards', keys: ['mahj', 'taire', 'cell', 'pairs'] },`);

console.log(`wire-six: ${applied} edits applied, ${skipped} already present`);
