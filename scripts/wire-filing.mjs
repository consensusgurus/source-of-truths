// scripts/wire-filing.mjs: wires Filing (name the company from its IPO filing,
// Trivia) into every registry, beside Resume. Placement follows "Placing a new
// daily" in docs/claude/daily-authoring.md: category Trivia, skills Memory and
// Deduction, the category key lists, the Guessing games group (now five), a new
// Due diligence finish set (Tape, Filing, Resume) and the set page prose. No
// Sunday Edition: an S-1 is an S-1 every day of the week.
//
// Anchored edits: every anchor must match EXACTLY ONCE or the script throws,
// and an edit whose insertion is already present is skipped, so a re-run is safe.
//   node scripts/wire-filing.mjs <dir>
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

const TAG = 'Name the company from its IPO filing';
const TAGLONG = 'A famous IPO prospectus, every name blacked out';
const HOW = 'Name the company from its IPO prospectus: a risk factor first, then the cover page, competition, key metrics, the business and the founders in their own words. Names are blacked out; every extra clue or wrong guess opens the next section. Fewer clues score more.';
const BLURB = 'A famous company’s IPO prospectus with every name blacked out. Risk factors, metrics, rivals. Name it in the fewest clues.';
const COLOR = '#1f3a5f', NAVY = '#a5b4fc', BG = '#e6ebf2', BORDER = 'rgba(31,58,95,0.35)';

// 1. lib/daily-games.js: the row and the score view (the premiere is the run's, below)
afterLine('lib/daily-games.js', "  { key: 'resume', miss: 'Clues', name: 'Resume',", [
  `  { key: 'filing', miss: 'Clues', name: 'Filing', cat: 'Trivia', tag: '${TAG}', tagLong: '${TAGLONG}', how: '${HOW}', color: '${COLOR}', colorNavy: '${NAVY}' },`]);
sub('lib/daily-games.js', `bacon: VERDICT(), resume: VERDICT(),`, `bacon: VERDICT(), resume: VERDICT(), filing: VERDICT(),`);

// 2. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['resume', `, `const LAUNCH_PIN = { keys: ['filing', 'resume', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['resume', `, `const LAUNCH_PIN = { keys: ['filing', 'resume', `);
afterLine('app/DailyEndCard.jsx', "  resume: { accent: '#0a5aa8', badgeBg: '#0a5aa8', badgeInk: T.white, Fin: LayoutGrid },", [
  `  filing: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: LayoutGrid },`]);
afterLine('app/DailyEndCard.jsx', "  { key: 'resume',    cat: 'trivia',", [
  `  { key: 'filing',    cat: 'trivia',     name: 'Filing', tag: '${TAG}',   blurb: '${BLURB}', href: '/filing' },`]);

// 3. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "  { key: 'resume', href: '/resume'", [
  `  { key: 'filing', href: '/filing', name: 'Filing', tag: 'name the company from its IPO filing', store: 'sot_filing_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },`]);
afterLine('app/DailyGamesGrid.jsx', "  { key: 'resume', href: '/resume'", [
  `  { key: 'filing', href: '/filing', name: 'Filing', tag: '${TAG}', img: '/games/btn-filing.png' },`]);
sub('app/DailyGamesGrid.jsx', `'tape', 'bacon', 'resume', 'redact',`, `'tape', 'bacon', 'resume', 'filing', 'redact',`);
afterLine('app/DailyStrip.jsx', "  { key: 'resume', href: '/resume'", [
  `  { key: 'filing', href: '/filing', name: 'Filing', img: '/games/btn-filing.png', store: 'sot_filing_day', tag: "${TAG}" , cat: 'Trivia' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { resume: `, `const ACCENTS = { filing: '${NAVY}', resume: `);
sub('app/DailyStrip.jsx', `const TCOL = { resume: `, `const TCOL = { filing: '${COLOR}', resume: `);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as RESUME_FULL } from '../resume/puzzles';`,
  `import { PUZZLES as RESUME_FULL } from '../resume/puzzles';\nimport { PUZZLES as FILING_FULL } from '../filing/puzzles';`);
afterLine('app/archive/page.js', 'const RESUME = RESUME_FULL.map(', [
  'const FILING = FILING_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));']);
afterLine('app/archive/page.js', "  { key: 'resume', name: 'Resume', path: '/resume'", [
  `  { key: 'filing', name: 'Filing', path: '/filing', tag: '${TAG}', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: FILING },`]);

// 5. the four puzzle-map registries
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_resume } from '@/app/resume/puzzles';`,
    `import { PUZZLES as P_resume } from '@/app/resume/puzzles';\nimport { PUZZLES as P_filing } from '@/app/filing/puzzles';`);
  sub(f, `resume: P_resume, `, `resume: P_resume, filing: P_filing, `);
}

// 6. alternations, rails, catalog, loft
sub('app/api/quiz/daily-status/route.js', `|bacon|resume|`, `|bacon|resume|filing|`);
sub('app/quizzes/QuizHomeClient.jsx', `|bacon|resume|`, `|bacon|resume|filing|`);
sub('app/DailySlateRail.jsx', `'bacon', 'resume', `, `'bacon', 'resume', 'filing', `);
sub('lib/quiz-catalog.js', `'bacon', 'resume', `, `'bacon', 'resume', 'filing', `);
sub('lib/loft.js', `'bacon', 'resume', `, `'bacon', 'resume', 'filing', `);

// 7. skills, glyph, challenge metric, family, blurb, preview tile
sub('lib/daily-skills.js', `resume: ['mem', 'ded'],`, `resume: ['mem', 'ded'], filing: ['mem', 'ded'],`);
afterLine('lib/game-glyphs.js', "  resume: 'M4 3h16v18H4z", [
  "  filing: 'M5 3h10l4 4v14H5zM15 3v4h4M8 10h8M8 13h3M13 13h3M8 16h8M8 19h5',  // a filing page: a folded corner, text lines with a blacked-out gap"]);
afterLine('lib/challenge-metric.js', "  resume: { unit: 'clues'", [
  "  filing: { unit: 'clues', one: 'clue', dir: 'low', solveFirst: true, field: 'guesses' },"]);
sub('lib/daily-families.js', `'tape', 'bacon', 'resume'],`, `'tape', 'bacon', 'resume', 'filing'],`);
afterLine('lib/game-blurbs.js', "  resume: 'Name the famous person", [
  "  filing: 'Name the famous company from its IPO prospectus: risk factors, rivals and key metrics. Fewest clues.',"]);
sub('app/GamePreviewTiles.jsx', `const Redact = () => (\n`, `// a filing cover: a header band, form lines and one blacked-out name
const Filing = () => (
  <g><rect x={112} y={4} width={72} height={76} rx={3} className="w" /><rect x={112} y={4} width={72} height={12} rx={3} className="m" />
    <rect x={120} y={22} width={40} height={7} rx={1} className="d" />
    {[0, 1, 2, 3].map((i) => <rect key={i} x={120} y={36 + i * 10} width={56 - (i % 2) * 14} height={4} rx={2} className="sm" />)}</g>
);
const Redact = () => (\n`);
sub('app/GamePreviewTiles.jsx', `bacon: Bacon, resume: Resume, `, `bacon: Bacon, resume: Resume, filing: Filing, `);

// 8. groups and sets: Filing joins the Guessing games and starts Due diligence
sub('lib/daily-groups.js', `  { name: 'Guessing games', cat: 'Trivia', keys: ['clade', 'dossier', 'bacon', 'resume'] },`,
  `  { name: 'Guessing games', cat: 'Trivia', keys: ['clade', 'dossier', 'bacon', 'resume', 'filing'] },`);
sub('lib/finish-sets.js', `  { name: 'Guessing games', cat: 'Trivia', keys: ['clade', 'dossier', 'tape', 'focus'] },`,
  `  { name: 'Guessing games', cat: 'Trivia', keys: ['clade', 'dossier', 'tape', 'focus'] },\n  { name: 'Due diligence', cat: 'Trivia', keys: ['tape', 'filing', 'resume'] },`);

// 9. the set page
const PS = 'lib/puzzle-sets.js';
sub(PS, `    title: 'Free Daily Trivia Guessing Games: Guess the Animal, the Answer, the Person | Mind Loft',
    h1: 'Free Daily Trivia Guessing Games: Guess the Animal, Guess the Answer, Link Two Actors and Name the Resume',
    description: 'Four free daily trivia guessing games: guess the animal on the family tree, a five-fact guessing game, link two actors through their films, and name a famous person from their resume. No signup.',
    lede: 'Four games where every guess tells you something.`, `    title: 'Free Daily Trivia Guessing Games: Guess the Animal, the Person, the Company | Mind Loft',
    h1: 'Free Daily Trivia Guessing Games: Guess the Animal, Link Two Actors, Name the Resume and the IPO Filing',
    description: 'Five free daily trivia guessing games: guess the animal on the family tree, a five-fact guessing game, link two actors through their films, name a famous person from their resume and a famous company from its IPO filing. No signup.',
    lede: 'Five games where every guess tells you something.`);
sub(PS, `and opens it up one section at a time.',
    how: [`, `and opens it up one section at a time. Filing does the same for a famous company, from the prospectus it filed to go public.',
    how: [`);
sub(PS, `and every wrong guess opens the next.',
    ],`, `and every wrong guess opens the next. Filing starts with one risk factor; the cover page, competition, key metrics, the business and the founders in their own words follow.',
    ],`);
sub(PS, `      ['Are they free?', 'All four, every day, no account required.'],
    ],
  },
  // ── Sudoku`, `      ['Which companies show up in Filing?', 'Well-known companies that went public in the United States, quoted from the prospectus they filed with the SEC.'],
      ['Are they free?', 'All five, every day, no account required.'],
    ],
  },
  // ── Sudoku`);

// 10. the trivia page
const PC = 'lib/puzzle-categories.js';
sub(PC, `'bacon', 'resume', 'redact', 'carmen'],`, `'bacon', 'resume', 'filing', 'redact', 'carmen'],`);
sub(PC, `resume: 'Guess who from a resume',`, `resume: 'Guess who from a resume', filing: 'Guess the company from its IPO filing',`);

console.log(`wire-filing: ${applied} applied, ${skipped} already present`);
