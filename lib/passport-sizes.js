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

// OPEN TO ANY COUNTRY, AND CLOSE IN SIZE (owner, 2026-10-17). From
// SIZES_WIDE_FROM a call still SHOWS a country from the game it is filed
// under (Span's named start and end and its road, Flank's country and its
// ring, Ping's city's country), but the country it ASKS about can be any
// country in the tables, weighted toward the day's own countries (WEIGHT_DAY
// to 1). And the two must be close: at most SIZES_MAX_RATIO apart on the
// measure, widened only when a country has nobody that close (a microstate,
// Russia's area, China's people). "Is Kuwait bigger than Russia" is not a
// question. Days before SIZES_WIDE_FROM keep the deal they were played on.
export const SIZES_WIDE_FROM = '2026-10-17';
// SIZES FIRST, AND ON ANY COUNTRIES (owner, 2026-10-17). From SIZES_OPEN_FROM
// the sizes come before Flank and Span (Ping first from 2026-10-17, see
// legOrderFor), so the calls can no longer lean on the day's games without
// spoiling them. The owner chose to switch 2026-10-17 itself too, mid-day: a
// save keeps each call's right/wrong by index, so a run in the sizes carries on. Both countries in a
// call come from the whole table, unweighted; any overlap with the day's
// countries is chance. Same caps, same alternating measures, nobody twice.
export const SIZES_OPEN_FROM = '2026-10-17';
export const SIZES_MAX_RATIO = 3.5;
export const SIZES_WIDEN = [3.5, 6, 12];
const WEIGHT_DAY = 4;

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

export const ratioOf = (x, y, m = 'area') => {
  const T = TABLES[m];
  if (!T) return Infinity;
  const ax = T[0][x], ay = T[0][y];
  if (!(ax > 0) || !(ay > 0)) return Infinity;
  return Math.max(ax, ay) / Math.min(ax, ay);
};

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
  if (day && day.iso && day.iso >= SIZES_OPEN_FROM) return passportSizesOpen(day);
  if (day && day.iso && day.iso >= SIZES_WIDE_FROM) return passportSizesWide(day);
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

// The open deal (from SIZES_WIDE_FROM). Same seed, same nine slots, same
// alternating measures; the shown country comes from the game, the asked one
// from anywhere, close in size and weighted toward the day's countries.
function passportSizesWide(day) {
  const rand = rng(hashStr(`sizes2:${day.quizId}`));
  const lead = rand() < 0.5 ? 0 : 1;
  const msFor = (src) => [0, 1, 2].map((i) => SIZE_MEASURES[(i * 3 + SIZES_ORDER.indexOf(src) + lead) % 2]);

  const road = [...new Set((day.route || []).map(codeOfName).filter(Boolean))];
  const named = [...new Set((day.spanNamed || []).map(codeOfName).filter(Boolean))];
  const ends = [...new Set([...named, road[0], road[road.length - 1]].filter(Boolean))];
  const mids = shuffle(road.filter((c) => !ends.includes(c)), rand);
  const fc = day.flank && day.flank.c;
  const ring = (day.flank && day.flank.a) || [];
  const pc = day.ping && codeOfName(day.ping.country);
  const dayC = new Set([...ends, ...road, fc, ...ring, pc].filter(Boolean));
  const ALL = Object.keys(AREA).filter((c) => POP[c] > 0 && AREA[c] > 0);

  const anchorsFor = {
    span: [...ends, ...mids],
    flank: [fc, ...shuffle(ring, rand)].filter(Boolean),
    ping: pc ? [pc, pc, pc] : [],
  };
  const used = new Set();
  const asked = new Set();
  const byGame = {};
  const pick = (a, m, cap) => {
    const pool = [];
    let tot = 0;
    for (const b of ALL) {
      if (b === a || asked.has(b) || used.has(pairKey(a, b))) continue;
      if (!fairPair(a, b, m) || ratioOf(a, b, m) > cap) continue;
      const w = dayC.has(b) ? WEIGHT_DAY : 1;
      pool.push([b, w]); tot += w;
    }
    if (!pool.length) return null;
    let r = rand() * tot;
    for (const [b, w] of pool) { r -= w; if (r <= 0) return b; }
    return pool[pool.length - 1][0];
  };
  for (const src of SIZES_ORDER) {
    const ms = msFor(src);
    const anchors = anchorsFor[src];
    const out = [];
    const shown = new Set();
    for (let i = 0; i < ms.length; i++) {
      const m = ms[i];
      // Each call shows a different country of its game where it can.
      const order = [...anchors.filter((a) => !shown.has(a)), ...anchors];
      // Try every shown country at the tight cap before widening it, so a
      // microstate or a giant hands its slot to a neighbor rather than
      // dragging the call far apart.
      let got = null;
      for (const cap of SIZES_WIDEN) {
        for (const a of order) {
          if (!a || !(valueOf(a, m) > 0)) continue;
          const b = pick(a, m, cap);
          if (b) { got = [a, b, m]; break; }
        }
        if (got) break;
      }
      if (!got) continue;
      used.add(pairKey(got[0], got[1])); asked.add(got[1]); shown.add(got[0]);
      out.push(got);
    }
    byGame[src] = out;
  }
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

// The open deal (from SIZES_OPEN_FROM): nine calls, both sides drawn from
// every country with a name, an area and a population, no weighting toward
// the day, no country in two calls.
function passportSizesOpen(day) {
  const rand = rng(hashStr(`sizes3:${day.quizId}`));
  const lead = rand() < 0.5 ? 0 : 1;
  const ALL = Object.keys(AREA).filter((c) => BORDERS[c] && POP[c] > 0 && AREA[c] > 0).sort();
  const seen = new Set();
  const calls = [];
  for (let i = 0; i < SIZES_N; i++) {
    const m = SIZE_MEASURES[(i + lead) % 2];
    let got = null;
    for (let tries = 0; tries < 60 && !got; tries++) {
      const free = ALL.filter((c) => !seen.has(c));
      const a = free[Math.floor(rand() * free.length)];
      for (const cap of SIZES_WIDEN) {
        const pool = free.filter((b) => b !== a && fairPair(a, b, m) && ratioOf(a, b, m) <= cap);
        if (pool.length) { got = [a, pool[Math.floor(rand() * pool.length)]]; break; }
      }
    }
    if (!got) continue;
    const [a, b] = got;
    seen.add(a); seen.add(b);
    calls.push({ src: 'open', m, a, b, aName: nameOfCode(a), bName: nameOfCode(b), aVal: valueOf(a, m), bVal: valueOf(b, m), aArea: AREA[a], bArea: AREA[b] });
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
