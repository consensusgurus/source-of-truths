#!/usr/bin/env node
// Generator for the Paths bank (app/paths/puzzles.js).
//
// APPEND ONLY. This script never rewrites a board that already exists: it reads
// the bank, takes the day after its last `live` date, and builds forward from
// there. There is no whole-bank mode any more, and that is deliberate.
//
// WHY THERE IS NO WHOLE-BANK MODE (2026-09-06). The previous version of this
// file rebuilt the entire calendar from a fixed START and filled its Monday to
// Wednesday slots by RECYCLING boards out of the bank it was about to
// overwrite (`OLD.filter(p => p.num > 2 && !p.sunday)`, taken in bank order and
// re-emitted with `cliffs: []` and `rails: []`). That made it non-reproducible
// the moment it had run once:
//
//   * the spare list is drawn from the CURRENT bank, so the second run pulls a
//     different set of boards than the first. Re-running it today hands the
//     2026-08-10 tier 1 slot board #3 - a Thursday tier 2 board with 7 cliff
//     lanes - and strips its cliffs, which leaves `par` and `sol` describing a
//     board that no longer exists. #5's real data is nothing like it.
//   * every banked tier 1 board carries 36 or 25 ridge dots, and this file's
//     tier 1 spec asks makeHills for 34 (two blobs of 17). No run of this
//     generator's tier 1 path can produce the tier 1 boards in the bank; they
//     came from a launch bank that is no longer in the tree.
//
// So scripts/_extfull.mjs ("regenerate longer, keep the tail, prove the prefix
// came back byte-identical") cannot be used here - its prefix proof would fail,
// correctly. Tail generation is the only honest mode, and this is it.
//
//   node scripts/gen-paths.mjs <untilISO> [--apply]
//
// Without --apply it writes the rows to /tmp/build/paths-tail.txt and stops.
// With --apply it splices them in before the bank's closing `];`, touching not
// one byte before that point. Finished boards are cached in
// /tmp/build/paths-cache.jsonl so a search that runs out of wall clock resumes;
// CLEAR that file when you change anything in this script.
//
// DETERMINISM. Every board draws from rng(SEED_BASE + num * SEED_STEP), so the
// seed is offset by the board number and the new segment cannot replay the
// frozen one (the launch run walked 20260806 + k*7919; this one starts far
// above it). An unchanged run on an unchanged bank reproduces byte for byte.
//
// ---------------------------------------------------------------------------
// THE RAMP
//
// Boards ramp across the week. Monday to Wednesday is the original terrain
// (open 1, ridge 2, river crossing 3). Thursday adds CLIFFS, lanes that cannot
// be laid at all. Friday and Saturday add OLD TRACK, disused line that costs
// nothing if you route along it, and a ninth town. Sunday is a 13x13 Edition
// with eleven towns and every element on one board.
//
// ---------------------------------------------------------------------------
// A FLOOR IS NOT A TARGET, AND POOL VARIETY HAS A CEILING
//
// verify-paths.mjs checks every board on its own: par is exact, terrain is
// load-bearing, greedy is at least the tier's margin over par. It caps NOTHING
// across the run, so 117 nine-town lattices can all be the same puzzle wearing
// different coordinates and the verifier will pass every one of them. These
// ceilings are this generator's answer, and they are enforced here, on the new
// segment, against the whole bank where the axis is a board fingerprint.
//
//   Unique across the WHOLE bank (frozen boards included), never repeated:
//     * the river profile  `n|rx`          - no two boards get the same river
//     * the ridge footprint `n|hills`      - no two boards get the same hills
//     * the town set        `n|terms`      - no two boards get the same towns
//
//   Within the new segment, per tier, at most CAP = ceil(0.40 x that tier's
//   new-board count) boards may share:
//     * the same `par`
//     * the same greedy-over-par gap
//     * the same river start column rx[0]
//     * a gap sitting EXACTLY on the tier's floor
//   and at most ceil(0.50 x count) may share the same number of river jogs.
//
//   A FLOOR IS NOT A TARGET. Ceilings alone would still let the run pile up on
//   the cheapest legal board, because a gap of exactly 5 is roughly half of
//   everything the search turns up (tier 1: 94 of 184 hits in a 6000-seed
//   sample; tier 3: 25 of 41). So each board is ALSO handed a target gap of
//   `tier floor + LADDER[k]`, walking a fixed cycle down its tier, and the
//   search will not accept a board under it. LADDER is a design decision about
//   how the week should feel, not a floor: when a target is not reachable in
//   that tier's seed budget the generator steps it down one and SAYS SO in the
//   log, and it never steps below the tier's own gate.
//
//   Across the new segment as a whole, at most ceil(0.40 x total) boards may
//   put the depot in the same quadrant of the lattice.
//
// The pool those ceilings draw on is the parameter BAND each tier searches:
// ridge size, cliff length, old-track chain count, town separation and how many
// towns must sit on the far bank all jitter per board (see SPEC). When the
// search stalls, widen a band - never widen a ceiling and never lower a tier
// gate. A looser gate ships a worse board every day after it; a bigger pool
// does not.
//
// Nothing is trusted downstream: scripts/verify-paths.mjs re-solves every board
// this writes, from scratch, with an independent solver.
import { PUZZLES as OLD } from '../app/paths/puzzles.js';
import fs from 'fs';

// ---------- rng ----------
function rng(seed) {
  let s = seed >>> 0;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const pick = (r, a) => a[(r() * a.length) | 0];
const shuffle = (r, a) => { const o = a.slice(); for (let i = o.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; [o[i], o[j]] = [o[j], o[i]]; } return o; };
const between = (r, lo, hi) => lo + ((r() * (hi - lo + 1)) | 0);

const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
const nbrOf = (n) => (i) => {
  const x = i % n, y = (i / n) | 0, o = [];
  if (x > 0) o.push(i - 1);
  if (x < n - 1) o.push(i + 1);
  if (y > 0) o.push(i - n);
  if (y < n - 1) o.push(i + n);
  return o;
};

// ---------- pricing ----------
// A cliff is not a price, it is a wall: the lane is gone. Everything else is
// 0 for old track, 3 for a crossing, 2 when BOTH ends stand on a ridge, else 1.
const INF = 0x3fffffff;
function pricer({ hills, bridges, rails, cliffs }) {
  const H = new Set(hills), B = new Set(bridges), R = new Set(rails), C = new Set(cliffs);
  return (a, b) => {
    const k = key(a, b);
    if (C.has(k)) return INF;
    if (R.has(k)) return 0;
    if (B.has(k)) return 3;
    return H.has(a) && H.has(b) ? 2 : 1;
  };
}

// ---------- exact Steiner tree (Dreyfus-Wagner), with the tree ----------
// Lane prices are baked into a flat array first, four slots per dot in the
// order left, right, up, down, with INF where there is no neighbour or a cliff
// blocks the way. The solver then never calls a pricing closure, and asking
// "what if this one lane were banned" is a two-slot patch on a copy.
//
// `cap` is the reason this is fast enough to search 13x13 boards. Lane prices
// are non-negative, so every sub-tree of a network costing <= cap also costs
// <= cap: dropping any dp value above cap loses nothing that could have been
// part of an answer at or under it. Ask "is there a network at or under C" and
// the whole table above C never gets built. Callers that need the exact number
// pass a cap they already know par cannot exceed (greedy minus the tier gap),
// and a return of INF then means "worse than the cap", which is a rejection.
const DX = [-1, 1, 0, 0], DY = [0, 0, -1, 1];
function weightsFor(n, cost) {
  const V = n * n, W = new Int32Array(V * 4).fill(INF);
  for (let i = 0; i < V; i++) {
    const x = i % n, y = (i / n) | 0;
    for (let d = 0; d < 4; d++) {
      const nx = x + DX[d], ny = y + DY[d];
      if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
      W[i * 4 + d] = cost(i, ny * n + nx);
    }
  }
  return W;
}
function patched(W, n, a, b, val) {
  const out = W.slice();
  const set = (u, v) => {
    const ux = u % n, uy = (u / n) | 0, vx = v % n, vy = (v / n) | 0;
    for (let d = 0; d < 4; d++) if (ux + DX[d] === vx && uy + DY[d] === vy) out[u * 4 + d] = val;
  };
  set(a, b); set(b, a);
  return out;
}

const NONE = 0, MERGE = 1, GROW = 2;
function steinerW(n, terms, W, wantTree, cap = INF) {
  const K = terms.length, V = n * n, F = (1 << K) - 1;
  const dp = [], pt = [], pa = [];
  for (let m = 0; m <= F; m++) {
    dp.push(new Int32Array(V).fill(INF));
    if (wantTree) { pt.push(new Uint8Array(V)); pa.push(new Int32Array(V).fill(-1)); }
  }
  terms.forEach((t, k) => { dp[1 << k][t] = 0; });
  // a lazy binary heap: cheap to push, and a stale entry is just skipped
  const hd = new Int32Array(V * 6), hv = new Int32Array(V * 6);
  for (let m = 1; m <= F; m++) {
    const d = dp[m];
    for (let s = (m - 1) & m; s > 0; s = (s - 1) & m) {
      const o = m ^ s;
      if (s > o) continue;
      const a = dp[s], b = dp[o];
      for (let v = 0; v < V; v++) {
        const c = a[v] + b[v];
        if (c <= cap && c < d[v]) { d[v] = c; if (wantTree) { pt[m][v] = MERGE; pa[m][v] = s; } }
      }
    }
    let hn = 0;
    const push = (dist, v) => {
      let i = hn++;
      hd[i] = dist; hv[i] = v;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (hd[p] <= hd[i]) break;
        const td = hd[p], tv = hv[p]; hd[p] = hd[i]; hv[p] = hv[i]; hd[i] = td; hv[i] = tv;
        i = p;
      }
    };
    for (let v = 0; v < V; v++) if (d[v] < INF) push(d[v], v);
    const done = new Uint8Array(V);
    while (hn > 0) {
      const bd = hd[0], u = hv[0];
      hn--;
      if (hn > 0) {
        hd[0] = hd[hn]; hv[0] = hv[hn];
        let i = 0;
        for (;;) {
          const l = 2 * i + 1, r = l + 1;
          let sm = i;
          if (l < hn && hd[l] < hd[sm]) sm = l;
          if (r < hn && hd[r] < hd[sm]) sm = r;
          if (sm === i) break;
          const td = hd[sm], tv = hv[sm]; hd[sm] = hd[i]; hv[sm] = hv[i]; hd[i] = td; hv[i] = tv;
          i = sm;
        }
      }
      if (done[u] || bd > d[u]) continue;
      done[u] = 1;
      const ux = u % n, uy = (u / n) | 0;
      for (let dir = 0; dir < 4; dir++) {
        const w = W[u * 4 + dir];
        if (w >= INF) continue;
        const v = (uy + DY[dir]) * n + (ux + DX[dir]);
        const c = d[u] + w;
        if (c <= cap && c < d[v]) { d[v] = c; if (wantTree) { pt[m][v] = GROW; pa[m][v] = u; } push(c, v); }
      }
    }
  }
  let best = INF, root = -1;
  for (let v = 0; v < V; v++) if (dp[F][v] < best) { best = dp[F][v]; root = v; }
  if (!wantTree) return best;
  if (best >= INF) return { cost: INF, sol: [] };
  const edges = new Map();
  (function walk(m, v) {
    if (pt[m][v] === MERGE) { const s = pa[m][v]; walk(s, v); walk(m ^ s, v); return; }
    if (pt[m][v] === GROW) { const u = pa[m][v]; edges.set(key(u, v), [Math.min(u, v), Math.max(u, v)]); walk(m, u); }
  })(F, root);
  return { cost: best, sol: [...edges.values()] };
}

// the obvious approach: link the nearest unlinked town, one at a time
function greedyCost(n, terms, cost) {
  const nbr = nbrOf(n), V = n * n, D = {};
  for (const t of terms) {
    const d = new Float64Array(V).fill(Infinity); d[t] = 0;
    const seen = new Uint8Array(V);
    for (let it = 0; it < V; it++) {
      let u = -1, b = Infinity;
      for (let v = 0; v < V; v++) if (!seen[v] && d[v] < b) { b = d[v]; u = v; }
      if (u < 0) break;
      seen[u] = 1;
      for (const w of nbr(u)) { const c = cost(u, w); if (c < INF && d[u] + c < d[w]) d[w] = d[u] + c; }
    }
    D[t] = d;
  }
  const inT = [terms[0]], rest = terms.slice(1);
  let tot = 0;
  while (rest.length) {
    let bi = 0, bc = Infinity;
    rest.forEach((t, i) => { const c = Math.min(...inT.map((s) => D[s][t])); if (c < bc) { bc = c; bi = i; } });
    if (!isFinite(bc)) return Infinity;
    tot += bc; inT.push(rest.splice(bi, 1)[0]);
  }
  return tot;
}

function connected(n, cost) {
  const nbr = nbrOf(n), V = n * n, seen = new Uint8Array(V), q = [0];
  seen[0] = 1; let c = 1;
  while (q.length) { const u = q.pop(); for (const w of nbr(u)) if (!seen[w] && cost(u, w) < INF) { seen[w] = 1; c++; q.push(w); } }
  return c === V;
}

// ---------- terrain ----------
// The river runs down a gap and steps sideways at most one column per row.
// Every lane it cuts, the horizontal one per row and the vertical one at each
// jog, is a crossing, so the barrier never has a free gap in it. `jog` is how
// restless it is, and it jitters per board so the run does not settle on one
// river shape.
function makeRiver(r, n, jog) {
  const lo = 2, hi = n - 2;
  let x = between(r, lo, hi);
  const rx = [x];
  for (let y = 1; y < n; y++) {
    const step = r() < jog ? (r() < 0.5 ? -1 : 1) : 0;
    x = Math.max(lo, Math.min(hi, x + step));
    rx.push(x);
  }
  const bridges = [];
  for (let y = 0; y < n; y++) {
    bridges.push(key(y * n + rx[y] - 1, y * n + rx[y]));
    if (y < n - 1) {
      const d = rx[y + 1] - rx[y];
      if (d === -1) bridges.push(key(y * n + rx[y] - 1, (y + 1) * n + rx[y] - 1));
      if (d === 1) bridges.push(key(y * n + rx[y], (y + 1) * n + rx[y]));
    }
  }
  return { rx, bridges: [...new Set(bridges)] };
}

// Ridges, grown as blobs so they read as landforms rather than confetti. The
// blob count jitters too: two fat ranges and three smaller ones are different
// boards to play even at the same ridge budget.
function makeHills(r, n, want, blobs) {
  const nbr = nbrOf(n), out = new Set();
  for (let b = 0; b < blobs; b++) {
    const seed = (1 + ((r() * (n - 2)) | 0)) + n * (1 + ((r() * (n - 2)) | 0));
    const blob = new Set([seed]);
    const target = Math.round(want / blobs);
    let guard = 0;
    while (blob.size < target && guard++ < 4000) {
      const from = pick(r, [...blob]);
      const to = pick(r, nbr(from));
      blob.add(to);
    }
    blob.forEach((v) => out.add(v));
  }
  return [...out].sort((a, b) => a - b);
}

// A cliff is a straight run of blocked lanes, drawn like a short wall, so it
// reads as a scarp and never as scattered missing lanes.
function makeCliffs(r, n, count, banned) {
  const out = [];
  let guard = 0;
  while (out.length < count && guard++ < 900) {
    const len = 2 + ((r() * 3) | 0);
    const vertical = r() < 0.5;
    const run = [];
    if (vertical) {           // a wall between two columns: block horizontal lanes
      const x = 1 + ((r() * (n - 2)) | 0);
      const y0 = (r() * (n - len)) | 0;
      for (let y = y0; y < y0 + len; y++) run.push(key(y * n + x - 1, y * n + x));
    } else {                  // a wall between two rows: block vertical lanes
      const y = 1 + ((r() * (n - 2)) | 0);
      const x0 = (r() * (n - len)) | 0;
      for (let x = x0; x < x0 + len; x++) run.push(key((y - 1) * n + x, y * n + x));
    }
    if (run.some((k) => banned.has(k) || out.includes(k))) continue;
    out.push(...run);
  }
  return out;
}

// Old track: a contiguous run of lanes that costs nothing, biased toward the
// ridge, because a disused line already cut through the hard ground.
function makeRails(r, n, chains, banned, hills) {
  const nbr = nbrOf(n), H = new Set(hills), out = [];
  let guard = 0;
  while (out.length < chains * 4 && guard++ < 900) {
    let v = (r() * n * n) | 0;
    const run = [], seen = new Set([v]);
    const len = 4 + ((r() * 3) | 0);
    let ok = true;
    for (let s = 0; s < len; s++) {
      const cand = shuffle(r, nbr(v)).filter((w) => !seen.has(w) && !banned.has(key(v, w)) && !out.includes(key(v, w)));
      cand.sort((a, b) => (H.has(b) && H.has(v) ? 1 : 0) - (H.has(a) && H.has(v) ? 1 : 0));
      if (!cand.length) { ok = false; break; }
      const w = cand[0];
      run.push(key(v, w)); seen.add(w); v = w;
    }
    if (!ok || run.length < 4) continue;
    out.push(...run);
  }
  return out;
}

// Towns are not scattered evenly. The depot sits on one bank and a group of
// towns sits on the other, which is what makes the obvious answer wrong: link
// them one at a time and you pay the river once per town, where the cheapest
// network crosses once and fans out.
function spreadTerms(r, n, count, cost, rx, minSep, farSide) {
  const V = n * n;
  const side = (v) => ((v % n) < rx[(v / n) | 0] ? 0 : 1);
  const open = (v) => nbrOf(n)(v).some((w) => cost(v, w) < INF);
  let guard = 0;
  while (guard++ < 6000) {
    const t = [];
    const pool = shuffle(r, Array.from({ length: V }, (_, i) => i));
    for (const v of pool) {
      if (t.length >= count) break;
      const x = v % n, y = (v / n) | 0;
      if (t.some((u) => Math.abs(u % n - x) + Math.abs(((u / n) | 0) - y) < minSep)) continue;
      if (!open(v)) continue;   // walled in
      t.push(v);
    }
    if (t.length !== count) continue;
    if (farSide) {
      const home = side(t[0]);
      const far = t.slice(1).filter((v) => side(v) !== home).length;
      if (far < farSide) continue;
    }
    return t;
  }
  return null;
}

// ---------- one candidate board ----------
// gap    how far over par the obvious connect-the-nearest-town network has to be
// sep    how close two towns may sit
// far    towns that must sit on the far bank from the depot
// ridge/onRail/bite  how many decisions par is forced to get right
// Everything written lo..hi is a BAND, drawn per board: that band is the pool
// the variety ceilings above draw on. Widen a band when the search stalls.
// Boards from this date on are in scope for the pool-variety ceilings; the
// launch bank predates the rule and the past is frozen. verify-paths.mjs holds
// the same constant, and the two must move together.
const VARIETY_FROM = '2026-10-05';

const SPEC = {
  1: { n: 9,  towns: 8,  hills: [22, 40], blobs: [2, 3], cliffs: [0, 0],  chains: [0, 0], sep: [2, 3], far: [2, 4], gap: 5, ridge: 3, onRail: 0, bite: 0, jog: [0.20, 0.55], label: 'open, ridge, river' },
  2: { n: 9,  towns: 8,  hills: [20, 36], blobs: [2, 3], cliffs: [5, 9],  chains: [0, 0], sep: [2, 3], far: [2, 4], gap: 5, ridge: 3, onRail: 0, bite: 2, jog: [0.20, 0.55], label: '+ cliffs' },
  3: { n: 9,  towns: 9,  hills: [18, 34], blobs: [2, 3], cliffs: [5, 9],  chains: [1, 2], sep: [2, 3], far: [2, 4], gap: 5, ridge: 3, onRail: 2, bite: 2, jog: [0.20, 0.55], label: '+ old track' },
  4: { n: 13, towns: 11, hills: [44, 66], blobs: [2, 4], cliffs: [8, 13], chains: [2, 3], sep: [2, 3], far: [3, 5], gap: 6, ridge: 5, onRail: 3, bite: 3, jog: [0.25, 0.60], label: 'Sunday, everything' },
};

// The variety ledger. `pre` is what the frozen bank already spends on the
// axes that must never repeat at all; the per-tier counters below it only ever
// see boards this run adds.
function makeLedger(newRows) {
  const seenRiver = new Set(), seenHills = new Set(), seenTerms = new Set();
  for (const p of OLD) {
    seenRiver.add(`${p.n}|${p.rx.join(',')}`);
    seenHills.add(`${p.n}|${p.hills.slice().sort((a, b) => a - b).join(',')}`);
    seenTerms.add(`${p.n}|${p.terms.slice().sort((a, b) => a - b).join(',')}`);
  }
  // The ceilings are counted over every board from VARIETY_FROM on, banked or
  // about to be, not over this run's rows alone: verify-paths.mjs counts the
  // same window, so a second extension cannot pass here and fail there.
  const inScope = OLD.filter((p) => p.live >= VARIETY_FROM);
  const perTier = {};
  const bump = (o, k) => { o[k] = (o[k] || 0) + 1; };
  const jogsOf = (rx) => rx.filter((v, i) => i && v !== rx[i - 1]).length;
  const quadOf = (b) => (b.terms[0] % b.n < b.n / 2 ? 'L' : 'R') + (((b.terms[0] / b.n) | 0) < b.n / 2 ? 'T' : 'B');
  for (const t of [1, 2, 3, 4]) {
    const had = inScope.filter((p) => p.tier === t);
    const cnt = had.length + newRows.filter((r) => r.tier === t).length;
    const T = { cnt, cap: Math.ceil(0.40 * cnt), jogCap: Math.ceil(0.50 * cnt), par: {}, gap: {}, rx0: {}, jogs: {}, onFloor: 0 };
    for (const p of had) {
      bump(T.par, p.par); bump(T.gap, p.greedy - p.par); bump(T.rx0, p.rx[0]); bump(T.jogs, jogsOf(p.rx));
      if (p.greedy - p.par === SPEC[t].gap) T.onFloor++;
    }
    perTier[t] = T;
  }
  const quad = {}, quadCap = Math.ceil(0.40 * (inScope.length + newRows.length));
  for (const p of inScope) bump(quad, quadOf(p));
  return {
    // cheap axes, checkable before any Steiner solve
    shape(b, tier) {
      const T = perTier[tier];
      if (seenRiver.has(`${b.n}|${b.rx.join(',')}`)) return 'river repeats';
      if (seenHills.has(`${b.n}|${b.hills.join(',')}`)) return 'ridge repeats';
      if (seenTerms.has(`${b.n}|${b.terms.slice().sort((a, c) => a - c).join(',')}`)) return 'town set repeats';
      if ((T.rx0[b.rx[0]] || 0) >= T.cap) return 'river start column at ceiling';
      if ((T.jogs[jogsOf(b.rx)] || 0) >= T.jogCap) return 'river jog count at ceiling';
      if ((quad[quadOf(b)] || 0) >= quadCap) return 'depot quadrant at ceiling';
      return null;
    },
    // the axes that need par
    score(b, tier) {
      const T = perTier[tier], gap = b.greedy - b.par;
      if ((T.par[b.par] || 0) >= T.cap) return `par ${b.par} at ceiling`;
      if ((T.gap[gap] || 0) >= T.cap) return `gap ${gap} at ceiling`;
      if (gap === SPEC[tier].gap && T.onFloor >= T.cap) return 'boards sitting on the gap floor at ceiling';
      return null;
    },
    keep(b, tier) {
      const T = perTier[tier], gap = b.greedy - b.par;
      seenRiver.add(`${b.n}|${b.rx.join(',')}`);
      seenHills.add(`${b.n}|${b.hills.join(',')}`);
      seenTerms.add(`${b.n}|${b.terms.slice().sort((a, c) => a - c).join(',')}`);
      bump(T.par, b.par); bump(T.gap, gap); bump(T.rx0, b.rx[0]); bump(T.jogs, jogsOf(b.rx));
      if (gap === SPEC[tier].gap) T.onFloor++;
      bump(quad, quadOf(b));
    },
    report() {
      const lines = [];
      for (const t of [1, 2, 3, 4]) {
        const T = perTier[t];
        if (!T.cnt) continue;
        lines.push(`  tier ${t}: ${T.cnt} new, cap ${T.cap} · par ${JSON.stringify(T.par)} · gap ${JSON.stringify(T.gap)} · on floor ${T.onFloor} · rx0 ${JSON.stringify(T.rx0)}`);
      }
      lines.push(`  depot quadrants ${JSON.stringify(quad)} (cap ${quadCap})`);
      return lines.join('\n');
    },
  };
}

function build(tier, seed, ledger, wantGap) {
  const spec = SPEC[tier], n = spec.n, r = rng(seed);
  const jog = spec.jog[0] + r() * (spec.jog[1] - spec.jog[0]);
  const { rx, bridges } = makeRiver(r, n, jog);
  const hills = makeHills(r, n, between(r, spec.hills[0], spec.hills[1]), between(r, spec.blobs[0], spec.blobs[1]));
  const banned = new Set(bridges);
  const cliffs = spec.cliffs[1] ? makeCliffs(r, n, between(r, spec.cliffs[0], spec.cliffs[1]), banned) : [];
  cliffs.forEach((k) => banned.add(k));
  const rails = spec.chains[1] ? makeRails(r, n, between(r, spec.chains[0], spec.chains[1]), banned, hills) : [];
  if (spec.cliffs[1] && cliffs.length < 4) return null;
  if (spec.chains[1] && rails.length < 4) return null;
  const terr = { hills, bridges, rails, cliffs };
  const cost = pricer(terr);
  if (!connected(n, cost)) return null;
  const terms = spreadTerms(r, n, spec.towns + 1, cost, rx, between(r, spec.sep[0], spec.sep[1]), between(r, spec.far[0], spec.far[1]));
  if (!terms) return null;

  // the fingerprint ceilings cost nothing, so they run before any solve
  if (ledger.shape({ n, rx, hills, terms }, tier)) return null;

  const gr = greedyCost(n, terms, cost);
  if (!isFinite(gr)) return null;
  const W = weightsFor(n, cost);
  // par can never beat greedy, and a board whose greedy is not wantGap clear
  // of par is rejected anyway, so the solve is capped there: the table above
  // the cap is never built, and most candidates die without paying for it. A
  // HIGHER target is therefore cheaper per seed, not dearer.
  const solved = steinerW(n, terms, W, true, gr - wantGap);
  const par = solved.cost, sol = solved.sol;
  if (par >= INF || par < 12) return null;

  const ridge = sol.filter(([a, b]) => cost(a, b) === 2).length;
  const cross = sol.filter(([a, b]) => cost(a, b) === 3).length;
  const onRail = sol.filter(([a, b]) => cost(a, b) === 0).length;
  if (ridge < spec.ridge || cross < 1) return null;
  if (onRail < spec.onRail) return null;
  if (ledger.score({ par, greedy: gr }, tier)) return null;

  // The expensive gates run cheapest first, because most candidates die here.
  // One solve: the old track has to be worth finding, so pricing the whole
  // disused line normally must make the best network worse.
  if (rails.length) {
    const noRail = weightsFor(n, pricer({ ...terr, rails: [] }));
    if (steinerW(n, terms, noRail, false, par) <= par) return null;
  }
  // A few solves: cliffs have to bite, so opening one has to improve par.
  if (spec.bite) {
    let bite = 0;
    for (const k of cliffs) {
      const [a, b] = k.split('-').map(Number);
      if (steinerW(n, terms, patched(W, n, a, b, 1), false, par - 1) < par) bite++;
      if (bite >= spec.bite) break;
    }
    if (bite < spec.bite) return null;
  }
  // One solve per terrain lane: every ridge climb and every crossing in par has
  // to be load-bearing, or the board is guessy.
  for (const [a, b] of sol) {
    const c = cost(a, b);
    if (c !== 2 && c !== 3) continue;
    if (steinerW(n, terms, patched(W, n, a, b, 999), false, par) <= par) return null;
  }
  return { n, par, greedy: gr, terms, hills, bridges, rx, cliffs, rails, sol, tier, seed };
}

// ---------- calendar ----------
const MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const UNTIL = process.argv[2];
const APPLY = process.argv.includes('--apply');
if (!/^\d{4}-\d{2}-\d{2}$/.test(UNTIL || '')) {
  console.error('usage: node scripts/gen-paths.mjs <untilISO> [--apply]');
  process.exit(1);
}
const lastLive = OLD.map((p) => p.live).sort().at(-1);
const startNum = OLD.length + 1;
const first = new Date(lastLive + 'T00:00:00Z').getTime() + 86400000;
const days = Math.round((new Date(UNTIL + 'T00:00:00Z').getTime() - first) / 86400000) + 1;
if (days <= 0) { console.log(`paths: already runs to ${lastLive}`); process.exit(0); }

const rows = [];
for (let i = 0; i < days; i++) {
  const dt = new Date(first + i * 86400000);
  const y = dt.getUTCFullYear(), m = dt.getUTCMonth() + 1, d = dt.getUTCDate(), wd = dt.getUTCDay();
  const tier = wd === 0 ? 4 : wd <= 3 ? 1 : wd === 4 ? 2 : 3;
  rows.push({
    num: startNum + i,
    quizId: `paths-${m}-${d}-${String(y).slice(2)}`,
    live: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    dateLabel: `${MON[m - 1]} ${d}, ${y}`,
    sunday: wd === 0,
    tier,
  });
}
console.log(`paths: bank ends ${lastLive} (#${OLD.length}); building ${days} boards ${rows[0].live} -> ${rows.at(-1).live}`);
console.log(`  t1 ${rows.filter((r) => r.tier === 1).length} · t2 ${rows.filter((r) => r.tier === 2).length} · t3 ${rows.filter((r) => r.tier === 3).length} · t4 ${rows.filter((r) => r.tier === 4).length}`);

// seed offset by board number, so the new segment cannot replay the frozen one
const SEED_BASE = 20261005, SEED_STEP = 7919, TRIES = Number(process.env.PATHS_TRIES || 400000);
// How far over its tier's floor each board's greedy-over-par gap is asked to
// sit, walked in order down each tier. Tier 4 already starts a point higher
// (floor 6) and its boards cost two orders of magnitude more to search, so it
// walks a shorter ladder. STEP is the seed budget a target gets before the
// generator drops it one and logs the drop.
const LADDER = { 1: [0, 1, 2, 1, 3, 0, 2, 1], 2: [0, 1, 2, 1, 3, 0, 2, 1], 3: [0, 1, 2, 1, 3, 0, 2, 1], 4: [0, 1, 2, 1, 0, 2, 1, 3] };
const STEP = { 1: 24000, 2: 24000, 3: 24000, 4: 2000 };
const CACHE = '/tmp/build/paths-cache.jsonl';
fs.mkdirSync('/tmp/build', { recursive: true });
const cached = new Map();
try {
  for (const line of fs.readFileSync(CACHE, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const b = JSON.parse(line);
    cached.set(b.num, b);
  }
} catch (e) {}

const BUDGET = Number(process.env.PATHS_BUDGET || 0);
const T0 = Date.now();
const ledger = makeLedger(rows);
const tierSeen = { 1: 0, 2: 0, 3: 0, 4: 0 };
const out = [];
for (const row of rows) {
  let b = cached.get(row.num);
  if (b) {
    tierSeen[row.tier]++;
    const bad = ledger.shape(b, row.tier) || ledger.score(b, row.tier);
    if (bad) { console.error(`cached #${row.num} breaks the ledger (${bad}) - clear ${CACHE}`); process.exit(1); }
  } else {
    if (BUDGET && (Date.now() - T0) / 1000 > BUDGET) {
      console.log(`budget spent with ${rows.length - out.length} board(s) still to build - run again to pick up where this left off.`);
      process.exit(3);
    }
    const t0 = Date.now();
    const seed0 = SEED_BASE + row.num * SEED_STEP;
    const lad = LADDER[row.tier];
    const asked = SPEC[row.tier].gap + lad[(tierSeen[row.tier]++) % lad.length];
    let want = asked;
    for (; want > SPEC[row.tier].gap && !b; want--) {
      for (let s = seed0; s < seed0 + STEP[row.tier] && !b; s++) b = build(row.tier, s, ledger, want);
      if (!b) console.log(`    #${row.num}: no board at gap ${want} in ${STEP[row.tier]} seeds, stepping the target down to ${want - 1}`);
    }
    if (!b) {
      want = SPEC[row.tier].gap;
      for (let s = seed0; s < seed0 + TRIES && !b; s++) b = build(row.tier, s, ledger, want);
    }
    if (!b) { console.error(`could not build #${row.num} (${row.live}) tier ${row.tier} in ${TRIES} seeds - GROW THE POOL (widen a band in SPEC), do not lower a gate`); process.exit(1); }
    b.num = row.num;
    b.asked = asked;
    b.want = want;   // the target actually met, so a rebuild can reproduce this exact board
    fs.appendFileSync(CACHE, JSON.stringify(b) + '\n');
    console.log(`  #${row.num} ${row.live} t${row.tier} · par ${b.par} greedy ${b.greedy} (+${b.greedy - b.par}, asked +${b.asked - SPEC[row.tier].gap}) · hills ${b.hills.length} cliffs ${b.cliffs.length} rails ${b.rails.length} · seed ${b.seed} · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
  ledger.keep(b, row.tier);
  out.push({ ...row, ...b });
}

const fmt = (p) => `  {
    num: ${p.num},
    quizId: '${p.quizId}',
    live: '${p.live}',
    dateLabel: '${p.dateLabel}',
    sunday: ${p.sunday},
    tier: ${p.tier},
    n: ${p.n}, par: ${p.par}, greedy: ${p.greedy},
    terms: [${p.terms.join(',')}],
    hills: [${p.hills.join(',')}],
    bridges: [${p.bridges.map((k) => `"${k}"`).join(',')}],
    cliffs: [${p.cliffs.map((k) => `"${k}"`).join(',')}],
    rails: [${p.rails.map((k) => `"${k}"`).join(',')}],
    rx: [${p.rx.join(',')}],
    sol: [${p.sol.map(([a, b]) => `[${a},${b}]`).join(',')}],
  },`;

const text = out.map(fmt).join('\n') + '\n';
fs.writeFileSync('/tmp/build/paths-tail.txt', text);
console.log(`\nvariety ledger for the new segment:\n${ledger.report()}`);
console.log(`\nwrote ${out.length} boards to /tmp/build/paths-tail.txt · par ${Math.min(...out.map((p) => p.par))}-${Math.max(...out.map((p) => p.par))} · gap ${Math.min(...out.map((p) => p.greedy - p.par))}-${Math.max(...out.map((p) => p.greedy - p.par))}`);

if (APPLY) {
  const path = 'app/paths/puzzles.js';
  const bank = fs.readFileSync(path, 'utf8');
  const close = bank.lastIndexOf('];');
  const head = bank.slice(0, close);
  if (!/,\n$/.test(head)) { console.error('the bank does not end in a comma-terminated board; refusing to splice'); process.exit(1); }
  fs.writeFileSync(path, head + text + bank.slice(close));
  console.log(`spliced ${out.length} boards into ${path}; the first ${OLD.length} boards were not touched.`);
}
