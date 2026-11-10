// scripts/wire-resume.mjs: wires Resume (name the famous person from their
// career profile, Trivia) into every registry, beside Bacon. Placement follows
// "Placing a new daily" in docs/claude/daily-authoring.md: category Trivia,
// skills Memory and Deduction, the category key lists, the Guessing games
// group (Clade, Dossier, Bacon, now Resume) and its set page prose.
//
// Anchored edits: every anchor must match EXACTLY ONCE or the script throws,
// and an edit whose insertion is already present is skipped, so a re-run is safe.
//   node scripts/wire-resume.mjs <dir>
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

const TAG = 'Name the person from their resume';
const TAGLONG = 'A famous career profile, name and photo hidden';
const HOW = 'Name the famous person from their career profile: colleges, past jobs, skills and fun facts. Degrees are free, names blacked out; every extra clue or wrong guess fills in more. Fewer clues score more.';
const BLURB = 'A famous person’s career profile with the name and photo hidden. Colleges, past jobs, fun facts. Name them in the fewest clues. A deeper cut on Sundays.';
const COLOR = '#0a5aa8', NAVY = '#93c5fd', BG = '#e3eefa', BORDER = 'rgba(10,90,168,0.35)';

// 1. lib/daily-games.js: the row, the premiere, the score view
afterLine('lib/daily-games.js', "  { key: 'bacon', miss: 'Films', name: 'Bacon',", [
  `  { key: 'resume', miss: 'Clues', name: 'Resume', cat: 'Trivia', tag: '${TAG}', tagLong: '${TAGLONG}', how: '${HOW}', color: '${COLOR}', colorNavy: '${NAVY}' },`]);
sub('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n  { key: 'resume', from: '2026-11-09', until: '2026-11-13' },\n`);
sub('lib/daily-games.js', `tape: VERDICT(), bacon: VERDICT(),`, `tape: VERDICT(), bacon: VERDICT(), resume: VERDICT(),`);

// 2. Sunday Editions
sub('lib/sunday-editions.js', `//   bacon   starts from a classic star, par 3 or 4`, `//   bacon   starts from a classic star, par 3 or 4\n//   resume  a deeper cut: a chief executive whose company is better known than their face`);
sub('lib/sunday-editions.js', `'dossier', 'tape', 'bacon', 'judges',`, `'dossier', 'tape', 'bacon', 'resume', 'judges',`);

// 3. end card and launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['carmen', `, `const LAUNCH_PIN = { keys: ['resume', 'carmen', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['carmen', `, `const LAUNCH_PIN = { keys: ['resume', 'carmen', `);
afterLine('app/DailyEndCard.jsx', "  bacon: { accent: '#9a3412', badgeBg: '#9a3412', badgeInk: T.white, Fin: LayoutGrid },", [
  `  resume: { accent: '${COLOR}', badgeBg: '${COLOR}', badgeInk: T.white, Fin: LayoutGrid },`]);
afterLine('app/DailyEndCard.jsx', "  { key: 'bacon',     cat: 'trivia',", [
  `  { key: 'resume',    cat: 'trivia',     name: 'Resume', tag: '${TAG}',   blurb: '${BLURB}', href: '/resume' },`]);

// 4. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "  { key: 'bacon', href: '/bacon'", [
  `  { key: 'resume', href: '/resume', name: 'Resume', tag: 'name the person from their resume', store: 'sot_resume_day', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}' },`]);
afterLine('app/DailyGamesGrid.jsx', "  { key: 'bacon', href: '/bacon'", [
  `  { key: 'resume', href: '/resume', name: 'Resume', tag: '${TAG}', img: '/games/btn-resume.png' },`]);
sub('app/DailyGamesGrid.jsx', `'clade', 'dossier', 'tape', 'bacon', 'redact',`, `'clade', 'dossier', 'tape', 'bacon', 'resume', 'redact',`);
afterLine('app/DailyStrip.jsx', "  { key: 'bacon', href: '/bacon'", [
  `  { key: 'resume', href: '/resume', name: 'Resume', img: '/games/btn-resume.png', store: 'sot_resume_day', tag: "${TAG}" , cat: 'Trivia' },`]);
sub('app/DailyStrip.jsx', `const ACCENTS = { bacon: `, `const ACCENTS = { resume: '${NAVY}', bacon: `);
sub('app/DailyStrip.jsx', `const TCOL = { bacon: `, `const TCOL = { resume: '${COLOR}', bacon: `);

// 5. archive
sub('app/archive/page.js', `import { PUZZLES as BACON_FULL } from '../bacon/puzzles';`,
  `import { PUZZLES as BACON_FULL } from '../bacon/puzzles';\nimport { PUZZLES as RESUME_FULL } from '../resume/puzzles';`);
afterLine('app/archive/page.js', 'const BACON = BACON_FULL.map(', [
  'const RESUME = RESUME_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));']);
afterLine('app/archive/page.js', "  { key: 'bacon', name: 'Bacon', path: '/bacon'", [
  `  { key: 'resume', name: 'Resume', path: '/resume', tag: '${TAG}', accent: '${COLOR}', bg: '${BG}', border: '${BORDER}', src: RESUME },`]);

// 6. the four puzzle-map registries
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_bacon } from '@/app/bacon/puzzles';`,
    `import { PUZZLES as P_bacon } from '@/app/bacon/puzzles';\nimport { PUZZLES as P_resume } from '@/app/resume/puzzles';`);
  sub(f, `bacon: P_bacon, `, `bacon: P_bacon, resume: P_resume, `);
}

// 7. alternations, rails, catalog, loft
sub('app/api/quiz/daily-status/route.js', `|tape|bacon|`, `|tape|bacon|resume|`);
sub('app/quizzes/QuizHomeClient.jsx', `|tape|bacon|`, `|tape|bacon|resume|`);
sub('app/DailySlateRail.jsx', `'tape', 'bacon', `, `'tape', 'bacon', 'resume', `);
sub('lib/quiz-catalog.js', `'tape', 'bacon', `, `'tape', 'bacon', 'resume', `);
sub('lib/loft.js', `'tape', 'bacon', `, `'tape', 'bacon', 'resume', `);

// 8. skills, glyph, challenge metric, family, blurb, preview tile
sub('lib/daily-skills.js', `bacon: ['mem', 'plan'],`, `bacon: ['mem', 'plan'], resume: ['mem', 'ded'],`);
afterLine('lib/game-glyphs.js', "  bacon: 'M5 7a2 2 0 1 0 0.01 0M19 17a2 2 0 1 0 0.01 0M7 7h5v10h5M10 10h4v4h-4z',", [
  "  resume: 'M4 3h16v18H4zM9 9a2.5 2.5 0 1 0 0.01 0M6.5 14c.6-1.6 1.6-2.4 2.5-2.4s1.9.8 2.5 2.4M14 7h4M14 10h4M7 17h11',  // a profile page: a head, a name line, job lines"]);
afterLine('lib/challenge-metric.js', "  bacon: { unit: 'films'", [
  "  resume: { unit: 'clues', one: 'clue', dir: 'low', solveFirst: true, field: 'guesses' },"]);
sub('lib/daily-families.js', `'dossier', 'clade', 'tape', 'bacon'],`, `'dossier', 'clade', 'tape', 'bacon', 'resume'],`);
afterLine('lib/game-blurbs.js', "  bacon: 'Link two actors", [
  "  resume: 'Name the famous person from their career profile: colleges, past jobs and fun facts. Fewest clues.',"]);
sub('app/GamePreviewTiles.jsx', `const Redact = () => (\n`, `// a profile card: banner, a hidden face, a name bar and job lines with logo tiles
const Resume = () => (
  <g><rect x={110} y={4} width={76} height={76} rx={4} className="w" /><rect x={110} y={4} width={76} height={16} rx={4} className="m" />
    <circle cx={126} cy={24} r={9} className="d" /><rect x={140} y={24} width={36} height={5} rx={2} className="d" />
    {[0, 1, 2].map((i) => <g key={i}><rect x={118} y={40 + i * 13} width={9} height={9} rx={2} className="m" /><rect x={132} y={41 + i * 13} width={44 - i * 8} height={4} rx={2} className="sm" /></g>)}</g>
);
const Redact = () => (\n`);
sub('app/GamePreviewTiles.jsx', `dossier: Dossier, bacon: Bacon, `, `dossier: Dossier, bacon: Bacon, resume: Resume, `);

// 9. groups: Resume joins the Guessing games
sub('lib/daily-groups.js', `  { name: 'Guessing games', cat: 'Trivia', keys: ['clade', 'dossier', 'bacon'] },`,
  `  { name: 'Guessing games', cat: 'Trivia', keys: ['clade', 'dossier', 'bacon', 'resume'] },`);

// 10. the set page
const PS = 'lib/puzzle-sets.js';
sub(PS, `    title: 'Free Daily Trivia Guessing Games: Guess the Animal, Guess the Answer, Link the Actors | Mind Loft',
    h1: 'Free Daily Trivia Guessing Games: Guess the Animal, Guess the Answer and Link Two Actors',
    description: 'Three free daily trivia guessing games: a guess-the-animal game played on the family tree, a guessing game that compares five facts on every guess, and a game where you link two actors through the films they share. No signup.',
    lede: 'Three games where every guess tells you something. Clade hides one animal and answers every guess with the branch of the family tree it shares. Dossier hides a president, an element or a US state and compares five facts on every guess. Bacon names two actors and you guess your way from one to the other through films they made together.',
    how: [
      'Clade and Dossier give you eight guesses, each one answered with how close it came, and fewer guesses score more. Bacon is played like Six Degrees of Kevin Bacon: name a film, type a co-star from it, and keep going to the target. A wrong film or co-star is a strike, and the fewer films you need, the better.',
    ],
    faq: [
      ['How does Bacon pick its films?', 'American films from 1930 to 2022, with the main cast Wikipedia lists for each one.'],
      ['Are they free?', 'All three, every day, no account required.'],
    ],`, `    title: 'Free Daily Trivia Guessing Games: Guess the Animal, the Answer, the Person | Mind Loft',
    h1: 'Free Daily Trivia Guessing Games: Guess the Animal, Guess the Answer, Link Two Actors and Name the Resume',
    description: 'Four free daily trivia guessing games: guess the animal on the family tree, a five-fact guessing game, link two actors through their films, and name a famous person from their resume. No signup.',
    lede: 'Four games where every guess tells you something. Clade hides one animal and answers every guess with the branch of the family tree it shares. Dossier hides a president, an element or a US state and compares five facts on every guess. Bacon names two actors and you guess your way from one to the other through films they made together. Resume shows a famous person’s career profile with the name hidden, and opens it up one section at a time.',
    how: [
      'Clade and Dossier give you eight guesses, each one answered with how close it came, and fewer guesses score more. Bacon is played like Six Degrees of Kevin Bacon: name a film, type a co-star from it, and keep going to the target. A wrong film or co-star is a strike, and the fewer films you need, the better. Resume starts with where the person went to college; skills, early jobs, fun facts, later jobs and their headline open one by one, and every wrong guess opens the next.',
    ],
    faq: [
      ['How does Bacon pick its films?', 'American films from 1930 to 2022, with the main cast Wikipedia lists for each one.'],
      ['Who shows up in Resume?', 'Business leaders, stars and public figures with long, well-documented careers. The Sunday Edition is a deeper cut.'],
      ['Are they free?', 'All four, every day, no account required.'],
    ],`);

// 11. the trivia page
const PC = 'lib/puzzle-categories.js';
sub(PC, `'clade', 'dossier', 'tape', 'bacon', 'redact', 'carmen'],`, `'clade', 'dossier', 'tape', 'bacon', 'resume', 'redact', 'carmen'],`);
sub(PC, `bacon: 'Six degrees of Kevin Bacon',`, `bacon: 'Six degrees of Kevin Bacon', resume: 'Guess who from a resume',`);

console.log(`wire-resume: ${applied} applied, ${skipped} already present`);
