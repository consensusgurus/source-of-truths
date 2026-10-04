// One-jester board producer (sizes 8 to 12). Seeded no-touch placement ->
// region growth from each jester -> boundary repair to a UNIQUE seating ->
// the graded human-move solver (scripts/grade-jester.mjs) must finish it with
// no trial and error. Appends to a JSON bank file so it can run in slices.
//   node scripts/jester1-produce.mjs <size> <target> <budgetMs> <out.json> [seed]
import fs from 'fs';
import { gradeBoard } from './grade-jester.mjs';

const N = Number(process.argv[2] || 10), TARGET = Number(process.argv[3] || 20);
const BUDGET = Number(process.argv[4] || 60000), OUT = process.argv[5] || `/tmp/j1-${N}.json`;
function rng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const rnd = rng(Number(process.argv[6] || (Date.now() % 1e9)));
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

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
  // uneven growth: each step a random court (biased to a per-court appetite) takes a free neighbour
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
// relabel courts so ids read top-left first (cosmetic, stable)
function relabel(n, reg) {
  const map = new Map(); for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!map.has(reg[r][c])) map.set(reg[r][c], map.size);
  return reg.map((row) => row.map((x) => map.get(x)));
}

let bank = []; try { bank = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch {}
const seen = new Set(bank.map((b) => JSON.stringify(b.regions)));
const t0 = Date.now(); let tried = 0;
while (bank.length < TARGET && Date.now() - t0 < BUDGET) {
  tried++;
  const cols = placement(N); if (!cols) continue;
  let reg = grow(N, cols); if (!reg) continue;
  reg = repair(N, reg, cols); if (!reg) continue;
  const sizes = Array(N).fill(0); for (const row of reg) for (const x of row) sizes[x]++;
  if (sizes.some((s) => s < 2)) continue;
  const g = gradeBoard(N, reg);
  if (!g.solved) continue;
  if (g.cols && g.cols.some((c, r) => c !== cols[r])) continue;
  reg = relabel(N, reg);
  const key = JSON.stringify(reg); if (seen.has(key)) continue; seen.add(key);
  bank.push({ size: N, regions: reg, solution: cols, tier: g.tier, rounds: g.rounds, score: g.score });
  fs.writeFileSync(OUT, JSON.stringify(bank));
}
console.log(`n=${N} banked ${bank.length}/${TARGET} (tried ${tried}) in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
