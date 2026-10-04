// scripts/wire-clade-dossier-lamps.mjs — wires three dailies into every
// registry in one pass: Lamps (light-placement logic, Logic), Clade (guess
// the animal by its family tree, Trivia) and Dossier (five attributes on
// every guess, Trivia). They sit after Duet / Niche in every list.
//
// An ANCHORED script in the shape of scripts/wire-duet.mjs: every anchor must
// match EXACTLY ONCE or the script throws, and an edit whose replacement is
// already present is skipped, so a re-run after a partial push is safe.
//
//   node scripts/wire-clade-dossier-lamps.mjs <dir>
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
// Replace whole field lines inside one set block of lib/puzzle-sets.js.
function setBlock(name, fields) {
  const p = path.join(root, 'lib/puzzle-sets.js');
  let src = fs.readFileSync(p, 'utf8');
  const head = `    name: '${name}', slug:`;
  if (src.split(head).length - 1 !== 1) throw new Error(`puzzle-sets: block ${name} not found once`);
  const a = src.indexOf(head);
  const b = src.indexOf('\n  },', a);
  let blk = src.slice(a, b);
  const before = blk;
  for (const [k, v] of Object.entries(fields)) {
    if (k === 'how') {
      const re = /(    how: \[\n)      '.*',\n/;
      if (!re.test(blk)) throw new Error(`puzzle-sets ${name}: how line`);
      blk = blk.replace(re, (m, h) => `${h}      ${JSON.stringify(v).replace(/^"|"$/g, "'").replace(/'/g, (c, i, s) => (i === 0 || i === s.length - 1 ? "'" : "\\'"))},\n`);
    } else if (k === 'free') {
      const re = /\['Are they free\?', '.*'\],/;
      if (!re.test(blk)) throw new Error(`puzzle-sets ${name}: free line`);
      blk = blk.replace(re, `['Are they free?', '${v}'],`);
    } else {
      const re = new RegExp(`^    ${k}: '.*',$`, 'm');
      if (!re.test(blk)) throw new Error(`puzzle-sets ${name}: ${k}`);
      blk = blk.replace(re, `    ${k}: '${v.replace(/'/g, "\\'")}',`);
    }
  }
  if (blk === before) { skipped++; return; }
  fs.writeFileSync(p, src.slice(0, a) + blk + src.slice(b));
  applied++;
}

const G = {
  lamps: {
    Name: 'Lamps', cat: 'Logic', lc: 'logic', miss: 'null',
    TAG: 'Light every square',
    HOW: 'Place lamps on the white squares until every one is lit. A lamp shines along its row and column until it meets a wall, no lamp may shine on another, and a numbered wall touches exactly that many lamps. Tap a square to cycle it.',
    COLOR: '#9a6700', NAVY: '#fcd34d', BG: '#fdf3d7', BORDER: 'rgba(154,103,0,0.35)', FIN: 'Blocks',
    BLURB: 'Place lamps until every square is lit. No lamp may shine on another, and numbered walls say how many lamps touch them. Seven by seven early in the week, eight by eight from Thursday, ten by ten on Sundays.',
    SUN: 'a 10x10 board against the weekday 7x7 and 8x8',
    GLYPH: `'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z',  // a lamp`,
  },
  clade: {
    Name: 'Clade', cat: 'Trivia', lc: 'trivia', miss: `'Guesses'`,
    TAG: 'Guess the animal by its family tree',
    HOW: 'Name the hidden animal in eight guesses. Every guess shows the closest branch of the family tree it shares with the answer, so each one narrows the tree. Fewer guesses score more.',
    COLOR: '#0f6b6b', NAVY: '#5eead4', BG: '#e3f3f1', BORDER: 'rgba(15,107,107,0.35)', FIN: 'LayoutGrid',
    BLURB: 'One hidden animal and eight guesses. Every guess shows the closest branch of the family tree it shares with the answer. A rarer animal on Sundays.',
    SUN: 'a rarer animal, from the hardest tier of the list',
    GLYPH: `'M4 12h5M9 6v12M9 6h5M9 18h5M14 3v6M14 15v6M14 3h6M14 9h6M14 15h6M14 21h6',  // a branching tree`,
  },
  dossier: {
    Name: 'Dossier', cat: 'Trivia', lc: 'trivia', miss: `'Guesses'`,
    TAG: 'Five clues on every guess',
    HOW: 'Name the hidden president, element or US state in eight guesses. Every guess is compared with the answer on five facts: a match, higher or lower. Fewer guesses score more.',
    COLOR: '#5b3a8c', NAVY: '#c4b5fd', BG: '#efe9f7', BORDER: 'rgba(91,58,140,0.35)', FIN: 'LayoutGrid',
    BLURB: 'A hidden president, element or US state. Every guess is compared with the answer on five facts: a match, higher or lower. Eight guesses, six on Sundays.',
    SUN: 'six guesses instead of eight',
    GLYPH: `'M3 8h18v8H3zM6.6 8v8M10.2 8v8M13.8 8v8M17.4 8v8M4.4 12h.9',  // one guess, five cells`,
  },
};
const ORDER = ['lamps', 'clade', 'dossier'];
const lower = (s) => s[0].toLowerCase() + s.slice(1);
const rows = (f) => ORDER.map((k) => f(k, G[k])).join('\n');

// ─── 1. lib/daily-games.js ──────────────────────────────────────────────────
edit('lib/daily-games.js',
  `  { key: 'duet', miss: null, name: 'Duet', cat: 'Logic',`,
  `${rows((k, d) => `  { key: '${k}', miss: ${d.miss}, name: '${d.Name}', cat: '${d.cat}', tag: '${d.TAG}', how: '${d.HOW}', color: '${d.COLOR}', colorNavy: '${d.NAVY}' },`)}\n  { key: 'duet', miss: null, name: 'Duet', cat: 'Logic',`);
edit('lib/daily-games.js',
  `  { key: 'duet', from: '2026-10-03', until: '2026-10-07' },`,
  `  { key: 'duet', from: '2026-10-03', until: '2026-10-07' },\n${rows((k) => `  { key: '${k}', from: '2026-10-04', until: '2026-10-08' },`)}`);
edit('lib/daily-games.js', `'sixes', 'sums', 'snug', 'duet',`, `'sixes', 'sums', 'snug', 'duet', 'lamps',`);

// ─── 2. lib/sunday-editions.js ──────────────────────────────────────────────
edit('lib/sunday-editions.js',
  `//   duet    a 10x10 board against the weekday 6x6 and 8x8`,
  `//   duet    a 10x10 board against the weekday 6x6 and 8x8\n${rows((k, d) => `//   ${k.padEnd(7)} ${d.SUN}`)}`);
edit('lib/sunday-editions.js', `'junkyard', 'snug', 'duet',`, `'junkyard', 'snug', 'duet', 'lamps', 'clade', 'dossier',`);

// ─── 3. app/DailyEndCard.jsx + the daily-order pin ──────────────────────────
edit('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['lamps', 'clade', 'dossier', `);
edit('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['lamps', 'clade', 'dossier', `);
edit('app/DailyEndCard.jsx',
  `  duet: { accent: '#1a7f37',`,
  `${rows((k, d) => `  ${k}: { accent: '${d.COLOR}', badgeBg: '${d.COLOR}', badgeInk: T.white, Fin: ${d.FIN} },`)}\n  duet: { accent: '#1a7f37',`);
edit('app/DailyEndCard.jsx',
  `  { key: 'duet',   cat: 'logic',`,
  `${rows((k, d) => `  { key: '${k}',   cat: '${d.lc}',     name: '${d.Name}', tag: '${d.TAG}',   blurb: '${d.BLURB}', href: '/${k}' },`)}\n  { key: 'duet',   cat: 'logic',`);

// ─── 4. app/DailyGamesPromo.jsx ─────────────────────────────────────────────
edit('app/DailyGamesPromo.jsx',
  `  { key: 'duet', href: '/duet', name: 'Duet',`,
  `${rows((k, d) => `  { key: '${k}', href: '/${k}', name: '${d.Name}', tag: '${lower(d.TAG)}', store: 'sot_${k}_day', accent: '${d.COLOR}', bg: '${d.BG}', border: '${d.BORDER}' },`)}\n  { key: 'duet', href: '/duet', name: 'Duet',`);

// ─── 5. app/DailyGamesGrid.jsx ──────────────────────────────────────────────
edit('app/DailyGamesGrid.jsx',
  `  { key: 'duet', href: '/duet', name: 'Duet', tag:`,
  `${rows((k, d) => `  { key: '${k}', href: '/${k}', name: '${d.Name}', tag: '${d.TAG}', img: '/games/btn-${k}.png' },`)}\n  { key: 'duet', href: '/duet', name: 'Duet', tag:`);
edit('app/DailyGamesGrid.jsx', `'junkyard', 'snug', 'duet',`, `'junkyard', 'snug', 'duet', 'lamps',`);
edit('app/DailyGamesGrid.jsx', `'listed', 'niche', 'redact',`, `'listed', 'niche', 'clade', 'dossier', 'redact',`);

// ─── 6. app/DailyStrip.jsx ──────────────────────────────────────────────────
edit('app/DailyStrip.jsx',
  `  { key: 'duet', href: '/duet', name: 'Duet', img:`,
  `${rows((k, d) => `  { key: '${k}', href: '/${k}', name: '${d.Name}', img: '/games/btn-${k}.png', store: 'sot_${k}_day', tag: "${d.TAG}" , cat: '${d.cat}' },`)}\n  { key: 'duet', href: '/duet', name: 'Duet', img:`);
edit('app/DailyStrip.jsx', `duet: '#bef264', yose:`, `duet: '#bef264', ${ORDER.map((k) => `${k}: '${G[k].NAVY}'`).join(', ')}, yose:`);
edit('app/DailyStrip.jsx', `duet: '#1a7f37', yose:`, `duet: '#1a7f37', ${ORDER.map((k) => `${k}: '${G[k].COLOR}'`).join(', ')}, yose:`);

// ─── 7. app/daily/page.js ───────────────────────────────────────────────────
edit('app/daily/page.js',
  `import { PUZZLES as DUET_FULL } from '../duet/puzzles';`,
  `import { PUZZLES as DUET_FULL } from '../duet/puzzles';\n${rows((k) => `import { PUZZLES as ${k.toUpperCase()}_FULL } from '../${k}/puzzles';`)}`);
edit('app/daily/page.js',
  `const DUET = DUET_FULL.map(`,
  `${rows((k) => `const ${k.toUpperCase()} = ${k.toUpperCase()}_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`)}\nconst DUET = DUET_FULL.map(`);
edit('app/daily/page.js',
  `  { key: 'duet', name: 'Duet', path: '/duet',`,
  `${rows((k, d) => `  { key: '${k}', name: '${d.Name}', path: '/${k}', tag: '${d.TAG}', accent: '${d.COLOR}', bg: '${d.BG}', border: '${d.BORDER}', src: ${k.toUpperCase()} },`)}\n  { key: 'duet', name: 'Duet', path: '/duet',`);

// ─── 8. app/daily/DailyArchiveClient.jsx ────────────────────────────────────
edit('app/daily/DailyArchiveClient.jsx', `'junkyard', 'snug', 'duet',`, `'junkyard', 'snug', 'duet', 'lamps',`);
edit('app/daily/DailyArchiveClient.jsx', `'listed', 'niche', 'redact',`, `'listed', 'niche', 'clade', 'dossier', 'redact',`);
edit('app/daily/DailyArchiveClient.jsx', `duet: '#bef264',`, `duet: '#bef264', ${ORDER.map((k) => `${k}: '${G[k].NAVY}'`).join(', ')},`);

// ─── 9. key lists ───────────────────────────────────────────────────────────
const TRIO = `'duet', 'lamps', 'clade', 'dossier',`;
edit('lib/sitemap-entries.js', `'junkyard', 'snug', 'duet',`, `'junkyard', 'snug', ${TRIO}`);
edit('app/DailySlateRail.jsx', `'junkyard', 'snug', 'duet',`, `'junkyard', 'snug', ${TRIO}`);
edit('lib/quiz-catalog.js', `'junkyard', 'snug', 'duet',`, `'junkyard', 'snug', ${TRIO}`);
edit('lib/loft.js', `'junkyard', 'snug', 'duet',`, `'junkyard', 'snug', ${TRIO}`);
edit('app/api/quiz/daily-status/route.js', `|snug|duet|`, `|snug|duet|lamps|clade|dossier|`);
edit('app/quizzes/QuizHomeClient.jsx', `|snug|duet|`, `|snug|duet|lamps|clade|dossier|`);

// ─── 10. the puzzle-map registries, sunday-slate included ───────────────────
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  edit(f, `import { PUZZLES as P_duet } from '@/app/duet/puzzles';`,
    `import { PUZZLES as P_duet } from '@/app/duet/puzzles';\n${rows((k) => `import { PUZZLES as P_${k} } from '@/app/${k}/puzzles';`)}`);
  edit(f, `duet: P_duet`, `duet: P_duet, ${ORDER.map((k) => `${k}: P_${k}`).join(', ')}`);
}

// ─── 11. lib/game-glyphs.js ─────────────────────────────────────────────────
edit('lib/game-glyphs.js', `  duet: 'M3 3h18v18H3zM12 3v9H3`, `${rows((k, d) => `  ${k}: ${d.GLYPH}`)}\n  duet: 'M3 3h18v18H3zM12 3v9H3`);

// ─── 12. lib/puzzle-categories.js ───────────────────────────────────────────
const PC = 'lib/puzzle-categories.js';
edit(PC, `    description: 'Twenty-one free daily logic puzzles: a nonogram, slitherlink, shikaku, a binary dots-and-rings grid,`,
  `    description: 'Twenty-two free daily logic puzzles: a nonogram, slitherlink, shikaku, a binary dots-and-rings grid, a light-every-square puzzle,`);
edit(PC, `    lede: 'Twenty-one logic puzzles with one new board apiece every day. Pencil-and-paper classics (a nonogram, a slitherlink loop, shikaku rectangles, a balanced dots-and-rings grid,`,
  `    lede: 'Twenty-two logic puzzles with one new board apiece every day. Pencil-and-paper classics (a nonogram, a slitherlink loop, shikaku rectangles, a balanced dots-and-rings grid, a light-every-square puzzle,`);
edit(PC, `    keys: ['etch', 'hedge', 'plot', 'duet', 'snug',`, `    keys: ['etch', 'hedge', 'plot', 'duet', 'lamps', 'snug',`);
edit(PC, `duet: 'Binary puzzle (binairo) with rooms',`, `duet: 'Binary puzzle (binairo) with rooms', lamps: 'Light-up puzzle (akari)',`);
edit(PC, `never three alike in a line. Snug is the shape-fitting puzzle`, `never three alike in a line. Lamps is the light-up puzzle: place lamps until every square is lit, with no lamp shining on another. Snug is the shape-fitting puzzle`);
edit(PC, `Hedge 10x10, Duet 10x10,`, `Hedge 10x10, Duet 10x10, Lamps 10x10,`);
edit(PC, `      ['Are they free?', 'All twenty-one, every day, no account required.'],`, `      ['Are they free?', 'All twenty-two, every day, no account required.'],`);
edit(PC, `'listed', 'bracket', 'niche', 'redact'],`, `'listed', 'bracket', 'niche', 'clade', 'dossier', 'redact'],`);
edit(PC, `niche: 'Trivia grid', redact:`, `niche: 'Trivia grid', clade: 'Guess the animal', dossier: 'Attribute guessing game', redact:`);
edit(PC, `Niche a 4x4 grid on countries.'],`, `Niche a 4x4 grid on countries, Clade a rarer animal, Dossier six guesses.'],`);

// ─── 13. lib/daily-groups.js + lib/finish-sets.js ───────────────────────────
// A set holds 3 to 5 and Grid drawing was full, so it splits: the three you
// DRAW (Etch, Hedge, Plot) and the three you FILL (Duet, Lamps, Snug).
edit('lib/daily-groups.js',
  `  { name: 'Grid drawing', cat: 'Logic', keys: ['etch', 'hedge', 'plot', 'snug', 'duet'] },`,
  `  { name: 'Grid drawing', cat: 'Logic', keys: ['etch', 'hedge', 'plot'] },\n  { name: 'Grid filling', cat: 'Logic', keys: ['duet', 'lamps', 'snug'] },`);
edit('lib/daily-groups.js',
  `  { name: 'Single-topic trivia', cat: 'Trivia', keys: ['deep', 'niche', 'slot'] },`,
  `  { name: 'Single-topic trivia', cat: 'Trivia', keys: ['deep', 'niche', 'slot', 'clade', 'dossier'] },`);
edit('lib/daily-groups.js', `  // Logic (21)`, `  // Logic (22)`);
edit('lib/daily-groups.js', `  // Trivia (15 live)`, `  // Trivia (17 live)`);
// finish sets hold 2 to 4, so each game gets a set of its own kind.
edit('lib/finish-sets.js',
  `  { name: 'Grid drawing', cat: 'Logic', keys: ['etch', 'hedge', 'plot', 'duet'] },`,
  `  { name: 'Grid drawing', cat: 'Logic', keys: ['etch', 'hedge', 'plot', 'duet'] },\n  { name: 'Light and balance', cat: 'Logic', keys: ['lamps', 'duet', 'hedge'] },`);
edit('lib/finish-sets.js',
  `  { name: 'One topic deep', cat: 'Trivia', keys: ['niche', 'slot', 'deep'] },`,
  `  { name: 'One topic deep', cat: 'Trivia', keys: ['niche', 'slot', 'deep'] },\n  { name: 'Guessing games', cat: 'Trivia', keys: ['clade', 'dossier', 'focus'] },`);

// ─── 14. lib/puzzle-sets.js — four set pages follow their groups ────────────
setBlock('Grid drawing', {
  title: 'Free Daily Pencil Puzzles: Nonogram, Slitherlink and Shikaku | Mind Loft',
  h1: 'Free Daily Pencil Puzzles: a Nonogram, a Slitherlink Loop and Shikaku',
  description: 'Three free daily pencil-and-paper logic puzzles drawn on a grid: a nonogram (picross), a slitherlink loop and shikaku rectangles. One solution each, reachable by logic. New boards at midnight Eastern, no signup.',
  lede: 'The puzzles you would draw with a pencil, on a grid you shade, loop or cut. Etch is the nonogram: a picture appears when the counts are satisfied. Hedge is slitherlink: one closed loop. Plot is shikaku: cut the board into rectangles.',
  how: 'Etch fills the squares the row and column counts force. Hedge draws one closed loop so every number has that many sides on it. Plot cuts the grid into rectangles so each number owns exactly its own area.',
  free: 'All three, every day, no account required.',
});
{
  const p = path.join(root, 'lib/puzzle-sets.js');
  const src = fs.readFileSync(p, 'utf8');
  if (src.includes(`name: 'Grid filling', slug:`)) skipped++;
  else {
    const head = `  {\n    name: 'Sorting puzzles', slug:`;
    if (src.split(head).length - 1 !== 1) throw new Error('puzzle-sets: Sorting puzzles head');
    const blk = `  {
    name: 'Grid filling', slug: 'grid-filling', circuit: 'pencil',
    eyebrow: 'Free daily fill-the-grid puzzles',
    title: 'Free Daily Grid Puzzles: Binary Grid, Light Up and Shape Fitting | Mind Loft',
    h1: 'Free Daily Grid Puzzles: a Binary Grid, a Light-Up Puzzle and Shape Fitting',
    description: 'Three free daily logic puzzles where you fill the board: a dots-and-rings binary grid, a light-up puzzle where lamps light every square, and a shape-fitting puzzle with exactly one way in. One solution each, reachable by logic. New boards at midnight Eastern, no signup.',
    lede: 'Three puzzles where the board starts nearly empty and you fill it. Duet is the binary grid: dots and rings, half and half. Lamps lights every square with no lamp shining on another. Snug fits a handful of pieces into a board exactly one way.',
    how: [
      'Duet fills every square with a dot or a ring so every row, column and walled room is half and half, never three alike in a line. Lamps places lamps that shine along their row and column until a wall, and a numbered wall touches exactly that many. Snug turns and flips its pieces until they cover the board.',
    ],
    faq: [
      ['How big do they get?', 'Bigger through the week. Duet and Lamps run 10x10 on Sunday, and Snug lays eight pieces on a 7x7.'],
      ['Are they free?', 'All three, every day, no account required.'],
    ],
  },
`;
    fs.writeFileSync(p, src.replace(head, blk + head)); applied++;
  }
}
setBlock('Single-topic trivia', {
  title: 'Free Daily Single-Topic Trivia: One Subject, a Trivia Grid, Blind Ranking and Two Guessing Games | Mind Loft',
  h1: 'Free Daily Single-Topic Trivia: One Subject a Day, a Trivia Grid, a Blind Ranking and Two Guessing Games',
  description: 'Five free daily trivia games that stay on one topic: a fifteen-question one-life quiz on a single subject, a trivia grid where every row and column is a category, a blind ranking where ten things arrive one at a time, a guess-the-animal game played on the family tree, and a guessing game that compares five facts on every guess. New topics at midnight Eastern, no signup.',
  lede: 'Five games that pick one subject and stay on it. Deep is fifteen questions on one topic with one life. Niche is the trivia grid: fill each cell with something that fits both its row and its column. Slot deals ten things one at a time and makes you place each before you see the next. Clade hides one animal and answers every guess with the branch of the family tree it shares. Dossier hides a president, an element or a US state and compares five facts on every guess.',
  how: 'Deep runs like the gauntlets, climbing through the tiers, but on one subject a day, so a specialist can run the table. Niche is the grid: rows and columns are categories and every cell has to satisfy both. Slot is the blind ranking: the score is exact placements, and the near misses break ties. Clade and Dossier are guessing games: eight guesses, each one answered with how close it came, and fewer guesses score more.',
  free: 'All five, every day, no account required.',
});

// ─── 15. CLAUDE.md ──────────────────────────────────────────────────────────
edit('CLAUDE.md',
  `| Duet | a 10x10 board against the weekday 6x6 and 8x8 (from launch, 2026-10-03) |`,
  `| Duet | a 10x10 board against the weekday 6x6 and 8x8 (from launch, 2026-10-03) |\n| Lamps | a 10x10 board against the weekday 7x7 and 8x8 (from launch, 2026-10-04) |\n| Clade | a rarer animal, tier 4 of the list (from launch, 2026-10-04) |\n| Dossier | six guesses instead of eight (from launch, 2026-10-04) |`);
{
  const p = path.join(root, 'CLAUDE.md');
  const src = fs.readFileSync(p, 'utf8');
  const marker = '## Lamps, Clade and Dossier (`/lamps`, `/clade`, `/dossier`)';
  if (!src.includes(marker)) {
    fs.writeFileSync(p, src.replace(/\s*$/, '\n') + `
${marker}: launched 2026-10-04

Three dailies in one push, wired by \`scripts/wire-clade-dossier-lamps.mjs\` (anchored on the Duet and
Niche rows, idempotent). Day 1 is 2026-10-04, a Sunday, so every No. 1 is a Sunday Edition. Banks
run 78 days to 2026-12-20. No PNG tiles; glyphs in \`lib/game-glyphs.js\`; share cards
\`public/og/<key>.png\` from \`scripts/bake-og.mjs lamps clade dossier\`. Premiere 10-04 to 10-08.

**Lamps** (Logic, \`miss: null\`, SOLVE_ONLY, first-play hint): the light-placement puzzle (akari).
\`grid[r]\` is a string of \`.\` white, \`#\` blank wall, \`0\`-\`4\` numbered wall; \`sol\` is the lamp
squares as \`r*n+c\`. \`scripts/lamps-core.mjs\` + \`gen-lamps.mjs\` build a unique board and strip wall
numbers while a graded solver (pencil rules, then ONE look-ahead; \`cost\` = squares settled by a
look-ahead) still finishes. Ramp: Mon 7x7 cost 0, Tue 1-2, Wed 3-9, Thu 8x8 0-1, Fri 2-5, Sat 6-16,
**Sunday 10x10** 6-40. \`scripts/verify-lamps.mjs\` shares no code with the core. The client flags
two lamps that see each other and an over-full numbered wall, never a lamp that is merely wrong.

**Clade** (Trivia, \`miss: 'Guesses'\`): one hidden animal, eight guesses, each answered with the
closest branch of the tree it shares with the answer. \`app/clade/animals.js\` is the list (name,
\`path\` from Animals down, tier 1-4, optional \`alt\` names). Tier by weekday: Mon/Tue 1, Wed/Thu 2,
Fri/Sat 3, Sunday 4. Score \`11 - guesses\` (floor 1), 0 when the guesses run out. THE TAXONOMY WAS
WRITTEN FROM MEMORY and simplified to common-name branches; treat a reader report of a wrong branch
as likely right and fix the path.

**Dossier** (Trivia, \`miss: 'Guesses'\`): one hidden item from the day's universe
(\`app/dossier/universes.js\`: US presidents, chemical elements, US states), eight guesses (six on
Sunday), each compared with the answer on five attributes (match, higher, lower, no). Rotation Mon
presidents, Tue elements, Wed states, Thu presidents, Fri elements, Sat states; Sundays cycle.
Same score as Clade. A president who served two separate terms is one entry. Facts are frozen
(nothing that changes with an election or a discovery is an attribute).

Both guessing games use the three-tier word type-ahead (\`matchNames\`) and say so when nothing
matches, per the type-ahead rule above. The answer never reaches the browser for a future day:
each page filters \`live <= today\`.
`);
    applied++;
  } else skipped++;
}

console.log(`wire-clade-dossier-lamps: ${applied} edits applied, ${skipped} already present`);
