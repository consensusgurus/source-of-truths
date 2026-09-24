// Generator for Carve, the daily equal-sum partition game (app/carve/puzzles.js).
//
//   node scripts/gen-carve.mjs [--days 30] [--write]
//
// Reads the live bank, then builds `--days` new boards starting the day after
// the last banked date and numbered on from the last `num`. Without --write it
// prints the new board objects; with --write it APPENDS them to the bank, just
// before the closing `];`, so every existing board comes back byte-identical.
//
// Deterministic: each board is seeded from its own `num` (plus a retry
// counter), so re-running reproduces the same boards and a new range never
// replays a frozen one.
//
// Authoring rules (the header of app/carve/puzzles.js and the 2026-08-28
// extension, commit 5c23714), matched to the live bank:
//   - Weekdays: 6x6 digit grid carved into 6 regions of 30; region sizes 4-8.
//   - Sundays: the 7x7 Edition in 9 regions, target 27 (occasionally 25, as
//     the bank already runs); region sizes 3-8.
//   - Digits 1-9. One anchor (`seeds`) per region, listed in reading order,
//     and region k is the one holding seeds[k].
//   - EXACTLY ONE carving given the anchors: every connected region through an
//     anchor (holding no other anchor) that sums to the target is enumerated,
//     then the board is exact-covered, capped at 2. The verifier
//     (scripts/verify-daily-banks.mjs carve) re-proves it with its own code.
//   - No digit grid repeats one already in the bank.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const BANK = join(here, '../app/carve/puzzles.js');
const args = process.argv.slice(2);
const DAYS = args.includes('--days') ? Number(args[args.indexOf('--days') + 1]) : 30;
const WRITE = args.includes('--write');

function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const shuffle = (rng, a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (rng, a) => a[Math.floor(rng() * a.length)];

const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const quizDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${m}-${d}-${String(y).slice(2)}`; };
const dateLabel = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const isSunday = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay() === 0;

const nbrs = (N) => [...Array(N * N)].map((_, k) => {
  const r = (k / N) | 0, c = k % N, o = [];
  if (r > 0) o.push(k - N); if (r < N - 1) o.push(k + N); if (c > 0) o.push(k - 1); if (c < N - 1) o.push(k + 1);
  return o;
});

// Random partition of the N x N board into R connected regions with sizes in [lo, hi].
function partition(rng, N, R, lo, hi) {
  const NB = nbrs(N), lab = new Int8Array(N * N).fill(-1), size = Array(R).fill(0);
  shuffle(rng, [...Array(N * N).keys()]).slice(0, R).forEach((k, g) => { lab[k] = g; size[g] = 1; });
  for (let left = N * N - R; left > 0; left--) {
    // grow the smallest regions first (random among ties) so sizes stay balanced-ish
    const cand = [];
    for (let k = 0; k < N * N; k++) if (lab[k] < 0) for (const n of NB[k]) if (lab[n] >= 0 && size[lab[n]] < hi) cand.push([k, lab[n]]);
    if (!cand.length) return null;
    const minS = Math.min(...cand.map(([, g]) => size[g]));
    const pool = cand.filter(([, g]) => size[g] <= minS + 1 + Math.floor(rng() * 2));
    const [k, g] = pick(rng, pool);
    lab[k] = g; size[g]++;
  }
  if (size.some((s) => s < lo || s > hi)) return null;
  return lab;
}

// Spread `T` over `s` cells, each 1-9, one unit at a time (centre-heavy like the bank).
function digits(rng, s, T) {
  if (T < s || T > 9 * s) return null;
  const v = Array(s).fill(1);
  for (let u = T - s; u > 0; u--) {
    const open = v.map((x, i) => (x < 9 ? i : -1)).filter((i) => i >= 0);
    v[pick(rng, open)]++;
  }
  return v;
}

// Count carvings (cap 2) given grid values, anchors and target.
function countCarvings(N, val, seeds, T) {
  const NB = nbrs(N), ALL = N * N, isSeed = new Uint8Array(ALL);
  for (const s of seeds) isSeed[s] = 1;
  const options = seeds.map((s0) => {
    const found = [];
    const inSet = new Uint8Array(ALL), excl = new Uint8Array(ALL);
    const cells = [s0]; inSet[s0] = 1;
    const grow = (frontier, sum) => {
      if (sum === T) { found.push(cells.slice()); return; }
      if (sum > T || found.length > 5000) return;
      const added = [];
      for (let i = 0; i < frontier.length; i++) {
        const k = frontier[i];
        if (excl[k] || isSeed[k] || inSet[k]) continue;
        inSet[k] = 1; cells.push(k);
        const fr2 = frontier.slice(i + 1);
        for (const n of NB[k]) if (!inSet[n] && !excl[n] && !fr2.includes(n)) fr2.push(n);
        grow(fr2, sum + val[k]);
        cells.pop(); inSet[k] = 0;
        excl[k] = 1; added.push(k);
      }
      for (const k of added) excl[k] = 0;
    };
    grow(NB[s0].slice(), val[s0]);
    return found;
  });
  if (options.some((o) => o.length > 5000)) return 2;
  const used = new Uint8Array(ALL);
  let count = 0;
  const R = seeds.length, done = new Uint8Array(R);
  const dfs = (placed) => {
    if (count >= 2) return;
    if (placed === R) { if (used.every((x) => x)) count++; return; }
    // branch on the anchor with the fewest still-compatible regions
    let best = -1, bestOpts = null;
    for (let g = 0; g < R; g++) {
      if (done[g]) continue;
      const opts = options[g].filter((reg) => reg.every((k) => !used[k]));
      if (!opts.length) return;
      if (!bestOpts || opts.length < bestOpts.length) { best = g; bestOpts = opts; }
    }
    done[best] = 1;
    for (const reg of bestOpts) {
      for (const k of reg) used[k] = 1;
      dfs(placed + 1);
      for (const k of reg) used[k] = 0;
      if (count >= 2) break;
    }
    done[best] = 0;
  };
  dfs(0);
  return count;
}

function makeBoard(num, sunday, seen) {
  const N = sunday ? 7 : 6, R = sunday ? 9 : 6;
  for (let attempt = 0; attempt < 20000; attempt++) {
    const rng = mulberry32(num * 999983 + attempt * 65537 + 0xca7e);
    const T = sunday ? (rng() < 0.75 ? 27 : 25) : 30;
    const lab = partition(rng, N, R, sunday ? 3 : 4, 8);
    if (!lab) continue;
    const members = [...Array(R)].map(() => []);
    for (let k = 0; k < N * N; k++) members[lab[k]].push(k);
    const val = new Int8Array(N * N);
    let bad = false;
    for (const m of members) { const d = digits(rng, m.length, T); if (!d) { bad = true; break; } m.forEach((k, i) => { val[k] = d[i]; }); }
    if (bad) continue;
    const gridKey = JSON.stringify([...val]);
    if (seen.has(gridKey)) continue;
    // try a handful of anchor choices on this carving
    for (let s = 0; s < 12; s++) {
      const seeds = members.map((m) => pick(rng, m)).sort((a, b) => a - b);
      if (countCarvings(N, val, seeds, T) !== 1) continue;
      seen.add(gridKey);
      const order = new Map(seeds.map((k, i) => [lab[k], i]));
      const rows = (f) => [...Array(N)].map((_, r) => [...Array(N)].map((_, c) => f(r * N + c)));
      return {
        N, R, T, attempt,
        grid: rows((k) => val[k]),
        seeds: seeds.map((k) => [(k / N) | 0, k % N]),
        sol: rows((k) => order.get(lab[k])),
        sizes: members.map((m) => m.length).sort((a, b) => a - b).join(''),
      };
    }
  }
  throw new Error(`carve #${num}: no board found`);
}

const { PUZZLES } = await import(BANK);
const last = PUZZLES[PUZZLES.length - 1];
const seen = new Set(PUZZLES.map((p) => JSON.stringify(p.grid.flat())));
const out = [];
for (let i = 1; i <= DAYS; i++) {
  const num = last.num + i, live = addDays(last.live, i), sunday = isSunday(live);
  const b = makeBoard(num, sunday, seen);
  console.error(`carve #${num} ${live}${sunday ? ' Sun' : ''}: ${b.N}x${b.N}/${b.R} to ${b.T}, sizes ${b.sizes} (attempt ${b.attempt})`);
  out.push(`  {
    num: ${num},
    quizId: 'carve-${quizDate(live)}',
    live: '${live}',
    dateLabel: '${dateLabel(live)}',
    sunday: ${sunday},
    size: ${b.N},
    regions: ${b.R},
    target: ${b.T},
    grid: ${JSON.stringify(b.grid)},
    seeds: ${JSON.stringify(b.seeds)},
    sol: ${JSON.stringify(b.sol)},
  },\n`);
}
const block = out.join('');
if (WRITE) {
  const text = readFileSync(BANK, 'utf8');
  if (!text.endsWith('\n];\n')) throw new Error('bank does not end with "\\n];\\n"');
  writeFileSync(BANK, text.slice(0, -3) + block + '];\n');
  console.error(`appended ${DAYS} boards to ${BANK}`);
} else process.stdout.write(block);
