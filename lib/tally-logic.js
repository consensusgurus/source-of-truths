// Tally's human solver: the deductions a person makes at the board, and only
// those. Shared by the generator (scripts/gen-tally.mjs), which keeps a board
// only when this finishes it, and the client, whose hint places the square
// these deductions settle next. scripts/verify-daily-banks.mjs proves the same
// property with its own, separately written solver.
//
// Two kinds of step, in the order a player reaches for them:
//   single  a row or column with ONE open square left: the square takes the
//           remainder (the target minus everything already in the line).
//   sweep   every way to fill a line from the tiles still on the rack, given
//           what each square can still be; a digit no way puts in a square is
//           crossed off it, a square left with one digit takes it, and a digit
//           with exactly as many tiles left as squares that can hold it goes
//           into all of them (the rack count).
// Nothing else: no trial and error, no looking two lines ahead at once. A board
// this finishes has exactly one solution, because every step is forced.

export function lineList(p) {
  const N = p.size, out = [];
  for (let k = 0; k < N; k++) {
    const row = { kind: 'row', idx: k, cells: [], t: p.rowT[k] };
    const col = { kind: 'col', idx: k, cells: [], t: p.colT[k] };
    for (let j = 0; j < N; j++) {
      if (!p.blocked[k][j]) { if (p.given[k][j]) row.t -= p.given[k][j]; else row.cells.push(k * N + j); }
      if (!p.blocked[j][k]) { if (p.given[j][k]) col.t -= p.given[j][k]; else col.cells.push(j * N + k); }
    }
    out.push(row, col);
  }
  return out;
}

// Lines that open with exactly one empty square: the board's way in.
export function starterLines(p) {
  return lineList(p).filter((L) => L.cells.length === 1);
}

// solve(p, placed?) -> { solved, order: [{ i, v, how }], singles, sweeps, hard }
// `placed` (optional) is a Map of square -> digit already known to be right.
export function solve(p, placed) {
  const N = p.size;
  const lines = lineList(p);
  const open = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!p.blocked[r][c] && !p.given[r][c]) open.push(r * N + c);
  const counts = Array(10).fill(0);
  for (const v of p.bank) counts[v]++;
  const val = new Map();
  const cand = new Map();
  for (const i of open) { const s = new Set(); for (let v = 1; v <= 9; v++) if (counts[v]) s.add(v); cand.set(i, s); }
  const order = [];
  let singles = 0, hard = 0, sweeps = 0;
  const put = (i, v, how) => {
    if (val.has(i)) return;
    val.set(i, v); counts[v]--; cand.set(i, new Set([v]));
    order.push({ i, v, how });
    if (how === 'single') singles++; else hard++;
  };
  if (placed) for (const [i, v] of placed) { if (cand.has(i) && counts[v] > 0) { val.set(i, v); counts[v]--; cand.set(i, new Set([v])); } }
  const rem = (L) => { let s = L.t; const o = []; for (const i of L.cells) { if (val.has(i)) s -= val.get(i); else o.push(i); } return { s, o }; };

  for (let guard = 0; guard < 400; guard++) {
    if (open.every((i) => val.has(i))) break;
    // 1. singles
    let moved = false;
    for (const L of lines) {
      const { s, o } = rem(L);
      if (o.length === 1 && s >= 1 && s <= 9 && counts[s] > 0) { put(o[0], s, 'single'); moved = true; }
    }
    if (moved) continue;
    // 2. a sweep
    sweeps++;
    let pruned = false;
    for (const i of open) if (!val.has(i)) for (const v of [...cand.get(i)]) if (!counts[v]) { cand.get(i).delete(v); pruned = true; }
    for (const L of lines) {
      const { s, o } = rem(L);
      if (!o.length) continue;
      const seen = o.map(() => new Set());
      const cnt = counts.slice();
      const asg = [];
      const rec = (k, left) => {
        if (k === o.length) { if (left === 0) for (let q = 0; q < o.length; q++) seen[q].add(asg[q]); return; }
        for (const v of cand.get(o[k])) {
          if (!cnt[v] || v > left) continue;
          cnt[v]--; asg[k] = v; rec(k + 1, left - v); cnt[v]++;
        }
      };
      rec(0, s);
      o.forEach((i, q) => { for (const v of [...cand.get(i)]) if (!seen[q].has(v)) { cand.get(i).delete(v); pruned = true; } });
    }
    for (const i of open) {
      if (val.has(i)) continue;
      const c = cand.get(i);
      if (c.size === 0) return { solved: false, order, singles, sweeps, hard, stuck: true };
      if (c.size === 1) { const v = [...c][0]; if (counts[v] > 0) { put(i, v, 'sweep'); moved = true; } }
    }
    if (moved) continue;
    for (let v = 1; v <= 9; v++) {
      if (!counts[v]) continue;
      const able = open.filter((i) => !val.has(i) && cand.get(i).has(v));
      if (able.length === counts[v]) { for (const i of able) put(i, v, 'count'); moved = true; break; }
    }
    if (moved || pruned) continue;
    break;
  }
  const solved = open.every((i) => val.has(i));
  return { solved, order, singles, sweeps, hard };
}
