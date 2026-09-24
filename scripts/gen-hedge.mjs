// Generator for Hedge, the daily slitherlink (app/hedge/puzzles.js).
//
//   node scripts/gen-hedge.mjs [--days 30] [--write] [--cands 10] [--suncands 12]
//
// Reads the live bank, then builds `--days` new boards starting the day after
// the last banked date and numbered on from the last `num`. Without --write it
// prints the new board objects; with --write it APPENDS them to the bank, just
// before the closing `];`, so every existing board comes back byte-identical.
//
// Deterministic: each candidate is seeded from its board `num` and candidate
// index, so re-running reproduces the same boards and a new range never
// replays a frozen one.
//
// Method (as described by the 2026-08-28 extension, commit 9128cab):
//   1. Grow a random simply connected region of cells (connected, no holes, no
//      two cells meeting only at a corner). Its boundary is then ONE closed
//      loop by construction, with every lattice dot at degree 0 or 2.
//   2. Print every cell's side count, then pare clues back in random order,
//      removing one only while the solution stays unique under the
//      verifier's OWN solver (copied verbatim from scripts/verify-hedge.mjs
//      below), down to a clue target that varies: 26-32 on the 7x7 weekday,
//      48-55 on the 10x10 Sunday Edition.
//   3. Take the HARDEST of several such candidates (most search nodes), which
//      is what keeps the new boards in line with the live bank's difficulty
//      rather than an order of magnitude too easy. Calibrated 2026-09-23:
//      hardest of 10 on weekdays gives a median of ~100 verifier search nodes
//      (q3 ~170), matching the live bank's 67 median / 173 q3 and the Aug 28
//      extension's 171 median; hardest of 12 on Sundays lands at ~1,900
//      (bank: 1,045 to 5,527). Any candidate needing more than 400,000 nodes
//      is discarded so uniqueness stays well inside the verifier's 4M cap.
//   No clue grid repeats one already in the bank.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const BANK = join(here, '../app/hedge/puzzles.js');
const args = process.argv.slice(2);
const arg = (k, d) => (args.includes(k) ? Number(args[args.indexOf(k) + 1]) : d);
const DAYS = arg('--days', 30);
const CANDS = arg('--cands', 10);
const SUNCANDS = arg('--suncands', 12);
const WRITE = args.includes('--write');

// ─── the verifier's slitherlink solver, verbatim ────────────────────────────
function buildCtx(p) {
  const n = p.n;
  const dotKey = (i, j) => i * (n + 1) + j;
  const idOf = new Map();
  const edges = [];
  let id = 0;
  for (let i = 0; i <= n; i++) for (let j = 0; j < n; j++) { const e = { id: id++, kind: 'H', i, j, a: dotKey(i, j), b: dotKey(i, j + 1) }; edges.push(e); idOf.set(`H${i}_${j}`, e.id); }
  for (let i = 0; i < n; i++) for (let j = 0; j <= n; j++) { const e = { id: id++, kind: 'V', i, j, a: dotKey(i, j), b: dotKey(i + 1, j) }; edges.push(e); idOf.set(`V${i}_${j}`, e.id); }
  const E = edges.length;
  const cellClues = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (p.clues[r][c] != null) {
    cellClues.push([[idOf.get(`H${r}_${c}`), idOf.get(`H${r + 1}_${c}`), idOf.get(`V${r}_${c}`), idOf.get(`V${r}_${c + 1}`)], p.clues[r][c]]);
  }
  const dotList = [];
  for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
    const out = [];
    if (j > 0) out.push(idOf.get(`H${i}_${j - 1}`));
    if (j < n) out.push(idOf.get(`H${i}_${j}`));
    if (i > 0) out.push(idOf.get(`V${i - 1}_${j}`));
    if (i < n) out.push(idOf.get(`V${i}_${j}`));
    dotList.push(out);
  }
  const nDots = (n + 1) * (n + 1);
  return { n, E, edges, idOf, cellClues, dotList, nDots };
}

// Returns { count (capped at `cap`), capped, nodes, sols: Int8Array[] }.
function solveSlitherlink(ctx, cap = 2, nodeCap = 4_000_000) {
  const { E, edges, cellClues, dotList, nDots } = ctx;
  const st = new Int8Array(E);
  const log = [];
  let contradiction = false;

  function setEdge(idx, v) {
    if (st[idx] === v) return true;
    if (st[idx] !== 0) { contradiction = true; return false; }
    st[idx] = v; log.push(idx);
    return true;
  }
  function undoTo(mark) { while (log.length > mark) st[log.pop()] = 0; }

  // Union-find over currently-on edges, rebuilt with plain typed arrays
  // (cheap: nDots is at most 121) whenever the loop-closure rule needs it.
  const ufParent = new Int32Array(nDots);
  function buildUF() {
    for (let i = 0; i < nDots; i++) ufParent[i] = i;
    const find = (x) => { while (ufParent[x] !== x) x = ufParent[x]; return x; };
    for (const e of edges) {
      if (st[e.id] !== 1) continue;
      const ra = find(e.a), rb = find(e.b);
      if (ra !== rb) ufParent[ra] = rb;
    }
    return find;
  }

  function propagate() {
    let changed = true, guard = 0;
    while (changed && !contradiction) {
      changed = false;
      if (++guard > 1000) break;
      for (const [es, cl] of cellClues) {
        let on = 0, unk = [];
        for (const e of es) { const s = st[e]; if (s === 1) on++; else if (s === 0) unk.push(e); }
        if (on > cl || on + unk.length < cl) { contradiction = true; return; }
        if (unk.length) {
          if (on === cl) { for (const e of unk) if (!setEdge(e, -1)) return; changed = true; }
          else if (on + unk.length === cl) { for (const e of unk) if (!setEdge(e, 1)) return; changed = true; }
        }
      }
      if (contradiction) return;
      for (const es of dotList) {
        let on = 0, unk = [];
        for (const e of es) { const s = st[e]; if (s === 1) on++; else if (s === 0) unk.push(e); }
        if (on > 2) { contradiction = true; return; }
        if (on === 2 && unk.length) { for (const e of unk) if (!setEdge(e, -1)) return; changed = true; }
        else if (on === 1 && unk.length === 1) { if (!setEdge(unk[0], 1)) return; changed = true; }
        else if (on === 0 && unk.length === 1) { if (!setEdge(unk[0], -1)) return; changed = true; }
      }
      if (contradiction) return;
      // Loop-closure rule: an unknown edge that would connect two dots
      // already joined by on-edges would close a cycle. That is only legal
      // as the FINAL closing move of the single loop -- i.e. only if every
      // clue is already satisfiable with no more on-edges elsewhere. If any
      // clue would still need more, closing early is impossible, so the
      // edge must be off. This is what makes these puzzles tractable at all.
      const find = buildUF();
      for (const e of edges) {
        if (st[e.id] !== 0) continue;
        if (find(e.a) !== find(e.b)) continue;
        let stillNeeds = false;
        for (const [es, cl] of cellClues) {
          let on = 0;
          for (const e2 of es) { if (e2 === e.id) on++; else if (st[e2] === 1) on++; }
          if (on < cl) { stillNeeds = true; break; }
        }
        if (stillNeeds) { if (!setEdge(e.id, -1)) return; changed = true; }
      }
    }
  }

  function fullyDetermined() { for (let i = 0; i < E; i++) if (st[i] === 0) return false; return true; }
  function validateFinal() {
    for (const [es, cl] of cellClues) {
      let on = 0; for (const e of es) if (st[e] === 1) on++;
      if (on !== cl) return false;
    }
    const deg = new Int32Array(nDots);
    let any = false;
    for (const e of edges) if (st[e.id] === 1) { deg[e.a]++; deg[e.b]++; any = true; }
    if (!any) return false;
    const find = buildUF();
    let root = -1;
    for (let d = 0; d < nDots; d++) {
      if (deg[d] === 0) continue;
      if (deg[d] !== 2) return false;
      const r = find(d);
      if (root === -1) root = r; else if (r !== root) return false;
    }
    return true;
  }
  function pickEdge() {
    let best = -1, bestSlack = Infinity;
    for (const [es, cl] of cellClues) {
      let on = 0, unk = [];
      for (const e of es) { const s = st[e]; if (s === 1) on++; else if (s === 0) unk.push(e); }
      if (!unk.length) continue;
      const slack = Math.min(cl - on, unk.length - (cl - on));
      if (slack < bestSlack) { bestSlack = slack; best = unk[0]; }
    }
    if (best >= 0) return best;
    for (let i = 0; i < E; i++) if (st[i] === 0) return i;
    return -1;
  }

  const sols = [];
  let nodes = 0, capped = false;
  function bt() {
    if (sols.length >= cap || capped) return;
    if (++nodes > nodeCap) { capped = true; return; }
    const mark = log.length;
    propagate();
    if (contradiction) { contradiction = false; undoTo(mark); return; }
    if (fullyDetermined()) {
      if (validateFinal()) sols.push(st.slice());
      undoTo(mark);
      return;
    }
    const e = pickEdge();
    if (e < 0) { undoTo(mark); return; }
    for (const v of [1, -1]) {
      const mark2 = log.length;
      if (setEdge(e, v)) bt();
      contradiction = false;
      undoTo(mark2);
      if (sols.length >= cap || capped) break;
    }
    undoTo(mark);
  }
  bt();
  return { count: sols.length, capped, nodes, sols };
}


// ─── generation ────────────────────────────────────────────────────────────
function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const shuffle = (rng, a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const randInt = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));

const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const quizDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${m}-${d}-${String(y).slice(2)}`; };
const dateLabel = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const isSunday = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay() === 0;

// Region validity: connected (kept by growth), no holes, no corner-only pinch.
function validRegion(n, inR) {
  const at = (r, c) => r >= 0 && r < n && c >= 0 && c < n && inR[r * n + c];
  for (let r = 0; r < n - 1; r++) for (let c = 0; c < n - 1; c++) {
    const a = at(r, c), b = at(r, c + 1), d = at(r + 1, c), e = at(r + 1, c + 1);
    if ((a && e && !b && !d) || (b && d && !a && !e)) return false;
  }
  // every outside cell must reach the grid edge through outside cells
  const seen = new Uint8Array(n * n), q = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if ((r === 0 || c === 0 || r === n - 1 || c === n - 1) && !inR[r * n + c]) { seen[r * n + c] = 1; q.push(r * n + c); }
  }
  while (q.length) {
    const k = q.pop(), r = (k / n) | 0, c = k % n;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
      const kk = rr * n + cc;
      if (!inR[kk] && !seen[kk]) { seen[kk] = 1; q.push(kk); }
    }
  }
  for (let k = 0; k < n * n; k++) if (!inR[k] && !seen[k]) return false;
  return true;
}

function growRegion(rng, n) {
  const target = Math.round(n * n * (0.35 + rng() * 0.27));
  const inR = new Uint8Array(n * n);
  inR[randInt(rng, 0, n * n - 1)] = 1;
  let size = 1, stall = 0;
  while (size < target && stall < 400) {
    const front = [];
    for (let k = 0; k < n * n; k++) {
      if (inR[k]) continue;
      const r = (k / n) | 0, c = k % n;
      if ((r > 0 && inR[k - n]) || (r < n - 1 && inR[k + n]) || (c > 0 && inR[k - 1]) || (c < n - 1 && inR[k + 1])) front.push(k);
    }
    const k = front[Math.floor(rng() * front.length)];
    inR[k] = 1;
    if (validRegion(n, inR)) { size++; stall = 0; } else { inR[k] = 0; stall++; }
  }
  return size === target ? inR : null;
}

function candidate(num, ci, sunday, seen) {
  const n = sunday ? 10 : 7;
  for (let attempt = 0; attempt < 200; attempt++) {
    const rng = mulberry32(num * 7919 + ci * 104729 + attempt * 15485863 + 0x4ed6e);
    const inR = growRegion(rng, n);
    if (!inR) continue;
    const at = (r, c) => (r >= 0 && r < n && c >= 0 && c < n ? inR[r * n + c] : 0);
    const H = [], V = [];
    for (let i = 0; i <= n; i++) for (let j = 0; j < n; j++) if (at(i - 1, j) !== at(i, j)) H.push([i, j]);
    for (let i = 0; i < n; i++) for (let j = 0; j <= n; j++) if (at(i, j - 1) !== at(i, j)) V.push([i, j]);
    const Hs = new Set(H.map(String)), Vs = new Set(V.map(String));
    const full = [...Array(n)].map((_, r) => [...Array(n)].map((_, c) => Hs.has(`${r},${c}`) + Hs.has(`${r + 1},${c}`) + Vs.has(`${r},${c}`) + Vs.has(`${r},${c + 1}`)));
    const target = sunday ? randInt(rng, 48, 55) : randInt(rng, 26, 32);
    const clues = full.map((row) => row.slice());
    let count = n * n, nodes = 0;
    for (const k of shuffle(rng, [...Array(n * n).keys()])) {
      if (count === target) break;
      const r = (k / n) | 0, c = k % n, v = clues[r][c];
      clues[r][c] = null;
      const res = solveSlitherlink(buildCtx({ n, clues }), 2, 400_000);
      if (!res.capped && res.count === 1) { count--; nodes = res.nodes; } else clues[r][c] = v;
    }
    if (count !== target) continue;
    const key = JSON.stringify(clues);
    if (seen.has(key)) continue;
    const res = solveSlitherlink(buildCtx({ n, clues }), 2, 400_000);
    if (res.capped || res.count !== 1) continue;
    return { n, clues, H, V, count, nodes: res.nodes, key };
  }
  return null;
}

const { PUZZLES } = await import(BANK);
const last = PUZZLES[PUZZLES.length - 1];
const seen = new Set(PUZZLES.map((p) => JSON.stringify(p.clues)));
const out = [];
for (let i = 1; i <= DAYS; i++) {
  const num = last.num + i, live = addDays(last.live, i), sunday = isSunday(live);
  let best = null;
  const K = sunday ? SUNCANDS : CANDS;
  for (let ci = 0; ci < K; ci++) {
    const c = candidate(num, ci, sunday, seen);
    if (c && (!best || c.nodes > best.nodes)) best = c;
  }
  if (!best) throw new Error(`hedge #${num}: no board found`);
  seen.add(best.key);
  console.error(`hedge #${num} ${live}${sunday ? ' Sun' : ''}: ${best.n}x${best.n}, ${best.count} clues, ${best.nodes} nodes`);
  out.push(`  {
    num: ${num},
    quizId: 'hedge-${quizDate(live)}',
    live: '${live}',
    dateLabel: '${dateLabel(live)}',
    sunday: ${sunday},
    n: ${best.n}, clueCount: ${best.count},
    clues: ${JSON.stringify(best.clues)},
    H: ${JSON.stringify(best.H)},
    V: ${JSON.stringify(best.V)},
  },\n`);
}
const block = out.join('');
if (WRITE) {
  const text = readFileSync(BANK, 'utf8');
  if (!text.endsWith('\n];\n')) throw new Error('bank does not end with "\\n];\\n"');
  writeFileSync(BANK, text.slice(0, -3) + block + '];\n');
  console.error(`appended ${DAYS} boards to ${BANK}`);
} else process.stdout.write(block);
