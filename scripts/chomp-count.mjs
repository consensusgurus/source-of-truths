// Counting winning routes, and the fork count. Any board size.
//
// A WINNING ROUTE is any move sequence that eats the whole cast, of any length,
// not just a shortest one. That is the thing the owner's rule is about ("there
// should only be one path that works"), and it is why this cannot be answered by
// the shortest-route search: a board can have one optimum and a hundred longer
// routes that also clear it, which is what the live bank looks like (1 to 200+).
//
// FORKS are squares along the route offering more than one legal move. On a
// unique board every fork has exactly one survivor, so the fork count IS the
// number of times the player can lose the run. It is the usable difficulty dial
// here: branching cannot be raised, because on any route that fills the board
// almost every square has one legal exit by the time you reach it.
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function ctx(p) {
  const w = p.w, h = p.h, C = w * h;
  const idx = (x, y) => y * w + x;
  const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  const occ = new Uint8Array(C);
  for (const [x, y] of (p.walls || [])) occ[idx(x, y)] = 1;
  const K = p.pellets.length;
  // GATES (2026-11-25 on): shut until `after` mascots are eaten. Like a later
  // mascot, a shut gate is solid for movement but passable for the reach test
  // below, because it opens later; that keeps the prune sound.
  const gateAfter = new Int16Array(C).fill(-1);
  for (const g of (p.gates || [])) gateAfter[idx(g.x, g.y)] = g.after;
  const bl = (q, x, y) => {
    if (!inside(x, y) || occ[idx(x, y)]) return true;
    if (gateAfter[idx(x, y)] > q) return true;
    for (let k = q + 1; k < K; k++) if (p.pellets[k][0] === x && p.pellets[k][1] === y) return true;
    return false;
  };
  // Unreached mascots are PASSABLE for this test on purpose: they are the
  // destinations, not walls. Blocking them makes the question unanswerable.
  const seen = new Uint8Array(C);
  const reach = (q, x, y) => {
    seen.fill(0); const i0 = idx(x, y); seen[i0] = 1; const st = [i0];
    for (let i = 0; i < st.length; i++) {
      const c = st[i], cx = c % w, cy = (c - cx) / w;
      for (const d of DIRS) {
        const nx = cx + d[0], ny = cy + d[1];
        if (!inside(nx, ny)) continue;
        const j = idx(nx, ny);
        if (occ[j] || seen[j]) continue;
        seen[j] = 1; st.push(j);
      }
    }
    for (let k = q; k < K; k++) if (!seen[idx(p.pellets[k][0], p.pellets[k][1])]) return false;
    return true;
  };
  return { w, h, C, idx, inside, occ, K, bl, reach };
}

// Stops at `want`. `capped` means the node budget ran out before reaching it, so
// the answer is UNKNOWN: a caller must reject the board rather than read a
// capped count as proof of anything.
export function countRoutes(p, want = 2, cap = 3000000) {
  const s = ctx(p), { idx, occ, K, bl, reach } = s;
  occ[idx(p.start[0], p.start[1])] = 1;
  let n = 0, nodes = 0, capped = false;
  const go = (x, y, pi) => {
    if (pi >= K) { n += 1; return n >= want; }
    if (++nodes > cap) { capped = true; return true; }
    for (const d of DIRS) {
      const nx = x + d[0], ny = y + d[1];
      if (bl(pi, nx, ny)) continue;
      const np = (nx === p.pellets[pi][0] && ny === p.pellets[pi][1]) ? pi + 1 : pi;
      occ[idx(nx, ny)] = 1;
      const stop = (np >= K || reach(np, nx, ny)) ? go(nx, ny, np) : false;
      occ[idx(nx, ny)] = 0;
      if (stop) return true;
    }
    return false;
  };
  go(p.start[0], p.start[1], 0);
  return { n, capped };
}

export function branchingOn(p, route) {
  const s = ctx(p), { idx, occ, bl } = s;
  occ[idx(p.start[0], p.start[1])] = 1;
  let x = p.start[0], y = p.start[1], pi = 0, tot = 0, steps = 0, forks = 0;
  for (const d of route) {
    const opts = DIRS.filter((e) => !bl(pi, x + e[0], y + e[1])).length;
    tot += opts; steps += 1; if (opts > 1) forks += 1;
    const nx = x + d[0], ny = y + d[1];
    if (nx === p.pellets[pi][0] && ny === p.pellets[pi][1]) pi += 1;
    occ[idx(nx, ny)] = 1; x = nx; y = ny;
  }
  return { mean: tot / steps, forks, steps };
}

// The shortest winning route, for the stored `min` and as an independent
// findability proof: this search knows nothing about the walk a board was
// carved from.
export function shortestRoute(p, cap = 4000000) {
  const s = ctx(p), { w, h, idx, occ, K, bl, reach } = s;
  const manh = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  occ[idx(p.start[0], p.start[1])] = 1;
  const suffix = new Array(K + 2).fill(0);
  for (let k = K - 1; k >= 1; k--) suffix[k] = suffix[k + 1] + manh(p.pellets[k - 1], p.pellets[k]);
  const lower = (x, y, pi) => (pi >= K ? 0 : manh([x, y], p.pellets[pi]) + suffix[pi + 1]);
  let nodes = 0, best = null, route = [], hit = false;
  const path = [];
  function dfs(x, y, pi, g, lim) {
    if (pi >= K) { best = g; route = path.slice(); return true; }
    if (++nodes > cap) { hit = true; return false; }
    if (g + lower(x, y, pi) > lim) return false;
    const t = p.pellets[pi];
    const opts = DIRS.filter((d) => !bl(pi, x + d[0], y + d[1]))
      .sort((a, b) => manh([x + a[0], y + a[1]], t) - manh([x + b[0], y + b[1]], t));
    for (const d of opts) {
      const nx = x + d[0], ny = y + d[1];
      const np = (nx === t[0] && ny === t[1]) ? pi + 1 : pi;
      occ[idx(nx, ny)] = 1; path.push(d);
      if (np >= K || reach(np, nx, ny)) { if (dfs(nx, ny, np, g + 1, lim)) { occ[idx(nx, ny)] = 0; path.pop(); return true; } }
      occ[idx(nx, ny)] = 0; path.pop();
    }
    return false;
  }
  const playable = w * h - (p.walls ? p.walls.length : 0);
  for (let lim = lower(p.start[0], p.start[1], 0); lim <= playable - 1; lim += 2) {
    nodes = 0; hit = false;
    if (dfs(p.start[0], p.start[1], 0, 0, lim)) return { min: best, route, capped: false };
    if (hit) return { min: null, route: null, capped: true };
  }
  return { min: null, route: null, capped: false };
}
