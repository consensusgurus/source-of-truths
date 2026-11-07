// scripts/verify-bacon.mjs: re-proves app/bacon/puzzles.js against the film
// graph, public/bacon/graph.json. Imports nothing from the generator.
//
//   node scripts/verify-bacon.mjs
//
// What it recomputes or enforces:
//   - the graph: every film has a title, a year 1930..2022 and at least one
//     cast index in range; no duplicate actor names; no two films share a
//     title and year.
//   - num, quizId, dateLabel and the Sunday flag from the live date; the bank
//     opens on 2026-11-07 and runs day after day with no gap.
//   - from and to are actors in the graph, different people, and on the star
//     list (scripts/bacon-stars.json): weekdays modern to modern, Sundays a
//     classic start.
//   - par, by its own breadth-first search over actor-film-actor steps, equals
//     the stored par; weekdays 2..3, Sundays 3..4, never 1.
//   - the chain: starts at from, ends at to, alternates actor and [title, year],
//     every film is in the graph with both neighbours in its cast, and it uses
//     exactly par films.
//   - variety: no pair repeats (either way round); no actor appears twice
//     within 21 days.
//   - no em dash anywhere in the bank.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '..');
const bankPath = process.env.VERIFY_BACON_BANK || path.join(root, 'app', 'bacon', 'puzzles.js');
const { PUZZLES } = await import(pathToFileURL(path.resolve(bankPath)).href);
const G = JSON.parse(readFileSync(path.join(root, 'public', 'bacon', 'graph.json'), 'utf8'));
const STARS = JSON.parse(readFileSync(path.join(here, 'bacon-stars.json'), 'utf8'));
const START = '2026-11-07';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
let fails = 0;
const fail = (m) => { fails++; if (fails < 60) console.error('FAIL ' + m); };
const day = (s) => new Date(`${s}T12:00:00Z`).getTime();

// the graph
const A = G.actors, F = G.films;
if (G.v !== 1 || !Array.isArray(A) || !Array.isArray(F)) fail('graph: bad shape');
if (A.length < 15000 || F.length < 12000) fail(`graph: only ${A.length} actors and ${F.length} films`);
const ix = new Map();
A.forEach((n, i) => { if (typeof n !== 'string' || !n.trim()) fail(`graph: actor ${i} has no name`); if (ix.has(n)) fail(`graph: duplicate actor ${n}`); ix.set(n, i); });
const filmKey = new Map();
const byActor = A.map(() => []);
F.forEach(([t, y, ids], fi) => {
  if (typeof t !== 'string' || !t || !Number.isInteger(y) || y < 1930 || y > 2022) fail(`graph: film ${fi} title/year`);
  if (!Array.isArray(ids) || !ids.length || ids.some((a) => !Number.isInteger(a) || a < 0 || a >= A.length)) fail(`graph: film ${fi} cast`);
  const k = `${t}|${y}`;
  if (filmKey.has(k)) fail(`graph: duplicate film ${k}`);
  filmKey.set(k, fi);
  for (const a of new Set(ids)) byActor[a].push(fi);
});
const cast = F.map((f) => new Set(f[2]));
function dist(from, to) {
  const seen = new Map([[from, 0]]);
  let q = [from];
  while (q.length) {
    const nq = [];
    for (const a of q) for (const fi of byActor[a]) for (const b of F[fi][2]) {
      if (!seen.has(b)) { seen.set(b, seen.get(a) + 1); if (b === to) return seen.get(b); nq.push(b); }
    }
    q = nq;
  }
  return null;
}

const modern = new Set(STARS.modern), classic = new Set(STARS.classic);
const pairs = new Set();
const lastSeen = new Map();
let prev = null;
PUZZLES.forEach((p, i) => {
  const tag = `#${p.num} ${p.live} ${p.from} to ${p.to}`;
  if (p.num !== i + 1) fail(`${tag}: num should be ${i + 1}`);
  if (i === 0 && p.live !== START) fail(`${tag}: the bank should open on ${START}`);
  if (prev && day(p.live) - day(prev) !== 86400000) fail(`${tag}: dates are not contiguous`);
  prev = p.live;
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `bacon-${m}-${d}-${String(y).slice(2)}`) fail(`${tag}: quizId does not match the date`);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${d}, ${y}`) fail(`${tag}: dateLabel does not match the date`);
  const sun = new Date(`${p.live}T12:00:00Z`).getUTCDay() === 0;
  if (!!p.sunday !== sun) fail(`${tag}: sunday flag does not match the weekday`);

  const s = ix.get(p.from), t = ix.get(p.to);
  if (s == null || t == null) { fail(`${tag}: an actor is not in the graph`); return; }
  if (s === t) fail(`${tag}: start and target are the same actor`);
  if (!modern.has(p.to)) fail(`${tag}: target is not on the modern star list`);
  if (sun ? !classic.has(p.from) : !modern.has(p.from)) fail(`${tag}: start is not on the ${sun ? 'classic' : 'modern'} star list`);

  const par = dist(s, t);
  if (par !== p.par) fail(`${tag}: stored par ${p.par}, the graph says ${par}`);
  if (sun ? !(par >= 3 && par <= 4) : !(par >= 2 && par <= 3)) fail(`${tag}: par ${par} is outside the ${sun ? 'Sunday 3..4' : 'weekday 2..3'} range`);

  const c = p.chain;
  if (!Array.isArray(c) || c.length !== 2 * p.par + 1) fail(`${tag}: chain should hold ${p.par} films`);
  else {
    if (c[0] !== p.from || c[c.length - 1] !== p.to) fail(`${tag}: chain does not run from start to target`);
    for (let k = 1; k < c.length; k += 2) {
      const f = c[k];
      const fi = Array.isArray(f) ? filmKey.get(`${f[0]}|${f[1]}`) : undefined;
      const a = ix.get(c[k - 1]), b = ix.get(c[k + 1]);
      if (fi === undefined) { fail(`${tag}: chain film ${JSON.stringify(f)} is not in the graph`); continue; }
      if (a == null || b == null || !cast[fi].has(a) || !cast[fi].has(b)) fail(`${tag}: ${f[0]} does not cast both ${c[k - 1]} and ${c[k + 1]}`);
    }
  }

  const pk = [p.from, p.to].sort().join('|');
  if (pairs.has(pk)) fail(`${tag}: pair repeats`);
  pairs.add(pk);
  for (const n of [p.from, p.to]) {
    if (lastSeen.has(n) && i - lastSeen.get(n) < 21) fail(`${tag}: ${n} was used ${i - lastSeen.get(n)} days ago`);
    lastSeen.set(n, i);
  }
});
if (readFileSync(bankPath, 'utf8').includes('\u2014')) fail('bank: em dash');

console.log(`verify-bacon: ${PUZZLES.length} boards, ${F.length} films, ${A.length} actors`);
console.log(fails ? `${fails} failure(s)` : 'OK');
process.exit(fails ? 1 : 0);
