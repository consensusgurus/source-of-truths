// Numerical core for the Sports Ranking pages: the solvers the three pillars in
// lib/gridiron.js are built on. Pure functions, no imports, no data. Kept apart
// from the engine so the backtest harness and the verifier can drive the same
// code the page runs (scripts/verify-gridiron.mjs imports this file directly).
//
// Every rating here is on ONE scale: points better than an average team in the
// league on a neutral field. Margins are points, spreads are points, so nothing
// needs converting except the win rating (logits) and the models (ranks), and
// both of those are scaled by matching spread (see `scaleTo`).

// Dense symmetric solve, Gaussian elimination with partial pivoting. The
// largest system here is one row per FBS team, about 140, which is a few
// million flops and runs in milliseconds at build time.
export function solve(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c] || 1e-9;
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / d;
      if (!f) continue;
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
    x[r] = s / (M[r][r] || 1e-9);
  }
  return x;
}

const zeros = (n) => Array.from({ length: n }, () => new Array(n).fill(0));

/*
  ridgeLS(rows, n, { lam, fitH, tether, prev })

  Least squares over "margin rows": each row is { h, a, site, y, wt } meaning
  the home team `h` beat the away team `a` by `y` points (negative for a loss)
  with `site` = 1 at home, 0 on a neutral field. Minimizes

      sum wt * ( y - H*site - (x_h - x_a) )^2  +  lam * sum x^2
                                              +  tether * sum (x - prev)^2

  `lam` shrinks every team toward zero (one phantom game against an average
  team, decided by nothing, so a 1-0 team is not +40 in September). `tether`
  pulls toward last week's solution instead, which is what keeps a
  spread-implied rating determined when a week's lines cannot fix every team
  (a bye) and stops one odd line swinging a team six points. `fitH` adds home
  field as an unknown rather than assuming it; results and lines disagree on
  it (1.7 vs 2.4 in the NFL in 2025), so each pillar fits its own.
*/
export function ridgeLS(rows, n, { lam = 0, fitH = true, tether = 0, prev = null } = {}) {
  const dim = n + (fitH ? 1 : 0);
  const A = zeros(dim);
  const b = new Array(dim).fill(0);
  for (const r of rows) {
    const w = r.wt == null ? 1 : r.wt;
    const cols = [[r.h, 1], [r.a, -1]];
    if (fitH) cols.push([n, r.site]);
    for (const [i, ci] of cols) {
      b[i] += w * ci * r.y;
      for (const [j, cj] of cols) A[i][j] += w * ci * cj;
    }
  }
  for (let i = 0; i < n; i++) {
    A[i][i] += lam + tether;
    if (tether) b[i] += tether * (prev ? prev[i] : 0);
  }
  if (fitH) A[n][n] += 1e-6;
  const x = solve(A, b);
  return { x: x.slice(0, n), H: fitH ? x[n] : null };
}

/*
  bradleyTerry(rows, n, { lam, h })

  Win rating. Each row is { h, a, site, y } with y = 1 for a home win, 0 for a
  loss, 0.5 for a tie. P(home wins) = sigmoid(x_h - x_a + h*site). Penalized
  maximum likelihood by Newton's method, ridge `lam` on the ratings. Output is
  in logits; the engine rescales it to points against the margin rating.
*/
export function bradleyTerry(rows, n, { lam = 1, h = 0.3 } = {}) {
  const x = new Array(n).fill(0);
  for (let it = 0; it < 30; it++) {
    const A = zeros(n);
    const g = new Array(n).fill(0);
    for (const r of rows) {
      const z = x[r.h] - x[r.a] + h * r.site;
      const p = 1 / (1 + Math.exp(-z));
      const d = r.y - p;
      const w = p * (1 - p);
      g[r.h] += d; g[r.a] -= d;
      A[r.h][r.h] += w; A[r.a][r.a] += w; A[r.h][r.a] -= w; A[r.a][r.h] -= w;
    }
    for (let i = 0; i < n; i++) { g[i] -= lam * x[i]; A[i][i] += lam; }
    const step = solve(A, g);
    let mx = 0;
    for (let i = 0; i < n; i++) { x[i] += step[i]; mx = Math.max(mx, Math.abs(step[i])); }
    if (mx < 1e-6) break;
  }
  return x;
}

/*
  bradleyTerryFit(rows, n, { lam, h, tether, prev })

  The same model as `bradleyTerry` with two additions the baseball market
  pillar needs, kept separate so the football path is untouched:

  - `y` is a PROBABILITY rather than a result. The likelihood already takes a
    fractional target, so fitting to the market's devigged win probability is
    the same arithmetic as fitting to a win: it is a cross-entropy fit to what
    the money says instead of to what happened. Baseball prices a game with a
    moneyline, not a spread, so this is the only way the market's opinion
    reaches the ratings. (The runline is fixed at 1.5 with the price doing the
    work, so it carries almost no rating signal and is not a substitute.)
  - `tether` pulls the solution toward `prev`, the previous week's answer, the
    same quadratic penalty `ridgeLS` already uses. Without it a week whose
    lines happen to form a thin graph drifts.

  `wt` on a row weights it, which is what the recency window is made of.
*/
export function bradleyTerryFit(rows, n, { lam = 0, h = 0.1, tether = 0, prev = null } = {}) {
  const x = prev ? [...prev] : new Array(n).fill(0);
  for (let it = 0; it < 40; it++) {
    const A = zeros(n);
    const g = new Array(n).fill(0);
    for (const r of rows) {
      const wt = r.wt == null ? 1 : r.wt;
      const z = x[r.h] - x[r.a] + h * r.site;
      const p = 1 / (1 + Math.exp(-z));
      g[r.h] += wt * (r.y - p); g[r.a] -= wt * (r.y - p);
      const w = wt * p * (1 - p);
      A[r.h][r.h] += w; A[r.a][r.a] += w; A[r.h][r.a] -= w; A[r.a][r.h] -= w;
    }
    for (let i = 0; i < n; i++) {
      g[i] -= lam * x[i] + tether * (x[i] - (prev ? prev[i] : 0));
      A[i][i] += lam + tether;
    }
    const step = solve(A, g);
    let mx = 0;
    for (let i = 0; i < n; i++) { x[i] += step[i]; mx = Math.max(mx, Math.abs(step[i])); }
    if (mx < 1e-7) break;
  }
  return x;
}

// American odds -> implied probability, and the two-way devig that turns a
// pair of moneylines into one home win probability. The 2026 MLB board runs
// about a 4.1% overround, so this is never a rounding detail.
export const impliedProb = (american) => (american < 0 ? -american / (-american + 100) : 100 / (american + 100));
export function devigTwoWay(homeAmerican, awayAmerican) {
  const h = impliedProb(homeAmerican), a = impliedProb(awayAmerican);
  const s = h + a;
  return s > 0 ? h / s : 0.5;
}

export const mean = (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0);
export const sd = (v) => {
  if (v.length < 2) return 0;
  const m = mean(v);
  return Math.sqrt(v.reduce((a, b) => a + (b - m) * (b - m), 0) / v.length);
};
export const center = (v) => { const m = mean(v); return v.map((x) => x - m); };

// Rescale `v` so its spread matches `ref` (both centered). The one honest way
// to put a logit, a z-score or a quantile onto the points scale: match the
// spread of the thing that IS in points.
export function scaleTo(v, ref) {
  const s = sd(v), r = sd(ref);
  if (!s || !r) return v.map(() => 0);
  const m = mean(v);
  return v.map((x) => ((x - m) * r) / s);
}

/*
  quantileMap(rank, count, refSorted)

  Turn a RANK inside a list of `count` items into a value on the reference
  scale: the value a team at the same quantile of `refSorted` (descending)
  holds, linearly interpolated. This is how an ordinal source (a futures board,
  a model that publishes an order but not a number) is put onto the points
  scale without inventing gaps the source never stated: the gaps come from the
  market's own distribution.
*/
export function quantileMap(rank, count, refSorted) {
  const m = refSorted.length;
  if (!m) return 0;
  if (m === 1 || count <= 1) return refSorted[0];
  const pos = ((rank - 1) / (count - 1)) * (m - 1);
  const lo = Math.floor(pos), hi = Math.min(m - 1, lo + 1);
  const t = pos - lo;
  return refSorted[lo] * (1 - t) + refSorted[hi] * t;
}

// 1-based ranks, highest value first, ties broken by the tiebreak callback.
export function rankDesc(values, tiebreak) {
  const order = values.map((v, i) => i).sort((i, j) => values[j] - values[i] || (tiebreak ? tiebreak(i, j) : i - j));
  const r = new Array(values.length);
  order.forEach((i, k) => { r[i] = k + 1; });
  return r;
}

/*
  rankDescTied(values)

  COMPETITION ranking: equal values share the lower rank and the next rank
  skips past the group, with a flag saying which rows are shared. `rankDesc`
  above breaks a tie on array index, which is fine for a continuous rating and
  a fabrication for anything that genuinely ties. The cover-only CFB resume
  ties by construction (every team that beat its number by more than the cap
  lands on the cap), so the pillar rank columns use this instead. Same rule the
  composite and `rankSource` already follow: section 2d, ties are real and must
  render as ties.
*/
export function rankDescTied(values) {
  const order = values.map((v, i) => i).sort((i, j) => values[j] - values[i] || i - j);
  const rank = new Array(values.length);
  const tied = new Array(values.length).fill(false);
  for (let a = 0; a < order.length;) {
    let b = a;
    while (b + 1 < order.length && values[order[b + 1]] === values[order[a]]) b++;
    for (let k = a; k <= b; k++) { rank[order[k]] = a + 1; if (b > a) tied[order[k]] = true; }
    a = b + 1;
  }
  return { rank, tied };
}
