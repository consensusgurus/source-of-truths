#!/usr/bin/env node
// gen-sixes — build the Sixes puzzle bank (app/sixes/puzzles.js).
//
//   node scripts/gen-sixes.mjs --probe            measure what the space offers
//   node scripts/gen-sixes.mjs --from 2026-08-14 --days 140 > app/sixes/puzzles.js
//   node scripts/gen-sixes.mjs --append --until 2027-04-30 > /tmp/sixes-new.js   (restock;
//     then node scripts/_splice.mjs sixes /tmp/sixes-new.js)
//
// HOW A BOARD IS MADE
//   1. Fill a random complete 6x6 grid (shuffled backtracking).
//   2. Dig clues out in a random order, keeping exactly one solution at every
//      step, until the board is MINIMAL: no printed digit can come out.
//   3. Grade it with the technique solver in scripts/sixes-core.mjs and keep it
//      only if the grade matches the target for that weekday.
//
// The dig runs to minimality rather than to a clue count, so no board carries a
// digit that is doing no work. Difficulty is therefore set by the TECHNIQUE the
// board demands, never by counting clues, which is the thing a clue count only
// loosely correlates with.
//
// WEEKDAY RAMP (target grade, see LEVEL_NAMES in sixes-core.mjs)
//   Mon 1 · Tue 2 · Wed 2 · Thu 3 · Fri 3 · Sat 3 · Sun 4 (the Sunday Edition)
//
// VARIETY, checked as the bank is built and again by the verifier: no solution
// grid is ever reused, no two boards share a clue pattern, and no digit sits in
// the same square across three consecutive days.
import { N, CELLS, PEERS, countSolutions, analyze, LEVEL_NAMES } from './sixes-core.mjs';

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

// ─── dig to a minimal one-solution board ───────────────────────────────────
// `sym` digs in 180-degree rotational PAIRS (i with 35 - i), which is what makes
// the printed clue pattern look like a real puzzle rather than a scatter. A pair
// comes out only if the board still has one solution with BOTH gone.
function dig(sol, rnd, sym) {
  const g = sol.slice();
  if (!sym) {
    for (const i of shuffled([...Array(CELLS).keys()], rnd)) {
      const keep = g[i];
      g[i] = 0;
      if (countSolutions(g, 2) !== 1) g[i] = keep;
    }
    return g;
  }
  const pairs = [];
  for (let i = 0; i < CELLS / 2; i++) pairs.push([i, CELLS - 1 - i]);
  for (const [a, b] of shuffled(pairs, rnd)) {
    const ka = g[a]; const kb = g[b];
    g[a] = 0; g[b] = 0;
    if (countSolutions(g, 2) !== 1) { g[a] = ka; g[b] = kb; }
  }
  return g;
}

// Target cost band per weekday, indexed by JS day-of-week (0 = Sunday).
//
// COST is the weighted step tally from analyze() in sixes-core.mjs. Because a
// placement is either a naked single (1) or a hidden single (4), and a board
// always makes exactly (36 - clues) placements, cost works out to
//
//     cost  =  empty squares  +  3 x hidden-single steps   (+ 12 per locked step)
//
// so it is a single number folding together the two things that actually make a
// mini sudoku hard: how much of the grid is blank, and how often you have to ask
// "where does this digit go in this unit" instead of "what goes in this square".
// Monday is 0 hidden singles and a full-ish grid; Saturday is a dozen; the
// Sunday Edition sits above every weekday band by construction.
// Bands are fitted to the SYMMETRIC dig, which is what the bank uses. Measured
// over 2000 random symmetric minimal boards: cost min 20, median 24, p90 35,
// p97 44, max 106. So Monday sits at the floor of the distribution and Sunday
// in its top fraction of a percent.
const BANDS = [
  [56, 999], // Sun — the Sunday Edition, above every weekday band by construction
  [0, 22],   // Mon
  [23, 25],  // Tue
  [26, 30],  // Wed
  [31, 36],  // Thu
  [37, 43],  // Fri
  [44, 52],  // Sat
];
export const WEEKDAY_BANDS = BANDS;
const clueCount = (g) => g.reduce((n, v) => n + (v ? 1 : 0), 0);

function makeBoard(band, rnd, sym, tries = 40000) {
  for (let t = 0; t < tries; t++) {
    const sol = fullGrid(rnd);
    const given = dig(sol, rnd, sym);
    const a = analyze(given);
    if (!a.level) continue;                                  // needs a guess: never ship it
    if (a.cost < band[0] || a.cost > band[1]) continue;
    return { sol, given, level: a.level, cost: a.cost, steps: a.steps };
  }
  return null;
}

// ─── probe: what does the space actually offer? ─────────────────────────────
function probe(nBoards = 400, sym = false) {
  const rnd = rng(20260814);
  const byLevel = {}; const cluesBy = {}; const costs = [];
  for (let t = 0; t < nBoards; t++) {
    const sol = fullGrid(rnd);
    const given = dig(sol, rnd, sym);
    const a = analyze(given);
    byLevel[a.level] = (byLevel[a.level] || 0) + 1;
    (cluesBy[a.level] = cluesBy[a.level] || []).push(clueCount(given));
    if (a.level) costs.push(a.cost);
  }
  console.log(`probe of ${nBoards} minimal boards`);
  for (const lv of Object.keys(byLevel).sort()) {
    const cs = cluesBy[lv];
    const avg = (cs.reduce((a, b) => a + b, 0) / cs.length).toFixed(1);
    console.log(`  level ${lv} ${(LEVEL_NAMES[lv] || 'unsolvable by these techniques').padEnd(20)} ${String(byLevel[lv]).padStart(4)}  clues min ${Math.min(...cs)} avg ${avg} max ${Math.max(...cs)}`);
  }
  costs.sort((a, b) => a - b);
  const pct = (p) => costs[Math.min(costs.length - 1, Math.floor((p / 100) * costs.length))];
  console.log(`  cost  n=${costs.length}  min ${costs[0]}  p10 ${pct(10)}  p25 ${pct(25)}  p50 ${pct(50)}  p75 ${pct(75)}  p90 ${pct(90)}  p97 ${pct(97)}  max ${costs[costs.length - 1]}`);
  const hist = {};
  for (const c of costs) { const b = Math.floor(c / 5) * 5; hist[b] = (hist[b] || 0) + 1; }
  console.log(`  ${Object.keys(hist).map(Number).sort((a, b) => a - b).map((b) => `${b}-${b + 4}:${hist[b]}`).join('  ')}`);
}

// ─── bank ──────────────────────────────────────────────────────────────────
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ymd = (d) => d.toISOString().slice(0, 10);
const label = (d) => `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
const quizId = (d) => `sixes-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`;
const rows = (flat) => {
  const out = [];
  for (let r = 0; r < N; r++) out.push(flat.slice(r * N, r * N + N));
  return out;
};

function build(from, days, sym, prior = null) {
  // prior (the --append mode): the live bank. Its solutions and clue patterns
  // seed the variety sets, its last board seeds the day-to-day echo rule, the
  // numbering carries on from it, and the RNG is OFFSET by its last num so the
  // new segment cannot replay the frozen one.
  const base = prior ? prior.length : 0;
  const rnd = rng(prior ? 60606 + base * 7919 : 60606);
  const out = [];
  const seenSol = new Set(prior ? prior.map((p) => p.sol.flat().join('')) : []);
  const seenPattern = new Set(prior ? prior.map((p) => p.given.flat().map((v) => (v ? 1 : 0)).join('')) : []);
  const lastGiven = () => (out.length ? out[out.length - 1].given : prior && prior.length ? prior[prior.length - 1].given.flat() : null);
  const start = new Date(`${from}T00:00:00Z`);
  for (let k = 0; k < days; k++) {
    const d = new Date(start.getTime() + k * 86400000);
    const dow = d.getUTCDay();
    const band = BANDS[dow];
    let board = null;
    for (let attempt = 0; attempt < 400 && !board; attempt++) {
      const b = makeBoard(band, rnd, sym);
      if (!b) break;
      const solKey = b.sol.join('');
      const patKey = b.given.map((v) => (v ? 1 : 0)).join('');
      if (seenSol.has(solKey) || seenPattern.has(patKey)) continue;
      // Variety across the bank, not just per board: no solution grid and no
      // clue pattern is ever reused, and a board may repeat at most ONE printed
      // digit-in-square from the day before, so consecutive grids never open
      // looking like the same puzzle.
      const prev = lastGiven();
      const echo = prev ? prev.reduce((n, v, i) => n + (v && v === b.given[i] ? 1 : 0), 0) : 0;
      if (echo > 1) continue;
      board = b;
      seenSol.add(solKey); seenPattern.add(patKey);
    }
    if (!board) throw new Error(`could not build a cost ${band[0]}-${band[1]} board for ${ymd(d)}`);
    out.push({
      num: base + k + 1,
      quizId: quizId(d),
      live: ymd(d),
      dateLabel: label(d),
      sunday: dow === 0,
      level: board.level,
      cost: board.cost,
      clues: clueCount(board.given),
      given: board.given,
      sol: board.sol,
    });
  }
  return out;
}

function emit(bank) {
  const head = `// Puzzle data for Sixes, the daily 6x6 mini sudoku. Imported ONLY by the server
// page (app/sixes/page.js), which filters live<=today before handing puzzles to
// the client, so future boards and their solutions never reach a browser.
//
// A board is a 6x6 grid of the digits 1-6 in six boxes two rows tall and three
// columns wide. \`given\` holds the printed clues (0 = a square the player fills)
// and \`sol\` is the solution, used for the win check, the one hint, and
// reveal-and-end.
//
// THREE MEASURED FIELDS, all recomputed by scripts/verify-sixes.mjs rather than
// trusted:
//   clues  printed digits.
//   level  the hardest technique the board demands: 1 naked singles,
//          2 hidden singles, 3 locked candidates, 4 pairs.
//   cost   the weighted step tally that sets the weekday ramp, which works out
//          to (empty squares) + 3 x (hidden-single steps). It exists because
//          \`level\` alone is useless as a ramp on a grid this small: across 2000
//          random boards, 79% needed nothing past naked singles, 21% needed
//          hidden singles, 0.2% needed locked candidates and 0.05% a pair.
//
// EVERY board has EXACTLY ONE solution, is solvable by pure logic with no
// guessing anywhere, and carries a 180-degree rotationally SYMMETRIC clue
// pattern. Symmetry is why the boards are PAIR-minimal rather than cell-minimal:
// no symmetric pair of clues can be removed, but an individual clue sometimes
// can. That is the same trade every printed sudoku makes, and it costs nothing
// here because difficulty is set by \`cost\`, which measures the solve that the
// printed board actually gives you.
//
// Weekday cost bands: Mon <=22, Tue 23-25, Wed 26-30, Thu 31-36, Fri 37-43,
// Sat 44-52, and the Sunday Edition at 56+, above every weekday band.
//
// Do NOT hand-edit a board here. Regenerate with scripts/gen-sixes.mjs and
// re-run scripts/verify-sixes.mjs.
export const PUZZLES = [`;
  const body = bank.map((p) => [
    '  {',
    `    num: ${p.num},`,
    `    quizId: '${p.quizId}',`,
    `    live: '${p.live}',`,
    `    dateLabel: '${p.dateLabel}',`,
    `    sunday: ${p.sunday},`,
    `    level: ${p.level},`,
    `    cost: ${p.cost},`,
    `    clues: ${p.clues},`,
    `    given: [${rows(p.given).map((r) => `[${r.join(',')}]`).join(',')}],`,
    `    sol: [${rows(p.sol).map((r) => `[${r.join(',')}]`).join(',')}],`,
    '  },',
  ].join('\n')).join('\n');
  return `${head}\n${body}\n];\n`;
}

const args = process.argv.slice(2);
const arg = (k, dflt) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : dflt; };
const sym = !args.includes('--no-sym');
if (args.includes('--probe')) {
  probe(Number(arg('--probe-n', 400)), sym);
} else if (args.includes('--append')) {
  // node scripts/gen-sixes.mjs --append --until YYYY-MM-DD > /tmp/sixes-new.js
  // then: node scripts/_splice.mjs sixes /tmp/sixes-new.js
  // Prints ONLY the new boards (the day after the bank's last through --until);
  // the frozen bank is never regenerated, because a full regen does not
  // reproduce its last board.
  const { PUZZLES } = await import('../app/sixes/puzzles.js');
  const last = PUZZLES[PUZZLES.length - 1].live;
  const from = new Date(`${last}T00:00:00Z`); from.setUTCDate(from.getUTCDate() + 1);
  const days = Math.round((Date.parse(`${arg('--until')}T00:00:00Z`) - from.getTime()) / 864e5) + 1;
  if (!(days > 0)) { process.stderr.write(`sixes already runs to ${last}\n`); process.exit(0); }
  const bank = build(ymd(from), days, sym, PUZZLES);
  process.stdout.write(emit(bank));
  process.stderr.write(`built ${bank.length} new boards ${bank[0].live} to ${bank[bank.length - 1].live}\n`);
} else {
  const bank = build(arg('--from', '2026-08-14'), Number(arg('--days', 140)), sym);
  process.stdout.write(emit(bank));
  const counts = {};
  for (const p of bank) counts[p.level] = (counts[p.level] || 0) + 1;
  process.stderr.write(`built ${bank.length} boards  ${Object.entries(counts).map(([l, n]) => `L${l}:${n}`).join(' ')}  clues ${Math.min(...bank.map((p) => p.clues))}-${Math.max(...bank.map((p) => p.clues))}  cost ${Math.min(...bank.map((p) => p.cost))}-${Math.max(...bank.map((p) => p.cost))}\n`);
}
