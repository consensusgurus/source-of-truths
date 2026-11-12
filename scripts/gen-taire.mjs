// gen-taire.mjs: extends the Taire bank (app/taire/puzzles.js), APPEND-ONLY.
//
//   node scripts/gen-taire.mjs --to 2026-12-31 [--dry]
//
// Written for the 2026-11-12 restock. The bank's first 126 boards were built by
// a script nobody committed, so this is the committed way to extend it. It never
// rewrites a frozen board: it parses the bank, deals only the days after the
// last live date (numbered on from the last num), and splices them in before
// the closing `];` without touching one byte of the frozen text.
//
// THE RULES are app/taire/rules.js (one card at a time; onto a column whose
// bottom card is one rank higher and the other colour, an empty column, a free
// cell, or its foundation). The bank header promises that `par` is the EXACT
// minimum number of single-card moves, "found by breadth-first search ... then
// confirmed by a second solver written independently of the first". This
// script keeps that promise with two solvers that share no code:
//
//   SOLVER A  best-first A* over states with the columns sorted (moves are
//             symmetric under relabelling columns, so the minimum is too) and
//             the free cells as a set. Heuristic: every card not home needs
//             one move, and a column card resting on a LOWER card of its OWN
//             suit needs two (it must step off before that card goes home, and
//             cannot go home itself first). Each move lowers that bound by at
//             most one, so it is consistent and A* returns the true minimum.
//             It also returns one optimal line with real column indices.
//   SOLVER B  depth-first search with a different, weaker bound (cards not
//             home only), raw (unsorted) state keys and its own move generator,
//             asked to find ANY win in par - 1 moves. It must exhaust without
//             one, which proves no shorter line exists.
//   And the line from A is replayed through app/taire/rules.js `apply`, which
//   must accept every move and end won in exactly `par` moves.
// A deal either solver cannot finish inside its node budget is discarded, never
// shipped with an unproved par. Budgets cap work, never claims.
//
// THE WEEK (header rule, and the bands the frozen boards actually use):
//   Mon 16 cards, 2 cells, perfect 18 to 20    (header band for Mon-Wed: 18-24;
//   Tue 16 cards, 2 cells, perfect 21 to 22     the frozen bank climbs inside it,
//   Wed 16 cards, 2 cells, perfect 23 to 24     so the new boards do too)
//   Thu-Sat 20 cards, 2 cells, perfect 28 to 34
//   Sunday Edition 20 cards, 1 cell, perfect 34 to 48
// Each day draws deals off its BOARD NUMBER (seed SEED_BASE + num * 104729 +
// attempt) until one lands in the day's band, so the par is whatever the first
// such deal measures: varied, not pinned to a floor. SUNDAYS are the exception,
// because a long one-cell par is rare: the first deal in band measured 34 to 36
// on every Sunday of a trial run, the floor of a band the frozen Sundays use
// from 34 to 48 (mean 39). So a Sunday collects SUNDAY_POOL proved deals in its
// band and takes the one at a rotating quantile of their pars (0.5, 1, 0.25,
// 0.75 by Sunday), which spreads the new Sundays across the band.
//
// VARIETY: no deal repeats, and the exposed-card signature (the bottom card of
// every column, sorted) stays within scripts/verify-taire.mjs's ceiling of 3
// across the whole bank.
import fs from 'fs';
import { fromData, apply, isWon } from '../app/taire/rules.js';

const FILE = new URL('../app/taire/puzzles.js', import.meta.url);
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const TO = opt('--to', '2026-12-31');
const DRY = args.includes('--dry');
const SEED_BASE = 0x7a17e000;               // lane-e 2026-11-12 offset
const MAX_ATTEMPTS = 4000;
const A_BUDGET = 3_000_000, B_BUDGET = 40_000_000;
const EXPOSED_CEILING = 3;
const SUNDAY_POOL = 8;
const SUNDAY_Q = [0.5, 1, 0.25, 0.75];
const RUNG = {
  1: { ranks: 8, cells: 2, lo: 18, hi: 20 },
  2: { ranks: 8, cells: 2, lo: 21, hi: 22 },
  3: { ranks: 8, cells: 2, lo: 23, hi: 24 },
  4: { ranks: 10, cells: 2, lo: 28, hi: 34 },
  5: { ranks: 10, cells: 2, lo: 28, hi: 34 },
  6: { ranks: 10, cells: 2, lo: 28, hi: 34 },
  0: { ranks: 10, cells: 1, lo: 34, hi: 48 },
};

function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function deal(ranks, rnd) {
  const deck = []; for (let r = 1; r <= ranks; r++) deck.push(r, 16 + r);
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  const cols = []; for (let c = 0; c < ranks / 2; c++) cols.push(deck.slice(c * 4, c * 4 + 4));
  return cols;
}

// ---------------------------------------------------------------- SOLVER A
const S = (c) => c >> 4, R = (c) => c & 15;
function hA(st) {
  let h = 0;
  for (const col of st.cols) {
    for (let i = 0; i < col.length; i++) {
      h++;
      for (let j = 0; j < i; j++) if (S(col[j]) === S(col[i]) && R(col[j]) < R(col[i])) { h++; break; }
    }
  }
  return h + st.free.length;
}
const keyA = (st) => st.cols.map((c) => c.join(',')).sort().join('|') + '/' + st.free.slice().sort((a, b) => a - b).join(',') + '/' + st.fnd[0] + ',' + st.fnd[1];
function movesA(st, cells) {
  const out = [];
  const src = [];
  st.cols.forEach((col, i) => { if (col.length) src.push([col[col.length - 1], 'c', i]); });
  st.free.forEach((c, i) => src.push([c, 'f', i]));
  for (const [card, kind, i] of src) {
    if (st.fnd[S(card)] === R(card) - 1) out.push([card, 200, kind, i]);
    for (let j = 0; j < st.cols.length; j++) {
      if (kind === 'c' && j === i) continue;
      const col = st.cols[j];
      if (!col.length) { if (!(kind === 'c' && st.cols[i].length === 1)) out.push([card, j, kind, i]); continue; }
      const top = col[col.length - 1];
      if (R(top) === R(card) + 1 && S(top) !== S(card)) out.push([card, j, kind, i]);
    }
    if (kind === 'c' && st.free.length < cells) out.push([card, 100, kind, i]);
  }
  return out;
}
function stepA(st, [card, dest, kind, i]) {
  const n = { cols: st.cols.map((c) => c.slice()), free: st.free.slice(), fnd: st.fnd.slice() };
  if (kind === 'c') n.cols[i].pop(); else n.free.splice(i, 1);
  if (dest === 200) n.fnd[S(card)] = R(card); else if (dest === 100) n.free.push(card); else n.cols[dest].push(card);
  return n;
}
export function solveA(cols, ranks, cells, budget = A_BUDGET) {
  const start = { cols: cols.map((c) => c.slice()), free: [], fnd: [0, 0] };
  const nodes = [{ st: start, g: 0, parent: -1, mv: null }];
  const best = new Map([[keyA(start), 0]]);
  const buckets = []; const push = (f, id) => { (buckets[f] ||= []).push(id); };
  push(hA(start), 0);
  let expanded = 0;
  for (let f = 0; f < buckets.length || f < 200; f++) {
    const b = buckets[f]; if (!b) continue;
    while (b.length) {
      const id = b.pop(); const nd = nodes[id];
      if (best.get(keyA(nd.st)) < nd.g) continue;
      if (nd.st.fnd[0] === ranks && nd.st.fnd[1] === ranks) {
        const line = []; for (let k = id; nodes[k].parent >= 0; k = nodes[k].parent) line.push(nodes[k].mv);
        return { par: nd.g, line: line.reverse(), expanded };
      }
      if (++expanded > budget) return { capped: true, expanded };
      for (const m of movesA(nd.st, cells)) {
        const ns = stepA(nd.st, m); const k = keyA(ns); const g = nd.g + 1;
        if (best.has(k) && best.get(k) <= g) continue;
        best.set(k, g);
        nodes.push({ st: ns, g, parent: id, mv: [m[0], m[1]] });
        push(g + hA(ns), nodes.length - 1);
      }
    }
  }
  return { unsolvable: true, expanded };
}

// ---------------------------------------------------------------- SOLVER B
// Independent: flat arrays, raw keys, its own legality, weaker bound.
export function noWinWithin(cols, ranks, cells, limit, budget = B_BUDGET) {
  const ncol = cols.length;
  const C = cols.map((c) => c.slice());
  const F = [];
  const home = [0, 0];
  const seen = new Map();
  let visits = 0, found = false, capped = false;
  const left = () => 2 * ranks - home[0] - home[1];
  const key = () => C.map((c) => c.join('.')).join(';') + ':' + F.slice().sort((a, b) => a - b).join('.') + ':' + home.join('.');
  function dfs(depth) {
    if (found || capped) return;
    if (home[0] === ranks && home[1] === ranks) { found = true; return; }
    if (depth + left() > limit) return;
    const k = key(); const prev = seen.get(k);
    if (prev !== undefined && prev <= depth) return;
    seen.set(k, depth);
    if (++visits > budget) { capped = true; return; }
    // free-cell cards
    for (let fi = 0; fi < F.length; fi++) {
      const card = F[fi], s = card >> 4, r = card & 15;
      if (home[s] === r - 1) { F.splice(fi, 1); home[s] = r; dfs(depth + 1); home[s] = r - 1; F.splice(fi, 0, card); }
      for (let j = 0; j < ncol; j++) {
        const t = C[j].length ? C[j][C[j].length - 1] : -1;
        if (t === -1 || ((t & 15) === r + 1 && (t >> 4) !== s)) { F.splice(fi, 1); C[j].push(card); dfs(depth + 1); C[j].pop(); F.splice(fi, 0, card); }
      }
    }
    // column bottoms
    for (let i = 0; i < ncol; i++) {
      if (!C[i].length) continue;
      const card = C[i].pop(), s = card >> 4, r = card & 15;
      if (home[s] === r - 1) { home[s] = r; dfs(depth + 1); home[s] = r - 1; }
      for (let j = 0; j < ncol; j++) {
        if (j === i) continue;
        const t = C[j].length ? C[j][C[j].length - 1] : -1;
        if (t === -1 || ((t & 15) === r + 1 && (t >> 4) !== s)) { C[j].push(card); dfs(depth + 1); C[j].pop(); }
      }
      if (F.length < cells) { F.push(card); dfs(depth + 1); F.pop(); }
      C[i].push(card);
    }
  }
  dfs(0);
  return { found, capped, visits };
}

// ---------------------------------------------------------------- the deal
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const addDay = (iso) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };
const exposedSig = (cols) => cols.map((c) => c[c.length - 1]).slice().sort((a, b) => a - b).join(',');

const isMain = process.argv[1] && new URL(import.meta.url).pathname === process.argv[1];
if (isMain) {
  const src = fs.readFileSync(FILE, 'utf8');
  const { PUZZLES } = await import(FILE.href);
  const last = PUZZLES[PUZZLES.length - 1];
  if (last.live >= TO) { console.log(`taire already runs to ${last.live}`); process.exit(0); }
  const deals = new Set(PUZZLES.map((p) => p.cols.map((c) => c.join(',')).join('|')));
  const exposed = new Map(); for (const p of PUZZLES) { const k = exposedSig(p.cols); exposed.set(k, (exposed.get(k) || 0) + 1); }
  const out = [];
  let live = last.live, num = last.num;
  while (live < TO) {
    live = addDay(live); num++;
    const dow = new Date(live + 'T12:00:00Z').getUTCDay();
    const rung = RUNG[dow];
    let got = null, tries = 0, t0 = Date.now();
    const pool = [], want = dow === 0 ? SUNDAY_POOL : 1;
    for (let attempt = 0; attempt < MAX_ATTEMPTS && pool.length < want; attempt++) {
      tries++;
      const cols = deal(rung.ranks, rng(SEED_BASE + num * 104729 + attempt));
      const dk = cols.map((c) => c.join(',')).join('|');
      if (deals.has(dk)) continue;
      if ((exposed.get(exposedSig(cols)) || 0) >= EXPOSED_CEILING) continue;
      const a = solveA(cols, rung.ranks, rung.cells);
      if (a.capped || a.unsolvable) continue;
      if (a.par < rung.lo || a.par > rung.hi) continue;
      // replay through the live rules engine
      let s = fromData(cols); let okLine = true;
      for (const mv of a.line) { const n = apply(s, mv, rung.cells); if (!n) { okLine = false; break; } s = n; }
      if (!okLine || !isWon(s, rung.ranks) || a.line.length !== a.par) throw new Error(`#${num}: solver A line rejected by rules.js`);
      const b = noWinWithin(cols, rung.ranks, rung.cells, a.par - 1);
      if (b.capped) continue;                       // cannot prove minimality: discard
      if (b.found) throw new Error(`#${num}: solver B found a win in ${a.par - 1}, solver A said ${a.par}`);
      if (pool.some((q) => exposedSig(q.cols) === exposedSig(cols))) continue;
      pool.push({ cols, par: a.par, line: a.line, aExp: a.expanded, bVis: b.visits });
    }
    if (pool.length === want) {
      if (want === 1) got = pool[0];
      else {
        const sorted = pool.map((q, i) => [q, i]).sort((x, y) => x[0].par - y[0].par || x[1] - y[1]).map((x) => x[0]);
        const q = SUNDAY_Q[Math.floor(num / 7) % SUNDAY_Q.length];
        got = sorted[Math.round(q * (sorted.length - 1))];
      }
    }
    if (!got) throw new Error(`#${num} ${live}: not enough deals in band [${rung.lo}, ${rung.hi}] within ${MAX_ATTEMPTS} attempts`);
    if (want > 1) console.log(`  Sunday pool pars ${pool.map((q) => q.par).sort((x, y) => x - y).join(' ')}`);
    deals.add(got.cols.map((c) => c.join(',')).join('|'));
    const ek = exposedSig(got.cols); exposed.set(ek, (exposed.get(ek) || 0) + 1);
    const [y, m, d] = live.split('-').map(Number);
    out.push({ num, quizId: `taire-${m}-${d}-${String(y).slice(2)}`, live, dateLabel: `${MONTHS[m - 1]} ${d}, ${y}`, sunday: dow === 0,
      ranks: rung.ranks, cells: rung.cells, par: got.par, cols: got.cols, line: got.line });
    console.log(`#${num} ${live} dow ${dow} par ${got.par} (try ${tries}, A ${got.aExp}, B ${got.bVis}, ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  }
  const fmt = (p) => [
    '  {',
    `    num: ${p.num},`,
    `    quizId: '${p.quizId}',`,
    `    live: '${p.live}',`,
    `    dateLabel: '${p.dateLabel}',`,
    `    sunday: ${p.sunday},`,
    `    ranks: ${p.ranks},`,
    `    cells: ${p.cells},`,
    `    par: ${p.par},`,
    `    cols: ${JSON.stringify(p.cols)},`,
    `    line: ${JSON.stringify(p.line)},`,
    '  },',
  ].join('\n');
  const close = src.lastIndexOf('];');
  if (close < 0 || src.slice(close).trim() !== '];' || !/\},\n$/.test(src.slice(0, close))) throw new Error('unexpected bank tail');
  const next = src.slice(0, close) + out.map(fmt).join('\n') + '\n' + src.slice(close);
  if (DRY) console.log(`dry run: ${out.length} boards`);
  else { fs.writeFileSync(FILE, next); console.log(`appended ${out.length} boards to ${live}`); }
}
