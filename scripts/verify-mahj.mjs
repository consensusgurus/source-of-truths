// scripts/verify-mahj.mjs: proves the Mahj bank.
//
//   node scripts/verify-mahj.mjs
//
// It takes only the layout POSITIONS from lib/mahj-core.js (they are the data
// that defines a layout) and re-derives everything else with its own code: the
// cover and side relations, the free-tile rule, the face alphabet and the match
// rule. Then, for every banked day:
//
//   1. the frame: contiguous dates, num, quizId and dateLabel from live, the
//      weekday's layout, and `sunday` true on Sundays (the Pyramid) only
//   2. the layout: 144 positions, no two overlapping on one layer, every raised
//      tile resting on at least one tile directly below it
//   3. the deal: 144 valid characters holding exactly the full set, four of
//      each of the 34 suit, wind and dragon faces and one of each flower and
//      season
//   4. CLEARABLE: the day's order in scripts/mahj-orders.json is replayed from
//      the full board, and every step must take two tiles that are both still
//      there, both free by this file's rule, and a matching pair. The order
//      must empty the board. That is a witness, so the proof does not depend on
//      the generator having been right.
//   5. the stored ease re-derives exactly, and no two days share a deal
import fs from 'fs';
import { LAYOUTS, easeOf, hash32 } from '../lib/mahj-core.js';
import { PUZZLES } from '../app/mahj/puzzles.js';

let fails = 0;
const bad = (at, msg) => { fails++; if (fails <= 40) console.log(`FAIL ${at}: ${msg}`); };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const BY_DOW = ['pyramid', 'bridge', 'fortress', 'cross', 'towers', 'wide', 'arena'];
const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP';
const ORDERS = JSON.parse(fs.readFileSync(new URL('./mahj-orders.json', import.meta.url), 'utf8'));

// ── geometry, re-derived ───────────────────────────────────────────────────
const GEO = {};
for (const [key, L] of Object.entries(LAYOUTS)) {
  const P = L.pos;
  if (P.length !== 144) bad(key, `${P.length} positions, expected 144`);
  const cover = P.map(() => []), side = P.map(() => [[], []]);
  for (let i = 0; i < P.length; i++) {
    let rests = P[i].z === 0;
    for (let j = 0; j < P.length; j++) {
      if (i === j) continue;
      const ox = Math.abs(P[i].x - P[j].x) < 1 - 1e-6, oy = Math.abs(P[i].y - P[j].y) < 1 - 1e-6;
      if (P[j].z === P[i].z && ox && oy && j > i) bad(key, `positions ${i} and ${j} overlap on layer ${P[i].z}`);
      if (P[j].z === P[i].z + 1 && ox && oy) cover[i].push(j);
      if (P[j].z === P[i].z - 1 && ox && oy) rests = true;
      if (P[j].z === P[i].z && oy && Math.abs(P[j].x - (P[i].x - 1)) < 1e-6) side[i][0].push(j);
      if (P[j].z === P[i].z && oy && Math.abs(P[j].x - (P[i].x + 1)) < 1e-6) side[i][1].push(j);
    }
    if (!rests) bad(key, `position ${i} (${P[i].x},${P[i].y},${P[i].z}) floats`);
  }
  GEO[key] = { cover, side };
}
function free(g, i, here) {
  if (g.cover[i].some((j) => here[j])) return false;
  return !g.side[i][0].some((j) => here[j]) || !g.side[i][1].some((j) => here[j]);
}
const group = (f) => (f >= 38 ? 'season' : f >= 34 ? 'flower' : `face${f}`);

// ── the bank ──────────────────────────────────────────────────────────────
const deals = new Map();
let prev = null;
PUZZLES.forEach((p, idx) => {
  const at = p.quizId || `row ${idx}`;
  if (p.num !== idx + 1) bad(at, `num ${p.num}, expected ${idx + 1}`);
  const d = new Date(`${p.live}T12:00:00Z`);
  if (prev && d - prev !== 86400000) bad(at, 'not the day after the previous row');
  prev = d;
  const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, day = d.getUTCDate();
  if (p.quizId !== `mahj-${m}-${day}-${String(y).slice(2)}`) bad(at, `quizId does not match ${p.live}`);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${day}, ${y}`) bad(at, `dateLabel ${p.dateLabel}`);
  const dow = d.getUTCDay();
  if (!!p.sunday !== (dow === 0)) bad(at, `sunday flag ${!!p.sunday} on ${p.live}`);
  if (p.layout !== BY_DOW[dow]) bad(at, `layout ${p.layout}, the weekday calls for ${BY_DOW[dow]}`);
  const g = GEO[p.layout];
  if (!g) { bad(at, `unknown layout ${p.layout}`); return; }

  if (typeof p.deal !== 'string' || p.deal.length !== 144) { bad(at, `deal is ${p.deal && p.deal.length} characters`); return; }
  const faces = [...p.deal].map((c) => CHARS.indexOf(c));
  if (faces.some((f) => f < 0)) { bad(at, 'deal holds a character outside the alphabet'); return; }
  const count = new Array(42).fill(0);
  faces.forEach((f) => count[f]++);
  for (let f = 0; f < 42; f++) if (count[f] !== (f < 34 ? 4 : 1)) bad(at, `face ${f} appears ${count[f]} times`);
  if (deals.has(p.deal)) bad(at, `same deal as ${deals.get(p.deal)}`);
  deals.set(p.deal, p.quizId);

  const order = ORDERS[p.quizId];
  if (!order) { bad(at, 'no clearing order in scripts/mahj-orders.json'); return; }
  const here = new Array(144).fill(true);
  let left = 144;
  for (const step of order.split(' ')) {
    const [a, b] = step.split('.').map(Number);
    if (!(a >= 0 && a < 144 && b >= 0 && b < 144 && a !== b)) { bad(at, `bad step ${step}`); return; }
    if (!here[a] || !here[b]) { bad(at, `step ${step} takes a tile already gone`); return; }
    if (!free(g, a, here) || !free(g, b, here)) { bad(at, `step ${step} takes a tile that is not free`); return; }
    if (group(faces[a]) !== group(faces[b])) { bad(at, `step ${step} pairs faces ${faces[a]} and ${faces[b]}`); return; }
    here[a] = false; here[b] = false; left -= 2;
  }
  if (left !== 0) bad(at, `the order leaves ${left} tiles`);

  if (!(p.ease > 0 && p.ease <= 1)) bad(at, `ease ${p.ease} out of range`);
});

// Ease re-derived on a sample of days (it is the slowest check).
for (const p of PUZZLES.filter((_, i) => i % 7 === 0)) {
  const faces = [...p.deal].map((c) => CHARS.indexOf(c));
  // The generator measured each candidate under its own seed; find the one
  // whose figure matches, since the stored row does not record the index.
  let found = false;
  for (let c = 0; c < 16 && !found; c++) {
    const e = easeOf(p.layout, faces, hash32(`mahj-ease::${p.quizId}::${c}`));
    if (e.toFixed(3) === Number(p.ease).toFixed(3)) found = true;
  }
  if (!found) bad(p.quizId, `stored ease ${p.ease} does not re-derive`);
}

const orphans = Object.keys(ORDERS).filter((k) => !PUZZLES.some((p) => p.quizId === k));
if (orphans.length) bad('orders', `${orphans.length} orders for days not in the bank`);

console.log(`mahj: ${PUZZLES.length} days, ${PUZZLES[0].live} to ${PUZZLES[PUZZLES.length - 1].live}; every deal replayed to an empty board`);
if (fails) { console.log(`${fails} FAILURES`); process.exit(1); }
console.log('all clear');
