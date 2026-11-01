// scripts/connect-solver.mjs: counts the solutions of a Connect board (numberlink:
// join each pair of matching dots with one path, paths never cross, every
// square used), up to a cap. Shared by scripts/gen-connect.mjs and
// scripts/verify-connect.mjs, so the uniqueness the copy promises is proved by
// the same search that the generator used and re-run independently on the bank.
//
// board: { n, dots: [[r0,c0,r1,c1], ...] }  (colour i joins its two dots)
// returns { count, nodes, aborted }  count is capped at `cap`.
export function countWire(board, { cap = 2, maxNodes = 2e6 } = {}) {
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
  const isGoal = new Int16Array(N).fill(-1);
  dots.forEach(([r0, c0, r1, c1], k) => {
    const a = r0 * n + c0, b = r1 * n + c1;
    cell[a] = k; cell[b] = k; head[k] = a; goal[k] = b; isGoal[b] = k;
  });
  let count = 0, nodes = 0, aborted = false;

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
    for (let r = 0; r < rid; r++) {
      let ok = false;
      for (const k of regHas[r]) {
        // the region must be enterable from k's head AND left to k's goal
        let h = false, g = false;
        for (const j of nb[head[k]]) if (cell[j] === -1 && reg[j] === r) { h = true; break; }
        for (const j of nb[goal[k]]) if (cell[j] === -1 && reg[j] === r) { g = true; break; }
        if (h && g) { ok = true; break; }
      }
      if (!ok) return false;
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
        if (!self) out.push(j);
      }
    }
    return out;
  }

  function rec() {
    if (count >= cap || aborted) return;
    if (++nodes > maxNodes) { aborted = true; return; }
    let best = -1, bestM = null;
    let open = 0;
    for (let k = 0; k < K; k++) {
      if (done[k]) continue;
      open++;
      const m = moves(k);
      if (!m.length) return;
      if (!bestM || m.length < bestM.length) { best = k; bestM = m; if (m.length === 1) break; }
    }
    if (!open) {
      for (let i = 0; i < N; i++) if (cell[i] === -1) return;
      count++; return;
    }
    const k = best, h = head[k];
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
  return { count, nodes, aborted };
}
