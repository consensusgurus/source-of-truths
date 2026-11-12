// scripts/wire-witness-defuse.mjs: wires Witness (the daily scene-memory game)
// and Defuse (the daily wire-cutting logic puzzle), both Logic, owner
// 2026-11-12, into every registry in one pass, beside Tangled. Placement follows
// "Placing a new daily" in docs/claude/daily-authoring.md.
//
// Witness: skill Memory; scored as a real count (answers right out of six, or
// eight on Sunday), so it is NOT in SCORE_VIEW and keeps its fraction.
// Defuse: skill Deduction; a solve is 10 and anything else 0, ranked on the
// clock, so it reads Solved / Fail (VERDICT) with cuts as the miss column.
// NO SUNDAY EDITION on either: Sunday is simply the week's biggest board, as on
// Tangled, so neither is on SUNDAY_EDITION_GAMES nor in the Sunday slate map.
//
// Sets: a new daily group and set page, Close reading (Witness, Defuse, Sworn);
// Sworn leaves Whodunits, which becomes four. Finish sets: Witness joins Liars
// and witnesses, Defuse joins Rule finding.
//
// Anchored: every anchor must match EXACTLY ONCE or the script throws, and an
// edit whose replacement is already present is skipped, so a re-run is safe.
//   node scripts/wire-witness-defuse.mjs <dir>
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
  wr(f, s.replace(anchor, () => repl)); applied++;
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

const G = [
  { key: 'witness', name: 'Witness', NAMEUP: 'WITNESS', miss: 'null', tag: 'What did you see?', promo: 'what did you see?', tagLong: 'Study a street scene, then answer from memory',
    how: 'A street scene shows for twenty seconds, then disappears. Answer six questions about what you saw: colors, counts, the time on the clock, what stood next to what. The scene gets busier through the week. Scored on answers right, then the clock.',
    blurb: 'Twenty seconds with a street scene, then six questions from memory. What color was the van? How many people were waiting?',
    short: 'Study a street scene, then answer from memory.',
    color: '#9f1239', navy: '#fda4af', bg: '#ffe4e6', border: 'rgba(159,18,57,0.35)', fin: 'Trophy', skills: "['mem']", diff: 2,
    glyph: "'M2 12s4-7 10-7s10 7 10 7s-4 7-10 7s-10-7-10-7zM12 9a3 3 0 1 0 .01 0',  // an eye", generic: 'Scene memory game' },
  { key: 'defuse', name: 'Defuse', NAMEUP: 'DEFUSE', miss: "'Cuts'", tag: 'Cut the wires in the safe order', promo: 'cut the wires in the safe order', tagLong: 'Read the manual, then cut the wires in the one safe order',
    how: 'A device with a row of colored wires and a manual of rules. Every wire is cut unless a rule protects it, and exactly one order of cuts obeys every rule. Tap the wires in that order. One wrong cut ends the day; a solve ranks on the clock.',
    blurb: 'A row of colored wires and a manual of rules. Exactly one order of cuts is safe, and one wrong cut ends the day.',
    short: 'Read the manual and cut the wires in the one safe order.',
    color: '#7c2d12', navy: '#fdba74', bg: '#ffedd5', border: 'rgba(124,45,18,0.35)', fin: 'Trophy', skills: "['ded']", diff: 3,
    glyph: "'M6 3v18M18 3v18M12 3v6M12 15v6M9.5 10.5l5 3M9.5 13.5l5-3',  // three wires, the middle one cut", generic: 'Wire-cutting logic puzzle' },
];
const both = (fn) => G.map(fn).join('');
const lines = (fn) => [G.map(fn).join('\n')];

// 1. lib/daily-games.js: the rows, the premieres, Defuse's verdict view
afterLine('lib/daily-games.js', "{ key: 'tangled', miss: null, name: 'Tangled',", lines((g) =>
  `  { key: '${g.key}', miss: ${g.miss}, name: '${g.name}', cat: 'Logic', tag: '${g.tag}', tagLong: '${g.tagLong}', how: '${g.how}', color: '${g.color}', colorNavy: '${g.navy}' },`));
sub('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n  { key: 'witness', from: '2026-11-12', until: '2026-11-16' },\n  { key: 'defuse', from: '2026-11-12', until: '2026-11-16' },\n`);
sub('lib/daily-games.js', `filing: VERDICT(), `, `filing: VERDICT(), defuse: VERDICT(), `);

// 2. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['filing', `, `const LAUNCH_PIN = { keys: ['witness', 'defuse', 'filing', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['filing', `, `const LAUNCH_PIN = { keys: ['witness', 'defuse', 'filing', `);
afterLine('app/DailyEndCard.jsx', "  tangled: { accent: '#0f766e', badgeBg: '#0f766e', badgeInk: T.white, Fin: Trophy },", lines((g) =>
  `  ${g.key}: { accent: '${g.color}', badgeBg: '${g.color}', badgeInk: T.white, Fin: ${g.fin} },`));
afterLine('app/DailyEndCard.jsx', "{ key: 'tangled',    cat: 'logic',", lines((g) =>
  `  { key: '${g.key}',    cat: 'logic',     name: '${g.name}', tag: '${g.tag}',     blurb: '${g.blurb}', href: '/${g.key}' },`));

// 3. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'tangled', href: '/tangled'", lines((g) =>
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.promo}', store: 'sot_${g.key}_day', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}' },`));
afterLine('app/DailyGamesGrid.jsx', "{ key: 'tangled', href: '/tangled'", lines((g) =>
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: '${g.tag}', img: '/games/btn-${g.key}.png' },`));
sub('app/DailyGamesGrid.jsx', `'topple', 'roll', 'tangled', 'sudoclue',`, `'topple', 'roll', 'tangled', 'witness', 'defuse', 'sudoclue',`);
afterLine('app/DailyStrip.jsx', "{ key: 'tangled', href: '/tangled'", lines((g) =>
  `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', img: '/games/btn-${g.key}.png', store: 'sot_${g.key}_day', tag: "${g.tag}" , cat: 'Logic' },`));
sub('app/DailyStrip.jsx', `const ACCENTS = { filing: `, `const ACCENTS = { ${both((g) => `${g.key}: '${g.navy}', `)}filing: `);
sub('app/DailyStrip.jsx', `const TCOL = { filing: `, `const TCOL = { ${both((g) => `${g.key}: '${g.color}', `)}filing: `);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as TANGLED_FULL } from '../tangled/puzzles';`,
  `import { PUZZLES as TANGLED_FULL } from '../tangled/puzzles';\n${G.map((g) => `import { PUZZLES as ${g.NAMEUP}_FULL } from '../${g.key}/puzzles';`).join('\n')}`);
afterLine('app/archive/page.js', 'const TANGLED = TANGLED_FULL.map(', lines((g) =>
  `const ${g.NAMEUP} = ${g.NAMEUP}_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`));
afterLine('app/archive/page.js', "{ key: 'tangled', name: 'Tangled', path: '/tangled'", lines((g) =>
  `  { key: '${g.key}', name: '${g.name}', path: '/${g.key}', tag: '${g.tag}', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}', src: ${g.NAMEUP} },`));

// 5. the three daily puzzle maps (no Sunday slate: no Sunday Edition)
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js']) {
  sub(f, `import { PUZZLES as P_tangled } from '@/app/tangled/puzzles';`,
    `import { PUZZLES as P_tangled } from '@/app/tangled/puzzles';\n${G.map((g) => `import { PUZZLES as P_${g.key} } from '@/app/${g.key}/puzzles';`).join('\n')}`);
  sub(f, `roll: P_roll, tangled: P_tangled, sudoclue: P_sudoclue,`, `roll: P_roll, tangled: P_tangled, witness: P_witness, defuse: P_defuse, sudoclue: P_sudoclue,`);
}

// 6. alternations, rails, catalog, loft, families, starting difficulty
sub('app/api/quiz/daily-status/route.js', `|roll|tangled|sudoclue|`, `|roll|tangled|witness|defuse|sudoclue|`);
sub('app/quizzes/QuizHomeClient.jsx', `|roll|tangled|sudoclue|`, `|roll|tangled|witness|defuse|sudoclue|`);
for (const f of ['app/DailySlateRail.jsx', 'lib/quiz-catalog.js', 'lib/loft.js']) sub(f, `'topple', 'roll', 'tangled', 'sudoclue',`, `'topple', 'roll', 'tangled', 'witness', 'defuse', 'sudoclue',`);
sub('lib/daily-families.js', `  ['alibi', 'sudoclue', 'sworn', 'hearsay', 'fib'],`, `  ['alibi', 'sudoclue', 'sworn', 'hearsay', 'fib', 'witness'],`);
sub('lib/daily-families.js', `  ['axiom', 'ergo', 'docket', 'suffice', 'venn', 'stands'],`, `  ['axiom', 'ergo', 'docket', 'suffice', 'venn', 'stands', 'defuse'],`);
afterLine('lib/daily-difficulty.js', '  tangled: 2, // a starting estimate (2026-11-07)', lines((g) => `  ${g.key}: ${g.diff}, // a starting estimate (2026-11-12) until a week of plays rates it`));

// 7. skills, glyphs, challenge metric, blurbs, preview tiles
sub('lib/daily-skills.js', `tangled: ['spa', 'plan'], `, `tangled: ['spa', 'plan'], ${both((g) => `${g.key}: ${g.skills}, `)}`);
afterLine('lib/game-glyphs.js', "  tangled: 'M12 3a9 9 0 1 0 .01 0", lines((g) => `  ${g.key}: ${g.glyph}`));
afterLine('lib/challenge-metric.js', "  carmen: { unit: 'points'", ["  witness: { unit: 'right', one: 'right', dir: 'high', say: 'got' },"]);
sub('lib/daily-row-stats.js', `  Clues: 'clue',\n`, `  Clues: 'clue',\n  Cuts: 'cut',\n`);
afterLine('lib/game-blurbs.js', '  tangled: "Drag the pegs', lines((g) => `  ${g.key}: "${g.short}",`));
sub('app/GamePreviewTiles.jsx', `const Connect = () => (\n`, `// a street scene in a frame: a sun, two shopfronts and a car
const Witness = () => (
  <g><rect x={112} y={6} width={72} height={72} rx={4} className="w" /><circle cx={170} cy={20} r={6} className="m" />
    <rect x={118} y={30} width={28} height={28} className="sm" /><rect x={150} y={36} width={28} height={22} className="sm" />
    <rect x={126} y={62} width={34} height={9} rx={4} className="d" /><circle cx={133} cy={72} r={3.5} className="d" /><circle cx={153} cy={72} r={3.5} className="d" /></g>
);
// a device: terminal bars top and bottom, four wires, the third one cut
const Defuse = () => (
  <g><rect x={114} y={6} width={68} height={8} rx={2} className="d" /><rect x={114} y={70} width={68} height={8} rx={2} className="d" />
    {[124, 140, 172].map((x) => <rect key={x} x={x - 3} y={14} width={6} height={56} className="m" />)}
    <rect x={153} y={14} width={6} height={20} className="m" /><rect x={153} y={50} width={6} height={20} className="m" /><circle cx={156} cy={42} r={6} className="d" /></g>
);
const Connect = () => (\n`);
sub('app/GamePreviewTiles.jsx', `snug: Snug, tangled: Tangled,`, `snug: Snug, tangled: Tangled, witness: Witness, defuse: Defuse,`);

// 8. groups and finish sets
sub('lib/daily-groups.js', `  { name: 'Whodunits', cat: 'Logic', keys: ['alibi', 'sudoclue', 'sworn', 'fib', 'hearsay'] },`,
  `  { name: 'Whodunits', cat: 'Logic', keys: ['alibi', 'sudoclue', 'fib', 'hearsay'] },\n  { name: 'Close reading', cat: 'Logic', keys: ['witness', 'defuse', 'sworn'] },`);
sub('lib/finish-sets.js', `  { name: 'Liars and witnesses', cat: 'Logic', keys: ['hearsay', 'fib', 'sworn'] },`, `  { name: 'Liars and witnesses', cat: 'Logic', keys: ['hearsay', 'fib', 'sworn', 'witness'] },`);
sub('lib/finish-sets.js', `  { name: 'Rule finding', cat: 'Logic', keys: ['axiom', 'suffice', 'stands'] },`, `  { name: 'Rule finding', cat: 'Logic', keys: ['axiom', 'suffice', 'stands', 'defuse'] },`);

// 9. the set pages: Whodunits loses Sworn, Close reading is new
const PS = 'lib/puzzle-sets.js';
sub(PS, `description: 'Five free daily deduction puzzles: narrow four suspects to one across three grids, place a murder’s suspects one per row and column of a real place, find the thief among five sworn statements with an exact number of lies, an inequality grid`,
  `description: 'Four free daily deduction puzzles: narrow four suspects to one across three grids, place a murder’s suspects one per row and column of a real place, an inequality grid`);
sub(PS, `lede: 'Five puzzles that give you statements instead of a grid to fill. Alibi is the nightly whodunit. Sudoclue sets a murder in a real place: one suspect per row and column, and every role to deduce. Sworn has five statements and an exact number of lies. Fib`,
  `lede: 'Four puzzles that give you statements instead of a grid to fill. Alibi is the nightly whodunit. Sudoclue sets a murder in a real place: one suspect per row and column, and every role to deduce. Fib`);
sub(PS, `name the victim, the killer and the accomplice. Sworn tells you how many of the five statements are lies and one of them names the thief. Fib prints`, `name the victim, the killer and the accomplice. Fib prints`);
sub(PS, `      ['Do I ever have to guess?', 'No. Every case is proved to fall to logic alone.'],
      ['Are they free?', 'All five, every day, no account required.'],
    ],
  },`, `      ['Do I ever have to guess?', 'No. Every case is proved to fall to logic alone.'],
      ['Are they free?', 'All four, every day, no account required.'],
    ],
  },
  {
    name: 'Close reading', slug: 'close-reading',
    eyebrow: 'Free daily observation puzzles',
    title: 'Free Daily Observation Puzzles: A Scene, a Manual, Five Statements | Mind Loft',
    h1: 'Free Daily Observation and Close Reading Puzzles',
    description: 'Three free daily puzzles won by paying attention: a street scene to study and then be questioned on, a manual whose rules leave one safe order of wire cuts, and five sworn statements with an exact number of lies. New boards at midnight Eastern, no signup.',
    lede: 'Three puzzles where everything you need is in front of you, if you look closely enough. Witness shows a street scene for twenty seconds and then asks what you saw. Defuse prints a manual and a row of wires, and one wrong cut ends the day. Sworn has five statements and an exact number of lies.',
    how: [
      'Witness is a memory game: a street of shops, people, vehicles and sky, then six questions about colors, counts and what stood next to what, with the scene returned at the end so you can see what you missed. Defuse gives you a device and a manual of plain rules, some of which only apply when their condition is true of that device, and exactly one order of cuts obeys them all. Sworn tells you how many of the five statements are lies and one of them names the thief.',
    ],
    faq: [
      ['Do they get harder through the week?', 'Witness and Defuse do. The scene gets busier and the device gains wires from Monday to Sunday, while the twenty seconds and the one-wrong-cut rule stay the same.'],
      ['Are they free?', 'All three, every day, no account required.'],
    ],
  },`);

// 10. the logic-puzzles page
const PC = 'lib/puzzle-categories.js';
sub(PC, `description: 'Thirty-three free daily logic puzzles:`, `description: 'Thirty-five free daily logic puzzles:`);
sub(PC, `a die rolling puzzle, a rope untangling puzzle, whodunit deduction grids,`, `a die rolling puzzle, a rope untangling puzzle, a wire-cutting puzzle, a scene memory game, whodunit deduction grids,`);
sub(PC, `lede: 'Thirty-three logic puzzles with one new board apiece every day`, `lede: 'Thirty-five logic puzzles with one new board apiece every day`);
sub(PC, `built around suspects, liars, hidden rules and results tables.`, `built around suspects, liars, hidden rules, results tables and a manual of wire-cutting rules, plus one memory game, a street scene you study and are then questioned on.`);
sub(PC, `'topple', 'roll', 'tangled', 'sudoclue',`, `'topple', 'roll', 'tangled', 'witness', 'defuse', 'sudoclue',`);
sub(PC, `tangled: 'Rope untangling puzzle', sudoclue:`, `tangled: 'Rope untangling puzzle', witness: '${G[0].generic}', defuse: '${G[1].generic}', sudoclue:`);
sub(PC, `one setup and five questions, or two statements and a verdict on whether they settle it.',`, `one setup and five questions, or two statements and a verdict on whether they settle it. Defuse prints a manual and a row of colored wires with exactly one safe order of cuts, and one wrong cut ends the day. Witness is the odd one out, a memory game: twenty seconds with a street scene, then six questions about what you saw.',`);
sub(PC, `['Are they free?', 'All thirty-three, every day, no account required.'],`, `['Are they free?', 'All thirty-five, every day, no account required.'],`);

console.log(`wire-witness-defuse: ${applied} edits applied, ${skipped} already present`);
