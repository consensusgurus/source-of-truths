// Generate the Gift bank: the daily Quarto endgame.
//
// THE SHAPE. The player holds a piece the opponent handed over, on a board with
// k pieces already placed and no finished line. Against any defence the player
// can force a win, and EXACTLY ONE first move (a square for the gift plus the
// piece handed back) does it. Every other first move loses or draws. winIn is
// the placement the forced win lands on at the latest, the gift's placement
// counting as the first. See app/gift/puzzles.js for the fields and lib/gift-core.js
// for the rules.
//
// TWO STAGES.
//
//   pool   Worker threads sample random positions of a given size and keep the
//          ones with exactly one winning first move. Work is cut into numbered
//          CHUNKS of a fixed number of samples, each seeded by its own number,
//          so the pool is a pure function of the chunks run, and a stopped run
//          picks up at the next chunk. Kept candidates append to
//          /tmp/build/gift-pool-k<k>.jsonl, finished chunks to gift-chunks-k<k>.json.
//
//   bank   Deals the calendar from the pool under the weekday ramp (the
//          board size k and winIn are pinned per weekday; within that, the
//          weekday takes a quantile of `safe`, the number of first moves that
//          do not hand the opponent an immediate win), and RE-PROVES every
//          board it writes with the shipped solver in lib/gift-core.js.
//
// Run:
//   node scripts/gen-gift.mjs pool <k> [chunks=20] [workers=2] [firstChunk=0]
//   node scripts/gen-gift.mjs stats
//   node scripts/gen-gift.mjs bank > app/gift/puzzles.js
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  makeSolver, winningLines, winsWith, empties, poolOf, HORIZON, encodeBoard, pieceShort,
} from '../lib/gift-core.js';

const DIR = '/tmp/build';
mkdirSync(DIR, { recursive: true });
const POOL = (k) => `${DIR}/gift-pool-k${k}.jsonl`;
const CHUNKS = (k) => `${DIR}/gift-chunks-k${k}.json`;
const SAMPLES = 400; // per chunk

export const FIRST = '2026-10-16';
export const LAST = '2027-01-31';
// THE RAMP, by weekday (0 Sunday). k = pieces on the board before the gift,
// winIn pinned, q = the quantile of `safe` the day takes from its pool.
export const RAMP = {
  1: { k: 9, winIn: 2, q: 0.35 },
  2: { k: 8, winIn: 2, q: 0.5 },
  3: { k: 8, winIn: 3, q: 0.5 },
  4: { k: 8, winIn: 4, q: 0.6 },
  5: { k: 7, winIn: 3, q: 0.6 },
  6: { k: 7, winIn: 4, q: 0.7 },
  0: { k: 7, winIn: 5, q: 0.7 }, // the Sunday Edition: the last piece decides it
};
// Launch day (No. 1, a Friday) takes the Monday spec, as Duet's did.
export const LAUNCH = { k: 9, winIn: 2, q: 0.35 };

function mulberry(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The analysis of one position: null unless it is a puzzle (no win already on
// the board, no win for the gift on the spot, a forced win, exactly one
// winning first move).
export function analyse(board, hand) {
  if (winningLines(board).length) return null;
  const es = empties(board);
  if (es.some((s) => winsWith(board, s, hand))) return null;
  const S = makeSolver();
  if (!S.win(board.slice(), hand, HORIZON)) return null;
  let safe = 0, total = 0, key = null, wins = 0;
  for (const s of es) {
    for (const g of poolOf(board, hand)) {
      total++;
      const b = board.slice(); b[s] = hand;
      if (empties(b).some((t) => winsWith(b, t, g))) continue;
      safe++;
      if (S.moveWins(board, hand, s, g)) { wins++; key = { sq: s, give: g }; if (wins > 1) return null; }
    }
  }
  if (wins !== 1) return null;
  const winIn = S.value(board, hand);
  return { winIn, safe, total, key };
}

function runChunk(k, c) {
  const rnd = mulberry(1000003 * k + c * 7919 + 17);
  const sh = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const out = [];
  for (let n = 0; n < SAMPLES; n++) {
    const pcs = sh([...Array(16).keys()]);
    const sq = sh([...Array(16).keys()]);
    const b = Array(16).fill(-1);
    for (let i = 0; i < k; i++) b[sq[i]] = pcs[i];
    const hand = pcs[k];
    const a = analyse(b, hand);
    if (a) out.push({ k, chunk: c, n, board: encodeBoard(b), hand: pieceShort(hand), winIn: a.winIn, safe: a.safe, total: a.total, keySq: a.key.sq, keyGive: pieceShort(a.key.give) });
  }
  return out;
}

async function pool(k, chunks = 20, workers = 2, first = 0) {
  const done = new Set(existsSync(CHUNKS(k)) ? JSON.parse(readFileSync(CHUNKS(k), 'utf8')) : []);
  const todo = [];
  for (let c = first; todo.length < chunks; c++) if (!done.has(c)) todo.push(c);
  const parts = Array.from({ length: workers }, () => []);
  todo.forEach((c, i) => parts[i % workers].push(c));
  const t0 = Date.now();
  await Promise.all(parts.filter((p) => p.length).map((p) => new Promise((res, rej) => {
    const w = new Worker(fileURLToPath(import.meta.url), { workerData: { k, chunks: p } });
    w.on('message', (m) => {
      if (m.done) { res(); return; }
      for (const r of m.out) appendFileSync(POOL(k), JSON.stringify(r) + '\n');
      done.add(m.c);
      writeFileSync(CHUNKS(k), JSON.stringify([...done].sort((a, b) => a - b)));
      process.stderr.write(`k${k} chunk ${m.c}: ${m.out.length} kept (${Math.round((Date.now() - t0) / 1000)}s)\n`);
    });
    w.on('error', rej);
  })));
}

function readPool(k) {
  if (!existsSync(POOL(k))) return [];
  const seen = new Set();
  const out = [];
  for (const line of readFileSync(POOL(k), 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const r = JSON.parse(line);
    const id = r.board + '|' + r.hand;
    if (seen.has(id)) continue;
    seen.add(id); out.push(r);
  }
  // A pure function of the chunks run: order by chunk then sample.
  return out.sort((a, b) => a.chunk - b.chunk || a.n - b.n);
}

function stats() {
  for (const k of [9, 8, 7, 6]) {
    const p = readPool(k);
    if (!p.length) continue;
    const by = {};
    for (const r of p) (by[r.winIn] = by[r.winIn] || []).push(r.safe);
    console.log(`k${k}: ${p.length}`, Object.entries(by).map(([n, a]) => `win in ${n}: ${a.length}`).join(', '));
  }
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export function dates() {
  const out = [];
  for (let d = new Date(FIRST + 'T12:00:00Z'); d <= new Date(LAST + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1)) out.push(d.toISOString().slice(0, 10));
  return out;
}
export function specOf(live, num) {
  if (num === 1) return LAUNCH;
  return RAMP[new Date(live + 'T12:00:00Z').getUTCDay()];
}

function bank() {
  const days = dates();
  // Group the days by spec, then deal each group from its pool slice.
  const groups = new Map();
  days.forEach((live, i) => {
    const sp = specOf(live, i + 1);
    const id = `${sp.k}/${sp.winIn}/${sp.q}`;
    if (!groups.has(id)) groups.set(id, { sp, idx: [] });
    groups.get(id).idx.push(i);
  });
  const chosen = new Array(days.length);
  const used = new Set();
  for (const { sp, idx } of groups.values()) {
    const cand = readPool(sp.k).filter((r) => r.winIn === sp.winIn && !used.has(r.board + '|' + r.hand));
    if (cand.length < idx.length) throw new Error(`k${sp.k} win in ${sp.winIn}: ${cand.length} in the pool, ${idx.length} days need one`);
    // The band of the pool around the day's quantile, wide enough to deal from.
    const sorted = cand.slice().sort((a, b) => a.safe - b.safe || a.chunk - b.chunk || a.n - b.n);
    const width = Math.min(sorted.length, Math.max(idx.length, Math.ceil(sorted.length * 0.4)));
    let lo = Math.round(sp.q * sorted.length - width / 2);
    lo = Math.max(0, Math.min(sorted.length - width, lo));
    const band = sorted.slice(lo, lo + width).sort((a, b) => a.chunk - b.chunk || a.n - b.n);
    idx.forEach((i, j) => { chosen[i] = band[j]; used.add(band[j].board + '|' + band[j].hand); });
  }
  const rows = days.map((live, i) => {
    const r = chosen[i];
    const d = new Date(live + 'T12:00:00Z');
    const [y, m, dd] = live.split('-').map(Number);
    const sunday = d.getUTCDay() === 0;
    // Re-prove with the shipped solver before writing.
    const { decodeBoard, parsePiece } = GC;
    const a = analyse(decodeBoard(r.board), parsePiece(r.hand));
    if (!a || a.winIn !== r.winIn || a.safe !== r.safe || a.key.sq !== r.keySq || pieceShort(a.key.give) !== r.keyGive) throw new Error(`re-proof failed on ${live}`);
    return {
      num: i + 1, quizId: `gift-${m}-${dd}-${String(y).slice(2)}`, live,
      dateLabel: `${MONTHS[m - 1]} ${dd}, ${y}`, sunday,
      board: r.board, hand: r.hand, winIn: r.winIn, keySq: r.keySq, keyGive: r.keyGive,
      safe: r.safe, total: r.total,
    };
  });
  process.stdout.write(HEADER + 'export const PUZZLES = [\n' + rows.map((r) => '  ' + JSON.stringify(r) + ',').join('\n') + '\n];\n');
}

import * as GC from '../lib/gift-core.js';

const HEADER = `// Puzzle data for Gift, the daily Quarto endgame.
// GENERATED by scripts/gen-gift.mjs (pool, then bank) and checked by
// scripts/verify-gift.mjs. Do not edit by hand: regenerate.
//
// Imported ONLY by the server page (app/gift/page.js), which filters
// live <= today before handing the bank to the client and strips the key from
// every board but the one being played, so tomorrow's position never ships to
// a browser.
//
// THE GAME. Sixteen pieces, each tall or short, dark or light, square or round,
// hollow or solid. Place the piece you were handed, then hand your opponent one
// of the pieces still off the board. Four in a row, a column or a long diagonal
// that share ANY one trait win for whoever placed the fourth.
//
// THE CLAIM, per board. No line is finished and the gift wins nowhere on the
// spot. The player can force a win against any defence, on their winIn-th
// placement at the latest (the gift's placement is the first), and EXACTLY ONE
// first move does it: put the gift on keySq and hand over keyGive. Every other
// first move loses or draws against best play.
//
// FIELDS
//   num, quizId 'gift-M-D-YY', live 'YYYY-MM-DD', dateLabel, sunday (true only
//             on real Sundays: the Sunday Edition).
//   board     sixteen squares, row by row from the top left, each a piece code
//             or '....'. A code is four letters: T/S tall or short, D/L dark
//             or light, Q/R square or round, H/O hollow or sOlid.
//   hand      the piece the player was handed.
//   winIn     the placement the forced win lands on at the latest.
//   keySq     0..15, where the gift goes. keyGive: the piece handed back.
//             Never shown to a player who did not find them.
//   safe      first moves that do not hand the opponent a piece that wins on
//             the spot: the moves a player actually has to weigh. total: every
//             first move.
//
// THE RAMP (pieces on the board before the gift, and winIn, by weekday):
// Mon 9 and 2, Tue 8 and 2, Wed 8 and 3, Thu 8 and 4, Fri 7 and 3, Sat 7 and 4,
// Sunday Edition 7 and 5, where the last piece on the board decides it. Within
// a weekday the board is drawn from a band of the pool by \`safe\`. Launch day,
// No. 1, takes the Monday shape. No position repeats.
`;

if (!isMainThread) {
  for (const c of workerData.chunks) parentPort.postMessage({ c, out: runChunk(workerData.k, c) });
  parentPort.postMessage({ done: true });
} else {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'pool') await pool(...args.map(Number));
  else if (cmd === 'stats') stats();
  else if (cmd === 'bank') bank();
  else if (cmd) { console.error('usage: pool <k> [chunks] [workers] [first] | stats | bank'); process.exit(2); }
}
