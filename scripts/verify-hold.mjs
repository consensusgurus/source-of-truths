// Verifier for Hold (app/hold/puzzles.js), the daily video poker hold.
//
//   node scripts/verify-hold.mjs           every hand, every hold
//   node scripts/verify-hold.mjs --quick   the first hand of each day only
//
// INDEPENDENT of lib/hold-core.js and scripts/gen-hold.mjs: nothing is
// imported from either. The generator walks the DRAWS for each hold with an
// incremental hand shape; this file instead builds a payout table for all
// 2,598,960 five-card hands once (with its own sort-based classifier), then
// for each deal walks EVERY final hand in colex order and credits its payout
// to the hold it implies (the final hand's overlap with the deal). Each final
// hand belongs to exactly one hold, so this counts every draw of every hold
// exactly once, by a different route.
//
// Checks (exits non-zero on any failure):
//   dates contiguous 2026-10-14 .. 2027-01-31, num, quizId hold-M-D-YY,
//     dateLabel, sunday exactly on real Sundays
//   ten hands a weekday, fifteen on Sunday (the Sunday Edition scales)
//   cards: five distinct 0..51; draw: five distinct cards not in the deal
//   ev recomputed for all 32 holds (tolerance 2e-5), stored to 5 places
//   best = top EV, ties to fewest cards then lowest mask
//   gap recomputed (2e-5), at least 0.001, and no hold that is not exactly
//     tied sits within 0.001 of the best (so 5-place rounding cannot merge
//     or split a tie)
//   trap recomputed against this file's own statement of the naive rule
//   identities: EV(hold all five) is the pay table value of the dealt hand;
//     holding a pat royal is worth 800; two textbook values (4 to a royal,
//     a high pair) come out exactly
//   the ramp per weekday: trap count and gap bands, no trivial deals from
//     Wednesday on
//   variety: no five-card hand twice in the bank, no hand shape (ranks plus
//     suit pattern, suits relabelled) twice in a day or within 21 days; no
//     one best-hold size above 60% of the bank, draw-five best on at most 15%
//
// Mutation-tested by scripts/hold-mutation-test.mjs (VERIFY_HOLD_BANK points
// this file at a mutated copy).
const BANK = process.env.VERIFY_HOLD_BANK
  ? `file://${process.env.VERIFY_HOLD_BANK}`
  : new URL('../app/hold/puzzles.js', import.meta.url).href;
const { PUZZLES } = await import(BANK);
const QUICK = process.argv.includes('--quick');
const t0 = Date.now();

const fails = [];
const fail = (m) => { fails.push(m); };

// ---- this file's own poker ------------------------------------------------
const PAYS = { royal: 800, sf: 50, quads: 25, fh: 9, flush: 6, straight: 4, trips: 3, twopair: 2, jacks: 1, none: 0 };
function kindOf(hand) {
  const rs = hand.map((c) => c % 13).sort((a, b) => a - b);
  const ss = hand.map((c) => Math.floor(c / 13));
  const flush = ss.every((s) => s === ss[0]);
  const groups = {};
  for (const r of rs) groups[r] = (groups[r] || 0) + 1;
  const sizes = Object.values(groups).sort((a, b) => b - a).join('');
  if (sizes === '41') return 'quads';
  if (sizes === '32') return 'fh';
  if (sizes === '311') return 'trips';
  if (sizes === '221') return 'twopair';
  if (sizes === '2111') {
    const pr = Number(Object.keys(groups).find((r) => groups[r] === 2));
    return pr === 0 || pr >= 10 ? 'jacks' : 'none';
  }
  // five different ranks
  const wheel = rs.join() === '0,1,2,3,4';
  const broadway = rs.join() === '0,9,10,11,12';
  const run = rs[4] - rs[0] === 4;
  const straight = wheel || broadway || run;
  if (straight && flush) return broadway ? 'royal' : 'sf';
  if (flush) return 'flush';
  if (straight) return 'straight';
  return 'none';
}

// Binomials and the colex payout table.
const BIN = Array.from({ length: 53 }, () => new Float64Array(6));
for (let n = 0; n <= 52; n++) { BIN[n][0] = 1; for (let k = 1; k <= 5; k++) BIN[n][k] = n === 0 ? 0 : BIN[n - 1][k - 1] + BIN[n - 1][k]; }
const TABLE = new Uint16Array(BIN[52][5]);
{
  let ix = 0;
  for (let e = 4; e < 52; e++) for (let d = 3; d < e; d++) for (let c = 2; c < d; c++) for (let b = 1; b < c; b++) for (let a = 0; a < b; a++) {
    TABLE[ix++] = PAYS[kindOf([a, b, c, d, e])];
  }
  if (ix !== TABLE.length) fail(`colex table size ${ix} != ${TABLE.length}`);
}

// Every hold's EV by walking every final hand once.
function evAll(cards) {
  const pos = new Int8Array(52).fill(-1);
  cards.forEach((c, i) => { pos[c] = i; });
  const bit = new Int32Array(52);
  for (let c = 0; c < 52; c++) bit[c] = pos[c] >= 0 ? (1 << pos[c]) : 0;
  const out = new Int32Array(32);   // the sum of payouts, per hold
  const own = new Int32Array(32);   // and how many final hands it got
  let ix = 0;
  for (let e = 4; e < 52; e++) { const me = bit[e];
    for (let d = 3; d < e; d++) { const md = me | bit[d];
      for (let c = 2; c < d; c++) { const mc = md | bit[c];
        for (let b = 1; b < c; b++) { const mb = mc | bit[b];
          for (let a = 0; a < b; a++) { const m = mb | bit[a]; out[m] += TABLE[ix++]; own[m]++; } } } } }
  const ev = new Float64Array(32);
  for (let m = 0; m < 32; m++) {
    let k = 0; for (let i = 0; i < 5; i++) if ((m >> i) & 1) k++;
    const draws = BIN[47][5 - k];
    if (own[m] !== draws) fail(`hold ${m} counted ${own[m]} final hands, expected C(47,${5 - k}) = ${draws}`);
    ev[m] = out[m] / draws;
  }
  return ev;
}
const bits = (m) => (m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1) + ((m >> 3) & 1) + ((m >> 4) & 1);
function topOf(ev) {
  let mx = -1; for (const v of ev) if (v > mx) mx = v;
  const tied = [];
  for (let m = 0; m < 32; m++) if (ev[m] >= mx - 1e-9) tied.push(m);
  tied.sort((x, y) => bits(x) - bits(y) || x - y);
  return { mx, best: tied[0], tied };
}

// The naive rule, restated here from its words (not from the generator's code).
function naiveRule(cards) {
  const all = 31;
  const k = kindOf(cards);
  if (['royal', 'sf', 'fh', 'flush', 'straight'].includes(k)) return all;
  const rank = cards.map((c) => c % 13);
  const count = (r) => rank.filter((x) => x === r).length;
  const paired = rank.map((r, i) => (count(r) >= 2 ? (1 << i) : 0)).reduce((a, b) => a | b, 0);
  if (paired) return paired; // a paying group or a lone low pair: keep every paired card
  for (let s = 0; s < 4; s++) {
    const m = cards.map((c, i) => (Math.floor(c / 13) === s ? (1 << i) : 0)).reduce((a, b) => a | b, 0);
    if (bits(m) === 4) return m;
  }
  // four in a row open at both ends: 2345 up to 9TJQ (ace never counts here)
  for (let lo = 1; lo <= 8; lo++) {
    let m = 0, ok = true;
    for (let r = lo; r < lo + 4; r++) {
      const i = rank.indexOf(r);
      if (i < 0) { ok = false; break; }
      m |= 1 << i;
    }
    if (ok) return m;
  }
  return rank.map((r, i) => (r === 0 || r >= 10 ? (1 << i) : 0)).reduce((a, b) => a | b, 0);
}

// ---- engine sanity: identities and textbook values ------------------------
{
  const C = (s) => 'cdhs'.indexOf(s[1]) * 13 + 'A23456789TJQK'.indexOf(s[0]);
  const H = (s) => s.split(' ').map(C);
  const royal = H('Ah Kh Qh Jh Th');
  const evR = evAll(royal);
  if (Math.abs(evR[31] - 800) > 1e-12) fail(`pat royal held is worth ${evR[31]}, not 800`);
  if (topOf(evR).best !== 31) fail('a pat royal is not its own best hold');
  const four = evAll(H('Th Jh Qh Kh 2c'));
  if (Math.abs(four[15] - 19.680851) > 1e-5) fail(`4 to a royal (TJQK hearts) is ${four[15]}, textbook 19.68085`);
  const jj = evAll(H('Jh Jd 5c 8s 2h'));
  if (Math.abs(jj[3] - 1.536540) > 1e-5) fail(`a pair of jacks held is ${jj[3]}, textbook 1.53654`);
}

// ---- the bank -------------------------------------------------------------
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const RAMP = {
  1: { hands: 10, traps: [0, 0], g: [0.30, Infinity], t: [0, Infinity], triv: true },
  2: { hands: 10, traps: [1, 1], g: [0.15, Infinity], t: [0.10, Infinity], triv: true },
  3: { hands: 10, traps: [2, 2], g: [0.06, 0.50], t: [0.05, Infinity], triv: false },
  4: { hands: 10, traps: [3, 3], g: [0.03, 0.30], t: [0.03, 0.40], triv: false },
  5: { hands: 10, traps: [4, 4], g: [0.015, 0.20], t: [0.015, 0.30], triv: false },
  6: { hands: 10, traps: [5, 6], g: [0.001, 0.10], t: [0.001, 0.15], triv: false },
  0: { hands: 15, traps: [5, 7], g: [0.001, 0.15], t: [0.001, 0.20], triv: false },
};
const shape = (cards) => {
  let best = null;
  const P = [];
  (function perm(a, k) { if (k === 4) { P.push(a.slice()); return; } for (let j = k; j < 4; j++) { [a[k], a[j]] = [a[j], a[k]]; perm(a, k + 1); [a[k], a[j]] = [a[j], a[k]]; } })([0, 1, 2, 3], 0);
  for (const p of P) { const s = cards.map((c) => (c % 13) * 4 + p[Math.floor(c / 13)]).sort((x, y) => x - y).join('.'); if (best == null || s < best) best = s; }
  return best;
};

if (!Array.isArray(PUZZLES) || !PUZZLES.length) fail('no PUZZLES');
const seenSet = new Map();
const shapeAt = new Map();
const sizeCount = new Array(6).fill(0);
let handsTotal = 0, recomputed = 0;
let expect = new Date('2026-10-14T12:00:00Z');
PUZZLES.forEach((p, di) => {
  const iso = expect.toISOString().slice(0, 10);
  const tag = `#${p.num} ${p.live}`;
  if (p.live !== iso) fail(`${tag}: expected live ${iso}`);
  if (p.num !== di + 1) fail(`${tag}: num should be ${di + 1}`);
  const [y, m, d] = iso.split('-').map(Number);
  if (p.quizId !== `hold-${m}-${d}-${String(y).slice(2)}`) fail(`${tag}: quizId ${p.quizId}`);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${d}, ${y}`) fail(`${tag}: dateLabel ${p.dateLabel}`);
  const dow = expect.getUTCDay();
  if (!!p.sunday !== (dow === 0)) fail(`${tag}: sunday flag ${p.sunday} on weekday ${dow}`);
  expect.setUTCDate(expect.getUTCDate() + 1);
  const R = RAMP[dow];
  if (!Array.isArray(p.hands) || p.hands.length !== R.hands) { fail(`${tag}: ${p.hands && p.hands.length} hands, expected ${R.hands}`); return; }
  let traps = 0;
  const dayShapes = new Set();
  p.hands.forEach((h, hi) => {
    const ht = `${tag} hand ${hi + 1}`;
    handsTotal++;
    const { cards, draw, ev } = h;
    if (!Array.isArray(cards) || cards.length !== 5 || new Set(cards).size !== 5 || cards.some((c) => !Number.isInteger(c) || c < 0 || c > 51)) { fail(`${ht}: bad cards ${JSON.stringify(cards)}`); return; }
    if (!Array.isArray(draw) || draw.length !== 5 || new Set(draw).size !== 5 || draw.some((c) => !Number.isInteger(c) || c < 0 || c > 51 || cards.includes(c))) fail(`${ht}: bad draw ${JSON.stringify(draw)}`);
    if (!Array.isArray(ev) || ev.length !== 32 || ev.some((v) => typeof v !== 'number' || Math.abs(v * 1e5 - Math.round(v * 1e5)) > 1e-6)) { fail(`${ht}: ev must be 32 numbers at 5 places`); return; }
    if (h.trap) traps++;
    // Uniqueness and shape window.
    const key = cards.slice().sort((a, b) => a - b).join('.');
    if (seenSet.has(key)) fail(`${ht}: five-card hand repeats ${seenSet.get(key)}`);
    seenSet.set(key, ht);
    const sh = shape(cards);
    if (dayShapes.has(sh)) fail(`${ht}: shape repeats inside the day`);
    dayShapes.add(sh);
    if (shapeAt.has(sh) && di - shapeAt.get(sh) < 21) fail(`${ht}: shape last used ${di - shapeAt.get(sh)} days ago (window 21)`);
    shapeAt.set(sh, di);
    sizeCount[bits(h.best)]++;
    // Recompute.
    const full = !QUICK || hi === 0;
    const exact = full ? evAll(cards) : null;
    if (exact) recomputed++;
    const src = exact || Float64Array.from(ev);
    if (exact) {
      for (let k = 0; k < 32; k++) if (Math.abs(exact[k] - ev[k]) > 2e-5) { fail(`${ht}: ev[${k}] stored ${ev[k]}, recomputed ${exact[k].toFixed(6)}`); break; }
      const pat = PAYS[kindOf(cards)];
      if (Math.abs(exact[31] - pat) > 1e-12) fail(`${ht}: EV(hold all) ${exact[31]} is not the pay table value ${pat}`);
      if (kindOf(cards) === 'royal' && Math.abs(exact[31] - 800) > 1e-12) fail(`${ht}: pat royal held is not 800`);
    }
    const { mx, best, tied } = topOf(src);
    if (h.best !== best) fail(`${ht}: best ${h.best}, recomputed ${best}`);
    let second = -Infinity;
    for (let k = 0; k < 32; k++) if (src[k] < mx - 1e-9 && src[k] > second) second = src[k];
    const gap = mx - second;
    if (Math.abs(gap - h.gap) > 2e-5) fail(`${ht}: gap ${h.gap}, recomputed ${gap.toFixed(6)}`);
    if (gap < 0.001 - 1e-9) fail(`${ht}: gap ${gap} under 0.001`);
    // Rounding cannot merge or split a tie: stored values of tied holds agree,
    // every other stored value sits clear of the best.
    for (let k = 0; k < 32; k++) {
      const isTied = tied.includes(k);
      if (isTied && Math.abs(ev[k] - ev[best]) > 1e-9) fail(`${ht}: tied hold ${k} stored differently from the best`);
      if (!isTied && ev[k] >= ev[best] - 1e-9) fail(`${ht}: hold ${k} reads as tied after rounding`);
    }
    const nv = naiveRule(cards);
    const trap = src[best] - src[nv] > 1e-9;
    if (!!h.trap !== trap) fail(`${ht}: trap ${h.trap}, recomputed ${trap} (naive hold ${nv})`);
    // Bands.
    const band = h.trap ? R.t : R.g;
    if (h.gap < band[0] - 1e-9 || h.gap > band[1] + 1e-9) fail(`${ht}: gap ${h.gap} outside ${h.trap ? 'trap' : 'plain'} band [${band[0]}, ${band[1]}] for weekday ${dow}`);
    const trivial = ['royal', 'sf', 'quads', 'fh'].includes(kindOf(cards)) || (!h.trap && h.gap > 1);
    if (!R.triv && trivial) fail(`${ht}: trivial deal on weekday ${dow}`);
  });
  if (traps < R.traps[0] || traps > R.traps[1]) fail(`${tag}: ${traps} traps, weekday ${dow} wants ${R.traps.join('-')}`);
});
const last = PUZZLES[PUZZLES.length - 1];
if (last && last.live !== '2027-01-31') fail(`bank ends ${last.live}, expected 2027-01-31`);
// Bank-wide variety.
for (let k = 0; k <= 5; k++) if (sizeCount[k] / handsTotal > 0.6) fail(`best holds of ${k} cards are ${(100 * sizeCount[k] / handsTotal).toFixed(0)}% of the bank (ceiling 60%)`);
if (sizeCount[0] / handsTotal > 0.15) fail(`draw five is best on ${(100 * sizeCount[0] / handsTotal).toFixed(0)}% of hands (ceiling 15%)`);

const secs = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`hold: ${PUZZLES.length} days, ${handsTotal} hands, ${recomputed} recomputed${QUICK ? ' (--quick)' : ''}, best-hold sizes ${sizeCount.join('/')}, ${secs}s`);
if (fails.length) {
  for (const f of fails.slice(0, 40)) console.log(`FAIL ${f}`);
  if (fails.length > 40) console.log(`... and ${fails.length - 40} more`);
  console.log(`${fails.length} failure${fails.length === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log('hold: OK');
