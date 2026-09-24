#!/usr/bin/env node
// Span bank extender: appends new daily routes to app/span/puzzles.js.
//
//   node scripts/gen-span.mjs --to 2026-11-30            (prints the new boards)
//   node scripts/gen-span.mjs --to 2026-11-30 --write    (appends them in place)
//
// Deterministic: every board is drawn from a PRNG seeded by its own board
// number, so re-running reproduces the same tail and never replays a frozen
// board. Frozen boards are never touched: the new text is spliced in before
// the closing `];` and the script asserts the old file is a byte prefix.
//
// What it guarantees, per the puzzles.js header:
// - perfect is the BFS minimum on app/span/borders.js (constrained on Sundays).
// - Sundays carry exactly one twist, alternating via / avoid, and the twist
//   genuinely reroutes: the constrained perfect is longer than the free one.
//   A via twist is proved composable as a SIMPLE path with viaRoute().
// - Weekdays carry no twist.
// - No start/end pair (either direction) repeats anything already banked; no
//   country is an endpoint more than 3 times in the new segment or twice
//   inside any 10-day window; a twist country is never reused in the segment.
// - The note is derived from the graph (count of shortest roads and the
//   countries common to all of them), so it states something true.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAdj, shortestHops, distancesFrom, viaRoute } from '../app/span/borders.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'app/span/puzzles.js');
const args = process.argv.slice(2);
const TO = args[args.indexOf('--to') + 1];
const WRITE = args.includes('--write');
if (!/^\d{4}-\d{2}-\d{2}$/.test(TO || '')) { console.error('need --to YYYY-MM-DD'); process.exit(1); }

const { PUZZLES } = await import(FILE);
const adj = buildAdj();
const NAMES = Object.keys(adj).sort();
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function rng(seed) {
  let s = (seed * 2654435761 + 0x9e3779b9) >>> 0;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const pick = (r, a) => a[Math.floor(r() * a.length)];

// Count shortest routes and find the interior countries common to all of them.
function analyze(from, to, blocked) {
  const block = blocked ? new Set([blocked]) : null;
  const dA = distancesFrom(adj, from, block);
  const dB = distancesFrom(adj, to, block);
  const H = dA[to];
  if (H == null) return null;
  // number of shortest paths via DP over layers
  const ways = { [from]: 1 };
  const layers = [];
  for (const c of Object.keys(dA)) if (dB[c] != null && dA[c] + dB[c] === H) (layers[dA[c]] = layers[dA[c]] || []).push(c);
  for (let d = 1; d <= H; d++) for (const c of layers[d]) {
    let w = 0;
    for (const n of adj[c]) if (dA[n] === d - 1 && dB[n] != null && dA[n] + dB[n] === H) w += ways[n] || 0;
    ways[c] = w;
  }
  const count = ways[to];
  const common = [];
  for (let d = 1; d < H; d++) if (layers[d].length === 1) common.push(layers[d][0]);
  return { H, count, common, layers };
}
const list = (xs) => xs.length === 1 ? xs[0] : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1];
function routeNote(from, to, a) {
  if (a.count === 1) {
    const mid = a.layers.slice(1, a.H).map((l) => l[0]);
    return `One shortest road runs through ${list(mid)} before reaching ${to}.`;
  }
  if (a.common.length >= 2) return `There are ${a.count} shortest roads, and all of them pass through ${a.common[0]} and ${a.common[1]}.`;
  if (a.common.length === 1) return `There are ${a.count} shortest roads, and every one of them passes through ${a.common[0]}.`;
  return `There are ${a.count} shortest roads of ${a.H} hops, with no single country common to them all.`;
}

const key = (a, b) => [a, b].sort().join('|');
const usedPairs = new Set(PUZZLES.map((p) => key(p.start, p.end)));
const endpointUse = new Map();
const recent = []; // endpoints by board, for the 10-day window
for (const p of PUZZLES.slice(-10)) recent.push([p.start, p.end]);
const twistUsed = new Set();
// A shortest road through the Egypt/Israel land bridge is the graph's most
// common bottleneck; cap any one common-country pair so the notes vary.
const commonUse = new Map();
const commonKey = (a) => a.common.slice(0, 2).join('|');
const WEEKDAY_HOPS = [4, 5, 5, 6, 6, 7, 7, 8, 8, 9];

const last = PUZZLES[PUZZLES.length - 1];
let num = last.num;
let day = new Date(last.live + 'T00:00:00Z');
const out = [];
let twistToggle = 0;
while (true) {
  day = new Date(day.getTime() + 86400000);
  const live = day.toISOString().slice(0, 10);
  if (live > TO) break;
  num += 1;
  const [y, m, d] = live.split('-').map(Number);
  const sunday = day.getUTCDay() === 0;
  const r = rng(num * 7919 + 31);
  const window = new Set(recent.slice(-10).flat());
  const want = pick(r, WEEKDAY_HOPS);
  let board = null;
  for (let tries = 0; tries < 200000 && !board; tries++) {
    const s = pick(r, NAMES), e = pick(r, NAMES);
    if (s === e || usedPairs.has(key(s, e))) continue;
    if (window.has(s) || window.has(e)) continue;
    if ((endpointUse.get(s) || 0) >= 3 || (endpointUse.get(e) || 0) >= 3) continue;
    const base = shortestHops(adj, s, e);
    if (base < 0) continue;
    if (!sunday) {
      if (base !== want) continue;
      const a = analyze(s, e);
      if (a.common.length && (commonUse.get(commonKey(a)) || 0) >= 3) continue;
      if (a.common.length) commonUse.set(commonKey(a), (commonUse.get(commonKey(a)) || 0) + 1);
      board = { start: s, end: e, perfect: base, note: routeNote(s, e, a) };
    } else {
      if (base < 4 || base > 8) continue;
      const wantVia = twistToggle % 2 === 0;
      if (wantVia) {
        const v = pick(r, NAMES);
        if (v === s || v === e || twistUsed.has(v)) continue;
        const a1 = shortestHops(adj, s, v), a2 = shortestHops(adj, v, e);
        if (a1 < 1 || a2 < 1) continue;
        const tot = a1 + a2;
        if (tot <= base || tot > base + 3 || tot > 10) continue;
        const route = viaRoute(adj, s, v, e);
        if (!route || route.length - 1 !== tot || new Set(route).size !== route.length) continue;
        board = { start: s, end: e, perfect: tot, via: v,
          note: `Routing through ${v} makes it ${tot} hops instead of ${base}.` };
      } else {
        const a0 = analyze(s, e);
        // block a country on some shortest road so the twist bites
        const cands = a0.layers.slice(1, a0.H).flat().filter((c) => !twistUsed.has(c));
        if (!cands.length) continue;
        const v = pick(r, cands);
        const h = shortestHops(adj, s, e, new Set([v]));
        if (h < 0 || h <= base || h > 10) continue;
        const a = analyze(s, e, v);
        board = { start: s, end: e, perfect: h, avoid: v,
          note: `With ${v} closed the road is ${h} hops instead of ${base}. ${routeNote(s, e, a)}` };
      }
    }
  }
  if (!board) throw new Error(`no board for ${live}`);
  if (sunday) { twistToggle += 1; twistUsed.add(board.via || board.avoid); }
  usedPairs.add(key(board.start, board.end));
  for (const c of [board.start, board.end]) endpointUse.set(c, (endpointUse.get(c) || 0) + 1);
  recent.push([board.start, board.end]);
  out.push({ num, quizId: `span-${m}-${d}-${String(y).slice(2)}`, live, dateLabel: `${MONTHS[m - 1]} ${d}, ${y}`, sunday, ...board });
}

const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const text = out.map((p) => [
  '  {',
  `    num: ${p.num},`,
  `    quizId: ${q(p.quizId)},`,
  `    live: ${q(p.live)},`,
  `    dateLabel: ${q(p.dateLabel)},`,
  ...(p.sunday ? ['    sunday: true,'] : []),
  `    start: ${q(p.start)},`,
  `    end: ${q(p.end)},`,
  ...(p.via ? [`    via: ${q(p.via)},`] : []),
  ...(p.avoid ? [`    avoid: ${q(p.avoid)},`] : []),
  `    perfect: ${p.perfect},`,
  `    note: ${q(p.note)},`,
  '  },',
].join('\n')).join('\n') + '\n';

if (!WRITE) { process.stdout.write(text); process.exit(0); }
const src = fs.readFileSync(FILE, 'utf8');
const cut = src.lastIndexOf('];');
const next = src.slice(0, cut) + text + src.slice(cut);
if (!next.startsWith(src.slice(0, cut))) throw new Error('prefix drift');
fs.writeFileSync(FILE, next);
console.error(`appended ${out.length} boards (${out[0]?.num}-${out[out.length - 1]?.num})`);
