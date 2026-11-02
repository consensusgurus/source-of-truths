// scripts/gen-hands.mjs: extends the Hands bank (app/hands/puzzles.js and
// app/hands/proofs.js) by appending new days. Never touches a banked board.
//
//   node scripts/gen-hands.mjs --from 2026-11-02 --days 29 --seed 107290 [--runs 400]
//
// Written 2026-11-02 because the bank's original generator was never
// committed. It produces exactly what scripts/verify-hands.mjs demands:
//
//   deck     dealFor(seed) from app/hands/rules.js; a seed is skipped if its
//            opening five cards or its whole deal repeat a banked board, or
//            if ace - par lands under 12.
//   par/ace  400 BLIND playouts. The player sees only the cards dealt so far:
//            for each card it scores every empty cell by how much that cell's
//            row and column potential rises (pairs, trips, flush and straight
//            draws), with seeded noise standing in for a person's variance,
//            and it may muck once when nothing helps. If no muck was used,
//            the 26th card is the muck. par is the median run, ace the best;
//            both lines are banked as proofs.
//   ceiling  simulated annealing over all 26 slots (the 26th is the discard),
//            several restarts at roughly twenty times the verifier's budget.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { totalOf, dealFor, rankOf, suitOf, mulberry32, scoreHand } from '../app/hands/rules.js';
import { PUZZLES } from '../app/hands/puzzles.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const FROM = opt('--from'), DAYS = Number(opt('--days', '29'));
let SEED = Number(opt('--seed'));
const RUNS = Number(opt('--runs', '400'));
if (!FROM || !SEED) { console.error('usage: --from YYYY-MM-DD --days N --seed S'); process.exit(1); }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const label = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; };
const qid = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `hands-${m}-${d}-${String(y).slice(2)}`; };

// potential of a partly filled line, from the blind player's point of view
function potential(cells) {
  const got = cells.filter((c) => c != null);
  const k = got.length;
  if (k === 5) return scoreHand(cells);
  if (k === 0) return 0;
  const counts = new Map(); let suit0 = suitOf(got[0]), flush = true, lo = 15, hi = 0;
  for (const c of got) { const r = rankOf(c); counts.set(r, (counts.get(r) || 0) + 1); if (suitOf(c) !== suit0) flush = false; lo = Math.min(lo, r); hi = Math.max(hi, r); }
  let v = 0;
  const mult = [...counts.values()].sort((a, b) => b - a);
  for (const m of mult) v += m === 2 ? 1.4 : m === 3 ? 6.2 : m === 4 ? 16 : 0;
  if (mult[0] === 3 && mult[1] === 2) v = 10;
  if (mult[0] === 2 && mult[1] === 2) v = 3.4 + (k === 4 ? 0.8 : 0);
  if (flush && k >= 2) v += 5 * Math.pow(k / 5, 2.2);
  const span = counts.has(14) && lo <= 5 ? Math.max(...[...counts.keys()].map((r) => (r === 14 ? 1 : r))) - 1 : hi - lo;
  if (counts.size === k && span <= 4 && k >= 2) v += 12 * Math.pow(k / 5, 2.6) * (flush ? 1.3 : 1);
  return v;
}

function blindRun(deck, rand, noise) {
  const grid = new Array(25).fill(null), line = [];
  let mucked = false;
  for (let i = 0; i < 26; i++) {
    const card = deck[i];
    const empty = []; for (let c = 0; c < 25; c++) if (grid[c] == null) empty.push(c);
    if (!empty.length) break; // 26th card falls as the muck
    if (!mucked && 26 - i === empty.length) { /* must place every remaining card */ }
    let best = -Infinity, bestCell = -1;
    for (const cell of empty) {
      const r = (cell / 5) | 0, col = cell % 5;
      const row = [0, 1, 2, 3, 4].map((x) => grid[r * 5 + x]);
      const cl = [0, 1, 2, 3, 4].map((x) => grid[x * 5 + col]);
      const before = potential(row) + potential(cl);
      grid[cell] = card;
      const after = potential([0, 1, 2, 3, 4].map((x) => grid[r * 5 + x])) + potential([0, 1, 2, 3, 4].map((x) => grid[x * 5 + col]));
      grid[cell] = null;
      const g = after - before + (rand() - 0.5) * noise;
      if (g > best) { best = g; bestCell = cell; }
    }
    const canMuck = !mucked && 26 - i > empty.length;
    if (canMuck && best < -0.8 + (rand() - 0.5) * noise * 0.5) { mucked = true; continue; }
    grid[bestCell] = card; line.push([card, bestCell]);
  }
  return { grid, line, total: totalOf(grid) };
}

function ceilingSearch(deck, seed) {
  const rand = mulberry32(seed);
  let best = -1, bestArr = null;
  const RESTARTS = 6, ITERS = 450000;
  const g = deck.slice();
  const score = (a) => totalOf(a.slice(0, 25));
  for (let run = 0; run < RESTARTS; run++) {
    for (let i = 0; i < 26; i++) g[i] = deck[i];
    for (let i = 25; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [g[i], g[j]] = [g[j], g[i]]; }
    let cur = score(g);
    if (cur > best) { best = cur; bestArr = g.slice(0, 25); }
    for (let it = 0; it < ITERS; it++) {
      const T = 9 * (1 - it / ITERS) + 0.015;
      const a = (rand() * 26) | 0, b = (rand() * 26) | 0;
      if (a === b) continue;
      [g[a], g[b]] = [g[b], g[a]];
      const nxt = score(g), d = nxt - cur;
      if (d >= 0 || rand() < Math.exp(d / T)) { cur = nxt; if (cur > best) { best = cur; bestArr = g.slice(0, 25); } }
      else [g[a], g[b]] = [g[b], g[a]];
    }
  }
  return { best, bestArr };
}

const seenDeals = new Set(PUZZLES.map((p) => p.deck.join(',')));
const seenOpen = new Set(PUZZLES.map((p) => p.deck.slice(0, 5).join(',')));
const last = PUZZLES[PUZZLES.length - 1];
if (addDays(last.live, 1) !== FROM) { console.error(`--from must be ${addDays(last.live, 1)}`); process.exit(1); }
if (SEED <= Math.max(...PUZZLES.map((p) => p.seed))) { console.error('seed must be above every banked seed'); process.exit(1); }

const DRY = args.includes('--dry');
const NOISE = Number(opt('--noise', '3.2'));
const rows = [], proofs = {};
for (let d = 0; d < DAYS; d++) {
  const live = addDays(FROM, d);
  for (;;) {
    const seed = SEED++;
    const deck = dealFor(seed);
    if (seenDeals.has(deck.join(',')) || seenOpen.has(deck.slice(0, 5).join(','))) continue;
    const rand = mulberry32(seed ^ 0x51ed27);
    const runs = [];
    for (let k = 0; k < RUNS; k++) runs.push(blindRun(deck, rand, NOISE));
    runs.sort((a, b) => a.total - b.total);
    const par = runs[RUNS >> 1], ace = runs[RUNS - 1];
    if (ace.total - par.total < 12) continue;
    if (DRY) { console.error(`dry seed ${seed} par ${par.total} ace ${ace.total}`); break; }
    const { best, bestArr } = ceilingSearch(deck, (seed * 2654435761) >>> 0);
    if (best < ace.total) continue;
    seenDeals.add(deck.join(',')); seenOpen.add(deck.slice(0, 5).join(','));
    const num = PUZZLES.length + rows.length + 1;
    rows.push({ num, quizId: qid(live), live, dateLabel: label(live), sunday: false, seed, par: par.total, ace: ace.total, ceiling: best, deck, best: bestArr });
    proofs[qid(live)] = { par: par.line, ace: ace.line };
    console.error(`${live} seed ${seed} par ${par.total} ace ${ace.total} ceiling ${best}`);
    break;
  }
}

if (DRY) process.exit(0);
// append to puzzles.js
const pf = path.join(ROOT, 'app/hands/puzzles.js');
let src = fs.readFileSync(pf, 'utf8');
const body = rows.map((p) => `  {\n    num: ${p.num},\n    quizId: '${p.quizId}',\n    live: '${p.live}',\n    dateLabel: '${p.dateLabel}',\n    sunday: false,\n    seed: ${p.seed},\n    par: ${p.par},\n    ace: ${p.ace},\n    ceiling: ${p.ceiling},\n    deck: [${p.deck.join(',')}],\n    best: [${p.best.join(',')}],\n  },\n`).join('');
const end = src.lastIndexOf('];');
src = src.slice(0, end) + body + src.slice(end);
fs.writeFileSync(pf, src);

const prf = path.join(ROOT, 'app/hands/proofs.js');
let ps = fs.readFileSync(prf, 'utf8');
const pb = Object.entries(proofs).map(([id, p]) => `  '${id}': {\n    par: ${JSON.stringify(p.par)},\n    ace: ${JSON.stringify(p.ace)},\n  },\n`).join('');
const pend = ps.lastIndexOf('};');
ps = ps.slice(0, pend) + pb + ps.slice(pend);
fs.writeFileSync(prf, ps);
console.error(`appended ${rows.length} boards`);
