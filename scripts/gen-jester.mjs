// Jesters bank extender (app/jesters/puzzles.js), APPEND-ONLY.
//   node scripts/gen-jester.mjs --to 2026-12-31 [--dry]
//
// Written for the 2026-11-12 restock: the one-jester boards from 2026-10-04 on
// were produced with scripts/jester1-produce.mjs (time-budgeted, seeded off the
// clock) and placed on their days by hand, so there was no deterministic way to
// extend the bank. This script is that way. It reuses jester1-produce's board
// pipeline verbatim (no-touch seating -> uneven court growth -> boundary repair
// to a UNIQUE seating -> the graded human-move solver must finish it with no
// trial and error) but:
//   - seeds every attempt off the BOARD NUMBER (seed = SEED_BASE + num * 7919 +
//     attempt), so a rerun prints the same boards, and a new segment can never
//     replay a frozen board's seed stream (the old boards were clock-seeded,
//     and the duplicate-layout check below is the backstop);
//   - caps attempts per board instead of a wall-clock budget, so the output
//     does not depend on machine speed;
//   - deals each day the size its weekday demands (header rule from
//     2026-10-04: Mon/Tue 8x8, Wed/Thu 9x9, Fri/Sat 10x10, Sunday Edition
//     11x11) and keeps a board only if its measured grade falls in that
//     weekday's BAND. The bands are the ranges the 2026-10-04..11-29 boards
//     actually span (measured with scripts/grade-jester.mjs on 2026-11-12), so
//     the second day of each size pair grades harder than the first, as the
//     header and scripts/verify-jester.mjs require. A band is a range, not a
//     target: the first seeded board inside it is taken, so scores vary;
//   - labels an 11x11's courts so the two that share a stage hue (ids 0 and
//     10) never touch (header rule), by swapping label 10 with the first court
//     that does not touch court 0;
//   - refuses to touch a frozen board: it parses the bank, appends only after
//     the last live date, and writes the file as the untouched original text
//     with new entries spliced in before the closing `];`.
import fs from 'fs';
import { gradeBoard } from './grade-jester.mjs';

const FILE = new URL('../app/jesters/puzzles.js', import.meta.url).pathname;
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const TO = opt('--to', '2026-12-31');
const DRY = args.includes('--dry');
const SEED_BASE = 0x4a35e000;           // lane-e 2026-11-12 offset
const MAX_ATTEMPTS = 40000;
const SIZE_BY_DOW = { 1: 8, 2: 8, 3: 9, 4: 9, 5: 10, 6: 10, 0: 11 };
// [min, max] grade score per weekday, from the 2026-10-04..11-29 boards.
const BAND = { 1: [8, 22], 2: [42, 58], 3: [15, 28], 4: [38, 64], 5: [13, 31], 6: [34, 69], 0: [39, 79] };

let rnd;
function rng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---- the jester1-produce.mjs pipeline, unchanged ----
function placement(n) {
  const cols = [], used = Array(n).fill(false);
  const walk = (r) => {
    if (r === n) return true;
    for (const c of shuffle([...Array(n).keys()])) {
      if (used[c] || (r && Math.abs(c - cols[r - 1]) <= 1)) continue;
      used[c] = true; cols.push(c);
      if (walk(r + 1)) return true;
      cols.pop(); used[c] = false;
    }
    return false;
  };
  return walk(0) ? cols : null;
}
function grow(n, cols) {
  const reg = Array.from({ length: n }, () => Array(n).fill(-1));
  for (let r = 0; r < n; r++) reg[r][cols[r]] = r;
  const appetite = Array.from({ length: n }, () => 0.2 + rnd() * rnd() * 3);
  let un = n * n - n, guard = 0;
  while (un > 0 && guard++ < n * n * 200) {
    let tot = 0; for (const a of appetite) tot += a;
    let x = rnd() * tot, id = 0; while (x > appetite[id]) { x -= appetite[id]; id++; }
    const fr = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (reg[r][c] === id)
      for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) { const a = r + dr, b = c + dc;
        if (a >= 0 && a < n && b >= 0 && b < n && reg[a][b] === -1) fr.push([a, b]); }
    if (!fr.length) continue;
    const [a, b] = fr[(rnd() * fr.length) | 0]; reg[a][b] = id; un--;
  }
  return un ? null : reg;
}
function solutions(n, reg, cap) {
  const out = [], cols = [], uc = Array(n).fill(false), ur = Array(n).fill(false);
  const walk = (r) => {
    if (out.length >= cap) return;
    if (r === n) { out.push(cols.slice()); return; }
    for (let c = 0; c < n; c++) {
      if (uc[c] || ur[reg[r][c]] || (r && Math.abs(c - cols[r - 1]) <= 1)) continue;
      uc[c] = ur[reg[r][c]] = true; cols.push(c); walk(r + 1); cols.pop(); uc[c] = ur[reg[r][c]] = false;
    }
  };
  walk(0); return out;
}
function contiguous(n, reg, id) {
  const cells = []; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (reg[r][c] === id) cells.push(r * n + c);
  if (!cells.length) return false;
  const set = new Set(cells), seen = new Set([cells[0]]), st = [cells[0]];
  while (st.length) { const cur = st.pop(), r = (cur / n) | 0, c = cur % n;
    for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) { const a = r + dr, b = c + dc, k = a * n + b;
      if (a >= 0 && a < n && b >= 0 && b < n && set.has(k) && !seen.has(k)) { seen.add(k); st.push(k); } } }
  return seen.size === cells.length;
}
function repair(n, reg, cols) {
  for (let step = 0; step < 80; step++) {
    const sols = solutions(n, reg, 2);
    if (sols.length === 0) return null;
    if (sols.length === 1) return reg;
    const rival = sols.find((s) => s.some((c, r) => c !== cols[r]));
    const cands = shuffle(rival.map((c, r) => [r, c]).filter(([r, c]) => cols[r] !== c));
    let done = false;
    for (const [r, c] of cands) {
      const from = reg[r][c];
      for (const [dr, dc] of shuffle([[1,0],[-1,0],[0,1],[0,-1]])) {
        const a = r + dr, b = c + dc;
        if (a < 0 || a >= n || b < 0 || b >= n) continue;
        const to = reg[a][b]; if (to === from) continue;
        reg[r][c] = to;
        if (contiguous(n, reg, from) && contiguous(n, reg, to)) { done = true; break; }
        reg[r][c] = from;
      }
      if (done) break;
    }
    if (!done) return null;
  }
  return null;
}
function relabel(n, reg) {
  const map = new Map(); for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!map.has(reg[r][c])) map.set(reg[r][c], map.size);
  return reg.map((row) => row.map((x) => map.get(x)));
}
// ---- end of the shared pipeline ----

const touches = (n, reg, x, y) => {
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (reg[r][c] === x)
    for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) { const a = r + dr, b = c + dc;
      if (a >= 0 && a < n && b >= 0 && b < n && reg[a][b] === y) return true; }
  return false;
};
// courts k and k+10 share a stage hue: make sure they never touch
function hueSafe(n, reg) {
  for (let k = 10; k < n; k++) {
    if (!touches(n, reg, k, k - 10)) continue;
    let swapped = false;
    for (let j = 1; j < 10 && !swapped; j++) {
      if (j === k - 10) continue;
      const out = reg.map((row) => row.map((x) => (x === k ? j : x === j ? k : x)));
      let ok = true;
      for (let q = 10; q < n; q++) if (touches(n, out, q, q - 10)) ok = false;
      if (ok) { reg = out; swapped = true; }
    }
    if (!swapped) return null;
  }
  return reg;
}

function makeBoard(num, dow, seenLayouts) {
  const N = SIZE_BY_DOW[dow], [lo, hi] = BAND[dow];
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    rnd = rng(SEED_BASE + num * 7919 + attempt);
    const cols = placement(N); if (!cols) continue;
    let reg = grow(N, cols); if (!reg) continue;
    reg = repair(N, reg, cols); if (!reg) continue;
    const sizes = Array(N).fill(0); for (const row of reg) for (const x of row) sizes[x]++;
    if (sizes.some((s) => s < 2)) continue;
    const g = gradeBoard(N, reg);
    if (!g.solved) continue;
    if (g.cols && g.cols.some((c, r) => c !== cols[r])) continue;
    if (g.score < lo || g.score > hi) continue;
    reg = relabel(N, reg);
    if (N >= 11) { reg = hueSafe(N, reg); if (!reg) continue; }
    const key = JSON.stringify(reg); if (seenLayouts.has(key)) continue;
    return { size: N, regions: reg, solution: cols, score: g.score, attempt };
  }
  throw new Error(`board ${num}: no ${N}x${N} board in band [${lo}, ${hi}] within ${MAX_ATTEMPTS} attempts`);
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const addDay = (iso) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };

const src = fs.readFileSync(FILE, 'utf8');
const { PUZZLES } = await import(new URL('../app/jesters/puzzles.js', import.meta.url).href);
const last = PUZZLES[PUZZLES.length - 1];
if (last.live >= TO) { console.log(`bank already runs to ${last.live}; nothing to do`); process.exit(0); }
const seenLayouts = new Set(PUZZLES.map((p) => JSON.stringify(p.regions)));
const fmt = (p) => [
  '  {',
  `    num: ${p.num}, quizId: "${p.quizId}", live: "${p.live}", dateLabel: "${p.dateLabel}", sunday: ${p.sunday},`,
  `    size: ${p.size},`,
  '    regions: [',
  ...p.regions.map((row) => `      [${row.join(',')}],`),
  '    ],',
  `    solution: [${p.solution.join(',')}],`,
  '  },',
].join('\n');

const out = [];
let live = last.live, num = last.num;
while (live < TO) {
  live = addDay(live); num++;
  const [y, m, d] = live.split('-').map(Number);
  const dow = new Date(live + 'T12:00:00Z').getUTCDay();
  const b = makeBoard(num, dow, seenLayouts);
  seenLayouts.add(JSON.stringify(b.regions));
  const p = { num, quizId: `jester-${m}-${d}-${String(y).slice(2)}`, live, dateLabel: `${MONTHS[m - 1]} ${d}, ${y}`,
    sunday: dow === 0, size: b.size, regions: b.regions, solution: b.solution };
  out.push(p);
  console.log(`#${num} ${live} ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dow]} ${b.size}x${b.size} score ${b.score} (attempt ${b.attempt})`);
}
const close = src.lastIndexOf('];');
if (close < 0 || src.slice(close).trim() !== '];') throw new Error('bank file does not end with ];');
const next = src.slice(0, close) + out.map(fmt).join('\n') + '\n' + src.slice(close);
if (!next.startsWith(src.slice(0, close))) throw new Error('frozen prefix changed');
if (DRY) console.log(`dry run: ${out.length} boards, not written`);
else { fs.writeFileSync(FILE, next); console.log(`appended ${out.length} boards, ${PUZZLES[0].live}..${live}`); }
