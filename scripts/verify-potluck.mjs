// scripts/verify-potluck.mjs: checks the Potluck bank (app/potluck/puzzles.js)
// against the rules in scripts/gen-potluck.mjs. It re-derives everything from
// the quiz catalog rather than trusting the generator: every quiz must exist,
// still be eligible (a quiz later retired, unlisted or reformatted to a
// full-page board fails here), and every day must hold three different format
// families from three different departments with no quiz used twice.
//
// Played days are frozen: a failure on a day already live is reported as a
// WARNING, because rewriting it would move a leaderboard.
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);

const { PUZZLES } = await import('../app/potluck/puzzles.js');
const { QUIZZES } = await import('../lib/quizzes.js');
const { LISTS } = await import('../lib/data.js');
const { quizDept } = await import('../lib/quiz-departments.js');
const { POTLUCK_FAMILY, potluckEligible } = await import('../lib/potluck.js');

let fails = 0, warns = 0;
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
const bad = (p, m) => { if (p.live < today) { warns++; console.warn(`… ${p.quizId} (played): ${m}`); } else { fails++; console.error(`✗ ${p.quizId}: ${m}`); } };
const byId = new Map(QUIZZES.map((q) => [q.id, q]));
const listMode = new Map(LISTS.map((l) => [l.id, l.mode || 'consensus']));
const seen = new Map();

const M = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `potluck-${m}-${d}-${String(y).slice(2)}`; };
PUZZLES.forEach((p, k) => {
  if (p.num !== k + 1) bad(p, `num ${p.num}, expected ${k + 1}`);
  if (p.quizId !== M(p.live)) bad(p, `quizId does not match live ${p.live}`);
  if (k > 0) {
    const prev = new Date(PUZZLES[k - 1].live + 'T12:00:00Z'); prev.setUTCDate(prev.getUTCDate() + 1);
    if (prev.toISOString().slice(0, 10) !== p.live) bad(p, `dates not contiguous after ${PUZZLES[k - 1].live}`);
  }
  if (p.sunday) bad(p, 'Potluck has no Sunday Edition');
  if (!Array.isArray(p.quizzes) || p.quizzes.length !== 3) { bad(p, 'needs exactly three quizzes'); return; }
  const fams = new Set(), depts = new Set();
  for (const id of p.quizzes) {
    const q = byId.get(id);
    if (!q) { bad(p, `${id} is not a quiz`); continue; }
    if (!potluckEligible(q, listMode, Date.parse(p.live + 'T04:00:00Z'))) bad(p, `${id} is not eligible (format ${q.format || 'default'})`);
    fams.add(POTLUCK_FAMILY[q.format || 'default']);
    depts.add(quizDept(q));
    if (seen.has(id)) bad(p, `${id} already used on ${seen.get(id)}`);
    seen.set(id, p.live);
  }
  if (fams.size !== 3) bad(p, `formats not varied: ${[...fams].join(', ')}`);
  if (depts.size !== 3) bad(p, `departments not varied: ${[...depts].join(', ')}`);
});
const last = PUZZLES[PUZZLES.length - 1];
const left = Math.round((Date.parse(last.live) - Date.parse(today)) / 86400000);
if (left < 0) { fails++; console.error(`✗ bank ran out on ${last.live}`); }
else if (left < 14) { warns++; console.warn(`… bank ends ${last.live}, ${left} days left: run scripts/gen-potluck.mjs`); }
console.log(`${fails ? 'FAIL' : 'ok'}  potluck: ${PUZZLES.length} days to ${last.live}, ${fails} failures, ${warns} warnings`);
process.exit(fails ? 1 : 0);
