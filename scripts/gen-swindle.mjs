// Generate the Swindle bank: White to play and DRAW.
//
// THE SHAPE. White to move, badly lost. Exactly ONE White first move forces a
// draw (stalemate, threefold repetition, or insufficient material) against any
// Black defence; every other legal first move lets Black force checkmate within
// LOSE_CAP Black moves. See app/swindle/puzzles.js for the field list and the
// ramp, and lib/swindle-core.js for the rules the game plays.
//
// TWO STAGES.
//
//   pool   Worker threads sample positions and sift them on a fast 0x88 core
//          (scripts/defend-fast.mjs for move generation and the forced-mate
//          search, plus the draw search written below). Work is cut into
//          numbered CHUNKS of a fixed number of trials, each seeded by its own
//          number, so the pool is a pure function of the chunks run and a run
//          that is stopped picks up at the next chunk. Kept candidates append to
//          scripts/.swindle-pool.jsonl (gitignored scratch, like the other
//          generators' progress files); finished chunk numbers go to
//          scripts/.swindle-chunks.json.
//
//   bank   Deals the calendar from the pool, seeded per date, under the weekday
//          ramp and the theme ceiling, and RE-PROVES every board it deals with
//          the SHIPPED engine (app/mate/chess.js rules through lib/swindle-core.js
//          and app/defend/defense.js): the key draws within drawIn, no faster;
//          every other first move is a forced mate within LOSE_CAP; the
//          deterministic Black defence the browser plays, replayed against
//          White's principal line, reaches the draw inside the budget, and
//          against every losing first move reaches the mate. Only then is the
//          board written.
//
// Run:
//   node scripts/gen-swindle.mjs pool [chunks=40] [workers=2] [firstChunk=0]
//   node scripts/gen-swindle.mjs confirm [minDrawIn=1] [maxDrawIn=99]
//   node scripts/gen-swindle.mjs stats
//   node scripts/gen-swindle.mjs bank [--cached] > app/swindle/puzzles.js
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { legal as fastLegal, inCheck as fastInCheck, makeFastSearch, from64, uciOf } from './defend-fast.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const POOL = join(HERE, '.swindle-pool.jsonl');
const CHUNKS = join(HERE, '.swindle-chunks.json');
export const LOSE_CAP = 3;          // every non-key first move is a forced mate within this
const DRAW_MAX = 7;                 // deepest draw the pool keeps
const TRIALS = 6000;                // samples per chunk
let NODE_CAP = 250000;            // fast draw search budget per candidate
export const setNodeCap = (n) => { NODE_CAP = n; };

// ─── fast draw search (sifting only; the bank re-proves on the shipped engine) ─
// A position key is the placement itself, 64 characters plus the side to
// move, so the repetition bound below can read how far apart two positions are.
const PCH = ' PNBRQKkqrbnp';
export function fkey(bd, white) {
  let k = '';
  for (let s = 0; s < 128; s++) { if (s & 0x88) { s += 7; continue; } const p = bd[s]; k += p ? PCH[p > 0 ? p : 13 + p] : '.'; }
  return k + (white ? 'w' : 'b');
}
// Which positions in the stretch could still reach a third occurrence within
// d more White moves (and d Black replies)? A visit to X needs at least one
// move per piece of each colour standing off its square in X, and every visit
// after the first needs a full cycle of two moves a side. Anything outside that
// bound cannot make a repetition inside the horizon, so it is dropped from the
// history: the answer cannot depend on it, and the memo then matches far more.
function relevant(hist, d) {
  const cur = hist[hist.length - 1];
  const counts = new Map();
  for (const k of hist) counts.set(k, (counts.get(k) || 0) + 1);
  const out = [];
  for (const [k, c] of counts) {
    let ok;
    if (k === cur) ok = 2 * (3 - c) <= d;
    else {
      let dw = 0, db = 0;
      for (let i = 0; i < 64; i++) {
        const a = k.charCodeAt(i), b = cur.charCodeAt(i);
        if (a === b || a === 46) continue;
        if (a < 97) dw++; else db++;
      }
      const more = 2 * (2 - c);
      ok = dw + more <= d && db + more <= d;
    }
    if (ok) for (let i = 0; i < c; i++) out.push(k);
  }
  if (out[out.length - 1] !== cur) { const i = out.indexOf(cur); if (i >= 0) out.splice(i, 1); out.push(cur); }
  return out;
}
function insufficientF(bd) {
  let extra = 0, minor = true;
  for (let s = 0; s < 128; s++) { if (s & 0x88) { s += 7; continue; } const p = bd[s]; if (!p) continue; const k = p > 0 ? p : -p; if (k === 6) continue; extra++; if (k !== 2 && k !== 3) minor = false; if (extra > 1) return false; }
  return extra === 0 || minor;
}
const cnt = (h, k) => { let c = 0; for (let i = 0; i < h.length; i++) if (h[i] === k) c++; return c; };
const maxCnt = (h) => { let m = 0; for (const k of h) { const c = cnt(h, k); if (c > m) m = c; } return m; };
function concF(bd, white, hist) {
  const ms = fastLegal(bd, white);
  if (!ms.length) return fastInCheck(bd, white) ? 'mate' : 'stalemate';
  if (insufficientF(bd)) return 'material';
  if (cnt(hist, hist[hist.length - 1]) >= 3) return 'repetition';
  return null;
}
// make / unmake with queen promotion, matching applyMove in app/mate/chess.js
export function make(bd, m) {
  const f = m >> 8, t = m & 255; const cap = bd[t]; const pc = bd[f];
  bd[t] = pc; bd[f] = 0;
  let promo = false;
  if (pc === 1 && (t >> 4) === 0) { bd[t] = 5; promo = true; }
  if (pc === -1 && (t >> 4) === 7) { bd[t] = -5; promo = true; }
  return { f, t, cap, pc, promo, irr: !!cap || pc === 1 || pc === -1 };
}
function unmake(bd, u) { bd[u.f] = u.pc; bd[u.t] = u.cap; }

class Budget extends Error {}
export function makeFastDraw({ checksOnly = false, matePrune = 1 } = {}) {
  const memo = new Map();
  const mf = makeFastSearch();
  const killer = [];
  let nodes = 0;
  // Black to move: a forced mate within matePrune Black moves. Sound as a cut
  // while no position in the stretch has occurred twice (a third occurrence
  // needs six more plies, and a mate within three takes at most five).
  const mateCut = (bd) => { for (let n = 1; n <= matePrune; n++) if (mf(bd, false, n)) return true; return false; };
  function holds(bd, hist0, d) {
    if (d <= 0) return false;
    const hist = relevant(hist0, d);
    const mk = d + '|' + hist.slice().sort().join(';');
    const ent = memo.get(mk);
    if (ent) { if (ent.t !== undefined && d >= ent.t) return true; if (ent.f !== undefined && d <= ent.f) return false; }
    if (++nodes > NODE_CAP) throw new Budget();
    let res = false;
    const ws = fastLegal(bd, true).map((m) => {
      const u = make(bd, m); const chk = fastInCheck(bd, false); unmake(bd, u);
      return { m, r: chk ? 0 : u.cap ? 1 : 2 };
    }).sort((a, b) => a.r - b.r || a.m - b.m);
    for (const { m, r } of ws) {
      const u = make(bd, m);
      const h1 = u.irr ? [fkey(bd, false)] : hist.concat([fkey(bd, false)]);
      const c1 = concF(bd, false, h1);
      let ok;
      if (c1) ok = true;
      else if (checksOnly && r !== 0) ok = false;
      else if (maxCnt(h1) <= 1 && mateCut(bd)) ok = false;
      else ok = replies(bd, h1, d - 1);
      unmake(bd, u);
      if (ok) { res = true; break; }
    }
    const e = memo.get(mk) || {};
    if (res) e.t = e.t === undefined ? d : Math.min(e.t, d); else e.f = e.f === undefined ? d : Math.max(e.f, d);
    memo.set(mk, e);
    return res;
  }
  // Black to move: does every reply draw at once or leave White holding within d?
  function replies(bd, hist, d) {
    let rs = fastLegal(bd, false);
    const kl = killer[d];
    if (kl !== undefined) { const i = rs.indexOf(kl); if (i > 0) { rs = rs.slice(); rs.splice(i, 1); rs.unshift(kl); } }
    for (const r of rs) {
      const u = make(bd, r);
      const h2 = u.irr ? [fkey(bd, true)] : hist.concat([fkey(bd, true)]);
      const c2 = concF(bd, true, h2);
      const good = c2 === 'mate' ? false : c2 ? true : holds(bd, h2, d);
      unmake(bd, u);
      if (!good) { killer[d] = r; return false; }
    }
    return true;
  }
  return { holds, replies, nodes: () => nodes };
}

// ─── the book: every line on which White keeps the draw ────────────────────
//
// From a White-to-move position with `left` White moves still in the budget,
// a HOLDING move is one after which White still forces a draw inside the
// budget. The book stores, for every White-to-move position a player can reach
// by holding, the full set of holding moves, and after each one the reply the
// defence plays there, taken from blackDefence in lib/swindle-core.js (the
// browser's own function) on the shipped engine. Black's reply is fixed, so the
// book branches only on White's holding moves.
//
// Format, per White-to-move node: { [uci]: entry }, where entry is 0 when the
// White move itself ends the game, [reply] when the reply ends it, and
// [reply, node] otherwise. The root holds the key alone: every other first move
// is a forced mate, proved separately.
export class BookTooBig extends Error {}
const sqName = (i) => String.fromCharCode(97 + (i & 7)) + String(8 - (i >> 3));
export function buildBook(a, keyUci, budget, { maxNodes = 600, lib } = {}) {
  const { applyMove, parseUci, posKey, extendHist, blackDefence, makeMateSearch, makeDrawSearch } = lib;
  const bd = toFast(a);
  const ds = makeFastDraw();
  const searches = { mate: makeMateSearch(), draw: makeDrawSearch() };
  let count = 0;
  const legalUci = (white) => fastLegal(bd, white).map((m) => ({ m, u: uciOf(m >> 8, m & 255) })).sort((x, y) => (x.u < y.u ? -1 : 1));
  const byUci = (white, u) => legalUci(white).find((x) => x.u === u);
  function wnode(fh, lb, lh, left) {
    if (++count > maxNodes) throw new BookTooBig();
    const node = {};
    // a mate on the board means White is winning, not drawing: look for it
    // before paying for any holding test
    for (const { m } of legalUci(true)) {
      const un = make(bd, m);
      const mated = !fastLegal(bd, false).length && fastInCheck(bd, false);
      unmake(bd, un);
      if (mated) throw new Error('book: White can mate');
    }
    for (const { m, u } of legalUci(true)) {
      const un = make(bd, m);
      const h1 = un.irr ? [fkey(bd, false)] : fh.concat([fkey(bd, false)]);
      const c1 = concF(bd, false, h1);
      let holding = false;
      if (c1 === 'mate') { unmake(bd, un); throw new Error('book: White can mate'); }
      if (c1) holding = true;
      else holding = ds.replies(bd, h1, left - 1);
      if (holding) {
        const mv = parseUci(u); const lb1 = applyMove(lb, mv.from, mv.to); const lh1 = extendHist(lh, lb, mv.from, mv.to, lb1, 'b');
        node[u] = c1 ? 0 : bnode(h1, lb1, lh1, left - 1);
      }
      unmake(bd, un);
    }
    if (!Object.keys(node).length) throw new Error('book: a held node with no holding move');
    return node;
  }
  function bnode(fh, lb, lh, left) {
    const def = blackDefence(lb, lh, left, searches);
    const r = byUci(false, def.uci);
    if (!r) throw new Error('book: defence reply not legal on the fast board');
    const un = make(bd, r.m);
    const h2 = un.irr ? [fkey(bd, true)] : fh.concat([fkey(bd, true)]);
    const c2 = concF(bd, true, h2);
    let out;
    if (c2 === 'mate') { unmake(bd, un); throw new Error('book: Black mates on a held line'); }
    if (c2) out = [def.uci];
    else {
      if (left <= 0) { unmake(bd, un); throw new Error('book: budget spent on a held line'); }
      const mv = parseUci(def.uci); const lb2 = applyMove(lb, mv.from, mv.to); const lh2 = extendHist(lh, lb, mv.from, mv.to, lb2, 'w');
      out = [def.uci, wnode(h2, lb2, lh2, left)];
    }
    unmake(bd, un);
    return out;
  }
  const k = byUci(true, keyUci);
  if (!k) throw new Error('book: key not legal');
  const lb0 = a.slice();
  const lh0 = [posKey(lb0, 'w')];
  const h0 = [fkey(bd, true)];
  const un = make(bd, k.m);
  const h1 = un.irr ? [fkey(bd, false)] : h0.concat([fkey(bd, false)]);
  const c1 = concF(bd, false, h1);
  if (c1 === 'mate') throw new Error('book: the key mates');
  const kmv = parseUci(keyUci); const lb1 = applyMove(lb0, kmv.from, kmv.to); const lh1 = extendHist(lh0, lb0, kmv.from, kmv.to, lb1, 'b');
  const root = { [keyUci]: c1 ? 0 : bnode(h1, lb1, lh1, budget - 1) };
  unmake(bd, un);
  // The principal line: at every node the holding move that draws soonest (then
  // the lowest UCI), answered by the book's reply. Its last move is the draw.
  const line = [];
  let node = root, fh = h0, end = null;
  for (let guard = 0; guard < 2 * budget + 2 && node; guard++) {
    const left = budget - line.filter((_, i) => i % 2 === 0).length;
    let pick = null;
    for (let kk = 0; kk < left && !pick; kk++) {
      for (const u of Object.keys(node).sort()) {
        const mv = byUci(true, u);
        const un2 = make(bd, mv.m);
        const hh = un2.irr ? [fkey(bd, false)] : fh.concat([fkey(bd, false)]);
        const ok = node[u] === 0 ? true : ds.replies(bd, hh, kk);
        unmake(bd, un2);
        if (ok) { pick = u; break; }
      }
    }
    if (!pick) throw new Error('book: no holding move draws inside the budget');
    const mv = byUci(true, pick); const un2 = make(bd, mv.m);
    fh = un2.irr ? [fkey(bd, false)] : fh.concat([fkey(bd, false)]);
    line.push(pick);
    const e = node[pick];
    if (e === 0) { end = concF(bd, false, fh); node = null; break; }
    const r = byUci(false, e[0]); const un3 = make(bd, r.m);
    fh = un3.irr ? [fkey(bd, true)] : fh.concat([fkey(bd, true)]);
    line.push(e[0]);
    if (e.length === 1) { end = concF(bd, true, fh); node = null; break; }
    node = e[1];
  }
  return { book: root, nodes: count, line, end };
}

// ─── sampling ───────────────────────────────────────────────────────────────
const CODE = { P: 1, N: 2, B: 3, R: 4, Q: 5, K: 6 };
const VAL = { q: 9, r: 5, b: 3, n: 3, p: 1 };
function rng(seed) {
  let s = (seed >>> 0) || 0x9e3779b9;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
export function toFast(a) {
  const bd = new Int8Array(128);
  for (let i = 0; i < 64; i++) { const p = a[i]; if (!p) continue; const k = CODE[p.toUpperCase()]; bd[from64(i)] = p === p.toUpperCase() ? k : -k; }
  return bd;
}
const to64 = (sq) => (sq >> 4) * 8 + (sq & 7);
// The three sampler shapes. S: White's king and pawns are already frozen, so
// losing the last piece stalemates White. P: an open Black king a queen can
// chase. M: a lone minor piece against a lone heavy one, where winning it
// leaves too little to mate with.
const SHAPES = {
  S: { W: [['R'], ['R'], ['Q'], ['R'], ['Q'], ['B'], ['N'], ['R', 'B'], ['R', 'N'], ['Q', 'N'], ['R', 'R']], B: [['q'], ['q', 'r'], ['q', 'b'], ['q', 'n'], ['r', 'r'], ['q', 'p'], ['r', 'b'], ['q', 'r', 'p'], ['r', 'n'], ['q', 'q']] },
  P: { W: [['Q'], ['Q'], ['Q', 'P'], ['Q', 'N'], ['R', 'R'], ['Q', 'B'], ['R', 'N']], B: [['q', 'r'], ['q', 'r', 'p'], ['q', 'b', 'p'], ['r', 'r', 'p'], ['q', 'q'], ['q', 'r', 'b'], ['q', 'n', 'p'], ['q', 'p', 'p']] },
  M: { W: [['N'], ['N'], ['B'], ['N'], ['B']], B: [['q'], ['q'], ['r'], ['q']] },
  Q: { W: [['Q'], ['Q'], ['Q', 'P'], ['Q', 'R']], B: [['q', 'r'], ['q', 'b'], ['q', 'q'], ['q', 'p'], ['q', 'r', 'p'], ['r', 'r']] },
};
// Q (chunks from 1000 on): a queen against a king in a corner of its own
// pieces, the shape most deep perpetuals in the first pool turned out to have.
function sample(R, type) {
  const r = (n) => Math.floor(R() * n);
  const pick = (a) => a[r(a.length)];
  const near = (s, rad) => { for (let t = 0; t < 50; t++) { const rr = (s >> 3) + r(2 * rad + 1) - rad, ff = (s & 7) + r(2 * rad + 1) - rad; if (rr >= 0 && rr < 8 && ff >= 0 && ff < 8) return rr * 8 + ff; } return r(64); };
  const b = new Array(64).fill(null);
  const put = (p, s) => { if (s < 0 || s > 63 || b[s]) return false; if ((p === 'P' || p === 'p') && ((s >> 3) < 2 || (s >> 3) > 5)) return false; b[s] = p; return true; };
  const place = (p, around, rad) => { for (let t = 0; t < 60; t++) { const s = around === undefined ? r(64) : near(around, rad); if (put(p, s)) return s; } return -1; };
  const wk = (R() < 0.5 || type === 'Q') ? pick([0, 7, 56, 63, 1, 6, 8, 15, 48, 55, 57, 62]) : pick([2, 3, 4, 5, 16, 24, 32, 40, 23, 31, 39, 47, 58, 59, 60, 61]);
  b[wk] = 'K';
  if (type !== 'M') {
    const np = r(4);
    for (let i = 0; i < np; i++) { const s = near(wk, 1); if (put('P', s) && R() < 0.75) put('p', s - 8); }
  }
  let bk = -1;
  for (let t = 0; t < 100; t++) {
    const s = type === 'P' ? near(wk, 4) : type === 'Q' ? pick([0, 7, 56, 63, 1, 8, 6, 15, 48, 57, 55, 62, 16, 23, 40, 47]) : r(64);
    if (!b[s] && Math.max(Math.abs((s >> 3) - (wk >> 3)), Math.abs((s & 7) - (wk & 7))) > 1) { bk = s; break; }
  }
  if (bk < 0) return null;
  b[bk] = 'k';
  if ((type === 'P' || type === 'Q') && R() < 0.6) { const n = 1 + r(2); for (let i = 0; i < n; i++) put('p', near(bk, 1)); }
  for (const p of pick(SHAPES[type].W)) if (place(p, R() < 0.5 ? bk : undefined, 3) < 0) return null;
  for (const p of pick(SHAPES[type].B)) if (place(p, R() < 0.6 ? wk : undefined, 3) < 0) return null;
  return b;
}

// One trial. Returns a pool record or null.
export const STAT = {};
const st = (k) => { STAT[k] = (STAT[k] || 0) + 1; };
export function trial(R, type) {
  const a = sample(R, type); if (!a) return null;
  let wm = 0, bm = 0;
  for (const p of a) { if (!p || p === 'K' || p === 'k') continue; if (p === p.toUpperCase()) wm += VAL[p.toLowerCase()]; else bm += VAL[p]; }
  st(type + ' sampled');
  if (bm - wm < 5) return null;                                   // White is badly lost
  const bd = toFast(a);
  if (fastInCheck(bd, true) || fastInCheck(bd, false)) return null;
  const moves = fastLegal(bd, true);
  if (moves.length < 2) return null;
  if (type === 'S' || type === 'P' || type === 'Q') {
    let km = 0, pm = 0;
    for (const m of moves) { const p = bd[m >> 8]; if (p === 6) km++; if (p === 1) pm++; }
    if (km > (type === 'S' ? 0 : type === 'Q' ? 1 : 2) || pm > 0) return null;
    if (type === 'S') {
      const b2 = bd.slice(); for (let s = 0; s < 128; s++) if (b2[s] > 1 && b2[s] < 6) b2[s] = 0;
      if (fastInCheck(b2, true) || fastLegal(b2, true).length) return null;
    }
  }
  st(type + ' shaped');
  const f = makeFastSearch();
  if (!f(bd, false, 1)) return null;                                // Black threatens mate
  if (f(bd, true, 3)) return null;                                  // and White is not simply winning
  st(type + ' threat');
  // every move but one loses to a forced mate; staged so the cheap depths cut first
  let rest = [];
  const mateIn1 = new Set();
  for (const m of moves) { const u = make(bd, m); const lost = f(bd, false, 1); unmake(bd, u); if (!lost) rest.push(m); else mateIn1.add(m); }
  if (rest.length > Math.max(3, moves.length / 2)) return null;
  for (let n = 2; n <= LOSE_CAP && rest.length; n++) {
    const nx = [];
    for (const m of rest) { const u = make(bd, m); const lost = f(bd, false, n); unmake(bd, u); if (!lost) nx.push(m); }
    rest = nx;
  }
  if (rest.length === 0) st(type + ' allLose');
  if (rest.length !== 1) return null;
  st(type + ' unique');
  const key = rest[0];
  const victim = a[to64(key & 255)];
  if (victim === 'q' || victim === 'r') return null;              // no free queen or rook for the key
  const rootKey = fkey(bd, true);
  const u = make(bd, key);
  let drawIn = Infinity, nodes = 0;
  try {
    if (!f(bd, false, LOSE_CAP + 1)) {
      st(type + ' keyNotLost');
      // The start position is part of the game: a perpetual that comes back to
      // it reaches its third occurrence a whole cycle sooner. (Chunks before
      // 2026-10-14 11:30 UTC left it out, so their drawIn can run long; the
      // bank re-measures every board before dealing it, see exactDrawIn.)
      const h = u.irr ? [fkey(bd, false)] : [rootKey, fkey(bd, false)];
      const c = concF(bd, false, h);
      if (c === 'stalemate' || c === 'material' || c === 'repetition') drawIn = 1;
      else if (c === null) {
        // cheap first: a full search two deep, then checks only, deeper; a
        // draw found that way is then proved shortest on the full search
        const full = makeFastDraw();
        let found = Infinity;
        for (let k = 0; k <= 2 && found === Infinity; k++) if (full.replies(bd, h, k)) found = k + 1;
        if (found === Infinity) {
          const chk = makeFastDraw({ checksOnly: true });
          for (let k = 3; k < DRAW_MAX && found === Infinity; k++) if (chk.replies(bd, h, k)) found = k + 1;
          nodes += chk.nodes();
          if (found !== Infinity) for (let k = 3; k < found - 1; k++) if (full.replies(bd, h, k)) { found = k + 1; break; }
        }
        drawIn = found;
        nodes += full.nodes();
      }
    }
  } catch (e) { if (!(e instanceof Budget)) throw e; drawIn = Infinity; }
  unmake(bd, u);
  if (drawIn === Infinity) return null;
  st(type + ' draw');
  return {
    board: a.map((p) => p || '.').join(''),
    type,
    key: uciOf(key >> 8, key & 255),
    drawIn,
    legal: moves.length,
    mate1: mateIn1.size,
    nodes,
  };
}

// ─── worker ─────────────────────────────────────────────────────────────────
if (!isMainThread && workerData && workerData.role === 'pool') {
  parentPort.on('message', (chunk) => {
    if (chunk === null) { process.exit(0); }
    const R = rng(0x5a17d1e ^ Math.imul(chunk + 1, 2654435761));
    // the type mix is fixed per chunk range, so a chunk always replays the same
    const types = chunk >= 1000 ? ['S', 'P', 'Q', 'Q', 'Q'] : ['S', 'S', 'P', 'P', 'M'];
    const out = [];
    for (let t = 0; t < TRIALS; t++) {
      const rec = trial(R, types[t % types.length]);
      if (rec) out.push(rec);
    }
    parentPort.postMessage({ chunk, out });
  });
}

// ─── main ───────────────────────────────────────────────────────────────────
async function runPool(nChunks, nWorkers, from = 0) {
  const done = existsSync(CHUNKS) ? JSON.parse(readFileSync(CHUNKS, 'utf8')) : [];
  const doneSet = new Set(done);
  const todo = [];
  for (let c = from; todo.length < nChunks; c++) if (!doneSet.has(c)) todo.push(c);
  const seen = new Set();
  if (existsSync(POOL)) for (const line of readFileSync(POOL, 'utf8').split('\n')) if (line) seen.add(JSON.parse(line).board);
  let kept = 0;
  const t0 = Date.now();
  await new Promise((resolve) => {
    let active = 0;
    const next = (w) => {
      const c = todo.shift();
      if (c === undefined) { w.postMessage(null); if (--active === 0) resolve(); return; }
      w.postMessage(c);
    };
    for (let i = 0; i < Math.min(nWorkers, todo.length); i++) {
      const w = new Worker(fileURLToPath(import.meta.url), { workerData: { role: 'pool' } });
      active++;
      w.on('message', ({ chunk, out }) => {
        for (const rec of out) { if (seen.has(rec.board)) continue; seen.add(rec.board); appendFileSync(POOL, JSON.stringify({ ...rec, chunk }) + '\n'); kept++; }
        done.push(chunk); writeFileSync(CHUNKS, JSON.stringify(done));
        process.stderr.write(`chunk ${chunk}: +${out.length} (kept ${kept}, ${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
        next(w);
      });
      next(w);
    }
  });
  console.log(JSON.stringify({ chunks: nChunks, kept, secs: Math.round((Date.now() - t0) / 1000) }));
}

// ─── the bank ─────────────────────────────────────────────────────────────
const CONFIRM = join(HERE, '.swindle-confirm.jsonl');
export const FIRST = '2026-10-14';
export const LAST = '2027-01-31';
// Budget: White moves allowed before the round is lost. It exceeds the key line
// by two on the shallow boards and by one on the deep ones (where every extra
// move multiplies the lines the book has to carry).
export const budgetFor = (drawIn) => drawIn + (drawIn <= 3 ? 2 : 1);
// The weekday ramp, by the measured drawIn: how many White moves the draw takes
// against the best defence. 0 = Sunday.
export const BANDS = {
  1: [1, 1], 2: [1, 2], 3: [2, 2], 4: [2, 3], 5: [3, 4], 6: [4, 5], 0: [5, 99],
};
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function dayList() {
  const out = [];
  for (let t = Date.parse(FIRST + 'T12:00:00Z'); t <= Date.parse(LAST + 'T12:00:00Z'); t += 86400000) {
    const d = new Date(t);
    out.push({ iso: d.toISOString().slice(0, 10), y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, dd: d.getUTCDate(), dow: d.getUTCDay() });
  }
  return out;
}
function toFen(a) {
  let out = '';
  for (let r = 0; r < 8; r++) {
    let e = 0;
    for (let f = 0; f < 8; f++) { const p = a[r * 8 + f]; if (!p) e++; else { if (e) { out += e; e = 0; } out += p; } }
    if (e) out += e;
    if (r < 7) out += '/';
  }
  return out + ' w - - 0 1';
}

// The exact drawIn on the fast core, with the start position in the history:
// the fewest White moves (the key included) that force the draw, searched up
// from 1 to the pool's figure, which can only be an overestimate.
export function exactDrawIn(rec) {
  const a = rec.board.split('').map((c) => (c === '.' ? null : c));
  const bd = toFast(a);
  const k = fastLegal(bd, true).find((m) => uciOf(m >> 8, m & 255) === rec.key);
  const rootKey = fkey(bd, true);
  const u = make(bd, k);
  const h = u.irr ? [fkey(bd, false)] : [rootKey, fkey(bd, false)];
  const c = concF(bd, false, h);
  let d = Infinity;
  if (c && c !== 'mate') d = 1;
  else {
    const full = makeFastDraw();
    for (let kk = 0; kk < rec.drawIn; kk++) if (full.replies(bd, h, kk)) { d = kk + 1; break; }
  }
  unmake(bd, u);
  return d;
}

// Re-prove a pool board on the shipped engine and build its book. Returns the
// record or { ok: false, why }.
export async function confirm(rec0, lib) {
  let rec = rec0;
  try {
    const d = exactDrawIn(rec0);
    if (d === Infinity) return { ok: false, why: 'no draw on re-measure' };
    if (d !== rec0.drawIn) rec = { ...rec0, drawIn: d };
  } catch (e) { return { ok: false, why: 'drawIn re-measure over budget' }; }
  const { legalMoves, applyMove, inCheck, isCheckmate, toSan, parseUci, posKey, extendHist, conclusion, makeMateSearch, makeDrawSearch, blackDefence, THEME_OF } = lib;
  const a = rec.board.split('').map((c) => (c === '.' ? null : c));
  for (let i = 0; i < 64; i++) if ((a[i] === 'P' || a[i] === 'p') && ((i >> 3) < 2 || (i >> 3) > 5)) return { ok: false, why: 'pawn rank' };
  if (inCheck(a, 'w') || inCheck(a, 'b')) return { ok: false, why: 'check' };
  const legal = legalMoves(a, 'w');
  if (!legal.some((m) => m.uci === rec.key)) return { ok: false, why: 'key illegal' };
  const mate = makeMateSearch();
  for (const m of legal) {
    if (m.uci === rec.key) continue;
    if (!mate.forcesMateWithin(applyMove(a, m.from, m.to), 'b', LOSE_CAP)) return { ok: false, why: 'decoy holds ' + m.uci };
  }
  // the key draws within drawIn on the shipped engine
  const k = parseUci(rec.key);
  const after = applyMove(a, k.from, k.to);
  const h0 = [posKey(a, 'w')];
  const h1 = extendHist(h0, a, k.from, k.to, after, 'b');
  const draw = makeDrawSearch();
  const c1 = conclusion(after, 'b', h1);
  if (c1 === 'mate') return { ok: false, why: 'key mates' };
  if (!c1) {
    for (const r of legalMoves(after, 'b')) {
      const nb = applyMove(after, r.from, r.to);
      const h2 = extendHist(h1, after, r.from, r.to, nb, 'w');
      const c2 = conclusion(nb, 'w', h2);
      if (c2 === 'mate') return { ok: false, why: 'key loses' };
      if (c2) continue;
      if (!draw.holds(nb, h2, rec.drawIn - 1)) return { ok: false, why: 'key draw not proved' };
    }
  } else if (rec.drawIn !== 1) return { ok: false, why: 'drawIn mismatch' };
  const budget = budgetFor(rec.drawIn);
  let built;
  try { built = buildBook(a, rec.key, budget, { lib }); }
  catch (e) { return { ok: false, why: e instanceof BookTooBig ? 'book too big' : e.message }; }
  if (!THEME_OF[built.end]) return { ok: false, why: 'line ends ' + built.end };
  // every losing first move: the defence collects the mate inside LOSE_CAP
  const searches = { mate, draw: makeDrawSearch() };
  for (const m of legal) {
    if (m.uci === rec.key) continue;
    let b = applyMove(a, m.from, m.to);
    let h = extendHist(h0, a, m.from, m.to, b, 'b');
    let wMoves = 1, bMoves = 0, end = null;
    for (let guard = 0; guard < 20 && !end; guard++) {
      const def = blackDefence(b, h, budget - wMoves, searches);
      if (!def || !def.mateIn) { end = 'nomate'; break; }
      const nb = applyMove(b, def.from, def.to); h = extendHist(h, b, def.from, def.to, nb, 'w'); b = nb; bMoves++;
      const c = conclusion(b, 'w', h);
      if (c) { end = c; break; }
      // White squirms: the move that puts the mate furthest off, then lowest UCI
      let best = null;
      for (const w of legalMoves(b, 'w').sort((x, y) => (x.uci < y.uci ? -1 : 1))) {
        const nb2 = applyMove(b, w.from, w.to);
        let n = 1; while (n <= LOSE_CAP && !mate.forcesMateWithin(nb2, 'b', n)) n++;
        if (!best || n > best.n) best = { w, n };
      }
      const nb2 = applyMove(b, best.w.from, best.w.to); h = extendHist(h, b, best.w.from, best.w.to, nb2, 'b'); b = nb2; wMoves++;
      const c3 = conclusion(b, 'b', h);
      if (c3) { end = 'white ' + c3; break; }
    }
    if (end !== 'mate' || bMoves > LOSE_CAP) return { ok: false, why: `losing line ${m.uci} ends ${end} in ${bMoves}` };
  }
  return {
    ok: true,
    fen: toFen(a),
    key: rec.key,
    keySan: toSan(a, k.from, k.to),
    drawIn: rec.drawIn,
    budget,
    theme: THEME_OF[built.end],
    legal: legal.length,
    decoys: legal.length - 1 - rec.mate1,
    line: built.line,
    bookNodes: built.nodes,
    book: built.book,
  };
}

export function renderBank(bank) {
  const head = `// Puzzle data for Swindle, the daily "White to play and draw" chess puzzle.
// GENERATED by scripts/gen-swindle.mjs (pool, then bank) and checked by
// scripts/verify-swindle.mjs. Do not edit by hand: regenerate.
//
// Imported ONLY by the server page (app/swindle/page.js), which filters
// live <= today before handing the bank to the client, so tomorrow's position
// never ships to a browser.
//
// THE CLAIM, per board. White to move and badly lost (Black is up at least five
// points of material and threatens mate). Exactly ONE White first move, key,
// forces a DRAW against any Black defence: stalemate (the side to move has no
// legal move and is not in check), threefold repetition (the same position with
// the same side to move for the third time), or insufficient material (bare
// kings, or a king and one bishop or knight against a bare king). Every other
// legal first move lets Black force checkmate within ${LOSE_CAP} Black moves.
//
// Chess here is app/mate/chess.js: no castling (rights are always '-'), no en
// passant (no pawn stands on its home rank, rows 2 and 7 are empty of pawns,
// so a pawn never has a two-square push), and a pawn reaching the far rank
// becomes a queen.
//
// FIELDS
//   num, quizId 'swindle-M-D-YY', live 'YYYY-MM-DD', dateLabel, sunday (true
//             only on real Sundays: the Sunday Edition).
//   fen       the position, White to move.
//   key       the one first move that holds the draw, UCI. Never shown to a
//             player who did not find it.
//   keySan    the same move in algebraic, for the solved player's recap.
//   drawIn    1 to 7: how many White moves (the key included) the draw takes
//             against the best defence. A draw that lands on Black's reply to
//             White's n-th move is a draw in n.
//   budget    White moves allowed before the round is lost: drawIn + 2 when
//             drawIn <= 3, drawIn + 1 above that.
//   theme     'stalemate' | 'perpetual' | 'material': how the principal line
//             ends (perpetual = a threefold repetition).
//   legal     White's legal first moves. decoys: how many of the losing ones
//             survive Black's first reply (are not a mate in one).
//   line      the principal line, UCI: at every turn White's holding move that
//             draws soonest (then the lowest UCI), Black's reply from the book.
//   book      every line on which White keeps the draw inside the budget: for
//             each White-to-move position, { holdingMove: entry }, entry 0
//             when the move itself ends the game, [reply] when Black's reply
//             ends it, [reply, nextNode] otherwise. The replies are what
//             blackDefence in lib/swindle-core.js plays there. A White move
//             not in its node is a move that throws the draw away.
//
// THE RAMP (measured drawIn, by weekday): Mon 1, Tue 1-2, Wed 2, Thu 2-3,
// Fri 3-4, Sat 4-5, Sunday Edition 5 or more, the deepest of the week.
// No position repeats. No theme past 60% of the bank where the pool allows.
`;
  const rows = bank.map((p) => '  ' + JSON.stringify(p));
  return head + 'export const PUZZLES = [\n' + rows.join(',\n') + '\n];\n';
}

export async function loadLib() {
  const chess = await import('../app/mate/chess.js');
  const defense = await import('../app/defend/defense.js');
  const core = await import('../lib/swindle-core.js');
  return { ...chess, ...defense, ...core };
}

export async function buildBank(pool) {
  const lib = await loadLib();
  const cache = new Map();
  if (existsSync(CONFIRM)) for (const l of readFileSync(CONFIRM, 'utf8').split('\n')) if (l) { const r = JSON.parse(l); if (r.v === 2) cache.set(r.board, r.res); }
  const get = async (rec) => {
    if (cache.has(rec.board)) return cache.get(rec.board);
    // With --cached the bank deals from boards already confirmed and never
    // starts a confirmation of its own (they can take minutes on a deep board).
    if (process.argv.includes('--cached')) return { ok: false, why: 'not confirmed yet' };
    const t0 = Date.now();
    const res = await confirm(rec, lib);
    process.stderr.write(`confirm ${rec.type} d${rec.drawIn} ${res.ok ? 'ok ' + res.theme + ' book ' + res.bookNodes : 'REJECT ' + res.why} ${Date.now() - t0}ms\n`);
    cache.set(rec.board, res);
    appendFileSync(CONFIRM, JSON.stringify({ v: 2, board: rec.board, res }) + '\n');
    return res;
  };
  const days = dayList();
  const used = new Set();
  const themeCount = { stalemate: 0, perpetual: 0, material: 0 };
  const out = [];
  // THE RAMP. A board's difficulty score is drawIn * 100 + decoys (how many
  // losing first moves survive Black's first reply, i.e. look playable). Inside
  // a week, Monday to Saturday, the score never falls from one day to the next;
  // the weekday bands on drawIn do the coarse work and the score settles ties
  // where two bands overlap. Inside its band a day prefers a drawIn near its
  // target, Monday also prefers few legal moves, Wednesday few decoys (leaving
  // the harder twos for Thursday), the weekend many. A theme already holding
  // more than half of the bank so far goes to the back of the queue.
  const TARGET = { 1: 1, 2: 1.5, 3: 2, 4: 2.5, 5: 3.5, 6: 5, 0: 7 };
  const score = (r) => r.drawIn * 100 + r.decoys;
  let weekFloor = 0;
  let num = 0;
  for (const day of days) {
    num++;
    if (day.dow === 1) weekFloor = 0;
    const [lo, hi] = BANDS[day.dow];
    const R = rng(Number(day.iso.replace(/-/g, '')) ^ 0x51d1e);
    const elig = [];
    for (const p of pool) {
      if (used.has(p.board) || p.drawIn < lo) continue;   // the pool figure can only overestimate
      const r = await get(p);
      if (!r.ok || r.drawIn < lo || r.drawIn > hi) continue;
      if (day.dow === 0 || score(r) >= weekFloor) elig.push({ p, r, k: R() });
    }
    if (!elig.length) throw new Error(`no board for ${day.iso} (dow ${day.dow}, drawIn ${lo}-${hi}, score from ${weekFloor})`);
    const pref = (e) => {
      let v = -Math.abs(e.r.drawIn - TARGET[day.dow]) * 100;
      if (day.dow === 1) v -= e.r.legal;
      if (day.dow === 3) v -= e.r.decoys;
      if (day.dow === 4 || day.dow === 6 || day.dow === 0) v += e.r.decoys;
      return v - e.r.bookNodes / 20;   // a smaller book ships lighter and checks faster
    };
    const over = (e) => (themeCount[e.r.theme] + 1 > 0.5 * (num) && num > 6 ? 1 : 0);
    elig.sort((x, y) => over(x) - over(y) || pref(y) - pref(x) || x.k - y.k);
    const { p: chosen, r: res } = elig[0];
    used.add(chosen.board);
    themeCount[res.theme]++;
    if (day.dow !== 0) weekFloor = score(res);
    const yy = String(day.y).slice(2);
    out.push({
      num,
      quizId: `swindle-${day.m}-${day.dd}-${yy}`,
      live: day.iso,
      dateLabel: `${MONTHS[day.m - 1]} ${day.dd}, ${day.y}`,
      sunday: day.dow === 0,
      fen: res.fen, key: res.key, keySan: res.keySan, drawIn: res.drawIn, budget: res.budget,
      theme: res.theme, legal: res.legal, decoys: res.decoys, line: res.line, book: res.book,
    });
  }
  process.stderr.write(JSON.stringify(themeCount) + '\n');
  return out;
}

function readPool() {
  if (!existsSync(POOL)) return [];
  return readFileSync(POOL, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

if (isMainThread && process.argv[1] === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2] || 'pool';
  if (mode === 'pool') await runPool(Number(process.argv[3] || 40), Number(process.argv[4] || 2), Number(process.argv[5] || 0));
  else if (mode === 'migrate') {
    // Carry confirmations made before the start-position fix forward when the
    // re-measured drawIn agrees, so only the boards it changes are redone.
    const pool = new Map(readPool().map((r) => [r.board, r]));
    const lines = existsSync(CONFIRM) ? readFileSync(CONFIRM, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
    const v2 = new Set(lines.filter((r) => r.v === 2).map((r) => r.board));
    let kept = 0, redo = 0;
    for (const r of lines) {
      if (r.v === 2 || v2.has(r.board)) continue;
      const rec = pool.get(r.board);
      if (!rec) continue;
      let d;
      try { d = exactDrawIn(rec); } catch (e) { d = -1; }
      const was = r.res.ok ? r.res.drawIn : rec.drawIn;
      if (d === was) { appendFileSync(CONFIRM, JSON.stringify({ v: 2, board: r.board, res: r.res }) + '\n'); v2.add(r.board); kept++; }
      else { redo++; process.stderr.write(`drawIn ${was} -> ${d}: ${r.board} ${rec.key}\n`); }
    }
    console.log(JSON.stringify({ kept, redo }));
  } else if (mode === 'confirm') {
    // warm the confirmation cache for every pool board not yet confirmed
    const lib = await loadLib();
    const have = new Set();
    if (existsSync(CONFIRM)) for (const l of readFileSync(CONFIRM, 'utf8').split('\n')) if (l) { const r = JSON.parse(l); if (r.v === 2) have.add(r.board); }
    const minD = Number(process.argv[3] || 1), maxD = Number(process.argv[4] || 99);
    for (const rec of readPool()) {
      if (have.has(rec.board) || rec.drawIn < minD || rec.drawIn > maxD) continue;
      const t0 = Date.now();
      const res = await confirm(rec, lib);
      appendFileSync(CONFIRM, JSON.stringify({ v: 2, board: rec.board, res }) + '\n');
      process.stderr.write(`confirm ${rec.type} d${rec.drawIn} ${res.ok ? 'ok ' + res.theme + ' book ' + res.bookNodes : 'REJECT ' + res.why} ${Date.now() - t0}ms\n`);
    }
  } else if (mode === 'stats') {
    const pool = readPool();
    const by = {};
    for (const p of pool) { const k = `${p.type} d${p.drawIn}`; by[k] = (by[k] || 0) + 1; }
    console.log(pool.length, by);
  } else if (mode === 'bank') {
    const bank = await buildBank(readPool());
    process.stdout.write(renderBank(bank));
  }
}
