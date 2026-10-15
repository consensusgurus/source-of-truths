// PASSPORT'S BIGGER-OR-SMALLER LEG (owner, 2026-10-14), from 2026-10-15.
//
// The run plays the day's Span, Flank and Ping, then calls nine countries
// bigger or smaller, on land area OR on population (owner, 2026-10-14: "it
// should" cover both). Each call carries its measure as `m`, 'area' or 'pop';
// a day alternates them, five of one and four of the other, which leads is
// seeded off the date. The nine are drawn from the countries those
// three games are about that day, three calls per game (owner: "3 per game"):
//
//   Span   two countries off today's shortest road (start, end, the countries
//          between), so the road you just walked comes back as a size question;
//   Flank  the day's country against its own land neighbors;
//   Ping   the secret city's country against countries from the other two.
//
// A pair is dealt only when it is FAIR on its own measure: the two are at
// least 1.3 times apart in the Factbook table, and the second table
// (lib/country-areas ALT, lib/country-pops POP_ALT) agrees on which is bigger
// by at least 1.15. So a call can never turn on a disputed
// figure. No pair is dealt twice, and no country is asked about twice.
//
// Deterministic from the date alone (the quizId seeds the draw), so the page,
// the verifier and every player see the same nine. Server side only: it reads
// the borders table, which the client never needs.

import { BORDERS } from '../app/flank/borders.js';
import { AREA, ALT } from './country-areas.js';
import { POP, POP_ALT } from './country-pops.js';

export const SIZES_N = 9;
export const SIZES_PER = 3;
export const SIZES_ORDER = ['span', 'flank', 'ping'];
export const SIZE_MEASURES = ['area', 'pop'];
const TABLES = { area: [AREA, ALT], pop: [POP, POP_ALT] };
export const valueOf = (c, m = 'area') => (TABLES[m] ? TABLES[m][0][c] : undefined);

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
let NAME_MAP = null;
export function codeOfName(name) {
  if (!NAME_MAP) {
    NAME_MAP = new Map();
    for (const [k, v] of Object.entries(BORDERS)) {
      NAME_MAP.set(norm(v.name), k);
      (v.alt || []).forEach((a) => NAME_MAP.set(norm(a), k));
    }
  }
  return NAME_MAP.get(norm(name)) || null;
}
export const nameOfCode = (c) => (BORDERS[c] ? BORDERS[c].name : c);

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function shuffle(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function fairPair(x, y, m = 'area') {
  const T = TABLES[m];
  if (!T) return false;
  const [MAIN, SECOND] = T;
  const ax = MAIN[x], ay = MAIN[y];
  if (!(ax > 0) || !(ay > 0) || x === y) return false;
  const r = Math.max(ax, ay) / Math.min(ax, ay);
  if (r < 1.3) return false;
  const bx = SECOND[x], by = SECOND[y];
  if (bx > 0 && by > 0) {
    if ((ax > ay) !== (bx > by)) return false;
    if (Math.max(bx, by) / Math.min(bx, by) < 1.15) return false;
  }
  return true;
}

const pairKey = (x, y) => (x < y ? `${x}|${y}` : `${y}|${x}`);
const neighborsOf = (c) => (BORDERS[c] ? BORDERS[c].n : []);

// One game's three calls. `cands` is a list of [anchor, asked] pairs in
// preference order; taken greedily under the fairness and no-repeat rules.
// `ms` is the measure each of the n calls must be fair on, in order.
function take(cands, used, asked, ms) {
  const out = [];
  for (const [a, b] of cands) {
    if (out.length >= ms.length) break;
    const m = ms[out.length];
    if (!fairPair(a, b, m)) continue;
    const k = pairKey(a, b);
    if (used.has(k) || asked.has(b)) continue;
    used.add(k); asked.add(b);
    out.push([a, b, m]);
  }
  return out;
}

// day = { quizId, route: [span country names, start to end], flank: { c, a },
// ping: { country } }. Returns nine calls in play order, each
// { src, m, a, b, aName, bName, aVal, bVal, aArea, bArea } where the player
// is shown `a` and asked whether `b` is bigger or smaller on measure `m`
// (aVal/bVal are that measure's figures; aArea/bArea always the areas).
export function passportSizes(day) {
  const rand = rng(hashStr(`sizes:${day.quizId}`));
  const used = new Set();
  const asked = new Set();
  const byGame = {};
  // Measures by play slot (round-major: span, flank, ping, span, ...), alternating.
  const lead = rand() < 0.5 ? 0 : 1;
  const msFor = (src) => [0, 1, 2].map((i) => SIZE_MEASURES[(i * 3 + SIZES_ORDER.indexOf(src) + lead) % 2]);

  // Span: the road's own countries first, start and end leading.
  const road = [...new Set((day.route || []).map(codeOfName).filter(Boolean))];
  const ends = [road[0], road[road.length - 1]].filter(Boolean);
  const mids = road.slice(1, -1);
  const spanC = [];
  if (ends.length === 2) spanC.push([ends[0], ends[1]]);
  // Alternate the two ends as the shown country, so the road's both ends come up.
  const mixed = shuffle(mids, rand);
  mixed.forEach((m, i) => { const e = ends[i % ends.length]; if (e) spanC.push([e, m]); });
  for (const e of ends) for (const m of mixed) spanC.push([e, m]);
  for (const x of shuffle(mids, rand)) for (const y of shuffle(mids, rand)) if (x !== y) spanC.push([x, y]);
  const near = [...new Set(road.flatMap(neighborsOf))].filter((c) => !road.includes(c));
  for (const e of road) for (const y of shuffle(near, rand)) spanC.push([e, y]);
  byGame.span = take(spanC, used, asked, msFor('span'));

  // Flank: the day's country against its neighbors, then the ring among itself.
  const fc = day.flank && day.flank.c;
  const ring = (day.flank && day.flank.a) || [];
  const flankC = shuffle(ring, rand).map((y) => [fc, y]);
  for (const x of shuffle(ring, rand)) for (const y of shuffle(neighborsOf(x), rand)) if (y !== fc) flankC.push([x, y]);
  // An island or a one-border country: the day's country against the road and
  // the neighbors of its neighbors, then anywhere.
  for (const y of shuffle(road, rand)) flankC.push([fc, y]);
  for (const y of shuffle(Object.keys(AREA), rand)) flankC.push([fc, y]);
  byGame.flank = take(flankC, used, asked, msFor('flank'));

  // Ping: the city's country against the day's other countries, then its own
  // neighbors, then anywhere at all.
  const pc = day.ping && codeOfName(day.ping.country);
  const others = shuffle([...new Set([...road, fc, ...ring].filter((c) => c && c !== pc))], rand);
  const pingC = others.map((y) => [pc, y]);
  for (const y of shuffle(neighborsOf(pc), rand)) pingC.push([pc, y]);
  for (const y of shuffle(Object.keys(AREA), rand)) pingC.push([pc, y]);
  byGame.ping = pc ? take(pingC, used, asked, msFor('ping')) : [];

  const calls = [];
  for (let i = 0; i < SIZES_PER; i++) {
    for (const src of SIZES_ORDER) {
      const p = byGame[src][i];
      if (!p) continue;
      const [a, b, m] = p;
      calls.push({ src, m, a, b, aName: nameOfCode(a), bName: nameOfCode(b), aVal: valueOf(a, m), bVal: valueOf(b, m), aArea: AREA[a], bArea: AREA[b] });
    }
  }
  return calls;
}

// The day's road for the Span calls: a shortest route between the day's two
// countries under its own rule (a Sunday's via or avoid), off Span's own map.
export function spanRoute(spanPuzzle, spanBorders) {
  if (!spanPuzzle || !spanBorders) return [];
  const { buildAdj, shortestRoute, viaRoute } = spanBorders;
  const adj = buildAdj();
  const { start, end, via, avoid } = spanPuzzle;
  try {
    if (via && viaRoute) { const r = viaRoute(adj, start, via, end); if (r) return Array.isArray(r) ? r : (r.route || []); }
    return shortestRoute(adj, start, end, avoid || null) || [start, end];
  } catch (e) { return [start, end]; }
}
