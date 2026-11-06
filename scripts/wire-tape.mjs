// scripts/wire-tape.mjs: wires Tape (name the company from its stock chart,
// Trivia) into every registry, beside Dossier. Placement follows "Placing a new
// daily" in docs/claude/daily-authoring.md: category Trivia, skills Memory and
// Deduction, the category key lists, the Picture and story trivia group (and its set page prose, by hand),
// the Guessing games finish set, and the trivia page copy.
//
// Anchored edits: every anchor must match EXACTLY ONCE or the script throws,
// and an edit whose insertion is already present is skipped, so a re-run is safe.
//   node scripts/wire-tape.mjs <dir>
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
function afterLine(f, marker, lines) {
  const s = rd(f);
  if (s.includes(lines[0])) { skipped++; return; }
  const parts = s.split('\n');
  const idx = parts.map((l, i) => (l.includes(marker) ? i : -1)).filter((i) => i >= 0);
  if (idx.length !== 1) throw new Error(`${f}: line marker matched ${idx.length} times: ${marker}`);
  parts.splice(idx[0] + 1, 0, lines.join('\n'));
  wr(f, parts.join('\n')); applied++;
}

const TAG = 'Name the company from its chart';
const TAGLONG = 'Five years of a stock chart, prices hidden, and six clues';
const HOW = 'Name the company from five years of its stock chart with the prices hidden. The sector is free; every extra clue or wrong guess opens the next one. Fewer clues score more.';
const BLURB = 'Five years of one company\\u2019s stock chart with the prices hidden. Name it from the Russell 3000 in the fewest clues. A smaller company on Sundays.';
const COLOR = '#1e5a8a', NAVY = '#7dd3fc', BG = '#e2eef7', BORDER = 'rgba(30,90,138,0.35)';

// 1. lib/daily-games.js: the row, the premiere, the score view
afterLine('lib/daily-games.js', "  { key: 'dossier', miss: 'Guesses', name: 'Dossier',", [
  `  { key: 'tape', miss: 'Clues', name: 'Tape', cat: 'Trivia', tag: '${TAG}', tagLong: '${TAGLONG}', how: '${HOW}', color: '${COLOR}', colorNavy: '${NAVY}' },`]);
sub('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n  { key: 'tape', from: '2026-11-06', until: '2026-11-10' },\n`);
sub('lib/daily-games.js', `clade: VERDICT(), dossier: VERDICT(),`, `clade: VERDICT(), dossier: VERDICT(), tape: VERDICT(),`);

// 2. Sunday Editions
sub('lib/sunday-editions.js', `//   dossier six guesses instead of eight`, `//   dossier six guesses instead of eight\n//   tape    a smaller company, from deeper in the Russell 3000`);
sub('lib/sunday-editions.js', `'lamps', 'clade', 'dossier', 'judges',`, `'lamps', 'clade', 'dossier', 'tape', 'judges',`);

// 3. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['tape', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['tape', `);
afterLine('app/DailyEndCard.jsx', "  dossier: { accent: '#5b3a8c', badgeBg: '#5b3a8c', badgeInk: T.white, Fin: LayoutGrid },", [
  `  tape: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: LayoutGrid },`]);
afterLine('app/DailyEndCard.jsx', "  { key: 'dossier',   cat: 'trivia',", [
  `  { key: 'tape',      cat: 'trivia',     name: 'Tape', tag: '${TAG}',   blurb: '${BLURB}', href: '/tape' },`]);

// 4. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "  { key: 'dossier', href: '/dossier'", [
  `  { key: 'tape', href: '/tape', name: 'Tape', tag: 'name the company from its chart', store: 'sot_tape_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },`]);
afterLine('app/DailyGamesGrid.jsx', "  { key: 'dossier', href: '/dossier'", [
  `  { key: 'tape', href: '/tape', name: 'Tape', tag: '${TAG}', img: '/games/btn-tape.png' },`]);
sub('app/DailyGamesGrid.jsx', `'clade', 'dossier', 'redact',`, `'clade', 'dossier', 'tape', 'redact',`);
afterLine('app/DailyStrip.jsx', "  { key: 'dossier', href: '/dossier'", [
  `  { key: 'tape', href: '/tape', name: 'Tape', img: '/games/btn-tape.png', store: 'sot_tape_day', tag: "${TAG}" , cat: 'Trivia' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { `, `const ACCENTS = { tape: '${NAVY}', `);
sub('app/DailyStrip.jsx', `const TCOL = { `, `const TCOL = { tape: '${COLOR}', `);

// 5. archive
sub('app/archive/page.js', `import { PUZZLES as DOSSIER_FULL } from '../dossier/puzzles';`,
  `import { PUZZLES as DOSSIER_FULL } from '../dossier/puzzles';\nimport { PUZZLES as TAPE_FULL } from '../tape/puzzles';`);
afterLine('app/archive/page.js', 'const DOSSIER = DOSSIER_FULL.map(', [
  'const TAPE = TAPE_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));']);
afterLine('app/archive/page.js', "  { key: 'dossier', name: 'Dossier', path: '/dossier'", [
  `  { key: 'tape', name: 'Tape', path: '/tape', tag: '${TAG}', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: TAPE },`]);

// 6. the four puzzle-map registries
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_dossier } from '@/app/dossier/puzzles';`,
    `import { PUZZLES as P_dossier } from '@/app/dossier/puzzles';\nimport { PUZZLES as P_tape } from '@/app/tape/puzzles';`);
  sub(f, `dossier: P_dossier, `, `dossier: P_dossier, tape: P_tape, `);
}

// 7. alternations, rails, catalog, loft
sub('app/api/quiz/daily-status/route.js', `|clade|dossier|`, `|clade|dossier|tape|`);
sub('app/quizzes/QuizHomeClient.jsx', `|clade|dossier|`, `|clade|dossier|tape|`);
sub('app/DailySlateRail.jsx', `'clade', 'dossier', `, `'clade', 'dossier', 'tape', `);
sub('lib/quiz-catalog.js', `'clade', 'dossier', `, `'clade', 'dossier', 'tape', `);
sub('lib/loft.js', `'clade', 'dossier', `, `'clade', 'dossier', 'tape', `);

// 8. skills, glyph, challenge metric, miss label, family
sub('lib/daily-skills.js', `  dossier: ['mem', 'ded'],`, `  dossier: ['mem', 'ded'], tape: ['mem', 'ded'],`);
afterLine('lib/game-glyphs.js', "  dossier: 'M3 8h18v8H3z", [
  "  tape: 'M3 3v18h18M6 15l4-5 3 3 4-6 3 3',  // a stock chart line"]);
afterLine('lib/challenge-metric.js', "  dossier: { unit: 'guesses'", [
  "  tape: { unit: 'clues', one: 'clue', dir: 'low', solveFirst: true, field: 'guesses' },"]);
sub('lib/daily-row-stats.js', `  'Clues left': 'clue left',`, `  'Clues left': 'clue left',\n  Clues: 'clue',`);
sub('lib/daily-families.js', `['thread', 'focus', 'script', 'redact', 'dossier', 'clade'],`, `['thread', 'focus', 'script', 'redact', 'dossier', 'clade', 'tape'],`);

// 9. group and finish set (Picture and story trivia: you read a picture, not a question)
sub('lib/daily-groups.js', `keys: ['focus', 'extra', 'redact', 'thread'] },`, `keys: ['focus', 'extra', 'redact', 'thread', 'tape'] },`);
sub('lib/finish-sets.js', `  { name: 'Guessing games', cat: 'Trivia', keys: ['clade', 'dossier', 'focus'] },`,
  `  { name: 'Guessing games', cat: 'Trivia', keys: ['clade', 'dossier', 'tape', 'focus'] },`);

// 10. the trivia page
const PC = 'lib/puzzle-categories.js';
sub(PC, `'niche', 'clade', 'dossier', 'redact'],`, `'niche', 'clade', 'dossier', 'tape', 'redact'],`);
sub(PC, `dossier: 'Attribute guessing game',`, `dossier: 'Attribute guessing game', tape: 'Stock chart guessing game',`);
sub(PC, `and picture, headline, year and ranking puzzles. New questions every day, no signup.'`, `and picture, headline, stock chart, year and ranking puzzles. New questions every day, no signup.'`);

console.log(`wire-tape: ${applied} applied, ${skipped} already present`);
