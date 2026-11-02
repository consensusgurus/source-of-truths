// scripts/gen-connect.mjs: deals Connect's bank into app/connect/puzzles.js.
//
//   node scripts/gen-connect.mjs                     # 2026-11-01 .. --until
//   node scripts/gen-connect.mjs --until 2027-01-31  # EXTEND: rows already in the
//                                                 # bank are kept byte for byte
//
// Connect is the daily dot-joining puzzle (numberlink): pairs of matching dots on a
// square board, join each pair with one path, paths never cross, every square
// used. NOTHING IS AUTHORED: the generator lays a random set of winding paths
// that covers the board, keeps only their ends, and asks scripts/connect-solver.mjs
// whether those ends have exactly one way to be joined. A board is kept only when
// they do.
//
// THE FIRST RAMP, board No. 1 only (owner, 2026-11-01: "bigger / harder even on easy days"):
//   Mon, Tue   9x9      Wed, Thu   10x10     Fri, Sat   11x11
//   Sun        12x12, the Sunday Edition
// with few colours for the size (long winding paths are what make it hard):
// about one pair per eleven squares, and of eight unique candidates the one
// the solver found hardest. Retired after one day as far too easy: the ramp in
// force from 2026-11-02 is SPEC, below (blocked squares, fewer, longer lines).
//
// Rules (re-checked by scripts/verify-connect.mjs):
//   0. blocked squares (walls) are never part of a path and never hold a dot
//   1. every path is at least 3 squares and its two dots are never side by side
//   2. no path touches itself (two of its squares side by side that it does not
//      walk between), the convention the solver counts under
//   3. the board has exactly one solution
//   4. dots[i] = [r0, c0, r1, c1]; colour i is printed in the order given
//
// Deterministic: same seed, same bank.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { countWire } from './connect-solver.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'app', 'connect', 'puzzles.js');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const START = '2026-11-01';
const UNTIL = opt('--until', '2026-12-31');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function days(from, to) { const o = []; for (let t = Date.parse(from + 'T12:00:00Z'); t <= Date.parse(to + 'T12:00:00Z'); t += 86400000) o.push(new Date(t).toISOString().slice(0, 10)); return o; }
const dow = (iso) => new Date(iso + 'T12:00:00Z').getUTCDay();
const label = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; };
const qid = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `connect-${m}-${d}-${String(y).slice(2)}`; };
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// One attempt at covering the board with self-avoiding, self-untouching paths.
export function layPaths(n, r, maxLen, walls = []) {
  const N = n * n;
  const own = new Int16Array(N).fill(-1);
  for (const w of walls) own[w] = -2; // blocked: never part of a path
  const nb = (i) => { const a = [], R = Math.floor(i / n), C = i % n; if (R > 0) a.push(i - n); if (R < n - 1) a.push(i + n); if (C > 0) a.push(i - 1); if (C < n - 1) a.push(i + 1); return a; };
  const free = (i) => nb(i).filter((j) => own[j] === -1).length;
  const paths = [];
  for (;;) {
    const empty = []; for (let i = 0; i < N; i++) if (own[i] === -1) empty.push(i);
    if (!empty.length) break;
    // start where the board is tightest, so corners and pockets get a path end
    let lo = 9; for (const i of empty) lo = Math.min(lo, free(i));
    const starts = empty.filter((i) => free(i) === lo);
    let cur = starts[Math.floor(r() * starts.length)];
    const k = paths.length, p = [cur]; own[cur] = k;
    const target = 4 + Math.floor(r() * (maxLen - 3));
    while (p.length < target) {
      const opts = nb(cur).filter((j) => own[j] === -1 && !nb(j).some((t) => t !== cur && own[t] === k));
      if (!opts.length) break;
      // Warnsdorff with noise: prefer the square with fewest free neighbours
      opts.sort((a, b) => free(a) - free(b) + (r() - 0.5) * 1.2);
      cur = opts[0]; own[cur] = k; p.push(cur);
    }
    paths.push(p);
  }
  // fold short paths into a neighbouring path's end where that keeps rule 2
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    for (let k = 0; k < paths.length; k++) {
      const p = paths[k];
      if (!p || p.length >= 3) continue;
      // try to attach this short path at one of its ends to an end of another path
      let merged = false;
      for (const e of [p[0], p[p.length - 1]]) {
        if (merged) break;
        const fromE = e === p[0] ? p.slice() : p.slice().reverse();
        for (const j of nb(e)) {
          const o = own[j]; if (o < 0 || o === k || !paths[o]) continue;
          const q = paths[o];
          let joined = null;
          if (q[q.length - 1] === j) joined = [...q, ...fromE];
          else if (q[0] === j) joined = [...fromE.slice().reverse(), ...q];
          if (!joined) continue;
          const pos = new Map(joined.map((x, i) => [x, i]));
          let okj = true;
          for (let i = 0; i < joined.length && okj; i++) for (const t of nb(joined[i])) { const pi = pos.get(t); if (pi != null && Math.abs(pi - i) > 1) { okj = false; break; } }
          if (!okj) continue;
          paths[o] = joined; for (const x of p) own[x] = o; paths[k] = null; merged = true; changed = true; break;
        }
      }
    }
    if (!changed) break;
  }
  const out = paths.filter(Boolean);
  if (out.some((p) => p.length < 3)) return null;
  for (const p of out) {
    const a = p[0], b = p[p.length - 1];
    if (nb(a).includes(b)) return null; // dots side by side
    const pos = new Map(p.map((x, i) => [x, i]));
    for (let i = 0; i < p.length; i++) for (const t of nb(p[i])) { const pi = pos.get(t); if (pi != null && Math.abs(pi - i) > 1) return null; }
  }
  return out;
}

// THE 2026-11-02 RAMP (owner, 2026-11-01: "far too easy, even on a sunday ...
// obstacles?"): blocked squares, fewer and longer lines, a bigger Sunday.
//   day        board   blocked  pairs
//   Mon, Tue   9x9     4        6
//   Wed, Thu   10x10   6        7
//   Fri, Sat   11x11   8        8
//   Sun        12x12   10       9     the Sunday Edition
// Never more than ten pairs, so every line wears one of the ten site pastels.
// Board No. 1 (2026-11-01) went live under the first ramp and is kept as dealt.
export const SPEC = { 1: [9, 4, 6], 2: [9, 4, 6], 3: [10, 6, 7], 4: [10, 6, 7], 5: [11, 8, 8], 6: [11, 8, 8], 0: [12, 10, 9] };
export const RULES_FROM = '2026-11-02';

// Blocked squares come in pairs mirrored through the centre (so the board looks
// set, not spilled), and the open squares stay one connected area.
function dealWalls(n, W, r) {
  for (;;) {
    const set = new Set();
    while (set.size < W) { const i = Math.floor(r() * n * n); const j = n * n - 1 - i; if (i === j) continue; set.add(i); set.add(j); }
    if (set.size !== W) continue;
    const open = []; for (let i = 0; i < n * n; i++) if (!set.has(i)) open.push(i);
    const seen = new Set([open[0]]), st = [open[0]];
    while (st.length) {
      const x = st.pop(), R = Math.floor(x / n), C = x % n;
      for (const j of [R > 0 ? x - n : -1, R < n - 1 ? x + n : -1, C > 0 ? x - 1 : -1, C < n - 1 ? x + 1 : -1]) if (j >= 0 && !set.has(j) && !seen.has(j)) { seen.add(j); st.push(j); }
    }
    if (seen.size === open.length) return [...set].sort((a, b) => a - b);
  }
}

// ONE SOLUTION UNDER THE PLAYER'S RULES. The client accepts any board where
// every pair is joined and every open square is used, wiggles and all, so from
// No. 2 a board is kept only when the solver, with a line allowed to run
// alongside itself (`touch: true`), still finds exactly one solution. (The first
// ramp only proved one solution among lines that never touch themselves; a
// player could fill a gap by wiggling a line into it, which is much of why those
// boards were easy: the first wave had boards with fifty ways to finish.) The
// quick no-touch count runs first as a filter, since two solutions there are
// two solutions for the player too.
// A board also needs at least MIN_BRANCHES[n] real choices in it (`branches`:
// search nodes where, after every forced move, there is still more than one way
// on); the first deal of this ramp had a Sunday that was forced square by
// square. Of the first CANDIDATES[n] boards that pass, the one with the most
// branches is kept. The big boards are slow to prove, hence fewer.
const CANDIDATES = { 9: 8, 10: 6, 11: 4, 12: 3 };
const MIN_BRANCHES = { 9: 2000, 10: 5000, 11: 10000, 12: 20000 };
const PROOF_NODES = 4e6;
export function makeBoard(dayOfWeek, seed) {
  const [n, W, want] = SPEC[dayOfWeek];
  const r = rng(seed);
  let best = null, found = 0;
  for (let tries = 0; tries < 2e6 && found < CANDIDATES[n]; tries++) {
    const walls = dealWalls(n, W, r);
    const paths = layPaths(n, r, Math.round(((n * n - W) / want) * 1.8), walls);
    if (!paths || paths.length !== want) continue;
    const dots = paths.map((p) => [Math.floor(p[0] / n), p[0] % n, Math.floor(p[p.length - 1] / n), p[p.length - 1] % n]);
    const wl = walls.map((i) => [Math.floor(i / n), i % n]);
    const quick = countWire({ n, dots, walls: wl }, { cap: 2, maxNodes: 400000 });
    if (quick.aborted || quick.count !== 1) continue;
    const res = countWire({ n, dots, walls: wl }, { cap: 2, maxNodes: PROOF_NODES, touch: true });
    if (res.aborted || res.count !== 1 || res.branches < MIN_BRANCHES[n]) continue;
    found++;
    if (!best || res.branches > best.branches) best = { n, dots, walls: wl, tries, branches: res.branches };
  }
  if (!best) throw new Error(`no unique ${n}x${n} board for seed ${seed}`);
  return best;
}

if (process.argv[1] && process.argv[1].endsWith('gen-connect.mjs')) {
  let kept = [];
  if (fs.existsSync(OUT)) kept = fs.readFileSync(OUT, 'utf8').split('\n').filter((l) => l.startsWith('  {"num"')).map((l) => JSON.parse(l.trim().replace(/,$/, '')));
  // rows dealt under the first ramp after it was retired are dealt again
  kept = kept.filter((p) => p.live < RULES_FROM || p.walls);
  const have = new Set(kept.map((p) => p.live));
  const rows = [...kept];
  for (const d of days(START, UNTIL)) {
    if (have.has(d)) continue;
    const num = rows.length + 1;
    const t0 = Date.now();
    const b = makeBoard(dow(d), 20261102 + num * 7919);
    rows.push({ num, quizId: qid(d), live: d, dateLabel: label(d), ...(dow(d) === 0 ? { sunday: true } : {}), size: b.n, dots: b.dots, walls: b.walls });
    process.stdout.write(`  #${num} ${d} ${b.n}x${b.n} ${b.dots.length} pairs, ${b.walls.length} blocked, ${b.branches} branches, ${b.tries} tries, ${Date.now() - t0}ms\n`);
  }
  const head = `// Puzzle data for Connect, the daily dot-joining puzzle (numberlink).
// GENERATED by scripts/gen-connect.mjs; do not edit by hand. Extend with
// \`node scripts/gen-connect.mjs --until <date>\`, which keeps every row here byte
// for byte. Checked by scripts/verify-connect.mjs. Imported only by the server page,
// which strips days not yet live. Rules and the size ramp are in the generator.
//   size   the board is size x size
//   dots   [r0, c0, r1, c1] per colour: join each pair, fill every open square
//   walls  [r, c] per blocked square (from No. 2): no line enters it
//   sunday the Sunday Edition
export const PUZZLES = [
`;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, head + rows.map((p) => '  ' + JSON.stringify(p) + ',').join('\n') + '\n];\n');
  console.log(`connect: ${rows.length} rows`);
}
