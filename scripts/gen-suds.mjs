// Generator for Suds, the daily 9x9 sudoku (app/suds/puzzles.js).
//
//   node scripts/gen-suds.mjs [--days 30] [--write]
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
// Authoring rules (the header of app/suds/puzzles.js and the 2026-08-28
// extension, commit 5c23714):
//   - EXACTLY ONE solution, proved here by an exhaustive bitmask counter capped
//     at 2 (scripts/verify-daily-banks.mjs suds re-proves it independently).
//   - Weekdays: 32-34 clues, varied across that range, and solvable with plain
//     naked + hidden singles.
//   - Sundays (the harder Edition): 25-28 clues, and deliberately NOT solvable
//     by plain singles, so the Edition is genuinely past the weekday toolkit.
//   - No given grid repeats any board already in the bank.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const BANK = join(here, '../app/suds/puzzles.js');
const args = process.argv.slice(2);
const DAYS = Number(args[args.indexOf('--days') + 1]) || (args.includes('--days') ? 0 : 30);
const WRITE = args.includes('--write');

// ── seeded RNG ──
function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const shuffle = (rng, a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ── dates ──
const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const quizDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${m}-${d}-${String(y).slice(2)}`; };
const dateLabel = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const isSunday = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay() === 0;

// ── sudoku engine (bitmasks, bit v = digit v) ──
const BOX = (r, c) => 3 * ((r / 3) | 0) + ((c / 3) | 0);
function countSolutions(grid, cap = 2) {
  const g = grid.map((r) => r.slice());
  const R = new Int32Array(9), C = new Int32Array(9), B = new Int32Array(9);
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (g[r][c]) { const b = 1 << g[r][c]; R[r] |= b; C[c] |= b; B[BOX(r, c)] |= b; }
  let count = 0;
  const dfs = () => {
    if (count >= cap) return;
    let br = -1, bc = -1, bm = 0, bn = 10;
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      if (g[r][c]) continue;
      const m = 0x3fe & ~(R[r] | C[c] | B[BOX(r, c)]);
      let n = 0; for (let x = m; x; x &= x - 1) n++;
      if (n === 0) return;
      if (n < bn) { bn = n; br = r; bc = c; bm = m; }
    }
    if (br < 0) { count++; return; }
    for (let v = 1; v <= 9; v++) {
      if (!(bm >> v & 1)) continue;
      const b = 1 << v, bx = BOX(br, bc);
      g[br][bc] = v; R[br] |= b; C[bc] |= b; B[bx] |= b;
      dfs();
      g[br][bc] = 0; R[br] &= ~b; C[bc] &= ~b; B[bx] &= ~b;
      if (count >= cap) return;
    }
  };
  dfs();
  return count;
}
function fullGrid(rng) {
  const g = Array.from({ length: 9 }, () => Array(9).fill(0));
  const R = new Int32Array(9), C = new Int32Array(9), B = new Int32Array(9);
  const fill = (k) => {
    if (k === 81) return true;
    const r = (k / 9) | 0, c = k % 9, bx = BOX(r, c);
    for (const v of shuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9])) {
      const b = 1 << v;
      if ((R[r] | C[c] | B[bx]) & b) continue;
      g[r][c] = v; R[r] |= b; C[c] |= b; B[bx] |= b;
      if (fill(k + 1)) return true;
      g[r][c] = 0; R[r] &= ~b; C[c] &= ~b; B[bx] &= ~b;
    }
    return false;
  };
  fill(0);
  return g;
}
const UNITS = [];
for (let i = 0; i < 9; i++) {
  UNITS.push([...Array(9)].map((_, j) => [i, j]));
  UNITS.push([...Array(9)].map((_, j) => [j, i]));
  UNITS.push([...Array(9)].map((_, j) => [3 * ((i / 3) | 0) + ((j / 3) | 0), 3 * (i % 3) + (j % 3)]));
}
// Plain singles: naked singles and hidden singles, nothing else.
function singlesSolvable(given) {
  const g = given.map((r) => r.slice());
  const cand = (r, c) => { let m = 0x3fe; for (let i = 0; i < 9; i++) { m &= ~(1 << g[r][i]); m &= ~(1 << g[i][c]); } const br = r - (r % 3), bc = c - (c % 3); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) m &= ~(1 << g[br + i][bc + j]); return m; };
  let prog = true;
  while (prog) {
    prog = false;
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (!g[r][c]) { const m = cand(r, c); if (m && !(m & (m - 1))) { g[r][c] = 31 - Math.clz32(m); prog = true; } }
    if (prog) continue;
    for (const u of UNITS) for (let v = 1; v <= 9; v++) {
      if (u.some(([r, c]) => g[r][c] === v)) continue;
      const spots = u.filter(([r, c]) => !g[r][c] && (cand(r, c) >> v & 1));
      if (spots.length === 1) { g[spots[0][0]][spots[0][1]] = v; prog = true; }
    }
  }
  return g.every((r) => r.every((x) => x));
}

function makeBoard(num, sunday, seen) {
  for (let attempt = 0; attempt < 5000; attempt++) {
    const rng = mulberry32(num * 100003 + attempt * 7919 + 0x5d5);
    const target = sunday ? 25 + Math.floor(rng() * 4) : 32 + Math.floor(rng() * 3);
    const sol = fullGrid(rng);
    const given = sol.map((r) => r.slice());
    let clues = 81;
    for (const k of shuffle(rng, [...Array(81).keys()])) {
      if (clues === target) break;
      const r = (k / 9) | 0, c = k % 9, v = given[r][c];
      given[r][c] = 0;
      if (countSolutions(given) === 1) clues--; else given[r][c] = v;
    }
    if (clues !== target) continue;
    if (singlesSolvable(given) === sunday) continue; // weekday must fall to singles; Sunday must not
    const key = JSON.stringify(given);
    if (seen.has(key)) continue;
    seen.add(key);
    return { given, sol, clues, attempt };
  }
  throw new Error(`suds #${num}: no board found`);
}

const { PUZZLES } = await import(BANK);
const last = PUZZLES[PUZZLES.length - 1];
const seen = new Set(PUZZLES.map((p) => JSON.stringify(p.given)));
const out = [];
for (let i = 1; i <= DAYS; i++) {
  const num = last.num + i, live = addDays(last.live, i), sunday = isSunday(live);
  const b = makeBoard(num, sunday, seen);
  console.error(`suds #${num} ${live}${sunday ? ' Sun' : ''}: ${b.clues} clues (attempt ${b.attempt})`);
  out.push(`  {
    num: ${num},
    quizId: 'suds-${quizDate(live)}',
    live: '${live}',
    dateLabel: '${dateLabel(live)}',
    sunday: ${sunday},
    clues: ${b.clues},
    given: ${JSON.stringify(b.given)},
    sol: ${JSON.stringify(b.sol)},
  },\n`);
}
const block = out.join('');
if (WRITE) {
  const text = readFileSync(BANK, 'utf8');
  if (!text.endsWith('\n];\n')) throw new Error('bank does not end with "\\n];\\n"');
  writeFileSync(BANK, text.slice(0, -3) + block + '];\n');
  console.error(`appended ${DAYS} boards to ${BANK}`);
} else process.stdout.write(block);
