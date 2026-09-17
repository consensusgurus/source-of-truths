import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
// scripts/verify-yose.mjs — re-proves app/yose/puzzles.js with its own Go engine.
//
// It imports NOTHING from lib/yose-core.js or the generator. The board here is
// a 2D array, groups are found by recursion, positions are keyed by strings,
// and the search is written as negamax on White's margin rather than minimax on
// Black's. A rules bug in the shipping engine therefore disagrees with this
// file instead of agreeing with itself.
//
// Checks:
//   1. shape: num, quizId, dateLabel, sunday agree with `live`; dates contiguous;
//      board size and open-point count match the weekday ramp
//   2. the board: rows are size x size over X O x o . ; `pts` is sorted, unique,
//      and holds every '.' plus only stones (loose stones) otherwise; `loose`
//      counts them; territory touches only its own stones and territory; every
//      stone NOT on an open point is in a group touching its own territory; no
//      group starts without a liberty
//   3. the whole game tree is solved with the ko rule, and NO line repeats a
//      position (board, side to move, ko ban); no move ever captures a stone
//      that is not on an open point
//   4. komi = perfect-play margin - 0.5
//   5. `key` is exactly the set of winning first moves, never a pass, within the
//      day's limit; at least two first moves (pass included) lose
//   6. `forced` recomputed along the main line (Black: the first winning move,
//      lowest point, moves before pass; White: the engine rule), and at least the
//      day's floor
//   7. `nodes` is the solved position count and no board repeats in the bank
//
//   node scripts/verify-yose.mjs            every board (a few minutes)
//   node scripts/verify-yose.mjs --quick    structure, and the weekday boards only
// VERIFY_YOSE_BANK points the checker at another file (the mutation test).
// A file URL, never a bare path: a Windows path like C:\\... is not an import
// specifier, and the deploy watcher runs these on Windows.
const BANK = process.env.VERIFY_YOSE_BANK
  ? pathToFileURL(resolve(process.env.VERIFY_YOSE_BANK)).href
  : new URL('../app/yose/puzzles.js', import.meta.url).href;
const { PUZZLES } = await import(BANK);

const QUICK = process.argv.includes('--quick');
let fails = 0;
const bad = (m) => { fails++; if (fails <= 40) console.log('FAIL', m); };

const SPEC = {
  1: { n: 7, open: 6, maxWin: 2, forced: 1, maxKomi: 9 },
  2: { n: 7, open: 7, maxWin: 2, forced: 1, maxKomi: 9 },
  3: { n: 7, open: 8, maxWin: 1, forced: 2, maxKomi: 9 },
  4: { n: 7, open: 9, maxWin: 1, forced: 2, maxKomi: 9 },
  5: { n: 8, open: 10, maxWin: 1, forced: 2, maxKomi: 9 },
  6: { n: 8, open: 10, maxWin: 1, forced: 3, maxKomi: 9 },
  0: { n: 9, open: 11, maxWin: 1, forced: 3, maxKomi: 11 },
};
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

class Repeat extends Error {}

function solveBoard(p) {
  const N = p.size;
  const grid = p.rows.map((r) => r.split(''));
  const open = new Set(p.pts.map((i) => `${Math.floor(i / N)},${i % N}`));
  const around = (r, c) => [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N);
  const empty = (ch) => ch === '.' || ch === 'x' || ch === 'o';

  function collect(g, r, c, color, seen, stones, libs) {
    const k = `${r},${c}`;
    if (seen.has(k)) return;
    seen.add(k);
    stones.push([r, c]);
    for (const [a, b] of around(r, c)) {
      if (g[a][b] === color) collect(g, a, b, color, seen, stones, libs);
      else if (empty(g[a][b])) libs.add(`${a},${b}`);
    }
  }
  const groupAt = (g, r, c) => { const stones = [], libs = new Set(); collect(g, r, c, g[r][c], new Set(), stones, libs); return { stones, libs }; };

  // Returns { g, caps, ko } or null.
  function move(g, r, c, color, ban) {
    const k = `${r},${c}`;
    if (!open.has(k) || g[r][c] !== '.' || ban === k) return null;
    const h = g.map((row) => row.slice());
    h[r][c] = color;
    const foe = color === 'X' ? 'O' : 'X';
    const caps = [];
    for (const [a, b] of around(r, c)) {
      if (h[a][b] !== foe) continue;
      const grp = groupAt(h, a, b);
      if (grp.libs.size === 0) {
        for (const [s, t] of grp.stones) {
          if (!open.has(`${s},${t}`)) throw new Error(`captured a fixed stone at ${s},${t}`);
          h[s][t] = '.';
          caps.push(`${s},${t}`);
        }
      }
    }
    const mine = groupAt(h, r, c);
    if (mine.libs.size === 0) return null;
    const ko = caps.length === 1 && mine.stones.length === 1 && mine.libs.size === 1 && mine.libs.has(caps[0]) ? caps[0] : null;
    return { g: h, caps, ko };
  }

  function count(g) {
    let b = 0, w = 0;
    const seen = new Set();
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (g[r][c] === 'X') b++;
      else if (g[r][c] === 'O') w++;
      else if (!seen.has(`${r},${c}`)) {
        const q = [[r, c]];
        seen.add(`${r},${c}`);
        let size = 0; const touch = new Set();
        while (q.length) {
          const [s, t] = q.pop();
          size++;
          for (const [a, bb] of around(s, t)) {
            const ch = g[a][bb];
            if (ch === 'X' || ch === 'O') touch.add(ch);
            else if (!seen.has(`${a},${bb}`)) { seen.add(`${a},${bb}`); q.push([a, bb]); }
          }
        }
        if (touch.size === 1) { if (touch.has('X')) b += size; else w += size; }
      }
    }
    return b - w;
  }

  const openList = p.pts.map((i) => [Math.floor(i / N), i % N]);
  const posKey = (g, side, ban) => openList.map(([r, c]) => g[r][c]).join('') + side + (ban || '-');
  const memo = new Map();
  const onPath = new Set();
  // Returns the final (black - white) with perfect play.
  function solve(g, side, passed, ban) {
    const pk = posKey(g, side, ban);
    const key = pk + (passed ? 'P' : '');
    if (memo.has(key)) return memo.get(key);
    if (onPath.has(pk)) throw new Repeat(pk);
    onPath.add(pk);
    const other = side === 'X' ? 'O' : 'X';
    const scores = [passed ? count(g) : solve(g, other, true, null)];
    for (const [r, c] of openList) {
      const m = move(g, r, c, side, ban);
      if (m) scores.push(solve(m.g, other, false, m.ko));
    }
    // negamax on the side to move's own margin
    const sign = side === 'X' ? 1 : -1;
    const best = sign * Math.max(...scores.map((s) => sign * s));
    onPath.delete(pk);
    memo.set(key, best);
    return best;
  }

  const V = solve(grid, 'X', false, null);
  const choices = (g, side, passed, ban) => {
    const other = side === 'X' ? 'O' : 'X';
    const out = [{ p: -1, g, caps: [], ko: null, v: passed ? count(g) : solve(g, other, true, null) }];
    for (const [r, c] of openList) {
      const m = move(g, r, c, side, ban);
      if (m) out.push({ p: r * N + c, g: m.g, caps: m.caps, ko: m.ko, v: solve(m.g, other, false, m.ko) });
    }
    return out;
  };
  return { V, choices, grid, memo };
}

const seenBoards = new Set();
let prev = null, solved = 0;
for (const [idx, p] of PUZZLES.entries()) {
  const id = `yose #${p.num}`;
  if (p.num !== idx + 1) bad(`${id}: num out of order`);
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `yose-${m}-${d}-${String(y).slice(2)}`) bad(`${id}: quizId`);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${d}, ${y}`) bad(`${id}: dateLabel`);
  const wd = new Date(`${p.live}T12:00:00Z`).getUTCDay();
  if (!!p.sunday !== (wd === 0)) bad(`${id}: sunday flag`);
  if (prev) {
    const nx = new Date(`${prev}T12:00:00Z`); nx.setUTCDate(nx.getUTCDate() + 1);
    if (nx.toISOString().slice(0, 10) !== p.live) bad(`${id}: dates not contiguous`);
  }
  prev = p.live;
  const spec = SPEC[wd];
  const N = p.size;
  if (N !== spec.n) bad(`${id}: ${N}x${N}, want ${spec.n}`);
  if (p.pts.length !== spec.open) bad(`${id}: ${p.pts.length} open points, want ${spec.open}`);
  const sig = p.rows.join('/');
  if (seenBoards.has(sig)) bad(`${id}: repeats an earlier board`);
  seenBoards.add(sig);

  // 2. the board
  if (p.rows.length !== N || p.rows.some((r) => r.length !== N || /[^XOxo.]/.test(r))) { bad(`${id}: malformed rows`); continue; }
  const flat = p.rows.join('');
  const sorted = [...p.pts].sort((a, b) => a - b);
  if (sorted.join() !== p.pts.join() || new Set(p.pts).size !== p.pts.length) bad(`${id}: pts not sorted and unique`);
  let loose = 0;
  for (let i = 0; i < N * N; i++) {
    const ch = flat[i];
    const isOpen = p.pts.includes(i);
    if (ch === '.' && !isOpen) bad(`${id}: point ${i} is empty but not open`);
    if (isOpen && (ch === 'x' || ch === 'o')) bad(`${id}: open point ${i} is territory`);
    if (isOpen && (ch === 'X' || ch === 'O')) loose++;
    const r = Math.floor(i / N), c = i % N;
    const nbs = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N).map(([a, b]) => flat[a * N + b]);
    if (ch === 'x' && nbs.some((v) => v !== 'X' && v !== 'x')) bad(`${id}: black territory at ${i} touches ${nbs.join('')}`);
    if (ch === 'o' && nbs.some((v) => v !== 'O' && v !== 'o')) bad(`${id}: white territory at ${i} touches ${nbs.join('')}`);
  }
  if (loose !== p.loose) bad(`${id}: loose ${p.loose}, counted ${loose}`);
  {
    const seen = new Set();
    for (let i = 0; i < N * N; i++) {
      const ch = flat[i];
      if ((ch !== 'X' && ch !== 'O') || seen.has(i)) continue;
      const stack = [i]; seen.add(i);
      let fixed = false, anchored = false, libs = 0;
      while (stack.length) {
        const q = stack.pop();
        if (!p.pts.includes(q)) fixed = true;
        const r = Math.floor(q / N), c = q % N;
        for (const [a, b] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]) {
          if (a < 0 || b < 0 || a >= N || b >= N) continue;
          const j = a * N + b, w = flat[j];
          if (w === ch) { if (!seen.has(j)) { seen.add(j); stack.push(j); } }
          else if (w === '.' || w === 'x' || w === 'o') { libs++; if (w === ch.toLowerCase()) anchored = true; }
        }
      }
      if (!libs) bad(`${id}: a group at ${i} starts with no liberty`);
      if (fixed && !anchored) bad(`${id}: the group at ${i} can be captured but is not on open points`);
    }
  }

  if (QUICK && wd === 0) continue;
  // 3-7
  let S;
  try { S = solveBoard(p); } catch (e) {
    if (e instanceof Repeat) { bad(`${id}: a line repeats a position`); continue; }
    bad(`${id}: ${e.message}`); continue;
  }
  solved++;
  if (p.komi !== S.V - 0.5) bad(`${id}: komi ${p.komi}, perfect margin ${S.V}`);
  if (Math.abs(S.V) > spec.maxKomi) bad(`${id}: margin ${S.V} beyond ${spec.maxKomi}`);
  const root = S.choices(S.grid, 'X', false, null);
  const win = root.filter((o) => o.v === S.V).map((o) => o.p).sort((a, b) => a - b);
  if (win.join() !== [...p.key].sort((a, b) => a - b).join()) bad(`${id}: key ${p.key} but winning first moves are ${win}`);
  if (win.includes(-1)) bad(`${id}: passing wins`);
  if (win.length > spec.maxWin) bad(`${id}: ${win.length} winning first moves`);
  if (root.length - win.length < 2) bad(`${id}: fewer than two losing first moves`);
  // the main line
  let g = S.grid, side = 'X', passed = false, ban = null, forced = 0;
  for (let ply = 0; ply < 120; ply++) {
    const opts = S.choices(g, side, passed, ban);
    let mv;
    if (side === 'X') {
      const w = opts.filter((o) => o.v === S.V);
      if (opts.length >= 2 && w.length === 1) forced++;
      w.sort((a, b) => ((a.p < 0) - (b.p < 0)) || (a.p - b.p));
      mv = w[0];
      if (!mv) { bad(`${id}: the main line lost the win`); break; }
    } else {
      opts.sort((a, b) => (a.v - b.v) || (b.caps.length - a.caps.length) || ((a.p < 0) - (b.p < 0)) || (a.p - b.p));
      mv = opts[0];
    }
    if (mv.p < 0 && passed) break;
    passed = mv.p < 0;
    ban = mv.p < 0 ? null : mv.ko;
    g = mv.g;
    side = side === 'X' ? 'O' : 'X';
  }
  if (S.memo.size !== p.nodes) bad(`${id}: nodes ${p.nodes}, solved ${S.memo.size}`);
  if (forced !== p.forced) bad(`${id}: forced ${p.forced}, recomputed ${forced}`);
  if (forced < spec.forced) bad(`${id}: forced ${forced} under the day's floor ${spec.forced}`);
}

console.log(`verify-yose: ${PUZZLES.length} boards, ${solved} solved${QUICK ? ' (quick: Sundays structure only)' : ''}, ${fails} failures`);
process.exit(fails ? 1 : 0);
