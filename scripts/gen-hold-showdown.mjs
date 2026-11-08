// Generator for Hold's SHOWDOWN boards (app/hold/puzzles.js, every day from
// SHOWDOWN_FROM on). Boards before that date are the original Jacks or Better
// deals from scripts/gen-hold.mjs and are never touched.
//
//   node scripts/gen-hold-showdown.mjs pool [--n 6000] [--workers 2] [--pool FILE]
//       Deals and values random showdown deals into a pool (JSON lines,
//       default /tmp/build/hold-sd-pool.jsonl). RESUMABLE: deal i is a pure
//       function of (SEED, i). Each deal values all 32 holds exactly
//       (lib/hold-core.js holdWins) and also finds the video poker hold
//       (holdEVs + bestMask), which is what makes a deal a TRAP.
//   node scripts/gen-hold-showdown.mjs measure [--pool FILE]
//   node scripts/gen-hold-showdown.mjs bank [--pool FILE] [--bank app/hold/puzzles.js]
//       Rewrites the bank: days before SHOWDOWN_FROM are copied through byte
//       for byte, every day from SHOWDOWN_FROM to LAST is dealt from the pool.
//
// A deal: a seeded shuffle of the 52. Cards 0-4 are the player's hand, 5-9
// and 10-14 the two rivals (face up, standing pat), 15-19 the fixed
// replacement order for the flavor draw (luck, scores nothing).
import { isMainThread, Worker, parentPort, workerData } from 'node:worker_threads';
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { holdWins, holdEVs, bestMask, gapOf, showScore, showCat, popcount, TIE, SHOWDOWN_FROM } from '../lib/hold-core.js';

const SEED = 20261109;
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
// Canonical shape of a hand (copied from gen-hold.mjs, which runs its own
// command line on import): ranks plus suit pattern, suits relabelled.
function shapeKey(cards) {
  let best = null;
  const perms = [];
  const permute = (arr, k = 0) => { if (k === arr.length) { perms.push(arr.slice()); return; } for (let j = k; j < arr.length; j++) { [arr[k], arr[j]] = [arr[j], arr[k]]; permute(arr, k + 1); [arr[k], arr[j]] = [arr[j], arr[k]]; } };
  permute([0, 1, 2, 3]);
  for (const p of perms) {
    const s = cards.map((c) => (c % 13) * 4 + p[(c / 13) | 0]).sort((a, b) => a - b).join('.');
    if (best === null || s < best) best = s;
  }
  return best;
}
export function dealFor(i) {
  const rng = mulberry32(hash(SEED, i));
  const d = Array.from({ length: 52 }, (_, k) => k);
  for (let k = 51; k > 0; k--) { const j = Math.floor(rng() * (k + 1)); [d[k], d[j]] = [d[j], d[k]]; }
  return { cards: d.slice(0, 5), rivals: [d.slice(5, 10), d.slice(10, 15)], draw: d.slice(15, 20) };
}
const r5 = (v) => Math.round(v * 1e5) / 1e5;
function valueDeal(i) {
  const { cards, rivals, draw } = dealFor(i);
  const win = holdWins(cards, rivals);
  const best = bestMask(win);
  const vp = bestMask(holdEVs(cards));
  return {
    i, cards, rivals, draw, win: Array.from(win, r5), best, vp,
    gap: gapOf(win), top: win[best], trap: win[best] - win[vp] > TIE,
    rcat: Math.max(...rivals.map((h) => showCat(showScore(h)))),
  };
}
if (!isMainThread) {
  for (const i of workerData.idx) parentPort.postMessage(valueDeal(i));
  parentPort.postMessage({ done: true });
}

// THE RAMP, per weekday (0 Sunday): hands dealt; traps [min, max] (a TRAP is a
// deal where the video poker hold is NOT the best showdown hold); the gap band
// for a plain hand and for a trap hand. The gap is the best hold's chance to
// win minus the best chance of any hold not tied with it. Set from `measure`.
export const RAMP = {
  1: { hands: 10, traps: [2, 2], gmin: 0.06, gmax: Infinity, tmin: 0.06, tmax: Infinity },
  2: { hands: 10, traps: [3, 3], gmin: 0.04, gmax: Infinity, tmin: 0.04, tmax: Infinity },
  3: { hands: 10, traps: [4, 4], gmin: 0.025, gmax: 0.30, tmin: 0.025, tmax: 0.30 },
  4: { hands: 10, traps: [5, 5], gmin: 0.012, gmax: 0.20, tmin: 0.012, tmax: 0.20 },
  5: { hands: 10, traps: [6, 6], gmin: 0.006, gmax: 0.12, tmin: 0.006, tmax: 0.12 },
  6: { hands: 10, traps: [7, 8], gmin: 0.002, gmax: 0.06, tmin: 0.002, tmax: 0.08 },
  0: { hands: 15, traps: [8, 10], gmin: 0.002, gmax: 0.08, tmin: 0.002, tmax: 0.10 },
};
// Never ship a near tie: two holds within 0.002 that are not exactly tied
// would read the same at one decimal of a percent.
export const MIN_GAP = 0.002;
// A deal is DULL when the best hold almost always wins or almost always
// loses: the decision barely matters.
export const dull = (p) => p.top > 0.97 || p.top < 0.03;
export const SHAPE_DAYS = 21;

function fits(p, R, asTrap) {
  if (p.gap < MIN_GAP || dull(p)) return false;
  if (asTrap) return p.trap && p.gap >= R.tmin && p.gap <= R.tmax;
  return !p.trap && p.gap >= R.gmin && p.gap <= R.gmax;
}

function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'measure';
  const opt = (k, d) => { const j = args.indexOf(`--${k}`); return j >= 0 ? args[j + 1] : d; };
  const POOL = opt('pool', '/tmp/build/hold-sd-pool.jsonl');
  const readPool = () => (existsSync(POOL) ? readFileSync(POOL, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [])
    .sort((a, b) => a.i - b.i);
  if (mode === 'pool') {
    const N = Number(opt('n', 6000)), W = Number(opt('workers', 2));
    mkdirSync(dirname(POOL), { recursive: true });
    const have = new Set(readPool().map((p) => p.i));
    const todo = [];
    for (let i = 0; i < N; i++) if (!have.has(i)) todo.push(i);
    console.error(`pool ${POOL}: ${have.size} valued, ${todo.length} to go on ${W} workers`);
    if (!todo.length) return;
    let live = W, n = 0;
    const t0 = Date.now();
    for (let w = 0; w < W; w++) {
      const wk = new Worker(fileURLToPath(import.meta.url), { workerData: { idx: todo.filter((_, k) => k % W === w) } });
      wk.on('message', (m) => {
        if (m.done) { if (--live === 0) console.error(`done in ${((Date.now() - t0) / 1000).toFixed(0)}s`); return; }
        appendFileSync(POOL, JSON.stringify(m) + '\n');
        if (++n % 500 === 0) console.error(`${n}/${todo.length} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
      });
    }
  } else if (mode === 'measure') {
    measure(readPool());
  } else if (mode === 'bank') {
    const file = opt('bank', 'app/hold/puzzles.js');
    writeFileSync(file, bank(readPool(), readFileSync(file, 'utf8')));
    console.error(`wrote ${file}`);
  } else {
    console.error('usage: gen-hold-showdown.mjs pool|measure|bank');
    process.exit(2);
  }
}

function q(arr, p) { const s = arr.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; }
function measure(pool) {
  console.log(`deals ${pool.length}`);
  const qs = (a) => [0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95].map((x) => `${x}:${q(a, x).toFixed(3)}`).join(' ');
  const live = pool.filter((p) => !dull(p) && p.gap >= MIN_GAP);
  console.log(`dull ${pool.filter(dull).length}, near tie ${pool.filter((p) => p.gap < MIN_GAP).length}, usable ${live.length}`);
  const tr = live.filter((p) => p.trap), pl = live.filter((p) => !p.trap);
  console.log(`traps ${tr.length} (${(100 * tr.length / live.length).toFixed(1)}%)`);
  console.log('trap gaps ', qs(tr.map((p) => p.gap)));
  console.log('plain gaps', qs(pl.map((p) => p.gap)));
  console.log('best win  ', qs(live.map((p) => p.top)));
  const held = {}; for (const p of live) held[popcount(p.best)] = (held[popcount(p.best)] || 0) + 1;
  console.log('best hold sizes', held);
  const rc = {}; for (const p of live) rc[p.rcat] = (rc[p.rcat] || 0) + 1;
  console.log('strongest rival category', rc);
  for (const [d, R] of Object.entries(RAMP)) {
    const t = live.filter((p) => fits(p, R, true)).length, n = live.filter((p) => fits(p, R, false)).length;
    console.log(`dow ${d}: trap candidates ${t}, plain candidates ${n}`);
  }
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function labels(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return { quizId: `hold-${m}-${d}-${String(y).slice(2)}`, dateLabel: `${MONTHS[m - 1]} ${d}, ${y}` };
}

function bank(pool, src) {
  const at = src.indexOf('export const PUZZLES = [\n');
  if (at < 0) throw new Error('bank: no PUZZLES array');
  const lines = src.slice(at).split('\n').slice(1).filter((l) => l.startsWith('  {'));
  const old = lines.map((l) => JSON.parse(l.trim().replace(/,$/, '')));
  const keep = old.filter((d) => d.live < SHOWDOWN_FROM);
  // Every hand already shipped is off limits, in any role.
  const used = new Set();
  const lastShape = new Map();
  keep.forEach((d, di) => d.hands.forEach((h) => { used.add(h.cards.slice().sort((a, b) => a - b).join('.')); lastShape.set(shapeKey(h.cards), di); }));
  const days = [];
  for (let d = new Date(`${SHOWDOWN_FROM}T12:00:00Z`); d <= new Date(`${LAST}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) days.push(d.toISOString().slice(0, 10));
  const out = keep.slice();
  days.forEach((iso) => {
    const di = out.length;
    const dow = new Date(`${iso}T12:00:00Z`).getUTCDay();
    const R = RAMP[dow];
    const rng = mulberry32(hash(SEED, di, 77));
    const nTrap = R.traps[0] + Math.floor(rng() * (R.traps[1] - R.traps[0] + 1));
    const want = [...Array(nTrap).fill(true), ...Array(R.hands - nTrap).fill(false)];
    for (let k = want.length - 1; k > 0; k--) { const j = Math.floor(rng() * (k + 1)); [want[k], want[j]] = [want[j], want[k]]; }
    const dayShapes = new Set();
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
      used.add(pick.setKey); dayShapes.add(pick.shp); lastShape.set(pick.shp, di);
      const p = pick.p;
      hands.push({ cards: p.cards, rivals: p.rivals, win: p.win, best: p.best, vp: p.vp, gap: r5(p.gap), trap: p.trap, draw: p.draw });
    }
    out.push({ num: di + 1, ...labels(iso), live: iso, sunday: dow === 0, showdown: true, hands });
  });
  const header = src.slice(0, at).replace(/\n\/\/ SHOWDOWN BOARDS[\s\S]*$/, '\n');
  return header + SD_HEADER + 'export const PUZZLES = [\n' + out.map((d) => '  ' + JSON.stringify(d)).join(',\n') + '\n];\n';
}

const SD_HEADER = `// SHOWDOWN BOARDS (every day from ${SHOWDOWN_FROM}, marked showdown: true;
// written by scripts/gen-hold-showdown.mjs, checked by scripts/verify-hold.mjs).
// Every hand is played against two rival hands, face up, standing pat. There
// is no pay table: ordinary poker ranking with full kickers. A hand:
//   cards   the player's five, dealt order
//   rivals  two five-card hands, final
//   win     32 numbers, 5 decimals: each hold's exact CHANCE TO WIN over every
//           draw from the 37 cards nobody holds (a split pot scores 1/(k+1)
//           where k rivals tie the player for the best hand)
//   best    the best hold's mask (ties: fewest cards, then lowest mask); every
//           hold within 1e-9 of it scores
//   vp      the video poker hold (the best 9/6 Jacks or Better hold, ignoring
//           the rivals), shown on the reveal for contrast
//   gap     best minus the best hold not tied with it, >= 0.002
//   trap    true when vp is not a best hold
//   draw    five cards from the 37: the fixed replacement order (luck)
// THE RAMP (measured over 6,000 random deals by \`gen-hold-showdown.mjs
// measure\`: about a third are dull, two in three usable deals are traps,
// median gap about 0.02, 95th percentile about 0.09). Traps a day / gap band:
//   Mon 2 / >= 0.06     Tue 3 / >= 0.04      Wed 4 / 0.025-0.30
//   Thu 5 / 0.012-0.20  Fri 6 / 0.006-0.12   Sat 7-8 / 0.002-0.08
//   Sun (fifteen hands) 8-10 / 0.002-0.10
// No deal where the best hold wins over 97% or under 3% of the time.
`;

if (isMainThread) main();
