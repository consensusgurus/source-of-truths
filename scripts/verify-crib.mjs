import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
// scripts/verify-crib.mjs — re-proves app/crib/puzzles.js from the cards up.
//
// It imports NOTHING from lib/crib-core.js or the generator. The scorer here is
// written a different way on purpose: the rank part of a five-card score
// (fifteens, pairs, runs) is counted by brute force over every subset of the
// five cards, once per rank pattern, and cached; the flush and nobs are added
// per hand. The crib average walks the opponent's pair first and the cut
// second, the other way round from the generator. So a mistake in either
// implementation shows up as a disagreement rather than agreeing with itself.
//
// Checks, per day and across the bank:
//   1. shape: num runs 1..N, quizId / dateLabel / sunday agree with `live`,
//      dates contiguous, five hands (seven on Sundays), six distinct cards
//   2. every hand, value, crib and throw figure recomputed; stored values must
//      match to 0.0015 (they are rounded to three places)
//   3. value = hand + crib (your crib) or hand - crib (theirs)
//   4. `best` is the unique top throw and `gap` its lead over the second
//   5. `flip` is true exactly when the best-four-cards throw is not `best`
//   6. whose crib alternates within a day, starting with yours
//   7. the weekday ramp (gap bands and crib-decided counts) from the generator
//   8. no six-card hand repeats in the bank; no rank pattern + crib repeats
//      inside 21 days
//   9. the scorer itself, on hands with known totals (29, 28, 24, flushes, nobs)
//
//   node scripts/verify-crib.mjs            the whole bank (~1-2 minutes)
//   node scripts/verify-crib.mjs --quick    structure and a sample of hands
// VERIFY_CRIB_BANK points the checker at another file (the mutation test).
// A file URL, never a bare path: a Windows path like C:\\... is not an import
// specifier, and the deploy watcher runs these on Windows.
const BANK = process.env.VERIFY_CRIB_BANK
  ? pathToFileURL(resolve(process.env.VERIFY_CRIB_BANK)).href
  : new URL('../app/crib/puzzles.js', import.meta.url).href;
const { PUZZLES } = await import(BANK);

const QUICK = process.argv.includes('--quick');
let fails = 0;
const bad = (m) => { fails++; if (fails <= 40) console.log('FAIL', m); };

// ── the independent scorer ──────────────────────────────────────────────────
const PIP = (r) => Math.min(r + 1, 10);
const rankCache = new Map();
function rankScore(ranks) {
  const sorted = ranks.slice().sort((a, b) => a - b);
  const key = sorted.join(',');
  const hit = rankCache.get(key);
  if (hit !== undefined) return hit;
  let pts = 0;
  // fifteens and pairs by explicit subsets
  for (let m = 1; m < 32; m++) {
    let sum = 0, cnt = 0;
    for (let i = 0; i < 5; i++) if (m & (1 << i)) { sum += PIP(sorted[i]); cnt++; }
    if (sum === 15) pts += 2;
    if (cnt === 2) {
      const idx = [0, 1, 2, 3, 4].filter((i) => m & (1 << i));
      if (sorted[idx[0]] === sorted[idx[1]]) pts += 2;
    }
  }
  // runs: the longest run length L present as a subset; score L for every
  // L-subset that is a run (this is how a double run scores twice)
  const isRun = (idx) => {
    const rs = idx.map((i) => sorted[i]);
    for (let k = 1; k < rs.length; k++) if (rs[k] !== rs[k - 1] + 1) return false;
    return true;
  };
  for (const L of [5, 4, 3]) {
    let found = 0;
    for (let m = 1; m < 32; m++) {
      const idx = [0, 1, 2, 3, 4].filter((i) => m & (1 << i));
      if (idx.length === L && isRun(idx)) found++;
    }
    if (found) { pts += found * L; break; }
  }
  rankCache.set(key, pts);
  return pts;
}
function score5(keep, cut, crib) {
  const cards = [...keep, cut];
  let pts = rankScore(cards.map((c) => c % 13));
  const suits = keep.map((c) => Math.floor(c / 13));
  if (suits.every((s) => s === suits[0])) {
    if (Math.floor(cut / 13) === suits[0]) pts += 5;
    else if (!crib) pts += 4;
  }
  if (keep.some((c) => c % 13 === 10 && Math.floor(c / 13) === Math.floor(cut / 13))) pts += 1;
  return pts;
}

// ── 9. the scorer against known totals ──────────────────────────────────────
{
  const C = (r, s) => s * 13 + r;
  const cases = [
    [[C(4, 0), C(4, 1), C(4, 2), C(10, 3)], C(4, 3), false, 29],
    [[C(4, 0), C(4, 1), C(4, 2), C(4, 3)], C(10, 0), false, 28],
    [[C(3, 0), C(4, 1), C(5, 2), C(5, 3)], C(4, 0), false, 24],
    [[C(1, 2), C(3, 2), C(7, 2), C(11, 2)], C(12, 3), false, 4],
    [[C(1, 2), C(3, 2), C(7, 2), C(11, 2)], C(12, 3), true, 0],
    [[C(1, 2), C(3, 2), C(7, 2), C(11, 2)], C(12, 2), true, 5],
    [[C(10, 2), C(2, 0), C(6, 1), C(8, 3)], C(1, 2), false, 3],
    [[C(0, 0), C(1, 1), C(2, 2), C(3, 3)], C(4, 0), false, 7],   // A-2-3-4-5: run of 5 + one fifteen
    [[C(6, 0), C(7, 1), C(8, 2), C(12, 3)], C(6, 1), false, 12],  // 7 7 8 9 K: double run 8, pair 2, 7+8 = 15 twice... see below
  ];
  // 7 7 8 9 K: fifteens 7+8 twice = 4; pair of 7s = 2; double run 7-8-9 = 6. Total 12.
  for (const [keep, cut, crib, want] of cases) {
    const got = score5(keep, cut, crib);
    if (got !== want) bad(`scorer: ${keep.join(',')} + ${cut} (${crib ? 'crib' : 'hand'}) scored ${got}, expected ${want}`);
  }
}

// ── the valuation ────────────────────────────────────────────────────────────
const THROWS = [];
for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) THROWS.push([i, j]);

function valueAll(six, yours) {
  const out = [];
  const rest = [];
  for (let c = 0; c < 52; c++) if (!six.includes(c)) rest.push(c);
  for (const [i, j] of THROWS) {
    const keep = six.filter((_, k) => k !== i && k !== j);
    let h = 0;
    for (const s of rest) h += score5(keep, s, false);
    let cr = 0, n = 0;
    const four = [six[i], six[j], 0, 0];
    for (let a = 0; a < rest.length; a++) {
      four[2] = rest[a];
      for (let b = a + 1; b < rest.length; b++) {
        four[3] = rest[b];
        for (let s = 0; s < rest.length; s++) {
          if (s === a || s === b) continue;
          cr += score5(four, rest[s], true);
          n++;
        }
      }
    }
    const hand = h / rest.length, crib = cr / n;
    out.push({ hand, crib, value: yours ? hand + crib : hand - crib });
  }
  return out;
}

const SPEC = {
  1: { lo: 2.0, hi: 99, flips: 0, n: 5 },
  2: { lo: 1.3, hi: 2.6, flips: 0, n: 5 },
  3: { lo: 0.9, hi: 1.7, flips: 1, n: 5 },
  4: { lo: 0.6, hi: 1.15, flips: 1, n: 5 },
  5: { lo: 0.4, hi: 0.85, flips: 2, n: 5 },
  6: { lo: 0.2, hi: 0.6, flips: 2, n: 5 },
  0: { lo: 0.2, hi: 1.0, flips: 3, n: 7 },
};
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const TOL = 0.0015;

// ── 1-8 ──────────────────────────────────────────────────────────────────────
const handSeen = new Map();
const sigSeen = new Map();
let prevLive = null, hands = 0, recomputed = 0;
PUZZLES.forEach((p, idx) => {
  const id = `crib #${p.num}`;
  if (p.num !== idx + 1) bad(`${id}: num out of order`);
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `crib-${m}-${d}-${String(y).slice(2)}`) bad(`${id}: quizId ${p.quizId}`);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${d}, ${y}`) bad(`${id}: dateLabel`);
  const wd = new Date(`${p.live}T12:00:00Z`).getUTCDay();
  if (!!p.sunday !== (wd === 0)) bad(`${id}: sunday flag on weekday ${wd}`);
  if (prevLive) {
    const next = new Date(`${prevLive}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    if (next.toISOString().slice(0, 10) !== p.live) bad(`${id}: dates not contiguous`);
  }
  prevLive = p.live;
  const spec = SPEC[wd];
  if (!Array.isArray(p.hands) || p.hands.length !== spec.n) { bad(`${id}: ${p.hands && p.hands.length} hands, want ${spec.n}`); return; }
  let flips = 0;
  p.hands.forEach((h, k) => {
    hands++;
    const hid = `${id} hand ${k + 1}`;
    if (h.cards.length !== 6 || new Set(h.cards).size !== 6 || h.cards.some((c) => !Number.isInteger(c) || c < 0 || c > 51)) { bad(`${hid}: bad cards`); return; }
    if (h.yours !== (k % 2 === 0)) bad(`${hid}: crib does not alternate starting with yours`);
    const ck = h.cards.slice().sort((a, b) => a - b).join(',');
    if (handSeen.has(ck)) bad(`${hid}: repeats the hand from ${handSeen.get(ck)}`);
    handSeen.set(ck, id);
    const sig = h.cards.map((c) => c % 13).sort((a, b) => a - b).join('.') + (h.yours ? 'y' : 't');
    if (sigSeen.has(sig) && idx - sigSeen.get(sig) < 21) bad(`${hid}: rank pattern repeats within 21 days`);
    sigSeen.set(sig, idx);
    if (h.gap < spec.lo - 1e-9 || h.gap >= spec.hi) bad(`${hid}: gap ${h.gap} outside ${spec.lo}-${spec.hi}`);
    if (h.flip) flips++;
    // 3-5 from the stored figures
    for (let t = 0; t < 15; t++) {
      const want = h.yours ? h.hand[t] + h.crib[t] : h.hand[t] - h.crib[t];
      if (Math.abs(want - h.value[t]) > TOL) bad(`${hid}: throw ${t} value is not hand ${h.yours ? '+' : '-'} crib`);
    }
    const order = h.value.map((_, t) => t).sort((a, b) => h.value[b] - h.value[a]);
    if (order[0] !== h.best) bad(`${hid}: best is ${h.best}, top value is throw ${order[0]}`);
    if (Math.abs(h.value[order[0]] - h.value[order[1]] - h.gap) > TOL) bad(`${hid}: gap ${h.gap} does not match the values`);
    const byHand = h.hand.map((_, t) => t).sort((a, b) => h.hand[b] - h.hand[a] || a - b);
    if (h.flip !== (byHand[0] !== h.best) && Math.abs(h.hand[byHand[0]] - h.hand[h.best]) > TOL) bad(`${hid}: flip flag wrong`);
    // 2: recompute
    if (QUICK && k !== 0) return;
    const v = valueAll(h.cards, h.yours);
    recomputed++;
    for (let t = 0; t < 15; t++) {
      if (Math.abs(v[t].hand - h.hand[t]) > TOL) bad(`${hid}: throw ${t} hand ${h.hand[t]} recomputes to ${v[t].hand.toFixed(4)}`);
      if (Math.abs(v[t].crib - h.crib[t]) > TOL) bad(`${hid}: throw ${t} crib ${h.crib[t]} recomputes to ${v[t].crib.toFixed(4)}`);
    }
    const vo = v.map((_, t) => t).sort((a, b) => v[b].value - v[a].value);
    if (vo[0] !== h.best) bad(`${hid}: recomputed best is ${vo[0]}, stored ${h.best}`);
    if (v[vo[0]].value - v[vo[1]].value < 0.05) bad(`${hid}: best is not clear of the second`);
  });
  if (flips < spec.flips) bad(`${id}: ${flips} crib-decided hands, want >= ${spec.flips}`);
});

console.log(`verify-crib: ${PUZZLES.length} days, ${hands} hands, ${recomputed} recomputed${QUICK ? ' (quick)' : ''}, ${fails} failures`);
process.exit(fails ? 1 : 0);
