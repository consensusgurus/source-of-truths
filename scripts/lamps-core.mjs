// scripts/lamps-core.mjs: the generator's engine for Lamps, the daily
// light-placement puzzle (the family known as akari or light up).
//
// A board is an n x n grid of white squares and walls. A lamp lights its own
// square and every white square it can see along its row and column, up to
// the first wall. Every white square must be lit, no lamp may shine on another
// lamp, and a numbered wall touches exactly that many lamps (orthogonally).
//
// grid[r] is a string: '.' white, '#' a blank wall, '0'..'4' a numbered wall.
//
// THE GRADED SOLVER. Level 0 is what a person does with a pencil:
//   * a numbered wall that already has its lamps crosses out its other sides,
//     and one that needs every open side takes them all;
//   * a lit square cannot hold a lamp;
//   * a dark square that only one open square can light takes a lamp there.
// Level 1 is ONE look ahead: suppose a lamp (or a cross) in a square, run
// level 0, and if the board breaks, the square is the other thing.
// `cost` is the number of squares first settled by a look ahead.
//
// scripts/verify-lamps.mjs shares NO code with this file.

export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle(a, rnd) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Geometry for a wall mask: for every white square, the squares it sees
// (its row run and column run, itself excluded), and for every wall its
// white orthogonal neighbours.
export function compile(n, isWall) {
  const N = n * n;
  const sees = Array.from({ length: N }, () => []);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const i = r * n + c;
    if (isWall[i]) continue;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      let rr = r + dr, cc = c + dc;
      while (rr >= 0 && rr < n && cc >= 0 && cc < n && !isWall[rr * n + cc]) { sees[i].push(rr * n + cc); rr += dr; cc += dc; }
    }
  }
  const adj = Array.from({ length: N }, () => []);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const i = r * n + c;
    if (!isWall[i]) continue;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < n && cc >= 0 && cc < n && !isWall[rr * n + cc]) adj[i].push(rr * n + cc);
    }
  }
  return { n, N, isWall, sees, adj };
}

// State per white square: 0 unknown, 1 lamp, 2 crossed out.
// Level 0 to a fixed point. Returns false on a contradiction.
export function propagate(G, nums, st) {
  const { N, isWall, sees, adj } = G;
  let changed = true;
  while (changed) {
    changed = false;
    for (let w = 0; w < N; w++) {
      if (!isWall[w] || nums[w] < 0) continue;
      let lamps = 0, open = 0;
      for (const j of adj[w]) { if (st[j] === 1) lamps++; else if (st[j] === 0) open++; }
      if (lamps > nums[w] || lamps + open < nums[w]) return false;
      if (open && lamps === nums[w]) { for (const j of adj[w]) if (st[j] === 0) st[j] = 2; changed = true; }
      else if (open && lamps + open === nums[w]) { for (const j of adj[w]) if (st[j] === 0) st[j] = 1; changed = true; }
    }
    for (let i = 0; i < N; i++) {
      if (isWall[i]) continue;
      let lit = st[i] === 1;
      let cand = st[i] === 0 ? 1 : 0, last = st[i] === 0 ? i : -1;
      for (const j of sees[i]) {
        if (st[j] === 1) { if (st[i] === 1) return false; lit = true; }
        else if (st[j] === 0) { cand++; last = j; }
      }
      if (lit) { if (st[i] === 0) { st[i] = 2; changed = true; } continue; }
      if (cand === 0) return false;
      if (cand === 1) { st[last] = 1; changed = true; }
    }
  }
  return true;
}

export function solved(G, st) {
  for (let i = 0; i < G.N; i++) if (!G.isWall[i] && st[i] === 0) return false;
  return true;
}

// Graded solve. Returns { ok, cost, st }.
export function grade(G, nums) {
  const st = new Uint8Array(G.N);
  if (!propagate(G, nums, st)) return { ok: false, cost: 0, st };
  let cost = 0;
  for (;;) {
    if (solved(G, st)) return { ok: true, cost, st };
    let moved = false;
    for (let i = 0; i < G.N && !moved; i++) {
      if (G.isWall[i] || st[i] !== 0) continue;
      for (const v of [1, 2]) {
        const t = st.slice();
        t[i] = v;
        if (!propagate(G, nums, t)) {
          st[i] = v === 1 ? 2 : 1;
          cost++;
          if (!propagate(G, nums, st)) return { ok: false, cost, st };
          moved = true;
          break;
        }
      }
    }
    if (!moved) return { ok: false, cost, st };
  }
}

// Solution counter (cap 2): propagate, then branch on the first open square.
export function countSolutions(G, nums, cap = 2) {
  let count = 0;
  (function rec(st) {
    if (count >= cap) return;
    if (!propagate(G, nums, st)) return;
    let pick = -1;
    for (let i = 0; i < G.N; i++) if (!G.isWall[i] && st[i] === 0) { pick = i; break; }
    if (pick < 0) { count++; return; }
    for (const v of [1, 2]) { const t = st.slice(); t[pick] = v; rec(t); }
  })(new Uint8Array(G.N));
  return count;
}

// A random wall mask with half-turn symmetry, whites connected not required
// (akari does not need it), but no white square walled in alone on all sides
// is fine too: it simply takes a lamp.
export function randomWalls(n, density, rnd) {
  const N = n * n;
  const isWall = new Uint8Array(N);
  const want = Math.round(N * density);
  let placed = 0, guard = 0;
  while (placed < want && guard++ < 4000) {
    const i = Math.floor(rnd() * N);
    const j = N - 1 - i;
    if (isWall[i]) continue;
    isWall[i] = 1; placed++;
    if (j !== i && !isWall[j]) { isWall[j] = 1; placed++; }
  }
  return isWall;
}

// A random legal lamp layout: visit the whites in random order and drop a
// lamp wherever the square is still dark. Nothing lit ever takes a lamp, so
// no two lamps see each other, and every square ends up lit.
export function randomLamps(G, rnd) {
  const lit = new Uint8Array(G.N);
  const lamp = new Uint8Array(G.N);
  const order = [];
  for (let i = 0; i < G.N; i++) if (!G.isWall[i]) order.push(i);
  shuffle(order, rnd);
  for (const i of order) {
    if (lit[i]) continue;
    lamp[i] = 1; lit[i] = 1;
    for (const j of G.sees[i]) lit[j] = 1;
  }
  return lamp;
}

// Build one board: walls, lamps, every wall numbered; keep it only if unique;
// then strip numbers in random order while the graded solver still finishes
// inside `maxCost`. Returns null when the wall pattern admits two layouts.
export function makeBoard(n, density, rnd, maxCost) {
  const isWall = randomWalls(n, density, rnd);
  const G = compile(n, isWall);
  const lamp = randomLamps(G, rnd);
  const nums = new Int8Array(G.N).fill(-1);
  const walls = [];
  for (let w = 0; w < G.N; w++) if (isWall[w]) { walls.push(w); nums[w] = G.adj[w].reduce((a, j) => a + lamp[j], 0); }
  if (countSolutions(G, nums, 2) !== 1) return null;
  let g = grade(G, nums);
  if (!g.ok) return null;
  shuffle(walls, rnd);
  for (const w of walls) {
    const keep = nums[w];
    nums[w] = -1;
    const t = grade(G, nums);
    if (t.ok && t.cost <= maxCost) g = t; else nums[w] = keep;
  }
  // the graded solve is sound, so finishing proves uniqueness; assert anyway
  if (countSolutions(G, nums, 2) !== 1) return null;
  const grid = [];
  for (let r = 0; r < n; r++) {
    let s = '';
    for (let c = 0; c < n; c++) { const i = r * n + c; s += !isWall[i] ? '.' : nums[i] < 0 ? '#' : String(nums[i]); }
    grid.push(s);
  }
  const sol = [];
  for (let i = 0; i < G.N; i++) if (lamp[i]) sol.push(i);
  // the stored solution must be the one the solver reached
  for (let i = 0; i < G.N; i++) if (!isWall[i] && (g.st[i] === 1) !== !!lamp[i]) return null;
  const clues = walls.filter((w) => nums[w] >= 0).length;
  return { n, grid, sol, cost: g.cost, clues, walls: walls.length };
}
