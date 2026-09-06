#!/usr/bin/env node
// Verifier for the Paths bank (app/paths/puzzles.js).
//
// Nothing here trusts the generator. Every board is re-solved from scratch with
// an independent Dreyfus-Wagner Steiner-tree solve over the whole lattice, and
// the checks are the promises the game makes to the player:
//
//   1. `par` really is the cheapest network that exists on that board.
//   2. `sol` is a real network: it links every town to the depot and costs par.
//   3. every RIDGE lane and every CROSSING in `sol` is load-bearing, i.e. ban it
//      and the best possible network gets strictly worse. Plain-ground ties are
//      allowed and unavoidable (two staircases between the same dots tie), which
//      is why the client says "a cheapest network", never "the".
//   4. the river is a continuous barrier: every lane it cuts is priced as a
//      crossing, so there is no free gap where it steps sideways.
//   5. cliffs are honest walls: they never seal a town off or split the board,
//      at least two of them genuinely bend par, and none sits on the river.
//   6. old track is worth finding: par runs along at least two free lanes, and
//      pricing the whole disused line normally makes the best network worse.
//   7. the board is worth playing: the greedy nearest-town network costs at
//      least the tier's margin more than par, and par pays for ridge and river.
//   8. bank hygiene: nums sequential from 1, quizIds match the live date, dates
//      are consecutive days, the sunday flag matches the real weekday, and each
//      board carries exactly the elements its weekday tier is allowed.
//   9. pool variety across the WHOLE run, not per board: no two boards share a
//      river, a ridge or a town set, and no single par, greedy-over-par gap,
//      river start column or jog count owns more than its share of a tier. The
//      per-board checks above all pass on a bank that is the same puzzle every
//      day, which is what this one is for. Scoped to PATHS_VARIETY_FROM, since
//      the launch bank predates the rule and the past is frozen.
//
// Tiers ramp across the week. 1 is Monday to Wednesday (open, ridge, river), 2
// is Thursday (cliffs), 3 is Friday and Saturday (old track, nine towns), 4 is
// the Sunday Edition (13x13, eleven towns, everything). Board 1 is the launch
// board and predates the ramp, so it is allowed to be a tier 1 on a Thursday.
//
// Usage: node scripts/verify-paths.mjs            verify the whole bank
//        node scripts/verify-paths.mjs 1-20       verify boards 1 to 20 only
//
// The 13x13 Sunday boards take a few seconds each to re-solve, so the whole
// bank is a minute or two. The range argument exists for running it in pieces;
// the variety pass always measures the whole bank regardless of the range.
import { PUZZLES as ALL } from '../app/paths/puzzles.js';

const range = (process.argv[2] || '').match(/^(\d+)-(\d+)$/);
const PUZZLES = range
  ? ALL.filter((p) => p.num >= Number(range[1]) && p.num <= Number(range[2]))
  : ALL;

const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
const fail = [];
const note = (p, msg) => fail.push(`#${p.num} (${p.quizId}): ${msg}`);

// n, towns (excluding the depot), the smallest honest greedy-over-par gap, and
// whether cliffs and old track are allowed on that tier.
// gap     how far over par the obvious connect-the-nearest-town network must be
// ridge   ridge lanes par is forced to climb
// onRail  free lanes par is forced to run along
// bite    cliffs that have to change the answer
const TIER = {
  1: { n: 9,  towns: 8,  gap: 5, ridge: 3, onRail: 0, bite: 0, cliffs: false, rails: false },
  2: { n: 9,  towns: 8,  gap: 5, ridge: 3, onRail: 0, bite: 2, cliffs: true,  rails: false },
  3: { n: 9,  towns: 9,  gap: 5, ridge: 3, onRail: 2, bite: 2, cliffs: true,  rails: true },
  4: { n: 13, towns: 11, gap: 6, ridge: 5, onRail: 3, bite: 3, cliffs: true,  rails: true },
};

function nbrOf(n) {
  return (i) => {
    const x = i % n, y = (i / n) | 0, o = [];
    if (x > 0) o.push(i - 1);
    if (x < n - 1) o.push(i + 1);
    if (y > 0) o.push(i - n);
    if (y < n - 1) o.push(i + n);
    return o;
  };
}

function steiner(n, terms, cost) {
  const nbr = nbrOf(n), K = terms.length, V = n * n, F = (1 << K) - 1;
  const dp = Array.from({ length: 1 << K }, () => new Float64Array(V).fill(Infinity));
  terms.forEach((t, k) => { dp[1 << k][t] = 0; });
  for (let m = 1; m <= F; m++) {
    const d = dp[m];
    for (let s = (m - 1) & m; s > 0; s = (s - 1) & m) {
      const o = m ^ s;
      if (s > o) continue;
      const a = dp[s], b = dp[o];
      for (let v = 0; v < V; v++) { const c = a[v] + b[v]; if (c < d[v]) d[v] = c; }
    }
    const seen = new Uint8Array(V);
    for (let it = 0; it < V; it++) {
      let u = -1, best = Infinity;
      for (let v = 0; v < V; v++) if (!seen[v] && d[v] < best) { best = d[v]; u = v; }
      if (u < 0) break;
      seen[u] = 1;
      for (const w of nbr(u)) { const c = d[u] + cost(u, w); if (c < d[w]) d[w] = c; }
    }
  }
  let best = Infinity;
  for (let v = 0; v < V; v++) if (dp[F][v] < best) best = dp[F][v];
  return best;
}

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
      for (const w of nbr(u)) { const c = d[u] + cost(u, w); if (c < d[w]) d[w] = c; }
    }
    D[t] = d;
  }
  const inT = [terms[0]], rest = terms.slice(1);
  let tot = 0;
  while (rest.length) {
    let bi = 0, bc = Infinity;
    rest.forEach((t, i) => { const c = Math.min(...inT.map((s) => D[s][t])); if (c < bc) { bc = c; bi = i; } });
    tot += bc; inT.push(rest.splice(bi, 1)[0]);
  }
  return tot;
}

const MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];
let prevDate = null;

for (const p of PUZZLES) {
  const n = p.n;
  const hills = new Set(p.hills), bridges = new Set(p.bridges);
  const cliffs = new Set(p.cliffs || []), rails = new Set(p.rails || []);
  // a cliff is a wall, not a price, so the lane is gone from the lattice
  const cost = (a, b) => {
    const k = key(a, b);
    if (cliffs.has(k)) return Infinity;
    if (rails.has(k)) return 0;
    if (bridges.has(k)) return 3;
    return hills.has(a) && hills.has(b) ? 2 : 1;
  };
  const spec = TIER[p.tier];
  if (!spec) { note(p, `unknown tier ${p.tier}`); continue; }

  // 8. bank hygiene
  const [Y, M, D] = p.live.split('-').map(Number);
  const dt = new Date(Date.UTC(Y, M - 1, D));
  const wd = dt.getUTCDay();
  if (p.quizId !== `paths-${M}-${D}-${String(Y).slice(2)}`) note(p, `quizId does not match live date ${p.live}`);
  if (p.dateLabel !== `${MON[M - 1]} ${D}, ${Y}`) note(p, `dateLabel "${p.dateLabel}" does not match ${p.live}`);
  if (p.num !== ALL.indexOf(p) + 1) note(p, 'num is out of sequence');
  if (prevDate && dt.getTime() - prevDate !== 86400000) note(p, 'live date is not the next day');
  prevDate = dt.getTime();
  if (p.sunday !== (wd === 0)) note(p, `sunday flag is ${p.sunday} but ${p.live} is day ${wd}`);
  if (p.sunday !== (p.tier === 4)) note(p, 'tier 4 and the sunday flag have to agree');
  // The weekday decides the tier. Boards 1 and 2 shipped at launch, before the
  // ramp existed, and cliffs are introduced on board 3.
  if (p.num > 2) {
    const want = p.num === 3 ? 2 : wd === 0 ? 4 : wd <= 3 ? 1 : wd === 4 ? 2 : 3;
    if (p.tier !== want) note(p, `is tier ${p.tier} but ${p.live} (day ${wd}) calls for tier ${want}`);
  } else if (p.tier !== 1) note(p, 'boards 1 and 2 are the launch pair and stay tier 1');
  if (n !== spec.n) note(p, `tier ${p.tier} boards are ${spec.n}x${spec.n}, not ${n}x${n}`);
  if (p.terms.length !== spec.towns + 1) note(p, `has ${p.terms.length - 1} towns, tier ${p.tier} wants ${spec.towns}`);
  if (new Set(p.terms).size !== p.terms.length) note(p, 'a terminal is repeated');
  if (p.terms.some((t) => t < 0 || t >= n * n)) note(p, 'a terminal is off the board');
  if (!spec.cliffs && cliffs.size) note(p, `tier ${p.tier} is not allowed cliffs`);
  if (!spec.rails && rails.size) note(p, `tier ${p.tier} is not allowed old track`);
  if (spec.cliffs && cliffs.size < 4) note(p, `only ${cliffs.size} cliff lanes`);
  if (spec.rails && rails.size < 4) note(p, `only ${rails.size} old track lanes`);
  for (const set of [cliffs, rails]) {
    for (const k of set) {
      const [a, b] = k.split('-').map(Number);
      const ax = a % n, ay = (a / n) | 0, bx = b % n, by = (b / n) | 0;
      if (Math.abs(ax - bx) + Math.abs(ay - by) !== 1) note(p, `lane ${k} is not between neighbours`);
    }
  }
  for (const k of cliffs) {
    if (rails.has(k)) note(p, `lane ${k} is both a cliff and old track`);
    if (bridges.has(k)) note(p, `cliff ${k} sits on the river, so the crossing reads as free`);
  }
  for (const k of rails) if (bridges.has(k)) note(p, `old track ${k} would hand out a free crossing`);

  // 4. the river is a continuous barrier
  for (let y = 0; y < n; y++) {
    const x = p.rx[y];
    if (!bridges.has(key(y * n + x - 1, y * n + x))) note(p, `row ${y} crossing is not priced`);
    if (y < n - 1) {
      const d = p.rx[y + 1] - x;
      if (Math.abs(d) > 1) note(p, `river jumps ${d} columns between rows ${y} and ${y + 1}`);
      if (d === -1 && !bridges.has(key(y * n + x - 1, (y + 1) * n + x - 1))) note(p, `river jog at row ${y} leaves a free gap`);
      if (d === 1 && !bridges.has(key(y * n + x, (y + 1) * n + x))) note(p, `river jog at row ${y} leaves a free gap`);
    }
  }
  if (p.bridges.length !== new Set(p.bridges).size) note(p, 'duplicate crossing');

  // 5. cliffs never seal anything off
  const nbr = nbrOf(n), V = n * n, seen = new Uint8Array(V), q = [0];
  seen[0] = 1; let reach = 1;
  while (q.length) { const u = q.pop(); for (const w of nbr(u)) if (!seen[w] && isFinite(cost(u, w))) { seen[w] = 1; reach++; q.push(w); } }
  if (reach !== V) note(p, `cliffs cut ${V - reach} dots off the board`);

  // 2. sol is a real network at cost par
  let solCost = 0;
  const adj = {};
  for (const [a, b] of p.sol) {
    const ax = a % n, ay = (a / n) | 0, bx = b % n, by = (b / n) | 0;
    if (Math.abs(ax - bx) + Math.abs(ay - by) !== 1) note(p, `sol lane ${a}-${b} is not between neighbours`);
    if (cliffs.has(key(a, b))) note(p, `sol lays track over the cliff at ${a}-${b}`);
    solCost += cost(a, b);
    (adj[a] = adj[a] || []).push(b);
    (adj[b] = adj[b] || []).push(a);
  }
  const s2 = new Set([p.terms[0]]), q2 = [p.terms[0]];
  while (q2.length) { const u = q2.pop(); (adj[u] || []).forEach((v) => { if (!s2.has(v)) { s2.add(v); q2.push(v); } }); }
  if (!p.terms.every((t) => s2.has(t))) note(p, 'sol does not link every town to the depot');
  if (solCost !== p.par) note(p, `sol costs ${solCost} but par says ${p.par}`);

  // 1. par is the true minimum
  const exact = steiner(n, p.terms, cost);
  if (exact !== p.par) note(p, `par is ${p.par} but the cheapest network costs ${exact}`);

  // 7. the board is worth playing
  const gr = greedyCost(n, p.terms, cost);
  if (gr !== p.greedy) note(p, `greedy is banked as ${p.greedy} but computes to ${gr}`);
  if (gr - p.par < spec.gap) note(p, `greedy is only ${gr - p.par} over par, tier ${p.tier} wants ${spec.gap}`);
  const ridge = p.sol.filter(([a, b]) => cost(a, b) === 2).length;
  const cross = p.sol.filter(([a, b]) => cost(a, b) === 3).length;
  const free = p.sol.filter(([a, b]) => cost(a, b) === 0).length;
  if (ridge < spec.ridge) note(p, `par climbs only ${ridge} ridge lanes, tier ${p.tier} wants ${spec.ridge}`);
  if (cross < 1) note(p, 'par never crosses the river');
  if (free < spec.onRail) note(p, `par runs along only ${free} free lanes, tier ${p.tier} wants ${spec.onRail}`);

  // 3. every terrain decision is forced
  for (const [a, b] of p.sol) {
    const c = cost(a, b);
    if (c !== 2 && c !== 3) continue;
    const banned = (u, v) => (key(u, v) === key(a, b) ? 999 : cost(u, v));
    if (steiner(n, p.terms, banned) <= p.par) note(p, `terrain lane ${a}-${b} is a free swap, so par is not forced there`);
  }

  // 6. the old track is worth finding
  if (rails.size) {
    const priced = (a, b) => {
      const k = key(a, b);
      if (cliffs.has(k)) return Infinity;
      if (bridges.has(k)) return 3;
      return hills.has(a) && hills.has(b) ? 2 : 1;
    };
    if (steiner(n, p.terms, priced) <= p.par) note(p, 'pricing the old track normally does not change par, so it is not a real saving');
  }

  // 5b. at least two cliffs actually bend par
  if (spec.bite) {
    let bite = 0;
    for (const k of cliffs) {
      const open = (a, b) => (key(a, b) === k ? 1 : cost(a, b));
      if (steiner(n, p.terms, open) < p.par) bite++;
      if (bite >= spec.bite) break;
    }
    if (bite < spec.bite) note(p, `only ${bite} cliffs change the answer, tier ${p.tier} wants ${spec.bite}, so they are scenery`);
  }
}

// ---------------------------------------------------------------------------
// 9. POOL VARIETY, counted across the WHOLE RUN rather than per board.
//
// Everything above is a per-board check, and a bank of 117 nine-town lattices
// passes all of it while being the same puzzle wearing different coordinates
// every day. These are the ceilings on repetition. They are scoped to boards
// living on or after PATHS_VARIETY_FROM, because the launch bank predates the
// rule and the past is frozen (authoring standard rule 10); the three
// fingerprint axes still compare a new board against the WHOLE bank, frozen
// boards included, so a new board can never reuse an old board's river, ridge
// or town set.
//
//   never repeated, anywhere in the bank:
//     the river profile `rx`, the ridge footprint `hills`, the town set `terms`
//   at most ceil(0.40 x that tier's in-scope boards) may share:
//     the same par · the same greedy-over-par gap · the same river start
//     column · a gap sitting exactly on the tier's floor
//   at most ceil(0.50 x that tier's in-scope boards) may share:
//     the same number of river jogs
//   at most ceil(0.40 x all in-scope boards) may put the depot in the same
//     quadrant of the lattice
//
// These run over ALL boards, never the `range` subset, so asking for a slice
// still measures the whole run. scripts/gen-paths.mjs enforces the identical
// ceilings while it searches, and its header says so.
const PATHS_VARIETY_FROM = '2026-10-05';
const bankNote = (msg) => fail.push(`bank variety: ${msg}`);
const sortJoin = (a) => a.slice().sort((x, y) => x - y).join(',');
const FINGERPRINT = {
  river: (p) => `${p.n}|${p.rx.join(',')}`,
  ridge: (p) => `${p.n}|${sortJoin(p.hills)}`,
  towns: (p) => `${p.n}|${sortJoin(p.terms)}`,
};
for (const [what, sig] of Object.entries(FINGERPRINT)) {
  const first = new Map();
  for (const p of ALL) {
    const s = sig(p);
    if (!first.has(s)) { first.set(s, p); continue; }
    const other = first.get(s);
    if (p.live >= PATHS_VARIETY_FROM) note(p, `has the same ${what} as #${other.num} (${other.live})`);
  }
}
const fresh = ALL.filter((p) => p.live >= PATHS_VARIETY_FROM);
if (fresh.length) {
  const tally = (a, f) => a.reduce((o, p) => { const k = f(p); o[k] = (o[k] || 0) + 1; return o; }, {});
  const jogsOf = (p) => p.rx.filter((v, i) => i && v !== p.rx[i - 1]).length;
  const worst = (t) => Object.entries(t).sort((a, b) => b[1] - a[1])[0] || ['-', 0];
  for (const t of [1, 2, 3, 4]) {
    const a = fresh.filter((p) => p.tier === t);
    if (!a.length) continue;
    const cap = Math.ceil(0.40 * a.length), jogCap = Math.ceil(0.50 * a.length);
    const axes = [
      ['par', tally(a, (p) => p.par), cap],
      ['greedy-over-par gap', tally(a, (p) => p.greedy - p.par), cap],
      ['river start column', tally(a, (p) => p.rx[0]), cap],
      ['river jog count', tally(a, jogsOf), jogCap],
    ];
    for (const [what, t2, lim] of axes) {
      const [val, n2] = worst(t2);
      if (n2 > lim) bankNote(`tier ${t}: ${n2} of ${a.length} boards share ${what} ${val}, ceiling is ${lim}`);
    }
    const onFloor = a.filter((p) => p.greedy - p.par === TIER[t].gap).length;
    if (onFloor > cap) bankNote(`tier ${t}: ${onFloor} of ${a.length} boards sit exactly on the gap floor of ${TIER[t].gap}, ceiling is ${cap} — a floor is not a target`);
  }
  const quad = tally(fresh, (p) => (p.terms[0] % p.n < p.n / 2 ? 'L' : 'R') + (((p.terms[0] / p.n) | 0) < p.n / 2 ? 'T' : 'B'));
  const qCap = Math.ceil(0.40 * fresh.length);
  const [qv, qn] = Object.entries(quad).sort((a, b) => b[1] - a[1])[0];
  if (qn > qCap) bankNote(`${qn} of ${fresh.length} boards put the depot in quadrant ${qv}, ceiling is ${qCap}`);
}

const days = PUZZLES.length;
if (fail.length) {
  console.error(`FAIL — ${fail.length} problem(s) across ${days} boards:\n` + fail.map((f) => '  ' + f).join('\n'));
  process.exit(1);
}
const byTier = (t) => PUZZLES.filter((p) => p.tier === t).length;
console.log(`OK — ${days} Paths boards verified${range ? ` (#${range[1]}-${range[2]} of ${ALL.length})` : ''}.`);
console.log(`  tiers: ${byTier(1)} open, ${byTier(2)} cliffs, ${byTier(3)} old track, ${byTier(4)} Sunday Editions.`);
console.log(`  perfect ${Math.min(...PUZZLES.map((p) => p.par))}-${Math.max(...PUZZLES.map((p) => p.par))}, greedy runs ${Math.min(...PUZZLES.map((p) => p.greedy - p.par))}-${Math.max(...PUZZLES.map((p) => p.greedy - p.par))} over.`);
console.log(`  live ${PUZZLES[0].live} through ${PUZZLES[days - 1].live}.`);
