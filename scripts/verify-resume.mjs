// scripts/verify-resume.mjs: re-proves app/resume/puzzles.js.
//
//   node scripts/verify-resume.mjs
//
// What it enforces:
//   - num, quizId, dateLabel and the Sunday flag from the live date; dates run
//     day after day with no gap from the launch, 2026-11-09.
//   - every answer is in app/resume/universe.js, no answer repeats, and no alt
//     name is another person's name on the list.
//   - every board has 1 to 4 schools, 2 to 6 skills, 1 to 5 early and 1 to 5
//     later jobs, 3 or 4 fun facts and a headline; every school, job and fact
//     field is filled in.
//   - no field names the answer: neither the full name nor any surname or alt
//     of two or more letters appears as a whole word anywhere on the profile.
//   - no em dash, and no "present" in a years field (a role still held is
//     written "2014 on").
import { PUZZLES } from '../app/resume/puzzles.js';
import { UNIVERSE } from '../app/resume/universe.js';

const START = '2026-11-09';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
let fails = 0;
const fail = (m) => { fails++; console.error('FAIL ' + m); };
const day = (s) => new Date(`${s}T12:00:00Z`).getTime();
const U = new Set(UNIVERSE);
const fold = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const UF = new Map(UNIVERSE.map((n) => [fold(n), n]));

if (UNIVERSE.length < 250) fail(`universe has ${UNIVERSE.length} names; keep at least 250 so a list never narrows the answer`);
const used = new Set();
let prev = null;
PUZZLES.forEach((p, i) => {
  const tag = `#${p.num} ${p.live} ${p.name}`;
  if (p.num !== i + 1) fail(`${tag}: num should be ${i + 1}`);
  if (i === 0 && p.live !== START) fail(`${tag}: the bank should open on ${START}`);
  if (prev && day(p.live) - day(prev) !== 86400000) fail(`${tag}: dates are not contiguous`);
  prev = p.live;
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `resume-${m}-${d}-${String(y).slice(2)}`) fail(`${tag}: quizId does not match the date`);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${d}, ${y}`) fail(`${tag}: dateLabel does not match the date`);
  if (!!p.sunday !== (new Date(`${p.live}T12:00:00Z`).getUTCDay() === 0)) fail(`${tag}: sunday flag does not match the weekday`);
  if (!U.has(p.name)) fail(`${tag}: answer is not in the universe`);
  if (used.has(p.name)) fail(`${tag}: answer repeats`);
  used.add(p.name);
  for (const a of p.alt || []) { const hit = UF.get(fold(a)); if (hit && hit !== p.name) fail(`${tag}: alt "${a}" is another person on the list (${hit})`); }

  const n = (arr) => (Array.isArray(arr) ? arr.length : -1);
  if (n(p.edu) < 1 || n(p.edu) > 4) fail(`${tag}: needs 1 to 4 schools`);
  if (n(p.skills) < 2 || n(p.skills) > 6) fail(`${tag}: needs 2 to 6 skills`);
  if (n(p.early) < 1 || n(p.early) > 5) fail(`${tag}: needs 1 to 5 early jobs`);
  if (n(p.later) < 1 || n(p.later) > 5) fail(`${tag}: needs 1 to 5 later jobs`);
  if (n(p.facts) < 3 || n(p.facts) > 4) fail(`${tag}: needs 3 or 4 fun facts`);
  if (!p.headline) fail(`${tag}: no headline`);
  if (typeof p.location !== 'string') fail(`${tag}: location must be a string (empty for none)`);
  for (const e of p.edu || []) if (!e.school || !e.degree || !e.years) fail(`${tag}: a school lacks school, degree or years`);
  for (const j of [...(p.early || []), ...(p.later || [])]) {
    if (!j.title || !j.org || !j.years) fail(`${tag}: a job lacks title, org or years`);
    if (/present/i.test(j.years || '')) fail(`${tag}: years "${j.years}" says present; write the start year and "on"`);
  }

  // nothing on the profile may name the answer
  const texts = [p.headline, p.location, ...p.skills, ...p.facts,
    ...p.edu.flatMap((e) => [e.school, e.degree, e.years]),
    ...[...p.early, ...p.later].flatMap((j) => [j.title, j.org, j.years])];
  const words = new Set([p.name, ...(p.alt || [])].map(fold).filter((w) => w.length >= 2));
  // the surname alone counts too, except a word that is everyday English (Rice, Su, Rock are checked as alts only when 3+ letters and capitalised below)
  const parts = fold(p.name).split(' ');
  if (parts.length > 1) words.add(parts[parts.length - 1]);
  for (const t of texts) {
    if (/—/.test(t || '')) fail(`${tag}: em dash in "${t}"`);
    const f = ` ${fold(t)} `;
    for (const w of words) {
      if (w.length < 3 && !/^[A-Z]/.test(w)) continue;
      // everyday words used as alts (Rock, Rice) only count when capitalised as a name in the text
      if (['rock', 'rice', 'su', 'arnold', 'martha', 'michelle', 'oprah', 'shaquille'].includes(w)) {
        const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (w === 'rock' || w === 'rice' || w === 'su') { if (new RegExp(`\\b${w[0].toUpperCase()}${w.slice(1)}\\b`).test(t)) fail(`${tag}: "${t}" names the answer (${w})`); continue; }
        if (re.test(t)) fail(`${tag}: "${t}" names the answer (${w})`);
        continue;
      }
      if (f.includes(` ${w} `)) fail(`${tag}: "${t}" names the answer (${w})`);
    }
  }
});
console.log(fails ? `${fails} failure(s)` : `all ${PUZZLES.length} Resume boards verified (${PUZZLES[0].live} to ${PUZZLES[PUZZLES.length - 1].live}), ${UNIVERSE.length} names to guess from`);
process.exit(fails ? 1 : 0);
