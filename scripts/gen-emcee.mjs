#!/usr/bin/env node
// scripts/gen-emcee.mjs — extends the Emcee bank (app/emcee/puzzles.js) forward
// in time. APPEND ONLY: it never looks at, and never emits, a board that the
// bank already holds.
//
// WHY THIS EXISTS ALONGSIDE build-emcee-bank.mjs. The builder REGENERATES every
// board from the first future day onward, which is right when you are rebuilding
// a bad batch (it was written to replace the 2026-08-11 → 09-29 gloss-clued run)
// and wrong when you are extending: it rewrites boards that are dated ahead but
// already banked. This script starts at lastDate + 1 and only ever appends, so
// "the past is frozen" holds for everything already written down, including the
// future-dated boards that were already authored.
//
// Usage:
//   node scripts/gen-emcee.mjs                 # print new boards to stdout
//   node scripts/gen-emcee.mjs --to 2026-11-30 # target last date (default)
//   node scripts/gen-emcee.mjs --write         # splice them into puzzles.js
//   node scripts/gen-emcee.mjs --verbose       # one line per board: shape tries, ms
// Then:
//   node scripts/verify-daily-banks.mjs emcee
//   node scripts/verify-encore.mjs             # emcee-wordbank.txt is SHARED
//
// WHAT IT GUARANTEES
//   • one board per day, no gaps, num contiguous, quizId/dateLabel/sunday all
//     derived from the date rather than typed;
//   • every answer is a word that already has a hand-written clue in
//     scripts/emcee-wordbank.txt, and the clue emitted is that file's clue
//     verbatim — there is no code path that invents a clue;
//   • grids are FULLY CHECKED: every shape it can choose has every run at least
//     3 long, so no white square sits outside an across or a down word;
//   • the three bank-wide variety caps the verifier enforces are seeded from the
//     boards already banked, not just from what this run builds:
//       – an answer appears at most 3 times across the live bank,
//       – two boards share at most 2 answers (3 if both are Sundays),
//       – a weekday grid shape is used at most 4 times.
//     "Live" means live >= 2026-08-12, which is exactly the window the verifier
//     counts (#1–#27 are grandfathered history).
//   • deterministic: the RNG is seeded from a constant OFFSET BY THE STARTING
//     BOARD NUMBER, so re-running reproduces the same bytes and the new segment
//     cannot replay the frozen one.
//
// THE SHAPE POOLS, AND WHY THEY ARE WHAT THEY ARE. Both are enumerated here,
// not hand-listed, so the pool cannot quietly narrow the way the 2026-08 batch's
// did (24 of its 50 boards used the same two corners).
//
//   WEEKDAY (5x5). The clue bank stocks 3–7 letters and no 2-letter words, so a
//   shape is only usable if every run is >= 3. On a 5x5 that forces exactly one
//   run per row and per column (3+1+3 > 5), hence exactly 10 words, which is the
//   count the header promises. There are exactly 104 such shapes; 99 of them
//   fill against this clue bank. Only 12 are 180-symmetric, and the bank has
//   used asymmetric minis from the start (36 of its 65 weekday grids), so
//   symmetry is not required. At 4 uses each that is room for ~396 weekday
//   boards, so weekdays are not what limits the runway.
//
//   SUNDAY (7x7, 22 words). This is the tight one, and it is worth knowing why
//   before you try to widen it. Enumerate every 7x7 whose runs are all >= 3:
//   80,924 shapes, of which 79,107 are connected — but only ELEVEN have 22
//   slots, and only FIVE of those are connected. All five are the same pinwheel
//   family, all five carry 41 white squares, and — this is the part that costs
//   runway — all five carry EIGHTEEN 3-letter slots and four 7s. There is no
//   7x7 with 22 fully-checked words that is easier on the 3-letter pool; 22
//   words over 41 squares averages 3.7 letters, and that average has to come
//   from somewhere. So each Sunday spends 18 of the ~440 three-letter answers
//   the clue bank stocks, and the 3-use cap is what will stop this bank first.
//   Dropping to 20 or 21 words would buy 3–6 three-letter slots a week; that is
//   a change to the header's stated ramp, so it is a decision for a human, not
//   a knob for the generator.
//
// WHAT ACTUALLY LIMITS THE RUNWAY: 3-letter answers, and it is the SUNDAYS that
// run out first. Weekday shapes are chosen 3-lean on purpose (the pool is sorted
// by how few 3-letter slots a shape carries, then shuffled inside each band)
// precisely to leave the 3-letter pool for the Sundays that cannot avoid it.
// Measured, on the run that carried the bank to 2026-11-30:
//   • the first attempt, against the 413 three-letter entries the clue bank then
//     held, filled 46 boards and then STOPPED DEAD on the Sunday of 2026-11-15 —
//     every one of the five Sunday shapes wiped out early, while the weekdays
//     around it were still filling in a second or two. Sundays first, weekdays
//     nowhere near;
//   • 122 everyday 3-letter entries were then hand-clued into
//     scripts/emcee-wordbank.txt (413 -> 535) and the same run reached
//     2026-11-30 with all 62 boards, spending 339 of the 535;
//   • so the exchange rate for the next extension is roughly ONE new 3-letter
//     clue entry per new board, and it is the only lever that moves the wall.
//     Widening 4-, 5-, 6- or 7-letter entries does nothing: a weekday 5x5 has
//     no room for a 6, and the Sunday's 22 words are eighteen 3s and four 7s.
//
// WHERE THE NEXT WALL IS. Run against the bank as it stands at 2026-11-30, this
// script gets 33 more boards and then stops on the SUNDAY of 2027-01-03, with
// 407 of the 535 three-letter answers spent and 201 of them at the 3-use cap.
// Same failure mode, same day of the week: a Sunday, not a weekday. (Ordering
// the weekday pool strictly 3-lean instead of on THREE_TARGETS pushes that stop
// out to 2027-01-17 — two extra weeks, bought by making every weekday grid look
// alike. Measured both ways; the variety is worth more than the fortnight,
// because the fortnight is one more restock and the sameness is permanent.)
// Budget roughly one hand-clued 3-letter entry per further board, and check
// with a dry run before promising a date — `node scripts/gen-emcee.mjs --to
// 2027-03-31` prints the stop line and costs nothing.
//
// WHAT WILL NOT WORK, so you do not spend a day on it:
//   • more Sunday shapes — there are five, full stop, and all five are equally
//     3-hungry (see the enumeration above);
//   • more weekday shapes — 104 exist and 30 of them carried 53 boards here;
//     the 4-use cap is nowhere near binding;
//   • a smarter search — the failures are domain wipeouts in the first few
//     hundred nodes, not timeouts. The pool is empty, not deep.
//
// ⚠ scripts/emcee-wordbank.txt IS SHARED WITH ENCORE. scripts/verify-encore.mjs
// builds its clue map from emcee-wordbank.txt FIRST and encore-wordbank.txt
// second, so ADDING a word here that Encore already clues silently reassigns
// Encore's canonical clue and turns Encore red on boards Encore never touched.
// Any word added to the emcee bank that also lives in encore-wordbank.txt must
// carry ENCORE's clue verbatim. Run `node scripts/blast-radius.mjs` and
// `node scripts/verify-encore.mjs` before you believe you are done.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PUZZLES } from '../app/emcee/puzzles.js';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const VERBOSE = args.includes('--verbose');
const TO = (args[args.indexOf('--to') + 1] && args.includes('--to')) ? args[args.indexOf('--to') + 1] : '2026-11-30';
const LIVE_FROM = '2026-08-12';   // the window verify-daily-banks counts (#1–#27 are history)
const CAP = 3;                    // an answer appears at most 3x across the live bank
const SHAPE_CAP = 4;              // a weekday grid shape at most 4x across the live bank
const SUN_SHAPE_CAP = 3;          // our own ceiling: a Sunday shape at most 3x in the new run
const SHAPE_COOLDOWN = 7;         // and no weekday shape repeats inside a 7-board window
const WEEKDAY_BUDGET = 60000;     // search nodes. A 5x5 that has not fallen out by here is a hard
                                  // shape, and with 99 fillable shapes it is far cheaper to move to
                                  // the next one than to grind: at 400,000 the near-double-word-
                                  // squares in the 3-lean band cost ~6s each and bought nothing.
const SUNDAY_BUDGET = 3000000;

// ── the clue bank: WORD|clue, one per line ─────────────────────────────────
const CLUE = new Map();
for (const line of readFileSync(join(here, 'emcee-wordbank.txt'), 'utf8').trim().split('\n')) {
  if (!line.trim() || line.startsWith('#')) continue;
  const i = line.indexOf('|');
  CLUE.set(line.slice(0, i).trim(), line.slice(i + 1).trim());
}
const WORDS = [...CLUE.keys()];
const IDX = new Map(), BYLEN = new Map();
WORDS.forEach((w, id) => {
  if (!BYLEN.has(w.length)) BYLEN.set(w.length, []);
  BYLEN.get(w.length).push(id);
  for (let i = 0; i < w.length; i++) {
    const k = `${w.length}|${i}|${w[i]}`;
    if (!IDX.has(k)) IDX.set(k, []);
    IDX.get(k).push(id);
  }
});
const STOCKED = new Set(WORDS.map((w) => w.length));

// ── geometry ───────────────────────────────────────────────────────────────
function slotsOf(p) {
  const N = p.length, out = [];
  for (let r = 0; r < N; r++) { let c = 0; while (c < N) { if (p[r][c] === '#') { c++; continue; } const s = c; while (c < N && p[r][c] !== '#') c++; if (c - s > 1) out.push({ dir: 'A', r, c: s, len: c - s }); } }
  for (let c = 0; c < N; c++) { let r = 0; while (r < N) { if (p[r][c] === '#') { r++; continue; } const s = r; while (r < N && p[r][c] !== '#') r++; if (r - s > 1) out.push({ dir: 'D', r: s, c, len: r - s }); } }
  for (const s of out) s.cells = Array.from({ length: s.len }, (_, i) => (s.dir === 'A' ? [s.r, s.c + i] : [s.r + i, s.c]));
  return out;
}
function numbering(p) {
  const N = p.length, m = {}; let n = 1;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (p[r][c] === '#') continue;
    const a = (c === 0 || p[r][c - 1] === '#') && c + 1 < N && p[r][c + 1] !== '#';
    const d = (r === 0 || p[r - 1][c] === '#') && r + 1 < N && p[r + 1][c] !== '#';
    if (a || d) m[`${r},${c}`] = n++;
  }
  return m;
}
const connected = (g) => {
  const N = g.length, cells = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (g[r][c] !== '#') cells.push(r * N + c);
  if (!cells.length) return false;
  const seen = new Set([cells[0]]), st = [cells[0]];
  while (st.length) {
    const x = st.pop(), r = (x / N) | 0, c = x % N;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= N || nc >= N || g[nr][nc] === '#') continue;
      const k = nr * N + nc;
      if (!seen.has(k)) { seen.add(k); st.push(k); }
    }
  }
  return seen.size === cells.length;
};
// A shape is only usable if every slot length is one the clue bank stocks.
const fillableShape = (g) => connected(g) && slotsOf(g).every((s) => STOCKED.has(s.len));

// Every 5x5 whose rows and columns each hold exactly one run of length >= 3.
function weekdayShapes() {
  const N = 5, runs = [], out = [];
  for (let a = 0; a < N; a++) for (let b = a + 2; b < N; b++) runs.push([a, b]);
  const okCols = (g) => { for (let c = 0; c < N; c++) { let s = ''; for (let r = 0; r < N; r++) s += g[r][c]; const p = s.split('#').filter((x) => x.length); if (p.length !== 1 || p[0].length < 3) return false; } return true; };
  const rec = (i, cur) => {
    if (i === N) {
      const g = [];
      for (let r = 0; r < N; r++) { let s = ''; for (let c = 0; c < N; c++) s += c >= cur[r][0] && c <= cur[r][1] ? '.' : '#'; g.push(s); }
      if (okCols(g) && fillableShape(g)) out.push(g);
      return;
    }
    for (const r of runs) rec(i + 1, [...cur, r]);
  };
  rec(0, []);
  return out;
}
// Every connected 7x7 whose runs are all >= 3 and which carries exactly 22
// words — the Sunday size the header promises. Enumerated by rows, pruning on
// the column runs, because 2^49 is not a search space.
function sundayShapes() {
  const N = 7, rowPats = [], out = [];
  for (let a = 0; a < N; a++) for (let b = a + 2; b < N; b++) { let s = ''; for (let c = 0; c < N; c++) s += c >= a && c <= b ? '.' : '#'; rowPats.push(s); }
  rowPats.push('...#...');                       // the only two-run row that fits 3+1+3
  const open = new Int8Array(N), nRuns = new Int8Array(N), rows = [];
  const rec = (r) => {
    if (r === N) {
      for (let c = 0; c < N; c++) if (open[c] > 0 && open[c] < 3) return;
      let cr = 0; for (let c = 0; c < N; c++) cr += nRuns[c] + (open[c] > 0 ? 1 : 0);
      let rr = 0; for (const row of rows) rr += row.split('#').filter((x) => x.length).length;
      if (rr + cr === 22) { const g = rows.slice(); if (fillableShape(g)) out.push(g); }
      return;
    }
    for (const p of rowPats) {
      const so = Int8Array.from(open), sn = Int8Array.from(nRuns);
      let ok = true;
      for (let c = 0; c < N; c++) {
        if (p[c] === '.') open[c]++;
        else if (open[c] > 0) { if (open[c] < 3) { ok = false; break; } nRuns[c]++; open[c] = 0; }
      }
      if (ok) { rows.push(p); rec(r + 1); rows.pop(); }
      open.set(so); nRuns.set(sn);
    }
  };
  rec(0);
  return out;
}

// ── calendar ───────────────────────────────────────────────────────────────
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const last = PUZZLES[PUZZLES.length - 1];
const dayAfter = (iso) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };
const calendar = [];
for (let iso = dayAfter(last.live), n = last.num + 1; iso <= TO; iso = dayAfter(iso), n++) {
  const d = new Date(`${iso}T00:00:00Z`);
  const M = d.getUTCMonth() + 1, D = d.getUTCDate(), Y = d.getUTCFullYear();
  calendar.push({
    num: n,
    quizId: `emcee-${M}-${D}-${String(Y).slice(2)}`,
    live: iso,
    dateLabel: `${MONTHS[M - 1]} ${D}, ${Y}`,
    sunday: d.getUTCDay() === 0,
    size: d.getUTCDay() === 0 ? 7 : 5,
  });
}
if (!calendar.length) { console.error(`nothing to do: bank already reaches ${last.live}`); process.exit(0); }

// seed OFFSET by the starting board number, so the new segment cannot replay
// the frozen one even if the clue bank is unchanged
let seed = (8122026 + calendar[0].num * 7919) >>> 0;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

// ── fill ───────────────────────────────────────────────────────────────────
// Backtracking with MRV (always extend the slot with the fewest candidates) and
// a use-count-first candidate order, so a board reaches for answers the bank has
// not spent yet before it reaches for ones it has. Ties are broken by a fresh
// random key per attempt, which is what makes a retry actually different.
const jitter = new Float64Array(WORDS.length);
function fill(pat, { banned, score, budget }) {
  for (let i = 0; i < jitter.length; i++) jitter[i] = rnd();
  const N = pat.length, slots = slotsOf(pat), S = slots.length, A = 65;
  slots.forEach((s) => { s.idx = s.cells.map(([r, c]) => r * N + c); });
  const cells = new Int8Array(N * N).fill(-1);
  const chosen = new Array(S).fill(-1);
  const used = new Set(), no = new Set();
  WORDS.forEach((w, id) => { if (banned.has(w)) no.add(id); });
  let nodes = 0, dead = false;
  // Candidate list for a slot that already has at least one crossing letter:
  // intersect on the SHORTEST index list, then filter. A slot with NO fixed
  // letter is never built — its domain is the whole length class, so it can
  // never be the MRV minimum, and building and sorting those lists at every
  // node is what made an earlier version of this search crawl on the tighter
  // grids (a 400,000-node budget took minutes instead of a second).
  const cands = (si) => {
    const s = slots[si];
    let best = null;
    for (let i = 0; i < s.len; i++) {
      const ch = cells[s.idx[i]];
      if (ch < 0) continue;
      const arr = IDX.get(`${s.len}|${i}|${String.fromCharCode(A + ch)}`);
      if (!arr) return [];
      if (!best || arr.length < best.length) best = arr;
    }
    const pool = best || BYLEN.get(s.len) || [], out = [];
    outer: for (const id of pool) {
      if (used.has(id) || no.has(id)) continue;
      const w = WORDS[id];
      for (let i = 0; i < s.len; i++) { const ch = cells[s.idx[i]]; if (ch >= 0 && w.charCodeAt(i) - A !== ch) continue outer; }
      out.push(id);
    }
    return out;
  };
  const crossed = (si) => { const s = slots[si]; for (let i = 0; i < s.len; i++) if (cells[s.idx[i]] >= 0) return true; return false; };
  const dfs = (depth) => {
    if (++nodes > budget) { dead = true; return false; }
    if (depth === S) return true;
    let bi = -1, bc = null;
    for (let i = 0; i < S; i++) {
      if (chosen[i] >= 0 || !crossed(i)) continue;
      const c = cands(i);                       // this doubles as forward checking
      if (!c.length) return false;
      if (bi < 0 || c.length < bc.length) { bi = i; bc = c; }
      if (bc.length === 1) break;
    }
    if (bi < 0) {                               // opening move: nothing is crossed yet
      let bl = Infinity;
      for (let i = 0; i < S; i++) {
        if (chosen[i] >= 0) continue;
        const n = (BYLEN.get(slots[i].len) || []).length;
        if (n < bl) { bl = n; bi = i; }
      }
      bc = cands(bi);
      if (!bc.length) return false;
    }
    bc.sort((a, b) => ((score.get(WORDS[a]) || 0) - (score.get(WORDS[b]) || 0)) || (jitter[a] - jitter[b]));
    const s = slots[bi];
    for (const id of bc) {
      const w = WORDS[id], set = [];
      for (let i = 0; i < s.len; i++) { const k = s.idx[i]; if (cells[k] < 0) { cells[k] = w.charCodeAt(i) - A; set.push(k); } }
      chosen[bi] = id; used.add(id);
      if (dfs(depth + 1)) return true;
      for (const k of set) cells[k] = -1;
      chosen[bi] = -1; used.delete(id);
      if (dead) return false;
    }
    return false;
  };
  if (!dfs(0)) return null;
  const grid = [];
  for (let r = 0; r < N; r++) { let row = ''; for (let c = 0; c < N; c++) row += pat[r][c] === '#' ? '#' : String.fromCharCode(A + cells[r * N + c]); grid.push(row); }
  const nums = numbering(pat), across = [], down = [];
  slots.forEach((s, i) => {
    const w = WORDS[chosen[i]];
    (s.dir === 'A' ? across : down).push({ n: nums[`${s.r},${s.c}`], r: s.r, c: s.c, len: s.len, clue: CLUE.get(w) });
  });
  across.sort((a, b) => a.n - b.n); down.sort((a, b) => a.n - b.n);
  return { grid, across, down, words: chosen.map((i) => WORDS[i]) };
}

// ── seed every bank-wide cap from the boards already banked ────────────────
const answerOf = (p, w, d) => { let s = ''; for (let i = 0; i < w.len; i++) { const r = d === 'A' ? w.r : w.r + i, c = d === 'A' ? w.c + i : w.c; s += p.grid[r][c]; } return s; };
const wordsOf = (p) => [...p.across.map((x) => ({ ...x, d: 'A' })), ...p.down.map((x) => ({ ...x, d: 'D' }))].map((w) => answerOf(p, w, w.d));
const patOf = (g) => g.map((row) => row.split('').map((ch) => (ch === '#' ? '#' : '.')).join(''));

const uses = new Map(), banned = new Set(), score = new Map(), prior = [], shapeUse = new Map();
for (const p of PUZZLES) {
  const words = wordsOf(p);
  if (p.live < LIVE_FROM) {                       // history: not capped, but still soft-avoided
    for (const w of words) score.set(w, (score.get(w) || 0) + 4);
    continue;
  }
  prior.push({ quizId: p.quizId, sunday: p.sunday, words: new Set(words) });
  for (const w of words) {
    const n = (uses.get(w) || 0) + 1;
    uses.set(w, n);
    score.set(w, (score.get(w) || 0) + 10);
    if (n >= CAP) banned.add(w);
  }
  if (!p.sunday) { const k = patOf(p.grid).join('|'); shapeUse.set(k, (shapeUse.get(k) || 0) + 1); }
}

// SHARED STEMS (2026-11-12, lane-d review fix). A grid holding ITEM and ITEMS
// clues the one with the other. No answer may be another answer plus an
// inflection ending (S, ES, D, ED, ING). verify-daily-banks holds the same rule
// from EMCEE_STEM_FROM.
export const STEM_ENDINGS = ['S', 'ES', 'D', 'ED', 'ING'];
function sharedStem(words) {
  const set = new Set(words);
  return words.some((w) => STEM_ENDINGS.some((e) => set.has(w + e)));
}

// ── build ──────────────────────────────────────────────────────────────────
const threes = (g) => slotsOf(g).filter((s) => s.len === 3).length;
const WEEK = weekdayShapes();
const SUN = sundayShapes();
console.error(`shape pools: ${WEEK.length} weekday, ${SUN.length} Sunday (22 words each)`);
// HOW A WEEKDAY SHAPE IS PICKED. On a fully-checked 5x5 the number of 3-letter
// slots IS the openness of the grid — 0 threes is 23-25 white squares, 2 is 21,
// 4 is 19, 8 is 17 — so this one number sets both how much of the scarce
// 3-letter pool a board spends and what the grid looks like. Sorting the pool
// 3-lean-first is cheapest on the pool and produced a segment where 27 of 53
// weekday grids had exactly 22 white squares, against a frozen bank that runs
// 17 to 23: correct by every cap and visibly the same puzzle every day. So the
// board asks for a TARGET number of 3-letter slots instead, cycling a fixed
// sequence that spans the frozen bank's range and averages a shade leaner than
// it (2.6 against 3.8), and takes the closest shape to that target. The cycle
// is fixed, not random, so the spread is a property of the output rather than
// a hope about it.
const THREE_TARGETS = [3, 1, 4, 2, 0, 3, 2, 5, 1, 4, 2, 3, 0, 2, 4, 1, 3, 2];
const weekByBand = new Map();
for (const g of WEEK) { const t = threes(g); if (!weekByBand.has(t)) weekByBand.set(t, []); weekByBand.get(t).push(g); }
const weekBands = [...weekByBand.keys()].sort((a, b) => a - b);
let weekdayIndex = 0;

const sunUse = new Map(), recent = [], out = [];
let lastSunShape = null;
for (const p of calendar) {
  const okOverlap = (words) => {
    const s = new Set(words);
    for (const r of prior) {
      let n = 0; for (const x of r.words) if (s.has(x)) n++;
      if (n > (p.sunday && r.sunday ? 3 : 2)) return false;
    }
    return true;
  };
  let pool;
  if (p.sunday) {
    pool = shuffle(SUN)
      .filter((g) => (sunUse.get(g.join('|')) || 0) < SUN_SHAPE_CAP)
      .filter((g) => g.join('|') !== lastSunShape);
    if (!pool.length) pool = shuffle(SUN);
  } else {
    const want = THREE_TARGETS[weekdayIndex % THREE_TARGETS.length];
    pool = weekBands
      .slice()
      .sort((a, b) => Math.abs(a - want) - Math.abs(b - want) || a - b)
      .flatMap((t) => shuffle(weekByBand.get(t)))
      .filter((g) => (shapeUse.get(g.join('|')) || 0) < SHAPE_CAP)
      .filter((g) => !recent.includes(g.join('|')));
  }
  let made = null, shape = null, tries = 0;
  const t0 = Date.now();
  outer: for (const pat of pool) {
    for (let k = 0; k < (p.sunday ? 40 : 10); k++) {
      tries++;
      const cand = fill(pat, { banned, score, budget: p.sunday ? SUNDAY_BUDGET : WEEKDAY_BUDGET });
      if (!cand) break;
      if (okOverlap(cand.words) && !sharedStem(cand.words)) { made = cand; shape = pat; break outer; }
    }
  }
  if (VERBOSE) console.error(`  ${p.quizId}${p.sunday ? ' (SUN)' : ''} ${made ? 'ok' : 'FAIL'} ${tries} fills ${Date.now() - t0}ms`);
  if (!made) {
    console.error(`STOPPED at ${p.quizId} (${p.live}): no ${p.sunday ? 'Sunday' : 'weekday'} shape could be filled inside the bank-wide caps.`);
    console.error(`  built ${out.length} boards, last ${out.length ? out[out.length - 1].p.live : '(none)'}`);
    break;
  }
  const k = shape.join('|');
  if (p.sunday) { sunUse.set(k, (sunUse.get(k) || 0) + 1); lastSunShape = k; }
  else { shapeUse.set(k, (shapeUse.get(k) || 0) + 1); recent.push(k); if (recent.length > SHAPE_COOLDOWN) recent.shift(); weekdayIndex++; }
  prior.push({ quizId: p.quizId, sunday: p.sunday, words: new Set(made.words) });
  for (const w of made.words) {
    const n = (uses.get(w) || 0) + 1;
    uses.set(w, n);
    score.set(w, (score.get(w) || 0) + 10);
    if (n >= CAP) banned.add(w);
  }
  out.push({ p, made });
  if (out.length % 10 === 0) console.error(`  … ${out.length}/${calendar.length} (${p.live})`);
}

const spent3 = [...uses].filter(([w]) => w.length === 3).length;
console.error(`built ${out.length} boards, #${calendar[0].num}${out.length ? `–#${out[out.length - 1].p.num}` : ''}, last ${out.length ? out[out.length - 1].p.live : last.live}`);
console.error(`answers in play: ${uses.size} distinct, ${banned.size} at the ${CAP}-use cap; 3-letter answers used ${spent3} of ${BYLEN.get(3).length}`);

// ── emit ───────────────────────────────────────────────────────────────────
const esc = (s) => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const text = out.map(({ p, made }) => {
  const L = (w) => `      { n: ${w.n}, r: ${w.r}, c: ${w.c}, len: ${w.len}, clue: ${esc(w.clue)} },`;
  return `  {
    num: ${p.num},
    quizId: '${p.quizId}',
    live: '${p.live}',
    dateLabel: '${p.dateLabel}',
    sunday: ${p.sunday},
    size: ${p.size},
    grid: [${made.grid.map((g) => `'${g}'`).join(', ')}],
    across: [
${made.across.map(L).join('\n')}
    ],
    down: [
${made.down.map(L).join('\n')}
    ],
  },`;
}).join('\n');

if (!WRITE) { console.log(text); process.exit(0); }
const file = join(here, '..', 'app', 'emcee', 'puzzles.js');
const src = readFileSync(file, 'utf8');
const at = src.lastIndexOf('\n];');
if (at < 0) { console.error('could not find the end of PUZZLES in app/emcee/puzzles.js'); process.exit(1); }
writeFileSync(file, `${src.slice(0, at + 1)}${text}\n];${src.slice(at + 3)}`);
console.error(`appended ${out.length} boards to app/emcee/puzzles.js`);
