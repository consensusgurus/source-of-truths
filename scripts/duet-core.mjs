// scripts/duet-core.mjs — the generator's engine for Duet, the daily
// balanced-grid puzzle (dots and rings, walled rooms).
//
// RULES. An n x n grid (n even) is filled with dots (1) and rings (0):
//   * every row and every column holds n/2 of each;
//   * every walled ROOM holds half of each (rooms are even-sized);
//   * no three alike in a line, across or down;
//   * an '=' mark between two neighbours means they match, an 'x' that they differ.
//
// The generator draws a full grid, cuts it into balanced rooms, then strips
// clues (printed squares and edge marks) while a GRADED logical solver can
// still finish the board. A board the solver finishes is unique by
// construction, because every step it takes is a sound deduction. The
// independent proof is scripts/verify-duet.mjs, which shares no code with
// this file.
//
// GRADING. Level 0 is the pencil work every player does: edge marks, the
// pair and gap rules (XX forces both ends, X_X forces the middle), a full
// line or room fills the rest. Level 1 is the line read: enumerate every
// legal pattern for a row or column given what is known and keep what they
// all agree on. `cost` is the number of squares first settled at level 1,
// which is the measured difficulty the weekday ramp is cut from.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LINE_CACHE = new Map();
export function lines(n) {
  if (LINE_CACHE.has(n)) return LINE_CACHE.get(n);
  const out = [];
  for (let m = 0; m < (1 << n); m++) {
    const p = [];
    let ones = 0;
    for (let i = 0; i < n; i++) { const b = (m >> i) & 1; p.push(b); ones += b; }
    if (ones !== n / 2) continue;
    let ok = true;
    for (let i = 0; i + 2 < n; i++) if (p[i] === p[i + 1] && p[i] === p[i + 2]) { ok = false; break; }
    if (ok) out.push(p);
  }
  LINE_CACHE.set(n, out);
  return out;
}

function shuffle(a, rnd) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function fullGrid(n, rnd) {
  const L = lines(n);
  const rows = [];
  const colsOk = () => {
    const k = rows.length;
    for (let c = 0; c < n; c++) {
      let s = 0;
      for (let r = 0; r < k; r++) s += rows[r][c];
      if (s > n / 2 || k - s > n / 2) return false;
      if (k >= 3 && rows[k - 1][c] === rows[k - 2][c] && rows[k - 2][c] === rows[k - 3][c]) return false;
    }
    return true;
  };
  const bt = () => {
    if (rows.length === n) return true;
    for (const p of shuffle(L.slice(), rnd)) {
      rows.push(p);
      if (colsOk() && bt()) return true;
      rows.pop();
    }
    return false;
  };
  bt();
  return rows.map((r) => r.slice());
}

// Grow rooms of the requested sizes; every room must be connected, even-sized
// and balanced in the solution. Returns an n x n id grid or null.
export function cutRooms(sol, rnd, sizes, tries = 400) {
  const n = sol.length;
  const D = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let t = 0; t < tries; t++) {
    const lab = sol.map((row) => row.map(() => -1));
    let id = 0, ok = true;
    for (;;) {
      const free = [];
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (lab[r][c] < 0) free.push([r, c]);
      if (!free.length) break;
      const deg = ([r, c]) => D.filter(([dr, dc]) => { const a = r + dr, b = c + dc; return a >= 0 && b >= 0 && a < n && b < n && lab[a][b] < 0; }).length;
      free.sort((x, y) => deg(x) - deg(y) || rnd() - 0.5);
      const s = free[0];
      let placed = false;
      for (let attempt = 0; attempt < 40 && !placed; attempt++) {
        const target = sizes[Math.floor(rnd() * sizes.length)];
        const grp = [s]; lab[s[0]][s[1]] = id;
        while (grp.length < target) {
          const fr = [];
          for (const [r, c] of grp) for (const [dr, dc] of D) { const a = r + dr, b = c + dc; if (a >= 0 && b >= 0 && a < n && b < n && lab[a][b] < 0) fr.push([a, b]); }
          if (!fr.length) break;
          const x = fr[Math.floor(rnd() * fr.length)];
          lab[x[0]][x[1]] = id; grp.push(x);
        }
        let ones = 0;
        for (const [r, c] of grp) ones += sol[r][c];
        if (grp.length >= 2 && grp.length % 2 === 0 && ones * 2 === grp.length) placed = true;
        else for (const [r, c] of grp) lab[r][c] = -1;
      }
      if (!placed) { ok = false; break; }
      id++;
    }
    if (ok) return lab;
  }
  return null;
}

// The graded solver. Returns { grid, solved, cost, contradiction }.
export function solve(p, { maxLevel = 1 } = {}) {
  const n = p.n;
  const g = Array.from({ length: n }, () => Array(n).fill(null));
  for (const [r, c, v] of p.givens) g[r][c] = v;
  const edges = p.edges;
  const rooms = new Map();
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { const id = p.rooms[r][c]; if (!rooms.has(id)) rooms.set(id, []); rooms.get(id).push([r, c]); }
  const edgeAt = new Map();
  for (const [a, b, c, d, t] of edges) { edgeAt.set(`${a},${b},${c},${d}`, t); edgeAt.set(`${c},${d},${a},${b}`, t); }
  const linesOf = [];
  for (let k = 0; k < n; k++) {
    linesOf.push(Array.from({ length: n }, (_, i) => [k, i]));
    linesOf.push(Array.from({ length: n }, (_, i) => [i, k]));
  }
  let cost = 0;
  const set = (r, c, v) => {
    if (g[r][c] === null) { g[r][c] = v; return 1; }
    if (g[r][c] !== v) throw new Error('contradiction');
    return 0;
  };
  const L = lines(n);
  try {
    for (;;) {
      let ch = 0;
      // level 0
      for (const [a, b, c, d, t] of edges) {
        const x = g[a][b], y = g[c][d];
        if (x !== null && y === null) ch += set(c, d, t === '=' ? x : 1 - x);
        else if (y !== null && x === null) ch += set(a, b, t === '=' ? y : 1 - y);
      }
      for (const cells of linesOf) {
        for (let i = 0; i + 1 < n; i++) {
          const [r1, c1] = cells[i], [r2, c2] = cells[i + 1];
          const x = g[r1][c1], y = g[r2][c2];
          if (x !== null && x === y) {
            if (i > 0) { const [r0, c0] = cells[i - 1]; ch += set(r0, c0, 1 - x); }
            if (i + 2 < n) { const [r3, c3] = cells[i + 2]; ch += set(r3, c3, 1 - x); }
          }
        }
        for (let i = 0; i + 2 < n; i++) {
          const [r1, c1] = cells[i], [rm, cm] = cells[i + 1], [r3, c3] = cells[i + 2];
          const x = g[r1][c1];
          if (x !== null && x === g[r3][c3]) ch += set(rm, cm, 1 - x);
        }
        for (const v of [0, 1]) {
          let cnt = 0;
          for (const [r, c] of cells) if (g[r][c] === v) cnt++;
          if (cnt > n / 2) throw new Error('contradiction');
          if (cnt === n / 2) for (const [r, c] of cells) if (g[r][c] === null) ch += set(r, c, 1 - v);
        }
      }
      for (const cells of rooms.values()) {
        for (const v of [0, 1]) {
          let cnt = 0;
          for (const [r, c] of cells) if (g[r][c] === v) cnt++;
          if (cnt > cells.length / 2) throw new Error('contradiction');
          if (cnt === cells.length / 2) for (const [r, c] of cells) if (g[r][c] === null) ch += set(r, c, 1 - v);
        }
      }
      if (ch) continue;
      if (maxLevel < 1) break;
      // level 1: the line read
      let ch1 = 0;
      for (const cells of linesOf) {
        const cur = cells.map(([r, c]) => g[r][c]);
        if (!cur.includes(null)) continue;
        const ok = [];
        for (const pat of L) {
          let good = true;
          for (let i = 0; i < n && good; i++) if (cur[i] !== null && cur[i] !== pat[i]) good = false;
          for (let i = 0; i + 1 < n && good; i++) {
            const [r1, c1] = cells[i], [r2, c2] = cells[i + 1];
            const t = edgeAt.get(`${r1},${c1},${r2},${c2}`);
            if (t && ((t === '=') !== (pat[i] === pat[i + 1]))) good = false;
          }
          if (good) ok.push(pat);
        }
        if (!ok.length) throw new Error('contradiction');
        for (let i = 0; i < n; i++) {
          if (cur[i] !== null) continue;
          if (ok.every((q) => q[i] === ok[0][i])) { const [r, c] = cells[i]; ch1 += set(r, c, ok[0][i]); }
        }
        if (ch1) break; // one line read at a time, then back to pencil work
      }
      cost += ch1;
      if (!ch1) break;
    }
  } catch (e) {
    return { grid: g, solved: false, cost, contradiction: true };
  }
  const solved = g.every((row) => row.every((v) => v !== null));
  return { grid: g, solved, cost, contradiction: false };
}

// Every neighbouring pair as an edge mark that matches the solution.
export function allEdges(sol) {
  const n = sol.length, out = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (c + 1 < n) out.push([r, c, r, c + 1, sol[r][c] === sol[r][c + 1] ? '=' : 'x']);
    if (r + 1 < n) out.push([r, c, r + 1, c, sol[r][c] === sol[r + 1][c] ? '=' : 'x']);
  }
  return out;
}

// Strip clues while the solver (at maxLevel) still finishes. Start from a
// random subset of edge marks plus every square; drop squares first so a
// board leans on marks and rooms rather than printed squares.
export function minimise(n, sol, rooms, rnd, { maxLevel, edgeFrac }) {
  let givens = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) givens.push([r, c, sol[r][c]]);
  let edges = shuffle(allEdges(sol), rnd).slice(0, Math.round(allEdges(sol).length * edgeFrac));
  const ok = (gv, ed) => solve({ n, rooms, givens: gv, edges: ed }, { maxLevel }).solved;
  const order = shuffle(givens.map((x) => ['g', x]), rnd).concat(shuffle(edges.map((x) => ['e', x]), rnd));
  for (const [kind, item] of order) {
    if (kind === 'g') {
      const gv = givens.filter((x) => x !== item);
      if (ok(gv, edges)) givens = gv;
    } else {
      const ed = edges.filter((x) => x !== item);
      if (ok(givens, ed)) edges = ed;
    }
  }
  return { givens, edges };
}

export function makeBoard(n, seed, { sizes, maxLevel, edgeFrac }) {
  const rnd = mulberry32(seed);
  const sol = fullGrid(n, rnd);
  const rooms = cutRooms(sol, rnd, sizes);
  if (!rooms) return null;
  // renumber rooms in reading order so ids are stable and compact
  const map = new Map(); let next = 0;
  const R = rooms.map((row) => row.map((id) => { if (!map.has(id)) map.set(id, next++); return map.get(id); }));
  const { givens, edges } = minimise(n, sol, R, rnd, { maxLevel, edgeFrac });
  const res = solve({ n, rooms: R, givens, edges }, { maxLevel: 1 });
  if (!res.solved) return null;
  givens.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  edges.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || a[3] - b[3]);
  return { n, rooms: R, roomCount: next, givens, edges, sol, cost: res.cost };
}
