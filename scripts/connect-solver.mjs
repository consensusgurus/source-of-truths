// scripts/connect-solver.mjs: counts the solutions of a Connect board (numberlink:
// join each pair of matching dots with one path, paths never cross, every
// square used), up to a cap. Shared by scripts/gen-connect.mjs and
// scripts/verify-connect.mjs, so the uniqueness the copy promises is proved by
// the same search that the generator used and re-run independently on the bank.
//
// board: { n, dots: [[r0,c0,r1,c1], ...], walls?: [[r,c], ...] }
//   colour i joins its two dots; a wall square is blocked (no line enters it,
//   and it is not one of the squares that must be used)
// returns { count, nodes, branches, aborted, grid }  count is capped at `cap`;
//   grid (with `keep: true`) is the first solution, square by square: colour, -2 blocked
//   branches  search nodes with more than one way on, after every forced move:
//             the generator's measure of how much a board makes you think
export function countWire(board, { cap = 2, maxNodes = 2e6, touch = false, keep = false } = {}) {
  const { n, dots } = board;
  const N = n * n;
  const K = dots.length;
  const cell = new Int16Array(N).fill(-1); // colour occupying the square, or -1
  const head = new Int32Array(K);
  const goal = new Int32Array(K);
  const done = new Uint8Array(K);
  const nb = [];
  for (let i = 0; i < N; i++) {
    const r = Math.floor(i / n), c = i % n, a = [];
    if (r > 0) a.push(i - n); if (r < n - 1) a.push(i + n); if (c > 0) a.push(i - 1); if (c < n - 1) a.push(i + 1);
    nb.push(a);
  }
  for (const [r, c] of board.walls || []) cell[r * n + c] = -2; // blocked
  const isGoal = new Int16Array(N).fill(-1);
  dots.forEach(([r0, c0, r1, c1], k) => {
    const a = r0 * n + c0, b = r1 * n + c1;
    cell[a] = k; cell[b] = k; head[k] = a; goal[k] = b; isGoal[b] = k;
  });
  let count = 0, nodes = 0, branches = 0, aborted = false, grid = null;

  // A square can still be joined from `k` if it is empty, or it is k's goal.
  function feasible() {
    // 1. every empty square needs two usable neighbours (empty, or an open head / open goal)
    for (let i = 0; i < N; i++) {
      if (cell[i] !== -1) continue;
      let open = 0;
      for (const j of nb[i]) {
        const cj = cell[j];
        if (cj === -1) open++;
        else if (!done[cj] && (head[cj] === j || goal[cj] === j)) open++;
        if (open >= 2) break;
      }
      if (open < 2) return false;
    }
    // 2. every open colour's head can still reach its goal through empty squares,
    //    and every empty region touches some open colour (else it is stranded)
    const reg = new Int32Array(N).fill(-1);
    let rid = 0;
    const regHas = [];
    for (let i = 0; i < N; i++) {
      if (cell[i] !== -1 || reg[i] !== -1) continue;
      const st = [i]; reg[i] = rid; const touch = new Set();
      while (st.length) {
        const x = st.pop();
        for (const j of nb[x]) {
          if (cell[j] === -1) { if (reg[j] === -1) { reg[j] = rid; st.push(j); } }
          else if (!done[cell[j]] && (head[cell[j]] === j || goal[cell[j]] === j)) touch.add(cell[j]);
        }
      }
      regHas.push(touch); rid++;
    }
    // chessboard balance: a line through a region steps black, white, black ...,
    // so each line that fills part of it can make up at most one square of
    // imbalance, and a region only one line can fill must start and end on the
    // right colours.
    const bw = new Int32Array(rid);
    for (let i = 0; i < N; i++) if (cell[i] === -1) bw[reg[i]] += ((Math.floor(i / n) + i % n) & 1) ? -1 : 1;
    const used = new Int32Array(K).fill(-1);
    for (let r = 0; r < rid; r++) {
      let m = 0, only = -1;
      for (const k of regHas[r]) {
        // the region must be enterable from k's head AND left to k's goal
        let h = false, g = false;
        for (const j of nb[head[k]]) if (cell[j] === -1 && reg[j] === r) { h = true; break; }
        for (const j of nb[goal[k]]) if (cell[j] === -1 && reg[j] === r) { g = true; break; }
        if (h && g) { m++; only = k; }
      }
      if (!m || Math.abs(bw[r]) > m) return false;
      if (m === 1) {
        // one line fills the whole region, entering beside its head, leaving beside its goal
        if (used[only] !== -1) return false; // it cannot fill two regions
        used[only] = r;
        const col = (i) => (((Math.floor(i / n) + i % n) & 1) ? -1 : 1);
        const hs = new Set(), gs = new Set();
        for (const j of nb[head[only]]) if (cell[j] === -1 && reg[j] === r) hs.add(col(j));
        for (const j of nb[goal[only]]) if (cell[j] === -1 && reg[j] === r) gs.add(col(j));
        if (bw[r] !== 0) { if (!hs.has(bw[r]) || !gs.has(bw[r])) return false; }
        else if (!((hs.has(1) && gs.has(-1)) || (hs.has(-1) && gs.has(1)))) return false;
      }
    }
    for (let k = 0; k < K; k++) {
      if (done[k]) continue;
      if (nb[head[k]].includes(goal[k])) continue;
      let ok = false;
      const hs = new Set(); for (const j of nb[head[k]]) if (cell[j] === -1) hs.add(reg[j]);
      for (const j of nb[goal[k]]) if (cell[j] === -1 && hs.has(reg[j])) { ok = true; break; }
      if (!ok) return false;
    }
    return true;
  }

  function moves(k) {
    const out = [];
    for (const j of nb[head[k]]) {
      if (j === goal[k]) out.push(j);
      else if (cell[j] === -1) {
        // never let a path touch itself (a square beside two of its own squares
        // other than through the head): such a path can always be rerouted, so
        // it is never part of a solution counted here as distinct.
        let self = 0;
        for (const t of nb[j]) if (t !== head[k] && cell[t] === k && t !== goal[k]) self++;
        if (!self || touch) out.push(j);
      }
    }
    return out;
  }

  function rec() {
    if (count >= cap || aborted) return;
    if (++nodes > maxNodes) { aborted = true; return; }
    let best = -1, bestM = null, bestFlip = false;
    let open = 0;
    for (let k = 0; k < K; k++) {
      if (done[k]) continue;
      open++;
      let m = moves(k), flip = false;
      if (!m.length) return;
      if (m.length > 1) {
        // work from whichever end of the line has fewer ways on
        let t = head[k]; head[k] = goal[k]; goal[k] = t;
        const m2 = moves(k);
        t = head[k]; head[k] = goal[k]; goal[k] = t;
        if (!m2.length) return;
        if (m2.length < m.length) { m = m2; flip = true; }
      }
      if (!bestM || m.length < bestM.length) { best = k; bestM = m; bestFlip = flip; if (m.length === 1) break; }
    }
    if (!open) {
      for (let i = 0; i < N; i++) if (cell[i] === -1) return;
      if (keep && !count) grid = Array.from(cell);
      count++; return;
    }
    const k = best;
    if (bestFlip) { const t = head[k]; head[k] = goal[k]; goal[k] = t; }
    const h = head[k];
    if (bestM.length > 1) branches++;
    try { expand(k, h); } finally { if (bestFlip) { const t = head[k]; head[k] = goal[k]; goal[k] = t; } }
  }
  function expand(k, h) {
    const bestM = moves(k);
    for (const j of bestM) {
      if (j === goal[k]) {
        done[k] = 1;
        if (feasible()) rec();
        done[k] = 0;
      } else {
        cell[j] = k; head[k] = j;
        if (feasible()) rec();
        cell[j] = -1; head[k] = h;
      }
      if (count >= cap || aborted) return;
    }
  }
  if (feasible()) rec();
  return { count, nodes, branches, aborted, grid };
}

