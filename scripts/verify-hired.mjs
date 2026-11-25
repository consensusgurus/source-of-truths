// scripts/verify-hired.mjs - the gate for Hired's bank (app/hired/). Checks the
// shape of every day (one job, five rounds of four in its field, the schedule),
// every question (four distinct choices, one answer, no em dash, a known field
// and subtopic), and the rules a trivia bank keeps: no question asked twice, no
// answer twice in one day, and the bank matching its pools (gen-hired --check).
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import url from 'node:url';
import { QUESTIONS, QUESTION_MAP } from '../app/hired/questions.js';
import { PUZZLES } from '../app/hired/puzzles.js';
import { FIELDS, FIRST_LIVE, SCHEDULE } from './gen-hired.mjs';
import { JOBS } from '../app/hired/offer.js';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const errs = [];
const bad = (m) => errs.push(m);
const SUBS = {
  Accounting: ['Journal Entries', 'Standards', 'Financial Statements', 'Tax', 'Audit'],
  Finance: ['Valuation', 'Bonds and Rates', 'Markets', 'Corporate Finance', 'Options'],
  Coding: ['Programming Basics', 'Algorithms', 'Web', 'Databases', 'Software Practice'],
  Medicine: ['Anatomy', 'Pharmacology', 'Medical Terms', 'Vitals and Diagnosis', 'Clinical Practice'],
  Engineering: ['Mechanics', 'Electrical', 'Thermo and Fluids', 'Materials', 'Units'],
  Marketing: ['Strategy', 'Branding', 'Digital', 'Metrics', 'Advertising'],
  Excel: ['Formulas', 'Lookups', 'Data Tools', 'Shortcuts', 'Charts and Formatting'],
  Chemistry: ['Periodic Table', 'Reactions', 'Stoichiometry', 'Acids and Bases', 'Lab Practice'],
  Trades: ['Electrical Work', 'Plumbing', 'Carpentry', 'HVAC', 'Tools and Safety'],
  Culinary: ['Knife Skills', 'Cooking Methods', 'Sauces', 'Food Safety', 'Baking and Pastry'],
  Bartending: ['Cocktails', 'Spirits', 'Bar Technique', 'Wine and Beer', 'Bar Service'],
  Aviation: ['Flight Basics', 'Navigation', 'Weather', 'Radio and Procedures', 'Aircraft Systems'],
};
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const same = (s) => String(s).toLowerCase().replace(/\s+/g, ' ').trim();
const seenQ = new Map();
for (const q of QUESTIONS) {
  if (!FIELDS.includes(q.cat)) bad(`${q.id}: unknown field ${q.cat}`);
  if (!(SUBS[q.cat] || []).includes(q.sub)) bad(`${q.id}: unknown subtopic "${q.sub}" for ${q.cat}`);
  if (!Array.isArray(q.choices) || q.choices.length !== 4) bad(`${q.id}: needs four choices`);
  if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) bad(`${q.id}: bad correct index`);
  if (new Set(q.choices.map(same)).size !== 4) bad(`${q.id}: duplicate choices`);
  for (const s of [q.q, ...q.choices]) {
    if (/—/.test(s)) bad(`${q.id}: em dash`);
    if (!String(s).trim()) bad(`${q.id}: empty text`);
  }
  if (!/[?]$/.test(q.q)) bad(`${q.id}: stem should end with a question mark`);
  const k = norm(q.q);
  if (seenQ.has(k)) bad(`${q.id}: same question as ${seenQ.get(k)}`);
  seenQ.set(k, q.id);
}
let prevLive = null;
PUZZLES.forEach((p, i) => {
  if (p.num !== i + 1) bad(`day ${p.num}: numbering`);
  if (prevLive && p.live <= prevLive) bad(`day ${p.num}: live date not after the day before`);
  prevLive = p.live;
  if (p.sunday) bad(`day ${p.num}: Hired runs no Sunday Edition`);
  if (p.qids.length !== 20) bad(`day ${p.num}: ${p.qids.length} questions, wants 20`);
  const d = Math.round((Date.parse(p.live) - Date.parse(FIRST_LIVE)) / 86400000);
  if (p.job !== SCHEDULE[d]) bad(`day ${p.num}: job ${p.job}, SCHEDULE says ${SCHEDULE[d]}`);
  if (!JOBS[p.job]) bad(`day ${p.num}: unknown job ${p.job}`);
  const field = JOBS[p.job] && JOBS[p.job].field;
  if (i > 0 && PUZZLES[i - 1].job === p.job) bad(`day ${p.num}: same job two days running`);
  const answers = new Set();
  p.qids.forEach((id, s) => {
    const q = QUESTION_MAP[id];
    if (!q) { bad(`day ${p.num}: missing ${id}`); return; }
    const r = Math.floor(s / 4);
    if (q.cat !== field) bad(`${id}: field ${q.cat}, the job wants ${field}`);
    if (q.tier !== r + 1) bad(`${id}: tier ${q.tier} in round ${r + 1}`);
    const a = same(q.choices[q.correct]);
    if (answers.has(a)) bad(`day ${p.num}: answer "${q.choices[q.correct]}" twice`);
    answers.add(a);
  });
});
const chk = spawnSync(process.execPath, [path.join(here, 'gen-hired.mjs'), '--check'], { encoding: 'utf8' });
if (chk.status !== 0) bad(`gen-hired --check: ${(chk.stdout + chk.stderr).trim()}`);
if (errs.length) { console.error(`verify-hired: ${errs.length} problem(s)\n  ${errs.slice(0, 40).join('\n  ')}`); process.exit(1); }
console.log(`verify-hired: OK (${PUZZLES.length} days, ${QUESTIONS.length} questions, through ${PUZZLES[PUZZLES.length - 1].live})`);
