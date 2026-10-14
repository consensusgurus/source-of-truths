// Generator for Hold (app/hold/puzzles.js), the daily video poker hold.
//
//   node scripts/gen-hold.mjs pool [--n 16000] [--workers 2] [--pool FILE]
//       Deals and values random hands into a pool (JSON lines, one deal each,
//       default /tmp/build/hold-pool.jsonl). RESUMABLE: deal i is a pure
//       function of (SEED, i), so a rerun skips every index already in the
//       file and carries on. worker_threads value deals in parallel; each deal
//       is all 32 holds valued exactly over every draw (lib/hold-core.js).
//   node scripts/gen-hold.mjs measure [--pool FILE]
//       Prints the gap and trap distribution the ramp below was set from.
//   node scripts/gen-hold.mjs bank [--pool FILE] > app/hold/puzzles.js
//       Deals the calendar from the pool. Deterministic: the pool is read in
//       index order and every choice is seeded off the date.
//
// THE RAMP (set from `measure` over 16,000 random deals; see the bank header):
//   the GAP is how far the best hold's expected return beats the best hold not
//   tied with it, and a TRAP is a deal where the best hold beats the documented
//   naive rule (lib/hold-core.js naiveMask).
import { isMainThread, Worker, parentPort, workerData } from 'node:worker_threads';
import { readFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { holdEVs, bestMask, naiveMask, gapOf, classify, rankOf, suitOf, popcount, TIE } from '../lib/hold-core.js';

const SEED = 20261014;
const FIRST = '2026-10-14';
const LAST = '2027-01-31';

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(...xs) {
  let h = 2166136261 >>> 0;
  for (const x of xs) { h ^= x >>> 0; h = Math.imul(h, 16777619) >>> 0; h ^= h >>> 13; }
  return h >>> 0;
}
// Deal i: a seeded shuffle of the 52; the first five are the hand, the next
// five are the fixed replacement order for the flavor draw.
export function dealFor(i) {
  const rng = mulberry32(hash(SEED, i));
  const d = Array.from({ length: 52 }, (_, k) => k);
  for (let k = 51; k > 0; k--) { const j = Math.floor(rng() * (k + 1)); [d[k], d[j]] = [d[j], d[k]]; }
  return { cards: d.slice(0, 5), draw: d.slice(5, 10) };
}

function valueDeal(i) {
  const { cards, draw } = dealFor(i);
  const ev = holdEVs(cards);
  const best = bestMask(ev);
  const naive = naiveMask(cards);
  const gap = gapOf(ev);
  const trap = ev[best] - ev[naive] > TIE;
  return { i, cards, draw, ev: Array.from(ev, (v) => Math.round(v * 1e5) / 1e5), evx: Array.from(ev), best, naive, gap, trap, kind: classify(cards) };
}

if (!isMainThread) {
  for (const i of workerData.idx) parentPort.postMessage(valueDeal(i));
  parentPort.postMessage({ done: true });
}
// The command line runs once every const below has been initialised.
function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'measure';
  const opt = (k, d) => { const j = args.indexOf(`--${k}`); return j >= 0 ? args[j + 1] : d; };
  const POOL = opt('pool', '/tmp/build/hold-pool.jsonl');
  const readPool = () => (existsSync(POOL) ? readFileSync(POOL, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [])
    .sort((a, b) => a.i - b.i);

  if (mode === 'pool') {
    const N = Number(opt('n', 16000));
    const W = Number(opt('workers', 2));
    mkdirSync(dirname(POOL), { recursive: true });
    const have = new Set(readPool().map((p) => p.i));
    const todo = [];
    for (let i = 0; i < N; i++) if (!have.has(i)) todo.push(i);
    console.error(`pool ${POOL}: ${have.size} valued, ${todo.length} to go on ${W} workers`);
    if (!todo.length) process.exit(0);
    let live = W, n = 0;
    const t0 = Date.now();
    for (let w = 0; w < W; w++) {
      const idx = todo.filter((_, k) => k % W === w);
      const wk = new Worker(fileURLToPath(import.meta.url), { workerData: { idx } });
      wk.on('message', (m) => {
        if (m.done) { if (--live === 0) console.error(`done in ${((Date.now() - t0) / 1000).toFixed(0)}s`); return; }
        appendFileSync(POOL, JSON.stringify(m) + '\n');
        if (++n % 500 === 0) console.error(`${n}/${todo.length} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
      });
    }
  } else if (mode === 'measure') {
    measure(readPool());
  } else if (mode === 'bank') {
    process.stdout.write(bank(readPool()));
  } else {
    console.error('usage: gen-hold.mjs pool|measure|bank');
    process.exit(2);
  }
}

// ---- measuring --------------------------------------------------------------
function q(arr, p) { const s = arr.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; }
function measure(pool) {
  console.log(`deals ${pool.length}`);
  const gaps = pool.map((p) => p.gap);
  console.log('gap quantiles', [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95].map((x) => `${x}:${q(gaps, x).toFixed(3)}`).join(' '));
  const traps = pool.filter((p) => p.trap);
  console.log(`traps ${traps.length} (${(100 * traps.length / pool.length).toFixed(1)}%)`);
  const tg = traps.map((p) => p.gap);
  console.log('trap gap quantiles', [0.1, 0.25, 0.5, 0.75, 0.9].map((x) => `${x}:${q(tg, x).toFixed(3)}`).join(' '));
  const kinds = {};
  for (const p of pool) kinds[p.kind] = (kinds[p.kind] || 0) + 1;
  console.log('dealt kinds', kinds);
  const held = {};
  for (const p of pool) held[popcount(p.best)] = (held[popcount(p.best)] || 0) + 1;
  console.log('best hold sizes', held);
  const triv = pool.filter(trivial);
  console.log(`trivial ${triv.length} (${(100 * triv.length / pool.length).toFixed(1)}%)`);
  const nontriv = pool.filter((p) => !trivial(p) && !p.trap).map((p) => p.gap);
  console.log('non-trap non-trivial gap quantiles', [0.1, 0.25, 0.5, 0.75, 0.9].map((x) => `${x}:${q(nontriv, x).toFixed(3)}`).join(' '));
  const tight = pool.filter((p) => p.gap < 0.001).length;
  console.log(`gap under 0.001: ${tight}`);
  const avg = pool.reduce((s, p) => s + Math.max(...p.evx), 0) / pool.length;
  console.log(`mean best EV ${avg.toFixed(4)} (the full-pay game returns 0.9954 over every deal)`);
}

// A TRIVIAL deal: a pat full house or better, or a deal whose best hold is the
// naive one by a mile (gap over 1). Excluded from Wednesday on.
export function trivial(p) {
  return ['royal', 'sf', 'quads', 'fh'].includes(p.kind) || (!p.trap && p.gap > 1);
}

// ---- the calendar -------------------------------------------------------------
function dateList() {
  const out = [];
  for (let d = new Date(`${FIRST}T12:00:00Z`); d <= new Date(`${LAST}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) out.push(d.toISOString().slice(0, 10));
  return out;
}
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function labels(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return { quizId: `hold-${m}-${d}-${String(y).slice(2)}`, dateLabel: `${MONTHS[m - 1]} ${d}, ${y}` };
}
// Canonical shape of a hand: its ranks and its suit pattern, relabelled so
// two hands that differ only by which suits they wear read the same.
export function shapeKey(cards) {
  let best = null;
  const perms = [];
  const permute = (arr, k = 0) => { if (k === arr.length) { perms.push(arr.slice()); return; } for (let j = k; j < arr.length; j++) { [arr[k], arr[j]] = [arr[j], arr[k]]; permute(arr, k + 1); [arr[k], arr[j]] = [arr[j], arr[k]]; } };
  permute([0, 1, 2, 3]);
  for (const p of perms) {
    const s = cards.map((c) => rankOf(c) * 4 + p[suitOf(c)]).sort((a, b) => a - b).join('.');
    if (best === null || s < best) best = s;
  }
  return best;
}

// The ramp, per weekday (0 Sunday). `hands` dealt; traps [min, max]; gap
// bands per hand: a non-trap hand takes [gmin, gmax], a trap hand [tmin, tmax].
// `triv` allows trivial deals. Set from `measure`; see the bank header.
export const RAMP = {
  1: { hands: 10, traps: [0, 0], gmin: 0.30, gmax: Infinity, tmin: 0, tmax: Infinity, triv: true },
  2: { hands: 10, traps: [1, 1], gmin: 0.15, gmax: Infinity, tmin: 0.10, tmax: Infinity, triv: true },
  3: { hands: 10, traps: [2, 2], gmin: 0.06, gmax: 0.50, tmin: 0.05, tmax: Infinity, triv: false },
  4: { hands: 10, traps: [3, 3], gmin: 0.03, gmax: 0.30, tmin: 0.03, tmax: 0.40, triv: false },
  5: { hands: 10, traps: [4, 4], gmin: 0.015, gmax: 0.20, tmin: 0.015, tmax: 0.30, triv: false },
  6: { hands: 10, traps: [5, 6], gmin: 0.001, gmax: 0.10, tmin: 0.001, tmax: 0.15, triv: false },
  0: { hands: 15, traps: [5, 7], gmin: 0.001, gmax: 0.15, tmin: 0.001, tmax: 0.20, triv: false },
};
export const MIN_GAP = 0.001;
export const SHAPE_DAYS = 21;

function fits(p, R, asTrap) {
  if (p.gap < MIN_GAP) return false;
  if (!R.triv && trivial(p)) return false;
  if (asTrap) return p.trap && p.gap >= R.tmin && p.gap <= R.tmax;
  return !p.trap && p.gap >= R.gmin && p.gap <= R.gmax;
}

function bank(pool) {
  const used = new Set();           // exact 5-card sets, never twice
  const lastShape = new Map();      // shape -> day index last used
  const days = dateList();
  const out = [];
  days.forEach((iso, di) => {
    const dow = new Date(`${iso}T12:00:00Z`).getUTCDay();
    const R = RAMP[dow];
    const rng = mulberry32(hash(SEED, di, 77));
    const nTrap = R.traps[0] + Math.floor(rng() * (R.traps[1] - R.traps[0] + 1));
    const want = [...Array(nTrap).fill(true), ...Array(R.hands - nTrap).fill(false)];
    for (let k = want.length - 1; k > 0; k--) { const j = Math.floor(rng() * (k + 1)); [want[k], want[j]] = [want[j], want[k]]; }
    const dayShapes = new Set();
    // Walk the pool from a seeded offset so days draw from all over it.
    const start = Math.floor(rng() * pool.length);
    const hands = [];
    for (const asTrap of want) {
      let pick = null;
      for (let s = 0; s < pool.length; s++) {
        const p = pool[(start + s * 7919) % pool.length];
        const setKey = p.cards.slice().sort((a, b) => a - b).join('.');
        if (used.has(setKey)) continue;
        const shp = shapeKey(p.cards);
        if (dayShapes.has(shp)) continue;
        if (lastShape.has(shp) && di - lastShape.get(shp) < SHAPE_DAYS) continue;
        if (!fits(p, R, asTrap)) continue;
        pick = { p, setKey, shp };
        break;
      }
      if (!pick) throw new Error(`no ${asTrap ? 'trap' : 'plain'} hand for ${iso} (dow ${dow}); grow the pool`);
      used.add(pick.setKey);
      dayShapes.add(pick.shp);
      lastShape.set(pick.shp, di);
      const p = pick.p;
      hands.push({ cards: p.cards, ev: p.ev, best: p.best, gap: Math.round(p.gap * 1e5) / 1e5, trap: p.trap, draw: p.draw });
    }
    out.push({ num: di + 1, ...labels(iso), live: iso, sunday: dow === 0, hands });
  });
  return HEADER + 'export const PUZZLES = [\n' + out.map((d) => '  ' + JSON.stringify(d)).join(',\n') + '\n];\n';
}

const HEADER = `// Puzzle data for Hold, the daily video poker hold. Imported ONLY by the
// server page (app/hold/page.js), which filters live<=today before handing the
// bank to the client, so tomorrow's deals never reach a browser.
//
// GENERATED by scripts/gen-hold.mjs (\`bank\` mode, from a pool of valued
// random deals) and checked by scripts/verify-hold.mjs, which recomputes every
// number below with its own hand classifier and its own draw counter. Do not
// hand edit.
//
// THE GAME: Jacks or Better, the 9/6 full-pay table, per credit: royal flush
// 800, straight flush 50, four of a kind 25, full house 9, flush 6, straight 4,
// three of a kind 3, two pair 2, a pair of jacks or better 1, else 0.
//
// A day is TEN five-card hands (FIFTEEN on the Sunday Edition). A hand:
//   cards  five cards 0..51 in dealt order: rank = card % 13 (0 ace ... 12
//          king), suit = floor(card / 13) (clubs, diamonds, hearts, spades)
//   ev     32 numbers, 5 decimals: the exact expected return of each hold,
//          indexed by the hold's bitmask (bit i set keeps cards[i]), averaged
//          over every draw of the replacement cards from the 47 not dealt
//   best   the best hold's mask; a tie (within 1e-9) goes to the fewest cards,
//          then the lowest mask. Every tied hold scores; the bank never ships
//          a hold within 0.001 of the best that is not exactly tied with it,
//          so rounding to 5 places can never merge or split a tie
//   gap    best EV minus the best EV of any hold not tied with it (>= 0.001)
//   trap   true when the best hold beats the documented naive rule
//          (lib/hold-core.js naiveMask): keep any paying hand or pair; else
//          four to a flush; else four to an outside straight; else every jack,
//          queen, king and ace
//   draw   five cards from the 47 not dealt: the fixed replacement order for
//          the flavor draw, filling the discarded positions left to right.
//          The flavor draw is luck and scores nothing
// Scoring: 1 point a hand when the hold's EV is the best EV (within 1e-9), so
// the score is out of 10 (15 on Sunday). First attempt stands; the clock
// breaks ties.
//
// THE RAMP (measured over 16,000 random deals by \`gen-hold.mjs measure\`:
// median gap about 0.12, 90th percentile about 0.45, 5th about 0.013; about
// one random deal in ten is a trap). Per weekday, non-trap gaps / trap gaps /
// traps a day:
//   Mon  gap >= 0.30, no traps, trivial deals allowed
//   Tue  gap >= 0.15, one trap (gap >= 0.10), trivial allowed
//   Wed  0.06-0.50, two traps (>= 0.05), no trivial deals from here on
//   Thu  0.03-0.30, three traps (0.03-0.40)
//   Fri  0.015-0.20, four traps (0.015-0.30)
//   Sat  0.001-0.10, five or six traps (0.001-0.15)
//   Sun  FIFTEEN hands, 0.001-0.15, five to seven traps (0.001-0.20)
// A TRIVIAL deal is a pat full house or better, or a non-trap whose gap is
// over 1. No five-card hand appears twice in the bank, no hand shape (ranks
// plus suit pattern, suits relabelled) twice in a day or within 21 days.
`;

if (isMainThread) main();
