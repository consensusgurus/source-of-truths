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
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const BANK = join(here, '../app/tally/puzzles.js');
const args = process.argv.slice(2);
const DAYS = args.includes('--days') ? Number(args[args.indexOf('--days') + 1]) : 30;
const WRITE = args.includes('--write');

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

const { PUZZLES } = await import(BANK);
const last = PUZZLES[PUZZLES.length - 1];
const seen = new Set(PUZZLES.map((p) => JSON.stringify([p.blocked, p.given])));
const out = [];
for (let i = 1; i <= DAYS; i++) {
  const num = last.num + i, live = addDays(last.live, i), sunday = isSunday(live);
  const b = makeBoard(num, sunday, seen);
  console.error(`tally #${num} ${live}${sunday ? ' Sun' : ''}: ${b.N}x${b.N}, rack ${b.bank.length} (attempt ${b.attempt})`);
  out.push(`  {
    num: ${num},
    quizId: 'tally-${quizDate(live)}',
    live: '${live}',
    dateLabel: '${dateLabel(live)}',
    size: ${b.N},
    sunday: ${sunday},
    blocked: ${JSON.stringify(b.blocked)},
    given: ${JSON.stringify(b.given)},
    sol: ${JSON.stringify(b.sol)},
    rowT: [${b.rowT.join(', ')}],
    colT: [${b.colT.join(', ')}],
    bank: [${b.bank.join(', ')}],
    fewest: ${b.bank.length},
  },\n`);
}
const block = out.join('');
if (WRITE) {
  const text = readFileSync(BANK, 'utf8');
  if (!text.endsWith('\n];\n')) throw new Error('bank does not end with "\\n];\\n"');
  writeFileSync(BANK, text.slice(0, -3) + block + '];\n');
  console.error(`appended ${DAYS} boards to ${BANK}`);
} else process.stdout.write(block);
