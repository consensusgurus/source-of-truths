#!/usr/bin/env node
// gen-whittle — build the Whittle puzzle bank (app/whittle/puzzles.js).
//
//   node scripts/gen-whittle.mjs --probe --pool 200
//   node scripts/gen-whittle.mjs --from 2026-09-07 --days 63 > app/whittle/puzzles.js
//   node scripts/gen-whittle.mjs --append --until 2027-03-31 --seed 271127 > /tmp/whittle-new.js
//     (restock; then node scripts/_splice.mjs whittle /tmp/whittle-new.js)
//
// HOW A BOARD IS MADE
//   1. Fill a random complete 6x6 grid.
//   2. Dig clues out in a random order, keeping exactly one solution at every
//      step, and STOP AT EIGHTEEN. This is the one place Whittle parts company
//      with every other sudoku generator on the site: Sixes digs on to
//      minimality so no printed digit is doing nothing, and here the digits
//      doing nothing are the entire game. Eighteen is a comfortable-looking
//      board with, measured, eight to ten clues still loose in it.
//   3. Measure it with lib/whittle-core.js: `perfect`, the fewest clues any
//      legal order can leave, and `forgive`, the exact chance a careless order
//      still gets there.
//   4. Bin it by `forgive` into the weekday band it belongs to.
//
// WHY A POOL AND NOT REJECTION SAMPLING PER DAY. `forgive` cannot be aimed at,
// only measured, and the bands are narrow, so building day by day would throw
// away almost every board it measured. Measuring a pool once and dealing from
// it costs one analysis per candidate.
//
// WEEKDAY RAMP (forgive, per mille; see BANDS in lib/whittle-core.js)
//   Mon 500-880 · Tue 380-499 · Wed 280-379 · Thu 200-279 · Fri 130-199
//   Sat 61-129 · Sun 0-60, the least forgiving deal of the week.
//
// VARIETY, checked as the bank is dealt and again by the verifier: no solution
// grid is reused, no clue pattern is reused, and a board repeats at most one
// printed digit-in-square from the day before.
import {
  N, CELLS, PEERS, countSolutions, clueCount, analyse, BANDS, bandFor,
} from '../lib/whittle-core.js';

const START_CLUES = 18;
const MIN_REMOVALS = 6;   // a board with less than this in it is not a day's play

// ─── deterministic RNG so a rebuild reproduces the bank byte for byte ───────
function rng(seed) {
  let s = seed >>> 0;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const shuffled = (arr, rnd) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

// ─── a random complete grid ────────────────────────────────────────────────
function fullGrid(rnd) {
  const g = new Array(CELLS).fill(0);
  const ok = (i, d) => { for (const p of PEERS[i]) if (g[p] === d) return false; return true; };
  const rec = (i) => {
    if (i === CELLS) return true;
    for (const d of shuffled([1, 2, 3, 4, 5, 6], rnd)) {
      if (!ok(i, d)) continue;
      g[i] = d;
      if (rec(i + 1)) return true;
      g[i] = 0;
    }
    return false;
  };
  rec(0);
  return g;
}

// ─── dig to exactly START_CLUES, one solution at every step ────────────────
// Returns null on the rare grid whose random dig order strands above eighteen.
function digTo(sol, rnd, target) {
  let g = sol.slice();
  for (const i of shuffled([...Array(CELLS).keys()], rnd)) {
    if (clueCount(g) <= target) break;
    const t = g.slice();
    t[i] = 0;
    if (countSolutions(t, 2) === 1) g = t;
  }
  return clueCount(g) === target ? g : null;
}

function buildPool(count, seed, onEach) {
  const rnd = rng(seed);
  const pool = [];
  let tries = 0;
  while (pool.length < count && tries < count * 12) {
    tries++;
    const sol = fullGrid(rnd);
    const given = digTo(sol, rnd, START_CLUES);
    if (!given) continue;
    const m = analyse(given);
    if (m.clues - m.perfect < MIN_REMOVALS) continue;
    const cand = { sol, given, ...m };
    pool.push(cand);
    if (onEach) onEach(cand, pool.length);
  }
  return pool;
}

// ─── dealing the pool onto dates ───────────────────────────────────────────
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ymd = (d) => d.toISOString().slice(0, 10);
const label = (d) => `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
const quizId = (d) => `whittle-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`;
const rows = (flat) => { const out = []; for (let r = 0; r < N; r++) out.push(flat.slice(r * N, r * N + N)); return out; };
const patternOf = (given) => given.map((v) => (v ? 1 : 0)).join('');

function deal(pool, from, days, prior = null) {
  // prior (the --append mode): the live bank, whose solutions, clue patterns
  // and last board seed the variety rules, and whose numbering carries on.
  const base = prior ? prior.length : 0;
  const out = [];
  const used = new Set();
  const seenSol = new Set(prior ? prior.map((p) => p.sol.flat().join('')) : []);
  const seenPattern = new Set(prior ? prior.map((p) => patternOf(p.given.flat())) : []);
  const prevGiven = () => (out.length ? out[out.length - 1].given : prior && prior.length ? prior[prior.length - 1].given.flat() : null);
  const start = new Date(`${from}T00:00:00Z`);
  for (let k = 0; k < days; k++) {
    const d = new Date(start.getTime() + k * 86400000);
    const dow = d.getUTCDay();
    const band = bandFor(dow);
    let pick = -1;
    for (let j = 0; j < pool.length; j++) {
      if (used.has(j)) continue;
      const c = pool[j];
      if (c.forgive < band.lo || c.forgive > band.hi) continue;
      if (seenSol.has(c.sol.join('')) || seenPattern.has(patternOf(c.given))) continue;
      const prev = prevGiven();
      const echo = prev ? prev.reduce((n, v, i) => n + (v && v === c.given[i] ? 1 : 0), 0) : 0;
      if (echo > 1) continue;
      pick = j;
      break;
    }
    if (pick < 0) throw new Error(`pool is out of ${band.name} boards (forgive ${band.lo}-${band.hi}) for ${ymd(d)} — raise --pool`);
    used.add(pick);
    const c = pool[pick];
    seenSol.add(c.sol.join(''));
    seenPattern.add(patternOf(c.given));
    out.push({
      num: base + k + 1,
      quizId: quizId(d),
      live: ymd(d),
      dateLabel: label(d),
      sunday: dow === 0,
      clues: c.clues,
      perfect: c.perfect,
      forgive: c.forgive,
      given: c.given,
      sol: c.sol,
    });
  }
  return out;
}

function emit(bank) {
  const head = `// Puzzle data for Whittle, the daily sudoku played backwards. Imported ONLY by
// the server page (app/whittle/page.js), which filters live<=today before
// handing puzzles to the client, so future boards never reach a browser.
//
// A board is a 6x6 sudoku in six boxes two rows tall and three columns wide.
// \`sol\` is the completed grid, which the player SEES the whole way through:
// Whittle asks nothing about what the answer is. \`given\` holds the eighteen
// printed clues the day starts with, and the play is taking them away, one at a
// time, for as long as the board still has exactly one solution.
//
// THREE MEASURED FIELDS, all recomputed by scripts/verify-whittle.mjs rather
// than trusted:
//   clues    the printed clues the day opens with. Always ${START_CLUES}.
//   perfect  the FEWEST clues any legal order can leave standing. Exhaustive
//            and exact, not a search mark: every reachable position is
//            enumerated. This is the ten-out-of-ten target.
//   forgive  per mille, the exact probability that a player picking at random
//            among the legal removals, over and over, still lands on
//            \`perfect\`. THIS IS THE WEEKDAY RAMP. It is a probability and not
//            a clue count because every board is eighteen clues and every board
//            bottoms out around nine, so the whole difficulty of a Whittle
//            board is in the ORDER: a forgiving board lets almost any order
//            reach the floor, an unforgiving one is full of traps that strand a
//            careless player a clue or two short.
//
// Weekday forgive bands: Mon 500-880, Tue 380-499, Wed 280-379, Thu 200-279,
// Fri 130-199, Sat 61-129, and the Sunday Edition at 60 and under, the least
// forgiving deal of the week.
//
// Do NOT hand-edit a board here. Regenerate with scripts/gen-whittle.mjs and
// re-run scripts/verify-whittle.mjs.
export const PUZZLES = [`;
  const body = bank.map((p) => [
    '  {',
    `    num: ${p.num},`,
    `    quizId: '${p.quizId}',`,
    `    live: '${p.live}',`,
    `    dateLabel: '${p.dateLabel}',`,
    `    sunday: ${p.sunday},`,
    `    clues: ${p.clues},`,
    `    perfect: ${p.perfect},`,
    `    forgive: ${p.forgive},`,
    `    given: [${rows(p.given).map((r) => `[${r.join(',')}]`).join(',')}],`,
    `    sol: [${rows(p.sol).map((r) => `[${r.join(',')}]`).join(',')}],`,
    '  },',
  ].join('\n')).join('\n');
  return `${head}\n${body}\n];\n`;
}

// ─── cli ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const arg = (k, dflt) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : dflt; };
const POOL = Number(arg('--pool', 340));
const SEED = Number(arg('--seed', 90701));

if (args.includes('--probe')) {
  const t0 = Date.now();
  const pool = buildPool(POOL, SEED, (c, n) => {
    if (n % 25 === 0) process.stderr.write(`  ${n}/${POOL}  ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
  });
  const bins = BANDS.map((b) => ({ ...b, n: pool.filter((c) => c.forgive >= b.lo && c.forgive <= b.hi).length }));
  const f = pool.map((c) => c.forgive).sort((a, b) => a - b);
  const rem = pool.map((c) => c.clues - c.perfect).sort((a, b) => a - b);
  process.stderr.write(`pool ${pool.length} in ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
  process.stderr.write(`forgive  min ${f[0]}  p25 ${f[(f.length / 4) | 0]}  med ${f[(f.length / 2) | 0]}  p75 ${f[((f.length * 3) / 4) | 0]}  max ${f[f.length - 1]}\n`);
  process.stderr.write(`removals min ${rem[0]}  med ${rem[(rem.length / 2) | 0]}  max ${rem[rem.length - 1]}\n`);
  process.stderr.write(`over ${POOL}: ${bins.map((b) => `${b.name.slice(0, 3)} ${b.n}`).join(' · ')}\n`);
  process.stderr.write(`unusable (outside every band): ${pool.filter((c) => !BANDS.some((b) => c.forgive >= b.lo && c.forgive <= b.hi)).length}\n`);
} else if (args.includes('--append')) {
  // node scripts/gen-whittle.mjs --append --until YYYY-MM-DD [--seed N] > /tmp/whittle-new.js
  // then: node scripts/_splice.mjs whittle /tmp/whittle-new.js
  // Prints ONLY new boards, dealt from a FRESH pool (pass a seed never used
  // before; the 2026-11-27 restock used 271127). A full regen does not
  // reproduce the bank's last board, so the frozen bank is never rebuilt.
  const { PUZZLES } = await import('../app/whittle/puzzles.js');
  const last = PUZZLES[PUZZLES.length - 1].live;
  const from = new Date(`${last}T00:00:00Z`); from.setUTCDate(from.getUTCDate() + 1);
  const days = Math.round((Date.parse(`${arg('--until')}T00:00:00Z`) - from.getTime()) / 864e5) + 1;
  if (!(days > 0)) { process.stderr.write(`whittle already runs to ${last}\n`); process.exit(0); }
  if (SEED === 90701) { process.stderr.write('--append needs a fresh --seed (90701 dealt the frozen bank)\n'); process.exit(1); }
  const t0 = Date.now();
  const pool = buildPool(POOL, SEED, (c, n) => {
    if (n % 25 === 0) process.stderr.write(`  measured ${n}/${POOL}  ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
  });
  const bank = deal(pool, ymd(from), days, PUZZLES);
  process.stdout.write(emit(bank));
  process.stderr.write(`built ${bank.length} new boards ${bank[0].live} to ${bank[bank.length - 1].live}\n`);
} else {
  const days = Number(arg('--days', 63));
  const t0 = Date.now();
  const pool = buildPool(POOL, SEED, (c, n) => {
    if (n % 25 === 0) process.stderr.write(`  measured ${n}/${POOL}  ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
  });
  const bank = deal(pool, arg('--from', '2026-09-07'), days);
  process.stdout.write(emit(bank));
  const f = bank.map((p) => p.forgive);
  const rem = bank.map((p) => p.clues - p.perfect);
  process.stderr.write(`built ${bank.length} boards from a pool of ${pool.length} in ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
  process.stderr.write(`forgive ${Math.min(...f)}-${Math.max(...f)}  removals ${Math.min(...rem)}-${Math.max(...rem)}  perfect ${Math.min(...bank.map((p) => p.perfect))}-${Math.max(...bank.map((p) => p.perfect))}\n`);
}
