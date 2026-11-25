// scripts/gen-hired.mjs - builds Hired's bank (app/hired/questions.js and
// app/hired/puzzles.js) from the field pools in scripts/hired-fields/.
//
//   node scripts/gen-hired.mjs [--through YYYY-MM-DD] [--check]
//
// HIRED (owner, 2026-11-25: "one daily puzzle" shaped like a gauntlet, its
// questions feeding the databases). One job a day; five interview rounds of
// four questions. The rounds climb: round 1 (Phone Screen) asks tier 1
// questions, round 5 (Final Round) tier 5.
//
// ONE JOB A DAY (owner, 2026-11-25). SCHEDULE names the job for each day in
// order from FIRST_LIVE; the job (app/hired/offer.js JOBS) names its field, and
// all twenty questions come from that field's pool: round r takes four at tier
// r, in pool order, so APPENDING to the end of a tier never moves a question
// that already went out. A tier that runs dry borrows from the nearest tier
// (lower first) and the script says so. To extend the bank, add days to the
// end of SCHEDULE and enough questions to the pools (a new job: a new pool,
// a JOBS entry, a POOLS line and a Careers Database topic in lib/qdb.js).
//
// THE PAST IS FROZEN. Re-running is byte-identical on unchanged pools. When the
// bank exists, every day already live is compared with the rebuild and the
// script refuses to write if any of them would change.
//
// COLUMNS. Each day gets a balanced (5/5/5/5) no-3-run column plan from the
// day's own seed; authors never choose a column.
import fs from 'fs';
import path from 'path';
import url from 'url';
import { ACCOUNTING, FINANCE, CODING } from './hired-fields/pools-a.mjs';
import { MEDICINE, ENGINEERING, MARKETING } from './hired-fields/pools-b.mjs';
import { EXCEL, CHEMISTRY, TRADES } from './hired-fields/pools-c.mjs';
import { CULINARY, BARTENDING, AVIATION } from './hired-fields/pools-d.mjs';
import { JOBS } from '../app/hired/offer.js';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const Q_FILE = path.join(ROOT, 'app/hired/questions.js');
const P_FILE = path.join(ROOT, 'app/hired/puzzles.js');

export const FIRST_LIVE = '2026-11-25';
export const POOLS = { Accounting: ACCOUNTING, Coding: CODING, Medicine: MEDICINE, Finance: FINANCE, Engineering: ENGINEERING, Marketing: MARKETING, Excel: EXCEL, Chemistry: CHEMISTRY, Trades: TRADES, Culinary: CULINARY, Bartending: BARTENDING, Aviation: AVIATION };
export const FIELDS = Object.keys(POOLS);
// One job per day from FIRST_LIVE. Append only.
export const SCHEDULE = [
  'accountant', 'developer', 'chef', 'physician', 'exceltutor', 'analyst', 'engineer', 'bartender', 'marketer', 'chemist', 'contractor', 'pilot',
  'accountant', 'developer', 'physician', 'exceltutor', 'analyst', 'engineer', 'marketer', 'chemist', 'contractor',
];
const ROUNDS = 5, PER = 4, TOTAL = ROUNDS * PER;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const ti = argv.indexOf('--through');
const THROUGH = ti >= 0 ? argv[ti + 1] : '2026-12-15';
const die = (m) => { console.error(`gen-hired: ${m}`); process.exit(1); };

function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function seedOf(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function columnPlan(day) {
  const rnd = rng(seedOf(`hired:cols:${day}`));
  const bag = [];
  for (let c = 0; c < 4; c++) for (let i = 0; i < TOTAL / 4; i++) bag.push(c);
  for (let n = 0; n < 5000; n++) {
    const p = bag.slice();
    for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    let ok = true;
    for (let i = 2; i < p.length; i++) if (p[i] === p[i - 1] && p[i] === p[i - 2]) { ok = false; break; }
    if (ok) return p;
  }
  throw new Error(`day ${day}: no column plan`);
}
const esc = (s) => String(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const pad2 = (n) => String(n).padStart(2, '0');
const qid = (day, slot) => `d${day < 100 ? pad2(day) : day}q${pad2(slot)}`;
function addDays(iso, n) { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
const label = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; };
const quizId = (iso) => { const [y, m, d] = iso.split('-'); return `hired-${m}-${d}-${y.slice(2)}`; };


export function build(through = THROUGH) {
  for (const f of FIELDS) {
    for (const e of POOLS[f]) {
      if (!Array.isArray(e) || e.length !== 5 || !Array.isArray(e[4]) || e[4].length !== 3) die(`${f}: malformed entry ${JSON.stringify(e).slice(0, 90)}`);
      if (!(e[0] >= 1 && e[0] <= 5)) die(`${f}: bad tier on "${e[2]}"`);
    }
  }
  const used = Object.fromEntries(FIELDS.map((f) => [f, new Set()]));
  const byTier = Object.fromEntries(FIELDS.map((f) => [f, [1, 2, 3, 4, 5].map((t) => POOLS[f].map((e, i) => ({ e, i })).filter((x) => x.e[0] === t))]));
  const take = (f, tier, why) => {
    const order = [tier, tier - 1, tier + 1, tier - 2, tier + 2, tier - 3, tier + 3, tier - 4, tier + 4].filter((t) => t >= 1 && t <= 5);
    for (const t of order) {
      const hit = byTier[f][t - 1].find((x) => !used[f].has(x.i));
      if (hit) { used[f].add(hit.i); if (t !== tier) console.warn(`gen-hired: ${why}: ${f} tier ${tier} ran dry, borrowed tier ${t}`); return hit.e; }
    }
    die(`${why}: ${f} pool is empty`);
  };
  const questions = [], puzzles = [];
  for (let d = 0; ; d++) {
    const live = addDays(FIRST_LIVE, d);
    if (live > through) break;
    const job = SCHEDULE[d];
    if (!job) die(`SCHEDULE ends before ${live}; add days or lower --through`);
    if (!JOBS[job] || !POOLS[JOBS[job].field]) die(`day ${d + 1}: unknown job or field ${job}`);
    const f = JOBS[job].field;
    const day = d + 1;
    const cols = columnPlan(day);
    const qids = [];
    for (let r = 0; r < ROUNDS; r++) {
      for (let k = 0; k < PER; k++) {
        const slot = r * PER + k + 1;
        const e = take(f, r + 1, `day ${day} round ${r + 1}`);
        const [tier, sub, q, a, wrong] = e;
        const col = cols[slot - 1];
        const choices = wrong.slice();
        choices.splice(col, 0, a);
        const id = qid(day, slot);
        qids.push(id);
        questions.push({ id, cat: f, sub, tier: r + 1, at: tier, q, choices, correct: col });
      }
    }
    puzzles.push({ num: day, quizId: quizId(live), live, dateLabel: label(live), job, qids });
  }
  const left = Object.fromEntries(FIELDS.map((f) => [f, POOLS[f].length - used[f].size]));
  return { questions, puzzles, left };
}

const Q_HEAD = `// Question bank for Hired, the daily job skills interview (owner, 2026-11-25).
// Imported ONLY by the server (app/hired/page.js resolves the picked day's twenty
// questions and ships just that day; lib/qdb-library.js reads the past days into
// the Careers Database). GENERATED by scripts/gen-hired.mjs from
// scripts/hired-fields/; do not hand-edit.
//
//   id       'd<day>q<slot>', slot 1..20 in play order
//   cat      the job's field (Accounting, Coding, Culinary, ...), the topic in
//            the Careers Database; one field per day
//   sub      the field's subtopic, the lane in the Careers Database
//   tier     the round it plays in, 1 (Phone Screen) .. 5 (Final Round)
//   at       the tier the author pitched it at (equal to tier unless a pool ran dry)
//   choices  exactly four; the correct column came from a per-day balanced plan
export const QUESTIONS = [
`;
const P_HEAD = `// Puzzle data for Hired, the daily job skills interview. Each day is one job
// (\`job\`, a key of JOBS in app/hired/offer.js) and five rounds of four question
// ids from questions.js, in play order. No Sunday Edition. GENERATED by scripts/gen-hired.mjs; the past is
// frozen (the generator refuses to change a day that has gone live).
export const PUZZLES = [
`;
function render({ questions, puzzles }) {
  const q = Q_HEAD + questions.map((x) => `  { id: '${x.id}', cat: '${x.cat}', sub: '${esc(x.sub)}', tier: ${x.tier}, at: ${x.at}, q: '${esc(x.q)}', choices: [${x.choices.map((c) => `'${esc(c)}'`).join(', ')}], correct: ${x.correct} },`).join('\n')
    + '\n];\n\nexport const QUESTION_MAP = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));\n';
  const p = P_HEAD + puzzles.map((x) => `  {\n    num: ${x.num},\n    quizId: '${x.quizId}',\n    live: '${x.live}',\n    dateLabel: '${x.dateLabel}',\n    job: '${x.job}',\n    qids: [${x.qids.map((i) => `'${i}'`).join(', ')}],\n  },`).join('\n') + '\n];\n';
  return { q, p };
}

if (process.argv[1] && path.resolve(process.argv[1]) === url.fileURLToPath(import.meta.url)) {
  const bank = build();
  const out = render(bank);
  const etToday = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  if (fs.existsSync(Q_FILE) && fs.existsSync(P_FILE)) {
    const { QUESTION_MAP: OLDQ } = await import(url.pathToFileURL(Q_FILE).href + `?t=${Date.now()}`);
    const { PUZZLES: OLDP } = await import(url.pathToFileURL(P_FILE).href + `?t=${Date.now()}`);
    const NEWQ = Object.fromEntries(bank.questions.map((x) => [x.id, x]));
    for (const day of OLDP.filter((x) => x.live <= etToday)) {
      const nd = bank.puzzles.find((x) => x.num === day.num);
      if (!nd || nd.live !== day.live || nd.qids.join() !== day.qids.join()) die(`day ${day.num} (${day.live}) is live and would change`);
      for (const id of day.qids) if (JSON.stringify(OLDQ[id]) !== JSON.stringify(NEWQ[id])) die(`question ${id} on live day ${day.num} would change`);
    }
  }
  if (CHECK) {
    const same = fs.existsSync(Q_FILE) && fs.readFileSync(Q_FILE, 'utf8') === out.q && fs.readFileSync(P_FILE, 'utf8') === out.p;
    console.log(same ? 'gen-hired --check: bank matches the pools' : 'gen-hired --check: bank DIFFERS from the pools');
    process.exit(same ? 0 : 1);
  }
  fs.mkdirSync(path.dirname(Q_FILE), { recursive: true });
  fs.writeFileSync(Q_FILE, out.q);
  fs.writeFileSync(P_FILE, out.p);
  console.log(`gen-hired: ${bank.puzzles.length} days (${bank.puzzles[0].live}..${bank.puzzles[bank.puzzles.length - 1].live}), ${bank.questions.length} questions; left in pools: ${JSON.stringify(bank.left)}`);
}
