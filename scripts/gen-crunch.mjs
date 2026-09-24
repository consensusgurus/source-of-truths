// scripts/gen-crunch.mjs — Crunch bank generator (added 2026-09-23 for the Nov
// 2026 restock; scripts/gen-crunch-tile.mjs is the tile ART, not the bank).
// Deterministic: each board is seeded off its own num, so a re-run reproduces
// the same output and never replays a frozen board.
//
//   node scripts/gen-crunch.mjs --from 2026-11-01 --days 30 --startnum 95
//
// Prints board objects ready to splice before the closing `];` of
// app/crunch/puzzles.js. Everything is computed with the SHIPPING solver
// (app/crunch/solver.js), the same one scripts/verify-crunch.mjs re-runs:
//   * six numbers dealt the Countdown way (0 to 2 large from 25/50/75/100, the
//     rest small from two of each 1..10), largest first;
//   * target 101..999, exactly reachable;
//   * need = fewest numbers any exact solution uses. The week ramps: Mon/Tue 4,
//     Wed alternates 4 and 5, Thu/Fri/Sat 5, Sunday always 6; and inside the
//     week the route count falls (Mon 150..400 routes, Sat under 120), so the
//     same `need` still gets harder toward the weekend;
//   * solutions = true count of exact solutions, capped at 400 (never 401);
//     Sundays are picked for having very few (<= 30);
//   * no target and no numbers tuple already used anywhere in the bank;
//   * example = one exact solution on a `need`-sized subset, as [a, op, b, r].
import { solve, minNumbersForExact } from '../app/crunch/solver.js';
import { PUZZLES } from '../app/crunch/puzzles.js';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const FROM = arg('--from', '2026-11-01');
const DAYS = +arg('--days', 30);
const STARTNUM = +arg('--startnum', 95);
const CAP = 400;

function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const LARGE = [25, 50, 75, 100];
const SMALL = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10];
function deal(r, large) {
  const L = LARGE.slice(), S = SMALL.slice(), out = [];
  for (let i = 0; i < large; i++) out.push(L.splice(Math.floor(r() * L.length), 1)[0]);
  while (out.length < 6) out.push(S.splice(Math.floor(r() * S.length), 1)[0]);
  return out.sort((a, b) => b - a);
}
function choose(arr, k) { const out = []; (function rec(s, cur) { if (cur.length === k) { out.push(cur.slice()); return; } for (let i = s; i < arr.length; i++) { cur.push(arr[i]); rec(i + 1, cur); cur.pop(); } })(0, []); return out; }
function exampleFor(numbers, target, need) {
  for (const idx of choose(numbers.map((_, i) => i), need)) {
    const sub = idx.map((i) => numbers[i]);
    const s = solve(sub, target);
    if (s.exact) return s.steps.map(([a, op, b, v]) => [a, op, b, v]);
  }
  return null;
}

// per weekday (Sun..Sat): need, and the allowed route-count band
const SPEC = [
  { need: [6], lo: 1, hi: 30 },
  { need: [4], lo: 150, hi: 400 },
  { need: [4], lo: 90, hi: 330 },
  { need: null, lo: 60, hi: 260 },   // Wed: 4 on even weeks, 5 on odd
  { need: [5], lo: 120, hi: 400 },
  { need: [5], lo: 60, hi: 260 },
  { need: [5], lo: 10, hi: 120 },
];

const usedT = new Set(PUZZLES.map((p) => p.target));
const usedN = new Set(PUZZLES.map((p) => p.numbers.join(',')));
const addDays = (d, n) => { const t = new Date(d + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const out = [];
for (let d = 0; d < DAYS; d++) {
  const live = addDays(FROM, d), num = STARTNUM + d, dow = new Date(live + 'T12:00:00Z').getUTCDay();
  const r = rng(num * 6151 + 29);
  const spec = SPEC[dow];
  const needs = spec.need || [Math.floor(d / 7) % 2 ? 5 : 4];
  let found = null;
  for (let t = 0; t < 20000 && !found; t++) {
    const large = [0, 1, 1, 2, 2][Math.floor(r() * 5)];
    const numbers = deal(r, large);
    if (usedN.has(numbers.join(','))) continue;
    const target = 101 + Math.floor(r() * 899);
    if (usedT.has(target)) continue;
    if (!solve(numbers.slice(), target).exact) continue;
    const need = minNumbersForExact(numbers.slice(), target);
    if (!needs.includes(need)) continue;
    const probe = solve(numbers.slice(), target, { countCap: CAP + 1 });
    const sols = Math.min(probe.exactCount, CAP);
    if (sols < spec.lo || sols > spec.hi) continue;
    const ex = exampleFor(numbers, target, need);
    if (!ex) continue;
    found = { numbers, target, need, sols, ex };
  }
  if (!found) throw new Error(`no round for ${live}`);
  usedT.add(found.target); usedN.add(found.numbers.join(','));
  const [y, m, dd] = live.split('-').map(Number);
  process.stderr.write(`${live} dow${dow} [${found.numbers}] -> ${found.target} need ${found.need} routes ${found.sols}\n`);
  out.push(`  {
    num: ${num},
    quizId: 'crunch-${m}-${dd}-${String(y).slice(2)}',
    live: '${live}',
    dateLabel: '${MONTHS[m - 1]} ${dd}, ${y}',
    sunday: ${dow === 0},
    numbers: [${found.numbers.join(', ')}],
    target: ${found.target},
    need: ${found.need},
    solutions: ${found.sols},
    example: ${JSON.stringify(found.ex).replace(/,/g, ', ').replace(/\], \[/g, '], [')},
  },`);
}
process.stdout.write(out.join('\n') + '\n');
