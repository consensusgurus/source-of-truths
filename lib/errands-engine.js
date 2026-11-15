// lib/errands-engine.js: the model for Errands, the daily route-planning puzzle.
// Shared by the client (app/errands/ErrandsClient.jsx), the generator
// (scripts/gen-errands.mjs) and the checker (scripts/verify-errands.mjs).
//
// A town is a grid of streets, W by H corners. You leave home at `start`
// (minutes from midnight), every block takes `per` minutes and every stop takes
// `stay`. `closed` lists blocks dug up for roadworks ([x1, y1, x2, y2]); the way
// round is found by breadth-first search. A route is the order the stops are
// visited in (indices into `stops`); the trip ends back at home.
// A rule is one of:
//   closes  { s, at }     arrive at stop s by `at`, or it is shut
//   opens   { s, at }     stop s cannot be done before `at`; arrive early and you wait
//   fresh   { s, m, what} be home within m minutes of leaving stop s
//   before  { a, b }      stop a comes before stop b

const key = (x, y) => `${x},${y}`;
const blocked = (P) => { const set = new Set(); for (const [a, b, c, d] of P.closed || []) { set.add(`${a},${b}|${c},${d}`); set.add(`${c},${d}|${a},${b}`); } return set; };

// The corners on the shortest way from one corner to another, both ends included, or null.
// Ties are broken the same way every time: east, west, south, north.
export function pathBetween(P, from, to) {
  const shut = blocked(P), prev = new Map([[key(from[0], from[1]), null]]), q = [from];
  for (let h = 0; h < q.length; h++) {
    const [x, y] = q[h];
    if (x === to[0] && y === to[1]) { const out = []; for (let k = key(x, y); k; k = prev.get(k)) out.push(k.split(',').map(Number)); return out.reverse(); }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (nx < 0 || ny < 0 || nx >= P.W || ny >= P.H || prev.has(k) || shut.has(`${x},${y}|${nx},${ny}`)) continue;
      prev.set(k, key(x, y)); q.push([nx, ny]);
    }
  }
  return null;
}
const memo = new WeakMap();
// Blocks between every pair of places: index 0..n-1 are the stops and n is home.
export function blocksOf(P) {
  if (memo.has(P)) return memo.get(P);
  const pts = P.stops.map((s) => s.at).concat([P.home]);
  const d = pts.map((a) => pts.map((b) => { const p = pathBetween(P, a, b); return p ? p.length - 1 : Infinity; }));
  memo.set(P, d); return d;
}

// Drive a route. `legs` has one entry per stop visited; `home` is when you would be
// back if you turned for home after the last of them.
export function walk(P, route) {
  const d = blocksOf(P), n = P.stops.length;
  let t = P.start, at = n, blocks = 0; const legs = [];
  for (const s of route) {
    const b = d[at][s], arrive = t + b * P.per;
    const opens = P.rules.filter((r) => r.t === 'opens' && r.s === s).reduce((m, r) => Math.max(m, r.at), 0);
    const begin = Math.max(arrive, opens), leave = begin + P.stay;
    legs.push({ s, blocks: b, arrive, wait: begin - arrive, leave });
    t = leave; at = s; blocks += b;
  }
  const homeBlocks = d[at][n];
  return { legs, blocks: blocks + homeBlocks, homeBlocks, home: t + homeBlocks * P.per, full: route.length === n };
}

// 'open' until the route says something about the rule, then 'ok' or 'bad'.
export function ruleState(P, route, r, w = walk(P, route)) {
  const leg = (s) => w.legs.find((l) => l.s === s);
  if (r.t === 'closes') { const l = leg(r.s); return !l ? 'open' : l.arrive <= r.at ? 'ok' : 'bad'; }
  if (r.t === 'opens') return leg(r.s) ? 'ok' : 'open';
  if (r.t === 'fresh') { const l = leg(r.s); if (!l) return 'open'; return w.home - l.leave > r.m ? 'bad' : w.full ? 'ok' : 'open'; }
  const ia = route.indexOf(r.a), ib = route.indexOf(r.b);
  if (ib >= 0 && (ia < 0 || ia > ib)) return 'bad';
  return ia >= 0 && ib >= 0 ? 'ok' : 'open';
}
export const valid = (P, route) => { if (route.length !== P.stops.length) return false; const w = walk(P, route); return P.rules.every((r) => ruleState(P, route, r, w) === 'ok'); };

// Every order that keeps every rule, soonest home first: [{ route, home }].
export function allValid(P) {
  const n = P.stops.length, out = [], route = [], used = new Array(n).fill(false);
  const go = () => {
    if (route.length === n) { const w = walk(P, route); if (P.rules.every((r) => ruleState(P, route, r, w) === 'ok')) out.push({ route: route.slice(), home: w.home }); return; }
    for (let s = 0; s < n; s++) {
      if (used[s]) continue;
      // an order that has already broken a closing time or a before rule cannot recover
      route.push(s); used[s] = true;
      const w = walk(P, route);
      if (!P.rules.some((r) => (r.t === 'closes' || r.t === 'before') && ruleState(P, route, r, w) === 'bad')) go();
      route.pop(); used[s] = false;
    }
  };
  go();
  return out.sort((a, b) => a.home - b.home);
}

export const clock = (m) => { const h = Math.floor(m / 60) % 24, mm = m % 60; return `${h % 12 === 0 ? 12 : h % 12}:${String(mm).padStart(2, '0')}`; };

// ---- the Errand Ladder ----
// Ranked on minutes behind the soonest possible time home.
export const RUNGS = ['Phileas Fogg', 'Mary Poppins', 'Courier', 'Soccer Parent', 'Sunday Driver', 'Scenic Route', 'Forgot the List', 'Back for the Milk'];
export const BOUNDS = [0, 4, 8, 16, 24, 36, 52];
export function rankOf(behind) {
  let at = BOUNDS.findIndex((x) => behind <= x); if (at < 0) at = RUNGS.length - 1;
  const rows = RUNGS.map((name, i) => {
    const lo = i === 0 ? 0 : BOUNDS[i - 1] + 1, hi = i < BOUNDS.length ? BOUNDS[i] : null;
    return { name, label: i === 0 ? 'The soonest possible' : hi == null ? `${lo} min or more behind` : `Up to ${hi} min behind` };
  });
  return { rows, at };
}
