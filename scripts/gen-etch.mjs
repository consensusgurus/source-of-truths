// Re-slot the Etch bank and generate the boards the schedule needs, out to
// ETCH_UNTIL.
//
// Schedule (from 2026-08-18): Mon-Fri 10x10, Saturday 15x15, Sunday a 20x20
// Edition. The 15x15 boards that used to run on Sunday move to Saturday; the
// 10x10 boards they displace keep their picture and take the next free weekday
// at the end of the bank, so nothing authored is thrown away.
//
// Boards live on or before ETCH_FREEZE are FROZEN: this script slices the
// source file at the first board after it and leaves every byte before that
// untouched. The default freeze date is the last board of the bank as it stood
// when this extension was authored, so a plain re-run reproduces the same file
// byte for byte instead of re-slotting history.
//
// Where the boards come from, in this order:
//   1. boards already in the bank that are after the freeze date (their picture
//      is kept and re-dated -- nothing authored is thrown away);
//   2. new art from scripts/etch-art.mjs, in file order, SKIPPING any subject
//      the bank has already shipped. That skip is what makes the run
//      idempotent: art baked into the bank on an earlier run is never dealt a
//      second date, which verify-etch would reject as a duplicate subject.
// Pool order is the only ordering input and there is no RNG, so the output is
// deterministic; because used art is skipped, the new segment cannot replay the
// frozen one.
//
// Every generated board is checked twice, by two different algorithms:
//   lineSolve      constraint propagation over per-line arrangements, proving
//                  the board is reachable with no guessing.
//   countSolutions plain DFS over row arrangements, capped at 2, proving
//                  uniqueness without looking at a single-cell deduction.
// A board that fails either check is reported and NOT emitted.
//
// Run: node scripts/gen-etch.mjs            (report only)
//      node scripts/gen-etch.mjs --write    (rewrite app/etch/puzzles.js)
//      ETCH_FREEZE=... ETCH_UNTIL=... node scripts/gen-etch.mjs --write
import fs from 'fs';
import { PUZZLES } from '../app/etch/puzzles.js';
import { raster, BIG, MID, SMALL } from './etch-art.mjs';

// Last board that is frozen history. Defaults to the last board of the bank at
// the time of the 2026-11-30 extension.
const FREEZE = process.env.ETCH_FREEZE || process.env.ETCH_TODAY || '2026-10-07';
const UNTIL = process.env.ETCH_UNTIL || '2026-11-30';
const SCHEDULE_FROM = '2026-08-18';
const SRC = 'app/etch/puzzles.js';
const nextDay = (iso) => new Date(new Date(`${iso}T12:00:00Z`).getTime() + 86400000).toISOString().slice(0, 10);
// Re-slotting resumes the day after the freeze, or at the day the modern
// schedule began if the freeze predates it.
const START = FREEZE < SCHEDULE_FROM ? SCHEDULE_FROM : nextDay(FREEZE);

const runsOf = (line) => {
  const out = []; let c = 0;
  for (const ch of line) { if (ch === '#') c++; else { if (c) out.push(c); c = 0; } }
  if (c) out.push(c);
  return out.length ? out : [0];
};
const norm = (clue) => (clue.length === 1 && clue[0] === 0 ? [] : clue);

function arrangements(n, runs) {
  const out = [];
  if (!runs.length) { out.push(new Array(n).fill(false)); return out; }
  const rec = (idx, pos, cur) => {
    if (idx === runs.length) { const row = cur.slice(); while (row.length < n) row.push(false); out.push(row); return; }
    let need = 0;
    for (let k = idx + 1; k < runs.length; k++) need += runs[k] + 1;
    const maxStart = n - need - runs[idx];
    for (let start = pos; start <= maxStart; start++) {
      const row = cur.slice();
      for (let i = pos; i < start; i++) row.push(false);
      for (let i = 0; i < runs[idx]; i++) row.push(true);
      let np = start + runs[idx];
      if (idx < runs.length - 1) { row.push(false); np++; }
      rec(idx + 1, np, row);
    }
  };
  rec(0, 0, []);
  return out;
}

function lineSolve(w, h, rows, cols) {
  const rowArr = rows.map((r) => arrangements(w, norm(r)));
  const colArr = cols.map((c) => arrangements(h, norm(c)));
  const grid = Array.from({ length: h }, () => new Array(w).fill(-1));
  let changed = true, guard = 0;
  while (changed) {
    changed = false;
    if (++guard > 500) break;
    for (let r = 0; r < h; r++) {
      const ok = rowArr[r].filter((a) => a.every((v, c) => grid[r][c] === -1 || (grid[r][c] === 1) === v));
      if (!ok.length) return { ok: false, determined: 0 };
      rowArr[r] = ok;
      for (let c = 0; c < w; c++) {
        if (grid[r][c] !== -1) continue;
        if (ok.every((a) => a[c])) { grid[r][c] = 1; changed = true; }
        else if (ok.every((a) => !a[c])) { grid[r][c] = 0; changed = true; }
      }
    }
    for (let c = 0; c < w; c++) {
      const ok = colArr[c].filter((a) => a.every((v, r) => grid[r][c] === -1 || (grid[r][c] === 1) === v));
      if (!ok.length) return { ok: false, determined: 0 };
      colArr[c] = ok;
      for (let r = 0; r < h; r++) {
        if (grid[r][c] !== -1) continue;
        if (ok.every((a) => a[r])) { grid[r][c] = 1; changed = true; }
        else if (ok.every((a) => !a[r])) { grid[r][c] = 0; changed = true; }
      }
    }
  }
  let det = 0;
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) if (grid[r][c] !== -1) det++;
  return { ok: true, determined: det, grid };
}

function countSolutions(w, h, rows, cols, cap = 2) {
  const rowArr = rows.map((r) => arrangements(w, norm(r)));
  const colArr = cols.map((c) => arrangements(h, norm(c)));
  let found = 0;
  const live = [colArr.map((a) => a.map((_, i) => i))];
  const rec = (r) => {
    if (found >= cap) return;
    if (r === h) { found++; return; }
    for (const arr of rowArr[r]) {
      const next = []; let bad = false;
      for (let c = 0; c < w && !bad; c++) {
        const keep = live[r][c].filter((i) => colArr[c][i][r] === arr[c]);
        if (!keep.length) bad = true; else next.push(keep);
      }
      if (bad) continue;
      live[r + 1] = next;
      rec(r + 1);
      if (found >= cap) return;
    }
  };
  rec(0);
  return found;
}

function build(name, n, spec) {
  const sol = spec.grid ? spec.grid : raster(n, spec.add, spec.cut);
  if (sol.length !== n || sol.some((r) => r.length !== n || !/^[.#]+$/.test(r))) {
    console.error(`${name}: art is not ${n}x${n} of '.'/'#'`);
    process.exit(1);
  }
  const rows = sol.map(runsOf);
  const cols = [];
  for (let c = 0; c < n; c++) cols.push(runsOf(sol.map((r) => r[c]).join('')));
  const ls = lineSolve(n, n, rows, cols);
  const pure = ls.ok && ls.determined === n * n;
  const count = pure ? countSolutions(n, n, rows, cols) : null;
  const filled = sol.join('').split('#').length - 1;
  return { name, n, sol, rows, cols, pure, count, filled };
}

const made = [
  ...BIG.map((s) => build(s.name, 20, s)),
  ...MID.map((s) => build(s.name, 15, s)),
  ...SMALL.map((s) => build(s.name, 10, s)),
];
let bad = 0;
for (const b of made) {
  const good = b.pure && b.count === 1;
  if (!good) bad++;
  console.log(`${good ? '✓' : '✗'} ${b.name.padEnd(20)} ${b.n}x${b.n}  ${String(b.filled).padStart(3)} filled  line-logic:${b.pure ? 'complete' : 'INCOMPLETE'}  solutions:${b.count === null ? 'n/a' : b.count}`);
}
if (bad) { console.error(`\n${bad} generated board(s) failed. Nothing written.`); process.exit(1); }

// ─── re-slot ────────────────────────────────────────────────────────────────
const frozen = PUZZLES.filter((p) => p.live <= FREEZE);
const future = PUZZLES.filter((p) => p.live > FREEZE);
const dow = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();

// Art whose subject the bank has already shipped is out of the pool: the
// picture is spent, and verify-etch caps subject repeats at zero. This covers
// re-slotted future boards too -- they carry their own picture forward, so the
// art entry they came from must not be dealt a second date.
const spent = new Set(PUZZLES.map((p) => p.subject));
const fresh = made.filter((b) => !spent.has(b.name));
const reused = made.length - fresh.length;

const pool10 = future.filter((p) => p.w === 10).concat(fresh.filter((b) => b.n === 10));
const pool15 = future.filter((p) => p.w === 15).concat(fresh.filter((b) => b.n === 15));
const pool20 = future.filter((p) => p.w === 20).concat(fresh.filter((b) => b.n === 20));

console.log(`\nfrozen ${frozen.length} (through ${FREEZE}) · ${reused} art subject(s) already spent`);
console.log(`pools: 10x10 ${pool10.length}, 15x15 ${pool15.length}, 20x20 ${pool20.length} · slotting ${START} → ${UNTIL}`);

const out = [];
let cur = new Date(`${START}T12:00:00Z`), num = frozen.length + 1;
const take = (a) => a.shift();
while (cur.toISOString().slice(0, 10) <= UNTIL) {
  const iso = cur.toISOString().slice(0, 10);
  const d = dow(iso);
  const need = d === 0 ? '20x20 Sunday Edition' : d === 6 ? '15x15 Saturday' : '10x10 weekday';
  const src = d === 0 ? take(pool20) : d === 6 ? take(pool15) : take(pool10);
  if (!src) { console.error(`ran out of ${need} pictures at ${iso} — add art to scripts/etch-art.mjs, do not relax a check`); process.exit(1); }
  const n = src.n || src.w;
  const [y, m, dd] = iso.split('-').map(Number);
  out.push({
    num,
    quizId: `etch-${m}-${dd}-${String(y).slice(2)}`,
    live: iso,
    dateLabel: new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }),
    sunday: d === 0,
    w: n, h: n,
    subject: src.subject || src.name,
    rows: src.rows, cols: src.cols, sol: src.sol,
  });
  num++;
  cur = new Date(cur.getTime() + 86400000);
}
if (!out.length) { console.log(`nothing to do: bank already runs through ${UNTIL}`); process.exit(0); }
console.log(`re-slotted ${out.length} future boards, ${out[0].live} to ${out[out.length - 1].live}, bank now ${frozen.length + out.length} boards`);
console.log(`runway left over: 10x10 ${pool10.length}, 15x15 ${pool15.length}, 20x20 ${pool20.length}`);

const fmtClue = (a) => `[${a.map((r) => `[${r.join(',')}]`).join(',')}]`;
const fmtSol = (sol) => sol.length > 12
  ? `[\n${sol.map((r) => `      '${r}',`).join('\n')}\n    ]`
  : `[${sol.map((r) => `'${r}'`).join(',')}]`;
const body = out.map((p) => `  {
    num: ${p.num},
    quizId: '${p.quizId}',
    live: '${p.live}',
    dateLabel: '${p.dateLabel}',
    sunday: ${p.sunday},
    w: ${p.w}, h: ${p.h},
    subject: '${p.subject}',
    rows: ${fmtClue(p.rows)},
    cols: ${fmtClue(p.cols)},
    sol: ${fmtSol(p.sol)},
  },`).join('\n');

if (process.argv.includes('--write')) {
  const src = fs.readFileSync(SRC, 'utf8');
  // Cut point: the first board after the freeze if there is one, otherwise the
  // array terminator. Everything before it is copied through byte for byte.
  const marker = `\n  {\n    num: ${frozen.length + 1},\n`;
  let at = src.indexOf(marker);
  if (at < 0) at = src.lastIndexOf('\n];');
  if (at < 0) { console.error(`could not find the splice point in ${SRC}`); process.exit(1); }
  const head = src.slice(0, at);
  fs.writeFileSync(SRC, `${head}\n${body}\n];\n`);
  console.log(`wrote ${SRC} (kept ${head.length} bytes of frozen boards verbatim)`);
} else {
  console.log('\n(dry run — pass --write to rewrite app/etch/puzzles.js)');
}
