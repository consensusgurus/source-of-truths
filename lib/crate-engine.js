// Crate engine: the warehouse model, moves, and an exact solver, shared by the
// page (app/crate/CrateClient.jsx), the generator (scripts/gen-crate.mjs) and
// the checker (scripts/verify-crate.mjs). Sokoban rules: walk up, down, left or
// right; walk into a crate to push it one square if the square beyond it is
// floor and empty; never pull; never push two crates at once.
//
// A board is `map`, one string a row:
//   '#' wall   ' ' floor   '.' spot   '$' crate   '*' crate on a spot
//   '@' worker   '+' worker on a spot   '-' outside the warehouse (drawn as nothing)
// Floor the worker cannot reach from the start is treated as outside.

export const DIRS = { U: [0, -1], R: [1, 0], D: [0, 1], L: [-1, 0] };
export const DIR_KEYS = ['U', 'R', 'D', 'L'];

export function parseMap(map) {
  const H = map.length, W = Math.max(...map.map((r) => r.length));
  const wall = new Uint8Array(W * H), goal = new Uint8Array(W * H);
  const boxes = []; let player = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = map[y][x] || '-', i = y * W + x;
    if (c === '#') wall[i] = 1;
    if (c === '.' || c === '*' || c === '+') goal[i] = 1;
    if (c === '$' || c === '*') boxes.push(i);
    if (c === '@' || c === '+') player = i;
  }
  // inside = reachable from the worker through anything but walls
  const inside = new Uint8Array(W * H);
  if (player >= 0) {
    const q = [player]; inside[player] = 1;
    while (q.length) {
      const c = q.pop(), x = c % W, y = (c - x) / W;
      for (const k of DIR_KEYS) {
        const nx = x + DIRS[k][0], ny = y + DIRS[k][1];
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const n = ny * W + nx;
        if (inside[n] || wall[n]) continue;
        inside[n] = 1; q.push(n);
      }
    }
  }
  boxes.sort((a, b) => a - b);
  const goals = [];
  for (let i = 0; i < W * H; i++) if (goal[i]) goals.push(i);
  return { W, H, wall, goal, inside, goals, boxes, player };
}

const stepOf = (W, k) => DIRS[k][0] + DIRS[k][1] * W;
const open = (M, i) => i >= 0 && i < M.W * M.H && M.inside[i] && !M.wall[i];

// One move. Returns the new state, or null when the move is blocked.
// state: { p, boxes } with boxes a sorted array of cell indices.
export function tryMove(M, st, k) {
  const d = stepOf(M.W, k), x = st.p % M.W, nx = x + DIRS[k][0];
  if (nx < 0 || nx >= M.W) return null;
  const n = st.p + d;
  if (!open(M, n)) return null;
  const bi = st.boxes.indexOf(n);
  if (bi < 0) return { p: n, boxes: st.boxes, pushed: false };
  const bx = nx + DIRS[k][0];
  if (bx < 0 || bx >= M.W) return null;
  const b2 = n + d;
  if (!open(M, b2) || st.boxes.includes(b2)) return null;
  const boxes = st.boxes.slice(); boxes[bi] = b2; boxes.sort((a, b) => a - b);
  return { p: n, boxes, pushed: true };
}

export const solvedState = (M, boxes) => boxes.every((b) => M.goal[b]);

// Replay a move string (UDLR) from the board's start. Returns the final state
// with move and push counts, or null if any move is blocked.
export function replay(M, path) {
  let st = { p: M.player, boxes: M.boxes.slice() }, pushes = 0;
  for (const k of path) {
    const n = tryMove(M, st, k);
    if (!n) return null;
    if (n.pushed) pushes++;
    st = n;
  }
  return { ...st, moves: path.length, pushes, solved: solvedState(M, st.boxes) };
}

// Squares a lone crate could still be pushed to a spot from (pulling backwards
// from every spot). A crate anywhere else can never be placed.
export function liveSquares(M) {
  const live = new Uint8Array(M.W * M.H), q = [];
  for (const g of M.goals) { live[g] = 1; q.push(g); }
  while (q.length) {
    const b = q.pop();
    for (const k of DIR_KEYS) {
      const d = stepOf(M.W, k), p = b + d, p2 = p + d; // box pulled from b to p by a worker moving p -> p2
      if (!open(M, p) || !open(M, p2) || live[p]) continue;
      if (Math.abs((p2 % M.W) - (b % M.W)) > 2) continue;
      live[p] = 1; q.push(p);
    }
  }
  return live;
}

// Exact fewest-moves solver (breadth-first over worker square and crates).
// Returns { moves, pushes, path } with the fewest pushes among the fewest-move
// lines found first, or null if the board cannot be solved within `cap` states.
export function solve(M, cap = 4e6) {
  const live = liveSquares(M);
  if (M.boxes.some((b) => !live[b])) return null;
  const key = (p, b) => p + ':' + b.join(',');
  const startKey = key(M.player, M.boxes);
  const prev = new Map([[startKey, null]]);
  let frontier = [{ p: M.player, boxes: M.boxes, k: startKey }];
  while (frontier.length) {
    const next = [];
    for (const s of frontier) {
      if (solvedState(M, s.boxes)) {
        let path = '', c = s.k;
        while (prev.get(c)) { const [pk, mv] = prev.get(c); path = mv + path; c = pk; }
        const r = replay(M, path);
        return { moves: path.length, pushes: r.pushes, path };
      }
      for (const k of DIR_KEYS) {
        const n = tryMove(M, s, k);
        if (!n) continue;
        if (n.pushed && !live[n.p + stepOf(M.W, k)]) continue;
        const nk = key(n.p, n.boxes);
        if (prev.has(nk)) continue;
        prev.set(nk, [s.k, k]);
        if (prev.size > cap) return null;
        next.push({ p: n.p, boxes: n.boxes, k: nk });
      }
    }
    frontier = next;
  }
  return null;
}

// Shortest walk (no pushing) from the worker to a square, as a move string, or null.
export function walkTo(M, st, target) {
  if (st.p === target) return '';
  const prev = new Map([[st.p, null]]), q = [st.p];
  while (q.length) {
    const c = q.shift();
    for (const k of DIR_KEYS) {
      const x = c % M.W, nx = x + DIRS[k][0];
      if (nx < 0 || nx >= M.W) continue;
      const n = c + stepOf(M.W, k);
      if (prev.has(n) || !open(M, n) || st.boxes.includes(n)) continue;
      prev.set(n, [c, k]);
      if (n === target) {
        let path = '', z = n;
        while (prev.get(z)) { const [pc, mv] = prev.get(z); path = mv + path; z = pc; }
        return path;
      }
      q.push(n);
    }
  }
  return null;
}

// EXACT DISTANCES BY RUNNING SOKOBAN BACKWARDS. One breadth-first search from
// every solved warehouse (crates on the spots, the worker anywhere) that walks
// and PULLS, over every (crates, worker) state at once, in typed arrays. The
// distance it finds for a state is the exact fewest moves to solve it forward.
// Used by the generator to deal a board and by the checker to confirm `best`.
// Feasible while C(floor, crates) x floor stays under ~60 million.
const binoms = (() => { const B = []; for (let n = 0; n <= 128; n++) { B[n] = new Float64Array(9); B[n][0] = 1; for (let k = 1; k <= 8; k++) B[n][k] = n === 0 ? 0 : B[n - 1][k - 1] + B[n - 1][k]; } return B; })();
export function stateCount(M) {
  let F = 0; for (let i = 0; i < M.W * M.H; i++) if (M.inside[i] && !M.wall[i]) F++;
  return binoms[F][M.goals.length] * F;
}
export function exactDistances(M) {
  const cells = []; const fi = new Int32Array(M.W * M.H).fill(-1);
  for (let i = 0; i < M.W * M.H; i++) if (M.inside[i] && !M.wall[i]) { fi[i] = cells.length; cells.push(i); }
  const F = cells.length, n = M.goals.length;
  const nb = new Int32Array(F * 4).fill(-1);
  for (let f = 0; f < F; f++) DIR_KEYS.forEach((k, j) => {
    const c = cells[f], x = c % M.W, nx = x + DIRS[k][0];
    if (nx < 0 || nx >= M.W) return;
    const m = c + stepOf(M.W, k); if (m >= 0 && m < M.W * M.H && fi[m] >= 0) nb[f * 4 + j] = fi[m];
  });
  const C = binoms[F][n];
  // combos in colex order: rank(c0<c1<..) = sum binom(ci, i+1)
  const combos = new Uint8Array(C * n), cur = Array.from({ length: n }, (_, i) => i);
  for (let r = 0; r < C; r++) {
    for (let i = 0; i < n; i++) combos[r * n + i] = cur[i];
    let i = 0; while (i < n - 1 && cur[i] + 1 === cur[i + 1]) { cur[i] = i; i++; } cur[i]++;
  }
  const rank = (arr) => { let r = 0; for (let i = 0; i < n; i++) r += binoms[arr[i]][i + 1]; return r; };
  const S = C * F, dist = new Int16Array(S).fill(-1), q = new Int32Array(S);
  let qh = 0, qt = 0;
  const g = M.goals.map((c) => fi[c]).sort((a, b) => a - b), g0 = rank(g), gset = new Set(g);
  for (let p = 0; p < F; p++) if (!gset.has(p)) { dist[g0 * F + p] = 0; q[qt++] = g0 * F + p; }
  const occ = new Uint8Array(F), tmp = new Array(n);
  while (qh < qt) {
    const s = q[qh++], cr = (s / F) | 0, p = s - cr * F, d = dist[s] + 1, base = cr * n;
    for (let i = 0; i < n; i++) occ[combos[base + i]] = 1;
    for (let j = 0; j < 4; j++) {
      const p2 = nb[p * 4 + j]; if (p2 < 0 || occ[p2]) continue;
      // walk p -> p2
      const w = cr * F + p2; if (dist[w] < 0) { dist[w] = d; q[qt++] = w; }
      // pull: the crate behind p (opposite j) comes to p as the worker steps to p2
      const b = nb[p * 4 + ((j + 2) & 3)];
      if (b >= 0 && occ[b]) {
        for (let i = 0; i < n; i++) { const c = combos[base + i]; tmp[i] = c === b ? p : c; }
        tmp.sort((a, z) => a - z);
        const t = rank(tmp) * F + p2; if (dist[t] < 0) { dist[t] = d; q[qt++] = t; }
      }
    }
    for (let i = 0; i < n; i++) occ[combos[base + i]] = 0;
  }
  return { F, n, cells, fi, nb, combos, dist, rank, gset };
}
// Fewest moves from the board's start, by exactDistances, and one such line.
export function bestLine(M, X = exactDistances(M)) {
  const { F, n, fi, nb, combos, dist, rank, cells } = X;
  let boxes = M.boxes.map((c) => fi[c]).sort((a, b) => a - b), p = fi[M.player];
  let d = dist[rank(boxes) * F + p];
  if (d < 0) return null;
  const moves = d; let path = '', pushes = 0;
  while (d > 0) {
    let best = null;
    for (let j = 0; j < 4; j++) {
      const p2 = nb[p * 4 + j]; if (p2 < 0) continue;
      const bi = boxes.indexOf(p2);
      if (bi < 0) { if (dist[rank(boxes) * F + p2] === d - 1) { best = { p2, boxes, j, push: false }; break; } continue; }
      const b2 = nb[p2 * 4 + j]; if (b2 < 0 || boxes.includes(b2)) continue;
      const nbx = boxes.slice(); nbx[bi] = b2; nbx.sort((a, z) => a - z);
      if (dist[rank(nbx) * F + p2] === d - 1 && !best) best = { p2, boxes: nbx, j, push: true };
    }
    path += DIR_KEYS[best.j]; if (best.push) pushes++;
    p = best.p2; boxes = best.boxes; d--;
  }
  return { moves, pushes, path, cells, combos };
}
