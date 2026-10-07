import { SOLID_TILES } from '../lib/dario-engine.js';
const H = 14;
export function analyze(L) {
  const W = L.W; const g = L.g.map((r) => r.slice());
  // moving platforms: model every tile they sweep across as a standing surface
  for (const p of (L.plats || [])) {
    const T = 16;
    if (p.ax === 'x') { const row = Math.round(p.y0 / T); for (let x = Math.floor((p.x0 - p.r) / T); x <= Math.floor((p.x0 + p.r + p.w - 1) / T); x++) if (g[row] && g[row][x] === '.') g[row][x] = '='; }
    else { for (const yy of [p.y0 - p.r, p.y0 + p.r]) { const row = Math.round(yy / T); for (let x = Math.floor(p.x0 / T); x <= Math.floor((p.x0 + p.w - 1) / T); x++) if (g[row] && g[row][x] === '.') g[row][x] = '='; } }
  }
  const S = (x, y) => { if (x < 0 || x >= W) return true; if (y < 0) return false; if (y >= H) return false; const c = g[y][x]; return c === '=' || SOLID_TILES.includes(c); };
  const stand = (x, y) => x >= 0 && x < W && y >= 1 && y < H && S(x, y) && !S(x, y - 1);
  const key = (x, y) => x * 100 + y;
  const nodes = []; for (let x = 0; x < W; x++) for (let y = 1; y < H; y++) if (stand(x, y)) nodes.push([x, y]);
  const runup = (x, y, dir) => { let n = 0; for (let k = 1; k <= 3; k++) if (stand(x - dir * k, y)) n++; else break; return n >= 2; };
  function edges(x, y) {
    const out = [];
    for (const dir of [-1, 1]) {
      if (stand(x + dir, y)) out.push([x + dir, y]);
      // jumps (and walking off / falling with drift)
      const RU = runup(x, y, dir);
      for (let dx = 1; dx <= (RU ? 7 : 4); dx++) {
        const tx = x + dir * dx; if (tx < 0 || tx >= W) break;
        for (let ty = 1; ty < H; ty++) {
          if (!stand(tx, ty)) continue;
          const rise = y - ty;
          const R = RU ? 4 : 3;
          if (rise > R) continue;
          const top = Math.min(y, ty) - 2; // the arc's peak row (feet), roughly
          let ok = true;
          // headroom over the take-off column
          for (let r = y - 1; r >= Math.max(0, Math.min(ty, y) - 2) && ok; r--) if (S(x, r)) ok = false;
          // the columns crossed must be clear at the arc height
          for (let k = 1; k <= dx && ok; k++) { const cx = x + dir * k; const lo = Math.min(y, ty) - 1; if (S(cx, lo) || (rise > 0 && S(cx, lo - 1) && k < dx)) ok = false; }
          if (rise < 0) { // falling: the landing column must be open down to the surface
            for (let r = Math.max(0, y - 1); r < ty && ok; r++) if (S(tx, r)) ok = false;
          }
          if (ok) out.push([tx, ty]);
          if (rise <= 0) break; // only the first surface below counts when falling
        }
      }
    }
    return out;
  }
  const adj = new Map(); const radj = new Map();
  for (const [x, y] of nodes) { const k = key(x, y); adj.set(k, edges(x, y).map(([a, b]) => key(a, b))); }
  for (const [k, vs] of adj) for (const v of vs) { if (!radj.has(v)) radj.set(v, []); radj.get(v).push(k); }
  const bfs = (starts, A) => { const seen = new Set(starts); const q = [...starts]; while (q.length) { const k = q.shift(); for (const v of (A.get(k) || [])) if (!seen.has(v)) { seen.add(v); q.push(v); } } return seen; };
  const start = key(2, 12);
  const fromStart = bfs([start], adj);
  const goals = []; for (let x = L.gateX - 1; x <= L.gateX + 2; x++) if (stand(x, 12)) goals.push(key(x, 12));
  const toGoal = bfs(goals, radj);
  const traps = [...fromStart].filter((k) => !toGoal.has(k)).map((k) => [Math.floor(k / 100), k % 100]);
  return { reachable: goals.some((k) => fromStart.has(k)), traps };
}
