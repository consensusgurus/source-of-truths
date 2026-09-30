// The adaptive engine for the /iq tests. Pure functions, no React, so the
// verifier can import exactly what the page runs.
//
// THE MODEL is the one scripts/iq/calibrate.mjs fitted the difficulties with,
// and it has to be: scoring a person under a different curve from the one the
// items were measured under would put the two on different scales.
//
//   P(right | theta, b) = C + (U - C) * sigmoid(A * (theta - b))
//
// ABILITY is estimated as the posterior MEAN over a grid (expected a
// posteriori) with a standard normal prior, which is the player field itself:
// before a single answer, a reader is assumed to be a typical Mind Loft
// player. The posterior SD is the "plus or minus" on the result card.
//
// SELECTION takes the item carrying the most information at the current
// estimate, but draws at random among the few best so two readers at the same
// level do not see the same thirty questions in the same order, and it will
// not serve the same lane twice running when another lane is nearly as good.

export const GRID = (() => { const g = []; for (let t = -5; t <= 5.0001; t += 0.05) g.push(Math.round(t * 100) / 100); return g; })();

function sig(x) { return 1 / (1 + Math.exp(-x)); }

export function pCorrect(model, theta, b) {
  return model.C + (model.U - model.C) * sig(model.A * (theta - b));
}

export function info(model, theta, b) {
  const s = sig(model.A * (theta - b));
  const p = model.C + (model.U - model.C) * s;
  const dp = (model.U - model.C) * model.A * s * (1 - s);
  return (dp * dp) / (p * (1 - p));
}

/** Posterior over GRID given answers [{b, right}]. Returns { mean, sd }. */
export function estimate(model, answers) {
  const logp = GRID.map((t) => -0.5 * t * t);
  for (const a of answers) {
    for (let i = 0; i < GRID.length; i += 1) {
      const p = pCorrect(model, GRID[i], a.b);
      logp[i] += Math.log(a.right ? p : 1 - p);
    }
  }
  const m = Math.max(...logp);
  const w = logp.map((l) => Math.exp(l - m));
  const z = w.reduce((s, x) => s + x, 0);
  let mean = 0;
  for (let i = 0; i < GRID.length; i += 1) mean += GRID[i] * w[i];
  mean /= z;
  let v = 0;
  for (let i = 0; i < GRID.length; i += 1) v += (GRID[i] - mean) ** 2 * w[i];
  return { mean, sd: Math.sqrt(v / z) };
}

/**
 * The next item. `theta` is the current estimate, `used` the ids already
 * asked, `lastLane` the lane just asked. `rand` is injectable so a test can be
 * replayed deterministically.
 */
export function nextItem(model, pool, theta, used, lastLane, rand = Math.random) {
  const open = pool.filter((it) => !used.has(it.id));
  if (!open.length) return null;
  const scored = open.map((it) => ({ it, i: info(model, theta, it.b) * (it.lane && it.lane === lastLane ? 0.7 : 1) }));
  scored.sort((a, b) => b.i - a.i);
  const top = scored.slice(0, Math.min(5, scored.length));
  return top[Math.floor(rand() * top.length)].it;
}

/** The player-normed IQ-shaped reading of an estimate. */
export function reading({ mean, sd }) {
  const iq = Math.round(100 + 15 * mean);
  const pm = Math.max(1, Math.round(15 * sd));
  const pct = normCdf(mean) * 100;
  return { iq, pm, pct };
}

// Abramowitz and Stegun 7.1.26, good to about 1e-7, which is far finer than a
// percentile is ever printed.
export function normCdf(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x * x) / 2);
  return x >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}

/** "99th", "1st", "42nd". Below 1 reads "1st", above 99 reads "99th". */
export function ordinalPct(pct) {
  const n = Math.max(1, Math.min(99, Math.floor(pct)));
  const tens = n % 100;
  const suf = tens >= 11 && tens <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
  return `${n}${suf}`;
}
