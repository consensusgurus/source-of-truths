// scripts/verify-dossier.mjs: re-proves app/dossier/puzzles.js and the
// universe tables. Imports nothing from the generator.
//
//   node scripts/verify-dossier.mjs
//   VERIFY_DOSSIER_BANK=/path/to/bank.js node scripts/verify-dossier.mjs
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { UNIVERSES } from '../app/dossier/universes.js';

const here = path.dirname(new URL(import.meta.url).pathname);
const bankPath = process.env.VERIFY_DOSSIER_BANK || path.join(here, '..', 'app', 'dossier', 'puzzles.js');
const { PUZZLES } = await import(pathToFileURL(path.resolve(bankPath)).href);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEK = { 1: 'presidents', 2: 'elements', 3: 'states', 4: 'presidents', 5: 'elements', 6: 'states' };
let fails = 0;
const fail = (msg) => { fails++; console.error('FAIL ' + msg); };

for (const [id, u] of Object.entries(UNIVERSES)) {
  if (u.id !== id) fail(`${id}: id mismatch`);
  if (!Array.isArray(u.attrs) || u.attrs.length !== 5) fail(`${id}: needs exactly five attributes`);
  for (const a of u.attrs) { if (!['num', 'cat'].includes(a.type)) fail(`${id}.${a.key}: bad type`); if (!a.label || a.label.length > 7) fail(`${id}.${a.key}: label missing or too long`); }
  const names = new Set(), vecs = new Map();
  for (const r of u.rows) {
    for (const nm of [r.name, ...(r.alt || [])]) { const k = nm.toLowerCase(); if (names.has(k)) fail(`${id}: duplicate name ${nm}`); names.add(k); }
    for (const a of u.attrs) {
      const v = r[a.key];
      if (a.type === 'num' ? !Number.isFinite(v) : (typeof v !== 'string' || !v)) fail(`${id}: ${r.name}.${a.key} is missing or mistyped`);
    }
    const key = u.attrs.map((a) => r[a.key]).join('|');
    if (vecs.has(key)) fail(`${id}: ${r.name} and ${vecs.get(key)} agree on all five attributes`); else vecs.set(key, r.name);
  }
}
if (UNIVERSES.presidents.rows.length !== 45) fail('presidents: expected 45 people');
if (UNIVERSES.elements.rows.length !== 118) fail('elements: expected 118');
if (UNIVERSES.states.rows.length !== 50) fail('states: expected 50');
{ const a = UNIVERSES.states.rows.map((r) => r.area).sort((x, y) => x - y); if (a.some((v, i) => v !== i + 1)) fail('states: area ranks are not 1 to 50'); }
{ const z = UNIVERSES.elements.rows.map((r) => r.z); if (z.some((v, i) => v !== i + 1)) fail('elements: atomic numbers are not 1 to 118 in order'); }

const used = new Set();
let prev = null, sundays = [];
PUZZLES.forEach((p, i) => {
  const tag = `#${p.num} ${p.live}`;
  if (p.num !== i + 1) fail(`${tag}: num should be ${i + 1}`);
  const d = new Date(`${p.live}T12:00:00Z`);
  if (prev) { const e = new Date(`${prev}T12:00:00Z`); e.setUTCDate(e.getUTCDate() + 1); if (e.toISOString().slice(0, 10) !== p.live) fail(`${tag}: dates are not contiguous`); }
  prev = p.live;
  const [y, m, dd] = p.live.split('-').map(Number);
  if (p.quizId !== `dossier-${m}-${dd}-${String(y).slice(2)}`) fail(`${tag}: quizId does not match the date`);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${dd}, ${y}`) fail(`${tag}: dateLabel does not match the date`);
  const dow = d.getUTCDay();
  if (!!p.sunday !== (dow === 0)) fail(`${tag}: sunday flag does not match the weekday`);
  if (p.guesses !== (dow === 0 ? 6 : 8)) fail(`${tag}: guesses should be ${dow === 0 ? 6 : 8}`);
  const u = UNIVERSES[p.universe];
  if (!u) return fail(`${tag}: unknown universe`);
  if (dow === 0) sundays.push(p.universe); else if (WEEK[dow] !== p.universe) fail(`${tag}: weekday rotation asks for ${WEEK[dow]}`);
  const row = u.rows.find((r) => r.name === p.answer);
  if (!row) return fail(`${tag}: answer is not in its universe`);
  if (!u.every && !row.easy) fail(`${tag}: answer is not an eligible (easy) row`);
  if (row.state === 'unknown') fail(`${tag}: an element with no measured state cannot be an answer`);
  if (p.universe === 'presidents' && dow === 1 && !row.easy) fail(`${tag}: Monday's president should be a better-known one`);
  const key = `${p.universe}:${p.answer}`;
  if (used.has(key)) fail(`${tag}: answer repeats`); used.add(key);
});
for (let i = 1; i < sundays.length; i++) if (sundays[i] === sundays[i - 1]) fail('two Sundays running share a universe');

console.log(`verify-dossier: ${Object.values(UNIVERSES).map((u) => `${u.id} ${u.rows.length}`).join(', ')}; ${PUZZLES.length} days, ${PUZZLES[0] && PUZZLES[0].live} to ${prev}, ${fails} failure${fails === 1 ? '' : 's'}`);
process.exit(fails ? 1 : 0);
