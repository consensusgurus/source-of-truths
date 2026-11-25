// scripts/wire-hired.mjs - the anchored site wiring for Hired, the daily job
// interview (owner, 2026-11-25). Every edit hangs off Myth's entry (the last
// trivia daily added) and fails loudly if its anchor is missing or not unique;
// an edit already present is skipped, so the script is safe to re-run.
//   node scripts/wire-hired.mjs
import fs from 'fs';
import path from 'path';
import url from 'url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const R = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const W = (f, s) => fs.writeFileSync(path.join(ROOT, f), s);
let edits = 0, skipped = 0;
function one(f, a, b) {
  const s = R(f);
  if (s.includes(b)) { skipped++; return; }
  const n = s.split(a).length - 1;
  if (n !== 1) throw new Error(`${f}: anchor found ${n} times: ${a.slice(0, 90)}`);
  W(f, s.replace(a, () => b)); edits++;
}
function after(f, needle, add) {
  const s = R(f);
  if (s.includes(add.split('\n')[0])) { skipped++; return; }
  const lines = s.split('\n');
  const hit = lines.map((l, i) => (l.includes(needle) ? i : -1)).filter((i) => i >= 0);
  if (hit.length !== 1) throw new Error(`${f}: line anchor found ${hit.length} times: ${needle.slice(0, 90)}`);
  lines.splice(hit[0] + 1, 0, add);
  W(f, lines.join('\n')); edits++;
}

const C = '#0f766e', NAVY = '#5eead4', SOFT = '#e2f3f1', BORDER = 'rgba(15,118,110,0.4)';
const TAG = 'One job a day, five rounds';
const HOW = 'Every day is an interview for one job, the same for everyone, from accountant to chef. Twenty questions on that job in five rounds of four, Phone Screen to Final Round. A wrong answer or an empty clock ends that round, not the interview. Ranked on right answers, then time; it ends with an offer letter.';

// ---- the registry: the row, the launch date, the premiere (one new-game pop-up, staggered like the others)
after('lib/daily-games.js', `{ key: 'myth', miss: 'Asked', name: 'Myth'`, `  { key: 'hired', miss: 'Asked', name: 'Hired', cat: 'Trivia', subject: 'Careers', tag: 'Job interview', tagLong: 'One job a day, twenty questions in five interview rounds', how: '${HOW}', color: '${C}', colorNavy: '${NAVY}' },`);
one('lib/daily-games.js', `export const LAUNCH_DAILY = { music: '2026-11-23',`, `export const LAUNCH_DAILY = { hired: '2026-11-25', music: '2026-11-23',`);
one('lib/daily-games.js', `export const PREMIERES = [\n`, `export const PREMIERES = [\n  { key: 'hired', from: '2026-11-25', until: '2026-12-02' },\n`);

// ---- lists that name every trivia gauntlet daily
for (const f of ['app/DailySlateRail.jsx', 'lib/loft.js', 'lib/quiz-catalog.js', 'lib/quiz-xp.js', 'app/DailyGamesGrid.jsx', 'lib/puzzle-categories.js', 'app/api/quiz/sunday-slate/route.js']) {
  const s = R(f);
  const a = `'nature', 'tech', 'myth', `;
  if (s.includes(`'nature', 'tech', 'myth', 'hired', `)) { skipped++; continue; }
  const n = s.split(a).length - 1;
  if (n !== 1) throw new Error(`${f}: list anchor found ${n} times`);
  W(f, s.replace(a, `'nature', 'tech', 'myth', 'hired', `)); edits++;
}
one('lib/puzzle-categories.js', `myth: 'Mythology trivia',`, `myth: 'Mythology trivia', hired: 'Job skills quiz',`);
for (const f of ['app/api/quiz/daily-status/route.js', 'app/quizzes/QuizHomeClient.jsx']) one(f, `|tech|myth|`, `|tech|myth|hired|`);
one('lib/quiz-scoring.js', `key === 'tech' || key === 'myth' ||`, `key === 'tech' || key === 'myth' || key === 'hired' ||`);
one('lib/daily-skills.js', `myth: ['mem'],`, `myth: ['mem'], hired: ['mem'],`);
one('lib/daily-difficulty.js', `myth: 3,`, `myth: 3, hired: 3,`);
one('app/useNextUnplayed.js', `myth: 'history',`, `myth: 'history', hired: 'business',`);
one('lib/daily-groups.js', `{ name: 'Classroom gauntlets', cat: 'Trivia', keys: ['sci', 'art', 'history', 'foodie'] },`, `{ name: 'Classroom gauntlets', cat: 'Trivia', keys: ['sci', 'art', 'history', 'foodie', 'hired'] },`);
after('lib/finish-sets.js', `{ name: 'Wild and wired', cat: 'Trivia', keys: ['nature', 'tech', 'myth'] },`, `  { name: 'Day job', cat: 'Trivia', keys: ['hired', 'biz', 'tape'] },`);
for (const f of ['app/DailyEndCard.jsx', 'app/api/quiz/daily-order/route.js']) one(f, `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: ['hired', `);

// ---- one line per game
after('lib/game-blurbs.js', `  myth: "Myth, legend and belief, from mortal to Olympian.",`, `  hired: "A job interview a day, from accountant to chef. Get the offer.",`);
after('lib/game-glyphs.js', `  myth: 'M13 2L4 14h7l-1 8 9-12h-7z', // a thunderbolt`, `  hired: 'M3 8h18v12H3zM8 8V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V8M3 13h18M11 13v2h2v-2', // a briefcase`);
after('lib/finish-beats.js', `  myth: lock,`, `  hired: lock,`);
after('app/DailyStrip.jsx', `{ key: 'myth', href: '/myth', name: 'Myth', img:`, `  { key: 'hired', href: '/hired', name: 'Hired', img: '/games/btn-hired.png', store: 'sot_hired_day', tag: "${TAG}" , cat: 'Trivia' },`);
one('app/DailyStrip.jsx', `const ACCENTS = { `, `const ACCENTS = { hired: '${NAVY}', `);
one('app/DailyStrip.jsx', `const TCOL = { `, `const TCOL = { hired: '${C}', `);
after('app/DailyGamesGrid.jsx', `{ key: 'myth', href: '/myth', name: 'Myth', tag:`, `  { key: 'hired', href: '/hired', name: 'Hired', tag: '${TAG}', img: '/games/btn-hired.png' },`);
after('app/DailyGamesPromo.jsx', `{ key: 'myth', href: '/myth', name: 'Myth', tag:`, `  { key: 'hired', href: '/hired', name: 'Hired', tag: 'one job a day, five rounds', store: 'sot_hired_day', accent: '${C}', bg: '${SOFT}', border: '${BORDER}' },`);
after('app/DailyEndCard.jsx', `  myth: { accent: '#6d28d9', badgeBg: '#6d28d9', badgeInk: T.white, Fin: Zap },`, `  hired: { accent: '${C}', badgeBg: '${C}', badgeInk: T.white, Fin: Trophy },`);
after('app/DailyEndCard.jsx', `{ key: 'myth', cat: 'trivia',   name: 'Myth',`, `  { key: 'hired', cat: 'trivia',   name: 'Hired', tag: 'Job interview', blurb: 'A job interview a day, from accountant to chef: twenty questions in five rounds. A miss ends the round, not the interview.', href: '/hired' },`);
after('lib/challenge-metric.js', `  witness: { unit: 'right', one: 'right', dir: 'high', say: 'got' },`, `  hired: { unit: 'right', one: 'right', dir: 'high', say: 'got' },`);

// ---- the archive and the slate
after('app/archive/page.js', `import { PUZZLES as MYTH_FULL } from '../myth/puzzles';`, `import { PUZZLES as HIRED_FULL } from '../hired/puzzles';`);
after('app/archive/page.js', `const MYTH = MYTH_FULL.map(`, `const HIRED = HIRED_FULL.map(({ num, quizId, live, dateLabel }) => ({ num, quizId, live, dateLabel }));`);
after('app/archive/page.js', `{ key: 'myth', name: 'Myth', path: '/myth',`, `  { key: 'hired', name: 'Hired', path: '/hired', tag: '${TAG}', accent: '${C}', bg: '${SOFT}', border: '${BORDER}', src: HIRED },`);
after('lib/daily-slate.js', `import { PUZZLES as P_myth } from '@/app/myth/puzzles';`, `import { PUZZLES as P_hired } from '@/app/hired/puzzles';`);
one('lib/daily-slate.js', `myth: P_myth,`, `myth: P_myth, hired: P_hired,`);
console.log(`wire-hired: ${edits} edits, ${skipped} already present`);
