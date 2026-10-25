// lib/mahj-core.js: Mahj, the daily 144-tile mahjong solitaire.
//
// The rules engine the client plays: the seven layouts, the 42 tile faces, the
// free-tile rule, the deal codec, the seeded redeal (Shuffle) and the hint
// search. scripts/gen-mahj.mjs deals the bank with it; scripts/verify-mahj.mjs
// re-derives the geometry and replays every deal's clearing order with its own
// code rather than trusting this file.
//
// THE RULE. A tile is FREE when no tile sits on top of it (one layer up,
// overlapping it) and its left or right side is open (no tile directly beside
// it on the same layer on that side). Two free tiles with the same face clear
// together; any flower clears with any flower, any season with any season.
//
// GEOMETRY. A position is { x, y, z } in TILE units: x across, y down, z the
// layer. Half units are allowed (a cap tile sitting across four below it).
// Two positions overlap when they are less than one tile apart on both axes.

export const TILE_COUNT = 144;

// ── the seven layouts, one per weekday ────────────────────────────────────
// Monday Bridge, Tuesday Fortress, Wednesday Cross, Thursday Towers, Friday
// Wide, Saturday Arena, Sunday Pyramid (the classic stack, the Sunday Edition).
function build(fn) {
  const P = [];
  fn((x, y, z) => P.push({ x, y, z }));
  return P;
}
function rect(add, x0, x1, y0, y1, z) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) add(x, y, z);
}

export const LAYOUTS = {
  bridge: {
    name: 'Bridge',
    pos: build((add) => {
      rect(add, 0, 13, 0, 5, 0);
      rect(add, 1, 4, 1, 4, 1); rect(add, 9, 12, 1, 4, 1); rect(add, 6, 7, 2, 3, 1);
      rect(add, 2, 3, 1, 4, 2); rect(add, 10, 11, 1, 4, 2); add(6.5, 2.5, 2);
      add(2.5, 2, 3); add(2.5, 3, 3); add(10.5, 2, 3); add(10.5, 3, 3); add(6.5, 2.5, 3);
      add(2.5, 2.5, 4); add(10.5, 2.5, 4);
    }),
  },
  fortress: {
    name: 'Fortress',
    pos: build((add) => {
      rect(add, 0, 11, 0, 5, 0);
      rect(add, 1, 10, 1, 4, 1);
      rect(add, 2, 9, 2, 3, 2);
      rect(add, 3, 8, 2, 3, 3);
      for (let x = 4; x <= 7; x++) add(x, 2.5, 4);
    }),
  },
  cross: {
    name: 'Cross',
    pos: build((add) => {
      const seen = new Set();
      const put = (x, y, z) => { const k = `${x},${y},${z}`; if (!seen.has(k)) { seen.add(k); add(x, y, z); } };
      for (let y = 2; y <= 5; y++) for (let x = 0; x <= 13; x++) put(x, y, 0);
      for (let y = 0; y <= 7; y++) for (let x = 4; x <= 9; x++) put(x, y, 0);
      for (let y = 3; y <= 4; y++) for (let x = 1; x <= 12; x++) put(x, y, 1);
      for (let y = 1; y <= 6; y++) for (let x = 5; x <= 8; x++) put(x, y, 1);
      for (let y = 2; y <= 5; y++) for (let x = 5; x <= 8; x++) put(x, y, 2);
      for (let y = 3; y <= 4; y++) for (let x = 6; x <= 7; x++) put(x, y, 3);
      put(-1, 3.5, 0); put(-2, 3.5, 0); put(14, 3.5, 0); put(15, 3.5, 0);
    }),
  },
  towers: {
    name: 'Towers',
    pos: build((add) => {
      rect(add, 0, 5, 0, 5, 0); rect(add, 8, 13, 0, 5, 0); rect(add, 6, 7, 1, 4, 0);
      rect(add, 1, 4, 1, 4, 1); rect(add, 9, 12, 1, 4, 1); rect(add, 6, 7, 1, 4, 1);
      rect(add, 2, 3, 1, 4, 2); rect(add, 10, 11, 1, 4, 2);
      rect(add, 2, 3, 2, 3, 3); rect(add, 10, 11, 2, 3, 3);
    }),
  },
  wide: {
    name: 'Wide',
    pos: build((add) => {
      rect(add, 0, 15, 0, 4, 0);
      rect(add, 1, 14, 1, 3, 1);
      rect(add, 3, 12, 2, 2, 2);
      rect(add, 5, 10, 2, 2, 3);
      rect(add, 6, 9, 2, 2, 4);
      rect(add, 7, 8, 2, 2, 5);
    }),
  },
  arena: {
    name: 'Arena',
    pos: build((add) => {
      // A floor with a hole in the middle, a two-deep ring on it, and a
      // tower in each corner.
      for (let y = 0; y <= 7; y++) for (let x = 0; x <= 11; x++) if (!(x >= 4 && x <= 7 && y >= 3 && y <= 4)) add(x, y, 0);
      for (let y = 1; y <= 6; y++) for (let x = 1; x <= 10; x++) if (!(x >= 3 && x <= 8 && y >= 2 && y <= 5)) add(x, y, 1);
      rect(add, 1, 2, 1, 2, 2); rect(add, 1, 2, 5, 6, 2); rect(add, 9, 10, 1, 2, 2); rect(add, 9, 10, 5, 6, 2);
      add(1.5, 1.5, 3); add(1.5, 5.5, 3); add(9.5, 1.5, 3); add(9.5, 5.5, 3);
    }),
  },
  pyramid: {
    name: 'Pyramid',
    pos: build((add) => {
      const rows = [[0, 11], [2, 9], [1, 10], [0, 11], [0, 11], [1, 10], [2, 9], [0, 11]];
      rows.forEach(([a, b], y) => { for (let x = a; x <= b; x++) add(x, y, 0); });
      add(-1, 3.5, 0); add(12, 3.5, 0); add(13, 3.5, 0);
      rect(add, 3, 8, 1, 6, 1);
      rect(add, 4, 7, 2, 5, 2);
      rect(add, 5, 6, 3, 4, 3);
      add(5.5, 3.5, 4);
    }),
  },
};

// Sunday first, to match Date.getUTCDay().
export const LAYOUT_BY_DOW = ['pyramid', 'bridge', 'fortress', 'cross', 'towers', 'wide', 'arena'];

// ── geometry: who covers whom, who stands beside whom ─────────────────────
const relCache = new Map();
export function relationsOf(layoutKey) {
  if (relCache.has(layoutKey)) return relCache.get(layoutKey);
  const P = LAYOUTS[layoutKey].pos;
  const n = P.length;
  const up = [], left = [], right = [];
  for (let i = 0; i < n; i++) {
    const a = P[i], u = [], l = [], r = [];
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const b = P[j];
      const dy = Math.abs(b.y - a.y), dx = b.x - a.x;
      if (b.z === a.z + 1 && Math.abs(dx) < 0.99 && dy < 0.99) u.push(j);
      if (b.z === a.z && dy < 0.99 && Math.abs(dx + 1) < 0.01) l.push(j);
      if (b.z === a.z && dy < 0.99 && Math.abs(dx - 1) < 0.01) r.push(j);
    }
    up.push(u); left.push(l); right.push(r);
  }
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, maxZ = 0;
  for (const p of P) {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
    if (p.z > maxZ) maxZ = p.z;
  }
  const out = { pos: P, up, left, right, minX, maxX, minY, maxY, maxZ };
  relCache.set(layoutKey, out);
  return out;
}

export function isFree(rel, i, on) {
  const { up, left, right } = rel;
  for (const j of up[i]) if (on[j]) return false;
  let lb = false, rb = false;
  for (const j of left[i]) if (on[j]) { lb = true; break; }
  if (!lb) return true;
  for (const j of right[i]) if (on[j]) { rb = true; break; }
  return !rb;
}

// ── faces ──────────────────────────────────────────────────────────────────
// 42 faces, one character each in a deal string:
//   0-8 dots 1-9 · 9-17 bamboo 1-9 · 18-26 characters 1-9
//   27-30 winds east south west north · 31-33 dragons red green white
//   34-37 flowers · 38-41 seasons
export const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP';
export const FACE_COUNT = 42;
export function matchKey(f) { return f >= 38 ? 'S' : f >= 34 ? 'F' : String(f); }
export function sameMatch(a, b) { return matchKey(a) === matchKey(b); }

// The full 144-tile set: four of each of the 34 suit, wind and dragon faces,
// and one each of the eight flowers and seasons.
export function fullSet() {
  const ids = [];
  for (let f = 0; f < 34; f++) ids.push(f, f, f, f);
  for (let f = 34; f < 42; f++) ids.push(f);
  return ids;
}

export function encodeDeal(faces) { return faces.map((f) => ALPHABET[f]).join(''); }
export function decodeDeal(s) {
  const out = [];
  for (let i = 0; i < s.length; i++) {
    const f = ALPHABET.indexOf(s[i]);
    if (f < 0) throw new Error(`bad deal character ${s[i]}`);
    out.push(f);
  }
  return out;
}

const NUMS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const WINDS = [['東', 'E', 'East'], ['南', 'S', 'South'], ['西', 'W', 'West'], ['北', 'N', 'North']];
const FLOWERS = [['梅', 'Plum'], ['蘭', 'Orchid'], ['菊', 'Chrysanthemum'], ['竹', 'Bamboo']];
const SEASONS = [['春', 'Spring'], ['夏', 'Summer'], ['秋', 'Autumn'], ['冬', 'Winter']];

// What a face looks like and what it is called. `kind` picks the drawing:
// dots and bam draw pips, glyph prints a character, white draws the frame.
// `hue` names the suit's print colour (the client maps it to the pastels).
export function faceInfo(f) {
  if (f < 9) return { kind: 'dots', n: f + 1, corner: String(f + 1), label: `${f + 1} of Dots`, hue: 'dots' };
  if (f < 18) return { kind: 'bam', n: f - 8, corner: String(f - 8), label: `${f - 8} of Bamboo`, hue: 'bam' };
  if (f < 27) return { kind: 'glyph', glyph: NUMS[f - 18], sub: '萬', numInk: true, corner: String(f - 17), label: `${f - 17} of Characters`, hue: 'char' };
  if (f < 31) { const w = WINDS[f - 27]; return { kind: 'glyph', glyph: w[0], sub: '', corner: w[1], label: `${w[2]} Wind`, hue: 'wind' }; }
  if (f === 31) return { kind: 'glyph', glyph: '中', sub: '', corner: 'R', label: 'Red Dragon', hue: 'red' };
  if (f === 32) return { kind: 'glyph', glyph: '發', sub: '', corner: 'G', label: 'Green Dragon', hue: 'green' };
  if (f === 33) return { kind: 'white', corner: 'W', label: 'White Dragon', hue: 'white' };
  if (f < 38) { const x = FLOWERS[f - 34]; return { kind: 'glyph', glyph: x[0], sub: '花', corner: 'F', label: `Flower, ${x[1]}`, hue: 'flower' }; }
  const x = SEASONS[f - 38];
  return { kind: 'glyph', glyph: x[0], sub: '季', corner: 'S', label: `Season, ${x[1]}`, hue: 'season' };
}

// ── seeded randomness ─────────────────────────────────────────────────────
export function hash32(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffleIn(a, rnd) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
function pairsOf(faces, rnd) {
  const groups = new Map();
  for (const f of faces) { const k = matchKey(f); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(f); }
  const out = [];
  for (const g of groups.values()) {
    if (g.length % 2) throw new Error('an odd number of tiles in a match group');
    shuffleIn(g, rnd);
    for (let i = 0; i < g.length; i += 2) out.push([g[i], g[i + 1]]);
  }
  return shuffleIn(out, rnd);
}

// SOLVABLE BY CONSTRUCTION. Walk a removal order over the occupied positions,
// always taking two that are free at that moment, and hand each step a
// matching pair. Played forwards, that order clears the board. Returns the
// faces by position and the order, or null if every attempt dead-ended.
export function dealOver(layoutKey, avail, faces, rnd, attempts = 400) {
  const rel = relationsOf(layoutKey);
  const n = rel.pos.length;
  for (let a = 0; a < attempts; a++) {
    const on = new Array(n).fill(false);
    for (const i of avail) on[i] = true;
    const pairs = pairsOf(faces.slice(), rnd);
    const out = new Array(n).fill(-1);
    const order = [];
    let left = avail.length, k = 0, ok = true;
    while (left > 0) {
      const free = [];
      for (const i of avail) if (on[i] && isFree(rel, i, on)) free.push(i);
      if (free.length < 2) { ok = false; break; }
      const x = free.splice(Math.floor(rnd() * free.length), 1)[0];
      const y = free[Math.floor(rnd() * free.length)];
      out[x] = pairs[k][0]; out[y] = pairs[k][1]; k++;
      on[x] = false; on[y] = false; left -= 2;
      order.push([x, y]);
    }
    if (ok) return { faces: out, order };
  }
  return null;
}

// The redeal behind Shuffle: the tiles still on the board, dealt again into a
// layout that can be cleared. Seeded by the day and the shuffle count, so it is
// the same redeal for everybody in the same position.
export function redeal(layoutKey, quizId, faces, on, count) {
  const avail = [];
  on.forEach((v, i) => { if (v) avail.push(i); });
  const rest = avail.map((i) => faces[i]);
  const rnd = mulberry32(hash32(`mahj-shuffle::${quizId}::${count}::${avail.length}`));
  const d = dealOver(layoutKey, avail, rest, rnd);
  if (!d) return null;
  const next = faces.slice();
  for (const i of avail) next[i] = d.faces[i];
  return next;
}

// Every pair of free tiles that clears right now.
export function openPairs(rel, faces, on) {
  const byKey = new Map();
  for (let i = 0; i < faces.length; i++) {
    if (!on[i] || !isFree(rel, i, on)) continue;
    const k = matchKey(faces[i]);
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(i);
  }
  const out = [];
  for (const g of byKey.values()) for (let a = 0; a < g.length; a++) for (let b = a + 1; b < g.length; b++) out.push([g[a], g[b]]);
  return out;
}

// THE HINT: a pair that keeps the board clearable when the search can prove
// one within its budget, else any open pair. Depth-first, highest tiles and
// the pairs that open the most first, with a visited set on the board state.
export function hintPair(rel, faces, on, budget = 60000) {
  const n = faces.length;
  const cur = on.slice();
  const seen = new Set();
  let nodes = 0;
  const keyOf = () => { let s = ''; for (let i = 0; i < n; i += 6) { let v = 0; for (let j = 0; j < 6 && i + j < n; j++) if (cur[i + j]) v |= 1 << j; s += String.fromCharCode(48 + v); } return s; };
  const remaining = () => cur.reduce((s, v) => s + (v ? 1 : 0), 0);
  function score(p) {
    const [a, b] = p;
    return rel.pos[a].z + rel.pos[b].z + 0.1 * (rel.up[a].length + rel.up[b].length);
  }
  function dfs() {
    if (remaining() === 0) return true;
    if (++nodes > budget) return false;
    const k = keyOf();
    if (seen.has(k)) return false;
    seen.add(k);
    const ps = openPairs(rel, faces, cur).sort((p, q) => score(q) - score(p));
    for (const [a, b] of ps) {
      cur[a] = false; cur[b] = false;
      const ok = dfs();
      cur[a] = true; cur[b] = true;
      if (ok) return true;
    }
    return false;
  }
  const first = openPairs(rel, faces, on).sort((p, q) => score(q) - score(p));
  for (const [a, b] of first) {
    cur[a] = false; cur[b] = false;
    const ok = dfs();
    cur[a] = true; cur[b] = true;
    if (ok) return { pair: [a, b], proven: true };
    if (nodes > budget) break;
  }
  return first.length ? { pair: first[0], proven: false } : null;
}

// The ease of a deal: the mean share of the board a random player clears
// before running out of open pairs. Higher is gentler. Seeded, so the bank's
// stored figure re-derives exactly.
export function easeOf(layoutKey, faces, seed, runs = 40) {
  const rel = relationsOf(layoutKey);
  const rnd = mulberry32(seed >>> 0);
  let sum = 0;
  for (let r = 0; r < runs; r++) {
    const on = new Array(faces.length).fill(true);
    let cleared = 0;
    for (;;) {
      const ps = openPairs(rel, faces, on);
      if (!ps.length) break;
      const [a, b] = ps[Math.floor(rnd() * ps.length)];
      on[a] = false; on[b] = false; cleared += 2;
    }
    sum += cleared / faces.length;
  }
  return sum / runs;
}

// Scoring, shared by the client and the verifier's description of it.
export const SHUFFLE_PENALTY_S = 30;
export function scoreFor(cleared, total = TILE_COUNT) {
  if (cleared >= total) return 10;
  return Math.floor((9 * (cleared / 2)) / (total / 2));
}
