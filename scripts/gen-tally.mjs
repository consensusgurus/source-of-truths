// Generator for Tally, the daily number-ledger game (app/tally/puzzles.js).
//
//   node scripts/gen-tally.mjs [--days 30] [--write]
//
// Reads the live bank, then builds `--days` new boards starting the day after
// the last banked date and numbered on from the last `num`. Without --write it
// prints the new board objects; with --write it APPENDS them to the bank, just
// before the closing `];`, so every existing board comes back byte-identical.
//
// Deterministic: each board is seeded from its own `num` (plus a retry
// counter), so re-running reproduces the same boards and a new range never
// replays a frozen one.
//
// Authoring rules (the header of app/tally/puzzles.js and the 2026-08-28
// extension, commit 5c23714), matched to the live bank's ranges:
//   - Weekdays 5x5: 4-6 blocked cells, 4-8 printed digits, a rack of 12-16.
//   - Sundays 6x6 Edition: 5-10 blocked, 9-14 printed, a rack of 17-18.
//   - Every row and column keeps at least two open cells; digits are 1-9.
//   - EXACTLY ONE arrangement of the rack meets every row/column total,
//     proved by an exhaustive counter capped at 2 (the verifier,
//     scripts/verify-daily-banks.mjs tally, re-proves it independently).
//   - `fewest` = rack length; no (blocked, given) layout repeats the bank.
//
// FROM 2026-10-14 (LOGIC_FROM, owner 2026-10-13: "most days it is too hard to
// deduce") every board also has to be SOLVABLE BY DEDUCTION, as measured by the
// human solver in lib/tally-logic.js (single-square lines, line sweeps, the
// rack count, and nothing else), and has to open with EXACTLY ONE row or column
// holding a single empty square, so every day has a way in. Digging keeps a
// tile in the rack only while that solver still finishes, which also proves
// the one solution. Measured before this: only 30 of the 92 boards already
// played could be finished that way at all. The week ramps by rack size
// (Mon 12, Tue/Wed 13, Thu/Fri 14, Sat 15, Sunday 6x6 17-18) and then by a
// measured difficulty (placements the sweep had to settle, plus sweeps), taking
// the day's quantile from a pool of candidates.
//
//   node scripts/gen-tally.mjs --regen-from 2026-10-14 --write
// regenerates every board from that date to the end of the bank (same nums and
// dates), leaving every earlier board byte-identical. Add --until YYYY-MM-DD to
// run the bank further.
import { readFileSync, writeFileSync } from 'node:fs';
import { solve, starterLines } from '../lib/tally-logic.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const BANK = join(here, '../app/tally/puzzles.js');
const args = process.argv.slice(2);
const DAYS = args.includes('--days') ? Number(args[args.indexOf('--days') + 1]) : 30;
const WRITE = args.includes('--write');
const REGEN_FROM = args.includes('--regen-from') ? args[args.indexOf('--regen-from') + 1] : null;
const UNTIL = args.includes('--until') ? args[args.indexOf('--until') + 1] : null;
export const LOGIC_FROM = '2026-10-14';

function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const shuffle = (rng, a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const randInt = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));

const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const quizDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${m}-${d}-${String(y).slice(2)}`; };
const dateLabel = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const isSunday = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay() === 0;

// Count arrangements of `rack` over the open non-given cells (cap 2). Cells are
// taken most-constrained-line first; a line's remaining sum must stay inside
// [cells*min, cells*max] of what is left in the rack.
function countArrangements(N, cells, rowRem, colRem, rack, cap = 2) {
  const counts = Array(10).fill(0);
  for (const v of rack) counts[v]++;
  const rCnt = Array(N).fill(0), cCnt = Array(N).fill(0);
  for (const [r, c] of cells) { rCnt[r]++; cCnt[c]++; }
  const rr = rowRem.slice(), cc = colRem.slice();
  const order = cells.slice().sort((a, b) => (Math.min(rCnt[a[0]], cCnt[a[1]]) - Math.min(rCnt[b[0]], cCnt[b[1]])) || (a[0] - b[0]) || (a[1] - b[1]));
  let count = 0, nodes = 0;
  const lo = () => { for (let v = 1; v <= 9; v++) if (counts[v]) return v; return 0; };
  const hi = () => { for (let v = 9; v >= 1; v--) if (counts[v]) return v; return 0; };
  const feasible = () => {
    const a = lo(), b = hi();
    for (let i = 0; i < N; i++) {
      if (rCnt[i] === 0) { if (rr[i] !== 0) return false; } else if (rr[i] < rCnt[i] * a || rr[i] > rCnt[i] * b) return false;
      if (cCnt[i] === 0) { if (cc[i] !== 0) return false; } else if (cc[i] < cCnt[i] * a || cc[i] > cCnt[i] * b) return false;
    }
    return true;
  };
  const dfs = (i) => {
    if (count >= cap) return;
    if (++nodes > 3e6) { count = cap; return; } // treat a runaway search as "not unique"
    if (i === order.length) { count++; return; }
    const [r, c] = order[i];
    for (let v = 1; v <= 9; v++) {
      if (!counts[v] || v > rr[r] || v > cc[c]) continue;
      counts[v]--; rr[r] -= v; cc[c] -= v; rCnt[r]--; cCnt[c]--;
      if (feasible()) dfs(i + 1);
      counts[v]++; rr[r] += v; cc[c] += v; rCnt[r]++; cCnt[c]++;
      if (count >= cap) return;
    }
  };
  if (feasible()) dfs(0);
  return count;
}

function makeBoard(num, sunday, seen) {
  const N = sunday ? 6 : 5;
  for (let attempt = 0; attempt < 20000; attempt++) {
    const rng = mulberry32(num * 1000003 + attempt * 104729 + 0x7a11);
    const nBlocked = sunday ? randInt(rng, 5, 10) : randInt(rng, 4, 6);
    const rackTarget = sunday ? randInt(rng, 17, 18) : randInt(rng, 12, 16);
    const nOpen = N * N - nBlocked;
    const nGiven = nOpen - rackTarget;
    if (sunday ? (nGiven < 9 || nGiven > 14) : (nGiven < 4 || nGiven > 8)) continue;
    const blocked = Array.from({ length: N }, () => Array(N).fill(0));
    for (const k of shuffle(rng, [...Array(N * N).keys()]).slice(0, nBlocked)) blocked[(k / N) | 0][k % N] = 1;
    let okLines = true;
    for (let i = 0; i < N; i++) {
      let ro = 0, co = 0;
      for (let j = 0; j < N; j++) { if (!blocked[i][j]) ro++; if (!blocked[j][i]) co++; }
      if (ro < 2 || co < 2) okLines = false;
    }
    if (!okLines) continue;
    const sol = blocked.map((row) => row.map((b) => (b ? 0 : randInt(rng, 1, 9))));
    const rowT = sol.map((row) => row.reduce((a, v) => a + v, 0));
    const colT = [...Array(N)].map((_, c) => sol.reduce((a, row) => a + row[c], 0));
    const open = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!blocked[r][c]) open.push([r, c]);
    // Start fully printed; lift digits into the rack while the arrangement stays unique.
    const given = sol.map((row) => row.slice());
    let rackN = 0;
    for (const [r, c] of shuffle(rng, open.slice())) {
      if (rackN === rackTarget) break;
      given[r][c] = 0;
      const cells = open.filter(([a, b]) => !given[a][b]);
      const rack = cells.map(([a, b]) => sol[a][b]);
      const rowRem = rowT.map((t, a) => t - given[a].reduce((s, v) => s + v, 0));
      const colRem = colT.map((t, b) => t - given.reduce((s, row) => s + row[b], 0));
      if (countArrangements(N, cells, rowRem, colRem, rack) === 1) rackN++;
      else given[r][c] = sol[r][c];
    }
    if (rackN !== rackTarget) continue;
    const key = JSON.stringify([blocked, given]);
    if (seen.has(key)) continue;
    seen.add(key);
    const bank = open.filter(([r, c]) => !given[r][c]).map(([r, c]) => sol[r][c]).sort((a, b) => a - b);
    return { N, blocked, given, sol, rowT, colT, bank, attempt };
  }
  throw new Error(`tally #${num}: no board found`);
}

// ── deducible boards (LOGIC_FROM onward) ──────────────────────────────────
const RACK_BY_DOW = [null, 12, 13, 13, 14, 14, 15];   // Mon..Sat; Sunday below
const QUANTILE_BY_DOW = [0.6, 0.1, 0.25, 0.45, 0.55, 0.7, 0.85];
const POOL = 14;
const dow = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();

function logicCandidate(num, sunday, rackTarget, attempt) {
  const N = sunday ? 6 : 5;
  const rng = mulberry32(num * 2654435761 + attempt * 40503 + 0x7a12);
  const nBlocked = sunday ? randInt(rng, 5, 9) : randInt(rng, 4, 6);
  const nOpen = N * N - nBlocked;
  const nGiven = nOpen - rackTarget;
  if (sunday ? nGiven < 8 : nGiven < 4) return null;
  const blocked = Array.from({ length: N }, () => Array(N).fill(0));
  for (const k of shuffle(rng, [...Array(N * N).keys()]).slice(0, nBlocked)) blocked[(k / N) | 0][k % N] = 1;
  for (let i = 0; i < N; i++) {
    let ro = 0, co = 0;
    for (let j = 0; j < N; j++) { if (!blocked[i][j]) ro++; if (!blocked[j][i]) co++; }
    if (ro < 2 || co < 2) return null;
  }
  const sol = blocked.map((row) => row.map((b) => (b ? 0 : randInt(rng, 1, 9))));
  const rowT = sol.map((row) => row.reduce((a, v) => a + v, 0));
  const colT = [...Array(N)].map((_, c) => sol.reduce((a, row) => a + row[c], 0));
  const open = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!blocked[r][c]) open.push([r, c]);
  const given = sol.map((row) => row.slice());
  const spec = () => ({ size: N, blocked, given, rowT, colT,
    bank: open.filter(([a, b]) => !given[a][b]).map(([a, b]) => sol[a][b]) });
  let rackN = 0;
  for (const [r, c] of shuffle(rng, open.slice())) {
    if (rackN === rackTarget) break;
    given[r][c] = 0;
    if (solve(spec()).solved) rackN++;
    else given[r][c] = sol[r][c];
  }
  if (rackN !== rackTarget) return null;
  const p = spec();
  if (starterLines(p).length !== 1) return null;
  const res = solve(p);
  if (!res.solved) return null;
  // belt and braces: the exhaustive counter agrees there is one filling
  const cells = open.filter(([a, b]) => !given[a][b]);
  const rowRem = rowT.map((t, a) => t - given[a].reduce((s2, v) => s2 + v, 0));
  const colRem = colT.map((t, b) => t - given.reduce((s2, row) => s2 + row[b], 0));
  if (countArrangements(N, cells, rowRem, colRem, p.bank) !== 1) return null;
  return { N, blocked, given, sol, rowT, colT, bank: p.bank.slice().sort((a, b) => a - b),
    hard: res.hard, sweeps: res.sweeps, diff: res.hard + 3 * res.sweeps };
}

function makeLogicBoard(num, live, seen) {
  const sunday = isSunday(live);
  const d = dow(live);
  const pool = [];
  for (let attempt = 0; attempt < 60000 && pool.length < POOL; attempt++) {
    const rack = sunday ? (attempt % 2 ? 17 : 18) : RACK_BY_DOW[d];
    const b = logicCandidate(num, sunday, rack, attempt);
    if (!b) continue;
    const key = JSON.stringify([b.blocked, b.given]);
    if (seen.has(key) || pool.some((x) => x.key === key)) continue;
    b.key = key; b.attempt = attempt;
    pool.push(b);
  }
  if (!pool.length) throw new Error(`tally #${num}: no deducible board found`);
  pool.sort((a, b) => a.diff - b.diff || a.attempt - b.attempt);
  const pick = pool[Math.min(pool.length - 1, Math.floor(QUANTILE_BY_DOW[d] * pool.length))];
  seen.add(pick.key);
  return pick;
}

function boardText(num, live, b) {
  return `  {
    num: ${num},
    quizId: 'tally-${quizDate(live)}',
    live: '${live}',
    dateLabel: '${dateLabel(live)}',
    size: ${b.N},
    sunday: ${isSunday(live)},
    blocked: ${JSON.stringify(b.blocked)},
    given: ${JSON.stringify(b.given)},
    sol: ${JSON.stringify(b.sol)},
    rowT: [${b.rowT.join(', ')}],
    colT: [${b.colT.join(', ')}],
    bank: [${b.bank.join(', ')}],
    fewest: ${b.bank.length},
  },\n`;
}

const { PUZZLES } = await import(BANK);
if (REGEN_FROM) {
  if (REGEN_FROM < LOGIC_FROM) throw new Error(`--regen-from must be on or after ${LOGIC_FROM}`);
  const keep = PUZZLES.filter((p) => p.live < REGEN_FROM);
  const lastKept = keep[keep.length - 1];
  const end = UNTIL || PUZZLES[PUZZLES.length - 1].live;
  const seen = new Set(keep.map((p) => JSON.stringify([p.blocked, p.given])));
  const out = [];
  for (let i = 1; ; i++) {
    const live = addDays(lastKept.live, i);
    if (live > end) break;
    const num = lastKept.num + i;
    const b = makeLogicBoard(num, live, seen);
    console.error(`tally #${num} ${live}${isSunday(live) ? ' Sun' : ''}: ${b.N}x${b.N}, rack ${b.bank.length}, hard ${b.hard}, sweeps ${b.sweeps} (attempt ${b.attempt})`);
    out.push(boardText(num, live, b));
  }
  const text = readFileSync(BANK, 'utf8');
  const marker = `    quizId: 'tally-${quizDate(REGEN_FROM)}',`;
  const at = text.indexOf(marker);
  if (at < 0) throw new Error('regen start board not found in the bank');
  const head = text.slice(0, text.lastIndexOf('  {\n', at));
  if (WRITE) {
    writeFileSync(BANK, head + out.join('') + '];\n');
    console.error(`regenerated ${out.length} boards from ${REGEN_FROM}`);
  } else process.stdout.write(out.join(''));
  process.exit(0);
}
const last = PUZZLES[PUZZLES.length - 1];
const seen = new Set(PUZZLES.map((p) => JSON.stringify([p.blocked, p.given])));
const out = [];
for (let i = 1; i <= DAYS; i++) {
  const num = last.num + i, live = addDays(last.live, i), sunday = isSunday(live);
  if (live >= LOGIC_FROM) {
    const b = makeLogicBoard(num, live, seen);
    console.error(`tally #${num} ${live}${sunday ? ' Sun' : ''}: ${b.N}x${b.N}, rack ${b.bank.length}, hard ${b.hard}, sweeps ${b.sweeps}`);
    out.push(boardText(num, live, b));
    continue;
  }
  const b = makeBoard(num, sunday, seen);
  console.error(`tally #${num} ${live}${sunday ? ' Sun' : ''}: ${b.N}x${b.N}, rack ${b.bank.length} (attempt ${b.attempt})`);
  out.push(boardText(num, live, b));
}
const block = out.join('');
if (WRITE) {
  const text = readFileSync(BANK, 'utf8');
  if (!text.endsWith('\n];\n')) throw new Error('bank does not end with "\\n];\\n"');
  writeFileSync(BANK, text.slice(0, -3) + block + '];\n');
  console.error(`appended ${DAYS} boards to ${BANK}`);
} else process.stdout.write(block);
