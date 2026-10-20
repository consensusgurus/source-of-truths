// scripts/gen-roll.mjs — builds Roll's bank (app/roll/puzzles.js).
//
// A board is a random walk of floor, a start, the numbered squares 1..N and
// (on crack days) a few cracked squares, kept only when the exact solver (the
// shared engine in lib/roll-engine.js) says:
//   - the fewest rolls land inside the day's band;
//   - THE BLOCKED RULE COSTS ROLLS: with numbered squares free to cross, the
//     board solves at least 2 rolls shorter (3 from four numbers up), so the
//     rule is never decoration;
//   - on a crack day THE CRACKS COST ROLLS: read as plain floor, it solves
//     shorter;
//   - the die never starts showing 1, so square 1 always takes some turning.
// Floor the die can never stand on is trimmed and the board cropped.
//
// THE WEEK (perfect = the exact fewest rolls):
//   Mon  three numbers                 9-12
//   Tue  three numbers                13-17
//   Wed  four numbers                 17-21
//   Thu  four numbers, cracks         19-24
//   Fri  five numbers                 23-28
//   Sat  five numbers, cracks         26-32
//   Sun  Sunday Edition: six numbers, cracks, a bigger floor, 36-44
//
// Deterministic: the seed is the date, so a rerun writes the same bank.
//   node scripts/gen-roll.mjs --from 2026-10-20 --until 2027-01-31 --write
//   node scripts/gen-roll.mjs --until <date> --append --write   (extend)
//   node scripts/gen-roll.mjs --only <date>                     (print one)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse, solve, touched, ORIENTS } from '../lib/roll-engine.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'app/roll/puzzles.js');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const FROM = arg('--from', '2026-10-20');
const UNTIL = arg('--until', '2027-01-31');
const WRITE = process.argv.includes('--write');
const APPEND = process.argv.includes('--append');
const ONLY = arg('--only', null);

export const PLAN = {
  1: { N: 3, cracks: 0, band: [9, 12], w: 6, h: 5, fill: 0.7 },
  2: { N: 3, cracks: 0, band: [13, 17], w: 7, h: 5, fill: 0.62 },
  3: { N: 4, cracks: 0, band: [17, 21], w: 7, h: 6, fill: 0.6 },
  4: { N: 4, cracks: 3, band: [19, 24], w: 7, h: 6, fill: 0.6 },
  5: { N: 5, cracks: 0, band: [23, 28], w: 8, h: 6, fill: 0.58 },
  6: { N: 5, cracks: 4, band: [26, 32], w: 8, h: 7, fill: 0.56 },
  0: { N: 6, cracks: 4, band: [36, 44], w: 9, h: 8, fill: 0.55, sunday: true },
};

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hashStr(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function make(plan, R) {
  const { w, h } = plan;
  const ri = (n) => Math.floor(R() * n);
  const g = Array.from({ length: h }, () => Array(w).fill('.'));
  const cells = [[ri(w), ri(h)]];
  g[cells[0][1]][cells[0][0]] = '#';
  const target = Math.floor(w * h * plan.fill);
  for (let guard = 0; cells.length < target && guard < 5000; guard++) {
    const [x, y] = cells[ri(cells.length)];
    const [dx, dy] = STEPS[ri(4)];
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= w || ny >= h || g[ny][nx] !== '.') continue;
    g[ny][nx] = '#'; cells.push([nx, ny]);
  }
  const pick = () => { for (;;) { const [x, y] = cells[ri(cells.length)]; if (g[y][x] === '#') return [x, y]; } };
  const [sx, sy] = pick(); g[sy][sx] = 'S';
  for (let i = 1; i <= plan.N; i++) { const [x, y] = pick(); g[y][x] = String(i); }
  for (let i = 0; i < plan.cracks; i++) { const [x, y] = pick(); g[y][x] = 'C'; }
  return g.map((r) => r.join(''));
}

function trimAndCrop(rows, die) {
  const P = parse({ rows, die });
  const hit = touched(P);
  const g = rows.map((r) => r.split(''));
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    if ((g[y][x] === '#' || g[y][x] === 'C') && !hit.has(y * P.w + x)) g[y][x] = '.';
  }
  const out = g.map((r) => r.join(''));
  let x0 = P.w, x1 = -1, y0 = P.h, y1 = -1;
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) if (out[y][x] !== '.') { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return out.slice(y0, y1 + 1).map((r) => r.slice(x0, x1 + 1));
}

function check(rows, die, plan) {
  const P = parse({ rows, die });
  const r = solve(P);
  if (!r.path) return null;
  const perfect = r.path.length;
  if (perfect < plan.band[0] || perfect > plan.band[1]) return null;
  const free = solve(P, { free: true });
  if (!free.path || perfect - free.path.length < (plan.N > 3 ? 3 : 2)) return null;
  if (plan.cracks) {
    if (!rows.some((row) => row.includes('C'))) return null;
    const solid = solve(P, { solidCracks: true });
    if (!solid.path || solid.path.length >= perfect) return null;
  }
  return { perfect, free: free.path.length, states: r.states };
}

function quality(rows, ok, plan) {
  let tiles = 0, edge = 0;
  for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[0].length; x++) {
    if (rows[y][x] === '.') continue;
    tiles++;
    for (const [dx, dy] of STEPS) { const c = rows[y + dy] && rows[y + dy][x + dx]; if (!c || c === '.') edge++; }
  }
  const [lo, hi] = plan.band;
  return (ok.perfect - lo) / (hi - lo) * 2 + Math.log(ok.states) * 0.5 - (edge / tiles) * 2;
}

export function build(date) {
  const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
  const R = rng(hashStr(`roll:${date}`));
  const plan = PLAN[dow];
  // Collect a handful of legal boards and keep the best: more positions to
  // wander into, a blockier floor, and a perfect line high in the band.
  let best = null, found = 0;
  for (let tries = 0; tries < 60000 && found < 24; tries++) {
    const die = ORIENTS[Math.floor(R() * ORIENTS.length)];
    if (die[0] === '1') continue;
    const raw = make(plan, R);
    if (!check(raw, die, plan)) continue;
    const rows = trimAndCrop(raw, die);
    const ok = check(rows, die, plan);
    if (!ok) continue;
    found++;
    const s = quality(rows, ok, plan);
    if (!best || s > best.s) best = { s, rows, die, ...ok, plan, dow };
  }
  if (!best) throw new Error(`no board for ${date}`);
  return best;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function days(from, until) { const out = []; let d = new Date(`${from}T12:00:00Z`); const e = new Date(`${until}T12:00:00Z`); while (d <= e) { out.push(d.toISOString().slice(0, 10)); d = new Date(d.getTime() + 86400000); } return out; }
function label(date) { const [y, m, d] = date.split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; }
function qid(date) { const [y, m, d] = date.split('-').map(Number); return `roll-${m}-${d}-${String(y).slice(2)}`; }

const HEADER = `// Puzzle data for Roll, the daily die-rolling puzzle. Imported ONLY by the
// server page (app/roll/page.js), which filters live<=today before handing the
// bank to the client, so tomorrow's board never reaches a browser.
//
// GENERATED by scripts/gen-roll.mjs (see its header for the week's ramp) and
// proved by scripts/verify-roll.mjs. Do not hand-edit a board: rerun the
// generator. To extend:
//   node scripts/gen-roll.mjs --until <lastDay> --append --write
//
//   rows     '.' empty, '#' floor, 'C' cracked (crumbles once the die leaves
//            it), 'S' the start, '1'..'6' the numbered squares, lit in order
//   die      the die at the start: top, north, east faces (opposites sum to 7)
//   perfect  the EXACT fewest rolls, by breadth-first search. Par is derived
//            from it in lib/par.js, the same model as Topple and Parker.
`;

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  let existing = [];
  if (APPEND && fs.existsSync(OUT)) existing = (await import(`${OUT}?t=${Date.now()}`)).PUZZLES;
  const start = APPEND && existing.length ? days(existing[existing.length - 1].live, UNTIL).slice(1) : days(FROM, UNTIL);
  const list = ONLY ? [ONLY] : start;
  const made = [];
  let num = existing.length ? existing[existing.length - 1].num : 0;
  for (const date of list) {
    const t0 = Date.now();
    const r = build(date);
    num++;
    made.push({ num, quizId: qid(date), live: date, dateLabel: label(date), sunday: !!r.plan.sunday, perfect: r.perfect, die: r.die, rows: r.rows });
    console.log(`${date} ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][r.dow]} perfect ${r.perfect} free ${r.free} (${r.plan.band.join('-')}) ${r.rows[0].length}x${r.rows.length} states ${r.states} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    if (ONLY) console.log(r.rows.join('\n'));
  }
  if (WRITE && !ONLY) {
    const all = [...existing, ...made];
    const body = all.map((p) => `  ${JSON.stringify(p)},`).join('\n');
    fs.writeFileSync(OUT, `${HEADER}export const PUZZLES = [\n${body}\n];\n`);
    console.log(`wrote ${all.length} boards to app/roll/puzzles.js`);
  }
}
