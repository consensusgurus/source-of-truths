// Verify the Rung bank (app/rung/puzzles.js + its VOCAB), the daily word ladder.
// Run after ANY edit:  node scripts/verify-rung.mjs
//
// Per puzzle, everything numeric is RECOMPUTED from VOCAB, never trusted:
//   par      re-derived by breadth-first search over the exact VOCAB graph
//            (edges = same-length words differing in exactly one letter, per
//            RungClient.jsx's own `differsByOne`). par is documented as "the
//            EXACT shortest ladder" (displayed to players as PERFECT), so the
//            recomputed BFS distance must equal it exactly. Weekdays must land
//            in [10, 12]; Sundays must be >= 15 (per the puzzle-file header).
//   routes   re-derived by counting distinct shortest ladders via a DP over the
//            BFS layers (every predecessor one layer closer), capped at 9999
//            to match the header's own documented cap.
//   example  replayed step by step: every word must be in VOCAB, consecutive
//            words must differ by exactly one letter in the same position, the
//            chain must start at `start` and end at `target`, and its length
//            must equal `par`.
//   start/target  distinct, both present in VOCAB.
//   sunday   must equal the true UTC weekday of `live`; quizId/live/num
//            internally consistent (mirrors the alibi/glyph checks).
//
// VOCAB sanity: every entry is a distinct, lowercase, 5-letter word (the
// header calls this list "the ONLY thing a rung may be"). The word count the
// game tells players about must also match the list they are actually
// screened against: RungClient.jsx's rules copy hardcodes a count in prose
// ("A rung must be one of the N common five-letter words"), and that number
// is cross-checked against VOCAB.length here — a stale copy count is exactly
// the kind of drift the ADJ-map comment in the same file has already silently
// diverged from once (it says 1,292; the rules paragraph still says 1,846).
//
// Bank-level pool variety (the KNOWN, already-confirmed defect this script
// exists to catch): `start` collapses to 'suite' on 12 of 62 days and 'shock'
// on 12 of 62, alternating almost every other day, so only 36 of 62 starts are
// unique. Ceiling: no single start (or target) word may be used more than
// MAX_REPEAT times across the whole bank, and each pool must stay at or above
// MIN_UNIQUE_RATIO unique. Both ceilings are chosen generously above the
// bank's healthy stats elsewhere (target repeats top out at 2 of 62, 93%
// unique) so only the real collapse trips them. Checked in two passes exactly
// like verify-daily-banks.mjs's crux collision-pool split: the FULL bank is
// reported for visibility, but the hard FAIL is scoped to boards live on or
// after RUNG_VARIETY_FROM (2026-08-03) — the portion of the bank that can
// still be fixed without rewriting an already-played day. Pre-cutoff repeats
// are reported as a grandfathered note.
//
// Performance: VOCAB has ~1,300 words; building the adjacency map and running
// BFS + path-counting DP for all 62 puzzles takes well under a second.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PUZZLES, VOCAB, VOCAB_CLASSIC, VOCAB_FROM, vocabFor } from '../app/rung/puzzles.js';

const here = dirname(fileURLToPath(import.meta.url));
const RUNG_VARIETY_FROM = '2026-08-03';
const ROUTES_CAP = 9999;
const MAX_REPEAT = 3;
const MIN_UNIQUE_RATIO = 0.7;

const fail = (id, msg) => { BAD++; console.error(`✗ ${id}: ${msg}`); };
const ok = (id, msg) => console.log(`✓ ${id}  ${msg}`);
const note = (id, msg) => console.log(`… ${id}  ${msg}`);
let BAD = 0;

// ── VOCAB sanity ─────────────────────────────────────────────────────────
// Two eras (app/rung/vocab.js): boards before VOCAB_FROM were measured over
// VOCAB_CLASSIC, later boards over VOCAB. Both lists are checked, the classic
// list must sit wholly inside VOCAB (no word that was ever a rung stops being
// one), and every board below is measured over vocabFor(board).
{
  const errs = [];
  for (const [nm, L] of [['VOCAB', VOCAB], ['VOCAB_CLASSIC', VOCAB_CLASSIC]]) {
    if (new Set(L).size !== L.length) errs.push(`${nm} has ${L.length - new Set(L).size} duplicate(s)`);
    const bad = L.filter((w) => w.length !== 5 || w !== w.toLowerCase() || !/^[a-z]+$/.test(w));
    if (bad.length) errs.push(`${bad.length} ${nm} entries are not plain lowercase 5-letter words: ${bad.slice(0, 5).join(',')}`);
  }
  if (VOCAB_CLASSIC.length !== 1294) errs.push(`VOCAB_CLASSIC is frozen at 1,294 words, found ${VOCAB_CLASSIC.length}`);
  const VS = new Set(VOCAB);
  const lost = VOCAB_CLASSIC.filter((w) => !VS.has(w));
  if (lost.length) errs.push(`${lost.length} classic words missing from VOCAB: ${lost.slice(0, 5).join(',')}`);
  // Cross-check the word count the rules copy tells players against the real list.
  const clientSrc = readFileSync(join(here, '../app/rung/RungClient.jsx'), 'utf8');
  const m = clientSrc.match(/([\d,]+)\s+common five-letter words/);
  const dynamicCount = /\{BOARD_VOCAB\.length\.toLocaleString\([^)]*\)\}\s+common five-letter words/.test(clientSrc)
    && /BOARD_VOCAB = useMemo\(\(\) => vocabFor\(PUZZLE\)/.test(clientSrc);
  if (dynamicCount) {
    // the copy reads the board's own list length, so it cannot drift
  } else if (m) {
    const claimed = Number(m[1].replace(/,/g, ''));
    if (claimed !== VOCAB.length) errs.push(`rules copy tells players "${m[1]} common five-letter words" but VOCAB.length is ${VOCAB.length}`);
  } else {
    errs.push('could not find the "N common five-letter words" rules sentence in RungClient.jsx to cross-check');
  }
  errs.length ? fail('VOCAB', errs.join('; ')) : ok('VOCAB', `classic ${VOCAB_CLASSIC.length} + expanded ${VOCAB.length} (from ${VOCAB_FROM}), classic inside expanded, rules copy reads the board's list`);
}

// ── word-ladder graph over VOCAB (bucket method) ────────────────────────
function buildAdj(vocab) {
  const buckets = new Map();
  for (const w of vocab) {
    for (let i = 0; i < w.length; i++) {
      const k = `${w.slice(0, i)}_${w.slice(i + 1)}`;
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(w);
    }
  }
  const adj = new Map(vocab.map((w) => [w, []]));
  for (const list of buckets.values()) {
    for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) {
      adj.get(list[a]).push(list[b]);
      adj.get(list[b]).push(list[a]);
    }
  }
  return adj;
}
const GRAPHS = new Map([[VOCAB_CLASSIC, buildAdj(VOCAB_CLASSIC)], [VOCAB, buildAdj(VOCAB)]]);
let ADJ = GRAPHS.get(VOCAB);
let VSET = new Set(VOCAB);

function bfsDistAndRoutes(start, target) {
  if (!ADJ.has(start) || !ADJ.has(target)) return { dist: null, routes: 0 };
  const dist = new Map([[start, 0]]);
  const q = [start];
  for (let head = 0; head < q.length; head++) {
    const u = q[head];
    for (const v of ADJ.get(u)) if (!dist.has(v)) { dist.set(v, dist.get(u) + 1); q.push(v); }
  }
  if (!dist.has(target)) return { dist: null, routes: 0 };
  const order = [...dist.entries()].sort((a, b) => a[1] - b[1]).map((e) => e[0]);
  const paths = new Map([[start, 1]]);
  const SAT = 10_000_000; // saturating cap so branchy graphs can't blow up the number
  for (const u of order) {
    if (u === start) continue;
    const du = dist.get(u);
    let sum = 0;
    for (const v of ADJ.get(u)) if (dist.get(v) === du - 1) sum += (paths.get(v) || 0);
    paths.set(u, Math.min(sum, SAT));
  }
  return { dist: dist.get(target), routes: paths.get(target) };
}

const differsByOne = (a, b) => {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) { d++; if (d > 1) return false; }
  return d === 1;
};

const startPool = new Map();
const startPoolFresh = new Map();
const targetPool = new Map();
const targetPoolFresh = new Map();

PUZZLES.forEach((p, i) => {
  const errs = [];
  const L = vocabFor(p);
  ADJ = GRAPHS.get(L);
  VSET = new Set(L);
  if ((p.live < VOCAB_FROM) !== (L === VOCAB_CLASSIC)) errs.push('vocabFor picked the wrong era');

  // ── identity / date consistency ─────────────────────────────────────────
  if (p.num !== i + 1) errs.push(`num ${p.num} != ${i + 1}`);
  const m = p.quizId.match(/^rung-(\d+)-(\d+)-(\d+)$/);
  if (!m) errs.push('bad quizId');
  else {
    const iso = `20${m[3]}-${String(m[1]).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
    if (iso !== p.live) errs.push(`live ${p.live} != quizId date ${iso}`);
    const isSun = new Date(`${p.live}T12:00:00Z`).getUTCDay() === 0;
    if (p.sunday !== isSun) errs.push(`sunday must be ${isSun} for ${p.live}`);
  }

  // ── start/target/par/routes, all recomputed ─────────────────────────────
  if (!VSET.has(p.start)) errs.push(`start "${p.start}" not in VOCAB`);
  if (!VSET.has(p.target)) errs.push(`target "${p.target}" not in VOCAB`);
  if (p.start === p.target) errs.push('start equals target');
  if (VSET.has(p.start) && VSET.has(p.target)) {
    startPool.set(p.start, (startPool.get(p.start) || 0) + 1);
    if (p.live >= RUNG_VARIETY_FROM) startPoolFresh.set(p.start, (startPoolFresh.get(p.start) || 0) + 1);
    targetPool.set(p.target, (targetPool.get(p.target) || 0) + 1);
    if (p.live >= RUNG_VARIETY_FROM) targetPoolFresh.set(p.target, (targetPoolFresh.get(p.target) || 0) + 1);

    const { dist, routes } = bfsDistAndRoutes(p.start, p.target);
    if (dist == null) errs.push('no ladder exists between start and target');
    else if (dist !== p.par) errs.push(`par ${p.par} != BFS shortest ${dist}`);
    const wantPar = p.sunday ? (v) => v >= 15 : (v) => v >= 10 && v <= 12;
    if (!wantPar(p.par)) errs.push(`par ${p.par} outside ${p.sunday ? 'Sunday [>=15]' : 'weekday [10,12]'}`);
    if (routes != null) {
      const routesCapped = Math.min(routes, ROUTES_CAP);
      if (routesCapped !== p.routes) errs.push(`routes ${p.routes} != recomputed ${routesCapped}`);
    }
  }

  // ── example ladder ───────────────────────────────────────────────────────
  if (!Array.isArray(p.example) || p.example.length < 2) {
    errs.push('example missing or too short');
  } else {
    const ex = p.example;
    if (ex[0] !== p.start) errs.push('example does not start at `start`');
    if (ex[ex.length - 1] !== p.target) errs.push('example does not end at `target`');
    if (ex.length - 1 !== p.par) errs.push(`example has ${ex.length - 1} rungs, != par ${p.par}`);
    for (const w of ex) if (!VSET.has(w)) errs.push(`example word "${w}" not in VOCAB`);
    for (let i2 = 1; i2 < ex.length; i2++) if (!differsByOne(ex[i2 - 1], ex[i2])) errs.push(`example step ${ex[i2 - 1]}->${ex[i2]} is not a one-letter change`);
  }

  errs.length ? fail(p.quizId, errs.join('; ')) : ok(p.quizId, `par ${p.par} = BFS, routes ${p.routes} confirmed, example replays cleanly`);
});

// ── bank-level pool variety (this is the known, confirmed defect) ───────────
function reportPool(label, poolAll, poolFresh, total) {
  const staleAll = [...poolAll.entries()].filter(([, n]) => n > MAX_REPEAT);
  const staleFresh = [...poolFresh.entries()].filter(([, n]) => n > MAX_REPEAT);
  const uniqueRatio = poolAll.size / total;
  if (staleFresh.length) {
    fail(`rung pool (${label})`, `used more than ${MAX_REPEAT}x on boards live >= ${RUNG_VARIETY_FROM}: ${staleFresh.map(([k, n]) => `${k} x${n}`).join(', ')} (full-bank total: ${poolAll.size}/${total} unique)`);
  } else if (staleAll.length) {
    note(`rung pool (${label})`, `GRANDFATHERED repetition confined to boards before ${RUNG_VARIETY_FROM}: ${staleAll.map(([k, n]) => `${k} x${n}`).join(', ')}`);
  } else if (uniqueRatio < MIN_UNIQUE_RATIO) {
    fail(`rung pool (${label})`, `only ${poolAll.size}/${total} unique (${(uniqueRatio * 100).toFixed(0)}%), floor is ${(MIN_UNIQUE_RATIO * 100).toFixed(0)}%`);
  } else {
    ok(`rung pool (${label})`, `${poolAll.size}/${total} unique, no value repeats more than ${MAX_REPEAT}x`);
  }
}
reportPool('start', startPool, startPoolFresh, PUZZLES.length);
reportPool('target', targetPool, targetPoolFresh, PUZZLES.length);

console.log(BAD ? `\n${BAD} FAILURE(S)` : '\nAll Rung boards verified.');
process.exit(BAD ? 1 : 0);
