// lib/mop-engine.js: the board model for Mop (the daily mop-every-tile puzzle),
// shared by the client (app/mop/MopClient.jsx), the generator
// (scripts/gen-mop.mjs) and the checker (scripts/verify-mop.mjs).
//
// A board is one to three FLOORS. Every open tile on every floor is a node, and
// two nodes are joined when their tiles sit side by side in the same room or
// through a doorway. A STAIRCASE is ONE node that exists on the two floors it
// joins (same square on both), so stepping onto it is how the mop changes
// floor, and like every other tile it can be stood on once. The route starts
// on the tile inside the way in, ends on the tile inside the way out, and
// covers every node exactly once.

export function furnOf(F) {
  const s = new Set();
  for (const [x, y, w, h] of F.pieces) for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) s.add((y + j) * F.w + x + i);
  return s;
}

export function mopModel(P) {
  let n = 0;
  const at = [], adj = [], shared = {};
  const floors = P.floors.map((F, k) => {
    const N = F.w * F.h, furn = furnOf(F), node = new Array(N).fill(-1);
    const room = F.rooms.join('').split('');
    const door = new Set(F.doors.map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`));
    const open = (a, b) => room[a] === room[b] || door.has(`${Math.min(a, b)}-${Math.max(a, b)}`);
    for (let c = 0; c < N; c++) {
      if (furn.has(c)) continue;
      const st = F.stairs.includes(c);
      let id;
      if (st && shared[c] !== undefined) id = shared[c];
      else { id = n++; at.push([]); adj.push([]); if (st) shared[c] = id; }
      node[c] = id; at[id].push([k, c]);
    }
    return { node, furn, room, open };
  });
  P.floors.forEach((F, k) => {
    const { node, open } = floors[k], N = F.w * F.h;
    for (let c = 0; c < N; c++) for (const d of [1, F.w]) {
      const q = c + d;
      if ((d === 1 && c % F.w === F.w - 1) || q >= N) continue;
      const a = node[c], b = node[q];
      if (a >= 0 && b >= 0 && open(c, q)) { adj[a].push(b); adj[b].push(a); }
    }
  });
  return { n, at, adj, floors, start: floors[P.start[0]].node[P.start[1]], end: floors[P.end[0]].node[P.end[1]] };
}

// Count the routes from s to e that stand on every node of `adj` once, up to
// `cap`. `pairs` are node pairs that must be stepped on back to back (the
// generator solves one floor at a time and stands a staircase pair in for the
// floor behind it). Returns { count, first, capped }.
export function countRoutes(adj, s, e, { pairs = [], cap = 2, nodeCap = 400000 } = {}) {
  const N = adj.length, vis = new Uint8Array(N), path = [s], partner = new Int32Array(N).fill(-1);
  for (const [a, b] of pairs) { partner[a] = b; partner[b] = a; }
  if (partner[s] >= 0 || partner[e] >= 0) return { count: 0, first: null, capped: false };
  const total = N;
  let count = 0, nodes = 0, first = null;
  const seen = new Int32Array(N), stack = new Int32Array(N); let stamp = 0;
  function ok(cur, left) {
    stamp++; let sp = 0, got = 0; stack[sp++] = cur;
    while (sp) {
      const p = stack[--sp];
      for (const q of adj[p]) if (!vis[q] && seen[q] !== stamp) { seen[q] = stamp; stack[sp++] = q; got++; }
    }
    if (got !== left) return false;
    for (let q = 0; q < N; q++) {
      if (seen[q] !== stamp) continue;
      let d = 0; for (const r of adj[q]) if (!vis[r] || r === cur) d++;
      if (q === e ? d < 1 : d < 2) return false;
    }
    return true;
  }
  function dfs(p, prev, left) {
    if (++nodes > nodeCap || count >= cap) return;
    if (left === 0) { if (p === e) { count++; if (!first) first = path.slice(); } return; }
    if (p === e) return;
    let nxt = adj[p];
    if (partner[p] >= 0) { const q = partner[p]; if (vis[q]) { if (prev !== q) return; } else nxt = [q]; }
    if (!ok(p, left)) return;
    for (const q of nxt) if (!vis[q]) { vis[q] = 1; path.push(q); dfs(q, p, left - 1); path.pop(); vis[q] = 0; }
  }
  vis[s] = 1; dfs(s, -1, total - 1);
  return { count, first, capped: nodes > nodeCap };
}

// Walk a stored route ([floor, cell] steps) on the model. Returns an error
// string, or null when it is a real solution.
export function checkRoute(P, sol) {
  const M = mopModel(P);
  if (!Array.isArray(sol) || !sol.length) return 'no route';
  const ids = sol.map(([k, c]) => (M.floors[k] ? M.floors[k].node[c] : -1));
  if (ids.some((v) => v === undefined || v < 0)) return 'route steps on furniture or off the board';
  if (ids[0] !== M.start) return 'route does not start at the way in';
  if (ids[ids.length - 1] !== M.end) return 'route does not end at the way out';
  if (ids.length !== M.n) return `route is ${ids.length} tiles, the board has ${M.n}`;
  if (new Set(ids).size !== ids.length) return 'route repeats a tile';
  for (let i = 1; i < ids.length; i++) if (!M.adj[ids[i - 1]].includes(ids[i])) return `step ${i} is not a legal move`;
  return null;
}
