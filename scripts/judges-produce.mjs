// Judges board producer: two judges per row, column and court (Star Battle,
// two stars), for the 10x10 weekday boards and the 12x12 Sunday Edition.
//
//   node scripts/judges-produce.mjs <size> <target> <budgetMs> <out.json> [seed] [skew]
//
// 1. a random no-touch seating, two per row and column;
// 2. courts grown from pairs of seated judges, with UNEVEN appetites (a few
//    sprawling courts, many tight ones): tight courts are what make a two-star
//    board unique, and even growth almost never converges at 12x12;
// 3. greedy boundary repair: while rival seatings exist, try handing each
//    rival-only cell to a neighbouring court and keep the move that leaves the
//    fewest seatings (counted to a cap), never touching an intended judge;
// 4. the board must then fall to scripts/jester2-human.mjs (no guessing), and
//    the deduction must land on the intended seating.
// Appends to <out.json>, so it can run in slices.
import fs from 'fs';
import { humanSolve2 } from './jester2-human.mjs';

const N = Number(process.argv[2] || 10), TARGET = Number(process.argv[3] || 20);
const BUDGET = Number(process.argv[4] || 60000), OUT = process.argv[5] || `/tmp/judges-${N}.json`;
const SKEW = Number(process.argv[7] || 8);
function rng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const rnd = rng(Number(process.argv[6] || (Date.now() % 1e9)));
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const PAIRS = []; for (let a = 0; a < N; a++) for (let b = a + 2; b < N; b++) PAIRS.push([a, b]);

function placement() {
  for (let t = 0; t < 40; t++) {
    const col = Array(N).fill(0), rows = []; let nodes = 0;
    const walk = (r) => {
      if (++nodes > 20000) return false;
      if (r === N) return col.every((c) => c === 2);
      for (const [a, b] of shuffle(PAIRS.slice())) {
        if (col[a] >= 2 || col[b] >= 2) continue;
        if (r > 0) { const [p, q] = rows[r - 1]; if (Math.abs(a - p) < 2 || Math.abs(a - q) < 2 || Math.abs(b - p) < 2 || Math.abs(b - q) < 2) continue; }
        col[a]++; col[b]++; rows.push([a, b]);
        let ok = true; for (let c = 0; c < N; c++) if (2 - col[c] > N - r - 1) { ok = false; break; }
        if (ok && walk(r + 1)) return true;
        rows.pop(); col[a]--; col[b]--;
      }
      return false;
    };
    if (walk(0)) return rows;
  }
  return null;
}

function grow(rows) {
  const isStar = Array.from({ length: N }, () => Array(N).fill(false)), stars = [];
  for (let r = 0; r < N; r++) for (const c of rows[r]) { isStar[r][c] = true; stars.push([r, c]); }
  const up = shuffle(stars.slice()), pairs = [];
  while (up.length) {
    const a = up.pop(); let bi = -1, bd = Infinity;
    for (let i = 0; i < up.length; i++) { const d = Math.abs(up[i][0] - a[0]) + Math.abs(up[i][1] - a[1]) + rnd() * 2.5; if (d < bd) { bd = d; bi = i; } }
    if (bi < 0) return null;
    pairs.push([a, up.splice(bi, 1)[0]]);
  }
  const reg = Array.from({ length: N }, () => Array(N).fill(-1));
  const connect = (id, [r1, c1], [r2, c2]) => {
    const prev = new Map(), q = [[r1, c1]], seen = new Set([r1 * N + c1]);
    while (q.length) {
      const [r, c] = q.shift();
      if (r === r2 && c === c2) { let cur = r * N + c;
        while (cur !== undefined) { const rr = (cur / N) | 0, cc = cur % N; if (reg[rr][cc] !== -1 && reg[rr][cc] !== id) return false; reg[rr][cc] = id; cur = prev.get(cur); }
        return true; }
      for (const [dr, dc] of shuffle([[1,0],[-1,0],[0,1],[0,-1]])) {
        const a = r + dr, b = c + dc, k = a * N + b;
        if (a < 0 || a >= N || b < 0 || b >= N || seen.has(k)) continue;
        if ((isStar[a][b] && !(a === r2 && b === c2)) || reg[a][b] !== -1) continue;
        seen.add(k); prev.set(k, r * N + c); q.push([a, b]);
      }
    }
    return false;
  };
  for (let id = 0; id < N; id++) if (!connect(id, pairs[id][0], pairs[id][1])) return null;
  let un = 0; for (const row of reg) for (const x of row) if (x === -1) un++;
  const appetite = Array.from({ length: N }, () => 0.1 + Math.pow(rnd(), SKEW) * 5);
  let guard = 0;
  while (un > 0 && guard++ < N * N * 400) {
    let tot = 0; for (const a of appetite) tot += a;
    let x = rnd() * tot, id = 0; while (x > appetite[id] && id < N - 1) { x -= appetite[id]; id++; }
    const fr = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (reg[r][c] === id)
      for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) { const a = r + dr, b = c + dc; if (a >= 0 && a < N && b >= 0 && b < N && reg[a][b] === -1) fr.push([a, b]); }
    if (!fr.length) continue;
    const [a, b] = fr[(rnd() * fr.length) | 0]; reg[a][b] = id; un--;
  }
  if (un) return null;
  const sizes = Array(N).fill(0); for (const row of reg) for (const x of row) sizes[x]++;
  if (sizes.some((z) => z < 4)) return null;   // a court must hold four cells or more
  return { reg, isStar };
}

// two-star seating counter: rows of column pairs, column + court quotas, a
// court-reach suffix prune. Returns null when the node cap is blown.
function seatings(reg, cap, nodeCap = 6e5) {
  const suffix = Array.from({ length: N + 1 }, () => Array(N).fill(0));
  for (let r = N - 1; r >= 0; r--) { const s = new Set(reg[r]); for (let id = 0; id < N; id++) suffix[r][id] = suffix[r + 1][id] + (s.has(id) ? 1 : 0); }
  const col = Array(N).fill(0), rc = Array(N).fill(0), out = [], cur = [];
  let prev = null, nodes = 0, blown = false;
  const walk = (r) => {
    if (out.length >= cap || blown) return;
    if (++nodes > nodeCap) { blown = true; return; }
    if (r === N) { out.push(cur.map((p) => p.slice())); return; }
    for (const [a, b] of PAIRS) {
      if (col[a] >= 2 || col[b] >= 2) continue;
      if (prev && (Math.abs(a - prev[0]) < 2 || Math.abs(a - prev[1]) < 2 || Math.abs(b - prev[0]) < 2 || Math.abs(b - prev[1]) < 2)) continue;
      const ra = reg[r][a], rb = reg[r][b];
      if (ra === rb) { if (rc[ra] > 0) continue; } else if (rc[ra] >= 2 || rc[rb] >= 2) continue;
      col[a]++; col[b]++; rc[ra]++; rc[rb]++;
      let ok = true;
      for (let c = 0; c < N && ok; c++) if (2 - col[c] > N - r - 1) ok = false;
      for (let id = 0; id < N && ok; id++) if (2 - rc[id] > suffix[r + 1][id] * 2) ok = false;
      if (ok) { const sp = prev; prev = [a, b]; cur.push([a, b]); walk(r + 1); cur.pop(); prev = sp; }
      col[a]--; col[b]--; rc[ra]--; rc[rb]--;
      if (out.length >= cap || blown) return;
    }
  };
  walk(0);
  return blown ? null : out;
}
function contiguous(reg, id) {
  const cells = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (reg[r][c] === id) cells.push(r * N + c);
  if (!cells.length) return false;
  const set = new Set(cells), seen = new Set([cells[0]]), st = [cells[0]];
  while (st.length) { const cur = st.pop(), r = (cur / N) | 0, c = cur % N;
    for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) { const a = r + dr, b = c + dc, k = a * N + b; if (a >= 0 && a < N && b >= 0 && b < N && set.has(k) && !seen.has(k)) { seen.add(k); st.push(k); } } }
  return seen.size === cells.length;
}

let bank = []; try { bank = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch {}
const seen = new Set(bank.map((b) => JSON.stringify(b.regions)));
const t0 = Date.now(); let tries = 0;
while (bank.length < TARGET && Date.now() - t0 < BUDGET) {
  tries++;
  const rows = placement(); if (!rows) continue;
  const g = grow(rows); if (!g) continue;
  const { reg, isStar } = g;
  let sols = seatings(reg, 400); if (!sols) continue;
  for (let step = 0; step < 120 && sols.length > 1; step++) {
    const tally = new Map();
    for (const s of sols.slice(0, 40)) for (let r = 0; r < N; r++) for (const c of s[r]) if (!isStar[r][c]) tally.set(r * N + c, (tally.get(r * N + c) || 0) + 1);
    const cells = shuffle([...tally.keys()]).sort((a, b) => tally.get(b) - tally.get(a)).slice(0, 10);
    let best = null;
    for (const k of cells) {
      const r = (k / N) | 0, c = k % N, from = reg[r][c];
      for (const [dr, dc] of shuffle([[1,0],[-1,0],[0,1],[0,-1]])) {
        const a = r + dr, b = c + dc; if (a < 0 || a >= N || b < 0 || b >= N) continue;
        const to = reg[a][b]; if (to === from) continue;
        reg[r][c] = to;
        let sz = 0; for (const row of reg) for (const x of row) if (x === from) sz++;
        if (sz >= 4 && contiguous(reg, from) && contiguous(reg, to)) {
          const s2 = seatings(reg, 400);
          if (s2 && s2.length >= 1 && (!best || s2.length < best.s2.length)) best = { r, c, to, s2 };
        }
        reg[r][c] = from;
      }
    }
    if (!best) break;
    reg[best.r][best.c] = best.to; sols = best.s2;
  }
  if (sols.length !== 1) continue;
  const hs = humanSolve2(N, reg);
  if (!hs.solved) continue;
  const sol = Array.from({ length: N }, (_, r) => { const cs = []; for (let c = 0; c < N; c++) if (hs.star[r][c]) cs.push(c); return cs; });
  if (JSON.stringify(sol) !== JSON.stringify(sols[0])) continue;
  const key = JSON.stringify(reg); if (seen.has(key)) continue; seen.add(key);
  const score = +(hs.tier[2] * 1 + hs.tier[3] * 4 + hs.tier[4] * 6 + hs.rounds * 0.25).toFixed(2);
  bank.push({ size: N, regions: reg.map((r) => r.slice()), solution: sol, tier: hs.tier, rounds: hs.rounds, score });
  fs.writeFileSync(OUT, JSON.stringify(bank));
}
console.log(`n=${N} banked ${bank.length}/${TARGET} (tries ${tries}) in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
