// scripts/gen-topple.mjs — builds Topple's bank (app/topple/puzzles.js).
//
// Every board is GROWN, not drawn: a few overlapping rooms of floor joined by
// corridors, then a hill climb that adds and removes tiles, cracks tiles into
// fragile ones (and mends them), and moves the start and the spring, keeping a
// change whenever the exact solver (the shared engine in lib/topple-engine.js)
// says the shortest solution got no shorter, with two pressures alongside it:
// more reachable positions (more wrong turns to take), and a BLOCKY floor (a
// ragged one reads as noise, not as a level).
//
// On a day with fragile tiles they must CHANGE THE ANSWER: treated as plain
// floor, the board solves in fewer rolls. Otherwise the orange is decoration.
//
// THE SPRING is one tile (land the block standing on it) or two side by side
// (land it lying flat across both). Monday is always one tile; any other day
// is a coin toss off the date's seed, about half and half.
//
// Floor nothing can ever touch is trimmed at the end and the board cropped, so
// every tile on it is somewhere the block can really go.
//
// THE WEEK (perfect = the exact fewest rolls). No switches, no bridges (owner,
// 2026-10-19).
//   Mon  plain floor          12-16
//   Tue  fragile              14-18
//   Wed  fragile              16-20
//   Thu  fragile              18-23
//   Fri  fragile              20-25
//   Sat  fragile              22-28
//   Sun  Sunday Edition: a bigger board, fragile, 30-38
//
// Deterministic: the seed is the date, so a rerun writes the same bank.
//   node scripts/gen-topple.mjs --from 2026-10-20 --until 2027-01-31 --write
//   node scripts/gen-topple.mjs --until <date> --append --write   (extend)
//   node scripts/gen-topple.mjs --only <date>                     (print one)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse, solve, touched } from '../lib/topple-engine.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'app/topple/puzzles.js');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const FROM = arg('--from', '2026-10-20');
const UNTIL = arg('--until', '2027-01-31');
const WRITE = process.argv.includes('--write');
const APPEND = process.argv.includes('--append');
const ONLY = arg('--only', null);

export const PLAN = {
  1: { fragile: 0, band: [12, 16], w: 12, h: 8, rooms: 4 },
  2: { fragile: 1, band: [14, 18], w: 12, h: 8, rooms: 4 },
  3: { fragile: 1, band: [16, 20], w: 13, h: 9, rooms: 4 },
  4: { fragile: 1, band: [18, 23], w: 13, h: 9, rooms: 5 },
  5: { fragile: 1, band: [20, 25], w: 14, h: 9, rooms: 5 },
  6: { fragile: 1, band: [22, 28], w: 14, h: 10, rooms: 5 },
  0: { fragile: 1, band: [30, 38], w: 17, h: 11, rooms: 7, sunday: true },
};

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hashStr(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

// ---------- the mutable board: { w, h, g: char[h][w] ('.', '#', 'F', 'G'), sx, sy } ----------
const toRows = (B) => B.g.map((r, y) => r.map((c, x) => (x === B.sx && y === B.sy ? 'S' : c)).join(''));
const clone = (B) => ({ ...B, g: B.g.map((r) => r.slice()) });
const isFloor = (c) => c === '#' || c === 'F';
const fixed = (B, x, y) => (x === B.sx && y === B.sy) || B.g[y][x] === 'G';
function nbrs(B, x, y) { return [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < B.w && b < B.h); }

function evaluate(B, plan) {
  const P = parse({ rows: toRows(B) });
  const r = solve(P);
  if (!r.path) return null;
  const perfect = r.path.length;
  if (plan.fragile) {
    if (!B.g.some((row) => row.includes('F'))) return null;
    const f = solve(P, { fragileFloor: true });
    if (!f.path || f.path.length >= perfect) return null;
  }
  return { perfect, states: r.states };
}

function score(ev, plan, B) {
  if (!ev) return -1e9;
  const hi = plan.band[1];
  let s = ev.perfect <= hi ? ev.perfect : hi - (ev.perfect - hi) * 2;
  s += Math.min(ev.states, 600) * 0.004;
  let tiles = 0, edge = 0, lone = 0;
  for (let y = 0; y < B.h; y++) for (let x = 0; x < B.w; x++) {
    if (B.g[y][x] === '.') continue;
    tiles++;
    let nb = 0;
    for (const [a, b] of nbrs(B, x, y)) if (B.g[b][a] !== '.') nb++;
    edge += 4 - nb;
    if (nb <= 1) lone++;
  }
  s -= edge * 0.035 + lone * 0.25;
  const cap = plan.w * plan.h * 0.5;
  if (tiles > cap) s -= (tiles - cap) * 0.3;
  return s;
}

function seedBoard(plan, R) {
  const { w, h } = plan;
  const g = Array.from({ length: h }, () => Array(w).fill('.'));
  const rooms = [];
  let cx = Math.floor(R() * 2), cy = Math.floor(R() * (h - 3));
  for (let i = 0; i < plan.rooms; i++) {
    const rw = 2 + Math.floor(R() * 3), rh = 2 + Math.floor(R() * 3);
    const x0 = Math.max(0, Math.min(w - rw, cx)), y0 = Math.max(0, Math.min(h - rh, cy));
    for (let y = y0; y < y0 + rh; y++) for (let x = x0; x < x0 + rw; x++) g[y][x] = '#';
    rooms.push([x0, y0, rw, rh]);
    cx = x0 + rw + Math.floor(R() * 3) - 1;
    cy = Math.max(0, Math.min(h - 3, y0 + Math.floor(R() * 5) - 2));
    if (cx > w - 3) { cx = Math.floor(R() * (w - 4)); cy = (cy + 3 + Math.floor(R() * 3)) % (h - 2); }
  }
  for (let i = 1; i < rooms.length; i++) {
    const [ax, ay] = rooms[i - 1], [bx, by] = rooms[i];
    let x = ax, y = ay;
    while (x !== bx) { g[y][x] = '#'; if (y + 1 < h) g[y + 1][x] = '#'; x += Math.sign(bx - x); }
    while (y !== by) { g[y][x] = '#'; if (x + 1 < w) g[y][x + 1] = '#'; y += Math.sign(by - y); }
  }
  const a = rooms[0], z = rooms[rooms.length - 1];
  const B = { w, h, g, sx: a[0], sy: a[1] };
  let gx = z[0] + z[2] - 1, gy = z[1] + z[3] - 1;
  if (gx === B.sx && gy === B.sy) gx = z[0];
  g[gy][gx] = 'G';
  if (plan.long) {
    // the second spring tile beside the first, inside the last room
    const nx = gx - 1 >= z[0] ? gx - 1 : gx + 1;
    if (nx >= 0 && nx < w && !(nx === B.sx && gy === B.sy)) g[gy][nx] = 'G';
    else g[gy - 1 >= 0 ? gy - 1 : gy + 1][gx] = 'G';
  }
  if (plan.fragile) {
    for (let i = 0; i < 4; i++) {
      const x = Math.floor(R() * w), y = Math.floor(R() * h);
      if (g[y][x] === '#' && !fixed(B, x, y)) g[y][x] = 'F';
    }
  }
  return B;
}

function mutate(B, plan, R) {
  const N = clone(B);
  const t = R();
  const all = [];
  for (let y = 0; y < N.h; y++) for (let x = 0; x < N.w; x++) all.push([x, y]);
  const pick = (arr) => arr[Math.floor(R() * arr.length)];
  if (t < 0.36) {           // add floor beside floor
    const cand = all.filter(([x, y]) => N.g[y][x] === '.' && nbrs(N, x, y).some(([a, b]) => N.g[b][a] !== '.'));
    if (!cand.length) return null;
    const [x, y] = pick(cand); N.g[y][x] = plan.fragile && R() < 0.2 ? 'F' : '#';
  } else if (t < 0.7) {     // remove floor
    const cand = all.filter(([x, y]) => isFloor(N.g[y][x]) && !fixed(N, x, y));
    if (!cand.length) return null;
    const [x, y] = pick(cand); N.g[y][x] = '.';
  } else if (t < 0.88 && plan.fragile) { // crack or mend a tile
    const cand = all.filter(([x, y]) => isFloor(N.g[y][x]) && !fixed(N, x, y));
    if (!cand.length) return null;
    const [x, y] = pick(cand); N.g[y][x] = N.g[y][x] === 'F' ? '#' : 'F';
  } else {                  // move the start or the spring
    const cand = all.filter(([x, y]) => N.g[y][x] === '#' && !fixed(N, x, y));
    if (!cand.length) return null;
    const [x, y] = pick(cand);
    if (R() < 0.5) { N.sx = x; N.sy = y; }
    else {
      let x2 = null, y2 = null;
      if (plan.long) {
        const opts = nbrs(N, x, y).filter(([a, b]) => N.g[b][a] === '#' && !fixed(N, a, b));
        if (!opts.length) return null;
        [x2, y2] = pick(opts);
      }
      for (let yy = 0; yy < N.h; yy++) for (let xx = 0; xx < N.w; xx++) if (N.g[yy][xx] === 'G') N.g[yy][xx] = '#';
      N.g[y][x] = 'G';
      if (plan.long) N.g[y2][x2] = 'G';
    }
  }
  return N;
}

function trimAndCrop(B) {
  const P = parse({ rows: toRows(B) });
  const hit = touched(P);
  const N = clone(B);
  for (let y = 0; y < N.h; y++) for (let x = 0; x < N.w; x++) if (isFloor(N.g[y][x]) && !fixed(N, x, y) && !hit.has(y * N.w + x)) N.g[y][x] = '.';
  const rows = toRows(N);
  let x0 = N.w, x1 = -1, y0 = N.h, y1 = -1;
  for (let y = 0; y < N.h; y++) for (let x = 0; x < N.w; x++) if (rows[y][x] !== '.') { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return rows.slice(y0, y1 + 1).map((r) => r.slice(x0, x1 + 1));
}

export function build(date) {
  const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
  const R = rng(hashStr(`topple:${date}`));
  const plan = { ...PLAN[dow], long: dow !== 1 && R() < 0.5 };
  for (let attempt = 0; attempt < 60; attempt++) {
    let B = seedBoard(plan, R);
    let ev = evaluate(B, plan);
    for (let k = 0; k < 800 && !ev; k++) { const N = mutate(B, plan, R); if (!N) continue; B = N; ev = evaluate(N, plan); }
    if (!ev) continue;
    let sc = score(ev, plan, B);
    const iters = plan.sunday ? 12000 : 5000;
    for (let i = 0; i < iters; i++) {
      const N = mutate(B, plan, R);
      if (!N) continue;
      const e = evaluate(N, plan);
      const s = score(e, plan, N);
      if (s >= sc) { B = N; ev = e; sc = s; }
    }
    if (ev.perfect < plan.band[0] || ev.perfect > plan.band[1]) { if (process.env.TOPPLE_DEBUG) console.log('  miss', ev.perfect); continue; }
    const rows = trimAndCrop(B);
    const P = parse({ rows });
    const fin = solve(P);
    if (!fin.path || fin.path.length !== ev.perfect) continue;
    if (plan.fragile) { const f = solve(P, { fragileFloor: true }); if (!f.path || f.path.length >= ev.perfect) continue; }
    return { rows, perfect: ev.perfect, states: fin.states, plan, dow };
  }
  throw new Error(`no board for ${date}`);
}

// ---------- the bank ----------
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function days(from, until) { const out = []; let d = new Date(`${from}T12:00:00Z`); const e = new Date(`${until}T12:00:00Z`); while (d <= e) { out.push(d.toISOString().slice(0, 10)); d = new Date(d.getTime() + 86400000); } return out; }
function label(date) { const [y, m, d] = date.split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; }
function qid(date) { const [y, m, d] = date.split('-').map(Number); return `topple-${m}-${d}-${String(y).slice(2)}`; }

const HEADER = `// Puzzle data for Topple, the daily block-rolling puzzle. Imported ONLY by the
// server page (app/topple/page.js), which filters live<=today before handing the
// bank to the client, so tomorrow's board never reaches a browser.
//
// GENERATED by scripts/gen-topple.mjs (see its header for the week's ramp) and
// proved by scripts/verify-topple.mjs. Do not hand-edit a board: rerun the
// generator. To extend:
//   node scripts/gen-topple.mjs --until <lastDay> --append --write
//
//   rows     '.' empty, '#' floor, 'F' fragile (cracks if the block stands on
//            it), 'S' the start (floor, block standing), 'G' the spring:
//            one tile (land standing) or two side by side (land lying flat)
//   perfect  the EXACT fewest rolls, by breadth-first search. Par is derived
//            from it in lib/par.js, the same model as Parker.
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
    made.push({ num, quizId: qid(date), live: date, dateLabel: label(date), sunday: !!r.plan.sunday, perfect: r.perfect, rows: r.rows });
    console.log(`${date} ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][r.dow]} perfect ${r.perfect} (${r.plan.band.join('-')}) ${r.plan.long ? 'long ' : 'short'} ${r.rows[0].length}x${r.rows.length} states ${r.states} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    if (ONLY) console.log(r.rows.join('\n'));
  }
  if (WRITE && !ONLY) {
    const all = [...existing, ...made];
    const body = all.map((p) => `  ${JSON.stringify(p)},`).join('\n');
    fs.writeFileSync(OUT, `${HEADER}export const PUZZLES = [\n${body}\n];\n`);
    console.log(`wrote ${all.length} boards to app/topple/puzzles.js`);
  }
}
