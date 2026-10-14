// Generator for Cell, the daily FreeCell (app/cell/puzzles.js).
//
//   node scripts/gen-cell.mjs --measure <ranks> <cols> <cells> <n> [cap]   distribution study
//   node scripts/gen-cell.mjs --day <YYYY-MM-DD>                           one day, JSON to stdout
//   node scripts/gen-cell.mjs --build [--from D] [--until D]               days into the progress file
//   node scripts/gen-cell.mjs --write                                       progress file -> app/cell/puzzles.js
//
// Deals are seeded off their date, so any day can be regenerated alone and the
// build can run in pieces, two at once on two date ranges: each finished day is
// appended to a progress file ($CELL_PROGRESS, default <tmpdir>/cell-progress.jsonl)
// and a day already in it is skipped. `--write` turns the progress file into
// app/cell/puzzles.js; it refuses a gap or a missing day. Extending the bank
// later: `--build --from <day after the last> --until <new end>` then
// `--write --keep`, which keeps every board already in puzzles.js byte for byte.
//
// The solver below is the generator's own. scripts/verify-cell.mjs carries a
// second one written separately, and every banked `perfect` is re-proved by it.
//
// MEASURED 2026-10-14 (`--measure`, random deals, exact A* below):
//   32 cards (ace to 8), 6 columns, 4 free cells: 10/10 solved; perfect min 13,
//     p25 15, median 16, p75 17, max 18; median 0.7s, p90 15s.
//   32 cards, 6 columns, 3 cells: 20/20 solved; min 12, p25 15, median 17,
//     p75 18, max 21; median 0.6s, p90 8s.
//   32 cards, 6 columns, 2 cells: 19/20 solved, 1 dead (no win exists); min 12,
//     p25 16, median 18, p75 20, max 22; median 0.6s, p90 6s.
//   40 cards (ace to 10), 7 columns, 3 cells: 8/9 inside 2,000,000 expansions,
//     perfect 13 to 25, median about 21; up to 62s.
//   40 cards, 7 columns, 2 cells: 11/12 inside 2,000,000; min 14, p25 20,
//     median 24, p75 27, max 31; median 2.6s, p90 21s.
// So an exact solver handles the 40-card Sunday in seconds on most deals, and
// the Sunday Edition is the bigger deck. Fewer cells barely lengthens the
// perfect line (16 -> 17 -> 18 at the median) but it is what makes a deal hard
// to FIND, so the week turns both dials: cells fall Mon to Sat and each day
// takes a perfect band that starts where the day before ends (RAMP below), which
// makes perfect non-decreasing from Monday to Saturday by construction.
// A deal is thrown away when it is dead, when the solver's cap runs out first
// (so the bank leans slightly away from the very hardest deals), or when its
// perfect falls outside the day's band (too short is the "trivial" case).
import { writeFileSync, readFileSync, existsSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as core from '../lib/cell-core.js';

// ---------------------------------------------------------------------------
// The exact solver: A* over canonical positions.
//
// A position is its column strings (one char per card), sorted because columns
// are interchangeable under the rules, plus the sorted free cells and the four
// foundations. Every player move costs one; safe autoplay runs after each move
// and costs nothing, exactly as lib/cell-core.js plays it.
//
// The heuristic counts cards that need a PLAYER move: a card must be player
// moved when something beneath it in its own column has to reach home before it
// can leave by autoplay (a lower card of its own suit, or, above rank two, a
// card of the other colour at least one rank lower, because autoplay waits for
// those). Such a card is counted when it is on top or the card on it is not a
// legal tableau link. Two counted cards in one column can never leave in the
// same move (the bad link between them is in the way) and a move has one source
// column, so the count is a lower bound on the moves left. It is admissible but
// not consistent, so the search re-opens a position reached more cheaply and
// the first goal popped is the exact minimum.
// ---------------------------------------------------------------------------
const CH = (c) => String.fromCharCode(48 + c);
const suitOf = (c) => c >> 4;
const rankOf = (c) => c & 15;
const redOf = (c) => (c >> 4) & 1;
const link = (lo, up) => rankOf(up) === rankOf(lo) - 1 && redOf(up) !== redOf(lo);

const hCache = new Map();
function colH(s) {
  let v = hCache.get(s);
  if (v !== undefined) return v;
  v = 0;
  let s0 = 99, s1 = 99, s2 = 99, s3 = 99;
  const L = s.length;
  for (let i = 0; i < L; i++) {
    const c = s.charCodeAt(i) - 48, su = c >> 4, r = c & 15;
    const own = su === 0 ? s0 : su === 1 ? s1 : su === 2 ? s2 : s3;
    const opp = (su & 1) ? (s0 < s2 ? s0 : s2) : (s1 < s3 ? s1 : s3);
    if (own < r || (r > 2 && opp <= r - 1)) {
      if (i === L - 1 || !link(c, s.charCodeAt(i + 1) - 48)) v++;
    }
    if (su === 0) { if (r < s0) s0 = r; } else if (su === 1) { if (r < s1) s1 = r; } else if (su === 2) { if (r < s2) s2 = r; } else if (r < s3) s3 = r;
  }
  if (hCache.size > 2_000_000) hCache.clear();
  hCache.set(s, v);
  return v;
}
const runCache = new Map();
function runOf(s) {
  let v = runCache.get(s);
  if (v !== undefined) return v;
  v = s.length ? 1 : 0;
  for (let k = s.length - 1; k > 0 && link(s.charCodeAt(k - 1) - 48, s.charCodeAt(k) - 48); k--) v++;
  if (runCache.size > 2_000_000) runCache.clear();
  runCache.set(s, v);
  return v;
}

function safeHome(d, c) {
  const r = c & 15;
  if (d[c >> 4] !== r - 1) return false;
  if (r <= 2) return true;
  if ((c >> 4) & 1) return d[0] >= r - 1 && d[2] >= r - 1;
  return d[1] >= r - 1 && d[3] >= r - 1;
}
// autoplay in place on (cols: string[], free: string, d: number[]); returns free
function autoS(cols, free, d) {
  for (;;) {
    let hit = false;
    for (let i = 0; i < cols.length; i++) {
      const s = cols[i];
      if (!s.length) continue;
      const c = s.charCodeAt(s.length - 1) - 48;
      if (safeHome(d, c)) { cols[i] = s.slice(0, -1); d[c >> 4] = c & 15; hit = true; i--; }
    }
    for (let k = 0; k < free.length; k++) {
      const c = free.charCodeAt(k) - 48;
      if (safeHome(d, c)) { free = free.slice(0, k) + free.slice(k + 1); d[c >> 4] = c & 15; hit = true; k--; }
    }
    if (!hit) return free;
  }
}
const keyOf = (cols, free, d) => cols.slice().sort().join(',') + '|' + free + '|' + CH(d[0]) + CH(d[1]) + CH(d[2]) + CH(d[3]);
const insFree = (free, ch) => { let k = 0; while (k < free.length && free[k] < ch) k++; return free.slice(0, k) + ch + free.slice(k); };

// Move code: card | n << 6 | dest << 10; dest = TOP CARD of the destination
// column (0..63), 64 an empty column, 65 a free cell, 66 home.
const D_EMPTY = 64, D_FREE = 65, D_FND = 66;

export function solve(deal, cells, ranks, { cap = 2_000_000 } = {}) {
  const c0 = deal.map((col) => col.map(CH).join(''));
  const d0 = [0, 0, 0, 0];
  const f0 = autoS(c0, '', d0);
  const goal = '|' + CH(ranks).repeat(4);
  const k0 = keyOf(c0, f0, d0);
  const keys = [k0], g = [0], par = [-1], mv = [0];
  const index = new Map([[k0, 0]]);
  const buckets = [];
  const push = (id, f) => { (buckets[f] || (buckets[f] = [])).push(id); };
  const hOf = (cols) => { let h = 0; for (const s of cols) h += colH(s); return h; };
  push(0, hOf(c0));
  let f = 0, nodes = 0;
  for (;;) {
    while (f < buckets.length && (!buckets[f] || !buckets[f].length)) f++;
    if (f >= buckets.length) return { perfect: -1, nodes, dead: true };
    const id = buckets[f].pop();
    const key = keys[id];
    const bar1 = key.indexOf('|'), bar2 = key.indexOf('|', bar1 + 1);
    const cols = key.slice(0, bar1).split(',');
    const gi = g[id];
    if (gi + hOf(cols) !== f) continue; // stale: re-opened cheaper
    if (key.endsWith(goal)) {
      const line = [];
      for (let x = id; par[x] >= 0; x = par[x]) line.push(mv[x]);
      return { perfect: gi, nodes, line: line.reverse() };
    }
    if (++nodes > cap) return { perfect: -1, nodes, capped: true };
    const free = key.slice(bar1 + 1, bar2);
    const d = [key.charCodeAt(bar2 + 1) - 48, key.charCodeAt(bar2 + 2) - 48, key.charCodeAt(bar2 + 3) - 48, key.charCodeAt(bar2 + 4) - 48];
    let emptyCols = 0;
    for (const s of cols) if (!s.length) emptyCols++;
    const emptyCells = cells - free.length;
    const ng = gi + 1;
    const emit = (nc, nf, nd, code) => {
      nf = autoS(nc, nf, nd);
      const ck = keyOf(nc, nf, nd);
      let cid = index.get(ck);
      if (cid === undefined) {
        cid = keys.length; keys.push(ck); g.push(ng); par.push(id); mv.push(code); index.set(ck, cid);
      } else if (ng < g[cid]) { g[cid] = ng; par[cid] = id; mv[cid] = code; } else return;
      let h = 0; for (const s of nc) h += colH(s);
      push(cid, ng + h);
    };
    for (let i = 0; i < cols.length; i++) {
      const s = cols[i];
      const L = s.length;
      if (!L) continue;
      const run = runOf(s);
      const top = s.charCodeAt(L - 1) - 48;
      if (d[top >> 4] === (top & 15) - 1) {
        const nc = cols.slice(); nc[i] = s.slice(0, -1); const nd = d.slice(); nd[top >> 4] = top & 15;
        emit(nc, free, nd, top | (1 << 6) | (D_FND << 10));
      }
      if (emptyCells > 0) {
        const nc = cols.slice(); nc[i] = s.slice(0, -1);
        emit(nc, insFree(free, s[L - 1]), d.slice(), top | (1 << 6) | (D_FREE << 10));
      }
      let seenEmpty = false;
      for (let j = 0; j < cols.length; j++) {
        if (j === i) continue;
        const t = cols[j];
        if (!t.length) {
          if (seenEmpty) continue;
          seenEmpty = true;
          const cap2 = (emptyCells + 1) * (1 << (emptyCols - 1));
          for (let n = 1; n <= run && n <= cap2; n++) {
            if (n === L) continue;
            const nc = cols.slice(); nc[i] = s.slice(0, L - n); nc[j] = s.slice(L - n);
            emit(nc, free, d.slice(), (s.charCodeAt(L - n) - 48) | (n << 6) | (D_EMPTY << 10));
          }
        } else {
          const tc = t.charCodeAt(t.length - 1) - 48;
          const n = (tc & 15) - 1 - (top & 15) + 1;
          if (n >= 1 && n <= run && link(tc, s.charCodeAt(L - n) - 48) && n <= (emptyCells + 1) * (1 << emptyCols)) {
            const nc = cols.slice(); nc[i] = s.slice(0, L - n); nc[j] = t + s.slice(L - n);
            emit(nc, free, d.slice(), (s.charCodeAt(L - n) - 48) | (n << 6) | (tc << 10));
          }
        }
      }
    }
    for (let k = 0; k < free.length; k++) {
      const c = free.charCodeAt(k) - 48;
      const nf = free.slice(0, k) + free.slice(k + 1);
      if (d[c >> 4] === (c & 15) - 1) { const nd = d.slice(); nd[c >> 4] = c & 15; emit(cols.slice(), nf, nd, c | (1 << 6) | (D_FND << 10)); }
      let seenEmpty = false;
      for (let j = 0; j < cols.length; j++) {
        const t = cols[j];
        if (!t.length) { if (seenEmpty) continue; seenEmpty = true; const nc = cols.slice(); nc[j] = free[k]; emit(nc, nf, d.slice(), c | (1 << 6) | (D_EMPTY << 10)); }
        else if (link(t.charCodeAt(t.length - 1) - 48, c)) { const nc = cols.slice(); nc[j] = t + free[k]; emit(nc, nf, d.slice(), c | (1 << 6) | ((t.charCodeAt(t.length - 1) - 48) << 10)); }
      }
    }
  }
}

// Solver move codes -> lib/cell-core moves ([card, n, dest]), played on a real
// table with real column positions. Throws if cell-core disagrees, which is the
// cross-check between the two rule sets.
export function lineToMoves(line, deal, cells) {
  let s = core.startState(deal, cells);
  const out = [];
  for (const code of line) {
    const card = code & 63, n = (code >> 6) & 15, dd = code >> 10;
    let dest;
    if (dd === D_FND) dest = core.FND;
    else if (dd === D_FREE) dest = core.FREE;
    else if (dd === D_EMPTY) dest = s.cols.findIndex((c) => !c.length);
    else dest = s.cols.findIndex((c) => c.length && c[c.length - 1] === dd);
    const m = [card, n, dest];
    const r = core.applyMove(s, m);
    if (!r) throw new Error(`solver move ${JSON.stringify(m)} is illegal in lib/cell-core`);
    out.push(m);
    s = r.state;
  }
  return { moves: out, state: s };
}

// ---------------------------------------------------------------------------
// The week. ranks = top rank (8 = ace to eight), cols = tableau columns.
export const RAMP = {
  1: { name: 'Monday', ranks: 8, cols: 6, cells: 4, lo: 13, hi: 15 },
  2: { name: 'Tuesday', ranks: 8, cols: 6, cells: 4, lo: 15, hi: 16 },
  3: { name: 'Wednesday', ranks: 8, cols: 6, cells: 3, lo: 16, hi: 17 },
  4: { name: 'Thursday', ranks: 8, cols: 6, cells: 3, lo: 17, hi: 18 },
  5: { name: 'Friday', ranks: 8, cols: 6, cells: 2, lo: 18, hi: 20 },
  6: { name: 'Saturday', ranks: 8, cols: 6, cells: 2, lo: 20, hi: 22 },
  0: { name: 'Sunday', ranks: 10, cols: 7, cells: 2, lo: 24, hi: 30 },
};
export const FIRST = '2026-10-14';
const CAP_WEEK = 600_000, CAP_SUN = 1_200_000;

const dowOf = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();
const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
function seedOf(iso) { let h = 2166136261; for (const ch of `cell:${iso}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

export function makeDay(iso, { log = () => {} } = {}) {
  const spec = RAMP[dowOf(iso)];
  const base = seedOf(iso);
  for (let k = 0; k < 400; k++) {
    const deal = core.dealFor(core.mulberry32((base + k * 7919) >>> 0), spec.ranks, spec.cols);
    const t = Date.now();
    const r = solve(deal, spec.cells, spec.ranks, { cap: spec.ranks === 10 ? CAP_SUN : CAP_WEEK });
    log(`${iso} draw ${k}: perfect ${r.perfect} nodes ${r.nodes} ${Date.now() - t}ms${r.capped ? ' CAP' : r.dead ? ' DEAD' : ''}`);
    if (r.perfect < spec.lo || r.perfect > spec.hi) continue;
    const { state } = lineToMoves(r.line, deal, spec.cells);
    if (!core.isWon(state, spec.ranks)) throw new Error(`${iso}: solver line does not win under lib/cell-core`);
    return { live: iso, ranks: spec.ranks, cells: spec.cells, deal, perfect: r.perfect, nodes: r.nodes, draw: k };
  }
  throw new Error(`${iso}: no deal in band after 400 draws`);
}

const HEAD = `// Puzzle data for Cell, the daily FreeCell. GENERATED by scripts/gen-cell.mjs;
// do not hand edit (extend with \`--build\` then \`--write --keep\`). Imported ONLY
// by the server page (app/cell/page.js), which filters live <= today before the
// bank reaches the client, so tomorrow's deal never reaches a browser.
//
// Card code = suit * 16 + rank: suits 0 spades, 1 hearts, 2 clubs, 3 diamonds
// (colour = suit & 1, 1 red), rank 1 (ace) to 10.
//
// Fields, per board:
//   num, quizId ('cell-M-D-YY'), live ('YYYY-MM-DD'), dateLabel, sunday
//             the usual daily fields; sunday is true only on a real Sunday.
//   ranks     top rank of the deck: 8 (ace to eight, 32 cards) Monday to
//             Saturday, 10 (ace to ten, 40 cards) on the Sunday Edition.
//   cells     free cells the day allows.
//   perfect   the EXACT minimum number of player moves to send every card home
//             under the rules in lib/cell-core.js: every player move counts one
//             (a sequence move included), safe autoplay after each move counts
//             nothing. Found by A* with an admissible bound in the generator and
//             proved again by the independent solver in scripts/verify-cell.mjs.
//             Par and the score are derived from it in lib/par.js.
//   deal      the columns, BOTTOM card first, dealt round robin, so the first
//             columns hold one card more (32 cards: 6,6,5,5,5,5; 40: 6,6,6,6,6,5,5).
//
// NO SOLUTION SHIPS. The winning line is never banked and never shown.
//
// The week (measured, see the MEASURED block in scripts/gen-cell.mjs):
//   Monday     32 cards, 6 columns, 4 cells, perfect 13-15
//   Tuesday    32 cards, 6 columns, 4 cells, perfect 15-16
//   Wednesday  32 cards, 6 columns, 3 cells, perfect 16-17
//   Thursday   32 cards, 6 columns, 3 cells, perfect 17-18
//   Friday     32 cards, 6 columns, 2 cells, perfect 18-20
//   Saturday   32 cards, 6 columns, 2 cells, perfect 20-22
//   Sunday Edition  40 cards, 7 columns, 2 cells, perfect 24-30
// Each weekday band starts where the day before ends, so perfect never falls
// from Monday to Saturday. A deal is rejected when it is dead (no win), when the
// solver's budget runs out first, or when its perfect falls outside the band
// (too short is the trivial case). No deal repeats.

`;

const PROGRESS = process.env.CELL_PROGRESS || join(tmpdir(), 'cell-progress.jsonl');
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };

if (argv[0] === '--day') {
  console.log(JSON.stringify(makeDay(argv[1], { log: (m) => console.error(m) })));
}

if (argv[0] === '--build') {
  const from = arg('--from', FIRST), until = arg('--until', '2027-01-31');
  const have = new Set(existsSync(PROGRESS) ? readFileSync(PROGRESS, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).live) : []);
  for (let d = from; d <= until; d = addDays(d, 1)) {
    if (have.has(d)) continue;
    const t = Date.now();
    const day = makeDay(d);
    appendFileSync(PROGRESS, JSON.stringify(day) + '\n');
    console.log(`${d} ${RAMP[dowOf(d)].name.slice(0, 3)} cells ${day.cells} perfect ${day.perfect} (draw ${day.draw}, ${Date.now() - t}ms)`);
  }
}

const fmtLabel = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const qid = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `cell-${m}-${d}-${String(y).slice(2)}`; };

if (argv[0] === '--write') {
  const days = new Map(readFileSync(PROGRESS, 'utf8').split('\n').filter(Boolean).map((l) => { const x = JSON.parse(l); return [x.live, x]; }));
  const out = new URL('../app/cell/puzzles.js', import.meta.url);
  const keep = argv.includes('--keep') && existsSync(out) ? (await import(out.href)).PUZZLES : [];
  const sorted = [...days.keys()].sort();
  const start = keep.length ? addDays(keep[keep.length - 1].live, 1) : FIRST;
  const rows = keep.map((p) => ({ ...p }));
  for (let d = start; d <= sorted[sorted.length - 1]; d = addDays(d, 1)) {
    const x = days.get(d);
    if (!x) throw new Error(`progress file has no ${d}`);
    rows.push({ num: rows.length + 1, quizId: qid(d), live: d, dateLabel: fmtLabel(d), sunday: dowOf(d) === 0, ranks: x.ranks, cells: x.cells, perfect: x.perfect, deal: x.deal });
  }
  const head = HEAD;
  const body = rows.map((p) => `  {\n    num: ${p.num},\n    quizId: '${p.quizId}',\n    live: '${p.live}',\n    dateLabel: '${p.dateLabel}',\n    sunday: ${p.sunday},\n    ranks: ${p.ranks},\n    cells: ${p.cells},\n    perfect: ${p.perfect},\n    deal: ${JSON.stringify(p.deal)},\n  },`).join('\n');
  writeFileSync(out, `${head}export const PUZZLES = [\n${body}\n];\n`);
  console.log(`wrote ${rows.length} boards, ${rows[0].live} to ${rows[rows.length - 1].live}`);
}

if (argv[0] === '--measure') {
  const [ranks, ncols, cells, n, cap] = process.argv.slice(3).map(Number);
  const rows = [];
  for (let i = 0; i < n; i++) {
    const deal = core.dealFor(core.mulberry32(91_000 + i * 7919), ranks, ncols);
    const t = Date.now();
    const r = solve(deal, cells, ranks, { cap: cap || 2_000_000 });
    const ms = Date.now() - t;
    if (r.line) { const { state } = lineToMoves(r.line, deal, cells); if (!core.isWon(state, ranks)) throw new Error('line does not win'); }
    rows.push({ p: r.perfect, nodes: r.nodes, ms, capped: !!r.capped, dead: !!r.dead });
    console.log(i, r.perfect, r.nodes, `${ms}ms`, r.capped ? 'CAP' : r.dead ? 'DEAD' : '');
  }
  const ok = rows.filter((x) => x.p > 0).map((x) => x.p).sort((a, b) => a - b);
  const q = (a, f) => a[Math.min(a.length - 1, Math.floor(f * a.length))];
  const ms = rows.map((x) => x.ms).sort((a, b) => a - b);
  console.log(`ranks ${ranks} cols ${ncols} cells ${cells}: solved ${ok.length}/${n}, capped ${rows.filter((x) => x.capped).length}, dead ${rows.filter((x) => x.dead).length}; perfect min ${ok[0]} p25 ${q(ok, 0.25)} med ${q(ok, 0.5)} p75 ${q(ok, 0.75)} max ${ok[ok.length - 1]}; ms med ${q(ms, 0.5)} p90 ${q(ms, 0.9)}`);
}
