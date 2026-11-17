// lib/plow-engine.js: the model of a Plow town (owner, 2026-11-17: the winter
// sibling of Mop and Mow, "plowing snow filled streets"). A town is a street
// map, not a grid: corners (nodes) joined by streets (edges) that may run
// straight, bend, cut across a block on a diagonal, cross the river on a bridge,
// or run out to a cul-de-sac and back (a `court`, a loop on one corner). The
// player plows every street exactly once, corner to corner, from the depot to
// the salt barn: an Euler trail. A town is dealt only when the depot and the barn
// are its ONLY corners with an odd number of streets and every street is joined
// up, which guarantees a trail exists (many do; the clock decides the board).
//
// Pure ESM with no imports, so the board, the generator (scripts/gen-plow.mjs),
// the checker (scripts/verify-plow.mjs) and the share card all share it.

export const COURT_STEM = 92, COURT_R = 25;

export const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
export const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
export const mul = (p, k) => [p[0] * k, p[1] * k];
export const len = (p) => Math.hypot(p[0], p[1]);
export const norm = (p) => { const l = len(p) || 1; return [p[0] / l, p[1] / l]; };
export const perp = (p) => [-p[1], p[0]];

// The drawn line of a street, as points. A court runs out its stem, round the
// circle and back, so plowing it is one move that ends where it began.
export function edgePoly(T, e) {
  const A = T.nodes[e.a];
  if (e.court) {
    const u = e.court, S = add(A, mul(u, COURT_STEM)), C = courtCentre(T, e);
    const pts = [A, S];
    const t0 = Math.atan2(S[1] - C[1], S[0] - C[0]);
    for (let k = 1; k <= 28; k++) { const t = t0 + (Math.PI * 2 * k) / 28; pts.push([C[0] + COURT_R * Math.cos(t), C[1] + COURT_R * Math.sin(t)]); }
    pts.push(A);
    return pts;
  }
  const B = T.nodes[e.b];
  if (!e.bend) return [A, B];
  const m = mul(add(A, B), 0.5), n = perp(norm(sub(B, A))), ctl = add(m, mul(n, e.bend * 2));
  const pts = [];
  for (let k = 0; k <= 16; k++) { const t = k / 16, s = 1 - t; pts.push([s * s * A[0] + 2 * s * t * ctl[0] + t * t * B[0], s * s * A[1] + 2 * s * t * ctl[1] + t * t * B[1]]); }
  return pts;
}
export const courtCentre = (T, e) => add(T.nodes[e.a], mul(e.court, COURT_STEM + COURT_R));

export function cumLen(P) { const c = [0]; for (let i = 1; i < P.length; i++) c.push(c[i - 1] + len(sub(P[i], P[i - 1]))); return c; }
export function pointAt(P, C, s) {
  const L = C[C.length - 1]; s = Math.max(0, Math.min(L, s));
  let i = 1; while (i < C.length - 1 && C[i] < s) i++;
  const seg = C[i] - C[i - 1] || 1, t = (s - C[i - 1]) / seg;
  return { p: add(P[i - 1], mul(sub(P[i], P[i - 1]), t)), dir: norm(sub(P[i], P[i - 1])) };
}
export function segDist(q, a, b) {
  const ab = sub(b, a), t = Math.max(0, Math.min(1, ((q[0] - a[0]) * ab[0] + (q[1] - a[1]) * ab[1]) / ((ab[0] ** 2 + ab[1] ** 2) || 1)));
  return len(sub(q, add(a, mul(ab, t))));
}
// distance from q to a polyline, ignoring its first `skip` units
export function polyDist(q, P, skip = 0) {
  let best = Infinity; const C = cumLen(P);
  for (let i = 1; i < P.length; i++) {
    if (C[i] <= skip) continue;
    const a = C[i - 1] < skip ? pointAt(P, C, skip).p : P[i - 1];
    best = Math.min(best, segDist(q, a, P[i]));
  }
  return best;
}
export const pathD = (P) => 'M' + P.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L');
export const other = (e, n) => (e.a === n ? e.b : e.a);
export const riverY = (x, R) => R.y + 16 * Math.sin(x / 150) + 8 * Math.sin(x / 53 + 1);

// Everything the board, the art and the checker read off a town.
export function plowModel(T) {
  const E = T.edges.map((e, i) => {
    const P = edgePoly(T, e), C = cumLen(P);
    return { ...e, i, P, C, L: C[C.length - 1] };
  });
  const inc = {};
  E.forEach((e) => {
    (inc[e.a] = inc[e.a] || []).push(e.i);
    if (e.b !== e.a) (inc[e.b] = inc[e.b] || []).push(e.i);
  });
  const pts = Object.values(T.nodes);
  const W = Math.max(...pts.map((p) => p[0])), H = Math.max(...pts.map((p) => p[1]));
  const X0 = Math.min(...pts.map((p) => p[0])), Y0 = Math.min(...pts.map((p) => p[1]));
  const vb = [X0 - T.pad.l, Y0 - T.pad.t, W - X0 + T.pad.l + T.pad.r, H - Y0 + T.pad.t + T.pad.b];
  const S0 = T.nodes[T.start], E0 = T.nodes[T.end];
  const apronS = [S0, add(S0, mul(T.startDir, 78))], apronE = [E0, add(E0, mul(T.endDir, 78))];
  return { T, E, inc, X0, Y0, W, H, vb, apronS, apronE, n: E.length };
}
// a street as drawn from corner `from`
export const oriented = (e, from) => (e.a === from ? e.P : e.P.slice().reverse());

// Walk a route (a list of street indices) from the depot. Returns where the
// truck stands, or an error naming the first bad step.
export function walk(T, route) {
  let cur = T.start; const used = new Set();
  for (let k = 0; k < route.length; k++) {
    const e = T.edges[route[k]];
    if (!e) return { err: `step ${k + 1}: no street ${route[k]}` };
    if (used.has(route[k])) return { err: `step ${k + 1}: street ${route[k]} plowed twice` };
    if (e.a !== cur && e.b !== cur) return { err: `step ${k + 1}: street ${route[k]} does not touch ${cur}` };
    used.add(route[k]); cur = e.a === cur ? e.b : e.a;
  }
  return { cur, used };
}
export function checkRoute(T, route) {
  const w = walk(T, route);
  if (w.err) return w.err;
  if (route.length !== T.edges.length) return `route plows ${route.length} of ${T.edges.length} streets`;
  if (w.cur !== T.end) return `route ends at ${w.cur}, not the barn ${T.end}`;
  return null;
}
export function degrees(T) {
  const d = {};
  T.edges.forEach((e) => { d[e.a] = (d[e.a] || 0) + 1; d[e.b] = (d[e.b] || 0) + 1; });
  return d;
}
// One trail through every street (Hierholzer), or null.
export function eulerTrail(T) {
  const adj = {}, used = new Set();
  T.edges.forEach((e, i) => { (adj[e.a] = adj[e.a] || []).push(i); if (e.b !== e.a) (adj[e.b] = adj[e.b] || []).push(i); });
  const st = [[T.start, null]], out = [];
  while (st.length) {
    const [v] = st[st.length - 1];
    const nx = (adj[v] || []).find((i) => !used.has(i));
    if (nx === undefined) out.push(st.pop());
    else { used.add(nx); const e = T.edges[nx]; st.push([e.a === v ? e.b : e.a, nx]); }
  }
  out.reverse();
  const route = out.slice(1).map((x) => x[1]);
  return checkRoute(T, route) ? null : route;
}
